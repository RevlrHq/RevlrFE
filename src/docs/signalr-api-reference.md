# SignalR API Reference

## Overview

This document provides detailed API reference for the SignalR real-time notification system. All APIs are fully typed with TypeScript for better development experience.

## Core Hooks

### useSignalR

Primary hook for managing SignalR connections.

```typescript
function useSignalR(): SignalRConnection
```

#### Return Type

```typescript
interface SignalRConnection {
  connection: HubConnection | null;
  connectionState: HubConnectionState;
  error: SignalRError | null;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  startConnection: () => Promise<HubConnection>;
  stopConnection: () => Promise<void>;
  lastPing?: Date;
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `connection` | `HubConnection \| null` | The underlying SignalR connection instance |
| `connectionState` | `HubConnectionState` | Current connection state from SignalR |
| `error` | `SignalRError \| null` | Last error that occurred, if any |
| `isConnected` | `boolean` | True if connection is established |
| `isConnecting` | `boolean` | True if connection is being established |
| `isReconnecting` | `boolean` | True if reconnection is in progress |
| `lastPing` | `Date` | Timestamp of last successful ping |

#### Methods

| Method | Description |
|--------|-------------|
| `startConnection()` | Manually start the SignalR connection |
| `stopConnection()` | Manually stop the SignalR connection |

#### Example

```typescript
import { useSignalR } from '@/hooks/useSignalR';

function MyComponent() {
  const { 
    connection, 
    isConnected, 
    isConnecting, 
    error 
  } = useSignalR();

  if (isConnecting) return <div>Connecting...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!isConnected) return <div>Disconnected</div>;

  return <div>Connected to SignalR</div>;
}
```

### useNotificationGroups

Manages user group membership for targeted notifications.

```typescript
function useNotificationGroups(): NotificationGroups
```

#### Return Type

```typescript
interface NotificationGroups {
  joinedGroups: string[];
  joinGroup: (groupName: string) => Promise<void>;
  leaveGroup: (groupName: string) => Promise<void>;
  isInGroup: (groupName: string) => boolean;
  error: Error | null;
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `joinedGroups` | `string[]` | Array of currently joined group names |
| `error` | `Error \| null` | Last error from group operations |

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `joinGroup` | `groupName: string` | Join a specific notification group |
| `leaveGroup` | `groupName: string` | Leave a specific notification group |
| `isInGroup` | `groupName: string` | Check if currently in a group |

#### Example

```typescript
import { useNotificationGroups } from '@/hooks/useNotificationGroups';

function GroupManager() {
  const { joinedGroups, joinGroup, isInGroup } = useNotificationGroups();

  return (
    <div>
      <p>Joined groups: {joinedGroups.join(', ')}</p>
      <p>In organizer group: {isInGroup('organizer') ? 'Yes' : 'No'}</p>
      <button onClick={() => joinGroup('custom-group')}>
        Join Custom Group
      </button>
    </div>
  );
}
```

### useTypedNotificationHandler

Provides type-safe notification handling with UI integration.

```typescript
function useTypedNotificationHandler(): NotificationHandler
```

#### Return Type

```typescript
interface NotificationHandler {
  notifications: NotificationMessage[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (notificationId: string) => void;
  clearAll: () => void;
  getNotificationsByType: (type: NotificationType) => NotificationMessage[];
  error: Error | null;
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `notifications` | `NotificationMessage[]` | Array of all notifications |
| `unreadCount` | `number` | Count of unread notifications |
| `error` | `Error \| null` | Last error from notification processing |

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `markAsRead` | `notificationId: string` | Mark specific notification as read |
| `markAllAsRead` | - | Mark all notifications as read |
| `dismissNotification` | `notificationId: string` | Remove notification from list |
| `clearAll` | - | Clear all notifications |
| `getNotificationsByType` | `type: NotificationType` | Filter notifications by type |

#### Example

```typescript
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';

function NotificationList() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    dismissNotification 
  } = useTypedNotificationHandler();

  return (
    <div>
      <h2>Notifications ({unreadCount} unread)</h2>
      {notifications.map(notification => (
        <div key={notification.id}>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          <button onClick={() => markAsRead(notification.id)}>
            Mark as Read
          </button>
          <button onClick={() => dismissNotification(notification.id)}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
```

### useSignalRErrorHandler

Comprehensive error handling and recovery system.

```typescript
function useSignalRErrorHandler(): ErrorHandler
```

#### Return Type

```typescript
interface ErrorHandler {
  errors: SignalRError[];
  lastError: SignalRError | null;
  clearErrors: () => void;
  retryConnection: () => Promise<void>;
  getErrorsByType: (type: SignalRErrorType) => SignalRError[];
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `errors` | `SignalRError[]` | Array of all errors |
| `lastError` | `SignalRError \| null` | Most recent error |

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `clearErrors` | - | Clear all errors |
| `retryConnection` | - | Manually retry connection |
| `getErrorsByType` | `type: SignalRErrorType` | Filter errors by type |

#### Example

```typescript
import { useSignalRErrorHandler } from '@/hooks/useSignalRErrorHandler';

function ErrorDisplay() {
  const { lastError, clearErrors, retryConnection } = useSignalRErrorHandler();

  if (!lastError) return null;

  return (
    <div className="error-banner">
      <p>Error: {lastError.message}</p>
      <button onClick={retryConnection}>Retry</button>
      <button onClick={clearErrors}>Dismiss</button>
    </div>
  );
}
```

## Type Definitions

### NotificationMessage

Core notification message interface.

```typescript
interface NotificationMessage {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  data?: NotificationData;
  priority: NotificationPriority;
  actionUrl?: string;
  metadata?: Record<string, any>;
  isRead?: boolean;
}
```

### NotificationType

Enumeration of all notification types.

```typescript
enum NotificationType {
  // Event notifications
  EventRegistration = 'EventRegistration',
  EventUpdate = 'EventUpdate',
  EventPublished = 'EventPublished',
  EventCancelled = 'EventCancelled',
  
  // Payment notifications
  PaymentCompleted = 'PaymentCompleted',
  PaymentFailed = 'PaymentFailed',
  PaymentPending = 'PaymentPending',
  RecurringPaymentProcessed = 'RecurringPaymentProcessed',
  
  // Financing notifications
  FinancingApplicationSubmitted = 'FinancingApplicationSubmitted',
  FinancingApplicationApproved = 'FinancingApplicationApproved',
  FinancingApplicationRejected = 'FinancingApplicationRejected',
  FinancingPaymentDue = 'FinancingPaymentDue',
  
  // System notifications
  SystemMaintenance = 'SystemMaintenance',
  SystemUpdate = 'SystemUpdate'
}
```

### NotificationPriority

Priority levels for notifications.

```typescript
enum NotificationPriority {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
  Critical = 'critical'
}
```

### NotificationData

Union type for all notification data types.

```typescript
type NotificationData = 
  | EventNotificationData
  | PaymentNotificationData
  | FinancingNotificationData
  | SystemNotificationData;
```

#### EventNotificationData

```typescript
interface EventNotificationData {
  eventId: string;
  eventTitle: string;
  organizerName: string;
  eventDate: string;
  location?: string;
  ticketPrice?: number;
  registrationCount?: number;
}
```

#### PaymentNotificationData

```typescript
interface PaymentNotificationData {
  paymentId: string;
  amount: number;
  currency: string;
  eventTitle: string;
  status: 'completed' | 'failed' | 'pending';
  failureReason?: string;
  transactionId?: string;
}
```

#### FinancingNotificationData

```typescript
interface FinancingNotificationData {
  applicationId: string;
  eventTitle: string;
  requestedAmount: number;
  status: 'submitted' | 'approved' | 'rejected';
  reason?: string;
  approvedAmount?: number;
  dueDate?: string;
}
```

#### SystemNotificationData

```typescript
interface SystemNotificationData {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  maintenanceWindow?: {
    start: string;
    end: string;
  };
  affectedServices?: string[];
}
```

### SignalRError

Error interface for SignalR-related errors.

```typescript
interface SignalRError {
  type: SignalRErrorType;
  message: string;
  originalError?: Error;
  timestamp: Date;
  connectionState?: HubConnectionState;
  context?: Record<string, any>;
}
```

### SignalRErrorType

Error type enumeration.

```typescript
enum SignalRErrorType {
  ConnectionError = 'ConnectionError',
  AuthenticationError = 'AuthenticationError',
  HubMethodError = 'HubMethodError',
  NetworkError = 'NetworkError',
  UnexpectedError = 'UnexpectedError'
}
```

## Components

### SignalRProvider

Context provider for SignalR functionality.

```typescript
interface SignalRProviderProps {
  children: React.ReactNode;
  hubUrl?: string;
  options?: SignalROptions;
}

function SignalRProvider(props: SignalRProviderProps): JSX.Element
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Child components |
| `hubUrl` | `string` | `process.env.NEXT_PUBLIC_SIGNALR_HUB_URL` | SignalR hub URL |
| `options` | `SignalROptions` | Default options | Connection options |

#### Example

```typescript
import { SignalRProvider } from '@/providers/SignalRProvider';

function App() {
  return (
    <SignalRProvider hubUrl="https://api.example.com/hub">
      <YourComponents />
    </SignalRProvider>
  );
}
```

### UserNotifications

Component for displaying user notifications.

```typescript
interface UserNotificationsProps {
  maxNotifications?: number;
  showUnreadOnly?: boolean;
  enableFiltering?: boolean;
  className?: string;
}

function UserNotifications(props: UserNotificationsProps): JSX.Element
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxNotifications` | `number` | `50` | Maximum notifications to display |
| `showUnreadOnly` | `boolean` | `false` | Show only unread notifications |
| `enableFiltering` | `boolean` | `true` | Enable notification filtering |
| `className` | `string` | - | CSS class name |

### OrganizerNotifications

Component for organizer-specific notifications.

```typescript
interface OrganizerNotificationsProps {
  eventId?: string;
  groupByEvent?: boolean;
  showRevenueUpdates?: boolean;
  className?: string;
}

function OrganizerNotifications(props: OrganizerNotificationsProps): JSX.Element
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `eventId` | `string` | - | Filter by specific event |
| `groupByEvent` | `boolean` | `true` | Group notifications by event |
| `showRevenueUpdates` | `boolean` | `true` | Show revenue notifications |
| `className` | `string` | - | CSS class name |

### ConnectionStatus

Component for displaying connection status.

```typescript
interface ConnectionStatusProps {
  showWhenConnected?: boolean;
  enableManualReconnect?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

function ConnectionStatus(props: ConnectionStatusProps): JSX.Element
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showWhenConnected` | `boolean` | `false` | Show indicator when connected |
| `enableManualReconnect` | `boolean` | `true` | Show reconnect button |
| `position` | `string` | `'top-right'` | Position on screen |
| `className` | `string` | - | CSS class name |

## Services

### SignalRTestService

Service for testing SignalR functionality.

```typescript
class SignalRTestService {
  constructor(baseUrl?: string);
  
  // Connection testing
  testConnection(): Promise<boolean>;
  validateToken(): Promise<boolean>;
  
  // Notification testing
  sendEventNotification(data: EventNotificationData): Promise<void>;
  sendPaymentNotification(data: PaymentNotificationData): Promise<void>;
  sendFinancingNotification(data: FinancingNotificationData): Promise<void>;
  sendSystemNotification(data: SystemNotificationData): Promise<void>;
  
  // Bulk testing
  sendBulkNotifications(count: number, type: NotificationType): Promise<void>;
  
  // Performance testing
  measureLatency(): Promise<number>;
  testReconnection(): Promise<boolean>;
}
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `testConnection` | - | `Promise<boolean>` | Test basic connectivity |
| `validateToken` | - | `Promise<boolean>` | Validate JWT token |
| `sendEventNotification` | `data: EventNotificationData` | `Promise<void>` | Send test event notification |
| `sendPaymentNotification` | `data: PaymentNotificationData` | `Promise<void>` | Send test payment notification |
| `sendFinancingNotification` | `data: FinancingNotificationData` | `Promise<void>` | Send test financing notification |
| `sendSystemNotification` | `data: SystemNotificationData` | `Promise<void>` | Send test system notification |
| `sendBulkNotifications` | `count: number, type: NotificationType` | `Promise<void>` | Send multiple test notifications |
| `measureLatency` | - | `Promise<number>` | Measure round-trip latency |
| `testReconnection` | - | `Promise<boolean>` | Test reconnection functionality |

#### Example

```typescript
import { SignalRTestService } from '@/services/SignalRTestService';

const testService = new SignalRTestService();

// Test connection
const isConnected = await testService.testConnection();
console.log('Connected:', isConnected);

// Send test notification
await testService.sendEventNotification({
  eventId: 'test-event',
  eventTitle: 'Test Event',
  organizerName: 'Test Organizer',
  eventDate: new Date().toISOString()
});

// Measure performance
const latency = await testService.measureLatency();
console.log('Latency:', latency, 'ms');
```

## Type Guards

### isEventNotificationData

```typescript
function isEventNotificationData(data: any): data is EventNotificationData
```

Validates if data matches EventNotificationData interface.

### isPaymentNotificationData

```typescript
function isPaymentNotificationData(data: any): data is PaymentNotificationData
```

Validates if data matches PaymentNotificationData interface.

### isFinancingNotificationData

```typescript
function isFinancingNotificationData(data: any): data is FinancingNotificationData
```

Validates if data matches FinancingNotificationData interface.

### isSystemNotificationData

```typescript
function isSystemNotificationData(data: any): data is SystemNotificationData
```

Validates if data matches SystemNotificationData interface.

## Constants

### Default Configuration

```typescript
export const SIGNALR_CONFIG = {
  RECONNECT_DELAYS: [0, 2000, 10000, 30000], // ms
  MAX_RECONNECT_ATTEMPTS: 5,
  BATCH_SIZE: 10,
  BATCH_DELAY: 500, // ms
  MAX_NOTIFICATIONS: 100,
  PING_INTERVAL: 30000, // ms
  CONNECTION_TIMEOUT: 15000, // ms
} as const;
```

### Hub Method Names

```typescript
export const HUB_METHODS = {
  RECEIVE_NOTIFICATION: 'ReceiveNotification',
  JOIN_GROUP: 'JoinGroup',
  LEAVE_GROUP: 'LeaveGroup',
  PING: 'Ping',
} as const;
```

### Group Names

```typescript
export const NOTIFICATION_GROUPS = {
  USER: 'user',
  ORGANIZER: 'organizer',
  ADMIN: 'admin',
} as const;
```

## Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NEXT_PUBLIC_SIGNALR_HUB_URL` | `string` | - | SignalR hub URL |
| `NEXT_PUBLIC_SIGNALR_DEBUG` | `boolean` | `false` | Enable debug logging |
| `NEXT_PUBLIC_SIGNALR_RECONNECT_DELAY` | `number` | `2000` | Base reconnect delay (ms) |
| `NEXT_PUBLIC_SIGNALR_MAX_RECONNECT_ATTEMPTS` | `number` | `5` | Maximum reconnect attempts |

## Error Codes

| Code | Type | Description |
|------|------|-------------|
| `CONN_001` | ConnectionError | Failed to establish connection |
| `CONN_002` | ConnectionError | Connection lost unexpectedly |
| `AUTH_001` | AuthenticationError | Invalid or expired token |
| `AUTH_002` | AuthenticationError | Token refresh failed |
| `HUB_001` | HubMethodError | Invalid hub method call |
| `HUB_002` | HubMethodError | Hub method parameters invalid |
| `NET_001` | NetworkError | Network connectivity issue |
| `UNK_001` | UnexpectedError | Unknown error occurred |

This API reference provides comprehensive documentation for all public APIs in the SignalR integration system. All types are fully documented and examples are provided for common use cases.