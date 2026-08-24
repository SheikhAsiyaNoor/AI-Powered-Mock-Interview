"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/Authcontext";
import axiosInstance from "@/lib/axios";
import {
    Swords,
    Timer,
    Clock,
    Zap,
    Send,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Sparkles,
    Trophy,
    Award,
    Code,
    MessageSquare,
    Brain,
    HelpCircle,
    ChevronRight,
    ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Question {
    questionId: string;
    questionText: string;
    type: string;
    options?: string[];
    points: number;
}

interface ChallengeData {
    id: string;
    title: string;
    description: string;
    type: string;
    category: string;
    domain: string;
    difficulty: string;
    timeLimitMinutes: number;
    totalPoints: number;
    xpReward: number;
    questions: Question[];
}

interface EvaluationResult {
    score: number;
    xpEarned: number;
    pointsEarned: number;
    submission: {
        totalScore: number;
        feedbackSummary: string;
        answers: {
            questionId: string;
            questionText: string;
            candidateAnswer: string;
            score: number;
            feedback: string;
            criteriaScores: {
                clarity: number;
                technicalDepth: number;
                problemSolving: number;
            };
            strengths: string[];
            improvements: string[];
        }[];
    };
    gamification: {
        totalXp: number;
        currentRank: string;
        level: number;
        currentStreak: number;
        maxStreak: number;
        unlockedBadges: { badgeId: string; name: string; icon: string; description: string }[];
    };
}

export default function ChallengeRunnerPage({
    params
}: {
    params: Promise<{ challengeId: string }>;
}) {
    const resolvedParams = use(params);
    const challengeId = resolvedParams.challengeId;

    const router = useRouter();
    const { isLoggedIn, isLoading: isAuthLoading } = useAuth();

    const [challenge, setChallenge] = useState<ChallengeData | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
    const [error, setError] = useState("");

    // Load Challenge Data
    useEffect(() => {
        if (!isAuthLoading && !isLoggedIn) {
            router.push(`/login?redirect=/arena/${challengeId}`);
            return;
        }

        const fetchChallenge = async () => {
            setIsLoading(true);
            try {
                const { data } = await axiosInstance.get(`/api/arena/challenges/${challengeId}`);
                if (data.challenge) {
                    setChallenge(data.challenge);
                    if (data.isCompleted && data.userSubmission) {
                        // Already completed, load existing evaluation view
                        setEvalResult({
                            score: data.userSubmission.totalScore,
                            xpEarned: data.userSubmission.xpEarned || 0,
                            pointsEarned: data.userSubmission.pointsEarned || 0,
                            submission: data.userSubmission,
                            gamification: {
                                totalXp: 0,
                                currentRank: "Challenger",
                                level: 1,
                                currentStreak: 1,
                                maxStreak: 1,
                                unlockedBadges: []
                            }
                        });
                    } else {
                        setTimeLeftSeconds((data.challenge.timeLimitMinutes || 15) * 60);
                    }
                }
            } catch (err: any) {
                setError(err?.response?.data?.message || "Failed to load challenge details.");
            } finally {
                setIsLoading(false);
            }
        };

        if (isLoggedIn) {
            fetchChallenge();
        }
    }, [challengeId, isLoggedIn, isAuthLoading, router]);

    // Countdown Timer
    useEffect(() => {
        if (evalResult || timeLeftSeconds === null || timeLeftSeconds <= 0) return;

        const timer = setInterval(() => {
            setTimeLeftSeconds(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    handleSubmitAnswers(); // Auto submit on timeout
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeftSeconds, evalResult]);

    const handleAnswerChange = (qId: string, val: string) => {
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const handleSubmitAnswers = async () => {
        if (!challenge || isSubmitting) return;
        setIsSubmitting(true);
        setError("");

        const formattedAnswers = challenge.questions.map(q => ({
            questionId: q.questionId,
            answer: answers[q.questionId] || ""
        }));

        const timeSpent = (challenge.timeLimitMinutes * 60) - (timeLeftSeconds || 0);

        try {
            const { data } = await axiosInstance.post(`/api/arena/challenges/${challengeId}/submit`, {
                answers: formattedAnswers,
                timeSpentSeconds: Math.max(0, timeSpent)
            });

            setEvalResult(data);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Error submitting challenge answers.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || isAuthLoading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs text-muted-foreground font-semibold">Entering Challenge Arena...</p>
            </div>
        );
    }

    if (error && !challenge) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
                <h2 className="text-xl font-bold mb-2">Challenge Unavailable</h2>
                <p className="text-xs text-muted-foreground mb-4">{error}</p>
                <Link href="/arena">
                    <Button variant="outline">Back to Arena</Button>
                </Link>
            </div>
        );
    }

    if (!challenge) return null;

    const currentQ = challenge.questions[currentQIndex];
    const isLastQ = currentQIndex === challenge.questions.length - 1;

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    // EVALUATION RESULTS SCREEN
    if (evalResult) {
        return (
            <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
                {/* Result Header Card */}
                <Card className="p-8 border-border/40 bg-card/90 backdrop-blur-xl shadow-2xl text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

                    <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
                        <Trophy className="w-8 h-8" />
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 mb-3">
                        <Swords className="w-3.5 h-3.5" /> Battle Complete
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                        {challenge.title}
                    </h1>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto mb-6">
                        {evalResult.submission?.feedbackSummary || "Your answers were evaluated using AI Rubrics."}
                    </p>

                    {/* Score Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
                        <div className="px-5 py-3 rounded-2xl bg-muted/60 border border-border/50 text-center min-w-[120px]">
                            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-foreground">
                                {evalResult.score}%
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                                Overall Score
                            </div>
                        </div>

                        <div className="px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center min-w-[120px]">
                            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-amber-500 flex items-center justify-center gap-1">
                                <Zap className="w-5 h-5 fill-amber-500" /> +{evalResult.xpEarned}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-amber-500 font-bold">
                                XP Rewarded
                            </div>
                        </div>

                        <div className="px-5 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center min-w-[120px]">
                            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-blue-500">
                                +{evalResult.pointsEarned}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-blue-500 font-bold">
                                Arena Points
                            </div>
                        </div>
                    </div>

                    {/* Unlocked Badges Notification Banner */}
                    {evalResult.gamification?.unlockedBadges?.length > 0 && (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-primary/20 to-secondary/20 border border-amber-500/40 mb-6 text-left flex items-center gap-4">
                            <div className="text-3xl animate-bounce">
                                {evalResult.gamification.unlockedBadges[0].icon}
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-amber-500">
                                    New Achievement Badge Unlocked!
                                </div>
                                <div className="font-bold text-sm text-foreground">
                                    {evalResult.gamification.unlockedBadges[0].name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {evalResult.gamification.unlockedBadges[0].description}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link href="/arena">
                            <Button className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-6 shadow-md">
                                Back to Arena Leaderboard
                            </Button>
                        </Link>
                    </div>
                </Card>

                {/* Rubric Evaluation Breakdown */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold">Question-by-Question Rubric Breakdown</h2>

                    {evalResult.submission?.answers?.map((ans, idx) => (
                        <Card key={idx} className="p-6 border-border/40 bg-card/60 backdrop-blur-sm space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <span className="text-xs font-bold text-primary uppercase">Question {idx + 1}</span>
                                    <h3 className="font-semibold text-sm text-foreground mt-0.5">{ans.questionText}</h3>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-lg font-mono font-extrabold text-foreground">{ans.score}%</span>
                                    <div className="text-[10px] text-muted-foreground font-semibold">AI Score</div>
                                </div>
                            </div>

                            {/* Rubric Scores */}
                            {ans.criteriaScores && (
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
                                    <div className="p-2.5 rounded-xl bg-muted/40 text-center">
                                        <div className="text-xs font-bold text-foreground">{ans.criteriaScores.clarity}%</div>
                                        <div className="text-[10px] text-muted-foreground font-medium">Clarity & Structure</div>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-muted/40 text-center">
                                        <div className="text-xs font-bold text-foreground">{ans.criteriaScores.technicalDepth}%</div>
                                        <div className="text-[10px] text-muted-foreground font-medium">Technical Depth</div>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-muted/40 text-center">
                                        <div className="text-xs font-bold text-foreground">{ans.criteriaScores.problemSolving}%</div>
                                        <div className="text-[10px] text-muted-foreground font-medium">Problem Solving</div>
                                    </div>
                                </div>
                            )}

                            {/* Candidate's Submitted Answer */}
                            {ans.candidateAnswer && (
                                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 text-xs space-y-1">
                                    <div className="font-bold text-muted-foreground">Your Submitted Answer:</div>
                                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">{ans.candidateAnswer}</p>
                                </div>
                            )}

                            {/* Qualitative Feedback */}
                            <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 text-xs space-y-1.5">
                                <div className="font-bold text-foreground flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                    AI Evaluator Feedback:
                                </div>
                                <p className="text-muted-foreground leading-relaxed">{ans.feedback}</p>

                                {ans.strengths?.length > 0 && (
                                    <div className="pt-2 text-[11px]">
                                        <strong className="text-emerald-600 dark:text-emerald-400">Strengths: </strong>
                                        <span className="text-muted-foreground">{ans.strengths.join(", ")}</span>
                                    </div>
                                )}
                                {ans.improvements?.length > 0 && (
                                    <div className="text-[11px]">
                                        <strong className="text-amber-600 dark:text-amber-400">Areas to Polish: </strong>
                                        <span className="text-muted-foreground">{ans.improvements.join(", ")}</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    // LIVE RUNNER SCREEN
    const isUrgent = timeLeftSeconds !== null && timeLeftSeconds < 120;

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
            {/* Top Bar: Title, Category & Timer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-border/40 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/arena" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                            <ArrowLeft className="w-3 h-3" /> Arena
                        </Link>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs font-bold text-primary uppercase">{challenge.category}</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{challenge.title}</h1>
                </div>

                {/* Countdown Timer */}
                {timeLeftSeconds !== null && (
                    <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 font-mono text-sm font-extrabold shadow-sm ${
                        isUrgent
                            ? "bg-rose-500/10 border-rose-500/40 text-rose-600 animate-pulse"
                            : "bg-muted/60 border-border/60 text-foreground"
                    }`}>
                        <Timer className="w-4 h-4" />
                        <span>{formatTime(timeLeftSeconds)}</span>
                    </div>
                )}
            </div>

            {/* Question Progress Stepper */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {challenge.questions.map((q, idx) => {
                    const isAnswered = !!answers[q.questionId]?.trim();
                    const isCurrent = idx === currentQIndex;
                    return (
                        <button
                            key={q.questionId}
                            onClick={() => setCurrentQIndex(idx)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                isCurrent
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                    : isAnswered
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                            }`}
                        >
                            <span>Q{idx + 1}</span>
                            {isAnswered && <CheckCircle2 className="w-3 h-3" />}
                        </button>
                    );
                })}
            </div>

            {/* Question Display & Response Area */}
            {currentQ && (
                <Card className="p-6 sm:p-8 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl space-y-6">
                    <div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span>Question {currentQIndex + 1} of {challenge.questions.length}</span>
                            <span className="font-semibold text-primary">{currentQ.points} Points Weight</span>
                        </div>
                        <h2 className="text-base sm:text-lg font-bold leading-relaxed text-foreground">
                            {currentQ.questionText}
                        </h2>
                    </div>

                    {/* Answer Input Area */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                            <span>Your Detailed Answer / Solution:</span>
                            <span className="font-mono text-[11px]">
                                {(answers[currentQ.questionId] || "").length} chars
                            </span>
                        </div>
                        <textarea
                            value={answers[currentQ.questionId] || ""}
                            onChange={(e) => handleAnswerChange(currentQ.questionId, e.target.value)}
                            placeholder="Type your structured response, code snippet, or STAR framework explanation here..."
                            rows={10}
                            className="w-full p-4 rounded-2xl bg-muted/30 border border-border/60 focus:bg-background focus:border-primary text-sm font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                        <p className="text-[11px] text-muted-foreground italic">
                            Tip: For technical questions, explain trade-offs and complexity. For HR/Behavioral questions, use the Situation-Task-Action-Result format.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 text-red-600 text-xs font-medium">
                            {error}
                        </div>
                    )}

                    {/* Navigation Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/30">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentQIndex === 0}
                            onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                            className="rounded-xl text-xs font-semibold cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                        </Button>

                        <div className="flex items-center gap-3">
                            {!isLastQ ? (
                                <Button
                                    size="sm"
                                    onClick={() => setCurrentQIndex(prev => Math.min(challenge.questions.length - 1, prev + 1))}
                                    className="rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold cursor-pointer"
                                >
                                    Next Question <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={handleSubmitAnswers}
                                    disabled={isSubmitting}
                                    className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-5 shadow-lg shadow-primary/25 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Sparkles className="w-3.5 h-3.5 mr-2 animate-spin" />
                                            Evaluating with AI...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5 mr-2" />
                                            Submit Challenge Duel
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
