/**
 * Unit tests for SignalR security middleware
 * Tests security protections, rate limiting, and data sanitization
 */

import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import {
    SignalRSecurityMiddleware,
    createSecurityMiddleware,
    createDevelopmentSecurityMiddleware,
    createProductionSecurityMiddleware,
    type SecurityMiddlewareConfig,
} from '../signalr-security-middleware';

// Mock SignalR connection
const createMockConnection = (): jest.Mocked<HubConnection> =>
    ({
        invoke: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        state: HubConnectionState.Connected,
        connectionId: 'test-connection-id',
        baseUrl: 'http://localhost',
        send: jest.fn(),
        stream: jest.fn(),
        onclose: jest.fn(),
        onreconnected: jest.fn(),
        onreconnecting: jest.fn(),
    }) as jest.Mocked<HubConnection>;

// Mock token for testing
const createMockToken = (userId: string = 'user123'): string => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
    };

    return `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.mock-signature`;
};

describe('SignalRSecurityMiddleware', () => {
    let middleware: SignalRSecurityMiddleware;
    let mockConnection: jest.Mocked<HubConnection>;
    let mockToken: string;

    beforeEach(() => {
        middleware = new SignalRSecurityMiddleware();
        mockConnection = createMockConnection();
        mockToken = createMockToken();
        jest.clearAllMocks();
    });

    describe('wrapConnection', () => {
        it('should wrap connection with security methods', () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );

            expect(secureConnection.secureInvoke).toBeDefined();
            expect(secureConnection.secureOn).toBeDefined();
            expect(secureConnection.secureOff).toBeDefined();
        });

        it('should work without token', () => {
            const secureConnection = middleware.wrapConnection(mockConnection);

            expect(secureConnection.secureInvoke).toBeDefined();
            expect(secureConnection.secureOn).toBeDefined();
            expect(secureConnection.secureOff).toBeDefined();
        });
    });

    describe('secureInvoke', () => {
        it('should allow whitelisted methods', async () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );
            mockConnection.invoke.mockResolvedValue('success');

            const result = await secureConnection.secureInvoke(
                'JoinGroup',
                'group1'
            );

            expect(result).toBe('success');
            expect(mockConnection.invoke).toHaveBeenCalledWith(
                'JoinGroup',
                'group1'
            );
        });

        it('should block non-whitelisted methods', async () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );

            await expect(
                secureConnection.secureInvoke('EvilMethod', 'data')
            ).rejects.toThrow('Method EvilMethod is not allowed');

            expect(mockConnection.invoke).not.toHaveBeenCalled();
        });

        it('should sanitize string arguments', async () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );
            mockConnection.invoke.mockResolvedValue('success');

            await secureConnection.secureInvoke(
                'JoinGroup',
                '<script>alert("xss")</script>group1'
            );

            expect(mockConnection.invoke).toHaveBeenCalledWith(
                'JoinGroup',
                'group1'
            );
        });

        it('should sanitize object arguments', async () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );
            mockConnection.invoke.mockResolvedValue('success');

            const maliciousData = {
                name: '<script>alert("xss")</script>John',
                description: 'Safe content',
            };

            await secureConnection.secureInvoke(
                'SendNotification',
                maliciousData
            );

            expect(mockConnection.invoke).toHaveBeenCalledWith(
                'SendNotification',
                {
                    name: 'John',
                    description: 'Safe content',
                }
            );
        });

        it('should handle nested object sanitization', async () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );
            mockConnection.invoke.mockResolvedValue('success');

            const nestedData = {
                user: {
                    name: '<script>alert("xss")</script>John',
                    profile: {
                        bio: '<script>evil()</script>Bio',
                    },
                },
                tags: ['<script>xss</script>tag1', 'safe-tag'],
            };

            await secureConnection.secureInvoke('SendNotification', nestedData);

            expect(mockConnection.invoke).toHaveBeenCalledWith(
                'SendNotification',
                {
                    user: {
                        name: 'John',
                        profile: {
                            bio: 'Bio',
                        },
                    },
                    tags: ['tag1', 'safe-tag'],
                }
            );
        });

        it('should handle invoke errors gracefully', async () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );
            mockConnection.invoke.mockRejectedValue(new Error('Network error'));

            await expect(
                secureConnection.secureInvoke('JoinGroup', 'group1')
            ).rejects.toThrow('Network error');
        });
    });

    describe('secureOn', () => {
        it('should wrap incoming message handlers', () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );
            const mockHandler = jest.fn();

            secureConnection.secureOn('ReceiveNotification', mockHandler);

            expect(mockConnection.on).toHaveBeenCalledWith(
                'ReceiveNotification',
                expect.any(Function)
            );
        });

        it('should sanitize notification messages', () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );
            const mockHandler = jest.fn();

            secureConnection.secureOn('ReceiveNotification', mockHandler);

            // Get the wrapped handler
            const wrappedHandler = mockConnection.on.mock.calls[0][1];

            const maliciousNotification = {
                id: 'notif-123',
                type: 'Event',
                title: '<script>alert("xss")</script>Title',
                message: 'Safe message',
                timestamp: '2024-01-01T00:00:00Z',
                priority: 'Medium',
            };

            wrappedHandler(maliciousNotification);

            expect(mockHandler).toHaveBeenCalledWith({
                id: 'notif-123',
                type: 'Event',
                title: 'Title',
                message: 'Safe message',
                timestamp: '2024-01-01T00:00:00Z',
                priority: 'Medium',
            });
        });

        it('should filter out invalid notifications', () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );
            const mockHandler = jest.fn();

            secureConnection.secureOn('ReceiveNotification', mockHandler);

            const wrappedHandler = mockConnection.on.mock.calls[0][1];

            const invalidNotification = {
                id: 'notif-123',
                // Missing required fields
                title: 'Title',
            };

            wrappedHandler(invalidNotification);

            expect(mockHandler).toHaveBeenCalledWith(); // Called with no arguments (filtered out)
        });

        it('should handle non-notification messages normally', () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );
            const mockHandler = jest.fn();

            secureConnection.secureOn('ConnectionStatus', mockHandler);

            const wrappedHandler = mockConnection.on.mock.calls[0][1];
            const statusData = { connected: true, latency: 50 };

            wrappedHandler(statusData);

            expect(mockHandler).toHaveBeenCalledWith(statusData);
        });
    });

    describe('secureOff', () => {
        it('should remove event handlers', () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );
            const mockHandler = jest.fn();

            secureConnection.secureOff('ReceiveNotification', mockHandler);

            expect(mockConnection.off).toHaveBeenCalledWith(
                'ReceiveNotification',
                mockHandler
            );
        });
    });

    describe('configuration options', () => {
        it('should respect disabled rate limiting', async () => {
            const config: Partial<SecurityMiddlewareConfig> = {
                enableRateLimiting: false,
            };

            const customMiddleware = new SignalRSecurityMiddleware(config);
            const secureConnection = customMiddleware.wrapConnection(
                mockConnection,
                mockToken
            );
            mockConnection.invoke.mockResolvedValue('success');

            // This should work even if rate limits would normally be exceeded
            for (let i = 0; i < 100; i++) {
                await secureConnection.secureInvoke('JoinGroup', 'group1');
            }

            expect(mockConnection.invoke).toHaveBeenCalledTimes(100);
        });

        it('should respect disabled method whitelist', async () => {
            const config: Partial<SecurityMiddlewareConfig> = {
                enableMethodWhitelist: false,
            };

            const customMiddleware = new SignalRSecurityMiddleware(config);
            const secureConnection = customMiddleware.wrapConnection(
                mockConnection,
                mockToken
            );
            mockConnection.invoke.mockResolvedValue('success');

            await secureConnection.secureInvoke('CustomMethod', 'data');

            expect(mockConnection.invoke).toHaveBeenCalledWith(
                'CustomMethod',
                'data'
            );
        });

        it('should respect custom allowed methods', async () => {
            const config: Partial<SecurityMiddlewareConfig> = {
                allowedMethods: ['CustomMethod', 'AnotherMethod'],
            };

            const customMiddleware = new SignalRSecurityMiddleware(config);
            const secureConnection = customMiddleware.wrapConnection(
                mockConnection,
                mockToken
            );
            mockConnection.invoke.mockResolvedValue('success');

            await secureConnection.secureInvoke('CustomMethod', 'data');

            expect(mockConnection.invoke).toHaveBeenCalledWith(
                'CustomMethod',
                'data'
            );

            await expect(
                secureConnection.secureInvoke('JoinGroup', 'group1')
            ).rejects.toThrow('Method JoinGroup is not allowed');
        });

        it('should call violation handler', async () => {
            const violationHandler = jest.fn();
            const config: Partial<SecurityMiddlewareConfig> = {
                onSecurityViolation: violationHandler,
            };

            const customMiddleware = new SignalRSecurityMiddleware(config);
            const secureConnection = customMiddleware.wrapConnection(
                mockConnection,
                mockToken
            );

            await expect(
                secureConnection.secureInvoke('EvilMethod', 'data')
            ).rejects.toThrow();

            expect(violationHandler).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'invalid_method',
                    method: 'EvilMethod',
                    message: expect.stringContaining(
                        'not in the allowed methods list'
                    ),
                })
            );
        });
    });

    describe('violation tracking', () => {
        it('should track security violations', async () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );

            await expect(
                secureConnection.secureInvoke('EvilMethod', 'data')
            ).rejects.toThrow();

            const violations = middleware.getViolations();
            expect(violations).toHaveLength(1);
            expect(violations[0].type).toBe('invalid_method');
            expect(violations[0].method).toBe('EvilMethod');
        });

        it('should limit violation history', async () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );

            // Generate more than 100 violations
            for (let i = 0; i < 150; i++) {
                try {
                    await secureConnection.secureInvoke(
                        `EvilMethod${i}`,
                        'data'
                    );
                } catch {
                    // Expected to fail
                }
            }

            const violations = middleware.getViolations();
            expect(violations.length).toBeLessThanOrEqual(100);
        });

        it('should provide violation statistics', async () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );

            // Generate different types of violations
            try {
                await secureConnection.secureInvoke('EvilMethod1', 'data');
            } catch {}

            try {
                await secureConnection.secureInvoke('EvilMethod2', 'data');
            } catch {}

            const stats = middleware.getViolationStats();
            expect(stats.invalid_method).toBe(2);
        });

        it('should clear violations', async () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );

            try {
                await secureConnection.secureInvoke('EvilMethod', 'data');
            } catch {}

            expect(middleware.getViolations()).toHaveLength(1);

            middleware.clearViolations();
            expect(middleware.getViolations()).toHaveLength(0);
        });
    });

    describe('factory functions', () => {
        it('should create default middleware', () => {
            const defaultMiddleware = createSecurityMiddleware();
            expect(defaultMiddleware).toBeInstanceOf(SignalRSecurityMiddleware);
        });

        it('should create development middleware with logging', () => {
            const devMiddleware = createDevelopmentSecurityMiddleware();
            expect(devMiddleware).toBeInstanceOf(SignalRSecurityMiddleware);
        });

        it('should create production middleware', () => {
            const prodMiddleware = createProductionSecurityMiddleware();
            expect(prodMiddleware).toBeInstanceOf(SignalRSecurityMiddleware);
        });

        it('should create production middleware with custom violation handler', () => {
            const violationHandler = jest.fn();
            const prodMiddleware =
                createProductionSecurityMiddleware(violationHandler);
            expect(prodMiddleware).toBeInstanceOf(SignalRSecurityMiddleware);
        });
    });

    describe('edge cases', () => {
        it('should handle null/undefined arguments', async () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );
            mockConnection.invoke.mockResolvedValue('success');

            await secureConnection.secureInvoke(
                'JoinGroup',
                null,
                undefined,
                ''
            );

            expect(mockConnection.invoke).toHaveBeenCalledWith(
                'JoinGroup',
                null,
                undefined,
                ''
            );
        });

        it('should handle circular references in objects', async () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );
            mockConnection.invoke.mockResolvedValue('success');

            const circularObj: Record<string, unknown> = { name: 'test' };
            circularObj.self = circularObj;

            // Should not throw due to circular reference
            await expect(
                secureConnection.secureInvoke('SendNotification', circularObj)
            ).resolves.toBe('success');
        });

        it('should handle very large objects', async () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );
            mockConnection.invoke.mockResolvedValue('success');

            const largeObj = {
                data: 'x'.repeat(10000),
                nested: {
                    moreData: 'y'.repeat(5000),
                },
            };

            await expect(
                secureConnection.secureInvoke('SendNotification', largeObj)
            ).resolves.toBe('success');
        });

        it('should handle method handler errors gracefully', () => {
            const secureConnection = middleware.wrapConnection(
                mockConnection,
                mockToken
            );
            const faultyHandler = jest.fn(() => {
                throw new Error('Handler error');
            });

            secureConnection.secureOn('ReceiveNotification', faultyHandler);

            const wrappedHandler = mockConnection.on.mock.calls[0][1];
            const notification = {
                id: 'notif-123',
                type: 'Event',
                title: 'Title',
                message: 'Message',
                timestamp: '2024-01-01T00:00:00Z',
                priority: 'Medium',
            };

            // Should not throw even if handler throws
            expect(() => wrappedHandler(notification)).not.toThrow();
        });
    });
});
