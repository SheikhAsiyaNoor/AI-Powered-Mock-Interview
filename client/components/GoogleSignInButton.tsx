"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/Authcontext";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface GoogleSignInButtonProps {
    text?: string;
    role?: "student" | "mentor" | "admin";
    onError?: (err: string) => void;
    className?: string;
}

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    renderButton: (element: HTMLElement, config: any) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
    text = "Continue with Google",
    role = "student",
    onError,
    className = ""
}) => {
    const router = useRouter();
    const { loginWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const googleBtnRef = useRef<HTMLDivElement>(null);

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

    // Load Google Identity Services SDK script if client ID is present
    useEffect(() => {
        if (!googleClientId) return;

        const scriptId = "google-jssdk";
        if (!document.getElementById(scriptId)) {
            const script = document.createElement("script");
            script.id = scriptId;
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = initializeGoogleGSI;
            document.body.appendChild(script);
        } else if (window.google) {
            initializeGoogleGSI();
        }
    }, [googleClientId]);

    const initializeGoogleGSI = () => {
        if (!window.google?.accounts?.id || !googleClientId) return;

        window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
        });

        if (googleBtnRef.current) {
            window.google.accounts.id.renderButton(googleBtnRef.current, {
                theme: "outline",
                size: "large",
                width: "100%",
                text: "continue_with",
                shape: "pill"
            });
        }
    };

    const handleGoogleCredentialResponse = async (response: any) => {
        if (!response.credential) return;
        setIsLoading(true);
        try {
            const res = await loginWithGoogle({ credential: response.credential, role });
            redirectBasedOnRole(res?.user?.role);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Google Sign-In failed.";
            if (onError) onError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDirectGoogleClick = async () => {
        setIsLoading(true);
        try {
            if (googleClientId && window.google?.accounts?.id) {
                window.google.accounts.id.prompt();
                setIsLoading(false);
                return;
            }

            // Fallback interactive Google OAuth / One-Click SSO prompt for testing and development
            const email = prompt("Enter your Google Account email for Google SSO:", "candidate@gmail.com");
            if (!email) {
                setIsLoading(false);
                return;
            }

            const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
            const googleId = `g_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;

            const res = await loginWithGoogle({
                email,
                name,
                googleId,
                avatar,
                role
            });

            redirectBasedOnRole(res?.user?.role);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Google Sign-In failed.";
            if (onError) onError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const redirectBasedOnRole = (userRole?: string) => {
        if (userRole === "admin") {
            router.push("/admin");
        } else if (userRole === "mentor") {
            router.push("/mentor");
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="w-full space-y-2">
            {googleClientId ? (
                <div ref={googleBtnRef} className="w-full flex justify-center" />
            ) : null}

            {(!googleClientId || !window.google) && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleDirectGoogleClick}
                    disabled={isLoading}
                    className={`w-full h-11 rounded-full border-border bg-card/80 hover:bg-muted/60 text-foreground font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer ${className}`}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                        </svg>
                    )}
                    <span>{text}</span>
                </Button>
            )}
        </div>
    );
};

export default GoogleSignInButton;
