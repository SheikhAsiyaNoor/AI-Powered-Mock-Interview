"use client";
import { useAuth } from "@/context/Authcontext";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ChatContainer, { Message } from "@/components/ui/ChatContainer";
import InputBox from "@/components/ui/InputBox";
import axiosInstance from "@/lib/axios";
import { useTabSwitchProctor } from "@/hooks/useTabSwitchProctor";
import { ProctorWarningModal } from "@/components/ProctorWarningModal";
import useVoiceInterview from "@/hooks/useVoiceInterview";
import VoiceInterviewRoom from "@/components/VoiceInterviewRoom";
import { MessageSquare, Mic } from "lucide-react";

interface InterviewSession {
    id: string;
    score?: number;
    feedback?: string;
    isComplete?: boolean;
}

const TOTAL_QUESTIONS = 5;

const DOMAIN_EMOJIS: Record<string, string> = {
    "JavaScript": "🟨",
    "JavaScript/Node.js": "🟨",
    "React": "⚛️",
    "Python": "🐍",
    "Data Science": "📊",
    "DevOps": "⚙️",
    "System Design": "🏗️",
    "Database Design": "💾",
};

function ProgressDots({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${i < current ? "w-6 bg-blue-600" : "w-2 bg-muted"
                        }`}
                />
            ))}
        </div>
    );
}

function ScoreRing({ score }: { score: number }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? "#22c55e" : score >= 60 ? "#3b82f6" : "#f97316";

    return (
        <div className="relative flex items-center justify-center w-32 h-32 my-4 mx-auto">
            <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-border"
                />
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-foreground">{score}%</span>
            </div>
        </div>
    );
}

function InterviewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isLoggedIn, isLoading: authLoading } = useAuth();

    const domain = searchParams.get("domain") || "JavaScript/Node.js";
    const domainEmoji = DOMAIN_EMOJIS[domain] || "🎯";

    const [sessionId, setSessionId] = useState<string>("");
    const [interviewScore, setInterviewScore] = useState<number | null>(null);
    const [isInterviewComplete, setIsInterviewComplete] = useState(false);
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [sessionStartTime] = useState(Date.now());
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentDifficulty, setCurrentDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [difficultyHistory, setDifficultyHistory] = useState<Array<{ questionNumber: number; difficulty: string; evaluation: string; score: number }>>([]);
    const [progressionReport, setProgressionReport] = useState<string>('');
    const [interviewMode, setInterviewMode] = useState<"chat" | "voice">("chat");
    const [latestFeedback, setLatestFeedback] = useState<string>("");
    const [currentQuestionText, setCurrentQuestionText] = useState<string>("");
    const [dimensionScores, setDimensionScores] = useState<{
        technicalAccuracy: number;
        communicationClarity: number;
        problemSolving: number;
    } | null>(null);

    const voice = useVoiceInterview({ autoSpeak: true, initialRate: 1.0 });

    const handleSkipQuestion = () => {
        handleSendMessage("[Skipped Question]");
    };

    const handleAutoQuitInterview = async () => {
        setIsInterviewComplete(true);
        voice.stopSpeaking();
        voice.stopListening();
        if (sessionId) {
            try {
                const { data } = await axiosInstance.post("/api/interviews/end", {
                    sessionId,
                    forceQuitReason: "Session terminated due to 4 tab-switch violations."
                });
                if (data) {
                    setInterviewScore(typeof data.score === 'number' ? data.score : 0);
                    setProgressionReport("Interview Auto-Terminated: You switched tabs 4 times during the live evaluation.");
                }
            } catch (err) {
                console.error("Error auto-ending interview:", err);
            }
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
        isActive: isLoggedIn && !isInterviewComplete && !!sessionId,
        sessionType: "interview",
        onAutoQuit: handleAutoQuitInterview
    });

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push("/login");
        }
    }, [isLoggedIn, authLoading, router]);

    useEffect(() => {
        if (isLoggedIn) startInterview();
    }, [isLoggedIn]);

    useEffect(() => {
        if (isInterviewComplete) return;
        const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
        return () => clearInterval(t);
    }, [isInterviewComplete]);

    // Ensure all audio and microphone streams are stopped when leaving page
    useEffect(() => {
        return () => {
            voice.stopListening();
            voice.stopSpeaking();
        };
    }, [voice]);

    const startInterview = async () => {
        try {
            setIsLoading(true);
            const { data } = await axiosInstance.post("/api/interviews/start", { domain });
            if (data) {
                const initialQ = data.question || "Tell me about your experience with " + domain + ".";
                setSessionId(data.sessionId);
                setQuestionsAnswered(0);
                setCurrentDifficulty(data.difficulty || "Medium");
                setCurrentQuestionText(initialQ);
                setDimensionScores(null);
                setMessages([
                    {
                        id: "1",
                        content: initialQ,
                        isUser: false,
                        difficulty: data.difficulty || "Medium",
                        timestamp: new Date(),
                    },
                ]);
            }
        } catch (error) {
            setMessages([
                {
                    id: "1",
                    content: "Connection error. Please check your network",
                    isUser: false,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (userMessage: string) => {
        if (!userMessage.trim() || !sessionId) return;

        const isSkippedAction = userMessage === "[Skipped Question]";

        setMessages((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                content: userMessage,
                isUser: true,
                timestamp: new Date(),
            },
        ]);

        setIsLoading(true);
        try {
            const { data } = await axiosInstance.post("/api/interviews/submit-answer", {
                sessionId,
                answer: userMessage,
                domain,
                questionsAnswered,
                isSkipped: isSkippedAction,
            });

            if (data) {
                const newCount = questionsAnswered + 1;
                setQuestionsAnswered(newCount);
                if (data.difficultyHistory) setDifficultyHistory(data.difficultyHistory);
                if (data.progressionReport) setProgressionReport(data.progressionReport);
                if (data.nextDifficulty) setCurrentDifficulty(data.nextDifficulty);
                if (data.feedback) setLatestFeedback(data.feedback);
                if (data.dimensionScores) setDimensionScores(data.dimensionScores);

                setMessages((prev) => [
                    ...prev,
                    {
                        id: Date.now().toString(),
                        content: data.feedback || "Answer evaluated based on technical depth and communication clarity.",
                        isUser: false,
                        timestamp: new Date(),
                    },
                ]);

                if (data.isComplete || newCount >= TOTAL_QUESTIONS) {
                    setInterviewScore(typeof data.score === "number" ? data.score : 0);
                    setIsInterviewComplete(true);
                    voice.stopSpeaking();
                    voice.stopListening();
                } else if (data.nextQuestion) {
                    setCurrentQuestionText(data.nextQuestion);
                    setTimeout(() => {
                        setMessages((prev) => [
                            ...prev,
                            {
                                id: Date.now().toString(),
                                content: data.nextQuestion,
                                isUser: false,
                                difficulty: data.nextDifficulty || "Medium",
                                timestamp: new Date(),
                            },
                        ]);
                    }, 500);
                }
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    content: "Error submitting answer. Please try again.",
                    isUser: false,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEndInterview = () => router.push("/dashboard");

    if (authLoading || !isLoggedIn) return null;

    const score = interviewScore ?? 0;
    const scoreLabel =
        score >= 80
            ? {
                text: "Excellent! You're interview-ready 🚀",
                color: "text-emerald-600 dark:text-emerald-400",
            }
            : score >= 60
                ? {
                    text: "Good effort! A few more sessions will get you there 💪",
                    color: "text-blue-600 dark:text-blue-400",
                }
                : score >= 40
                    ? {
                        text: "Needs Improvement. Review the topics and practice again 🏋️‍♂️",
                        color: "text-amber-600 dark:text-amber-400",
                    }
                    : {
                        text: "Weak Performance. Review fundamental concepts and try again ⚠️",
                        color: "text-rose-600 dark:text-rose-400",
                    };

    const formatTime = (s: number) =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    const shortDomainName = domain.split("/")[0];

    return (
        <div className="font-sans max-w-5xl mx-auto px-4 py-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
                        {domainEmoji}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-foreground">{domain} Interview</h1>
                            {!isInterviewComplete && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Live
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">AI Mock Interview Session</p>
                    </div>
                </div>

                {/* Center: Progress */}
                {!isInterviewComplete && (
                    <div className="hidden sm:flex flex-col items-center gap-1.5">
                        <ProgressDots current={questionsAnswered} total={TOTAL_QUESTIONS} />
                        <p className="text-xs text-muted-foreground">
                            Question {Math.min(questionsAnswered + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    {!isInterviewComplete && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-xs font-mono font-bold text-foreground">
                            <span>⏱</span> {formatTime(elapsedSeconds)}
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => (isInterviewComplete ? handleEndInterview() : setShowExitConfirm(true))}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground border border-border/60 rounded-xl cursor-pointer"
                    >
                        {isInterviewComplete ? "Go to Dashboard" : "Exit"}
                    </Button>
                </div>
            </div>

            {/* Mobile Progress Bar */}
            {!isInterviewComplete && (
                <div className="sm:hidden mb-6">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span>
                            Q{Math.min(questionsAnswered + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}
                        </span>
                        <span className="font-mono">{formatTime(elapsedSeconds)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-700"
                            style={{
                                width: `${(questionsAnswered / TOTAL_QUESTIONS) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Mode Switcher Tabs */}
            {!isInterviewComplete && (
                <div className="flex items-center justify-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/60 max-w-xs mx-auto mb-5">
                    <button
                        type="button"
                        onClick={() => {
                            setInterviewMode("chat");
                            voice.stopSpeaking();
                            voice.stopListening();
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            interviewMode === "chat"
                                ? "bg-card text-foreground shadow-xs border border-border/40"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat Mode
                    </button>
                    <button
                        type="button"
                        onClick={() => setInterviewMode("voice")}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            interviewMode === "voice"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Mic className="w-3.5 h-3.5" /> Voice Mode 🎙️
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div>
                {isInterviewComplete ? (
                    <div className="space-y-6">
                        {/* Completion Banner */}
                        <Card className="p-6 text-center border border-border/50 rounded-3xl bg-card shadow-2xs">
                            <h2 className={`text-xl font-bold ${scoreLabel.color} flex items-center justify-center gap-2`}>
                                {scoreLabel.text}
                            </h2>
                        </Card>

                        {/* Overview 3 Stat Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="p-6 text-center border border-border/50 rounded-2xl flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-rose-500 mb-2">❓</span>
                                <p className="text-2xl font-black text-foreground">{TOTAL_QUESTIONS}</p>
                                <p className="text-xs text-muted-foreground font-medium mt-1">Questions</p>
                            </Card>

                            <Card className="p-6 text-center border border-border/50 rounded-2xl flex flex-col items-center justify-center">
                                <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-lg mb-2">
                                    {domainEmoji}
                                </div>
                                <p className="text-lg font-bold text-foreground">{shortDomainName}</p>
                                <p className="text-xs text-muted-foreground font-medium mt-1">Domain</p>
                            </Card>

                            <Card className="p-6 text-center border border-border/50 rounded-2xl flex flex-col items-center justify-center">
                                <span className="text-2xl mb-2">⏱</span>
                                <p className="text-2xl font-black text-foreground">{formatTime(elapsedSeconds)}</p>
                                <p className="text-xs text-muted-foreground font-medium mt-1">Duration</p>
                            </Card>
                        </div>

                        {/* Performance Breakdown */}
                        <Card className="p-6 border border-border/50 rounded-3xl bg-card shadow-2xs">
                            <h3 className="text-base font-bold text-foreground mb-6">Performance Breakdown</h3>
                            <div className="space-y-5">
                                {[
                                    {
                                        label: "Technical Accuracy",
                                        pct: Math.max(0, Math.min(100, dimensionScores?.technicalAccuracy ?? score)),
                                    },
                                    {
                                        label: "Communication Clarity",
                                        pct: Math.max(0, Math.min(100, dimensionScores?.communicationClarity ?? score)),
                                    },
                                    {
                                        label: "Problem-Solving Approach",
                                        pct: Math.max(0, Math.min(100, dimensionScores?.problemSolving ?? score)),
                                    },
                                ].map((bar, i) => {
                                    const textColor =
                                        bar.pct >= 75
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : bar.pct >= 50
                                            ? "text-blue-600 dark:text-blue-400"
                                            : bar.pct >= 25
                                            ? "text-amber-600 dark:text-amber-400"
                                            : "text-rose-600 dark:text-rose-400";
                                    const fillBg =
                                        bar.pct >= 75
                                            ? "bg-emerald-500"
                                            : bar.pct >= 50
                                            ? "bg-blue-600"
                                            : bar.pct >= 25
                                            ? "bg-amber-500"
                                            : "bg-rose-500";

                                    return (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span className="text-foreground">{bar.label}</span>
                                                <span className={`font-bold ${textColor}`}>{bar.pct}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${fillBg} rounded-full transition-all duration-700`}
                                                    style={{ width: `${bar.pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Adaptive Difficulty Trajectory & Progression Report */}
                        {difficultyHistory.length > 0 && (
                            <Card className="p-6 border border-border/50 rounded-3xl bg-card space-y-4 shadow-2xs">
                                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                    📈 Adaptive Difficulty Trajectory
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                                    {difficultyHistory.map((step, idx) => (
                                        <div key={idx} className="p-3 rounded-2xl border text-center space-y-1 bg-muted/30 border-border/50">
                                            <p className="text-[11px] text-muted-foreground font-semibold">Q{step.questionNumber}</p>
                                            <span
                                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block ${
                                                    step.difficulty === "Hard"
                                                        ? "bg-rose-100 text-rose-700"
                                                        : step.difficulty === "Medium"
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-emerald-100 text-emerald-700"
                                                }`}
                                            >
                                                {step.difficulty}
                                            </span>
                                            <p className="text-[10px] font-bold text-foreground">{step.evaluation}</p>
                                        </div>
                                    ))}
                                </div>

                                {progressionReport && (
                                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs text-blue-900 leading-relaxed mt-2">
                                        <p className="font-bold mb-1">🤖 AI Progression Summary Report:</p>
                                        <p className="whitespace-pre-line">{progressionReport}</p>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-center gap-4 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsInterviewComplete(false);
                                    setInterviewScore(null);
                                    setQuestionsAnswered(0);
                                    setMessages([]);
                                    setElapsedSeconds(0);
                                    startInterview();
                                }}
                                className="rounded-full px-6 py-2.5 font-semibold border-border cursor-pointer flex items-center gap-2"
                            >
                                <span>🔄</span> Try Again
                            </Button>
                            <Button
                                onClick={handleEndInterview}
                                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 cursor-pointer flex items-center gap-2 shadow-xs"
                            >
                                Dashboard →
                            </Button>
                        </div>
                    </div>
                ) : interviewMode === "voice" ? (
                    <VoiceInterviewRoom
                        currentQuestion={currentQuestionText || "Tell me about your experience with " + domain + "."}
                        latestFeedback={latestFeedback}
                        domain={domain}
                        difficulty={currentDifficulty}
                        questionsAnswered={questionsAnswered}
                        totalQuestions={TOTAL_QUESTIONS}
                        isLoading={isLoading}
                        isInterviewComplete={isInterviewComplete}
                        onSendAnswer={handleSendMessage}
                        onSkipQuestion={handleSkipQuestion}
                        onSwitchToChat={() => {
                            setInterviewMode("chat");
                            voice.stopSpeaking();
                            voice.stopListening();
                        }}
                        {...voice}
                    />
                ) : (
                    <>
                        <ChatContainer messages={messages} isLoading={isLoading} />
                        <div className="border-t border-border/50 bg-background pt-3">
                            <div className="max-w-4xl mx-auto px-4 pb-1">
                                <p className="text-xs text-muted-foreground text-center">
                                    💡 Tip: Be specific and use examples from your experience for stronger answers
                                </p>
                            </div>
                            <InputBox onSend={handleSendMessage} onSkip={handleSkipQuestion} disabled={isLoading} />
                        </div>
                    </>
                )}
            </div>

            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowExitConfirm(false);
                    }}
                >
                    <Card className="w-full max-w-sm p-6 rounded-3xl border border-border bg-card shadow-xl text-center space-y-4">
                        <div className="text-3xl">⚠️</div>
                        <h3 className="text-lg font-bold text-foreground">Exit Interview?</h3>
                        <p className="text-xs text-muted-foreground">
                            Your current progress will not be saved. Are you sure you want to exit?
                        </p>
                        <div className="flex justify-center gap-3 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowExitConfirm(false)}
                                className="rounded-xl px-4 text-xs font-semibold cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleEndInterview}
                                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-4 text-xs font-semibold cursor-pointer"
                            >
                                Exit Session
                            </Button>
                        </div>
                    </Card>
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

const page = () => {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading interview session...</div>}>
            <InterviewContent />
        </Suspense>
    );
};

export default page;
