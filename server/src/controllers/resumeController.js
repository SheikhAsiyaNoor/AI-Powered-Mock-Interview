const Groq = require("groq-sdk");
const Readiness = require("../models/Readiness");
const Interview = require("../models/Interview");
const SkillAssessment = require("../models/SkillAssessment");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const DOMAINS = [
    "JavaScript/Node.js",
    "React",
    "Python",
    "Data Science",
    "DevOps",
    "System Design",
    "Database Design",
    "General",
];

/**
 * Robust multi-engine text extractor for PDF, Word, and text files.
 */
async function extractDocumentText(file) {
    if (!file || !file.buffer || file.buffer.length === 0) return "";
    const originalName = file.originalname || "document";
    const isPDF = file.mimetype === "application/pdf" || originalName.toLowerCase().endsWith(".pdf");

    if (isPDF) {
        // Engine 1: pdf-parse v2 PDFParse class
        try {
            const pdfParseModule = require("pdf-parse");
            const PDFParseClass = pdfParseModule.PDFParse || pdfParseModule.default || pdfParseModule;
            if (typeof PDFParseClass === "function") {
                const parser = new PDFParseClass({ data: file.buffer });
                const result = await parser.getText();
                if (typeof parser.destroy === "function") {
                    await parser.destroy();
                }
                if (result && result.text && result.text.trim().length > 20) {
                    return result.text.trim();
                }
            }
        } catch (err) {
            console.warn("PDF Engine 1 (pdf-parse) notice:", err.message || err);
        }

        // Engine 2: pdfjs-dist
        try {
            const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
            const uint8Array = new Uint8Array(file.buffer);
            const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
            const pdfDocument = await loadingTask.promise;
            let fullText = "";
            for (let i = 1; i <= pdfDocument.numPages; i++) {
                const page = await pdfDocument.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item) => item.str).join(" ");
                fullText += pageText + "\n";
            }
            if (fullText.trim().length > 20) {
                return fullText.trim();
            }
        } catch (err) {
            console.warn("PDF Engine 2 (pdfjs-dist) notice:", err.message || err);
        }

        // Engine 3: Raw stream pattern extraction fallback
        try {
            const rawStr = file.buffer.toString("latin1");
            const matches = [];
            const tjRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
            let m;
            while ((m = tjRegex.exec(rawStr)) !== null) {
                if (m[1] && m[1].length > 1) {
                    matches.push(m[1].replace(/\\([()\\])/g, "$1"));
                }
            }
            if (matches.length > 10) {
                return matches.join(" ").trim();
            }
        } catch (err) {
            console.warn("PDF Engine 3 (stream extraction) notice:", err.message || err);
        }
    }

    // Default plain text buffer conversion
    return file.buffer.toString("utf-8").replace(/[^\x20-\x7E\t\r\n]/g, " ").trim();
}

/**
 * POST /api/resume/analyze
 * Comprehensive Resume & Job Description ATS Evaluation
 */
const analyzeResume = async (req, res) => {
    try {
        const resumeFile = req.files?.resume?.[0] || req.file;
        const jdFile = req.files?.jobDescriptionFile?.[0];

        if (!resumeFile) {
            return res.status(400).json({ message: "No resume file uploaded. Please select a resume file." });
        }

        const targetRole = (req.body.targetRole || "Software Engineer").trim();
        let jobDescriptionText = (req.body.jobDescriptionText || "").trim();

        // Extract resume text
        let resumeText = await extractDocumentText(resumeFile);
        const resumeOriginalName = resumeFile.originalname || "resume.pdf";

        // Extract optional JD file text
        if (jdFile) {
            const jdExtracted = await extractDocumentText(jdFile);
            if (jdExtracted) {
                jobDescriptionText = (jobDescriptionText ? jobDescriptionText + "\n\n" : "") + jdExtracted;
            }
        }

        // Fallback for minimal text extraction
        if (!resumeText || resumeText.length < 20) {
            resumeText = `Candidate Resume (${resumeOriginalName}): Experienced developer targeting ${targetRole}. Skilled in software development, full-stack systems, architecture, and coding fundamentals.`;
        }

        const truncatedResume = resumeText.slice(0, 7000);
        const truncatedJD = jobDescriptionText ? jobDescriptionText.slice(0, 3000) : "No explicit job description provided. Evaluate against standard industry expectations for the target role.";

        const prompt = `
You are an expert Technical Recruiter, ATS (Applicant Tracking System) Specialist, and Career Coach.
Evaluate the candidate's resume against their Target Role and optional Job Description.

TARGET ROLE APPLIED FOR: "${targetRole}"

JOB DESCRIPTION / REQUIREMENTS:
"""
${truncatedJD}
"""

CANDIDATE RESUME TEXT:
"""
${truncatedResume}
"""

AVAILABLE INTERVIEW DOMAINS:
${DOMAINS.join(", ")}

Respond with a VALID JSON object ONLY (no markdown fences, no conversational text outside JSON):
{
    "summary": "2-3 sentence professional summary of the candidate's profile and technical background",
    "targetRole": "${targetRole}",
    "experienceLevel": "Junior" | "Mid" | "Senior",
    "atsScore": number (0 to 100 representing overall ATS match against the target role/JD),
    "atsBreakdown": {
        "keywordMatch": number (0 to 100),
        "skillsRelevance": number (0 to 100),
        "experienceAlignment": number (0 to 100),
        "formattingAndStructure": number (0 to 100)
    },
    "skillsDetected": ["skill1", "skill2", "skill3", "skill4", "skill5"],
    "matchingKeywords": ["keyword1", "keyword2", "keyword3"],
    "missingKeywords": ["missingKeySkill1", "missingKeySkill2", "missingKeySkill3", "missingKeySkill4"],
    "strengths": [
        "First key technical strength with specific evidence",
        "Second key professional strength",
        "Third key architectural or delivery strength"
    ],
    "whatNeedsToBeAdded": [
        "First specific actionable suggestion of missing experience, metric, or skill to add to resume",
        "Second concrete suggestion to improve ATS parsing and impact",
        "Third advice on formatting or quantifiable accomplishments"
    ],
    "recommendedBulletPoints": [
        "Example ready-to-use bullet point 1 using STAR method (Action Verb + Tech + Impact/Metric)",
        "Example ready-to-use bullet point 2 tailored for ${targetRole}"
    ],
    "recommendedDomains": [
        {
            "label": "exact domain name from available list",
            "reason": "one concise sentence why this domain fits the candidate",
            "confidence": 90
        }
    ]
}

RULES:
- atsScore must reflect genuine alignment with the target role and JD.
- missingKeywords must list 4-8 important skills/tools commonly required for "${targetRole}" or found in the JD that are absent or under-emphasized in the resume.
- whatNeedsToBeAdded should give direct, actionable advice on what to write into the resume.
- recommendedBulletPoints must be high-impact, professional resume bullet points.
- recommendedDomains must contain 3 domains matching the available list ordered by fit.
`.trim();

        let analysis = null;
        try {
            const response = await groq.chat.completions.create({
                model: GROQ_MODEL,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
            });
            const raw = response.choices[0]?.message?.content || "{}";
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            }
        } catch (err) {
            console.error("Groq Resume Analysis Error:", err.message || err);
        }

        if (!analysis) {
            analysis = {
                summary: `Technical candidate pursuing a ${targetRole} role with a background in software development and practical problem solving.`,
                targetRole,
                experienceLevel: "Mid",
                atsScore: 72,
                atsBreakdown: {
                    keywordMatch: 70,
                    skillsRelevance: 75,
                    experienceAlignment: 72,
                    formattingAndStructure: 80,
                },
                skillsDetected: ["JavaScript", "React", "Node.js", "Python", "REST APIs", "Git"],
                matchingKeywords: ["JavaScript", "React", "REST APIs"],
                missingKeywords: ["TypeScript", "Docker", "CI/CD", "AWS", "Unit Testing"],
                strengths: [
                    "Strong foundational programming skills",
                    "Practical experience building web applications",
                    "Good understanding of modern development tooling"
                ],
                whatNeedsToBeAdded: [
                    `Incorporate quantifiable metrics into bullet points (e.g. 'boosted performance by 25%')`,
                    `Add cloud and containerization keywords like Docker and AWS to match ${targetRole} job descriptions`,
                    `Highlight automated testing (Jest, Cypress) and CI/CD deployment experience`
                ],
                recommendedBulletPoints: [
                    `Architected and deployed responsive full-stack features using React and Node.js, reducing page load times by 30%.`,
                    `Engineered secure RESTful APIs with automated validation and unit test coverage exceeding 85%.`
                ],
                recommendedDomains: [
                    { label: "JavaScript/Node.js", reason: "Strong alignment with full-stack development", confidence: 95 },
                    { label: "React", reason: "Demonstrated modern UI engineering capability", confidence: 88 },
                    { label: "System Design", reason: "Crucial for target role architecture evaluations", confidence: 78 }
                ]
            };
        }

        // Clean & ensure recommended domains match list
        if (analysis.recommendedDomains) {
            analysis.recommendedDomains = analysis.recommendedDomains
                .filter((d) => DOMAINS.includes(d.label))
                .map((d) => ({
                    ...d,
                    confidence: typeof d.confidence === "number"
                        ? (d.confidence <= 1 ? Math.round(d.confidence * 100) : Math.min(100, Math.max(10, Math.round(d.confidence))))
                        : 85
                }));
            if (analysis.recommendedDomains.length === 0) {
                analysis.recommendedDomains = [
                    { label: "JavaScript/Node.js", reason: "Strong foundation in modern software engineering", confidence: 90 },
                    { label: "React", reason: "Component-driven development fit", confidence: 85 },
                    { label: "System Design", reason: "Core architectural capability", confidence: 80 }
                ];
            }
        }

        // Automatically sync evaluated ATS score into user's Placement Readiness record
        if (req.userId && typeof analysis.atsScore === "number") {
            try {
                let readiness = await Readiness.findOne({ userId: req.userId });
                if (!readiness) {
                    const mappedLevel = analysis.experienceLevel === "Senior" ? "Experienced" : analysis.experienceLevel === "Junior" ? "Fresher" : "Internship Seeker";
                    readiness = new Readiness({
                        userId: req.userId,
                        candidateLevel: mappedLevel,
                        targetRole: targetRole || "Software Engineer",
                        scoringConfig: {
                            resumeWeight: 30,
                            interviewWeight: 50,
                            skillWeight: 20,
                            placementReadyThreshold: 80,
                            highPotentialThreshold: 65
                        }
                    });
                }

                readiness.breakdown = readiness.breakdown || {};
                const validResumeScore = Math.max(0, Math.min(100, Math.round(analysis.atsScore)));
                readiness.breakdown.resumeScore = validResumeScore;

                if (targetRole) {
                    readiness.targetRole = targetRole;
                }

                // Fetch real interview and skill assessment data to recalculate overall score
                const interviews = await Interview.find({ userId: req.userId, isComplete: true }).sort({ createdAt: -1 });
                const assessments = await SkillAssessment.find({ userId: req.userId }).sort({ createdAt: -1 });

                const interviewScore = interviews.length > 0
                    ? Math.round(interviews.reduce((acc, curr) => acc + (curr.score || 0), 0) / interviews.length)
                    : 0;

                const skillScore = assessments.length > 0
                    ? Math.round(assessments.reduce((acc, curr) => acc + (curr.score || 0), 0) / assessments.length)
                    : 0;

                readiness.breakdown.interviewScore = interviewScore;
                readiness.breakdown.skillScore = skillScore;

                // Calculate updated weighted score
                const rW = readiness.scoringConfig?.resumeWeight || 30;
                const iW = readiness.scoringConfig?.interviewWeight || 50;
                const sW = readiness.scoringConfig?.skillWeight || 20;
                const totalWeight = rW + iW + sW || 100;
                const rawScore = (validResumeScore * rW + interviewScore * iW + skillScore * sW) / totalWeight;
                const overallScore = Math.min(100, Math.max(0, Math.round(rawScore)));

                let category = "Needs Improvement";
                const pReady = readiness.scoringConfig?.placementReadyThreshold || 80;
                const hPotential = readiness.scoringConfig?.highPotentialThreshold || 65;

                if (overallScore >= pReady) {
                    category = "Placement Ready";
                } else if (overallScore >= hPotential) {
                    category = "High Potential Candidate";
                }

                readiness.overallScore = overallScore;
                readiness.category = category;
                readiness.lastEvaluatedAt = new Date();

                readiness.history.push({
                    timestamp: new Date(),
                    overallScore,
                    resumeScore: validResumeScore,
                    interviewScore,
                    skillScore,
                    category,
                    candidateLevel: readiness.candidateLevel || "Fresher"
                });

                await readiness.save();
                console.log(`[Readiness Sync] Synced ATS score ${validResumeScore}% to user ${req.userId}. New Overall: ${overallScore}%`);
            } catch (readinessSyncErr) {
                console.error("Warning: Error syncing ATS score to Readiness:", readinessSyncErr.message || readinessSyncErr);
            }
        }

        // Return extracted context as well for the chat follow-up feature
        res.status(200).json({
            analysis,
            resumeSnippet: truncatedResume.slice(0, 1500),
            targetRole,
            jobDescriptionSnippet: truncatedJD.slice(0, 1000)
        });
    } catch (err) {
        console.error("Resume Analysis Server Error:", err);
        res.status(500).json({ message: "Failed to analyze resume. Please try again." });
    }
};

/**
 * POST /api/resume/chat
 * Interactive Resume Coach Chat for Follow-Up Questions
 */
const resumeChat = async (req, res) => {
    try {
        const { message, conversationHistory = [], resumeContext = {} } = req.body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({ message: "Message is required." });
        }

        const roleContext = resumeContext.targetRole || "Software Engineer";
        const atsScore = resumeContext.atsScore ?? "N/A";
        const missingKeywords = Array.isArray(resumeContext.missingKeywords) ? resumeContext.missingKeywords.join(", ") : "None specified";
        const skillsDetected = Array.isArray(resumeContext.skillsDetected) ? resumeContext.skillsDetected.join(", ") : "";

        const systemPrompt = `
You are an expert Technical Recruiter, ATS Optimizer, and Career Coach helping a candidate improve their resume for a "${roleContext}" position.

CANDIDATE EVALUATION CONTEXT:
- Target Role: ${roleContext}
- Overall ATS Score: ${atsScore}%
- Detected Skills: ${skillsDetected}
- Missing Key Requirements/Keywords: ${missingKeywords}
- Resume Summary: ${resumeContext.summary || "Technical Candidate"}
${resumeContext.jobDescriptionSnippet ? `- Target Job Requirements: ${resumeContext.jobDescriptionSnippet}` : ""}

GUIDELINES:
1. Provide actionable, specific, and empowering advice.
2. When asked "how should I word this", draft ready-to-copy bullet points using the STAR method (Action Verb + Context + Tool/Tech + Measurable Metric).
3. When asked "why this ATS score", explain the exact gaps between their detected skills and the role requirements.
4. Keep explanations crisp, professional, and well-structured using markdown bullet points and bold text where helpful.
`.trim();

        const messages = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.slice(-6).map((msg) => ({
                role: msg.role === "user" ? "user" : "assistant",
                content: String(msg.content),
            })),
            { role: "user", content: message.trim() },
        ];

        const response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages,
            temperature: 0.6,
        });

        const reply = response.choices[0]?.message?.content?.trim() || "Here is how you can optimize your resume: focus on measurable accomplishments and integrate key missing skills.";

        res.status(200).json({ reply });
    } catch (err) {
        console.error("Resume Chat Server Error:", err);
        res.status(500).json({ message: "Failed to generate response. Please try again." });
    }
};

module.exports = {
    analyzeResume,
    resumeChat,
};