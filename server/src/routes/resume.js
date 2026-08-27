const express = require("express");
const { protect } = require("../middleware/auth");
const multer = require("multer");
const { analyzeResume, resumeChat } = require("../controllers/resumeController");
const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
    fileFilter: (req, file, cb) => {
        const ext = (file.originalname || "").toLowerCase();
        const isAllowedExt = ext.endsWith(".pdf") || ext.endsWith(".doc") || ext.endsWith(".docx") || ext.endsWith(".txt");
        const allowedTypes = [
            "application/pdf",
            "application/x-pdf",
            "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/octet-stream",
        ];
        if (allowedTypes.includes(file.mimetype) || isAllowedExt) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Please upload a PDF, DOC, DOCX, or TXT file."), false);
        }
    },
});

const uploadFields = upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "jobDescriptionFile", maxCount: 1 },
]);

router.post("/analyze", protect, uploadFields, analyzeResume);
router.post("/chat", protect, resumeChat);

module.exports = router;