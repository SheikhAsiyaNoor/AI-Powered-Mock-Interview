const Groq = require("groq-sdk");
const PeerChallenge = require("../models/PeerChallenge");
const ChallengeSubmission = require("../models/ChallengeSubmission");
const UserGamification = require("../models/UserGamification");
const User = require("../models/User");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "dummy_key_for_fallback",
});

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// Rank Tier Thresholds
const calculateRankTier = (xp) => {
    if (xp >= 8000) return { rank: "Grandmaster", level: Math.floor(xp / 1000) + 1 };
    if (xp >= 5000) return { rank: "Diamond", level: Math.floor(xp / 800) + 1 };
    if (xp >= 3000) return { rank: "Platinum", level: Math.floor(xp / 600) + 1 };
    if (xp >= 1500) return { rank: "Gold", level: Math.floor(xp / 400) + 1 };
    if (xp >= 800) return { rank: "Silver", level: Math.floor(xp / 250) + 1 };
    if (xp >= 300) return { rank: "Bronze", level: Math.floor(xp / 150) + 1 };
    return { rank: "Novice", level: 1 };
};

// Seed Challenges Template
const SEED_CHALLENGES = [
    {
        title: "Daily Tech Clash: LRU Cache & Async Concurrency",
        description: "Design an optimal Least Recently Used (LRU) Cache and resolve race conditions in high-throughput Node.js worker pools.",
        type: "daily",
        category: "Technical",
        domain: "Data Structures & Systems",
        difficulty: "Medium",
        timeLimitMinutes: 15,
        totalPoints: 100,
        xpReward: 150,
        questions: [
            {
                questionId: "q_tech_1",
                questionText: "How would you implement an LRU Cache with O(1) time complexity for both get() and put() operations? Explain the underlying data structures and edge case handling.",
                type: "open-ended",
                rubric: { clarityWeight: 25, technicalDepthWeight: 50, problemSolvingWeight: 25 },
                points: 50
            },
            {
                questionId: "q_tech_2",
                questionText: "In a multi-threaded or distributed environment, how do you prevent race conditions when two concurrent requests mutate the same cache key simultaneously?",
                type: "situational",
                rubric: { clarityWeight: 25, technicalDepthWeight: 45, problemSolvingWeight: 30 },
                points: 50
            }
        ]
    },
    {
        title: "Daily Behavioral Duel: Conflicting Deadlines & Leadership",
        description: "Demonstrate emotional intelligence and the STAR framework when handling critical production roadblocks and team disagreements.",
        type: "daily",
        category: "HR",
        domain: "Behavioral & STAR",
        difficulty: "Medium",
        timeLimitMinutes: 12,
        totalPoints: 100,
        xpReward: 150,
        questions: [
            {
                questionId: "q_hr_1",
                questionText: "Describe a situation where a key stakeholder asked for an urgent feature 2 days before a scheduled release. How did you negotiate priorities and communicate trade-offs using the STAR method?",
                type: "situational",
                rubric: { clarityWeight: 35, technicalDepthWeight: 30, problemSolvingWeight: 35 },
                points: 50
            },
            {
                questionId: "q_hr_2",
                questionText: "Tell me about a time you strongly disagreed with a senior engineer's architectural decision. How did you present your counter-arguments constructively without damaging team harmony?",
                type: "open-ended",
                rubric: { clarityWeight: 30, technicalDepthWeight: 35, problemSolvingWeight: 35 },
                points: 50
            }
        ]
    },
    {
        title: "Daily Aptitude Sprint: Probability & Logic Puzzle",
        description: "Test your mathematical deduction, Bayes theorem application, and rapid analytical reasoning under time pressure.",
        type: "daily",
        category: "Aptitude",
        domain: "Logic & Quant",
        difficulty: "Easy",
        timeLimitMinutes: 10,
        totalPoints: 100,
        xpReward: 120,
        questions: [
            {
                questionId: "q_apt_1",
                questionText: "You have 20 blue balls and 14 red balls in a bag. What is the minimum number of balls you must draw without looking to guarantee at least one pair of matching color balls?",
                type: "open-ended",
                rubric: { clarityWeight: 20, technicalDepthWeight: 40, problemSolvingWeight: 40 },
                points: 50
            },
            {
                questionId: "q_apt_2",
                questionText: "A server has a 99% uptime reliability. If 3 independent redundant servers are configured in parallel, what is the probability that at least one server remains online?",
                type: "open-ended",
                rubric: { clarityWeight: 20, technicalDepthWeight: 40, problemSolvingWeight: 40 },
                points: 50
            }
        ]
    },
    {
        title: "Weekly Grand Tournament: Full-Stack Microservices Architecture",
        description: "Design a fault-tolerant payment gateway with idempotent webhooks, distributed saga orchestration, and fallback caching.",
        type: "weekly",
        category: "Domain-Specific",
        domain: "Backend Architecture",
        difficulty: "Hard",
        timeLimitMinutes: 25,
        totalPoints: 200,
        xpReward: 350,
        questions: [
            {
                questionId: "q_dom_1",
                questionText: "How would you design an Idempotent Payment Webhook processing system to guarantee that external gateway retries never double-charge or double-credit a user account?",
                type: "open-ended",
                rubric: { clarityWeight: 25, technicalDepthWeight: 45, problemSolvingWeight: 30 },
                points: 100
            },
            {
                questionId: "q_dom_2",
                questionText: "Explain the Saga Pattern (Orchestration vs Choreography) in the context of an e-commerce checkout involving inventory reservation, payment authorization, and shipping dispatch. How do you handle compensating transactions when payment fails?",
                type: "situational",
                rubric: { clarityWeight: 25, technicalDepthWeight: 45, problemSolvingWeight: 30 },
                points: 100
            }
        ]
    }
];

// Helper: Ensure Seed Challenges exist
const ensureActiveChallenges = async () => {
    const count = await PeerChallenge.countDocuments({ isActive: true });
    if (count < 4) {
        const now = new Date();
        const endDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const endWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        for (const item of SEED_CHALLENGES) {
            const existing = await PeerChallenge.findOne({ title: item.title });
            if (!existing) {
                await PeerChallenge.create({
                    ...item,
                    startDate: now,
                    endDate: item.type === "weekly" ? endWeek : endDay,
                    isActive: true
                });
            }
        }
    }
};

// 1. GET /api/arena/challenges (List Active Challenges with User Status)
const getChallenges = async (req, res) => {
    try {
        await ensureActiveChallenges();

        const { category, type } = req.query;
        const query = { isActive: true };

        if (category && category !== "All") {
            query.category = category;
        }
        if (type && type !== "All") {
            query.type = type;
        }

        const challenges = await PeerChallenge.find(query).sort({ type: 1, createdAt: -1 });

        // Check which challenges the authenticated user has already submitted
        let userSubmissions = [];
        if (req.user?._id) {
            userSubmissions = await ChallengeSubmission.find({ userId: req.user._id }).select("challengeId totalScore submittedAt");
        }

        const submissionMap = {};
        userSubmissions.forEach(sub => {
            submissionMap[sub.challengeId.toString()] = {
                score: sub.totalScore,
                submittedAt: sub.submittedAt
            };
        });

        const formatted = challenges.map(c => {
            const userSub = submissionMap[c._id.toString()];
            return {
                id: c._id,
                title: c.title,
                description: c.description,
                type: c.type,
                category: c.category,
                domain: c.domain,
                difficulty: c.difficulty,
                timeLimitMinutes: c.timeLimitMinutes,
                startDate: c.startDate,
                endDate: c.endDate,
                totalPoints: c.totalPoints,
                xpReward: c.xpReward,
                participantsCount: c.participantsCount,
                questionsCount: c.questions.length,
                isCompleted: !!userSub,
                userScore: userSub ? userSub.score : null
            };
        });

        res.status(200).json({ challenges: formatted });
    } catch (err) {
        console.error("Get challenges error:", err);
        res.status(500).json({ message: "Error fetching arena challenges", error: err.message });
    }
};

// 2. GET /api/arena/challenges/:id (Get Single Challenge Detail)
const getChallengeById = async (req, res) => {
    try {
        const { id } = req.params;
        const challenge = await PeerChallenge.findById(id);

        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }

        let userSubmission = null;
        if (req.user?._id) {
            userSubmission = await ChallengeSubmission.findOne({
                challengeId: id,
                userId: req.user._id
            });
        }

        // Don't expose sample answers or rubrics if candidate hasn't completed
        const sanitizedQuestions = challenge.questions.map(q => ({
            questionId: q.questionId,
            questionText: q.questionText,
            type: q.type,
            options: q.options,
            points: q.points
        }));

        res.status(200).json({
            challenge: {
                id: challenge._id,
                title: challenge.title,
                description: challenge.description,
                type: challenge.type,
                category: challenge.category,
                domain: challenge.domain,
                difficulty: challenge.difficulty,
                timeLimitMinutes: challenge.timeLimitMinutes,
                startDate: challenge.startDate,
                endDate: challenge.endDate,
                totalPoints: challenge.totalPoints,
                xpReward: challenge.xpReward,
                questions: sanitizedQuestions
            },
            isCompleted: !!userSubmission,
            userSubmission
        });
    } catch (err) {
        console.error("Get challenge by id error:", err);
        res.status(500).json({ message: "Error fetching challenge details", error: err.message });
    }
};

// 3. POST /api/arena/challenges/:id/submit (AI Rubric Scoring & Gamification Update)
const submitChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const { answers = [], timeSpentSeconds = 0 } = req.body;
        const userId = req.user._id;

        const challenge = await PeerChallenge.findById(id);
        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }

        // Check if user already submitted
        const existing = await ChallengeSubmission.findOne({ challengeId: id, userId });
        if (existing) {
            return res.status(400).json({
                message: "You have already completed this challenge! Check your leaderboard standing.",
                submission: existing
            });
        }

        // AI-Powered Rubric Evaluation for each answer
        const evaluatedAnswers = [];
        let totalScoreSum = 0;

        for (const q of challenge.questions) {
            const submittedAns = answers.find(a => a.questionId === q.questionId) || { answer: "" };
            const candidateText = submittedAns.answer || "";

            let clarityScore = 80;
            let depthScore = 75;
            let problemSolvingScore = 80;
            let questionScore = 78;
            let feedback = "Good explanation with reasonable structure.";
            let strengths = ["Clear presentation", "Relevant response"];
            let improvements = ["Could elaborate more on edge cases"];

            if (candidateText.trim().length > 10 && process.env.GROQ_API_KEY) {
                try {
                    const prompt = `You are a strict, top-tier FAANG/Fortune 500 Technical & Behavioral Interviewer evaluating a candidate's answer for the Peer Challenge Arena.

Category: ${challenge.category}
Question: "${q.questionText}"
Question Type: ${q.type}
Candidate Answer: "${candidateText}"

Evaluate the answer based on:
1. Clarity & Structure (0-100)
2. Technical Depth / Relevance / STAR Method precision (0-100)
3. Problem Solving & Edge Case Handling (0-100)

Return ONLY valid JSON in this exact structure without markdown or explanation:
{
  "clarity": 85,
  "technicalDepth": 80,
  "problemSolving": 82,
  "overallScore": 82,
  "feedback": "Constructive 1-2 sentence feedback explaining what was good and what could be sharper.",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement suggestion 1"]
}`;

                    const completion = await groq.chat.completions.create({
                        model: GROQ_MODEL,
                        messages: [{ role: "user", content: prompt }],
                        temperature: 0.2,
                        max_tokens: 350
                    });

                    const rawText = completion.choices[0]?.message?.content || "";
                    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        clarityScore = Math.min(100, Math.max(0, Number(parsed.clarity) || 75));
                        depthScore = Math.min(100, Math.max(0, Number(parsed.technicalDepth) || 75));
                        problemSolvingScore = Math.min(100, Math.max(0, Number(parsed.problemSolving) || 75));
                        questionScore = Math.min(100, Math.max(0, Number(parsed.overallScore) || Math.round((clarityScore + depthScore + problemSolvingScore) / 3)));
                        feedback = parsed.feedback || feedback;
                        strengths = parsed.strengths || strengths;
                        improvements = parsed.improvements || improvements;
                    }
                } catch (aiErr) {
                    console.error("AI Evaluation error on arena submit:", aiErr.message || aiErr);
                    // Fallback heuristic scoring if Groq is busy
                    const lengthBonus = Math.min(20, Math.floor(candidateText.length / 30));
                    questionScore = Math.min(95, 70 + lengthBonus);
                }
            } else if (candidateText.trim().length <= 10) {
                questionScore = 20;
                clarityScore = 20;
                depthScore = 20;
                problemSolvingScore = 20;
                feedback = "Answer is too brief or incomplete to demonstrate required depth.";
                strengths = ["Attempted question"];
                improvements = ["Provide detailed explanations and structured examples."];
            }

            evaluatedAnswers.push({
                questionId: q.questionId,
                questionText: q.questionText,
                candidateAnswer: candidateText,
                score: questionScore,
                feedback,
                criteriaScores: {
                    clarity: clarityScore,
                    technicalDepth: depthScore,
                    problemSolving: problemSolvingScore
                },
                strengths,
                improvements
            });

            totalScoreSum += questionScore;
        }

        const finalAggregatedScore = Math.round(totalScoreSum / (challenge.questions.length || 1));
        const xpEarned = Math.round((challenge.xpReward || 150) * (finalAggregatedScore / 100));
        const pointsEarned = Math.round((challenge.totalPoints || 100) * (finalAggregatedScore / 100));

        // Create ChallengeSubmission record
        const submission = new ChallengeSubmission({
            userId,
            challengeId: id,
            category: challenge.category,
            answers: evaluatedAnswers,
            totalScore: finalAggregatedScore,
            pointsEarned,
            xpEarned,
            timeSpentSeconds,
            feedbackSummary: `Completed ${challenge.title} with a score of ${finalAggregatedScore}%.`,
            submittedAt: new Date()
        });

        await submission.save();

        // Increment participants count on challenge
        challenge.participantsCount = (challenge.participantsCount || 0) + 1;
        await challenge.save();

        // Update User Gamification (XP, Rank, Streak, Badges, Category Stats)
        let gamification = await UserGamification.findOne({ userId });
        if (!gamification) {
            gamification = new UserGamification({ userId });
        }

        // Streak Calculation
        const now = new Date();
        const lastActive = gamification.lastActiveDate ? new Date(gamification.lastActiveDate) : null;
        let newStreak = gamification.currentStreak || 0;

        if (lastActive) {
            const diffHours = Math.abs(now - lastActive) / 36e5;
            if (diffHours >= 20 && diffHours <= 48) {
                // Completed next day
                newStreak += 1;
            } else if (diffHours > 48) {
                // Streak broken
                newStreak = 1;
            } else if (newStreak === 0) {
                newStreak = 1;
            }
        } else {
            newStreak = 1;
        }

        gamification.currentStreak = newStreak;
        gamification.maxStreak = Math.max(gamification.maxStreak || 0, newStreak);
        gamification.lastActiveDate = now;
        gamification.totalXp = (gamification.totalXp || 0) + xpEarned;
        gamification.challengesCompleted = (gamification.challengesCompleted || 0) + 1;

        // Update Category Stats
        const catKey = challenge.category === "Domain-Specific" ? "DomainSpecific" : challenge.category;
        if (gamification.categoryStats && gamification.categoryStats[catKey]) {
            gamification.categoryStats[catKey].completed = (gamification.categoryStats[catKey].completed || 0) + 1;
            gamification.categoryStats[catKey].totalScore = (gamification.categoryStats[catKey].totalScore || 0) + finalAggregatedScore;
        }

        // Update Rank & Level
        const { rank, level } = calculateRankTier(gamification.totalXp);
        gamification.currentRank = rank;
        gamification.level = level;

        // Badge Unlocking Logic
        const unlockedBadges = [];
        const existingBadgeIds = new Set((gamification.badges || []).map(b => b.badgeId));

        const awardBadge = (badgeId, name, description, icon, category = "General") => {
            if (!existingBadgeIds.has(badgeId)) {
                const b = { badgeId, name, description, icon, category, unlockedAt: new Date() };
                gamification.badges.push(b);
                unlockedBadges.push(b);
            }
        };

        if (gamification.challengesCompleted >= 1) {
            awardBadge("first_blood", "First Arena Battle", "Completed your very first AI challenge", "🎯");
        }
        if (gamification.challengesCompleted >= 5) {
            awardBadge("challenger_5", "Seasoned Duelist", "Completed 5 mock challenges", "⚔️");
        }
        if (newStreak >= 3) {
            awardBadge("streak_3", "3-Day Fire Streak", "Maintained a 3-day interview practice streak", "🔥");
        }
        if (newStreak >= 7) {
            awardBadge("streak_7", "Weekly Ironclad", "Maintained a 7-day challenge streak", "⚡");
        }
        if (finalAggregatedScore >= 95) {
            awardBadge("perfect_centurion", "Perfectionist", "Scored 95%+ on a competitive challenge", "👑");
        }
        if (challenge.category === "Technical" && finalAggregatedScore >= 85) {
            awardBadge("tech_titan", "Technical Titan", "Mastered a High-Difficulty Technical Challenge", "💻", "Technical");
        }
        if (challenge.category === "HR" && finalAggregatedScore >= 85) {
            awardBadge("star_virtuoso", "STAR Virtuoso", "Flawless behavioral storytelling evaluation", "🌟", "HR");
        }

        // Add ranking history snapshot
        gamification.rankingHistory.push({
            date: new Date(),
            rank: Math.max(1, 100 - Math.floor(gamification.totalXp / 100)),
            xp: gamification.totalXp,
            challengesCompleted: gamification.challengesCompleted
        });

        if (gamification.rankingHistory.length > 20) {
            gamification.rankingHistory = gamification.rankingHistory.slice(-20);
        }

        await gamification.save();

        res.status(200).json({
            message: "Challenge submitted and evaluated successfully!",
            score: finalAggregatedScore,
            xpEarned,
            pointsEarned,
            submission,
            gamification: {
                totalXp: gamification.totalXp,
                currentRank: gamification.currentRank,
                level: gamification.level,
                currentStreak: gamification.currentStreak,
                maxStreak: gamification.maxStreak,
                unlockedBadges
            }
        });
    } catch (err) {
        console.error("Submit challenge error:", err);
        res.status(500).json({ message: "Error evaluating challenge submission", error: err.message });
    }
};

// 4. GET /api/arena/leaderboard (Global, Category & Weekly Leaderboards)
const getLeaderboard = async (req, res) => {
    try {
        const { category = "Global", timeframe = "all" } = req.query;

        // Fetch top gamification profiles
        const topProfiles = await UserGamification.find()
            .populate("userId", "name email role")
            .sort({ totalXp: -1 })
            .limit(50);

        // Filter out orphaned profiles where user was deleted
        const validProfiles = topProfiles.filter(p => p.userId);

        const leaderboard = validProfiles.map((p, index) => {
            const isCurrentUser = req.user && req.user._id && p.userId._id.toString() === req.user._id.toString();
            return {
                rank: index + 1,
                userId: p.userId._id,
                name: p.userId.name || "Anonymous Challenger",
                role: p.userId.role || "student",
                xp: p.totalXp,
                tier: p.currentRank,
                level: p.level,
                streak: p.currentStreak,
                challengesCompleted: p.challengesCompleted,
                badgesCount: (p.badges || []).length,
                isCurrentUser
            };
        });

        // Find current user's exact ranking
        let userStanding = null;
        if (req.user?._id) {
            const userIdx = leaderboard.findIndex(l => l.isCurrentUser);
            if (userIdx !== -1) {
                userStanding = leaderboard[userIdx];
            } else {
                const userGam = await UserGamification.findOne({ userId: req.user._id });
                if (userGam) {
                    const higherCount = await UserGamification.countDocuments({ totalXp: { $gt: userGam.totalXp } });
                    userStanding = {
                        rank: higherCount + 1,
                        userId: req.user._id,
                        name: req.user.name,
                        xp: userGam.totalXp,
                        tier: userGam.currentRank,
                        level: userGam.level,
                        streak: userGam.currentStreak,
                        challengesCompleted: userGam.challengesCompleted,
                        badgesCount: (userGam.badges || []).length,
                        isCurrentUser: true
                    };
                }
            }
        }

        res.status(200).json({
            leaderboard,
            userStanding
        });
    } catch (err) {
        console.error("Get leaderboard error:", err);
        res.status(500).json({ message: "Error fetching arena leaderboard", error: err.message });
    }
};

// 5. GET /api/arena/user-stats (Current User Gamification Profile & Badges)
const getUserStats = async (req, res) => {
    try {
        let gamification = await UserGamification.findOne({ userId: req.user._id });
        if (!gamification) {
            gamification = await UserGamification.create({
                userId: req.user._id,
                totalXp: 0,
                currentRank: "Novice",
                level: 1,
                currentStreak: 0,
                maxStreak: 0,
                badges: [{
                    badgeId: "welcome_challenger",
                    name: "Arena Initiate",
                    description: "Enrolled in the Peer Challenge Arena",
                    icon: "⚔️",
                    category: "General",
                    unlockedAt: new Date()
                }]
            });
        }

        // Fetch user's recent submissions
        const submissions = await ChallengeSubmission.find({ userId: req.user._id })
            .populate("challengeId", "title category difficulty type")
            .sort({ submittedAt: -1 })
            .limit(10);

        // Calculate all standard badges with unlock status
        const allBadgesCatalog = [
            { badgeId: "welcome_challenger", name: "Arena Initiate", description: "Enrolled in the Peer Challenge Arena", icon: "⚔️", category: "General" },
            { badgeId: "first_blood", name: "First Arena Battle", description: "Complete your very first challenge", icon: "🎯", category: "General" },
            { badgeId: "streak_3", name: "3-Day Fire Streak", description: "Maintain a 3-day challenge streak", icon: "🔥", category: "Streaks" },
            { badgeId: "streak_7", name: "Weekly Ironclad", description: "Maintain a 7-day challenge streak", icon: "⚡", category: "Streaks" },
            { badgeId: "challenger_5", name: "Seasoned Duelist", description: "Complete 5 mock challenges", icon: "🛡️", category: "Volume" },
            { badgeId: "tech_titan", name: "Technical Titan", description: "Score 85%+ on Technical Challenge", icon: "💻", category: "Technical" },
            { badgeId: "star_virtuoso", name: "STAR Virtuoso", description: "Score 85%+ on HR Behavioral Challenge", icon: "🌟", category: "HR" },
            { badgeId: "perfect_centurion", name: "Perfectionist", description: "Score 95%+ on any competitive challenge", icon: "👑", category: "Excellence" }
        ];

        const unlockedIds = new Set((gamification.badges || []).map(b => b.badgeId));
        const badgeShowcase = allBadgesCatalog.map(b => ({
            ...b,
            isUnlocked: unlockedIds.has(b.badgeId),
            unlockedAt: gamification.badges?.find(ub => ub.badgeId === b.badgeId)?.unlockedAt || null
        }));

        res.status(200).json({
            stats: {
                totalXp: gamification.totalXp,
                currentRank: gamification.currentRank,
                level: gamification.level,
                currentStreak: gamification.currentStreak,
                maxStreak: gamification.maxStreak,
                challengesCompleted: gamification.challengesCompleted,
                categoryStats: gamification.categoryStats,
                rankingHistory: gamification.rankingHistory || []
            },
            badges: badgeShowcase,
            recentSubmissions: submissions
        });
    } catch (err) {
        console.error("Get user stats error:", err);
        res.status(500).json({ message: "Error fetching gamification profile", error: err.message });
    }
};

// 6. POST /api/arena/admin/generate (AI-Generated Daily/Weekly Challenges)
const generateAIChallenge = async (req, res) => {
    try {
        const { category = "Technical", type = "daily", difficulty = "Medium", domain = "General" } = req.body;

        let generatedTitle = `${type === "weekly" ? "Weekly Tournament" : "Daily Duel"}: ${category} Mastery`;
        let generatedDescription = `AI-curated competitive interview challenges for ${domain} (${category}).`;
        let generatedQuestions = [];

        if (process.env.GROQ_API_KEY) {
            const prompt = `Generate a competitive interview challenge for a Mock Interview Peer Arena.
Category: ${category} (Allowed: Technical, HR, Aptitude, Domain-Specific)
Type: ${type} (Allowed: daily, weekly)
Difficulty: ${difficulty}
Domain: ${domain}

Provide exactly 2 realistic interview questions with evaluation rubrics.
Return ONLY a valid JSON object matching this schema without markdown:
{
  "title": "Short punchy challenge title",
  "description": "Engaging 1-2 sentence description",
  "timeLimitMinutes": 15,
  "totalPoints": 100,
  "xpReward": 150,
  "questions": [
    {
      "questionId": "q_1",
      "questionText": "Detailed question prompt...",
      "type": "open-ended",
      "sampleAnswerOrKeyPoints": "Key points expected...",
      "rubric": { "clarityWeight": 25, "technicalDepthWeight": 45, "problemSolvingWeight": 30 },
      "points": 50
    },
    {
      "questionId": "q_2",
      "questionText": "Second scenario or algorithmic question prompt...",
      "type": "situational",
      "sampleAnswerOrKeyPoints": "Key points...",
      "rubric": { "clarityWeight": 25, "technicalDepthWeight": 45, "problemSolvingWeight": 30 },
      "points": 50
    }
  ]
}`;

            try {
                const completion = await groq.chat.completions.create({
                    model: GROQ_MODEL,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.5
                });

                const raw = completion.choices[0]?.message?.content || "";
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    generatedTitle = parsed.title || generatedTitle;
                    generatedDescription = parsed.description || generatedDescription;
                    generatedQuestions = parsed.questions || [];
                }
            } catch (aiErr) {
                console.error("Groq AI Challenge Gen Error:", aiErr);
            }
        }

        if (generatedQuestions.length === 0) {
            generatedQuestions = [
                {
                    questionId: `q_gen_${Date.now()}_1`,
                    questionText: `Explain how you would architect and optimize a high-traffic ${domain} service.`,
                    type: "open-ended",
                    rubric: { clarityWeight: 30, technicalDepthWeight: 40, problemSolvingWeight: 30 },
                    points: 50
                },
                {
                    questionId: `q_gen_${Date.now()}_2`,
                    questionText: `Describe a real-world edge case failure in ${domain} and how you diagnosed the root cause.`,
                    type: "situational",
                    rubric: { clarityWeight: 30, technicalDepthWeight: 40, problemSolvingWeight: 30 },
                    points: 50
                }
            ];
        }

        const now = new Date();
        const durationDays = type === "weekly" ? 7 : 1;
        const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const newChallenge = await PeerChallenge.create({
            title: generatedTitle,
            description: generatedDescription,
            type,
            category,
            domain,
            difficulty,
            timeLimitMinutes: type === "weekly" ? 25 : 15,
            startDate: now,
            endDate,
            questions: generatedQuestions,
            totalPoints: type === "weekly" ? 200 : 100,
            xpReward: type === "weekly" ? 300 : 150,
            isActive: true,
            createdBy: "AI-Engine"
        });

        res.status(201).json({
            message: "AI Challenge generated successfully!",
            challenge: newChallenge
        });
    } catch (err) {
        console.error("Generate AI challenge error:", err);
        res.status(500).json({ message: "Error generating challenge", error: err.message });
    }
};

module.exports = {
    getChallenges,
    getChallengeById,
    submitChallenge,
    getLeaderboard,
    getUserStats,
    generateAIChallenge
};
