import axios from "axios";
import { getToken, getSessionId } from "./auth";

const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
const API_BASE_URL = rawUrl.replace(/\/+$/, "");

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 35000,
    headers: {
        "Content-Type": "application/json",
    },
});

axiosInstance.interceptors.request.use((config) => {
    const token = getToken();
    const sessionId = getSessionId();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (sessionId) {
        config.headers["x-session-id"] = sessionId;
    }
    return config;
});

export default axiosInstance;
