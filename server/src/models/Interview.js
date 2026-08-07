const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'ai'], required: true },
    content: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    timeStamp: { type: Date, default: Date.now }
})

const DifficultyHistorySchema = new mongoose.Schema({
    questionNumber: { type: Number, required: true },
    difficulty: { type: String, enum: ['Strong', 'Good', 'Weak', 'Skipped'], required: true },
    score: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
})

const interviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    domain: { type: String, required: true },
    currDifficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    difficultyHistory: [DifficultyHistorySchema],
    askedQuestions: [{ type: String }],
    skippedQuestionsCount: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    questionsAnswered: { type: Number, default: 0 },
    messages: [MessageSchema],
    feedback: { type: String, default: '' },
    isComplete: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Interview", interviewSchema)