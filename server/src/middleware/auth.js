const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");
            
            const user = await User.findById(decoded.userId).select("-password");
            if (!user) {
                return res.status(401).json({ message: "User belonging to this token no longer exists." });
            }

            // Check if account is locked
            if (user.isLocked()) {
                const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
                return res.status(423).json({
                    message: `Account is temporarily locked. Try again in ${remainingMinutes} minutes.`,
                    locked: true,
                    lockUntil: user.lockUntil
                });
            }

            // Update session lastActive if sessionId present in token or header
            const sessionId = req.headers["x-session-id"] || decoded.sessionId;
            if (sessionId && user.activeSessions && user.activeSessions.length > 0) {
                const session = user.activeSessions.find(s => s.sessionId === sessionId);
                if (session) {
                    session.lastActive = new Date();
                    user.save().catch(err => console.error("Error updating session lastActive:", err));
                }
            }

            req.userId = user._id.toString();
            req.user = user;
            next();
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired token!", error: err.message });
        }
    } else {
        return res.status(401).json({ message: "Access denied. No authentication token provided." });
    }
};

module.exports = { protect };