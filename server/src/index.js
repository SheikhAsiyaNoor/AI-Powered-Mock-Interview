const dns = require("dns");
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const interviewRoutes = require("./routes/interview");
const resumeRoutes = require("./routes/resume");
const readinessRoutes = require("./routes/readiness");
const simulatorRoutes = require("./routes/simulator");
const arenaRoutes = require("./routes/arena");
const mentorRoutes = require("./routes/mentor");
const adminRoutes = require("./routes/admin");
const reviewRoutes = require("./routes/reviewRoutes");

connectDB();
const app = express();

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
        res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-session-id");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Core API Routes
app.use("/api/auth", authRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/readiness", readinessRoutes);
app.use("/api/simulator", simulatorRoutes);

// Gamification, Peer Challenge Arena, Mentorship & RBAC Admin Routes
app.use("/api/arena", arenaRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/admin", adminRoutes);

// Community Reviews & 5-Star Ratings
app.use("/api/reviews", reviewRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("AI-Powered Mock Interview Platform Backend is running with Security, Arena & RBAC!");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://127.0.0.1:${PORT}...`);
});