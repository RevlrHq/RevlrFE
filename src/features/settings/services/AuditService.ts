/**
 * Audit Service - Handles security-sensitive audit logging
 * Tracks user actions for security and compliance purposes
 */

export interface AuditEvent {
    id?: string;
    userId: string;
    action: AuditAction;
    resource: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
    success: boolean;
    errorMessage?: string;
}

export type AuditAction =
    | 'PROFILE_UPDATE'
    | 'EMAIL_CHANGE_REQUEST'
    | 'EMAIL_CHANGE_CONFIRM'
    | 'PASSWORD_CHANGE'
    | 'SESSION_TERMINATE'
    | 'SESSION_TERMINATE_ALL'
    | 'NOTIFICATION_PREFERENCES_UPDATE'
    | 'INTERFACE_PREFERENCES_UPDATE'
    | 'MEDIA_PROVIDER_CONNECT'
    | 'MEDIA_PROVIDER_DISCONNECT'
    | 'DATA_EXPORT_REQUEST'
    | 'DATA_EXPORT_DOWNLOAD'
    | 'PAYMENT_METHOD_ADD'
    | 'PAYMENT_METHOD_REMOVE'
    | 'ACCOUNT_DELETION_REQUEST'
    | 'ACCOUNT_DELETION_CONFIRM'
    | 'LOGIN_ATTEMPT'
    | 'LOGOUT'
    | 'SECURITY_SETTINGS_ACCESS'
    | 'BILLING_SETTINGS_ACCESS'
    | 'SENSITIVE_DATA_ACCESS';

export class AuditService {
    private baseUrl = '/api/audit';
    private pendingEvents: AuditEvent[] = [];
    private batchTimeout: NodeJS.Timeout | null = null;
    private readonly batchSize = 10;
    private readonly batchDelayMs = 5000; // 5 seconds

    /**
     * Log a security-sensitive event
     */
    async logEvent(
        action: AuditAction,
        resource: string,
        details?: Record<string, unknown>,
        success: boolean = true,
        errorMessage?: string
    ): Promise<void> {
        const event: AuditEvent = {
            userId: await this.getCurrentUserId(),
            action,
            resource,
            details: this.sanitizeDetails(details),
            ipAddress: await this.getClientIP(),
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            success,
            errorMessage,
        };

        // Add to batch queue
        this.pendingEvents.push(event);

        // Send immediately for critical events or when batch is full
        if (
            this.isCriticalEvent(action) ||
            this.pendingEvents.length >= this.batchSize
        ) {
            await this.flushEvents();
        } else {
            this.scheduleBatchSend();
        }
    }

    /**
     * Log profile update event
     */
    async logProfileUpdate(
        changes: Record<string, unknown>,
        success: boolean = true,
        errorMessage?: string
    ): Promise<void> {
        await this.logEvent(
            'PROFILE_UPDATE',
            'user_profile',
            { changedFields: Object.keys(changes) },
            success,
            errorMessage
        );
    }

    /**
     * Log email change request
     */
    async logEmailChangeRequest(
        oldEmail: string,
        newEmail: string,
        success: boolean = true,
        errorMessage?: string
    ): Promise<void> {
        await this.logEvent(
            'EMAIL_CHANGE_REQUEST',
            'user_email',
            {
                oldEmailDomain: this.extractDomain(oldEmail),
                newEmailDomain: this.extractDomain(newEmail),
            },
            success,
            errorMessage
        );
    }

    /**
     * Log session termination
     */
    async logSessionTermination(
        sessionId: string,
        terminateAll: boolean = false,
        success: boolean = true,
        errorMessage?: string
    ): Promise<void> {
        await this.logEvent(
            terminateAll ? 'SESSION_TERMINATE_ALL' : 'SESSION_TERMINATE',
            'user_session',
            { sessionId: terminateAll ? 'all' : sessionId },
            success,
            errorMessage
        );
    }

    /**
     * Log data export request
     */
    async logDataExportRequest(
        exportType: string,
        success: boolean = true,
        errorMessage?: string
    ): Promise<void> {
        await this.logEvent(
            'DATA_EXPORT_REQUEST',
            'user_data',
            { exportType },
            success,
            errorMessage
        );
    }

    /**
     * Log account deletion request
     */
    async logAccountDeletionRequest(
        reason?: string,
        success: boolean = true,
        errorMessage?: string
    ): Promise<void> {
        await this.logEvent(
            'ACCOUNT_DELETION_REQUEST',
            'user_account',
            { reason: reason ? 'provided' : 'not_provided' },
            success,
            errorMessage
        );
    }

    /**
     * Log sensitive settings access
     */
    async logSensitiveAccess(
        settingsSection: string,
        success: boolean = true,
        errorMessage?: string
    ): Promise<void> {
        await this.logEvent(
            'SENSITIVE_DATA_ACCESS',
            `settings_${settingsSection}`,
            { section: settingsSection },
            success,
            errorMessage
        );
    }

    /**
     * Flush all pending events immediately
     */
    async flushEvents(): Promise<void> {
        if (this.pendingEvents.length === 0) return;

        const eventsToSend = [...this.pendingEvents];
        this.pendingEvents = [];

        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }

        try {
            await this.sendEvents(eventsToSend);
        } catch (error) {
            console.error('Failed to send audit events:', error);
            // Re-queue events for retry (with limit to prevent memory issues)
            if (this.pendingEvents.length < 100) {
                this.pendingEvents.unshift(...eventsToSend);
            }
        }
    }

    /**
     * Get audit log for current user (limited view)
     */
    async getUserAuditLog(
        limit: number = 50,
        offset: number = 0
    ): Promise<AuditEvent[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/user-log?limit=${limit}&offset=${offset}`,
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch audit log: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching user audit log:', error);
            throw new Error('Failed to load audit log');
        }
    }

    /**
     * Send events to the server
     */
    private async sendEvents(events: AuditEvent[]): Promise<void> {
        const response = await fetch(`${this.baseUrl}/events`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ events }),
        });

        if (!response.ok) {
            throw new Error(
                `Failed to send audit events: ${response.statusText}`
            );
        }
    }

    /**
     * Schedule batch send of events
     */
    private scheduleBatchSend(): void {
        if (this.batchTimeout) return;

        this.batchTimeout = setTimeout(async () => {
            await this.flushEvents();
        }, this.batchDelayMs);
    }

    /**
     * Check if event is critical and should be sent immediately
     */
    private isCriticalEvent(action: AuditAction): boolean {
        const criticalEvents: AuditAction[] = [
            'PASSWORD_CHANGE',
            'EMAIL_CHANGE_CONFIRM',
            'SESSION_TERMINATE_ALL',
            'ACCOUNT_DELETION_REQUEST',
            'ACCOUNT_DELETION_CONFIRM',
            'LOGIN_ATTEMPT',
        ];

        return criticalEvents.includes(action);
    }

    /**
     * Sanitize event details to remove sensitive information
     */
    private sanitizeDetails(
        details?: Record<string, unknown>
    ): Record<string, unknown> | undefined {
        if (!details) return undefined;

        const sanitized = { ...details };

        // Remove sensitive fields
        const sensitiveFields = [
            'password',
            'token',
            'secret',
            'key',
            'credential',
        ];
        sensitiveFields.forEach((field) => {
            if (field in sanitized) {
                sanitized[field] = '[REDACTED]';
            }
        });

        return sanitized;
    }

    /**
     * Extract domain from email for logging (privacy-preserving)
     */
    private extractDomain(email: string): string {
        return email.split('@')[1] || 'unknown';
    }

    /**
     * Get current user ID (from auth context or token)
     */
    private async getCurrentUserId(): Promise<string> {
        // This would typically come from your auth context
        // For now, return a placeholder
        return 'current_user_id';
    }

    /**
     * Get client IP address (best effort)
     */
    private async getClientIP(): Promise<string> {
        try {
            // This would typically be handled by the server
            // Client-side IP detection is limited and unreliable
            return 'client_ip';
        } catch {
            return 'unknown';
        }
    }
}

// Singleton instance
export const auditService = new AuditService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        auditService.flushEvents().catch(console.error);
    });
}
