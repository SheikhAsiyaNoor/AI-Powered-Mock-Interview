"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

export interface InputboxProp {
    onSend: (message: string) => void;
    onSkip?: () => void;
    disabled?: boolean;
}

const InputBox = ({ onSend, onSkip, disabled }: InputboxProp) => {
    const [input, setInput] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        if (input.trim() && !disabled) {
            onSend(input);
            setInput("");
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 flex gap-3 items-end">
            <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Type your response... (Press Enter to send, Shift+Enter for new line)"
                disabled={disabled}
                className="flex-1 px-4 py-3 rounded-2xl border border-border bg-card text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 min-h-[44px] max-h-[120px] leading-normal"
            />
            <div className="flex gap-2">
                {onSkip && (
                    <Button
                        type="button"
                        onClick={onSkip}
                        disabled={disabled}
                        variant="outline"
                        className="rounded-2xl h-11 px-4 text-xs font-semibold text-amber-600 border-amber-300 hover:bg-amber-50 cursor-pointer"
                    >
                        Skip ⏭️
                    </Button>
                )}
                <Button
                    onClick={handleSend}
                    disabled={disabled || !input.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-11 px-6 font-medium cursor-pointer flex-shrink-0"
                >
                    Send
                </Button>
            </div>

        </div>
    );
};

export default InputBox;
