# SignalR Troubleshooting Guide

## Overview

This guide helps diagnose and resolve common issues with the SignalR real-time notification system. Issues are organized by category with symptoms, causes, and solutions.

## Quick Diagnostics

### Connection Status Check

First, check the current connection status:

```typescript
import { useSignalR } from '@/hooks/useSignalR';

function DiagnosticComponent() {
  const { connectionState, error, isConnected } = useSignalR();
  
  console.log('Connection State:', connectionState);
  console.log('Is Connected:', isConnected);
  console.log('Error:', error);
  
  return (
    <div>
      <p>Status: {connectionState}</p>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Environment Check

Verify environment configuration:

```typescript
// Check in browser console
console.log('SignalR Hub URL:', process.env.NEXT_PUBLIC_SIGNALR_HUB_URL);
console.log('Debug Mode:', process.env.NEXT_PUBLIC_SIGNALR_DEBUG);
console.log('Environment:', process.env.NODE_ENV);
```

### Test Connection

Use the test service to verify connectivity:

```typescript
import { SignalRTestService } from '@/services/SignalRTestService';

const testService = new SignalRTestService();

// Test basic connectivity
testService.testConnection().then(isConnected => {
  console.log('Connection test result:', isConnected);
});

// Test token validity
testService.validateToken().then(isValid => {
  console.log('Token validation result:', isValid);
});
```

## Connection Issues

### Issue: Connection Never Establishes

**Symptoms:**
- Connection state stuck on "Connecting"
- No error messages
- Components show loading state indefinitely

**Possible Causes:**
1. Incorrect SignalR hub URL
2. Network connectivity issues
3. CORS configuration problems
4. Server not running or accessible

**Solutions:**

1. **Verify Hub URL**:
```typescript
// Check environment variable
const hubUrl = process.env.NEXT_PUBLIC_SIGNALR_HUB_URL;
console.log('Hub URL:', hubUrl);

// Should be something like: https://api.yourapp.com/notificationHub
```

2. **Test Network Connectivity**:
```bash
# Test if the server is reachable
curl -I https://your-api.com/notificationHub

# Check for CORS headers
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-api.com/notificationHub
```

3. **Check Browser Network Tab**:
- Open browser DevTools → Network tab
- Look for WebSocket connection attempts
- Check for 404, 500, or CORS errors

4. **Verify Server Configuration**:
```csharp
// Backend: Ensure SignalR hub is properly configured
app.MapHub<NotificationHub>("/notificationHub");

// Backend: Ensure CORS is configured
services.AddCors(options => {
    options.AddPolicy("AllowFrontend", builder => {
        builder.WithOrigins("http://localhost:3000", "https://yourapp.com")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});
```

### Issue: Connection Drops Frequently

**Symptoms:**
- Connection establishes but disconnects after short periods
- Frequent reconnection attempts
- "Reconnecting" status appears often

**Possible Causes:**
1. Network instability
2. Server-side connection limits
3. Firewall or proxy interference
4. Load balancer configuration issues

**Solutions:**

1. **Check Reconnection Settings**:
```typescript
// Verify reconnection configuration
const { connectionState, error } = useSignalR();

// Check if reconnection is working
useEffect(() => {
  console.log('Connection state changed:', connectionState);
}, [connectionState]);
```

2. **Monitor Network Stability**:
```typescript
// Add network monitoring
const { isOnline } = useOnlineStatus();

useEffect(() => {
  console.log('Network status:', isOnline ? 'online' : 'offline');
}, [isOnline]);
```

3. **Adjust Reconnection Settings**:
```env
# Increase reconnection delays if network is unstable
NEXT_PUBLIC_SIGNALR_RECONNECT_DELAY=5000
NEXT_PUBLIC_SIGNALR_MAX_RECONNECT_ATTEMPTS=10
```

4. **Check Server Logs**:
- Look for connection timeout errors
- Check for memory or resource issues
- Verify load balancer sticky session configuration

### Issue: Authentication Failures

**Symptoms:**
- Connection fails with 401 Unauthorized
- "Authentication failed" error messages
- Connection works initially but fails after token expiration

**Possible Causes:**
1. Invalid or expired JWT token
2. Token not being sent with connection
3. Server-side authentication configuration issues
4. Token refresh not working

**Solutions:**

1. **Verify Token Presence**:
```typescript
// Check if token is available
import { useAuth } from '@/providers/AuthProvider';

function TokenCheck() {
  const { token, isAuthenticated } = useAuth();
  
  console.log('Token present:', !!token);
  console.log('Is authenticated:', isAuthenticated);
  console.log('Token (first 20 chars):', token?.substring(0, 20));
  
  return null;
}
```

2. **Test Token Validity**:
```typescript
// Use test service to validate token
import { SignalRTestService } from '@/services/SignalRTestService';

const testService = new SignalRTestService();

testService.validateToken().then(result => {
  console.log('Token validation:', result);
}).catch(error => {
  console.debug('Token validation failed:', error);
});
```

3. **Check Token Refresh**:
```typescript
// Monitor token refresh
import { useAuth } from '@/providers/AuthProvider';

function TokenMonitor() {
  const { token, refreshToken } = useAuth();
  
  useEffect(() => {
    // Check token expiration
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const timeUntilExpiration = expirationTime - Date.now();
      
      console.log('Token expires in:', timeUntilExpiration, 'ms');
      
      if (timeUntilExpiration < 60000) { // Less than 1 minute
        console.log('Token expiring soon, refreshing...');
        refreshToken();
      }
    }
  }, [token, refreshToken]);
  
  return null;
}
```

4. **Verify Server Authentication**:
```csharp
// Backend: Ensure JWT authentication is configured
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context => {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && 
                    path.StartsWithSegments("/notificationHub"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });
```

## Notification Issues

### Issue: Notifications Not Received

**Symptoms:**
- SignalR connection is established
- No notifications appear in UI
- Backend shows notifications are being sent

**Possible Causes:**
1. Not joined to appropriate notification groups
2. Event handlers not properly registered
3. Notification filtering issues
4. Type validation failures

**Solutions:**

1. **Check Group Membership**:
```typescript
import { useNotificationGroups } from '@/hooks/useNotificationGroups';

function GroupCheck() {
  const { joinedGroups, isInGroup } = useNotificationGroups();
  
  console.log('Joined groups:', joinedGroups);
  console.log('Is in user group:', isInGroup('user'));
  console.log('Is in organizer group:', isInGroup('organizer'));
  
  return null;
}
```

2. **Verify Event Handlers**:
```typescript
import { useSignalR } from '@/hooks/useSignalR';

function EventHandlerCheck() {
  const { connection } = useSignalR();
  
  useEffect(() => {
    if (!connection) return;
    
    // Add debug handler
    const debugHandler = (data: any) => {
      console.log('Raw notification received:', data);
    };
    
    connection.on('ReceiveNotification', debugHandler);
    
    return () => {
      connection.off('ReceiveNotification', debugHandler);
    };
  }, [connection]);
  
  return null;
}
```

3. **Test Notification Sending**:
```typescript
// Use test service to send notifications
import { SignalRTestService } from '@/services/SignalRTestService';

const testService = new SignalRTestService();

// Send test notification
testService.sendEventNotification({
  eventId: 'test-event',
  eventTitle: 'Test Event',
  organizerName: 'Test Organizer',
  eventDate: new Date().toISOString()
}).then(() => {
  console.log('Test notification sent');
}).catch(error => {
  console.debug('Failed to send test notification:', error);
});
```

4. **Check Notification Validation**:
```typescript
// Check if notifications are being filtered out
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';

function NotificationDebug() {
  const { notifications, errors } = useTypedNotificationHandler();
  
  console.log('Received notifications:', notifications);
  console.log('Validation errors:', errors);
  
  return null;
}
```

### Issue: Notifications Appear But Don't Navigate

**Symptoms:**
- Notifications are received and displayed
- Clicking notification action buttons doesn't navigate
- Action URLs are present but not working

**Possible Causes:**
1. React Router not properly configured
2. Action URLs are malformed
3. Navigation permissions issues
4. Client-side routing conflicts

**Solutions:**

1. **Verify Action URLs**:
```typescript
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';

function ActionUrlCheck() {
  const { notifications } = useTypedNotificationHandler();
  
  notifications.forEach(notification => {
    console.log('Notification:', notification.title);
    console.log('Action URL:', notification.actionUrl);
    
    if (notification.actionUrl) {
      // Test URL validity
      try {
        new URL(notification.actionUrl, window.location.origin);
        console.log('✅ Valid URL');
      } catch {
        console.log('❌ Invalid URL');
      }
    }
  });
  
  return null;
}
```

2. **Test Navigation**:
```typescript
import { useRouter } from 'next/navigation';

function NavigationTest() {
  const router = useRouter();
  
  const testNavigation = (url: string) => {
    try {
      router.push(url);
      console.log('✅ Navigation successful:', url);
    } catch (error) {
      console.debug('❌ Navigation failed:', error);
    }
  };
  
  return (
    <button onClick={() => testNavigation('/test-route')}>
      Test Navigation
    </button>
  );
}
```

3. **Check Route Configuration**:
```typescript
// Verify routes exist in your app directory
// app/events/[id]/page.tsx should exist for /events/123 URLs
```

## Performance Issues

### Issue: High Memory Usage

**Symptoms:**
- Browser memory usage increases over time
- Application becomes slow after extended use
- Browser tab crashes or becomes unresponsive

**Possible Causes:**
1. Notification history not being cleaned up
2. Event handlers not being removed
3. Memory leaks in components
4. Too many notifications being stored

**Solutions:**

1. **Check Notification History Size**:
```typescript
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';

function MemoryCheck() {
  const { notifications } = useTypedNotificationHandler();
  
  console.log('Notification count:', notifications.length);
  
  // Calculate approximate memory usage
  const memoryUsage = JSON.stringify(notifications).length;
  console.log('Approximate memory usage:', memoryUsage, 'bytes');
  
  return null;
}
```

2. **Monitor Event Handlers**:
```typescript
// Check for proper cleanup
useEffect(() => {
  const handler = (data: any) => {
    console.log('Notification:', data);
  };
  
  connection?.on('ReceiveNotification', handler);
  
  // Ensure cleanup happens
  return () => {
    console.log('Cleaning up event handler');
    connection?.off('ReceiveNotification', handler);
  };
}, [connection]);
```

3. **Adjust History Limits**:
```typescript
// Reduce notification history if needed
const MAX_NOTIFICATIONS = 50; // Reduce from default 100

// Clear old notifications periodically
const clearOldNotifications = () => {
  // Implementation depends on your notification storage
};
```

4. **Use Browser DevTools**:
- Memory tab → Take heap snapshots
- Look for growing object counts
- Check for detached DOM nodes

### Issue: Slow Notification Processing

**Symptoms:**
- Delay between notification sent and displayed
- UI freezes when many notifications arrive
- Poor user experience during high notification volume

**Possible Causes:**
1. Notification batching not working
2. Heavy processing in notification handlers
3. DOM updates not optimized
4. Too many re-renders

**Solutions:**

1. **Check Batching Configuration**:
```typescript
// Verify batching is enabled
const BATCH_SIZE = 10;
const BATCH_DELAY = 500; // ms

console.log('Batch size:', BATCH_SIZE);
console.log('Batch delay:', BATCH_DELAY);
```

2. **Profile Performance**:
```typescript
// Add performance monitoring
const startTime = performance.now();

// Your notification processing code

const endTime = performance.now();
console.log('Processing time:', endTime - startTime, 'ms');
```

3. **Optimize Rendering**:
```typescript
// Use React.memo for notification components
const NotificationItem = React.memo(({ notification }) => {
  return (
    <div>
      <h3>{notification.title}</h3>
      <p>{notification.message}</p>
    </div>
  );
});

// Use virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';
```

4. **Debounce Updates**:
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedUpdate = useDebouncedCallback(
  (notifications) => {
    // Update UI
  },
  300 // 300ms delay
);
```

## Error Handling Issues

### Issue: Errors Not Being Caught

**Symptoms:**
- Application crashes on SignalR errors
- No error feedback to users
- Console shows unhandled promise rejections

**Possible Causes:**
1. Error boundaries not properly configured
2. Error handlers not registered
3. Async errors not being caught
4. Missing try-catch blocks

**Solutions:**

1. **Add Error Boundary**:
```typescript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>SignalR Error</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SignalRProvider>
        <YourComponents />
      </SignalRProvider>
    </ErrorBoundary>
  );
}
```

2. **Use Error Handler Hook**:
```typescript
import { useSignalRErrorHandler } from '@/hooks/useSignalRErrorHandler';

function ErrorDisplay() {
  const { errors, lastError, clearErrors } = useSignalRErrorHandler();
  
  if (lastError) {
    return (
      <div className="error-banner">
        <p>Connection error: {lastError.message}</p>
        <button onClick={clearErrors}>Dismiss</button>
      </div>
    );
  }
  
  return null;
}
```

3. **Add Global Error Handler**:
```typescript
// Add to your app initialization
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('SignalR')) {
    console.debug('Unhandled SignalR error:', event.reason);
    // Handle SignalR-specific errors
    event.preventDefault();
  }
});
```

## Testing Issues

### Issue: Tests Failing Due to SignalR

**Symptoms:**
- Tests that worked before now fail
- "Cannot read property of undefined" errors in tests
- SignalR connection attempts in test environment

**Possible Causes:**
1. SignalR provider not mocked in tests
2. Environment variables not set in test environment
3. Async operations not properly awaited
4. Test cleanup not happening

**Solutions:**

1. **Mock SignalR Provider**:
```typescript
// In your test setup
import { createMockSignalRConnection } from '@/tests/utils/signalr-mocks';

const mockConnection = createMockSignalRConnection();

const TestWrapper = ({ children }) => (
  <SignalRProvider connection={mockConnection}>
    {children}
  </SignalRProvider>
);

// Use in tests
render(<MyComponent />, { wrapper: TestWrapper });
```

2. **Set Test Environment Variables**:
```javascript
// jest.setup.js
process.env.NEXT_PUBLIC_SIGNALR_HUB_URL = 'http://localhost:3000/test-hub';
process.env.NEXT_PUBLIC_SIGNALR_DEBUG = 'false';
```

3. **Handle Async Operations**:
```typescript
// Wait for SignalR operations in tests
import { waitFor } from '@testing-library/react';

test('handles notifications', async () => {
  render(<MyComponent />);
  
  // Simulate notification
  mockConnection.simulateNotification({
    type: 'EventRegistration',
    title: 'Test'
  });
  
  // Wait for UI update
  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## Getting Additional Help

### Enable Debug Mode

```env
NEXT_PUBLIC_SIGNALR_DEBUG=true
NODE_ENV=development
```

### Collect Diagnostic Information

```typescript
// Add this component temporarily for debugging
function SignalRDiagnostics() {
  const { connection, connectionState, error } = useSignalR();
  const { joinedGroups } = useNotificationGroups();
  const { notifications } = useTypedNotificationHandler();
  
  const diagnostics = {
    connectionState,
    isConnected: connection?.state === 'Connected',
    error: error?.message,
    joinedGroups,
    notificationCount: notifications.length,
    hubUrl: process.env.NEXT_PUBLIC_SIGNALR_HUB_URL,
    timestamp: new Date().toISOString()
  };
  
  return (
    <details>
      <summary>SignalR Diagnostics</summary>
      <pre>{JSON.stringify(diagnostics, null, 2)}</pre>
    </details>
  );
}
```

### Check Browser Console

Look for these types of messages:
- SignalR connection logs
- WebSocket errors
- Authentication failures
- Network errors
- JavaScript errors

### Network Analysis

Use browser DevTools Network tab:
1. Filter by "WS" (WebSocket) to see SignalR traffic
2. Check for failed connection attempts
3. Look at request/response headers
4. Monitor message flow

### Contact Support

If issues persist, provide:
1. Browser console logs
2. Network tab screenshots
3. Diagnostic information from above
4. Steps to reproduce the issue
5. Expected vs actual behavior

Remember: Most SignalR issues are related to network connectivity, authentication, or configuration. Start with the basics and work your way up to more complex scenarios.