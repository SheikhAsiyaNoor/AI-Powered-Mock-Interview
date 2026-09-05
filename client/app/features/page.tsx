"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PlatformReviews from "@/components/PlatformReviews";
import {
    Bot,
    Swords,
    Mic,
    FileText,
    TrendingUp,
    GraduationCap,
    ArrowRight,
    Sparkles,
    CheckCircle
} from "lucide-react";

export default function FeaturesPage() {
    const featuresList = [
        {
            icon: <Bot className="w-7 h-7 text-blue-600" />,
            title: "Real-Time AI Evaluation",
            badge: "Core Engine",
            desc: "Powered by Groq ultra-low-latency AI. Delivers instant evaluation on technical precision, approach clarity, edge-case coverage, and runtime complexity.",
            highlights: [
                "Tailored question generator by tech stack",
                "Instant rubrics: Communication, Accuracy, Problem-Solving",
                "Follow-up adaptive probing questions"
            ]
        },
        {
            icon: <Swords className="w-7 h-7 text-indigo-600" />,
            title: "Peer Challenge Arena",
            badge: "Gamified",
            desc: "Compete head-to-head with fellow candidates on timed coding challenges. Climb the global leaderboard and earn badges to prove your skills.",
            highlights: [
                "Ranked Elo rating system & XP rewards",
                "Synchronized 3-day and 7-day challenge cycles",
                "Detailed algorithmic test-case validator"
            ]
        },
        {
            icon: <Mic className="w-7 h-7 text-purple-600" />,
            title: "Voice Recruiter Simulator",
            badge: "Audio AI",
            desc: "Simulate a live phone screen or behavioral interview with real-time speech interaction. Overcome interview anxiety through realistic vocal practice.",
            highlights: [
                "Full browser speech-to-text & audio feedback",
                "Pacing, filler-word detection & tone critique",
                "Realistic FAANG & startup interview personas"
            ]
        },
        {
            icon: <FileText className="w-7 h-7 text-emerald-600" />,
            title: "Resume & Skill Detection",
            badge: "Automated",
            desc: "Upload your resume in PDF or Word format. The engine extracts your core competencies, identifies knowledge gaps, and recommends practice topics.",
            highlights: [
                "Automated skill matrix parsing",
                "Targeted domain suggestions matching job goals",
                "Customized interview tracks based on your background"
            ]
        },
        {
            icon: <TrendingUp className="w-7 h-7 text-amber-600" />,
            title: "Readiness Index & Analytics",
            badge: "Insights",
            desc: "Track your readiness score over time with actionable charts. Discover whether you're ready for junior, mid, or senior engineering interviews.",
            highlights: [
                "Readiness percentage scoring formula",
                "Historical interview transcripts & score comparisons",
                "Personalized study suggestions"
            ]
        },
        {
            icon: <GraduationCap className="w-7 h-7 text-rose-600" />,
            title: "Mentor Evaluation Hub",
            badge: "Human Touch",
            desc: "Receive structured qualitative feedback and hiring recommendations ('Strong Hire', 'Hire', 'Needs Practice') from verified industry mentors.",
            highlights: [
                "Rubric-based grading on mock sessions",
                "Actionable improvement pointers",
                "Direct mentorship notes on code submissions"
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground space-y-16 pb-20">
            {/* Hero Section */}
            <section className="pt-14 md:pt-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center space-y-5">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs font-bold tracking-wide">
                    <Sparkles className="w-3.5 h-3.5" /> PLATFORM FEATURES & COMMUNITY REVIEWS
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
                    Everything You Need to Ace Your{" "}
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Technical Rounds
                    </span>
                </h1>

                <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Designed by software engineers to replicate real company interviews. Explore our full suite of AI simulators, competitive arenas, and verified candidate feedback below.
                </p>
            </section>

            {/* Features Explanation Cards */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuresList.map((feature, i) => (
                        <Card
                            key={i}
                            className="p-6 border border-border/70 rounded-3xl bg-card hover:border-blue-500/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center">
                                        {feature.icon}
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                        {feature.badge}
                                    </span>
                                </div>

                                <h3 className="text-base font-bold text-foreground mb-2">{feature.title}</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{feature.desc}</p>

                                <div className="space-y-2 pt-2 border-t border-border/40">
                                    {feature.highlights.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-xs text-foreground/80">
                                            <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Community Reviews & 5-Star Ratings (Shown directly after explanation of features) */}
            <PlatformReviews />

            {/* Bottom CTA Banner */}
            <section className="max-w-5xl mx-auto px-4 pt-4">
                <Card className="p-8 sm:p-12 text-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl space-y-4 shadow-xl">
                    <h2 className="text-2xl sm:text-4xl font-extrabold">Ready to Start Practicing?</h2>
                    <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto">
                        Create your free candidate account to access AI mock interviews, competitive peer arena challenges, and leave your own verified review.
                    </p>
                    <div className="pt-3 flex flex-wrap justify-center gap-3">
                        <Link href="/register">
                            <Button size="lg" className="rounded-full bg-white text-blue-600 hover:bg-slate-100 font-bold px-8 h-12 cursor-pointer shadow-md">
                                Get Started Free 🚀
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button size="lg" variant="outline" className="rounded-full border-white/40 text-white hover:bg-white/10 font-bold px-8 h-12 cursor-pointer">
                                Candidate Login →
                            </Button>
                        </Link>
                    </div>
                </Card>
            </section>
        </div>
    );
}
