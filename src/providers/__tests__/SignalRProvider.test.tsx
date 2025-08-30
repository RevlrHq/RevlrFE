import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { HubConnectionState } from '@microsoft/signalr';
import {
    SignalRProvider,
    useSignalRContext,
    useSignalRAvailable,
    useSignalRStatus,
    SignalRReady,
    SignalRConnected,
    withSignalR,
} from '../SignalRProvider';
import { useSignalR } from '@/hooks/useSignalR';
import { SignalRAuthService } from '@/lib/services/SignalRAuthService';
import type {
    UseSignalRResult,
    SignalRError,
    SignalRErrorType,
} from '@/types/signalr';

// Mock dependencies
jest.mock('@/hooks/useSignalR');
jest.mock('@/lib/services/SignalRAuthService');

const mockUseSignalR = useSignalR as jest.MockedFunction<typeof useSignalR>;
const mockSignalRAuthService = SignalRAuthService as jest.Mocked<
    typeof SignalRAuthService
>;

// Mock SignalR result
const createMockSignalRResult = (
    overrides: Partial<UseSignalRResult> = {}
): UseSignalRResult => ({
    connection: null,
    connectionState: {
        state: HubConnectionState.Disconnected,
        reconnectAttempts: 0,
        isHealthy: false,
    },
    error: null,
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    isDisconnected: true,
    connect: jest.fn(),
    disconnect: jest.fn(),
    reconnect: jest.fn(),
    checkHealth: jest.fn(),
    measureLatency: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    invoke: jest.fn(),
    send: jest.fn(),
    ...overrides,
});

// Test components
const TestComponent = () => {
    const signalR = useSignalRContext();
    return (
        <div>
            <div data-testid='connection-status'>
                {signalR.isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <div data-testid='ready-status'>
                {signalR.isReady ? 'Ready' : 'Not Ready'}
            </div>
            <div data-testid='error-status'>
                {signalR.lastError ? signalR.lastError.message : 'No Error'}
            </div>
        </div>
    );
};

const AvailabilityTestComponent = () => {
    const isAvailable = useSignalRAvailable();
    return (
        <div data-testid='availability'>
            {isAvailable ? 'Available' : 'Not Available'}
        </div>
    );
};

const StatusTestComponent = () => {
    const status = useSignalRStatus();
    return (
        <div data-testid='status'>
            {status
                ? `Connected: ${status.isConnected}, Ready: ${status.isReady}`
                : 'No Status'}
        </div>
    );
};

describe('SignalRProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Default mocks
        mockSignalRAuthService.isAuthenticated.mockReturnValue(true);
        mockSignalRAuthService.createTokenFactory.mockReturnValue(() =>
            Promise.resolve('test-token')
        );

        // Console mocks
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('basic functionality', () => {
        it('should provide SignalR context to children', () => {
            const mockResult = createMockSignalRResult({
                isConnected: true,
                isDisconnected: false,
            });
            mockUseSignalR.mockReturnValue(mockResult);

            render(
                <SignalRProvider>
                    <TestComponent />
                </SignalRProvider>
            );

            expect(screen.getByTestId('connection-status')).toHaveTextContent(
                'Connected'
            );
        });

        it('should throw error when useSignalRContext is used outside provider', () => {
            // Suppress console.debug for this test
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            expect(() => {
                render(<TestComponent />);
            }).toThrow(
                'useSignalRContext must be used within a SignalRProvider'
            );

            consoleSpy.mockRestore();
        });

        it('should pass options to useSignalR hook', () => {
            const customOptions = {
                autoConnect: false,
                enableHealthCheck: false,
            };

            mockUseSignalR.mockReturnValue(createMockSignalRResult());

            render(
                <SignalRProvider options={customOptions}>
                    <TestComponent />
                </SignalRProvider>
            );

            expect(mockUseSignalR).toHaveBeenCalledWith(
                expect.objectContaining({
                    autoConnect: false,
                    enableHealthCheck: false,
                })
            );
        });
    });

    describe('connection state management', () => {
        it('should set ready state when connected and authenticated', async () => {
            const mockResult = createMockSignalRResult({
                isConnected: true,
                isDisconnected: false,
            });
            mockUseSignalR.mockReturnValue(mockResult);
            mockSignalRAuthService.isAuthenticated.mockReturnValue(true);

            render(
                <SignalRProvider>
                    <TestComponent />
                </SignalRProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('ready-status')).toHaveTextContent(
                    'Ready'
                );
            });
        });

        it('should not be ready when not authenticated', async () => {
            const mockResult = createMockSignalRResult({
                isConnected: true,
                isDisconnected: false,
            });
            mockUseSignalR.mockReturnValue(mockResult);
            mockSignalRAuthService.isAuthenticated.mockReturnValue(false);

            render(
                <SignalRProvider>
                    <TestComponent />
                </SignalRProvider>
            );

            await waitFor(() => {
                expect(screen.getByTestId('ready-status')).toHaveTextContent(
                    'Not Ready'
                );
            });
        });

        it('should handle connection events through event handlers', async () => {
            let eventHandlers: Record<string, () => void> = {};

            mockUseSignalR.mockImplementation((options) => {
                eventHandlers = options.eventHandlers;
                return createMockSignalRResult();
            });

            render(
                <SignalRProvider enableConnectionLogging={true}>
                    <TestComponent />
                </SignalRProvider>
            );

            // Simulate connection event
            act(() => {
                eventHandlers.onConnected();
            });

            await waitFor(() => {
                expect(screen.getByTestId('ready-status')).toHaveTextContent(
                    'Ready'
                );
            });

            expect(console.log).toHaveBeenCalledWith(
                'SignalR: Connected successfully'
            );
        });

        it('should handle disconnection events', async () => {
            let eventHandlers: Record<string, () => void> = {};

            mockUseSignalR.mockImplementation((options) => {
                eventHandlers = options.eventHandlers;
                return createMockSignalRResult();
            });

            render(
                <SignalRProvider enableConnectionLogging={true}>
                    <TestComponent />
                </SignalRProvider>
            );

            // Simulate disconnection event
            const disconnectError = new Error('Connection lost');
            act(() => {
                eventHandlers.onDisconnected(disconnectError);
            });

            await waitFor(() => {
                expect(screen.getByTestId('ready-status')).toHaveTextContent(
                    'Not Ready'
                );
                expect(screen.getByTestId('error-status')).toHaveTextContent(
                    'Connection lost: Connection lost'
                );
            });

            expect(console.log).toHaveBeenCalledWith(
                'SignalR: Disconnected',
                'Connection lost'
            );
        });

        it('should handle reconnection events', async () => {
            let eventHandlers: Record<string, (error?: Error) => void> = {};

            mockUseSignalR.mockImplementation((options) => {
                eventHandlers = options.eventHandlers;
                return createMockSignalRResult();
            });

            render(
                <SignalRProvider enableConnectionLogging={true}>
                    <TestComponent />
                </SignalRProvider>
            );

            // Simulate reconnecting event
            act(() => {
                eventHandlers.onReconnecting(new Error('Reconnecting'));
            });

            await waitFor(() => {
                expect(screen.getByTestId('ready-status')).toHaveTextContent(
                    'Not Ready'
                );
            });

            // Simulate reconnected event
            act(() => {
                eventHandlers.onReconnected('new-connection-id');
            });

            await waitFor(() => {
                expect(screen.getByTestId('ready-status')).toHaveTextContent(
                    'Ready'
                );
                expect(screen.getByTestId('error-status')).toHaveTextContent(
                    'No Error'
                );
            });

            expect(console.log).toHaveBeenCalledWith(
                'SignalR: Reconnecting...',
                'Reconnecting'
            );
            expect(console.log).toHaveBeenCalledWith(
                'SignalR: Reconnected with ID:',
                'new-connection-id'
            );
        });
    });

    describe('error handling', () => {
        it('should handle SignalR errors', async () => {
            const signalRError: SignalRError = {
                type: 'connection' as SignalRErrorType,
                message: 'Connection failed',
                timestamp: new Date(),
                retryable: true,
            };

            let eventHandlers: Record<string, (error?: Error) => void> = {};

            mockUseSignalR.mockImplementation((options) => {
                eventHandlers = options.eventHandlers;
                return createMockSignalRResult({ error: signalRError });
            });

            render(
                <SignalRProvider enableGlobalErrorHandling={true}>
                    <TestComponent />
                </SignalRProvider>
            );

            // Simulate error event
            act(() => {
                eventHandlers.onError(signalRError);
            });

            await waitFor(() => {
                expect(screen.getByTestId('error-status')).toHaveTextContent(
                    'Connection failed'
                );
            });
        });

        it('should clear errors when clearError is called', async () => {
            const TestComponentWithClear = () => {
                const signalR = useSignalRContext();
                return (
                    <div>
                        <div data-testid='error-status'>
                            {signalR.lastError
                                ? signalR.lastError.message
                                : 'No Error'}
                        </div>
                        <button
                            onClick={signalR.clearError}
                            data-testid='clear-error'
                        >
                            Clear Error
                        </button>
                    </div>
                );
            };

            const signalRError: SignalRError = {
                type: 'connection' as SignalRErrorType,
                message: 'Connection failed',
                timestamp: new Date(),
                retryable: true,
            };

            let eventHandlers: Record<string, (error?: Error) => void> = {};

            mockUseSignalR.mockImplementation((options) => {
                eventHandlers = options.eventHandlers;
                return createMockSignalRResult();
            });

            render(
                <SignalRProvider>
                    <TestComponentWithClear />
                </SignalRProvider>
            );

            // Simulate error
            act(() => {
                eventHandlers.onError(signalRError);
            });

            await waitFor(() => {
                expect(screen.getByTestId('error-status')).toHaveTextContent(
                    'Connection failed'
                );
            });

            // Clear error
            act(() => {
                screen.getByTestId('clear-error').click();
            });

            await waitFor(() => {
                expect(screen.getByTestId('error-status')).toHaveTextContent(
                    'No Error'
                );
            });
        });
    });

    describe('utility hooks', () => {
        it('should provide availability status through useSignalRAvailable', () => {
            const mockResult = createMockSignalRResult({
                isConnected: true,
                isDisconnected: false,
            });
            mockUseSignalR.mockReturnValue(mockResult);

            render(
                <SignalRProvider>
                    <AvailabilityTestComponent />
                </SignalRProvider>
            );

            expect(screen.getByTestId('availability')).toHaveTextContent(
                'Available'
            );
        });

        it('should return false for useSignalRAvailable outside provider', () => {
            render(<AvailabilityTestComponent />);

            expect(screen.getByTestId('availability')).toHaveTextContent(
                'Not Available'
            );
        });

        it('should provide status through useSignalRStatus', () => {
            const mockResult = createMockSignalRResult({
                isConnected: true,
                isDisconnected: false,
            });
            mockUseSignalR.mockReturnValue(mockResult);

            render(
                <SignalRProvider>
                    <StatusTestComponent />
                </SignalRProvider>
            );

            expect(screen.getByTestId('status')).toHaveTextContent(
                'Connected: true, Ready: true'
            );
        });

        it('should return null for useSignalRStatus outside provider', () => {
            render(<StatusTestComponent />);

            expect(screen.getByTestId('status')).toHaveTextContent('No Status');
        });
    });

    describe('conditional rendering components', () => {
        it('should render children when SignalR is ready', () => {
            const mockResult = createMockSignalRResult({
                isConnected: true,
                isDisconnected: false,
            });
            mockUseSignalR.mockReturnValue(mockResult);

            render(
                <SignalRProvider>
                    <SignalRReady
                        fallback={<div data-testid='fallback'>Loading...</div>}
                    >
                        <div data-testid='ready-content'>SignalR is ready!</div>
                    </SignalRReady>
                </SignalRProvider>
            );

            expect(screen.getByTestId('ready-content')).toBeInTheDocument();
            expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
        });

        it('should render fallback when SignalR is not ready', () => {
            const mockResult = createMockSignalRResult();
            mockUseSignalR.mockReturnValue(mockResult);

            render(
                <SignalRProvider>
                    <SignalRReady
                        fallback={<div data-testid='fallback'>Loading...</div>}
                    >
                        <div data-testid='ready-content'>SignalR is ready!</div>
                    </SignalRReady>
                </SignalRProvider>
            );

            expect(
                screen.queryByTestId('ready-content')
            ).not.toBeInTheDocument();
            expect(screen.getByTestId('fallback')).toBeInTheDocument();
        });

        it('should render children when SignalR is connected', () => {
            const mockResult = createMockSignalRResult({
                isConnected: true,
                isDisconnected: false,
            });
            mockUseSignalR.mockReturnValue(mockResult);

            render(
                <SignalRProvider>
                    <SignalRConnected
                        fallback={
                            <div data-testid='fallback'>Connecting...</div>
                        }
                    >
                        <div data-testid='connected-content'>
                            SignalR is connected!
                        </div>
                    </SignalRConnected>
                </SignalRProvider>
            );

            expect(screen.getByTestId('connected-content')).toBeInTheDocument();
            expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();
        });
    });

    describe('HOC withSignalR', () => {
        it('should wrap component with SignalR provider', () => {
            const TestComponent = () => (
                <div data-testid='wrapped-component'>Wrapped!</div>
            );
            const WrappedComponent = withSignalR(TestComponent);

            mockUseSignalR.mockReturnValue(createMockSignalRResult());

            render(<WrappedComponent />);

            expect(screen.getByTestId('wrapped-component')).toBeInTheDocument();
            expect(mockUseSignalR).toHaveBeenCalled();
        });
    });
});
