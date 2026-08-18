const mongoose = require("mongoose");

const answerEvaluationSchema = new mongoose.Schema({
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    candidateAnswer: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    feedback: { type: String, default: "" },
    criteriaScores: {
        clarity: { type: Number, default: 0 },
        technicalDepth: { type: Number, default: 0 },
        problemSolving: { type: Number, default: 0 }
    },
    strengths: [{ type: String }],
    improvements: [{ type: String }]
});

const challengeSubmissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    challengeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PeerChallenge",
        required: true,
        index: true
    },
    category: { type: String, required: true },
    answers: [answerEvaluationSchema],
    totalScore: { type: Number, required: true }, // Aggregated percentage 0-100
    pointsEarned: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
    feedbackSummary: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now, index: true }
}, {
    timestamps: true
});

// A candidate can submit once per challenge (to keep competition fair)
challengeSubmissionSchema.index({ userId: 1, challengeId: 1 }, { unique: true });

module.exports = mongoose.model("ChallengeSubmission", challengeSubmissionSchema);
