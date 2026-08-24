const User = require("../models/User");
const Interview = require("../models/Interview");
const ChallengeSubmission = require("../models/ChallengeSubmission");
const MentorReview = require("../models/MentorReview");

// 1. Get Mentor Overview & Stats
const getMentorStats = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: "student" });
        const totalInterviews = await Interview.countDocuments();
        const totalSubmissions = await ChallengeSubmission.countDocuments();
        const totalReviewsGiven = await MentorReview.countDocuments({ mentorId: req.user._id });
        const recentReviews = await MentorReview.find({ mentorId: req.user._id })
            .populate("studentId", "name email")
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            stats: {
                totalStudents,
                totalInterviews,
                totalSubmissions,
                totalReviewsGiven
            },
            recentReviews
        });
    } catch (err) {
        console.error("Mentor stats error:", err);
        res.status(500).json({ message: "Error fetching mentor statistics", error: err.message });
    }
};

// 2. Get Student Submissions / Interviews Queue for Review
const getSubmissionsQueue = async (req, res) => {
    try {
        const { type = "interviews", domain, status } = req.query;

        if (type === "challenges") {
            const submissions = await ChallengeSubmission.find()
                .populate("userId", "name email")
                .populate("challengeId", "title category difficulty type")
                .sort({ createdAt: -1 })
                .limit(30);

            // Fetch reviews for these submissions
            const submissionIds = submissions.map(s => s._id);
            const reviews = await MentorReview.find({ targetId: { $in: submissionIds } });
            const reviewedMap = new Set(reviews.map(r => r.targetId.toString()));

            const formatted = submissions.map(s => ({
                id: s._id,
                student: s.userId ? { id: s.userId._id, name: s.userId.name, email: s.userId.email } : { name: "Unknown" },
                challenge: s.challengeId ? { title: s.challengeId.title, category: s.challengeId.category, difficulty: s.challengeId.difficulty } : { title: "Daily Challenge" },
                score: s.totalScore,
                submittedAt: s.submittedAt,
                isReviewed: reviewedMap.has(s._id.toString()),
                type: "challenge"
            }));

            return res.status(200).json({ items: formatted });
        }

        // Default: Mock Interviews
        const query = {};
        if (domain && domain !== "All") {
            query.domain = domain;
        }

        const interviews = await Interview.find(query)
            .populate("userId", "name email")
            .sort({ date: -1 })
            .limit(30);

        const interviewIds = interviews.map(i => i._id);
        const reviews = await MentorReview.find({ targetId: { $in: interviewIds } });
        const reviewedMap = new Set(reviews.map(r => r.targetId.toString()));

        const formatted = interviews.map(i => ({
            id: i._id,
            student: i.userId ? { id: i.userId._id, name: i.userId.name, email: i.userId.email } : { name: "Candidate" },
            domain: i.domain || i.topic || "General",
            difficulty: i.difficulty || "Medium",
            score: i.score || 0,
            date: i.date,
            duration: i.duration || 15,
            questionsCount: i.questions ? i.questions.length : 0,
            isReviewed: reviewedMap.has(i._id.toString()),
            type: "interview"
        }));

        res.status(200).json({ items: formatted });
    } catch (err) {
        console.error("Submissions queue error:", err);
        res.status(500).json({ message: "Error fetching submissions queue", error: err.message });
    }
};

// 3. Get Specific Interview / Submission Details
const getSubmissionDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const { type = "interview" } = req.query;

        if (type === "challenge") {
            const submission = await ChallengeSubmission.findById(id)
                .populate("userId", "name email")
                .populate("challengeId");

            if (!submission) return res.status(404).json({ message: "Challenge submission not found" });

            const existingReview = await MentorReview.findOne({ targetId: id }).populate("mentorId", "name email");

            return res.status(200).json({
                submission,
                existingReview
            });
        }

        const interview = await Interview.findById(id).populate("userId", "name email");
        if (!interview) return res.status(404).json({ message: "Interview session not found" });

        const existingReview = await MentorReview.findOne({ targetId: id }).populate("mentorId", "name email");

        res.status(200).json({
            interview,
            existingReview
        });
    } catch (err) {
        console.error("Submission detail error:", err);
        res.status(500).json({ message: "Error fetching session details", error: err.message });
    }
};

// 4. Submit or Update Mentor Review
const submitReview = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            studentId,
            targetType = "Interview",
            overallScore,
            ratings,
            qualitativeFeedback,
            keyStrengths,
            areasForImprovement,
            recommendedTopics,
            recommendationStatus
        } = req.body;

        if (!qualitativeFeedback || overallScore === undefined) {
            return res.status(400).json({ message: "Overall score and qualitative feedback are required." });
        }

        const review = await MentorReview.findOneAndUpdate(
            { mentorId: req.user._id, targetId: id },
            {
                mentorId: req.user._id,
                studentId,
                targetType,
                targetId: id,
                overallScore: Number(overallScore),
                ratings: {
                    communication: ratings?.communication || 4,
                    technicalAccuracy: ratings?.technicalAccuracy || 4,
                    problemSolving: ratings?.problemSolving || 4,
                    confidenceAndPresence: ratings?.confidenceAndPresence || 4
                },
                qualitativeFeedback,
                keyStrengths: keyStrengths || [],
                areasForImprovement: areasForImprovement || [],
                recommendedTopics: recommendedTopics || [],
                recommendationStatus: recommendationStatus || "Hire",
                reviewedAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.status(200).json({
            message: "Mentor review submitted successfully!",
            review
        });
    } catch (err) {
        console.error("Submit review error:", err);
        res.status(500).json({ message: "Error submitting mentor review", error: err.message });
    }
};

// 5. Get List of Students for Mentorship
const getStudentsList = async (req, res) => {
    try {
        const students = await User.find({ role: "student" })
            .select("name email createdAt isEmailVerified")
            .sort({ createdAt: -1 })
            .limit(50);

        // Fetch quick interview counts
        const studentIds = students.map(s => s._id);
        const interviews = await Interview.find({ userId: { $in: studentIds } });
        
        const countMap = {};
        const avgScoreMap = {};
        interviews.forEach(i => {
            const uid = i.userId.toString();
            if (!countMap[uid]) {
                countMap[uid] = 0;
                avgScoreMap[uid] = { total: 0, count: 0 };
            }
            countMap[uid]++;
            avgScoreMap[uid].total += (i.score || 0);
            avgScoreMap[uid].count++;
        });

        const formatted = students.map(s => {
            const stats = avgScoreMap[s._id.toString()] || { total: 0, count: 0 };
            const avg = stats.count > 0 ? Math.round(stats.total / stats.count) : 0;
            return {
                id: s._id,
                name: s.name,
                email: s.email,
                joinedAt: s.createdAt,
                interviewsCompleted: countMap[s._id.toString()] || 0,
                avgScore: avg
            };
        });

        res.status(200).json({ students: formatted });
    } catch (err) {
        console.error("Students list error:", err);
        res.status(500).json({ message: "Error fetching students list", error: err.message });
    }
};

module.exports = {
    getMentorStats,
    getSubmissionsQueue,
    getSubmissionDetail,
    submitReview,
    getStudentsList
};
