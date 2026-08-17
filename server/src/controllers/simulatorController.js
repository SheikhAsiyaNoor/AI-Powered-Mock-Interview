const Groq = require("groq-sdk");
const mongoose = require("mongoose");
const Interview = require("../models/Interview");
const COMPANIES = require("../config/companies");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// GET /api/simulator/companies - List all company simulation profiles
const getCompanies = async (req, res) => {
    try {
        res.json({ companies: COMPANIES });
    } catch (err) {
        console.error("Error fetching companies:", err);
        res.status(500).json({ message: "Failed to fetch company profiles" });
    }
};

// Helper to generate company-specific system prompt
const getCompanySystemPrompt = (companyConfig, domain, roundType, difficulty, askedQuestions = []) => {
    const guideline = companyConfig?.systemPromptGuideline || "You are a senior technical interviewer.";
    const companyName = companyConfig?.name || "Tech Company";

    return `
You are an expert recruitment interviewer at ${companyName} conducting a "${roundType}" interview for a ${domain} role.
Current Adaptive Difficulty Level: ${difficulty}

COMPANY SPECIFIC INTERVIEW GUIDELINES:
${guideline}

RULES:
- Ask ONE clear, specific question at a time reflecting ${companyName}'s real-world interview style and hiring process.
- Do NOT ask generic filler questions like "Tell me about yourself".
- For Google: Focus on algorithmic complexity, data structures, and distributed scalability.
- For Amazon: Frame questions or expect answers around real-world customer impact and Amazon Leadership Principles (Customer Obsession, Ownership, Bias for Action).
- For TCS/Infosys: Ask strong core CS fundamentals (OOP, DBMS, SQL joins, OS) and academic/practical project architecture.
- For Startups: Ask practical full-stack debugging, rapid feature implementation, and API trade-offs.
- For Goldman Sachs: Focus on low-latency systems, concurrency/multithreading, and ACID data integrity.
- Do NOT repeat any previously asked questions:
${askedQuestions.map((q, i) => `${i + 1}. "${q}"`).join("\n")}

Return ONLY the question text with NO conversational preamble, headers, or chit-chat.
`.trim();
};

// POST /api/simulator/start - Start a company recruiter simulation session
const startCompanyInterview = async (req, res) => {
    try {
        const { companyId = "google", domain = "JavaScript/Node.js", roundType = "Technical Round" } = req.body;

        const company = COMPANIES.find((c) => c.id === companyId) || COMPANIES[0];
        const initialDifficulty = company.difficultyLevel.includes("Hard") ? "Medium" : "Easy";

        let firstQuestion = `At ${company.name}, how would you approach building and optimizing a resilient ${domain} system for scale and high reliability?`;

        try {
            const completion = await groq.chat.completions.create({
                model: "openai/gpt-oss-20b",
                messages: [
                    {
                        role: "system",
                        content: getCompanySystemPrompt(company, domain, roundType, initialDifficulty, [])
                    },
                    {
                        role: "user",
                        content: `Begin the ${company.name} ${roundType} interview. Ask the first technical question for a ${domain} candidate at ${initialDifficulty} difficulty.`
                    }
                ],
                temperature: 0.7
            });
            firstQuestion = completion.choices[0]?.message?.content?.trim() || firstQuestion;
        } catch (groqErr) {
            console.error("Groq API error on startCompanyInterview:", groqErr.message || groqErr);
        }

        const interview = await Interview.create({
            userId: req.userId,
            domain,
            company: company.name,
            roundType,
            currDifficulty: initialDifficulty,
            askedQuestions: [firstQuestion],
            messages: [{ role: "ai", content: firstQuestion, difficulty: initialDifficulty }]
        });

        res.status(201).json({
            sessionId: interview._id,
            company: company.name,
            roundType,
            question: firstQuestion,
            difficulty: initialDifficulty,
            hiringCutoff: company.hiringCutoff,
            focusAreas: company.focusAreas
        });
    } catch (err) {
        console.error("Error starting company interview:", err);
        res.status(500).json({ message: "Failed to start company simulation session" });
    }
};

// POST /api/simulator/submit-answer - Process candidate answer with company rubric
const submitCompanyAnswer = async (req, res) => {
    try {
        const { sessionId, answer, questionsAnswered = 0 } = req.body;

        if (!answer || typeof answer !== "string" || !answer.trim()) {
            return res.status(400).json({ message: "Answer string is required" });
        }

        const interview = await Interview.findOne({ _id: sessionId, userId: req.userId });
        if (!interview) {
            return res.status(404).json({ message: "Interview simulation session not found" });
        }

        const company = COMPANIES.find((c) => c.name.toLowerCase() === (interview.company || "").toLowerCase()) || COMPANIES[0];
        const currentDiff = interview.currDifficulty || "Medium";
        const isSkipAction = /^(skip|pass|i don't know|next|dont know)$/i.test(answer.trim());

        let evaluation = "Weak";
        let evalScore = 35;
        let feedback = "No response provided.";

        if (isSkipAction) {
            evaluation = "Skipped";
            evalScore = 0;
            feedback = `Question skipped. At ${company.name}, interviewers expect candidates to articulate thought processes even when unsure.`;
            interview.skippedQuestionsCount = (interview.skippedQuestionsCount || 0) + 1;
        } else {
            try {
                const evalPrompt = `
                You are a senior hiring committee interviewer at ${company.name}.
                Evaluate candidate's answer for a ${interview.domain} role in a "${interview.roundType}" at ${currentDiff} difficulty.
                Question Context: "${interview.askedQuestions[interview.askedQuestions.length - 1] || ''}"
                Candidate Answer: "${answer}"

                COMPANY EVALUATION CRITERIA:
                ${company.systemPromptGuideline}

                Provide constructive feedback strictly in JSON format:
                {
                  "evaluation": "Strong" | "Good" | "Weak",
                  "score": number (10 to 100),
                  "feedback": "2-3 sentences of direct feedback assessing how well this meets ${company.name}'s standards."
                }
                `.trim();

                const response = await groq.chat.completions.create({
                    model: "openai/gpt-oss-20b",
                    messages: [{ role: "user", content: evalPrompt }],
                    response_format: { type: "json_object" },
                    temperature: 0.3
                });

                const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
                evaluation = parsed.evaluation || "Good";
                evalScore = Math.max(10, Math.min(100, parsed.score || 65));
                feedback = parsed.feedback || `Good attempt. Demonstrates understanding of ${interview.domain} principles for ${company.name}.`;
            } catch (groqErr) {
                console.error("Groq API error on company feedback:", groqErr.message || groqErr);
            }
        }

        // Adaptive difficulty transition
        let nextDiff = currentDiff;
        if (evaluation === "Strong") {
            nextDiff = currentDiff === "Easy" ? "Medium" : "Hard";
        } else if (evaluation === "Weak" || evaluation === "Skipped") {
            nextDiff = currentDiff === "Hard" ? "Medium" : "Easy";
        }

        interview.currDifficulty = nextDiff;
        interview.difficultyHistory.push({
            questionNumber: questionsAnswered + 1,
            difficulty: currentDiff,
            evaluation,
            score: evalScore
        });

        interview.messages.push({ role: "user", content: isSkipAction ? "[Skipped Question]" : answer, timeStamp: new Date() });
        interview.messages.push({ role: "ai", content: feedback, timeStamp: new Date() });
        interview.questionsAnswered = questionsAnswered + 1;

        const isComplete = questionsAnswered >= 4; // 5 questions total (0-indexed 0,1,2,3,4)

        if (isComplete) {
            const historySummary = interview.difficultyHistory
                .map((h) => `Q${h.questionNumber} (${h.difficulty}): ${h.evaluation} (${h.score}%)`)
                .join(", ");

            const overallScore = Math.round(
                interview.difficultyHistory.reduce((acc, curr) => acc + curr.score, 0) / interview.difficultyHistory.length
            );

            const cutoff = company.hiringCutoff || 75;
            const companyStandardMet = overallScore >= cutoff;

            // Hiring verdict logic
            let hiringVerdict = "No Hire";
            if (overallScore >= cutoff + 6) {
                hiringVerdict = "Strong Hire";
            } else if (overallScore >= cutoff) {
                hiringVerdict = "Hire";
            } else if (overallScore >= cutoff - 7) {
                hiringVerdict = "Lean Hire";
            } else if (overallScore >= cutoff - 15) {
                hiringVerdict = "Lean No Hire";
            } else {
                hiringVerdict = "No Hire";
            }

            // Dimension scores
            const technicalDepth = Math.min(100, Math.max(20, Math.round(overallScore * (evaluation === "Strong" ? 1.05 : 0.95))));
            const systemArchitecture = Math.min(100, Math.max(20, Math.round(overallScore * 0.98)));
            const culturalAlignment = Math.min(100, Math.max(20, Math.round(overallScore * 1.02)));
            const communication = Math.min(100, Math.max(20, Math.round(overallScore * 0.96)));

            let cultureAlignmentFeedback = `Candidate's approach ${companyStandardMet ? "aligns well with" : "needs further alignment with"} ${company.name}'s engineering standards.`;
            let companySpecificFeedback = `Performance trajectory: ${historySummary}. Focus on ${company.focusAreas?.[0] || 'core problem solving'}.`;

            try {
                const reportRes = await groq.chat.completions.create({
                    model: "openai/gpt-oss-20b",
                    messages: [
                        {
                            role: "user",
                            content: `
                            Synthesize a hiring committee decision report for ${company.name} recruitment interview in ${interview.domain}.
                            Candidate Overall Score: ${overallScore}% vs ${company.name} Cutoff: ${cutoff}%.
                            Session Performance: ${historySummary}.
                            Verdict: ${hiringVerdict}.

                            Respond in JSON format:
                            {
                              "cultureAlignmentFeedback": "2 sentences analyzing cultural alignment (e.g. Amazon LP, Googliness, TCS professionalism)",
                              "companySpecificFeedback": "2-3 bullet points with concrete advice to crack the next interview round at ${company.name}"
                            }
                            `
                        }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.5
                });

                const parsedReport = JSON.parse(reportRes.choices[0]?.message?.content || "{}");
                if (parsedReport.cultureAlignmentFeedback) {
                    cultureAlignmentFeedback = Array.isArray(parsedReport.cultureAlignmentFeedback)
                        ? parsedReport.cultureAlignmentFeedback.join(" ")
                        : String(parsedReport.cultureAlignmentFeedback);
                }
                if (parsedReport.companySpecificFeedback) {
                    companySpecificFeedback = Array.isArray(parsedReport.companySpecificFeedback)
                        ? parsedReport.companySpecificFeedback.map((item) => `• ${item}`).join("\n")
                        : String(parsedReport.companySpecificFeedback);
                }
            } catch (groqErr) {
                console.error("Groq hiring report synthesis error:", groqErr.message || groqErr);
            }

            interview.score = overallScore;
            interview.isComplete = true;
            interview.feedback = feedback;
            interview.progressionReport = `${hiringVerdict} · Score: ${overallScore}% (${companyStandardMet ? 'Above' : 'Below'} ${company.name} Cutoff of ${cutoff}%)`;
            interview.companyEvaluation = {
                hiringVerdict,
                companyCutoff: cutoff,
                companyStandardMet,
                dimensionScores: {
                    technicalDepth,
                    systemArchitecture,
                    culturalAlignment,
                    communication
                },
                cultureAlignmentFeedback,
                companySpecificFeedback
            };
            interview.duration = Math.max(
                1,
                Math.round((Date.now() - new Date(interview.createdAt).getTime()) / 60000)
            );

            await interview.save();

            return res.json({
                feedback,
                score: overallScore,
                isComplete: true,
                company: company.name,
                hiringVerdict,
                companyCutoff: cutoff,
                companyStandardMet,
                dimensionScores: interview.companyEvaluation.dimensionScores,
                cultureAlignmentFeedback,
                companySpecificFeedback,
                difficultyHistory: interview.difficultyHistory,
                message: `Simulation complete. Decision: ${hiringVerdict}`
            });
        }

        // Generate NEXT Question tailored to company
        let nextQuestion = `At ${company.name}, how would you handle testing, edge-case validation, and deployment monitoring for this ${interview.domain} component?`;

        try {
            const nextQuestionResponse = await groq.chat.completions.create({
                model: "openai/gpt-oss-20b",
                messages: [
                    {
                        role: "system",
                        content: getCompanySystemPrompt(company, interview.domain, interview.roundType, nextDiff, interview.askedQuestions)
                    },
                    {
                        role: "user",
                        content: `Candidate's previous response was evaluated as ${evaluation}. Generate question #${questionsAnswered + 2} of 5 for ${company.name} ${interview.roundType} at ${nextDiff} difficulty. Do not repeat.`
                    }
                ],
                temperature: 0.7
            });
            nextQuestion = nextQuestionResponse.choices[0]?.message?.content?.trim() || nextQuestion;
        } catch (groqErr) {
            console.error("Groq API error on company nextQuestion:", groqErr.message || groqErr);
        }

        interview.askedQuestions.push(nextQuestion);
        interview.messages.push({ role: "ai", content: nextQuestion, difficulty: nextDiff, timeStamp: new Date() });
        await interview.save();

        return res.json({
            feedback,
            nextQuestion,
            nextDifficulty: nextDiff,
            isComplete: false,
            difficultyHistory: interview.difficultyHistory
        });
    } catch (err) {
        console.error("Error submitting company simulation answer:", err);
        res.status(500).json({ message: "Failed to process simulation answer" });
    }
};

// GET /api/simulator/:id - Get single company simulation session details
const getCompanyInterview = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: "Simulation session not found" });
        }

        const interview = await Interview.findOne({ _id: req.params.id, userId: req.userId });
        if (!interview) {
            return res.status(404).json({ message: "Simulation session not found" });
        }

        res.json({ interview });
    } catch (err) {
        console.error("Error fetching company simulation:", err);
        res.status(500).json({ message: "Failed to fetch simulation session" });
    }
};

module.exports = {
    getCompanies,
    startCompanyInterview,
    submitCompanyAnswer,
    getCompanyInterview
};
