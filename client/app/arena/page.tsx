"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/Authcontext";
import axiosInstance from "@/lib/axios";
import {
    Swords,
    Trophy,
    Flame,
    Zap,
    Shield,
    Clock,
    Users,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Crown,
    Medal,
    Award,
    TrendingUp,
    RefreshCw,
    Code,
    MessageSquare,
    Brain,
    Layers,
    Calendar,
    Pin,
    Lock,
    Filter,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ChallengeItem {
    id: string;
    title: string;
    description: string;
    type: "daily" | "weekly" | "special";
    category: "Technical" | "HR" | "Aptitude" | "Domain-Specific";
    domain: string;
    difficulty: "Easy" | "Medium" | "Hard";
    timeLimitMinutes: number;
    startDate: string;
    endDate: string;
    totalPoints: number;
    xpReward: number;
    participantsCount: number;
    isCompleted?: boolean;
    userScore?: number;
}

interface LeaderboardUser {
    rank: number;
    userId: string;
    name: string;
    role: string;
    avatar?: string;
    xp: number;
    tier: string;
    level: number;
    streak: number;
    challengesCompleted: number;
    badgesCount: number;
    pinnedBadgeId?: string;
    isCurrentUser?: boolean;
}

interface UserGamificationData {
    totalXp: number;
    currentRank: string;
    level: number;
    currentStreak: number;
    maxStreak: number;
    challengesCompleted: number;
    pinnedBadgeId?: string;
    categoryStats: {
        Technical: { completed: number; totalScore: number };
        HR: { completed: number; totalScore: number };
        Aptitude: { completed: number; totalScore: number };
        DomainSpecific: { completed: number; totalScore: number };
    };
    rankingHistory?: { date: string; rank: number; xp: number; challengesCompleted: number }[];
}

interface BadgeItem {
    badgeId: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    criteria: string;
    maxProgress: number;
    currentProgress: number;
    isUnlocked: boolean;
    isPinned?: boolean;
    unlockedAt: string | null;
}

const CATEGORY_ICONS: Record<string, any> = {
    Technical: Code,
    HR: MessageSquare,
    Aptitude: Brain,
    "Domain-Specific": Layers,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Technical: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30" },
    HR: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/30" },
    Aptitude: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30" },
    "Domain-Specific": { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30" },
};

const RANK_TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    Novice: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" },
    Bronze: { bg: "bg-amber-700/10", text: "text-amber-600", border: "border-amber-700/30" },
    Silver: { bg: "bg-slate-300/10", text: "text-slate-300", border: "border-slate-300/40" },
    Gold: { bg: "bg-amber-400/15", text: "text-amber-400", border: "border-amber-400/40" },
    Platinum: { bg: "bg-cyan-400/15", text: "text-cyan-400", border: "border-cyan-400/40" },
    Diamond: { bg: "bg-blue-400/20", text: "text-blue-400", border: "border-blue-400/50" },
    Grandmaster: { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/50" },
};

const RARITY_THEMES: Record<string, { bg: string; text: string; border: string; glow: string; badgeBg: string }> = {
    common: {
        bg: "bg-slate-500/10",
        text: "text-slate-400",
        border: "border-slate-500/30",
        glow: "hover:border-slate-400/50",
        badgeBg: "from-slate-700 to-slate-900"
    },
    rare: {
        bg: "bg-blue-500/15",
        text: "text-blue-400",
        border: "border-blue-500/40",
        glow: "hover:border-blue-400/60 shadow-blue-500/10",
        badgeBg: "from-blue-600 via-indigo-700 to-slate-900"
    },
    epic: {
        bg: "bg-purple-500/20",
        text: "text-purple-400",
        border: "border-purple-500/50",
        glow: "hover:border-purple-400/70 shadow-purple-500/20",
        badgeBg: "from-purple-600 via-pink-700 to-slate-900"
    },
    legendary: {
        bg: "bg-amber-500/20",
        text: "text-amber-400",
        border: "border-amber-500/60",
        glow: "hover:border-amber-400/80 shadow-amber-500/25",
        badgeBg: "from-amber-500 via-orange-600 to-yellow-900"
    }
};

export default function ArenaPage() {
    const router = useRouter();
    const { isLoggedIn, user } = useAuth();

    const [activeTab, setActiveTab] = useState<"challenges" | "leaderboard" | "badges" | "analytics">("challenges");
    const [categoryFilter, setCategoryFilter] = useState<string>("All");
    const [typeFilter, setTypeFilter] = useState<string>("All");

    // Badges Filters
    const [badgeRarityFilter, setBadgeRarityFilter] = useState<string>("All");
    const [badgeCategoryFilter, setBadgeCategoryFilter] = useState<string>("All");
    const [badgeStatusFilter, setBadgeStatusFilter] = useState<"All" | "Unlocked" | "Locked">("All");

    const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [userStanding, setUserStanding] = useState<LeaderboardUser | null>(null);
    const [gamification, setGamification] = useState<UserGamificationData | null>(null);
    const [badges, setBadges] = useState<BadgeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pinLoadingId, setPinLoadingId] = useState<string | null>(null);
    const [leaderboardPage, setLeaderboardPage] = useState(1);
    const LEADERBOARD_PAGE_SIZE = 20;

    const loadArenaData = async () => {
        setIsLoading(true);
        try {
            const [chalRes, leadRes, statsRes] = await Promise.all([
                axiosInstance.get("/api/arena/challenges").catch(err => {
                    console.error("Error fetching challenges:", err);
                    return { data: { challenges: [] } };
                }),
                axiosInstance.get("/api/arena/leaderboard").catch(err => {
                    console.error("Error fetching leaderboard:", err);
                    return { data: { leaderboard: [], userStanding: null } };
                }),
                axiosInstance.get("/api/arena/user-stats").catch(err => {
                    console.error("Error fetching stats:", err);
                    return { data: { stats: null, badges: [] } };
                })
            ]);

            setChallenges(chalRes.data.challenges || []);
            setLeaderboard(leadRes.data.leaderboard || []);
            setUserStanding(leadRes.data.userStanding || null);

            if (statsRes.data.stats) {
                setGamification(statsRes.data.stats);
            }
            if (statsRes.data.badges) {
                setBadges(statsRes.data.badges);
            }
        } catch (err: any) {
            console.error("Error loading arena data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadArenaData();
    }, [isLoggedIn, user?.id]);

    const handlePinBadge = async (badgeId: string) => {
        setPinLoadingId(badgeId);
        try {
            await axiosInstance.post("/api/arena/badges/pin", { badgeId });
            setBadges(prev => prev.map(b => ({ ...b, isPinned: b.badgeId === badgeId })));
            if (gamification) {
                setGamification(prev => prev ? ({ ...prev, pinnedBadgeId: badgeId }) : null);
            }
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to pin badge.");
        } finally {
            setPinLoadingId(null);
        }
    };

    const filteredChallenges = challenges.filter((c) => {
        const matchesCat = categoryFilter === "All" || c.category === categoryFilter;
        const matchesType = typeFilter === "All" || c.type === typeFilter.toLowerCase();
        return matchesCat && matchesType;
    });

    const filteredBadges = badges.filter((b) => {
        const matchesRarity = badgeRarityFilter === "All" || b.rarity === badgeRarityFilter.toLowerCase();
        const matchesCategory = badgeCategoryFilter === "All" || b.category === badgeCategoryFilter;
        const matchesStatus =
            badgeStatusFilter === "All" ||
            (badgeStatusFilter === "Unlocked" && b.isUnlocked) ||
            (badgeStatusFilter === "Locked" && !b.isUnlocked);
        return matchesRarity && matchesCategory && matchesStatus;
    });

    const tierStyle = gamification?.currentRank
        ? RANK_TIER_COLORS[gamification.currentRank] || RANK_TIER_COLORS.Novice
        : RANK_TIER_COLORS.Novice;

    const pinnedBadge = badges.find(b => b.badgeId === (gamification?.pinnedBadgeId || "welcome_challenger")) || badges[0];

    const nextTierXp = (gamification?.level || 1) * 300;
    const currentXp = gamification?.totalXp || 0;
    const progressPercent = Math.min(100, Math.round((currentXp % 300) / 3));

    return (
        <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Arena Hero Banner with Live Gamification Status & Pinned Badge */}
            <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6 sm:p-10 mb-8 shadow-2xl backdrop-blur-xl">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
                
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
                            <Swords className="w-3.5 h-3.5" />
                            Peer Challenge Arena
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
                            Compete, Earn XP & Rank Among{" "}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                                Top Candidates
                            </span>
                        </h1>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Take AI-generated synchronized challenges across Technical, HR, Aptitude, and Domain rounds. Earn exclusive AIPMI Placement Accolades, maintain streaks, and climb the leaderboard.
                        </p>
                    </div>

                    {/* User Gamification Card */}
                    {isLoggedIn && gamification && (
                        <div className="w-full lg:w-80 p-5 rounded-2xl bg-card/80 border border-border/60 shadow-xl backdrop-blur-md space-y-3 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border uppercase tracking-wider ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>
                                        {gamification.currentRank} Tier
                                    </span>
                                    <span className="text-xs font-bold text-muted-foreground">
                                        Lvl {gamification.level}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-orange-500 font-extrabold text-xs px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                    <Flame className="w-4 h-4 fill-orange-500 animate-pulse" />
                                    <span>{gamification.currentStreak}D Streak</span>
                                </div>
                            </div>

                            {/* Pinned Trophy Banner */}
                            {pinnedBadge && (
                                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{pinnedBadge.icon}</span>
                                        <div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                                                <Pin className="w-2.5 h-2.5 text-primary" /> Pinned Medallion
                                            </div>
                                            <div className="text-xs font-bold text-foreground">{pinnedBadge.name}</div>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase border ${
                                        RARITY_THEMES[pinnedBadge.rarity]?.bg
                                    } ${RARITY_THEMES[pinnedBadge.rarity]?.text} ${RARITY_THEMES[pinnedBadge.rarity]?.border}`}>
                                        {pinnedBadge.rarity}
                                    </span>
                                </div>
                            )}

                            {/* Level Progress */}
                            <div>
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span>{gamification.totalXp} XP</span>
                                    <span className="text-muted-foreground">Next Lvl: {nextTierXp} XP</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-500 rounded-full"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-center">
                                <div className="p-2 rounded-xl bg-muted/40">
                                    <div className="text-sm font-bold text-foreground">{gamification.challengesCompleted}</div>
                                    <div className="text-[10px] text-muted-foreground">Battles Won</div>
                                </div>
                                <div className="p-2 rounded-xl bg-muted/40">
                                    <div className="text-sm font-bold text-amber-500">#{userStanding ? userStanding.rank : "1"}</div>
                                    <div className="text-[10px] text-muted-foreground">Peer Standing</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Arena Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-border/40 pb-3 mb-8 overflow-x-auto">
                {[
                    { id: "challenges", label: "Active Challenges", icon: Swords, count: challenges.length },
                    { id: "leaderboard", label: "Global Leaderboard", icon: Trophy, count: leaderboard.length },
                    { id: "badges", label: "Placement Accolades", icon: Medal, count: badges.filter(b => b.isUnlocked).length },
                    { id: "analytics", label: "Performance & History", icon: TrendingUp },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: ACTIVE CHALLENGES */}
            {activeTab === "challenges" && (
                <div className="space-y-6">
                    {/* Filters Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-sm">
                        {/* Category Filter */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-muted-foreground mr-1">Category:</span>
                            {["All", "Technical", "HR", "Aptitude", "Domain-Specific"].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                        categoryFilter === cat
                                            ? "bg-secondary text-secondary-foreground font-bold shadow-xs"
                                            : "text-muted-foreground hover:bg-muted/60"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Period Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-muted-foreground mr-1">Period:</span>
                            {["All", "Daily", "Weekly"].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                        typeFilter === t
                                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                            : "text-muted-foreground hover:bg-muted/60"
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Challenges Grid */}
                    {filteredChallenges.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground space-y-4">
                            <Swords className="w-12 h-12 mx-auto text-muted-foreground/40" />
                            <div className="space-y-1">
                                <p className="font-bold text-base text-foreground">No active challenges found in this filter.</p>
                                <p className="text-xs">Click below to sync live challenges with the server.</p>
                            </div>
                            <Button
                                onClick={loadArenaData}
                                disabled={isLoading}
                                className="rounded-xl text-xs font-bold bg-primary text-primary-foreground px-4 py-2 cursor-pointer shadow-md"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                                Sync Live Challenges
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredChallenges.map((challenge) => {
                                const CatIcon = CATEGORY_ICONS[challenge.category] || Code;
                                const catStyle = CATEGORY_COLORS[challenge.category] || CATEGORY_COLORS.Technical;

                                return (
                                    <Card
                                        key={challenge.id}
                                        className="p-6 relative flex flex-col justify-between border-border/40 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-xl transition-all duration-300 group"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-2.5 rounded-xl border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                                                        <CatIcon className="w-4 h-4" />
                                                    </div>
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                                                        {challenge.category}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                                        challenge.type === "weekly"
                                                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-300"
                                                            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                                    }`}>
                                                        {challenge.type} Duel
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                                                        {challenge.difficulty}
                                                    </span>
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                                                {challenge.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
                                                {challenge.description}
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-border/30">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                                                <span className="flex items-center gap-1.5 font-medium" title="Session Time Limit">
                                                    <Clock className="w-3.5 h-3.5 text-blue-500" /> {challenge.timeLimitMinutes} Mins Session
                                                </span>
                                                <span className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400" title="Competition Cycle Window">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {(() => {
                                                        const diff = challenge.endDate ? new Date(challenge.endDate).getTime() - Date.now() : 0;
                                                        if (diff <= 0) return "Active Window";
                                                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                        return days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
                                                    })()}
                                                </span>
                                                <span className="flex items-center gap-1 font-bold text-amber-500">
                                                    <Zap className="w-3.5 h-3.5 fill-amber-500" /> +{challenge.xpReward} XP
                                                </span>
                                            </div>

                                            {challenge.isCompleted ? (
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                                                        <div className="flex items-center gap-1.5">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            <span>Completed</span>
                                                        </div>
                                                        <span className="font-bold font-mono">Score: {challenge.userScore}%</span>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => router.push(`/arena/${challenge.id}`)}
                                                        className="w-full h-10 rounded-xl border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                                                    >
                                                        <span>Review Submission & AI Rubric</span>
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={() => router.push(`/arena/${challenge.id}`)}
                                                    className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md shadow-primary/20 cursor-pointer"
                                                >
                                                    Enter Arena Duel
                                                    <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: GLOBAL LEADERBOARD */}
            {activeTab === "leaderboard" && (
                <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl space-y-6">
                    <div>
                        <h2 className="text-xl font-bold">Global Arena Leaderboard</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Top candidate rankings based on XP, streaks, and challenge victories.</p>
                    </div>

                    {/* Top 3 Podium Cards */}
                    {leaderboard.length >= 3 && (
                        <div className="grid grid-cols-3 gap-4 pt-4 pb-2 max-w-2xl mx-auto items-end">
                            {/* Rank 2 */}
                            <div className="p-4 rounded-2xl bg-muted/40 border border-slate-300/40 text-center space-y-2 order-1">
                                <div className="text-2xl">🥈</div>
                                <div className="font-bold text-sm truncate">{leaderboard[1].name}</div>
                                <div className="text-xs font-mono font-bold text-primary">{leaderboard[1].xp} XP</div>
                                <div className="text-[10px] text-muted-foreground">{leaderboard[1].tier}</div>
                            </div>
                            {/* Rank 1 */}
                            <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-500/20 to-card border-2 border-amber-400 text-center space-y-2 order-2 scale-105 shadow-xl shadow-amber-500/10">
                                <Crown className="w-8 h-8 mx-auto text-amber-400 animate-bounce" />
                                <div className="font-extrabold text-base truncate">{leaderboard[0].name}</div>
                                <div className="text-sm font-mono font-extrabold text-amber-500">{leaderboard[0].xp} XP</div>
                                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{leaderboard[0].tier}</div>
                            </div>
                            {/* Rank 3 */}
                            <div className="p-4 rounded-2xl bg-muted/40 border border-amber-700/40 text-center space-y-2 order-3">
                                <div className="text-2xl">🥉</div>
                                <div className="font-bold text-sm truncate">{leaderboard[2].name}</div>
                                <div className="text-xs font-mono font-bold text-primary">{leaderboard[2].xp} XP</div>
                                <div className="text-[10px] text-muted-foreground">{leaderboard[2].tier}</div>
                            </div>
                        </div>
                    )}

                    {/* Leaderboard Table (Paginated list of 20 below Top 3) */}
                    {(() => {
                        const listCandidates = leaderboard.length > 3 ? leaderboard.slice(3) : leaderboard;
                        const totalPages = Math.max(1, Math.ceil(listCandidates.length / LEADERBOARD_PAGE_SIZE));
                        const currentPage = Math.min(leaderboardPage, totalPages);
                        const displayedCandidates = listCandidates.slice(
                            (currentPage - 1) * LEADERBOARD_PAGE_SIZE,
                            currentPage * LEADERBOARD_PAGE_SIZE
                        );
                        const startRankIndex = listCandidates.length > 0 ? (currentPage - 1) * LEADERBOARD_PAGE_SIZE + 1 : 0;
                        const endRankIndex = Math.min(currentPage * LEADERBOARD_PAGE_SIZE, listCandidates.length);

                        return (
                            <div className="space-y-4">
                                <div className="overflow-x-auto rounded-2xl border border-border/30">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-border/40 text-muted-foreground uppercase bg-muted/30">
                                            <tr>
                                                <th className="py-3 px-4">Rank</th>
                                                <th className="py-3 px-4">Candidate</th>
                                                <th className="py-3 px-4">Total XP</th>
                                                <th className="py-3 px-4">Rank Tier</th>
                                                <th className="py-3 px-4">Streak</th>
                                                <th className="py-3 px-4">Battles</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/20">
                                            {displayedCandidates.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-8 text-center text-muted-foreground font-medium">
                                                        No additional candidates ranked yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                displayedCandidates.map((u) => {
                                                    const tierBadge = RANK_TIER_COLORS[u.tier] || RANK_TIER_COLORS.Novice;
                                                    return (
                                                        <tr
                                                            key={u.userId}
                                                            className={`hover:bg-muted/30 transition-colors ${
                                                                u.isCurrentUser ? "bg-primary/10 font-bold" : ""
                                                            }`}
                                                        >
                                                            <td className="py-3.5 px-4 font-mono font-extrabold text-muted-foreground">
                                                                #{u.rank}
                                                            </td>
                                                            <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
                                                                    {u.name.slice(0, 2).toUpperCase()}
                                                                </div>
                                                                <span>{u.name}</span>
                                                                {u.isCurrentUser && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">
                                                                        You
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3.5 px-4 font-mono font-bold text-primary">{u.xp} XP</td>
                                                            <td className="py-3.5 px-4">
                                                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border ${tierBadge.bg} ${tierBadge.text} ${tierBadge.border}`}>
                                                                    {u.tier}
                                                                </span>
                                                            </td>
                                                            <td className="py-3.5 px-4">
                                                                <span className="inline-flex items-center gap-1 text-orange-400 font-bold text-xs">
                                                                    <Flame className="w-3.5 h-3.5 fill-orange-400" /> {u.streak}D
                                                                </span>
                                                            </td>
                                                            <td className="py-3.5 px-4 text-muted-foreground">{u.challengesCompleted} completed</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls Bar */}
                                {listCandidates.length > 0 && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
                                        <div>
                                            Showing <strong className="text-foreground">{startRankIndex}–{endRankIndex}</strong> of <strong className="text-foreground">{listCandidates.length}</strong> Challengers
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage <= 1}
                                                onClick={() => setLeaderboardPage((prev) => Math.max(1, prev - 1))}
                                                className="h-8 px-3 rounded-xl text-xs flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="w-3.5 h-3.5" /> Prev
                                            </Button>

                                            {/* Page Number Pills */}
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                                    <button
                                                        key={pageNum}
                                                        type="button"
                                                        onClick={() => setLeaderboardPage(pageNum)}
                                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                            currentPage === pageNum
                                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                ))}
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={currentPage >= totalPages}
                                                onClick={() => setLeaderboardPage((prev) => Math.min(totalPages, prev + 1))}
                                                className="h-8 px-3 rounded-xl text-xs flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Next <ChevronRight className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </Card>
            )}

            {/* TAB 3: AIPMI PLACEMENT ACCOLADES & READINESS LAURELS */}
            {activeTab === "badges" && (
                <div className="space-y-6">
                    {/* Header Banner */}
                    <div className="p-6 rounded-3xl bg-card/60 border border-border/40 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-wider mb-2">
                                <Trophy className="w-3.5 h-3.5" />
                                Placement Vanguard Accolades
                            </div>
                            <h2 className="text-2xl font-extrabold">Readiness Laurels & Achievement Medallions</h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                Earn rare, epic, and legendary medallions by conquering interview rounds, maintaining preparation streaks, and demonstrating FAANG-ready mastery. Pin your top accolade to your profile!
                            </p>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/50 shrink-0">
                            <div className="text-center px-2">
                                <div className="text-xl font-extrabold text-foreground">
                                    {badges.filter(b => b.isUnlocked).length} / {badges.length}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-semibold">Trophies Earned</div>
                            </div>
                            <div className="h-8 w-px bg-border/60" />
                            <div className="text-center px-2">
                                <div className="text-xl font-extrabold text-amber-500">
                                    {badges.filter(b => b.isUnlocked && b.rarity === "legendary").length}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-semibold">Legendary Trophies</div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Controls Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-sm text-xs">
                        {/* Rarity Filter */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-muted-foreground mr-1">Rarity:</span>
                            {["All", "Legendary", "Epic", "Rare", "Common"].map((rarity) => (
                                <button
                                    key={rarity}
                                    onClick={() => setBadgeRarityFilter(rarity)}
                                    className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                                        badgeRarityFilter === rarity
                                            ? "bg-primary text-primary-foreground shadow-xs"
                                            : "text-muted-foreground hover:bg-muted/60"
                                    }`}
                                >
                                    {rarity}
                                </button>
                            ))}
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-muted-foreground mr-1">Category:</span>
                            {["All", "Streaks", "Technical", "Behavioral", "Volume", "Excellence"].map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setBadgeCategoryFilter(cat)}
                                    className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                                        badgeCategoryFilter === cat
                                            ? "bg-secondary text-secondary-foreground font-bold shadow-xs"
                                            : "text-muted-foreground hover:bg-muted/60"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-muted-foreground mr-1">Status:</span>
                            {(["All", "Unlocked", "Locked"] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setBadgeStatusFilter(status)}
                                    className={`px-3 py-1 rounded-xl font-semibold transition-all cursor-pointer ${
                                        badgeStatusFilter === status
                                            ? "bg-muted text-foreground font-bold border border-border"
                                            : "text-muted-foreground hover:bg-muted/60"
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AIPMI Vanguard Accolades Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {filteredBadges.map((badge) => {
                            const rStyle = RARITY_THEMES[badge.rarity] || RARITY_THEMES.common;
                            const progressPct = Math.min(100, Math.round((badge.currentProgress / (badge.maxProgress || 1)) * 100));

                            return (
                                <Card
                                    key={badge.badgeId}
                                    className={`relative p-5 flex flex-col justify-between rounded-3xl border transition-all duration-300 backdrop-blur-md group ${
                                        badge.isUnlocked
                                            ? `bg-card/80 ${rStyle.border} ${rStyle.glow} shadow-lg`
                                            : "bg-muted/20 border-border/30 opacity-70"
                                    }`}
                                >
                                    {/* Top Rarity & Category Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${rStyle.bg} ${rStyle.text} ${rStyle.border}`}>
                                            {badge.rarity}
                                        </span>
                                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                            {badge.category}
                                        </span>
                                    </div>

                                    {/* 3D Hexagonal / Medal Trophy Icon */}
                                    <div className="flex flex-col items-center text-center my-2 space-y-3">
                                        <div className="relative">
                                            <div
                                                className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${rStyle.badgeBg} p-0.5 shadow-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                                                    !badge.isUnlocked ? "grayscale" : ""
                                                }`}
                                            >
                                                <div className="w-full h-full rounded-[22px] bg-card/90 flex items-center justify-center text-3xl shadow-inner">
                                                    {badge.icon}
                                                </div>
                                            </div>

                                            {badge.isPinned && (
                                                <div
                                                    className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-primary text-primary-foreground shadow-md"
                                                    title="Pinned to your public profile"
                                                >
                                                    <Pin className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="font-extrabold text-base text-foreground tracking-tight">
                                                {badge.name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                                                {badge.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Meter & Criteria Footer */}
                                    <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
                                        <div>
                                            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground mb-1">
                                                <span>Criteria:</span>
                                                <span className="font-bold text-foreground">
                                                    {badge.isUnlocked ? "Completed ✓" : `${badge.currentProgress} / ${badge.maxProgress}`}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        badge.isUnlocked ? "bg-emerald-500" : "bg-primary"
                                                    }`}
                                                    style={{ width: `${progressPct}%` }}
                                                />
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-1 text-left line-clamp-1">
                                                {badge.criteria}
                                            </div>
                                        </div>

                                        {badge.isUnlocked ? (
                                            <div className="flex items-center justify-between gap-2 pt-1">
                                                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate">
                                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                    <span>Unlocked</span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant={badge.isPinned ? "default" : "outline"}
                                                    disabled={pinLoadingId === badge.badgeId}
                                                    onClick={() => handlePinBadge(badge.badgeId)}
                                                    className="h-7 text-[10px] font-bold rounded-lg px-2 cursor-pointer shrink-0"
                                                >
                                                    <Pin className="w-2.5 h-2.5 mr-1" />
                                                    {badge.isPinned ? "Pinned" : "Pin Trophy"}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-[11px] font-semibold text-muted-foreground/80 flex items-center justify-center gap-1.5 py-1 bg-muted/30 rounded-xl">
                                                <Lock className="w-3 h-3 text-muted-foreground" />
                                                <span>Locked Milestone</span>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 4: PERFORMANCE & HISTORY */}
            {activeTab === "analytics" && (
                <div className="space-y-6">
                    <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Category Mastery Breakdown</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { key: "Technical" as const, label: "Technical & Coding", icon: Code, color: "text-blue-500" },
                                { key: "HR" as const, label: "HR & STAR Behavioral", icon: MessageSquare, color: "text-purple-500" },
                                { key: "Aptitude" as const, label: "Logical Aptitude", icon: Brain, color: "text-amber-500" },
                                { key: "DomainSpecific" as const, label: "Domain Architecture", icon: Layers, color: "text-emerald-500" },
                            ].map((item) => {
                                const Icon = item.icon;
                                const stats = gamification?.categoryStats?.[item.key] || { completed: 0, totalScore: 0 };
                                const avg = stats.completed > 0 ? Math.round(stats.totalScore / stats.completed) : 0;

                                return (
                                    <div key={item.key} className="p-4 rounded-2xl bg-muted/30 border border-border/40 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Icon className={`w-5 h-5 ${item.color}`} />
                                            <span className="text-xs font-mono font-bold">{stats.completed} Battles</span>
                                        </div>
                                        <div className="font-bold text-sm">{item.label}</div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                                            <span>Average Score:</span>
                                            <span className="font-bold text-foreground">{avg}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
