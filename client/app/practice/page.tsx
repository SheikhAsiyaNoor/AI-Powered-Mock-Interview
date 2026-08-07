"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/Authcontext";

const INTERVIEW_DOMAINS = [
    { label: "JavaScript/Node.js", icon: "🟨", desc: "ES6+, async/await, closures, event loop, Node runtime", count: "25+ Questions" },
    { label: "React", icon: "⚛️", desc: "Hooks, state management, virtual DOM, component lifecycle", count: "20+ Questions" },
    { label: "Python", icon: "🐍", desc: "OOP, data structures, generators, decorators, standard library", count: "30+ Questions" },
    { label: "Data Science", icon: "📊", desc: "ML algorithms, pandas, NumPy, statistics, data preprocessing", count: "18+ Questions" },
    { label: "DevOps", icon: "⚙️", desc: "CI/CD pipelines, Docker containers, Kubernetes, cloud deployment", count: "15+ Questions" },
    { label: "System Design", icon: "🏗️", desc: "Scalability, microservices, load balancing, caching, API design", count: "12+ Questions" },
    { label: "Database Design", icon: "💾", desc: "SQL queries, NoSQL modeling, indexing, transactions, ACID", count: "22+ Questions" },
    { label: "General", icon: "🎯", desc: "Behavioral questions, problem solving, communication skills", count: "40+ Questions" },
];

export default function PracticePage() {
    const router = useRouter();
    const { isLoggedIn, isLoading: authLoading } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push("/login");
        }
    }, [isLoggedIn, authLoading, router]);

    if (authLoading) {
        return <div className="min-h-[60vh] flex items-center justify-center text-xs text-muted-foreground font-medium">Loading practice domains...</div>;
    }

    if (!isLoggedIn) return null;

    const filteredDomains = INTERVIEW_DOMAINS.filter(
        (d) =>
            d.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleStartDomain = (domainLabel: string) => {
        router.push(`/interview?domain=${encodeURIComponent(domainLabel)}`);
    };

    return (
        <div className="font-average-sans max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header Banner */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    ⚡ Practice Mode
                </span>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    Select an Interview Domain
                </h1>
                <p className="text-sm text-muted-foreground">
                    Choose from specialized technical domains to test your knowledge with real-time AI feedback.
                </p>

                {/* Search Bar */}
                <div className="pt-2">
                    <Input
                        type="text"
                        placeholder="Search domains (e.g. React, Python, System Design)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 rounded-2xl border-border bg-card text-sm px-4 focus-visible:ring-blue-500"
                    />
                </div>
            </div>

            {/* Domains Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredDomains.map((domain, index) => (
                    <Card
                        key={index}
                        className="p-5 border border-border/60 rounded-3xl bg-card hover:border-blue-600/50 hover:shadow-lg transition-all flex flex-col justify-between group"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-600 flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform">
                                    {domain.icon}
                                </div>
                                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                    {domain.count}
                                </span>
                            </div>
                            <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-blue-600 transition-colors">
                                {domain.label}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {domain.desc}
                            </p>
                        </div>

                        <div className="pt-5">
                            <Button
                                onClick={() => handleStartDomain(domain.label)}
                                className="w-full h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                Start Interview ⚡
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredDomains.length === 0 && (
                <div className="text-center py-12 space-y-2">
                    <p className="text-2xl">🔍</p>
                    <p className="text-sm font-semibold text-foreground">No domains found matching "{searchQuery}"</p>
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="rounded-full text-xs">
                        Clear Search
                    </Button>
                </div>
            )}
        </div>
    );
}
