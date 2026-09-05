"use client";

import React, { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { Mail, Heart, Check, Copy, Shield, Sparkles, ExternalLink } from "lucide-react";

export default function Footer() {
    const [copied, setCopied] = useState(false);
    const supportEmail = "asanstudy42@gmail.com";

    const handleCopyEmail = (e: React.MouseEvent) => {
        e.preventDefault();
        navigator.clipboard.writeText(supportEmail);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <footer className="w-full border-t border-border/40 bg-card/60 backdrop-blur-xl transition-colors duration-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-border/40">
                    {/* Column 1: Brand & Tagline */}
                    <div className="md:col-span-2 space-y-3">
                        <div className="flex items-center gap-2">
                            <BrandLogo size={32} showText={true} />
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-md leading-relaxed">
                            Absolute pointers, zero blind spots. High-performance AI mock interview & placement readiness engine engineered for career acceleration.
                        </p>
                    </div>


                    {/* Column 2: Navigation Links */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Navigation</h4>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            <li>
                                <Link href="/dashboard" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/practice" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                                    Adaptive Interview
                                </Link>
                            </li>
                            <li>
                                <Link href="/simulator" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                                    Company Simulator
                                </Link>
                            </li>
                            <li>
                                <Link href="/arena" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                                    Challenge Arena
                                </Link>
                            </li>
                            <li>
                                <Link href="/#reviews" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                                    Candidate Reviews
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Support & Contact */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Support & Inquiries</h4>
                        <p className="text-xs text-muted-foreground">
                            Questions, bug reports, or partnership opportunities? Reach out anytime.
                        </p>
                        <div className="space-y-2">
                            <a
                                href={`mailto:${supportEmail}`}
                                className="group flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 hover:bg-primary/10 border border-border/50 hover:border-primary/30 transition-all text-xs font-medium text-foreground"
                                title="Send email"
                            >
                                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="truncate group-hover:text-primary transition-colors">{supportEmail}</span>
                            </a>
                            <button
                                type="button"
                                onClick={handleCopyEmail}
                                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition cursor-pointer font-medium"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3 h-3 text-emerald-500" />
                                        <span className="text-emerald-500 font-semibold">Email copied to clipboard!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3" />
                                        <span>Click to copy support email</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Creator Credit, Copyright, and Legal */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-medium">
                        <span>Made by</span>
                        <span className="font-bold text-foreground hover:text-primary transition-colors">
                            Sheikh Asiya Noor
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-muted-foreground">
                        <span>© 2026 Iperitus. All rights reserved.</span>
                        <span>·</span>
                        <span className="text-muted-foreground/80">Absolute pointers, zero blind spots.</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
