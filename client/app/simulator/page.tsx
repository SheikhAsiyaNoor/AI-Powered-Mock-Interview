"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/Authcontext";
import api from "@/lib/axios";
import {
    Building2,
    ShieldAlert,
    CheckCircle2,
    Briefcase,
    Zap,
    Target,
    Award,
    Sparkles,
    ChevronRight,
    Search,
    Sliders,
    Layers,
    X
} from "lucide-react";

interface RoundOption {
    id: string;
    label: string;
    desc: string;
}

interface CompanyProfile {
    id: string;
    name: string;
    category: string;
    logo: string;
    brandColor: string;
    hiringCutoff: number;
    difficultyLevel: string;
    tagline: string;
    description: string;
    focusAreas: string[];
    availableRounds: RoundOption[];
}

const DOMAINS = [
    { label: "JavaScript/Node.js", icon: "🟨" },
    { label: "React", icon: "⚛️" },
    { label: "Python", icon: "🐍" },
    { label: "Data Science", icon: "📊" },
    { label: "DevOps", icon: "⚙️" },
    { label: "System Design", icon: "🏗️" },
    { label: "Database Design", icon: "💾" },
    { label: "General", icon: "🎯" }
];

export default function SimulatorHubPage() {
    const router = useRouter();
    const { isLoggedIn, isLoading: authLoading } = useAuth();

    const [companies, setCompanies] = useState<CompanyProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Modal state for starting a simulation
    const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
    const [selectedDomain, setSelectedDomain] = useState<string>("JavaScript/Node.js");
    const [selectedRound, setSelectedRound] = useState<string>("");
    const [startingSession, setStartingSession] = useState(false);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push("/login");
            return;
        }

        if (isLoggedIn) {
            fetchCompanies();
        }
    }, [isLoggedIn, authLoading, router]);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const res = await api.get("/api/simulator/companies");
            if (res.data && res.data.companies) {
                setCompanies(res.data.companies);
            }
        } catch (err) {
            console.error("Failed to fetch companies:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (company: CompanyProfile) => {
        setSelectedCompany(company);
        setSelectedRound(company.availableRounds?.[0]?.label || "Technical Round");
    };

    const handleStartSimulation = async () => {
        if (!selectedCompany) return;
        try {
            setStartingSession(true);
            const res = await api.post("/api/simulator/start", {
                companyId: selectedCompany.id,
                domain: selectedDomain,
                roundType: selectedRound
            });

            if (res.data && res.data.sessionId) {
                router.push(`/simulator/${res.data.sessionId}`);
            }
        } catch (err) {
            console.error("Failed to start company simulation:", err);
            alert("Could not start company simulation. Please try again.");
        } finally {
            setStartingSession(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4 p-8">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground font-medium animate-pulse">
                    Loading AI Recruiter Simulator profiles...
                </p>
            </div>
        );
    }

    const categories = ["All", "Big Tech / FAANG", "Service IT Giants", "Startups & Unicorns", "FinTech & Banking"];

    const filteredCompanies = companies.filter((c) => {
        const matchesCategory = activeCategory === "All" || c.category === activeCategory;
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.focusAreas.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="font-sans max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* HERO BANNER */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-950 via-indigo-900 to-slate-950 text-white p-6 sm:p-10 border border-white/10 shadow-2xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 space-y-4 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30 backdrop-blur-xs">
                            <Building2 className="w-3.5 h-3.5 inline mr-1" /> Dynamic Hiring Simulator
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            ★ Real-World Hiring Standards
                        </span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                        AI Recruiter Simulator
                    </h1>
                    <p className="text-sm sm:text-base text-blue-100/80 leading-relaxed">
                        Experience hyper-realistic mock interviews tailored to top tech companies. The AI adjusts interviewer personas, question styles, difficulty calibration, and evaluation rubrics to match each organization’s hiring bar.
                    </p>
                </div>
            </div>

            {/* SEARCH & CATEGORY FILTER BAR */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                                activeCategory === cat
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search company or skill..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/70 focus:outline-blue-600"
                    />
                </div>
            </div>

            {/* COMPANIES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => (
                    <div
                        key={company.id}
                        className="bg-card border border-border/60 hover:border-blue-500/40 rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-lg transition-all space-y-5 group"
                    >
                        <div className="space-y-4">
                            {/* Top Header */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-muted/80 border border-border/50 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                                        {company.logo}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground group-hover:text-blue-600 transition-colors">
                                            {company.name}
                                        </h3>
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                            {company.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 block">
                                        {company.hiringCutoff}% Cutoff
                                    </span>
                                    <span className="text-[9px] text-muted-foreground font-semibold mt-0.5 block">
                                        {company.difficultyLevel} Tier
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                {company.tagline}
                            </p>

                            {/* Focus Pillars */}
                            <div className="space-y-1.5 pt-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Evaluation Pillars:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {company.focusAreas.slice(0, 3).map((f, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted/50 text-foreground border border-border/40"
                                        >
                                            • {f.split("(")[0].trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={() => handleOpenModal(company)}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                            <span>Simulate {company.name} Interview</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* SETUP MODAL */}
            {selectedCompany && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-card border border-border/80 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">{selectedCompany.logo}</div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">
                                        Configure {selectedCompany.name} Simulation
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Target hiring cutoff: <strong>{selectedCompany.hiringCutoff}%</strong>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCompany(null)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            {/* Round Selector */}
                            <div className="space-y-2">
                                <label className="font-bold text-foreground block">
                                    1. Select Interview Round:
                                </label>
                                <div className="space-y-2">
                                    {selectedCompany.availableRounds.map((rnd) => (
                                        <button
                                            key={rnd.id}
                                            onClick={() => setSelectedRound(rnd.label)}
                                            className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                                                selectedRound === rnd.label
                                                    ? "bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300 font-bold"
                                                    : "bg-muted/30 border-border/60 hover:bg-muted"
                                            }`}
                                        >
                                            <div className="font-bold">{rnd.label}</div>
                                            <div className="text-[11px] text-muted-foreground mt-0.5">{rnd.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Technical Domain Selector */}
                            <div className="space-y-2">
                                <label className="font-bold text-foreground block">
                                    2. Technical Domain Focus:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {DOMAINS.map((d) => (
                                        <button
                                            key={d.label}
                                            onClick={() => setSelectedDomain(d.label)}
                                            className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                                                selectedDomain === d.label
                                                    ? "bg-blue-600 text-white font-bold border-blue-600 shadow-xs"
                                                    : "bg-muted/30 border-border/60 hover:bg-muted text-foreground"
                                            }`}
                                        >
                                            <span>{d.icon}</span>
                                            <span className="text-[11px]">{d.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
                            <button
                                onClick={() => setSelectedCompany(null)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartSimulation}
                                disabled={startingSession}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {startingSession ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Calibrating AI Persona...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" />
                                        <span>Launch {selectedCompany.name} Room ⚡</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
