"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/Authcontext";
import { ShieldAlert, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

const LoginPage = () => {
    const router = useRouter();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [lockoutMinutes, setLockoutMinutes] = useState<number | null>(null);
    const [lockoutCountdown, setLockoutCountdown] = useState<number | null>(null);
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

    useEffect(() => {
        let timer: any;
        if (lockoutCountdown && lockoutCountdown > 0) {
            timer = setInterval(() => {
                setLockoutCountdown((prev) => (prev && prev > 1 ? prev - 1 : null));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [lockoutCountdown]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setRemainingAttempts(null);

        try {
            const res = await login(formData.email, formData.password);
            
            // Redirect based on role if applicable
            if (res?.user?.role === "admin") {
                router.push("/admin");
            } else if (res?.user?.role === "mentor") {
                router.push("/mentor");
            } else {
                router.push("/dashboard");
            }
        } catch (err: any) {
            const status = err.response?.status;
            const data = err.response?.data;

            if (status === 423) {
                // Account Locked
                const mins = data?.remainingMinutes || 15;
                setLockoutMinutes(mins);
                setLockoutCountdown(mins * 60);
                setError(data?.message || `Account locked due to 5 consecutive failed login attempts. Try again in ${mins} minutes.`);
            } else if (status === 401 && data?.remainingAttempts !== undefined) {
                setRemainingAttempts(data.remainingAttempts);
                setError(data.message || `Invalid email or password. ${data.remainingAttempts} attempt(s) remaining.`);
            } else {
                setError(data?.message || err.message || "Failed to log in. Please check your credentials.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gradient-to-b from-blue-100/80 via-blue-50/40 to-background px-4 py-12">
            {/* Top AI Icon Badge */}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-500/30 mb-6">
                <span>AI</span>
            </div>

            {/* Login Card Component */}
            <Card className="w-full max-w-md bg-card/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-border/80 text-center">
                <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Welcome Back
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                        Sign in to continue your interview practice and challenges
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Email Address
                            </label>
                            <Input
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={!!lockoutCountdown}
                                className="h-11 rounded-xl border-border bg-muted/40 focus:bg-background text-sm px-4 focus-visible:ring-blue-500"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-foreground">
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                            <Input
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                disabled={!!lockoutCountdown}
                                className="h-11 rounded-xl border-border bg-muted/40 focus:bg-background text-sm px-4 focus-visible:ring-blue-500"
                            />
                        </div>

                        {/* Account Lockout Warning Banner */}
                        {lockoutCountdown !== null && (
                            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium space-y-1.5">
                                <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200">
                                    <ShieldAlert className="w-4 h-4" />
                                    Account Security Lockout Active
                                </div>
                                <p>5 consecutive failed login attempts detected. For your account security, logins are suspended.</p>
                                <div className="font-mono text-sm font-bold text-rose-900 dark:text-rose-100 pt-1">
                                    Time remaining: {Math.floor(lockoutCountdown / 60)}m {lockoutCountdown % 60}s
                                </div>
                            </div>
                        )}

                        {/* Remaining Attempts Warning */}
                        {remainingAttempts !== null && remainingAttempts > 0 && !lockoutCountdown && (
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                                <span>Caution: <strong>{remainingAttempts} attempt(s)</strong> left before 15-min account lockout.</span>
                            </div>
                        )}

                        {/* Standard Error Notice */}
                        {error && lockoutCountdown === null && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading || !!lockoutCountdown}
                            className="w-full h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/25 transition-all mt-2 cursor-pointer"
                        >
                            {isLoading ? "Signing in..." : lockoutCountdown ? "Account Locked" : "Sign In"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-xs text-muted-foreground font-medium">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                            Create one
                        </Link>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        <span>Enterprise TLS & Brute-Force Protected</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;