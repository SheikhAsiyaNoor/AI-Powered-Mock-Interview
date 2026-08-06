const Groq = require("groq-sdk");
const Interview = require("../models/Interview");
const mongoose = require("mongoose");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const systemPrompt = (domain) => `
You are a senior technical interviewer conducting a mock interview for a ${domain} developer role. Ask one clear, specific technical question at a time. After the candidate answers, provide feedback and the next question.

Return ONLY the question and nothing else.
`.trim();

const startInterview = async (req, res) => {
    try {
        const domain = req.body.domain || req.body.topic || "General";
        let firstQuestion = `What are the key concepts and best practices in ${domain}?`;
        try {
            const completion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt(domain) },
                    {
                        role: "user",
                        content: `Start the interview. Ask me the first ${domain} technical question. Only ask the question, no preamble.`,
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
            messages: [{ role: "ai", content: firstQuestion }],
        });

        res.status(201).json({ sessionId: interview._id, question: firstQuestion });
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
        } = req.body;

        if (!answer || typeof answer !== "string" || !answer.trim()) {
            return res.status(400).json({ message: "A valid answer string is required" });
        }

        let interview = null;
        if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
            interview = await Interview.findOne({ _id: sessionId, userId: req.userId });
        }

        let feedback = "Good response addressing key points. Structure your explanation with clear examples to demonstrate deep understanding.";
        try {
            const feedbackResponse = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "user",
                        content: `
                        You are an expert ${domain} interview evaluator. Provide constructive feedback on this interview answer in 2-3 sentences. Focus on:
                        - Clarity and structure of the response
                        - Technical accuracy and depth
                        - Communication skills
                        - Areas for improvement

                        Answer: "${answer}"

                        Return ONLY the feedback, no additional text.
                    `,
                    },
                ],
                temperature: 0.7,
                max_tokens: 200,
            });
            feedback = feedbackResponse.choices[0]?.message?.content || feedback;
        } catch (groqErr) {
            console.error("Groq API error on feedback:", groqErr.message || groqErr);
        }

        const isComplete = questionsAnswered >= 2;

        if (interview) {
            interview.messages.push({ role: "user", content: answer, timestamp: new Date() });
            interview.messages.push({ role: "ai", content: feedback, timestamp: new Date() });
            interview.questionsAnswered = questionsAnswered + 1;
        }

        if (isComplete) {
            let score = 75;
            try {
                const scoreResponse = await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "user",
                            content: `Rate this interview answer on a scale of 1-100 for a ${domain} position. Consider technical accuracy, communication, and problem-solving. Return ONLY a number between 10-100, nothing else.
                            Answer: "${answer}"`,
                        },
                    ],
                    temperature: 0.7,
                    max_tokens: 10,
                });
                const scoreRaw = scoreResponse.choices[0]?.message?.content?.trim() || "75";
                score = Math.max(10, Math.min(100, parseInt(scoreRaw) || 75));
            } catch (groqErr) {
                console.error("Groq API error on scoring:", groqErr.message || groqErr);
            }

            if (interview) {
                interview.score = score;
                interview.isComplete = true;
                interview.feedback = feedback;
                interview.duration = Math.max(
                    1,
                    Math.round((Date.now() - new Date(interview.createdAt).getTime()) / 60000)
                );
                await interview.save();
            }

            return res.json({
                feedback,
                score,
                isComplete: true,
                message: "Interview complete. Final feedback and score provided.",
            });
        }

        let nextQuestion = `How would you approach handling performance optimizations and edge cases in a ${domain} project?`;
        try {
            const nextQuestionResponse = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "user",
                        content: `
                            You are an expert ${domain} interviewer. Generate the NEXT interview question based on the previous answer. The question should: 
                            - Be different from typical generic interview questions
                            - Build on topics relevant to ${domain}
                            - Be open-ended and professional
                            - Test deeper understanding of the domain

                            Previous answer context: "${answer.substring(0, 100)}..."

                            Return ONLY the new question, nothing else.`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 150,
            });
            nextQuestion = nextQuestionResponse.choices[0]?.message?.content?.trim() || nextQuestion;
        } catch (groqErr) {
            console.error("Groq API error on nextQuestion:", groqErr.message || groqErr);
        }

        if (interview) {
            await interview.save();
        }

        return res.json({
            feedback,
            nextQuestion,
            isComplete: false,
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