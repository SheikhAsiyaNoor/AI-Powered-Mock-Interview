"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/Authcontext";
import axiosInstance from "@/lib/axios";
import {
    Star,
    CheckCircle2,
    ShieldCheck,
    MessageSquarePlus,
    Sparkles,
    Trash2,
    Edit3,
    LogIn,
    UserCheck,
    AlertCircle,
    X,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ReviewItem {
    _id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    userRole: string;
    rating: number;
    headline?: string;
    comment: string;
    featureHighlight: string;
    isVerifiedCandidate: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface ReviewStats {
    totalReviews: number;
    averageRating: number;
    starCounts: Record<number, number>;
    fractionalBreakdown: Record<string, number>;
}

const FEATURE_OPTIONS = [
    "Overall Platform",
    "Real-Time AI Evaluation",
    "Peer Challenge Arena",
    "Recruiter Simulator",
    "Resume Analysis",
    "Readiness Engine",
];

const PRESET_RATINGS = [
    { value: 5.0, label: "5.0 ★ Outstanding" },
    { value: 4.5, label: "4.5 ★ Very Good" },
    { value: 4.0, label: "4.0 ★ Great" },
    { value: 3.5, label: "3.5 ★ Decent" },
    { value: 3.0, label: "3.0 ★ Average" },
];

/**
 * Pixel-perfect Star renderer supporting full, half (e.g. 4.5, 3.5), and empty stars
 */
export function StarRatingDisplay({
    rating,
    size = 18,
    className = "",
}: {
    rating: number;
    size?: number;
    className?: string;
}) {
    const clamped = Math.max(0, Math.min(5, rating));

    return (
        <div className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((starIndex) => {
                const fillDiff = clamped - (starIndex - 1);
                let fillPercent = 0;
                if (fillDiff >= 1) {
                    fillPercent = 100;
                } else if (fillDiff >= 0.25) {
                    fillPercent = 50;
                }

                const gradId = `star-grad-${starIndex}-${Math.round(clamped * 10)}`;

                return (
                    <svg
                        key={starIndex}
                        width={size}
                        height={size}
                        viewBox="0 0 24 24"
                        className="transition-transform hover:scale-110 shrink-0"
                    >
                        <defs>
                            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset={`${fillPercent}%`} stopColor="#f59e0b" />
                                <stop offset={`${fillPercent}%`} stopColor="currentColor" stopOpacity="0.18" />
                            </linearGradient>
                        </defs>
                        <path
                            fill={`url(#${gradId})`}
                            stroke="#d97706"
                            strokeWidth="1.2"
                            strokeLinejoin="round"
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        />
                    </svg>
                );
            })}
        </div>
    );
}

export default function PlatformReviews() {
    const { user, isLoggedIn } = useAuth();

    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [stats, setStats] = useState<ReviewStats>({
        totalReviews: 0,
        averageRating: 5.0,
        starCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        fractionalBreakdown: {},
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Form state for logged-in users
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [rating, setRating] = useState<number>(5.0);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [headline, setHeadline] = useState("");
    const [comment, setComment] = useState("");
    const [featureHighlight, setFeatureHighlight] = useState("Overall Platform");
    const [userExistingReview, setUserExistingReview] = useState<ReviewItem | null>(null);

    // Filter & Sort state
    const [filterRating, setFilterRating] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"newest" | "highest">("newest");

    // Load reviews
    const fetchReviews = async () => {
        try {
            setIsLoading(true);
            const res = await axiosInstance.get("/api/reviews");
            if (res.data?.success) {
                setReviews(res.data.reviews || []);
                if (res.data.stats) {
                    setStats(res.data.stats);
                }
                if (res.data.currentUserReview) {
                    setUserExistingReview(res.data.currentUserReview);
                }
            }
        } catch (err: any) {
            console.error("Failed to load reviews:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [isLoggedIn]);

    // Check user review from loaded reviews
    useEffect(() => {
        if (user && reviews.length > 0) {
            const found = reviews.find((r) => r.userId === user.id);
            if (found) {
                setUserExistingReview(found);
            }
        }
    }, [user, reviews]);

    // Pre-populate form if user edits their review
    const handleOpenEdit = () => {
        if (userExistingReview) {
            setRating(userExistingReview.rating || 5.0);
            setHeadline(userExistingReview.headline || "");
            setComment(userExistingReview.comment || "");
            setFeatureHighlight(userExistingReview.featureHighlight || "Overall Platform");
        } else {
            setRating(5.0);
            setHeadline("");
            setComment("");
            setFeatureHighlight("Overall Platform");
        }
        setIsFormOpen(true);
        setErrorMessage("");
        setSuccessMessage("");
    };

    // Rating text description
    const ratingDescriptor = useMemo(() => {
        const val = hoverRating !== null ? hoverRating : rating;
        if (val >= 5.0) return "5.0 ★ Exceptional! Completely exceeded expectations";
        if (val >= 4.5) return "4.5 ★ Outstanding! Very polished and effective";
        if (val >= 4.0) return "4.0 ★ Great! Highly recommended for interview prep";
        if (val >= 3.5) return "3.5 ★ Good! Solid practice experience";
        if (val >= 3.0) return "3.0 ★ Decent / Average experience";
        if (val >= 2.5) return "2.5 ★ Needs minor refinements";
        return `${val.toFixed(1)} ★ Needs improvement`;
    }, [hoverRating, rating]);

    // Handle Form Submit
    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoggedIn) {
            setErrorMessage("You must be signed in to submit a review.");
            return;
        }

        if (comment.trim().length < 5) {
            setErrorMessage("Please write at least 5 characters in your review comment.");
            return;
        }

        try {
            setIsSubmitting(true);
            setErrorMessage("");
            setSuccessMessage("");

            const payload = {
                rating,
                headline: headline.trim(),
                comment: comment.trim(),
                featureHighlight,
            };

            const res = await axiosInstance.post("/api/reviews", payload);
            if (res.data?.success) {
                setSuccessMessage("Your review has been published! Thank you for your feedback.");
                setUserExistingReview(res.data.review);
                setIsFormOpen(false);
                fetchReviews();
            }
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || "Failed to submit review. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Review Delete
    const handleDeleteReview = async () => {
        if (!userExistingReview?._id) return;
        const confirmDelete = window.confirm("Are you sure you want to remove your review?");
        if (!confirmDelete) return;

        try {
            setIsDeleting(true);
            const res = await axiosInstance.delete(`/api/reviews/${userExistingReview._id}`);
            if (res.data?.success) {
                setUserExistingReview(null);
                setSuccessMessage("Your review has been deleted.");
                setIsFormOpen(false);
                fetchReviews();
            }
        } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || "Failed to delete review.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Filtered and sorted reviews
    const filteredReviews = useMemo(() => {
        let list = [...reviews];

        if (filterRating === "5") {
            list = list.filter((r) => r.rating >= 5.0);
        } else if (filterRating === "4.5") {
            list = list.filter((r) => r.rating >= 4.5);
        } else if (filterRating === "4+") {
            list = list.filter((r) => r.rating >= 4.0);
        } else if (filterRating === "3.5") {
            list = list.filter((r) => r.rating >= 3.5);
        }

        if (sortBy === "highest") {
            list.sort((a, b) => b.rating - a.rating);
        } else {
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return list;
    }, [reviews, filterRating, sortBy]);

    return (
        <section id="community-reviews" className="w-full pt-14 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Verified Candidate Reviews</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                        What Practicing Candidates Say
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Real feedback from developers and students who practiced technical interviews and elevated their careers with AI Mock Interview.
                    </p>
                </div>

                {/* Rating Stats Hero Card */}
                <div className="mb-10 rounded-3xl border border-border/70 bg-gradient-to-b from-card/90 via-card to-card/60 p-6 sm:p-8 shadow-xs backdrop-blur-xs">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Overall Score */}
                        <div className="lg:col-span-4 flex flex-col items-center justify-center text-center sm:border-r sm:border-border/60 lg:pr-8">
                            <div className="text-5xl sm:text-6xl font-black text-foreground tracking-tight flex items-baseline gap-1">
                                <span>{stats.averageRating ? stats.averageRating.toFixed(1) : "5.0"}</span>
                                <span className="text-lg sm:text-xl font-bold text-muted-foreground">/ 5.0</span>
                            </div>

                            <div className="my-2.5">
                                <StarRatingDisplay rating={stats.averageRating || 5.0} size={24} />
                            </div>

                            <p className="text-xs font-medium text-muted-foreground">
                                Based on <strong className="text-foreground">{stats.totalReviews}</strong> community reviews
                            </p>

                            <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>100% Authentic Verified Users</span>
                            </div>
                        </div>

                        {/* Breakdown Bars */}
                        <div className="lg:col-span-5 space-y-2">
                            {[5, 4, 3, 2, 1].map((starNum) => {
                                const count = stats.starCounts[starNum] || 0;
                                const percent = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
                                return (
                                    <button
                                        key={starNum}
                                        type="button"
                                        onClick={() => setFilterRating(filterRating === String(starNum) ? "all" : String(starNum))}
                                        className="w-full flex items-center gap-3 text-xs group cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                        <div className="flex items-center gap-1 w-14 font-semibold text-foreground shrink-0 justify-end">
                                            <span>{starNum}</span>
                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                        </div>
                                        <div className="h-2.5 flex-1 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <div className="w-12 text-right font-medium text-muted-foreground shrink-0">
                                            {percent}%
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Action Callout depending on login state */}
                        <div className="lg:col-span-3 flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/40 border border-border/50 text-center">
                            {isLoggedIn ? (
                                <>
                                    <UserCheck className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                                    <h4 className="text-xs font-bold text-foreground">
                                        {userExistingReview ? "Update Your Review" : "Share Your Experience"}
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground mt-1 mb-3">
                                        {userExistingReview
                                            ? "You've rated this platform. You can update or delete your feedback anytime."
                                            : "Your honest feedback helps other candidates prepare effectively."}
                                    </p>
                                    <Button
                                        size="sm"
                                        onClick={handleOpenEdit}
                                        className="rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 h-9 shadow-sm cursor-pointer"
                                    >
                                        <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                                        {userExistingReview ? "Edit Your Review" : "Write a Review"}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-8 h-8 text-amber-500 mb-2" />
                                    <h4 className="text-xs font-bold text-foreground">Have You Practiced Here?</h4>
                                    <p className="text-[11px] text-muted-foreground mt-1 mb-3">
                                        Only registered candidates can submit reviews. Sign in or create a free account to rate.
                                    </p>
                                    <div className="flex flex-col w-full gap-2">
                                        <Link href="/login" className="w-full">
                                            <Button
                                                size="sm"
                                                className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8 cursor-pointer"
                                            >
                                                Sign In to Review
                                            </Button>
                                        </Link>
                                        <Link href="/register" className="w-full">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full rounded-full text-xs font-semibold h-8 cursor-pointer"
                                            >
                                                Create Account
                                            </Button>
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status messages */}
                {successMessage && (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span>{successMessage}</span>
                        </div>
                        <button onClick={() => setSuccessMessage("")} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                            <span>{errorMessage}</span>
                        </div>
                        <button onClick={() => setErrorMessage("")} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Interactive Review Creation / Edit Form (Registered Users) */}
                {isFormOpen && isLoggedIn && (
                    <div className="mb-10 rounded-3xl border border-blue-500/30 bg-card p-6 sm:p-8 shadow-lg ring-1 ring-blue-500/20">
                        <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
                            <div>
                                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                    <MessageSquarePlus className="w-5 h-5 text-blue-600" />
                                    <span>{userExistingReview ? "Edit Your Review" : "Write a Community Review"}</span>
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Share your honest thoughts. Fractional ratings like 4.5 and 3.5 are supported!
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitReview} className="space-y-6">
                            {/* Interactive 5-Star Rating Picker */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-foreground">
                                        Select Your Rating (Supports Half Stars like 4.5, 3.5)
                                    </label>
                                    <span className="text-xs font-bold text-amber-500">
                                        {rating.toFixed(1)} / 5.0
                                    </span>
                                </div>

                                {/* Interactive Star Hit Zones */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border/70">
                                    <div
                                        className="inline-flex items-center gap-1.5"
                                        onMouseLeave={() => setHoverRating(null)}
                                    >
                                        {[1, 2, 3, 4, 5].map((starIdx) => {
                                            const activeVal = hoverRating !== null ? hoverRating : rating;
                                            const leftVal = starIdx - 0.5;
                                            const rightVal = starIdx;

                                            // Determine visual fill for this star
                                            let fillPct = 0;
                                            if (activeVal >= rightVal) fillPct = 100;
                                            else if (activeVal >= leftVal) fillPct = 50;

                                            const uniqueId = `picker-star-${starIdx}-${Math.round(activeVal * 10)}`;

                                            return (
                                                <div
                                                    key={starIdx}
                                                    className="relative cursor-pointer transition-transform hover:scale-115"
                                                >
                                                    <svg width={36} height={36} viewBox="0 0 24 24">
                                                        <defs>
                                                            <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="0%">
                                                                <stop offset={`${fillPct}%`} stopColor="#f59e0b" />
                                                                <stop offset={`${fillPct}%`} stopColor="currentColor" stopOpacity="0.2" />
                                                            </linearGradient>
                                                        </defs>
                                                        <path
                                                            fill={`url(#${uniqueId})`}
                                                            stroke="#d97706"
                                                            strokeWidth="1.2"
                                                            strokeLinejoin="round"
                                                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                                        />
                                                    </svg>

                                                    {/* Left half hit target for fractional 0.5 */}
                                                    <button
                                                        type="button"
                                                        aria-label={`Rate ${leftVal} stars`}
                                                        className="absolute inset-y-0 left-0 w-1/2 cursor-pointer opacity-0 z-10"
                                                        onMouseEnter={() => setHoverRating(leftVal)}
                                                        onClick={() => {
                                                            setRating(leftVal);
                                                            setHoverRating(null);
                                                        }}
                                                    />

                                                    {/* Right half hit target for full star */}
                                                    <button
                                                        type="button"
                                                        aria-label={`Rate ${rightVal} stars`}
                                                        className="absolute inset-y-0 right-0 w-1/2 cursor-pointer opacity-0 z-10"
                                                        onMouseEnter={() => setHoverRating(rightVal)}
                                                        onClick={() => {
                                                            setRating(rightVal);
                                                            setHoverRating(null);
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Rating Descriptor Note */}
                                    <div className="text-xs font-semibold text-foreground/80 bg-background/80 px-3 py-1.5 rounded-xl border border-border/60">
                                        {ratingDescriptor}
                                    </div>
                                </div>

                                {/* Quick Preset Buttons for zero-friction rating */}
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <span className="text-[11px] text-muted-foreground self-center mr-1">Quick Select:</span>
                                    {PRESET_RATINGS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            type="button"
                                            onClick={() => {
                                                setRating(preset.value);
                                                setHoverRating(null);
                                            }}
                                            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                                rating === preset.value
                                                    ? "bg-amber-500 text-white shadow-xs scale-105"
                                                    : "bg-muted/70 text-foreground/80 hover:bg-muted"
                                            }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Feature Highlight Dropdown */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">
                                    Which Feature Helped You Most?
                                </label>
                                <select
                                    value={featureHighlight}
                                    onChange={(e) => setFeatureHighlight(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    {FEATURE_OPTIONS.map((feat) => (
                                        <option key={feat} value={feat}>
                                            {feat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Headline Input (Optional) */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">
                                    Short Summary / Headline (Optional)
                                </label>
                                <input
                                    type="text"
                                    maxLength={100}
                                    placeholder="e.g. Cleared my technical screening with flying colors!"
                                    value={headline}
                                    onChange={(e) => setHeadline(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                />
                            </div>

                            {/* Review Comment Textarea */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-foreground">
                                        Your Review & Feedback <span className="text-red-500">*</span>
                                    </label>
                                    <span className="text-[11px] text-muted-foreground">
                                        {comment.length} / 1000
                                    </span>
                                </div>
                                <textarea
                                    required
                                    rows={4}
                                    maxLength={1000}
                                    placeholder="Explain your experience with the AI interviewer, question accuracy, or Peer Arena challenge..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full rounded-2xl border border-border bg-background p-3.5 text-xs font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 leading-relaxed"
                                />
                            </div>

                            {/* Form Action Buttons */}
                            <div className="flex items-center justify-between pt-2">
                                <div>
                                    {userExistingReview && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleDeleteReview}
                                            disabled={isDeleting}
                                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-full cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                                            {isDeleting ? "Deleting..." : "Delete Review"}
                                        </Button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsFormOpen(false)}
                                        className="rounded-full text-xs cursor-pointer"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={isSubmitting || comment.trim().length < 5}
                                        className="rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 cursor-pointer shadow-md shadow-blue-500/20"
                                    >
                                        {isSubmitting ? "Publishing..." : userExistingReview ? "Update Review" : "Publish Review"}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Filter and Sort Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        <span className="text-muted-foreground flex items-center gap-1 font-semibold mr-1">
                            <Filter className="w-3.5 h-3.5" /> Filter:
                        </span>
                        {[
                            { id: "all", label: "All Reviews" },
                            { id: "5", label: "5.0 ★ Only" },
                            { id: "4.5", label: "4.5 ★ & Up" },
                            { id: "4+", label: "4.0 ★ & Up" },
                            { id: "3.5", label: "3.5 ★ & Up" },
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                type="button"
                                onClick={() => setFilterRating(btn.id)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                    filterRating === btn.id
                                        ? "bg-foreground text-background shadow-xs"
                                        : "bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
                        <span className="text-muted-foreground font-semibold">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground focus-visible:outline-none"
                        >
                            <option value="newest">Most Recent</option>
                            <option value="highest">Highest Rating</option>
                        </select>
                    </div>
                </div>

                {/* Reviews Grid */}
                {isLoading ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                        Loading community reviews...
                    </div>
                ) : filteredReviews.length === 0 ? (
                    <div className="py-12 text-center rounded-3xl border border-dashed border-border/80 p-8 space-y-2">
                        <p className="text-sm font-semibold text-foreground">No reviews match your selected filter.</p>
                        <p className="text-xs text-muted-foreground">Try clearing your filter to view all reviews.</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilterRating("all")}
                            className="mt-2 rounded-full text-xs"
                        >
                            Show All Reviews
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredReviews.map((rev) => {
                            const isMyReview = user && rev.userId === user.id;

                            return (
                                <div
                                    key={rev._id}
                                    className={`relative flex flex-col justify-between p-6 rounded-3xl border transition-all duration-300 ${
                                        isMyReview
                                            ? "border-blue-500/50 bg-blue-500/5 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20"
                                            : "border-border/70 bg-card hover:border-border hover:shadow-md"
                                    }`}
                                >
                                    <div>
                                        {/* Card Top: Author, Verified Badge & Rating */}
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                                                    {rev.userName ? rev.userName.charAt(0).toUpperCase() : "U"}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <h4 className="text-xs font-bold text-foreground">
                                                            {rev.userName}
                                                        </h4>
                                                        {isMyReview && (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                                        <span>{rev.userRole || "Verified Candidate"}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end shrink-0">
                                                <StarRatingDisplay rating={rev.rating} size={15} />
                                                <span className="text-[11px] font-bold text-amber-500 mt-0.5">
                                                    {rev.rating.toFixed(1)} / 5.0
                                                </span>
                                            </div>
                                        </div>

                                        {/* Feature Highlight Pill */}
                                        {rev.featureHighlight && (
                                            <div className="mb-2.5">
                                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground border border-border/40">
                                                    {rev.featureHighlight}
                                                </span>
                                            </div>
                                        )}

                                        {/* Headline */}
                                        {rev.headline && (
                                            <h5 className="text-xs font-bold text-foreground mb-1.5 leading-snug">
                                                "{rev.headline}"
                                            </h5>
                                        )}

                                        {/* Comment */}
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {rev.comment}
                                        </p>
                                    </div>

                                    {/* Footer: Date and Owner Edit action */}
                                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>
                                            {new Date(rev.createdAt).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </span>

                                        {isMyReview && (
                                            <button
                                                type="button"
                                                onClick={handleOpenEdit}
                                                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline cursor-pointer"
                                            >
                                                <Edit3 className="w-3 h-3" />
                                                <span>Edit</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
