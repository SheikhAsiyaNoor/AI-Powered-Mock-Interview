"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/Authcontext";
import RoleGuard from "@/components/RoleGuard";
import axiosInstance from "@/lib/axios";
import {
    GraduationCap,
    Users,
    CheckCircle2,
    Clock,
    FileText,
    Star,
    Award,
    Sparkles,
    Send,
    Filter,
    ArrowRight,
    MessageSquare,
    Search,
    ThumbsUp,
    Swords
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface QueueItem {
    id: string;
    student: { id: string; name: string; email: string };
    domain?: string;
    challenge?: { title: string; category: string; difficulty: string };
    difficulty?: string;
    score: number;
    date?: string;
    submittedAt?: string;
    duration?: number;
    questionsCount?: number;
    isReviewed: boolean;
    type: "interview" | "challenge";
}

interface StudentItem {
    id: string;
    name: string;
    email: string;
    joinedAt: string;
    interviewsCompleted: number;
    avgScore: number;
}

export default function MentorPortalPage() {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<"queue" | "students">("queue");
    const [subType, setSubType] = useState<"interviews" | "challenges">("interviews");
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [students, setStudents] = useState<StudentItem[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Active Review State
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [reviewDetail, setReviewDetail] = useState<any | null>(null);
    const [reviewForm, setReviewForm] = useState({
        overallScore: 85,
        ratings: {
            communication: 4,
            technicalAccuracy: 4,
            problemSolving: 4,
            confidenceAndPresence: 4
        },
        qualitativeFeedback: "",
        keyStrengths: "",
        areasForImprovement: "",
        recommendationStatus: "Hire"
    });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");

    const loadMentorData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, queueRes, studentsRes] = await Promise.all([
                axiosInstance.get("/api/mentor/stats"),
                axiosInstance.get(`/api/mentor/queue?type=${subType}`),
                axiosInstance.get("/api/mentor/students")
            ]);

            setStats(statsRes.data.stats || {});
            setQueue(queueRes.data.items || []);
            setStudents(studentsRes.data.students || []);
        } catch (err: any) {
            console.error("Error loading mentor data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMentorData();
    }, [subType]);

    const handleOpenReview = async (item: QueueItem) => {
        setSelectedItem(item);
        setReviewSuccessMsg("");
        try {
            const { data } = await axiosInstance.get(`/api/mentor/submission/${item.id}?type=${item.type}`);
            setReviewDetail(data);

            if (data.existingReview) {
                setReviewForm({
                    overallScore: data.existingReview.overallScore || 85,
                    ratings: data.existingReview.ratings || { communication: 4, technicalAccuracy: 4, problemSolving: 4, confidenceAndPresence: 4 },
                    qualitativeFeedback: data.existingReview.qualitativeFeedback || "",
                    keyStrengths: (data.existingReview.keyStrengths || []).join(", "),
                    areasForImprovement: (data.existingReview.areasForImprovement || []).join(", "),
                    recommendationStatus: data.existingReview.recommendationStatus || "Hire"
                });
            } else {
                setReviewForm({
                    overallScore: item.score || 80,
                    ratings: { communication: 4, technicalAccuracy: 4, problemSolving: 4, confidenceAndPresence: 4 },
                    qualitativeFeedback: "",
                    keyStrengths: "",
                    areasForImprovement: "",
                    recommendationStatus: "Hire"
                });
            }
        } catch (err: any) {
            console.error("Error fetching submission details:", err);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        setIsSubmittingReview(true);
        setReviewSuccessMsg("");

        try {
            const payload = {
                studentId: selectedItem.student?.id || selectedItem.student?._id,
                targetType: selectedItem.type === "challenge" ? "ChallengeSubmission" : "Interview",
                overallScore: Number(reviewForm.overallScore),
                ratings: reviewForm.ratings,
                qualitativeFeedback: reviewForm.qualitativeFeedback,
                keyStrengths: reviewForm.keyStrengths.split(",").map(s => s.trim()).filter(Boolean),
                areasForImprovement: reviewForm.areasForImprovement.split(",").map(s => s.trim()).filter(Boolean),
                recommendationStatus: reviewForm.recommendationStatus
            };

            await axiosInstance.post(`/api/mentor/review/${selectedItem.id}`, payload);
            setReviewSuccessMsg("Mentor feedback submitted successfully!");
            loadMentorData();
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to submit review.");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    return (
        <RoleGuard allowedRoles={["mentor", "admin"]}>
            <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-8 border-b border-border/40 gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                            <GraduationCap className="w-3.5 h-3.5" />
                            Mentor Assessment Portal
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Candidate Evaluation & Mentorship
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Review candidate transcripts, evaluate AI scores, provide qualitative guidance, and endorse hire recommendations.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 text-xs font-bold uppercase">
                            Logged in as {user?.role}
                        </span>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                    <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold">{stats?.totalStudents || 0}</div>
                            <div className="text-xs text-muted-foreground">Active Students</div>
                        </div>
                    </Card>

                    <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold">{stats?.totalInterviews || 0}</div>
                            <div className="text-xs text-muted-foreground">Mock Interviews</div>
                        </div>
                    </Card>

                    <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                            <Swords className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold">{stats?.totalSubmissions || 0}</div>
                            <div className="text-xs text-muted-foreground">Arena Battles</div>
                        </div>
                    </Card>

                    <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xl font-bold">{stats?.totalReviewsGiven || 0}</div>
                            <div className="text-xs text-muted-foreground">Reviews Submitted</div>
                        </div>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-border/40 pb-3 mb-6">
                    <button
                        onClick={() => { setActiveTab("queue"); setSelectedItem(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === "queue"
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        Submissions Review Queue ({queue.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab("students"); setSelectedItem(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeTab === "students"
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Users className="w-3.5 h-3.5" />
                        Student Mentorship Directory ({students.length})
                    </button>
                </div>

                {/* TAB 1: SUBMISSIONS QUEUE */}
                {activeTab === "queue" && !selectedItem && (
                    <div className="space-y-4">
                        {/* Subtype Filter */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSubType("interviews")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                                    subType === "interviews" ? "bg-secondary text-secondary-foreground font-bold" : "text-muted-foreground hover:bg-muted/50"
                                }`}
                            >
                                🏢 Full Mock Interviews
                            </button>
                            <button
                                onClick={() => setSubType("challenges")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                                    subType === "challenges" ? "bg-secondary text-secondary-foreground font-bold" : "text-muted-foreground hover:bg-muted/50"
                                }`}
                            >
                                ⚔️ Peer Arena Submissions
                            </button>
                        </div>

                        {/* Queue Table */}
                        <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-border/40 text-muted-foreground uppercase">
                                        <tr>
                                            <th className="py-3 px-3">Candidate</th>
                                            <th className="py-3 px-3">Topic / Challenge</th>
                                            <th className="py-3 px-3">AI Score</th>
                                            <th className="py-3 px-3">Date</th>
                                            <th className="py-3 px-3">Review Status</th>
                                            <th className="py-3 px-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {queue.map((item) => (
                                            <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="py-3.5 px-3">
                                                    <div className="font-bold text-foreground">{item.student?.name || "Student"}</div>
                                                    <div className="text-[11px] text-muted-foreground">{item.student?.email}</div>
                                                </td>
                                                <td className="py-3.5 px-3">
                                                    <div className="font-semibold text-foreground">
                                                        {item.domain || item.challenge?.title || "Mock Session"}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {item.difficulty || item.challenge?.difficulty || "Medium"} • {item.type}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-3 font-mono font-bold text-primary">
                                                    {item.score}%
                                                </td>
                                                <td className="py-3.5 px-3 text-muted-foreground">
                                                    {new Date(item.date || item.submittedAt || Date.now()).toLocaleDateString()}
                                                </td>
                                                <td className="py-3.5 px-3">
                                                    {item.isReviewed ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                            ✓ Reviewed
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                                            Pending Review
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-3 text-right">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleOpenReview(item)}
                                                        className="rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                                                    >
                                                        {item.isReviewed ? "Edit Feedback" : "Grade Candidate"}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}

                {/* REVIEW DRAWER / WORKSPACE */}
                {selectedItem && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedItem(null)}
                                className="rounded-xl text-xs font-semibold cursor-pointer"
                            >
                                ← Back to Queue
                            </Button>
                            <span className="text-xs font-semibold text-muted-foreground">
                                Candidate: <strong className="text-foreground">{selectedItem.student?.name}</strong> ({selectedItem.student?.email})
                            </span>
                        </div>

                        {reviewSuccessMsg && (
                            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                                {reviewSuccessMsg}
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Candidate Transcript & Responses */}
                            <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm space-y-4 max-h-[750px] overflow-y-auto">
                                <h2 className="text-lg font-bold">Candidate Session Transcript</h2>
                                
                                {reviewDetail?.interview?.questions?.map((q: any, idx: number) => (
                                    <div key={idx} className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-2 text-xs">
                                        <div className="font-bold text-foreground">Q{idx + 1}: {q.question}</div>
                                        <div className="p-2.5 rounded-lg bg-background border border-border/40 text-muted-foreground italic">
                                            "{q.answer}"
                                        </div>
                                        {q.feedback && (
                                            <div className="text-[11px] text-blue-500 font-medium">
                                                AI Note: {q.feedback}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {reviewDetail?.submission?.answers?.map((ans: any, idx: number) => (
                                    <div key={idx} className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-2 text-xs">
                                        <div className="font-bold text-foreground">Q{idx + 1}: {ans.questionText}</div>
                                        <div className="p-2.5 rounded-lg bg-background border border-border/40 text-muted-foreground italic">
                                            "{ans.candidateAnswer}"
                                        </div>
                                        <div className="text-[11px] text-blue-500 font-medium">
                                            Score: {ans.score}% • {ans.feedback}
                                        </div>
                                    </div>
                                ))}
                            </Card>

                            {/* Mentor Evaluation Form */}
                            <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl space-y-4">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Award className="w-5 h-5 text-emerald-500" />
                                    Mentor Assessment & Ratings
                                </h2>

                                <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                                    {/* Overall Score */}
                                    <div>
                                        <label className="block font-semibold text-foreground mb-1">
                                            Overall Assessment Score (0-100):
                                        </label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={reviewForm.overallScore}
                                            onChange={(e) => setReviewForm(prev => ({ ...prev, overallScore: Number(e.target.value) }))}
                                            required
                                            className="h-10 rounded-xl"
                                        />
                                    </div>

                                    {/* Rating Sliders (1-5) */}
                                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
                                        <div>
                                            <label className="font-semibold text-foreground">Communication (1-5): {reviewForm.ratings.communication}</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={reviewForm.ratings.communication}
                                                onChange={(e) => setReviewForm(prev => ({ ...prev, ratings: { ...prev.ratings, communication: Number(e.target.value) } }))}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="font-semibold text-foreground">Technical Depth (1-5): {reviewForm.ratings.technicalAccuracy}</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={reviewForm.ratings.technicalAccuracy}
                                                onChange={(e) => setReviewForm(prev => ({ ...prev, ratings: { ...prev.ratings, technicalAccuracy: Number(e.target.value) } }))}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="font-semibold text-foreground">Problem Solving (1-5): {reviewForm.ratings.problemSolving}</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={reviewForm.ratings.problemSolving}
                                                onChange={(e) => setReviewForm(prev => ({ ...prev, ratings: { ...prev.ratings, problemSolving: Number(e.target.value) } }))}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="font-semibold text-foreground">Confidence (1-5): {reviewForm.ratings.confidenceAndPresence}</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                value={reviewForm.ratings.confidenceAndPresence}
                                                onChange={(e) => setReviewForm(prev => ({ ...prev, ratings: { ...prev.ratings, confidenceAndPresence: Number(e.target.value) } }))}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Qualitative Feedback */}
                                    <div>
                                        <label className="block font-semibold text-foreground mb-1">
                                            Detailed Qualitative Feedback:
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={reviewForm.qualitativeFeedback}
                                            onChange={(e) => setReviewForm(prev => ({ ...prev, qualitativeFeedback: e.target.value }))}
                                            placeholder="Provide constructive guidance on pacing, technical clarity, or behavioral storytelling..."
                                            required
                                            className="w-full p-3 rounded-xl bg-background border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                                        />
                                    </div>

                                    {/* Strengths & Improvement */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-semibold text-foreground mb-1">Key Strengths (comma-separated):</label>
                                            <Input
                                                type="text"
                                                placeholder="Clear articulation, Good architecture"
                                                value={reviewForm.keyStrengths}
                                                onChange={(e) => setReviewForm(prev => ({ ...prev, keyStrengths: e.target.value }))}
                                                className="h-9 rounded-xl text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold text-foreground mb-1">Areas to Polish (comma-separated):</label>
                                            <Input
                                                type="text"
                                                placeholder="Edge cases, Concurrency"
                                                value={reviewForm.areasForImprovement}
                                                onChange={(e) => setReviewForm(prev => ({ ...prev, areasForImprovement: e.target.value }))}
                                                className="h-9 rounded-xl text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Recommendation Status */}
                                    <div>
                                        <label className="block font-semibold text-foreground mb-1">Hiring Recommendation:</label>
                                        <select
                                            value={reviewForm.recommendationStatus}
                                            onChange={(e) => setReviewForm(prev => ({ ...prev, recommendationStatus: e.target.value }))}
                                            className="w-full h-9 rounded-xl bg-background border border-border/60 px-3 text-xs"
                                        >
                                            <option value="Strong Hire">⭐ Strong Hire</option>
                                            <option value="Hire">✓ Hire</option>
                                            <option value="Lean Hire">⚡ Lean Hire</option>
                                            <option value="Needs Practice">🔄 Needs More Practice</option>
                                            <option value="Not Ready">❌ Not Ready</option>
                                        </select>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmittingReview}
                                        className="w-full h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
                                    >
                                        {isSubmittingReview ? "Submitting Assessment..." : "Submit Official Mentor Review"}
                                    </Button>
                                </form>
                            </Card>
                        </div>
                    </div>
                )}

                {/* TAB 2: STUDENTS DIRECTORY */}
                {activeTab === "students" && (
                    <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border/40 text-muted-foreground uppercase">
                                    <tr>
                                        <th className="py-3 px-3">Student Name</th>
                                        <th className="py-3 px-3">Email</th>
                                        <th className="py-3 px-3">Joined</th>
                                        <th className="py-3 px-3">Mock Sessions</th>
                                        <th className="py-3 px-3">Avg Performance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {students.map((st) => (
                                        <tr key={st.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="py-3.5 px-3 font-bold text-foreground">{st.name}</td>
                                            <td className="py-3.5 px-3 font-mono text-muted-foreground">{st.email}</td>
                                            <td className="py-3.5 px-3 text-muted-foreground">{new Date(st.joinedAt).toLocaleDateString()}</td>
                                            <td className="py-3.5 px-3 font-semibold">{st.interviewsCompleted} Completed</td>
                                            <td className="py-3.5 px-3 font-mono font-bold text-primary">{st.avgScore}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </RoleGuard>
    );
}
