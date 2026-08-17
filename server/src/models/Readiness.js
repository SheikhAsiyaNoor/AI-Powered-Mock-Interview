const mongoose = require("mongoose");

const RoadmapItemSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: {
        type: String,
        default: "topic"
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, default: "Medium" },
    estimatedTime: { type: String, default: "1-2 weeks" },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
});

const GapAnalysisSchema = new mongoose.Schema({
    weakTechnicalAreas: [{
        topic: String,
        severity: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
        description: String,
        actionItem: String
    }],
    communicationGaps: [{
        aspect: String,
        observation: String,
        suggestion: String
    }],
    missingIndustrySkills: [{
        skill: String,
        importance: { type: String, enum: ["Critical", "Recommended", "Optional"], default: "Recommended" },
        reason: String
    }]
});

const HistorySnapshotSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    overallScore: { type: Number, required: true },
    resumeScore: { type: Number, required: true },
    interviewScore: { type: Number, required: true },
    skillScore: { type: Number, required: true },
    category: { type: String, required: true },
    candidateLevel: { type: String, required: true }
});

const ScoringConfigSchema = new mongoose.Schema({
    resumeWeight: { type: Number, default: 30 },
    interviewWeight: { type: Number, default: 50 },
    skillWeight: { type: Number, default: 20 },
    placementReadyThreshold: { type: Number, default: 80 },
    highPotentialThreshold: { type: Number, default: 65 }
}, { _id: false });

const readinessSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    candidateLevel: {
        type: String,
        enum: ["Fresher", "Internship Seeker", "Experienced"],
        default: "Fresher"
    },
    targetRole: { type: String, default: "Software Engineer" },
    overallScore: { type: Number, default: 0 },
    category: {
        type: String,
        enum: ["Placement Ready", "High Potential Candidate", "Needs Improvement"],
        default: "Needs Improvement"
    },
    breakdown: {
        resumeScore: { type: Number, default: 0 },
        interviewScore: { type: Number, default: 0 },
        skillScore: { type: Number, default: 0 }
    },
    scoringConfig: { type: ScoringConfigSchema, default: () => ({}) },
    gapAnalysis: { type: GapAnalysisSchema, default: () => ({}) },
    roadmap: [RoadmapItemSchema],
    history: [HistorySnapshotSchema],
    lastEvaluatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Readiness", readinessSchema);
