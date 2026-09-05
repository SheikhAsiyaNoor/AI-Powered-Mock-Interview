const jwt = require("jsonwebtoken");
const PlatformReview = require("../models/PlatformReview");
const User = require("../models/User");

/**
 * GET /api/reviews
 * Public endpoint for visitors and newcomers to view reviews & stats
 */
const getReviews = async (req, res) => {
    try {
        const reviews = await PlatformReview.find()
            .sort({ createdAt: -1 })
            .lean();

        const totalReviews = reviews.length;
        let averageRating = 0;
        const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        const fractionalBreakdown = {};

        if (totalReviews > 0) {
            const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
            averageRating = Number((sum / totalReviews).toFixed(1));

            reviews.forEach((r) => {
                const val = Number(r.rating || 5);
                const starTier = Math.min(5, Math.max(1, Math.floor(val)));
                starCounts[starTier] = (starCounts[starTier] || 0) + 1;
                fractionalBreakdown[val.toFixed(1)] = (fractionalBreakdown[val.toFixed(1)] || 0) + 1;
            });
        }

        // Check if caller sent a token so we can identify their review
        let userReview = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");
                if (decoded && decoded.userId) {
                    userReview = reviews.find((r) => r.userId && r.userId.toString() === decoded.userId.toString()) || null;
                }
            } catch {
                // Token invalid or expired; continue as guest
            }
        }

        res.status(200).json({
            success: true,
            stats: {
                totalReviews,
                averageRating,
                starCounts,
                fractionalBreakdown
            },
            reviews,
            currentUserReview: userReview
        });
    } catch (err) {
        console.error("Get reviews error:", err);
        res.status(500).json({ message: "Failed to fetch community reviews", error: err.message });
    }
};

/**
 * POST /api/reviews
 * Protected: Registered users only
 */
const createOrUpdateReview = async (req, res) => {
    try {
        const userId = req.userId;
        const user = req.user;

        if (!userId || !user) {
            return res.status(401).json({ message: "You must be signed in to submit a review." });
        }

        const { rating, comment, headline, featureHighlight } = req.body;

        const numRating = Number(rating);
        if (isNaN(numRating) || numRating < 1.0 || numRating > 5.0) {
            return res.status(400).json({ message: "Rating must be a number between 1.0 and 5.0." });
        }

        // Snap to nearest 0.5 increment (e.g., 3.5, 4.0, 4.5, 5.0)
        const roundedRating = Math.round(numRating * 2) / 2;

        if (!comment || typeof comment !== "string" || comment.trim().length < 5) {
            return res.status(400).json({ message: "Please provide a review comment with at least 5 characters." });
        }

        if (comment.trim().length > 1000) {
            return res.status(400).json({ message: "Review comment cannot exceed 1000 characters." });
        }

        let userRole = "Verified Candidate";
        if (user.role === "mentor") userRole = "Verified Mentor";
        else if (user.role === "admin") userRole = "Platform Admin";

        const validFeatures = [
            "Real-Time AI Evaluation",
            "Peer Challenge Arena",
            "Recruiter Simulator",
            "Resume Analysis",
            "Readiness Engine",
            "Overall Platform"
        ];
        const chosenHighlight = validFeatures.includes(featureHighlight) ? featureHighlight : "Overall Platform";

        const reviewData = {
            userId,
            userName: user.name || "Candidate",
            userAvatar: user.avatar || "",
            userRole,
            rating: roundedRating,
            headline: (headline || "").trim().slice(0, 120),
            comment: comment.trim(),
            featureHighlight: chosenHighlight,
            isVerifiedCandidate: true
        };

        const updatedReview = await PlatformReview.findOneAndUpdate(
            { userId },
            { $set: reviewData },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({
            success: true,
            message: "Thank you! Your verified review has been published.",
            review: updatedReview
        });
    } catch (err) {
        console.error("Create or update review error:", err);
        res.status(500).json({ message: "Failed to publish review", error: err.message });
    }
};

/**
 * GET /api/reviews/my
 * Protected: Fetch current user's review
 */
const getMyReview = async (req, res) => {
    try {
        const review = await PlatformReview.findOne({ userId: req.userId });
        res.status(200).json({ success: true, review });
    } catch (err) {
        console.error("Get my review error:", err);
        res.status(500).json({ message: "Failed to retrieve user review" });
    }
};

/**
 * DELETE /api/reviews/:id
 * Protected: Delete user's own review or admin deletion
 */
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await PlatformReview.findById(id);

        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }

        // Only creator or admin can delete
        const isOwner = review.userId && review.userId.toString() === req.userId.toString();
        const isAdmin = req.user && req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "You are not authorized to delete this review." });
        }

        await PlatformReview.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Review removed successfully." });
    } catch (err) {
        console.error("Delete review error:", err);
        res.status(500).json({ message: "Failed to delete review", error: err.message });
    }
};

module.exports = {
    getReviews,
    createOrUpdateReview,
    getMyReview,
    deleteReview
};
