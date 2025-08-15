import { MediaProvider } from './MediaProvider';
import { ProviderStatus, MediaProviderErrorType } from '@/types/media-search';

export interface HealthCheckResult {
    providerId: string;
    isHealthy: boolean;
    responseTime: number;
    error?: string;
    timestamp: number;
}

export interface ProviderHealthMetrics {
    providerId: string;
    uptime: number; // percentage
    averageResponseTime: number;
    errorRate: number; // percentage
    lastError?: string;
    lastSuccessfulCheck: number;
    consecutiveFailures: number;
}

/**
 * Monitors provider health and provides automatic failover capabilities
 */
export class ProviderHealthMonitor {
    private providers: Map<string, MediaProvider> = new Map();
    private healthHistory: Map<string, HealthCheckResult[]> = new Map();
    private monitoringInterval?: NodeJS.Timeout;
    private readonly maxHistorySize = 100;
    private readonly checkInterval = 5 * 60 * 1000; // 5 minutes
    private readonly healthThreshold = 0.8; // 80% success rate required

    constructor(checkIntervalMs?: number) {
        if (checkIntervalMs) {
            this.checkInterval = checkIntervalMs;
        }
    }

    /**
     * Register a provider for health monitoring
     */
    registerProvider(provider: MediaProvider): void {
        this.providers.set(provider.id, provider);
        this.healthHistory.set(provider.id, []);
    }

    /**
     * Unregister a provider from health monitoring
     */
    unregisterProvider(providerId: string): void {
        this.providers.delete(providerId);
        this.healthHistory.delete(providerId);
    }

    /**
     * Start automatic health monitoring
     */
    startMonitoring(): void {
        if (this.monitoringInterval) {
            return; // Already monitoring
        }

        this.monitoringInterval = setInterval(() => {
            this.performHealthChecks();
        }, this.checkInterval);

        // Perform initial health check
        this.performHealthChecks();
    }

    /**
     * Stop automatic health monitoring
     */
    stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
    }

    /**
     * Perform health checks on all registered providers
     */
    async performHealthChecks(): Promise<HealthCheckResult[]> {
        const results: HealthCheckResult[] = [];

        for (const [providerId, provider] of this.providers) {
            const result = await this.checkProviderHealth(provider);
            results.push(result);
            this.recordHealthResult(providerId, result);
        }

        return results;
    }

    /**
     * Check health of a specific provider
     */
    async checkProviderHealth(
        provider: MediaProvider
    ): Promise<HealthCheckResult> {
        const startTime = Date.now();

        try {
            // Use the provider's built-in health check if available
            let isHealthy: boolean;

            if (typeof (provider as any).checkHealth === 'function') {
                isHealthy = await (provider as any).checkHealth();
            } else {
                // Fallback to basic health check
                isHealthy = provider.isHealthy();
            }

            const responseTime = Date.now() - startTime;

            return {
                providerId: provider.id,
                isHealthy,
                responseTime,
                timestamp: Date.now(),
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;

            return {
                providerId: provider.id,
                isHealthy: false,
                responseTime,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now(),
            };
        }
    }

    /**
     * Get health metrics for a provider
     */
    getProviderMetrics(providerId: string): ProviderHealthMetrics | null {
        const history = this.healthHistory.get(providerId);
        if (!history || history.length === 0) {
            return null;
        }

        const recentHistory = history.slice(-50); // Last 50 checks
        const successfulChecks = recentHistory.filter(
            (check) => check.isHealthy
        );
        const failedChecks = recentHistory.filter((check) => !check.isHealthy);

        const uptime = (successfulChecks.length / recentHistory.length) * 100;
        const averageResponseTime =
            recentHistory.reduce((sum, check) => sum + check.responseTime, 0) /
            recentHistory.length;
        const errorRate = (failedChecks.length / recentHistory.length) * 100;

        // Count consecutive failures from the end
        let consecutiveFailures = 0;
        for (let i = recentHistory.length - 1; i >= 0; i--) {
            if (!recentHistory[i].isHealthy) {
                consecutiveFailures++;
            } else {
                break;
            }
        }

        const lastSuccessfulCheck =
            successfulChecks.length > 0
                ? Math.max(...successfulChecks.map((check) => check.timestamp))
                : 0;

        const lastError =
            failedChecks.length > 0
                ? failedChecks[failedChecks.length - 1].error
                : undefined;

        return {
            providerId,
            uptime,
            averageResponseTime,
            errorRate,
            lastError,
            lastSuccessfulCheck,
            consecutiveFailures,
        };
    }

    /**
     * Get all provider metrics
     */
    getAllProviderMetrics(): ProviderHealthMetrics[] {
        const metrics: ProviderHealthMetrics[] = [];

        for (const providerId of this.providers.keys()) {
            const providerMetrics = this.getProviderMetrics(providerId);
            if (providerMetrics) {
                metrics.push(providerMetrics);
            }
        }

        return metrics;
    }

    /**
     * Get healthy providers based on metrics
     */
    getHealthyProviders(): MediaProvider[] {
        const healthyProviders: MediaProvider[] = [];

        for (const [providerId, provider] of this.providers) {
            const metrics = this.getProviderMetrics(providerId);

            if (!metrics) {
                // No metrics yet, assume healthy if provider says so
                if (provider.isHealthy()) {
                    healthyProviders.push(provider);
                }
                continue;
            }

            // Consider healthy if:
            // 1. Uptime is above threshold
            // 2. Not too many consecutive failures
            // 3. Provider's own health check passes
            const isHealthyByMetrics =
                metrics.uptime >= this.healthThreshold * 100 &&
                metrics.consecutiveFailures < 3;

            if (isHealthyByMetrics && provider.isHealthy()) {
                healthyProviders.push(provider);
            }
        }

        return healthyProviders;
    }

    /**
     * Get providers sorted by health score
     */
    getProvidersByHealthScore(): { provider: MediaProvider; score: number }[] {
        const providerScores: { provider: MediaProvider; score: number }[] = [];

        for (const [providerId, provider] of this.providers) {
            const metrics = this.getProviderMetrics(providerId);
            let score = 0;

            if (metrics) {
                // Calculate health score (0-100)
                score =
                    metrics.uptime * 0.4 + // 40% weight for uptime
                    Math.max(0, 100 - metrics.errorRate) * 0.3 + // 30% weight for low error rate
                    Math.max(0, 100 - metrics.averageResponseTime / 10) * 0.2 + // 20% weight for response time
                    (metrics.consecutiveFailures === 0 ? 10 : 0); // 10% bonus for no recent failures
            } else if (provider.isHealthy()) {
                score = 50; // Default score for providers without metrics
            }

            providerScores.push({ provider, score });
        }

        return providerScores.sort((a, b) => b.score - a.score);
    }

    /**
     * Get failover recommendations
     */
    getFailoverRecommendations(): {
        unhealthyProviders: string[];
        recommendedProviders: string[];
        actions: string[];
    } {
        const allMetrics = this.getAllProviderMetrics();
        const unhealthyProviders: string[] = [];
        const recommendedProviders: string[] = [];
        const actions: string[] = [];

        for (const metrics of allMetrics) {
            if (metrics.uptime < this.healthThreshold * 100) {
                unhealthyProviders.push(metrics.providerId);

                if (metrics.consecutiveFailures >= 5) {
                    actions.push(
                        `Consider temporarily disabling ${metrics.providerId} due to consecutive failures`
                    );
                } else if (metrics.errorRate > 50) {
                    actions.push(
                        `Monitor ${metrics.providerId} closely - high error rate detected`
                    );
                }
            } else {
                recommendedProviders.push(metrics.providerId);
            }
        }

        if (recommendedProviders.length === 0) {
            actions.push(
                'WARNING: No healthy providers available - check API keys and network connectivity'
            );
        } else if (recommendedProviders.length === 1) {
            actions.push(
                'WARNING: Only one healthy provider available - consider checking other providers'
            );
        }

        return {
            unhealthyProviders,
            recommendedProviders,
            actions,
        };
    }

    /**
     * Record a health check result
     */
    private recordHealthResult(
        providerId: string,
        result: HealthCheckResult
    ): void {
        const history = this.healthHistory.get(providerId) || [];

        history.push(result);

        // Keep only the most recent results
        if (history.length > this.maxHistorySize) {
            history.splice(0, history.length - this.maxHistorySize);
        }

        this.healthHistory.set(providerId, history);
    }

    /**
     * Clear health history for a provider
     */
    clearProviderHistory(providerId: string): void {
        this.healthHistory.set(providerId, []);
    }

    /**
     * Clear all health history
     */
    clearAllHistory(): void {
        for (const providerId of this.healthHistory.keys()) {
            this.healthHistory.set(providerId, []);
        }
    }

    /**
     * Export health data for analysis
     */
    exportHealthData(): {
        providers: string[];
        metrics: ProviderHealthMetrics[];
        history: Record<string, HealthCheckResult[]>;
        timestamp: number;
    } {
        const providers = Array.from(this.providers.keys());
        const metrics = this.getAllProviderMetrics();
        const history: Record<string, HealthCheckResult[]> = {};

        for (const [providerId, results] of this.healthHistory) {
            history[providerId] = [...results]; // Create a copy
        }

        return {
            providers,
            metrics,
            history,
            timestamp: Date.now(),
        };
    }

    /**
     * Get monitoring status
     */
    getMonitoringStatus(): {
        isMonitoring: boolean;
        checkInterval: number;
        registeredProviders: number;
        lastCheckTime?: number;
    } {
        const lastCheckTimes = Array.from(this.healthHistory.values())
            .flat()
            .map((result) => result.timestamp);

        const lastCheckTime =
            lastCheckTimes.length > 0 ? Math.max(...lastCheckTimes) : undefined;

        return {
            isMonitoring: !!this.monitoringInterval,
            checkInterval: this.checkInterval,
            registeredProviders: this.providers.size,
            lastCheckTime,
        };
    }
}
