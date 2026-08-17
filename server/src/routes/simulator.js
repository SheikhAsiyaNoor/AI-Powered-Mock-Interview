const express = require("express");
const { protect } = require("../middleware/auth");
const {
    getCompanies,
    startCompanyInterview,
    submitCompanyAnswer,
    getCompanyInterview
} = require("../controllers/simulatorController");

const router = express.Router();

router.use(protect);

router.get("/companies", getCompanies);
router.post("/start", startCompanyInterview);
router.post("/submit-answer", submitCompanyAnswer);
router.get("/:id", getCompanyInterview);

module.exports = router;
