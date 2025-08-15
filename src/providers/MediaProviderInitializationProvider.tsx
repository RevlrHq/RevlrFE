'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    MediaProviderInitializer,
    InitializationResult,
    InitializationStatus,
} from '@/lib/services/media/MediaProviderInitializer';
import { ProviderHealthMonitor } from '@/lib/services/media/ProviderHealthMonitor';
import {
    InitializationErrorHandler,
    DetailedInitializationError,
} from '@/lib/services/media/InitializationErrorHandler';

interface MediaProviderInitializationContextType {
    initializationStatus: InitializationStatus;
    initializationResult: InitializationResult | null;
    isInitializing: boolean;
    reinitialize: () => Promise<void>;
    healthMonitor: ProviderHealthMonitor | null;
    detailedErrors: DetailedInitializationError[];
    errorHandler: InitializationErrorHandler | null;
    shouldContinue: boolean;
    recommendations: string[];
}

const MediaProviderInitializationContext =
    createContext<MediaProviderInitializationContextType | null>(null);

export function useMediaProviderInitialization() {
    const context = useContext(MediaProviderInitializationContext);
    if (!context) {
        throw new Error(
            'useMediaProviderInitialization must be used within MediaProviderInitializationProvider'
        );
    }
    return context;
}

interface MediaProviderInitializationProviderProps {
    children: React.ReactNode;
}

export function MediaProviderInitializationProvider({
    children,
}: MediaProviderInitializationProviderProps) {
    const [initializationStatus, setInitializationStatus] =
        useState<InitializationStatus>({
            isInitialized: false,
            availableProviders: [],
            failedProviders: [],
            errors: [],
            warnings: [],
            lastInitialized: null,
            configurationValid: false,
        });
    const [initializationResult, setInitializationResult] =
        useState<InitializationResult | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [healthMonitor, setHealthMonitor] =
        useState<ProviderHealthMonitor | null>(null);
    const [detailedErrors, setDetailedErrors] = useState<
        DetailedInitializationError[]
    >([]);
    const [errorHandler] = useState<InitializationErrorHandler>(() =>
        InitializationErrorHandler.getInstance({
            enableDetailedLogging: process.env.NODE_ENV === 'development',
            continueOnPartialFailure: true,
        })
    );
    const [shouldContinue, setShouldContinue] = useState(true);
    const [recommendations, setRecommendations] = useState<string[]>([]);

    const initializeProviders = async () => {
        if (isInitializing) return;

        setIsInitializing(true);

        try {
            console.log('🚀 Starting media provider initialization...');

            const initializer = MediaProviderInitializer.getInstance();
            const result = await initializer.initialize();

            // Process errors with error handler
            const errorAnalysis =
                errorHandler.processInitializationResult(result);

            setInitializationResult(result);
            setInitializationStatus(initializer.getInitializationStatus());
            setDetailedErrors(errorAnalysis.processedErrors);
            setShouldContinue(errorAnalysis.shouldContinue);
            setRecommendations(errorAnalysis.recommendations);

            // Log initialization results
            if (result.success) {
                console.log('✅ Media provider initialization successful:', {
                    initializedProviders: result.initializedProviders,
                    warnings: result.warnings,
                });

                // Start health monitoring if providers were initialized successfully
                if (
                    result.initializedProviders.length > 0 &&
                    result.healthMonitorStarted
                ) {
                    console.log('🔍 Starting provider health monitoring...');

                    const monitor = new ProviderHealthMonitor();
                    const providerFactory = initializer.getProviderFactory();

                    // Register all initialized providers with the health monitor
                    for (const providerId of result.initializedProviders) {
                        const provider =
                            providerFactory.getProvider(providerId);
                        if (provider) {
                            monitor.registerProvider(provider);
                            console.log(
                                `📊 Registered ${providerId} for health monitoring`
                            );
                        }
                    }

                    // Start monitoring
                    monitor.startMonitoring();
                    setHealthMonitor(monitor);

                    console.log('✅ Provider health monitoring started');
                }
            } else {
                console.error('❌ Media provider initialization failed:', {
                    failedProviders: result.failedProviders,
                    warnings: result.warnings,
                });

                // Log developer-friendly error summary
                const errorSummary =
                    errorHandler.generateDeveloperErrorSummary();
                console.error('📊 Error Summary:', errorSummary);

                // Log whether application should continue
                if (errorAnalysis.shouldContinue) {
                    console.warn(
                        '⚠️ Application will continue with limited functionality'
                    );
                } else {
                    console.error(
                        '🚫 Application cannot continue - critical errors detected'
                    );
                }
            }

            // Log warnings and recommendations
            if (result.warnings.length > 0) {
                console.warn(
                    '⚠️ Media provider initialization warnings:',
                    result.warnings
                );
            }

            if (errorAnalysis.recommendations.length > 0) {
                console.info(
                    '💡 Recommendations:',
                    errorAnalysis.recommendations
                );
            }
        } catch (error) {
            console.error(
                '💥 Critical error during media provider initialization:',
                error
            );

            // Set error state
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Unknown initialization error';

            const criticalResult: InitializationResult = {
                success: false,
                initializedProviders: [],
                failedProviders: [
                    {
                        providerId: 'system',
                        error: errorMessage,
                        reason: 'unknown',
                        canRetry: true,
                    },
                ],
                warnings: [],
                healthMonitorStarted: false,
            };

            // Process the critical error
            const errorAnalysis =
                errorHandler.processInitializationResult(criticalResult);

            setInitializationResult(criticalResult);
            setDetailedErrors(errorAnalysis.processedErrors);
            setShouldContinue(false); // Critical errors should not allow continuation
            setRecommendations(errorAnalysis.recommendations);

            setInitializationStatus({
                isInitialized: false,
                availableProviders: [],
                failedProviders: ['system'],
                errors: [errorMessage],
                warnings: [],
                lastInitialized: null,
                configurationValid: false,
            });
        } finally {
            setIsInitializing(false);
        }
    };

    const reinitialize = async () => {
        console.log('🔄 Reinitializing media providers...');

        // Stop existing health monitoring
        if (healthMonitor) {
            healthMonitor.stopMonitoring();
            setHealthMonitor(null);
        }

        // Reset state
        setInitializationResult(null);
        setDetailedErrors([]);
        setShouldContinue(true);
        setRecommendations([]);
        setInitializationStatus({
            isInitialized: false,
            availableProviders: [],
            failedProviders: [],
            errors: [],
            warnings: [],
            lastInitialized: null,
            configurationValid: false,
        });

        // Reinitialize
        await initializeProviders();
    };

    // Initialize providers on mount
    useEffect(() => {
        initializeProviders();

        // Cleanup function to stop health monitoring
        return () => {
            if (healthMonitor) {
                console.log('🛑 Stopping provider health monitoring...');
                healthMonitor.stopMonitoring();
            }
        };
    }, []);

    const contextValue: MediaProviderInitializationContextType = {
        initializationStatus,
        initializationResult,
        isInitializing,
        reinitialize,
        healthMonitor,
        detailedErrors,
        errorHandler,
        shouldContinue,
        recommendations,
    };

    return (
        <MediaProviderInitializationContext.Provider value={contextValue}>
            {children}
        </MediaProviderInitializationContext.Provider>
    );
}
