# React SignalR Integration Guide

This comprehensive guide provides step-by-step instructions for integrating React applications with the RevlrBE SignalR notification system. It covers connection setup, authentication, notification handling, and best practices for different user types (regular users and organizers).

> **⚠️ IMPORTANT UPDATE**: This guide has been superseded by the new production-ready SignalR implementation. For the latest documentation, please refer to:
>
> - [SignalR Integration Guide](./src/docs/signalr-integration-guide.md) - Complete guide for the new system
> - [SignalR Migration Guide](./src/docs/signalr-migration-guide.md) - How to migrate from this implementation
> - [SignalR API Reference](./src/docs/signalr-api-reference.md) - Detailed API documentation
> - [SignalR Troubleshooting Guide](./src/docs/signalr-troubleshooting-guide.md) - Common issues and solutions
>
> The new implementation provides:
>
> - Production-ready architecture with comprehensive error handling
> - Full TypeScript support with type-safe notifications
> - Automatic connection management and reconnection
> - Performance optimizations and security enhancements
> - Complete testing infrastructure
> - Better user experience with connection status indicators
>
> **Migration Path**: The new system maintains backward compatibility. Existing components using `useOrganizerRealtime` will continue to work without changes during the transition period.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Basic Setup](#basic-setup)
4. [Authentication](#authentication)
5. [Connection Management](#connection-management)
6. [User Types and Groups](#user-types-and-groups)
7. [Notification Handling](#notification-handling)
8. [TypeScript Types](#typescript-types)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)

## Prerequisites

- React 16.8+ (for hooks support)
- TypeScript (recommended)
- Valid JWT authentication token from RevlrBE API
- Network access to the SignalR hub endpoint

## Installation

Install the Microsoft SignalR client library:

```bash
npm install @microsoft/signalr
# or
yarn add @microsoft/signalr
```

For TypeScript projects, the types are included in the package.

## Basic Setup

### 1. SignalR Service Hook

Create a custom React hook for managing SignalR connections:

```typescript
// hooks/useSignalR.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import {
    HubConnection,
    HubConnectionBuilder,
    LogLevel,
    HttpTransportType,
    HubConnectionState,
} from '@microsoft/signalr';

interface UseSignalROptions {
    hubUrl: string;
    accessTokenFactory: () => string | Promise<string>;
    automaticReconnect?: boolean;
    logLevel?: LogLevel;
    onConnected?: () => void;
    onDisconnected?: (error?: Error) => void;
    onReconnecting?: (error?: Error) => void;
    onReconnected?: (connectionId?: string) => void;
}

export const useSignalR = (options: UseSignalROptions) => {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [connectionState, setConnectionState] = useState<HubConnectionState>(
        HubConnectionState.Disconnected
    );
    const [error, setError] = useState<Error | null>(null);
    const connectionRef = useRef<HubConnection | null>(null);

    const createConnection = useCallback(() => {
        const newConnection = new HubConnectionBuilder()
            .withUrl(options.hubUrl, {
                accessTokenFactory: options.accessTokenFactory,
                transport: HttpTransportType.All,
                skipNegotiation: false,
            })
            .withAutomaticReconnect(
                options.automaticReconnect !== false
                    ? [0, 2000, 10000, 30000]
                    : []
            )
            .configureLogging(options.logLevel || LogLevel.Information)
            .build();

        // Connection state change handlers
        newConnection.onclose((error) => {
            setConnectionState(HubConnectionState.Disconnected);
            setError(error || null);
            options.onDisconnected?.(error);
        });

        newConnection.onreconnecting((error) => {
            setConnectionState(HubConnectionState.Reconnecting);
            setError(error || null);
            options.onReconnecting?.(error);
        });

        newConnection.onreconnected((connectionId) => {
            setConnectionState(HubConnectionState.Connected);
            setError(null);
            options.onReconnected?.(connectionId);
        });

        return newConnection;
    }, [options]);

    const startConnection = useCallback(async () => {
        if (connectionRef.current?.state === HubConnectionState.Connected) {
            return connectionRef.current;
        }

        try {
            const newConnection = createConnection();
            connectionRef.current = newConnection;
            setConnection(newConnection);
            setConnectionState(HubConnectionState.Connecting);

            await newConnection.start();
            setConnectionState(HubConnectionState.Connected);
            setError(null);
            options.onConnected?.();

            return newConnection;
        } catch (err) {
            const error = err as Error;
            setError(error);
            setConnectionState(HubConnectionState.Disconnected);
            throw error;
        }
    }, [createConnection, options]);

    const stopConnection = useCallback(async () => {
        if (connectionRef.current) {
            await connectionRef.current.stop();
            connectionRef.current = null;
            setConnection(null);
            setConnectionState(HubConnectionState.Disconnected);
        }
    }, []);

    useEffect(() => {
        return () => {
            stopConnection();
        };
    }, [stopConnection]);

    return {
        connection,
        connectionState,
        error,
        startConnection,
        stopConnection,
        isConnected: connectionState === HubConnectionState.Connected,
        isConnecting: connectionState === HubConnectionState.Connecting,
        isReconnecting: connectionState === HubConnectionState.Reconnecting,
    };
};
```

### 2. SignalR Context Provider

Create a context provider for sharing the SignalR connection across your app:

```typescript
// contexts/SignalRContext.tsx
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSignalR } from '../hooks/useSignalR';
import { LogLevel } from '@microsoft/signalr';
import { useAuth } from './AuthContext'; // Your auth context

interface SignalRContextType {
  connection: any;
  connectionState: string;
  error: Error | null;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  startConnection: () => Promise<any>;
  stopConnection: () => Promise<void>;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

interface SignalRProviderProps {
  children: ReactNode;
  hubUrl: string;
}

export const SignalRProvider: React.FC<SignalRProviderProps> = ({
  children,
  hubUrl
}) => {
  const { getAccessToken, isAuthenticated, user } = useAuth();

  const signalR = useSignalR({
    hubUrl,
    accessTokenFactory: async () => {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }
      return token;
    },
    automaticReconnect: true,
    logLevel: process.env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Warning,
    onConnected: () => {
      console.log('SignalR connected successfully');
    },
    onDisconnected: (error) => {
      console.log('SignalR disconnected:', error?.message);
    },
    onReconnecting: (error) => {
      console.log('SignalR reconnecting:', error?.message);
    },
    onReconnected: (connectionId) => {
      console.log('SignalR reconnected:', connectionId);
    },
  });

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      signalR.startConnection().catch(console.debug);
    } else {
      signalR.stopConnection().catch(console.debug);
    }
  }, [isAuthenticated, user, signalR]);

  return (
    <SignalRContext.Provider value={signalR}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalRContext = () => {
  const context = useContext(SignalRContext);
  if (context === undefined) {
    throw new Error('useSignalRContext must be used within a SignalRProvider');
  }
  return context;
};
```

## Authentication

### JWT Token Integration

The SignalR connection requires a valid JWT token. Here's how to integrate with your authentication system:

```typescript
// services/authService.ts
export class AuthService {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    async getAccessToken(): Promise<string | null> {
        // Check if token is still valid
        if (this.accessToken && !this.isTokenExpired(this.accessToken)) {
            return this.accessToken;
        }

        // Try to refresh the token
        if (this.refreshToken) {
            try {
                await this.refreshAccessToken();
                return this.accessToken;
            } catch (error) {
                console.debug('Failed to refresh token:', error);
                this.logout();
                return null;
            }
        }

        return null;
    }

    private isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp < currentTime;
        } catch {
            return true;
        }
    }

    private async refreshAccessToken(): Promise<void> {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
    }

    logout(): void {
        this.accessToken = null;
        this.refreshToken = null;
        // Redirect to login or update app state
    }
}
```

## Connection Management

### Joining User Groups

After establishing a connection, users need to join appropriate groups to receive targeted notifications:

```typescript
// hooks/useNotificationGroups.ts
import { useEffect } from 'react';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useAuth } from '../contexts/AuthContext';

export const useNotificationGroups = () => {
    const { connection, isConnected } = useSignalRContext();
    const { user } = useAuth();

    useEffect(() => {
        if (!isConnected || !connection || !user) return;

        const joinGroups = async () => {
            try {
                // All authenticated users join their user group
                await connection.invoke('JoinUserGroup', user.id);
                console.log(`Joined user group for user: ${user.id}`);

                // Organizers also join their organizer group
                if (user.isOrganizer) {
                    await connection.invoke('JoinOrganizerGroup', user.id);
                    console.log(`Joined organizer group for user: ${user.id}`);
                }
            } catch (error) {
                console.debug('Failed to join notification groups:', error);
            }
        };

        joinGroups();
    }, [isConnected, connection, user]);
};
```

## User Types and Groups

### Regular Users

Regular users receive notifications about:

- Event registration confirmations
- Payment status updates
- Financing application updates
- Event updates for registered events

```typescript
// components/UserNotifications.tsx
import React, { useEffect, useState } from 'react';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useNotificationGroups } from '../hooks/useNotificationGroups';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  priority: 'Low' | 'Normal' | 'High' | 'Critical';
  data?: any;
  actionUrl?: string;
}

export const UserNotifications: React.FC = () => {
  const { connection, isConnected } = useSignalRContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Join appropriate groups
  useNotificationGroups();

  useEffect(() => {
    if (!isConnected || !connection) return;

    const handleNotification = (notification: Notification) => {
      console.log('Received notification:', notification);
      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50

      // Handle different notification types
      switch (notification.type) {
        case 'EventRegistration':
          showEventRegistrationNotification(notification);
          break;
        case 'PaymentCompleted':
          showPaymentNotification(notification);
          break;
        case 'FinancingApplicationApproved':
          showFinancingNotification(notification);
          break;
        default:
          showGenericNotification(notification);
      }
    };

    // Listen for notifications
    connection.on('ReceiveNotification', handleNotification);

    return () => {
      connection.off('ReceiveNotification', handleNotification);
    };
  }, [isConnected, connection]);

  const showEventRegistrationNotification = (notification: Notification) => {
    // Show toast or in-app notification for event registration
    if (notification.data?.eventTitle) {
      // Use your preferred notification library (react-toastify, etc.)
      console.log(`Event registration: ${notification.data.eventTitle}`);
    }
  };

  const showPaymentNotification = (notification: Notification) => {
    // Handle payment notifications
    if (notification.data?.amount && notification.data?.currency) {
      console.log(`Payment: ${notification.data.currency} ${notification.data.amount}`);
    }
  };

  const showFinancingNotification = (notification: Notification) => {
    // Handle financing notifications
    if (notification.data?.status) {
      console.log(`Financing status: ${notification.data.status}`);
    }
  };

  const showGenericNotification = (notification: Notification) => {
    // Handle generic notifications
    console.log(`Notification: ${notification.title} - ${notification.message}`);
  };

  return (
    <div className="notifications-panel">
      <h3>Notifications</h3>
      {notifications.map(notification => (
        <div key={notification.id} className={`notification priority-${notification.priority.toLowerCase()}`}>
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
          <small>{new Date(notification.timestamp).toLocaleString()}</small>
          {notification.actionUrl && (
            <button onClick={() => window.location.href = notification.actionUrl}>
              View Details
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
```

### Organizers

Organizers receive additional notifications about:

- New event registrations
- Event-related payments
- Financing applications for their events

```typescript
// components/OrganizerNotifications.tsx
import React, { useEffect, useState } from 'react';
import { useSignalRContext } from '../contexts/SignalRContext';
import { useAuth } from '../contexts/AuthContext';

export const OrganizerNotifications: React.FC = () => {
  const { connection, isConnected } = useSignalRContext();
  const { user } = useAuth();
  const [organizerNotifications, setOrganizerNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!isConnected || !connection || !user?.isOrganizer) return;

    const handleOrganizerNotification = (notification: any) => {
      // Filter for organizer-specific notifications
      const organizerTypes = [
        'EventRegistration',
        'PaymentCompleted',
        'FinancingApplicationSubmitted'
      ];

      if (organizerTypes.includes(notification.type)) {
        setOrganizerNotifications(prev => [notification, ...prev.slice(0, 49)]);

        // Handle organizer-specific logic
        switch (notification.type) {
          case 'EventRegistration':
            handleNewRegistration(notification);
            break;
          case 'PaymentCompleted':
            handleEventPayment(notification);
            break;
          case 'FinancingApplicationSubmitted':
            handleFinancingApplication(notification);
            break;
        }
      }
    };

    connection.on('ReceiveNotification', handleOrganizerNotification);

    return () => {
      connection.off('ReceiveNotification', handleOrganizerNotification);
    };
  }, [isConnected, connection, user]);

  const handleNewRegistration = (notification: any) => {
    // Handle new event registration
    console.log('New registration for event:', notification.data?.eventTitle);
    // Update event registration count, show notification, etc.
  };

  const handleEventPayment = (notification: any) => {
    // Handle payment for organizer's event
    console.log('Payment received for event:', notification.data?.eventTitle);
    // Update revenue tracking, show notification, etc.
  };

  const handleFinancingApplication = (notification: any) => {
    // Handle financing application for organizer's event
    console.log('Financing application for event:', notification.data?.eventTitle);
    // Show notification for review, etc.
  };

  if (!user?.isOrganizer) {
    return null;
  }

  return (
    <div className="organizer-notifications">
      <h3>Organizer Notifications</h3>
      {organizerNotifications.map(notification => (
        <div key={notification.id} className="organizer-notification">
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
          <div className="notification-data">
            {notification.data?.eventTitle && (
              <span>Event: {notification.data.eventTitle}</span>
            )}
            {notification.data?.amount && (
              <span>Amount: {notification.data.currency} {notification.data.amount}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

## Notification Handling

### Using the Complete Type System

With the comprehensive type definitions above, you can now create fully typed notification handlers:

```typescript
// hooks/useTypedNotificationHandler.ts
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    NotificationMessage,
    NotificationType,
    NotificationPriority,
    isEventNotificationData,
    isPaymentNotificationData,
    isFinancingNotificationData,
    isValidNotificationMessage,
    EventNotificationData,
    PaymentNotificationData,
    FinancingNotificationData,
} from '../types/notifications';

export const useTypedNotificationHandler = () => {
    const navigate = useNavigate();

    const handleNotification = useCallback(
        (rawNotification: unknown) => {
            // Validate the notification structure
            if (!isValidNotificationMessage(rawNotification)) {
                console.debug(
                    'Invalid notification received:',
                    rawNotification
                );
                return;
            }

            const notification = rawNotification as NotificationMessage;

            // Handle based on notification type with full type safety
            switch (notification.type) {
                case NotificationType.EventRegistration:
                    handleEventNotification(notification, 'registration');
                    break;
                case NotificationType.EventUpdate:
                    handleEventNotification(notification, 'update');
                    break;
                case NotificationType.EventPublished:
                    handleEventNotification(notification, 'published');
                    break;
                case NotificationType.EventCancelled:
                    handleEventNotification(notification, 'cancelled');
                    break;
                case NotificationType.PaymentCompleted:
                    handlePaymentNotification(notification, 'completed');
                    break;
                case NotificationType.PaymentFailed:
                    handlePaymentNotification(notification, 'failed');
                    break;
                case NotificationType.PaymentPending:
                    handlePaymentNotification(notification, 'pending');
                    break;
                case NotificationType.RecurringPaymentProcessed:
                    handlePaymentNotification(notification, 'recurring');
                    break;
                case NotificationType.FinancingApplicationSubmitted:
                    handleFinancingNotification(notification, 'submitted');
                    break;
                case NotificationType.FinancingApplicationApproved:
                    handleFinancingNotification(notification, 'approved');
                    break;
                case NotificationType.FinancingApplicationRejected:
                    handleFinancingNotification(notification, 'rejected');
                    break;
                case NotificationType.FinancingPaymentDue:
                    handleFinancingNotification(notification, 'payment_due');
                    break;
                case NotificationType.SystemMaintenance:
                case NotificationType.SystemUpdate:
                    handleSystemNotification(notification);
                    break;
                default:
                    // TypeScript will ensure this is never reached if all cases are handled
                    const exhaustiveCheck: never = notification.type;
                    console.warn(
                        'Unhandled notification type:',
                        exhaustiveCheck
                    );
            }
        },
        [navigate]
    );

    const handleEventNotification = (
        notification: NotificationMessage,
        eventType: 'registration' | 'update' | 'published' | 'cancelled'
    ) => {
        if (isEventNotificationData(notification.data)) {
            const eventData: EventNotificationData = notification.data;

            // Fully typed event data access
            console.log(`Event ${eventType}:`, {
                eventId: eventData.eventId,
                title: eventData.eventTitle,
                organizer: eventData.organizerName,
                date: new Date(eventData.eventDate),
                info: eventData.additionalInfo,
            });

            // Navigate with type safety
            if (notification.actionUrl) {
                navigate(notification.actionUrl);
            } else {
                navigate(`/events/${eventData.eventId}`);
            }
        }
    };

    const handlePaymentNotification = (
        notification: NotificationMessage,
        paymentType: 'completed' | 'failed' | 'pending' | 'recurring'
    ) => {
        if (isPaymentNotificationData(notification.data)) {
            const paymentData: PaymentNotificationData = notification.data;

            // Fully typed payment data access
            console.log(`Payment ${paymentType}:`, {
                paymentId: paymentData.paymentId,
                amount: paymentData.amount,
                currency: paymentData.currency,
                reference: paymentData.paymentReference,
                status: paymentData.status,
                eventId: paymentData.eventId,
                eventTitle: paymentData.eventTitle,
            });

            // Handle different payment statuses
            switch (paymentType) {
                case 'completed':
                    showSuccessToast(
                        `Payment of ${paymentData.currency} ${paymentData.amount} completed`
                    );
                    break;
                case 'failed':
                    showErrorToast(
                        `Payment failed: ${paymentData.paymentReference}`
                    );
                    break;
                case 'pending':
                    showInfoToast(
                        `Payment pending: ${paymentData.paymentReference}`
                    );
                    break;
                case 'recurring':
                    showInfoToast(
                        `Recurring payment processed: ${paymentData.currency} ${paymentData.amount}`
                    );
                    break;
            }

            // Navigate to payment details
            if (notification.actionUrl) {
                navigate(notification.actionUrl);
            } else {
                navigate(`/payments/${paymentData.paymentId}`);
            }
        }
    };

    const handleFinancingNotification = (
        notification: NotificationMessage,
        financingType: 'submitted' | 'approved' | 'rejected' | 'payment_due'
    ) => {
        if (isFinancingNotificationData(notification.data)) {
            const financingData: FinancingNotificationData = notification.data;

            // Fully typed financing data access
            console.log(`Financing ${financingType}:`, {
                applicationId: financingData.applicationId,
                eventId: financingData.eventId,
                eventTitle: financingData.eventTitle,
                amount: financingData.amount,
                status: financingData.status,
                nextPaymentDate: financingData.nextPaymentDate
                    ? new Date(financingData.nextPaymentDate)
                    : null,
                reason: financingData.reason,
            });

            // Handle different financing statuses
            switch (financingType) {
                case 'submitted':
                    showInfoToast(
                        `Financing application submitted for ${financingData.eventTitle}`
                    );
                    break;
                case 'approved':
                    showSuccessToast(
                        `Financing approved for ${financingData.eventTitle}!`
                    );
                    break;
                case 'rejected':
                    showErrorToast(
                        `Financing rejected: ${financingData.reason || 'No reason provided'}`
                    );
                    break;
                case 'payment_due':
                    const dueDate = financingData.nextPaymentDate
                        ? new Date(financingData.nextPaymentDate)
                        : null;
                    showWarningToast(
                        `Payment due${dueDate ? ` on ${dueDate.toLocaleDateString()}` : ''}`
                    );
                    break;
            }

            // Navigate to financing details
            if (notification.actionUrl) {
                navigate(notification.actionUrl);
            } else {
                navigate(`/financing/${financingData.applicationId}`);
            }
        }
    };

    const handleSystemNotification = (notification: NotificationMessage) => {
        // Handle system notifications
        console.log('System notification:', {
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
        });

        // Show appropriate system notification
        switch (notification.priority) {
            case NotificationPriority.Critical:
                showErrorToast(notification.message, { autoClose: false });
                break;
            case NotificationPriority.High:
                showWarningToast(notification.message, { autoClose: 10000 });
                break;
            default:
                showInfoToast(notification.message);
        }
    };

    // Toast helper functions (implement with your preferred toast library)
    const showSuccessToast = (message: string, options?: any) => {
        // Implementation depends on your toast library
        console.log('Success:', message);
    };

    const showErrorToast = (message: string, options?: any) => {
        console.log('Error:', message);
    };

    const showWarningToast = (message: string, options?: any) => {
        console.log('Warning:', message);
    };

    const showInfoToast = (message: string, options?: any) => {
        console.log('Info:', message);
    };

    return { handleNotification };
};
```

### Advanced Notification Handler

Create a comprehensive notification handler with routing and state management:

```typescript
// hooks/useNotificationHandler.ts
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // or your preferred notification library
import { NotificationMessage, NotificationType } from '../types/notifications';

export const useNotificationHandler = () => {
  const navigate = useNavigate();

  const handleNotification = useCallback((notification: NotificationMessage) => {
    // Show toast notification
    const toastOptions = {
      autoClose: getAutoCloseTime(notification.priority),
      type: getToastType(notification.priority),
    };

    toast(
      <NotificationToast notification={notification} />,
      toastOptions
    );

    // Handle specific notification types
    switch (notification.type) {
      case NotificationType.EventRegistration:
        handleEventRegistration(notification);
        break;
      case NotificationType.PaymentCompleted:
        handlePaymentCompleted(notification);
        break;
      case NotificationType.PaymentFailed:
        handlePaymentFailed(notification);
        break;
      case NotificationType.FinancingApplicationApproved:
        handleFinancingApproved(notification);
        break;
      case NotificationType.FinancingApplicationRejected:
        handleFinancingRejected(notification);
        break;
      default:
        handleGenericNotification(notification);
    }
  }, [navigate]);

  const handleEventRegistration = (notification: NotificationMessage) => {
    // Update local state, show success message, etc.
    const eventData = notification.data as any;
    if (eventData?.eventId) {
      // Could update a global state or local storage
      console.log(`Registered for event: ${eventData.eventTitle}`);
    }
  };

  const handlePaymentCompleted = (notification: NotificationMessage) => {
    // Update payment status in local state
    const paymentData = notification.data as any;
    if (paymentData?.paymentId) {
      // Update payment status, refresh balance, etc.
      console.log(`Payment completed: ${paymentData.paymentReference}`);
    }
  };

  const handlePaymentFailed = (notification: NotificationMessage) => {
    // Handle payment failure
    const paymentData = notification.data as any;
    if (paymentData?.paymentId) {
      // Show retry option, update UI, etc.
      console.log(`Payment failed: ${paymentData.paymentReference}`);
    }
  };

  const handleFinancingApproved = (notification: NotificationMessage) => {
    // Handle financing approval
    const financingData = notification.data as any;
    if (financingData?.applicationId) {
      // Navigate to financing details, update status, etc.
      console.log(`Financing approved: ${financingData.eventTitle}`);
    }
  };

  const handleFinancingRejected = (notification: NotificationMessage) => {
    // Handle financing rejection
    const financingData = notification.data as any;
    if (financingData?.applicationId) {
      // Show reason, suggest alternatives, etc.
      console.log(`Financing rejected: ${financingData.reason}`);
    }
  };

  const handleGenericNotification = (notification: NotificationMessage) => {
    // Handle other notification types
    console.log(`Generic notification: ${notification.title}`);
  };

  const getAutoCloseTime = (priority: string): number => {
    switch (priority) {
      case 'Critical': return false; // Don't auto-close
      case 'High': return 10000;
      case 'Normal': return 5000;
      case 'Low': return 3000;
      default: return 5000;
    }
  };

  const getToastType = (priority: string): string => {
    switch (priority) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Normal': return 'info';
      case 'Low': return 'default';
      default: return 'info';
    }
  };

  return { handleNotification };
};

// Custom toast component
const NotificationToast: React.FC<{ notification: NotificationMessage }> = ({
  notification
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div className="notification-toast" onClick={handleClick}>
      <h4>{notification.title}</h4>
      <p>{notification.message}</p>
      <small>{new Date(notification.timestamp).toLocaleString()}</small>
      {notification.actionUrl && (
        <button className="action-button">View Details</button>
      )}
    </div>
  );
};
```

## TypeScript Types

### Complete Type Definitions

Create comprehensive TypeScript definitions for all notification-related types. These types mirror the backend C# models exactly:

```typescript
// types/notifications.ts

// ============================================================================
// CORE NOTIFICATION MODELS (from RevlrBE/Models/AppModels/)
// ============================================================================

/**
 * Defines the different types of notifications that can be sent through the system
 * Maps to: RevlrBE.Models.AppModels.NotificationType
 */
export enum NotificationType {
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
    SystemUpdate = 'SystemUpdate',
}

/**
 * Defines the priority levels for notifications to help with message prioritization
 * Maps to: RevlrBE.Models.AppModels.NotificationPriority
 */
export enum NotificationPriority {
    Low = 'Low',
    Normal = 'Normal',
    High = 'High',
    Critical = 'Critical',
}

/**
 * Base notification message model that contains all required properties for real-time notifications
 * Maps to: RevlrBE.Models.AppModels.NotificationMessage
 */
export interface NotificationMessage {
    /** Unique identifier for the notification */
    id: string;

    /** Type of notification being sent */
    type: NotificationType;

    /** Title of the notification */
    title: string;

    /** Human-readable message content */
    message: string;

    /** Timestamp when the notification was created */
    timestamp: string; // ISO 8601 date string

    /** Additional data specific to the notification type */
    data?:
        | EventNotificationData
        | PaymentNotificationData
        | FinancingNotificationData
        | any;

    /** Priority level of the notification */
    priority: NotificationPriority;

    /** Optional URL for frontend navigation/routing */
    actionUrl?: string;

    /** Additional metadata for the notification */
    metadata?: Record<string, any>;
}

/**
 * Notification data model for event-related notifications
 * Contains context information about events for proper frontend routing and display
 * Maps to: RevlrBE.Models.AppModels.EventNotificationData
 */
export interface EventNotificationData {
    /** Unique identifier of the event */
    eventId: string; // Guid as string

    /** Title of the event */
    eventTitle: string;

    /** Name of the event organizer */
    organizerName: string;

    /** Date and time of the event */
    eventDate: string; // ISO 8601 date string

    /** Additional information about the event or notification */
    additionalInfo?: string;
}

/**
 * Notification data model for payment-related notifications
 * Contains payment context information for user understanding and frontend routing
 * Maps to: RevlrBE.Models.AppModels.PaymentNotificationData
 */
export interface PaymentNotificationData {
    /** Unique identifier of the payment */
    paymentId: string; // Guid as string

    /** Payment amount */
    amount: number;

    /** Currency of the payment */
    currency: string; // Default: "NGN"

    /** Payment reference number */
    paymentReference: string;

    /** Current status of the payment */
    status: string;

    /** Associated event ID if payment is for an event */
    eventId?: string; // Guid as string

    /** Title of the associated event if applicable */
    eventTitle?: string;
}

/**
 * Notification data model for financing-related notifications
 * Contains financing application context for user understanding and follow-up actions
 * Maps to: RevlrBE.Models.AppModels.FinancingNotificationData
 */
export interface FinancingNotificationData {
    /** Unique identifier of the financing application */
    applicationId: string; // Guid as string

    /** Associated event ID */
    eventId: string; // Guid as string

    /** Title of the associated event */
    eventTitle: string;

    /** Financing amount */
    amount: number;

    /** Current status of the financing application */
    status: string;

    /** Next payment due date if applicable */
    nextPaymentDate?: string; // ISO 8601 date string

    /** Reason for status change or additional information */
    reason?: string;
}

// ============================================================================
// SIGNALR CONNECTION TYPES
// ============================================================================

/**
 * SignalR connection interface
 */
export interface SignalRConnection {
    connection: HubConnection | null;
    connectionState: HubConnectionState;
    error: Error | null;
    isConnected: boolean;
    isConnecting: boolean;
    isReconnecting: boolean;
    startConnection: () => Promise<HubConnection>;
    stopConnection: () => Promise<void>;
}

/**
 * SignalR configuration options
 */
export interface SignalROptions {
    hubUrl: string;
    accessTokenFactory: () => string | Promise<string>;
    automaticReconnect?: boolean;
    logLevel?: LogLevel;
    onConnected?: () => void;
    onDisconnected?: (error?: Error) => void;
    onReconnecting?: (error?: Error) => void;
    onReconnected?: (connectionId?: string) => void;
}

/**
 * Hub method signatures available on the NotificationHub
 */
export interface NotificationHubMethods {
    /** Join a user-specific group for receiving user notifications */
    JoinUserGroup: (userId: string) => Promise<void>;

    /** Join an organizer-specific group for receiving organizer notifications */
    JoinOrganizerGroup: (organizerId: string) => Promise<void>;

    /** Leave a specific group */
    LeaveGroup: (groupName: string) => Promise<void>;

    /** Get the current user's connection status */
    GetConnectionStatus: () => Promise<ConnectionStatus>;
}

/**
 * Connection status information returned by GetConnectionStatus
 */
export interface ConnectionStatus {
    isConnected: boolean;
    connectionId: string;
    userId?: string;
    totalConnections: number;
    userInfo?: UserInfo;
}

/**
 * User information from JWT claims
 */
export interface UserInfo {
    userId: string;
    userName: string;
    email: string;
    isOrganizer: boolean;
    connectionId: string;
}

// ============================================================================
// API REQUEST/RESPONSE MODELS (from SignalRTestController)
// ============================================================================

/**
 * Request model for testing basic notifications
 * Maps to: TestNotificationRequest
 */
export interface TestNotificationRequest {
    /** Title of the test notification */
    title?: string;

    /** Message content of the test notification */
    message?: string;
}

/**
 * Request model for testing event notifications
 * Maps to: TestEventNotificationRequest
 */
export interface TestEventNotificationRequest {
    /** Event ID for the notification */
    eventId?: string; // Guid as string

    /** Title of the event */
    eventTitle?: string;

    /** Name of the event organizer */
    organizerName?: string;

    /** Date of the event */
    eventDate?: string; // ISO 8601 date string

    /** Additional information about the event */
    additionalInfo?: string;
}

/**
 * Request model for testing payment notifications
 * Maps to: TestPaymentNotificationRequest
 */
export interface TestPaymentNotificationRequest {
    /** Payment ID for the notification */
    paymentId?: string; // Guid as string

    /** Payment amount */
    amount?: number;

    /** Payment currency */
    currency?: string;

    /** Payment reference number */
    paymentReference?: string;

    /** Payment status */
    status?: string;

    /** Associated event ID */
    eventId?: string; // Guid as string

    /** Associated event title */
    eventTitle?: string;
}

/**
 * Request model for testing financing notifications
 * Maps to: TestFinancingNotificationRequest
 */
export interface TestFinancingNotificationRequest {
    /** Financing application ID */
    applicationId?: string; // Guid as string

    /** Associated event ID */
    eventId?: string; // Guid as string

    /** Associated event title */
    eventTitle?: string;

    /** Financing amount */
    amount?: number;

    /** Financing application status */
    status?: string;

    /** Next payment due date */
    nextPaymentDate?: string; // ISO 8601 date string

    /** Reason for status change */
    reason?: string;
}

/**
 * Request model for sending notifications via NotificationService
 * Maps to: SendNotificationRequest
 */
export interface SendNotificationRequest {
    /** Target user ID (optional, defaults to current user) */
    userId?: string;

    /** Type of notification */
    type: NotificationType;

    /** Custom title for the notification */
    title?: string;

    /** Custom message for the notification */
    message?: string;

    /** Priority level of the notification */
    priority: NotificationPriority;

    /** Optional URL for frontend navigation */
    actionUrl?: string;

    /** Notification-specific data */
    data?: any;
}

/**
 * Request model for sending group notifications
 * Maps to: SendGroupNotificationRequest
 */
export interface SendGroupNotificationRequest {
    /** List of target user IDs */
    userIds: string[];

    /** Type of notification */
    type: NotificationType;

    /** Custom title for the notification */
    title?: string;

    /** Custom message for the notification */
    message?: string;

    /** Priority level of the notification */
    priority: NotificationPriority;

    /** Optional URL for frontend navigation */
    actionUrl?: string;

    /** Notification-specific data */
    data?: any;
}

/**
 * Request model for broadcasting notifications
 * Maps to: BroadcastNotificationRequest
 */
export interface BroadcastNotificationRequest {
    /** Type of notification */
    type: NotificationType;

    /** Custom title for the notification */
    title?: string;

    /** Custom message for the notification */
    message?: string;

    /** Priority level of the notification */
    priority: NotificationPriority;

    /** Optional URL for frontend navigation */
    actionUrl?: string;

    /** Notification-specific data */
    data?: any;
}

/**
 * Model for storing notification history entries
 * Maps to: NotificationHistoryEntry
 */
export interface NotificationHistoryEntry {
    /** Unique identifier for the history entry */
    id: string;

    /** Timestamp when the notification was sent */
    timestamp: string; // ISO 8601 date string

    /** Type of notification */
    type: NotificationType;

    /** Target user ID (or "ALL_USERS" for broadcasts) */
    targetUserId: string;

    /** User ID who sent the notification */
    sentByUserId: string;

    /** Notification title */
    title?: string;

    /** Notification message */
    message?: string;

    /** Priority level */
    priority: NotificationPriority;

    /** Action URL */
    actionUrl?: string;

    /** Notification data */
    data?: any;

    /** Whether this was a group notification */
    isGroupNotification: boolean;

    /** Whether this was a broadcast notification */
    isBroadcast: boolean;
}

/**
 * Request model for performance testing
 * Maps to: PerformanceTestRequest
 */
export interface PerformanceTestRequest {
    /** Number of notifications to send (max 1000) */
    notificationCount?: number; // Default: 100

    /** Number of users to target (will use connected users) */
    userCount?: number; // Default: 10
}

/**
 * Response model that contains all notification model schemas for OpenAPI documentation
 * Maps to: NotificationSchemasResponse
 */
export interface NotificationSchemasResponse {
    /** Example of the base notification message model */
    notificationMessage: NotificationMessage;

    /** Example of event notification data model */
    eventNotificationData: EventNotificationData;

    /** Example of payment notification data model */
    paymentNotificationData: PaymentNotificationData;

    /** Example of financing notification data model */
    financingNotificationData: FinancingNotificationData;

    /** All available notification types */
    notificationTypes: NotificationType[];

    /** All available notification priorities */
    notificationPriorities: NotificationPriority[];
}

// ============================================================================
// ERROR TYPES (from RevlrBE/Utilities/CustomExceptions.cs)
// ============================================================================

/**
 * Base error interface for SignalR-related errors
 */
export interface SignalRError {
    type: SignalRErrorType;
    message: string;
    originalError?: Error;
    timestamp: Date;
    connectionState?: HubConnectionState;
}

/**
 * SignalR error types
 */
export enum SignalRErrorType {
    CONNECTION_FAILED = 'CONNECTION_FAILED',
    AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    HUB_METHOD_ERROR = 'HUB_METHOD_ERROR',
    UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}

/**
 * Exception thrown when notification delivery fails
 * Maps to: NotificationDeliveryException
 */
export interface NotificationDeliveryError extends Error {
    userId?: string;
    notificationType?: string;
    retryCount: number;
}

/**
 * Exception thrown when connection management operations fail
 * Maps to: ConnectionManagementException
 */
export interface ConnectionManagementError extends Error {
    connectionId?: string;
    userId?: string;
    operation?: string;
}

/**
 * Exception thrown when SignalR hub operations fail
 * Maps to: SignalRHubException
 */
export interface SignalRHubError extends Error {
    connectionId?: string;
    userId?: string;
    hubMethod?: string;
}

/**
 * Exception thrown when notification data is invalid or malformed
 * Maps to: InvalidNotificationDataException
 */
export interface InvalidNotificationDataError extends Error {
    notificationType?: string;
    data?: any;
}

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Type guard to check if notification data is EventNotificationData
 */
export function isEventNotificationData(
    data: any
): data is EventNotificationData {
    return (
        data &&
        typeof data.eventId === 'string' &&
        typeof data.eventTitle === 'string' &&
        typeof data.organizerName === 'string' &&
        typeof data.eventDate === 'string'
    );
}

/**
 * Type guard to check if notification data is PaymentNotificationData
 */
export function isPaymentNotificationData(
    data: any
): data is PaymentNotificationData {
    return (
        data &&
        typeof data.paymentId === 'string' &&
        typeof data.amount === 'number' &&
        typeof data.currency === 'string' &&
        typeof data.paymentReference === 'string' &&
        typeof data.status === 'string'
    );
}

/**
 * Type guard to check if notification data is FinancingNotificationData
 */
export function isFinancingNotificationData(
    data: any
): data is FinancingNotificationData {
    return (
        data &&
        typeof data.applicationId === 'string' &&
        typeof data.eventId === 'string' &&
        typeof data.eventTitle === 'string' &&
        typeof data.amount === 'number' &&
        typeof data.status === 'string'
    );
}

/**
 * Type guard to validate NotificationMessage structure
 */
export function isValidNotificationMessage(
    obj: any
): obj is NotificationMessage {
    return (
        obj &&
        typeof obj.id === 'string' &&
        Object.values(NotificationType).includes(obj.type) &&
        typeof obj.title === 'string' &&
        typeof obj.message === 'string' &&
        typeof obj.timestamp === 'string' &&
        Object.values(NotificationPriority).includes(obj.priority)
    );
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * All notification types as a constant array
 */
export const NOTIFICATION_TYPES = Object.values(NotificationType) as const;

/**
 * All notification priorities as a constant array
 */
export const NOTIFICATION_PRIORITIES = Object.values(
    NotificationPriority
) as const;

/**
 * Event-related notification types
 */
export const EVENT_NOTIFICATION_TYPES = [
    NotificationType.EventRegistration,
    NotificationType.EventUpdate,
    NotificationType.EventPublished,
    NotificationType.EventCancelled,
] as const;

/**
 * Payment-related notification types
 */
export const PAYMENT_NOTIFICATION_TYPES = [
    NotificationType.PaymentCompleted,
    NotificationType.PaymentFailed,
    NotificationType.PaymentPending,
    NotificationType.RecurringPaymentProcessed,
] as const;

/**
 * Financing-related notification types
 */
export const FINANCING_NOTIFICATION_TYPES = [
    NotificationType.FinancingApplicationSubmitted,
    NotificationType.FinancingApplicationApproved,
    NotificationType.FinancingApplicationRejected,
    NotificationType.FinancingPaymentDue,
] as const;

/**
 * System-related notification types
 */
export const SYSTEM_NOTIFICATION_TYPES = [
    NotificationType.SystemMaintenance,
    NotificationType.SystemUpdate,
] as const;
```

## Error Handling

### Comprehensive Error Handling

Implement robust error handling for various scenarios:

```typescript
// hooks/useSignalRErrorHandler.ts
import { useCallback } from 'react';
import { HubConnectionState } from '@microsoft/signalr';

export enum SignalRErrorType {
    CONNECTION_FAILED = 'CONNECTION_FAILED',
    AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    HUB_METHOD_ERROR = 'HUB_METHOD_ERROR',
    UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}

export interface SignalRError {
    type: SignalRErrorType;
    message: string;
    originalError?: Error;
    timestamp: Date;
    connectionState?: HubConnectionState;
}

export const useSignalRErrorHandler = () => {
    const handleError = useCallback(
        (error: Error, context?: string): SignalRError => {
            const signalRError: SignalRError = {
                type: categorizeError(error),
                message: error.message,
                originalError: error,
                timestamp: new Date(),
            };

            // Log error for debugging
            console.debug(`SignalR Error [${context}]:`, signalRError);

            // Handle different error types
            switch (signalRError.type) {
                case SignalRErrorType.AUTHENTICATION_FAILED:
                    handleAuthenticationError(signalRError);
                    break;
                case SignalRErrorType.CONNECTION_FAILED:
                    handleConnectionError(signalRError);
                    break;
                case SignalRErrorType.NETWORK_ERROR:
                    handleNetworkError(signalRError);
                    break;
                case SignalRErrorType.HUB_METHOD_ERROR:
                    handleHubMethodError(signalRError);
                    break;
                default:
                    handleUnexpectedError(signalRError);
            }

            return signalRError;
        },
        []
    );

    const categorizeError = (error: Error): SignalRErrorType => {
        const message = error.message.toLowerCase();

        if (
            message.includes('unauthorized') ||
            message.includes('authentication')
        ) {
            return SignalRErrorType.AUTHENTICATION_FAILED;
        }
        if (message.includes('connection') || message.includes('network')) {
            return SignalRErrorType.NETWORK_ERROR;
        }
        if (message.includes('hub') || message.includes('invoke')) {
            return SignalRErrorType.HUB_METHOD_ERROR;
        }

        return SignalRErrorType.UNEXPECTED_ERROR;
    };

    const handleAuthenticationError = (error: SignalRError) => {
        // Handle authentication errors
        console.warn('Authentication error, redirecting to login');
        // Redirect to login or refresh token
    };

    const handleConnectionError = (error: SignalRError) => {
        // Handle connection errors
        console.warn('Connection error, will retry automatically');
        // Show user-friendly message about connection issues
    };

    const handleNetworkError = (error: SignalRError) => {
        // Handle network errors
        console.warn('Network error detected');
        // Show offline indicator or retry mechanism
    };

    const handleHubMethodError = (error: SignalRError) => {
        // Handle hub method errors
        console.warn('Hub method error:', error.message);
        // Show specific error message to user
    };

    const handleUnexpectedError = (error: SignalRError) => {
        // Handle unexpected errors
        console.debug('Unexpected SignalR error:', error);
        // Report to error tracking service
    };

    return { handleError };
};
```

## Best Practices

### 1. Connection Management

```typescript
// Best practices for connection management
export const SignalRBestPractices = {
    // Always clean up connections
    useConnectionCleanup: () => {
        useEffect(() => {
            return () => {
                // Cleanup function will be called on unmount
                connection?.stop();
            };
        }, [connection]);
    },

    // Handle page visibility changes
    usePageVisibility: (connection: HubConnection | null) => {
        useEffect(() => {
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    // Page is hidden, consider reducing connection activity
                    console.log('Page hidden, reducing SignalR activity');
                } else {
                    // Page is visible, resume normal activity
                    console.log('Page visible, resuming SignalR activity');
                    if (connection?.state === HubConnectionState.Disconnected) {
                        connection.start().catch(console.debug);
                    }
                }
            };

            document.addEventListener(
                'visibilitychange',
                handleVisibilityChange
            );
            return () => {
                document.removeEventListener(
                    'visibilitychange',
                    handleVisibilityChange
                );
            };
        }, [connection]);
    },

    // Implement connection retry logic
    useConnectionRetry: (startConnection: () => Promise<any>) => {
        const [retryCount, setRetryCount] = useState(0);
        const maxRetries = 5;

        const retryConnection = useCallback(async () => {
            if (retryCount < maxRetries) {
                try {
                    await startConnection();
                    setRetryCount(0); // Reset on successful connection
                } catch (error) {
                    setRetryCount((prev) => prev + 1);
                    const delay = Math.min(
                        1000 * Math.pow(2, retryCount),
                        30000
                    );
                    setTimeout(retryConnection, delay);
                }
            }
        }, [startConnection, retryCount, maxRetries]);

        return { retryConnection, retryCount, maxRetries };
    },
};
```

### 2. Performance Optimization

```typescript
// Performance optimization techniques
export const SignalRPerformance = {
    // Debounce notification handling
    useDebouncedNotifications: (
        handler: (notification: any) => void,
        delay = 100
    ) => {
        const debouncedHandler = useMemo(
            () => debounce(handler, delay),
            [handler, delay]
        );

        return debouncedHandler;
    },

    // Batch notification updates
    useBatchedNotifications: () => {
        const [notifications, setNotifications] = useState<any[]>([]);
        const batchRef = useRef<any[]>([]);

        const addNotification = useCallback((notification: any) => {
            batchRef.current.push(notification);
        }, []);

        const flushBatch = useCallback(() => {
            if (batchRef.current.length > 0) {
                setNotifications((prev) => [...batchRef.current, ...prev]);
                batchRef.current = [];
            }
        }, []);

        // Flush batch every 500ms
        useEffect(() => {
            const interval = setInterval(flushBatch, 500);
            return () => clearInterval(interval);
        }, [flushBatch]);

        return { notifications, addNotification };
    },

    // Limit notification history
    useLimitedNotificationHistory: (limit = 100) => {
        const [notifications, setNotifications] = useState<any[]>([]);

        const addNotification = useCallback(
            (notification: any) => {
                setNotifications((prev) => [
                    notification,
                    ...prev.slice(0, limit - 1),
                ]);
            },
            [limit]
        );

        return { notifications, addNotification };
    },
};
```

### 3. Security Considerations

```typescript
// Security best practices
export const SignalRSecurity = {
    // Validate notification data
    validateNotification: (notification: any): boolean => {
        if (!notification || typeof notification !== 'object') {
            return false;
        }

        const requiredFields = ['id', 'type', 'title', 'message', 'timestamp'];
        return requiredFields.every((field) => notification[field] != null);
    },

    // Sanitize notification content
    sanitizeNotification: (notification: any): any => {
        return {
            ...notification,
            title: sanitizeHtml(notification.title),
            message: sanitizeHtml(notification.message),
            // Don't sanitize data as it may contain structured information
        };
    },

    // Rate limiting for client-side actions
    useRateLimit: (limit = 10, windowMs = 60000) => {
        const actionsRef = useRef<number[]>([]);

        const isAllowed = useCallback(() => {
            const now = Date.now();
            const windowStart = now - windowMs;

            // Remove old actions
            actionsRef.current = actionsRef.current.filter(
                (time) => time > windowStart
            );

            if (actionsRef.current.length >= limit) {
                return false;
            }

            actionsRef.current.push(now);
            return true;
        }, [limit, windowMs]);

        return { isAllowed };
    },
};

// HTML sanitization function (implement based on your needs)
const sanitizeHtml = (html: string): string => {
    // Use a library like DOMPurify or implement basic sanitization
    return html.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        ''
    );
};
```

## API Integration

### SignalR Test Endpoints

The backend provides comprehensive test endpoints for validating your SignalR integration. All endpoints are available under `/api/signalrtest/`:

```typescript
// services/signalrTestService.ts
import {
    TestNotificationRequest,
    TestEventNotificationRequest,
    TestPaymentNotificationRequest,
    TestFinancingNotificationRequest,
    SendNotificationRequest,
    SendGroupNotificationRequest,
    BroadcastNotificationRequest,
    NotificationHistoryEntry,
    ConnectionStatus,
} from '../types/notifications';

export class SignalRTestService {
    private baseUrl: string;
    private getAuthHeaders: () => Record<string, string>;

    constructor(baseUrl: string, getAuthHeaders: () => Record<string, string>) {
        this.baseUrl = baseUrl;
        this.getAuthHeaders = getAuthHeaders;
    }

    /**
     * Send a test notification to the current user
     */
    async sendTestUserNotification(
        request: TestNotificationRequest
    ): Promise<any> {
        const response = await fetch(
            `${this.baseUrl}/api/signalrtest/test-user-notification`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders(),
                },
                body: JSON.stringify(request),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to send test notification: ${response.statusText}`
            );
        }

        return response.json();
    }

    /**
     * Send a test organizer notification (requires organizer role)
     */
    async sendTestOrganizerNotification(
        request: TestNotificationRequest
    ): Promise<any> {
        const response = await fetch(
            `${this.baseUrl}/api/signalrtest/test-organizer-notification`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders(),
                },
                body: JSON.stringify(request),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to send organizer notification: ${response.statusText}`
            );
        }

        return response.json();
    }

    /**
     * Get current user's connection status
     */
    async getConnectionStatus(): Promise<ConnectionStatus> {
        const response = await fetch(
            `${this.baseUrl}/api/signalrtest/connection-status`,
            {
                method: 'GET',
                headers: this.getAuthHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to get connection status: ${response.statusText}`
            );
        }

        return response.json();
    }

    /**
     * Validate JWT token
     */
    async validateToken(): Promise<any> {
        const response = await fetch(
            `${this.baseUrl}/api/signalrtest/validate-token`,
            {
                method: 'GET',
                headers: this.getAuthHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(`Token validation failed: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Send a test event notification
     */
    async sendTestEventNotification(
        request: TestEventNotificationRequest
    ): Promise<any> {
        const response = await fetch(
            `${this.baseUrl}/api/signalrtest/test-event-notification`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders(),
                },
                body: JSON.stringify(request),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to send event notification: ${response.statusText}`
            );
        }

        return response.json();
    }

    /**
     * Send a test payment notification
     */
    async sendTestPaymentNotification(
        request: TestPaymentNotificationRequest
    ): Promise<any> {
        const response = await fetch(
            `${this.baseUrl}/api/signalrtest/test-payment-notification`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders(),
                },
                body: JSON.stringify(request),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to send payment notification: ${response.statusText}`
            );
        }

        return response.json();
    }

    /**
     * Send a test financing notification
     */
    async sendTestFinancingNotification(
        request: TestFinancingNotificationRequest
    ): Promise<any> {
        const response = await fetch(
            `${this.baseUrl}/api/signalrtest/test-financing-notification`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders(),
                },
                body: JSON.stringify(request),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to send financing notification: ${response.statusText}`
            );
        }

        return response.json();
    }

    /**
     * Send notification using the NotificationService
     */
    async sendNotification(request: SendNotificationRequest): Promise<any> {
        const response = await fetch(
            `${this.baseUrl}/api/signalrtest/send-notification`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders(),
                },
                body: JSON.stringify(request),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to send notification: ${response.statusText}`
            );
        }

        return response.json();
    }

    /**
     * Send notification to multiple users
     */
    async sendGroupNotification(
        request: SendGroupNotificationRequest
    ): Promise<any> {
        const response = await fetch(
            `${this.baseUrl}/api/signalrtest/send-group-notification`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders(),
                },
                body: JSON.stringify(request),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to send group notification: ${response.statusText}`
            );
        }

        return response.json();
    }

    /**
     * Broadcast notification to all users (admin only)
     */
    async broadcastNotification(
        request: BroadcastNotificationRequest
    ): Promise<any> {
        const response = await fetch(
            `${this.baseUrl}/api/signalrtest/broadcast-notification`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders(),
                },
                body: JSON.stringify(request),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to broadcast notification: ${response.statusText}`
            );
        }

        return response.json();
    }

    /**
     * Get notification history
     */
    async getNotificationHistory(
        limit?: number,
        userId?: string
    ): Promise<{
        success: boolean;
        totalEntries: number;
        returnedEntries: number;
        history: NotificationHistoryEntry[];
    }> {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (userId) params.append('userId', userId);

        const response = await fetch(
            `${this.baseUrl}/api/signalrtest/notification-history?${params}`,
            {
                method: 'GET',
                headers: this.getAuthHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to get notification history: ${response.statusText}`
            );
        }

        return response.json();
    }

    /**
     * Check if a specific user is connected
     */
    async getUserConnectionStatus(userId: string): Promise<any> {
        const response = await fetch(
            `${this.baseUrl}/api/signalrtest/user-connection-status/${userId}`,
            {
                method: 'GET',
                headers: this.getAuthHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to get user connection status: ${response.statusText}`
            );
        }

        return response.json();
    }

    /**
     * Get all connected users (admin only)
     */
    async getConnectedUsers(): Promise<any> {
        const response = await fetch(
            `${this.baseUrl}/api/signalrtest/connected-users`,
            {
                method: 'GET',
                headers: this.getAuthHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to get connected users: ${response.statusText}`
            );
        }

        return response.json();
    }

    /**
     * Get detailed connection information (admin only)
     */
    async getConnectionDetails(): Promise<any> {
        const response = await fetch(
            `${this.baseUrl}/api/signalrtest/connection-details`,
            {
                method: 'GET',
                headers: this.getAuthHeaders(),
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to get connection details: ${response.statusText}`
            );
        }

        return response.json();
    }
}

// Usage example
const signalRTestService = new SignalRTestService(
    'https://your-api-url.com',
    () => ({
        Authorization: `Bearer ${getAccessToken()}`,
    })
);

// Test basic notification
await signalRTestService.sendTestUserNotification({
    title: 'Test Notification',
    message: 'This is a test message',
});

// Test event notification with full type safety
await signalRTestService.sendTestEventNotification({
    eventId: '123e4567-e89b-12d3-a456-426614174000',
    eventTitle: 'Sample Event',
    organizerName: 'John Doe',
    eventDate: new Date().toISOString(),
    additionalInfo: 'Additional event details',
});
```

### Testing Component

Create a comprehensive testing component for your SignalR integration:

```typescript
// components/SignalRTester.tsx
import React, { useState } from 'react';
import { useSignalRContext } from '../contexts/SignalRContext';
import { SignalRTestService } from '../services/signalrTestService';
import {
  NotificationType,
  NotificationPriority,
  TestNotificationRequest,
  TestEventNotificationRequest,
  TestPaymentNotificationRequest,
  TestFinancingNotificationRequest
} from '../types/notifications';

export const SignalRTester: React.FC = () => {
  const { connection, isConnected, connectionState } = useSignalRContext();
  const [testResults, setTestResults] = useState<string[]>([]);

  const testService = new SignalRTestService(
    process.env.REACT_APP_API_URL || 'https://localhost:7001',
    () => ({ 'Authorization': `Bearer ${getAccessToken()}` })
  );

  const addResult = (message: string) => {
    setTestResults(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 19)]);
  };

  const testBasicNotification = async () => {
    try {
      const result = await testService.sendTestUserNotification({
        title: 'Test Notification',
        message: 'This is a basic test notification'
      });
      addResult(`✅ Basic notification sent: ${result.message}`);
    } catch (error) {
      addResult(`❌ Basic notification failed: ${error.message}`);
    }
  };

  const testEventNotification = async () => {
    try {
      const result = await testService.sendTestEventNotification({
        eventId: crypto.randomUUID(),
        eventTitle: 'Test Event',
        organizerName: 'Test Organizer',
        eventDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        additionalInfo: 'This is a test event notification'
      });
      addResult(`✅ Event notification sent: ${result.message}`);
    } catch (error) {
      addResult(`❌ Event notification failed: ${error.message}`);
    }
  };

  const testPaymentNotification = async () => {
    try {
      const result = await testService.sendTestPaymentNotification({
        paymentId: crypto.randomUUID(),
        amount: 5000.00,
        currency: 'NGN',
        paymentReference: `PAY_${Date.now()}`,
        status: 'completed',
        eventId: crypto.randomUUID(),
        eventTitle: 'Test Event Payment'
      });
      addResult(`✅ Payment notification sent: ${result.message}`);
    } catch (error) {
      addResult(`❌ Payment notification failed: ${error.message}`);
    }
  };

  const testFinancingNotification = async () => {
    try {
      const result = await testService.sendTestFinancingNotification({
        applicationId: crypto.randomUUID(),
        eventId: crypto.randomUUID(),
        eventTitle: 'Test Financing Event',
        amount: 10000.00,
        status: 'approved',
        nextPaymentDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days
        reason: 'Application approved based on credit score'
      });
      addResult(`✅ Financing notification sent: ${result.message}`);
    } catch (error) {
      addResult(`❌ Financing notification failed: ${error.message}`);
    }
  };

  const testConnectionStatus = async () => {
    try {
      const status = await testService.getConnectionStatus();
      addResult(`✅ Connection status: ${JSON.stringify(status, null, 2)}`);
    } catch (error) {
      addResult(`❌ Connection status failed: ${error.message}`);
    }
  };

  const testTokenValidation = async () => {
    try {
      const result = await testService.validateToken();
      addResult(`✅ Token valid: ${result.userInfo.userName} (${result.userInfo.email})`);
    } catch (error) {
      addResult(`❌ Token validation failed: ${error.message}`);
    }
  };

  const testHubMethods = async () => {
    if (!connection || !isConnected) {
      addResult('❌ No active SignalR connection');
      return;
    }

    try {
      // Test GetConnectionStatus hub method
      const status = await connection.invoke('GetConnectionStatus');
      addResult(`✅ Hub GetConnectionStatus: ${JSON.stringify(status)}`);
    } catch (error) {
      addResult(`❌ Hub method failed: ${error.message}`);
    }
  };

  return (
    <div className="signalr-tester">
      <h2>SignalR Integration Tester</h2>

      <div className="connection-status">
        <h3>Connection Status</h3>
        <p>State: <strong>{connectionState}</strong></p>
        <p>Connected: <strong>{isConnected ? 'Yes' : 'No'}</strong></p>
        {connection && <p>Connection ID: <strong>{connection.connectionId}</strong></p>}
      </div>

      <div className="test-buttons">
        <h3>Test Functions</h3>
        <button onClick={testTokenValidation}>Validate Token</button>
        <button onClick={testConnectionStatus}>Check Connection Status</button>
        <button onClick={testHubMethods}>Test Hub Methods</button>
        <button onClick={testBasicNotification}>Send Basic Notification</button>
        <button onClick={testEventNotification}>Send Event Notification</button>
        <button onClick={testPaymentNotification}>Send Payment Notification</button>
        <button onClick={testFinancingNotification}>Send Financing Notification</button>
      </div>

      <div className="test-results">
        <h3>Test Results</h3>
        <div className="results-list">
          {testResults.map((result, index) => (
            <div key={index} className="result-item">
              {result}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to get access token (implement based on your auth system)
function getAccessToken(): string {
  // Implementation depends on your authentication system
  return localStorage.getItem('accessToken') || '';
}
```

## Testing

### Unit Testing SignalR Integration

```typescript
// __tests__/useSignalR.test.ts
import { renderHook, act } from '@testing-library/react';
import { useSignalR } from '../hooks/useSignalR';
import { HubConnectionBuilder } from '@microsoft/signalr';

// Mock SignalR
jest.mock('@microsoft/signalr');

describe('useSignalR', () => {
    const mockConnection = {
        start: jest.fn(),
        stop: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        invoke: jest.fn(),
        onclose: jest.fn(),
        onreconnecting: jest.fn(),
        onreconnected: jest.fn(),
        state: 'Disconnected',
    };

    beforeEach(() => {
        (HubConnectionBuilder as jest.Mock).mockImplementation(() => ({
            withUrl: jest.fn().mockReturnThis(),
            withAutomaticReconnect: jest.fn().mockReturnThis(),
            configureLogging: jest.fn().mockReturnThis(),
            build: jest.fn().mockReturnValue(mockConnection),
        }));
    });

    it('should create connection with correct options', () => {
        const options = {
            hubUrl: 'https://test.com/hub',
            accessTokenFactory: () => 'test-token',
        };

        renderHook(() => useSignalR(options));

        expect(HubConnectionBuilder).toHaveBeenCalled();
    });

    it('should start connection successfully', async () => {
        const options = {
            hubUrl: 'https://test.com/hub',
            accessTokenFactory: () => 'test-token',
        };

        mockConnection.start.mockResolvedValue(undefined);

        const { result } = renderHook(() => useSignalR(options));

        await act(async () => {
            await result.current.startConnection();
        });

        expect(mockConnection.start).toHaveBeenCalled();
        expect(result.current.isConnected).toBe(true);
    });

    it('should handle connection errors', async () => {
        const options = {
            hubUrl: 'https://test.com/hub',
            accessTokenFactory: () => 'test-token',
        };

        const error = new Error('Connection failed');
        mockConnection.start.mockRejectedValue(error);

        const { result } = renderHook(() => useSignalR(options));

        await act(async () => {
            try {
                await result.current.startConnection();
            } catch (e) {
                // Expected to throw
            }
        });

        expect(result.current.error).toEqual(error);
        expect(result.current.isConnected).toBe(false);
    });
});
```

### Integration Testing

```typescript
// __tests__/SignalRIntegration.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SignalRProvider } from '../contexts/SignalRContext';
import { UserNotifications } from '../components/UserNotifications';

// Mock auth context
const mockAuthContext = {
  isAuthenticated: true,
  user: { id: 'test-user', isOrganizer: false },
  getAccessToken: () => Promise.resolve('test-token')
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

describe('SignalR Integration', () => {
  it('should render notifications component', () => {
    render(
      <SignalRProvider hubUrl="https://test.com/hub">
        <UserNotifications />
      </SignalRProvider>
    );

    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should handle incoming notifications', async () => {
    const { container } = render(
      <SignalRProvider hubUrl="https://test.com/hub">
        <UserNotifications />
      </SignalRProvider>
    );

    // Simulate receiving a notification
    const notification = {
      id: '1',
      type: 'EventRegistration',
      title: 'Test Notification',
      message: 'Test message',
      timestamp: new Date().toISOString(),
      priority: 'Normal'
    };

    // This would require mocking the SignalR connection
    // and simulating the 'ReceiveNotification' event

    await waitFor(() => {
      // Assert that notification appears in UI
    });
  });
});
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Connection Failures

**Problem**: SignalR connection fails to establish

**Solutions**:

```typescript
// Check CORS configuration
const checkCorsConfiguration = async () => {
    try {
        const response = await fetch(`${hubUrl}/negotiate`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.debug('CORS or authentication issue:', response.status);
        }
    } catch (error) {
        console.debug('Network error:', error);
    }
};

// Verify token validity
const verifyToken = (token: string) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        console.log('Token expired:', isExpired);
        return !isExpired;
    } catch {
        console.debug('Invalid token format');
        return false;
    }
};
```

#### 2. Authentication Issues

**Problem**: Hub rejects connection due to authentication

**Solutions**:

```typescript
// Debug authentication
const debugAuthentication = async (connection: HubConnection) => {
    try {
        // Test connection status
        const status = await connection.invoke('GetConnectionStatus');
        console.log('Connection status:', status);
    } catch (error) {
        console.debug('Authentication error:', error);

        // Check if token needs refresh
        const token = await getAccessToken();
        if (!token || !verifyToken(token)) {
            console.log('Token invalid, refreshing...');
            // Refresh token and reconnect
        }
    }
};
```

#### 3. Group Joining Failures

**Problem**: Unable to join user or organizer groups

**Solutions**:

```typescript
// Debug group joining
const debugGroupJoining = async (connection: HubConnection, userId: string) => {
    try {
        await connection.invoke('JoinUserGroup', userId);
        console.log('Successfully joined user group');
    } catch (error) {
        console.debug('Failed to join user group:', error);

        // Check user permissions
        const status = await connection.invoke('GetConnectionStatus');
        console.log('User info:', status.userInfo);
    }
};
```

#### 4. Message Delivery Issues

**Problem**: Notifications not being received

**Solutions**:

```typescript
// Debug message delivery
const debugMessageDelivery = (connection: HubConnection) => {
    // Add logging to all event handlers
    connection.on('ReceiveNotification', (notification) => {
        console.log('Received notification:', notification);
    });

    // Test with API endpoint
    const testNotification = async () => {
        try {
            const response = await fetch(
                '/api/signalrtest/test-user-notification',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: 'Test',
                        message: 'Test message',
                    }),
                }
            );

            console.log('Test notification sent:', response.ok);
        } catch (error) {
            console.debug('Failed to send test notification:', error);
        }
    };
};
```

### Debugging Tools

```typescript
// SignalR debugging utilities
export const SignalRDebugger = {
    // Log all SignalR events
    enableVerboseLogging: (connection: HubConnection) => {
        const originalOn = connection.on.bind(connection);
        connection.on = (
            methodName: string,
            newMethod: (...args: any[]) => void
        ) => {
            const wrappedMethod = (...args: any[]) => {
                console.log(`[SignalR] Received ${methodName}:`, args);
                return newMethod(...args);
            };
            return originalOn(methodName, wrappedMethod);
        };

        const originalInvoke = connection.invoke.bind(connection);
        connection.invoke = (methodName: string, ...args: any[]) => {
            console.log(`[SignalR] Invoking ${methodName}:`, args);
            return originalInvoke(methodName, ...args);
        };
    },

    // Monitor connection state changes
    monitorConnectionState: (connection: HubConnection) => {
        const states = [
            'Disconnected',
            'Connecting',
            'Connected',
            'Disconnecting',
            'Reconnecting',
        ];

        setInterval(() => {
            console.log(
                `[SignalR] Connection state: ${states[connection.state]}`
            );
        }, 5000);
    },

    // Test connection health
    testConnectionHealth: async (connection: HubConnection) => {
        try {
            const start = Date.now();
            await connection.invoke('GetConnectionStatus');
            const latency = Date.now() - start;
            console.log(`[SignalR] Connection healthy, latency: ${latency}ms`);
            return { healthy: true, latency };
        } catch (error) {
            console.debug('[SignalR] Connection unhealthy:', error);
            return { healthy: false, error };
        }
    },
};
```

## Conclusion

This guide provides a comprehensive foundation for integrating React applications with the RevlrBE SignalR notification system. Key takeaways:

1. **Use the provided hooks and context** for consistent connection management
2. **Implement proper authentication** with JWT token handling
3. **Join appropriate groups** based on user type (user/organizer)
4. **Handle different notification types** with specific logic
5. **Implement robust error handling** for various failure scenarios
6. **Follow security best practices** for data validation and sanitization
7. **Test thoroughly** with both unit and integration tests
8. **Monitor and debug** connection issues proactively

The SignalR implementation supports real-time notifications for events, payments, and financing, providing users with immediate feedback and organizers with timely updates about their events.

For additional support or questions about the implementation, refer to the backend API documentation and the test endpoints available in the SignalRTestController.
