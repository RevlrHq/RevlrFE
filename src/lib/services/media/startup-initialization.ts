import {
    MediaProviderInitializer,
    InitializationResult,
} from './MediaProviderInitializer';
import { ProviderHealthMonitor } from './ProviderHealthMonitor';
import { InitializationErrorHandler } from './InitializationErrorHandler';

/**
 * Global initialization state for server-side usage
 */
class StartupInitializationManager {
    private static instance: StartupInitializationManager;
    private isInitialized = false;
    private initializationPromise: Promise<InitializationResult> | null = null;
    private healthMonitor: ProviderHealthMonitor | null = null;

    private constructor() {}

    static getInstance(): StartupInitializationManager {
        if (!StartupInitializationManager.instance) {
            StartupInitializationManager.instance =
                new StartupInitializationManager();
        }
        return StartupInitializationManager.instance;
    }

    /**
     * Initialize media providers for server-side usage
     * This is safe to call multiple times - subsequent calls will return the same promise
     */
    async initializeProviders(): Promise<InitializationResult> {
        // If already initialized, return the cached result
        if (this.isInitialized && this.initializationPromise) {
            return this.initializationPromise;
        }

        // If initialization is in progress, return the existing promise
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        // Start new initialization
        this.initializationPromise = this.performInitialization();

        try {
            const result = await this.initializationPromise;
            this.isInitialized = result.success;
            return result;
        } catch (error) {
            // Reset promise on error so it can be retried
            this.initializationPromise = null;
            throw error;
        }
    }

    private async performInitialization(): Promise<InitializationResult> {
        console.log('🚀 [Server] Starting media provider initialization...');

        try {
            const initializer = MediaProviderInitializer.getInstance();
            const result = await initializer.initialize();

            // Process errors with error handler
            const errorHandler = InitializationErrorHandler.getInstance({
                enableDetailedLogging: process.env.NODE_ENV === 'development',
                continueOnPartialFailure: true,
            });

            const errorAnalysis =
                errorHandler.processInitializationResult(result);

            // Log initialization results
            if (result.success) {
                console.log(
                    '✅ [Server] Media provider initialization successful:',
                    {
                        initializedProviders: result.initializedProviders,
                        warnings: result.warnings,
                    }
                );

                // Start health monitoring for server-side usage
                if (
                    result.initializedProviders.length > 0 &&
                    result.healthMonitorStarted
                ) {
                    console.log(
                        '🔍 [Server] Starting provider health monitoring...'
                    );

                    this.healthMonitor = new ProviderHealthMonitor();
                    const providerFactory = initializer.getProviderFactory();

                    // Register all initialized providers with the health monitor
                    for (const providerId of result.initializedProviders) {
                        const provider =
                            providerFactory.getProvider(providerId);
                        if (provider) {
                            this.healthMonitor.registerProvider(provider);
                            console.log(
                                `📊 [Server] Registered ${providerId} for health monitoring`
                            );
                        }
                    }

                    // Start monitoring
                    this.healthMonitor.startMonitoring();
                    console.log(
                        '✅ [Server] Provider health monitoring started'
                    );
                }
            } else {
                console.debug(
                    '❌ [Server] Media provider initialization failed:',
                    {
                        failedProviders: result.failedProviders,
                        warnings: result.warnings,
                    }
                );

                // Log developer-friendly error summary
                const errorSummary =
                    errorHandler.generateDeveloperErrorSummary();
                console.debug('📊 [Server] Error Summary:', errorSummary);

                // Log whether application should continue
                if (errorAnalysis.shouldContinue) {
                    console.warn(
                        '⚠️ [Server] Application will continue with limited functionality'
                    );
                } else {
                    console.debug(
                        '🚫 [Server] Application cannot continue - critical errors detected'
                    );
                }
            }

            // Log warnings and recommendations
            if (result.warnings.length > 0) {
                console.warn(
                    '⚠️ [Server] Media provider initialization warnings:',
                    result.warnings
                );
            }

            if (errorAnalysis.recommendations.length > 0) {
                console.info(
                    '💡 [Server] Recommendations:',
                    errorAnalysis.recommendations
                );
            }

            return result;
        } catch (error) {
            console.debug(
                '💥 [Server] Critical error during media provider initialization:',
                error
            );

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Unknown initialization error';

            return {
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
        }
    }

    /**
     * Get the current initialization status
     */
    getInitializationStatus(): {
        isInitialized: boolean;
        isInitializing: boolean;
        hasHealthMonitor: boolean;
    } {
        return {
            isInitialized: this.isInitialized,
            isInitializing: !!this.initializationPromise && !this.isInitialized,
            hasHealthMonitor: !!this.healthMonitor,
        };
    }

    /**
     * Get the health monitor instance
     */
    getHealthMonitor(): ProviderHealthMonitor | null {
        return this.healthMonitor;
    }

    /**
     * Force reinitialization
     */
    async reinitialize(): Promise<InitializationResult> {
        console.log('🔄 [Server] Reinitializing media providers...');

        // Stop existing health monitoring
        if (this.healthMonitor) {
            this.healthMonitor.stopMonitoring();
            this.healthMonitor = null;
        }

        // Reset state
        this.isInitialized = false;
        this.initializationPromise = null;

        // Reinitialize
        return this.initializeProviders();
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        if (this.healthMonitor) {
            console.log('🛑 [Server] Stopping provider health monitoring...');
            this.healthMonitor.stopMonitoring();
            this.healthMonitor = null;
        }

        this.isInitialized = false;
        this.initializationPromise = null;
    }
}

/**
 * Initialize media providers for server-side usage
 * Safe to call multiple times - will return cached result after first successful initialization
 */
export async function initializeMediaProvidersOnStartup(): Promise<InitializationResult> {
    const manager = StartupInitializationManager.getInstance();
    return manager.initializeProviders();
}

/**
 * Get the current server-side initialization status
 */
export function getServerInitializationStatus() {
    const manager = StartupInitializationManager.getInstance();
    return manager.getInitializationStatus();
}

/**
 * Get the server-side health monitor instance
 */
export function getServerHealthMonitor(): ProviderHealthMonitor | null {
    const manager = StartupInitializationManager.getInstance();
    return manager.getHealthMonitor();
}

/**
 * Force reinitialization of media providers on server-side
 */
export async function reinitializeMediaProvidersOnServer(): Promise<InitializationResult> {
    const manager = StartupInitializationManager.getInstance();
    return manager.reinitialize();
}

/**
 * Cleanup server-side media provider resources
 * Should be called during application shutdown
 */
export function cleanupServerMediaProviders(): void {
    const manager = StartupInitializationManager.getInstance();
    manager.cleanup();
}

/**
 * Utility function to ensure providers are initialized before API operations
 * Useful for API routes that need media search functionality
 */
export async function ensureProvidersInitialized(): Promise<{
    success: boolean;
    availableProviders: string[];
    errors: string[];
}> {
    try {
        const result = await initializeMediaProvidersOnStartup();

        return {
            success: result.success,
            availableProviders: result.initializedProviders,
            errors: result.failedProviders.map((f) => f.error),
        };
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';

        return {
            success: false,
            availableProviders: [],
            errors: [errorMessage],
        };
    }
}
