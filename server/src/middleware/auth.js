const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key", (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Invalid token!" });
            }
            req.userId = decoded.userId;
            req.user = { _id: decoded.userId };
            next();
        });
    } else {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }
};

module.exports = { protect };