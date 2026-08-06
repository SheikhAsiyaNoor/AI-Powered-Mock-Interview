"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/Authcontext";

const Navbar = () => {
    const pathName = usePathname();
    const { user, isLoggedIn, logout } = useAuth();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathName]);

    const navLinks = isLoggedIn
        ? [
              { href: "/dashboard", label: "Dashboard", icon: "⚡" },
              { href: "/practice", label: "Practice", icon: "🎯" },
              { href: "/dashboard?tab=history", label: "My Sessions", icon: "📊" },
          ]
        : [
              { href: "/#features", label: "Features", icon: "⚡" },
              { href: "/#how-it-works", label: "How it works?", icon: "🔍" },
              { href: "/#domains", label: "Domain", icon: "🧩" },
          ];

    return (
        <header
            className={`sticky top-0 z-40 w-full transition-all duration-300 ${
                scrolled
                    ? "bg-background/80 backdrop-blur-md border-b border-border shadow-xs"
                    : "bg-background border-b border-border/40"
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand Logo */}
                    <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                            AI
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-base tracking-tight text-foreground group-hover:text-blue-600 transition-colors">
                                MockInterview
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold -mt-1">
                                AI Powered
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathName === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                                        isActive
                                            ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    }`}
                                >
                                    <span>{link.icon}</span>
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Auth User Action Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {isLoggedIn ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 text-xs font-semibold">
                                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                                        {user?.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                    <span className="text-foreground">Hi, {user?.name || "User"}</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={logout}
                                    className="rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/login">
                                    <Button variant="ghost" size="sm" className="rounded-full text-xs font-semibold cursor-pointer">
                                        Login
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 cursor-pointer shadow-xs">
                                        Register
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Hamburger Button */}
                    <div className="md:hidden flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="p-2 rounded-xl"
                        >
                            <span className="text-xl">{mobileOpen ? "✕" : "☰"}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Dropdown Menu */}
            {mobileOpen && (
                <div className="md:hidden border-b border-border bg-background px-4 pt-2 pb-4 space-y-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted"
                        >
                            <span>{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}
                    <div className="pt-2 border-t border-border flex flex-col gap-2">
                        {isLoggedIn ? (
                            <Button variant="outline" onClick={logout} className="w-full rounded-xl text-xs font-semibold">
                                Logout
                            </Button>
                        ) : (
                            <>
                                <Link href="/login" className="w-full">
                                    <Button variant="outline" className="w-full rounded-xl text-xs font-semibold">
                                        Login
                                    </Button>
                                </Link>
                                <Link href="/register" className="w-full">
                                    <Button className="w-full rounded-xl bg-blue-600 text-white text-xs font-semibold">
                                        Register
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;