const TOKEN_KEY = "token"
const USER_KEY = "user"

export interface StoredUser {
    id: string;
    email: string;
    name: string;
    createdAt: string;
}

export const getToken = () => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = (): void => {
    localStorage.removeItem(TOKEN_KEY)
}

export const getStoredUser = (): StoredUser | null => {
    if (typeof window === "undefined") return null
    const user = localStorage.getItem(USER_KEY)
    return user ? JSON.parse(user) : null
}

export const setStoredUser = (user: StoredUser): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const removeStoredUser = (): void => {
    localStorage.removeItem(USER_KEY)
}

