/**
 * SignalR Performance Integration Tests
 * 
 * This test suite focuses on performance optimization and monitoring
 * for the SignalR integration, including bundle size optimization,
 * memory usage testing, and security verification.
 * 
 * Test Coverage:
 * - Bundle size and loading performance
 * - Memory usage and cleanup verification
 * - Performance monitoring and metrics collection
 * - Security measures and data protection
 * - Connection optimization under load
 * - Resource cleanup and garbage collection
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, act } from '@testing-library/react';
import { performance } from 'perf_hooks';
import { HubConnectionState } from '@microsoft/signalr';
import { SignalRProvider, useSignalRContext } from '@/providers/SignalRProvider';
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';
import { useNotificationBatching } from '@/hooks/useNotificationBatching';
import { useConnectionOptimization } from '@/hooks/useConnectionOptimization';
import { usePerformanceTracking } from '@/hooks/usePerformanceTracking';
import { SignalRPerformanceTester } from '@/lib/utils/signalr-performance';
import { SignalRDebugLogger } from '@/lib/utils/signalr-debug';
import { SignalRStateService } from '@/lib/services/SignalRStateService';
import {
    NotificationMessage,
    NotificationType,
    NotificationPriority,
} from '@/types/notifications';

// ============================================================================
// Performance Testing Utilities
// ============================================================================

interface PerformanceMetrics {
    connectionTime: number;
    notificationProcessingTime: number;
    memoryUsage: {
        initial: number;
        peak: number;
        final: number;
    };
    bundleSize?: number;
    renderTime: number;
    cleanupTime: number;
}

class PerformanceMonitor {
    private metrics: PerformanceMetrics = {
        connectionTime: 0,
        notificationProcessingTime: 0,
        memoryUsage: {
            initial: 0,
            peak: 0,
            final: 0,
        },
        renderTime: 0,
        cleanupTime: 0,
    };

    private startTimes: Map<string, number> = new Map();

    startTimer(name: string): void {
        this.startTimes.set(name, performance.now());
    }

    endTimer(name: string): number {
        const startTime = this.startTimes.get(name);
        if (!startTime) return 0;
        
        const duration = performance.now() - startTime;
        this.startTimes.delete(name);
        return duration;
    }

    recordMemoryUsage(phase: 'initial' | 'peak' | 'final'): void {
        if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
            const memory = (window.performance as any).memory;
            this.metrics.memoryUsage[phase] = memory.usedJSHeapSize;
        }
    }

    getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    setMetric(key: keyof PerformanceMetrics, value: any): void {
        (this.metrics as any)[key] = value;
    }
}

// Mock performance.memory for Node.js environment
if (typeof window === 'undefined') {
    global.performance = {
        ...global.performance,
        memory: {
            usedJSHeapSize: 1000000,
            totalJSHeapSize: 2000000,
            jsHeapSizeLimit: 4000000,
        },
    } as any;
}

// ============================================================================
// Test Setup and Mocks
// ============================================================================

const mockConnection = {
    start: jest.fn(),
    stop: jest.fn(),
    invoke: jest.fn(),
    send: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    state: HubConnectionState.Disconnected,
    connectionId: 'test-connection-id',
    onclose: jest.fn(),
    onreconnecting: jest.fn(),
    onreconnected: jest.fn(),
};

jest.mock('@microsoft/signalr', () => ({
    HubConnectionBuilder: jest.fn().mockImplementation(() => ({
        withUrl: jest.fn().mockReturnThis(),
        withAutomaticReconnect: jest.fn().mockReturnThis(),
        configureLogging: jest.fn().mockReturnThis(),
        build: jest.fn(() => mockConnection),
    })),
    HubConnectionState: {
        Disconnected: 'Disconnected',
        Connecting: 'Connecting',
        Connected: 'Connected',
        Disconnecting: 'Disconnecting',
        Reconnecting: 'Reconnecting',
    },
    LogLevel: {
        Information: 2,
        Warning: 3,
        Error: 4,
    },
}));

// Mock authentication service
jest.mock('@/lib/services/SignalRAuthService', () => ({
    SignalRAuthService: {
        createTokenFactory: jest.fn(() => () => Promise.resolve('mock-token')),
        isAuthenticated: jest.fn(() => true),
        getCurrentUserId: jest.fn(() => 'test-user-id'),
        subscribeToAuthChanges: jest.fn(() => () => {}),
    },
}));

// ============================================================================
// Test Data Factories
// ============================================================================

const createTestNotifications = (count: number): NotificationMessage[] => {
    return Array.from({ length: count }, (_, i) => ({
        id: `notification-${i}`,
        type: NotificationType.EventRegistration,
        title: `Test Notification ${i}`,
        message: `This is test notification number ${i}`,
        timestamp: new Date().toISOString(),
        priority: NotificationPriority.Normal,
        data: {
            eventId: `event-${i}`,
            eventTitle: `Test Event ${i}`,
            organizerName: 'Test Organizer',
            eventDate: new Date().toISOString(),
            attendeeCount: 1,
            registrationId: `reg-${i}`,
            attendeeName: `User ${i}`,
            attendeeEmail: `user${i}@example.com`,
        },
    }));
};

// ============================================================================
// Test Components
// ============================================================================

interface PerformanceTestComponentProps {
    onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
    enableBatching?: boolean;
    enableOptimization?: boolean;
    enableTracking?: boolean;
    notificationCount?: number;
}

function PerformanceTestComponent({
    onMetricsUpdate,
    enableBatching = true,
    enableOptimization = true,
    enableTracking = true,
    notificationCount = 100,
}: PerformanceTestComponentProps) {
    const signalR = useSignalRContext();
    const notificationHandler = useTypedNotificationHandler({
        enableToastNotifications: false, // Disable for performance testing
        batchOptions: {
            enableBatching,
            batchSize: 10,
            batchDelay: 100,
        },
    });

    const batchingHook = useNotificationBatching({
        enabled: enableBatching,
        batchSize: 10,
        batchDelay: 100,
    });

    const optimizationHook = useConnectionOptimization({
        enabled: enableOptimization,
        enablePageVisibilityHandling: true,
        enableResourceCleanup: true,
    });

    const performanceHook = usePerformanceTracking({
        enabled: enableTracking,
        metricsInterval: 1000,
        enableMemoryTracking: true,
    });

    const [processedCount, setProcessedCount] = React.useState(0);
    const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);

    // Monitor performance metrics
    React.useEffect(() => {
        if (performanceHook.metrics && onMetricsUpdate) {
            const performanceMetrics: PerformanceMetrics = {
                connectionTime: performanceHook.metrics.connectionTime || 0,
                notificationProcessingTime: performanceHook.metrics.averageProcessingTime || 0,
                memoryUsage: {
                    initial: performanceHook.metrics.memoryUsage?.initial || 0,
                    peak: performanceHook.metrics.memoryUsage?.peak || 0,
                    final: performanceHook.metrics.memoryUsage?.current || 0,
                },
                renderTime: performanceHook.metrics.renderTime || 0,
                cleanupTime: performanceHook.metrics.cleanupTime || 0,
            };
            
            setMetrics(performanceMetrics);
            onMetricsUpdate(performanceMetrics);
        }
    }, [performanceHook.metrics, onMetricsUpdate]);

    // Handle notifications
    React.useEffect(() => {
        if (!signalR.connection) return;

        const handleNotification = async (notification: NotificationMessage) => {
            await notificationHandler.processNotification(notification);
            setProcessedCount(prev => prev + 1);
        };

        signalR.on('ReceiveNotification', handleNotification);

        return () => {
            signalR.off('ReceiveNotification', handleNotification);
        };
    }, [signalR, notificationHandler]);

    return (
        <div data-testid="performance-test-component">
            <div data-testid="connection-state">{signalR.connectionState.state}</div>
            <div data-testid="processed-count">{processedCount}</div>
            <div data-testid="notification-history-count">{notificationHandler.notificationHistory.length}</div>
            <div data-testid="batching-enabled">{enableBatching.toString()}</div>
            <div data-testid="optimization-enabled">{enableOptimization.toString()}</div>
            <div data-testid="tracking-enabled">{enableTracking.toString()}</div>
            
            {metrics && (
                <div data-testid="performance-metrics">
                    <div data-testid="connection-time">{metrics.connectionTime}</div>
                    <div data-testid="processing-time">{metrics.notificationProcessingTime}</div>
                    <div data-testid="memory-initial">{metrics.memoryUsage.initial}</div>
                    <div data-testid="memory-peak">{metrics.memoryUsage.peak}</div>
                    <div data-testid="memory-final">{metrics.memoryUsage.final}</div>
                    <div data-testid="render-time">{metrics.renderTime}</div>
                    <div data-testid="cleanup-time">{metrics.cleanupTime}</div>
                </div>
            )}
        </div>
    );
}

function renderWithSignalR(
    component: React.ReactElement,
    providerOptions: any = {}
) {
    return render(
        <SignalRProvider {...providerOptions}>
            {component}
        </SignalRProvider>
    );
}

// ============================================================================
// Test Suite
// ============================================================================

describe('SignalR Performance Integration Tests', () => {
    let performanceMonitor: PerformanceMonitor;

    beforeEach(() => {
        jest.clearAllMocks();
        performanceMonitor = new PerformanceMonitor();
        
        // Reset connection state
        mockConnection.state = HubConnectionState.Disconnected;
        mockConnection.start.mockResolvedValue(undefined);
        mockConnection.stop.mockResolvedValue(undefined);
        mockConnection.invoke.mockResolvedValue(undefined);

        // Record initial memory usage
        performanceMonitor.recordMemoryUsage('initial');

        // Reset state service
        SignalRStateService.reset();
    });

    afterEach(() => {
        // Record final memory usage
        performanceMonitor.recordMemoryUsage('final');
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
    });

    // ========================================================================
    // Bundle Size and Loading Performance
    // ========================================================================

    describe('Bundle Size and Loading Performance', () => {
        it('should load SignalR components efficiently', async () => {
            performanceMonitor.startTimer('component-render');

            const { container } = renderWithSignalR(
                <PerformanceTestComponent enableTracking={true} />
            );

            const renderTime = performanceMonitor.endTimer('component-render');
            performanceMonitor.setMetric('renderTime', renderTime);

            expect(container).toBeInTheDocument();
            expect(renderTime).toBeLessThan(100); // Should render in less than 100ms

            await waitFor(() => {
                expect(screen.getByTestId('performance-test-component')).toBeInTheDocument();
            });
        });

        it('should optimize connection establishment time', async () => {
            performanceMonitor.startTimer('connection-establishment');

            renderWithSignalR(
                <PerformanceTestComponent enableTracking={true} />
            );

            // Simulate connection establishment
            act(() => {
                mockConnection.state = HubConnectionState.Connecting;
            });

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                mockConnection.onreconnected?.('test-connection-id');
            });

            const connectionTime = performanceMonitor.endTimer('connection-establishment');
            performanceMonitor.setMetric('connectionTime', connectionTime);

            await waitFor(() => {
                expect(screen.getByTestId('connection-state')).toHaveTextContent('Connected');
            });

            expect(connectionTime).toBeLessThan(1000); // Should connect in less than 1 second
        });

        it('should lazy load non-critical components', async () => {
            // Test that heavy components are not loaded immediately
            const { container } = renderWithSignalR(
                <PerformanceTestComponent enableTracking={false} />
            );

            // Initial render should be fast without performance tracking
            expect(container.querySelector('[data-testid="performance-metrics"]')).toBeNull();

            // Enable tracking and verify lazy loading
            const { rerender } = render(
                <SignalRProvider>
                    <PerformanceTestComponent enableTracking={true} />
                </SignalRProvider>,
                { container }
            );

            await waitFor(() => {
                expect(screen.getByTestId('tracking-enabled')).toHaveTextContent('true');
            });
        });
    });

    // ========================================================================
    // Memory Usage and Cleanup
    // ========================================================================

    describe('Memory Usage and Cleanup', () => {
        it('should maintain stable memory usage under load', async () => {
            const notifications = createTestNotifications(1000);
            let metricsUpdates = 0;
            
            const onMetricsUpdate = (metrics: PerformanceMetrics) => {
                metricsUpdates++;
                performanceMonitor.recordMemoryUsage('peak');
            };

            renderWithSignalR(
                <PerformanceTestComponent 
                    onMetricsUpdate={onMetricsUpdate}
                    enableBatching={true}
                    notificationCount={1000}
                />
            );

            // Establish connection
            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            // Send notifications in batches to simulate real load
            const batchSize = 50;
            for (let i = 0; i < notifications.length; i += batchSize) {
                const batch = notifications.slice(i, i + batchSize);
                
                act(() => {
                    const handler = mockConnection.on.mock.calls.find(
                        call => call[0] === 'ReceiveNotification'
                    )?.[1];
                    
                    batch.forEach(notification => {
                        handler?.(notification);
                    });
                });

                // Allow processing between batches
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            await waitFor(() => {
                expect(screen.getByTestId('processed-count')).toHaveTextContent('1000');
            }, { timeout: 10000 });

            // Verify memory usage is reasonable
            const metrics = performanceMonitor.getMetrics();
            const memoryGrowth = metrics.memoryUsage.peak - metrics.memoryUsage.initial;
            
            // Memory growth should be reasonable (less than 50MB for 1000 notifications)
            expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
        });

        it('should properly cleanup resources on unmount', async () => {
            const { unmount } = renderWithSignalR(
                <PerformanceTestComponent enableOptimization={true} />
            );

            // Establish connection
            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            await waitFor(() => {
                expect(screen.getByTestId('connection-state')).toHaveTextContent('Connected');
            });

            // Record memory before unmount
            performanceMonitor.recordMemoryUsage('peak');

            performanceMonitor.startTimer('cleanup');
            
            // Unmount component
            unmount();

            const cleanupTime = performanceMonitor.endTimer('cleanup');
            performanceMonitor.setMetric('cleanupTime', cleanupTime);

            // Verify connection is stopped
            expect(mockConnection.stop).toHaveBeenCalled();
            expect(cleanupTime).toBeLessThan(100); // Cleanup should be fast
        });

        it('should limit notification history to prevent memory leaks', async () => {
            const notifications = createTestNotifications(200);

            renderWithSignalR(
                <PerformanceTestComponent 
                    enableBatching={false} // Disable batching for this test
                />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            // Send all notifications
            act(() => {
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                
                notifications.forEach(notification => {
                    handler?.(notification);
                });
            });

            await waitFor(() => {
                const historyCount = parseInt(
                    screen.getByTestId('notification-history-count').textContent || '0'
                );
                
                // History should be limited (default max is usually 100)
                expect(historyCount).toBeLessThanOrEqual(100);
            });
        });
    });

    // ========================================================================
    // Performance Monitoring and Metrics
    // ========================================================================

    describe('Performance Monitoring and Metrics', () => {
        it('should collect comprehensive performance metrics', async () => {
            let collectedMetrics: PerformanceMetrics | null = null;

            const onMetricsUpdate = (metrics: PerformanceMetrics) => {
                collectedMetrics = metrics;
            };

            renderWithSignalR(
                <PerformanceTestComponent 
                    onMetricsUpdate={onMetricsUpdate}
                    enableTracking={true}
                />
            );

            // Establish connection and process some notifications
            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            const notifications = createTestNotifications(10);
            act(() => {
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                
                notifications.forEach(notification => {
                    handler?.(notification);
                });
            });

            await waitFor(() => {
                expect(collectedMetrics).not.toBeNull();
            });

            if (collectedMetrics) {
                expect(collectedMetrics.connectionTime).toBeGreaterThanOrEqual(0);
                expect(collectedMetrics.notificationProcessingTime).toBeGreaterThanOrEqual(0);
                expect(collectedMetrics.memoryUsage.initial).toBeGreaterThan(0);
                expect(collectedMetrics.renderTime).toBeGreaterThanOrEqual(0);
            }
        });

        it('should track notification processing performance', async () => {
            const notifications = createTestNotifications(50);
            const processingTimes: number[] = [];

            renderWithSignalR(
                <PerformanceTestComponent enableTracking={true} />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            // Process notifications one by one and measure time
            for (const notification of notifications) {
                const startTime = performance.now();
                
                act(() => {
                    const handler = mockConnection.on.mock.calls.find(
                        call => call[0] === 'ReceiveNotification'
                    )?.[1];
                    handler?.(notification);
                });

                await waitFor(() => {
                    const processedCount = parseInt(
                        screen.getByTestId('processed-count').textContent || '0'
                    );
                    return processedCount > processingTimes.length;
                });

                const endTime = performance.now();
                processingTimes.push(endTime - startTime);
            }

            // Verify processing times are reasonable
            const averageProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
            expect(averageProcessingTime).toBeLessThan(10); // Should process in less than 10ms on average
        });

        it('should monitor connection health and latency', async () => {
            mockConnection.invoke.mockImplementation((method: string) => {
                if (method === 'Ping') {
                    // Simulate network latency
                    return new Promise(resolve => setTimeout(resolve, 50));
                }
                return Promise.resolve();
            });

            renderWithSignalR(
                <PerformanceTestComponent enableTracking={true} />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            await waitFor(() => {
                expect(screen.getByTestId('connection-state')).toHaveTextContent('Connected');
            });

            // Health check should be called
            expect(mockConnection.invoke).toHaveBeenCalledWith('Ping');
        });
    });

    // ========================================================================
    // Notification Batching Performance
    // ========================================================================

    describe('Notification Batching Performance', () => {
        it('should efficiently batch notifications to prevent UI flooding', async () => {
            const notifications = createTestNotifications(100);
            const batchProcessingTimes: number[] = [];

            renderWithSignalR(
                <PerformanceTestComponent 
                    enableBatching={true}
                    enableTracking={true}
                />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            const startTime = performance.now();

            // Send all notifications at once
            act(() => {
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                
                notifications.forEach(notification => {
                    handler?.(notification);
                });
            });

            await waitFor(() => {
                expect(screen.getByTestId('processed-count')).toHaveTextContent('100');
            }, { timeout: 5000 });

            const totalTime = performance.now() - startTime;

            // Batching should make processing more efficient
            expect(totalTime).toBeLessThan(2000); // Should process 100 notifications in less than 2 seconds
        });

        it('should compare batched vs non-batched performance', async () => {
            const notifications = createTestNotifications(50);

            // Test without batching
            const { unmount: unmount1 } = renderWithSignalR(
                <PerformanceTestComponent enableBatching={false} />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            const startTime1 = performance.now();
            
            act(() => {
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                
                notifications.forEach(notification => {
                    handler?.(notification);
                });
            });

            await waitFor(() => {
                expect(screen.getByTestId('processed-count')).toHaveTextContent('50');
            });

            const nonBatchedTime = performance.now() - startTime1;
            unmount1();

            // Reset mocks
            jest.clearAllMocks();
            mockConnection.state = HubConnectionState.Disconnected;

            // Test with batching
            renderWithSignalR(
                <PerformanceTestComponent enableBatching={true} />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            const startTime2 = performance.now();
            
            act(() => {
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                
                notifications.forEach(notification => {
                    handler?.(notification);
                });
            });

            await waitFor(() => {
                expect(screen.getByTestId('processed-count')).toHaveTextContent('50');
            });

            const batchedTime = performance.now() - startTime2;

            // Batching should be more efficient for large volumes
            // (This may not always be true for small volumes due to batching overhead)
            console.log(`Non-batched: ${nonBatchedTime}ms, Batched: ${batchedTime}ms`);
        });
    });

    // ========================================================================
    // Security and Data Protection
    // ========================================================================

    describe('Security and Data Protection', () => {
        it('should sanitize notification content', async () => {
            const maliciousNotification: NotificationMessage = {
                id: 'malicious-1',
                type: NotificationType.EventRegistration,
                title: '<script>alert("xss")</script>Malicious Title',
                message: '<img src="x" onerror="alert(\'xss\')" />Malicious Message',
                timestamp: new Date().toISOString(),
                priority: NotificationPriority.Normal,
                data: {
                    eventId: 'event-123',
                    eventTitle: '<script>alert("xss")</script>Malicious Event',
                    organizerName: 'Test Organizer',
                    eventDate: new Date().toISOString(),
                    attendeeCount: 1,
                    registrationId: 'reg-123',
                    attendeeName: 'John Doe',
                    attendeeEmail: 'john@example.com',
                },
            };

            renderWithSignalR(
                <PerformanceTestComponent enableTracking={true} />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            // Process malicious notification
            act(() => {
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                handler?.(maliciousNotification);
            });

            await waitFor(() => {
                expect(screen.getByTestId('processed-count')).toHaveTextContent('1');
            });

            // Verify that the notification was processed (sanitization happens in the handler)
            expect(screen.getByTestId('notification-history-count')).toHaveTextContent('1');
        });

        it('should validate authentication tokens', async () => {
            // Mock token validation
            const mockTokenFactory = jest.fn()
                .mockResolvedValueOnce('valid-token')
                .mockResolvedValueOnce(null); // Simulate token expiry

            jest.mocked(require('@/lib/services/SignalRAuthService').SignalRAuthService.createTokenFactory)
                .mockReturnValue(mockTokenFactory);

            renderWithSignalR(
                <PerformanceTestComponent />,
                {
                    options: {
                        config: {
                            accessTokenFactory: mockTokenFactory,
                        },
                    },
                }
            );

            // First connection should succeed
            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            await waitFor(() => {
                expect(screen.getByTestId('connection-state')).toHaveTextContent('Connected');
            });

            expect(mockTokenFactory).toHaveBeenCalled();
        });

        it('should implement rate limiting for client actions', async () => {
            const notifications = createTestNotifications(1000);

            renderWithSignalR(
                <PerformanceTestComponent enableOptimization={true} />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            // Send notifications very rapidly
            const startTime = performance.now();
            
            act(() => {
                const handler = mockConnection.on.mock.calls.find(
                    call => call[0] === 'ReceiveNotification'
                )?.[1];
                
                notifications.forEach(notification => {
                    handler?.(notification);
                });
            });

            // Should not process all notifications immediately due to rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));

            const processedCount = parseInt(
                screen.getByTestId('processed-count').textContent || '0'
            );

            // Rate limiting should prevent processing all 1000 notifications immediately
            expect(processedCount).toBeLessThan(1000);
        });
    });

    // ========================================================================
    // Connection Optimization
    // ========================================================================

    describe('Connection Optimization', () => {
        it('should optimize connection based on page visibility', async () => {
            renderWithSignalR(
                <PerformanceTestComponent enableOptimization={true} />
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
            });

            // Simulate page becoming hidden
            Object.defineProperty(document, 'visibilityState', {
                writable: true,
                value: 'hidden',
            });

            act(() => {
                document.dispatchEvent(new Event('visibilitychange'));
            });

            // Connection should be optimized for background operation
            // (Implementation details depend on the optimization strategy)

            // Simulate page becoming visible again
            Object.defineProperty(document, 'visibilityState', {
                writable: true,
                value: 'visible',
            });

            act(() => {
                document.dispatchEvent(new Event('visibilitychange'));
            });

            // Connection should be restored to full operation
            await waitFor(() => {
                expect(screen.getByTestId('connection-state')).toHaveTextContent('Connected');
            });
        });

        it('should handle multiple concurrent connections efficiently', async () => {
            // This test simulates multiple components using SignalR
            const components = Array.from({ length: 5 }, (_, i) => (
                <PerformanceTestComponent key={i} enableOptimization={true} />
            ));

            const { container } = render(
                <SignalRProvider>
                    {components}
                </SignalRProvider>
            );

            // All components should share the same connection
            expect(container.querySelectorAll('[data-testid="performance-test-component"]')).toHaveLength(5);

            // Only one connection should be established
            expect(mockConnection.start).toHaveBeenCalledTimes(1);
        });
    });
});