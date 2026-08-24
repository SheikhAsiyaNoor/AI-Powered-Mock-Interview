const express = require("express");
const {
    getChallenges,
    getChallengeById,
    submitChallenge,
    getLeaderboard,
    getUserStats,
    pinBadge,
    generateAIChallenge
} = require("../controllers/arenaController");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/rbac");

const router = express.Router();

// Public / Semi-protected routes (will enhance with user if token supplied)
router.get("/challenges", protect, getChallenges);
router.get("/challenges/:id", protect, getChallengeById);
router.post("/challenges/:id/submit", protect, submitChallenge);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/user-stats", protect, getUserStats);
router.post("/badges/pin", protect, pinBadge);

// Admin AI Challenge Generation
router.post("/admin/generate", protect, authorizeRoles("admin"), generateAIChallenge);

module.exports = router;
