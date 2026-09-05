"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseTabSwitchProctorOptions {
    maxAllowedSwitches?: number; // default 4
    isActive?: boolean; // whether proctoring is enabled
    onAutoQuit?: (finalCount: number) => void; // callback when max switches reached
    sessionType?: "test" | "contest" | "challenge" | "interview";
    storageKey?: string; // key for persisting proctor violations across page reloads
}

export function useTabSwitchProctor({
    maxAllowedSwitches = 4,
    isActive = true,
    onAutoQuit,
    sessionType = "challenge",
    storageKey
}: UseTabSwitchProctorOptions) {
    const [switchCount, setSwitchCount] = useState<number>(0);
    const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
    const [isTerminated, setIsTerminated] = useState<boolean>(false);
    const [terminationMessage, setTerminationMessage] = useState<string>("");

    const lastTriggerTimeRef = useRef<number>(0);
    const onAutoQuitRef = useRef(onAutoQuit);
    onAutoQuitRef.current = onAutoQuit;

    // Restore persisted proctor state across page reloads if storageKey provided
    useEffect(() => {
        if (!storageKey || typeof window === "undefined") return;
        try {
            const raw = sessionStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (typeof parsed.switchCount === "number") {
                    setSwitchCount(parsed.switchCount);
                }
                if (parsed.isTerminated) {
                    setIsTerminated(true);
                    setTerminationMessage(
                        parsed.terminationMessage ||
                        `Session Auto-Ended: You switched tabs ${parsed.switchCount || maxAllowedSwitches} times. As per anti-cheating rules, your ${sessionType} has been terminated and auto-submitted.`
                    );
                    // Only show modal if user hasn't explicitly dismissed it after viewing results
                    if (!parsed.modalDismissed) {
                        setShowWarningModal(true);
                    }
                    if (onAutoQuitRef.current) {
                        onAutoQuitRef.current(parsed.switchCount || maxAllowedSwitches);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to read proctor storage state:", e);
        }
    }, [storageKey, maxAllowedSwitches, sessionType]);

    const recordSwitch = useCallback(() => {
        if (!isActive || isTerminated) return;

        const now = Date.now();
        // Debounce within 2 seconds to avoid double-counting visibilitychange + window blur
        if (now - lastTriggerTimeRef.current < 2000) return;
        lastTriggerTimeRef.current = now;

        setSwitchCount((prev) => {
            const newCount = prev + 1;

            if (newCount >= maxAllowedSwitches) {
                const msg = `Session Auto-Ended: You switched tabs ${newCount} times. As per anti-cheating rules, your ${sessionType} has been terminated and auto-submitted.`;
                setIsTerminated(true);
                setShowWarningModal(true);
                setTerminationMessage(msg);

                if (storageKey && typeof window !== "undefined") {
                    try {
                        sessionStorage.setItem(storageKey, JSON.stringify({
                            isTerminated: true,
                            switchCount: newCount,
                            terminationMessage: msg,
                            modalDismissed: false,
                            timestamp: Date.now()
                        }));
                    } catch (e) {}
                }

                if (onAutoQuitRef.current) {
                    onAutoQuitRef.current(newCount);
                }
                return newCount;
            } else {
                setShowWarningModal(true);
                if (storageKey && typeof window !== "undefined") {
                    try {
                        sessionStorage.setItem(storageKey, JSON.stringify({
                            isTerminated: false,
                            switchCount: newCount,
                            modalDismissed: false,
                            timestamp: Date.now()
                        }));
                    } catch (e) {}
                }
                return newCount;
            }
        });
    }, [isActive, isTerminated, maxAllowedSwitches, sessionType, storageKey]);

    useEffect(() => {
        if (!isActive || isTerminated) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                recordSwitch();
            }
        };

        const handleWindowBlur = () => {
            // Window lost focus (alt-tab or clicking another window)
            recordSwitch();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleWindowBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleWindowBlur);
        };
    }, [isActive, isTerminated, recordSwitch]);

    const dismissWarning = (force: boolean = false) => {
        if (!isTerminated || force) {
            setShowWarningModal(false);
            if (storageKey && typeof window !== "undefined") {
                try {
                    const raw = sessionStorage.getItem(storageKey);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        sessionStorage.setItem(storageKey, JSON.stringify({
                            ...parsed,
                            modalDismissed: true
                        }));
                    }
                } catch (e) {}
            }
        }
    };

    const resetProctor = () => {
        setSwitchCount(0);
        setIsTerminated(false);
        setShowWarningModal(false);
        setTerminationMessage("");
        if (storageKey && typeof window !== "undefined") {
            try {
                sessionStorage.removeItem(storageKey);
            } catch (e) {}
        }
    };

    return {
        switchCount,
        maxAllowedSwitches,
        showWarningModal,
        setShowWarningModal,
        isTerminated,
        terminationMessage,
        dismissWarning,
        resetProctor
    };
}

