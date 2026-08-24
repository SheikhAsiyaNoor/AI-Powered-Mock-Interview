const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    type: {
        type: String,
        enum: ["open-ended", "coding", "situational", "multiple-choice"],
        default: "open-ended"
    },
    options: [{ type: String }], // optional, for MCQs
    sampleAnswerOrKeyPoints: { type: String },
    rubric: {
        clarityWeight: { type: Number, default: 25 },
        technicalDepthWeight: { type: Number, default: 40 },
        problemSolvingWeight: { type: Number, default: 35 }
    },
    points: { type: Number, default: 0 }
})

const peerChallengeSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: {
        type: String,
        enum: ["daily", "weekly", "special"],
        default: "daily",
        index: true
    },
    category: {
        type: String,
        enum: ["Technical", "HR", "Aptitude", "Domain-Specific"],
        required: true,
        index: true
    },
    domain: { type: String, default: "General" },
    difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        default: "Medium"
    },
    timeLimitMinutes: { type: Number, default: 15 },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    questions: [questionSchema],
    totalPoints: { type: Number, default: 100 },
    xpReward: { type: Number, default: 150 },
    participantsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, default: "ai-engine" }
}, {
    timestamps: true
});

module.exports = mongoose.model("PeerChallenge", peerChallengeSchema);
