import type { HubConnection, HubConnectionState } from '@microsoft/signalr';

// Core SignalR connection interface
export interface SignalRConnection {
    connection: HubConnection | null;
    connectionState: HubConnectionState;
    error: SignalRError | null;
    isConnected: boolean;
    isConnecting: boolean;
    isReconnecting: boolean;
    startConnection: () => Promise<HubConnection>;
    stopConnection: () => Promise<void>;
    reconnect: () => Promise<void>;
}

// SignalR error types and interfaces
export enum SignalRErrorType {
    Authentication = 'authentication',
    Connection = 'connection',
    HubMethod = 'hub_method',
    Network = 'network',
    Unexpected = 'unexpected',
}

export interface SignalRError {
    type: SignalRErrorType;
    message: string;
    originalError?: Error;
    timestamp: Date;
    connectionState?: HubConnectionState;
    retryable: boolean;
}

// Connection configuration
export interface SignalRConfig {
    hubUrl: string;
    automaticReconnect: boolean;
    reconnectIntervals: number[];
    enableLogging: boolean;
    logLevel:
        | 'trace'
        | 'debug'
        | 'information'
        | 'warning'
        | 'error'
        | 'critical'
        | 'none';
    accessTokenFactory?: () => string | Promise<string>;
}

// Connection event handlers
export interface SignalREventHandlers {
    onConnected?: () => void;
    onDisconnected?: (error?: Error) => void;
    onReconnecting?: (error?: Error) => void;
    onReconnected?: (connectionId?: string) => void;
    onError?: (error: SignalRError) => void;
}

// Connection state
export interface SignalRConnectionState {
    state: HubConnectionState;
    connectionId?: string;
    lastConnected?: Date;
    lastDisconnected?: Date;
    reconnectAttempts: number;
    isHealthy: boolean;
    latency?: number;
}

// Hook options
export interface UseSignalROptions {
    config?: Partial<SignalRConfig>;
    eventHandlers?: SignalREventHandlers;
    autoConnect?: boolean;
    enableHealthCheck?: boolean;
    healthCheckInterval?: number;
}

// Hook return type
export interface UseSignalRResult {
    // Connection state
    connection: HubConnection | null;
    connectionState: SignalRConnectionState;
    error: SignalRError | null;

    // Connection status helpers
    isConnected: boolean;
    isConnecting: boolean;
    isReconnecting: boolean;
    isDisconnected: boolean;

    // Connection actions
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    reconnect: () => Promise<void>;

    // Health monitoring
    checkHealth: () => Promise<boolean>;
    measureLatency: () => Promise<number>;

    // Event handling
    on: (methodName: string, handler: (...args: unknown[]) => void) => void;
    off: (methodName: string, handler?: (...args: unknown[]) => void) => void;
    invoke: <T = unknown>(methodName: string, ...args: unknown[]) => Promise<T>;
    send: (methodName: string, ...args: unknown[]) => Promise<void>;
}
