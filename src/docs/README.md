# SignalR Documentation

This directory contains comprehensive documentation for the SignalR real-time notification system in the Revlr event management platform.

## Documentation Overview

### Core Documentation

1. **[SignalR Integration Guide](./signalr-integration-guide.md)**
   - Complete guide for implementing SignalR in your components
   - Architecture overview and usage patterns
   - Component examples and best practices
   - Performance considerations and security features

2. **[SignalR API Reference](./signalr-api-reference.md)**
   - Detailed API documentation for all hooks, components, and services
   - TypeScript type definitions and interfaces
   - Method signatures and return types
   - Configuration options and constants

3. **[SignalR Migration Guide](./signalr-migration-guide.md)**
   - Step-by-step migration from the old SignalR implementation
   - Breaking changes and compatibility information
   - Component-specific migration instructions
   - Testing and rollback strategies

4. **[SignalR Troubleshooting Guide](./signalr-troubleshooting-guide.md)**
   - Common issues and their solutions
   - Diagnostic tools and debugging techniques
   - Performance optimization tips
   - Error handling and recovery strategies

## Quick Start

### For New Implementations

If you're implementing SignalR for the first time:

1. Read the [Integration Guide](./signalr-integration-guide.md) for complete setup instructions
2. Use the [API Reference](./signalr-api-reference.md) for detailed method documentation
3. Refer to the [Troubleshooting Guide](./signalr-troubleshooting-guide.md) if you encounter issues

### For Existing Implementations

If you're migrating from the old SignalR system:

1. Start with the [Migration Guide](./signalr-migration-guide.md) for step-by-step instructions
2. Use the [Integration Guide](./signalr-integration-guide.md) to understand the new architecture
3. Check the [Troubleshooting Guide](./signalr-troubleshooting-guide.md) for migration-specific issues

## Key Features

### Production-Ready Architecture
- Automatic connection management with exponential backoff reconnection
- Comprehensive error handling and recovery strategies
- JWT authentication integration with automatic token refresh
- Performance optimizations including notification batching and memory management

### Type Safety
- Full TypeScript support with comprehensive type definitions
- Type guards for notification data validation
- Strongly typed hooks and components
- IntelliSense support for better development experience

### User Experience
- Real-time connection status indicators
- Priority-based notification display
- Toast notification integration
- Automatic navigation handling for notification actions

### Testing Support
- Complete testing infrastructure with mock utilities
- Test service for manual testing and debugging
- Performance testing and health monitoring tools
- Comprehensive test coverage for all components

## System Architecture

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
```

## Notification Types

The system supports comprehensive notification types:

### Event Notifications
- `EventRegistration`: User registered for an event
- `EventUpdate`: Event details changed
- `EventPublished`: Event was published
- `EventCancelled`: Event was cancelled

### Payment Notifications
- `PaymentCompleted`: Payment processed successfully
- `PaymentFailed`: Payment processing failed
- `PaymentPending`: Payment is being processed
- `RecurringPaymentProcessed`: Recurring payment completed

### Financing Notifications
- `FinancingApplicationSubmitted`: New financing application
- `FinancingApplicationApproved`: Application approved
- `FinancingApplicationRejected`: Application rejected
- `FinancingPaymentDue`: Payment due reminder

### System Notifications
- `SystemMaintenance`: Scheduled maintenance
- `SystemUpdate`: System updates available

## Environment Configuration

Required environment variables:

```env
# SignalR Configuration
NEXT_PUBLIC_SIGNALR_HUB_URL=https://your-api.com/notificationHub
NEXT_PUBLIC_SIGNALR_DEBUG=false

# Optional: Performance tuning
NEXT_PUBLIC_SIGNALR_RECONNECT_DELAY=2000
NEXT_PUBLIC_SIGNALR_MAX_RECONNECT_ATTEMPTS=5
```

## Getting Help

### Documentation Resources

1. **Integration Issues**: Check the [Integration Guide](./signalr-integration-guide.md) for setup instructions
2. **API Questions**: Refer to the [API Reference](./signalr-api-reference.md) for detailed documentation
3. **Migration Problems**: Use the [Migration Guide](./signalr-migration-guide.md) for step-by-step instructions
4. **Technical Issues**: Consult the [Troubleshooting Guide](./signalr-troubleshooting-guide.md) for solutions

### Diagnostic Tools

Use the built-in diagnostic tools for troubleshooting:

```typescript
// Enable debug mode
process.env.NEXT_PUBLIC_SIGNALR_DEBUG = 'true';

// Use test service for connectivity testing
import { SignalRTestService } from '@/services/SignalRTestService';
const testService = new SignalRTestService();
await testService.testConnection();

// Check connection status
import { useSignalR } from '@/hooks/useSignalR';
const { connectionState, error, isConnected } = useSignalR();
```

### Support Checklist

When seeking help, please provide:

1. **Environment Information**:
   - Node.js version
   - React version
   - Browser and version
   - Environment (development/production)

2. **Configuration**:
   - Environment variables
   - SignalR hub URL
   - Authentication setup

3. **Error Details**:
   - Console error messages
   - Network tab screenshots
   - Connection state information
   - Steps to reproduce

4. **Code Context**:
   - Component implementation
   - Hook usage
   - Provider setup

## Contributing

When updating this documentation:

1. **Keep it current**: Update documentation when making changes to the SignalR system
2. **Be comprehensive**: Include examples, error cases, and edge scenarios
3. **Test examples**: Ensure all code examples work and compile
4. **Cross-reference**: Link between related documentation sections
5. **Version compatibility**: Note any version-specific information

## Version History

- **v2.0.0**: Complete rewrite with production-ready architecture
- **v1.0.0**: Initial SignalR implementation (deprecated)

For detailed changelog, see the [Migration Guide](./signalr-migration-guide.md).