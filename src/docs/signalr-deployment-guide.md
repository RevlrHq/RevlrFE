# SignalR Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the SignalR real-time notification system to production environments. It covers environment configuration, testing procedures, monitoring setup, and rollback strategies.

## Pre-Deployment Checklist

### ✅ Environment Configuration

#### Required Environment Variables

Ensure these environment variables are properly configured in your deployment environment:

```env
# Core SignalR Configuration (Required)
NEXT_PUBLIC_SIGNALR_HUB_URL=https://your-api.com/notificationHub
NEXT_PUBLIC_API_URL=https://your-api.com

# Authentication (Required)
AUTH_SECRET=your-auth-secret
NEXTAUTH_URL=https://your-app.com
NEXTAUTH_SECRET=your-nextauth-secret

# SignalR Performance Tuning (Optional)
NEXT_PUBLIC_SIGNALR_DEBUG=false
NEXT_PUBLIC_SIGNALR_RECONNECT_DELAY=2000
NEXT_PUBLIC_SIGNALR_MAX_RECONNECT_ATTEMPTS=5
NEXT_PUBLIC_SIGNALR_BATCH_SIZE=10
NEXT_PUBLIC_SIGNALR_BATCH_DELAY=500
NEXT_PUBLIC_SIGNALR_MAX_NOTIFICATIONS=100
NEXT_PUBLIC_SIGNALR_PING_INTERVAL=30000
NEXT_PUBLIC_SIGNALR_CONNECTION_TIMEOUT=15000

# Monitoring and Debugging (Optional)
NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT=https://api.example.com/errors
NEXT_PUBLIC_PERFORMANCE_MONITORING=true
```

#### Environment-Specific Configuration

**Development:**
```env
NEXT_PUBLIC_SIGNALR_DEBUG=true
NEXT_PUBLIC_SIGNALR_HUB_URL=http://localhost:5000/notificationHub
```

**Staging:**
```env
NEXT_PUBLIC_SIGNALR_DEBUG=false
NEXT_PUBLIC_SIGNALR_HUB_URL=https://staging-api.yourapp.com/notificationHub
```

**Production:**
```env
NEXT_PUBLIC_SIGNALR_DEBUG=false
NEXT_PUBLIC_SIGNALR_HUB_URL=https://api.yourapp.com/notificationHub
NEXT_PUBLIC_SIGNALR_RECONNECT_DELAY=5000
NEXT_PUBLIC_SIGNALR_MAX_RECONNECT_ATTEMPTS=10
```

### ✅ Backend Configuration

Ensure the backend SignalR hub is properly configured:

#### CORS Configuration
```csharp
// Program.cs or Startup.cs
services.AddCors(options => {
    options.AddPolicy("AllowFrontend", builder => {
        builder.WithOrigins(
            "http://localhost:3000",      // Development
            "https://staging.yourapp.com", // Staging
            "https://yourapp.com"         // Production
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

app.UseCors("AllowFrontend");
```

#### SignalR Hub Registration
```csharp
// Ensure SignalR hub is registered
services.AddSignalR(options => {
    options.EnableDetailedErrors = isDevelopment;
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
});

app.MapHub<NotificationHub>("/notificationHub");
```

#### Authentication Configuration
```csharp
// JWT Authentication for SignalR
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

### ✅ Build Configuration

#### Next.js Configuration
Ensure your `next.config.js` is properly configured:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable WebSocket support
  experimental: {
    serverComponentsExternalPackages: ['@microsoft/signalr']
  },
  
  // Environment variable validation
  env: {
    NEXT_PUBLIC_SIGNALR_HUB_URL: process.env.NEXT_PUBLIC_SIGNALR_HUB_URL,
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

#### Package.json Scripts
Ensure deployment scripts are available:

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "test:signalr": "jest --testPathPattern=signalr",
    "test:integration": "jest --testPathPattern=integration",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

## Staging Environment Testing

### ✅ Pre-Deployment Testing

Before deploying to production, thoroughly test in staging:

#### 1. Connection Testing
```bash
# Test SignalR connectivity
curl -I https://staging-api.yourapp.com/notificationHub

# Test WebSocket upgrade
curl -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     https://staging-api.yourapp.com/notificationHub
```

#### 2. Authentication Testing
```typescript
// Use the test service to verify authentication
import { SignalRTestService } from '@/services/SignalRTestService';

const testService = new SignalRTestService('https://staging-api.yourapp.com');

// Test connection with authentication
const isConnected = await testService.testConnection();
console.log('Connection test:', isConnected);

// Test token validation
const isTokenValid = await testService.validateToken();
console.log('Token validation:', isTokenValid);
```

#### 3. Notification Flow Testing
```typescript
// Test all notification types
const testService = new SignalRTestService();

// Test event notifications
await testService.sendEventNotification({
  eventId: 'test-event',
  eventTitle: 'Test Event',
  organizerName: 'Test Organizer',
  eventDate: new Date().toISOString()
});

// Test payment notifications
await testService.sendPaymentNotification({
  paymentId: 'test-payment',
  amount: 100,
  currency: 'USD',
  eventTitle: 'Test Event',
  status: 'completed'
});

// Test financing notifications
await testService.sendFinancingNotification({
  applicationId: 'test-app',
  eventTitle: 'Test Event',
  requestedAmount: 1000,
  status: 'approved'
});

// Test system notifications
await testService.sendSystemNotification({
  title: 'System Test',
  message: 'This is a test notification',
  severity: 'info'
});
```

#### 4. Performance Testing
```typescript
// Test notification batching
await testService.sendBulkNotifications(50, 'EventRegistration');

// Test connection latency
const latency = await testService.measureLatency();
console.log('Connection latency:', latency, 'ms');

// Test reconnection
const reconnectionWorks = await testService.testReconnection();
console.log('Reconnection test:', reconnectionWorks);
```

#### 5. Error Handling Testing
```typescript
// Test error scenarios
try {
  // Test with invalid token
  await testService.testConnection();
} catch (error) {
  console.log('Expected error:', error.message);
}

// Test network interruption handling
// (Manually disconnect network and verify reconnection)
```

### ✅ Load Testing

Perform load testing to ensure the system can handle expected traffic:

#### Connection Load Test
```javascript
// Simple load test script
const connections = [];
const targetConnections = 100;

for (let i = 0; i < targetConnections; i++) {
  const connection = new HubConnectionBuilder()
    .withUrl('https://staging-api.yourapp.com/notificationHub', {
      accessTokenFactory: () => getTestToken()
    })
    .build();
    
  connections.push(connection);
  
  connection.start().then(() => {
    console.log(`Connection ${i + 1} established`);
  }).catch(error => {
    console.debug(`Connection ${i + 1} failed:`, error);
  });
}
```

#### Notification Throughput Test
```javascript
// Test notification processing speed
const startTime = Date.now();
let notificationCount = 0;

connection.on('ReceiveNotification', () => {
  notificationCount++;
  if (notificationCount === 1000) {
    const endTime = Date.now();
    const throughput = 1000 / ((endTime - startTime) / 1000);
    console.log(`Throughput: ${throughput} notifications/second`);
  }
});
```

## Production Deployment

### ✅ Deployment Steps

#### 1. Pre-Deployment Verification
```bash
# Verify environment variables
echo "SignalR Hub URL: $NEXT_PUBLIC_SIGNALR_HUB_URL"
echo "API URL: $NEXT_PUBLIC_API_URL"

# Run tests
npm run test:signalr
npm run test:integration

# Type checking
npm run type-check

# Build verification
npm run build
```

#### 2. Database Migrations
If your SignalR system requires database changes:
```bash
# Run any necessary database migrations
# (This depends on your backend implementation)
```

#### 3. Backend Deployment
Deploy backend changes first:
```bash
# Deploy backend with SignalR hub
# Ensure backward compatibility during transition
```

#### 4. Frontend Deployment
Deploy frontend with new SignalR system:
```bash
# Build and deploy frontend
npm run build
# Deploy to your hosting platform
```

#### 5. Post-Deployment Verification
```bash
# Test production endpoints
curl -I https://api.yourapp.com/notificationHub

# Verify application health
curl https://yourapp.com/api/health
```

### ✅ Monitoring Setup

#### Application Monitoring
Set up monitoring for SignalR-specific metrics:

```typescript
// Add to your monitoring service
const signalRMetrics = {
  connectionCount: 0,
  notificationsSent: 0,
  notificationsReceived: 0,
  connectionErrors: 0,
  averageLatency: 0,
  reconnectionRate: 0
};

// Track connection events
connection.onconnected(() => {
  signalRMetrics.connectionCount++;
  // Send to monitoring service
});

connection.onclose(() => {
  signalRMetrics.connectionCount--;
  // Send to monitoring service
});

// Track notification metrics
connection.on('ReceiveNotification', () => {
  signalRMetrics.notificationsReceived++;
  // Send to monitoring service
});
```

#### Health Check Endpoint
Create a health check endpoint for SignalR:

```typescript
// pages/api/health/signalr.ts
import { SignalRTestService } from '@/services/SignalRTestService';

export default async function handler(req, res) {
  try {
    const testService = new SignalRTestService();
    const isConnected = await testService.testConnection();
    const latency = await testService.measureLatency();
    
    res.status(200).json({
      status: isConnected ? 'healthy' : 'unhealthy',
      latency: latency,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

#### Alerting Configuration
Set up alerts for critical issues:

```yaml
# Example alerting configuration (adjust for your monitoring system)
alerts:
  - name: SignalR Connection Failure
    condition: signalr_connection_success_rate < 95%
    severity: critical
    
  - name: High SignalR Latency
    condition: signalr_average_latency > 5000ms
    severity: warning
    
  - name: SignalR Notification Delivery Failure
    condition: signalr_notification_delivery_rate < 98%
    severity: critical
```

## Rollback Plan

### ✅ Rollback Strategy

#### Immediate Rollback (Emergency)
If critical issues are discovered:

1. **Revert to Previous Deployment**
   ```bash
   # Revert to previous version
   git revert <commit-hash>
   npm run build
   # Deploy previous version
   ```

2. **Disable New SignalR Features**
   ```env
   # Use feature flags to disable new features
   NEXT_PUBLIC_FEATURE_NEW_SIGNALR=false
   NEXT_PUBLIC_FEATURE_REALTIME_UPDATES=false
   ```

3. **Fallback to Polling**
   ```typescript
   // Implement polling fallback
   const usePollingFallback = () => {
     useEffect(() => {
       const interval = setInterval(() => {
         // Poll for updates instead of using SignalR
         fetchNotifications();
       }, 30000);
       
       return () => clearInterval(interval);
     }, []);
   };
   ```

#### Gradual Rollback
For less critical issues:

1. **Component-Level Rollback**
   ```typescript
   // Revert specific components to old implementation
   const useOrganizerRealtime = () => {
     // Use old implementation temporarily
     return useOldSignalRImplementation();
   };
   ```

2. **User-Group Rollback**
   ```typescript
   // Rollback for specific user groups
   const shouldUseNewSignalR = (user) => {
     return user.betaFeatures && !user.signalRRollback;
   };
   ```

3. **Feature Flag Rollback**
   ```env
   # Gradually disable features
   NEXT_PUBLIC_FEATURE_ENHANCED_NOTIFICATIONS=false
   NEXT_PUBLIC_FEATURE_REALTIME_DASHBOARD=false
   ```

### ✅ Rollback Testing

Test rollback procedures in staging:

```bash
# Test rollback deployment
git checkout previous-version
npm run build
npm run test

# Test feature flag rollback
NEXT_PUBLIC_FEATURE_NEW_SIGNALR=false npm run dev

# Test polling fallback
# Disconnect SignalR and verify polling works
```

## Post-Deployment Monitoring

### ✅ Key Metrics to Monitor

#### Connection Metrics
- Connection success rate (target: >99%)
- Average connection establishment time (target: <2s)
- Reconnection frequency (target: <1% of connections)
- Concurrent connection count

#### Notification Metrics
- Notification delivery rate (target: >99.5%)
- Average notification latency (target: <500ms)
- Notification processing throughput
- Failed notification count

#### Error Metrics
- Authentication failure rate (target: <0.1%)
- Connection error rate (target: <1%)
- Hub method error rate (target: <0.1%)
- Client-side error rate

#### Performance Metrics
- Memory usage growth rate
- CPU usage during peak load
- Network bandwidth utilization
- Client-side performance impact

### ✅ Monitoring Dashboard

Create a monitoring dashboard with:

```typescript
// Example monitoring component
const SignalRMonitoringDashboard = () => {
  const [metrics, setMetrics] = useState({
    connectionCount: 0,
    notificationRate: 0,
    errorRate: 0,
    averageLatency: 0
  });

  useEffect(() => {
    // Fetch metrics from monitoring service
    const fetchMetrics = async () => {
      const response = await fetch('/api/monitoring/signalr');
      const data = await response.json();
      setMetrics(data);
    };

    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="monitoring-dashboard">
      <div className="metric">
        <h3>Active Connections</h3>
        <span className="value">{metrics.connectionCount}</span>
      </div>
      <div className="metric">
        <h3>Notifications/min</h3>
        <span className="value">{metrics.notificationRate}</span>
      </div>
      <div className="metric">
        <h3>Error Rate</h3>
        <span className={`value ${metrics.errorRate > 1 ? 'warning' : ''}`}>
          {metrics.errorRate}%
        </span>
      </div>
      <div className="metric">
        <h3>Avg Latency</h3>
        <span className={`value ${metrics.averageLatency > 1000 ? 'warning' : ''}`}>
          {metrics.averageLatency}ms
        </span>
      </div>
    </div>
  );
};
```

## Security Considerations

### ✅ Production Security Checklist

#### Environment Security
- [ ] All sensitive environment variables are properly secured
- [ ] Debug mode is disabled in production
- [ ] HTTPS is enforced for all SignalR connections
- [ ] CORS is properly configured with specific origins

#### Authentication Security
- [ ] JWT tokens are properly validated
- [ ] Token refresh is working correctly
- [ ] Authentication failures are properly logged
- [ ] Rate limiting is implemented for authentication attempts

#### Data Security
- [ ] All notification content is sanitized
- [ ] XSS prevention measures are in place
- [ ] Input validation is implemented
- [ ] Sensitive data is not logged

#### Network Security
- [ ] WebSocket connections are encrypted (WSS)
- [ ] Origin validation is implemented
- [ ] Request size limits are enforced
- [ ] DDoS protection is in place

## Troubleshooting Common Deployment Issues

### Issue: Connection Fails in Production

**Symptoms**: SignalR connections fail only in production environment

**Solutions**:
1. Check CORS configuration
2. Verify SSL certificate validity
3. Check firewall and load balancer settings
4. Validate environment variables

### Issue: High Memory Usage

**Symptoms**: Memory usage increases over time in production

**Solutions**:
1. Check notification history limits
2. Verify event handler cleanup
3. Monitor for memory leaks
4. Adjust garbage collection settings

### Issue: Poor Performance

**Symptoms**: Slow notification delivery or high latency

**Solutions**:
1. Check server resources
2. Optimize notification batching
3. Review database performance
4. Consider CDN for static assets

### Issue: Authentication Failures

**Symptoms**: Users can't connect due to authentication issues

**Solutions**:
1. Verify JWT configuration
2. Check token expiration handling
3. Validate token refresh mechanism
4. Review authentication logs

## Success Criteria

### ✅ Deployment Success Metrics

The deployment is considered successful when:

- [ ] Connection success rate > 99%
- [ ] Notification delivery rate > 99.5%
- [ ] Average connection latency < 2 seconds
- [ ] Error rate < 1%
- [ ] No critical security vulnerabilities
- [ ] All tests pass in production environment
- [ ] Monitoring and alerting are functional
- [ ] Rollback procedures are tested and ready

### ✅ User Experience Validation

- [ ] Users can connect to SignalR successfully
- [ ] Notifications are received in real-time
- [ ] Connection status is properly displayed
- [ ] Error messages are user-friendly
- [ ] Performance is acceptable on all supported devices
- [ ] Accessibility requirements are met

This deployment guide ensures a smooth and safe deployment of the SignalR system to production environments.