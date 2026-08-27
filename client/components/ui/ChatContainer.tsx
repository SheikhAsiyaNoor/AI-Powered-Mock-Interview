"use client";

import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { cleanTextForSpeech, playBrowserTTS } from "@/hooks/useVoiceInterview";

export interface Message {
    id: string;
    content: string;
    isUser: boolean;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    timestamp: Date;
}

export interface ChatContainerProps {
    messages: Message[];
    isLoading: boolean;
    onSpeakMessage?: (content: string) => void;
    speakingMessageId?: string | null;
}

const ChatContainer = ({ messages, isLoading, onSpeakMessage, speakingMessageId }: ChatContainerProps) => {
    const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

    const handlePlayVoice = (id: string, text: string) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

        if (currentlyPlayingId === id || speakingMessageId === id) {
            window.speechSynthesis.cancel();
            setCurrentlyPlayingId(null);
            return;
        }

        setCurrentlyPlayingId(id);
        playBrowserTTS(text, () => {
            setCurrentlyPlayingId(null);
        });
    };

    return (
        <div className="space-y-4 max-w-4xl mx-auto px-4 py-6 min-h-[350px]">
            {messages.length === 0 && !isLoading && (
                <div className="flex items-center justify-center min-h-[200px] border border-dashed border-border/60 rounded-2xl p-8 text-center bg-card/40">
                    <p className="text-sm font-medium text-muted-foreground">Start an interview to begin</p>
                </div>
            )}
            {messages.map((message) => {
                const isThisSpeaking = currentlyPlayingId === message.id || speakingMessageId === message.id;

                return (
                    <div
                        key={message.id}
                        className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-2xl p-4 rounded-2xl text-sm leading-relaxed ${
                                message.isUser
                                    ? "bg-blue-600 text-white rounded-br-none shadow-xs"
                                    : "bg-card border border-border/60 text-foreground rounded-bl-none shadow-xs"
                            }`}
                        >
                            <div className="flex items-center justify-between gap-4 mb-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-xs opacity-70">
                                        {message.isUser ? "You" : "AI Interviewer"}
                                    </p>
                                    {!message.isUser && (
                                        <button
                                            type="button"
                                            onClick={() => handlePlayVoice(message.id, message.content)}
                                            className={`p-1 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                                                isThisSpeaking
                                                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 font-bold"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                            }`}
                                            title={isThisSpeaking ? "Stop speech" : "Listen to message"}
                                        >
                                            {isThisSpeaking ? (
                                                <>
                                                    <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                                                    <span className="text-[10px]">Playing</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Volume2 className="w-3.5 h-3.5" />
                                                    <span className="text-[10px]">Listen</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {!message.isUser && message.difficulty && (
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            message.difficulty === "Hard"
                                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300"
                                                : message.difficulty === "Medium"
                                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300"
                                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                                        }`}
                                    >
                                        {message.difficulty}
                                    </span>
                                )}
                            </div>
                            {message.isUser ? (
                                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                            ) : (
                                <MarkdownRenderer content={message.content} />
                            )}
                        </div>
                    </div>
                );
            })}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-card border border-border/60 p-4 rounded-2xl rounded-bl-none text-sm text-muted-foreground flex items-center gap-2 shadow-xs">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p>AI is thinking...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatContainer;
