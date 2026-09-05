const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
    getReviews,
    createOrUpdateReview,
    getMyReview,
    deleteReview
} = require("../controllers/reviewController");

// Public: Visitors and newcomers can browse community reviews
router.get("/", getReviews);

// Protected: Only logged-in registered candidates can post, edit, or delete reviews
router.post("/", protect, createOrUpdateReview);
router.get("/my", protect, getMyReview);
router.delete("/:id", protect, deleteReview);

module.exports = router;
