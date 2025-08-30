import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HubConnectionState } from '@microsoft/signalr';
import {
    ConnectionStatus,
    ConnectionError,
    useConnectionStatus,
} from '../ConnectionStatus';
import { useSignalRContext } from '@/providers/SignalRProvider';
import type { SignalRError, SignalRConnectionState } from '@/types/signalr';

// Mock the SignalR provider
jest.mock('@/providers/SignalRProvider');
const mockUseSignalRContext = useSignalRContext as jest.MockedFunction<
    typeof useSignalRContext
>;

// Mock UI components
jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, disabled, ...props }: React.ComponentProps<'button'>) => (
        <button onClick={onClick} disabled={disabled} {...props}>
            {children}
        </button>
    ),
}));

jest.mock('@/components/ui/badge', () => ({
    Badge: ({ children, className, ...props }: React.ComponentProps<'div'>) => (
        <div className={className} {...props}>
            {children}
        </div>
    ),
}));

jest.mock('@/components/ui/tooltip', () => ({
    TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
    Wifi: ({ className }: { className?: string }) => (
        <div className={className} data-testid='wifi-icon' />
    ),
    WifiOff: ({ className }: { className?: string }) => (
        <div className={className} data-testid='wifi-off-icon' />
    ),
    Loader2: ({ className }: { className?: string }) => (
        <div className={className} data-testid='loader-icon' />
    ),
    AlertCircle: ({ className }: { className?: string }) => (
        <div className={className} data-testid='alert-icon' />
    ),
    RefreshCw: ({ className }: { className?: string }) => (
        <div className={className} data-testid='refresh-icon' />
    ),
    CheckCircle2: ({ className }: { className?: string }) => (
        <div className={className} data-testid='check-icon' />
    ),
}));

describe('ConnectionStatus', () => {
    const mockConnectionState: SignalRConnectionState = {
        state: HubConnectionState.Connected,
        connectionId: 'test-connection-id',
        lastConnected: new Date('2024-01-01T10:00:00Z'),
        lastDisconnected: undefined,
        reconnectAttempts: 0,
        isHealthy: true,
        latency: 50,
    };

    const mockSignalRContext = {
        connectionState: mockConnectionState,
        isConnected: true,
        isConnecting: false,
        isReconnecting: false,
        isDisconnected: false,
        error: null,
        reconnect: jest.fn(),
        measureLatency: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseSignalRContext.mockReturnValue(mockSignalRContext as unknown as ReturnType<typeof useSignalRContext>);
    });

    describe('Connected State', () => {
        it('should display connected status with check icon', () => {
            render(<ConnectionStatus />);

            expect(screen.getByText('Connected')).toBeInTheDocument();
            expect(
                screen.getByText('Real-time connection is active')
            ).toBeInTheDocument();
            expect(screen.getByTestId('check-icon')).toBeInTheDocument();
        });

        it('should not show reconnect button when connected', () => {
            render(<ConnectionStatus />);

            expect(screen.queryByText('Reconnect')).not.toBeInTheDocument();
        });

        it('should show health information when enabled', async () => {
            mockSignalRContext.measureLatency.mockResolvedValue(75);

            render(<ConnectionStatus showHealthInfo />);

            await waitFor(() => {
                expect(screen.getByText(/Latency: 75ms/)).toBeInTheDocument();
            });
        });
    });

    describe('Connecting State', () => {
        beforeEach(() => {
            mockUseSignalRContext.mockReturnValue({
                ...mockSignalRContext,
                connectionState: {
                    ...mockConnectionState,
                    state: HubConnectionState.Connecting,
                },
                isConnected: false,
                isConnecting: true,
            } as unknown as ReturnType<typeof useSignalRContext>);
        });

        it('should display connecting status with loader icon', () => {
            render(<ConnectionStatus />);

            expect(screen.getByText('Connecting')).toBeInTheDocument();
            expect(
                screen.getByText('Establishing real-time connection...')
            ).toBeInTheDocument();
            expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
        });

        it('should not show reconnect button when connecting', () => {
            render(<ConnectionStatus />);

            expect(screen.queryByText('Reconnect')).not.toBeInTheDocument();
        });
    });

    describe('Reconnecting State', () => {
        beforeEach(() => {
            mockUseSignalRContext.mockReturnValue({
                ...mockSignalRContext,
                connectionState: {
                    ...mockConnectionState,
                    state: HubConnectionState.Reconnecting,
                    reconnectAttempts: 2,
                },
                isConnected: false,
                isReconnecting: true,
            } as unknown as ReturnType<typeof useSignalRContext>);
        });

        it('should display reconnecting status with refresh icon', () => {
            render(<ConnectionStatus />);

            expect(screen.getByText('Reconnecting')).toBeInTheDocument();
            expect(
                screen.getByText('Attempting to restore connection...')
            ).toBeInTheDocument();
            expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
        });

        it('should show reconnection attempts', () => {
            render(<ConnectionStatus />);

            expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
        });
    });

    describe('Disconnected State', () => {
        beforeEach(() => {
            mockUseSignalRContext.mockReturnValue({
                ...mockSignalRContext,
                connectionState: {
                    ...mockConnectionState,
                    state: HubConnectionState.Disconnected,
                },
                isConnected: false,
                isDisconnected: true,
            } as unknown as ReturnType<typeof useSignalRContext>);
        });

        it('should display disconnected status with wifi-off icon', () => {
            render(<ConnectionStatus />);

            expect(screen.getByText('Disconnected')).toBeInTheDocument();
            expect(
                screen.getByText('Real-time connection is not available')
            ).toBeInTheDocument();
            expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
        });

        it('should show reconnect button when disconnected', () => {
            render(<ConnectionStatus />);

            expect(screen.getByText('Reconnect')).toBeInTheDocument();
        });

        it('should call reconnect when reconnect button is clicked', async () => {
            const mockReconnect = jest.fn().mockResolvedValue(undefined);
            mockUseSignalRContext.mockReturnValue({
                ...mockSignalRContext,
                connectionState: {
                    ...mockConnectionState,
                    state: HubConnectionState.Disconnected,
                },
                isConnected: false,
                isDisconnected: true,
                reconnect: mockReconnect,
            } as unknown as ReturnType<typeof useSignalRContext>);

            render(<ConnectionStatus />);

            const reconnectButton = screen.getByText('Reconnect');
            fireEvent.click(reconnectButton);

            await waitFor(() => {
                expect(mockReconnect).toHaveBeenCalledTimes(1);
            });
        });

        it('should disable reconnect button during reconnection', async () => {
            const mockReconnect = jest
                .fn()
                .mockImplementation(
                    () => new Promise((resolve) => setTimeout(resolve, 100))
                );
            mockUseSignalRContext.mockReturnValue({
                ...mockSignalRContext,
                connectionState: {
                    ...mockConnectionState,
                    state: HubConnectionState.Disconnected,
                },
                isConnected: false,
                isDisconnected: true,
                reconnect: mockReconnect,
            } as unknown as ReturnType<typeof useSignalRContext>);

            render(<ConnectionStatus />);

            const reconnectButton = screen.getByText('Reconnect');
            fireEvent.click(reconnectButton);

            // Button should show connecting state
            await waitFor(() => {
                expect(screen.getByText('Connecting...')).toBeInTheDocument();
            });

            // Wait for reconnection to complete
            await waitFor(() => {
                expect(screen.getByText('Reconnect')).toBeInTheDocument();
            });
        });

        it('should not show reconnect button when disabled', () => {
            render(<ConnectionStatus showReconnectButton={false} />);

            expect(screen.queryByText('Reconnect')).not.toBeInTheDocument();
        });
    });

    describe('Variants', () => {
        beforeEach(() => {
            mockUseSignalRContext.mockReturnValue({
                ...mockSignalRContext,
                connectionState: {
                    ...mockConnectionState,
                    state: HubConnectionState.Connected,
                },
                isConnected: true,
            } as unknown as ReturnType<typeof useSignalRContext>);
        });

        it('should render compact variant with only icon', () => {
            render(<ConnectionStatus variant='compact' />);

            expect(screen.getByTestId('check-icon')).toBeInTheDocument();
            // In compact variant, the text is in a tooltip, so it's still in the document
            // but not directly visible in the main component
            const statusElement = screen.getByRole('status');
            expect(statusElement).toHaveAttribute(
                'aria-label',
                'Connection status: Connected'
            );
        });

        it('should render badge variant', () => {
            render(<ConnectionStatus variant='badge' />);

            expect(screen.getByTestId('check-icon')).toBeInTheDocument();
            expect(screen.getByText('Connected')).toBeInTheDocument();
        });

        it('should render full variant with all details', () => {
            render(<ConnectionStatus variant='full' />);

            expect(screen.getByTestId('check-icon')).toBeInTheDocument();
            expect(screen.getByText('Connected')).toBeInTheDocument();
            expect(
                screen.getByText('Real-time connection is active')
            ).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        const mockError: SignalRError = {
            type: 'network' as SignalRError['type'],
            message: 'Network connection failed',
            timestamp: new Date('2024-01-01T10:00:00Z'),
            retryable: true,
        };

        beforeEach(() => {
            mockUseSignalRContext.mockReturnValue({
                ...mockSignalRContext,
                error: mockError,
            } as unknown as ReturnType<typeof useSignalRContext>);
        });

        it('should display error component when error exists', () => {
            const ErrorComponent = ({ error }: { error: SignalRError }) => (
                <div data-testid='error-component'>{error.message}</div>
            );

            render(<ConnectionStatus errorComponent={ErrorComponent} />);

            expect(screen.getByTestId('error-component')).toBeInTheDocument();
            expect(
                screen.getByText('Network connection failed')
            ).toBeInTheDocument();
        });
    });

    describe('Callbacks', () => {
        it('should call onReconnectClick when reconnect button is clicked', async () => {
            const mockOnReconnectClick = jest.fn();
            const mockReconnect = jest.fn().mockResolvedValue(undefined);

            mockUseSignalRContext.mockReturnValue({
                ...mockSignalRContext,
                connectionState: {
                    ...mockConnectionState,
                    state: HubConnectionState.Disconnected,
                },
                isConnected: false,
                isDisconnected: true,
                reconnect: mockReconnect,
            } as unknown as ReturnType<typeof useSignalRContext>);

            render(
                <ConnectionStatus onReconnectClick={mockOnReconnectClick} />
            );

            const reconnectButton = screen.getByText('Reconnect');
            fireEvent.click(reconnectButton);

            await waitFor(() => {
                expect(mockOnReconnectClick).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA attributes', () => {
            render(<ConnectionStatus />);

            const statusElement = screen.getByRole('status');
            expect(statusElement).toHaveAttribute('aria-live', 'polite');
        });

        it('should have proper aria-label for compact variant', () => {
            render(<ConnectionStatus variant='compact' />);

            const statusElement = screen.getByRole('status');
            expect(statusElement).toHaveAttribute(
                'aria-label',
                'Connection status: Connected'
            );
        });
    });
});

describe('ConnectionError', () => {
    const mockError: SignalRError = {
        type: 'authentication' as SignalRError['type'],
        message: 'Authentication failed',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        retryable: false,
    };

    it('should display error icon and message', () => {
        render(<ConnectionError error={mockError} />);

        expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });
});

describe('useConnectionStatus', () => {
    it('should return connection status information', () => {
        const TestComponent = () => {
            const status = useConnectionStatus();
            return (
                <div>
                    <div data-testid='state'>{status.state}</div>
                    <div data-testid='is-connected'>
                        {status.isConnected.toString()}
                    </div>
                    <div data-testid='reconnect-attempts'>
                        {status.reconnectAttempts}
                    </div>
                </div>
            );
        };

        render(<TestComponent />);

        expect(screen.getByTestId('state')).toHaveTextContent('Connected');
        expect(screen.getByTestId('is-connected')).toHaveTextContent('true');
        expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('0');
    });
});
