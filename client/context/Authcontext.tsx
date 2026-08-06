"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import {
    StoredUser,
    getToken,
    setToken as saveToken,
    removeToken,
    getStoredUser,
    setStoredUser as saveStoredUser,
    removeStoredUser,
} from "@/lib/auth";
import axiosInstance from "@/lib/axios";

interface AuthContextType {
    user: StoredUser | null;
    isLoggedIn: boolean;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<StoredUser | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [token, setTokenState] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const refreshUser = () => {
        const storedToken = getToken();
        const storedUser = getStoredUser();

        if (storedToken && storedUser) {
            setTokenState(storedToken);
            setUser(storedUser);
            setIsLoggedIn(true);
        } else {
            setTokenState(null);
            setUser(null);
            setIsLoggedIn(false);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = async (email: string, password: string) => {
        const { data } = await axiosInstance.post("/api/auth/login", { email, password });

        if (data.token && data.user) {
            saveToken(data.token);
            saveStoredUser(data.user);
            setTokenState(data.token);
            setUser(data.user);
            setIsLoggedIn(true);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        const { data } = await axiosInstance.post("/api/auth/register", { name, email, password });

        if (data.token && data.user) {
            saveToken(data.token);
            saveStoredUser(data.user);
            setTokenState(data.token);
            setUser(data.user);
            setIsLoggedIn(true);
        }
    };

    const logout = () => {
        removeToken();
        removeStoredUser();
        setTokenState(null);
        setUser(null);
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, token, isLoading, login, register, logout, refreshUser }}>
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