"use client";

import React, { useState, useEffect, useRef } from "react";
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
    Loader2,
    Upload,
    Camera,
    Trash2,
    ImageIcon,
    Maximize2
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

// Helper to auto-resize and center-crop any large image into a lightweight square avatar
const resizeAndCropAvatar = (file: File, maxDimension = 320): Promise<{ dataUrl: string; originalSize: number; resizedSize: number; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith("image/")) {
            return reject(new Error("Please select a valid image file (PNG, JPG, WEBP, GIF)."));
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    return reject(new Error("Canvas context could not be created."));
                }

                // Calculate center square crop
                const minSide = Math.min(img.width, img.height);
                const sx = (img.width - minSide) / 2;
                const sy = (img.height - minSide) / 2;

                const targetSize = Math.min(maxDimension, minSide);
                canvas.width = targetSize;
                canvas.height = targetSize;

                // High quality image smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);

                const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
                const resizedBytes = Math.round((dataUrl.length * 3) / 4);

                resolve({
                    dataUrl,
                    originalSize: file.size,
                    resizedSize: resizedBytes,
                    width: targetSize,
                    height: targetSize
                });
            };
            img.onerror = () => reject(new Error("Failed to decode the image file."));
            img.src = readerEvent.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Failed to read image file."));
        reader.readAsDataURL(file);
    });
};

export default function ProfileSettingsPage() {
    const { user, isLoggedIn, isLoading, refreshUser, updateUser } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageOptimizationMsg, setImageOptimizationMsg] = useState<string | null>(null);
    const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

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

    const handleImageFile = async (file: File) => {
        setIsUploadingImage(true);
        setImageOptimizationMsg(null);
        try {
            const result = await resizeAndCropAvatar(file, 320);
            setForm((prev) => ({ ...prev, avatar: result.dataUrl }));

            const originalKb = (result.originalSize / 1024).toFixed(1);
            const resizedKb = (result.resizedSize / 1024).toFixed(1);
            setImageOptimizationMsg(`Optimized & Resized: ${originalKb} KB → ${resizedKb} KB (${result.width}×${result.height}px) ✨`);
        } catch (err: any) {
            console.error("Image processing error:", err);
            setStatusMsg({ text: err.message || "Failed to process image.", isError: true });
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleImageFile(file);
        }
    };

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

                            {/* Avatar Studio: Upload, Auto-Resize, Presets & Custom URL */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Profile Picture & Avatar
                                    </label>
                                    {form.avatar && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForm((prev) => ({ ...prev, avatar: "" }));
                                                setImageOptimizationMsg(null);
                                            }}
                                            className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                                        >
                                            <Trash2 className="w-3 h-3" /> Reset / Clear
                                        </button>
                                    )}
                                </div>

                                {/* Hidden File Input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                {/* 1. Upload & Auto-Resize Dropzone */}
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragOver(true);
                                    }}
                                    onDragLeave={() => setIsDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-4 sm:p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center gap-4 ${
                                        isDragOver
                                            ? "border-blue-600 bg-blue-500/10 scale-[1.01]"
                                            : "border-border/60 hover:border-blue-500/60 bg-muted/20 hover:bg-muted/40"
                                    }`}
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-muted/60 border border-border overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-xs">
                                        {form.avatar ? (
                                            <img src={form.avatar} alt="Selected Avatar" className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            <Camera className="w-7 h-7 text-muted-foreground" />
                                        )}
                                    </div>

                                    <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                            <span className="text-xs font-bold text-foreground">
                                                {isUploadingImage ? "Resizing & Optimizing Image..." : "Upload Profile Photo"}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                                Auto-Resize & Compress ✨
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Click or drop any image (even 5MB+ photos). High-res files will automatically be resized and square-cropped to a lightweight avatar.
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={isUploadingImage}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        className="shrink-0 rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 gap-1.5 shadow-xs cursor-pointer"
                                    >
                                        {isUploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                        <span>Browse Photo</span>
                                    </Button>
                                </div>

                                {/* Auto-Resize Success Badge */}
                                {imageOptimizationMsg && (
                                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                        <span>{imageOptimizationMsg}</span>
                                    </div>
                                )}

                                {/* 2. Developer Preset Avatars */}
                                <div className="space-y-2 pt-2 border-t border-border/40">
                                    <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                                        <ImageIcon className="w-3 h-3 text-purple-500" /> Or Choose a Preset Bot Avatar:
                                    </label>
                                    
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        {PRESET_AVATARS.map((avatarUrl, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    setForm((prev) => ({ ...prev, avatar: avatarUrl }));
                                                    setImageOptimizationMsg(null);
                                                }}
                                                className={`w-11 h-11 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer p-0.5 bg-muted/40 ${
                                                    form.avatar === avatarUrl
                                                        ? "border-blue-600 scale-110 shadow-md shadow-blue-500/20"
                                                        : "border-border/60 hover:border-blue-400 hover:scale-105"
                                                }`}
                                                title={`Preset Avatar #${idx + 1}`}
                                            >
                                                <img src={avatarUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover rounded-xl" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 3. Custom Image URL */}
                                <div className="pt-2 border-t border-border/40">
                                    <label className="text-[11px] text-muted-foreground font-medium block mb-1">
                                        Or paste a custom image URL:
                                    </label>
                                    <Input
                                        type="url"
                                        placeholder="https://example.com/avatar.png"
                                        value={form.avatar}
                                        onChange={(e) => {
                                            setForm((prev) => ({ ...prev, avatar: e.target.value }));
                                            setImageOptimizationMsg(null);
                                        }}
                                        className="text-xs rounded-xl bg-muted/30 font-mono"
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
