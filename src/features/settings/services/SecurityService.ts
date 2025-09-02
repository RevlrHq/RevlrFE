/**
 * Security Service - Handles security-related operations
 * Manages email changes, session management, and security validation
 */

import type {
    UserSession,
    EmailChangeRequest,
    EmailChangeConfirmation,
    PasswordChangeRequest,
    SessionTerminationRequest,
} from '../types/security';
import {
    secureFetch,
    sanitizeInput,
    securityValidation,
    RateLimiter,
} from '../shared/utils/security';
import { auditService } from './AuditService';

export class SecurityService {
    private baseUrl = '/api/security';

    /**
     * Get all active sessions for the current user
     */
    async getActiveSessions(): Promise<UserSession[]> {
        try {
            // Log sensitive data access
            await auditService.logSensitiveAccess('security_sessions');

            const response = await secureFetch(`${this.baseUrl}/sessions`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                await auditService.logSensitiveAccess(
                    'security_sessions',
                    false,
                    response.statusText
                );
                throw new Error(
                    `Failed to fetch sessions: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching active sessions:', error);
            await auditService.logSensitiveAccess(
                'security_sessions',
                false,
                error instanceof Error ? error.message : 'Unknown error'
            );
            throw new Error('Failed to load active sessions');
        }
    }

    /**
     * Terminate a specific session
     */
    async terminateSession(sessionId: string): Promise<void> {
        // Validate and sanitize session ID
        const sanitizedSessionId = sanitizeInput.text(sessionId);
        if (!sanitizedSessionId) {
            throw new Error('Invalid session ID');
        }

        // Rate limiting for session termination
        const rateLimitKey = `session_terminate_${sanitizedSessionId}`;
        if (RateLimiter.isRateLimited(rateLimitKey, 10, 5 * 60 * 1000)) {
            // 10 attempts per 5 minutes
            const resetTime = RateLimiter.getResetTime(rateLimitKey);
            throw new Error(
                `Too many session termination attempts. Try again in ${Math.ceil(resetTime / 1000)} seconds.`
            );
        }

        try {
            const request: SessionTerminationRequest = {
                sessionId: sanitizedSessionId,
                terminateAll: false,
            };

            const response = await secureFetch(
                `${this.baseUrl}/sessions/terminate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(request),
                },
                rateLimitKey,
                10
            );

            if (!response.ok) {
                await auditService.logSessionTermination(
                    sanitizedSessionId,
                    false,
                    false,
                    response.statusText
                );
                throw new Error(
                    `Failed to terminate session: ${response.statusText}`
                );
            }

            await auditService.logSessionTermination(
                sanitizedSessionId,
                false,
                true
            );
        } catch (error) {
            console.error('Error terminating session:', error);
            await auditService.logSessionTermination(
                sanitizedSessionId,
                false,
                false,
                error instanceof Error ? error.message : 'Unknown error'
            );
            throw new Error('Failed to terminate session');
        }
    }

    /**
     * Terminate all sessions except the current one
     */
    async terminateAllSessions(): Promise<void> {
        // Rate limiting for terminate all sessions (more restrictive)
        const rateLimitKey = 'session_terminate_all';
        if (RateLimiter.isRateLimited(rateLimitKey, 3, 10 * 60 * 1000)) {
            // 3 attempts per 10 minutes
            const resetTime = RateLimiter.getResetTime(rateLimitKey);
            throw new Error(
                `Too many terminate all attempts. Try again in ${Math.ceil(resetTime / 1000)} seconds.`
            );
        }

        try {
            const request: SessionTerminationRequest = {
                sessionId: '',
                terminateAll: true,
            };

            const response = await secureFetch(
                `${this.baseUrl}/sessions/terminate-all`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(request),
                },
                rateLimitKey,
                3
            );

            if (!response.ok) {
                await auditService.logSessionTermination(
                    '',
                    true,
                    false,
                    response.statusText
                );
                throw new Error(
                    `Failed to terminate sessions: ${response.statusText}`
                );
            }

            await auditService.logSessionTermination('', true, true);
        } catch (error) {
            console.error('Error terminating all sessions:', error);
            await auditService.logSessionTermination(
                '',
                true,
                false,
                error instanceof Error ? error.message : 'Unknown error'
            );
            throw new Error('Failed to terminate all sessions');
        }
    }

    /**
     * Request email change - sends verification emails
     */
    async requestEmailChange(request: EmailChangeRequest): Promise<void> {
        // Validate and sanitize email inputs
        const sanitizedCurrentEmail = sanitizeInput.email(request.currentEmail);
        const sanitizedNewEmail = sanitizeInput.email(request.newEmail);

        if (!sanitizedCurrentEmail || !sanitizedNewEmail) {
            throw new Error('Invalid email addresses provided');
        }

        // Security validation
        if (!securityValidation.isSafeInput(sanitizedNewEmail)) {
            throw new Error('Email contains potentially malicious content');
        }

        if (securityValidation.isSuspiciousEmail(sanitizedNewEmail)) {
            throw new Error('Email from suspicious domain not allowed');
        }

        // Rate limiting for email change requests
        const rateLimitKey = `email_change_${sanitizedCurrentEmail}`;
        if (RateLimiter.isRateLimited(rateLimitKey, 3, 60 * 60 * 1000)) {
            // 3 attempts per hour
            const resetTime = RateLimiter.getResetTime(rateLimitKey);
            throw new Error(
                `Too many email change requests. Try again in ${Math.ceil(resetTime / 60000)} minutes.`
            );
        }

        try {
            const sanitizedRequest: EmailChangeRequest = {
                currentEmail: sanitizedCurrentEmail,
                newEmail: sanitizedNewEmail,
                password: request.password, // Don't sanitize password, just validate length
            };

            const response = await secureFetch(
                `${this.baseUrl}/email/change-request`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(sanitizedRequest),
                },
                rateLimitKey,
                3
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                await auditService.logEmailChangeRequest(
                    sanitizedCurrentEmail,
                    sanitizedNewEmail,
                    false,
                    errorData.message || response.statusText
                );
                throw new Error(
                    errorData.message ||
                        `Failed to request email change: ${response.statusText}`
                );
            }

            await auditService.logEmailChangeRequest(
                sanitizedCurrentEmail,
                sanitizedNewEmail,
                true
            );
        } catch (error) {
            console.error('Error requesting email change:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to request email change');
        }
    }

    /**
     * Confirm email change with verification token
     */
    async confirmEmailChange(
        confirmation: EmailChangeConfirmation
    ): Promise<void> {
        // Validate and sanitize token
        const sanitizedToken = sanitizeInput.text(confirmation.token);
        if (!sanitizedToken || sanitizedToken.length < 10) {
            throw new Error('Invalid verification token');
        }

        // Rate limiting for email confirmation attempts
        const rateLimitKey = `email_confirm_${sanitizedToken.substring(0, 8)}`;
        if (RateLimiter.isRateLimited(rateLimitKey, 5, 15 * 60 * 1000)) {
            // 5 attempts per 15 minutes
            const resetTime = RateLimiter.getResetTime(rateLimitKey);
            throw new Error(
                `Too many confirmation attempts. Try again in ${Math.ceil(resetTime / 60000)} minutes.`
            );
        }

        try {
            const sanitizedConfirmation: EmailChangeConfirmation = {
                token: sanitizedToken,
            };

            const response = await secureFetch(
                `${this.baseUrl}/email/change-confirm`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(sanitizedConfirmation),
                },
                rateLimitKey,
                5
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                await auditService.logEvent(
                    'EMAIL_CHANGE_CONFIRM',
                    'user_email',
                    { token: 'provided' },
                    false,
                    errorData.message || response.statusText
                );
                throw new Error(
                    errorData.message ||
                        `Failed to confirm email change: ${response.statusText}`
                );
            }

            await auditService.logEvent(
                'EMAIL_CHANGE_CONFIRM',
                'user_email',
                { token: 'provided' },
                true
            );
        } catch (error) {
            console.error('Error confirming email change:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to confirm email change');
        }
    }

    /**
     * Change user password
     */
    async changePassword(request: PasswordChangeRequest): Promise<void> {
        // Validate password strength
        if (!securityValidation.isStrongPassword(request.newPassword)) {
            throw new Error('Password does not meet security requirements');
        }

        // Rate limiting for password changes
        const rateLimitKey = 'password_change';
        if (RateLimiter.isRateLimited(rateLimitKey, 3, 60 * 60 * 1000)) {
            // 3 attempts per hour
            const resetTime = RateLimiter.getResetTime(rateLimitKey);
            throw new Error(
                `Too many password change attempts. Try again in ${Math.ceil(resetTime / 60000)} minutes.`
            );
        }

        try {
            const response = await secureFetch(
                `${this.baseUrl}/password/change`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(request),
                },
                rateLimitKey,
                3
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                await auditService.logEvent(
                    'PASSWORD_CHANGE',
                    'user_password',
                    {},
                    false,
                    errorData.message || response.statusText
                );
                throw new Error(
                    errorData.message ||
                        `Failed to change password: ${response.statusText}`
                );
            }

            await auditService.logEvent(
                'PASSWORD_CHANGE',
                'user_password',
                {},
                true
            );
        } catch (error) {
            console.error('Error changing password:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to change password');
        }
    }

    /**
     * Get security audit log for current user
     */
    async getSecurityAuditLog(
        limit: number = 50,
        offset: number = 0
    ): Promise<any[]> {
        try {
            await auditService.logSensitiveAccess('security_audit_log');
            return await auditService.getUserAuditLog(limit, offset);
        } catch (error) {
            console.error('Error fetching security audit log:', error);
            await auditService.logSensitiveAccess(
                'security_audit_log',
                false,
                error instanceof Error ? error.message : 'Unknown error'
            );
            throw new Error('Failed to load security audit log');
        }
    }

    /**
     * Clear rate limits for a user (admin function)
     */
    clearUserRateLimits(userId: string): void {
        // This would typically be an admin-only function
        RateLimiter.clearRateLimit(`email_change_${userId}`);
        RateLimiter.clearRateLimit(`password_change`);
        RateLimiter.clearRateLimit(`session_terminate_all`);
    }
}
