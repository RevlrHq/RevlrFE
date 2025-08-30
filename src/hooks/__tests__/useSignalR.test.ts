import { renderHook, act, waitFor } from '@testing-library/react';
import { HubConnectionState } from '@microsoft/signalr';
import { useSignalR } from '../useSignalR';
import { SignalRAuthService } from '@/lib/services/SignalRAuthService';
import type { SignalRErrorType } from '@/types/signalr';

// Mock SignalRAuthService
jest.mock('@/lib/services/SignalRAuthService');

// Mock @microsoft/signalr
const mockConnection = {
    start: jest.fn(),
    stop: jest.fn(),
    invoke: jest.fn(),
    send: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    onclose: jest.fn(),
    onreconnecting: jest.fn(),
    onreconnected: jest.fn(),
    state: HubConnectionState.Disconnected,
    connectionId: 'test-connection-id',
};

const mockHubConnectionBuilder = {
    withUrl: jest.fn().mockReturnThis(),
    withAutomaticReconnect: jest.fn().mockReturnThis(),
    configureLogging: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue(mockConnection),
};

const mockSignalRAuthService = SignalRAuthService as jest.Mocked<
    typeof SignalRAuthService
>;

jest.mock('@microsoft/signalr', () => ({
    HubConnectionBuilder: jest.fn(() => mockHubConnectionBuilder),
    HubConnectionState: {
        Disconnected: 'Disconnected',
        Connecting: 'Connecting',
        Connected: 'Connected',
        Disconnecting: 'Disconnecting',
        Reconnecting: 'Reconnecting',
    },
    LogLevel: {
        Trace: 0,
        Debug: 1,
        Information: 2,
        Warning: 3,
        Error: 4,
        Critical: 5,
        None: 6,
    },
}));

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
    process.env = {
        ...originalEnv,
        NEXT_PUBLIC_SIGNALR_HUB_URL: 'https://test-hub.com/hub',
        NODE_ENV: 'test',
    };

    // Reset all mocks
    jest.clearAllMocks();
    mockConnection.state = HubConnectionState.Disconnected;

    // Setup default SignalRAuthService mocks
    mockSignalRAuthService.createTokenFactory.mockReturnValue(() =>
        Promise.resolve('test-token')
    );
    mockSignalRAuthService.subscribeToAuthChanges.mockReturnValue(() => {});
    mockSignalRAuthService.handleAuthenticationFailure.mockResolvedValue({
        type: 'authentication' as SignalRErrorType,
        message: 'Authentication failed',
        timestamp: new Date(),
        retryable: false,
    });
});

afterEach(() => {
    process.env = originalEnv;
});

describe('useSignalR', () => {
    describe('initialization', () => {
        it('should initialize with disconnected state', () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            expect(result.current.isConnected).toBe(false);
            expect(result.current.isConnecting).toBe(false);
            expect(result.current.isReconnecting).toBe(false);
            expect(result.current.isDisconnected).toBe(true);
            expect(result.current.connection).toBeNull();
            expect(result.current.error).toBeNull();
        });

        it('should auto-connect when autoConnect is true', async () => {
            mockConnection.start.mockResolvedValue(undefined);
            mockConnection.state = HubConnectionState.Connected;

            // const { result } = renderHook(() =>
            //     useSignalR({ autoConnect: true })
            // );

            await waitFor(() => {
                expect(mockConnection.start).toHaveBeenCalled();
            });
        });

        it('should not auto-connect when autoConnect is false', () => {
            renderHook(() => useSignalR({ autoConnect: false }));

            expect(mockConnection.start).not.toHaveBeenCalled();
        });
    });

    describe('connection lifecycle', () => {
        it('should connect successfully', async () => {
            mockConnection.start.mockResolvedValue(undefined);
            mockConnection.state = HubConnectionState.Connected;

            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.connect();
            });

            expect(mockConnection.start).toHaveBeenCalled();
            expect(result.current.isConnected).toBe(true);
            expect(result.current.connectionState.state).toBe(
                HubConnectionState.Connected
            );
        });

        it('should handle connection failure', async () => {
            const connectionError = new Error('Connection failed');
            mockConnection.start.mockRejectedValue(connectionError);

            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                try {
                    await result.current.connect();
                } catch (error) {
                    expect(error).toBeDefined();
                }
            });

            expect(result.current.isConnected).toBe(false);
            expect(result.current.error).toBeDefined();
            expect(result.current.error?.message).toContain(
                'Connection failed'
            );
        });

        it('should disconnect successfully', async () => {
            mockConnection.start.mockResolvedValue(undefined);
            mockConnection.stop.mockResolvedValue(undefined);
            mockConnection.state = HubConnectionState.Connected;

            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            // First connect
            await act(async () => {
                await result.current.connect();
            });

            // Then disconnect
            await act(async () => {
                await result.current.disconnect();
            });

            expect(mockConnection.stop).toHaveBeenCalled();
            expect(result.current.isConnected).toBe(false);
            expect(result.current.connection).toBeNull();
        });

        it('should reconnect successfully', async () => {
            mockConnection.start.mockResolvedValue(undefined);
            mockConnection.stop.mockResolvedValue(undefined);
            mockConnection.state = HubConnectionState.Connected;

            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.reconnect();
            });

            expect(mockConnection.stop).toHaveBeenCalled();
            expect(mockConnection.start).toHaveBeenCalled();
        });
    });

    describe('event handlers', () => {
        it('should call onConnected when connection is established', async () => {
            const onConnected = jest.fn();
            mockConnection.start.mockResolvedValue(undefined);
            mockConnection.state = HubConnectionState.Connected;

            const { result } = renderHook(() =>
                useSignalR({
                    autoConnect: false,
                    eventHandlers: { onConnected },
                })
            );

            await act(async () => {
                await result.current.connect();
            });

            expect(onConnected).toHaveBeenCalled();
        });

        it('should call onDisconnected when connection is lost', async () => {
            const onDisconnected = jest.fn();
            mockConnection.start.mockResolvedValue(undefined);
            mockConnection.state = HubConnectionState.Connected;

            const { result } = renderHook(() =>
                useSignalR({
                    autoConnect: false,
                    eventHandlers: { onDisconnected },
                })
            );

            await act(async () => {
                await result.current.connect();
            });

            // Simulate connection close
            const closeHandler = mockConnection.onclose.mock.calls[0][0];
            act(() => {
                closeHandler(new Error('Connection lost'));
            });

            expect(onDisconnected).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should call onReconnecting when reconnection starts', async () => {
            const onReconnecting = jest.fn();
            mockConnection.start.mockResolvedValue(undefined);
            mockConnection.state = HubConnectionState.Connected;

            const { result } = renderHook(() =>
                useSignalR({
                    autoConnect: false,
                    eventHandlers: { onReconnecting },
                })
            );

            await act(async () => {
                await result.current.connect();
            });

            // Simulate reconnecting
            const reconnectingHandler =
                mockConnection.onreconnecting.mock.calls[0][0];
            act(() => {
                reconnectingHandler(new Error('Reconnecting'));
            });

            expect(onReconnecting).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should call onReconnected when reconnection succeeds', async () => {
            const onReconnected = jest.fn();
            mockConnection.start.mockResolvedValue(undefined);
            mockConnection.state = HubConnectionState.Connected;

            const { result } = renderHook(() =>
                useSignalR({
                    autoConnect: false,
                    eventHandlers: { onReconnected },
                })
            );

            await act(async () => {
                await result.current.connect();
            });

            // Simulate reconnected
            const reconnectedHandler =
                mockConnection.onreconnected.mock.calls[0][0];
            act(() => {
                reconnectedHandler('new-connection-id');
            });

            expect(onReconnected).toHaveBeenCalledWith('new-connection-id');
        });
    });

    describe('hub method calls', () => {
        beforeEach(async () => {
            mockConnection.start.mockResolvedValue(undefined);
            mockConnection.state = HubConnectionState.Connected;
        });

        it('should invoke hub methods successfully', async () => {
            const expectedResult = { success: true };
            mockConnection.invoke.mockResolvedValue(expectedResult);

            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.connect();
            });

            const invokeResult = await act(async () => {
                return await result.current.invoke(
                    'TestMethod',
                    'arg1',
                    'arg2'
                );
            });

            expect(mockConnection.invoke).toHaveBeenCalledWith(
                'TestMethod',
                'arg1',
                'arg2'
            );
            expect(invokeResult).toEqual(expectedResult);
        });

        it('should handle invoke method failures', async () => {
            const invokeError = new Error('Method failed');
            mockConnection.invoke.mockRejectedValue(invokeError);

            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.connect();
            });

            await act(async () => {
                try {
                    await result.current.invoke('TestMethod');
                } catch (error) {
                    expect(error).toBeDefined();
                    expect((error as { type: SignalRErrorType }).type).toBe(
                        'hub_method' as SignalRErrorType
                    );
                }
            });

            expect(result.current.error).toBeDefined();
            expect(result.current.error?.type).toBe(
                'hub_method' as SignalRErrorType
            );
        });

        it('should send messages successfully', async () => {
            mockConnection.send.mockResolvedValue(undefined);

            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.connect();
            });

            await act(async () => {
                await result.current.send('TestMessage', 'arg1', 'arg2');
            });

            expect(mockConnection.send).toHaveBeenCalledWith(
                'TestMessage',
                'arg1',
                'arg2'
            );
        });

        it('should throw error when invoking on disconnected connection', async () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                try {
                    await result.current.invoke('TestMethod');
                } catch (error) {
                    expect(error).toBeDefined();
                    expect((error as { type: SignalRErrorType }).type).toBe(
                        'connection' as SignalRErrorType
                    );
                }
            });
        });
    });

    describe('event registration', () => {
        beforeEach(async () => {
            mockConnection.start.mockResolvedValue(undefined);
            mockConnection.state = HubConnectionState.Connected;
        });

        it('should register event handlers', async () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.connect();
            });

            const handler = jest.fn();
            act(() => {
                result.current.on('TestEvent', handler);
            });

            expect(mockConnection.on).toHaveBeenCalledWith(
                'TestEvent',
                handler
            );
        });

        it('should unregister event handlers', async () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.connect();
            });

            const handler = jest.fn();
            act(() => {
                result.current.off('TestEvent', handler);
            });

            expect(mockConnection.off).toHaveBeenCalledWith(
                'TestEvent',
                handler
            );
        });

        it('should unregister all handlers for an event', async () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.connect();
            });

            act(() => {
                result.current.off('TestEvent');
            });

            expect(mockConnection.off).toHaveBeenCalledWith('TestEvent');
        });
    });

    describe('health monitoring', () => {
        beforeEach(async () => {
            mockConnection.start.mockResolvedValue(undefined);
            mockConnection.state = HubConnectionState.Connected;
            mockConnection.invoke.mockResolvedValue(undefined);
        });

        it('should check connection health', async () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.connect();
            });

            const isHealthy = await act(async () => {
                return await result.current.checkHealth();
            });

            expect(mockConnection.invoke).toHaveBeenCalledWith('Ping');
            expect(isHealthy).toBe(true);
            expect(result.current.connectionState.isHealthy).toBe(true);
        });

        it('should measure connection latency', async () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                await result.current.connect();
            });

            const latency = await act(async () => {
                return await result.current.measureLatency();
            });

            expect(mockConnection.invoke).toHaveBeenCalledWith('Ping');
            expect(latency).toBeGreaterThanOrEqual(0);
            expect(result.current.connectionState.latency).toBeDefined();
        });

        it('should return false for health check when disconnected', async () => {
            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            const isHealthy = await act(async () => {
                return await result.current.checkHealth();
            });

            expect(isHealthy).toBe(false);
        });
    });

    describe('configuration', () => {
        it('should use custom configuration', () => {
            const customConfig = {
                hubUrl: 'https://custom-hub.com/hub',
                automaticReconnect: false,
                enableLogging: false,
            };

            renderHook(() =>
                useSignalR({
                    autoConnect: false,
                    config: customConfig,
                })
            );

            expect(mockHubConnectionBuilder.withUrl).toHaveBeenCalledWith(
                customConfig.hubUrl,
                expect.any(Object)
            );
        });

        it('should use access token factory when provided', () => {
            const accessTokenFactory = jest.fn().mockReturnValue('test-token');

            renderHook(() =>
                useSignalR({
                    autoConnect: false,
                    config: { accessTokenFactory },
                })
            );

            expect(mockHubConnectionBuilder.withUrl).toHaveBeenCalledWith(
                expect.any(String),
                { accessTokenFactory }
            );
        });
    });

    describe('authentication integration', () => {
        it('should use token factory for authentication', () => {
            renderHook(() => useSignalR({ autoConnect: false }));

            expect(
                mockSignalRAuthService.createTokenFactory
            ).toHaveBeenCalled();
            expect(mockHubConnectionBuilder.withUrl).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    accessTokenFactory: expect.any(Function),
                })
            );
        });

        it('should handle authentication failures', async () => {
            const authError = new Error('Unauthorized');
            mockConnection.start.mockRejectedValue(authError);

            const mockAuthError = {
                type: 'authentication' as SignalRErrorType,
                message: 'Auth failed, token refreshed',
                timestamp: new Date(),
                retryable: true,
            };

            mockSignalRAuthService.handleAuthenticationFailure.mockResolvedValue(
                mockAuthError
            );

            const { result } = renderHook(() =>
                useSignalR({ autoConnect: false })
            );

            await act(async () => {
                try {
                    await result.current.connect();
                } catch (error) {
                    expect(error).toEqual(mockAuthError);
                }
            });

            expect(
                mockSignalRAuthService.handleAuthenticationFailure
            ).toHaveBeenCalledWith(authError);
            expect(result.current.error).toEqual(mockAuthError);
        });

        it('should subscribe to auth state changes', () => {
            renderHook(() => useSignalR({ autoConnect: true }));

            expect(
                mockSignalRAuthService.subscribeToAuthChanges
            ).toHaveBeenCalled();
        });

        it('should reconnect on auth state change when authenticated', async () => {
            mockConnection.start.mockResolvedValue(undefined);
            mockConnection.stop.mockResolvedValue(undefined);
            mockConnection.state = HubConnectionState.Connected;

            let authChangeCallback: (
                isAuthenticated: boolean,
                userId: string | null
            ) => void;

            mockSignalRAuthService.subscribeToAuthChanges.mockImplementation(
                (callback) => {
                    authChangeCallback = callback;
                    return () => {};
                }
            );

            const { result } = renderHook(() =>
                useSignalR({ autoConnect: true })
            );

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true);
            });

            // Simulate auth state change (user logged in)
            await act(async () => {
                authChangeCallback!(true, 'user-123');
            });

            // Should trigger reconnect
            expect(mockConnection.stop).toHaveBeenCalled();
            expect(mockConnection.start).toHaveBeenCalledTimes(2); // Initial connect + reconnect
        });

        it('should disconnect on logout', async () => {
            mockConnection.start.mockResolvedValue(undefined);
            mockConnection.stop.mockResolvedValue(undefined);
            mockConnection.state = HubConnectionState.Connected;

            let authChangeCallback: (
                isAuthenticated: boolean,
                userId: string | null
            ) => void;

            mockSignalRAuthService.subscribeToAuthChanges.mockImplementation(
                (callback) => {
                    authChangeCallback = callback;
                    return () => {};
                }
            );

            const { result } = renderHook(() =>
                useSignalR({ autoConnect: true })
            );

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true);
            });

            // Simulate logout
            await act(async () => {
                authChangeCallback!(false, null);
            });

            expect(mockConnection.stop).toHaveBeenCalled();
            expect(result.current.connection).toBeNull();
        });
    });

    describe('cleanup', () => {
        it('should cleanup on unmount', async () => {
            mockConnection.start.mockResolvedValue(undefined);
            mockConnection.stop.mockResolvedValue(undefined);
            mockConnection.state = HubConnectionState.Connected;

            const { result, unmount } = renderHook(() =>
                useSignalR({ autoConnect: true })
            );

            await waitFor(() => {
                expect(result.current.isConnected).toBe(true);
            });

            unmount();

            expect(mockConnection.stop).toHaveBeenCalled();
        });
    });
});
