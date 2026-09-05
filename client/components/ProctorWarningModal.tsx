"use client";

import React from "react";
import { AlertTriangle, ShieldAlert, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProctorWarningModalProps {
    isOpen: boolean;
    switchCount: number;
    maxAllowedSwitches?: number;
    isTerminated: boolean;
    terminationMessage?: string;
    sessionType?: "test" | "contest" | "challenge" | "interview";
    onDismiss: () => void;
    onViewResults?: () => void;
}

export const ProctorWarningModal: React.FC<ProctorWarningModalProps> = ({
    isOpen,
    switchCount,
    maxAllowedSwitches = 4,
    isTerminated,
    terminationMessage,
    sessionType = "challenge",
    onDismiss,
    onViewResults
}) => {
    if (!isOpen) return null;

    const remaining = Math.max(0, maxAllowedSwitches - switchCount);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-5 text-center ${
                isTerminated
                    ? "bg-destructive/10 border-destructive/50 shadow-destructive/20 text-destructive-foreground"
                    : "bg-card border-amber-500/40 shadow-amber-500/10 text-foreground"
            }`}>
                {/* Icon Header */}
                <div className="flex justify-center">
                    {isTerminated ? (
                        <div className="w-16 h-16 rounded-2xl bg-destructive/20 text-destructive flex items-center justify-center animate-bounce">
                            <XCircle className="w-8 h-8" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center animate-pulse">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                    )}
                </div>

                {/* Title & Badge */}
                <div className="space-y-1">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                        isTerminated
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                    }`}>
                        {isTerminated ? "Session Disqualified" : `Tab Switch Warning: ${switchCount} of ${maxAllowedSwitches}`}
                    </div>
                    <h2 className="text-xl font-extrabold tracking-tight mt-2">
                        {isTerminated
                            ? "Auto-Quit: Session Terminated"
                            : "Focus Lost / Tab Switch Detected!"}
                    </h2>
                </div>

                {/* Message Body */}
                <div className="text-xs text-muted-foreground leading-relaxed">
                    {isTerminated ? (
                        <p className="font-semibold text-foreground">
                            {terminationMessage || `You switched tabs 4 times. Your ${sessionType} has been automatically ended and submitted.`}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            <p>
                                Switching tabs, opening other windows, or minimizing the browser is strictly restricted during live evaluations.
                            </p>
                            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs">
                                ⚠️ {remaining === 1 ? "FINAL WARNING! The next tab switch will immediately terminate and auto-submit your session." : `${remaining} more tab switch${remaining > 1 ? "es" : ""} remaining before automatic termination.`}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2">
                    {isTerminated ? (
                        <Button
                            id="btn-acknowledge-view-results"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onViewResults) {
                                    onViewResults();
                                }
                                onDismiss();
                            }}
                            className="w-full h-11 rounded-2xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xs shadow-lg cursor-pointer transition-all active:scale-98"
                        >
                            <span>Acknowledge & View Results</span>
                            <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                    ) : (
                        <Button
                            id="btn-understand-resume"
                            onClick={onDismiss}
                            className="w-full h-11 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20 cursor-pointer transition-all active:scale-98"
                        >
                            I Understand — Resume {sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}
                        </Button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ProctorWarningModal;
