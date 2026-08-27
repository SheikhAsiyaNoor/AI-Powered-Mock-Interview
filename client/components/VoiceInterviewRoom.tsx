"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    RotateCcw,
    Send,
    Settings,
    Sparkles,
    ChevronDown,
    Sliders,
    Play,
    Pause,
    Check,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cleanDisplayQuestion, cleanDisplayFeedback } from "@/lib/utils";

interface VoiceInterviewRoomProps {
    currentQuestion: string;
    latestFeedback?: string;
    domain: string;
    difficulty: string;
    questionsAnswered: number;
    totalQuestions: number;
    isLoading: boolean;
    isInterviewComplete: boolean;
    onSendAnswer: (answer: string) => void;
    onSkipQuestion: () => void;
    onSwitchToChat: () => void;
    // useVoiceInterview return values
    isSpeaking: boolean;
    speakingAudioLevel: number;
    speechRate: number;
    setSpeechRate: (r: number) => void;
    availableVoices: SpeechSynthesisVoice[];
    selectedVoiceURI: string;
    setSelectedVoiceURI: (uri: string) => void;
    autoSpeakEnabled: boolean;
    setAutoSpeakEnabled: (v: boolean) => void;
    speak: (text: string, onEnd?: () => void) => void;
    stopSpeaking: () => void;
    isListening: boolean;
    transcript: string;
    interimTranscript: string;
    micVolume: number;
    micError: string | null;
    isSTTSupported: boolean;
    isTTSSupported: boolean;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
    setManualTranscript: (text: string) => void;
}

export const VoiceInterviewRoom: React.FC<VoiceInterviewRoomProps> = ({
    currentQuestion,
    latestFeedback,
    domain,
    difficulty,
    questionsAnswered,
    totalQuestions,
    isLoading,
    isInterviewComplete,
    onSendAnswer,
    onSkipQuestion,
    onSwitchToChat,
    isSpeaking,
    speakingAudioLevel,
    speechRate,
    setSpeechRate,
    availableVoices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    autoSpeakEnabled,
    setAutoSpeakEnabled,
    speak,
    stopSpeaking,
    isListening,
    transcript,
    interimTranscript,
    micVolume,
    micError,
    isSTTSupported,
    isTTSSupported,
    startListening,
    stopListening,
    resetTranscript,
    setManualTranscript,
}) => {
    const sanitizedQuestion = cleanDisplayQuestion(currentQuestion, "Tell me about your technical background and experience with " + domain + ".");
    const sanitizedFeedback = cleanDisplayFeedback(latestFeedback);

    const [showSettings, setShowSettings] = useState(false);
    const [autoListenAfterAI, setAutoListenAfterAI] = useState(false);
    const [isEditingTranscript, setIsEditingTranscript] = useState(false);
    const [activeTab, setActiveTab] = useState<"question" | "feedback">("question");

    // Clean up all audio/speech synthesis ONLY when unmounting voice room
    const stopListeningRef = useRef(stopListening);
    const stopSpeakingRef = useRef(stopSpeaking);
    useEffect(() => {
        stopListeningRef.current = stopListening;
        stopSpeakingRef.current = stopSpeaking;
    });

    useEffect(() => {
        return () => {
            stopListeningRef.current?.();
            stopSpeakingRef.current?.();
        };
    }, []);

    // Coordinated sequential auto-speak: Speaks feedback first (if any), then speaks the next question
    const lastSpokenKeyRef = useRef<string>("");
    useEffect(() => {
        if (isInterviewComplete || !autoSpeakEnabled) return;
        if (!sanitizedQuestion && !sanitizedFeedback) return;

        const currentKey = `${sanitizedFeedback}::${sanitizedQuestion}`;
        if (currentKey === lastSpokenKeyRef.current) return;
        lastSpokenKeyRef.current = currentKey;

        if (sanitizedFeedback) {
            setActiveTab("feedback");
            speak(`Feedback on previous answer: ${sanitizedFeedback}`, () => {
                if (isInterviewComplete) return;
                setActiveTab("question");
                if (sanitizedQuestion) {
                    speak(sanitizedQuestion, () => {
                        if (autoListenAfterAI && !isInterviewComplete) {
                            startListening();
                        }
                    });
                }
            });
        } else if (sanitizedQuestion) {
            setActiveTab("question");
            speak(sanitizedQuestion, () => {
                if (autoListenAfterAI && !isInterviewComplete) {
                    startListening();
                }
            });
        }
    }, [sanitizedQuestion, sanitizedFeedback, autoSpeakEnabled, autoListenAfterAI, speak, startListening, isInterviewComplete]);

    const handleReplayQuestion = () => {
        const textToRead = activeTab === "feedback" && latestFeedback ? latestFeedback : currentQuestion;
        speak(textToRead, () => {
            if (autoListenAfterAI && !isInterviewComplete) {
                startListening();
            }
        });
    };

    const handleToggleMic = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleConfirmSend = () => {
        const fullAnswer = `${transcript} ${interimTranscript}`.trim();
        if (!fullAnswer || isLoading) return;

        stopListening();
        stopSpeaking();
        onSendAnswer(fullAnswer);
        resetTranscript();
    };

    const handleClearAnswer = () => {
        resetTranscript();
    };

    const combinedTranscript = `${transcript} ${interimTranscript}`.trim();

    return (
        <div className="flex flex-col space-y-6 max-w-4xl mx-auto py-2">
            {/* TOP BAR / MODE HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-border shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                        <span className="relative flex h-3.5 w-3.5">
                            <span
                                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                    isSpeaking
                                        ? "bg-indigo-400"
                                        : isListening
                                        ? "bg-emerald-400"
                                        : isLoading
                                        ? "bg-amber-400"
                                        : "bg-blue-400"
                                }`}
                            ></span>
                            <span
                                className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                                    isSpeaking
                                        ? "bg-indigo-600"
                                        : isListening
                                        ? "bg-emerald-500"
                                        : isLoading
                                        ? "bg-amber-500"
                                        : "bg-blue-600"
                                }`}
                            ></span>
                        </span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-foreground">AI Voice Interviewer</h2>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                Speech-to-Speech
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isSpeaking
                                ? "🎙️ AI Interviewer is speaking..."
                                : isListening
                                ? "🟢 Listening to candidate... Speak your answer"
                                : isLoading
                                ? "⚡ AI is evaluating your response..."
                                : "💡 Ready for your voice answer"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSettings(!showSettings)}
                        className={`rounded-xl text-xs font-semibold gap-1.5 cursor-pointer ${
                            showSettings ? "bg-muted text-foreground border-blue-500" : "text-muted-foreground"
                        }`}
                        title="Voice & Speech Settings"
                    >
                        <Settings className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Voice Settings</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onSwitchToChat}
                        className="rounded-xl text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Switch to Text Chat"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Text Mode</span>
                    </Button>
                </div>
            </div>

            {/* VOICE SETTINGS PANEL (Collapsible) */}
            {showSettings && (
                <Card className="p-5 border border-border/80 bg-card rounded-3xl space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                            <Sliders className="w-3.5 h-3.5 text-blue-600" />
                            Voice & Audio Configurations
                        </h3>
                        <span className="text-[10px] text-muted-foreground font-medium">Neural Web Speech Engine</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Voice Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-muted-foreground">Interviewer Voice</label>
                            <select
                                value={selectedVoiceURI}
                                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                                className="w-full text-xs rounded-xl border border-border bg-background p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                {availableVoices.map((voice) => (
                                    <option key={voice.voiceURI} value={voice.voiceURI}>
                                        {voice.name} ({voice.lang})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Speech Rate Controls */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-muted-foreground">Speech Speed</label>
                            <div className="flex items-center gap-1.5">
                                {[0.85, 1.0, 1.15].map((rate) => (
                                    <button
                                        key={rate}
                                        onClick={() => setSpeechRate(rate)}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                            speechRate === rate
                                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                                : "border-border bg-background text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        {rate}x
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Auto-Actions */}
                        <div className="space-y-1.5 flex flex-col justify-center">
                            <label className="text-[11px] font-semibold text-muted-foreground">Conversational Behavior</label>
                            <div className="flex items-center justify-between text-xs pt-1">
                                <span className="text-muted-foreground text-[11px]">Auto-Listen after AI</span>
                                <input
                                    type="checkbox"
                                    checked={autoListenAfterAI}
                                    onChange={(e) => setAutoListenAfterAI(e.target.checked)}
                                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground text-[11px]">Auto-Speak questions</span>
                                <input
                                    type="checkbox"
                                    checked={autoSpeakEnabled}
                                    onChange={(e) => setAutoSpeakEnabled(e.target.checked)}
                                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* MAIN VOICE INTERACTION STAGE */}
            <Card className="p-8 border border-border/80 bg-gradient-to-b from-card to-card/60 rounded-3xl shadow-md relative overflow-hidden flex flex-col items-center justify-center min-h-[380px] space-y-6">
                {/* Background ambient lighting effects */}
                <div
                    className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 transition-all duration-700 pointer-events-none ${
                        isSpeaking ? "bg-indigo-600 scale-125" : isListening ? "bg-emerald-600 scale-125" : "bg-blue-600"
                    }`}
                />
                <div
                    className={`absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 transition-all duration-700 pointer-events-none ${
                        isSpeaking ? "bg-purple-600 scale-125" : isListening ? "bg-teal-600 scale-125" : "bg-blue-500"
                    }`}
                />

                {/* AI INTERVIEWER AVATAR ORB */}
                <div className="relative flex items-center justify-center my-2">
                    {/* Concentric Speaking Waves */}
                    {isSpeaking && (
                        <>
                            <div className="absolute w-36 h-36 rounded-full bg-indigo-500/20 animate-ping opacity-60 pointer-events-none" />
                            <div className="absolute w-48 h-48 rounded-full bg-blue-500/15 animate-pulse opacity-40 pointer-events-none" />
                        </>
                    )}

                    {isListening && (
                        <>
                            <div
                                className="absolute rounded-full bg-emerald-500/20 animate-ping opacity-50 pointer-events-none"
                                style={{
                                    width: `${Math.max(120, 110 + micVolume * 0.8)}px`,
                                    height: `${Math.max(120, 110 + micVolume * 0.8)}px`,
                                }}
                            />
                        </>
                    )}

                    {/* Central Glowing Orb */}
                    <div
                        className={`w-28 h-28 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-500 relative z-10 ${
                            isSpeaking
                                ? "bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 shadow-indigo-500/40 scale-105"
                                : isListening
                                ? "bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 shadow-emerald-500/40 scale-105"
                                : isLoading
                                ? "bg-gradient-to-tr from-amber-500 to-orange-600 shadow-amber-500/30 animate-pulse"
                                : "bg-gradient-to-tr from-blue-600 to-indigo-700 shadow-blue-500/30 hover:scale-105"
                        }`}
                    >
                        {isSpeaking ? (
                            <Volume2 className="w-10 h-10 animate-bounce text-white" />
                        ) : isListening ? (
                            <Mic className="w-10 h-10 animate-pulse text-white" />
                        ) : isLoading ? (
                            <Sparkles className="w-10 h-10 animate-spin text-white" />
                        ) : (
                            <Volume2 className="w-10 h-10 text-white/90" />
                        )}
                        <span className="text-[10px] font-bold mt-1 tracking-wider uppercase opacity-90">
                            {isSpeaking ? "Speaking" : isListening ? "Listening" : isLoading ? "Thinking" : "AI Ready"}
                        </span>
                    </div>
                </div>

                {/* LIVE DYNAMIC AUDIO FREQUENCY WAVEFORM */}
                <div className="flex items-center justify-center gap-1.5 h-10 px-6 py-2 rounded-2xl bg-muted/40 border border-border/40 min-w-[240px]">
                    {Array.from({ length: 16 }).map((_, i) => {
                        let barHeight = 6;
                        if (isSpeaking) {
                            barHeight = Math.max(8, Math.min(32, Math.sin(i + speakingAudioLevel * 0.1) * 20 + 16));
                        } else if (isListening) {
                            barHeight = Math.max(6, Math.min(32, (micVolume / 100) * 32 * (0.4 + Math.sin(i * 1.5) * 0.6)));
                        }

                        return (
                            <div
                                key={i}
                                className={`w-1.5 rounded-full transition-all duration-100 ${
                                    isSpeaking
                                        ? "bg-indigo-500"
                                        : isListening
                                        ? "bg-emerald-500"
                                        : "bg-muted-foreground/30"
                                }`}
                                style={{ height: `${barHeight}px` }}
                            />
                        );
                    })}
                </div>

                {/* QUESTION / FEEDBACK TEXT DISPLAY */}
                <div className="w-full max-w-2xl text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-muted text-foreground border border-border/60">
                            {domain} · Q{questionsAnswered + 1}/{totalQuestions}
                        </span>
                        <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                difficulty === "Hard"
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300"
                                    : difficulty === "Medium"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                            }`}
                        >
                            {difficulty}
                        </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-foreground leading-relaxed px-4">
                        "{sanitizedQuestion}"
                    </h3>

                    {sanitizedFeedback && (
                        <div className="mt-3 p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 text-left max-w-xl mx-auto">
                            <span className="font-bold flex items-center gap-1.5 mb-1">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> AI Feedback on Previous Answer:
                            </span>
                            <p>{sanitizedFeedback}</p>
                        </div>
                    )}
                </div>

                {/* CANDIDATE VOICE TRANSCRIPTION DISPLAY AREA */}
                <div className="w-full max-w-2xl">
                    <div className="p-4 rounded-2xl border border-border/80 bg-background/80 backdrop-blur-xs space-y-2 text-left">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isListening ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"}`} />
                                Your Spoken Response:
                            </span>
                            {combinedTranscript && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleClearAnswer}
                                        className="text-[11px] text-muted-foreground hover:text-rose-500 transition cursor-pointer"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>

                        {combinedTranscript ? (
                            <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap">
                                {transcript} <span className="text-muted-foreground italic">{interimTranscript}</span>
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground/70 italic">
                                {isListening
                                    ? "Start speaking now... Your voice will appear here in real-time."
                                    : "Press the microphone below to start speaking your answer."}
                            </p>
                        )}

                        {micError && (
                            <p className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-900">
                                ⚠️ {micError}
                            </p>
                        )}
                    </div>
                </div>

                {/* VOICE CONTROLS BAR */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {/* Replay Question Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReplayQuestion}
                        disabled={isLoading}
                        className="rounded-full h-11 px-4 text-xs font-semibold border-border/80 hover:bg-muted text-foreground cursor-pointer gap-2"
                        title="Listen to question again"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                        Listen Again
                    </Button>

                    {/* Mic Toggle Button */}
                    <Button
                        onClick={handleToggleMic}
                        disabled={isLoading}
                        className={`rounded-full h-12 px-6 font-bold text-xs gap-2 transition-all cursor-pointer shadow-md ${
                            isListening
                                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25 animate-pulse"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25"
                        }`}
                    >
                        {isListening ? (
                            <>
                                <MicOff className="w-4 h-4" /> Stop Recording
                            </>
                        ) : (
                            <>
                                <Mic className="w-4 h-4" /> Speak Answer 🎙️
                            </>
                        )}
                    </Button>

                    {/* Send / Submit Voice Answer */}
                    <Button
                        onClick={handleConfirmSend}
                        disabled={isLoading || !combinedTranscript.trim()}
                        className="rounded-full h-11 px-6 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 cursor-pointer gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Evaluating...
                            </>
                        ) : (
                            <>
                                <Send className="w-3.5 h-3.5" /> Submit Voice Answer
                            </>
                        )}
                    </Button>

                    {/* Skip Question Button */}
                    {onSkipQuestion && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onSkipQuestion}
                            disabled={isLoading}
                            className="rounded-full h-11 px-4 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                        >
                            Skip ⏭️
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default VoiceInterviewRoom;
