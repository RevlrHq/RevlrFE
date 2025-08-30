# SignalR Integration Guide

## Overview

This guide provides comprehensive documentation for the new SignalR real-time notification system in the Revlr event management platform. The system has been completely rewritten to provide production-ready, type-safe, and robust real-time communication capabilities.

## Architecture Overview

The SignalR integration follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                        │
├─────────────────────────────────────────────────────────────┤
│  Components Layer                                           │
│  ├── UserNotifications                                      │
│  ├── OrganizerNotifications                                 │
│  ├── ConnectionStatus                                       │
│  └── NotificationToast                                      │
├─────────────────────────────────────────────────────────────┤
│  Hooks Layer                                                │
│  ├── useSignalR (Core connection management)                │
│  ├── useNotificationGroups (User group management)         │
│  ├── useTypedNotificationHandler (Type-safe notifications) │
│  └── useSignalRErrorHandler (Error handling & recovery)    │
├─────────────────────────────────────────────────────────────┤
│  Provider Layer                                             │
│  ├── SignalRProvider (Connection context)                  │
│  └── AuthProvider (JWT token management)                   │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                             │
│  ├── SignalRTestService (Testing utilities)                │
│  └── NotificationService (Business logic)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                         │
│  ├── SignalR Hub                                           │
│  ├── NotificationService                                   │
│  ├── AuthenticationService                                 │
│  └── Test Endpoints                                        │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### SignalR Provider

The `SignalRProvider` is the foundation of the system, providing SignalR connection context to the entire application.

```typescript
import { SignalRProvider } from '@/providers/SignalRProvider';

function App() {
  return (
    <AuthProvider>
      <SignalRProvider>
        <YourAppComponents />
      </SignalRProvider>
    </AuthProvider>
  );
}
```

**Key Features:**
- Automatic connection management with JWT authentication
- Connection state sharing across components
- Integration with existing AuthProvider
- Automatic cleanup on unmount

### Core Hooks

#### useSignalR

The primary hook for managing SignalR connections.

```typescript
import { useSignalR } from '@/hooks/useSignalR';

function MyComponent() {
  const { 
    connection, 
    connectionState, 
    isConnected, 
    isConnecting, 
    isReconnecting,
    error,
    startConnection,
    stopConnection 
  } = useSignalR();

  // Connection is automatically managed
  // Manual control available if needed
}
```

**Features:**
- Automatic connection establishment with JWT authentication
- Exponential backoff reconnection (0ms, 2s, 10s, 30s)
- Connection state tracking
- Error categorization and handling
- Token refresh integration

#### useNotificationGroups

Manages user group membership for targeted notifications.

```typescript
import { useNotificationGroups } from '@/hooks/useNotificationGroups';

function MyComponent() {
  const { 
    joinedGroups, 
    joinGroup, 
    leaveGroup, 
    isInGroup 
  } = useNotificationGroups();

  // Groups are automatically managed based on user role
  // Manual group management available if needed
}
```

**Automatic Group Management:**
- Regular users: Join user-specific groups
- Organizers: Join both user and organizer groups
- Automatic rejoin on reconnection
- Cleanup on disconnect

#### useTypedNotificationHandler

Provides type-safe notification handling with proper routing.

```typescript
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';

function MyComponent() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    dismissNotification,
    clearAll 
  } = useTypedNotificationHandler();

  // Notifications are automatically typed and validated
  // Navigation and UI updates handled automatically
}
```

**Features:**
- Full TypeScript type safety
- Automatic notification validation
- Priority-based display logic
- Toast notification integration
- Navigation handling for action URLs

#### useSignalRErrorHandler

Comprehensive error handling and recovery system.

```typescript
import { useSignalRErrorHandler } from '@/hooks/useSignalRErrorHandler';

function MyComponent() {
  const { 
    errors, 
    lastError, 
    clearErrors, 
    retryConnection 
  } = useSignalRErrorHandler();

  // Errors are automatically categorized and handled
  // Recovery strategies implemented automatically
}
```

**Error Categories:**
- Authentication errors (token refresh, unauthorized)
- Connection errors (network issues, server unavailable)
- Hub method errors (invalid calls, parameter errors)
- Unexpected errors (unknown issues)

## Notification System

### Notification Types

The system supports comprehensive notification types that mirror backend C# models:

#### Event Notifications
```typescript
interface EventNotificationData {
  eventId: string;
  eventTitle: string;
  organizerName: string;
  eventDate: string;
  location?: string;
  ticketPrice?: number;
}

// Notification types:
// - EventRegistration: User registered for event
// - EventUpdate: Event details changed
// - EventPublished: Event was published
// - EventCancelled: Event was cancelled
```

#### Payment Notifications
```typescript
interface PaymentNotificationData {
  paymentId: string;
  amount: number;
  currency: string;
  eventTitle: string;
  status: 'completed' | 'failed' | 'pending';
  failureReason?: string;
}

// Notification types:
// - PaymentCompleted: Payment processed successfully
// - PaymentFailed: Payment processing failed
// - PaymentPending: Payment being processed
// - RecurringPaymentProcessed: Recurring payment completed
```

#### Financing Notifications
```typescript
interface FinancingNotificationData {
  applicationId: string;
  eventTitle: string;
  requestedAmount: number;
  status: 'submitted' | 'approved' | 'rejected';
  reason?: string;
  approvedAmount?: number;
}

// Notification types:
// - FinancingApplicationSubmitted: New application
// - FinancingApplicationApproved: Application approved
// - FinancingApplicationRejected: Application rejected
// - FinancingPaymentDue: Payment due reminder
```

#### System Notifications
```typescript
interface SystemNotificationData {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  maintenanceWindow?: {
    start: string;
    end: string;
  };
}

// Notification types:
// - SystemMaintenance: Scheduled maintenance
// - SystemUpdate: System updates available
```

### Notification Components

#### UserNotifications

Component for displaying notifications to regular users.

```typescript
import { UserNotifications } from '@/components/notifications/UserNotifications';

function UserDashboard() {
  return (
    <div>
      <UserNotifications 
        maxNotifications={50}
        showUnreadOnly={false}
        enableFiltering={true}
      />
    </div>
  );
}
```

**Features:**
- Event registration confirmations
- Payment status updates
- Financing application updates
- System notifications
- Read/unread status management
- Notification filtering and search

#### OrganizerNotifications

Component for organizer-specific notifications.

```typescript
import { OrganizerNotifications } from '@/components/notifications/OrganizerNotifications';

function OrganizerDashboard() {
  return (
    <div>
      <OrganizerNotifications 
        eventId="optional-event-filter"
        groupByEvent={true}
        showRevenueUpdates={true}
      />
    </div>
  );
}
```

**Features:**
- New event registrations
- Revenue updates
- Event status changes
- Financing application reviews
- Event-specific grouping
- Real-time dashboard updates

#### ConnectionStatus

Shows real-time connection status to users.

```typescript
import { ConnectionStatus } from '@/components/notifications/ConnectionStatus';

function AppHeader() {
  return (
    <header>
      <ConnectionStatus 
        showWhenConnected={false}
        enableManualReconnect={true}
        position="top-right"
      />
    </header>
  );
}
```

**Status Indicators:**
- Connected (green indicator)
- Connecting (yellow indicator)
- Disconnected (red indicator)
- Reconnecting (animated indicator)

## Usage Patterns

### Basic Setup

1. **Install Dependencies** (already done in the project):
```bash
pnpm add @microsoft/signalr
```

2. **Environment Configuration**:
```env
NEXT_PUBLIC_SIGNALR_HUB_URL=https://your-api.com/notificationHub
```

3. **Provider Setup**:
```typescript
// app/layout.tsx
import { SignalRProvider } from '@/providers/SignalRProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <SignalRProvider>
            {children}
          </SignalRProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Using Notifications in Components

```typescript
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';

function MyComponent() {
  const { notifications, markAsRead } = useTypedNotificationHandler();

  return (
    <div>
      {notifications.map(notification => (
        <div key={notification.id} onClick={() => markAsRead(notification.id)}>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          {notification.actionUrl && (
            <button onClick={() => window.location.href = notification.actionUrl}>
              View Details
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Custom Notification Handling

```typescript
import { useSignalR } from '@/hooks/useSignalR';
import { useEffect } from 'react';

function CustomNotificationHandler() {
  const { connection } = useSignalR();

  useEffect(() => {
    if (!connection) return;

    const handleCustomNotification = (data: any) => {
      // Custom handling logic
      console.log('Custom notification:', data);
    };

    connection.on('CustomNotification', handleCustomNotification);

    return () => {
      connection.off('CustomNotification', handleCustomNotification);
    };
  }, [connection]);

  return null;
}
```

## Testing

### Testing Utilities

The system includes comprehensive testing utilities:

```typescript
// Test service for manual testing
import { SignalRTestService } from '@/services/SignalRTestService';

const testService = new SignalRTestService();

// Send test notifications
await testService.sendEventNotification({
  eventId: 'test-event',
  eventTitle: 'Test Event',
  organizerName: 'Test Organizer',
  eventDate: new Date().toISOString()
});

// Test connection
const isConnected = await testService.testConnection();
```

### Mock for Unit Tests

```typescript
// Test utilities
import { createMockSignalRConnection } from '@/tests/utils/signalr-mocks';

describe('MyComponent', () => {
  it('handles notifications correctly', () => {
    const mockConnection = createMockSignalRConnection();
    
    render(
      <SignalRProvider connection={mockConnection}>
        <MyComponent />
      </SignalRProvider>
    );

    // Simulate notification
    mockConnection.simulateNotification({
      type: 'EventRegistration',
      title: 'New Registration',
      message: 'Someone registered for your event'
    });

    // Assert component behavior
  });
});
```

## Performance Considerations

### Notification Batching

The system automatically batches notifications to prevent UI flooding:

```typescript
// Automatic batching configuration
const BATCH_SIZE = 10;
const BATCH_DELAY = 500; // ms

// Notifications are automatically batched and debounced
```

### Memory Management

- Notification history is limited to prevent memory issues
- Automatic cleanup of old notifications
- Proper event handler cleanup on unmount

### Connection Optimization

- Page visibility handling for connection management
- Reduced activity when page is hidden
- Proper cleanup on component unmount

## Security Features

### Data Sanitization

All notification content is automatically sanitized:

```typescript
import DOMPurify from 'dompurify';

// Automatic HTML sanitization
const sanitizedContent = DOMPurify.sanitize(notification.message);
```

### Rate Limiting

Client-side rate limiting prevents abuse:

```typescript
// Automatic rate limiting for user actions
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60000 // 1 minute
};
```

### Token Security

- Secure JWT token management
- Automatic token refresh
- Proper token cleanup on logout

## Error Handling

### Automatic Recovery

The system implements comprehensive error recovery:

1. **Authentication Errors**: Automatic token refresh and retry
2. **Connection Errors**: Exponential backoff reconnection
3. **Hub Method Errors**: Retry with backoff
4. **Network Errors**: User feedback and retry options

### Error Logging

All errors are logged with comprehensive context:

```typescript
// Automatic error logging
{
  errorType: 'ConnectionError',
  message: 'Failed to connect to SignalR hub',
  timestamp: '2024-01-01T12:00:00Z',
  connectionState: 'Disconnected',
  userContext: { userId: 'user123', role: 'organizer' }
}
```

## Monitoring and Debugging

### Debug Mode

Enable detailed logging in development:

```env
NODE_ENV=development
NEXT_PUBLIC_SIGNALR_DEBUG=true
```

### Connection Health Monitoring

```typescript
import { useSignalR } from '@/hooks/useSignalR';

function ConnectionMonitor() {
  const { connectionState, error, lastPing } = useSignalR();

  return (
    <div>
      <p>Status: {connectionState}</p>
      <p>Last Ping: {lastPing}</p>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Performance Metrics

The system tracks performance metrics:

- Connection establishment time
- Message processing latency
- Error rates
- Reconnection frequency

## Migration from Old System

### Backward Compatibility

The new system maintains backward compatibility during migration:

```typescript
// Old hook still works during transition
import { useOrganizerRealtime } from '@/hooks/useOrganizerRealtime';

// New system is used internally but API remains the same
```

### Migration Steps

1. **Phase 1**: New system runs alongside old system
2. **Phase 2**: Components gradually migrate to new hooks
3. **Phase 3**: Old system is removed
4. **Phase 4**: Final cleanup and optimization

## Best Practices

### Do's

✅ **Use the provided hooks** - They handle all the complexity for you
✅ **Handle loading and error states** - Always provide user feedback
✅ **Clean up event handlers** - Use useEffect cleanup functions
✅ **Type your notifications** - Use the provided TypeScript interfaces
✅ **Test notification handling** - Use the provided testing utilities

### Don'ts

❌ **Don't create direct SignalR connections** - Use the provider system
❌ **Don't ignore error states** - Always handle errors gracefully
❌ **Don't forget cleanup** - Memory leaks can occur without proper cleanup
❌ **Don't bypass type safety** - Use the provided type guards
❌ **Don't hardcode notification types** - Use the enum constants

## Troubleshooting

See the [SignalR Troubleshooting Guide](./signalr-troubleshooting-guide.md) for common issues and solutions.

## API Reference

For detailed API documentation, see the [SignalR API Reference](./signalr-api-reference.md).