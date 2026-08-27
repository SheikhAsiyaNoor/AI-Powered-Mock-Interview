"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
    const [mounted, setMounted] = useState(false);

    const applyTheme = (targetTheme: Theme) => {
        const root = document.documentElement;
        let isDark = false;

        if (targetTheme === "system") {
            isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        } else {
            isDark = targetTheme === "dark";
        }

        if (isDark) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }

        setResolvedTheme(isDark ? "dark" : "light");
    };

    useEffect(() => {
        const saved = (localStorage.getItem("theme") as Theme) || "system";
        setThemeState(saved);
        applyTheme(saved);
        setMounted(true);

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            const currentSaved = (localStorage.getItem("theme") as Theme) || "system";
            if (currentSaved === "system") {
                applyTheme("system");
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
    };

    const toggleTheme = () => {
        if (resolvedTheme === "dark") {
            setTheme("light");
        } else {
            setTheme("dark");
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme: mounted ? resolvedTheme : "dark", setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
