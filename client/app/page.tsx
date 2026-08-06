"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/Authcontext";

export default function Home() {
    const { isLoggedIn } = useAuth();

    return (
        <div className="min-h-screen bg-background text-foreground space-y-16 pb-20">
            {/* Hero Section */}
            <section className="pt-16 md:pt-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs font-bold tracking-wide">
                    <span>🚀</span> AI-POWERED MOCK INTERVIEW PLATFORM
                </div>

                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
                    Master Your Tech Interviews with{" "}
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Real-Time AI Feedback
                    </span>
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Practice role-specific interview questions, receive instant Groq AI evaluation, and analyze your resume to land your dream job faster.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    {isLoggedIn ? (
                        <Link href="/dashboard">
                            <Button size="lg" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-12 shadow-lg shadow-blue-500/25 cursor-pointer">
                                Go to Dashboard ⚡
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link href="/register">
                                <Button size="lg" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-12 shadow-lg shadow-blue-500/25 cursor-pointer">
                                    Get Started Free 🚀
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="outline" size="lg" className="rounded-full border-border font-semibold px-8 h-12 cursor-pointer">
                                    Sign In
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
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
                        <Card key={i} className="p-6 border border-border/60 rounded-3xl bg-card shadow-2xs hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-2xl mb-4 font-bold">
                                {feature.icon}
                            </div>
                            <h3 className="text-base font-bold text-foreground mb-2">{feature.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
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
                        <Card key={i} className="p-6 border border-border/60 rounded-3xl bg-card relative overflow-hidden">
                            <span className="text-4xl font-black text-blue-600/10 absolute top-4 right-4">
                                {step.step}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs mb-4">
                                {i + 1}
                            </div>
                            <h3 className="text-base font-bold text-foreground mb-2">{step.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Domains Section */}
            <section id="domains" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Supported Domains</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Practice questions tailored to your exact tech stack.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                        <Card key={i} className="p-4 border border-border/60 rounded-2xl text-center space-y-2 hover:border-blue-600/50 transition-all">
                            <span className="text-3xl block">{d.icon}</span>
                            <p className="text-xs font-bold text-foreground">{d.label}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* CTA Banner */}
            <section className="max-w-5xl mx-auto px-4 pt-10">
                <Card className="p-8 sm:p-12 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl space-y-4 shadow-xl">
                    <h2 className="text-2xl sm:text-4xl font-extrabold">Ready to Ace Your Next Interview?</h2>
                    <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto">
                        Join thousands of developers using AI Mock Interview to sharpen their answers and land job offers.
                    </p>
                    <div className="pt-2">
                        <Link href="/register">
                            <Button size="lg" className="rounded-full bg-white text-blue-600 hover:bg-slate-100 font-bold px-8 h-12 cursor-pointer shadow-md">
                                Create Your Free Account 🚀
                            </Button>
                        </Link>
                    </div>
                </Card>
            </section>
        </div>
    );
}
