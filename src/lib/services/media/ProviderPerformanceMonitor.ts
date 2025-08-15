/**
 * ProviderPerformanceMonitor - Monitors and tracks performance metrics for media providers
 * Includes response time tracking, success rates, error monitoring, and health checks
 */

import MediaAnalyticsService from './MediaAnalyticsService';

export interface ProviderHealthStatus {
    providerId: string;
    isHealthy: boolean;
    responseTime: number;
    successRate: number;
    errorRate: number;
    lastError?: string;
    lastErrorTime?: number;
    consecutiveFailures: number;
    lastHealthCheck: number;
}

export interface ProviderMetrics {
    providerId: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    errorTypes: Record<string, number>;
    lastUpdated: number;
}

export interface AlertConfig {
    responseTimeThreshold: number; // ms
    errorRateThreshold: number; // percentage
    consecutiveFailureThreshold: number;
    enabled: boolean;
}

class ProviderPerformanceMonitor {
    private static instance: ProviderPerformanceMonitor;
    private providerMetrics: Map<string, ProviderMetrics> = new Map();
    private providerHealth: Map<string, ProviderHealthStatus> = new Map();
    private analytics: MediaAnalyticsService;
    private alertConfig: AlertConfig = {
        responseTimeThreshold: 5000, // 5 seconds
        errorRateThreshold: 10, // 10%
        consecutiveFailureThreshold: 3,
        enabled: true,
    };

    private constructor() {
        this.analytics = MediaAnalyticsService.getInstance();
        this.startHealthCheckInterval();
    }

    static getInstance(): ProviderPerformanceMonitor {
        if (!ProviderPerformanceMonitor.instance) {
            ProviderPerformanceMonitor.instance =
                new ProviderPerformanceMonitor();
        }
        return ProviderPerformanceMonitor.instance;
    }

    /**
     * Record a provider request and its performance metrics
     */
    recordProviderRequest(
        providerId: string,
        endpoint: string,
        startTime: number,
        endTime: number,
        success: boolean,
        errorType?: string,
        resultCount?: number
    ): void {
        const responseTime = endTime - startTime;

        // Update metrics
        this.updateProviderMetrics(
            providerId,
            responseTime,
            success,
            errorType
        );

        // Update health status
        this.updateProviderHealth(providerId, responseTime, success, errorType);

        // Track in analytics
        this.analytics.trackProviderPerformance({
            providerId,
            responseTime,
            success,
            errorType,
            resultCount,
            endpoint,
        });

        // Check for alerts
        if (this.alertConfig.enabled) {
            this.checkForAlerts(providerId);
        }
    }

    /**
     * Get current health status for a provider
     */
    getProviderHealth(providerId: string): ProviderHealthStatus | null {
        return this.providerHealth.get(providerId) || null;
    }

    /**
     * Get performance metrics for a provider
     */
    getProviderMetrics(providerId: string): ProviderMetrics | null {
        return this.providerMetrics.get(providerId) || null;
    }

    /**
     * Get health status for all providers
     */
    getAllProviderHealth(): ProviderHealthStatus[] {
        return Array.from(this.providerHealth.values());
    }

    /**
     * Get metrics for all providers
     */
    getAllProviderMetrics(): ProviderMetrics[] {
        return Array.from(this.providerMetrics.values());
    }

    /**
     * Get providers sorted by performance
     */
    getProvidersByPerformance(): ProviderHealthStatus[] {
        return this.getAllProviderHealth().sort((a, b) => {
            // Sort by health first, then by response time
            if (a.isHealthy !== b.isHealthy) {
                return a.isHealthy ? -1 : 1;
            }
            return a.responseTime - b.responseTime;
        });
    }

    /**
     * Check if a provider is currently healthy
     */
    isProviderHealthy(providerId: string): boolean {
        const health = this.getProviderHealth(providerId);
        return health?.isHealthy ?? true; // Default to healthy if no data
    }

    /**
     * Get the best performing providers
     */
    getBestProviders(limit: number = 3): string[] {
        return this.getProvidersByPerformance()
            .filter((p) => p.isHealthy)
            .slice(0, limit)
            .map((p) => p.providerId);
    }

    /**
     * Reset metrics for a provider (useful for testing or after maintenance)
     */
    resetProviderMetrics(providerId: string): void {
        this.providerMetrics.delete(providerId);
        this.providerHealth.delete(providerId);
    }

    /**
     * Configure alert thresholds
     */
    configureAlerts(config: Partial<AlertConfig>): void {
        this.alertConfig = { ...this.alertConfig, ...config };
    }

    /**
     * Get performance summary for monitoring dashboard
     */
    getPerformanceSummary(): {
        totalProviders: number;
        healthyProviders: number;
        averageResponseTime: number;
        totalRequests: number;
        overallSuccessRate: number;
        alerts: string[];
    } {
        const allMetrics = this.getAllProviderMetrics();
        const allHealth = this.getAllProviderHealth();

        const totalRequests = allMetrics.reduce(
            (sum, m) => sum + m.totalRequests,
            0
        );
        const successfulRequests = allMetrics.reduce(
            (sum, m) => sum + m.successfulRequests,
            0
        );
        const totalResponseTime = allMetrics.reduce(
            (sum, m) => sum + m.averageResponseTime * m.totalRequests,
            0
        );

        const alerts = this.getActiveAlerts();

        return {
            totalProviders: allHealth.length,
            healthyProviders: allHealth.filter((h) => h.isHealthy).length,
            averageResponseTime:
                totalRequests > 0 ? totalResponseTime / totalRequests : 0,
            totalRequests,
            overallSuccessRate:
                totalRequests > 0
                    ? (successfulRequests / totalRequests) * 100
                    : 100,
            alerts,
        };
    }

    // Private methods

    private updateProviderMetrics(
        providerId: string,
        responseTime: number,
        success: boolean,
        errorType?: string
    ): void {
        const existing = this.providerMetrics.get(providerId) || {
            providerId,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            errorTypes: {},
            lastUpdated: Date.now(),
        };

        existing.totalRequests++;
        if (success) {
            existing.successfulRequests++;
        } else {
            existing.failedRequests++;
            if (errorType) {
                existing.errorTypes[errorType] =
                    (existing.errorTypes[errorType] || 0) + 1;
            }
        }

        // Update response time metrics
        existing.minResponseTime = Math.min(
            existing.minResponseTime,
            responseTime
        );
        existing.maxResponseTime = Math.max(
            existing.maxResponseTime,
            responseTime
        );
        existing.averageResponseTime =
            (existing.averageResponseTime * (existing.totalRequests - 1) +
                responseTime) /
            existing.totalRequests;
        existing.lastUpdated = Date.now();

        this.providerMetrics.set(providerId, existing);
    }

    private updateProviderHealth(
        providerId: string,
        responseTime: number,
        success: boolean,
        errorType?: string
    ): void {
        const existing = this.providerHealth.get(providerId) || {
            providerId,
            isHealthy: true,
            responseTime: 0,
            successRate: 100,
            errorRate: 0,
            consecutiveFailures: 0,
            lastHealthCheck: Date.now(),
        };

        // Update response time (rolling average)
        existing.responseTime =
            existing.responseTime * 0.8 + responseTime * 0.2;

        if (success) {
            existing.consecutiveFailures = 0;
        } else {
            existing.consecutiveFailures++;
            existing.lastError = errorType || 'Unknown error';
            existing.lastErrorTime = Date.now();
        }

        // Calculate success and error rates from metrics
        const metrics = this.getProviderMetrics(providerId);
        if (metrics) {
            existing.successRate =
                (metrics.successfulRequests / metrics.totalRequests) * 100;
            existing.errorRate =
                (metrics.failedRequests / metrics.totalRequests) * 100;
        }

        // Determine health status
        existing.isHealthy = this.calculateHealthStatus(existing);
        existing.lastHealthCheck = Date.now();

        this.providerHealth.set(providerId, existing);
    }

    private calculateHealthStatus(health: ProviderHealthStatus): boolean {
        // Provider is unhealthy if:
        // 1. Response time is too high
        // 2. Error rate is too high
        // 3. Too many consecutive failures

        if (health.responseTime > this.alertConfig.responseTimeThreshold) {
            return false;
        }

        if (health.errorRate > this.alertConfig.errorRateThreshold) {
            return false;
        }

        if (
            health.consecutiveFailures >=
            this.alertConfig.consecutiveFailureThreshold
        ) {
            return false;
        }

        return true;
    }

    private checkForAlerts(providerId: string): void {
        const health = this.getProviderHealth(providerId);
        if (!health) return;

        const alerts: string[] = [];

        if (health.responseTime > this.alertConfig.responseTimeThreshold) {
            alerts.push(
                `High response time: ${Math.round(health.responseTime)}ms`
            );
        }

        if (health.errorRate > this.alertConfig.errorRateThreshold) {
            alerts.push(`High error rate: ${Math.round(health.errorRate)}%`);
        }

        if (
            health.consecutiveFailures >=
            this.alertConfig.consecutiveFailureThreshold
        ) {
            alerts.push(`${health.consecutiveFailures} consecutive failures`);
        }

        if (alerts.length > 0) {
            this.triggerAlert(providerId, alerts);
        }
    }

    private triggerAlert(providerId: string, alerts: string[]): void {
        console.warn(`🚨 Provider Alert [${providerId}]:`, alerts);

        // In a real implementation, this would send alerts to monitoring systems
        // For now, we'll track it in analytics
        this.analytics.trackUsageEvent({
            eventType: 'modal_opened', // Using existing event type for now
            metadata: {
                alertType: 'provider_performance',
                providerId,
                alerts,
            },
        });
    }

    private getActiveAlerts(): string[] {
        const alerts: string[] = [];

        this.getAllProviderHealth().forEach((health) => {
            if (!health.isHealthy) {
                alerts.push(
                    `${health.providerId}: Performance issues detected`
                );
            }
        });

        return alerts;
    }

    private startHealthCheckInterval(): void {
        // Perform health checks every 5 minutes
        setInterval(
            () => {
                this.performHealthChecks();
            },
            5 * 60 * 1000
        );
    }

    private performHealthChecks(): void {
        // Clean up old metrics (older than 1 hour)
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        for (const [providerId, metrics] of this.providerMetrics.entries()) {
            if (metrics.lastUpdated < oneHourAgo) {
                // Reset metrics for inactive providers
                this.resetProviderMetrics(providerId);
            }
        }

        // Log performance summary
        if (process.env.NODE_ENV === 'development') {
            console.log(
                '📊 Provider Performance Summary:',
                this.getPerformanceSummary()
            );
        }
    }
}

export default ProviderPerformanceMonitor;
