const mongoose = require("mongoose");

const mentorReviewSchema = new mongoose.Schema({
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    targetType: {
        type: String,
        enum: ["Interview", "ChallengeSubmission"],
        default: "Interview"
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    overallScore: { type: Number, min: 0, max: 100, required: true },
    ratings: {
        communication: { type: Number, min: 1, max: 5, default: 4 },
        technicalAccuracy: { type: Number, min: 1, max: 5, default: 4 },
        problemSolving: { type: Number, min: 1, max: 5, default: 4 },
        confidenceAndPresence: { type: Number, min: 1, max: 5, default: 4 }
    },
    qualitativeFeedback: { type: String, required: true },
    keyStrengths: [{ type: String }],
    areasForImprovement: [{ type: String }],
    recommendedTopics: [{ type: String }],
    recommendationStatus: {
        type: String,
        enum: ["Strong Hire", "Hire", "Lean Hire", "Needs Practice", "Not Ready"],
        default: "Hire"
    },
    reviewedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model("MentorReview", mentorReviewSchema);
