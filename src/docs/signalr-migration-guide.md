# SignalR Migration Guide

## Overview

This guide helps developers migrate from the old SignalR implementation to the new production-ready system. The migration is designed to be gradual and backward-compatible to minimize disruption.

## Migration Timeline

### Phase 1: Preparation (Completed)
- ✅ New SignalR infrastructure implemented
- ✅ Type definitions created
- ✅ Core hooks and providers built
- ✅ Testing utilities established

### Phase 2: Gradual Migration (Current)
- 🔄 Components migrate to new hooks one by one
- 🔄 Old system remains functional during transition
- 🔄 Backward compatibility maintained

### Phase 3: Cleanup (Future)
- ⏳ Remove old SignalR implementation
- ⏳ Update all remaining components
- ⏳ Final optimization and cleanup

## What's Changed

### Architecture Changes

#### Old System
```
Old SignalR (Basic)
├── Direct HubConnection usage
├── Manual connection management
├── Basic error handling
├── No type safety
└── Limited notification support
```

#### New System
```
New SignalR (Production-Ready)
├── Provider-based architecture
├── Automatic connection management
├── Comprehensive error handling
├── Full TypeScript support
├── Rich notification system
├── Performance optimizations
└── Security enhancements
```

### Key Improvements

1. **Type Safety**: Full TypeScript support with proper interfaces
2. **Error Handling**: Comprehensive error categorization and recovery
3. **Authentication**: Integrated JWT token management
4. **Performance**: Batching, debouncing, and memory management
5. **Testing**: Complete testing infrastructure
6. **Security**: Data sanitization and rate limiting
7. **User Experience**: Better connection status and error feedback

## Migration Steps

### Step 1: Update Imports

#### Before (Old System)
```typescript
// Old direct SignalR usage
import { HubConnectionBuilder } from '@microsoft/signalr';

// Manual connection setup
const connection = new HubConnectionBuilder()
  .withUrl('/notificationHub')
  .build();
```

#### After (New System)
```typescript
// New hook-based approach
import { useSignalR } from '@/hooks/useSignalR';
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';

// Automatic connection management
const { connection, isConnected } = useSignalR();
const { notifications } = useTypedNotificationHandler();
```

### Step 2: Update Component Structure

#### Before (Old System)
```typescript
function OrganizerDashboard() {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Manual connection setup
    const newConnection = new HubConnectionBuilder()
      .withUrl('/notificationHub')
      .build();

    newConnection.start().then(() => {
      setConnection(newConnection);
      
      // Manual event handlers
      newConnection.on('ReceiveNotification', (data) => {
        setNotifications(prev => [...prev, data]);
      });
    });

    return () => {
      newConnection?.stop();
    };
  }, []);

  return (
    <div>
      {notifications.map(notification => (
        <div key={notification.id}>
          {notification.message}
        </div>
      ))}
    </div>
  );
}
```

#### After (New System)
```typescript
function OrganizerDashboard() {
  const { notifications, markAsRead } = useTypedNotificationHandler();
  const { isConnected } = useSignalR();

  return (
    <div>
      {!isConnected && <div>Connecting...</div>}
      
      {notifications.map(notification => (
        <div 
          key={notification.id}
          onClick={() => markAsRead(notification.id)}
        >
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          {notification.actionUrl && (
            <a href={notification.actionUrl}>View Details</a>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Step 3: Update Provider Setup

#### Before (Old System)
```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

#### After (New System)
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

### Step 4: Update Notification Handling

#### Before (Old System)
```typescript
// Manual notification handling
useEffect(() => {
  if (connection) {
    connection.on('ReceiveNotification', (data: any) => {
      // Manual parsing and validation
      if (data && data.message) {
        setNotifications(prev => [...prev, data]);
        
        // Manual toast notification
        toast(data.message);
      }
    });
  }
}, [connection]);
```

#### After (New System)
```typescript
// Automatic notification handling
const { notifications } = useTypedNotificationHandler();

// Notifications are automatically:
// - Type-checked and validated
// - Added to the notification list
// - Displayed as toast notifications
// - Routed to appropriate handlers
```

### Step 5: Update Error Handling

#### Before (Old System)
```typescript
// Basic error handling
useEffect(() => {
  if (connection) {
    connection.onclose((error) => {
      console.debug('Connection closed:', error);
      // Manual reconnection logic
    });
  }
}, [connection]);
```

#### After (New System)
```typescript
// Comprehensive error handling
const { error, retryConnection } = useSignalRErrorHandler();

// Errors are automatically:
// - Categorized by type
// - Handled with appropriate recovery strategies
// - Logged for debugging
// - Displayed to users with actionable feedback
```

## Component-Specific Migration

### Migrating useOrganizerRealtime

The `useOrganizerRealtime` hook has been updated to use the new infrastructure while maintaining the same API.

#### Before
```typescript
// Old implementation (internal)
const useOrganizerRealtime = () => {
  // Basic SignalR connection
  // Manual event handling
  // Limited error handling
};
```

#### After
```typescript
// New implementation (internal) - API unchanged
const useOrganizerRealtime = () => {
  // Uses new SignalR infrastructure
  // Comprehensive error handling
  // Type-safe notifications
  // Same external API for backward compatibility
};
```

**No changes required** - existing components using `useOrganizerRealtime` continue to work without modification.

### Migrating Custom SignalR Usage

If you have custom SignalR connections, migrate them to use the new system:

#### Before
```typescript
function CustomComponent() {
  const [connection, setConnection] = useState<HubConnection | null>(null);

  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl('/customHub')
      .build();

    newConnection.start().then(() => {
      setConnection(newConnection);
    });

    return () => {
      newConnection?.stop();
    };
  }, []);

  return <div>Custom component</div>;
}
```

#### After
```typescript
function CustomComponent() {
  const { connection } = useSignalR();

  useEffect(() => {
    if (!connection) return;

    // Use the existing connection for custom handlers
    const handleCustomEvent = (data: any) => {
      // Your custom logic
    };

    connection.on('CustomEvent', handleCustomEvent);

    return () => {
      connection.off('CustomEvent', handleCustomEvent);
    };
  }, [connection]);

  return <div>Custom component</div>;
}
```

## Testing Migration

### Old Testing Approach
```typescript
// Manual mocking
jest.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: jest.fn(() => ({
    withUrl: jest.fn().mockReturnThis(),
    build: jest.fn(() => mockConnection)
  }))
}));
```

### New Testing Approach
```typescript
// Use provided test utilities
import { createMockSignalRConnection } from '@/tests/utils/signalr-mocks';

describe('MyComponent', () => {
  it('handles notifications', () => {
    const mockConnection = createMockSignalRConnection();
    
    render(
      <SignalRProvider connection={mockConnection}>
        <MyComponent />
      </SignalRProvider>
    );

    // Simulate notification
    mockConnection.simulateNotification({
      type: 'EventRegistration',
      title: 'Test Notification'
    });

    // Assert behavior
  });
});
```

## Environment Variables

### New Environment Variables

Add these to your `.env` files:

```env
# SignalR Configuration
NEXT_PUBLIC_SIGNALR_HUB_URL=https://your-api.com/notificationHub
NEXT_PUBLIC_SIGNALR_DEBUG=false

# Optional: Performance tuning
NEXT_PUBLIC_SIGNALR_RECONNECT_DELAY=2000
NEXT_PUBLIC_SIGNALR_MAX_RECONNECT_ATTEMPTS=5
```

## Breaking Changes

### Minimal Breaking Changes

The migration is designed to minimize breaking changes:

✅ **Existing hooks continue to work** - `useOrganizerRealtime` maintains its API
✅ **Gradual migration** - Components can be migrated one at a time
✅ **Backward compatibility** - Old patterns continue to work during transition

### Potential Issues

⚠️ **Direct HubConnection usage** - If you're creating connections directly, migrate to use the provider
⚠️ **Custom event handlers** - May need updates for new type system
⚠️ **Manual connection management** - Should be replaced with hooks

## Performance Impact

### Improvements

✅ **Better connection management** - Automatic reconnection with exponential backoff
✅ **Notification batching** - Prevents UI flooding
✅ **Memory management** - Automatic cleanup and history limits
✅ **Reduced bundle size** - Shared connection instance

### Monitoring

Monitor these metrics during migration:

- Connection establishment time
- Notification processing latency
- Error rates
- Memory usage
- User experience metrics

## Rollback Plan

If issues occur during migration:

### Immediate Rollback
1. Revert to previous deployment
2. Disable new SignalR features via feature flags
3. Monitor system stability

### Gradual Rollback
1. Migrate problematic components back to old system
2. Keep new infrastructure for working components
3. Address issues and re-migrate

## Common Migration Issues

### Issue 1: Connection Not Establishing

**Symptoms**: Components show "connecting" state indefinitely

**Solution**:
```typescript
// Check environment variables
console.log('SignalR URL:', process.env.NEXT_PUBLIC_SIGNALR_HUB_URL);

// Verify provider setup
<SignalRProvider>
  <YourComponents />
</SignalRProvider>
```

### Issue 2: Notifications Not Appearing

**Symptoms**: SignalR connected but notifications not showing

**Solution**:
```typescript
// Check notification handler setup
const { notifications, error } = useTypedNotificationHandler();

// Verify group membership
const { joinedGroups } = useNotificationGroups();
```

### Issue 3: Type Errors

**Symptoms**: TypeScript compilation errors

**Solution**:
```typescript
// Update imports to use new types
import type { NotificationMessage } from '@/types/notifications';

// Use type guards for validation
if (isEventNotificationData(data)) {
  // TypeScript knows this is EventNotificationData
}
```

### Issue 4: Performance Issues

**Symptoms**: Slow UI updates or high memory usage

**Solution**:
```typescript
// Check notification batching settings
const BATCH_SIZE = 10; // Reduce if needed
const BATCH_DELAY = 500; // Increase if needed

// Monitor notification history size
const MAX_NOTIFICATIONS = 100; // Adjust as needed
```

## Testing Your Migration

### Checklist

- [ ] SignalR connection establishes successfully
- [ ] Notifications are received and displayed
- [ ] Error handling works correctly
- [ ] Reconnection works after network issues
- [ ] Performance is acceptable
- [ ] No memory leaks detected
- [ ] All tests pass
- [ ] User experience is improved

### Testing Tools

Use the provided testing utilities:

```typescript
// Manual testing
import { SignalRTestService } from '@/services/SignalRTestService';

const testService = new SignalRTestService();

// Test connection
await testService.testConnection();

// Send test notifications
await testService.sendEventNotification({
  eventId: 'test',
  eventTitle: 'Test Event',
  organizerName: 'Test Organizer',
  eventDate: new Date().toISOString()
});
```

## Getting Help

### Resources

1. **Integration Guide**: [SignalR Integration Guide](./signalr-integration-guide.md)
2. **Troubleshooting**: [SignalR Troubleshooting Guide](./signalr-troubleshooting-guide.md)
3. **API Reference**: [SignalR API Reference](./signalr-api-reference.md)

### Support

If you encounter issues during migration:

1. Check the troubleshooting guide
2. Review the integration guide
3. Use the testing utilities to diagnose issues
4. Check the browser console for errors
5. Verify environment configuration

## Post-Migration

### Cleanup Tasks

After successful migration:

1. Remove old SignalR code
2. Update documentation
3. Remove unused dependencies
4. Optimize performance
5. Update monitoring and alerting

### Monitoring

Continue monitoring these metrics:

- Connection success rate
- Notification delivery rate
- Error rates
- User satisfaction
- Performance metrics

The migration is designed to be smooth and gradual. Take your time, test thoroughly, and don't hesitate to rollback if issues occur.