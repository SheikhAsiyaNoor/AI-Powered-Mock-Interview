"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/Authcontext";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";

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
    const [configNotice, setConfigNotice] = useState(false);
    const googleBtnRef = useRef<HTMLDivElement>(null);

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const isConfigured = !!googleClientId && !googleClientId.includes("placeholder");

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
        if (!window.google?.accounts?.id || !isConfigured) return;

        try {
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: handleGoogleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            if (googleBtnRef.current) {
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
        if (!isConfigured) return;

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
    }, [googleClientId, isConfigured]);

    if (!isConfigured) {
        return (
            <div className="w-full space-y-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfigNotice(!configNotice)}
                    className="w-full h-11 rounded-full border-border bg-card/80 hover:bg-muted/60 text-foreground font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
                >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                    <span>{text}</span>
                </Button>

                {configNotice && (
                    <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-left text-xs space-y-2">
                        <div className="flex items-center gap-1.5 font-bold">
                            <AlertCircle className="w-4 h-4 text-blue-600" />
                            <span>Real Google OAuth Setup Required</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-blue-300">
                            To connect your real Google account, add your free Google Cloud Client ID to <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 rounded font-mono text-[10px]">client/.env.local</code>:
                        </p>
                        <div className="bg-background/80 p-2 rounded-xl font-mono text-[10px] select-all border border-blue-200/50 break-all">
                            NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
                        </div>
                        <a
                            href="https://console.cloud.google.com/apis/credentials"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                        >
                            Open Google Cloud Console <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center justify-center space-y-2">
            <div
                ref={googleBtnRef}
                className="w-full flex justify-center min-h-[44px] items-center"
            />

            {isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold py-1">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Verifying with Google Identity Services...</span>
                </div>
            )}
        </div>
    );
};

export default GoogleSignInButton;
