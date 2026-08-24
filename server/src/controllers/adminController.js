const User = require("../models/User");
const Interview = require("../models/Interview");
const PeerChallenge = require("../models/PeerChallenge");
const ChallengeSubmission = require("../models/ChallengeSubmission");
const MentorReview = require("../models/MentorReview");

// In-memory or fallback system settings
let systemSettings = {
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15,
    maxConcurrentSessions: 5,
    sessionExpiryDays: 7,
    allowRegistration: true,
    requireEmailVerification: false
};

// 1. Get Platform Analytics
const getPlatformAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const roleDistribution = {
            student: await User.countDocuments({ role: "student" }),
            mentor: await User.countDocuments({ role: "mentor" }),
            admin: await User.countDocuments({ role: "admin" })
        };

        const totalInterviews = await Interview.countDocuments();
        const totalChallenges = await PeerChallenge.countDocuments();
        const totalSubmissions = await ChallengeSubmission.countDocuments();
        const totalReviews = await MentorReview.countDocuments();

        // Calculate Average Mock Interview Score
        const interviews = await Interview.find().select("score");
        const avgInterviewScore = interviews.length > 0
            ? Math.round(interviews.reduce((acc, i) => acc + (i.score || 0), 0) / interviews.length)
            : 0;

        // Calculate Locked Accounts & Security Alerts
        const lockedUsers = await User.countDocuments({ lockUntil: { $gt: new Date() } });
        
        const allUsersWithAlerts = await User.find({ "securityAlerts.0": { $exists: true } }).select("securityAlerts");
        let totalSecurityAlerts = 0;
        let unresolvedAlerts = 0;
        allUsersWithAlerts.forEach(u => {
            totalSecurityAlerts += (u.securityAlerts || []).length;
            unresolvedAlerts += (u.securityAlerts || []).filter(a => !a.resolved).length;
        });

        // Calculate Active Sessions Across Platform
        const allUsersWithSessions = await User.find({ "activeSessions.0": { $exists: true } }).select("activeSessions");
        let totalActiveSessions = 0;
        allUsersWithSessions.forEach(u => {
            totalActiveSessions += (u.activeSessions || []).length;
        });

        res.status(200).json({
            analytics: {
                totalUsers,
                roleDistribution,
                totalInterviews,
                avgInterviewScore,
                totalChallenges,
                totalSubmissions,
                totalReviews,
                lockedUsers,
                totalSecurityAlerts,
                unresolvedAlerts,
                totalActiveSessions
            }
        });
    } catch (err) {
        console.error("Admin analytics error:", err);
        res.status(500).json({ message: "Error fetching platform analytics", error: err.message });
    }
};

// 2. Get All Users (Paginated & Filtered)
const getUsersList = async (req, res) => {
    try {
        const { role, search, status, page = 1, limit = 20 } = req.query;
        const query = {};

        if (role && role !== "All") {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        if (status === "locked") {
            query.lockUntil = { $gt: new Date() };
        } else if (status === "verified") {
            query.isEmailVerified = true;
        }

        const skip = (Number(page) - 1) * Number(limit);
        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select("-password -passwordHistory")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const formatted = users.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role || "student",
            isEmailVerified: u.isEmailVerified,
            isLocked: u.isLocked(),
            lockUntil: u.lockUntil,
            failedLoginAttempts: u.failedLoginAttempts || 0,
            activeSessionsCount: (u.activeSessions || []).length,
            alertsCount: (u.securityAlerts || []).length,
            createdAt: u.createdAt
        }));

        res.status(200).json({
            users: formatted,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit))
        });
    } catch (err) {
        console.error("Admin get users error:", err);
        res.status(500).json({ message: "Error fetching users list", error: err.message });
    }
};

// 3. Update User Role
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!["student", "mentor", "admin"].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified." });
        }

        // Prevent admin from demoting themselves accidentally
        if (id === req.user._id.toString() && role !== "admin") {
            return res.status(400).json({ message: "You cannot remove admin privileges from your own account." });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found." });

        user.role = role;
        user.securityAlerts.unshift({
            alertId: `alert_${Date.now()}_role_change`,
            type: "ROLE_CHANGED",
            message: `User role was changed to '${role}' by Administrator (${req.user.email}).`,
            severity: "medium",
            timestamp: new Date()
        });

        await user.save();

        res.status(200).json({
            message: `User role updated successfully to ${role}.`,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error("Update role error:", err);
        res.status(500).json({ message: "Error updating user role", error: err.message });
    }
};

// 4. Unlock Locked User Account
const unlockUserAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found." });

        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        user.securityAlerts.unshift({
            alertId: `alert_${Date.now()}_admin_unlock`,
            type: "ACCOUNT_UNLOCKED_BY_ADMIN",
            message: `Account manually unlocked by Administrator (${req.user.email}).`,
            severity: "low",
            timestamp: new Date()
        });

        await user.save();

        res.status(200).json({ message: "User account successfully unlocked." });
    } catch (err) {
        console.error("Unlock account error:", err);
        res.status(500).json({ message: "Error unlocking user account", error: err.message });
    }
};

// 5. Delete User Account
const deleteUserAccount = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot delete your own admin account." });
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ message: "User not found." });

        // Clean up associated interview & challenge submissions
        await Interview.deleteMany({ userId: id });
        await ChallengeSubmission.deleteMany({ userId: id });

        res.status(200).json({ message: "User and associated records permanently deleted." });
    } catch (err) {
        console.error("Delete user error:", err);
        res.status(500).json({ message: "Error deleting user account", error: err.message });
    }
};

// 6. Get & Update System Security Settings
const getSystemSettings = (req, res) => {
    res.status(200).json({ settings: systemSettings });
};

const updateSystemSettings = (req, res) => {
    const {
        maxFailedAttempts,
        lockoutDurationMinutes,
        maxConcurrentSessions,
        allowRegistration,
        requireEmailVerification
    } = req.body;

    if (maxFailedAttempts !== undefined) systemSettings.maxFailedAttempts = Number(maxFailedAttempts);
    if (lockoutDurationMinutes !== undefined) systemSettings.lockoutDurationMinutes = Number(lockoutDurationMinutes);
    if (maxConcurrentSessions !== undefined) systemSettings.maxConcurrentSessions = Number(maxConcurrentSessions);
    if (allowRegistration !== undefined) systemSettings.allowRegistration = Boolean(allowRegistration);
    if (requireEmailVerification !== undefined) systemSettings.requireEmailVerification = Boolean(requireEmailVerification);

    res.status(200).json({
        message: "Platform security & policy settings updated successfully.",
        settings: systemSettings
    });
};

// 7. Get Platform Security Audit Logs
const getSecurityAuditLogs = async (req, res) => {
    try {
        const users = await User.find({ "loginHistory.0": { $exists: true } })
            .select("name email role loginHistory securityAlerts")
            .limit(50);

        const logs = [];
        users.forEach(u => {
            (u.loginHistory || []).forEach(h => {
                logs.push({
                    user: { id: u._id, name: u.name, email: u.email, role: u.role },
                    timestamp: h.timestamp,
                    ip: h.ip,
                    device: h.device,
                    status: h.status,
                    reason: h.reason,
                    suspicious: h.suspicious
                });
            });
        });

        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.status(200).json({ logs: logs.slice(0, 50) });
    } catch (err) {
        console.error("Audit logs error:", err);
        res.status(500).json({ message: "Error fetching security audit logs", error: err.message });
    }
};

module.exports = {
    getPlatformAnalytics,
    getUsersList,
    updateUserRole,
    unlockUserAccount,
    deleteUserAccount,
    getSystemSettings,
    updateSystemSettings,
    getSecurityAuditLogs
};
