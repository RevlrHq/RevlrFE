# Comprehensive Error Handling and Recovery System

This document describes the comprehensive error handling and recovery system implemented for the media search functionality. The system provides robust error handling, automatic recovery, user-friendly notifications, and detailed logging for debugging and monitoring.

## Overview

The error handling system consists of several interconnected services that work together to provide a seamless user experience even when errors occur:

1. **ErrorHandlingService** - Core error categorization and recovery logic
2. **ErrorLoggingService** - Comprehensive logging and monitoring
3. **ErrorNotificationService** - User-friendly error notifications
4. **EnhancedMediaSearchService** - Integration layer with circuit breakers
5. **React Components** - UI components for displaying errors and notifications

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Interface Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  ErrorNotificationDisplay │ NetworkStatusIndicator │ Health UI  │
├─────────────────────────────────────────────────────────────────┤
│                    Hook Layer                                   │
├─────────────────────────────────────────────────────────────────┤
│              useEnhancedMediaSearch                             │
├─────────────────────────────────────────────────────────────────┤
│                    Service Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  EnhancedMediaSearchService │ ErrorHandlingService │ Logging    │
├─────────────────────────────────────────────────────────────────┤
│                    Provider Layer                               │
├─────────────────────────────────────────────────────────────────┤
│     MediaProvider │ CircuitBreaker │ HealthMonitor              │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Error Categorization and Recovery

The system automatically categorizes errors and determines appropriate recovery actions:

#### Error Types

- **Network Errors**: Connection issues, timeouts, DNS failures
- **Rate Limiting**: API rate limits exceeded
- **Authentication**: Invalid API keys, expired tokens
- **Provider Unavailable**: Server errors, maintenance mode
- **Search/Download Failures**: Operation-specific errors

#### Recovery Actions

- **Retry with Exponential Backoff**: For transient failures
- **Temporary Provider Disable**: For rate limits and server issues
- **Fallback Providers**: Switch to alternative providers
- **Offline Mode**: Graceful degradation when offline
- **User Notification**: Inform user with actionable steps

### 2. Circuit Breaker Pattern

Prevents cascading failures by temporarily disabling failing providers:

```typescript
// Circuit breaker states
- CLOSED: Normal operation
- OPEN: Provider disabled due to failures
- HALF-OPEN: Testing if provider has recovered
```

### 3. Comprehensive Logging

Detailed logging for debugging and monitoring:

- **Error Categorization**: Network, provider, user, system errors
- **Context Tracking**: Operation details, user actions, timestamps
- **Pattern Detection**: Identifies recurring error patterns
- **Alert Generation**: Automatic alerts for critical issues
- **Export Capabilities**: JSON and CSV export for analysis

### 4. User-Friendly Notifications

Clear, actionable notifications for users:

- **Severity Levels**: Info, warning, error, critical
- **Action Buttons**: Retry, dismiss, help, settings
- **Auto-dismiss**: Configurable timeout for non-critical errors
- **Grouping**: Similar errors are grouped to avoid spam
- **Accessibility**: Full ARIA support and keyboard navigation

### 5. Network Status Monitoring

Real-time network status detection:

- **Online/Offline Detection**: Browser API integration
- **Connection Speed**: Automatic speed testing
- **Slow Connection Handling**: Optimizations for slow networks
- **Offline Mode**: Cached results when offline

## Usage

### Basic Integration

```typescript
import { useEnhancedMediaSearch } from '@/hooks/useEnhancedMediaSearch';
import { ErrorNotificationDisplay } from '@/components/media-search/ErrorNotificationDisplay';

function MediaSearchComponent() {
    const { state, actions } = useEnhancedMediaSearch({
        enableErrorHandling: true,
        enableLogging: true,
        enableNotifications: true,
    });

    return (
        <div>
            {/* Search interface */}
            <input
                value={state.query}
                onChange={(e) => actions.search(e.target.value)}
            />

            {/* Error notifications */}
            <ErrorNotificationDisplay
                notifications={state.notifications}
                onDismiss={actions.dismissNotification}
                onAction={(id, action, handler) => {
                    if (action === 'retry') {
                        actions.retryLastOperation();
                    }
                }}
            />

            {/* Network status */}
            <NetworkStatusIndicator networkStatus={state.networkStatus} />

            {/* Service health */}
            <ServiceHealthIndicator health={state.serviceHealth} />
        </div>
    );
}
```

### Advanced Configuration

```typescript
const errorHandlingConfig = {
    enableErrorHandling: true,
    enableLogging: true,
    enableNotifications: true,
    retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: true,
    },
    offlineMode: true,
    gracefulDegradation: true,
};

const service = new EnhancedMediaSearchService(1000, 30, errorHandlingConfig);
```

### Custom Error Handling

```typescript
// Custom error handler
const handleCustomError = (error, context) => {
    const recoveryAction = errorHandler.handleProviderError(error, context);

    switch (recoveryAction.action) {
        case 'retry_with_backoff':
            // Implement custom retry logic
            break;
        case 'disable_temporarily':
            // Handle provider disabling
            break;
        case 'offline_mode':
            // Switch to offline mode
            break;
    }
};

// Custom notification
const customNotification = {
    id: 'custom-error',
    type: 'warning',
    title: 'Custom Error',
    message: 'Something went wrong',
    actions: [
        {
            label: 'Fix It',
            action: 'custom',
            handler: () => handleCustomError(),
        },
    ],
};
```

## Error Recovery Strategies

### 1. Automatic Retry

```typescript
// Exponential backoff configuration
const retryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // Start with 1 second
    maxDelay: 10000, // Max 10 seconds
    backoffMultiplier: 2, // Double delay each time
    jitter: true, // Add randomness
};

// Usage
await errorHandler.executeWithRetry(
    () => provider.search(query),
    retryConfig,
    context
);
```

### 2. Provider Failover

```typescript
// Automatic failover to healthy providers
const healthyProviders = service.getHealthyProviders();
const results = await Promise.allSettled(
    healthyProviders.map((provider) => provider.search(query))
);
```

### 3. Circuit Breaker

```typescript
// Circuit breaker prevents repeated failures
const circuitBreaker = new CircuitBreaker({
    failureThreshold: 5, // Open after 5 failures
    recoveryTimeout: 60000, // Try again after 1 minute
    monitoringPeriod: 300000, // 5 minute monitoring window
});
```

### 4. Graceful Degradation

```typescript
// Fallback to cached results
if (providers.length === 0) {
    const cachedResult = cache.get(query);
    if (cachedResult) {
        return cachedResult;
    }
    return emptyResult();
}
```

## Monitoring and Analytics

### Error Metrics

```typescript
const metrics = loggingService.getMetrics();
// Returns:
// - totalErrors: number
// - errorsByType: Record<ErrorType, number>
// - errorsByProvider: Record<string, number>
// - errorRate: number (errors per minute)
// - topErrors: Array<{error: string, count: number}>
```

### Health Monitoring

```typescript
const health = service.getServiceHealth();
// Returns:
// - isHealthy: boolean
// - totalProviders: number
// - healthyProviders: number
// - networkStatus: 'online' | 'offline' | 'slow'
// - errorRate: number
```

### Error Reports

```typescript
const report = loggingService.generateReport({
    start: Date.now() - 3600000, // Last hour
    end: Date.now(),
});
// Returns comprehensive error analysis with recommendations
```

## Testing

### Unit Tests

```bash
npm test src/tests/services/media/ErrorHandlingService.test.ts
npm test src/tests/services/media/ErrorLoggingService.test.ts
```

### Integration Tests

```bash
npm test src/tests/integration/error-handling-integration.test.tsx
```

### Manual Testing

1. **Network Errors**: Disconnect internet, test offline behavior
2. **Rate Limiting**: Exceed API limits, verify temporary disable
3. **Provider Failures**: Mock server errors, test failover
4. **Recovery**: Test retry mechanisms and circuit breaker recovery

## Configuration

### Environment Variables

```env
# Error handling configuration
MEDIA_SEARCH_ERROR_HANDLING_ENABLED=true
MEDIA_SEARCH_LOGGING_ENABLED=true
MEDIA_SEARCH_NOTIFICATIONS_ENABLED=true

# Retry configuration
MEDIA_SEARCH_MAX_RETRIES=3
MEDIA_SEARCH_BASE_DELAY=1000
MEDIA_SEARCH_MAX_DELAY=10000

# Circuit breaker configuration
MEDIA_SEARCH_FAILURE_THRESHOLD=5
MEDIA_SEARCH_RECOVERY_TIMEOUT=60000
```

### Service Configuration

```typescript
const config = {
    // Error handling
    enableErrorHandling: true,
    enableLogging: true,
    enableNotifications: true,

    // Retry settings
    retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: true,
    },

    // Logging settings
    logLevel: 'warn',
    maxLogEntries: 10000,
    retentionPeriod: 7, // days

    // Alert thresholds
    alertThresholds: {
        errorRate: 10, // errors per minute
        providerFailureRate: 50, // percentage
        criticalErrorCount: 5,
        patternDetectionWindow: 15, // minutes
    },

    // Notification settings
    maxNotifications: 5,
    defaultDuration: 5000,
    enableGrouping: true,
    position: 'top-right',
};
```

## Best Practices

### 1. Error Handling

- Always provide user-friendly error messages
- Include actionable recovery steps
- Log errors with sufficient context
- Use appropriate severity levels
- Implement graceful degradation

### 2. User Experience

- Show loading states during retries
- Provide clear feedback on network status
- Allow users to retry failed operations
- Group similar notifications
- Make notifications dismissible

### 3. Performance

- Use circuit breakers to prevent cascading failures
- Implement exponential backoff for retries
- Cache results to reduce API calls
- Monitor error rates and provider health
- Clean up old logs and notifications

### 4. Monitoring

- Set up alerts for critical errors
- Monitor provider health metrics
- Track error patterns and trends
- Generate regular error reports
- Review and update error thresholds

## Troubleshooting

### Common Issues

1. **High Error Rates**

    - Check network connectivity
    - Verify API key configuration
    - Review provider status pages
    - Check rate limiting settings

2. **Provider Failures**

    - Verify API keys are valid
    - Check provider service status
    - Review error logs for patterns
    - Test with different providers

3. **Performance Issues**

    - Monitor retry frequency
    - Check circuit breaker status
    - Review cache hit rates
    - Optimize retry delays

4. **Notification Spam**
    - Enable notification grouping
    - Adjust error thresholds
    - Review notification duration
    - Implement rate limiting

### Debug Tools

```typescript
// Get detailed error information
const errorLogs = service.getErrorLogs({
    level: 'error',
    startTime: Date.now() - 3600000,
    limit: 50,
});

// Check service health
const health = service.getServiceHealth();
console.log('Service Health:', health);

// Export error data for analysis
const errorData = loggingService.exportLogs('json');
console.log('Error Data:', errorData);

// Get error statistics
const stats = errorHandler.getErrorStatistics();
console.log('Error Statistics:', stats);
```

## Future Enhancements

1. **Machine Learning**: Predictive error detection and prevention
2. **Advanced Analytics**: More sophisticated error pattern analysis
3. **External Monitoring**: Integration with external monitoring services
4. **A/B Testing**: Test different error handling strategies
5. **User Feedback**: Collect user feedback on error experiences
6. **Automated Recovery**: More intelligent automatic recovery mechanisms

## Contributing

When contributing to the error handling system:

1. Add comprehensive tests for new error scenarios
2. Update documentation for new error types
3. Follow the established error categorization patterns
4. Ensure user-friendly error messages
5. Test offline and network failure scenarios
6. Verify accessibility compliance
7. Monitor performance impact of changes

## Support

For issues related to the error handling system:

1. Check the error logs for detailed information
2. Review the service health status
3. Test with different network conditions
4. Verify provider configurations
5. Check for known issues in the documentation
6. Contact the development team with error reports and logs
