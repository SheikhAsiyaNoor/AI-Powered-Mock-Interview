const Groq = require("groq-sdk");
const Interview = require("../models/Interview");
const mongoose = require("mongoose");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const cleanText = (val, fallback = "") => {
    if (!val || typeof val !== "string") return fallback;
    const t = val.trim();
    return t === "undefined" || t === "null" ? fallback : t;
};

const systemPrompt = (domain = "General", difficulty = "Medium", askedQuestionsList = []) => {
    const cleanDomain = cleanText(domain, "General");
    const cleanDiff = cleanText(difficulty, "Medium");
    const questions = (Array.isArray(askedQuestionsList) ? askedQuestionsList : [])
        .filter((q) => q && typeof q === "string" && q.trim() !== "undefined" && q.trim() !== "null");

    const historySection = questions.length > 0
        ? `\n- DON'T Repeat any of these previously asked questions:\n${questions.map((q, i) => `${i + 1}. "${q}"`).join("\n")}`
        : "";

    return `
You are a senior technical interviewer conducting a mock interview for a ${cleanDomain} developer role. 
Current Question Difficulty Level: ${cleanDiff}

RULES:
- Ask one clear, specific technical question at a time. After the candidate answers, provide feedback and the next question.
- DON'T ask generic questions like "Tell me about yourself"; strictly ask questions based on Domain selected.${historySection}
Return ONLY the question and nothing else (with no conversational preamble or markdown headers).
`.trim();
};

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
            isVoiceMode = false,
        } = req.body;

        if (!answer || typeof answer !== "string" || !answer.trim()) {
            return res.status(400).json({ message: "A valid answer string is required" });
        }

        let interview = null;
        if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
            interview = await Interview.findOne({ _id: sessionId, userId: req.userId });
        }

        const currentDiff = interview?.currDifficulty || "Medium";
        const isSkipAction = isSkipped || /^(skip|pass|i don't know|next|dont know|no idea)$/i.test(answer.trim());
        let evaluation = "Weak";
        let evalScore = 15;
        let technicalAccuracy = 10;
        let communicationClarity = 20;
        let problemSolving = 15;

        let feedback = "No answer given. Skipped topic.";

        if (isSkipAction) {
            evaluation = "Skipped";
            evalScore = 0;
            technicalAccuracy = 0;
            communicationClarity = 0;
            problemSolving = 0;
            feedback = "Question skipped. Moving on to a foundational topic.";
            if (interview) interview.skippedQuestionsCount = (interview.skippedQuestionsCount || 0) + 1;
        } else {
            try {
                const voiceModeRules = isVoiceMode
                    ? `
                        INPUT MODE: VOICE MODE (Automatic Speech-to-Text Transcription)
                        CRITICAL INSTRUCTIONS FOR VOICE MODE:
                        - The candidate spoke this response verbally, transcribed automatically by Speech-to-Text (STT).
                        - STT models frequently introduce phonetic mistranscriptions (e.g. "no sequel" for "NoSQL", "sink" for "sync", "pie thon" for "Python", "o of n" for "O(n)", "Jason" for "JSON", "sea plus plus" for "C++"), missing punctuation, and spelling anomalies.
                        - You MUST IGNORE ALL spelling mistakes, phonetic transcription errors, missing punctuation, capitalization, and minor speech disfluencies.
                        - Base your evaluation 100% on the candidate's CONCEPTUAL INTENT, technical reasoning, domain knowledge, and logical substance.
                        - Under NO circumstances deduct points or downgrade the candidate for spelling or STT artifacts.
                    `
                    : `
                        INPUT MODE: TEXT / CHAT MODE
                        - Evaluate technical correctness, structure, conceptual depth, and communication clarity normally.
                    `;

                const evalResponse = await groq.chat.completions.create({
                    model: GROQ_MODEL,
                    messages: [
                        {
                            role: "user",
                            content: `
                        You are an expert ${domain} interview evaluator evaluating a candidate's answer for a ${domain} question at ${currentDiff} level difficulty.
                        Previous question context: "${interview?.askedQuestions?.[interview.askedQuestions.length - 1] || ''}"
                        Candidate's Answer: "${answer}"

                        ${voiceModeRules}

                        EVALUATION RULES:
                        - If the answer is gibberish, random keyboard mash (e.g. "asdfghjk"), off-topic, empty, or completely nonsensical:
                          Rate evaluation as "Weak", score: 0 to 10, technicalAccuracy: 0, communicationClarity: 0, problemSolving: 0, and feedback explicitly noting that the response is invalid or unintelligible.
                        - If the answer is partially correct or basic:
                          Rate evaluation as "Medium", score: 40 to 65, technicalAccuracy: 40 to 65, communicationClarity: 50 to 70, problemSolving: 40 to 60.
                        - If the answer is thorough, correct, well-structured:
                          Rate evaluation as "Strong", score: 75 to 100, technicalAccuracy: 75 to 100, communicationClarity: 75 to 100, problemSolving: 75 to 100.

                        Return JSON ONLY in this format:
                        {
                          "evaluation": "Strong" | "Medium" | "Weak",
                          "score": number (0 to 100),
                          "technicalAccuracy": number (0 to 100),
                          "communicationClarity": number (0 to 100),
                          "problemSolving": number (0 to 100),
                          "feedback": "2-3 sentences of direct constructive feedback"
                        }`
                        }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.2
                });
                const parsed = JSON.parse(evalResponse.choices[0]?.message?.content || '{}');
                evaluation = parsed.evaluation || "Weak";
                evalScore = Math.max(0, Math.min(100, typeof parsed.score === 'number' ? parsed.score : evaluation === 'Weak' ? 10 : evaluation === 'Medium' ? 55 : 85));
                technicalAccuracy = Math.max(0, Math.min(100, typeof parsed.technicalAccuracy === 'number' ? parsed.technicalAccuracy : evalScore));
                communicationClarity = Math.max(0, Math.min(100, typeof parsed.communicationClarity === 'number' ? parsed.communicationClarity : evalScore));
                problemSolving = Math.max(0, Math.min(100, typeof parsed.problemSolving === 'number' ? parsed.problemSolving : evalScore));
                feedback = parsed.feedback || "Answer evaluated based on technical depth and communication clarity.";
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

        if (interview) {
            interview.currDifficulty = nextDiff;
            interview.difficultyHistory.push({
                questionNumber: questionsAnswered + 1,
                difficulty: currentDiff,
                evaluation,
                score: evalScore,
                technicalAccuracy,
                communicationClarity,
                problemSolving
            });
            interview.messages.push({ role: "user", content: isSkipAction ? "[Skipped Question]" : answer, timeStamp: new Date() });
            interview.messages.push({ role: "ai", content: feedback, timeStamp: new Date() });
            interview.questionsAnswered = questionsAnswered + 1;
        }

        // 5 total questions (questionsAnswered: 0, 1, 2, 3, 4 -> 4 means 5th question is being submitted)
        const isComplete = questionsAnswered >= 4 || (interview?.difficultyHistory?.length || 0) >= 5;

        if (isComplete && interview) {
            const totalQuestionsCount = interview.difficultyHistory.length || 1;
            const historySummary = interview.difficultyHistory.map(h => `Q${h.questionNumber} (${h.difficulty}): Evaluated ${h.evaluation} (${h.score}%)`).join(", ");

            const overallScore = Math.round(
                interview.difficultyHistory.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalQuestionsCount
            );

            const avgTech = Math.round(
                interview.difficultyHistory.reduce((acc, curr) => acc + (curr.technicalAccuracy ?? curr.score ?? 0), 0) / totalQuestionsCount
            );
            const avgComm = Math.round(
                interview.difficultyHistory.reduce((acc, curr) => acc + (curr.communicationClarity ?? curr.score ?? 0), 0) / totalQuestionsCount
            );
            const avgPS = Math.round(
                interview.difficultyHistory.reduce((acc, curr) => acc + (curr.problemSolving ?? curr.score ?? 0), 0) / totalQuestionsCount
            );

            const dimensionScores = {
                technicalAccuracy: avgTech,
                communicationClarity: avgComm,
                problemSolving: avgPS
            };

            let progressionReport = `Candidate completed interview ending at ${nextDiff} difficulty tier with an overall score of ${overallScore}%.`;

            try {
                const reportRes = await groq.chat.completions.create({
                    model: GROQ_MODEL,
                    messages: [
                        {
                            role: "user",
                            content: `Synthesize a final progression report for a ${domain} candidate based on this sequence: ${historySummary}. Overall score: ${overallScore}%.
                            Summarize difficulty trajectory, technical strengths, and key growth areas in 3 bullet points.`
                        }
                    ],
                    temperature: 0.6,
                });
                progressionReport = reportRes.choices[0]?.message?.content || progressionReport;
            } catch (groqErr) {
                console.error("Groq API error on generating report:", groqErr.message || groqErr);
            }

            interview.score = overallScore;
            interview.isComplete = true;
            interview.feedback = feedback;
            interview.progressionReport = progressionReport;
            interview.duration = Math.max(
                1,
                Math.round((Date.now() - new Date(interview.createdAt).getTime()) / 60000)
            );
            await interview.save();

            return res.json({
                feedback,
                score: overallScore,
                dimensionScores,
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