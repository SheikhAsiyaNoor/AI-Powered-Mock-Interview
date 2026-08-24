const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const activeSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true },
    tokenHash: { type: String },
    ip: { type: String, default: "Unknown" },
    userAgent: { type: String, default: "Unknown" },
    device: { type: String, default: "Desktop / Browser" },
    location: { type: String, default: "Local / Verified" },
    createdAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now }
});

const loginHistorySchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    ip: { type: String, default: "Unknown" },
    userAgent: { type: String, default: "Unknown" },
    device: { type: String, default: "Unknown Device" },
    status: {
        type: String,
        enum: ["SUCCESS", "FAILED", "LOCKED", "BLOCKED"],
        required: true
    },
    reason: { type: String, default: "" },
    suspicious: { type: Boolean, default: false }
});

const securityAlertSchema = new mongoose.Schema({
    alertId: { type: String, required: true },
    type: { type: String, required: true }, // e.g. "MULTIPLE_FAILED_LOGINS", "NEW_DEVICE_LOGIN", "ACCOUNT_LOCKED"
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    severity: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },
    resolved: { type: Boolean, default: false }
});

const passwordHistorySchema = new mongoose.Schema({
    hash: { type: String, required: true },
    changedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6, trim: true },
    
    // Role-Based Access Control (RBAC)
    role: {
        type: String,
        enum: ["student", "mentor", "admin"],
        default: "student",
        index: true
    },
    customPermissions: [{ type: String }],

    // Enterprise Security: Email Verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },

    // Enterprise Security: Password Reset
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    // Enterprise Security: Account Lockout
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    // Enterprise Security: Password Policy & History
    passwordChangedAt: { type: Date },
    passwordHistory: [passwordHistorySchema],

    // Enterprise Security: Active Sessions & Login Tracking
    activeSessions: [activeSessionSchema],
    loginHistory: [loginHistorySchema],
    securityAlerts: [securityAlertSchema],

    createdAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
    this.passwordChangedAt = new Date();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is currently locked
userSchema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

module.exports = mongoose.model("User", userSchema);