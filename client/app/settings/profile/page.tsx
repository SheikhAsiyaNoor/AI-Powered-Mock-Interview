"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/Authcontext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import {
    User as UserIcon,
    Shield,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    Save,
    Sparkles,
    Globe,
    Phone,
    Mail,
    AtSign,
    FileText,
    ArrowUpRight,
    Award,
    Trophy,
    Flame,
    Zap,
    Crown,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const PRESET_AVATARS = [
    "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Aria",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Shadow",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Cyber",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Nova",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Atlas",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Echo",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Vanguard"
];

export default function ProfileSettingsPage() {
    const { user, isLoggedIn, isLoading, refreshUser, updateUser } = useAuth();
    const router = useRouter();

    const [form, setForm] = useState({
        name: "",
        username: "",
        bio: "",
        recoveryEmail: "",
        phoneNumber: "",
        avatar: "",
        privacySettings: {
            isEmailPublic: false,
            isRecoveryEmailPublic: false,
            isPhonePublic: false,
            isStatsPublic: true,
            isBadgesPublic: true,
            isRankPublic: true
        }
    });

    const [gamification, setGamification] = useState<any>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            router.push("/login");
        }
    }, [isLoading, isLoggedIn, router]);

    const loadProfileData = async () => {
        setIsFetching(true);
        try {
            const { data } = await axiosInstance.get("/api/auth/profile");
            if (data?.user) {
                setForm({
                    name: data.user.name || "",
                    username: data.user.username || "",
                    bio: data.user.bio || "",
                    recoveryEmail: data.user.recoveryEmail || "",
                    phoneNumber: data.user.phoneNumber || "",
                    avatar: data.user.avatar || "",
                    privacySettings: {
                        isEmailPublic: data.user.privacySettings?.isEmailPublic ?? false,
                        isRecoveryEmailPublic: data.user.privacySettings?.isRecoveryEmailPublic ?? false,
                        isPhonePublic: data.user.privacySettings?.isPhonePublic ?? false,
                        isStatsPublic: data.user.privacySettings?.isStatsPublic ?? true,
                        isBadgesPublic: data.user.privacySettings?.isBadgesPublic ?? true,
                        isRankPublic: data.user.privacySettings?.isRankPublic ?? true
                    }
                });
            }
            if (data?.gamification) {
                setGamification(data.gamification);
            }
        } catch (err: any) {
            console.error("Error loading user profile:", err);
            setStatusMsg({ text: "Could not load latest profile data.", isError: true });
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            loadProfileData();
        }
    }, [isLoggedIn]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setStatusMsg(null);

        try {
            const { data } = await axiosInstance.put("/api/auth/profile", form);
            if (data?.user) {
                updateUser({
                    name: data.user.name,
                    username: data.user.username,
                    avatar: data.user.avatar,
                    bio: data.user.bio,
                    recoveryEmail: data.user.recoveryEmail,
                    phoneNumber: data.user.phoneNumber,
                    privacySettings: data.user.privacySettings
                });
            }
            setStatusMsg({ text: "Profile & Privacy settings updated successfully! ✨", isError: false });
            await refreshUser();
        } catch (err: any) {
            console.error("Failed to update profile:", err);
            const msg = err?.response?.data?.message || err.message || "Failed to update profile.";
            setStatusMsg({ text: msg, isError: true });
        } finally {
            setIsSaving(false);
        }
    };

    const togglePrivacy = (key: keyof typeof form.privacySettings) => {
        setForm((prev) => ({
            ...prev,
            privacySettings: {
                ...prev.privacySettings,
                [key]: !prev.privacySettings[key]
            }
        }));
    };

    if (isLoading || isFetching) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-xs text-muted-foreground font-medium">Loading your profile studio...</p>
            </div>
        );
    }

    const currentAvatar = form.avatar || user?.avatar || PRESET_AVATARS[0];
    const usernameDisplay = form.username ? `@${form.username}` : "@handle-not-set";

    return (
        <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
            {/* Top Navigation & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                        <UserIcon className="w-7 h-7 text-blue-600" /> Account & Profile Settings
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Manage your public identity, recovery contact channels, and granular privacy preferences.
                    </p>
                </div>

                {user?.id && (
                    <Link
                        href={`/users/${user.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted text-xs font-bold border border-border/60 transition shadow-xs"
                    >
                        <span>View Public Profile</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                    </Link>
                )}
            </div>

            {/* Settings Tab Navigation Bar */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/40 border border-border/50 max-w-md">
                <Link
                    href="/settings/profile"
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-center transition bg-card text-foreground shadow-xs border border-border/40 flex items-center justify-center gap-1.5"
                >
                    <UserIcon className="w-3.5 h-3.5 text-blue-600" /> Profile & Privacy
                </Link>
                <Link
                    href="/settings/security"
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-center text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-1.5"
                >
                    <Shield className="w-3.5 h-3.5 text-purple-500" /> Security & Sessions
                </Link>
            </div>

            {/* Status Feedback Banner */}
            {statusMsg && (
                <div
                    className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
                        statusMsg.isError
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    }`}
                >
                    {statusMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{statusMsg.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT: Profile & Privacy Editor Form (8 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                    <form onSubmit={handleSave} className="space-y-6">
                        {/* 1. Basic Identity Card */}
                        <Card className="p-6 border border-border/60 rounded-3xl bg-card shadow-xs space-y-6">
                            <div className="flex items-center justify-between pb-3 border-b border-border/40">
                                <div>
                                    <h2 className="text-base font-bold text-foreground">Candidate Identity</h2>
                                    <p className="text-xs text-muted-foreground">Your public display name and unique handle.</p>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                    Identity
                                </span>
                            </div>

                            {/* Avatar Picker */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Profile Picture / Avatar
                                </label>
                                
                                <div className="flex flex-wrap items-center gap-3">
                                    {PRESET_AVATARS.map((avatarUrl, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setForm((prev) => ({ ...prev, avatar: avatarUrl }))}
                                            className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer p-1 bg-muted/40 ${
                                                form.avatar === avatarUrl
                                                    ? "border-blue-600 scale-105 shadow-md shadow-blue-500/20"
                                                    : "border-border/60 hover:border-blue-400"
                                            }`}
                                        >
                                            <img src={avatarUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover rounded-xl" />
                                        </button>
                                    ))}
                                </div>

                                <div className="pt-2">
                                    <label className="text-[11px] text-muted-foreground font-medium block mb-1">
                                        Or paste a custom avatar Image URL:
                                    </label>
                                    <Input
                                        type="url"
                                        placeholder="https://example.com/avatar.png"
                                        value={form.avatar}
                                        onChange={(e) => setForm((prev) => ({ ...prev, avatar: e.target.value }))}
                                        className="text-xs rounded-xl bg-muted/30"
                                    />
                                </div>
                            </div>

                            {/* Full Name & Username */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground flex items-center gap-1">
                                        <UserIcon className="w-3.5 h-3.5 text-blue-500" /> Display Name
                                    </label>
                                    <Input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Alex Chen"
                                        className="text-xs rounded-xl bg-muted/30"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground flex items-center gap-1">
                                        <AtSign className="w-3.5 h-3.5 text-purple-500" /> Username Handle
                                    </label>
                                    <Input
                                        type="text"
                                        value={form.username}
                                        onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") }))}
                                        placeholder="e.g. alex_chen"
                                        className="text-xs rounded-xl bg-muted/30 font-mono"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Used for your vanity link: /users/{form.username || "username"}</p>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-foreground flex items-center gap-1">
                                        <FileText className="w-3.5 h-3.5 text-emerald-500" /> Bio / Headline
                                    </label>
                                    <span className="text-[10px] text-muted-foreground font-mono">{form.bio.length}/500</span>
                                </div>
                                <textarea
                                    value={form.bio}
                                    onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value.slice(0, 500) }))}
                                    placeholder="Write a brief intro about your tech stack, placement goals, or favorite projects..."
                                    rows={3}
                                    className="w-full p-3 rounded-xl text-xs bg-muted/30 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600/30 resize-none"
                                />
                            </div>
                        </Card>

                        {/* 2. Contact & Recovery Details */}
                        <Card className="p-6 border border-border/60 rounded-3xl bg-card shadow-xs space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-border/40">
                                <div>
                                    <h2 className="text-base font-bold text-foreground">Contact & Recovery Channels</h2>
                                    <p className="text-xs text-muted-foreground">Keep your account secure with emergency contacts.</p>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-purple-500/10 text-purple-600 border border-purple-500/20">
                                    Security
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground flex items-center gap-1">
                                        <Mail className="w-3.5 h-3.5 text-blue-500" /> Primary Account Email
                                    </label>
                                    <Input
                                        type="email"
                                        disabled
                                        value={user?.email || ""}
                                        className="text-xs rounded-xl bg-muted/60 opacity-80 cursor-not-allowed font-mono"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Primary login email cannot be changed here.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground flex items-center gap-1">
                                            <Mail className="w-3.5 h-3.5 text-emerald-500" /> Recovery Email
                                        </label>
                                        <Input
                                            type="email"
                                            value={form.recoveryEmail}
                                            onChange={(e) => setForm((prev) => ({ ...prev, recoveryEmail: e.target.value }))}
                                            placeholder="backup@gmail.com"
                                            className="text-xs rounded-xl bg-muted/30 font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground flex items-center gap-1">
                                            <Phone className="w-3.5 h-3.5 text-amber-500" /> Phone Number
                                        </label>
                                        <Input
                                            type="tel"
                                            value={form.phoneNumber}
                                            onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                                            placeholder="+91 98765 43210"
                                            className="text-xs rounded-xl bg-muted/30 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* 3. Granular Privacy Controls */}
                        <Card className="p-6 border border-border/60 rounded-3xl bg-card shadow-xs space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-border/40">
                                <div>
                                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-blue-600" /> Granular Privacy Visibility Controls
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Control what other students and recruiters can see on your public profile.
                                    </p>
                                </div>
                            </div>

                            <div className="divide-y divide-border/30">
                                {[
                                    {
                                        key: "isEmailPublic" as const,
                                        title: "Primary Email Address",
                                        desc: "Allow other users to view your primary email address on your profile.",
                                        icon: Mail,
                                        isPublic: form.privacySettings.isEmailPublic
                                    },
                                    {
                                        key: "isRecoveryEmailPublic" as const,
                                        title: "Recovery Email Address",
                                        desc: "Display your secondary recovery email on your public profile.",
                                        icon: Mail,
                                        isPublic: form.privacySettings.isRecoveryEmailPublic
                                    },
                                    {
                                        key: "isPhonePublic" as const,
                                        title: "Phone Number",
                                        desc: "Make your contact phone number visible to peers and recruiters.",
                                        icon: Phone,
                                        isPublic: form.privacySettings.isPhonePublic
                                    },
                                    {
                                        key: "isRankPublic" as const,
                                        title: "Arena Rank Tier & XP Level",
                                        desc: "Display your current rank tier (e.g. Diamond, Grandmaster) and total XP on your profile.",
                                        icon: Crown,
                                        isPublic: form.privacySettings.isRankPublic
                                    },
                                    {
                                        key: "isStatsPublic" as const,
                                        title: "Arena Battles & Flame Streaks",
                                        desc: "Showcase your daily challenge streak and category completion statistics.",
                                        icon: Flame,
                                        isPublic: form.privacySettings.isStatsPublic
                                    },
                                    {
                                        key: "isBadgesPublic" as const,
                                        title: "Achievement Badges Showcase",
                                        desc: "Allow other candidates to see your unlocked achievement medals.",
                                        icon: Award,
                                        isPublic: form.privacySettings.isBadgesPublic
                                    }
                                ].map((item) => {
                                    const ItemIcon = item.icon;
                                    return (
                                        <div key={item.key} className="py-3.5 flex items-center justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-xl bg-muted text-muted-foreground shrink-0 mt-0.5">
                                                    <ItemIcon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-foreground">{item.title}</span>
                                                        <span
                                                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                                                                item.isPublic
                                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                                                    : "bg-muted text-muted-foreground border-border/50"
                                                            }`}
                                                        >
                                                            {item.isPublic ? "Public 🌐" : "Private 🔒"}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => togglePrivacy(item.key)}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                    item.isPublic ? "bg-blue-600" : "bg-muted"
                                                }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                                        item.isPublic ? "translate-x-5" : "translate-x-0"
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Save Action Bar */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-11 shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Profile Changes
                            </Button>
                        </div>
                    </form>
                </div>

                {/* RIGHT: Live Public Card Preview (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="sticky top-24 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-blue-600" /> Public Profile Live Preview
                            </h3>
                            <span className="text-[10px] text-muted-foreground">Updates in real-time</span>
                        </div>

                        {/* Preview Card */}
                        <Card className="p-6 border-2 border-blue-600/30 rounded-3xl bg-card shadow-lg relative overflow-hidden space-y-5">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

                            {/* User Header */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-muted/60 border-2 border-border/80 overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                                    {currentAvatar ? (
                                        <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xl font-bold text-primary">{form.name?.[0] || "U"}</span>
                                    )}
                                </div>
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-extrabold text-foreground truncate">{form.name || "Your Display Name"}</h3>
                                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                            {user?.role || "Student"}
                                        </span>
                                    </div>
                                    <p className="text-xs font-mono text-muted-foreground truncate">{usernameDisplay}</p>
                                    <p className="text-[10px] text-muted-foreground font-mono">User ID: {user?.id || "64fa..."}</p>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="p-3 rounded-2xl bg-muted/30 border border-border/40 text-xs text-muted-foreground leading-relaxed">
                                {form.bio || "No public bio provided yet. Add a short summary to stand out to recruiters!"}
                            </div>

                            {/* Contact Details with Visibility Badges */}
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" /> Email:
                                    </span>
                                    {form.privacySettings.isEmailPublic ? (
                                        <span className="font-mono text-foreground font-semibold">{user?.email}</span>
                                    ) : (
                                        <span className="text-muted-foreground/60 italic flex items-center gap-1">
                                            <Lock className="w-3 h-3" /> Hidden from public
                                        </span>
                                    )}
                                </div>

                                {form.recoveryEmail && (
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5" /> Recovery:
                                        </span>
                                        {form.privacySettings.isRecoveryEmailPublic ? (
                                            <span className="font-mono text-foreground font-semibold">{form.recoveryEmail}</span>
                                        ) : (
                                            <span className="text-muted-foreground/60 italic flex items-center gap-1">
                                                <Lock className="w-3 h-3" /> Hidden from public
                                            </span>
                                        )}
                                    </div>
                                )}

                                {form.phoneNumber && (
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5" /> Phone:
                                        </span>
                                        {form.privacySettings.isPhonePublic ? (
                                            <span className="font-mono text-foreground font-semibold">{form.phoneNumber}</span>
                                        ) : (
                                            <span className="text-muted-foreground/60 italic flex items-center gap-1">
                                                <Lock className="w-3 h-3" /> Hidden from public
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Arena Rank & XP Banner */}
                            <div className="p-3.5 rounded-2xl bg-linear-to-r from-blue-900/60 to-purple-900/60 border border-white/10 text-white flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-1 text-[10px] text-blue-200 uppercase font-bold tracking-wider">
                                        <Crown className="w-3 h-3 text-amber-400" /> Rank Tier
                                    </div>
                                    <div className="text-sm font-black">
                                        {form.privacySettings.isRankPublic !== false ? (gamification?.currentRank || "Novice") : "Hidden (Private)"}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Total XP</div>
                                    <div className="text-sm font-mono font-black text-amber-400">
                                        {form.privacySettings.isRankPublic !== false ? `${gamification?.totalXp || 0} XP` : "🔒 Private"}
                                    </div>
                                </div>
                            </div>

                            {/* Badges Preview */}
                            <div>
                                <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="font-bold text-foreground flex items-center gap-1">
                                        <Award className="w-3.5 h-3.5 text-amber-500" /> Badges Showcase
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {form.privacySettings.isBadgesPublic ? "Visible" : "Hidden"}
                                    </span>
                                </div>
                                {form.privacySettings.isBadgesPublic ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {(gamification?.badges || []).slice(0, 4).map((b: any, idx: number) => (
                                            <span
                                                key={idx}
                                                className="text-xs px-2.5 py-1 rounded-xl bg-muted border border-border text-foreground font-semibold flex items-center gap-1"
                                            >
                                                <span>{b.icon || "🏆"}</span>
                                                <span className="text-[10px]">{b.name}</span>
                                            </span>
                                        ))}
                                        {(gamification?.badges || []).length === 0 && (
                                            <span className="text-[11px] text-muted-foreground italic">No badges unlocked yet. Complete Arena duels to earn medals!</span>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Badges are hidden from public view.
                                    </p>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
