/**
 * SignalR Integration - Complete rewrite using new architecture
 * This file provides backward compatibility while using the new SignalR infrastructure
 */

import { create } from 'zustand';
import type { HubConnection } from '@microsoft/signalr';
import { useSignalRContext } from '@/providers/SignalRProvider';

// Legacy interface for backward compatibility
interface SignalRStore {
    connection: HubConnection | null;
    isConnected: boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    sendMessage: (method: string, ...args: unknown[]) => Promise<void>;
}

// Internal store for legacy compatibility
const legacySignalRStore = create<SignalRStore>((set, get) => ({
    connection: null,
    isConnected: false,

    connect: async () => {
        // This is now handled by the SignalRProvider
        // We'll update the state when the provider connects
        console.warn(
            'SignalR: connect() is deprecated. Use SignalRProvider instead.'
        );
    },

    disconnect: async () => {
        // This is now handled by the SignalRProvider
        console.warn(
            'SignalR: disconnect() is deprecated. Use SignalRProvider instead.'
        );
    },

    sendMessage: async (method, ...args) => {
        const { connection } = get();
        if (connection) {
            await connection.invoke(method, ...args);
        } else {
            console.debug('SignalR: No connection available for sendMessage');
        }
    },
}));

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useSignalRContext from SignalRProvider instead
 */
export const useSignalRStore = () => {
    const store = legacySignalRStore();

    // Try to get the new SignalR context if available
    try {
        const newSignalR = useSignalRContext();

        // Update legacy store with new connection state
        if (
            newSignalR.connection !== store.connection ||
            newSignalR.isConnected !== store.isConnected
        ) {
            legacySignalRStore.setState({
                connection: newSignalR.connection,
                isConnected: newSignalR.isConnected,
            });
        }

        return {
            ...store,
            connection: newSignalR.connection,
            isConnected: newSignalR.isConnected,
            // Provide new methods through legacy interface
            connect: async () => {
                console.warn(
                    'SignalR: connect() is deprecated. Connection is managed by SignalRProvider.'
                );
                await newSignalR.connect();
            },
            disconnect: async () => {
                console.warn(
                    'SignalR: disconnect() is deprecated. Connection is managed by SignalRProvider.'
                );
                await newSignalR.disconnect();
            },
            sendMessage: async (method: string, ...args: unknown[]) => {
                await newSignalR.invoke(method, ...args);
            },
        };
    } catch {
        // If new SignalR context is not available, return legacy store
        return store;
    }
};

// Re-export new SignalR types and utilities for migration
export type {
    SignalRError,
    SignalRErrorType,
    SignalRConnectionState,
    NotificationMessage,
    NotificationType,
    NotificationPriority,
} from '@/types/signalr';

export type {
    NotificationData,
    EventNotificationData,
    PaymentNotificationData,
    FinancingNotificationData,
    SystemNotificationData,
} from '@/types/notifications';

// Re-export new SignalR hooks and providers for easy migration
export {
    useSignalRContext,
    useSignalRAvailable,
    useSignalRStatus,
    SignalRProvider,
    SignalRReady,
    SignalRConnected,
} from '@/providers/SignalRProvider';

export { useSignalR } from '@/hooks/useSignalR';
export { useSignalRErrorHandler } from '@/hooks/useSignalRErrorHandler';
export { useNotificationGroups } from '@/hooks/useNotificationGroups';
export { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';

/**
 * Migration helper function to check if new SignalR system is available
 * Note: This should only be used in React components or hooks
 */
export function useIsNewSignalRAvailable(): boolean {
    try {
        useSignalRContext();
        return true;
    } catch {
        return false;
    }
}

/**
 * Migration helper to get SignalR connection in a safe way
 * Note: This should only be used in React components or hooks
 */
export function useGetSignalRConnection(): HubConnection | null {
    try {
        const signalR = useSignalRContext();
        return signalR.connection;
    } catch {
        const legacy = legacySignalRStore.getState();
        return legacy.connection;
    }
}

/**
 * Migration helper to check connection status safely
 * Note: This should only be used in React components or hooks
 */
export function useIsSignalRConnected(): boolean {
    try {
        const signalR = useSignalRContext();
        return signalR.isConnected;
    } catch {
        const legacy = legacySignalRStore.getState();
        return legacy.isConnected;
    }
}
