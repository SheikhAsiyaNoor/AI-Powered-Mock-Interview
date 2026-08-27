"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, Laptop, Check } from "lucide-react";

interface ThemeToggleProps {
    className?: string;
    variant?: "dropdown" | "button";
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "", variant = "button" }) => {
    const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (variant === "dropdown") {
        return (
            <div className={`relative ${className}`} ref={dropdownRef}>
                <button
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 p-2 rounded-xl border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer text-xs font-semibold"
                    title={`Current theme: ${theme}`}
                    aria-label="Toggle theme"
                >
                    {resolvedTheme === "dark" ? (
                        <Moon className="w-4 h-4 text-indigo-400" />
                    ) : (
                        <Sun className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="capitalize hidden sm:inline">{theme}</span>
                </button>

                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-card border border-border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <button
                            onClick={() => {
                                setTheme("light");
                                setDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                theme === "light" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Sun className="w-3.5 h-3.5 text-amber-500" /> Light
                            </span>
                            {theme === "light" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                        <button
                            onClick={() => {
                                setTheme("dark");
                                setDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                theme === "dark" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Moon className="w-3.5 h-3.5 text-indigo-400" /> Dark
                            </span>
                            {theme === "dark" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                        <button
                            onClick={() => {
                                setTheme("system");
                                setDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                theme === "system" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Laptop className="w-3.5 h-3.5 text-emerald-500" /> System
                            </span>
                            {theme === "system" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer relative group ${className}`}
            title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode (Current: ${theme})`}
            aria-label="Toggle theme mode"
        >
            <div className="relative w-4 h-4 flex items-center justify-center">
                {resolvedTheme === "dark" ? (
                    <Moon className="w-4 h-4 text-indigo-400 transition-transform group-hover:rotate-12 duration-300" />
                ) : (
                    <Sun className="w-4 h-4 text-amber-500 transition-transform group-hover:rotate-45 duration-300" />
                )}
            </div>
        </button>
    );
};

export default ThemeToggle;
