/**
 * SignalR Security Middleware
 * Provides security checks and protections for SignalR operations
 */

import type { HubConnection } from '@microsoft/signalr';
import {
    sanitizeNotificationMessage,
    validateNotificationMessage,
} from './sanitization';
import { extractUserIdFromToken } from './token-security';
import type { NotificationMessage } from '@/types/notifications';

// ============================================================================
// Middleware Configuration
// ============================================================================

export interface SecurityMiddlewareConfig {
    enableRateLimiting: boolean;
    enableTokenValidation: boolean;
    enableDataSanitization: boolean;
    enableMethodWhitelist: boolean;
    allowedMethods: string[];
    onSecurityViolation?: (violation: SecurityViolation) => void;
    onRateLimitExceeded?: (method: string, userId?: string) => void;
}

export interface SecurityViolation {
    type:
        | 'rate_limit'
        | 'invalid_token'
        | 'invalid_method'
        | 'invalid_data'
        | 'xss_attempt';
    method?: string;
    userId?: string;
    message: string;
    timestamp: Date;
    data?: unknown;
}

export interface SecureHubConnection extends HubConnection {
    secureInvoke: <T = unknown>(
        methodName: string,
        ...args: unknown[]
    ) => Promise<T>;
    secureOn: (
        methodName: string,
        newMethod: (...args: unknown[]) => void
    ) => void;
    secureOff: (
        methodName: string,
        method?: (...args: unknown[]) => void
    ) => void;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: SecurityMiddlewareConfig = {
    enableRateLimiting: true,
    enableTokenValidation: true,
    enableDataSanitization: true,
    enableMethodWhitelist: true,
    allowedMethods: [
        'JoinGroup',
        'LeaveGroup',
        'SendNotification',
        'MarkNotificationAsRead',
        'DismissNotification',
        'GetConnectionStatus',
        'Ping',
    ],
};

// ============================================================================
// Security Middleware Class
// ============================================================================

export class SignalRSecurityMiddleware {
    private config: SecurityMiddlewareConfig;
    private violations: SecurityViolation[] = [];

    constructor(config: Partial<SecurityMiddlewareConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Wraps a HubConnection with security middleware
     */
    wrapConnection(
        connection: HubConnection,
        token?: string
    ): SecureHubConnection {
        const secureConnection = connection as SecureHubConnection;
        const userId = token ? extractUserIdFromToken(token) : undefined;

        // Wrap invoke method with security checks
        secureConnection.secureInvoke = async <T = unknown>(
            methodName: string,
            ...args: unknown[]
        ): Promise<T> => {
            const securityCheck = this.checkMethodSecurity(
                methodName,
                userId,
                args
            );

            if (!securityCheck.allowed) {
                throw new Error(
                    securityCheck.reason || 'Security check failed'
                );
            }

            try {
                // Call the original method with sanitized args
                const result = await connection.invoke<T>(
                    methodName,
                    ...(securityCheck.sanitizedArgs || args)
                );

                return result;
            } catch (error) {
                throw error;
            }
        };

        // Wrap on method with security checks for incoming messages
        secureConnection.secureOn = (
            methodName: string,
            newMethod: (...args: unknown[]) => void
        ) => {
            const secureMethod = (...args: unknown[]) => {
                try {
                    // Sanitize incoming data if it's a notification
                    if (
                        methodName.toLowerCase().includes('notification') &&
                        args.length > 0
                    ) {
                        const sanitizedArgs = args
                            .map((arg) => {
                                if (this.isNotificationMessage(arg)) {
                                    const validation =
                                        validateNotificationMessage(arg);
                                    if (!validation.isValid) {
                                        this.recordViolation({
                                            type: 'invalid_data',
                                            method: methodName,
                                            userId,
                                            message: `Invalid notification data: ${validation.errors.join(', ')}`,
                                            timestamp: new Date(),
                                            data: arg,
                                        });
                                        return null; // Skip invalid notifications
                                    }

                                    return this.config.enableDataSanitization
                                        ? sanitizeNotificationMessage(
                                              arg as NotificationMessage
                                          )
                                        : arg;
                                }
                                return arg;
                            })
                            .filter((arg) => arg !== null);

                        newMethod(...sanitizedArgs);
                    } else {
                        newMethod(...args);
                    }
                } catch (error) {
                    console.debug(
                        `Error in secure method handler for ${methodName}:`,
                        error
                    );
                }
            };

            connection.on(methodName, secureMethod);
        };

        // Wrap off method
        secureConnection.secureOff = (
            methodName: string,
            method?: (...args: unknown[]) => void
        ) => {
            connection.off(methodName, method);
        };

        return secureConnection;
    }

    /**
     * Checks security for a method call
     */
    private checkMethodSecurity(
        methodName: string,
        userId?: string,
        args: unknown[] = []
    ): { allowed: boolean; reason?: string; sanitizedArgs?: unknown[] } {
        // Check method whitelist
        if (
            this.config.enableMethodWhitelist &&
            !this.config.allowedMethods.includes(methodName)
        ) {
            this.recordViolation({
                type: 'invalid_method',
                method: methodName,
                userId,
                message: `Method ${methodName} is not in the allowed methods list`,
                timestamp: new Date(),
            });

            return {
                allowed: false,
                reason: `Method ${methodName} is not allowed`,
            };
        }

        // Rate limiting would be implemented here if needed
        // Currently disabled to avoid dependency on rate-limiting module

        // Sanitize arguments if needed
        let sanitizedArgs = args;
        if (this.config.enableDataSanitization && args.length > 0) {
            sanitizedArgs = args.map((arg) => {
                if (typeof arg === 'string') {
                    // Basic string sanitization
                    return arg.replace(
                        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                        ''
                    );
                }

                if (typeof arg === 'object' && arg !== null) {
                    // Sanitize object properties
                    return this.sanitizeObject(arg);
                }

                return arg;
            });
        }

        return {
            allowed: true,
            sanitizedArgs,
        };
    }

    /**
     * Sanitizes object properties recursively
     */
    private sanitizeObject(obj: unknown): unknown {
        if (Array.isArray(obj)) {
            return obj.map((item) => this.sanitizeObject(item));
        }

        if (typeof obj === 'object' && obj !== null) {
            const sanitized: Record<string, unknown> = {};

            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string') {
                    sanitized[key] = value.replace(
                        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                        ''
                    );
                } else if (typeof value === 'object') {
                    sanitized[key] = this.sanitizeObject(value);
                } else {
                    sanitized[key] = value;
                }
            }

            return sanitized;
        }

        return obj;
    }

    /**
     * Checks if an object is a notification message
     */
    private isNotificationMessage(obj: unknown): boolean {
        return (
            obj &&
            typeof obj === 'object' &&
            typeof obj.id === 'string' &&
            typeof obj.type === 'string' &&
            typeof obj.title === 'string' &&
            typeof obj.message === 'string'
        );
    }

    /**
     * Records a security violation
     */
    private recordViolation(violation: SecurityViolation): void {
        this.violations.push(violation);

        // Keep only last 100 violations to prevent memory issues
        if (this.violations.length > 100) {
            this.violations = this.violations.slice(-100);
        }

        // Call violation handler if provided
        this.config.onSecurityViolation?.(violation);

        // Log in development
        if (process.env.NODE_ENV === 'development') {
            console.warn('SignalR Security Violation:', violation);
        }
    }

    /**
     * Gets recent security violations
     */
    getViolations(limit: number = 50): SecurityViolation[] {
        return this.violations.slice(-limit);
    }

    /**
     * Clears violation history
     */
    clearViolations(): void {
        this.violations = [];
    }

    /**
     * Gets violation statistics
     */
    getViolationStats(): Record<string, number> {
        const stats: Record<string, number> = {};

        for (const violation of this.violations) {
            stats[violation.type] = (stats[violation.type] || 0) + 1;
        }

        return stats;
    }

    /**
     * Updates middleware configuration
     */
    updateConfig(newConfig: Partial<SecurityMiddlewareConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a default security middleware instance
 */
export function createSecurityMiddleware(
    config?: Partial<SecurityMiddlewareConfig>
): SignalRSecurityMiddleware {
    return new SignalRSecurityMiddleware(config);
}

/**
 * Creates a development-friendly security middleware with logging
 */
export function createDevelopmentSecurityMiddleware(): SignalRSecurityMiddleware {
    return new SignalRSecurityMiddleware({
        ...DEFAULT_CONFIG,
        onSecurityViolation: (violation) => {
            console.group('🔒 SignalR Security Violation');
            console.warn('Type:', violation.type);
            console.warn('Method:', violation.method);
            console.warn('User ID:', violation.userId);
            console.warn('Message:', violation.message);
            console.warn('Timestamp:', violation.timestamp);
            if (violation.data) {
                console.warn('Data:', violation.data);
            }
            console.groupEnd();
        },
        onRateLimitExceeded: (method, userId) => {
            console.warn(
                `🚫 Rate limit exceeded for method ${method} (User: ${userId})`
            );
        },
    });
}

/**
 * Creates a production security middleware with minimal logging
 */
export function createProductionSecurityMiddleware(
    onViolation?: (violation: SecurityViolation) => void
): SignalRSecurityMiddleware {
    return new SignalRSecurityMiddleware({
        ...DEFAULT_CONFIG,
        onSecurityViolation: onViolation,
    });
}
