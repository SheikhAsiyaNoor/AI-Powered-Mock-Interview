"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/Authcontext";
import { ShieldAlert, ArrowLeft, Home, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function UnauthorizedPage() {
    const { user } = useAuth();

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-rose-50/40 via-background to-background px-4 py-12">
            <Card className="max-w-md w-full p-8 text-center border-rose-200/60 dark:border-rose-900/40 shadow-2xl shadow-rose-500/5 backdrop-blur-xl bg-card/90">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6 shadow-lg shadow-rose-500/10">
                    <ShieldAlert className="w-8 h-8" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100/80 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 mb-3">
                    403 • Access Denied
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                    Restricted Access
                </h1>

                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    You do not have the required permissions to view this portal. Your current role is{" "}
                    <span className="font-bold text-foreground uppercase tracking-wide px-2 py-0.5 rounded-md bg-muted border border-border/60">
                        {user?.role || "student"}
                    </span>.
                </p>

                <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 text-xs text-left mb-6 space-y-1.5">
                    <p className="font-semibold text-foreground">Role Permissions Overview:</p>
                    <p className="text-muted-foreground">• <strong className="text-foreground">Student:</strong> Practice interviews, readiness scores, Peer Challenge Arena.</p>
                    <p className="text-muted-foreground">• <strong className="text-foreground">Mentor:</strong> Review student transcripts, qualitative grading & mentorship.</p>
                    <p className="text-muted-foreground">• <strong className="text-foreground">Administrator:</strong> User role assignment, challenge generator, platform logs.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link href="/dashboard" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md">
                            <Home className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                    <Link href="/arena" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto rounded-xl text-xs font-semibold">
                            <Swords className="w-4 h-4 mr-2" />
                            Peer Arena
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}
