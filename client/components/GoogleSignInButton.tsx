"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/Authcontext";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

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
                    disableAutoSelect: () => void;
                };
                oauth2: {
                    initCodeClient: (config: any) => any;
                    initTokenClient: (config: any) => any;
                };
            };
        };
    }
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
    text = "Continue with Google",
    onError,
    className = ""
}) => {
    const router = useRouter();
    const { loginWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [configError, setConfigError] = useState("");
    const googleBtnRef = useRef<HTMLDivElement>(null);

    // Google OAuth Client ID from env or fallback
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1028372659341-placeholder.apps.googleusercontent.com";

    const handleGoogleCredentialResponse = async (response: any) => {
        if (!response.credential) {
            if (onError) onError("No credential received from Google.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await loginWithGoogle({ credential: response.credential });
            if (res?.user?.role === "admin") {
                router.push("/admin");
            } else if (res?.user?.role === "mentor") {
                router.push("/mentor");
            } else {
                router.push("/dashboard");
            }
        } catch (err: any) {
            console.error("Google Sign-In backend verification failed:", err);
            const msg = err?.response?.data?.message || "Google authentication failed. Please try again.";
            if (onError) onError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const initializeGoogleGSI = () => {
        if (!window.google?.accounts?.id) return;

        try {
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: handleGoogleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            if (googleBtnRef.current) {
                // Clear any previous child nodes
                googleBtnRef.current.innerHTML = "";
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    text: "signin_with",
                    shape: "pill",
                    logo_alignment: "left",
                    width: "360",
                });
            }
        } catch (err: any) {
            console.error("Error initializing Google Identity Services:", err);
        }
    };

    useEffect(() => {
        const scriptId = "google-gsi-client";
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        if (!script) {
            script = document.createElement("script");
            script.id = scriptId;
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = () => {
                initializeGoogleGSI();
            };
            document.body.appendChild(script);
        } else {
            initializeGoogleGSI();
        }
    }, [googleClientId]);

    const handleManualGoogleClick = () => {
        if (window.google?.accounts?.id) {
            window.google.accounts.id.prompt();
        } else {
            setConfigError("Google Identity Services is loading. Please check your internet connection.");
        }
    };

    return (
        <div className="w-full flex flex-col items-center justify-center space-y-2">
            {/* Official Google GSI Rendered Button Container */}
            <div
                ref={googleBtnRef}
                className="w-full flex justify-center min-h-[44px] items-center"
            />

            {/* Fallback styling if script is still initializing or blocked by ad-blocker */}
            {isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold py-1">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Verifying with Google...</span>
                </div>
            )}

            {configError && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{configError}</span>
                </div>
            )}
        </div>
    );
};

export default GoogleSignInButton;
