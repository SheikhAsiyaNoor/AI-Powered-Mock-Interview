"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/Authcontext";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import {
    User as UserIcon,
    Shield,
    Lock,
    Unlock,
    Mail,
    Phone,
    Copy,
    Check,
    Award,
    Flame,
    Zap,
    Trophy,
    Crown,
    Calendar,
    ArrowLeft,
    Edit3,
    Sparkles,
    Swords,
    Target,
    Layers,
    Share2,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const RANK_TIER_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    Novice: { bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-500/30", glow: "shadow-slate-500/10" },
    Bronze: { bg: "bg-amber-700/10", text: "text-amber-700 dark:text-amber-500", border: "border-amber-700/30", glow: "shadow-amber-700/10" },
    Silver: { bg: "bg-slate-300/20", text: "text-slate-600 dark:text-slate-300", border: "border-slate-400/40", glow: "shadow-slate-400/10" },
    Gold: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-500/40", glow: "shadow-yellow-500/20" },
    Platinum: { bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-500/40", glow: "shadow-cyan-500/20" },
    Diamond: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/40", glow: "shadow-purple-500/20" },
    Grandmaster: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/40", glow: "shadow-rose-500/30" }
};

const RARITY_STYLES: Record<string, { border: string; bg: string; text: string }> = {
    common: { border: "border-slate-400/40", bg: "bg-slate-400/5", text: "text-slate-500" },
    rare: { border: "border-blue-500/40", bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
    epic: { border: "border-purple-500/50", bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
    legendary: { border: "border-amber-500/60", bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" }
};

export default function UserPublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    const userIdParam = params?.id as string;

    useEffect(() => {
        if (!userIdParam) return;

        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await axiosInstance.get(`/api/auth/users/${userIdParam}`);
                if (data?.profile) {
                    setProfile(data.profile);
                } else {
                    setError("Profile not found.");
                }
            } catch (err: any) {
                console.error("Error loading profile:", err);
                const msg = err?.response?.data?.message || "Candidate profile could not be loaded.";
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userIdParam]);

    const handleCopyId = () => {
        if (!profile?.id && !profile?.userId) return;
        const idToCopy = profile.userId || profile.id;
        navigator.clipboard.writeText(idToCopy);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    const handleCopyShareLink = () => {
        if (typeof window === "undefined") return;
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs font-semibold text-muted-foreground">Loading candidate profile...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center text-2xl font-bold">
                    ⚠️
                </div>
                <h2 className="text-xl font-bold text-foreground">Candidate Profile Not Found</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {error || "The requested user ID or username handle does not exist or has been removed."}
                </p>
                <div className="flex items-center gap-3 pt-2">
                    <Button variant="outline" onClick={() => router.back()} className="rounded-full text-xs">
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Go Back
                    </Button>
                    <Link href="/arena">
                        <Button className="rounded-full text-xs bg-blue-600 hover:bg-blue-700 text-white">
                            Explore Arena Leaderboard 🏆
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const rankTier = profile.gamification?.currentRank || "Novice";
    const tierStyle = RANK_TIER_COLORS[rankTier] || RANK_TIER_COLORS.Novice;
    const isOwner = profile.isOwner;
    const badges = profile.gamification?.badges || [];
    const formattedJoinDate = profile.createdAt
        ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : "Recent Challenger";

    return (
        <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
            {/* Top Bar with Back & Share */}
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyShareLink}
                        className="rounded-full text-xs gap-1.5 h-9 cursor-pointer"
                    >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? "Link Copied!" : "Share Profile"}</span>
                    </Button>

                    {isOwner && (
                        <Link href="/settings/profile">
                            <Button size="sm" className="rounded-full text-xs gap-1.5 h-9 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs">
                                <Edit3 className="w-3.5 h-3.5" /> Edit Profile & Privacy
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Profile Hero Header Card */}
            <Card className="p-6 sm:p-8 border border-border/60 rounded-3xl bg-card shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
                    {/* Avatar */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-muted/60 border-2 border-border/80 overflow-hidden shrink-0 shadow-lg flex items-center justify-center p-1">
                        {profile.avatar ? (
                            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                            <div className="w-full h-full rounded-2xl bg-blue-600/10 text-blue-600 font-extrabold text-3xl flex items-center justify-center">
                                {profile.name?.[0]?.toUpperCase() || "U"}
                            </div>
                        )}
                    </div>

                    {/* Basic Info & Badges */}
                    <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight truncate">
                                {profile.name}
                            </h1>
                            <span className="text-xs px-3 py-0.5 rounded-full font-bold uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                {profile.role || "Student"}
                            </span>
                            {isOwner && (
                                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                                    You (Owner)
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {profile.username && (
                                <span className="font-mono text-foreground font-semibold">@{profile.username}</span>
                            )}
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> Joined {formattedJoinDate}
                            </span>
                        </div>

                        {/* User ID Click-to-Copy */}
                        <div className="pt-1 flex items-center gap-2">
                            <div
                                onClick={handleCopyId}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/50 hover:bg-muted border border-border/60 text-[11px] font-mono text-muted-foreground hover:text-foreground cursor-pointer transition"
                                title="Click to copy candidate User ID"
                            >
                                <span>ID: <strong className="text-foreground">{profile.id || profile.userId}</strong></span>
                                {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </div>
                            {copiedId && <span className="text-[10px] text-emerald-600 font-bold animate-pulse">Copied!</span>}
                        </div>
                    </div>

                    {/* Rank Tier Badge Card */}
                    {profile.gamification?.currentRank !== null ? (
                        <div className={`p-4 rounded-2xl border ${tierStyle.border} ${tierStyle.bg} text-center space-y-1.5 shrink-0 min-w-[140px] shadow-sm`}>
                            <Crown className="w-6 h-6 mx-auto text-amber-500" />
                            <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Arena Tier</div>
                            <div className={`text-sm font-black ${tierStyle.text}`}>{rankTier}</div>
                            <div className="text-[10px] font-mono font-bold text-muted-foreground">
                                {profile.gamification?.totalXp !== null ? `${profile.gamification.totalXp} XP` : "Ranked"}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-center space-y-1 shrink-0 text-muted-foreground">
                            <Lock className="w-5 h-5 mx-auto text-muted-foreground/60" />
                            <div className="text-[10px] font-bold">Rank Hidden</div>
                            <div className="text-[9px] italic">Private by user</div>
                        </div>
                    )}
                </div>

                {/* Candidate Bio */}
                {profile.bio && (
                    <div className="mt-6 pt-5 border-t border-border/40 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        <p>{profile.bio}</p>
                    </div>
                )}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUMN 1: Contact Details & Account Diagnostic (1 Col) */}
                <div className="space-y-6">
                    <Card className="p-6 border border-border/60 rounded-3xl bg-card shadow-xs space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5 text-blue-600" /> Candidate Channels
                        </h3>

                        <div className="space-y-3 text-xs">
                            {/* Primary Email */}
                            <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 space-y-1">
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold">
                                    <Mail className="w-3.5 h-3.5 text-blue-500" /> Primary Email
                                </span>
                                {profile.isEmailPublic && profile.email ? (
                                    <div className="font-mono text-foreground font-semibold break-all">{profile.email}</div>
                                ) : (
                                    <div className="text-muted-foreground/60 italic">Private</div>
                                )}
                            </div>

                            {/* Recovery Email */}
                            {(profile.recoveryEmail || (isOwner && profile.privacySettings?.isRecoveryEmailPublic !== undefined)) && (
                                <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 space-y-1">
                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold">
                                        <Mail className="w-3.5 h-3.5 text-emerald-500" /> Recovery Contact
                                    </span>
                                    {profile.isRecoveryEmailPublic && profile.recoveryEmail ? (
                                        <div className="font-mono text-foreground font-semibold break-all">{profile.recoveryEmail}</div>
                                    ) : (
                                        <div className="text-muted-foreground/60 italic">Private</div>
                                    )}
                                </div>
                            )}

                            {/* Phone Number */}
                            {(profile.phoneNumber || (isOwner && profile.privacySettings?.isPhonePublic !== undefined)) && (
                                <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 space-y-1">
                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold">
                                        <Phone className="w-3.5 h-3.5 text-amber-500" /> Phone Contact
                                    </span>
                                    {profile.isPhonePublic && profile.phoneNumber ? (
                                        <div className="font-mono text-foreground font-semibold">{profile.phoneNumber}</div>
                                    ) : (
                                        <div className="text-muted-foreground/60 italic">Private</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Quick Arena Navigation Card */}
                    <Card className="p-5 border border-border/60 rounded-3xl bg-linear-to-br from-blue-900/10 to-purple-900/10 space-y-3">
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Swords className="w-4 h-4 text-purple-600" /> Peer Challenge Arena
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                            Compete with {profile.name} and other candidates on the global leaderboard.
                        </p>
                        <Link href="/arena" className="block">
                            <Button className="w-full h-9 rounded-xl text-xs bg-primary text-primary-foreground font-bold shadow-xs">
                                Enter Arena Duels ⚔️
                            </Button>
                        </Link>
                    </Card>
                </div>

                {/* COLUMN 2 & 3: Arena Performance & Badges Showcase (2 Cols) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Arena Battle Stats Grid */}
                    <Card className="p-6 border border-border/60 rounded-3xl bg-card shadow-xs space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-amber-500" /> Arena Placement Statistics
                            </h3>
                            {profile.gamification?.totalXp !== null && (
                                <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                    Level {profile.gamification?.level || 1} Challenger
                                </span>
                            )}
                        </div>

                        {profile.gamification?.currentStreak !== null ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40 text-center space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Total XP</div>
                                    <div className="text-lg font-black font-mono text-primary">
                                        {profile.gamification?.totalXp ?? 0}
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-center space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center gap-0.5">
                                        <Flame className="w-3 h-3 fill-orange-500" /> Active Streak
                                    </div>
                                    <div className="text-lg font-black text-orange-600 dark:text-orange-400">
                                        {profile.gamification?.currentStreak ?? 0} Days
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40 text-center space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Max Streak</div>
                                    <div className="text-lg font-black font-mono text-foreground">
                                        {profile.gamification?.maxStreak ?? 0} Days
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40 text-center space-y-1">
                                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Battles Won</div>
                                    <div className="text-lg font-black font-mono text-foreground">
                                        {profile.gamification?.challengesCompleted ?? 0}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 rounded-2xl bg-muted/20 border border-border/40 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                <Lock className="w-4 h-4 text-muted-foreground" />
                                <span>Arena statistics have been made private by the candidate.</span>
                            </div>
                        )}
                    </Card>

                    {/* Achievement Badges Showcase */}
                    <Card className="p-6 border border-border/60 rounded-3xl bg-card shadow-xs space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5 text-blue-600" /> Achievement Medals & Badges ({badges.length})
                            </h3>
                            <span className="text-[10px] text-muted-foreground font-semibold">Earned via AI evaluations</span>
                        </div>

                        {badges.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {badges.map((b: any, idx: number) => {
                                    const rarity = b.rarity || "common";
                                    const rStyle = RARITY_STYLES[rarity] || RARITY_STYLES.common;
                                    const unlockDate = b.unlockedAt
                                        ? new Date(b.unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                        : null;

                                    return (
                                        <div
                                            key={idx}
                                            className={`p-3.5 rounded-2xl border ${rStyle.border} ${rStyle.bg} flex items-start gap-3 transition-all hover:scale-[1.01]`}
                                        >
                                            <div className="text-2xl p-2 rounded-xl bg-card/80 border border-border/50 shrink-0 shadow-xs">
                                                {b.icon || "🏆"}
                                            </div>
                                            <div className="space-y-0.5 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-bold text-foreground truncate">{b.name}</span>
                                                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${rStyle.text} ${rStyle.border}`}>
                                                        {rarity}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                                                    {b.description}
                                                </p>
                                                {unlockDate && (
                                                    <p className="text-[10px] text-muted-foreground/70 pt-0.5">Unlocked {unlockDate}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 rounded-2xl bg-muted/20 border border-border/40 text-center text-xs text-muted-foreground space-y-2">
                                <Award className="w-8 h-8 mx-auto text-muted-foreground/50" />
                                <p className="font-semibold text-foreground">No Badges Displayed</p>
                                <p className="text-[11px] text-muted-foreground">
                                    {profile.gamification?.badges?.length === 0
                                        ? "This candidate has not unlocked any Arena medals yet."
                                        : "Badges are hidden from public view."}
                                </p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
