"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/Authcontext";
import { Lock, MailCheck, CheckCircle2, RefreshCw, ArrowRight } from "lucide-react";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import axiosInstance from "@/lib/axios";

const isValidEmail = (email: string) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

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

const RegisterPage = () => {
    const router = useRouter();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isRegistered, setIsRegistered] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [isResending, setIsResending] = useState(false);
    const [resendStatus, setResendStatus] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError("");
    };

    const criteria = getPasswordCriteria(formData.password);
    const strength = getPasswordStrength(formData.password);
    const isEmailValid = isValidEmail(formData.email);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!isEmailValid) {
            setError("Please enter a valid email address.");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        if (!criteria.hasUpper || !criteria.hasLower) {
            setError("Password must contain both uppercase and lowercase letters.");
            return;
        }

        if (!criteria.hasNumOrSpec) {
            setError("Password must contain at least one number or special character.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await register(formData.name, formData.email, formData.password);
            // If already verified (e.g. google sso) redirect to dashboard, else show verification screen
            if (res?.isEmailVerified) {
                router.push("/dashboard");
            } else {
                setRegisteredEmail(formData.email);
                setIsRegistered(true);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!registeredEmail) return;
        setIsResending(true);
        setResendStatus("");
        setError("");

        try {
            const { data } = await axiosInstance.post("/api/auth/resend-verification", {
                email: registeredEmail
            });
            setResendStatus(data.message || "Verification email re-sent!");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to resend verification email.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gradient-to-b from-blue-100/80 via-blue-50/40 to-background px-4 py-12">
            {/* Top AI Icon Badge */}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-500/30 mb-6">
                <span>AI</span>
            </div>

            {/* Register Card Component */}
            <Card className="w-full max-w-md bg-card/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-border/80 text-center">
                {isRegistered ? (
                    <div className="space-y-5 text-center py-2">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 shadow-lg shadow-blue-500/10">
                            <MailCheck className="w-8 h-8" />
                        </div>
                        
                        <CardHeader className="p-0">
                            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                                Verify Your Email
                            </CardTitle>
                            <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                                We have sent a verification link to:
                            </CardDescription>
                            <p className="font-semibold text-foreground text-sm mt-1 bg-muted/60 py-1.5 px-3 rounded-xl inline-block">
                                {registeredEmail}
                            </p>
                        </CardHeader>

                        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 text-left space-y-2">
                            <p className="font-semibold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                What to do next:
                            </p>
                            <ol className="list-decimal list-inside space-y-1 text-muted-foreground dark:text-slate-300">
                                <li>Open your email inbox and click the verification link.</li>
                                <li>The link will confirm your identity and activate your account.</li>
                                <li>Once verified, log in to start practicing interviews!</li>
                            </ol>
                        </div>

                        {resendStatus && (
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium text-left">
                                {resendStatus}
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-medium text-left">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2 pt-2">
                            <Link href="/login">
                                <Button className="w-full h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/25 transition-all cursor-pointer">
                                    Proceed to Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
                                </Button>
                            </Link>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleResendVerification}
                                disabled={isResending}
                                className="w-full h-10 rounded-full text-xs font-semibold"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isResending ? "animate-spin" : ""}`} />
                                {isResending ? "Resending Email..." : "Resend Verification Email"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <CardHeader className="p-0 mb-6">
                            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                                Create Your Account
                            </CardTitle>
                            <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                                Get started with AI Mock Interviews, Peer Arena & Readiness Tracking
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-0">
                            {/* Google Sign-In Button */}
                            <div className="mb-4">
                                <GoogleSignInButton
                                    text="Sign up with Google"
                                    role="student"
                                    onError={(err) => setError(err)}
                                />
                            </div>

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border/60" />
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase">
                                    <span className="bg-card px-2 text-muted-foreground font-semibold">
                                        Or register with email
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                                        Full Name
                                    </label>
                                    <Input
                                        type="text"
                                        name="name"
                                        placeholder="Alex Chen"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="h-11 rounded-xl border-border bg-muted/40 focus:bg-background text-sm px-4 focus-visible:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-semibold text-foreground">
                                            Email Address
                                        </label>
                                        {formData.email && (
                                            <span
                                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                                    isEmailValid
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                        : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                                }`}
                                            >
                                                {isEmailValid ? "✓ Valid Format" : "Invalid Format"}
                                            </span>
                                        )}
                                    </div>
                                    <Input
                                        type="email"
                                        name="email"
                                        placeholder="alex@company.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="h-11 rounded-xl border-border bg-muted/40 focus:bg-background text-sm px-4 focus-visible:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-semibold text-foreground">
                                            Password
                                        </label>
                                        {formData.password && (
                                            <span className={`text-[11px] font-bold ${strength.text}`}>
                                                {strength.label}
                                            </span>
                                        )}
                                    </div>
                                    <Input
                                        type="password"
                                        name="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="h-11 rounded-xl border-border bg-muted/40 focus:bg-background text-sm px-4 focus-visible:ring-blue-500"
                                    />

                                    {/* Password Strength Meter */}
                                    {formData.password && (
                                        <div className="mt-2 space-y-2">
                                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${strength.color}`}
                                                    style={{ width: `${strength.score}%` }}
                                                />
                                            </div>

                                            {/* Criteria Checklist */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] pt-1">
                                                <span className={criteria.hasMinLen ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}>
                                                    {criteria.hasMinLen ? "✓" : "○"} 8+ Characters
                                                </span>
                                                <span className={criteria.hasUpper && criteria.hasLower ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}>
                                                    {criteria.hasUpper && criteria.hasLower ? "✓" : "○"} Upper & Lower
                                                </span>
                                                <span className={criteria.hasNumOrSpec ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}>
                                                    {criteria.hasNumOrSpec ? "✓" : "○"} Number or Symbol
                                                </span>
                                                <span className="text-muted-foreground">
                                                    ✓ Enterprise Encrypted
                                                </span>
                                            </div>
                                        </div>
                                    )}
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
                                    {isLoading ? "Creating Account..." : "Create Candidate Account"}
                                </Button>
                            </form>

                            <div className="mt-6 text-center text-xs text-muted-foreground font-medium">
                                Already have an account?{" "}
                                <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                                    Sign in
                                </Link>
                            </div>

                            <div className="mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                                <Lock className="w-3 h-3 text-emerald-600" />
                                <span>Enterprise TLS & Google SSO Protected</span>
                            </div>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
};

export default RegisterPage;