"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/Authcontext";
import {
  Swords,
  Trophy,
  Users,
  Timer,
  Zap,
  Flame,
  Shield,
  Search,
  ArrowRight,
  Sparkles,
  Bot,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const ARENA_MODES = [
  {
    id: "speed-dsa",
    title: "DSA Speed Duel",
    desc: "15-minute rapid algorithmic problem solving with real-time AI code review & complexity analysis.",
    tag: "Competitive",
    icon: Zap,
    difficulty: "Medium - Hard",
    players: "1v1 Battle",
    color: "from-amber-500/20 to-orange-500/20",
    badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  {
    id: "system-design",
    title: "System Design Clash",
    desc: "Design scalable architectures under strict constraints with real-time AI architectural critique.",
    tag: "Senior Level",
    icon: Shield,
    difficulty: "Hard",
    players: "1v1 Head-to-Head",
    color: "from-blue-500/20 to-cyan-500/20",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    id: "behavioral-blitz",
    title: "STAR Behavioral Duel",
    desc: "Speech pacing, clarity, confidence, and STAR method precision scored instantly by AI.",
    tag: "All Roles",
    icon: Flame,
    difficulty: "All Levels",
    players: "Turn-Based",
    color: "from-purple-500/20 to-pink-500/20",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
];

const LEADERBOARD = [
  { rank: 1, name: "Alex Chen", rating: 2480, wins: 42, streak: 8, badge: "Grandmaster" },
  { rank: 2, name: "Priya Sharma", rating: 2390, wins: 38, streak: 5, badge: "Master" },
  { rank: 3, name: "David Kim", rating: 2310, wins: 35, streak: 3, badge: "Master" },
  { rank: 4, name: "Sarah Jenkins", rating: 2190, wins: 29, streak: 4, badge: "Diamond" },
  { rank: 5, name: "Mohammad Al-Sayed", rating: 2120, wins: 27, streak: 2, badge: "Diamond" },
];

export default function ArenaPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [roomCode, setRoomCode] = useState("");
  const [activeTab, setActiveTab] = useState<"modes" | "leaderboard">("modes");
  const [isFindingMatch, setIsFindingMatch] = useState(false);

  const handleQuickMatch = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setIsFindingMatch(true);
    setTimeout(() => {
      setIsFindingMatch(false);
      router.push("/simulator");
    }, 2000);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    router.push(`/simulator?room=${encodeURIComponent(roomCode.trim())}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 sm:p-12 mb-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <Swords className="w-3.5 h-3.5" />
            Peer Challenge Arena
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Compete, Practice & Rank in{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
              Live Mock Battles
            </span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mb-8 leading-relaxed">
            Go head-to-head with peers or battle adaptive AI interviewers. Test your speed, communication, and technical depth with real-time comparative scoring.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-lg shadow-primary/25 cursor-pointer"
              onClick={handleQuickMatch}
              disabled={isFindingMatch}
            >
              {isFindingMatch ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Finding Opponent...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Match (AI / Peer)
                </>
              )}
            </Button>

            <form onSubmit={handleJoinRoom} className="flex items-center gap-2">
              <Input
                placeholder="Enter Room Code..."
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="max-w-[200px] bg-background/80 border-border/60"
              />
              <Button type="submit" variant="outline" className="cursor-pointer">
                Join Room
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-border/40 pb-4 mb-8">
        <button
          onClick={() => setActiveTab("modes")}
          className={`text-sm font-semibold flex items-center gap-2 pb-2 transition-colors relative cursor-pointer ${
            activeTab === "modes"
              ? "text-primary border-b-2 border-primary -mb-4.5"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Swords className="w-4 h-4" />
          Battle Modes
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`text-sm font-semibold flex items-center gap-2 pb-2 transition-colors relative cursor-pointer ${
            activeTab === "leaderboard"
              ? "text-primary border-b-2 border-primary -mb-4.5"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Global Leaderboard
        </button>
      </div>

      {/* Battle Modes */}
      {activeTab === "modes" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ARENA_MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <Card
                key={mode.id}
                className="p-6 relative flex flex-col justify-between border-border/40 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-xl transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${mode.badgeColor}`}>
                      {mode.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {mode.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {mode.desc}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/30 pt-4 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5" /> {mode.difficulty}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> {mode.players}
                    </span>
                  </div>
                  <Button
                    onClick={handleQuickMatch}
                    className="w-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
                  >
                    Enter Arena
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Leaderboard */}
      {activeTab === "leaderboard" && (
        <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                Top Arena Challengers
              </h2>
              <p className="text-xs text-muted-foreground">Rankings updated every hour based on ELO score</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/30">
              <Bot className="w-3.5 h-3.5 text-primary" />
              Verified by AI Arbitrator
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/40 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Challenger</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Wins</th>
                  <th className="py-3 px-4">Win Streak</th>
                  <th className="py-3 px-4">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {LEADERBOARD.map((user) => (
                  <tr key={user.rank} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4 font-bold">
                      {user.rank === 1 ? "🥇 #1" : user.rank === 2 ? "🥈 #2" : user.rank === 3 ? "🥉 #3" : `#${user.rank}`}
                    </td>
                    <td className="py-4 px-4 font-semibold text-foreground flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      {user.name}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-primary">{user.rating}</td>
                    <td className="py-4 px-4 text-muted-foreground">{user.wins}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-orange-400 font-semibold text-xs">
                        <Flame className="w-3.5 h-3.5 fill-orange-400" /> {user.streak}W
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {user.badge}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
