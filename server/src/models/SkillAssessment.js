const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true },
    explanation: { type: String, required: true },
    userSelectedIndex: { type: Number, default: -1 },
    isCorrect: { type: Boolean, default: false }
});

const skillAssessmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    domain: { type: String, required: true },
    candidateLevel: { type: String, default: "Fresher" },
    score: { type: Number, required: true }, // percentage 0-100
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    questions: [QuestionSchema],
    completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("SkillAssessment", skillAssessmentSchema);
