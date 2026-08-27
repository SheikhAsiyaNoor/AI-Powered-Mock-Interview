"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface VoiceOption {
    name: string;
    lang: string;
    voiceURI: string;
    gender?: "female" | "male";
}

interface UseVoiceInterviewOptions {
    autoSpeak?: boolean;
    initialRate?: number;
}

export function useVoiceInterview(options: UseVoiceInterviewOptions = {}) {
    const { autoSpeak = true, initialRate = 1.0 } = options;

    // TTS (AI Voice) States
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speechRate, setSpeechRate] = useState<number>(initialRate);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
    const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(autoSpeak);
    const [speakingAudioLevel, setSpeakingAudioLevel] = useState(0);

    // STT (Candidate Mic) States
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [isSTTSupported, setIsSTTSupported] = useState(false);
    const [micVolume, setMicVolume] = useState(0);
    const [micError, setMicError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    // Initialize TTS
    useEffect(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            synthRef.current = window.speechSynthesis;

            const updateVoices = () => {
                if (!synthRef.current) return;
                const voices = synthRef.current.getVoices();
                if (voices.length > 0) {
                    const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
                    const list = englishVoices.length > 0 ? englishVoices : voices;
                    setAvailableVoices(list);

                    // Prefer natural-sounding voices
                    const naturalVoice =
                        list.find((v) => v.name.includes("Natural") || v.name.includes("Online") || v.name.includes("Google") || v.name.includes("Samantha")) ||
                        list[0];

                    if (naturalVoice && !selectedVoiceURI) {
                        setSelectedVoiceURI(naturalVoice.voiceURI);
                    }
                }
            };

            updateVoices();
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = updateVoices;
            }
        }

        return () => {
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // Initialize STT
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRec) {
                setIsSTTSupported(true);
                const rec = new SpeechRec();
                rec.continuous = true;
                rec.interimResults = true;
                rec.lang = "en-US";

                rec.onstart = () => {
                    setIsListening(true);
                    setMicError(null);
                };

                rec.onresult = (event: any) => {
                    let interim = "";
                    let final = "";

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const transcriptPart = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            final += transcriptPart + " ";
                        } else {
                            interim += transcriptPart;
                        }
                    }

                    if (final) {
                        setTranscript((prev) => (prev ? `${prev.trim()} ${final.trim()}` : final.trim()));
                    }
                    setInterimTranscript(interim);
                };

                rec.onerror = (event: any) => {
                    console.warn("Speech recognition notice/error:", event.error);
                    if (event.error === "not-allowed") {
                        setMicError("Microphone access denied. Please allow microphone permissions.");
                        setIsListening(false);
                    } else if (event.error === "no-speech") {
                        // Soft error, keep listening
                    } else {
                        setIsListening(false);
                    }
                };

                rec.onend = () => {
                    setIsListening(false);
                    setInterimTranscript("");
                };

                recognitionRef.current = rec;
            }
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {}
            }
            if (micStreamRef.current) {
                micStreamRef.current.getTracks().forEach((t) => t.stop());
            }
            if (audioContextRef.current && audioContextRef.current.state !== "closed") {
                audioContextRef.current.close();
            }
        };
    }, []);

    // AI Speaking simulation audio level pulse
    useEffect(() => {
        let interval: any;
        if (isSpeaking) {
            interval = setInterval(() => {
                setSpeakingAudioLevel(Math.floor(Math.random() * 60) + 40);
            }, 100);
        } else {
            setSpeakingAudioLevel(0);
        }
        return () => clearInterval(interval);
    }, [isSpeaking]);

    // Candidate Mic Audio Visualizer Analyzer
    const startAudioAnalyzer = async () => {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                micStreamRef.current = stream;

                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioCtx();
                audioContextRef.current = audioCtx;

                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 64;
                analyserRef.current = analyser;

                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const updateVolume = () => {
                    if (!analyserRef.current) return;
                    analyserRef.current.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                    }
                    const avg = sum / dataArray.length;
                    setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
                    animationFrameRef.current = requestAnimationFrame(updateVolume);
                };
                updateVolume();
            }
        } catch (e) {
            console.warn("Could not start audio visualizer analyser:", e);
        }
    };

    const stopAudioAnalyzer = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach((track) => {
                try {
                    track.stop();
                    track.enabled = false;
                } catch (e) {}
            });
            micStreamRef.current = null;
        }
        if (audioContextRef.current) {
            try {
                if (audioContextRef.current.state !== "closed") {
                    audioContextRef.current.close().catch(() => {});
                }
            } catch (e) {}
            audioContextRef.current = null;
        }
        analyserRef.current = null;
        setMicVolume(0);
    };

    // TTS Control: Speak text
    const speak = useCallback(
        (text: string, onEnd?: () => void) => {
            if (!synthRef.current || typeof window === "undefined") return;

            // Stop any ongoing speech
            synthRef.current.cancel();

            // Clean text from markdown formatting or tags for cleaner natural speech
            const cleanText = text
                .replace(/```[\s\S]*?```/g, "Code block omitted.")
                .replace(/`([^`]+)`/g, "$1")
                .replace(/[*#_~]/g, "")
                .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
                .trim();

            if (!cleanText) return;

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = speechRate;
            utterance.pitch = 1.0;

            if (selectedVoiceURI && availableVoices.length > 0) {
                const voice = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
                if (voice) utterance.voice = voice;
            }

            utterance.onstart = () => {
                setIsSpeaking(true);
            };

            utterance.onend = () => {
                setIsSpeaking(false);
                if (onEnd) onEnd();
            };

            utterance.onerror = (e) => {
                console.error("Speech synthesis error:", e);
                setIsSpeaking(false);
                if (onEnd) onEnd();
            };

            synthRef.current.speak(utterance);
        },
        [speechRate, selectedVoiceURI, availableVoices]
    );

    const stopSpeaking = useCallback(() => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    }, []);

    // STT Control: Start / Stop listening
    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            setMicError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
            return;
        }

        // If AI is speaking, stop it so mic doesn't catch AI voice
        stopSpeaking();

        try {
            recognitionRef.current.start();
            startAudioAnalyzer();
        } catch (err: any) {
            // Already started or restarting
            console.warn("Recognition start notice:", err);
        }
    }, [stopSpeaking]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {}
            try {
                recognitionRef.current.abort();
            } catch (e) {}
        }
        stopAudioAnalyzer();
        setIsListening(false);
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript("");
        setInterimTranscript("");
    }, []);

    const setManualTranscript = useCallback((text: string) => {
        setTranscript(text);
    }, []);

    return {
        // AI Voice (TTS)
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

        // Candidate Voice (STT)
        isListening,
        transcript,
        interimTranscript,
        micVolume,
        micError,
        isSTTSupported,
        startListening,
        stopListening,
        resetTranscript,
        setManualTranscript,
    };
}

export default useVoiceInterview;
