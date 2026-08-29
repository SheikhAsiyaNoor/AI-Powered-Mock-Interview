"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/Authcontext";
import api from "@/lib/axios";
import {
    Trophy,
    Target,
    Briefcase,
    Award,
    TrendingUp,
    CheckCircle2,
    AlertTriangle,
    BookOpen,
    Zap,
    Settings,
    RefreshCw,
    ChevronRight,
    Sparkles,
    Sliders,
    HelpCircle,
    Check,
    X,
    Layers,
    ShieldCheck,
    BarChart3,
    Brain,
    Code,
    Cpu,
    Compass,
    Upload,
    FileText,
    ArrowUpRight
} from "lucide-react";

interface RoadmapItem {
    id: string;
    type: "technology" | "project" | "certification" | "topic";
    title: string;
    description: string;
    priority: "High" | "Medium" | "Low";
    estimatedTime: string;
    completed: boolean;
}

interface WeakTechnicalArea {
    topic: string;
    severity: "High" | "Medium" | "Low";
    description: string;
    actionItem: string;
}

interface CommunicationGap {
    aspect: string;
    observation: string;
    suggestion: string;
}

interface MissingIndustrySkill {
    skill: string;
    importance: "Critical" | "Recommended" | "Optional";
    reason: string;
}

interface GapAnalysis {
    weakTechnicalAreas: WeakTechnicalArea[];
    communicationGaps: CommunicationGap[];
    missingIndustrySkills: MissingIndustrySkill[];
}

interface HistorySnapshot {
    timestamp: string;
    overallScore: number;
    resumeScore: number;
    interviewScore: number;
    skillScore: number;
    category: string;
    candidateLevel: string;
}

interface ScoringConfig {
    resumeWeight: number;
    interviewWeight: number;
    skillWeight: number;
    placementReadyThreshold: number;
    highPotentialThreshold: number;
}

interface ReadinessReport {
    candidateLevel: "Fresher" | "Internship Seeker" | "Experienced";
    targetRole: string;
    overallScore: number;
    category: "Placement Ready" | "High Potential Candidate" | "Needs Improvement";
    breakdown: {
        resumeScore: number;
        interviewScore: number;
        skillScore: number;
    };
    scoringConfig: ScoringConfig;
    gapAnalysis: GapAnalysis;
    roadmap: RoadmapItem[];
    history: HistorySnapshot[];
    lastEvaluatedAt: string;
}

interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
}

export default function ReadinessPage() {
    const { isLoggedIn, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [recalculating, setRecalculating] = useState(false);
    const [report, setReport] = useState<ReadinessReport | null>(null);
    const [interviewCount, setInterviewCount] = useState(0);
    const [assessmentCount, setAssessmentCount] = useState(0);

    // Active filters & modals
    const [activeTab, setActiveTab] = useState<"all" | "technology" | "project" | "certification" | "topic">("all");
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);

    // Scoring config form state
    const [configForm, setConfigForm] = useState<ScoringConfig>({
        resumeWeight: 30,
        interviewWeight: 50,
        skillWeight: 20,
        placementReadyThreshold: 80,
        highPotentialThreshold: 65,
    });

    // Quiz State
    const [quizDomain, setQuizDomain] = useState("JavaScript/Node.js");
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizResult, setQuizResult] = useState<{ score: number; correctCount: number; totalQuestions: number } | null>(null);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push("/login");
            return;
        }

        if (isLoggedIn) {
            fetchReadinessReport();
        }
    }, [isLoggedIn, authLoading, router]);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchReadinessReport = async (level?: string) => {
        try {
            setLoading(true);
            setErrorMessage(null);
            const url = level ? `/api/readiness?level=${encodeURIComponent(level)}` : "/api/readiness";
            const res = await api.get(url);
            if (res.data && res.data.readiness) {
                setReport(res.data.readiness);
                setInterviewCount(res.data.interviewCount || 0);
                setAssessmentCount(res.data.assessmentCount || 0);
                if (res.data.readiness.scoringConfig) {
                    setConfigForm(res.data.readiness.scoringConfig);
                }
                return;
            }
            throw new Error("No readiness data returned from server.");
        } catch (err: any) {
            console.error("Failed to fetch readiness report:", err);
            setErrorMessage(err?.response?.data?.message || err.message || "Unable to connect to placement readiness server.");
            setReport(null);
        } finally {
            setLoading(false);
        }
    };

    const handleLevelChange = async (newLevel: "Fresher" | "Internship Seeker" | "Experienced") => {
        if (!report || report.candidateLevel === newLevel) return;
        try {
            setRecalculating(true);
            const res = await api.post("/api/readiness/calculate", { candidateLevel: newLevel });
            if (res.data && res.data.readiness) {
                setReport(res.data.readiness);
            } else {
                fetchReadinessReport(newLevel);
            }
        } catch (err) {
            console.error("Error recalculating for level:", err);
        } finally {
            setRecalculating(false);
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setRecalculating(true);
            const res = await api.post("/api/readiness/config", configForm);
            if (res.data && res.data.readiness) {
                setReport(res.data.readiness);
            }
            setShowConfigModal(false);
        } catch (err) {
            console.error("Failed to update config:", err);
        } finally {
            setRecalculating(false);
        }
    };

    const handleToggleRoadmapItem = async (itemId: string, currentCompleted: boolean) => {
        if (!report) return;
        // Optimistic UI update
        const updatedRoadmap = report.roadmap.map((item) =>
            item.id === itemId ? { ...item, completed: !currentCompleted } : item
        );
        setReport({ ...report, roadmap: updatedRoadmap });

        try {
            await api.patch("/api/readiness/roadmap-item", { itemId, completed: !currentCompleted });
        } catch (err) {
            console.error("Failed to toggle roadmap item:", err);
            fetchReadinessReport();
        }
    };

    // Skill Quiz handlers
    const startSkillQuiz = async () => {
        try {
            setQuizLoading(true);
            setShowQuizModal(true);
            setQuizSubmitted(false);
            setQuizResult(null);
            setCurrentQuestionIndex(0);
            setSelectedAnswers([]);

            const res = await api.post("/api/readiness/skill-quiz/generate", {
                domain: quizDomain,
                candidateLevel: report?.candidateLevel || "Fresher",
            });

            if (res.data && res.data.quiz && res.data.quiz.questions) {
                setQuizQuestions(res.data.quiz.questions);
                setSelectedAnswers(new Array(res.data.quiz.questions.length).fill(-1));
            }
        } catch (err) {
            console.error("Failed to generate quiz:", err);
        } finally {
            setQuizLoading(false);
        }
    };

    const handleOptionSelect = (optionIndex: number) => {
        const updated = [...selectedAnswers];
        updated[currentQuestionIndex] = optionIndex;
        setSelectedAnswers(updated);
    };

    const handleSubmitQuiz = async () => {
        if (selectedAnswers.includes(-1)) {
            alert("Please answer all questions before submitting.");
            return;
        }

        try {
            setQuizLoading(true);
            const payload = quizQuestions.map((q, idx) => ({
                id: q.id,
                question: q.question,
                options: q.options,
                selectedIndex: selectedAnswers[idx],
                correctIndex: q.correctOptionIndex,
                explanation: q.explanation,
            }));

            const res = await api.post("/api/readiness/skill-quiz/submit", {
                domain: quizDomain,
                candidateLevel: report?.candidateLevel || "Fresher",
                answers: payload,
            });

            if (res.data) {
                setQuizSubmitted(true);
                setQuizResult({
                    score: res.data.score,
                    correctCount: res.data.correctCount,
                    totalQuestions: res.data.totalQuestions,
                });
                // Refresh readiness report
                fetchReadinessReport();
            }
        } catch (err) {
            console.error("Failed to submit quiz:", err);
        } finally {
            setQuizLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4 p-8">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground font-medium animate-pulse">
                    Evaluating Placement Readiness & Generating AI Roadmap...
                </p>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-3">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                <h2 className="text-xl font-bold text-foreground">
                    {errorMessage ? "Error Loading Readiness Report" : "No Readiness Data Available"}
                </h2>
                <p className="text-muted-foreground text-xs max-w-md mx-auto">
                    {errorMessage || "Take a mock interview or upload a resume to calculate your placement readiness."}
                </p>
                <button
                    onClick={() => fetchReadinessReport()}
                    className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const { overallScore, category, breakdown, scoringConfig, gapAnalysis, roadmap, history, candidateLevel } = report;

    // Classification badge styles
    const getBadgeStyle = (cat: string) => {
        switch (cat) {
            case "Placement Ready":
                return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
            case "High Potential Candidate":
                return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
            default:
                return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
        }
    };

    // Roadmap items filtering & progress calculation
    const filteredRoadmap = activeTab === "all" ? roadmap : roadmap.filter((item) => item.type === activeTab);
    const completedRoadmapCount = roadmap.filter((i) => i.completed).length;
    const roadmapProgressPct = roadmap.length > 0 ? Math.round((completedRoadmapCount / roadmap.length) * 100) : 0;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* HERO HEADER SECTION */}
                <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-900/90 via-indigo-900/90 to-purple-950/90 text-white p-6 sm:p-8 border border-white/10 shadow-2xl">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="space-y-3 max-w-2xl">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30 backdrop-blur-xs">
                                    <Brain className="w-3.5 h-3.5 inline mr-1" /> AI Placement Engine
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(category)}`}>
                                    ★ {category}
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                                Placement Readiness Dashboard
                            </h1>
                            <p className="text-sm text-blue-100/80 leading-relaxed">
                                Unified diagnostic combining resume structure, AI interview metrics, and domain skill assessments. Tailored roadmap for career acceleration.
                            </p>

                            {/* Candidate Level Selector Switcher */}
                            <div className="pt-2 flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-blue-200/70 mr-1 flex items-center gap-1">
                                    <Compass className="w-3.5 h-3.5" /> Profile Target:
                                </span>
                                {(["Fresher", "Internship Seeker", "Experienced"] as const).map((lvl) => (
                                    <button
                                        key={lvl}
                                        onClick={() => handleLevelChange(lvl)}
                                        disabled={recalculating}
                                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            candidateLevel === lvl
                                                ? "bg-white text-blue-950 shadow-md scale-105"
                                                : "bg-white/10 text-white/80 hover:bg-white/20"
                                        }`}
                                    >
                                        {lvl === "Fresher" ? "🌱 Fresher (0-1 yr)" : lvl === "Internship Seeker" ? "🎯 Internship Seeker" : "⚡ Experienced (1+ yrs)"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={startSkillQuiz}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg hover:brightness-110 transition cursor-pointer"
                            >
                                <Zap className="w-4 h-4" /> Take Skill Diagnostic Quiz
                            </button>
                            <button
                                onClick={() => setShowConfigModal(true)}
                                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition cursor-pointer backdrop-blur-xs"
                            >
                                <Sliders className="w-4 h-4" /> Configure Scoring Rules
                            </button>
                        </div>
                    </div>
                </div>

                {/* RESUME UPLOAD PROMPT BANNER FOR NEW USERS */}
                {breakdown.resumeScore === 0 && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-start sm:items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-lg shrink-0">
                                📄
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                                    No Resume Analyzed Yet (Resume Score: 0%)
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Upload your resume in the Dashboard to analyze your ATS match, extract technical strengths, and compute your overall Placement Readiness score.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard"
                            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
                        >
                            <Upload className="w-3.5 h-3.5" /> Upload Resume in Dashboard ↗
                        </Link>
                    </div>
                )}

                {/* OVERALL SCORE & BREAKDOWN METRICS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Overall Gauge Dial */}
                    <div className="bg-card border border-border/60 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-xs">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                            Overall Readiness Score
                        </h3>
                        
                        <div className="relative w-44 h-44 flex items-center justify-center">
                            {/* SVG Circular Progress Gauge */}
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    className="stroke-muted/30 fill-none"
                                    strokeWidth="8"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    className="stroke-blue-600 fill-none transition-all duration-1000 ease-out"
                                    strokeWidth="8"
                                    strokeDasharray="251.2"
                                    strokeDashoffset={251.2 - (251.2 * overallScore) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-4xl font-extrabold text-foreground tracking-tight">
                                    {overallScore}%
                                </span>
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">
                                    Readiness
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 px-3 py-1 rounded-full text-xs font-bold border border-border">
                            Classification: <span className="text-blue-600 font-extrabold">{category}</span>
                        </div>
                    </div>

                    {/* Breakdown Scores */}
                    <div className="lg:col-span-2 bg-card border border-border/60 rounded-3xl p-6 space-y-6 flex flex-col justify-between shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Placement Engine Weighting</h3>
                                <p className="text-xs text-muted-foreground">
                                    Calculated from {interviewCount} interview session(s) & {assessmentCount} skill quiz(zes)
                                </p>
                            </div>
                            <button
                                onClick={() => fetchReadinessReport()}
                                disabled={recalculating}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:bg-muted/50 transition cursor-pointer"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} /> Recalculate
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Resume Score */}
                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="font-semibold flex items-center gap-1">
                                        <Briefcase className="w-3.5 h-3.5 text-blue-500" /> Resume Quality
                                    </span>
                                    <span className="font-mono text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                        {scoringConfig.resumeWeight}% Weight
                                    </span>
                                </div>
                                <div className="flex items-baseline justify-between">
                                    <div className="text-2xl font-bold text-foreground">{breakdown.resumeScore}%</div>
                                    {breakdown.resumeScore === 0 ? (
                                        <Link href="/dashboard" className="text-[11px] font-bold text-amber-600 hover:underline flex items-center gap-0.5">
                                            Upload ↗
                                        </Link>
                                    ) : (
                                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                            ATS Synced ✓
                                        </span>
                                    )}
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${breakdown.resumeScore === 0 ? "bg-amber-500" : "bg-blue-500"}`}
                                        style={{ width: `${Math.max(breakdown.resumeScore, breakdown.resumeScore === 0 ? 0 : 4)}%` }}
                                    ></div>
                                </div>
                                {breakdown.resumeScore === 0 && (
                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                        ⚠️ 0% — Please upload resume to analyze
                                    </p>
                                )}
                            </div>

                            {/* Interview Score */}
                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="font-semibold flex items-center gap-1">
                                        <Award className="w-3.5 h-3.5 text-purple-500" /> Mock Interview
                                    </span>
                                    <span className="font-mono text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded">
                                        {scoringConfig.interviewWeight}% Weight
                                    </span>
                                </div>
                                <div className="text-2xl font-bold text-foreground">{breakdown.interviewScore}%</div>
                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-purple-500 h-full rounded-full transition-all"
                                        style={{ width: `${breakdown.interviewScore}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Skill Quiz Score */}
                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="font-semibold flex items-center gap-1">
                                        <Zap className="w-3.5 h-3.5 text-emerald-500" /> Skill Assessment
                                    </span>
                                    <span className="font-mono text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                                        {scoringConfig.skillWeight}% Weight
                                    </span>
                                </div>
                                <div className="text-2xl font-bold text-foreground">{breakdown.skillScore}%</div>
                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-full rounded-full transition-all"
                                        style={{ width: `${breakdown.skillScore}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 p-3 rounded-xl border border-blue-200 dark:border-blue-800/50 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 shrink-0" />
                            <span>
                                Configured Benchmarks: Placement Ready threshold ≥ <strong>{scoringConfig.placementReadyThreshold}%</strong> | High Potential threshold ≥ <strong>{scoringConfig.highPotentialThreshold}%</strong>.
                            </span>
                        </div>
                    </div>
                </div>

                {/* GAP ANALYSIS DASHBOARD SECTION */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-600" /> Gap Analysis & Diagnostics
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Specific weak technical areas, communication observations, and missing industry skills.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Weak Technical Areas */}
                        <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-4 shadow-xs flex flex-col">
                            <div className="flex items-center justify-between pb-3 border-b border-border/40">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Code className="w-4 h-4 text-red-500" /> Weak Technical Areas
                                </h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                    {gapAnalysis?.weakTechnicalAreas?.length || 0} Identified
                                </span>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto max-h-80 pr-1">
                                {gapAnalysis?.weakTechnicalAreas?.length ? (
                                    gapAnalysis.weakTechnicalAreas.map((item, idx) => (
                                        <div key={idx} className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-2 text-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-foreground">{item.topic}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                    item.severity === "High" ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600"
                                                }`}>
                                                    {item.severity} Priority
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                                            <div className="pt-1.5 border-t border-border/40 font-medium text-blue-600 dark:text-blue-400">
                                                💡 Action: {item.actionItem}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground italic text-center py-6">No critical technical gaps detected!</p>
                                )}
                            </div>
                        </div>

                        {/* Communication Gaps */}
                        <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-4 shadow-xs flex flex-col">
                            <div className="flex items-center justify-between pb-3 border-b border-border/40">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-amber-500" /> Communication Gaps
                                </h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    {gapAnalysis?.communicationGaps?.length || 0} Observations
                                </span>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto max-h-80 pr-1">
                                {gapAnalysis?.communicationGaps?.length ? (
                                    gapAnalysis.communicationGaps.map((item, idx) => (
                                        <div key={idx} className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-2 text-xs">
                                            <span className="font-bold text-foreground block">{item.aspect}</span>
                                            <p className="text-muted-foreground leading-relaxed">"{item.observation}"</p>
                                            <div className="pt-1.5 border-t border-border/40 font-medium text-emerald-600 dark:text-emerald-400">
                                                🎯 Suggestion: {item.suggestion}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground italic text-center py-6">Communication skills are clear and structured!</p>
                                )}
                            </div>
                        </div>

                        {/* Missing Industry Skills */}
                        <div className="bg-card border border-border/60 rounded-3xl p-5 space-y-4 shadow-xs flex flex-col">
                            <div className="flex items-center justify-between pb-3 border-b border-border/40">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-purple-500" /> Missing Industry Skills
                                </h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                    {gapAnalysis?.missingIndustrySkills?.length || 0} Recommended
                                </span>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto max-h-80 pr-1">
                                {gapAnalysis?.missingIndustrySkills?.length ? (
                                    gapAnalysis.missingIndustrySkills.map((item, idx) => (
                                        <div key={idx} className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-2 text-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-foreground">{item.skill}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                    item.importance === "Critical" ? "bg-red-500/10 text-red-600" : "bg-blue-500/10 text-blue-600"
                                                }`}>
                                                    {item.importance}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed">{item.reason}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground italic text-center py-6">Resume covers core benchmark industry skills!</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* PERSONALIZED AI ROADMAP SECTION */}
                <div className="bg-card border border-border/60 rounded-3xl p-6 space-y-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase">
                                    Tailored for {candidateLevel}
                                </span>
                                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-yellow-500" /> Personalized Placement Roadmap
                                </h2>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Actionable technologies, hands-on projects, certifications, and interview topics to boost your readiness.
                            </p>
                        </div>

                        {/* Progress Tracker Pill */}
                        <div className="flex items-center gap-3 bg-muted/50 border border-border/60 px-4 py-2 rounded-2xl">
                            <div className="text-right">
                                <div className="text-xs font-bold text-foreground">
                                    {completedRoadmapCount} of {roadmap.length} Completed
                                </div>
                                <div className="text-[10px] text-muted-foreground">{roadmapProgressPct}% Roadmap Progress</div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                                {roadmapProgressPct}%
                            </div>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-border/50 pb-3">
                        {[
                            { id: "all", label: "All Milestones", icon: Layers },
                            { id: "technology", label: "Technologies", icon: Code },
                            { id: "project", label: "Projects", icon: Briefcase },
                            { id: "certification", label: "Certifications", icon: Award },
                            { id: "topic", label: "Interview Topics", icon: Target },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                                        isActive
                                            ? "bg-blue-600 text-white shadow-xs"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Roadmap Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredRoadmap.map((item) => (
                            <div
                                key={item.id}
                                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                                    item.completed
                                        ? "bg-emerald-500/5 border-emerald-500/30 opacity-75"
                                        : "bg-muted/30 border-border/60 hover:border-blue-500/40"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => handleToggleRoadmapItem(item.id, item.completed)}
                                            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer ${
                                                item.completed
                                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                                    : "border-muted-foreground/40 hover:border-blue-600 bg-background"
                                            }`}
                                        >
                                            {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </button>
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                                                {item.type} • {item.estimatedTime}
                                            </span>
                                            <h4 className={`text-sm font-bold text-foreground ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                                                {item.title}
                                            </h4>
                                        </div>
                                    </div>

                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                                        item.priority === "High" ? "bg-red-500/10 text-red-600" : "bg-blue-500/10 text-blue-600"
                                    }`}>
                                        {item.priority}
                                    </span>
                                </div>

                                <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* HISTORICAL PROGRESS & TRAJECTORY SECTION */}
                <div className="bg-card border border-border/60 rounded-3xl p-6 space-y-6 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-500" /> Historical Progress & Readiness Trajectory
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Snapshot evolution across mock interviews, resume scans, and skill assessments.
                            </p>
                        </div>
                    </div>

                    {history && history.length > 0 ? (
                        <div className="space-y-4">
                            {/* Custom SVG Line Chart */}
                            <div className="w-full h-48 bg-muted/20 border border-border/50 rounded-2xl p-4 flex flex-col justify-between">
                                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                                    <span>Score Range (0-100%)</span>
                                    <span>{history.length} Snapshot(s) Logged</span>
                                </div>

                                {/* Plot SVG */}
                                <div className="relative w-full h-32 flex items-end">
                                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                                            </linearGradient>
                                        </defs>

                                        {/* Horizontal grid lines */}
                                        <line x1="0" y1="20" x2="500" y2="20" className="stroke-border/40" strokeDasharray="3 3" />
                                        <line x1="0" y1="50" x2="500" y2="50" className="stroke-border/40" strokeDasharray="3 3" />
                                        <line x1="0" y1="80" x2="500" y2="80" className="stroke-border/40" strokeDasharray="3 3" />

                                        {/* Historical Polyline */}
                                        {history.length > 1 && (
                                            <>
                                                <polygon
                                                    points={`0,100 ${history
                                                        .map((h, idx) => {
                                                            const x = (idx / (history.length - 1)) * 500;
                                                            const y = 100 - (h.overallScore * 0.8 + 10);
                                                            return `${x},${y}`;
                                                        })
                                                        .join(" ")} 500,100`}
                                                    fill="url(#scoreGrad)"
                                                />
                                                <polyline
                                                    fill="none"
                                                    stroke="#3b82f6"
                                                    strokeWidth="3"
                                                    points={history
                                                        .map((h, idx) => {
                                                            const x = (idx / (history.length - 1)) * 500;
                                                            const y = 100 - (h.overallScore * 0.8 + 10);
                                                            return `${x},${y}`;
                                                        })
                                                        .join(" ")}
                                                />
                                            </>
                                        )}

                                        {/* Data points */}
                                        {history.map((h, idx) => {
                                            const x = history.length > 1 ? (idx / (history.length - 1)) * 500 : 250;
                                            const y = 100 - (h.overallScore * 0.8 + 10);
                                            return (
                                                <g key={idx} className="group cursor-pointer">
                                                    <circle cx={x} cy={y} r="5" className="fill-blue-600 stroke-white stroke-2" />
                                                    <text
                                                        x={x}
                                                        y={y - 10}
                                                        textAnchor="middle"
                                                        className="text-[9px] font-bold fill-foreground"
                                                    >
                                                        {h.overallScore}%
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>

                                <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                                    <span>First Evaluation</span>
                                    <span>Latest Evaluation</span>
                                </div>
                            </div>

                            {/* Recent Snapshots Table */}
                            <div className="overflow-x-auto border border-border/50 rounded-2xl">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-[10px] border-b border-border/50">
                                        <tr>
                                            <th className="px-4 py-2.5">Date & Time</th>
                                            <th className="px-4 py-2.5">Level</th>
                                            <th className="px-4 py-2.5">Overall Score</th>
                                            <th className="px-4 py-2.5">Resume</th>
                                            <th className="px-4 py-2.5">Interview</th>
                                            <th className="px-4 py-2.5">Quiz</th>
                                            <th className="px-4 py-2.5">Category</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {history.slice(-5).reverse().map((snap, idx) => (
                                            <tr key={idx} className="hover:bg-muted/20">
                                                <td className="px-4 py-2.5 font-medium text-foreground">
                                                    {new Date(snap.timestamp).toLocaleDateString()} {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-4 py-2.5 text-muted-foreground">{snap.candidateLevel}</td>
                                                <td className="px-4 py-2.5 font-bold text-blue-600">{snap.overallScore}%</td>
                                                <td className="px-4 py-2.5">{snap.resumeScore}%</td>
                                                <td className="px-4 py-2.5">{snap.interviewScore}%</td>
                                                <td className="px-4 py-2.5">{snap.skillScore}%</td>
                                                <td className="px-4 py-2.5">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(snap.category)}`}>
                                                        {snap.category}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground italic text-center py-4">No historical snapshots recorded yet.</p>
                    )}
                </div>
            </main>

            {/* CONFIGURABLE SCORING RULES MODAL */}
            {showConfigModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-card border border-border/80 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-border/50">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-blue-600" /> Configurable Scoring Rules
                            </h3>
                            <button
                                onClick={() => setShowConfigModal(false)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
                            <p className="text-muted-foreground">
                                Adjust component scoring weights and candidate classification thresholds.
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between font-bold mb-1">
                                        <span>Resume Score Weight</span>
                                        <span className="text-blue-600">{configForm.resumeWeight}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={configForm.resumeWeight}
                                        onChange={(e) => setConfigForm({ ...configForm, resumeWeight: Number(e.target.value) })}
                                        className="w-full accent-blue-600 cursor-pointer"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between font-bold mb-1">
                                        <span>Interview Performance Weight</span>
                                        <span className="text-purple-600">{configForm.interviewWeight}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={configForm.interviewWeight}
                                        onChange={(e) => setConfigForm({ ...configForm, interviewWeight: Number(e.target.value) })}
                                        className="w-full accent-purple-600 cursor-pointer"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between font-bold mb-1">
                                        <span>Skill Assessment Quiz Weight</span>
                                        <span className="text-emerald-600">{configForm.skillWeight}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={configForm.skillWeight}
                                        onChange={(e) => setConfigForm({ ...configForm, skillWeight: Number(e.target.value) })}
                                        className="w-full accent-emerald-600 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <hr className="border-border/50" />

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="font-bold block text-foreground">
                                        Placement Ready Threshold (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="50"
                                        max="100"
                                        value={configForm.placementReadyThreshold}
                                        onChange={(e) => setConfigForm({ ...configForm, placementReadyThreshold: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-foreground text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-bold block text-foreground">
                                        High Potential Threshold (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="30"
                                        max="90"
                                        value={configForm.highPotentialThreshold}
                                        onChange={(e) => setConfigForm({ ...configForm, highPotentialThreshold: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-foreground text-xs"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowConfigModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer"
                                >
                                    Save & Recalculate
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SKILL DIAGNOSTIC QUIZ MODAL */}
            {showQuizModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-card border border-border/80 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-border/50">
                            <div>
                                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-emerald-500" /> Domain Skill Diagnostic
                                </h3>
                                <p className="text-xs text-muted-foreground">Test technical depth and update your Placement Readiness Score.</p>
                            </div>
                            <button
                                onClick={() => setShowQuizModal(false)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {quizLoading ? (
                            <div className="py-12 text-center space-y-3">
                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-xs text-muted-foreground animate-pulse">Generating diagnostic questions...</p>
                            </div>
                        ) : quizSubmitted && quizResult ? (
                            /* Quiz Result View */
                            <div className="space-y-6 text-center py-4">
                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-600 font-extrabold text-2xl">
                                    {quizResult.score}%
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-lg font-bold text-foreground">Assessment Complete!</h4>
                                    <p className="text-xs text-muted-foreground">
                                        You answered {quizResult.correctCount} of {quizResult.totalQuestions} questions correctly.
                                    </p>
                                </div>

                                <div className="space-y-3 text-left">
                                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Review Explanations</h5>
                                    {quizQuestions.map((q, idx) => (
                                        <div key={idx} className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 text-xs space-y-1.5">
                                            <div className="flex items-start justify-between font-bold text-foreground">
                                                <span>Q{idx + 1}. {q.question}</span>
                                                <span className={selectedAnswers[idx] === q.correctOptionIndex ? "text-emerald-600" : "text-red-500"}>
                                                    {selectedAnswers[idx] === q.correctOptionIndex ? "✓ Correct" : "✕ Incorrect"}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground">💡 {q.explanation}</p>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowQuizModal(false)}
                                    className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 cursor-pointer"
                                >
                                    Close & View Updated Dashboard
                                </button>
                            </div>
                        ) : quizQuestions.length > 0 ? (
                            /* Quiz Runner Step View */
                            <div className="space-y-6">
                                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                                    <span>Domain: <strong className="text-foreground">{quizDomain}</strong></span>
                                    <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                        className="bg-emerald-500 h-full rounded-full transition-all"
                                        style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                                    ></div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-foreground leading-snug">
                                        {quizQuestions[currentQuestionIndex].question}
                                    </h4>

                                    <div className="space-y-2">
                                        {quizQuestions[currentQuestionIndex].options.map((opt, optIdx) => {
                                            const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                                            return (
                                                <button
                                                    key={optIdx}
                                                    onClick={() => handleOptionSelect(optIdx)}
                                                    className={`w-full text-left p-3.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                                                        isSelected
                                                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold"
                                                            : "bg-muted/30 border-border/60 hover:bg-muted hover:border-border"
                                                    }`}
                                                >
                                                    <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span> {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                    <button
                                        disabled={currentQuestionIndex === 0}
                                        onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                                        className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-border disabled:opacity-50"
                                    >
                                        Previous
                                    </button>

                                    {currentQuestionIndex < quizQuestions.length - 1 ? (
                                        <button
                                            onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                                            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                                        >
                                            Next Question
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmitQuiz}
                                            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                                        >
                                            Submit Diagnostic Quiz
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
