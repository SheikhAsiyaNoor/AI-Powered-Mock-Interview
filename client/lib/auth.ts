const TOKEN_KEY = "token";
const USER_KEY = "user";
const SESSION_KEY = "session_id";

export interface PrivacySettings {
    isEmailPublic?: boolean;
    isRecoveryEmailPublic?: boolean;
    isPhonePublic?: boolean;
    isStatsPublic?: boolean;
    isBadgesPublic?: boolean;
    isRankPublic?: boolean;
}

export interface StoredUser {
    id: string;
    email: string;
    name: string;
    username?: string;
    bio?: string;
    recoveryEmail?: string;
    phoneNumber?: string;
    role: "student" | "mentor" | "admin";
    avatar?: string;
    privacySettings?: PrivacySettings;
    isEmailVerified?: boolean;
    activeSessionsCount?: number;
    unresolvedAlertsCount?: number;
    createdAt?: string;
}

export const getToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
};

export const getStoredUser = (): StoredUser | null => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
};

export const setStoredUser = (user: StoredUser): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeStoredUser = (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(USER_KEY);
};

export const getSessionId = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(SESSION_KEY);
};

export const setSessionId = (sessionId: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SESSION_KEY, sessionId);
};

export const removeSessionId = (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(SESSION_KEY);
};
