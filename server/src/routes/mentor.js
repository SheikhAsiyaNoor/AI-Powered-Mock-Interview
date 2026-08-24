const express = require("express");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/rbac");
const {
    getMentorStats,
    getSubmissionsQueue,
    getSubmissionDetail,
    submitReview,
    getStudentsList
} = require("../controllers/mentorController");

const router = express.Router();

// Require authenticated user with mentor or admin role
router.use(protect);
router.use(authorizeRoles("mentor", "admin"));

router.get("/stats", getMentorStats);
router.get("/queue", getSubmissionsQueue);
router.get("/submission/:id", getSubmissionDetail);
router.post("/review/:id", submitReview);
router.get("/students", getStudentsList);

module.exports = router;
