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
    Calendar
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
    questionsCount: number;
    isCompleted: boolean;
    userScore: number | null;
}

interface LeaderboardUser {
    rank: number;
    userId: string;
    name: string;
    role: string;
    xp: number;
    tier: string;
    level: number;
    streak: number;
    challengesCompleted: number;
    badgesCount: number;
    isCurrentUser: boolean;
}

interface UserGamificationData {
    totalXp: number;
    currentRank: string;
    level: number;
    currentStreak: number;
    maxStreak: number;
    challengesCompleted: number;
    categoryStats?: {
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
    isUnlocked: boolean;
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

export default function ArenaPage() {
    const router = useRouter();
    const { isLoggedIn, user } = useAuth();

    const [activeTab, setActiveTab] = useState<"challenges" | "leaderboard" | "badges" | "analytics">("challenges");
    const [categoryFilter, setCategoryFilter] = useState<string>("All");
    const [typeFilter, setTypeFilter] = useState<string>("All");

    const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [userStanding, setUserStanding] = useState<LeaderboardUser | null>(null);
    const [gamification, setGamification] = useState<UserGamificationData | null>(null);
    const [badges, setBadges] = useState<BadgeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadArenaData = async () => {
        setIsLoading(true);
        try {
            const [chalRes, leadRes, statsRes] = await Promise.all([
                axiosInstance.get("/api/arena/challenges"),
                axiosInstance.get("/api/arena/leaderboard"),
                axiosInstance.get("/api/arena/user-stats").catch(() => ({ data: { stats: null, badges: [] } }))
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
    }, [isLoggedIn]);

    const filteredChallenges = challenges.filter((c) => {
        const matchesCat = categoryFilter === "All" || c.category === categoryFilter;
        const matchesType = typeFilter === "All" || c.type === typeFilter.toLowerCase();
        return matchesCat && matchesType;
    });

    const tierStyle = gamification?.currentRank
        ? RANK_TIER_COLORS[gamification.currentRank] || RANK_TIER_COLORS.Novice
        : RANK_TIER_COLORS.Novice;

    const nextTierXp = (gamification?.level || 1) * 300;
    const currentXp = gamification?.totalXp || 0;
    const progressPercent = Math.min(100, Math.round((currentXp % 300) / 3));

    return (
        <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Arena Hero Banner with Live Gamification Status */}
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
                            Take AI-generated daily and weekly interview challenges across Technical, HR, Aptitude, and Domain rounds. Earn achievement badges, maintain streaks, and climb the leaderboard.
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

                            <div>
                                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                                    <span className="text-muted-foreground">XP Progress</span>
                                    <span className="font-mono text-primary font-bold">{gamification.totalXp} XP</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-500"
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
                    { id: "badges", label: "Achievement Badges", icon: Medal, count: badges.filter(b => b.isUnlocked).length },
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
                        <div className="text-center py-16 text-muted-foreground space-y-3">
                            <Swords className="w-10 h-10 mx-auto text-muted-foreground/50" />
                            <p className="font-semibold text-foreground">No active challenges found in this filter.</p>
                            <p className="text-xs">Check back daily or switch category filters.</p>
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
                                                <span className="flex items-center gap-1.5 font-medium">
                                                    <Clock className="w-3.5 h-3.5 text-blue-500" /> {challenge.timeLimitMinutes} Mins
                                                </span>
                                                <span className="flex items-center gap-1 font-bold text-amber-500">
                                                    <Zap className="w-3.5 h-3.5 fill-amber-500" /> +{challenge.xpReward} XP
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5" /> {challenge.participantsCount} Peers
                                                </span>
                                            </div>

                                            {challenge.isCompleted ? (
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                                                    <div className="flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span>Completed</span>
                                                    </div>
                                                    <span className="font-bold font-mono">Score: {challenge.userScore}%</span>
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
                <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-border/40 gap-3">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Crown className="w-5 h-5 text-amber-400" />
                                Arena Challenger Rankings
                            </h2>
                            <p className="text-xs text-muted-foreground">Real-time candidate standings scored by Groq AI rubric evaluation.</p>
                        </div>

                        {userStanding && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                                <span>Your Standing: #{userStanding.rank}</span>
                                <span>•</span>
                                <span>{userStanding.xp} XP</span>
                            </div>
                        )}
                    </div>

                    {/* Top 3 Podium Cards */}
                    {leaderboard.length >= 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            {/* Silver #2 */}
                            <div className="p-4 rounded-2xl border border-slate-300/40 bg-card/80 text-center flex flex-col items-center justify-center order-2 md:order-1">
                                <div className="w-10 h-10 rounded-full bg-slate-300/20 text-slate-300 font-extrabold flex items-center justify-center text-sm mb-2">
                                    🥈
                                </div>
                                <div className="font-bold text-sm">{leaderboard[1].name}</div>
                                <div className="text-xs text-muted-foreground font-mono font-bold mt-0.5">{leaderboard[1].xp} XP</div>
                                <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted">
                                    {leaderboard[1].tier}
                                </span>
                            </div>

                            {/* Gold #1 */}
                            <div className="p-5 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-b from-amber-500/15 via-card to-card text-center flex flex-col items-center justify-center order-1 md:order-2 shadow-lg shadow-amber-500/10">
                                <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-400 font-extrabold flex items-center justify-center text-lg mb-2">
                                    👑
                                </div>
                                <div className="font-extrabold text-base">{leaderboard[0].name}</div>
                                <div className="text-sm text-amber-500 font-mono font-extrabold mt-0.5">{leaderboard[0].xp} XP</div>
                                <div className="flex items-center gap-1.5 text-xs text-orange-400 font-bold mt-2">
                                    <Flame className="w-3.5 h-3.5 fill-orange-400" /> {leaderboard[0].streak}D Streak
                                </div>
                            </div>

                            {/* Bronze #3 */}
                            <div className="p-4 rounded-2xl border border-amber-700/40 bg-card/80 text-center flex flex-col items-center justify-center order-3">
                                <div className="w-10 h-10 rounded-full bg-amber-700/20 text-amber-700 font-extrabold flex items-center justify-center text-sm mb-2">
                                    🥉
                                </div>
                                <div className="font-bold text-sm">{leaderboard[2].name}</div>
                                <div className="text-xs text-muted-foreground font-mono font-bold mt-0.5">{leaderboard[2].xp} XP</div>
                                <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted">
                                    {leaderboard[2].tier}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-border/40 text-muted-foreground uppercase">
                                <tr>
                                    <th className="py-3 px-4">Rank</th>
                                    <th className="py-3 px-4">Challenger</th>
                                    <th className="py-3 px-4">XP Rating</th>
                                    <th className="py-3 px-4">Tier</th>
                                    <th className="py-3 px-4">Streak</th>
                                    <th className="py-3 px-4">Battles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {leaderboard.map((u) => {
                                    const tierBadge = RANK_TIER_COLORS[u.tier] || RANK_TIER_COLORS.Novice;
                                    return (
                                        <tr
                                            key={u.userId}
                                            className={`transition-colors ${
                                                u.isCurrentUser
                                                    ? "bg-primary/10 font-bold hover:bg-primary/15"
                                                    : "hover:bg-muted/30"
                                            }`}
                                        >
                                            <td className="py-3.5 px-4 font-mono font-extrabold">
                                                {u.rank === 1 ? "🥇 #1" : u.rank === 2 ? "🥈 #2" : u.rank === 3 ? "🥉 #3" : `#${u.rank}`}
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
                                                    {u.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <span>{u.name}</span>
                                                {u.isCurrentUser && (
                                                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-primary text-primary-foreground font-bold">
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
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* TAB 3: ACHIEVEMENT BADGES */}
            {activeTab === "badges" && (
                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-card/60 border border-border/40 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-1">Achievement Badges & Mastery Milestones</h2>
                        <p className="text-xs text-muted-foreground">Unlock exclusive recognition badges by completing daily challenges, maintaining streaks, and scoring 95%+.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {badges.map((badge) => (
                            <Card
                                key={badge.badgeId}
                                className={`p-5 text-center flex flex-col items-center justify-between border transition-all ${
                                    badge.isUnlocked
                                        ? "bg-card/80 border-primary/40 shadow-lg shadow-primary/5"
                                        : "bg-muted/20 border-border/30 opacity-60 grayscale"
                                }`}
                            >
                                <div>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 ${
                                        badge.isUnlocked ? "bg-primary/10 border border-primary/20" : "bg-muted border border-border/40"
                                    }`}>
                                        {badge.icon}
                                    </div>
                                    <h3 className="font-bold text-sm text-foreground">{badge.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                                        {badge.description}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-border/30 w-full">
                                    {badge.isUnlocked ? (
                                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Unlocked {badge.unlockedAt ? new Date(badge.unlockedAt).toLocaleDateString() : ""}
                                        </div>
                                    ) : (
                                        <div className="text-[10px] font-semibold text-muted-foreground">
                                            🔒 Locked Milestone
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
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
