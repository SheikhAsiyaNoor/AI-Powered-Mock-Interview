"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/Authcontext";

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

const Page = () => {
    const router = useRouter();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

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
            setError("Please enter a valid email address (standard or temporary email domain allowed).");
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
            await register(formData.name, formData.email, formData.password);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gradient-to-b from-blue-100/80 via-blue-50/40 to-white px-4 py-12">
            {/* Top AI Icon Badge */}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-500/30 mb-6">
                <span>AI</span>
            </div>

            {/* Register Card Component */}
            <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-blue-100/80 text-center">
                <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                        Create an Account
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-slate-500 mt-1">
                        Get started with your AI Mock Interview practice
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Full Name
                            </label>
                            <Input
                                type="text"
                                name="name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm px-4 focus-visible:ring-blue-500"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
                                    Email Address
                                </label>
                                {formData.email && (
                                    <span
                                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                            isEmailValid
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-rose-100 text-rose-700"
                                        }`}
                                    >
                                        {isEmailValid ? "✓ Valid Email" : "Invalid Format"}
                                    </span>
                                )}
                            </div>
                            <Input
                                type="email"
                                name="email"
                                placeholder="you@example.com or temp@tempmail.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm px-4 focus-visible:ring-blue-500"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                                Standard & temporary emails (e.g. TempMail, GuerrillaMail, Mailinator) supported.
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold text-slate-700">
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
                                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm px-4 focus-visible:ring-blue-500"
                            />

                            {/* Password Strength Meter */}
                            {formData.password && (
                                <div className="mt-2 space-y-2">
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${strength.color}`}
                                            style={{ width: `${strength.score}%` }}
                                        />
                                    </div>

                                    {/* Criteria Checklist */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] pt-1">
                                        <span className={criteria.hasMinLen ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                                            {criteria.hasMinLen ? "✓" : "○"} 8+ Characters
                                        </span>
                                        <span className={criteria.hasUpper && criteria.hasLower ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                                            {criteria.hasUpper && criteria.hasLower ? "✓" : "○"} Uppercase & Lowercase
                                        </span>
                                        <span className={criteria.hasNumOrSpec ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                                            {criteria.hasNumOrSpec ? "✓" : "○"} Number or Symbol
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/25 transition-all mt-2 cursor-pointer"
                        >
                            {isLoading ? "Creating account..." : "Sign Up"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-xs text-slate-500 font-medium">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-600 font-bold hover:underline">
                            Sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Page;