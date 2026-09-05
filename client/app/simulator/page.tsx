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

const DEFAULT_COMPANIES: CompanyProfile[] = [
    {
        id: "google",
        name: "Google",
        category: "Big Tech / FAANG",
        logo: "🌐",
        brandColor: "#4285F4",
        hiringCutoff: 85,
        difficultyLevel: "Hard",
        tagline: "Algorithmic depth, scalable systems & Googliness",
        description: "Google's interview process tests deep algorithmic problem solving, time/space complexity optimization, scalable system architectures, and cultural alignment ('Googliness').",
        focusAreas: [
            "Data Structures & Algorithms (O(N) time/space optimization)",
            "Distributed Systems & Scalability",
            "Concurrency & Multi-threading",
            "Googliness (Intellectual humility, collaboration, ambiguity handling)"
        ],
        availableRounds: [
            { id: "technical", label: "Algorithmic & Coding Round", desc: "Rigorous algorithmic problem solving and complexity analysis" },
            { id: "system_design", label: "Large-Scale System Design", desc: "Designing distributed, fault-tolerant infrastructure" },
            { id: "googliness", label: "Googliness & Leadership", desc: "Behavioral questions testing teamwork, ethics, and innovation" }
        ]
    },
    {
        id: "amazon",
        name: "Amazon",
        category: "Big Tech / FAANG",
        logo: "📦",
        brandColor: "#FF9900",
        hiringCutoff: 82,
        difficultyLevel: "Hard",
        tagline: "16 Leadership Principles, high-scale services & customer obsession",
        description: "Amazon's interviews blend technical execution with the 16 Leadership Principles. Every answer is evaluated on customer impact, ownership, and deliverable results.",
        focusAreas: [
            "16 Leadership Principles (Customer Obsession, Ownership, Bias for Action, Dive Deep, Deliver Results)",
            "Object-Oriented Design & Microservices",
            "High-Availability Cloud Architectures (AWS principles)",
            "STAR Method Structured Responses"
        ],
        availableRounds: [
            { id: "technical", label: "Technical Problem Solving & OOD", desc: "Data structures, clean code, and object-oriented design" },
            { id: "system_design", label: "Cloud & Microservices Architecture", desc: "Designing decoupled, scalable cloud systems" },
            { id: "bar_raiser", label: "Bar Raiser / Leadership Principles", desc: "Deep dive into behavioral situations evaluating Amazon Leadership Principles" }
        ]
    },
    {
        id: "microsoft",
        name: "Microsoft",
        category: "Big Tech / FAANG",
        logo: "🪟",
        brandColor: "#00A4EF",
        hiringCutoff: 80,
        difficultyLevel: "Medium-Hard",
        tagline: "Clean engineering, modular design & collaborative problem solving",
        description: "Microsoft focuses on clean, maintainable software engineering, robust object-oriented architecture, edge case verification, and clear collaborative communication.",
        focusAreas: [
            "Clean Code & Object-Oriented Principles (SOLID, Design Patterns)",
            "Data Structures, Trees, Graphs & Recursion",
            "System Architecture & API Design",
            "Growth Mindset & Team Collaboration"
        ],
        availableRounds: [
            { id: "technical", label: "Core Coding & Data Structures", desc: "Clean coding, recursion, trees, and dynamic programming" },
            { id: "system_design", label: "Enterprise Software Architecture", desc: "Modular architecture, API contracts, and database schema design" },
            { id: "culture", label: "Growth Mindset & Culture", desc: "Learning from failures, cross-functional collaboration, and technical leadership" }
        ]
    },
    {
        id: "tcs",
        name: "TCS",
        category: "Service IT Giants",
        logo: "🏢",
        brandColor: "#0078D7",
        hiringCutoff: 65,
        difficultyLevel: "Medium",
        tagline: "Core CS fundamentals, SQL depth & technical aptitude",
        description: "Tata Consultancy Services (TCS) tests candidates on strong core computer science fundamentals, OOP concepts, SQL queries, database indexing, and professional communication.",
        focusAreas: [
            "Core CS Fundamentals (OOP, DBMS, Operating Systems, Computer Networks)",
            "SQL Queries, Joins, Indexing & Normalization",
            "Basic Coding (Arrays, Strings, Searching & Sorting)",
            "Professional Communication & Project Walkthrough"
        ],
        availableRounds: [
            { id: "technical", label: "Technical Round (Core CS & SQL)", desc: "OOP, DBMS concepts, SQL queries, and basic coding" },
            { id: "managerial", label: "Managerial & Project Round", desc: "Discussion on college/internship projects and technical problem solving" },
            { id: "hr", label: "HR & Communication Round", desc: "Adaptability, willingness to relocate, and corporate etiquette" }
        ]
    },
    {
        id: "infosys",
        name: "Infosys",
        category: "Service IT Giants",
        logo: "🔷",
        brandColor: "#007CC3",
        hiringCutoff: 65,
        difficultyLevel: "Medium",
        tagline: "Programming logic, database queries & corporate communication",
        description: "Infosys evaluates foundational programming logic, problem decomposition, database manipulation, and scenario-based communication.",
        focusAreas: [
            "Programming Logic & Syntax (Java, Python, C++, or JavaScript)",
            "Database Design & Complex SQL Queries",
            "SDLC, Agile Methodology & Quality Assurance",
            "Communication & Problem Decomposition"
        ],
        availableRounds: [
            { id: "technical", label: "Technical Programming & Database", desc: "Code logic, SQL queries, and data structures" },
            { id: "hr_managerial", label: "HR & Managerial Discussion", desc: "Communication skills, teamwork scenarios, and career goals" }
        ]
    },
    {
        id: "startup",
        name: "High-Growth Startup (e.g. Razorpay / Zepto)",
        category: "Startups & Unicorns",
        logo: "🚀",
        brandColor: "#10B981",
        hiringCutoff: 75,
        difficultyLevel: "Medium-Hard",
        tagline: "Pragmatic problem solving, full-stack agility & rapid execution",
        description: "Fast-paced startups evaluate real-world product building skills, API design, rapid debugging, tech stack mastery, and ability to thrive in ambiguity.",
        focusAreas: [
            "Practical Full-Stack Problem Solving & Live Debugging",
            "REST / GraphQL API Design & Schema Validation",
            "Database Query Optimization & Caching (Redis)",
            "Execution Speed, Product Intuition & Agility"
        ],
        availableRounds: [
            { id: "machine_coding", label: "Practical Machine Coding & APIs", desc: "Hands-on feature implementation, schema design, and error handling" },
            { id: "system_design", label: "Pragmatic Architecture & Caching", desc: "Designing fast, responsive services with Redis and message queues" },
            { id: "founder_culture", label: "Founder / Culture Round", desc: "Ownership, speed vs quality trade-offs, and product intuition" }
        ]
    },
    {
        id: "goldman_sachs",
        name: "Goldman Sachs",
        category: "FinTech & Banking",
        logo: "🏦",
        brandColor: "#7096D1",
        hiringCutoff: 82,
        difficultyLevel: "Hard",
        tagline: "Low-latency systems, mathematical rigor & transactional integrity",
        description: "Goldman Sachs interviews demand strong mathematical reasoning, robust data structures, multithreading, ACID transactional integrity, and low-latency considerations.",
        focusAreas: [
            "Advanced Data Structures & Dynamic Programming",
            "Multithreading, Concurrency & Thread Safety",
            "Database Transactions, ACID Guarantees & Consistency",
            "Mathematical Problem Solving & Probability"
        ],
        availableRounds: [
            { id: "technical", label: "Advanced Algorithms & Concurrency", desc: "Dynamic programming, graph algorithms, and multithreading" },
            { id: "systems_data", label: "Low-Latency & Financial Systems", desc: "Transaction atomicity, low-latency queues, and data consistency" },
            { id: "behavioral", label: "Professional Judgment & Risk Awareness", desc: "Ethical decision-making, handling high-stakes systems, and risk management" }
        ]
    }
];

export default function SimulatorHubPage() {
    const router = useRouter();
    const { isLoggedIn, isLoading: authLoading } = useAuth();

    const [companies, setCompanies] = useState<CompanyProfile[]>(DEFAULT_COMPANIES);
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Modal state for starting a simulation
    const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
    const [selectedDomain, setSelectedDomain] = useState<string>("JavaScript/Node.js");
    const [selectedRound, setSelectedRound] = useState<string>("");
    const [startingSession, setStartingSession] = useState(false);

    const [error, setError] = useState<string | null>(null);

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
            setError(null);
            const res = await api.get("/api/simulator/companies");
            if (res.data && res.data.companies) {
                setCompanies(res.data.companies);
            }
        } catch (err: any) {
            console.error("Failed to fetch companies:", err);
            setError(err?.response?.data?.message || err.message || "Failed to load company profiles from server.");
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
                return;
            }
            throw new Error("No session ID returned from backend.");
        } catch (err: any) {
            console.error("Failed to start company simulation:", err);
            const errMsg = err?.response?.data?.message || err.message || "Failed to connect to backend simulation server.";
            alert(`Error starting simulation: ${errMsg}`);
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
        <div className="font-sans max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 space-y-8">
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
