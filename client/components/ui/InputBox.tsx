"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

export interface InputboxProp {
    onSend: (message: string) => void;
    onSkip?: () => void;
    disabled?: boolean;
}

const InputBox = ({ onSend, onSkip, disabled }: InputboxProp) => {
    const [input, setInput] = useState("");
    const [isListening, setIsListening] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRec) {
                const rec = new SpeechRec();
                rec.continuous = true;
                rec.interimResults = true;
                rec.lang = "en-US";

                rec.onresult = (event: any) => {
                    let transcript = "";
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        transcript += event.results[i][0].transcript;
                    }
                    if (transcript.trim()) {
                        setInput((prev) => (prev ? `${prev} ${transcript}`.trim() : transcript.trim()));
                        if (textareaRef.current) {
                            textareaRef.current.style.height = "auto";
                            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
                        }
                    }
                };

                rec.onerror = () => {
                    setIsListening(false);
                };

                rec.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current = rec;
            }
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {}
            }
        };
    }, []);

    const toggleDictation = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.warn(err);
            }
        }
    };

    const handleSend = () => {
        if (input.trim() && !disabled) {
            if (isListening && recognitionRef.current) {
                recognitionRef.current.stop();
                setIsListening(false);
            }
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
        <div className="max-w-4xl mx-auto p-4 flex gap-2.5 items-end">
            <div className="relative flex-1">
                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Type or dictate your response... (Press Enter to send, Shift+Enter for new line)"
                    disabled={disabled}
                    className="w-full px-4 py-3 pr-12 rounded-2xl border border-border bg-card text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 min-h-[44px] max-h-[120px] leading-normal"
                />

                {/* Voice Dictation Button in Input Box */}
                <button
                    type="button"
                    onClick={toggleDictation}
                    disabled={disabled}
                    title={isListening ? "Stop listening" : "Click to speak your answer"}
                    className={`absolute right-3 bottom-2.5 p-1.5 rounded-xl transition-all cursor-pointer ${
                        isListening
                            ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
            </div>

            <div className="flex gap-2">
                {onSkip && (
                    <Button
                        type="button"
                        onClick={onSkip}
                        disabled={disabled}
                        variant="outline"
                        className="rounded-2xl h-11 px-4 text-xs font-semibold text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-amber-950/50 cursor-pointer"
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
