import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HubConnectionState } from '@microsoft/signalr';
import {
    ConnectionStatusIndicator,
    CompactConnectionStatus,
    ConnectionStatusBadge,
} from '../ConnectionStatusIndicator';
import { HealthStatus } from '@/hooks/useSignalRHealthMonitor';

describe('ConnectionStatusIndicator', () => {
    describe('Basic Rendering', () => {
        it('should render connected status correctly', () => {
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Connected}
                />
            );

            expect(screen.getByText('Connected')).toBeInTheDocument();
            expect(screen.getByRole('status')).toHaveAttribute(
                'aria-label',
                'Connection status: Connected'
            );
        });

        it('should render disconnected status correctly', () => {
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Disconnected}
                />
            );

            expect(screen.getByText('Disconnected')).toBeInTheDocument();
            expect(screen.getByRole('status')).toHaveAttribute(
                'aria-label',
                'Connection status: Disconnected'
            );
        });

        it('should render connecting status with animation', () => {
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Connecting}
                />
            );

            expect(screen.getByText('Connecting')).toBeInTheDocument();
            // Check for animation class (pulse)
            const indicator = screen.getByRole('status').querySelector('span');
            expect(indicator).toHaveClass('animate-pulse');
        });

        it('should render reconnecting status when isReconnecting is true', () => {
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Connected}
                    isReconnecting={true}
                />
            );

            expect(screen.getByText('Reconnecting')).toBeInTheDocument();
        });
    });

    describe('Health Status Display', () => {
        it('should display health status when connected', () => {
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Connected}
                    healthStatus={HealthStatus.HEALTHY}
                />
            );

            expect(screen.getByText('Connected')).toBeInTheDocument();
            expect(screen.getByText('Healthy')).toBeInTheDocument();
            expect(screen.getByRole('status')).toHaveAttribute(
                'aria-label',
                'Connection status: Connected, Health: Healthy'
            );
        });

        it('should not display health status when disconnected', () => {
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Disconnected}
                    healthStatus={HealthStatus.HEALTHY}
                />
            );

            expect(screen.getByText('Disconnected')).toBeInTheDocument();
            expect(screen.queryByText('Healthy')).not.toBeInTheDocument();
        });

        it('should display critical health status with appropriate styling', () => {
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Connected}
                    healthStatus={HealthStatus.CRITICAL}
                />
            );

            expect(screen.getByText('Critical')).toBeInTheDocument();
            const criticalElement = screen.getByText('Critical').parentElement;
            expect(criticalElement).toHaveClass('text-red-600');
        });
    });

    describe('Latency Display', () => {
        it('should display latency when showDetails is true', () => {
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Connected}
                    latency={150}
                    showDetails={true}
                />
            );

            expect(screen.getByText('150ms')).toBeInTheDocument();
        });

        it('should not display latency when showDetails is false', () => {
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Connected}
                    latency={150}
                    showDetails={false}
                />
            );

            expect(screen.queryByText('150ms')).not.toBeInTheDocument();
        });

        it('should format latency correctly for different values', () => {
            const { rerender } = render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Connected}
                    latency={50}
                    showDetails={true}
                />
            );

            expect(screen.getByText('50ms')).toBeInTheDocument();

            rerender(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Connected}
                    latency={1500}
                    showDetails={true}
                />
            );

            expect(screen.getByText('1.5s')).toBeInTheDocument();

            rerender(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Connected}
                    latency={-1}
                    showDetails={true}
                />
            );

            expect(screen.getByText('N/A')).toBeInTheDocument();
        });
    });

    describe('Reconnect Button', () => {
        it('should show reconnect button when disconnected and onReconnect is provided', () => {
            const onReconnect = jest.fn();
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Disconnected}
                    onReconnect={onReconnect}
                />
            );

            const reconnectButton = screen.getByRole('button', {
                name: 'Reconnect to server',
            });
            expect(reconnectButton).toBeInTheDocument();
        });

        it('should show reconnect button when health is critical', () => {
            const onReconnect = jest.fn();
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Connected}
                    healthStatus={HealthStatus.CRITICAL}
                    onReconnect={onReconnect}
                />
            );

            const reconnectButton = screen.getByRole('button', {
                name: 'Reconnect to server',
            });
            expect(reconnectButton).toBeInTheDocument();
        });

        it('should not show reconnect button when connected and healthy', () => {
            const onReconnect = jest.fn();
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Connected}
                    healthStatus={HealthStatus.HEALTHY}
                    onReconnect={onReconnect}
                />
            );

            expect(
                screen.queryByRole('button', { name: 'Reconnect to server' })
            ).not.toBeInTheDocument();
        });

        it('should call onReconnect when reconnect button is clicked', () => {
            const onReconnect = jest.fn();
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Disconnected}
                    onReconnect={onReconnect}
                />
            );

            const reconnectButton = screen.getByRole('button', {
                name: 'Reconnect to server',
            });
            fireEvent.click(reconnectButton);

            expect(onReconnect).toHaveBeenCalledTimes(1);
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA attributes', () => {
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Connected}
                    healthStatus={HealthStatus.HEALTHY}
                    latency={100}
                />
            );

            const statusElement = screen.getByRole('status');
            expect(statusElement).toHaveAttribute('aria-live', 'polite');
            expect(statusElement).toHaveAttribute(
                'aria-label',
                'Connection status: Connected, Health: Healthy'
            );
        });

        it('should have proper focus management for reconnect button', () => {
            const onReconnect = jest.fn();
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Disconnected}
                    onReconnect={onReconnect}
                />
            );

            const reconnectButton = screen.getByRole('button', {
                name: 'Reconnect to server',
            });
            expect(reconnectButton).toHaveClass(
                'focus:outline-none',
                'focus:ring-2'
            );
        });
    });

    describe('Custom Styling', () => {
        it('should apply custom className', () => {
            render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Connected}
                    className='custom-class'
                />
            );

            const statusElement = screen.getByRole('status');
            expect(statusElement).toHaveClass('custom-class');
        });

        it('should apply correct color classes for different states', () => {
            const { rerender } = render(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Connected}
                />
            );

            let statusElement = screen.getByRole('status');
            expect(statusElement).toHaveClass(
                'text-green-600',
                'bg-green-100',
                'border-green-200'
            );

            rerender(
                <ConnectionStatusIndicator
                    connectionState={HubConnectionState.Disconnected}
                />
            );

            statusElement = screen.getByRole('status');
            expect(statusElement).toHaveClass(
                'text-red-600',
                'bg-red-100',
                'border-red-200'
            );
        });
    });
});

describe('CompactConnectionStatus', () => {
    it('should render compact version correctly', () => {
        render(
            <CompactConnectionStatus
                connectionState={HubConnectionState.Connected}
                healthStatus={HealthStatus.HEALTHY}
            />
        );

        const statusElement = screen.getByRole('status');
        expect(statusElement).toHaveAttribute(
            'aria-label',
            'Connection: Connected, Health: Healthy'
        );
        expect(statusElement).toHaveClass('text-xs');
    });

    it('should show health icon when connected and healthy', () => {
        render(
            <CompactConnectionStatus
                connectionState={HubConnectionState.Connected}
                healthStatus={HealthStatus.HEALTHY}
            />
        );

        // Check for health icon (✓)
        expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should not show health icon when disconnected', () => {
        render(
            <CompactConnectionStatus
                connectionState={HubConnectionState.Disconnected}
                healthStatus={HealthStatus.HEALTHY}
            />
        );

        expect(screen.queryByText('✓')).not.toBeInTheDocument();
    });
});

describe('ConnectionStatusBadge', () => {
    it('should render badge correctly', () => {
        render(
            <ConnectionStatusBadge
                connectionState={HubConnectionState.Connected}
                healthStatus={HealthStatus.HEALTHY}
                latency={100}
            />
        );

        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.getByText('(100ms)')).toBeInTheDocument();
    });

    it('should be clickable when onClick is provided', () => {
        const onClick = jest.fn();
        render(
            <ConnectionStatusBadge
                connectionState={HubConnectionState.Connected}
                onClick={onClick}
            />
        );

        const badge = screen.getByRole('button');
        expect(badge).toHaveClass('cursor-pointer');

        fireEvent.click(badge);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not be clickable when onClick is not provided', () => {
        render(
            <ConnectionStatusBadge
                connectionState={HubConnectionState.Connected}
            />
        );

        const badge = screen.getByRole('status');
        expect(badge).toHaveClass('cursor-default');
        expect(badge).toBeDisabled();
    });

    it('should use health color when connected and health status is provided', () => {
        render(
            <ConnectionStatusBadge
                connectionState={HubConnectionState.Connected}
                healthStatus={HealthStatus.CRITICAL}
            />
        );

        const badge = screen.getByRole('status');
        expect(badge).toHaveClass('text-red-600');
    });

    it('should include latency in aria-label', () => {
        render(
            <ConnectionStatusBadge
                connectionState={HubConnectionState.Connected}
                healthStatus={HealthStatus.HEALTHY}
                latency={150}
            />
        );

        const badge = screen.getByRole('status');
        expect(badge).toHaveAttribute(
            'aria-label',
            'Connection status: Connected, Health: Healthy, Latency: 150ms'
        );
    });
});
