"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseTabSwitchProctorOptions {
    maxAllowedSwitches?: number; // default 4
    isActive?: boolean; // whether proctoring is enabled
    onAutoQuit?: (finalCount: number) => void; // callback when max switches reached
    sessionType?: "test" | "contest" | "challenge" | "interview";
}

export function useTabSwitchProctor({
    maxAllowedSwitches = 4,
    isActive = true,
    onAutoQuit,
    sessionType = "challenge"
}: UseTabSwitchProctorOptions) {
    const [switchCount, setSwitchCount] = useState<number>(0);
    const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
    const [isTerminated, setIsTerminated] = useState<boolean>(false);
    const [terminationMessage, setTerminationMessage] = useState<string>("");

    const lastTriggerTimeRef = useRef<number>(0);
    const onAutoQuitRef = useRef(onAutoQuit);
    onAutoQuitRef.current = onAutoQuit;

    const recordSwitch = useCallback(() => {
        if (!isActive || isTerminated) return;

        const now = Date.now();
        // Debounce within 2 seconds to avoid double-counting visibilitychange + window blur
        if (now - lastTriggerTimeRef.current < 2000) return;
        lastTriggerTimeRef.current = now;

        setSwitchCount((prev) => {
            const newCount = prev + 1;

            if (newCount >= maxAllowedSwitches) {
                setIsTerminated(true);
                setShowWarningModal(true);
                setTerminationMessage(
                    `Session Auto-Ended: You switched tabs ${newCount} times. As per anti-cheating rules, your ${sessionType} has been terminated and auto-submitted.`
                );
                if (onAutoQuitRef.current) {
                    onAutoQuitRef.current(newCount);
                }
                return newCount;
            } else {
                setShowWarningModal(true);
                return newCount;
            }
        });
    }, [isActive, isTerminated, maxAllowedSwitches, sessionType]);

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

    const dismissWarning = () => {
        if (!isTerminated) {
            setShowWarningModal(false);
        }
    };

    return {
        switchCount,
        maxAllowedSwitches,
        showWarningModal,
        isTerminated,
        terminationMessage,
        dismissWarning
    };
}
