const Groq = require("groq-sdk");
const mongoose = require("mongoose");
const Readiness = require("../models/Readiness");
const Interview = require("../models/Interview");
const SkillAssessment = require("../models/SkillAssessment");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

// Helper fallback data generator for candidate levels
const getDefaultGapAndRoadmap = (candidateLevel, targetRole, domainScores) => {
    const isFresher = candidateLevel === "Fresher";
    const isIntern = candidateLevel === "Internship Seeker";

    let weakTechnicalAreas = [];
    let communicationGaps = [];
    let missingIndustrySkills = [];
    let roadmap = [];

    if (isFresher) {
        weakTechnicalAreas = [
            {
                topic: "Data Structures & Algorithms",
                severity: "High",
                description: "Basic understanding of arrays, but optimization using dynamic programming and graph traversals needs work.",
                actionItem: "Solve 20 medium-level array and tree problems on Coding Arena/Practice Hub."
            },
            {
                topic: "Database Indexing & SQL Queries",
                severity: "Medium",
                description: "Familiar with simple SELECT queries, but lacks depth in JOINs, indexing, and normalization.",
                actionItem: "Practice complex SQL joins and understand B-Tree indexes."
            }
        ];
        communicationGaps = [
            {
                aspect: "Technical Explanation Clarity",
                observation: "Struggles to structure thoughts when explaining time/space complexity tradeoffs.",
                suggestion: "Use the STAR method (Situation, Task, Action, Result) and state time complexity upfront."
            },
            {
                aspect: "Answer Length & Depth",
                observation: "Responses tend to be concise; needs to elaborate on edge cases.",
                suggestion: "Always mention edge cases like null inputs, empty arrays, or large data loads."
            }
        ];
        missingIndustrySkills = [
            { skill: "Docker & Containerization", importance: "Recommended", reason: "Modern junior roles require basic docker container deployment." },
            { skill: "Git Flow & CI/CD", importance: "Critical", reason: "Team workflows demand pull requests, branching strategies, and basic pipeline awareness." }
        ];
        roadmap = [
            { id: "tech_1", type: "technology", title: "Master TypeScript & ES6+", description: "Learn strong typing, interfaces, async/await, and modern ES6 modules.", priority: "High", estimatedTime: "1 week", completed: false },
            { id: "tech_2", type: "technology", title: "Git & Version Control", description: "Master branching, rebasing, pull requests, and merge conflict resolution.", priority: "High", estimatedTime: "3 days", completed: false },
            { id: "proj_1", type: "project", title: "Build Full-Stack Portfolio App", description: "Develop a CRUD web app with Node.js/React, authentication, and database integration.", priority: "High", estimatedTime: "2 weeks", completed: false },
            { id: "cert_1", type: "certification", title: "Meta Front-End or Back-End Professional Cert", description: "Complete a recognized entry-level developer certification on Coursera/Udemy.", priority: "Medium", estimatedTime: "3 weeks", completed: false },
            { id: "topic_1", type: "topic", title: "Core CS Fundamentals (OS & Networks)", description: "Review HTTP/HTTPS, TCP/IP, process memory, and thread synchronization.", priority: "High", estimatedTime: "1 week", completed: false },
            { id: "topic_2", type: "topic", title: "STAR Method Interview Communication", description: "Practice structuring behavioral & technical answers clearly.", priority: "Medium", estimatedTime: "4 days", completed: false }
        ];
    } else if (isIntern) {
        weakTechnicalAreas = [
            {
                topic: "RESTful API Design & Validation",
                severity: "High",
                description: "Needs practice designing robust error responses, request validation, and status codes.",
                actionItem: "Implement schema validation using Joi or Zod in express routes."
            },
            {
                topic: "Asynchronous JavaScript & Event Loop",
                severity: "Medium",
                description: "Partial comprehension of microtasks vs macrotasks and promise error handling.",
                actionItem: "Study Node.js event loop internals and build an async queue worker."
            }
        ];
        communicationGaps = [
            {
                aspect: "Problem Solving Verbalization",
                observation: "Silent while thinking during code interview questions.",
                suggestion: "Think out loud continuously so interviewers can evaluate your logical thought process."
            }
        ];
        missingIndustrySkills = [
            { skill: "Tailwind CSS & Component Libraries", importance: "Recommended", reason: "Speed up frontend prototyping for team projects." },
            { skill: "REST API Integration & Postman Testing", importance: "Critical", reason: "Crucial for intern day-to-day feature development." }
        ];
        roadmap = [
            { id: "tech_1", type: "technology", title: "State Management (Zustand / Redux)", description: "Understand global state patterns, immutability, and store selectors.", priority: "High", estimatedTime: "4 days", completed: false },
            { id: "proj_1", type: "project", title: "Real-time Chat App or Dashboard", description: "Build a responsive app using WebSockets / Socket.io and Tailwind CSS.", priority: "High", estimatedTime: "10 days", completed: false },
            { id: "cert_1", type: "certification", title: "FreeCodeCamp Responsive Web / JavaScript", description: "Complete hands-on verified algorithm certificates.", priority: "Medium", estimatedTime: "1 week", completed: false },
            { id: "topic_1", type: "topic", title: "Object-Oriented & Functional Design", description: "Practice cleanly separating UI components and API service layers.", priority: "Medium", estimatedTime: "5 days", completed: false }
        ];
    } else {
        // Experienced
        weakTechnicalAreas = [
            {
                topic: "System Design & Microservices Architecture",
                severity: "High",
                description: "Needs deeper grasp of caching strategies (Redis), message queues (Kafka/RabbitMQ), and database partitioning.",
                actionItem: "Design high-scale architectures handling 100k requests/sec."
            },
            {
                topic: "Performance Profiling & Optimization",
                severity: "Medium",
                description: "Identifying memory leaks and query bottlenecks under heavy load.",
                actionItem: "Learn Chrome DevTools performance auditing and database explain plans."
            }
        ];
        communicationGaps = [
            {
                aspect: "Executive Summarization",
                observation: "Spends too much time on granular implementation details before presenting high-level system components.",
                suggestion: "Lead with high-level system diagrams before diving into API protocols and schemas."
            }
        ];
        missingIndustrySkills = [
            { skill: "Kubernetes & Microservices Orchestration", importance: "Critical", reason: "Essential for senior cloud architecture deployments." },
            { skill: "System Architecture & API Gateways", importance: "Critical", reason: "Key for leading technical engineering teams." }
        ];
        roadmap = [
            { id: "tech_1", type: "technology", title: "Redis & Caching Layer Architecture", description: "Implement write-through, read-through, and cache invalidation strategies.", priority: "High", estimatedTime: "1 week", completed: false },
            { id: "tech_2", type: "technology", title: "Docker & Kubernetes Deployment", description: "Setup multi-container pod deployment with helm charts.", priority: "High", estimatedTime: "2 weeks", completed: false },
            { id: "proj_1", type: "project", title: "Distributed Task Queue & Metrics Monitoring", description: "Design a fault-tolerant job processor with Redis, BullMQ, and Grafana dashboard.", priority: "High", estimatedTime: "3 weeks", completed: false },
            { id: "cert_1", type: "certification", title: "AWS Solutions Architect Associate", description: "Validate cloud architecture knowledge across EC2, S3, RDS, and VPCs.", priority: "High", estimatedTime: "4 weeks", completed: false },
            { id: "topic_1", type: "topic", title: "System Design Trade-offs & Scalability", description: "Practice designing URL Shorteners, Rate Limiters, and Distributed Locking.", priority: "High", estimatedTime: "2 weeks", completed: false }
        ];
    }

    return {
        weakTechnicalAreas,
        communicationGaps,
        missingIndustrySkills,
        roadmap
    };
};

// Calculate scores helper
const calculateOverallPlacementScore = (resumeScore, interviewScore, skillScore, config) => {
    const rW = config.resumeWeight || 30;
    const iW = config.interviewWeight || 50;
    const sW = config.skillWeight || 20;

    const totalWeight = rW + iW + sW || 100;
    const rawScore = (resumeScore * rW + interviewScore * iW + skillScore * sW) / totalWeight;
    const overallScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    let category = "Needs Improvement";
    const pReady = config.placementReadyThreshold || 80;
    const hPotential = config.highPotentialThreshold || 65;

    if (overallScore >= pReady) {
        category = "Placement Ready";
    } else if (overallScore >= hPotential) {
        category = "High Potential Candidate";
    } else {
        category = "Needs Improvement";
    }

    return { overallScore, category };
};

// GET /api/readiness - Fetch or compute user readiness report
const getReadinessReport = async (req, res) => {
    try {
        const userId = req.userId;

        // Fetch completed interviews
        const interviews = await Interview.find({ userId, isComplete: true }).sort({ createdAt: -1 });
        
        // Fetch skill assessments
        const assessments = await SkillAssessment.find({ userId }).sort({ createdAt: -1 });

        let readiness = await Readiness.findOne({ userId });
        if (!readiness) {
            readiness = new Readiness({
                userId,
                candidateLevel: req.query.level || "Fresher",
                targetRole: req.query.role || "Software Engineer",
                scoringConfig: {
                    resumeWeight: 30,
                    interviewWeight: 50,
                    skillWeight: 20,
                    placementReadyThreshold: 80,
                    highPotentialThreshold: 65
                }
            });
        }

        if (req.query.level && ["Fresher", "Internship Seeker", "Experienced"].includes(req.query.level)) {
            readiness.candidateLevel = req.query.level;
        }

        // Compute scores
        let interviewScore = 0;
        if (interviews.length > 0) {
            const totalScore = interviews.reduce((acc, curr) => acc + (curr.score || 0), 0);
            interviewScore = Math.round(totalScore / interviews.length);
        } else {
            interviewScore = 65; // Base starting benchmark
        }

        let skillScore = 0;
        if (assessments.length > 0) {
            const totalSkillScore = assessments.reduce((acc, curr) => acc + (curr.score || 0), 0);
            skillScore = Math.round(totalSkillScore / assessments.length);
        } else {
            skillScore = 70; // Base starting benchmark
        }

        const resumeScore = readiness.breakdown.resumeScore || 75; // Baseline resume score

        readiness.breakdown = {
            resumeScore,
            interviewScore,
            skillScore
        };

        const { overallScore, category } = calculateOverallPlacementScore(
            resumeScore,
            interviewScore,
            skillScore,
            readiness.scoringConfig
        );

        readiness.overallScore = overallScore;
        readiness.category = category;

        // Generate or populate Gap Analysis & Roadmap if missing or requested update
        if (!readiness.roadmap || readiness.roadmap.length === 0 || req.query.recalculate === "true") {
            try {
                const prompt = `
                You are a senior AI Career Coach and Tech Lead. Analyze candidate stats and produce a personalized placement readiness report with gap analysis and an actionable roadmap tailored specifically for a "${readiness.candidateLevel}" aiming for a "${readiness.targetRole}" role.
                Candidate Stats:
                - Overall Score: ${overallScore}% (${category})
                - Resume Score: ${resumeScore}%
                - Interview Avg Score: ${interviewScore}% across ${interviews.length} sessions
                - Skill Quiz Score: ${skillScore}% across ${assessments.length} quizzes
                - Target Level: ${readiness.candidateLevel}

                Respond ONLY with JSON format:
                {
                  "weakTechnicalAreas": [
                    { "topic": "string", "severity": "High"|"Medium"|"Low", "description": "string", "actionItem": "string" }
                  ],
                  "communicationGaps": [
                    { "aspect": "string", "observation": "string", "suggestion": "string" }
                  ],
                  "missingIndustrySkills": [
                    { "skill": "string", "importance": "Critical"|"Recommended"|"Optional", "reason": "string" }
                  ],
                  "roadmap": [
                    { "id": "tech_1", "type": "technology"|"project"|"certification"|"topic", "title": "string", "description": "string", "priority": "High"|"Medium"|"Low", "estimatedTime": "string", "completed": false }
                  ]
                }
                Make sure roadmap contains 6 total actionable items (at least 2 technologies, 1 project, 1 certification, 2 interview topics) tuned to ${readiness.candidateLevel}.
                `.trim();

                const response = await groq.chat.completions.create({
                    model: GROQ_MODEL,
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" },
                    temperature: 0.4
                });

                const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
                if (parsed.roadmap && Array.isArray(parsed.roadmap) && parsed.roadmap.length > 0) {
                    readiness.gapAnalysis = {
                        weakTechnicalAreas: parsed.weakTechnicalAreas || [],
                        communicationGaps: parsed.communicationGaps || [],
                        missingIndustrySkills: parsed.missingIndustrySkills || []
                    };
                    readiness.roadmap = parsed.roadmap.map((item, idx) => {
                        let t = (item.type || "topic").toLowerCase();
                        if (t.includes("tech")) t = "technology";
                        else if (t.includes("proj")) t = "project";
                        else if (t.includes("cert")) t = "certification";
                        else t = "topic";

                        return {
                            id: item.id || `item_${idx + 1}`,
                            type: t,
                            title: item.title || "Skill Milestone",
                            description: item.description || "",
                            priority: item.priority || "Medium",
                            estimatedTime: item.estimatedTime || "1 week",
                            completed: Boolean(item.completed)
                        };
                    });
                } else {
                    const defaultData = getDefaultGapAndRoadmap(readiness.candidateLevel, readiness.targetRole, { interviewScore, skillScore });
                    readiness.gapAnalysis = {
                        weakTechnicalAreas: defaultData.weakTechnicalAreas,
                        communicationGaps: defaultData.communicationGaps,
                        missingIndustrySkills: defaultData.missingIndustrySkills
                    };
                    readiness.roadmap = defaultData.roadmap;
                }
            } catch (aiErr) {
                console.error("Groq AI Readiness Error:", aiErr.message || aiErr);
                const defaultData = getDefaultGapAndRoadmap(readiness.candidateLevel, readiness.targetRole, { interviewScore, skillScore });
                readiness.gapAnalysis = {
                    weakTechnicalAreas: defaultData.weakTechnicalAreas,
                    communicationGaps: defaultData.communicationGaps,
                    missingIndustrySkills: defaultData.missingIndustrySkills
                };
                readiness.roadmap = defaultData.roadmap;
            }
        }

        // Manage history tracking
        const lastSnapshot = readiness.history[readiness.history.length - 1];
        const shouldAddSnapshot = !lastSnapshot || 
            lastSnapshot.overallScore !== overallScore || 
            lastSnapshot.candidateLevel !== readiness.candidateLevel ||
            (Date.now() - new Date(lastSnapshot.timestamp).getTime()) > 86400000; // 24 hours

        if (shouldAddSnapshot) {
            readiness.history.push({
                timestamp: new Date(),
                overallScore,
                resumeScore,
                interviewScore,
                skillScore,
                category,
                candidateLevel: readiness.candidateLevel
            });
        }

        readiness.lastEvaluatedAt = new Date();
        try {
            await readiness.save();
        } catch (saveErr) {
            console.error("Warning: Failed to persist readiness report to DB:", saveErr.message || saveErr);
        }

        res.json({ readiness, interviewCount: interviews.length, assessmentCount: assessments.length });
    } catch (err) {
        console.error("Error fetching readiness report:", err);
        const defaultData = getDefaultGapAndRoadmap("Fresher", "Software Engineer", { interviewScore: 65, skillScore: 70 });
        const fallbackReport = {
            candidateLevel: "Fresher",
            targetRole: "Software Engineer",
            overallScore: 69,
            category: "High Potential Candidate",
            breakdown: { resumeScore: 75, interviewScore: 65, skillScore: 70 },
            scoringConfig: { resumeWeight: 30, interviewWeight: 50, skillWeight: 20, placementReadyThreshold: 80, highPotentialThreshold: 65 },
            gapAnalysis: {
                weakTechnicalAreas: defaultData.weakTechnicalAreas,
                communicationGaps: defaultData.communicationGaps,
                missingIndustrySkills: defaultData.missingIndustrySkills
            },
            roadmap: defaultData.roadmap,
            history: [{
                timestamp: new Date(),
                overallScore: 69,
                resumeScore: 75,
                interviewScore: 65,
                skillScore: 70,
                category: "High Potential Candidate",
                candidateLevel: "Fresher"
            }],
            lastEvaluatedAt: new Date()
        };
        res.json({ readiness: fallbackReport, interviewCount: 0, assessmentCount: 0 });
    }
};

// POST /api/readiness/calculate - Recalculate with updated level or params
const recalculateReadiness = async (req, res) => {
    try {
        const userId = req.userId;
        const { candidateLevel, targetRole } = req.body;

        let readiness = await Readiness.findOne({ userId });
        if (!readiness) {
            readiness = new Readiness({ userId });
        }

        if (candidateLevel && ["Fresher", "Internship Seeker", "Experienced"].includes(candidateLevel)) {
            readiness.candidateLevel = candidateLevel;
            req.query.level = candidateLevel;
        }
        if (targetRole) {
            readiness.targetRole = targetRole;
            req.query.role = targetRole;
        }
        await readiness.save();

        // Force reload roadmap via query trigger
        req.query.recalculate = "true";
        return getReadinessReport(req, res);
    } catch (err) {
        console.error("Error recalculating readiness:", err);
        res.status(500).json({ message: "Failed to recalculate readiness" });
    }
};

// POST /api/readiness/config - Update configurable scoring rules
const updateScoringConfig = async (req, res) => {
    try {
        const userId = req.userId;
        const { resumeWeight, interviewWeight, skillWeight, placementReadyThreshold, highPotentialThreshold } = req.body;

        let readiness = await Readiness.findOne({ userId });
        if (!readiness) {
            readiness = new Readiness({ userId });
        }

        readiness.scoringConfig = {
            resumeWeight: Number(resumeWeight) || 30,
            interviewWeight: Number(interviewWeight) || 50,
            skillWeight: Number(skillWeight) || 20,
            placementReadyThreshold: Number(placementReadyThreshold) || 80,
            highPotentialThreshold: Number(highPotentialThreshold) || 65
        };

        const { overallScore, category } = calculateOverallPlacementScore(
            readiness.breakdown.resumeScore || 75,
            readiness.breakdown.interviewScore || 65,
            readiness.breakdown.skillScore || 70,
            readiness.scoringConfig
        );

        readiness.overallScore = overallScore;
        readiness.category = category;

        readiness.history.push({
            timestamp: new Date(),
            overallScore,
            resumeScore: readiness.breakdown.resumeScore || 75,
            interviewScore: readiness.breakdown.interviewScore || 65,
            skillScore: readiness.breakdown.skillScore || 70,
            category,
            candidateLevel: readiness.candidateLevel
        });

        await readiness.save();
        res.json({ message: "Scoring configuration updated successfully", readiness });
    } catch (err) {
        console.error("Error updating scoring config:", err);
        res.status(500).json({ message: "Failed to update scoring configuration" });
    }
};

// PATCH /api/readiness/roadmap-item - Toggle completed status of roadmap item
const toggleRoadmapItem = async (req, res) => {
    try {
        const userId = req.userId;
        const { itemId, completed } = req.body;

        const readiness = await Readiness.findOne({ userId });
        if (!readiness) {
            return res.status(404).json({ message: "Readiness profile not found" });
        }

        const item = readiness.roadmap.find((r) => r.id === itemId || r._id.toString() === itemId);
        if (!item) {
            return res.status(404).json({ message: "Roadmap item not found" });
        }

        item.completed = completed !== undefined ? completed : !item.completed;
        if (item.completed) {
            item.completedAt = new Date();
        }

        await readiness.save();
        res.json({ message: "Roadmap item status updated", roadmap: readiness.roadmap });
    } catch (err) {
        console.error("Error toggling roadmap item:", err);
        res.status(500).json({ message: "Failed to update roadmap item" });
    }
};

// POST /api/readiness/skill-quiz/generate - Generate 5 diagnostic questions for domain
const generateSkillQuiz = async (req, res) => {
    try {
        const { domain = "JavaScript/Node.js", candidateLevel = "Fresher" } = req.body;

        const prompt = `
        Generate a 5-question technical diagnostic assessment quiz for candidate level "${candidateLevel}" in the domain "${domain}".
        Respond ONLY in JSON format matching this structure:
        {
          "domain": "${domain}",
          "questions": [
            {
              "id": "q1",
              "question": "Clear technical question text",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctOptionIndex": 0,
              "explanation": "Brief explanation of why this answer is correct."
            }
          ]
        }
        Ensure exact 5 questions, clear distractors, and accurate index (0-3).
        `.trim();

        let quizData = null;
        try {
            const response = await groq.chat.completions.create({
                model: GROQ_MODEL,
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.5
            });
            quizData = JSON.parse(response.choices[0]?.message?.content || "{}");
        } catch (groqErr) {
            console.error("Groq Skill Quiz Gen Error:", groqErr.message || groqErr);
        }

        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            // Fallback default quiz
            quizData = {
                domain,
                questions: [
                    {
                        id: "q1",
                        question: `Which of the following best describes asynchronous execution in ${domain}?`,
                        options: [
                            "Non-blocking I/O operations managed by an event loop",
                            "Multithreaded execution using OS process forks",
                            "Synchronous step-by-step code execution",
                            "Automatic memory garbage collection"
                        ],
                        correctOptionIndex: 0,
                        explanation: `${domain} uses non-blocking I/O and an event loop to process asynchronous callbacks efficiently.`
                    },
                    {
                        id: "q2",
                        question: "What is the primary benefit of using indexing in database queries?",
                        options: [
                            "Reduces disk space required by tables",
                            "Significantly speeds up data retrieval SELECT queries",
                            "Ensures automatic data encryption at rest",
                            "Prevents SQL injection vulnerabilities"
                        ],
                        correctOptionIndex: 1,
                        explanation: "Database indexes allow B-Tree lookups, reducing query search complexity from O(N) scan to O(log N)."
                    },
                    {
                        id: "q3",
                        question: "What does the HTTP 401 status code signify?",
                        options: [
                            "Internal Server Error",
                            "Resource Not Found",
                            "Unauthorized access / Authentication required",
                            "Bad Request payload syntax"
                        ],
                        correctOptionIndex: 2,
                        explanation: "401 Unauthorized indicates that the request lacks valid authentication credentials."
                    },
                    {
                        id: "q4",
                        question: "What is time complexity of searching an element in a balanced Binary Search Tree (BST)?",
                        options: [
                            "O(1)",
                            "O(log N)",
                            "O(N)",
                            "O(N log N)"
                        ],
                        correctOptionIndex: 1,
                        explanation: "In a balanced BST, tree height is log N, making search complexity O(log N)."
                    },
                    {
                        id: "q5",
                        question: "In RESTful API design, which HTTP method is typically idempotent for replacing a target resource?",
                        options: [
                            "POST",
                            "PUT",
                            "PATCH",
                            "CONNECT"
                        ],
                        correctOptionIndex: 1,
                        explanation: "PUT replaces the resource entirely and is idempotent (repeated requests yield identical server state)."
                    }
                ]
            };
        }

        res.json({ quiz: quizData });
    } catch (err) {
        console.error("Error generating skill quiz:", err);
        res.status(500).json({ message: "Failed to generate skill assessment quiz" });
    }
};

// POST /api/readiness/skill-quiz/submit - Submit quiz answers & update score
const submitSkillQuiz = async (req, res) => {
    try {
        const userId = req.userId;
        const { domain, candidateLevel, answers } = req.body; // answers: [{ id, selectedIndex, correctIndex }]

        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ message: "Invalid answers array provided" });
        }

        let correctCount = 0;
        const questionsEvaluated = answers.map((a) => {
            const isCorrect = a.selectedIndex === a.correctIndex;
            if (isCorrect) correctCount++;
            return {
                id: a.id,
                question: a.question || "Diagnostic Question",
                options: a.options || [],
                correctOptionIndex: a.correctIndex,
                explanation: a.explanation || "",
                userSelectedIndex: a.selectedIndex,
                isCorrect
            };
        });

        const totalQuestions = answers.length;
        const score = Math.round((correctCount / totalQuestions) * 100);

        const assessment = await SkillAssessment.create({
            userId,
            domain: domain || "General",
            candidateLevel: candidateLevel || "Fresher",
            score,
            totalQuestions,
            correctAnswers: correctCount,
            questions: questionsEvaluated
        });

        // Trigger readiness update
        req.query.recalculate = "true";
        let readiness = await Readiness.findOne({ userId });
        if (readiness) {
            // Update skill breakdown score
            const allAssessments = await SkillAssessment.find({ userId });
            const avgSkillScore = Math.round(allAssessments.reduce((acc, c) => acc + c.score, 0) / allAssessments.length);
            
            readiness.breakdown.skillScore = avgSkillScore;

            const { overallScore, category } = calculateOverallPlacementScore(
                readiness.breakdown.resumeScore || 75,
                readiness.breakdown.interviewScore || 65,
                avgSkillScore,
                readiness.scoringConfig
            );

            readiness.overallScore = overallScore;
            readiness.category = category;

            readiness.history.push({
                timestamp: new Date(),
                overallScore,
                resumeScore: readiness.breakdown.resumeScore || 75,
                interviewScore: readiness.breakdown.interviewScore || 65,
                skillScore: avgSkillScore,
                category,
                candidateLevel: readiness.candidateLevel
            });

            await readiness.save();
        }

        res.json({
            assessment,
            score,
            correctCount,
            totalQuestions,
            message: `Quiz completed! Score: ${score}% (${correctCount}/${totalQuestions} correct)`
        });
    } catch (err) {
        console.error("Error submitting skill quiz:", err);
        res.status(500).json({ message: "Failed to submit skill assessment" });
    }
};

module.exports = {
    getReadinessReport,
    recalculateReadiness,
    updateScoringConfig,
    toggleRoadmapItem,
    generateSkillQuiz,
    submitSkillQuiz
};
