"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/Authcontext";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
    Shield,
    Lock,
    Smartphone,
    Laptop,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Key,
    ShieldAlert,
    RefreshCw,
    Activity,
    LogOut,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ActiveSession {
    sessionId: string;
    device: string;
    ip: string;
    location: string;
    createdAt: string;
    lastActive: string;
    isCurrent: boolean;
}

interface LoginEvent {
    timestamp: string;
    ip: string;
    device: string;
    status: "SUCCESS" | "FAILED" | "LOCKED" | "BLOCKED";
    reason: string;
    suspicious: boolean;
}

interface SecurityAlert {
    alertId: string;
    type: string;
    message: string;
    timestamp: string;
    severity: "low" | "medium" | "high";
    resolved: boolean;
}

export default function SecuritySettingsPage() {
    const { user, isLoggedIn, isLoading } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"sessions" | "history" | "password" | "alerts">("sessions");
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [history, setHistory] = useState<LoginEvent[]>([]);
    const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
    const [isFetching, setIsFetching] = useState(true);

    // Password Change State
    const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdMsg, setPwdMsg] = useState({ text: "", isError: false });

    // Session Revoke State
    const [actionMsg, setActionMsg] = useState("");

    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            router.push("/login");
        }
    }, [isLoading, isLoggedIn, router]);

    const loadSecurityData = async () => {
        setIsFetching(true);
        try {
            const [sessRes, histRes, alertRes] = await Promise.all([
                axiosInstance.get("/api/auth/sessions"),
                axiosInstance.get("/api/auth/login-history"),
                axiosInstance.get("/api/auth/security-alerts")
            ]);
            setSessions(sessRes.data.sessions || []);
            setHistory(histRes.data.loginHistory || []);
            setAlerts(alertRes.data.securityAlerts || []);
        } catch (err: any) {
            console.error("Error loading security data:", err);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            loadSecurityData();
        }
    }, [isLoggedIn]);

    const handleRevokeSession = async (sessionId: string) => {
        try {
            await axiosInstance.delete(`/api/auth/sessions/${sessionId}`);
            setActionMsg("Session revoked successfully.");
            setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
            setTimeout(() => setActionMsg(""), 3000);
        } catch (err: any) {
            setActionMsg(err?.response?.data?.message || "Failed to revoke session.");
        }
    };

    const handleRevokeOtherSessions = async () => {
        try {
            await axiosInstance.post("/api/auth/sessions/revoke-others");
            setActionMsg("All other active sessions have been terminated.");
            setSessions(prev => prev.filter(s => s.isCurrent));
            setTimeout(() => setActionMsg(""), 3000);
        } catch (err: any) {
            setActionMsg(err?.response?.data?.message || "Failed to revoke other sessions.");
        }
    };

    const handleResolveAlert = async (alertId: string) => {
        try {
            await axiosInstance.patch(`/api/auth/security-alerts/${alertId}/resolve`);
            setAlerts(prev => prev.map(a => a.alertId === alertId ? { ...a, resolved: true } : a));
        } catch (err: any) {
            console.error("Failed to resolve alert:", err);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwdMsg({ text: "", isError: false });

        if (pwdForm.newPassword !== pwdForm.confirmPassword) {
            setPwdMsg({ text: "New passwords do not match.", isError: true });
            return;
        }

        if (pwdForm.newPassword.length < 8) {
            setPwdMsg({ text: "New password must be at least 8 characters long.", isError: true });
            return;
        }

        setPwdLoading(true);

        try {
            const { data } = await axiosInstance.put("/api/auth/change-password", {
                currentPassword: pwdForm.currentPassword,
                newPassword: pwdForm.newPassword
            });
            setPwdMsg({ text: data.message || "Password updated successfully!", isError: false });
            setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            loadSecurityData();
        } catch (err: any) {
            setPwdMsg({ text: err?.response?.data?.message || "Failed to update password.", isError: true });
        } finally {
            setPwdLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-8 border-b border-border/40 gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
                        <Shield className="w-3.5 h-3.5" />
                        Enterprise Security Center
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Security, Sessions & Policies
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Monitor active devices, audit login attempts, enforce password policies, and resolve security alerts.
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSecurityData}
                    disabled={isFetching}
                    className="rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                >
                    <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                    Refresh Logs
                </Button>
            </div>

            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-bold">{sessions.length}</div>
                        <div className="text-xs text-muted-foreground">Active Device Sessions</div>
                    </div>
                </Card>

                <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-bold">{user?.isEmailVerified ? "Verified" : "Pending"}</div>
                        <div className="text-xs text-muted-foreground">Email Security Status</div>
                    </div>
                </Card>

                <Card className="p-4 border-border/50 bg-card/60 backdrop-blur-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-bold">
                            {alerts.filter(a => !a.resolved).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Open Security Alerts</div>
                    </div>
                </Card>
            </div>

            {/* Action Notice */}
            {actionMsg && (
                <div className="mb-6 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-between">
                    <span>{actionMsg}</span>
                    <button onClick={() => setActionMsg("")} className="text-blue-500 font-bold">✕</button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-border/40 pb-3 mb-6 overflow-x-auto">
                {[
                    { id: "sessions", label: "Active Sessions", icon: Laptop, count: sessions.length },
                    { id: "history", label: "Login Audit History", icon: Activity, count: history.length },
                    { id: "password", label: "Password & Policy", icon: Key },
                    { id: "alerts", label: "Security Alerts", icon: ShieldAlert, count: alerts.filter(a => !a.resolved).length, badgeColor: "bg-rose-500 text-white" },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    tab.badgeColor || (isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: ACTIVE SESSIONS */}
            {activeTab === "sessions" && (
                <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-6 border-b border-border/40 gap-3">
                        <div>
                            <h2 className="text-lg font-bold">Active Device Sessions</h2>
                            <p className="text-xs text-muted-foreground">Devices currently logged into your account with valid bearer tokens.</p>
                        </div>
                        {sessions.length > 1 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleRevokeOtherSessions}
                                className="rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                            >
                                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                                Terminate All Other Sessions
                            </Button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {sessions.map((sess) => (
                            <div
                                key={sess.sessionId}
                                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                                    sess.isCurrent
                                        ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60"
                                        : "bg-muted/20 border-border/40 hover:bg-muted/40"
                                }`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className={`p-3 rounded-xl ${sess.isCurrent ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"}`}>
                                        <Laptop className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-foreground">{sess.device}</span>
                                            {sess.isCurrent && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                    Current Device
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3 mt-1 font-mono">
                                            <span>IP: {sess.ip}</span>
                                            <span>•</span>
                                            <span>Location: {sess.location}</span>
                                            <span>•</span>
                                            <span>Active: {new Date(sess.lastActive).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {!sess.isCurrent ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRevokeSession(sess.sessionId)}
                                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                        Revoke Access
                                    </Button>
                                ) : (
                                    <span className="text-xs font-semibold text-muted-foreground italic px-3 py-1">
                                        Active Now
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* TAB 2: LOGIN HISTORY */}
            {activeTab === "history" && (
                <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl">
                    <div className="pb-4 mb-4 border-b border-border/40">
                        <h2 className="text-lg font-bold">Authentication & Login History</h2>
                        <p className="text-xs text-muted-foreground">Chronological audit trail of all successful, failed, and locked authentication events.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-border/40 text-muted-foreground uppercase">
                                <tr>
                                    <th className="py-3 px-3">Timestamp</th>
                                    <th className="py-3 px-3">Device / Client</th>
                                    <th className="py-3 px-3">IP Address</th>
                                    <th className="py-3 px-3">Status</th>
                                    <th className="py-3 px-3">Details / Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {history.map((event, idx) => (
                                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                        <td className="py-3.5 px-3 font-mono text-muted-foreground">
                                            {new Date(event.timestamp).toLocaleString()}
                                        </td>
                                        <td className="py-3.5 px-3 font-semibold text-foreground">
                                            {event.device}
                                        </td>
                                        <td className="py-3.5 px-3 font-mono text-muted-foreground">
                                            {event.ip}
                                        </td>
                                        <td className="py-3.5 px-3">
                                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                                event.status === "SUCCESS"
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                    : event.status === "LOCKED"
                                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                                                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                            }`}>
                                                {event.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-3 text-muted-foreground line-clamp-1">
                                            {event.reason || "Standard Login"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* TAB 3: PASSWORD & POLICY */}
            {activeTab === "password" && (
                <Card className="p-6 max-w-xl border-border/40 bg-card/60 backdrop-blur-sm shadow-xl">
                    <div className="pb-4 mb-6 border-b border-border/40">
                        <h2 className="text-lg font-bold">Update Account Password</h2>
                        <p className="text-xs text-muted-foreground">Enforces enterprise complexity: 8+ chars, mixed case, symbols, and prevents password reuse.</p>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Current Password
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={pwdForm.currentPassword}
                                onChange={(e) => setPwdForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                required
                                className="h-10 rounded-xl border-border bg-muted/40 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                New Password
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={pwdForm.newPassword}
                                onChange={(e) => setPwdForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                required
                                className="h-10 rounded-xl border-border bg-muted/40 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Confirm New Password
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={pwdForm.confirmPassword}
                                onChange={(e) => setPwdForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                required
                                className="h-10 rounded-xl border-border bg-muted/40 text-sm"
                            />
                        </div>

                        {pwdMsg.text && (
                            <div className={`p-3 rounded-xl text-xs font-medium ${
                                pwdMsg.isError
                                    ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200"
                                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200"
                            }`}>
                                {pwdMsg.text}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={pwdLoading}
                            className="w-full h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md cursor-pointer"
                        >
                            {pwdLoading ? "Updating Password..." : "Update & Enforce Policy"}
                        </Button>
                    </form>
                </Card>
            )}

            {/* TAB 4: SECURITY ALERTS */}
            {activeTab === "alerts" && (
                <Card className="p-6 border-border/40 bg-card/60 backdrop-blur-sm shadow-xl">
                    <div className="pb-4 mb-6 border-b border-border/40">
                        <h2 className="text-lg font-bold">Security Alerts & Incident Feed</h2>
                        <p className="text-xs text-muted-foreground">Automated detection of new device logins, failed attempts, and account locks.</p>
                    </div>

                    {alerts.length === 0 ? (
                        <div className="text-center py-10 text-xs text-muted-foreground space-y-2">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                            <p className="font-semibold text-foreground">No security alerts detected.</p>
                            <p>Your account activity is normal and secure.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.alertId}
                                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                                        alert.resolved
                                            ? "bg-muted/10 border-border/30 opacity-70"
                                            : alert.severity === "high"
                                            ? "bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                                            : "bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2.5 rounded-xl shrink-0 ${
                                            alert.severity === "high" ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                                        }`}>
                                            <AlertTriangle className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-foreground">{alert.type.replace(/_/g, " ")}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                    alert.severity === "high"
                                                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                                        : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                                }`}>
                                                    {alert.severity} Priority
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                                            <div className="text-[11px] font-mono text-muted-foreground mt-1">
                                                {new Date(alert.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {!alert.resolved ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleResolveAlert(alert.alertId)}
                                            className="rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                                        >
                                            Mark as Resolved
                                        </Button>
                                    ) : (
                                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
