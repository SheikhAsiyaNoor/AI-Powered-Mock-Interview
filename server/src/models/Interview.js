const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'ai'], required: true },
    content: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    timeStamp: { type: Date, default: Date.now }
})

const DifficultyHistorySchema = new mongoose.Schema({
    questionNumber: { type: Number, required: true },
    difficulty: { type: String, default: 'Medium' },
    evaluation: { type: String, default: 'Good' },
    score: { type: mongoose.Schema.Types.Mixed, default: 0 },
    timestamp: { type: Date, default: Date.now }
})

const CompanyEvaluationSchema = new mongoose.Schema({
    hiringVerdict: { type: String, enum: ['Strong Hire', 'Hire', 'Lean Hire', 'Lean No Hire', 'No Hire', ''] },
    companyCutoff: { type: Number, default: 75 },
    companyStandardMet: { type: Boolean, default: false },
    dimensionScores: {
        technicalDepth: { type: Number, default: 0 },
        systemArchitecture: { type: Number, default: 0 },
        culturalAlignment: { type: Number, default: 0 },
        communication: { type: Number, default: 0 }
    },
    cultureAlignmentFeedback: { type: String, default: '' },
    companySpecificFeedback: { type: String, default: '' }
}, { _id: false });

const interviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    domain: { type: String, required: true },
    company: { type: String, default: '' },
    roundType: { type: String, default: 'Technical Round' },
    currDifficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    difficultyHistory: [DifficultyHistorySchema],
    askedQuestions: [{ type: String }],
    skippedQuestionsCount: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    questionsAnswered: { type: Number, default: 0 },
    messages: [MessageSchema],
    feedback: { type: String, default: '' },
    progressionReport: { type: String, default: '' },
    companyEvaluation: { type: CompanyEvaluationSchema, default: null },
    isComplete: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Interview", interviewSchema)