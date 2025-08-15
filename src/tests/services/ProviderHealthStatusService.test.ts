import { ProviderHealthStatusService } from '@/lib/services/media/ProviderHealthStatusService';
import { MediaProviderErrorType } from '@/types/media-search';

describe('ProviderHealthStatusService', () => {
    let service: ProviderHealthStatusService;

    beforeEach(() => {
        service = new ProviderHealthStatusService({
            healthCheckInterval: 1000, // 1 second for testing
            thresholds: {
                healthy: 80,
                degraded: 60,
                unhealthy: 40,
                maxConsecutiveFailures: 3,
                maxResponseTime: 5000,
                maxErrorRate: 10,
            },
        });
    });

    afterEach(() => {
        // Clean up any intervals
        service = null as unknown as ProviderHealthStatusService;
    });

    describe('initializeProvider', () => {
        it('should initialize provider with healthy status', () => {
            service.initializeProvider('test-provider', 'Test Provider');

            const health = service.getProviderHealth('test-provider');
            expect(health).toBeDefined();
            expect(health?.status).toBe('healthy');
            expect(health?.healthScore).toBe(100);
            expect(health?.metrics.totalRequests).toBe(0);
        });
    });

    describe('recordSuccess', () => {
        beforeEach(() => {
            service.initializeProvider('test-provider', 'Test Provider');
        });

        it('should update metrics on successful request', () => {
            service.recordSuccess('test-provider', 1000);

            const health = service.getProviderHealth('test-provider');
            expect(health?.metrics.totalRequests).toBe(1);
            expect(health?.metrics.successfulRequests).toBe(1);
            expect(health?.metrics.consecutiveFailures).toBe(0);
            expect(health?.metrics.averageResponseTime).toBe(1000);
        });

        it('should maintain healthy status with good performance', () => {
            // Record multiple successful requests
            for (let i = 0; i < 10; i++) {
                service.recordSuccess('test-provider', 500 + i * 100);
            }

            const health = service.getProviderHealth('test-provider');
            expect(health?.status).toBe('healthy');
            expect(health?.healthScore).toBeGreaterThan(80);
        });
    });

    describe('recordFailure', () => {
        beforeEach(() => {
            service.initializeProvider('test-provider', 'Test Provider');
        });

        it('should update metrics on failed request', () => {
            const error = {
                type: MediaProviderErrorType.NETWORK_ERROR,
                providerId: 'test-provider',
                message: 'Network error',
                details: {},
            };

            service.recordFailure('test-provider', error, 2000);

            const health = service.getProviderHealth('test-provider');
            expect(health?.metrics.totalRequests).toBe(1);
            expect(health?.metrics.failedRequests).toBe(1);
            expect(health?.metrics.consecutiveFailures).toBe(1);
            expect(health?.metrics.averageResponseTime).toBe(2000);
        });

        it('should degrade health status with multiple failures', () => {
            const error = {
                type: MediaProviderErrorType.PROVIDER_UNAVAILABLE,
                providerId: 'test-provider',
                message: 'Provider unavailable',
                details: {},
            };

            // Record multiple failures
            for (let i = 0; i < 5; i++) {
                service.recordFailure('test-provider', error, 5000);
            }

            const health = service.getProviderHealth('test-provider');
            expect(health?.status).not.toBe('healthy');
            expect(health?.healthScore).toBeLessThan(80);
        });

        it('should create issues for failures', () => {
            const error = {
                type: MediaProviderErrorType.API_KEY_INVALID,
                providerId: 'test-provider',
                message: 'Invalid API key',
                details: {},
            };

            service.recordFailure('test-provider', error);

            const health = service.getProviderHealth('test-provider');
            expect(health?.currentIssues.length).toBeGreaterThan(0);

            const authIssue = health?.currentIssues.find(
                (issue) => issue.category === 'authentication'
            );
            expect(authIssue).toBeDefined();
            expect(authIssue?.impact).toBe('critical');
        });
    });

    describe('updateRateLimit', () => {
        beforeEach(() => {
            service.initializeProvider('test-provider', 'Test Provider');
        });

        it('should update rate limit information', () => {
            const resetTime = Date.now() + 3600000;
            service.updateRateLimit('test-provider', 500, resetTime, 1000);

            const health = service.getProviderHealth('test-provider');
            expect(health?.metrics.rateLimit.remaining).toBe(500);
            expect(health?.metrics.rateLimit.limit).toBe(1000);
            expect(health?.metrics.rateLimit.resetTime).toBe(resetTime);
        });

        it('should create issue when rate limit is low', () => {
            const resetTime = Date.now() + 3600000;
            service.updateRateLimit('test-provider', 50, resetTime, 1000); // 5% remaining

            const health = service.getProviderHealth('test-provider');
            const rateLimitIssue = health?.currentIssues.find(
                (issue) => issue.category === 'rate_limit'
            );
            expect(rateLimitIssue).toBeDefined();
            expect(rateLimitIssue?.impact).toBe('medium'); // 5% remaining is medium impact
        });
    });

    describe('getProvidersByStatus', () => {
        beforeEach(() => {
            service.initializeProvider('healthy-provider', 'Healthy Provider');
            service.initializeProvider(
                'unhealthy-provider',
                'Unhealthy Provider'
            );

            // Make unhealthy provider fail multiple times
            const error = {
                type: MediaProviderErrorType.PROVIDER_UNAVAILABLE,
                providerId: 'unhealthy-provider',
                message: 'Provider down',
                details: {},
            };

            for (let i = 0; i < 10; i++) {
                service.recordFailure('unhealthy-provider', error);
            }
        });

        it('should return providers filtered by status', () => {
            const healthyProviders = service.getProvidersByStatus('healthy');
            const unhealthyProviders =
                service.getProvidersByStatus('unhealthy');

            expect(healthyProviders.length).toBe(1);
            expect(healthyProviders[0].providerId).toBe('healthy-provider');

            expect(unhealthyProviders.length).toBe(1);
            expect(unhealthyProviders[0].providerId).toBe('unhealthy-provider');
        });
    });

    describe('getHealthSummary', () => {
        beforeEach(() => {
            service.initializeProvider('provider1', 'Provider 1');
            service.initializeProvider('provider2', 'Provider 2');
            service.initializeProvider('provider3', 'Provider 3');

            // Make provider2 degraded
            const error = {
                type: MediaProviderErrorType.NETWORK_ERROR,
                providerId: 'provider2',
                message: 'Network issues',
                details: {},
            };
            service.recordFailure('provider2', error);
            service.recordFailure('provider2', error);

            // Make provider3 unhealthy
            const criticalError = {
                type: MediaProviderErrorType.API_KEY_INVALID,
                providerId: 'provider3',
                message: 'Invalid API key',
                details: {},
            };
            service.recordFailure('provider3', criticalError);
        });

        it('should return comprehensive health summary', () => {
            const summary = service.getHealthSummary();

            expect(summary.totalProviders).toBe(3);
            expect(summary.healthyProviders).toBe(1);
            expect(summary.unhealthyProviders).toBeGreaterThan(0);
            expect(summary.averageHealthScore).toBeLessThan(100);
            expect(summary.totalIssues).toBeGreaterThan(0);
        });
    });

    describe('disableProvider and enableProvider', () => {
        beforeEach(() => {
            service.initializeProvider('test-provider', 'Test Provider');
        });

        it('should disable provider with reason', () => {
            service.disableProvider(
                'test-provider',
                'Manual disable for testing'
            );

            const health = service.getProviderHealth('test-provider');
            expect(health?.status).toBe('disabled');
        });

        it('should enable previously disabled provider', () => {
            service.disableProvider('test-provider', 'Test disable');
            service.enableProvider('test-provider');

            const health = service.getProviderHealth('test-provider');
            expect(health?.status).toBe('healthy');
            expect(health?.healthScore).toBe(100);
        });

        it('should auto-enable provider after duration', (done) => {
            service.disableProvider('test-provider', 'Test disable', 100); // 100ms

            setTimeout(() => {
                const health = service.getProviderHealth('test-provider');
                expect(health?.status).toBe('healthy');
                done();
            }, 150);
        });
    });

    describe('getRecommendations', () => {
        beforeEach(() => {
            service.initializeProvider('test-provider', 'Test Provider');
        });

        it('should generate recommendations for high error rate', () => {
            const error = {
                type: MediaProviderErrorType.SEARCH_FAILED,
                providerId: 'test-provider',
                message: 'Search failed',
                details: {},
            };

            // Generate high error rate
            for (let i = 0; i < 20; i++) {
                service.recordFailure('test-provider', error);
                if (i < 5) {
                    service.recordSuccess('test-provider', 1000);
                }
            }

            const recommendations = service.getRecommendations('test-provider');
            const errorRateRecommendation = recommendations.find((r) =>
                r.title.includes('High Error Rate')
            );

            expect(errorRateRecommendation).toBeDefined();
            expect(errorRateRecommendation?.priority).toBe('high');
        });

        it('should generate recommendations for consecutive failures', () => {
            const error = {
                type: MediaProviderErrorType.PROVIDER_UNAVAILABLE,
                providerId: 'test-provider',
                message: 'Provider down',
                details: {},
            };

            // Generate consecutive failures
            for (let i = 0; i < 5; i++) {
                service.recordFailure('test-provider', error);
            }

            const recommendations = service.getRecommendations('test-provider');
            const failureRecommendation = recommendations.find((r) =>
                r.title.includes('Consecutive Failures')
            );

            expect(failureRecommendation).toBeDefined();
            expect(failureRecommendation?.priority).toBe('critical');
        });
    });

    describe('getCurrentIssues', () => {
        beforeEach(() => {
            service.initializeProvider('provider1', 'Provider 1');
            service.initializeProvider('provider2', 'Provider 2');

            // Create different types of issues
            const criticalError = {
                type: MediaProviderErrorType.API_KEY_INVALID,
                providerId: 'provider1',
                message: 'Invalid API key',
                details: {},
            };

            const mediumError = {
                type: MediaProviderErrorType.NETWORK_ERROR,
                providerId: 'provider2',
                message: 'Network error',
                details: {},
            };

            service.recordFailure('provider1', criticalError);
            service.recordFailure('provider2', mediumError);
        });

        it('should return all current issues', () => {
            const allIssues = service.getCurrentIssues();
            expect(allIssues.length).toBeGreaterThan(0);
        });

        it('should filter issues by severity', () => {
            const criticalIssues = service.getCurrentIssues('critical');
            const mediumIssues = service.getCurrentIssues('medium');

            expect(criticalIssues.length).toBeGreaterThan(0);
            expect(mediumIssues.length).toBeGreaterThan(0);

            expect(criticalIssues[0].impact).toBe('critical');
            expect(mediumIssues[0].impact).toBe('medium');
        });
    });
});
