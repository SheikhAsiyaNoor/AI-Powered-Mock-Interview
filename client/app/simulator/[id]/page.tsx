"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/Authcontext";
import api from "@/lib/axios";
import {
    Building2,
    Award,
    Target,
    Zap,
    CheckCircle2,
    XCircle,
    HelpCircle,
    ChevronRight,
    RotateCcw,
    Send,
    Mic,
    MicOff,
    Sparkles,
    ShieldCheck,
    Layers,
    ArrowLeft
} from "lucide-react";
import { useTabSwitchProctor } from "@/hooks/useTabSwitchProctor";
import { ProctorWarningModal } from "@/components/ProctorWarningModal";

interface DifficultyHistoryItem {
    questionNumber: number;
    difficulty: string;
    evaluation: string;
    score: number;
}

interface DimensionScores {
    technicalDepth: number;
    systemArchitecture: number;
    culturalAlignment: number;
    communication: number;
}

interface CompanyEvaluation {
    hiringVerdict: "Strong Hire" | "Hire" | "Lean Hire" | "Lean No Hire" | "No Hire";
    companyCutoff: number;
    companyStandardMet: boolean;
    dimensionScores: DimensionScores;
    cultureAlignmentFeedback: string;
    companySpecificFeedback: string;
}

interface InterviewSession {
    _id: string;
    company: string;
    roundType: string;
    domain: string;
    currDifficulty: string;
    score: number;
    questionsAnswered: number;
    messages: { role: "ai" | "user"; content: string; difficulty?: string; timeStamp?: string }[];
    askedQuestions: string[];
    difficultyHistory: DifficultyHistoryItem[];
    isComplete: boolean;
    companyEvaluation?: CompanyEvaluation;
}

export default function CompanySimulationRoom() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params?.id as string;
    const { isLoggedIn, isLoading: authLoading } = useAuth();

    const [session, setSession] = useState<InterviewSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [answerText, setAnswerText] = useState("");
    const [isListening, setIsListening] = useState(false);

    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push("/login");
            return;
        }

        if (isLoggedIn && sessionId) {
            fetchSession();
        }
    }, [isLoggedIn, authLoading, sessionId, router]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [session?.messages]);

    // Speech recognition setup
    useEffect(() => {
        if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
            const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRec();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let transcript = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                setAnswerText((prev) => `${prev} ${transcript}`.trim());
            };

            recognitionRef.current.onerror = (err: any) => {
                console.error("Speech Recognition Error:", err);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleSpeech = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const [error, setError] = useState<string | null>(null);

    const fetchSession = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get(`/api/simulator/${sessionId}`);
            if (res.data && res.data.interview) {
                setSession(res.data.interview);
                return;
            }
            throw new Error("Simulation session not found on server.");
        } catch (err: any) {
            console.error("Failed to load company simulation session:", err);
            setError(err?.response?.data?.message || err.message || "Failed to load simulation session from server.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendAnswer = async (e?: React.FormEvent, customAnswer?: string) => {
        if (e) e.preventDefault();
        const textToSend = customAnswer || answerText;
        if (!textToSend.trim() || submitting || !session) return;

        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

        try {
            setSubmitting(true);
            const currentCount = session.questionsAnswered || 0;

            const res = await api.post("/api/simulator/submit-answer", {
                sessionId: session._id,
                answer: textToSend,
                questionsAnswered: currentCount
            });

            if (res.data) {
                setAnswerText("");
                fetchSession();
                return;
            }
            throw new Error("No evaluation response received from server.");
        } catch (err: any) {
            console.error("Error submitting simulation answer:", err);
            const errMsg = err?.response?.data?.message || err.message || "Failed to submit answer to server.";
            alert(`Error submitting answer: ${errMsg}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = () => {
        handleSendAnswer(undefined, "skip");
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4 p-8">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground font-medium animate-pulse">
                    Connecting to Company Simulation Room...
                </p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
                <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <h2 className="text-xl font-bold text-foreground">Simulation Session Not Found</h2>
                <p className="text-xs text-muted-foreground">The interview session could not be retrieved.</p>
                <button
                    onClick={() => router.push("/simulator")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                >
                    Back to Simulator Hub
                </button>
            </div>
        );
    }

    const handleAutoQuitSimulation = () => {
        if (session && !session.isComplete) {
            handleSendAnswer(undefined, "[Session auto-terminated due to multiple tab switch violations.]");
        }
    };

    // Tab Switch Anti-Cheating Proctoring (4 Warnings -> Auto-Quit)
    const {
        switchCount,
        showWarningModal,
        isTerminated,
        terminationMessage,
        dismissWarning
    } = useTabSwitchProctor({
        maxAllowedSwitches: 4,
        isActive: isLoggedIn && !loading && !!session && !session.isComplete,
        sessionType: "interview",
        onAutoQuit: handleAutoQuitSimulation
    });

    const { company, roundType, domain, currDifficulty, questionsAnswered, messages, isComplete, companyEvaluation, score } = session;
    const currentQNumber = Math.min(5, (questionsAnswered || 0) + 1);

    const getVerdictBadgeStyle = (verdict?: string) => {
        switch (verdict) {
            case "Strong Hire":
                return "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20";
            case "Hire":
                return "bg-blue-600 text-white shadow-lg shadow-blue-500/20";
            case "Lean Hire":
                return "bg-teal-600 text-white";
            case "Lean No Hire":
                return "bg-amber-600 text-white";
            default:
                return "bg-rose-600 text-white";
        }
    };

    return (
        <div className="font-sans max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* HEADER BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/simulator")}
                        className="p-2 rounded-xl border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                        title="Back to Hub"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-foreground">{company} Recruiter Simulator</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                {roundType}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Domain: <strong>{domain}</strong> · Current Difficulty: <strong>{currDifficulty}</strong>
                        </p>
                    </div>
                </div>

                {/* Progress Pill */}
                <div className="flex items-center gap-3">
                    <div className="text-right text-xs">
                        <span className="font-bold text-foreground">Question {currentQNumber} of 5</span>
                        <span className="text-[10px] text-muted-foreground block">
                            {isComplete ? "Completed" : `${Math.round(((currentQNumber - 1) / 5) * 100)}% Finished`}
                        </span>
                    </div>
                    <div className="w-24 bg-muted rounded-full h-2 overflow-hidden border border-border/50">
                        <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(Math.min(5, isComplete ? 5 : currentQNumber) / 5) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* LIVE SIMULATION OR FINAL REPORT VIEW */}
            {isComplete && companyEvaluation ? (
                /* FINAL HIRING DECISION REPORT SCREEN */
                <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                    <div className="text-center space-y-3 pb-6 border-b border-border/50">
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-3xl">🏢</span>
                            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                                {company} Hiring Committee Decision Report
                            </h2>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                            Evaluated against {company}'s official hiring standard benchmarks and round criteria.
                        </p>

                        {/* Verdict Badge */}
                        <div className="pt-2 flex justify-center">
                            <div className={`px-6 py-2 rounded-2xl text-base font-extrabold tracking-wide uppercase ${getVerdictBadgeStyle(companyEvaluation.hiringVerdict)}`}>
                                ★ Verdict: {companyEvaluation.hiringVerdict}
                            </div>
                        </div>
                    </div>

                    {/* SCORE VS CUTOFF BAR */}
                    <div className="bg-muted/30 border border-border/60 rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold">
                            <span>Candidate Performance: <strong className="text-blue-600 text-sm">{score}%</strong></span>
                            <span>{company} Target Cutoff: <strong className="text-foreground text-sm">{companyEvaluation.companyCutoff}%</strong></span>
                        </div>

                        <div className="relative w-full bg-muted rounded-full h-4 overflow-hidden border border-border/60">
                            {/* Candidate Progress */}
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${
                                    companyEvaluation.companyStandardMet ? "bg-emerald-500" : "bg-blue-600"
                                }`}
                                style={{ width: `${Math.min(100, score)}%` }}
                            ></div>

                            {/* Cutoff Marker Line */}
                            <div
                                className="absolute top-0 bottom-0 w-1 bg-red-500 z-10"
                                style={{ left: `${companyEvaluation.companyCutoff}%` }}
                                title={`Cutoff: ${companyEvaluation.companyCutoff}%`}
                            ></div>
                        </div>

                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>0% (Foundational)</span>
                            <span className="text-red-500 font-bold">▲ Cutoff Bar ({companyEvaluation.companyCutoff}%)</span>
                            <span>100% (Exceptional)</span>
                        </div>
                    </div>

                    {/* 4 DIMENSION SCORECARD */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Dimension Scorecard Breakdown:
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 text-center space-y-1">
                                <div className="text-xs font-semibold text-muted-foreground">Technical Depth</div>
                                <div className="text-xl font-bold text-foreground">{companyEvaluation.dimensionScores?.technicalDepth || score}%</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 text-center space-y-1">
                                <div className="text-xs font-semibold text-muted-foreground">System Architecture</div>
                                <div className="text-xl font-bold text-foreground">{companyEvaluation.dimensionScores?.systemArchitecture || score}%</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 text-center space-y-1">
                                <div className="text-xs font-semibold text-muted-foreground">Cultural Fit</div>
                                <div className="text-xl font-bold text-foreground">{companyEvaluation.dimensionScores?.culturalAlignment || score}%</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 text-center space-y-1">
                                <div className="text-xs font-semibold text-muted-foreground">Communication</div>
                                <div className="text-xl font-bold text-foreground">{companyEvaluation.dimensionScores?.communication || score}%</div>
                            </div>
                        </div>
                    </div>

                    {/* FEEDBACK & ADVICE CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-2">
                            <div className="font-bold text-foreground flex items-center gap-2">
                                <span>🎯</span> Cultural & Persona Alignment
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                {companyEvaluation.cultureAlignmentFeedback}
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-2">
                            <div className="font-bold text-foreground flex items-center gap-2">
                                <span>💡</span> Recommendations for {company}
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                {companyEvaluation.companySpecificFeedback}
                            </p>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/50">
                        <button
                            onClick={() => router.push("/simulator")}
                            className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground cursor-pointer"
                        >
                            ← Simulate Another Company
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.push("/readiness")}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-muted border border-border hover:bg-muted/80 text-foreground cursor-pointer"
                            >
                                View Placement Readiness 🚀
                            </button>
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* LIVE INTERVIEW STREAM */
                <div className="space-y-6">
                    {/* Chat Messages Stream */}
                    <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex items-start gap-3 ${
                                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                }`}
                            >
                                <div
                                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                                        msg.role === "user"
                                            ? "bg-blue-600 text-white"
                                            : "bg-muted border border-border/60 text-foreground"
                                    }`}
                                >
                                    {msg.role === "user" ? "You" : company?.[0] || "AI"}
                                </div>

                                <div
                                    className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed ${
                                        msg.role === "user"
                                            ? "bg-blue-600 text-white rounded-tr-none shadow-xs"
                                            : "bg-card border border-border/60 text-foreground rounded-tl-none shadow-xs"
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                    {msg.difficulty && (
                                        <span className="text-[9px] opacity-70 mt-1 block font-mono">
                                            Difficulty Tier: {msg.difficulty}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* ANSWER INPUT FORM */}
                    <form onSubmit={handleSendAnswer} className="bg-card border border-border/60 rounded-3xl p-4 space-y-3 shadow-md">
                        <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                            <span className="font-semibold flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-blue-600" /> Your Response to {company} Interviewer:
                            </span>
                            <span className="text-[11px] font-mono">{answerText.length} characters</span>
                        </div>

                        <textarea
                            rows={4}
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            placeholder={`Type your response explaining your thought process, architecture trade-offs, or code logic...`}
                            disabled={submitting}
                            className="w-full p-3 rounded-2xl bg-muted/40 border border-border/60 text-foreground text-xs focus:outline-blue-600 placeholder:text-muted-foreground/60 resize-none"
                        />

                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={toggleSpeech}
                                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                                        isListening
                                            ? "bg-red-500/10 border-red-500 text-red-600 animate-pulse"
                                            : "border-border hover:bg-muted text-muted-foreground"
                                    }`}
                                    title={isListening ? "Stop Voice Input" : "Start Voice Input"}
                                >
                                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    <span className="hidden sm:inline">{isListening ? "Listening..." : "Speak"}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSkip}
                                    disabled={submitting}
                                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted border border-border/50 cursor-pointer disabled:opacity-50"
                                >
                                    Skip Topic
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !answerText.trim()}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Evaluating Response...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Submit Answer</span>
                                        <Send className="w-3.5 h-3.5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Anti-Cheating Tab Switch Warning & Disqualification Modal */}
            <ProctorWarningModal
                isOpen={showWarningModal}
                switchCount={switchCount}
                maxAllowedSwitches={4}
                isTerminated={isTerminated}
                terminationMessage={terminationMessage}
                sessionType="interview"
                onDismiss={dismissWarning}
            />
        </div>
    );
}
