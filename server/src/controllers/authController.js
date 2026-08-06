const User = require("../models/User");
const jwt = require("jsonwebtoken");

const signToken = (userId) =>
    jwt.sign({ userId }, process.env.JWT_SECRET || "fallback_secret_key", { expiresIn: "7d" });

const isValidEmail = (email) => {
    if (!email || typeof email !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return false;
    const domain = email.split("@")[1]?.toLowerCase();
    return Boolean(domain && domain.includes("."));
};

const checkPasswordStrength = (password) => {
    if (!password || typeof password !== "string") {
        return { isValid: false, message: "Password is required" };
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
        return { isValid: false, message: "Password must contain at least one number or special character." };
    }
    return { isValid: true, message: "Password is strong." };
};

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({ message: "Please provide a valid email address (standard or temporary email)." });
        }

        const pwdCheck = checkPasswordStrength(password);
        if (!pwdCheck.isValid) {
            return res.status(400).json({ message: pwdCheck.message });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "An account with this email already exists!" });
        }

        const user = new User({ name, email: normalizedEmail, password });
        await user.save();

        const token = signToken(user._id.toString());

        res.status(201).json({
            message: "User registered successfully!",
            user: { id: user._id, name: user.name, email: user.email },
            token,
        });
    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ message: "Server error during registration" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email & password must be entered!" });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: "Invalid email or password!" });
        }

        const token = signToken(user._id.toString());

        res.status(200).json({
            message: "Logged in successfully!",
            user: { id: user._id, name: user.name, email: user.email },
            token,
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error during login" });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }
        res.status(200).json({ id: user._id, name: user.name, email: user.email });
    } catch (err) {
        console.error("GetMe error:", err);
        res.status(500).json({ message: "Server error!" });
    }
};

module.exports = { register, login, getMe };