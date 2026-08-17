const Groq = require("groq-sdk");
const Interview = require("../models/Interview");
const mongoose = require("mongoose");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const systemPrompt = (domain, difficulty, askedQuestionsList = []) => `
You are a senior technical interviewer conducting a mock interview for a ${domain} developer role. 
Current Question Difficulty Level: ${difficulty}

RULES:
-Ask one clear, specific technical question at a time. After the candidate answers, provide feedback and the next question.
-DON'T ask generic questions like "Tell me about yourself"; strictly ask questions based on Domain selected.
-DON'T Repeat any of these previously asked questions: ${askedQuestionsList.map((q, i) => `${i + 1}."${q}"`).join('\n')}
Return ONLY the question and nothing else (with no conversational preamble or markdown headers).
`.trim();

const startInterview = async (req, res) => {
    try {
        const domain = req.body.domain || req.body.topic || "General";
        const initialDifficulty = "Medium"
        let firstQuestion = `What are the key concepts and best practices in ${domain}?`;
        try {
            const completion = await groq.chat.completions.create({
                model: GROQ_MODEL,
                messages: [
                    { role: "system", content: systemPrompt(domain, initialDifficulty, []) },
                    {
                        role: "user",
                        content: `Start the interview. Ask me the first ${domain} technical question with difficulty as ${initialDifficulty} level. Only ask the question, no preamble.`,
                    },
                ],
                temperature: 0.7,
            });
            firstQuestion = completion.choices[0]?.message?.content || firstQuestion;
        } catch (groqErr) {
            console.error("Groq API error on startInterview:", groqErr.message || groqErr);
        }

        const interview = await Interview.create({
            userId: req.userId,
            domain,
            currDifficulty: initialDifficulty,
            askedQuestions: [firstQuestion],
            messages: [{ role: "ai", content: firstQuestion, difficulty: initialDifficulty }],
        });

        res.status(201).json({ sessionId: interview._id, question: firstQuestion, difficulty: initialDifficulty });
    } catch (err) {
        console.error("Error starting interview: ", err);
        res.status(500).json({ message: "Server error starting interview" });
    }
};

const submitAnswer = async (req, res) => {
    try {
        const {
            sessionId,
            answer,
            domain = "General",
            questionsAnswered = 0,
            isSkipped = false,
        } = req.body;

        if (!answer || typeof answer !== "string" || !answer.trim()) {
            return res.status(400).json({ message: "A valid answer string is required" });
        }

        let interview = null;
        if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
            interview = await Interview.findOne({ _id: sessionId, userId: req.userId });
        }

        const currentDiff = interview.currDifficulty || "Medium"
        const isSkipAction = isSkipped || /^(skip|pass|i don't know|next|dont know)$/i.test(answer.trim())
        let evaluation = "Weak"
        let evalScore = 30

        let feedback = "No answer given. Skipped topic.";

        if (isSkipAction) {
            evaluation = "Skipped"
            evalScore = 0
            feedback = "Question skipped. Moving on to a lower difficulty foundational topic."
            interview.skippedQuestionsCount = (interview.skippedQuestionsCount || 0) + 1
        } else {
            try {
                const evalResponse = await groq.chat.completions.create({
                    model: GROQ_MODEL,
                    messages: [
                        {
                            role: "user",
                            content: `
                        You are an expert ${domain} interview evaluator, evaluating a candidate's answer for a ${domain} at ${currentDiff} level difficulty. Previous question context: "${interview.askedQuestions[interview.askedQuestions.length - 1] || ''}". Provide constructive feedback on this interview answer in 2-3 sentences. Focus on:
                        - Clarity and structure of the response
                        - Technical accuracy and depth
                        - Communication skills
                        - Areas for improvement

                        Answer: "${answer}"

                        Return JSON ONLY in this format:
                            {
                              "evaluation": "Strong" | "Medium" | "Weak",
                              "score": number (10 to 100),
                              "feedback": "2-3 sentences of constructive feedback"
                            }`
                        }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.3
                });
                const parsed = JSON.parse(evalResponse.choices[0]?.message?.content || '{}')
                evaluation = parsed.evaluation || "Medium"
                evalScore = Math.max(10, Math.min(100, parsed.score || 60))
                feedback = parsed.feedback || "Good effort. Try adding more technical examples and edge-case considerations."
            } catch (groqErr) {
                console.error("Groq API error on feedback:", groqErr.message || groqErr);
            }
        }

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
            score: evalScore,
        });

        const isComplete = questionsAnswered >= 5;

        if (interview) {
            interview.messages.push({ role: "user", content: isSkipAction ? "[Skipped Question]" : answer, timeStamp: new Date() })
            interview.messages.push({ role: "ai", content: feedback, timeStamp: new Date() })
            interview.questionsAnswered = questionsAnswered + 1
        }

        if (isComplete) {
            const historySummary = interview.difficultyHistory.map(h => `Q${h.questionNumber} (${h.difficulty}): Evaluated ${h.evaluation} (${h.score}%)`).join(", ")

            let overallScore = Math.round(
                interview.difficultyHistory.reduce((acc, curr) => acc + curr.score, 0) / interview.difficultyHistory.length
            )

            let progressionReport = `Candidate completed interview starting at Medium difficulty, reaching ${nextDiff} tier.`

            try {
                const reportRes = await groq.chat.completions.create({
                    model: GROQ_MODEL,
                    messages: [
                        {
                            role: "user",
                            content: `Synthesize a final progression report for a ${domain} candidate based on this sequence: ${historySummary}.
                            Summarize difficulty trajectory, technical strengths, and key growth areas in 3 bullet points.`
                        }
                    ],
                    temperature: 0.6,
                });
                progressionReport = reportRes.choices[0]?.message?.content || progressionReport;
            } catch (groqErr) {
                console.error("Groq API error on generating report:", groqErr.message || groqErr);
            }

            if (interview) {
                interview.score = overallScore;
                interview.isComplete = true;
                interview.feedback = feedback;
                interview.progressionReport = progressionReport
                interview.duration = Math.max(
                    1,
                    Math.round((Date.now() - new Date(interview.createdAt).getTime()) / 60000)
                );
                await interview.save();
            }

            return res.json({
                feedback,
                score: overallScore,
                isComplete: true,
                progressionReport,
                difficultyHistory: interview.difficultyHistory,
                message: "Adaptive interview complete."
            });
        }

        let nextQuestion = `How would you approach handling performance optimizations and edge cases in a ${domain} project?`;
        try {
            const nextQuestionResponse = await groq.chat.completions.create({
                model: GROQ_MODEL,
                messages: [
                    { role: "system", content: systemPrompt(domain, nextDiff, interview.askedQuestions) },
                    {
                        role: "user",
                        content: `Candidate's previous response was evaluated as ${evaluation}. 
                        Generate the NEXT question at ${nextDiff} difficulty level that builds on the domain or transitions to a complementary concept. Do not ask duplicates.`
                    }
                ],
                temperature: 0.7,
            });
            nextQuestion = nextQuestionResponse.choices[0]?.message?.content?.trim() || nextQuestion;
        } catch (groqErr) {
            console.error("Groq API error on nextQuestion:", groqErr.message || groqErr);
        }

        if (interview) {
            interview.askedQuestions.push(nextQuestion);
            interview.messages.push({ role: "ai", content: nextQuestion, difficulty: nextDiff, timeStamp: new Date() });
            await interview.save();
        }

        return res.json({
            feedback,
            nextQuestion,
            nextDifficulty: nextDiff,
            isComplete: false,
            difficultyHistory: interview.difficultyHistory
        });
    } catch (err) {
        console.error("Error submitting answer: ", err);
        res.status(500).json({ message: "Server error processing answer" });
    }
};

const getInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find({ userId: req.userId, isComplete: true })
            .select("domain score duration questionsAnswered createdAt feedback messages")
            .sort({ createdAt: -1 });

        const mapped = interviews.map((i) => ({
            id: i._id,
            topic: i.domain,
            domain: i.domain,
            score: i.score,
            duration: i.duration,
            questionsAnswered: i.questionsAnswered,
            feedback: i.feedback,
            date: i.createdAt,
            createdAt: i.createdAt,
        }));
        res.json({ interviews: mapped });
    } catch (err) {
        console.error("Error fetching interviews: ", err);
        res.status(500).json({ message: "Server error" });
    }
};

const getInterview = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: "Interview session not found" });
        }
        const interview = await Interview.findOne({
            _id: req.params.id,
            userId: req.userId,
        });
        if (!interview) {
            return res.status(404).json({ message: "Interview session not found" });
        }
        res.json({ interview });
    } catch (err) {
        console.error("Error fetching interview details: ", err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    startInterview,
    submitAnswer,
    getInterviews,
    getInterview,
};