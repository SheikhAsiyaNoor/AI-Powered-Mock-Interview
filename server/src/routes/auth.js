const express = require("express");
const {
    register,
    login,
    googleAuth,
    getMe,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    getActiveSessions,
    revokeSession,
    revokeOtherSessions,
    getLoginHistory,
    getSecurityAlerts,
    resolveSecurityAlert,
    getUserProfile,
    updateUserProfile,
    getPublicUserProfile
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public Authentication & Public Profile Lookups
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/users/:userId", getPublicUserProfile);

// Protected User Profile & Security Settings
router.get("/me", protect, getMe);
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/change-password", protect, changePassword);

// Session Management
router.get("/sessions", protect, getActiveSessions);
router.delete("/sessions/:sessionId", protect, revokeSession);
router.post("/sessions/revoke-others", protect, revokeOtherSessions);

// Security Logs & Alerts
router.get("/login-history", protect, getLoginHistory);
router.get("/security-alerts", protect, getSecurityAlerts);
router.patch("/security-alerts/:alertId/resolve", protect, resolveSecurityAlert);

module.exports = router;