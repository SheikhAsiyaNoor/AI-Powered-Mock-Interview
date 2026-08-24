"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import axiosInstance from "@/lib/axios";
import { KeyRound, ArrowLeft, CheckCircle2, Copy, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [resetTokenPreview, setResetTokenPreview] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccessMessage("");
        setResetTokenPreview(null);

        try {
            const { data } = await axiosInstance.post("/api/auth/forgot-password", { email });
            setSuccessMessage(data.message || "Password reset token generated.");
            if (data.resetTokenPreview) {
                setResetTokenPreview(data.resetTokenPreview);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to generate password reset request.");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToken = () => {
        if (!resetTokenPreview) return;
        navigator.clipboard.writeText(resetTokenPreview);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gradient-to-b from-blue-100/80 via-blue-50/40 to-background px-4 py-12">
            <Card className="w-full max-w-md bg-card/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                    <KeyRound className="w-6 h-6" />
                </div>

                <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Forgot Password
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                        Enter your registered email to receive a secure, time-limited reset token.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    {!successMessage ? (
                        <form onSubmit={handleSubmit} className="space-y-4 text-left">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                    Registered Email Address
                                </label>
                                <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                {isLoading ? "Generating Token..." : "Generate Reset Token"}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4 text-left">
                            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium space-y-2">
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    Security Token Generated
                                </div>
                                <p>{successMessage}</p>
                            </div>

                            {resetTokenPreview && (
                                <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-foreground flex items-center gap-1">
                                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                            Active 15-Min Reset Token:
                                        </span>
                                        <button
                                            type="button"
                                            onClick={copyToken}
                                            className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
                                        >
                                            <Copy className="w-3 h-3" />
                                            {copied ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                    <p className="font-mono text-xs break-all bg-background p-2.5 rounded-xl border border-border/60 select-all">
                                        {resetTokenPreview}
                                    </p>
                                </div>
                            )}

                            <Link href={`/reset-password${resetTokenPreview ? `?token=${encodeURIComponent(resetTokenPreview)}` : ""}`}>
                                <Button className="w-full h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/25 transition-all mt-2 cursor-pointer">
                                    Proceed to Reset Password →
                                </Button>
                            </Link>
                        </div>
                    )}

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
