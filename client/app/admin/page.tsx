"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/Authcontext";
import RoleGuard from "@/components/RoleGuard";
import axiosInstance from "@/lib/axios";
import {
    Shield,
    Users,
    Activity,
    Lock,
    Unlock,
    Trash2,
    Settings,
    Sparkles,
    Swords,
    FileText,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Search,
    UserCheck,
    Cpu,
    PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: "student" | "mentor" | "admin";
    isEmailVerified: boolean;
    isLocked: boolean;
    lockUntil?: string;
    failedLoginAttempts: number;
    activeSessionsCount: number;
    alertsCount: number;
    createdAt: string;
}

export default function AdminControlCenter() {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<"overview" | "users" | "challenges" | "security">("overview");
    const [analytics, setAnalytics] = useState<any>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [systemSettings, setSystemSettings] = useState({
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 15,
        maxConcurrentSessions: 5,
        allowRegistration: true
    });
    const [isLoading, setIsLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState("");

    // AI Challenge Gen Form
    const [genForm, setGenForm] = useState({
        category: "Technical",
        type: "daily",
        difficulty: "Medium",
        domain: "Backend Systems"
    });
    const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);

    const loadAdminData = async () => {
        setIsLoading(true);
        try {
            const [anaRes, usersRes, logsRes, setRes] = await Promise.all([
                axiosInstance.get("/api/admin/analytics"),
                axiosInstance.get(`/api/admin/users?role=${roleFilter}&search=${encodeURIComponent(userSearch)}`),
                axiosInstance.get("/api/admin/audit-logs"),
                axiosInstance.get("/api/admin/settings")
            ]);

            setAnalytics(anaRes.data.analytics || {});
            setUsers(usersRes.data.users || []);
            setAuditLogs(logsRes.data.logs || []);
            if (setRes.data.settings) setSystemSettings(setRes.data.settings);
        } catch (err: any) {
            console.error("Error loading admin data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAdminData();
    }, [roleFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loadAdminData();
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await axiosInstance.patch(`/api/admin/users/${userId}/role`, { role: newRole });
            setActionMsg(`User role updated to ${newRole}.`);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
            setTimeout(() => setActionMsg(""), 3000);
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to update user role.");
        }
    };

    const handleUnlockUser = async (userId: string) => {
        try {
            await axiosInstance.post(`/api/admin/users/${userId}/unlock`);
            setActionMsg("User account unlocked successfully.");
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isLocked: false, lockUntil: undefined } : u));
            setTimeout(() => setActionMsg(""), 3000);
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to unlock account.");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to permanently delete this user and all their records?")) return;
        try {
            await axiosInstance.delete(`/api/admin/users/${userId}`);
            setActionMsg("User permanently deleted.");
            setUsers(prev => prev.filter(u => u.id !== userId));
            setTimeout(() => setActionMsg(""), 3000);
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to delete user.");
        }
    };

    const handleGenerateChallenge = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGeneratingChallenge(true);
        try {
            const { data } = await axiosInstance.post("/api/arena/admin/generate", genForm);
            setActionMsg(`AI Challenge created: "${data.challenge?.title}"`);
            setTimeout(() => setActionMsg(""), 4000);
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to generate AI challenge.");
        } finally {
            setIsGeneratingChallenge(false);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axiosInstance.put("/api/admin/settings", systemSettings);
            setActionMsg("Platform security and session policy settings saved.");
            setTimeout(() => setActionMsg(""), 3000);
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to save settings.");
        }
    };

    return (
        <RoleGuard allowedRoles={["admin"]}>
            <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-8 border-b border-border/40 gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
                            <Shield className="w-3.5 h-3.5" />
                            Master Administration Console
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Platform RBAC & Security Management
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Control user roles, unlock accounts, monitor platform performance metrics, generate AI challenges, and enforce security policies.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadAdminData}
                        disabled={isLoading}
                        className="rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Sync Telemetry
                    </Button>
                </div>

                {/* Action Notice */}
                {actionMsg && (
                    <div className="mb-6 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center justify-between">
                        <span>{actionMsg}</span>
                        <button onClick={() => setActionMsg("")} className="text-purple-500 font-bold">✕</button>
                    </div>
                )}

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
                        <div className="flex items-center justify-between text-muted-foreground mb-1">
                            <span className="text-xs font-semibold">Total Users</span>
                            <Users className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-extrabold text-foreground">{analytics?.totalUsers || 0}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                            {analytics?.roleDistribution?.student || 0} Students • {analytics?.roleDistribution?.mentor || 0} Mentors • {analytics?.roleDistribution?.admin || 0} Admins
                        </div>
                    </Card>

                    <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
                        <div className="flex items-center justify-between text-muted-foreground mb-1">
                            <span className="text-xs font-semibold">Interviews Completed</span>
                            <FileText className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="text-2xl font-extrabold text-foreground">{analytics?.totalInterviews || 0}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                            Avg Score: {analytics?.avgInterviewScore || 0}%
                        </div>
                    </Card>

                    <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
                        <div className="flex items-center justify-between text-muted-foreground mb-1">
                            <span className="text-xs font-semibold">Arena Battles</span>
                            <Swords className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-extrabold text-foreground">{analytics?.totalSubmissions || 0}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                            {analytics?.totalChallenges || 0} Active Challenges
                        </div>
                    </Card>

                    <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm">
                        <div className="flex items-center justify-between text-muted-foreground mb-1">
                            <span className="text-xs font-semibold">Active Sessions</span>
                            <Activity className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-extrabold text-foreground">{analytics?.totalActiveSessions || 0}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                            {analytics?.lockedUsers || 0} Locked • {analytics?.unresolvedAlerts || 0} Open Alerts
                        </div>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-border/40 pb-3 mb-6 overflow-x-auto">
                    {[
                        { id: "overview", label: "Overview & Analytics", icon: Activity },
                        { id: "users", label: "User & RBAC Manager", icon: Users, count: users.length },
                        { id: "challenges", label: "AI Challenge Generator", icon: Cpu },
                        { id: "security", label: "Security & Policy Settings", icon: Settings },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                                {tab.count !== undefined && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-muted text-muted-foreground">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* TAB 1: OVERVIEW & ANALYTICS */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl space-y-4">
                            <h2 className="text-lg font-bold">Role Distribution</h2>
                            <div className="space-y-3">
                                {[
                                    { role: "Students", count: analytics?.roleDistribution?.student || 0, color: "bg-blue-500" },
                                    { role: "Mentors", count: analytics?.roleDistribution?.mentor || 0, color: "bg-emerald-500" },
                                    { role: "Administrators", count: analytics?.roleDistribution?.admin || 0, color: "bg-purple-500" }
                                ].map((r) => {
                                    const total = analytics?.totalUsers || 1;
                                    const pct = Math.round((r.count / total) * 100);
                                    return (
                                        <div key={r.role} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs font-semibold">
                                                <span>{r.role}</span>
                                                <span className="font-mono text-muted-foreground">{r.count} ({pct}%)</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div className={`h-full ${r.color}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl space-y-4">
                            <h2 className="text-lg font-bold">Platform Health & Security Summary</h2>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40">
                                    <div className="text-muted-foreground">Locked Accounts</div>
                                    <div className="text-lg font-bold text-rose-500">{analytics?.lockedUsers || 0}</div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40">
                                    <div className="text-muted-foreground">Unresolved Alerts</div>
                                    <div className="text-lg font-bold text-amber-500">{analytics?.unresolvedAlerts || 0}</div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40">
                                    <div className="text-muted-foreground">Mentor Reviews Given</div>
                                    <div className="text-lg font-bold text-emerald-500">{analytics?.totalReviews || 0}</div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/40">
                                    <div className="text-muted-foreground">Avg Interview Rating</div>
                                    <div className="text-lg font-bold text-primary font-mono">{analytics?.avgInterviewScore || 0}%</div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* TAB 2: USER & RBAC MANAGER */}
                {activeTab === "users" && (
                    <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl space-y-6">
                        {/* Filters and Search */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
                                <Input
                                    placeholder="Search by name or email..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    className="h-9 rounded-xl text-xs bg-muted/40"
                                />
                                <Button type="submit" size="sm" variant="outline" className="rounded-xl text-xs shrink-0">
                                    <Search className="w-3.5 h-3.5" />
                                </Button>
                            </form>

                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground font-semibold">Filter Role:</span>
                                {["All", "student", "mentor", "admin"].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setRoleFilter(r)}
                                        className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize cursor-pointer ${
                                            roleFilter === r
                                                ? "bg-primary text-primary-foreground font-bold"
                                                : "text-muted-foreground hover:bg-muted"
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border/40 text-muted-foreground uppercase">
                                    <tr>
                                        <th className="py-3 px-3">User</th>
                                        <th className="py-3 px-3">Email Status</th>
                                        <th className="py-3 px-3">Assigned Role (RBAC)</th>
                                        <th className="py-3 px-3">Account Security</th>
                                        <th className="py-3 px-3">Active Sessions</th>
                                        <th className="py-3 px-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="py-3.5 px-3">
                                                <div className="font-bold text-foreground">{u.name}</div>
                                                <div className="text-[11px] font-mono text-muted-foreground">{u.email}</div>
                                            </td>
                                            <td className="py-3.5 px-3">
                                                {u.isEmailVerified ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">Pending</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-3">
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    className="h-8 rounded-lg bg-background border border-border/60 px-2 text-xs font-semibold"
                                                >
                                                    <option value="student">Student</option>
                                                    <option value="mentor">Mentor</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="py-3.5 px-3">
                                                {u.isLocked ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                                                        🔒 Locked (5 fails)
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-[11px]">
                                                        Active ({u.failedLoginAttempts} fails)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-3 font-mono text-muted-foreground">
                                                {u.activeSessionsCount} Devices
                                            </td>
                                            <td className="py-3.5 px-3 text-right space-x-2">
                                                {u.isLocked && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleUnlockUser(u.id)}
                                                        className="h-8 rounded-xl text-xs font-semibold text-emerald-600 border-emerald-300 hover:bg-emerald-50 cursor-pointer"
                                                    >
                                                        <Unlock className="w-3.5 h-3.5 mr-1" /> Unlock
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="h-8 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* TAB 3: AI CHALLENGE GENERATOR */}
                {activeTab === "challenges" && (
                    <Card className="p-6 max-w-2xl border-border/40 bg-card/60 backdrop-blur-sm shadow-xl space-y-6">
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-blue-500" />
                                Groq AI Challenge Generator
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                Instantly generate and publish structured daily or weekly challenges with AI evaluation rubrics.
                            </p>
                        </div>

                        <form onSubmit={handleGenerateChallenge} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-foreground mb-1">Category:</label>
                                    <select
                                        value={genForm.category}
                                        onChange={(e) => setGenForm(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-xs"
                                    >
                                        <option value="Technical">💻 Technical</option>
                                        <option value="HR">💬 HR & Behavioral (STAR)</option>
                                        <option value="Aptitude">🧠 Aptitude & Logic</option>
                                        <option value="Domain-Specific">🏗️ Domain-Specific</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold text-foreground mb-1">Tournament Type:</label>
                                    <select
                                        value={genForm.type}
                                        onChange={(e) => setGenForm(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-xs"
                                    >
                                        <option value="daily">Daily Challenge (15 Mins)</option>
                                        <option value="weekly">Weekly Tournament (25 Mins)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-foreground mb-1">Difficulty:</label>
                                    <select
                                        value={genForm.difficulty}
                                        onChange={(e) => setGenForm(prev => ({ ...prev, difficulty: e.target.value }))}
                                        className="w-full h-10 rounded-xl bg-background border border-border/60 px-3 text-xs"
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold text-foreground mb-1">Domain / Topic:</label>
                                    <Input
                                        value={genForm.domain}
                                        onChange={(e) => setGenForm(prev => ({ ...prev, domain: e.target.value }))}
                                        placeholder="e.g. Distributed Caching, STAR Leadership..."
                                        className="h-10 rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isGeneratingChallenge}
                                className="w-full h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
                            >
                                {isGeneratingChallenge ? (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                        Generating Questions with Groq AI...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="w-4 h-4 mr-2" />
                                        Publish Live Arena Challenge
                                    </>
                                )}
                            </Button>
                        </form>
                    </Card>
                )}

                {/* TAB 4: SECURITY AUDIT & SETTINGS */}
                {activeTab === "security" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Policy Settings */}
                        <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl space-y-4">
                            <h2 className="text-lg font-bold">Platform Security Policies</h2>
                            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                                <div>
                                    <label className="block font-semibold text-foreground mb-1">
                                        Max Consecutive Failed Attempts before Lockout:
                                    </label>
                                    <Input
                                        type="number"
                                        min="3"
                                        max="10"
                                        value={systemSettings.maxFailedAttempts}
                                        onChange={(e) => setSystemSettings(prev => ({ ...prev, maxFailedAttempts: Number(e.target.value) }))}
                                        className="h-10 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-foreground mb-1">
                                        Account Lockout Duration (Minutes):
                                    </label>
                                    <Input
                                        type="number"
                                        min="5"
                                        max="120"
                                        value={systemSettings.lockoutDurationMinutes}
                                        onChange={(e) => setSystemSettings(prev => ({ ...prev, lockoutDurationMinutes: Number(e.target.value) }))}
                                        className="h-10 rounded-xl"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold text-foreground mb-1">
                                        Max Active Concurrent Device Sessions:
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={systemSettings.maxConcurrentSessions}
                                        onChange={(e) => setSystemSettings(prev => ({ ...prev, maxConcurrentSessions: Number(e.target.value) }))}
                                        className="h-10 rounded-xl"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md cursor-pointer"
                                >
                                    Save Platform Policy
                                </Button>
                            </form>
                        </Card>

                        {/* Audit Logs */}
                        <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl space-y-4 max-h-[500px] overflow-y-auto">
                            <h2 className="text-lg font-bold">Security Audit Trail</h2>
                            <div className="space-y-2 text-xs">
                                {auditLogs.map((log, idx) => (
                                    <div key={idx} className="p-3 rounded-xl bg-muted/30 border border-border/40 flex items-start justify-between gap-3">
                                        <div>
                                            <div className="font-bold text-foreground">{log.user?.name} ({log.user?.email})</div>
                                            <div className="text-muted-foreground">{log.reason || "Authentication Event"} • IP: {log.ip}</div>
                                            <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{new Date(log.timestamp).toLocaleString()}</div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            log.status === "SUCCESS" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                        }`}>
                                            {log.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </RoleGuard>
    );
}
