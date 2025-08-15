import {
    MediaProviderError,
    MediaProviderErrorType,
    ProviderStatus,
} from '@/types/media-search';

export interface ProviderHealthMetrics {
    providerId: string;
    healthScore: number; // 0-100
    availability: number; // percentage
    averageResponseTime: number; // milliseconds
    errorRate: number; // percentage
    lastSuccessfulRequest: number; // timestamp
    lastFailedRequest: number; // timestamp
    consecutiveFailures: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rateLimit: {
        remaining: number;
        resetTime: number;
        limit: number;
    };
}

export interface ProviderHealthStatus {
    providerId: string;
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy' | 'disabled';
    healthScore: number;
    metrics: ProviderHealthMetrics;
    currentIssues: ProviderIssue[];
    recommendations: ProviderRecommendation[];
    lastUpdated: number;
}

export interface ProviderIssue {
    id: string;
    type: 'error' | 'warning' | 'info';
    category:
        | 'performance'
        | 'availability'
        | 'authentication'
        | 'rate_limit'
        | 'configuration';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    firstDetected: number;
    lastOccurrence: number;
    occurrenceCount: number;
    isResolved: boolean;
    autoResolvable: boolean;
    relatedErrors: MediaProviderError[];
}

export interface ProviderRecommendation {
    id: string;
    type: 'immediate' | 'short_term' | 'long_term';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    actions: Array<{
        label: string;
        action:
            | 'retry'
            | 'configure'
            | 'disable'
            | 'contact_support'
            | 'monitor';
        automated?: boolean;
        url?: string;
    }>;
    estimatedImpact: string;
    implementationEffort: 'low' | 'medium' | 'high';
}

export interface HealthCheckResult {
    providerId: string;
    timestamp: number;
    success: boolean;
    responseTime: number;
    error?: MediaProviderError;
    metadata?: {
        endpoint: string;
        statusCode?: number;
        headers?: Record<string, string>;
    };
}

export interface ProviderHealthConfig {
    healthCheckInterval: number; // milliseconds
    healthScoreWeights: {
        availability: number;
        responseTime: number;
        errorRate: number;
        recentPerformance: number;
    };
    thresholds: {
        healthy: number; // health score threshold
        degraded: number; // health score threshold
        unhealthy: number; // health score threshold
        maxConsecutiveFailures: number;
        maxResponseTime: number; // milliseconds
        maxErrorRate: number; // percentage
    };
    retryRecommendations: {
        minWaitTime: number; // milliseconds
        maxWaitTime: number; // milliseconds
        backoffMultiplier: number;
    };
}

/**
 * Comprehensive provider health status reporting and monitoring service
 */
export class ProviderHealthStatusService {
    private healthStatuses: Map<string, ProviderHealthStatus> = new Map();
    private healthMetrics: Map<string, ProviderHealthMetrics> = new Map();
    private healthHistory: Map<string, HealthCheckResult[]> = new Map();
    private issues: Map<string, ProviderIssue[]> = new Map();
    private config: ProviderHealthConfig;
    private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

    constructor(config: Partial<ProviderHealthConfig> = {}) {
        this.config = {
            healthCheckInterval: 60000, // 1 minute
            healthScoreWeights: {
                availability: 0.4,
                responseTime: 0.3,
                errorRate: 0.2,
                recentPerformance: 0.1,
            },
            thresholds: {
                healthy: 80,
                degraded: 60,
                unhealthy: 40,
                maxConsecutiveFailures: 3,
                maxResponseTime: 5000,
                maxErrorRate: 10,
            },
            retryRecommendations: {
                minWaitTime: 30000, // 30 seconds
                maxWaitTime: 1800000, // 30 minutes
                backoffMultiplier: 2,
            },
            ...config,
        };
    }

    /**
     * Initialize health monitoring for a provider
     */
    initializeProvider(providerId: string, providerName: string): void {
        // Initialize metrics
        this.healthMetrics.set(providerId, {
            providerId,
            healthScore: 100,
            availability: 100,
            averageResponseTime: 0,
            errorRate: 0,
            lastSuccessfulRequest: 0,
            lastFailedRequest: 0,
            consecutiveFailures: 0,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            rateLimit: {
                remaining: 1000,
                resetTime: Date.now() + 3600000,
                limit: 1000,
            },
        });

        // Initialize status
        this.healthStatuses.set(providerId, {
            providerId,
            name: providerName,
            status: 'healthy',
            healthScore: 100,
            metrics: this.healthMetrics.get(providerId)!,
            currentIssues: [],
            recommendations: [],
            lastUpdated: Date.now(),
        });

        // Initialize history and issues
        this.healthHistory.set(providerId, []);
        this.issues.set(providerId, []);

        // Start health monitoring
        this.startHealthMonitoring(providerId);
    }

    /**
     * Record a successful request
     */
    recordSuccess(providerId: string, responseTime: number): void {
        const metrics = this.healthMetrics.get(providerId);
        if (!metrics) return;

        metrics.totalRequests++;
        metrics.successfulRequests++;
        metrics.lastSuccessfulRequest = Date.now();
        metrics.consecutiveFailures = 0;

        // Update average response time
        const totalResponseTime =
            metrics.averageResponseTime * (metrics.totalRequests - 1) +
            responseTime;
        metrics.averageResponseTime = totalResponseTime / metrics.totalRequests;

        this.updateHealthScore(providerId);
        this.resolveIssues(providerId, ['performance', 'availability']);
    }

    /**
     * Record a failed request
     */
    recordFailure(
        providerId: string,
        error: MediaProviderError,
        responseTime?: number
    ): void {
        const metrics = this.healthMetrics.get(providerId);
        if (!metrics) return;

        metrics.totalRequests++;
        metrics.failedRequests++;
        metrics.lastFailedRequest = Date.now();
        metrics.consecutiveFailures++;

        if (responseTime) {
            const totalResponseTime =
                metrics.averageResponseTime * (metrics.totalRequests - 1) +
                responseTime;
            metrics.averageResponseTime =
                totalResponseTime / metrics.totalRequests;
        }

        this.updateHealthScore(providerId);
        this.createOrUpdateIssue(providerId, error);
        this.generateRecommendations(providerId);
    }

    /**
     * Update rate limit information
     */
    updateRateLimit(
        providerId: string,
        remaining: number,
        resetTime: number,
        limit: number
    ): void {
        const metrics = this.healthMetrics.get(providerId);
        if (!metrics) return;

        metrics.rateLimit = { remaining, resetTime, limit };
        this.updateHealthScore(providerId);

        // Create issue if rate limit is low
        if (remaining < limit * 0.1) {
            // Less than 10% remaining
            this.createRateLimitIssue(providerId, remaining, limit, resetTime);
        }
    }

    /**
     * Get current health status for a provider
     */
    getProviderHealth(providerId: string): ProviderHealthStatus | null {
        return this.healthStatuses.get(providerId) || null;
    }

    /**
     * Get health status for all providers
     */
    getAllProviderHealth(): ProviderHealthStatus[] {
        return Array.from(this.healthStatuses.values()).sort(
            (a, b) => b.healthScore - a.healthScore
        );
    }

    /**
     * Get providers by health status
     */
    getProvidersByStatus(
        status: 'healthy' | 'degraded' | 'unhealthy' | 'disabled'
    ): ProviderHealthStatus[] {
        return Array.from(this.healthStatuses.values())
            .filter((provider) => provider.status === status)
            .sort((a, b) => b.healthScore - a.healthScore);
    }

    /**
     * Get recommendations for improving provider health
     */
    getRecommendations(providerId?: string): ProviderRecommendation[] {
        if (providerId) {
            const status = this.healthStatuses.get(providerId);
            return status?.recommendations || [];
        }

        return Array.from(this.healthStatuses.values())
            .flatMap((status) => status.recommendations)
            .sort((a, b) => {
                const priorityOrder = {
                    critical: 4,
                    high: 3,
                    medium: 2,
                    low: 1,
                };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });
    }

    /**
     * Get current issues across all providers
     */
    getCurrentIssues(
        severity?: 'low' | 'medium' | 'high' | 'critical'
    ): ProviderIssue[] {
        const allIssues = Array.from(this.issues.values())
            .flat()
            .filter((issue) => !issue.isResolved);

        if (severity) {
            return allIssues.filter((issue) => issue.impact === severity);
        }

        return allIssues.sort((a, b) => {
            const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return impactOrder[b.impact] - impactOrder[a.impact];
        });
    }

    /**
     * Get health summary across all providers
     */
    getHealthSummary(): {
        totalProviders: number;
        healthyProviders: number;
        degradedProviders: number;
        unhealthyProviders: number;
        disabledProviders: number;
        averageHealthScore: number;
        criticalIssues: number;
        totalIssues: number;
        recommendationsCount: number;
    } {
        const statuses = Array.from(this.healthStatuses.values());
        const allIssues = this.getCurrentIssues();

        return {
            totalProviders: statuses.length,
            healthyProviders: statuses.filter((s) => s.status === 'healthy')
                .length,
            degradedProviders: statuses.filter((s) => s.status === 'degraded')
                .length,
            unhealthyProviders: statuses.filter((s) => s.status === 'unhealthy')
                .length,
            disabledProviders: statuses.filter((s) => s.status === 'disabled')
                .length,
            averageHealthScore:
                statuses.reduce((sum, s) => sum + s.healthScore, 0) /
                    statuses.length || 0,
            criticalIssues: allIssues.filter((i) => i.impact === 'critical')
                .length,
            totalIssues: allIssues.length,
            recommendationsCount: this.getRecommendations().length,
        };
    }

    /**
     * Disable a provider temporarily
     */
    disableProvider(
        providerId: string,
        reason: string,
        duration?: number
    ): void {
        const status = this.healthStatuses.get(providerId);
        if (!status) return;

        status.status = 'disabled';
        status.lastUpdated = Date.now();

        this.createOrUpdateIssue(providerId, {
            type: MediaProviderErrorType.PROVIDER_UNAVAILABLE,
            providerId,
            message: `Provider disabled: ${reason}`,
            details: { reason, disabledAt: Date.now(), duration },
        });

        // Re-enable after duration if specified
        if (duration) {
            setTimeout(() => {
                this.enableProvider(providerId);
            }, duration);
        }
    }

    /**
     * Enable a previously disabled provider
     */
    enableProvider(providerId: string): void {
        const status = this.healthStatuses.get(providerId);
        if (!status) return;

        // Reset metrics for fresh start
        const metrics = this.healthMetrics.get(providerId);
        if (metrics) {
            metrics.consecutiveFailures = 0;
            metrics.healthScore = 100;
        }

        status.status = 'healthy';
        status.healthScore = 100;
        status.lastUpdated = Date.now();

        // Resolve disable-related issues
        this.resolveIssues(providerId, ['availability']);
    }

    // Private methods

    private startHealthMonitoring(providerId: string): void {
        const interval = setInterval(() => {
            this.performHealthCheck(providerId);
        }, this.config.healthCheckInterval);

        this.healthCheckIntervals.set(providerId, interval);
    }

    private async performHealthCheck(providerId: string): Promise<void> {
        const startTime = Date.now();

        try {
            // This would typically make a lightweight API call to test provider health
            // For now, we'll simulate based on recent performance
            const metrics = this.healthMetrics.get(providerId);
            if (!metrics) return;

            const isHealthy =
                metrics.consecutiveFailures <
                this.config.thresholds.maxConsecutiveFailures;
            const responseTime = Date.now() - startTime;

            const result: HealthCheckResult = {
                providerId,
                timestamp: Date.now(),
                success: isHealthy,
                responseTime,
                metadata: {
                    endpoint: 'health-check',
                    statusCode: isHealthy ? 200 : 503,
                },
            };

            this.recordHealthCheck(providerId, result);

            if (isHealthy) {
                this.recordSuccess(providerId, responseTime);
            } else {
                this.recordFailure(
                    providerId,
                    {
                        type: MediaProviderErrorType.PROVIDER_UNAVAILABLE,
                        providerId,
                        message: 'Health check failed',
                        details: { healthCheck: true },
                    },
                    responseTime
                );
            }
        } catch (error) {
            const result: HealthCheckResult = {
                providerId,
                timestamp: Date.now(),
                success: false,
                responseTime: Date.now() - startTime,
                error: {
                    type: MediaProviderErrorType.NETWORK_ERROR,
                    providerId,
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Health check error',
                    details: { healthCheck: true },
                },
            };

            this.recordHealthCheck(providerId, result);
            this.recordFailure(providerId, result.error!);
        }
    }

    private recordHealthCheck(
        providerId: string,
        result: HealthCheckResult
    ): void {
        const history = this.healthHistory.get(providerId) || [];
        history.push(result);

        // Keep only last 100 health checks
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }

        this.healthHistory.set(providerId, history);
    }

    private updateHealthScore(providerId: string): void {
        const metrics = this.healthMetrics.get(providerId);
        const status = this.healthStatuses.get(providerId);
        if (!metrics || !status) return;

        // Calculate availability
        metrics.availability =
            metrics.totalRequests > 0
                ? (metrics.successfulRequests / metrics.totalRequests) * 100
                : 100;

        // Calculate error rate
        metrics.errorRate =
            metrics.totalRequests > 0
                ? (metrics.failedRequests / metrics.totalRequests) * 100
                : 0;

        // Calculate health score based on weighted factors
        const weights = this.config.healthScoreWeights;
        const thresholds = this.config.thresholds;

        let availabilityScore = Math.min(metrics.availability, 100);
        let responseTimeScore = Math.max(
            0,
            100 -
                (metrics.averageResponseTime / thresholds.maxResponseTime) * 100
        );
        let errorRateScore = Math.max(
            0,
            100 - (metrics.errorRate / thresholds.maxErrorRate) * 100
        );

        // Recent performance based on consecutive failures
        let recentPerformanceScore = Math.max(
            0,
            100 -
                (metrics.consecutiveFailures /
                    thresholds.maxConsecutiveFailures) *
                    100
        );

        metrics.healthScore = Math.round(
            availabilityScore * weights.availability +
                responseTimeScore * weights.responseTime +
                errorRateScore * weights.errorRate +
                recentPerformanceScore * weights.recentPerformance
        );

        // Update status based on health score
        if (metrics.healthScore >= thresholds.healthy) {
            status.status = 'healthy';
        } else if (metrics.healthScore >= thresholds.degraded) {
            status.status = 'degraded';
        } else if (metrics.healthScore >= thresholds.unhealthy) {
            status.status = 'unhealthy';
        } else {
            status.status = 'unhealthy';
        }

        status.healthScore = metrics.healthScore;
        status.metrics = metrics;
        status.lastUpdated = Date.now();
    }

    private createOrUpdateIssue(
        providerId: string,
        error: MediaProviderError
    ): void {
        const issues = this.issues.get(providerId) || [];
        const issueId = `${error.type}-${providerId}`;

        let existingIssue = issues.find(
            (issue) => issue.id === issueId && !issue.isResolved
        );

        if (existingIssue) {
            existingIssue.lastOccurrence = Date.now();
            existingIssue.occurrenceCount++;
            existingIssue.relatedErrors.push(error);
        } else {
            const newIssue: ProviderIssue = {
                id: issueId,
                type: this.getIssueType(error.type),
                category: this.getIssueCategory(error.type),
                title: this.getIssueTitle(error.type),
                description: this.getIssueDescription(
                    error.type,
                    error.message
                ),
                impact: this.getIssueImpact(error.type),
                firstDetected: Date.now(),
                lastOccurrence: Date.now(),
                occurrenceCount: 1,
                isResolved: false,
                autoResolvable: this.isAutoResolvable(error.type),
                relatedErrors: [error],
            };

            issues.push(newIssue);
        }

        this.issues.set(providerId, issues);
        this.updateProviderIssues(providerId);
    }

    private createRateLimitIssue(
        providerId: string,
        remaining: number,
        limit: number,
        resetTime: number
    ): void {
        const issues = this.issues.get(providerId) || [];
        const issueId = `rate-limit-low-${providerId}`;

        let existingIssue = issues.find(
            (issue) => issue.id === issueId && !issue.isResolved
        );

        if (!existingIssue) {
            const newIssue: ProviderIssue = {
                id: issueId,
                type: 'warning',
                category: 'rate_limit',
                title: 'Rate Limit Running Low',
                description: `Only ${remaining} of ${limit} requests remaining. Resets at ${new Date(resetTime).toLocaleTimeString()}.`,
                impact: remaining < limit * 0.05 ? 'high' : 'medium', // Critical if less than 5%
                firstDetected: Date.now(),
                lastOccurrence: Date.now(),
                occurrenceCount: 1,
                isResolved: false,
                autoResolvable: true,
                relatedErrors: [],
            };

            issues.push(newIssue);
            this.issues.set(providerId, issues);
            this.updateProviderIssues(providerId);
        }
    }

    private resolveIssues(providerId: string, categories: string[]): void {
        const issues = this.issues.get(providerId) || [];

        issues.forEach((issue) => {
            if (categories.includes(issue.category) && !issue.isResolved) {
                issue.isResolved = true;
            }
        });

        this.updateProviderIssues(providerId);
    }

    private updateProviderIssues(providerId: string): void {
        const status = this.healthStatuses.get(providerId);
        const issues = this.issues.get(providerId) || [];

        if (status) {
            status.currentIssues = issues.filter((issue) => !issue.isResolved);
            status.lastUpdated = Date.now();
        }
    }

    private generateRecommendations(providerId: string): void {
        const status = this.healthStatuses.get(providerId);
        const metrics = this.healthMetrics.get(providerId);
        if (!status || !metrics) return;

        const recommendations: ProviderRecommendation[] = [];

        // High error rate recommendation
        if (metrics.errorRate > this.config.thresholds.maxErrorRate) {
            recommendations.push({
                id: `high-error-rate-${providerId}`,
                type: 'immediate',
                priority: 'high',
                title: 'High Error Rate Detected',
                description: `Error rate is ${metrics.errorRate.toFixed(1)}%, which exceeds the threshold of ${this.config.thresholds.maxErrorRate}%.`,
                actions: [
                    {
                        label: 'Check API Configuration',
                        action: 'configure',
                        url: '/settings/providers',
                    },
                    { label: 'Monitor Provider Status', action: 'monitor' },
                    {
                        label: 'Temporarily Disable',
                        action: 'disable',
                        automated: true,
                    },
                ],
                estimatedImpact:
                    'Reduce failed requests and improve user experience',
                implementationEffort: 'low',
            });
        }

        // Slow response time recommendation
        if (
            metrics.averageResponseTime > this.config.thresholds.maxResponseTime
        ) {
            recommendations.push({
                id: `slow-response-${providerId}`,
                type: 'short_term',
                priority: 'medium',
                title: 'Slow Response Times',
                description: `Average response time is ${metrics.averageResponseTime}ms, which exceeds the threshold of ${this.config.thresholds.maxResponseTime}ms.`,
                actions: [
                    { label: 'Check Network Connectivity', action: 'monitor' },
                    { label: 'Review Provider Status', action: 'monitor' },
                    { label: 'Consider Caching', action: 'configure' },
                ],
                estimatedImpact:
                    'Improve search performance and user experience',
                implementationEffort: 'medium',
            });
        }

        // Consecutive failures recommendation
        if (
            metrics.consecutiveFailures >=
            this.config.thresholds.maxConsecutiveFailures
        ) {
            recommendations.push({
                id: `consecutive-failures-${providerId}`,
                type: 'immediate',
                priority: 'critical',
                title: 'Multiple Consecutive Failures',
                description: `Provider has failed ${metrics.consecutiveFailures} consecutive requests.`,
                actions: [
                    {
                        label: 'Disable Temporarily',
                        action: 'disable',
                        automated: true,
                    },
                    { label: 'Check Provider Status', action: 'monitor' },
                    { label: 'Contact Support', action: 'contact_support' },
                ],
                estimatedImpact:
                    'Prevent further failures and improve system stability',
                implementationEffort: 'low',
            });
        }

        // Rate limit recommendation
        if (metrics.rateLimit.remaining < metrics.rateLimit.limit * 0.1) {
            const resetTime = new Date(metrics.rateLimit.resetTime);
            recommendations.push({
                id: `rate-limit-low-${providerId}`,
                type: 'immediate',
                priority: 'medium',
                title: 'Rate Limit Running Low',
                description: `Only ${metrics.rateLimit.remaining} requests remaining until ${resetTime.toLocaleTimeString()}.`,
                actions: [
                    {
                        label: 'Reduce Request Frequency',
                        action: 'configure',
                        automated: true,
                    },
                    { label: 'Enable Caching', action: 'configure' },
                    {
                        label: 'Use Alternative Providers',
                        action: 'configure',
                        automated: true,
                    },
                ],
                estimatedImpact:
                    'Prevent rate limit exhaustion and maintain service availability',
                implementationEffort: 'low',
            });
        }

        status.recommendations = recommendations;
    }

    private getIssueType(
        errorType: MediaProviderErrorType
    ): 'error' | 'warning' | 'info' {
        switch (errorType) {
            case MediaProviderErrorType.API_KEY_INVALID:
            case MediaProviderErrorType.PROVIDER_UNAVAILABLE:
                return 'error';
            case MediaProviderErrorType.RATE_LIMIT_EXCEEDED:
            case MediaProviderErrorType.NETWORK_ERROR:
                return 'warning';
            default:
                return 'info';
        }
    }

    private getIssueCategory(
        errorType: MediaProviderErrorType
    ):
        | 'performance'
        | 'availability'
        | 'authentication'
        | 'rate_limit'
        | 'configuration' {
        switch (errorType) {
            case MediaProviderErrorType.NETWORK_ERROR:
            case MediaProviderErrorType.SEARCH_FAILED:
            case MediaProviderErrorType.DOWNLOAD_FAILED:
                return 'performance';
            case MediaProviderErrorType.PROVIDER_UNAVAILABLE:
                return 'availability';
            case MediaProviderErrorType.API_KEY_INVALID:
                return 'authentication';
            case MediaProviderErrorType.RATE_LIMIT_EXCEEDED:
                return 'rate_limit';
            default:
                return 'configuration';
        }
    }

    private getIssueTitle(errorType: MediaProviderErrorType): string {
        switch (errorType) {
            case MediaProviderErrorType.NETWORK_ERROR:
                return 'Network Connectivity Issues';
            case MediaProviderErrorType.RATE_LIMIT_EXCEEDED:
                return 'Rate Limit Exceeded';
            case MediaProviderErrorType.API_KEY_INVALID:
                return 'Authentication Failed';
            case MediaProviderErrorType.PROVIDER_UNAVAILABLE:
                return 'Provider Unavailable';
            case MediaProviderErrorType.SEARCH_FAILED:
                return 'Search Failures';
            case MediaProviderErrorType.DOWNLOAD_FAILED:
                return 'Download Failures';
            default:
                return 'Unknown Issue';
        }
    }

    private getIssueDescription(
        errorType: MediaProviderErrorType,
        message: string
    ): string {
        const baseDescriptions = {
            [MediaProviderErrorType.NETWORK_ERROR]:
                'Network connectivity issues are preventing successful requests.',
            [MediaProviderErrorType.RATE_LIMIT_EXCEEDED]:
                'API rate limits have been exceeded.',
            [MediaProviderErrorType.API_KEY_INVALID]:
                'API authentication is failing.',
            [MediaProviderErrorType.PROVIDER_UNAVAILABLE]:
                'Provider service is currently unavailable.',
            [MediaProviderErrorType.SEARCH_FAILED]:
                'Search operations are failing.',
            [MediaProviderErrorType.DOWNLOAD_FAILED]:
                'Media download operations are failing.',
        };

        return baseDescriptions[errorType] || message;
    }

    private getIssueImpact(
        errorType: MediaProviderErrorType
    ): 'low' | 'medium' | 'high' | 'critical' {
        switch (errorType) {
            case MediaProviderErrorType.API_KEY_INVALID:
                return 'critical';
            case MediaProviderErrorType.PROVIDER_UNAVAILABLE:
            case MediaProviderErrorType.DOWNLOAD_FAILED:
                return 'high';
            case MediaProviderErrorType.RATE_LIMIT_EXCEEDED:
            case MediaProviderErrorType.NETWORK_ERROR:
                return 'medium';
            case MediaProviderErrorType.SEARCH_FAILED:
            default:
                return 'low';
        }
    }

    private isAutoResolvable(errorType: MediaProviderErrorType): boolean {
        return [
            MediaProviderErrorType.NETWORK_ERROR,
            MediaProviderErrorType.RATE_LIMIT_EXCEEDED,
            MediaProviderErrorType.PROVIDER_UNAVAILABLE,
        ].includes(errorType);
    }
}
