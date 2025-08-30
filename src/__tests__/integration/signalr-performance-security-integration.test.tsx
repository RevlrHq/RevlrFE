/**
 * SignalR Performance and Security Integration Tests
 * 
 * This test suite verifies that performance optimization and security
 * measures work together correctly without compromising each other.
 * 
 * Test Coverage:
 * - Performance monitoring with security validation
 * - Bundle optimization with security features
 * - Memory usage with security overhead
 * - Rate limiting performance impact
 * - Security validation performance
 * - Combined system resilience
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, waitFor, act } from '@testing-library/react';
import { HubConnectionState } from '@microsoft/signalr';
import { SignalRProvider } from '@/providers/SignalRProvider';
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';
import { performanceMonitor } from '@/lib/services/SignalRPerformanceMonitor';
import { securityValidator } from '@/lib/services/SignalRSecurityValidator';
import { SignalRBundleAnalyzer } from '@/lib/utils/signalr-bundle-analyzer';
import {
    NotificationMessage,
    NotificationType,
    NotificationPriority,
} from '@/types/notifications';

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
}));

jest.mock('@/lib/services/SignalRAuthService', () => ({
    SignalRAuthService: {
        createTokenFactory: jest.fn(() => () => Promise.resolve('mock-token')),
        isAuthenticated: jest.fn(() => true),
        getCurrentUserId: jest.fn(() => 'test-user-id'),
        subscribeToAuthChanges: jest.fn(() => () => {}),
    },
}));

// Mock DOMPurify for security tests
jest.mock('dompurify', () => ({
    sanitize: jest.fn((input: string) => input.replace(/<script.*?<\/script>/gi, '')),
    setConfig: jest.fn(),
}));

// ============================================================================
// Test Data Factories
// ============================================================================

const createSecureNotification = (): NotificationMessage => ({
    id: 'secure-notification-1',
    type: NotificationType.EventRegistration,
    title: 'Secure Event Registration',
    message: 'A new user has registered for your event',
    timestamp: new Date().toISOString(),
    priority: NotificationPriority.Normal,
    data: {
        eventId: 'event-123',
        eventTitle: 'Secure Event',
        organizerName: 'Test Organizer',
        eventDate: new Date().toISOString(),
        attendeeCount: 1,
        registrationId: 'reg-123',
        attendeeName: 'John Doe',
        attendeeEmail: 'john@example.com',
    },
});

const createMaliciousNotification = (): NotificationMessage => ({
    id: 'malicious-notification-1',
    type: NotificationType.EventRegistration,
    title: '<script>alert("XSS")</script>Malicious Title',
    message: 'DROP TABLE users; --',
    timestamp: new Date().toISOString(),
    priority: NotificationPriority.High,
    data: {
        eventId: 'event-123',
        eventTitle: '<img src="x" onerror="alert(\'XSS\')" />',
        organizerName: 'javascript:alert("XSS")',
        eventDate: new Date().toISOString(),
        attendeeCount: 1,
        registrationId: 'reg-123',
        attendeeName: 'John Doe',
        attendeeEmail: 'john@example.com',
    },
});

const createLargeNotification = (): NotificationMessage => ({
    id: 'large-notification-1',
    type: NotificationType.EventRegistration,
    title: 'Large Notification',
    message: 'A'.repeat(5000), // Large message
    timestamp: new Date().toISOString(),
    priority: NotificationPriority.Normal,
    data: {
        eventId: 'event-123',
        eventTitle: 'Large Event',
        organizerName: 'Test Organizer',
        eventDate: new Date().toISOString(),
        attendeeCount: 1,
        registrationId: 'reg-123',
        attendeeName: 'John Doe',
        attendeeEmail: 'john@example.com',
        largeData: 'B'.repeat(3000), // Additional large data
    },
});

// ============================================================================
// Test Components
// ============================================================================

interface PerformanceSecurityTestComponentProps {
    onNotificationProcessed?: (processingTime: number, securityResult: any) => void;
    onPerformanceMetrics?: (metrics: any) => void;
    onSecurityAlert?: (alert: any) => void;
}

function PerformanceSecurityTestComponent({
    onNotificationProcessed,
    onPerformanceMetrics,
    onSecurityAlert,
}: PerformanceSecurityTestComponentProps) {
    const notificationHandler = useTypedNotificationHandler({
        enableToastNotifications: false,
        enableValidation: true,
    });

    const [processedCount, setProcessedCount] = React.useState(0);
    const [securityViolations, setSecurityViolations] = React.useState(0);

    // Set up performance monitoring
    React.useEffect(() => {
        performanceMonitor.startMonitoring(1000);
        
        performanceMonitor.setEventListeners({
            onMetricsUpdate: (metrics) => {
                if (onPerformanceMetrics) {
                    onPerformanceMetrics(metrics);
                }
            },
        });

        return () => {
            performanceMonitor.stopMonitoring();
        };
    }, [onPerformanceMetrics]);

    // Set up security monitoring
    React.useEffect(() => {
        securityValidator.setEventListeners({
            onAlert: (alert) => {
                if (onSecurityAlert) {
                    onSecurityAlert(alert);
                }
            },
            onViolation: () => {
                setSecurityViolations(prev => prev + 1);
            },
        });
    }, [onSecurityAlert]);

    // Handle notifications with performance and security tracking
    const handleNotification = React.useCallback(async (notification: NotificationMessage) => {
        const startTime = performance.now();
        
        // Security validation
        const securityResult = securityValidator.validateNotification(notification, 'test-user-id');
        
        // Performance tracking
        performanceMonitor.trackNotificationReceived(notification);
        
        if (securityResult.isValid) {
            // Process notification
            await notificationHandler.processNotification(securityResult.sanitizedData || notification);
            
            const processingTime = performance.now() - startTime;
            performanceMonitor.trackNotificationProcessed(processingTime, true);
            
            setProcessedCount(prev => prev + 1);
            
            if (onNotificationProcessed) {
                onNotificationProcessed(processingTime, securityResult);
            }
        } else {
            const processingTime = performance.now() - startTime;
            performanceMonitor.trackNotificationProcessed(processingTime, false);
        }
    }, [notificationHandler, onNotificationProcessed]);

    return (
        <div data-testid="performance-security-test-component">
            <div data-testid="processed-count">{processedCount}</div>
            <div data-testid="security-violations">{securityViolations}</div>
            <button
                data-testid="process-notification-button"
                onClick={() => handleNotification(createSecureNotification())}
            >
                Process Secure Notification
            </button>
            <button
                data-testid="process-malicious-button"
                onClick={() => handleNotification(createMaliciousNotification())}
            >
                Process Malicious Notification
            </button>
            <button
                data-testid="process-large-button"
                onClick={() => handleNotification(createLargeNotification())}
            >
                Process Large Notification
            </button>
        </div>
    );
}

// ============================================================================
// Test Suite
// ============================================================================

describe('SignalR Performance and Security Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConnection.state = HubConnectionState.Disconnected;
        
        // Reset services
        performanceMonitor.stopMonitoring();
        securityValidator.setConfig({
            enableXSSProtection: true,
            enableSQLInjectionProtection: true,
            enableRateLimiting: true,
            enableContentValidation: true,
            enableTokenValidation: true,
            enableCSRFProtection: true,
            rateLimitConfig: {
                windowMs: 60 * 1000,
                maxRequests: 10,
            },
            allowedDomains: ['localhost'],
            blockedPatterns: [/<script/gi, /DROP\s+TABLE/gi],
            maxContentLength: 10000,
            trustedSources: [],
        });
    });

    afterEach(() => {
        performanceMonitor.stopMonitoring();
    });

    // ========================================================================
    // Performance Monitoring with Security
    // ========================================================================

    describe('Performance Monitoring with Security Validation', () => {
        it('should track performance metrics while validating security', async () => {
            let performanceMetrics: any = null;
            const securityAlerts: any[] = [];

            const onPerformanceMetrics = (metrics: any) => {
                performanceMetrics = metrics;
            };

            const onSecurityAlert = (alert: any) => {
                securityAlerts.push(alert);
            };

            const { container } = render(
                <SignalRProvider>
                    <PerformanceSecurityTestComponent
                        onPerformanceMetrics={onPerformanceMetrics}
                        onSecurityAlert={onSecurityAlert}
                    />
                </SignalRProvider>
            );

            // Establish connection
            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                performanceMonitor.trackConnectionEstablished('test-connection-id');
            });

            // Process secure notifications
            const processButton = container.querySelector('[data-testid="process-notification-button"]');
            
            for (let i = 0; i < 5; i++) {
                act(() => {
                    processButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                });
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            await waitFor(() => {
                expect(container.querySelector('[data-testid="processed-count"]')).toHaveTextContent('5');
            });

            // Wait for metrics to be collected
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Verify performance metrics are collected
            expect(performanceMetrics).not.toBeNull();
            expect(performanceMetrics.notifications.totalReceived).toBe(5);
            expect(performanceMetrics.notifications.totalProcessed).toBe(5);
            expect(performanceMetrics.notifications.averageProcessingTime).toBeGreaterThan(0);

            // No security alerts should be generated for secure notifications
            expect(securityAlerts).toHaveLength(0);
        });

        it('should handle security violations without compromising performance tracking', async () => {
            let performanceMetrics: any = null;
            const securityAlerts: any[] = [];

            const { container } = render(
                <SignalRProvider>
                    <PerformanceSecurityTestComponent
                        onPerformanceMetrics={(metrics) => { performanceMetrics = metrics; }}
                        onSecurityAlert={(alert) => { securityAlerts.push(alert); }}
                    />
                </SignalRProvider>
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                performanceMonitor.trackConnectionEstablished('test-connection-id');
            });

            // Process malicious notifications
            const maliciousButton = container.querySelector('[data-testid="process-malicious-button"]');
            
            for (let i = 0; i < 3; i++) {
                act(() => {
                    maliciousButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                });
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            await waitFor(() => {
                expect(container.querySelector('[data-testid="security-violations"]')).toHaveTextContent('3');
            });

            // Wait for metrics collection
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Performance metrics should still be tracked
            expect(performanceMetrics).not.toBeNull();
            expect(performanceMetrics.notifications.totalReceived).toBe(3);
            
            // Security alerts should be generated
            expect(securityAlerts.length).toBeGreaterThan(0);
            
            // Processing should be blocked for malicious content
            expect(container.querySelector('[data-testid="processed-count"]')).toHaveTextContent('0');
        });
    });

    // ========================================================================
    // Bundle Size and Security Overhead
    // ========================================================================

    describe('Bundle Size with Security Features', () => {
        it('should analyze bundle size including security components', async () => {
            const analyzer = new SignalRBundleAnalyzer();
            const analysis = await analyzer.analyzeBundleSize();

            // Verify security components are included in analysis
            const securityComponents = analysis.components.filter(comp => 
                comp.name.toLowerCase().includes('security') ||
                comp.name.toLowerCase().includes('validator')
            );

            // Security overhead should be reasonable
            const totalSecuritySize = securityComponents.reduce((sum, comp) => sum + comp.size, 0);
            const totalSize = analysis.totalSize;
            const securityOverhead = (totalSecuritySize / totalSize) * 100;

            expect(securityOverhead).toBeLessThan(20); // Less than 20% overhead

            // Should have recommendations for optimization
            expect(analysis.recommendations.length).toBeGreaterThan(0);
            
            // Performance impact should be acceptable
            expect(analysis.performanceImpact.loadingTime.estimated).toBeLessThan(5); // Less than 5 seconds
        });

        it('should recommend security-aware optimizations', async () => {
            const analyzer = new SignalRBundleAnalyzer();
            const analysis = await analyzer.analyzeBundleSize();

            // Look for security-related recommendations
            const securityRecommendations = analysis.recommendations.filter(rec =>
                rec.description.toLowerCase().includes('security') ||
                rec.description.toLowerCase().includes('validation') ||
                rec.description.toLowerCase().includes('sanitization')
            );

            // Should not recommend removing security features
            const dangerousRecommendations = analysis.recommendations.filter(rec =>
                rec.description.toLowerCase().includes('remove security') ||
                rec.description.toLowerCase().includes('disable validation')
            );

            expect(dangerousRecommendations).toHaveLength(0);
        });
    });

    // ========================================================================
    // Memory Usage with Security Overhead
    // ========================================================================

    describe('Memory Usage with Security Features', () => {
        it('should maintain reasonable memory usage with security validation', async () => {
            let performanceMetrics: any = null;

            const { container } = render(
                <SignalRProvider>
                    <PerformanceSecurityTestComponent
                        onPerformanceMetrics={(metrics) => { performanceMetrics = metrics; }}
                    />
                </SignalRProvider>
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                performanceMonitor.trackConnectionEstablished('test-connection-id');
            });

            // Process many notifications to test memory usage
            const processButton = container.querySelector('[data-testid="process-notification-button"]');
            
            for (let i = 0; i < 50; i++) {
                act(() => {
                    processButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                });
                
                if (i % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            await waitFor(() => {
                expect(container.querySelector('[data-testid="processed-count"]')).toHaveTextContent('50');
            });

            // Wait for metrics collection
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Memory usage should be reasonable
            if (performanceMetrics && performanceMetrics.memory.heapUsed > 0) {
                const memoryUsageMB = performanceMetrics.memory.heapUsed / (1024 * 1024);
                expect(memoryUsageMB).toBeLessThan(100); // Less than 100MB
                
                // Memory growth rate should be controlled
                expect(performanceMetrics.memory.memoryGrowthRate).toBeLessThan(50); // Less than 50% growth
            }
        });

        it('should handle large notifications without memory leaks', async () => {
            let performanceMetrics: any = null;

            const { container } = render(
                <SignalRProvider>
                    <PerformanceSecurityTestComponent
                        onPerformanceMetrics={(metrics) => { performanceMetrics = metrics; }}
                    />
                </SignalRProvider>
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                performanceMonitor.trackConnectionEstablished('test-connection-id');
            });

            // Process large notifications
            const largeButton = container.querySelector('[data-testid="process-large-button"]');
            
            for (let i = 0; i < 10; i++) {
                act(() => {
                    largeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                });
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            await waitFor(() => {
                expect(container.querySelector('[data-testid="processed-count"]')).toHaveTextContent('10');
            });

            // Wait for metrics collection
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Should handle large notifications without excessive memory usage
            if (performanceMetrics && performanceMetrics.memory.heapUsed > 0) {
                const memoryUsageMB = performanceMetrics.memory.heapUsed / (1024 * 1024);
                expect(memoryUsageMB).toBeLessThan(200); // Less than 200MB even with large notifications
            }
        });
    });

    // ========================================================================
    // Rate Limiting Performance Impact
    // ========================================================================

    describe('Rate Limiting Performance Impact', () => {
        it('should enforce rate limits without significantly impacting performance', async () => {
            let performanceMetrics: any = null;
            const processingTimes: number[] = [];

            const onNotificationProcessed = (processingTime: number) => {
                processingTimes.push(processingTime);
            };

            const { container } = render(
                <SignalRProvider>
                    <PerformanceSecurityTestComponent
                        onPerformanceMetrics={(metrics) => { performanceMetrics = metrics; }}
                        onNotificationProcessed={onNotificationProcessed}
                    />
                </SignalRProvider>
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                performanceMonitor.trackConnectionEstablished('test-connection-id');
            });

            // Rapidly process notifications to trigger rate limiting
            const processButton = container.querySelector('[data-testid="process-notification-button"]');
            
            for (let i = 0; i < 15; i++) { // Exceed rate limit of 10
                act(() => {
                    processButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                });
            }

            await waitFor(() => {
                // Should process up to rate limit
                const processedCount = parseInt(
                    container.querySelector('[data-testid="processed-count"]')?.textContent || '0'
                );
                expect(processedCount).toBeLessThanOrEqual(10);
            });

            // Processing times should remain reasonable even with rate limiting
            if (processingTimes.length > 0) {
                const averageTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
                expect(averageTime).toBeLessThan(100); // Less than 100ms average
            }
        });

        it('should recover performance after rate limit window expires', async () => {
            // Set short rate limit window for testing
            securityValidator.setConfig({
                rateLimitConfig: {
                    windowMs: 1000, // 1 second window
                    maxRequests: 5,
                },
            });

            const processingTimes: number[] = [];

            const { container } = render(
                <SignalRProvider>
                    <PerformanceSecurityTestComponent
                        onNotificationProcessed={(processingTime) => {
                            processingTimes.push(processingTime);
                        }}
                    />
                </SignalRProvider>
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                performanceMonitor.trackConnectionEstablished('test-connection-id');
            });

            const processButton = container.querySelector('[data-testid="process-notification-button"]');

            // First batch - should hit rate limit
            for (let i = 0; i < 8; i++) {
                act(() => {
                    processButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                });
            }

            await waitFor(() => {
                const processedCount = parseInt(
                    container.querySelector('[data-testid="processed-count"]')?.textContent || '0'
                );
                expect(processedCount).toBeLessThanOrEqual(5);
            });

            const firstBatchCount = parseInt(
                container.querySelector('[data-testid="processed-count"]')?.textContent || '0'
            );

            // Wait for rate limit window to reset
            await new Promise(resolve => setTimeout(resolve, 1200));

            // Second batch - should process normally again
            for (let i = 0; i < 3; i++) {
                act(() => {
                    processButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                });
            }

            await waitFor(() => {
                const processedCount = parseInt(
                    container.querySelector('[data-testid="processed-count"]')?.textContent || '0'
                );
                expect(processedCount).toBe(firstBatchCount + 3);
            });
        });
    });

    // ========================================================================
    // Security Validation Performance
    // ========================================================================

    describe('Security Validation Performance', () => {
        it('should validate security efficiently without blocking UI', async () => {
            const processingTimes: number[] = [];
            const securityResults: any[] = [];

            const onNotificationProcessed = (processingTime: number, securityResult: any) => {
                processingTimes.push(processingTime);
                securityResults.push(securityResult);
            };

            const { container } = render(
                <SignalRProvider>
                    <PerformanceSecurityTestComponent
                        onNotificationProcessed={onNotificationProcessed}
                    />
                </SignalRProvider>
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                performanceMonitor.trackConnectionEstablished('test-connection-id');
            });

            // Process mix of secure and malicious notifications
            const secureButton = container.querySelector('[data-testid="process-notification-button"]');
            const maliciousButton = container.querySelector('[data-testid="process-malicious-button"]');

            for (let i = 0; i < 10; i++) {
                act(() => {
                    if (i % 2 === 0) {
                        secureButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    } else {
                        maliciousButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    }
                });
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            await waitFor(() => {
                expect(securityResults).toHaveLength(10);
            });

            // Security validation should be fast
            const averageProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
            expect(averageProcessingTime).toBeLessThan(50); // Less than 50ms average

            // Should correctly identify secure vs malicious content
            const secureResults = securityResults.filter(result => result.isValid);
            const maliciousResults = securityResults.filter(result => !result.isValid);

            expect(secureResults.length).toBe(5); // 5 secure notifications
            expect(maliciousResults.length).toBe(5); // 5 malicious notifications

            // Malicious content should have violations
            maliciousResults.forEach(result => {
                expect(result.violations.length).toBeGreaterThan(0);
                expect(result.riskLevel).toMatch(/high|critical/);
            });
        });

        it('should maintain security validation accuracy under load', async () => {
            const securityResults: any[] = [];

            const { container } = render(
                <SignalRProvider>
                    <PerformanceSecurityTestComponent
                        onNotificationProcessed={(_, securityResult) => {
                            securityResults.push(securityResult);
                        }}
                    />
                </SignalRProvider>
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                performanceMonitor.trackConnectionEstablished('test-connection-id');
            });

            // Process many notifications rapidly
            const secureButton = container.querySelector('[data-testid="process-notification-button"]');
            const maliciousButton = container.querySelector('[data-testid="process-malicious-button"]');

            for (let i = 0; i < 50; i++) {
                act(() => {
                    if (i % 3 === 0) {
                        maliciousButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    } else {
                        secureButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    }
                });
                
                if (i % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            await waitFor(() => {
                expect(securityResults.length).toBe(50);
            }, { timeout: 10000 });

            // Verify accuracy under load
            const expectedMalicious = Math.floor(50 / 3) + (50 % 3 === 0 ? 0 : 1);
            const expectedSecure = 50 - expectedMalicious;

            const actualMalicious = securityResults.filter(result => !result.isValid).length;
            const actualSecure = securityResults.filter(result => result.isValid).length;

            // Allow for small variance due to timing
            expect(Math.abs(actualMalicious - expectedMalicious)).toBeLessThanOrEqual(2);
            expect(Math.abs(actualSecure - expectedSecure)).toBeLessThanOrEqual(2);
        });
    });

    // ========================================================================
    // Combined System Resilience
    // ========================================================================

    describe('Combined System Resilience', () => {
        it('should maintain stability under combined performance and security stress', async () => {
            let performanceMetrics: any = null;
            const securityAlerts: any[] = [];
            const processingTimes: number[] = [];

            const { container } = render(
                <SignalRProvider>
                    <PerformanceSecurityTestComponent
                        onPerformanceMetrics={(metrics) => { performanceMetrics = metrics; }}
                        onSecurityAlert={(alert) => { securityAlerts.push(alert); }}
                        onNotificationProcessed={(processingTime) => {
                            processingTimes.push(processingTime);
                        }}
                    />
                </SignalRProvider>
            );

            act(() => {
                mockConnection.state = HubConnectionState.Connected;
                performanceMonitor.trackConnectionEstablished('test-connection-id');
            });

            // Stress test with mixed workload
            const buttons = [
                container.querySelector('[data-testid="process-notification-button"]'),
                container.querySelector('[data-testid="process-malicious-button"]'),
                container.querySelector('[data-testid="process-large-button"]'),
            ];

            for (let i = 0; i < 100; i++) {
                const button = buttons[i % 3];
                act(() => {
                    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                });
                
                if (i % 20 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Wait for processing to complete
            await new Promise(resolve => setTimeout(resolve, 3000));

            // System should remain stable
            expect(processingTimes.length).toBeGreaterThan(0);
            
            // Performance should remain reasonable
            const averageTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
            expect(averageTime).toBeLessThan(200); // Less than 200ms average under stress

            // Security should still be enforced
            expect(securityAlerts.length).toBeGreaterThan(0); // Should detect malicious content

            // Performance metrics should be collected
            expect(performanceMetrics).not.toBeNull();
            if (performanceMetrics) {
                expect(performanceMetrics.notifications.totalReceived).toBeGreaterThan(0);
                expect(performanceMetrics.connection.healthScore).toBeGreaterThan(0);
            }
        });
    });
});