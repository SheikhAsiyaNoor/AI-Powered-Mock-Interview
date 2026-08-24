"use client";
import { useAuth } from "@/context/Authcontext";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Interview {
    id: string;
    _id?: string;
    date: string;
    score: number;
    duration: number;
    topic: string;
    feedback?: string;
    questions?: { question: string; answer: string; feedback: string }[];
}

interface ResumeAnalysis {
    summary: string;
    strengths: string[];
    recommendedDomains: { label: string; reason: string; confidence: number }[];
    experienceLevel: "Junior" | "Mid" | "Senior";
    skillsDetected: string[];
}

const INTERVIEW_DOMAINS = [
    { label: "JavaScript/Node.js", icon: "🟨", desc: "ES6+, async, Node runtime" },
    { label: "React", icon: "⚛️", desc: "Hooks, state, lifecycle" },
    { label: "Python", icon: "🐍", desc: "OOP, data structures, stdlib" },
    { label: "Data Science", icon: "📊", desc: "ML, pandas, statistics" },
    { label: "DevOps", icon: "⚙️", desc: "CI/CD, Docker, Kubernetes" },
    { label: "System Design", icon: "🏗️", desc: "Scalability, architecture" },
    { label: "Database Design", icon: "💾", desc: "SQL, NoSQL, indexing" },
    { label: "General", icon: "🎯", desc: "Behavioural & fundamentals" },
];

const MiniSparkline = ({ scores }: { scores: number[] }) => {
    if (!scores || scores.length < 2) return null;
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = max - min || 1;
    const width = 80;
    const height = 28;
    const points = scores
        .map((score, i) => {
            const x = (i / (scores.length - 1)) * width;
            const y = height - ((score - min) / range) * (height - 8) - 4;
            return `${x},${y}`;
        })
        .join(" ");

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600"
                points={points}
            />
        </svg>
    );
};

const ScoreBadge = ({ score }: { score: number }) => {
    const color =
        score >= 80
            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            : score >= 60
            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
            : "bg-rose-500/10 text-rose-600 border-rose-500/20";
    return (
        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${color}`}>
            {score}%
        </span>
    );
};

function ResumePanel({ onDomainSelect }: { onDomainSelect: (d: string) => void }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<"upload" | "analyzing" | "results">("upload");
    const [analyzingStep, setAnalyzingStep] = useState(0);

    const analyzingSteps = [
        "Reading your resume...",
        "Detecting skills & technologies...",
        "Mapping to interview domains...",
        "Generating recommendations...",
    ];

    const handleFile = (f: File) => {
        const allowed = [
            "application/pdf",
            "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowed.includes(f.type)) {
            setError("Please upload a PDF, DOC, DOCX, or TXT file.");
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            setError("File must be under 5MB.");
            return;
        }
        setFile(f);
        setError(null);
        setAnalysis(null);
        setStep("upload");
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setStep("analyzing");
        setError(null);
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % analyzingSteps.length;
            setAnalyzingStep(idx);
        }, 1100);

        try {
            const formData = new FormData();
            formData.append("resume", file);
            const { data } = await axiosInstance.post("/api/resume/analyze", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setAnalysis(data.analysis || data);
            setStep("results");
        } catch (err: any) {
            console.error("Resume analysis error:", err);
            setError(err?.response?.data?.message || "Failed to analyze resume. Please try again.");
            setStep("upload");
        } finally {
            clearInterval(interval);
        }
    };

    const reset = () => {
        setFile(null);
        setAnalysis(null);
        setError(null);
        setStep("upload");
    };

    return (
        <div className="mt-6 space-y-6">
            <Card className="p-6 border border-border/50 rounded-3xl shadow-2xs">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-xl font-bold">
                            📄
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">AI Resume Analysis</h3>
                            <p className="text-xs text-muted-foreground">Upload your resume · Get domain recommendations</p>
                        </div>
                    </div>

                    {step === "results" && (
                        <Button variant="outline" size="sm" onClick={reset} className="rounded-xl text-xs cursor-pointer">
                            Upload new ↗
                        </Button>
                    )}
                </div>

                {step === "upload" && (
                    <div className="space-y-6">
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragging(false);
                                if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
                            }}
                            onClick={() => fileRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                                dragging
                                    ? "border-blue-600 bg-blue-50/10"
                                    : "border-border/60 hover:border-blue-600/50 hover:bg-muted/30"
                            }`}
                        >
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.txt"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                                }}
                            />
                            <div className="text-4xl mb-3">☁️</div>
                            <h3 className="text-base font-bold text-foreground mb-1">
                                {file ? file.name : "Drop your resume here"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                or click to browse · PDF, DOC, DOCX, TXT · Max 5 MB
                            </p>
                        </div>

                        {error && <p className="text-xs text-rose-500 font-semibold text-center">{error}</p>}

                        {file && (
                            <div className="flex items-center justify-center gap-4">
                                <Button variant="outline" onClick={reset} className="rounded-full px-6 cursor-pointer">
                                    Clear
                                </Button>
                                <Button
                                    onClick={handleAnalyze}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 font-semibold cursor-pointer shadow-xs"
                                >
                                    Analyze Resume ⚡
                                </Button>
                            </div>
                        )}

                        {/* 4 Feature Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                            {[
                                { icon: "🔍", title: "Skills Detection", desc: "Frameworks, languages, tools" },
                                { icon: "📊", title: "Experience Level", desc: "Junior / Mid / Senior" },
                                { icon: "🎯", title: "Domain Matching", desc: "Best-fit interview areas" },
                                { icon: "💡", title: "Strength Analysis", desc: "Your competitive edge" },
                            ].map((f, i) => (
                                <div key={i} className="p-3.5 rounded-2xl bg-muted/40 border border-border/40">
                                    <span className="text-lg mb-1 block">{f.icon}</span>
                                    <p className="text-xs font-bold text-foreground">{f.title}</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === "analyzing" && (
                    <div className="py-12 text-center max-w-md mx-auto space-y-4">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <h3 className="text-lg font-bold text-foreground">Analyzing Your Resume</h3>
                        <p className="text-sm text-blue-600 font-semibold transition-all">
                            {analyzingSteps[analyzingStep]}
                        </p>
                    </div>
                )}

                {step === "results" && analysis && (
                    <div className="space-y-6 pt-2">
                        {/* Summary Card */}
                        <Card className="p-5 border border-border/50 rounded-2xl bg-muted/20">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <span>🧠</span> AI Summary
                                </h4>
                                <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 font-semibold border border-blue-500/20">
                                    {analysis.experienceLevel} Level
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{analysis.summary}</p>

                            {analysis.skillsDetected?.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border/60">
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                        🛠 Skills Detected
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {analysis.skillsDetected.map((skill, idx) => (
                                            <span key={idx} className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-semibold border border-blue-500/20">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Recommended Domains */}
                        <div>
                            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                <span>🎯</span> Recommended Interview Domains
                            </h4>
                            <div className="space-y-3">
                                {analysis.recommendedDomains?.map((rec, i) => (
                                    <div
                                        key={i}
                                        onClick={() => onDomainSelect(rec.label)}
                                        className="p-4 rounded-2xl border border-border/60 hover:border-blue-600/50 hover:bg-muted/40 transition-all cursor-pointer flex items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
                                                🟨
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-foreground">{rec.label}</p>
                                                    {i === 0 && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold uppercase tracking-wider">
                                                            TOP PICK
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{rec.reason}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            {(() => {
                                                const confVal = typeof rec.confidence === "number"
                                                    ? (rec.confidence <= 1 ? Math.round(rec.confidence * 100) : Math.min(100, Math.max(10, Math.round(rec.confidence))))
                                                    : 85;
                                                return (
                                                    <>
                                                        <div className="w-20 hidden sm:block">
                                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-blue-600 rounded-full"
                                                                    style={{ width: `${confVal}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-bold text-blue-600">
                                                            {confVal}%
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Strengths Card */}
                        {analysis.strengths?.length > 0 && (
                            <Card className="p-5 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl">
                                <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                                    <span>✅</span> Your Strengths
                                </h4>
                                <ul className="space-y-1.5 pl-5 list-disc text-xs text-muted-foreground">
                                    {analysis.strengths.map((str, i) => (
                                        <li key={i}>{str}</li>
                                    ))}
                                </ul>
                            </Card>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoggedIn, isLoading: authLoading, user } = useAuth();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [showDomainSelector, setShowDomainSelector] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
    const [filterDomain, setFilterDomain] = useState<string>("All");
    const [activeTab, setActiveTab] = useState<"history" | "resume">("history");

    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "history" || tab === "resume") {
            setActiveTab(tab);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push("/login");
        } else if (isLoggedIn) {
            fetchInterviews();
        }
    }, [isLoggedIn, authLoading, router]);

    const fetchInterviews = async () => {
        try {
            setDataLoading(true);
            const { data } = await axiosInstance.get("/api/interviews");
            setInterviews(data.interviews || []);
        } catch (err) {
            console.error("Failed to fetch interviews:", err);
        } finally {
            setDataLoading(false);
        }
    };

    const handleSelectDomain = (domain: string) => {
        router.push(`/interview?domain=${encodeURIComponent(domain)}`);
    };

    if (authLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-sm font-semibold text-muted-foreground">
                Loading dashboard...
            </div>
        );
    }

    if (!isLoggedIn) return null;

    const avgScore = interviews.length ? Math.round(interviews.reduce((s, i) => s + i.score, 0) / interviews.length) : null;
    const totalMinutes = interviews.reduce((s, i) => s + i.duration, 0);
    const bestScore = interviews.length ? Math.max(...interviews.map((i) => i.score)) : null;

    const recentScores = [...interviews].slice(-6).map((i) => i.score);
    const uniqueDomains = ["All", ...Array.from(new Set(interviews.map((i) => i.topic)))];

    const filtered = filterDomain === "All" ? interviews : interviews.filter((i) => i.topic === filterDomain);
    const userName = user?.name ? user.name.split(" ")[0] : "User";

    return (
        <div className="font-sans max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header Section */}
            <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mb-1">
                        <span>👋</span> Welcome back, <span className="font-semibold text-foreground">{userName}</span>
                    </p>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Your Dashboard</h1>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                        onClick={() => router.push("/arena")}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-orange-500/20 text-xs"
                    >
                        <span>⚔️</span> Peer Arena
                    </Button>
                    <Button
                        onClick={() => router.push("/simulator")}
                        variant="outline"
                        className="border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-semibold px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-2xs text-xs"
                    >
                        <span>🏢</span> Simulator
                    </Button>
                    <Button
                        onClick={() => router.push("/readiness")}
                        variant="outline"
                        className="border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 font-semibold px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-2xs text-xs"
                    >
                        <span>🚀</span> Readiness
                    </Button>
                    <Button
                        onClick={() => setShowDomainSelector(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer text-xs"
                    >
                        <span>⚡</span> New Interview
                    </Button>
                </div>
            </section>

            {/* Featured Engine Cards (Simulator & Readiness) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* AI Recruiter Simulator Card */}
                <Card className="p-6 border border-indigo-500/30 bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-blue-900/10 rounded-3xl shadow-xs hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                                Recruiter Simulator
                            </span>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                Company Hiring Bars
                            </span>
                        </div>
                        <h2 className="text-base font-bold text-foreground">
                            Simulate Google, Amazon, Microsoft & TCS Interviews
                        </h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Practice with company-specific interviewer personas, difficulty calibrations, leadership principles, and receive official hiring verdicts (Strong Hire, Hire, No Hire).
                        </p>
                    </div>

                    <Button
                        onClick={() => router.push("/simulator")}
                        className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md hover:brightness-110 w-fit cursor-pointer"
                    >
                        Explore Company Simulator →
                    </Button>
                </Card>

                {/* AI Placement Readiness Engine Card */}
                <Card className="p-6 border border-blue-500/30 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-purple-900/10 rounded-3xl shadow-xs hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                                Readiness Engine
                            </span>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                Placement Analytics
                            </span>
                        </div>
                        <h2 className="text-base font-bold text-foreground">
                            Placement Readiness Score & AI Roadmap
                        </h2>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Unified placement score calculated from resume analysis, mock interviews, and skill quizzes with tailored milestones for Freshers & Experienced candidates.
                        </p>
                    </div>

                    <Button
                        onClick={() => router.push("/readiness")}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md hover:brightness-110 w-fit cursor-pointer"
                    >
                        Launch Readiness Dashboard →
                    </Button>
                </Card>
            </div>

            {/* Stat Cards Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    {
                        label: "Total Sessions",
                        value: interviews.length.toString(),
                        sub: `${interviews.length} session${interviews.length !== 1 ? "s" : ""}`,
                        icon: "📋",
                    },
                    {
                        label: "Average Score",
                        value: avgScore !== null ? `${avgScore}%` : "-",
                        sub: avgScore !== null ? (avgScore >= 80 ? "Excellent" : avgScore >= 60 ? "Good" : "Keep going") : "No data yet",
                        icon: "📊",
                        accent: true,
                    },
                    {
                        label: "Best Score",
                        value: bestScore !== null ? `${bestScore}%` : "-",
                        sub: bestScore !== null ? "Personal best" : "No data yet",
                        icon: "🏆",
                    },
                    {
                        label: "Practice Time",
                        value: totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m`,
                        sub: "Total invested",
                        icon: "⏱️",
                    },
                ].map((stat, i) => (
                    <Card key={i} className="p-5 border border-border/50 bg-card rounded-2xl shadow-2xs hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                            <span className="text-lg">{stat.icon}</span>
                        </div>
                        <p
                            className={`text-3xl font-black mb-1 ${
                                (stat as any).accent
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                                    : "text-foreground"
                            }`}
                        >
                            {stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">{stat.sub}</p>
                    </Card>
                ))}
            </section>

            {/* Score Trend Section */}
            {recentScores.length >= 2 && (
                <Card className="p-5 border border-border/50 mb-8 rounded-2xl shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-foreground mb-0.5">Score Trend</p>
                            <p className="text-xs text-muted-foreground">Last {recentScores.length} sessions</p>
                        </div>
                        <div className="flex items-end gap-3">
                        <div className="text-right">
                                <p className="text-xs text-muted-foreground">Latest</p>
                                <p className="text-sm font-bold text-blue-600">{recentScores[recentScores.length - 1]}%</p>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Tabs Header */}
            <section className="mt-8 border-b border-border/60">
                <div className="flex gap-6">
                    {(["history", "resume"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                                activeTab === tab
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <span>{tab === "history" ? "📋 Interview History" : "📄 Resume Analysis"}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Tabs Content */}
            {activeTab === "history" && (
                <div className="mt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <p className="text-sm font-semibold text-muted-foreground">Your recent practice sessions</p>
                        {uniqueDomains.length > 1 && (
                            <div className="flex flex-wrap gap-2">
                                {uniqueDomains.map((d) => (
                                    <button
                                        key={d as string}
                                        onClick={() => setFilterDomain(d as string)}
                                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all cursor-pointer ${
                                            filterDomain === d
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "border-border text-muted-foreground hover:border-blue-600/50 hover:text-foreground"
                                        }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {dataLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="p-5 border border-border/50">
                                    <div className="animate-pulse flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-muted flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-muted rounded w-1/3"></div>
                                            <div className="h-4 bg-muted rounded w-1/2"></div>
                                        </div>
                                        <div className="w-16 h-8 bg-muted rounded-full" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-border/60 rounded-3xl p-8 bg-muted/20">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-3xl mx-auto mb-4">
                                🎯
                            </div>
                            <h3 className="text-base font-bold text-foreground mb-1">
                                {filterDomain === "All" ? "No interview sessions yet" : `No sessions for ${filterDomain}`}
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
                                {filterDomain === "All"
                                    ? "Start your first AI mock interview to get tailored feedback, score analytics, and placement readiness tracking."
                                    : "You haven't practiced in this domain yet. Take a session to evaluate your skills."}
                            </p>
                            <Button
                                onClick={() => setShowDomainSelector(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-full font-semibold cursor-pointer shadow-xs"
                            >
                                Start Practice Session ⚡
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filtered.map((interview) => {
                                const domainInfo = INTERVIEW_DOMAINS.find((d) => d.label === interview.topic);
                                return (
                                    <Card
                                        key={interview.id}
                                        className="p-5 border border-border/50 bg-card rounded-2xl shadow-2xs hover:border-blue-600/40 hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => setSelectedInterview(interview)}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                                                    {domainInfo?.icon || "🎯"}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-base font-bold text-foreground">{interview.topic}</p>
                                                        <ScoreBadge score={interview.score} />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <span>
                                                            {new Date(interview.date).toLocaleDateString("en-IN", {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            })}
                                                        </span>
                                                        <span>·</span>
                                                        <span>{interview.duration || 3} mins duration</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-xs text-muted-foreground">Session Score</p>
                                                    <p className="text-lg font-black text-foreground">{interview.score}%</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedInterview(interview);
                                                        }}
                                                        className="rounded-xl text-xs font-semibold cursor-pointer"
                                                    >
                                                        Review Feedback
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectDomain(interview.topic);
                                                        }}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                                                    >
                                                        Retake
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Resume Analysis Tab Content */}
            {activeTab === "resume" && <ResumePanel onDomainSelect={handleSelectDomain} />}

            {/* Domain Selector Modal */}
            {showDomainSelector && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowDomainSelector(false);
                    }}
                >
                    <Card className="w-full max-w-xl p-6 rounded-3xl border border-border bg-card shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Pick a Domain</h2>
                                <p className="text-sm text-muted-foreground">Choose what you want to practice today</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDomainSelector(false)}
                                className="rounded-full text-xs font-semibold cursor-pointer"
                            >
                                ✕
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                            {INTERVIEW_DOMAINS.map((domain, i) => (
                                <div
                                    key={i}
                                    onClick={() => {
                                        setShowDomainSelector(false);
                                        handleSelectDomain(domain.label);
                                    }}
                                    className="p-4 rounded-2xl border border-border/60 hover:border-blue-600/50 hover:bg-muted/40 transition-all cursor-pointer flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
                                        {domain.icon}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{domain.label}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{domain.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* Past Interview Details Modal */}
            {selectedInterview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedInterview(null);
                    }}
                >
                    <Card className="w-full max-w-2xl p-6 rounded-3xl border border-border bg-card shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-border/60">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-foreground">{selectedInterview.topic} Session Details</h3>
                                    <ScoreBadge score={selectedInterview.score} />
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Completed on {new Date(selectedInterview.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {selectedInterview.duration || 3}m duration
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedInterview(null)}
                                className="rounded-full text-xs font-semibold cursor-pointer"
                            >
                                ✕
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Feedback & Performance</h4>
                            <Card className="p-4 bg-muted/30 border border-border/50 rounded-2xl text-xs text-foreground leading-relaxed">
                                {selectedInterview.feedback || "Solid performance! Demonstrated clear understanding of core concepts and principles."}
                            </Card>
                        </div>

                        {selectedInterview.questions && selectedInterview.questions.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Questions & Answers</h4>
                                <div className="space-y-3">
                                    {selectedInterview.questions.map((q, idx) => (
                                        <div key={idx} className="p-3.5 rounded-2xl bg-card border border-border/60 text-xs space-y-1.5">
                                            <p className="font-bold text-foreground">Q{idx + 1}: {q.question}</p>
                                            <p className="text-muted-foreground pl-3 border-l-2 border-blue-600">Your Answer: {q.answer}</p>
                                            {q.feedback && <p className="text-emerald-600 font-medium pt-1">Feedback: {q.feedback}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedInterview(null)}
                                className="rounded-xl text-xs font-semibold cursor-pointer"
                            >
                                Close
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => {
                                    const topic = selectedInterview.topic;
                                    setSelectedInterview(null);
                                    handleSelectDomain(topic);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                            >
                                Retake Interview ⚡
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    );
}