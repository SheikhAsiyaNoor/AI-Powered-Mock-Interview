"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
    StoredUser,
    getToken,
    setToken as saveToken,
    removeToken,
    getStoredUser,
    setStoredUser as saveStoredUser,
    removeStoredUser,
    getSessionId,
    setSessionId as saveSessionId,
    removeSessionId
} from "@/lib/auth";
import axiosInstance from "@/lib/axios";

interface GoogleAuthPayload {
    credential?: string;
    email?: string;
    name?: string;
    googleId?: string;
    avatar?: string;
    role?: string;
}

interface AuthContextType {
    user: StoredUser | null;
    isLoggedIn: boolean;
    token: string | null;
    sessionId: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<any>;
    register: (name: string, email: string, password: string, role?: string) => Promise<any>;
    loginWithGoogle: (payload: GoogleAuthPayload) => Promise<any>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    updateUser: (updatedData: Partial<StoredUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<StoredUser | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [token, setTokenState] = useState<string | null>(null);
    const [sessionId, setSessionIdState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const refreshUser = useCallback(async () => {
        const storedToken = getToken();
        const storedUser = getStoredUser();
        const storedSessionId = getSessionId();

        if (storedToken && storedUser) {
            setTokenState(storedToken);
            setUser(storedUser);
            setSessionIdState(storedSessionId);
            setIsLoggedIn(true);

            // Fetch live /me to verify token and sync role/permissions
            try {
                const { data } = await axiosInstance.get("/api/auth/me");
                if (data) {
                    const updated: StoredUser = {
                        id: data.id,
                        name: data.name,
                        email: data.email,
                        role: data.role || "student",
                        avatar: data.avatar || storedUser.avatar || "",
                        isEmailVerified: data.isEmailVerified,
                        activeSessionsCount: data.activeSessionsCount,
                        unresolvedAlertsCount: data.unresolvedAlertsCount,
                        createdAt: data.createdAt
                    };
                    saveStoredUser(updated);
                    setUser(updated);
                }
            } catch (err: any) {
                // If 401 or token invalid, clear local auth
                if (err?.response?.status === 401) {
                    removeToken();
                    removeStoredUser();
                    removeSessionId();
                    setTokenState(null);
                    setUser(null);
                    setSessionIdState(null);
                    setIsLoggedIn(false);
                }
            }
        } else {
            setTokenState(null);
            setUser(null);
            setSessionIdState(null);
            setIsLoggedIn(false);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = async (email: string, password: string) => {
        const { data } = await axiosInstance.post("/api/auth/login", { email, password });

        if (data.token && data.user) {
            saveToken(data.token);
            saveStoredUser(data.user);
            if (data.sessionId) saveSessionId(data.sessionId);

            setTokenState(data.token);
            setUser(data.user);
            setSessionIdState(data.sessionId || null);
            setIsLoggedIn(true);
        }
        return data;
    };

    const register = async (name: string, email: string, password: string, role: string = "student") => {
        const { data } = await axiosInstance.post("/api/auth/register", { name, email, password, role });

        if (data.token && data.user) {
            saveToken(data.token);
            saveStoredUser(data.user);
            if (data.sessionId) saveSessionId(data.sessionId);

            setTokenState(data.token);
            setUser(data.user);
            setSessionIdState(data.sessionId || null);
            setIsLoggedIn(true);
        }
        return data;
    };

    const loginWithGoogle = async (payload: GoogleAuthPayload) => {
        const { data } = await axiosInstance.post("/api/auth/google", payload);

        if (data.token && data.user) {
            saveToken(data.token);
            saveStoredUser(data.user);
            if (data.sessionId) saveSessionId(data.sessionId);

            setTokenState(data.token);
            setUser(data.user);
            setSessionIdState(data.sessionId || null);
            setIsLoggedIn(true);
        }
        return data;
    };

    const logout = () => {
        removeToken();
        removeStoredUser();
        removeSessionId();
        setTokenState(null);
        setUser(null);
        setSessionIdState(null);
        setIsLoggedIn(false);
    };

    const updateUser = (updatedData: Partial<StoredUser>) => {
        if (!user) return;
        const newUser = { ...user, ...updatedData };
        saveStoredUser(newUser);
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, token, sessionId, isLoading, login, register, loginWithGoogle, logout, refreshUser, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};