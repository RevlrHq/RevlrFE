/**
 * React hook for SignalR security management
 * Integrates rate limiting, token validation, and data sanitization
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
    sanitizeNotificationMessage,
    validateNotificationMessage,
    validateUserAction,
} from '@/lib/security/sanitization';
import {
    checkSignalRMethodLimit,
    recordSignalRMethod,
    checkNotificationActionLimit,
    recordNotificationAction,
    type RateLimitResult,
} from '@/lib/security/rate-limiting';
import {
    validateTokenFormat,
    shouldRefreshToken,
    extractUserIdFromToken,
    defaultTokenRefreshManager,
    type TokenValidationResult,
} from '@/lib/security/token-security';
import type { NotificationMessage } from '@/types/notifications';

// ============================================================================
// Security Hook Interface
// ============================================================================

export interface SignalRSecurityConfig {
    enableRateLimiting?: boolean;
    enableTokenValidation?: boolean;
    enableDataSanitization?: boolean;
    enableXSSPrevention?: boolean;
    logSecurityEvents?: boolean;
}

export interface SecurityCheckResult {
    allowed: boolean;
    reason?: string;
    sanitizedData?: NotificationMessage;
    warnings?: string[];
}

export interface SignalRSecurityHook {
    // Token management
    validateCurrentToken: () => Promise<TokenValidationResult>;
    refreshTokenIfNeeded: () => Promise<string>;

    // Rate limiting
    checkMethodLimit: (method: string) => RateLimitResult;
    recordMethodCall: (method: string, success?: boolean) => RateLimitResult;
    checkNotificationLimit: (
        action: string,
        notificationId?: string
    ) => RateLimitResult;
    recordNotificationAction: (
        action: string,
        notificationId?: string,
        success?: boolean
    ) => RateLimitResult;

    // Data validation and sanitization
    validateAndSanitizeNotification: (message: unknown) => SecurityCheckResult;
    validateUserAction: (action: string, data?: unknown) => SecurityCheckResult;

    // Security status
    getSecurityStatus: () => {
        tokenValid: boolean;
        rateLimitStatus: 'ok' | 'warning' | 'blocked';
        lastSecurityCheck: Date | null;
    };
}

// ============================================================================
// Security Hook Implementation
// ============================================================================

export function useSignalRSecurity(
    config: SignalRSecurityConfig = {}
): SignalRSecurityHook {
    const {
        enableRateLimiting = true,
        enableTokenValidation = true,
        enableDataSanitization = true,
        enableXSSPrevention = true,
        logSecurityEvents = process.env.NODE_ENV === 'development',
    } = config;

    const { user, token, refreshToken } = useAuthStore();
    const lastSecurityCheck = useRef<Date | null>(null);
    const securityWarnings = useRef<string[]>([]);

    const userId = user?.id || extractUserIdFromToken(token || '') || undefined;

    // ============================================================================
    // Token Management
    // ============================================================================

    const validateCurrentToken =
        useCallback(async (): Promise<TokenValidationResult> => {
            if (!enableTokenValidation || !token) {
                return {
                    isValid: false,
                    isExpired: false,
                    errors: ['No token available'],
                    warnings: [],
                };
            }

            try {
                const validation = validateTokenFormat(token);
                lastSecurityCheck.current = new Date();

                if (logSecurityEvents) {
                    console.log('Token validation result:', validation);
                }

                return validation;
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error';

                if (logSecurityEvents) {
                    console.debug('Token validation error:', error);
                }

                return {
                    isValid: false,
                    isExpired: false,
                    errors: [`Token validation failed: ${errorMessage}`],
                    warnings: [],
                };
            }
        }, [token, enableTokenValidation, logSecurityEvents]);

    const refreshTokenIfNeeded = useCallback(async (): Promise<string> => {
        if (!enableTokenValidation || !token) {
            throw new Error('Token validation disabled or no token available');
        }

        try {
            const currentToken =
                await defaultTokenRefreshManager.ensureValidToken(
                    token,
                    async () => {
                        if (!refreshToken) {
                            throw new Error('No refresh token available');
                        }

                        // This would typically call your auth service
                        // For now, we'll throw an error to indicate the refresh function needs to be implemented
                        throw new Error(
                            'Token refresh function not implemented'
                        );
                    }
                );

            if (logSecurityEvents) {
                console.log('Token refresh completed successfully');
            }

            return currentToken;
        } catch (error) {
            if (logSecurityEvents) {
                console.debug('Token refresh failed:', error);
            }
            throw error;
        }
    }, [token, refreshToken, enableTokenValidation, logSecurityEvents]);

    // ============================================================================
    // Rate Limiting
    // ============================================================================

    const checkMethodLimit = useCallback(
        (method: string): RateLimitResult => {
            if (!enableRateLimiting) {
                return {
                    allowed: true,
                    remaining: Infinity,
                    resetTime: Date.now() + 60000,
                };
            }

            try {
                const result = checkSignalRMethodLimit(userId, method);

                if (logSecurityEvents && !result.allowed) {
                    console.warn(
                        `Rate limit exceeded for method ${method}:`,
                        result
                    );
                }

                return result;
            } catch (error) {
                if (logSecurityEvents) {
                    console.debug('Rate limit check error:', error);
                }

                // Fail safe: allow the request but log the error
                return {
                    allowed: true,
                    remaining: 0,
                    resetTime: Date.now() + 60000,
                };
            }
        },
        [userId, enableRateLimiting, logSecurityEvents]
    );

    const recordMethodCall = useCallback(
        (method: string, success?: boolean): RateLimitResult => {
            if (!enableRateLimiting) {
                return {
                    allowed: true,
                    remaining: Infinity,
                    resetTime: Date.now() + 60000,
                };
            }

            try {
                const result = recordSignalRMethod(userId, method, success);

                if (logSecurityEvents) {
                    console.log(`Recorded method call ${method}:`, {
                        success,
                        result,
                    });
                }

                return result;
            } catch (error) {
                if (logSecurityEvents) {
                    console.debug('Method call recording error:', error);
                }

                return {
                    allowed: true,
                    remaining: 0,
                    resetTime: Date.now() + 60000,
                };
            }
        },
        [userId, enableRateLimiting, logSecurityEvents]
    );

    const checkNotificationLimit = useCallback(
        (action: string, notificationId?: string): RateLimitResult => {
            if (!enableRateLimiting) {
                return {
                    allowed: true,
                    remaining: Infinity,
                    resetTime: Date.now() + 60000,
                };
            }

            try {
                const result = checkNotificationActionLimit(
                    userId,
                    action,
                    notificationId
                );

                if (logSecurityEvents && !result.allowed) {
                    console.warn(
                        `Rate limit exceeded for notification action ${action}:`,
                        result
                    );
                }

                return result;
            } catch (error) {
                if (logSecurityEvents) {
                    console.debug(
                        'Notification rate limit check error:',
                        error
                    );
                }

                return {
                    allowed: true,
                    remaining: 0,
                    resetTime: Date.now() + 60000,
                };
            }
        },
        [userId, enableRateLimiting, logSecurityEvents]
    );

    const recordNotificationActionCall = useCallback(
        (
            action: string,
            notificationId?: string,
            success?: boolean
        ): RateLimitResult => {
            if (!enableRateLimiting) {
                return {
                    allowed: true,
                    remaining: Infinity,
                    resetTime: Date.now() + 60000,
                };
            }

            try {
                const result = recordNotificationAction(
                    userId,
                    action,
                    notificationId,
                    success
                );

                if (logSecurityEvents) {
                    console.log(`Recorded notification action ${action}:`, {
                        success,
                        result,
                    });
                }

                return result;
            } catch (error) {
                if (logSecurityEvents) {
                    console.debug(
                        'Notification action recording error:',
                        error
                    );
                }

                return {
                    allowed: true,
                    remaining: 0,
                    resetTime: Date.now() + 60000,
                };
            }
        },
        [userId, enableRateLimiting, logSecurityEvents]
    );

    // ============================================================================
    // Data Validation and Sanitization
    // ============================================================================

    const validateAndSanitizeNotification = useCallback(
        (message: unknown): SecurityCheckResult => {
            const warnings: string[] = [];

            try {
                // Validate message structure
                const validation = validateNotificationMessage(message);

                if (!validation.isValid) {
                    if (logSecurityEvents) {
                        console.debug(
                            'Notification validation failed:',
                            validation.errors
                        );
                    }

                    return {
                        allowed: false,
                        reason: `Invalid notification: ${validation.errors.join(', ')}`,
                        warnings: validation.warnings,
                    };
                }

                warnings.push(...validation.warnings);

                // Sanitize if enabled
                let sanitizedMessage = message;
                if (enableDataSanitization || enableXSSPrevention) {
                    sanitizedMessage = sanitizeNotificationMessage(
                        message as NotificationMessage
                    );

                    if (
                        logSecurityEvents &&
                        JSON.stringify(sanitizedMessage) !==
                            JSON.stringify(message)
                    ) {
                        console.log('Notification content was sanitized');
                    }
                }

                return {
                    allowed: true,
                    sanitizedData: sanitizedMessage as NotificationMessage,
                    warnings,
                };
            } catch (error) {
                if (logSecurityEvents) {
                    console.debug('Notification security check error:', error);
                }

                return {
                    allowed: false,
                    reason: `Security check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    warnings,
                };
            }
        },
        [enableDataSanitization, enableXSSPrevention, logSecurityEvents]
    );

    const validateUserActionCall = useCallback(
        (action: string, data?: unknown): SecurityCheckResult => {
            try {
                const validation = validateUserAction(action, data);

                if (!validation.isValid) {
                    if (logSecurityEvents) {
                        console.debug(
                            'User action validation failed:',
                            validation.errors
                        );
                    }

                    return {
                        allowed: false,
                        reason: `Invalid action: ${validation.errors.join(', ')}`,
                        warnings: validation.warnings,
                    };
                }

                return {
                    allowed: true,
                    warnings: validation.warnings,
                };
            } catch (error) {
                if (logSecurityEvents) {
                    console.debug('User action validation error:', error);
                }

                return {
                    allowed: false,
                    reason: `Action validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    warnings: [],
                };
            }
        },
        [logSecurityEvents]
    );

    // ============================================================================
    // Security Status
    // ============================================================================

    const getSecurityStatus = useCallback(() => {
        const tokenValidation = token ? validateTokenFormat(token) : null;
        const tokenValid = tokenValidation?.isValid ?? false;

        // Determine rate limit status based on recent warnings
        let rateLimitStatus: 'ok' | 'warning' | 'blocked' = 'ok';

        // This is a simplified check - in a real implementation, you might want to
        // check recent rate limit results or maintain a status cache
        if (securityWarnings.current.some((w) => w.includes('rate limit'))) {
            rateLimitStatus = 'warning';
        }

        return {
            tokenValid,
            rateLimitStatus,
            lastSecurityCheck: lastSecurityCheck.current,
        };
    }, [token]);

    // ============================================================================
    // Effect for Token Monitoring
    // ============================================================================

    useEffect(() => {
        if (!enableTokenValidation || !token) return;

        // Check if token needs refresh
        if (shouldRefreshToken(token, 10)) {
            if (logSecurityEvents) {
                console.log(
                    'Token needs refresh - scheduling background refresh'
                );
            }

            // Schedule background refresh
            refreshTokenIfNeeded().catch((error) => {
                if (logSecurityEvents) {
                    console.warn('Background token refresh failed:', error);
                }
            });
        }
    }, [token, enableTokenValidation, refreshTokenIfNeeded, logSecurityEvents]);

    // ============================================================================
    // Return Hook Interface
    // ============================================================================

    return {
        validateCurrentToken,
        refreshTokenIfNeeded,
        checkMethodLimit,
        recordMethodCall,
        checkNotificationLimit,
        recordNotificationAction: recordNotificationActionCall,
        validateAndSanitizeNotification,
        validateUserAction: validateUserActionCall,
        getSecurityStatus,
    };
}
