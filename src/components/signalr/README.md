# SignalR Testing Component Documentation

## Overview

The SignalR Testing Component (`SignalRTester`) provides a comprehensive testing interface for the SignalR notification system. It allows developers and QA engineers to manually test all aspects of the SignalR integration, including notifications, connections, error handling, and performance.

## Features

### 1. Connection Testing

- Real-time connection status monitoring
- Manual connect/disconnect controls
- Connection health checks
- Latency measurement
- Group membership testing

### 2. Notification Testing

- Send individual test notifications
- Batch notification testing
- All notification types supported
- Custom data injection
- Priority level testing

### 3. Error Simulation

- Simulate various error conditions
- Test error recovery mechanisms
- Authentication error testing
- Network error simulation

### 4. Performance Testing

- High-volume notification testing
- Connection performance monitoring
- Memory usage tracking
- Latency measurement

## Usage

### Basic Setup

```tsx
import SignalRTester from '@/components/signalr/SignalRTester';

function TestingPage() {
    return (
        <div>
            <SignalRTester />
        </div>
    );
}
```

### Integration with Development Environment

Add the testing component to your development routes:

```tsx
// In your router configuration
{
    path: '/dev/signalr-test',
    element: <SignalRTester />,
    // Only available in development
    condition: process.env.NODE_ENV === 'development'
}
```

## Component Sections

### 1. Connection Status Panel

**Location**: Right sidebar, top panel

**Features**:

- Real-time connection state indicator
- Connection ID display
- Latency measurement
- Health status
- Group membership display
- Manual connection controls

**Usage**:

- Monitor connection status in real-time
- Use Connect/Disconnect buttons to test connection lifecycle
- Click Reconnect to test reconnection logic
- View current groups and connection health

### 2. Notification Testing Tab

**Location**: Main content area, first tab

**Features**:

- Single notification sending
- Batch notification scenarios
- Custom data injection
- Priority level selection
- User ID targeting

**Usage**:

#### Send Single Notification

1. Select notification type from dropdown
2. Choose priority level
3. Optionally enter target user ID
4. Add custom JSON data if needed
5. Click "Send Single" button

#### Batch Testing Scenarios

- Click any scenario button to send multiple related notifications
- Available scenarios:
    - Event Notifications
    - Payment Notifications
    - Financing Notifications
    - System Notifications
    - High Priority Notifications
    - Load Test Notifications

#### Custom Data Format

```json
{
    "eventId": "custom-event-123",
    "customField": "custom value",
    "metadata": {
        "source": "manual-test"
    }
}
```

### 3. Connection Testing Tab

**Location**: Main content area, second tab

**Features**:

- Connection status testing
- Health check execution
- Group management testing

**Usage**:

#### Test Connection

- Click "Test Connection" to perform comprehensive connection test
- Results show connection details, groups, and timing

#### Health Check

- Click "Health Check" to verify system health
- Shows database, SignalR, authentication, and notification service status

#### Group Management

- Use "Join User Group" and "Join Organizer Group" buttons
- Test group-specific notification delivery

### 4. Error Testing Tab

**Location**: Main content area, third tab

**Features**:

- Error simulation
- Recovery testing
- Error type coverage

**Usage**:

#### Simulate Errors

Click any error type button to simulate:

- Authentication errors
- Connection errors
- Network errors
- Hub method errors
- Unexpected errors

#### Test Error Recovery

Click recovery buttons to test automatic error recovery:

- Tests error detection
- Verifies recovery mechanisms
- Measures recovery time

### 5. Configuration Tab

**Location**: Main content area, fourth tab

**Features**:

- Test configuration settings
- Batch size adjustment
- Timing controls
- Feature toggles

**Settings**:

- **Batch Size**: Number of notifications per batch (default: 5)
- **Interval (ms)**: Delay between batch notifications (default: 1000ms)
- **Auto Connect**: Automatically connect on component mount
- **Enable Logging**: Show detailed SignalR logs
- **Enable Health Check**: Periodic health monitoring

### 6. Test Results Panel

**Location**: Right sidebar, bottom panel

**Features**:

- Real-time test result display
- Result categorization
- Detailed result inspection
- Export functionality
- Clear results option

**Result Types**:

- **Notification**: Notification sending results
- **Connection**: Connection test results
- **Error**: Error simulation results
- **Health**: Health check results

**Usage**:

- View results in real-time as tests execute
- Click "View Details" to see full result data
- Use "Export" to download results as JSON
- Use "Clear" to reset result history

## Testing Scenarios

### 1. Basic Functionality Test

1. Open SignalR Tester
2. Verify connection status shows "Connected"
3. Send a single EventRegistration notification
4. Verify notification appears in results
5. Check that notification was received by the system

### 2. Error Handling Test

1. Go to Error Testing tab
2. Click "Connection" error simulation
3. Verify error appears in results
4. Check connection status shows error state
5. Wait for automatic recovery
6. Verify connection is restored

### 3. High Volume Test

1. Go to Configuration tab
2. Set batch size to 50
3. Set interval to 100ms
4. Go to Notifications tab
5. Click "Load Test Notifications"
6. Monitor performance in results panel

### 4. Group Management Test

1. Go to Connection Testing tab
2. Click "Join User Group"
3. Verify group appears in connection status
4. Send user-specific notification
5. Verify notification is received

### 5. Priority Testing

1. Go to Notifications tab
2. Set priority to "Critical"
3. Send notification
4. Verify priority is reflected in results
5. Test different priority levels

## API Integration

The testing component integrates with the SignalR Test Service API:

### Endpoints Used

- `POST /api/signalr/test/notification` - Send test notification
- `POST /api/signalr/test/batch` - Send batch notifications
- `POST /api/signalr/test/connection` - Test connection
- `GET /api/signalr/test/health` - Health check
- `POST /api/signalr/test/simulate-error` - Simulate errors
- `POST /api/signalr/test/error-recovery` - Test error recovery

### Authentication

The component uses the current user's authentication token for API calls. Ensure the user has appropriate permissions for testing endpoints.

## Troubleshooting

### Common Issues

#### Connection Not Establishing

1. Check SignalR hub URL in environment variables
2. Verify authentication token is valid
3. Check network connectivity
4. Review browser console for errors

#### Notifications Not Received

1. Verify connection is established
2. Check user is in correct groups
3. Verify notification type is supported
4. Check API endpoint availability

#### Test Results Not Appearing

1. Check browser console for JavaScript errors
2. Verify API endpoints are responding
3. Check authentication permissions
4. Clear browser cache and reload

#### Performance Issues

1. Reduce batch size in configuration
2. Increase interval between notifications
3. Clear test results regularly
4. Check system resources

### Debug Information

Enable detailed logging:

1. Go to Configuration tab
2. Enable "Enable Logging" toggle
3. Check browser console for detailed logs
4. Use browser network tab to monitor API calls

### Error Codes

Common error codes and meanings:

- `AUTH_001`: Authentication token expired
- `CONN_001`: Connection failed to establish
- `HUB_001`: Hub method invocation failed
- `NET_001`: Network timeout
- `VAL_001`: Validation error in request data

## Best Practices

### Testing Guidelines

1. **Start Simple**: Begin with basic connection and single notification tests
2. **Incremental Testing**: Gradually increase complexity and volume
3. **Error Testing**: Always test error scenarios and recovery
4. **Performance Testing**: Test with realistic data volumes
5. **Documentation**: Document test scenarios and results

### Development Workflow

1. **Feature Development**: Use tester during SignalR feature development
2. **Integration Testing**: Test with backend API integration
3. **Performance Validation**: Validate performance requirements
4. **Error Handling**: Verify error handling works correctly
5. **User Acceptance**: Use for manual user acceptance testing

### Production Considerations

1. **Remove from Production**: Ensure testing component is not included in production builds
2. **Security**: Restrict access to testing endpoints in production
3. **Performance**: Testing should not impact production performance
4. **Monitoring**: Use production monitoring instead of testing component

## Advanced Usage

### Custom Test Scenarios

Create custom test scenarios by extending the component:

```tsx
import { TestScenarios } from '@/services/SignalRTestService';

// Add custom scenario
const customScenario = {
    notifications: [
        { type: NotificationType.EventRegistration, userId: 'test-user' },
        { type: NotificationType.PaymentCompleted, userId: 'test-user' },
    ],
    batchSize: 2,
    intervalMs: 500,
};

// Use in testing
await signalRTestService.sendBatchTestNotifications(customScenario);
```

### Integration with CI/CD

Use the testing service programmatically in automated tests:

```typescript
import { signalRTestService } from '@/services/SignalRTestService';

describe('SignalR Integration Tests', () => {
    it('should handle notification flow', async () => {
        const result = await signalRTestService.sendTestNotification({
            type: NotificationType.EventRegistration,
            userId: 'test-user',
        });

        expect(result.sent).toBe(true);
    });
});
```

### Custom Notification Data

Inject custom data for specific test scenarios:

```json
{
    "eventId": "test-event-123",
    "eventTitle": "Test Event",
    "organizerName": "Test Organizer",
    "eventDate": "2024-12-31T23:59:59Z",
    "customMetadata": {
        "testScenario": "user-registration-flow",
        "expectedBehavior": "show-toast-notification"
    }
}
```

## Support

For issues or questions about the SignalR Testing Component:

1. Check this documentation first
2. Review browser console for errors
3. Check API endpoint status
4. Consult SignalR integration documentation
5. Contact the development team

## Version History

- **v1.0.0**: Initial release with basic testing functionality
- **v1.1.0**: Added error simulation and recovery testing
- **v1.2.0**: Added performance testing and batch scenarios
- **v1.3.0**: Added configuration options and export functionality
- **v2.0.0**: Complete rewrite with comprehensive testing suite
