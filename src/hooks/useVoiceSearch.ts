import { useState, useCallback, useRef, useEffect } from 'react';

interface VoiceSearchOptions {
    onResult: (transcript: string) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
    maxAlternatives?: number;
}

interface VoiceSearchState {
    isListening: boolean;
    isSupported: boolean;
    transcript: string;
    interimTranscript: string;
    error: string | null;
    confidence: number;
}

// Type definitions for Speech Recognition API
interface SpeechRecognitionEvent {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent {
    error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
}

declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}

export function useVoiceSearch({
    onResult,
    onError,
    onStart,
    onEnd,
    language = 'en-US',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
}: VoiceSearchOptions) {
    const [state, setState] = useState<VoiceSearchState>({
        isListening: false,
        isSupported:
            typeof window !== 'undefined' &&
            'webkitSpeechRecognition' in window,
        transcript: '',
        interimTranscript: '',
        error: null,
        confidence: 0,
    });

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Get user-friendly error message
    const getErrorMessage = useCallback(
        (error: string) => {
            switch (error) {
                case 'no-speech':
                    return 'No speech detected. Please try again.';
                case 'audio-capture':
                    return 'Microphone not available. Please check your microphone settings.';
                case 'not-allowed':
                    return 'Microphone access denied. Please allow microphone access and try again.';
                case 'network':
                    return 'Network error. Please check your internet connection.';
                case 'service-not-allowed':
                    return 'Speech recognition service not allowed.';
                case 'bad-grammar':
                    return 'Speech recognition grammar error.';
                case 'language-not-supported':
                    return `Language "${language}" is not supported.`;
                default:
                    return 'Speech recognition error. Please try again.';
            }
        },
        [language]
    );

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current && state.isListening) {
            recognitionRef.current.stop();
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, [state.isListening]);

    // Start listening
    const startListening = useCallback(() => {
        if (
            !state.isSupported ||
            !recognitionRef.current ||
            state.isListening
        ) {
            return;
        }

        try {
            recognitionRef.current.start();

            // Set a timeout to automatically stop listening after 30 seconds
            timeoutRef.current = setTimeout(() => {
                stopListening();
            }, 30000);
        } catch {
            setState((prev) => ({
                ...prev,
                error: 'Failed to start speech recognition',
            }));
            onError?.('Failed to start speech recognition');
        }
    }, [state.isSupported, state.isListening, onError, stopListening]);

    // Initialize speech recognition
    useEffect(() => {
        if (!state.isSupported) return;

        try {
            const SpeechRecognition =
                window.SpeechRecognition || window.webkitSpeechRecognition;

            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                const recognition = recognitionRef.current;

                recognition.continuous = continuous;
                recognition.interimResults = interimResults;
                recognition.lang = language;
                recognition.maxAlternatives = maxAlternatives;

                recognition.onstart = () => {
                    setState((prev) => ({
                        ...prev,
                        isListening: true,
                        error: null,
                        transcript: '',
                        interimTranscript: '',
                    }));
                    onStart?.();
                };

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    let finalTranscript = '';
                    let interimTranscript = '';

                    for (
                        let i = event.resultIndex;
                        i < event.results.length;
                        i++
                    ) {
                        const result = event.results[i];
                        const transcript = result[0].transcript;

                        if (result.isFinal) {
                            finalTranscript += transcript;
                        } else {
                            interimTranscript += transcript;
                        }
                    }

                    setState((prev) => ({
                        ...prev,
                        transcript: finalTranscript,
                        interimTranscript,
                        confidence:
                            event.results[event.results.length - 1]?.[0]
                                ?.confidence || 0,
                    }));

                    if (finalTranscript) {
                        onResult(finalTranscript.trim());
                    }
                };

                recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                    const errorMessage = getErrorMessage(event.error);
                    setState((prev) => ({
                        ...prev,
                        error: errorMessage,
                        isListening: false,
                    }));
                    onError?.(errorMessage);
                };

                recognition.onend = () => {
                    setState((prev) => ({
                        ...prev,
                        isListening: false,
                    }));
                    onEnd?.();
                };
            }
        } catch {
            setState((prev) => ({
                ...prev,
                isSupported: false,
                error: 'Speech recognition not available',
            }));
        }
    }, [
        language,
        continuous,
        interimResults,
        maxAlternatives,
        onResult,
        onError,
        onStart,
        onEnd,
        state.isSupported,
        getErrorMessage,
    ]);

    // Toggle listening
    const toggleListening = useCallback(() => {
        if (state.isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [state.isListening, startListening, stopListening]);

    // Clear error
    const clearError = useCallback(() => {
        setState((prev) => ({ ...prev, error: null }));
    }, []);

    // Reset state
    const reset = useCallback(() => {
        stopListening();
        setState((prev) => ({
            ...prev,
            transcript: '',
            interimTranscript: '',
            error: null,
            confidence: 0,
        }));
    }, [stopListening]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (recognitionRef.current && state.isListening) {
                recognitionRef.current.stop();
            }
        };
    }, [state.isListening]);

    return {
        ...state,
        startListening,
        stopListening,
        toggleListening,
        clearError,
        reset,
    };
}

export default useVoiceSearch;
