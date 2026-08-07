"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/Authcontext";

const Page = () => {
    const router = useRouter();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            await login(formData.email, formData.password);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Failed to log in. Please check your email and password.");
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

            {/* Login Card Component */}
            <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-blue-100/80 text-center">
                <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                        Welcome Back
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-slate-500 mt-1">
                        Sign in to continue your interview practice
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Email Address
                            </label>
                            <Input
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm px-4 focus-visible:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Password
                            </label>
                            <Input
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-sm px-4 focus-visible:ring-blue-500"
                            />
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
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-xs text-slate-500 font-medium">
                        Don't have an account?{" "}
                        <Link href="/register" className="text-blue-600 font-bold hover:underline">
                            Create one
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Page;