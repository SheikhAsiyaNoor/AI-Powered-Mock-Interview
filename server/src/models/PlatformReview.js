const mongoose = require("mongoose");

const platformReviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // Enforce one review per registered user
            index: true
        },
        userName: {
            type: String,
            required: true,
            trim: true
        },
        userAvatar: {
            type: String,
            default: ""
        },
        userRole: {
            type: String,
            default: "Candidate",
            trim: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1.0,
            max: 5.0
        },
        headline: {
            type: String,
            trim: true,
            maxlength: 120,
            default: ""
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 1000
        },
        featureHighlight: {
            type: String,
            enum: [
                "Real-Time AI Evaluation",
                "Peer Challenge Arena",
                "Recruiter Simulator",
                "Resume Analysis",
                "Readiness Engine",
                "Overall Platform"
            ],
            default: "Overall Platform"
        },
        isVerifiedCandidate: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

// Helpful index to sort by newest and highest ratings quickly
platformReviewSchema.index({ createdAt: -1, rating: -1 });

module.exports = mongoose.model("PlatformReview", platformReviewSchema);
