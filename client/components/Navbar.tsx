"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/Authcontext";
import ThemeToggle from "@/components/ThemeToggle";
import BrandLogo from "@/components/BrandLogo";
import { ShieldCheck, GraduationCap, Swords, Lock, User as UserIcon } from "lucide-react";

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

    const isMentorOrAdmin = user?.role === "mentor" || user?.role === "admin";
    const isAdmin = user?.role === "admin";

    const navLinks = isLoggedIn
        ? [
              { href: "/dashboard", label: "Dashboard", icon: "⚡" },
              { href: "/arena", label: "Peer Arena", icon: "⚔️", highlight: true },
              { href: "/simulator", label: "Recruiter Simulator", icon: "🏢" },
              { href: "/readiness", label: "Readiness Engine", icon: "🚀" },
              { href: "/practice", label: "Practice", icon: "🎯" },
              ...(isMentorOrAdmin ? [{ href: "/mentor", label: "Mentor Hub", icon: "🎓", badge: "Mentor" }] : []),
              ...(isAdmin ? [{ href: "/admin", label: "Admin Portal", icon: "🛡️", badge: "Admin" }] : []),
          ]
        : [
              { href: "/arena", label: "Peer Arena", icon: "⚔️" },
              { href: "/#features", label: "Features", icon: "⚡" },
              { href: "/#how-it-works", label: "How it works?", icon: "🔍" },
              { href: "/#domains", label: "Domains", icon: "🧩" },
          ];

    return (
        <header
            className={`sticky top-0 z-40 w-full transition-all duration-300 ${
                scrolled
                    ? "bg-background/85 backdrop-blur-xl border-b border-border/80 shadow-xs"
                    : "bg-background/60 backdrop-blur-md border-b border-border/40"
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand Logo */}
                    <Link href={isLoggedIn ? "/dashboard" : "/"}>
                        <BrandLogo size={38} />
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathName === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                        isActive
                                            ? "bg-muted text-foreground border border-border/80 font-semibold shadow-xs"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                    }`}
                                >
                                    <span>{link.icon}</span>
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Auth User Action Buttons & Security Links */}
                    <div className="hidden md:flex items-center gap-2.5">
                        {/* Theme Toggle Button */}
                        <ThemeToggle />

                        {isLoggedIn ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/settings/profile"
                                    title="Profile & Privacy Settings"
                                    className={`p-2 rounded-xl border border-border/50 text-xs font-semibold hover:bg-muted transition-colors ${
                                        pathName === "/settings/profile" ? "bg-muted text-foreground border-border" : "text-muted-foreground"
                                    }`}
                                >
                                    <UserIcon className="w-4 h-4" />
                                </Link>

                                <Link
                                    href="/settings/security"
                                    title="Security Settings & Active Sessions"
                                    className={`p-2 rounded-xl border border-border/50 text-xs font-semibold hover:bg-muted transition-colors ${
                                        pathName === "/settings/security" ? "bg-muted text-foreground border-border" : "text-muted-foreground"
                                    }`}
                                >
                                    <Lock className="w-4 h-4" />
                                </Link>

                                {user?.id && (
                                    <Link
                                        href={`/users/${user.id}`}
                                        title="View Your Public Profile"
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted border border-border/50 text-xs font-semibold transition-colors group cursor-pointer"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-foreground text-background overflow-hidden flex items-center justify-center font-bold text-[10px]">
                                            {user?.avatar ? (
                                                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                user?.name?.[0]?.toUpperCase() || "U"
                                            )}
                                        </div>
                                        <span className="text-foreground max-w-[100px] truncate transition-colors">
                                            {user?.name || "User"}
                                        </span>
                                        
                                        {/* Role Badge */}
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                                            user?.role === "admin"
                                                ? "bg-muted text-foreground border border-border/80"
                                                : user?.role === "mentor"
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                                : "bg-muted text-muted-foreground border border-border/50"
                                        }`}>
                                            {user?.role || "student"}
                                        </span>
                                    </Link>
                                )}

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
                                    <Button size="sm" className="btn-crystal rounded-full text-xs font-semibold px-4 cursor-pointer shadow-xs">
                                        Register
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Header Action */}
                    <div className="lg:hidden flex items-center gap-2">
                        <ThemeToggle />
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
                <div className="lg:hidden border-b border-border bg-background px-4 pt-2 pb-4 space-y-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted"
                        >
                            <span>{link.icon}</span>
                            <span>{link.label}</span>
                        </Link>
                    ))}

                    {isLoggedIn && (
                        <>
                            {user?.id && (
                                <Link
                                    href={`/users/${user.id}`}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted"
                                >
                                    <UserIcon className="w-4 h-4 text-blue-600" />
                                    <span>My Public Profile</span>
                                </Link>
                            )}
                            <Link
                                href="/settings/profile"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted"
                            >
                                <UserIcon className="w-4 h-4 text-muted-foreground" />
                                <span>Profile & Privacy Settings</span>
                            </Link>
                            <Link
                                href="/settings/security"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted"
                            >
                                <Lock className="w-4 h-4 text-muted-foreground" />
                                <span>Security & Active Sessions</span>
                            </Link>
                        </>
                    )}

                    <div className="pt-2 border-t border-border flex flex-col gap-2">
                        {isLoggedIn ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
                                    <span>Signed in as: <strong className="text-foreground">{user?.name}</strong></span>
                                    <span className="font-bold uppercase text-foreground">{user?.role}</span>
                                </div>
                                <Button variant="outline" onClick={logout} className="w-full rounded-xl text-xs font-semibold">
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Link href="/login" className="w-full">
                                    <Button variant="outline" className="w-full rounded-xl text-xs font-semibold">
                                        Login
                                    </Button>
                                </Link>
                                <Link href="/register" className="w-full">
                                    <Button className="w-full rounded-xl btn-crystal text-white text-xs font-semibold">
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