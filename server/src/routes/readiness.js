const express = require("express");
const { protect } = require("../middleware/auth");
const {
    getReadinessReport,
    recalculateReadiness,
    updateScoringConfig,
    toggleRoadmapItem,
    generateSkillQuiz,
    submitSkillQuiz
} = require("../controllers/readinessController");

const router = express.Router();

router.use(protect);

router.get("/", getReadinessReport);
router.post("/calculate", recalculateReadiness);
router.post("/config", updateScoringConfig);
router.patch("/roadmap-item", toggleRoadmapItem);
router.post("/skill-quiz/generate", generateSkillQuiz);
router.post("/skill-quiz/submit", submitSkillQuiz);

module.exports = router;
