"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import axiosInstance from "@/lib/axios";
import { MailCheck, CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react";

function VerifyEmailForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [token, setToken] = useState("");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        const tokenParam = searchParams.get("token");
        if (tokenParam) {
            setToken(tokenParam);
            handleAutoVerify(tokenParam);
        }
    }, [searchParams]);

    const handleAutoVerify = async (tok: string) => {
        setIsLoading(true);
        setError("");
        try {
            const { data } = await axiosInstance.post("/api/auth/verify-email", { token: tok });
            setMessage(data.message || "Email verified successfully!");
            setVerified(true);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Invalid or expired verification token.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token.trim()) return;
        await handleAutoVerify(token.trim());
    };

    const handleResend = async () => {
        if (!email.trim()) {
            setError("Please enter your registered email address to resend verification.");
            return;
        }
        setIsResending(true);
        setError("");
        setMessage("");

        try {
            const { data } = await axiosInstance.post("/api/auth/resend-verification", { email: email.trim() });
            setMessage(data.message || "New verification token sent!");
            if (data.verificationTokenPreview) {
                setToken(data.verificationTokenPreview);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to resend verification.");
        } finally {
            setIsResending(false);
        }
    };

    if (verified) {
        return (
            <div className="space-y-4 text-center py-4">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Email Verified!</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Your email address has been successfully verified. You now have full access to peer challenges and interview rooms.
                </p>
                <div className="pt-2">
                    <Link href="/dashboard">
                        <Button className="w-full h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md">
                            Go to Dashboard →
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleManualVerify} className="space-y-4 text-left">
                <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Verification Token / Code
                    </label>
                    <Input
                        type="text"
                        placeholder="Paste verification token..."
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="h-11 rounded-xl border-border bg-muted/40 font-mono text-xs px-4 focus-visible:ring-blue-500"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={isLoading || !token.trim()}
                    className="w-full h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                >
                    {isLoading ? "Verifying..." : "Verify Token"}
                </Button>
            </form>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-left space-y-3">
                <p className="text-xs font-semibold text-foreground">Didn't receive or need a new token?</p>
                <div className="flex gap-2">
                    <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-9 rounded-lg border-border text-xs bg-background"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResend}
                        disabled={isResending}
                        className="rounded-lg text-xs font-semibold shrink-0"
                    >
                        <RefreshCw className={`w-3 h-3 mr-1 ${isResending ? "animate-spin" : ""}`} />
                        Resend
                    </Button>
                </div>
            </div>

            {message && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium text-left">
                    {message}
                </div>
            )}

            {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium text-left">
                    {error}
                </div>
            )}
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gradient-to-b from-blue-100/80 via-blue-50/40 to-background px-4 py-12">
            <Card className="w-full max-w-md bg-card/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-border/80 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                    <MailCheck className="w-6 h-6" />
                </div>

                <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Email Verification
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                        Confirm your email to secure your account and verify your candidate profile.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    <Suspense fallback={<div className="py-8 text-xs text-muted-foreground">Loading verification...</div>}>
                        <VerifyEmailForm />
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
