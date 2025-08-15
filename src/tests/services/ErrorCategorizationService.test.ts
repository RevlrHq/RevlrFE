import { ErrorCategorizationService } from '@/lib/services/media/ErrorCategorizationService';
import { MediaProviderErrorType } from '@/types/media-search';

describe('ErrorCategorizationService', () => {
    let service: ErrorCategorizationService;

    beforeEach(() => {
        service = new ErrorCategorizationService();
    });

    describe('categorizeError', () => {
        it('should categorize network errors correctly', () => {
            const networkError = new Error('fetch failed: network error');
            const context = {
                providerId: 'unsplash',
                operation: 'search',
                retryAttempt: 0,
            };

            const result = service.categorizeError(networkError, context);

            expect(result.enhancedError.type).toBe(
                MediaProviderErrorType.NETWORK_ERROR
            );
            expect(result.category.severity).toBe('medium');
            expect(result.category.isRetryable).toBe(true);
            expect(result.strategy.strategy).toBe('exponential_backoff');
        });

        it('should categorize rate limit errors correctly', () => {
            const rateLimitError = new Error('429 Too Many Requests');
            const context = {
                providerId: 'pexels',
                operation: 'search',
                retryAttempt: 0,
            };

            const result = service.categorizeError(rateLimitError, context);

            expect(result.enhancedError.type).toBe(
                MediaProviderErrorType.RATE_LIMIT_EXCEEDED
            );
            expect(result.category.severity).toBe('medium');
            expect(result.strategy.strategy).toBe('disable_temporarily');
        });

        it('should categorize authentication errors correctly', () => {
            const authError = new Error('401 Unauthorized: Invalid API key');
            const context = {
                providerId: 'pixabay',
                operation: 'search',
                retryAttempt: 0,
            };

            const result = service.categorizeError(authError, context);

            expect(result.enhancedError.type).toBe(
                MediaProviderErrorType.API_KEY_INVALID
            );
            expect(result.category.severity).toBe('critical');
            expect(result.category.isRetryable).toBe(false);
            expect(result.strategy.strategy).toBe('manual_intervention');
        });

        it('should categorize server errors correctly', () => {
            const serverError = new Error('503 Service Unavailable');
            const context = {
                providerId: 'unsplash',
                operation: 'search',
                retryAttempt: 0,
            };

            const result = service.categorizeError(serverError, context);

            expect(result.enhancedError.type).toBe(
                MediaProviderErrorType.PROVIDER_UNAVAILABLE
            );
            expect(result.category.severity).toBe('high');
            expect(result.strategy.strategy).toBe('circuit_breaker');
        });
    });

    describe('getUserFriendlyMessage', () => {
        it('should return user-friendly messages for different error types', () => {
            const networkMessage = service.getUserFriendlyMessage(
                MediaProviderErrorType.NETWORK_ERROR,
                'unsplash'
            );
            expect(networkMessage.title).toBe('Connection Issue');
            expect(networkMessage.message).toContain('unsplash');
            expect(networkMessage.severity).toBe('medium');

            const authMessage = service.getUserFriendlyMessage(
                MediaProviderErrorType.API_KEY_INVALID,
                'pexels'
            );
            expect(authMessage.title).toBe('Configuration Issue');
            expect(authMessage.severity).toBe('critical');
        });
    });

    describe('shouldTriggerCircuitBreaker', () => {
        it('should trigger circuit breaker for critical errors', () => {
            const recentErrors = [
                {
                    type: MediaProviderErrorType.API_KEY_INVALID,
                    providerId: 'test',
                    message: 'Auth failed',
                    details: { timestamp: Date.now() },
                },
            ];

            const shouldTrigger = service.shouldTriggerCircuitBreaker(
                MediaProviderErrorType.API_KEY_INVALID,
                recentErrors
            );

            expect(shouldTrigger).toBe(true);
        });

        it('should trigger circuit breaker for multiple high severity errors', () => {
            const recentErrors = Array(3)
                .fill(null)
                .map(() => ({
                    type: MediaProviderErrorType.PROVIDER_UNAVAILABLE,
                    providerId: 'test',
                    message: 'Provider down',
                    details: { timestamp: Date.now() },
                }));

            const shouldTrigger = service.shouldTriggerCircuitBreaker(
                MediaProviderErrorType.PROVIDER_UNAVAILABLE,
                recentErrors
            );

            expect(shouldTrigger).toBe(true);
        });

        it('should not trigger circuit breaker for few low severity errors', () => {
            const recentErrors = [
                {
                    type: MediaProviderErrorType.SEARCH_FAILED,
                    providerId: 'test',
                    message: 'Search failed',
                    details: { timestamp: Date.now() },
                },
            ];

            const shouldTrigger = service.shouldTriggerCircuitBreaker(
                MediaProviderErrorType.SEARCH_FAILED,
                recentErrors
            );

            expect(shouldTrigger).toBe(false);
        });
    });

    describe('detectErrorPatterns', () => {
        it('should detect multi-provider failure pattern', () => {
            const errors = [
                {
                    type: MediaProviderErrorType.NETWORK_ERROR,
                    providerId: 'unsplash',
                    message: 'Network error',
                    details: { timestamp: Date.now() },
                },
                {
                    type: MediaProviderErrorType.NETWORK_ERROR,
                    providerId: 'pexels',
                    message: 'Network error',
                    details: { timestamp: Date.now() },
                },
                {
                    type: MediaProviderErrorType.NETWORK_ERROR,
                    providerId: 'pixabay',
                    message: 'Network error',
                    details: { timestamp: Date.now() },
                },
            ];

            const patterns = service.detectErrorPatterns(errors);
            const multiProviderPattern = patterns.find(
                (p) => p.id === 'multi-provider-failure'
            );

            expect(multiProviderPattern).toBeDefined();
            expect(multiProviderPattern?.severity).toBe('critical');
        });

        it('should detect authentication cascade failure', () => {
            const errors = [
                {
                    type: MediaProviderErrorType.API_KEY_INVALID,
                    providerId: 'unsplash',
                    message: 'Invalid API key',
                    details: { timestamp: Date.now() },
                },
                {
                    type: MediaProviderErrorType.API_KEY_INVALID,
                    providerId: 'pexels',
                    message: 'Invalid API key',
                    details: { timestamp: Date.now() },
                },
            ];

            const patterns = service.detectErrorPatterns(errors);
            const authCascadePattern = patterns.find(
                (p) => p.id === 'auth-cascade'
            );

            expect(authCascadePattern).toBeDefined();
            expect(authCascadePattern?.severity).toBe('critical');
        });
    });

    describe('getRetryConfig', () => {
        it('should return appropriate retry config for different error types', () => {
            const networkConfig = service.getRetryConfig(
                MediaProviderErrorType.NETWORK_ERROR
            );
            expect(networkConfig.maxRetries).toBe(3);
            expect(networkConfig.jitter).toBe(true);

            const rateLimitConfig = service.getRetryConfig(
                MediaProviderErrorType.RATE_LIMIT_EXCEEDED
            );
            expect(rateLimitConfig.maxRetries).toBeGreaterThanOrEqual(1);
            expect(rateLimitConfig.baseDelay).toBeGreaterThanOrEqual(1000); // Should have some delay
        });
    });
});
