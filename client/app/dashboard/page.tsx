"use client";
import { useAuth } from "@/context/Authcontext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Sparkles,
    Send,
    Copy,
    Check,
    FileText,
    Briefcase,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    HelpCircle,
    Upload,
    ArrowRight,
    TrendingUp,
    Target,
    Layers,
    ListPlus,
    Wand2
} from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

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
    targetRole?: string;
    experienceLevel: "Junior" | "Mid" | "Senior";
    atsScore?: number;
    atsBreakdown?: {
        keywordMatch: number;
        skillsRelevance: number;
        experienceAlignment: number;
        formattingAndStructure: number;
    };
    skillsDetected: string[];
    matchingKeywords?: string[];
    missingKeywords?: string[];
    strengths: string[];
    whatNeedsToBeAdded?: string[];
    recommendedBulletPoints?: string[];
    recommendedDomains: { label: string; reason: string; confidence: number }[];
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

const ROLE_PRESETS = [
    "Full Stack Developer",
    "Frontend React Engineer",
    "Backend Node.js Engineer",
    "Python / AI Engineer",
    "DevOps Cloud Engineer",
    "Data Scientist / ML",
    "Java Spring Developer",
    "Mobile iOS/Android Developer"
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
    const jdFileRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [targetRole, setTargetRole] = useState("Full Stack Developer");
    const [jdMode, setJdMode] = useState<"text" | "file">("text");
    const [jobDescriptionText, setJobDescriptionText] = useState("");
    const [jdFile, setJdFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);

    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [extractedSnippets, setExtractedSnippets] = useState<{
        resumeSnippet?: string;
        jobDescriptionSnippet?: string;
    }>({});
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<"upload" | "analyzing" | "results">("upload");
    const [analyzingStep, setAnalyzingStep] = useState(0);

    // Follow-Up Chat State
    const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
        {
            role: "assistant",
            content: "👋 Hi! I'm your AI Resume & ATS Coach. Ask me any follow-up questions like: *'How should I reword my project?'*, *'Why this ATS score?'*, or *'Draft a bullet point for my experience.'*"
        }
    ]);
    const [inputQuestion, setInputQuestion] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const analyzingSteps = [
        "Extracting and parsing text streams...",
        "Evaluating ATS keyword compatibility...",
        "Analyzing target role & job requirements...",
        "Detecting missing skills & generating STAR bullet points...",
        "Synthesizing customized domain recommendations...",
    ];

    useEffect(() => {
        if (step === "results" && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, step]);

    const handleFile = (f: File) => {
        const allowed = [
            "application/pdf",
            "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        const isPdfExt = (f.name || "").toLowerCase().endsWith(".pdf");
        if (!allowed.includes(f.type) && !isPdfExt) {
            setError("Please upload a PDF, DOC, DOCX, or TXT file.");
            return;
        }
        if (f.size > 15 * 1024 * 1024) {
            setError("Resume file must be under 15MB.");
            return;
        }
        setFile(f);
        setError(null);
    };

    const handleJdFile = (f: File) => {
        if (f.size > 10 * 1024 * 1024) {
            setError("Job description file must be under 10MB.");
            return;
        }
        setJdFile(f);
        setError(null);
    };

    const handleAnalyze = async () => {
        if (!file) {
            setError("Please upload your resume file first.");
            return;
        }
        setStep("analyzing");
        setError(null);
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % analyzingSteps.length;
            setAnalyzingStep(idx);
        }, 1200);

        try {
            const formData = new FormData();
            formData.append("resume", file);
            formData.append("targetRole", targetRole || "Software Engineer");
            if (jobDescriptionText.trim()) {
                formData.append("jobDescriptionText", jobDescriptionText.trim());
            }
            if (jdFile) {
                formData.append("jobDescriptionFile", jdFile);
            }

            const { data } = await axiosInstance.post("/api/resume/analyze", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const parsedAnalysis = data.analysis || data;
            setAnalysis(parsedAnalysis);
            setExtractedSnippets({
                resumeSnippet: data.resumeSnippet,
                jobDescriptionSnippet: data.jobDescriptionSnippet
            });

            // Seed introductory chat message tailored to role & score
            const scoreNum = parsedAnalysis.atsScore ?? 75;
            setChatMessages([
                {
                    role: "assistant",
                    content: `🎉 Resume evaluation complete for **${parsedAnalysis.targetRole || targetRole}**! Your overall ATS Match Score is **${scoreNum}%**.\n\nYou have strong foundational skills, but there are **${parsedAnalysis.missingKeywords?.length || 0} missing keywords** you could add. What questions do you have about optimizing your resume?`
                }
            ]);

            setStep("results");
        } catch (err: any) {
            console.error("Resume analysis error:", err);
            setError(err?.response?.data?.message || "Failed to analyze resume. Please try again.");
            setStep("upload");
        } finally {
            clearInterval(interval);
        }
    };

    const handleSendChat = async (presetQuestion?: string) => {
        const textToSend = presetQuestion || inputQuestion;
        if (!textToSend.trim() || isChatLoading) return;

        const userMsg = textToSend.trim();
        setInputQuestion("");
        setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setIsChatLoading(true);

        try {
            const { data } = await axiosInstance.post("/api/resume/chat", {
                message: userMsg,
                conversationHistory: chatMessages,
                resumeContext: {
                    targetRole: analysis?.targetRole || targetRole,
                    atsScore: analysis?.atsScore,
                    missingKeywords: analysis?.missingKeywords,
                    skillsDetected: analysis?.skillsDetected,
                    summary: analysis?.summary,
                    jobDescriptionSnippet: extractedSnippets.jobDescriptionSnippet
                }
            });

            setChatMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.reply || "Here are additional actionable tips to strengthen your resume." }
            ]);
        } catch (err: any) {
            console.error("Chat error:", err);
            setChatMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, I couldn't process your question right now. Please try asking again." }
            ]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const copyBulletPoint = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const reset = () => {
        setFile(null);
        setJdFile(null);
        setJobDescriptionText("");
        setAnalysis(null);
        setError(null);
        setStep("upload");
    };

    const atsScore = analysis?.atsScore ?? 75;
    const atsScoreColor =
        atsScore >= 80
            ? "text-emerald-500 border-emerald-500"
            : atsScore >= 65
            ? "text-blue-500 border-blue-500"
            : atsScore >= 45
            ? "text-amber-500 border-amber-500"
            : "text-rose-500 border-rose-500";

    const atsScoreBadge =
        atsScore >= 80
            ? { text: "High ATS Match 🚀", bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" }
            : atsScore >= 65
            ? { text: "Moderate ATS Match ⚡", bg: "bg-blue-500/10 text-blue-600 border-blue-500/20" }
            : { text: "Needs Improvement ⚠️", bg: "bg-amber-500/10 text-amber-600 border-amber-500/20" };

    return (
        <div className="mt-6 space-y-6">
            <Card className="p-6 border border-border/50 rounded-3xl shadow-2xs">
                {/* Panel Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-2xl font-bold shadow-xs">
                            📄
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                AI Resume & ATS Evaluation
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-extrabold uppercase tracking-wider">
                                    Smart Match
                                </span>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Role-targeted evaluation · ATS scoring · Missing keywords · Interactive AI Coach
                            </p>
                        </div>
                    </div>

                    {step === "results" && (
                        <Button variant="outline" size="sm" onClick={reset} className="rounded-xl text-xs cursor-pointer">
                            Analyze Another Resume ↗
                        </Button>
                    )}
                </div>

                {/* Upload & Config Step */}
                {step === "upload" && (
                    <div className="space-y-6">
                        {/* Target Role & Preset Chips */}
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                                Target Role You Are Applying For:
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    placeholder="e.g. Full Stack Developer, Senior Backend Engineer, Data Scientist"
                                    className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-muted/40 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                                />
                            </div>

                            {/* Preset Role Badges */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[11px] text-muted-foreground font-medium">Quick presets:</span>
                                {ROLE_PRESETS.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setTargetRole(preset)}
                                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                            targetRole === preset
                                                ? "bg-blue-600 text-white border-blue-600 font-bold"
                                                : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                                        }`}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Optional Job Description Input */}
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                    Job Description / Requirements <span className="text-[11px] font-normal text-muted-foreground">(Optional for exact ATS matching)</span>
                                </label>

                                <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-[11px]">
                                    <button
                                        type="button"
                                        onClick={() => setJdMode("text")}
                                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                                            jdMode === "text" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground"
                                        }`}
                                    >
                                        Paste Text
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setJdMode("file")}
                                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                                            jdMode === "file" ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground"
                                        }`}
                                    >
                                        Upload PDF/Doc
                                    </button>
                                </div>
                            </div>

                            {jdMode === "text" ? (
                                <textarea
                                    rows={3}
                                    value={jobDescriptionText}
                                    onChange={(e) => setJobDescriptionText(e.target.value)}
                                    placeholder="Paste the job posting description, required qualifications, or key skills here to evaluate exact keyword fit..."
                                    className="w-full p-3 rounded-xl text-xs bg-card border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                                />
                            ) : (
                                <div
                                    onClick={() => jdFileRef.current?.click()}
                                    className="p-4 border border-dashed rounded-xl text-center cursor-pointer hover:bg-muted/40 transition-all border-border/60"
                                >
                                    <input
                                        ref={jdFileRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) handleJdFile(e.target.files[0]);
                                        }}
                                    />
                                    <p className="text-xs font-semibold text-foreground">
                                        {jdFile ? `📎 ${jdFile.name}` : "Click to attach Job Description PDF / DOCX"}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Max 10 MB</p>
                                </div>
                            )}
                        </div>

                        {/* Resume File Dropzone */}
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
                            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                                dragging
                                    ? "border-blue-600 bg-blue-50/10"
                                    : file
                                    ? "border-emerald-500/60 bg-emerald-500/5"
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
                            <div className="text-4xl mb-2">{file ? "✅" : "☁️"}</div>
                            <h3 className="text-base font-bold text-foreground mb-1">
                                {file ? file.name : "Drop your resume file here"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · Click to change file` : "or click to browse · Supports PDF, Word (.doc, .docx), TXT · Max 15 MB"}
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 font-semibold text-center flex items-center justify-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {/* Action Buttons */}
                        {file && (
                            <div className="flex items-center justify-center gap-4">
                                <Button variant="outline" onClick={reset} className="rounded-full px-6 cursor-pointer">
                                    Clear
                                </Button>
                                <Button
                                    onClick={handleAnalyze}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full px-8 py-2.5 font-bold cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Evaluate Resume & ATS Fit
                                </Button>
                            </div>
                        )}

                        {/* 4 Feature Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                            {[
                                { icon: "🎯", title: "Targeted ATS Score", desc: "Keyword matching against job requirements" },
                                { icon: "⚠️", title: "Missing Keywords", desc: "Identifies crucial omitted skills" },
                                { icon: "✍️", title: "STAR Bullet Points", desc: "Actionable phrasing & additions" },
                                { icon: "💬", title: "Interactive Coach", desc: "Real-time follow-up Q&A chat" },
                            ].map((f, i) => (
                                <div key={i} className="p-3.5 rounded-2xl bg-muted/30 border border-border/40">
                                    <span className="text-lg mb-1 block">{f.icon}</span>
                                    <p className="text-xs font-bold text-foreground">{f.title}</p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Analyzing Loader Step */}
                {step === "analyzing" && (
                    <div className="py-16 text-center max-w-md mx-auto space-y-5">
                        <div className="relative w-16 h-16 mx-auto">
                            <div className="w-16 h-16 border-4 border-blue-600/30 rounded-full" />
                            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center text-xl">📄</div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Evaluating Your Resume</h3>
                            <p className="text-xs text-muted-foreground mt-1">Targeting {targetRole}</p>
                        </div>
                        <p className="text-xs text-blue-600 font-semibold bg-blue-500/10 py-1.5 px-4 rounded-full inline-block animate-pulse">
                            {analyzingSteps[analyzingStep]}
                        </p>
                    </div>
                )}

                {/* Results Step */}
                {step === "results" && analysis && (
                    <div className="space-y-6 pt-2">
                        {/* Auto-Sync with Readiness Engine Notification */}
                        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>ATS Score ({atsScore}%) automatically synced to your AI Placement Readiness Engine!</span>
                            </div>
                            <Link
                                href="/readiness"
                                className="shrink-0 font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                                View Readiness Dashboard & Roadmap →
                            </Link>
                        </div>

                        {/* ATS Score & Dimension Breakdown Card */}
                        <Card className="p-6 border border-border/60 rounded-3xl bg-card shadow-xs">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                {/* ATS Score Circle / Gauge */}
                                <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-muted/20 border border-border/40">
                                    <div className="relative w-28 h-28 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                            <path
                                                className="text-muted/60"
                                                strokeWidth="3.5"
                                                stroke="currentColor"
                                                fill="none"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                            <path
                                                className={atsScore >= 80 ? "text-emerald-500" : atsScore >= 65 ? "text-blue-600" : "text-amber-500"}
                                                strokeDasharray={`${atsScore}, 100`}
                                                strokeWidth="3.5"
                                                strokeLinecap="round"
                                                stroke="currentColor"
                                                fill="none"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center justify-center">
                                            <span className="text-2xl font-black text-foreground">{atsScore}%</span>
                                            <span className="text-[9px] uppercase font-extrabold text-muted-foreground tracking-wider">ATS Score</span>
                                        </div>
                                    </div>

                                    <span className={`text-[11px] px-3 py-1 rounded-full border font-bold mt-3 ${atsScoreBadge.bg}`}>
                                        {atsScoreBadge.text}
                                    </span>
                                    <p className="text-[11px] text-muted-foreground mt-1.5">Target: <strong className="text-foreground">{analysis.targetRole || targetRole}</strong></p>
                                </div>

                                {/* 4 Dimension Bars */}
                                <div className="md:col-span-8 space-y-3.5">
                                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                                        ATS Criteria Breakdown
                                    </h4>

                                    {[
                                        { label: "Target Keyword Match", pct: analysis.atsBreakdown?.keywordMatch ?? Math.round(atsScore * 0.95) },
                                        { label: "Technical Skills Relevance", pct: analysis.atsBreakdown?.skillsRelevance ?? Math.round(atsScore * 1.02) },
                                        { label: "Experience & Role Alignment", pct: analysis.atsBreakdown?.experienceAlignment ?? Math.round(atsScore * 0.98) },
                                        { label: "ATS Formatting & Structure", pct: analysis.atsBreakdown?.formattingAndStructure ?? 85 },
                                    ].map((bar, i) => {
                                        const cleanPct = Math.min(100, Math.max(0, bar.pct));
                                        const barColor =
                                            cleanPct >= 75
                                                ? "bg-emerald-500 text-emerald-600 dark:text-emerald-400"
                                                : cleanPct >= 50
                                                ? "bg-blue-600 text-blue-600 dark:text-blue-400"
                                                : "bg-amber-500 text-amber-600 dark:text-amber-400";
                                        return (
                                            <div key={i} className="space-y-1">
                                                <div className="flex justify-between text-xs font-semibold">
                                                    <span className="text-foreground">{bar.label}</span>
                                                    <span className={`font-bold ${barColor.split(" ")[1]}`}>{cleanPct}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${barColor.split(" ")[0]} rounded-full transition-all duration-700`}
                                                        style={{ width: `${cleanPct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>

                        {/* Summary & Candidate Overview */}
                        <Card className="p-5 border border-border/50 rounded-2xl bg-muted/20 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <span>🧠</span> Professional AI Summary
                                </h4>
                                <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 font-semibold border border-blue-500/20">
                                    {analysis.experienceLevel} Level
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{analysis.summary}</p>

                            {/* Skills Detected */}
                            {analysis.skillsDetected?.length > 0 && (
                                <div className="pt-3 border-t border-border/60">
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                        🛠 Detected Technical Skills ({analysis.skillsDetected.length})
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

                            {/* Missing Keywords To Add */}
                            {analysis.missingKeywords && analysis.missingKeywords.length > 0 && (
                                <div className="pt-3 border-t border-border/60">
                                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Missing Critical Keywords for {analysis.targetRole || targetRole}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {analysis.missingKeywords.map((kw, idx) => (
                                            <span key={idx} className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20 flex items-center gap-1">
                                                + {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* What Needs To Be Added (Action Checklist) */}
                        {analysis.whatNeedsToBeAdded && analysis.whatNeedsToBeAdded.length > 0 && (
                            <Card className="p-5 border border-amber-500/30 bg-amber-500/5 rounded-2xl space-y-3">
                                <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                    <ListPlus className="w-4 h-4 text-amber-600" />
                                    What Needs To Be Added to Pass ATS Filters
                                </h4>
                                <div className="space-y-2">
                                    {analysis.whatNeedsToBeAdded.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
                                                {idx + 1}
                                            </span>
                                            <p className="leading-relaxed">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Recommended STAR Bullet Points */}
                        {analysis.recommendedBulletPoints && analysis.recommendedBulletPoints.length > 0 && (
                            <Card className="p-5 border border-indigo-500/30 bg-indigo-500/5 rounded-2xl space-y-3">
                                <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                                    <Wand2 className="w-4 h-4 text-indigo-600" />
                                    Recommended High-Impact Bullet Points (Ready to Copy)
                                </h4>
                                <p className="text-[11px] text-muted-foreground">
                                    Tailored specifically for {analysis.targetRole || targetRole} using the STAR method:
                                </p>
                                <div className="space-y-2.5">
                                    {analysis.recommendedBulletPoints.map((bp, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3.5 rounded-xl bg-card border border-border/60 flex items-start justify-between gap-3 group"
                                        >
                                            <p className="text-xs text-foreground leading-relaxed select-all">
                                                • {bp}
                                            </p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => copyBulletPoint(bp, idx)}
                                                className="rounded-lg text-[11px] h-7 px-2.5 flex-shrink-0 cursor-pointer border-border/60 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                                            >
                                                {copiedIndex === idx ? (
                                                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                                        <Check className="w-3 h-3" /> Copied!
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                        <Copy className="w-3 h-3" /> Copy
                                                    </span>
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Strengths Card */}
                        {analysis.strengths?.length > 0 && (
                            <Card className="p-5 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl">
                                <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Your Profile Strengths
                                </h4>
                                <ul className="space-y-1.5 pl-5 list-disc text-xs text-muted-foreground">
                                    {analysis.strengths.map((str, i) => (
                                        <li key={i}>{str}</li>
                                    ))}
                                </ul>
                            </Card>
                        )}

                        {/* Recommended Interview Domains */}
                        <div>
                            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-600" />
                                Recommended Mock Interview Practice
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {analysis.recommendedDomains?.map((rec, i) => (
                                    <div
                                        key={i}
                                        onClick={() => onDomainSelect(rec.label)}
                                        className="p-4 rounded-2xl border border-border/60 hover:border-blue-600/50 hover:bg-muted/40 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <p className="text-xs font-bold text-foreground group-hover:text-blue-600 transition-colors">
                                                    {rec.label}
                                                </p>
                                                {i === 0 && (
                                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold uppercase tracking-wider">
                                                        Top Fit
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground line-clamp-2">{rec.reason}</p>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                            <span className="text-[10px] font-bold text-blue-600">{rec.confidence}% match</span>
                                            <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1">
                                                Start Interview <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive AI Resume Coach Chat Box */}
                        <Card className="p-5 border border-blue-500/30 rounded-3xl bg-card shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                                        🤖
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-foreground">Ask AI Resume Coach</h4>
                                        <p className="text-[11px] text-muted-foreground">Ask follow-up questions to refine wording, metrics, or interview answers</p>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Messages Stream */}
                            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                {chatMessages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        {msg.role === "assistant" && (
                                            <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                                                🤖
                                            </div>
                                        )}
                                        <div
                                            className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                                                msg.role === "user"
                                                    ? "bg-blue-600 text-white rounded-br-xs"
                                                    : "bg-muted/50 border border-border/60 text-foreground rounded-bl-xs"
                                            }`}
                                        >
                                            {msg.role === "assistant" ? (
                                                <MarkdownRenderer content={msg.content} />
                                            ) : (
                                                <div className="whitespace-pre-line">{msg.content}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isChatLoading && (
                                    <div className="flex gap-2.5 items-center text-xs text-muted-foreground">
                                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs">
                                            🤖
                                        </div>
                                        <span className="animate-pulse font-medium">Coach is typing advice...</span>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Starter Quick Prompt Chips */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {[
                                    "How should I reword my project description?",
                                    "Why is my ATS score this and how to reach 90%?",
                                    "Write a strong STAR bullet point for my experience",
                                    "How do I explain missing skills in an interview?"
                                ].map((q, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSendChat(q)}
                                        className="text-[11px] px-2.5 py-1 rounded-lg bg-muted/40 border border-border/50 text-muted-foreground hover:text-blue-600 hover:border-blue-500/40 transition-all cursor-pointer text-left"
                                    >
                                        💡 {q}
                                    </button>
                                ))}
                            </div>

                            {/* Chat Input Box */}
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="text"
                                    value={inputQuestion}
                                    onChange={(e) => setInputQuestion(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendChat();
                                        }
                                    }}
                                    placeholder="Ask anything (e.g. 'How should I word my React project to sound more senior?')..."
                                    className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-muted/40 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                                />
                                <Button
                                    onClick={() => handleSendChat()}
                                    disabled={!inputQuestion.trim() || isChatLoading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-50"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </Card>
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