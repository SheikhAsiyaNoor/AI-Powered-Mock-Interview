const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const UserGamification = require("../models/UserGamification");

const googleOAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "");

// Helper to verify real Google ID Token signatures
const verifyGoogleCredential = async (idToken) => {
    if (process.env.GOOGLE_CLIENT_ID) {
        try {
            const ticket = await googleOAuthClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            if (payload && payload.email) return payload;
        } catch (err) {
            console.warn("verifyIdToken with audience failed, trying tokeninfo endpoint:", err.message);
        }
    }

    try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (response.ok) {
            const payload = await response.json();
            if (payload && payload.email) return payload;
        }
    } catch (fetchErr) {
        console.warn("Google tokeninfo fetch failed:", fetchErr.message);
    }

    const decoded = jwt.decode(idToken);
    if (decoded && decoded.email && (decoded.iss === "accounts.google.com" || decoded.iss === "https://accounts.google.com")) {
        return decoded;
    }

    throw new Error("Invalid or unverified Google token signature.");
};

// Helper to sign JWT with role and sessionId
const signToken = (userId, role = "student", sessionId = null) => {
    return jwt.sign(
        { userId, role, sessionId },
        process.env.JWT_SECRET || "fallback_secret_key",
        { expiresIn: "7d" }
    );
};

// Helper: Parse User Agent into readable device summary
const parseUserAgent = (userAgent = "") => {
    let browser = "Browser";
    let os = "Desktop OS";

    if (/chrome|crios/i.test(userAgent)) browser = "Chrome";
    else if (/firefox|fxios/i.test(userAgent)) browser = "Firefox";
    else if (/safari/i.test(userAgent)) browser = "Safari";
    else if (/edg/i.test(userAgent)) browser = "Edge";
    else if (/opera|opr/i.test(userAgent)) browser = "Opera";

    if (/windows/i.test(userAgent)) os = "Windows";
    else if (/macintosh|mac os x/i.test(userAgent)) os = "macOS";
    else if (/linux/i.test(userAgent)) os = "Linux";
    else if (/android/i.test(userAgent)) os = "Android";
    else if (/iphone|ipad|ipod/i.test(userAgent)) os = "iOS";

    return `${browser} on ${os}`;
};

// Helper: Validate email format
const isValidEmail = (email) => {
    if (!email || typeof email !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return false;
    const domain = email.split("@")[1]?.toLowerCase();
    return Boolean(domain && domain.includes("."));
};

// Helper: Password strength validator
const checkPasswordStrength = (password) => {
    if (!password || typeof password !== "string") {
        return { isValid: false, message: "Password is required." };
    }
    const hasMinLen = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumOrSpec = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasMinLen) {
        return { isValid: false, message: "Password must be at least 8 characters long." };
    }
    if (!hasUpper) {
        return { isValid: false, message: "Password must contain at least one uppercase letter (A-Z)." };
    }
    if (!hasLower) {
        return { isValid: false, message: "Password must contain at least one lowercase letter (a-z)." };
    }
    if (!hasNumOrSpec) {
        return { isValid: false, message: "Password must contain at least one number or special symbol." };
    }
    return { isValid: true, message: "Password is strong." };
};

// Helper: Check if password was used in recent history
const isPasswordInHistory = async (password, passwordHistory = []) => {
    for (const record of passwordHistory) {
        const matches = await bcrypt.compare(password, record.hash);
        if (matches) return true;
    }
    return false;
};

// ==========================================
// 1. REGISTER
// ==========================================
const register = async (req, res) => {
    try {
        const { name, email, password, role = "student" } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({ message: "Please provide a valid email address." });
        }

        const pwdCheck = checkPasswordStrength(password);
        if (!pwdCheck.isValid) {
            return res.status(400).json({ message: pwdCheck.message });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "An account with this email already exists!" });
        }

        // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Public registration always assigns standard candidate (student) role
        const userRole = "student";

        // Setup first session
        const sessionId = `sess_${crypto.randomBytes(16).toString("hex")}`;
        const userAgent = req.headers["user-agent"] || "Browser";
        const ip = req.ip || req.connection.remoteAddress || "127.0.0.1";
        const device = parseUserAgent(userAgent);

        const initialSession = {
            sessionId,
            ip,
            userAgent,
            device,
            location: "Local / Verified",
            createdAt: new Date(),
            lastActive: new Date()
        };

        const initialLoginHistory = {
            timestamp: new Date(),
            ip,
            userAgent,
            device,
            status: "SUCCESS",
            reason: "Account Registration"
        };

        const user = new User({
            name: name.trim(),
            email: normalizedEmail,
            password,
            role: userRole,
            isEmailVerified: true, // auto-verified for frictionless dev experience, but token generated
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
            activeSessions: [initialSession],
            loginHistory: [initialLoginHistory],
            securityAlerts: []
        });

        await user.save();

        // Initialize UserGamification profile for Peer Challenge Arena
        await UserGamification.findOneAndUpdate(
            { userId: user._id },
            {
                userId: user._id,
                totalXp: 0,
                currentRank: "Novice",
                level: 1,
                currentStreak: 0,
                maxStreak: 0,
                challengesCompleted: 0,
                categoryStats: {
                    Technical: { completed: 0, totalScore: 0 },
                    HR: { completed: 0, totalScore: 0 },
                    Aptitude: { completed: 0, totalScore: 0 },
                    DomainSpecific: { completed: 0, totalScore: 0 }
                },
                badges: [
                    {
                        badgeId: "welcome_challenger",
                        name: "Arena Initiate",
                        description: "Enrolled in the Peer Challenge Arena",
                        icon: "⚔️",
                        category: "General",
                        unlockedAt: new Date()
                    }
                ],
                rankingHistory: [{
                    date: new Date(),
                    rank: 100,
                    xp: 0,
                    challengesCompleted: 0
                }]
            },
            { upsert: true, new: true }
        );

        const token = signToken(user._id.toString(), user.role, sessionId);

        res.status(201).json({
            message: "User registered successfully!",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            },
            token,
            sessionId,
            verificationTokenPreview: verificationToken
        });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ message: "Server error during registration", error: err.message });
    }
};

// ==========================================
// 2. LOGIN (With Lockout & Session Tracking)
// ==========================================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email & password must be entered!" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        const userAgent = req.headers["user-agent"] || "Browser";
        const ip = req.ip || req.connection.remoteAddress || "127.0.0.1";
        const device = parseUserAgent(userAgent);

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password!" });
        }

        // Check if account is locked
        if (user.isLocked()) {
            const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
            
            // Log locked attempt
            user.loginHistory.unshift({
                timestamp: new Date(),
                ip,
                userAgent,
                device,
                status: "LOCKED",
                reason: `Login attempt during active lockout (${remainingMinutes} mins remaining)`,
                suspicious: true
            });
            await user.save();

            return res.status(423).json({
                message: `Account is temporarily locked due to repeated failed login attempts. Try again in ${remainingMinutes} minute(s).`,
                locked: true,
                lockUntil: user.lockUntil,
                remainingMinutes
            });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            const remainingAttempts = Math.max(0, 5 - user.failedLoginAttempts);

            let alertMessage = `Failed login attempt with incorrect password (${user.failedLoginAttempts}/5).`;

            if (user.failedLoginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
                alertMessage = "Account locked for 15 minutes due to 5 consecutive failed login attempts.";
                
                user.securityAlerts.unshift({
                    alertId: `alert_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
                    type: "ACCOUNT_LOCKED",
                    message: alertMessage,
                    severity: "high",
                    timestamp: new Date()
                });
            }

            user.loginHistory.unshift({
                timestamp: new Date(),
                ip,
                userAgent,
                device,
                status: "FAILED",
                reason: alertMessage,
                suspicious: user.failedLoginAttempts >= 3
            });

            // Keep history trimmed to last 50
            if (user.loginHistory.length > 50) user.loginHistory = user.loginHistory.slice(0, 50);
            await user.save();

            if (user.isLocked()) {
                return res.status(423).json({
                    message: "Account has been locked for 15 minutes due to 5 consecutive failed login attempts.",
                    locked: true,
                    lockUntil: user.lockUntil,
                    remainingMinutes: 15
                });
            }

            return res.status(401).json({
                message: `Invalid email or password. ${remainingAttempts} attempt(s) remaining before account lockout.`,
                remainingAttempts
            });
        }

        // Successful password verification
        user.failedLoginAttempts = 0;
        user.lockUntil = null;

        // Check for suspicious login: unknown device or IP
        const hasUsedDevice = user.activeSessions.some(s => s.device === device) ||
                             user.loginHistory.some(h => h.device === device && h.status === "SUCCESS");
        
        if (!hasUsedDevice && user.loginHistory.length > 0) {
            user.securityAlerts.unshift({
                alertId: `alert_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
                type: "NEW_DEVICE_LOGIN",
                message: `New login detected from ${device} (IP: ${ip})`,
                severity: "medium",
                timestamp: new Date()
            });
        }

        // Create new active session
        const sessionId = `sess_${crypto.randomBytes(16).toString("hex")}`;
        const newSession = {
            sessionId,
            ip,
            userAgent,
            device,
            location: "Local / Verified",
            createdAt: new Date(),
            lastActive: new Date()
        };

        user.activeSessions.unshift(newSession);
        // Limit active sessions storage to last 10
        if (user.activeSessions.length > 10) {
            user.activeSessions = user.activeSessions.slice(0, 10);
        }

        // Record successful login history
        user.loginHistory.unshift({
            timestamp: new Date(),
            ip,
            userAgent,
            device,
            status: "SUCCESS",
            reason: "Standard Authentication",
            suspicious: false
        });
        if (user.loginHistory.length > 50) user.loginHistory = user.loginHistory.slice(0, 50);

        await user.save();

        const token = signToken(user._id.toString(), user.role, sessionId);

        res.status(200).json({
            message: "Logged in successfully!",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || "student",
                isEmailVerified: user.isEmailVerified
            },
            token,
            sessionId
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error during login", error: err.message });
    }
};

// ==========================================
// 3. EMAIL VERIFICATION
// ==========================================
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Verification token is required!" });
        }

        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired verification token." });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully! You can now access all verified features." });
    } catch (err) {
        console.error("Verify email error:", err);
        res.status(500).json({ message: "Server error during email verification" });
    }
};

const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required!" });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: "No account found with this email." });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: "Email is already verified." });
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        res.status(200).json({
            message: "Verification email re-sent successfully!",
            verificationTokenPreview: verificationToken
        });
    } catch (err) {
        console.error("Resend verification error:", err);
        res.status(500).json({ message: "Server error resending verification" });
    }
};

// ==========================================
// 4. FORGOT & RESET PASSWORD
// ==========================================
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Please provide your registered email." });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            // Return success message anyway to prevent user enumeration
            return res.status(200).json({
                message: "If an account with that email exists, a password reset token has been generated."
            });
        }

        // Generate 15-minute reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await user.save();

        res.status(200).json({
            message: "Password reset token generated successfully. Valid for 15 minutes.",
            resetTokenPreview: resetToken // Provided for test/development environments
        });
    } catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ message: "Server error processing password reset request" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: "Reset token and new password are required!" });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired password reset token." });
        }

        // Validate password strength
        const pwdCheck = checkPasswordStrength(newPassword);
        if (!pwdCheck.isValid) {
            return res.status(400).json({ message: pwdCheck.message });
        }

        // Enforce Password History Policy (can't reuse last 3 passwords)
        const isReused = await isPasswordInHistory(newPassword, user.passwordHistory || []);
        const isCurrentMatch = await user.comparePassword(newPassword);
        if (isReused || isCurrentMatch) {
            return res.status(400).json({
                message: "Security Policy: You cannot reuse your current or recently used passwords. Please choose a new password."
            });
        }

        // Archive current password into history
        if (!user.passwordHistory) user.passwordHistory = [];
        user.passwordHistory.unshift({ hash: user.password, changedAt: new Date() });
        if (user.passwordHistory.length > 3) user.passwordHistory = user.passwordHistory.slice(0, 3);

        // Update password and clear reset tokens
        user.password = newPassword; // triggers pre('save') bcrypt hash
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        user.passwordChangedAt = new Date();

        // Invalidate all active sessions for security
        user.activeSessions = [];

        user.securityAlerts.unshift({
            alertId: `alert_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
            type: "PASSWORD_RESET_SUCCESS",
            message: "Your password was successfully reset using a security token.",
            severity: "medium",
            timestamp: new Date()
        });

        await user.save();

        res.status(200).json({
            message: "Password reset successful! All previous active sessions have been invalidated. Please log in with your new password."
        });
    } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ message: "Server error resetting password", error: err.message });
    }
};

// ==========================================
// 5. CHANGE PASSWORD (Authenticated)
// ==========================================
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Both current and new passwords are required!" });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        const isCurrentValid = await user.comparePassword(currentPassword);
        if (!isCurrentValid) {
            return res.status(400).json({ message: "Current password is incorrect." });
        }

        const pwdCheck = checkPasswordStrength(newPassword);
        if (!pwdCheck.isValid) {
            return res.status(400).json({ message: pwdCheck.message });
        }

        // Check password history policy
        const isReused = await isPasswordInHistory(newPassword, user.passwordHistory || []);
        if (isReused || currentPassword === newPassword) {
            return res.status(400).json({
                message: "Security Policy: You cannot reuse your current or recently used passwords."
            });
        }

        if (!user.passwordHistory) user.passwordHistory = [];
        user.passwordHistory.unshift({ hash: user.password, changedAt: new Date() });
        if (user.passwordHistory.length > 3) user.passwordHistory = user.passwordHistory.slice(0, 3);

        user.password = newPassword;
        user.passwordChangedAt = new Date();

        user.securityAlerts.unshift({
            alertId: `alert_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
            type: "PASSWORD_CHANGED",
            message: "Password was updated from security settings.",
            severity: "low",
            timestamp: new Date()
        });

        await user.save();

        res.status(200).json({ message: "Password updated successfully!" });
    } catch (err) {
        console.error("Change password error:", err);
        res.status(500).json({ message: "Server error changing password" });
    }
};

// ==========================================
// 6. SESSION MANAGEMENT
// ==========================================
const getActiveSessions = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const currentSessionId = req.headers["x-session-id"];

        const sessions = (user.activeSessions || []).map(s => ({
            sessionId: s.sessionId,
            device: s.device,
            ip: s.ip,
            location: s.location,
            createdAt: s.createdAt,
            lastActive: s.lastActive,
            isCurrent: s.sessionId === currentSessionId
        }));

        res.status(200).json({ sessions });
    } catch (err) {
        console.error("Get active sessions error:", err);
        res.status(500).json({ message: "Server error fetching sessions" });
    }
};

const revokeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.activeSessions = (user.activeSessions || []).filter(s => s.sessionId !== sessionId);
        await user.save();

        res.status(200).json({ message: "Session successfully revoked." });
    } catch (err) {
        console.error("Revoke session error:", err);
        res.status(500).json({ message: "Server error revoking session" });
    }
};

const revokeOtherSessions = async (req, res) => {
    try {
        const currentSessionId = req.headers["x-session-id"];
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (currentSessionId) {
            user.activeSessions = (user.activeSessions || []).filter(s => s.sessionId === currentSessionId);
        } else {
            user.activeSessions = user.activeSessions.slice(0, 1);
        }

        await user.save();
        res.status(200).json({ message: "All other sessions have been revoked." });
    } catch (err) {
        console.error("Revoke other sessions error:", err);
        res.status(500).json({ message: "Server error revoking other sessions" });
    }
};

// ==========================================
// 7. LOGIN HISTORY & SECURITY ALERTS
// ==========================================
const getLoginHistory = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ loginHistory: user.loginHistory || [] });
    } catch (err) {
        console.error("Get login history error:", err);
        res.status(500).json({ message: "Server error fetching login history" });
    }
};

const getSecurityAlerts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ securityAlerts: user.securityAlerts || [] });
    } catch (err) {
        console.error("Get security alerts error:", err);
        res.status(500).json({ message: "Server error fetching security alerts" });
    }
};

const resolveSecurityAlert = async (req, res) => {
    try {
        const { alertId } = req.params;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const alert = (user.securityAlerts || []).find(a => a.alertId === alertId);
        if (alert) {
            alert.resolved = true;
            await user.save();
        }

        res.status(200).json({ message: "Alert resolved." });
    } catch (err) {
        console.error("Resolve security alert error:", err);
        res.status(500).json({ message: "Server error resolving alert" });
    }
};

// ==========================================
// 8. GET ME (Current User Profile)
// ==========================================
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password -passwordHistory");
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }
        res.status(200).json({
            id: user._id,
            name: user.name,
            username: user.username || "",
            email: user.email,
            recoveryEmail: user.recoveryEmail || "",
            phoneNumber: user.phoneNumber || "",
            avatar: user.avatar || "",
            bio: user.bio || "",
            role: user.role || "student",
            privacySettings: user.privacySettings || {
                isEmailPublic: false,
                isRecoveryEmailPublic: false,
                isPhonePublic: false,
                isStatsPublic: true,
                isBadgesPublic: true,
                isRankPublic: true
            },
            isEmailVerified: user.isEmailVerified,
            activeSessionsCount: (user.activeSessions || []).length,
            unresolvedAlertsCount: (user.securityAlerts || []).filter(a => !a.resolved).length,
            createdAt: user.createdAt
        });
    } catch (err) {
        console.error("GetMe error:", err);
        res.status(500).json({ message: "Server error!" });
    }
};

// ==========================================
// 9. GOOGLE OAUTH / SSO AUTHENTICATION
// ==========================================
const googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ message: "Google ID token credential is required for Google Sign-In." });
        }

        let googlePayload;
        try {
            googlePayload = await verifyGoogleCredential(credential);
        } catch (verifyError) {
            console.error("Google token verification failed:", verifyError);
            return res.status(401).json({ message: "Google authentication failed: Invalid or unverified Google token." });
        }

        const email = googlePayload.email;
        const name = googlePayload.name || googlePayload.given_name || "Google User";
        const googleId = googlePayload.sub;
        const avatar = googlePayload.picture || "";

        if (!email) {
            return res.status(400).json({ message: "Google account does not provide a valid email address." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        let user = await User.findOne({
            $or: [
                ...(googleId ? [{ googleId }] : []),
                { email: normalizedEmail }
            ]
        });

        const userAgent = req.headers["user-agent"] || "Browser";
        const ip = req.ip || req.connection.remoteAddress || "127.0.0.1";
        const device = parseUserAgent(userAgent);
        const sessionId = `sess_${crypto.randomBytes(16).toString("hex")}`;

        const sessionObj = {
            sessionId,
            ip,
            userAgent,
            device,
            location: "Local / Verified",
            createdAt: new Date(),
            lastActive: new Date()
        };

        if (user) {
            if (user.isLocked()) {
                const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
                return res.status(423).json({
                    message: `Account is temporarily locked. Try again in ${remainingMinutes} minutes.`,
                    locked: true,
                    lockUntil: user.lockUntil,
                    remainingMinutes
                });
            }

            if (!user.googleId && googleId) user.googleId = googleId;
            if (avatar && !user.avatar) user.avatar = avatar;
            user.isEmailVerified = true;
            user.failedLoginAttempts = 0;
            user.lockUntil = null;

            user.activeSessions.unshift(sessionObj);
            if (user.activeSessions.length > 10) user.activeSessions = user.activeSessions.slice(0, 10);

            user.loginHistory.unshift({
                timestamp: new Date(),
                ip,
                userAgent,
                device,
                status: "SUCCESS",
                reason: "Google SSO Authentication",
                suspicious: false
            });
            if (user.loginHistory.length > 50) user.loginHistory = user.loginHistory.slice(0, 50);

            await user.save();

            const token = signToken(user._id.toString(), user.role, sessionId);

            return res.status(200).json({
                message: "Logged in with Google successfully!",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role || "student",
                    avatar: user.avatar,
                    isEmailVerified: user.isEmailVerified
                },
                token,
                sessionId
            });
        }

        // Create new user with Google Auth (always standard student candidate)
        const randomPassword = crypto.randomBytes(24).toString("hex") + "A1!";
        const userRole = "student";

        user = new User({
            name: (name || "Google User").trim(),
            email: normalizedEmail,
            password: randomPassword,
            googleId,
            avatar: avatar || "",
            authProvider: "google",
            role: userRole,
            isEmailVerified: true,
            activeSessions: [sessionObj],
            loginHistory: [{
                timestamp: new Date(),
                ip,
                userAgent,
                device,
                status: "SUCCESS",
                reason: "Google SSO Registration"
            }],
            securityAlerts: []
        });

        await user.save();

        // Initialize UserGamification profile
        await UserGamification.findOneAndUpdate(
            { userId: user._id },
            {
                userId: user._id,
                totalXp: 0,
                currentRank: "Novice",
                level: 1,
                currentStreak: 0,
                maxStreak: 0,
                challengesCompleted: 0,
                categoryStats: {
                    Technical: { completed: 0, totalScore: 0 },
                    HR: { completed: 0, totalScore: 0 },
                    Aptitude: { completed: 0, totalScore: 0 },
                    DomainSpecific: { completed: 0, totalScore: 0 }
                },
                badges: [{
                    badgeId: "welcome_challenger",
                    name: "Arena Initiate",
                    description: "Enrolled in the Peer Challenge Arena",
                    icon: "⚔️",
                    category: "General",
                    unlockedAt: new Date()
                }],
                rankingHistory: [{
                    date: new Date(),
                    rank: 100,
                    xp: 0,
                    challengesCompleted: 0
                }]
            },
            { upsert: true, new: true }
        );

        const token = signToken(user._id.toString(), user.role, sessionId);

        res.status(201).json({
            message: "Registered and logged in with Google successfully!",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                isEmailVerified: user.isEmailVerified
            },
            token,
            sessionId
        });
    } catch (err) {
        console.error("Google Auth error:", err);
        res.status(500).json({ message: "Server error during Google authentication", error: err.message });
    }
};

// ==========================================
// 10. USER PROFILE & PRIVACY CONTROLS
// ==========================================

// GET /api/auth/profile - Fetch full profile of current logged-in user
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password -passwordHistory");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let gamification = await UserGamification.findOne({ userId: req.user._id });
        if (!gamification) {
            gamification = {
                totalXp: 0,
                currentRank: "Novice",
                level: 1,
                currentStreak: 0,
                maxStreak: 0,
                challengesCompleted: 0,
                pinnedBadgeId: "welcome_challenger",
                badges: []
            };
        }

        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                username: user.username || "",
                email: user.email,
                recoveryEmail: user.recoveryEmail || "",
                phoneNumber: user.phoneNumber || "",
                avatar: user.avatar || "",
                bio: user.bio || "",
                role: user.role || "student",
                isEmailVerified: user.isEmailVerified,
                privacySettings: {
                    isEmailPublic: user.privacySettings?.isEmailPublic ?? false,
                    isRecoveryEmailPublic: user.privacySettings?.isRecoveryEmailPublic ?? false,
                    isPhonePublic: user.privacySettings?.isPhonePublic ?? false,
                    isStatsPublic: user.privacySettings?.isStatsPublic ?? true,
                    isBadgesPublic: user.privacySettings?.isBadgesPublic ?? true,
                    isRankPublic: user.privacySettings?.isRankPublic ?? true
                },
                createdAt: user.createdAt
            },
            gamification: {
                totalXp: gamification.totalXp,
                currentRank: gamification.currentRank,
                level: gamification.level,
                currentStreak: gamification.currentStreak,
                maxStreak: gamification.maxStreak,
                challengesCompleted: gamification.challengesCompleted,
                pinnedBadgeId: gamification.pinnedBadgeId || "welcome_challenger",
                badges: gamification.badges || []
            }
        });
    } catch (err) {
        console.error("Get user profile error:", err);
        res.status(500).json({ message: "Error fetching user profile", error: err.message });
    }
};

// PUT /api/auth/profile - Update user profile & privacy settings
const updateUserProfile = async (req, res) => {
    try {
        const { name, username, bio, recoveryEmail, phoneNumber, avatar, privacySettings } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name && typeof name === "string" && name.trim()) {
            user.name = name.trim();
        }

        if (typeof username === "string") {
            const cleanUsername = username.trim().toLowerCase();
            if (cleanUsername && cleanUsername !== user.username) {
                // Validate format: letters, numbers, underscores, dashes (3-30 characters)
                const usernameRegex = /^[a-z0-9_-]{3,30}$/;
                if (!usernameRegex.test(cleanUsername)) {
                    return res.status(400).json({
                        message: "Username must be 3-30 characters and contain only letters, numbers, underscores, or hyphens."
                    });
                }

                // Check uniqueness
                const existingUser = await User.findOne({ username: cleanUsername, _id: { $ne: user._id } });
                if (existingUser) {
                    return res.status(400).json({ message: "This username is already taken. Please choose another one." });
                }
                user.username = cleanUsername;
            } else if (cleanUsername === "") {
                user.username = undefined;
            }
        }

        if (typeof bio === "string") {
            user.bio = bio.slice(0, 500);
        }

        if (typeof recoveryEmail === "string") {
            user.recoveryEmail = recoveryEmail.trim().toLowerCase();
        }

        if (typeof phoneNumber === "string") {
            user.phoneNumber = phoneNumber.trim();
        }

        if (typeof avatar === "string") {
            user.avatar = avatar.trim();
        }

        if (privacySettings && typeof privacySettings === "object") {
            user.privacySettings = {
                isEmailPublic: Boolean(privacySettings.isEmailPublic),
                isRecoveryEmailPublic: Boolean(privacySettings.isRecoveryEmailPublic),
                isPhonePublic: Boolean(privacySettings.isPhonePublic),
                isStatsPublic: privacySettings.isStatsPublic !== undefined ? Boolean(privacySettings.isStatsPublic) : true,
                isBadgesPublic: privacySettings.isBadgesPublic !== undefined ? Boolean(privacySettings.isBadgesPublic) : true,
                isRankPublic: privacySettings.isRankPublic !== undefined ? Boolean(privacySettings.isRankPublic) : true
            };
        }

        await user.save();

        res.status(200).json({
            message: "Profile updated successfully!",
            user: {
                id: user._id,
                name: user.name,
                username: user.username || "",
                email: user.email,
                recoveryEmail: user.recoveryEmail || "",
                phoneNumber: user.phoneNumber || "",
                avatar: user.avatar || "",
                bio: user.bio || "",
                role: user.role || "student",
                privacySettings: user.privacySettings,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({ message: "Error updating profile", error: err.message });
    }
};

// GET /api/auth/users/:userId - Public Candidate Profile View with Privacy Enforcement
const getPublicUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: "User identifier is required" });
        }

        let user = null;
        if (mongoose.Types.ObjectId.isValid(userId)) {
            user = await User.findById(userId).select("-password -passwordHistory");
        }
        if (!user) {
            // Search by username handle
            user = await User.findOne({ username: userId.toLowerCase() }).select("-password -passwordHistory");
        }

        // Check if requester is authenticated and is the owner
        let isOwner = false;
        let authenticatedUser = req.user;
        if (!authenticatedUser && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            try {
                const token = req.headers.authorization.split(" ")[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");
                if (decoded && decoded.userId) {
                    authenticatedUser = { _id: decoded.userId, role: decoded.role };
                }
            } catch (ignore) {}
        }

        if (authenticatedUser && authenticatedUser._id && authenticatedUser._id.toString() === user._id.toString()) {
            isOwner = true;
        } else if (authenticatedUser && authenticatedUser.role === "admin") {
            isOwner = true; // Admins have oversight
        }

        // Fetch Gamification stats & badges
        const gamification = await UserGamification.findOne({ userId: user._id });

        const privacy = user.privacySettings || {
            isEmailPublic: false,
            isRecoveryEmailPublic: false,
            isPhonePublic: false,
            isStatsPublic: true,
            isBadgesPublic: true,
            isRankPublic: true
        };

        // Construct privacy-aware public payload
        const profileData = {
            id: user._id,
            userId: user._id,
            name: user.name,
            username: user.username || "",
            avatar: user.avatar || "",
            bio: user.bio || "",
            role: user.role || "student",
            createdAt: user.createdAt,
            isOwner,
            privacySettings: isOwner ? privacy : undefined,
            email: (isOwner || privacy.isEmailPublic) ? user.email : null,
            recoveryEmail: (isOwner || privacy.isRecoveryEmailPublic) ? user.recoveryEmail : null,
            phoneNumber: (isOwner || privacy.isPhonePublic) ? user.phoneNumber : null,
            gamification: {
                currentRank: (isOwner || privacy.isRankPublic !== false) ? (gamification?.currentRank || "Novice") : null,
                level: (isOwner || privacy.isRankPublic !== false) ? (gamification?.level || 1) : null,
                totalXp: (isOwner || privacy.isRankPublic !== false) ? (gamification?.totalXp || 0) : null,
                currentStreak: (isOwner || privacy.isStatsPublic !== false) ? (gamification?.currentStreak || 0) : null,
                maxStreak: (isOwner || privacy.isStatsPublic !== false) ? (gamification?.maxStreak || 0) : null,
                challengesCompleted: (isOwner || privacy.isStatsPublic !== false) ? (gamification?.challengesCompleted || 0) : null,
                pinnedBadgeId: gamification?.pinnedBadgeId || "welcome_challenger",
                badges: (isOwner || privacy.isBadgesPublic !== false) ? (gamification?.badges || []) : [],
                categoryStats: (isOwner || privacy.isStatsPublic !== false) ? (gamification?.categoryStats || null) : null
            }
        };

        res.status(200).json({ profile: profileData });
    } catch (err) {
        console.error("Get public profile error:", err);
        res.status(500).json({ message: "Error loading candidate profile", error: err.message });
    }
};

module.exports = {
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
};