const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema({
    badgeId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "🏆" },
    category: { type: String, default: "General" }, // General, Streaks, Technical, HR, Mastery
    rarity: {
        type: String,
        enum: ["common", "rare", "epic", "legendary"],
        default: "common"
    },
    unlockedAt: { type: Date, default: Date.now }
});

const userGamificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true
    },
    totalXp: { type: Number, default: 0, index: true },
    currentRank: {
        type: String,
        enum: ["Novice", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Grandmaster"],
        default: "Novice"
    },
    level: { type: Number, default: 1 },
    currentStreak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    challengesCompleted: { type: Number, default: 0 },
    pinnedBadgeId: { type: String, default: "welcome_challenger" },
    categoryStats: {
        Technical: { completed: { type: Number, default: 0 }, totalScore: { type: Number, default: 0 } },
        HR: { completed: { type: Number, default: 0 }, totalScore: { type: Number, default: 0 } },
        Aptitude: { completed: { type: Number, default: 0 }, totalScore: { type: Number, default: 0 } },
        DomainSpecific: { completed: { type: Number, default: 0 }, totalScore: { type: Number, default: 0 } }
    },
    badges: [badgeSchema],
    rankingHistory: [{
        date: { type: Date, default: Date.now },
        rank: { type: Number },
        xp: { type: Number },
        challengesCompleted: { type: Number }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model("UserGamification", userGamificationSchema);
