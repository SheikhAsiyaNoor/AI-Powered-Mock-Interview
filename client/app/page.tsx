"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/Authcontext";
import PlatformReviews from "@/components/PlatformReviews";

export default function Home() {
    const { isLoggedIn } = useAuth();

    return (
        <div className="min-h-screen bg-background text-foreground space-y-16 pb-20 relative overflow-hidden">
            {/* Subtle Ambient Light */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-gradient-to-b from-indigo-500/3 to-transparent blur-3xl pointer-events-none -z-10" />

            {/* Hero Section */}
            <section className="pt-12 sm:pt-16 md:pt-24 px-4 sm:px-6 lg:px-8 xl:px-12 max-w-screen-2xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-muted/70 text-foreground/80 border border-border/80 text-[11px] sm:text-xs font-medium tracking-wide backdrop-blur-md shadow-xs max-w-full truncate">
                    <span>⚡</span> <span className="font-semibold text-foreground">IPERITUS</span> — Absolute pointers, zero blind spots
                </div>

                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground max-w-4xl mx-auto leading-tight break-words">
                    Master Your Tech Interviews with{" "}
                    <span className="crystal-gradient-text">
                        Real-Time AI Precision
                    </span>
                </h1>

                <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
                    <strong className="text-foreground font-semibold">Absolute pointers, zero blind spots.</strong> Practice role-specific interview questions, receive instant Groq AI evaluation, and analyze your resume to land your dream job faster.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-3 sm:pt-4 max-w-xs sm:max-w-none mx-auto w-full">
                    {isLoggedIn ? (
                        <Link href="/dashboard" className="w-full sm:w-auto">
                            <Button size="lg" className="btn-crystal w-full sm:w-auto rounded-full font-bold px-8 h-12 shadow-md cursor-pointer">
                                Go to Dashboard ⚡
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link href="/register" className="w-full sm:w-auto">
                                <Button size="lg" className="btn-crystal w-full sm:w-auto rounded-full font-bold px-8 h-12 shadow-md cursor-pointer">
                                    Get Started Free 🚀
                                </Button>
                            </Link>
                            <Link href="/login" className="w-full sm:w-auto">
                                <Button variant="outline" size="lg" className="glass-card w-full sm:w-auto rounded-full font-semibold px-8 h-12 cursor-pointer transition-colors">
                                    Sign In
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-8 sm:pt-10">
                <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Key Features</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Everything you need to practice, evaluate, and elevate your technical interview performance.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            icon: "🤖",
                            title: "Real-Time AI Evaluation",
                            desc: "Instant assessment of your technical accuracy, clarity, and problem-solving approach using Groq AI.",
                        },
                        {
                            icon: "📄",
                            title: "Resume Analysis & Skill Detection",
                            desc: "Upload your resume (PDF/DOCX) to extract skills, experience level, and get targeted domain suggestions.",
                        },
                        {
                            icon: "📊",
                            title: "Progress & Analytics",
                            desc: "Track score trends over time, monitor practice duration, and view past session transcripts.",
                        },
                    ].map((feature, i) => (
                        <div key={i} className="glass-card glass-card-hover p-6 rounded-3xl transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-muted/80 text-foreground border border-border/70 flex items-center justify-center text-2xl mb-4 font-bold shadow-xs">
                                {feature.icon}
                            </div>
                            <h3 className="text-base font-bold text-foreground mb-2">{feature.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Candidate Community Reviews & 5-Star Ratings */}
                <PlatformReviews />
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-8 sm:pt-10">
                <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How It Works?</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        3 simple steps to start practicing technical mock interviews.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            step: "01",
                            title: "Select Domain or Upload Resume",
                            desc: "Choose from JavaScript, React, Python, System Design, or upload your resume to get recommended domains.",
                        },
                        {
                            step: "02",
                            title: "Answer AI Interview Questions",
                            desc: "Participate in an interactive 3-question live interview session with real-time question generation.",
                        },
                        {
                            step: "03",
                            title: "Review Score & Feedback",
                            desc: "Get a comprehensive score breakdown ring, technical accuracy ratings, and actionable improvements.",
                        },
                    ].map((step, i) => (
                        <div key={i} className="glass-card glass-card-hover p-5 sm:p-6 rounded-2xl sm:rounded-3xl relative overflow-hidden">
                            <span className="text-4xl font-black text-foreground/10 absolute top-4 right-4 select-none">
                                {step.step}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-xs mb-4 shadow-xs">
                                {i + 1}
                            </div>
                            <h3 className="text-base font-bold text-foreground mb-2">{step.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Domains Section */}
            <section id="domains" className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-8 sm:pt-10">
                <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Supported Domains</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Practice questions tailored to your exact tech stack.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                    {[
                        { label: "JavaScript/Node.js", icon: "🟨" },
                        { label: "React", icon: "⚛️" },
                        { label: "Python", icon: "🐍" },
                        { label: "Data Science", icon: "📊" },
                        { label: "DevOps", icon: "⚙️" },
                        { label: "System Design", icon: "🏗️" },
                        { label: "Database Design", icon: "💾" },
                        { label: "General", icon: "🎯" },
                    ].map((d, i) => (
                        <div key={i} className="glass-card glass-card-hover p-3 sm:p-4 rounded-xl sm:rounded-2xl text-center space-y-1.5 sm:space-y-2 transition-all cursor-pointer">
                            <span className="text-2xl sm:text-3xl block">{d.icon}</span>
                            <p className="text-xs font-bold text-foreground">{d.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Banner */}
            <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-8 sm:pt-10">
                <div className="p-6 sm:p-12 text-center bg-slate-900 dark:bg-slate-900/90 text-white rounded-2xl sm:rounded-3xl space-y-4 shadow-xl relative overflow-hidden border border-slate-800 backdrop-blur-xl">
                    <h2 className="text-2xl sm:text-4xl font-extrabold relative z-10">Ready to Ace Your Next Interview?</h2>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto relative z-10">
                        Join thousands of developers using Iperitus to sharpen their answers, eliminate blind spots, and land job offers.
                    </p>
                    <div className="pt-2 relative z-10">
                        <Link href="/register" className="inline-block w-full sm:w-auto">
                            <Button size="lg" className="rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold px-8 h-12 cursor-pointer shadow-lg transition-all w-full sm:w-auto">
                                Create Your Free Account 🚀
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
