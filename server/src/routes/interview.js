const express = require("express");
const { protect } = require("../middleware/auth");
const { startInterview, submitAnswer, getInterviews, getInterview, endInterview } = require("../controllers/interviewController");
const router = express.Router();

router.use(protect);

router.post("/start", startInterview);
router.post("/submit-answer", submitAnswer);
router.post("/end", endInterview);
router.get("/", getInterviews);
router.get("/:id", getInterview);

module.exports = router;