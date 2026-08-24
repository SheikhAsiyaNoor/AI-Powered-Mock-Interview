"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import axiosInstance from "@/lib/axios";
import { Lock, CheckCircle2, ShieldCheck, ArrowLeft, KeyRound } from "lucide-react";

const getPasswordCriteria = (pwd: string) => {
    return {
        hasMinLen: pwd.length >= 8,
        hasUpper: /[A-Z]/.test(pwd),
        hasLower: /[a-z]/.test(pwd),
        hasNumOrSpec: /[0-9!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
};

const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "bg-slate-200" };
    const criteria = getPasswordCriteria(pwd);
    const score = Object.values(criteria).filter(Boolean).length;

    if (score <= 1) return { score: 25, label: "Weak ⚠️", color: "bg-rose-500", text: "text-rose-500" };
    if (score === 2) return { score: 50, label: "Fair ⚡", color: "bg-amber-500", text: "text-amber-500" };
    if (score === 3) return { score: 75, label: "Good 👍", color: "bg-blue-500", text: "text-blue-500" };
    return { score: 100, label: "Strong 💪", color: "bg-emerald-500", text: "text-emerald-500" };
};

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const tokenParam = searchParams.get("token");
        if (tokenParam) {
            setToken(tokenParam);
        }
    }, [searchParams]);

    const criteria = getPasswordCriteria(newPassword);
    const strength = getPasswordStrength(newPassword);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!token.trim()) {
            setError("Reset token is required.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (!criteria.hasUpper || !criteria.hasLower || !criteria.hasNumOrSpec) {
            setError("Password does not meet enterprise complexity requirements.");
            return;
        }

        setIsLoading(true);

        try {
            await axiosInstance.post("/api/auth/reset-password", {
                token: token.trim(),
                newPassword
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to reset password. The token may have expired.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="space-y-4 text-center py-4">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Password Reset Complete</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Your password has been successfully updated and all previous active sessions have been securely invalidated.
                </p>
                <div className="pt-2">
                    <Link href="/login">
                        <Button className="w-full h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/25">
                            Sign In with New Password
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Security Reset Token
                </label>
                <Input
                    type="text"
                    placeholder="Paste 64-character token..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    className="h-11 rounded-xl border-border bg-muted/40 font-mono text-xs px-4 focus-visible:ring-blue-500"
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-foreground">
                        New Password
                    </label>
                    {newPassword && (
                        <span className={`text-[11px] font-bold ${strength.text}`}>
                            {strength.label}
                        </span>
                    )}
                </div>
                <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="h-11 rounded-xl border-border bg-muted/40 text-sm px-4 focus-visible:ring-blue-500"
                />

                {newPassword && (
                    <div className="mt-2 space-y-2">
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${strength.color}`}
                                style={{ width: `${strength.score}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] pt-1">
                            <span className={criteria.hasMinLen ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}>
                                {criteria.hasMinLen ? "✓" : "○"} 8+ Characters
                            </span>
                            <span className={criteria.hasUpper && criteria.hasLower ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}>
                                {criteria.hasUpper && criteria.hasLower ? "✓" : "○"} Upper & Lower
                            </span>
                            <span className={criteria.hasNumOrSpec ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}>
                                {criteria.hasNumOrSpec ? "✓" : "○"} Number/Symbol
                            </span>
                            <span className="text-muted-foreground">
                                ✓ No Recent Reuse
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Confirm New Password
                </label>
                <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11 rounded-xl border-border bg-muted/40 text-sm px-4 focus-visible:ring-blue-500"
                />
            </div>

            {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium">
                    {error}
                </div>
            )}

            <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/25 transition-all mt-2 cursor-pointer"
            >
                {isLoading ? "Resetting Password..." : "Update Password"}
            </Button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gradient-to-b from-blue-100/80 via-blue-50/40 to-background px-4 py-12">
            <Card className="w-full max-w-md bg-card/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6" />
                </div>

                <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Reset Password
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                        Enter your time-limited token and choose a strong password
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    <Suspense fallback={<div className="py-8 text-xs text-muted-foreground">Loading reset form...</div>}>
                        <ResetPasswordForm />
                    </Suspense>

                    <div className="mt-6 text-center text-xs text-muted-foreground font-medium">
                        <Link href="/login" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
