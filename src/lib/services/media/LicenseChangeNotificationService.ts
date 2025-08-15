import { LicenseInfo } from '@/types/media-search';
import { EventImage, EventCreationData } from '@/types/event-creation';
import {
    LicenseValidator,
    LicenseChangeImpact,
    ComplianceViolation,
} from './LicenseValidator';

export interface LicenseChangeNotification {
    id: string;
    providerId: string;
    changeType:
        | 'license_update'
        | 'terms_change'
        | 'restriction_added'
        | 'attribution_required';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    message: string;
    affectedImageCount: number;
    actionRequired: boolean;
    deadline?: string;
    createdAt: string;
    resolvedAt?: string;
}

export interface NotificationRecipient {
    userId: string;
    email: string;
    eventIds: string[];
    notificationPreferences: {
        email: boolean;
        inApp: boolean;
        sms: boolean;
    };
}

export interface LicenseChangeEvent {
    providerId: string;
    oldLicense: LicenseInfo;
    newLicense: LicenseInfo;
    effectiveDate: string;
    reason: string;
    affectedImageIds: string[];
}

export class LicenseChangeNotificationService {
    private static notifications: Map<string, LicenseChangeNotification> =
        new Map();
    private static subscribers: Map<string, NotificationRecipient[]> =
        new Map();

    /**
     * Process a license change event and notify affected users
     */
    static async processLicenseChange(
        changeEvent: LicenseChangeEvent,
        affectedImages: EventImage[]
    ): Promise<void> {
        // Assess impact of the license change
        const impact = LicenseValidator.assessLicenseChangeImpact(
            affectedImages,
            changeEvent.oldLicense,
            changeEvent.newLicense
        );

        // Create notification
        const notification = this.createNotification(changeEvent, impact);
        this.notifications.set(notification.id, notification);

        // Find affected users and events
        const affectedUsers = await this.findAffectedUsers(affectedImages);

        // Send notifications
        for (const user of affectedUsers) {
            await this.sendNotification(notification, user, impact);
        }

        // Log the change for compliance tracking
        this.logLicenseChange(changeEvent, impact);
    }

    /**
     * Create a notification for a license change
     */
    private static createNotification(
        changeEvent: LicenseChangeEvent,
        impact: LicenseChangeImpact
    ): LicenseChangeNotification {
        const severity = this.determineSeverity(impact);
        const changeType = this.determineChangeType(changeEvent, impact);

        return {
            id: this.generateNotificationId(),
            providerId: changeEvent.providerId,
            changeType,
            severity,
            title: this.generateNotificationTitle(changeEvent, changeType),
            message: this.generateNotificationMessage(changeEvent, impact),
            affectedImageCount: impact.affectedImages.length,
            actionRequired: impact.actionRequired,
            deadline: this.calculateDeadline(
                changeEvent.effectiveDate,
                severity
            ),
            createdAt: new Date().toISOString(),
        };
    }

    /**
     * Determine notification severity based on impact
     */
    private static determineSeverity(
        impact: LicenseChangeImpact
    ): 'critical' | 'high' | 'medium' | 'low' {
        const criticalViolations = impact.newViolations.filter(
            (v) => v.severity === 'critical'
        );
        const highViolations = impact.newViolations.filter(
            (v) => v.severity === 'high'
        );

        if (criticalViolations.length > 0) return 'critical';
        if (highViolations.length > 0) return 'high';
        if (impact.newViolations.length > 0) return 'medium';
        return 'low';
    }

    /**
     * Determine change type based on the license change
     */
    private static determineChangeType(
        changeEvent: LicenseChangeEvent,
        impact: LicenseChangeImpact
    ): LicenseChangeNotification['changeType'] {
        const { oldLicense, newLicense } = changeEvent;

        if (oldLicense.commercialUse && !newLicense.commercialUse) {
            return 'license_update';
        }

        if (
            !oldLicense.attribution.required &&
            newLicense.attribution.required
        ) {
            return 'attribution_required';
        }

        if (
            newLicense.restrictions &&
            newLicense.restrictions.length >
                (oldLicense.restrictions?.length || 0)
        ) {
            return 'restriction_added';
        }

        return 'terms_change';
    }

    /**
     * Generate notification title
     */
    private static generateNotificationTitle(
        changeEvent: LicenseChangeEvent,
        changeType: LicenseChangeNotification['changeType']
    ): string {
        const providerName = this.getProviderDisplayName(
            changeEvent.providerId
        );

        switch (changeType) {
            case 'license_update':
                return `${providerName} License Update - Action Required`;
            case 'attribution_required':
                return `${providerName} Now Requires Attribution`;
            case 'restriction_added':
                return `New Restrictions Added to ${providerName} License`;
            case 'terms_change':
                return `${providerName} Terms of Service Updated`;
            default:
                return `${providerName} License Change`;
        }
    }

    /**
     * Generate notification message
     */
    private static generateNotificationMessage(
        changeEvent: LicenseChangeEvent,
        impact: LicenseChangeImpact
    ): string {
        const providerName = this.getProviderDisplayName(
            changeEvent.providerId
        );
        const imageCount = impact.affectedImages.length;

        let message = `${providerName} has updated their license terms, affecting ${imageCount} image${imageCount > 1 ? 's' : ''} in your events.`;

        if (impact.newViolations.length > 0) {
            const criticalCount = impact.newViolations.filter(
                (v) => v.severity === 'critical'
            ).length;
            const highCount = impact.newViolations.filter(
                (v) => v.severity === 'high'
            ).length;

            if (criticalCount > 0) {
                message += ` ${criticalCount} critical violation${criticalCount > 1 ? 's' : ''} require immediate attention.`;
            }

            if (highCount > 0) {
                message += ` ${highCount} high-priority issue${highCount > 1 ? 's' : ''} need to be addressed.`;
            }
        }

        if (impact.recommendations.length > 0) {
            message += `\n\nRecommended actions:\n${impact.recommendations.map((r) => `• ${r}`).join('\n')}`;
        }

        return message;
    }

    /**
     * Calculate deadline for addressing the change
     */
    private static calculateDeadline(
        effectiveDate: string,
        severity: string
    ): string | undefined {
        const effective = new Date(effectiveDate);
        const now = new Date();

        // If effective date is in the past, set immediate deadlines
        if (effective <= now) {
            switch (severity) {
                case 'critical':
                    return new Date(
                        now.getTime() + 24 * 60 * 60 * 1000
                    ).toISOString(); // 24 hours
                case 'high':
                    return new Date(
                        now.getTime() + 7 * 24 * 60 * 60 * 1000
                    ).toISOString(); // 7 days
                case 'medium':
                    return new Date(
                        now.getTime() + 30 * 24 * 60 * 60 * 1000
                    ).toISOString(); // 30 days
                default:
                    return undefined;
            }
        }

        // If effective date is in the future, use that as the deadline
        return effectiveDate;
    }

    /**
     * Find users affected by the license change
     */
    private static async findAffectedUsers(
        affectedImages: EventImage[]
    ): Promise<NotificationRecipient[]> {
        // This would typically query the database to find users who have events with these images
        // For now, return mock data
        const mockUsers: NotificationRecipient[] = [
            {
                userId: 'user-1',
                email: 'organizer@example.com',
                eventIds: ['event-1', 'event-2'],
                notificationPreferences: {
                    email: true,
                    inApp: true,
                    sms: false,
                },
            },
        ];

        return mockUsers;
    }

    /**
     * Send notification to a user
     */
    private static async sendNotification(
        notification: LicenseChangeNotification,
        recipient: NotificationRecipient,
        impact: LicenseChangeImpact
    ): Promise<void> {
        // Send in-app notification
        if (recipient.notificationPreferences.inApp) {
            await this.sendInAppNotification(notification, recipient);
        }

        // Send email notification
        if (recipient.notificationPreferences.email) {
            await this.sendEmailNotification(notification, recipient, impact);
        }

        // Send SMS for critical notifications
        if (
            recipient.notificationPreferences.sms &&
            notification.severity === 'critical'
        ) {
            await this.sendSMSNotification(notification, recipient);
        }
    }

    /**
     * Send in-app notification
     */
    private static async sendInAppNotification(
        notification: LicenseChangeNotification,
        recipient: NotificationRecipient
    ): Promise<void> {
        // This would typically use a real-time notification system
        console.log('In-app notification sent:', {
            userId: recipient.userId,
            notificationId: notification.id,
            title: notification.title,
            severity: notification.severity,
        });
    }

    /**
     * Send email notification
     */
    private static async sendEmailNotification(
        notification: LicenseChangeNotification,
        recipient: NotificationRecipient,
        impact: LicenseChangeImpact
    ): Promise<void> {
        const emailContent = this.generateEmailContent(notification, impact);

        // This would typically use an email service
        console.log('Email notification sent:', {
            to: recipient.email,
            subject: notification.title,
            content: emailContent,
            priority: notification.severity,
        });
    }

    /**
     * Send SMS notification for critical issues
     */
    private static async sendSMSNotification(
        notification: LicenseChangeNotification,
        recipient: NotificationRecipient
    ): Promise<void> {
        const smsContent = `URGENT: ${notification.title}. ${notification.affectedImageCount} images affected. Check your dashboard for details.`;

        // This would typically use an SMS service
        console.log('SMS notification sent:', {
            userId: recipient.userId,
            content: smsContent,
            severity: notification.severity,
        });
    }

    /**
     * Generate email content for notification
     */
    private static generateEmailContent(
        notification: LicenseChangeNotification,
        impact: LicenseChangeImpact
    ): string {
        const providerName = this.getProviderDisplayName(
            notification.providerId
        );

        return `
        <h2>${notification.title}</h2>
        
        <p>${notification.message}</p>
        
        <h3>Impact Summary</h3>
        <ul>
            <li>Affected Images: ${notification.affectedImageCount}</li>
            <li>New Violations: ${impact.newViolations.length}</li>
            <li>Action Required: ${notification.actionRequired ? 'Yes' : 'No'}</li>
            ${notification.deadline ? `<li>Deadline: ${new Date(notification.deadline).toLocaleDateString()}</li>` : ''}
        </ul>
        
        ${
            impact.newViolations.length > 0
                ? `
        <h3>Violations to Address</h3>
        <ul>
            ${impact.newViolations.map((v) => `<li><strong>${v.severity.toUpperCase()}:</strong> ${v.message} (${v.resolution})</li>`).join('')}
        </ul>
        `
                : ''
        }
        
        <p><a href="/dashboard/compliance">View Compliance Dashboard</a></p>
        `;
    }

    /**
     * Log license change for compliance tracking
     */
    private static logLicenseChange(
        changeEvent: LicenseChangeEvent,
        impact: LicenseChangeImpact
    ): void {
        const logEntry = {
            timestamp: new Date().toISOString(),
            providerId: changeEvent.providerId,
            changeType: 'license_update',
            affectedImageCount: impact.affectedImages.length,
            violationCount: impact.newViolations.length,
            actionRequired: impact.actionRequired,
            effectiveDate: changeEvent.effectiveDate,
            reason: changeEvent.reason,
        };

        // This would typically be stored in a compliance audit log
        console.log('License change logged:', logEntry);
    }

    /**
     * Mark notification as resolved
     */
    static resolveNotification(
        notificationId: string,
        resolvedBy: string
    ): void {
        const notification = this.notifications.get(notificationId);
        if (notification) {
            notification.resolvedAt = new Date().toISOString();
            console.log('Notification resolved:', {
                notificationId,
                resolvedBy,
                resolvedAt: notification.resolvedAt,
            });
        }
    }

    /**
     * Get active notifications for a user
     */
    static getActiveNotifications(userId: string): LicenseChangeNotification[] {
        // This would typically query the database for user-specific notifications
        return Array.from(this.notifications.values()).filter(
            (n) => !n.resolvedAt
        );
    }

    /**
     * Subscribe to license change notifications
     */
    static subscribe(
        providerId: string,
        recipient: NotificationRecipient
    ): void {
        if (!this.subscribers.has(providerId)) {
            this.subscribers.set(providerId, []);
        }

        const subscribers = this.subscribers.get(providerId)!;
        const existingIndex = subscribers.findIndex(
            (s) => s.userId === recipient.userId
        );

        if (existingIndex >= 0) {
            subscribers[existingIndex] = recipient;
        } else {
            subscribers.push(recipient);
        }
    }

    /**
     * Unsubscribe from license change notifications
     */
    static unsubscribe(providerId: string, userId: string): void {
        const subscribers = this.subscribers.get(providerId);
        if (subscribers) {
            const filteredSubscribers = subscribers.filter(
                (s) => s.userId !== userId
            );
            this.subscribers.set(providerId, filteredSubscribers);
        }
    }

    /**
     * Generate unique notification ID
     */
    private static generateNotificationId(): string {
        return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get provider display name
     */
    private static getProviderDisplayName(providerId: string): string {
        switch (providerId) {
            case 'unsplash':
                return 'Unsplash';
            case 'pexels':
                return 'Pexels';
            case 'pixabay':
                return 'Pixabay';
            default:
                return providerId.charAt(0).toUpperCase() + providerId.slice(1);
        }
    }
}
