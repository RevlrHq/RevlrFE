/**
 * Unit tests for notification type system and validation
 * Tests type guards, validation functions, and data model integrity
 */

import {
    // Core types
    NotificationMessage,
    NotificationType,
    NotificationPriority,

    // Data types
    EventNotificationData,
    PaymentNotificationData,
    FinancingNotificationData,
    SystemNotificationData,

    // Enums
    PaymentMethod,
    SystemNotificationCategory,
    SignalRErrorType,
    SignalRConnectionState,

    // Type guards
    isNotificationMessage,
    isEventNotificationData,
    isPaymentNotificationData,
    isFinancingNotificationData,
    isSystemNotificationData,
    isSignalRError,

    // Interfaces
    SignalRError,
} from '../notifications';

describe('Notification Type Guards', () => {
    describe('isNotificationMessage', () => {
        it('should return true for valid notification message', () => {
            const validNotification: NotificationMessage = {
                id: 'test-id',
                type: NotificationType.EventRegistration,
                title: 'Test Notification',
                message: 'Test message',
                timestamp: '2024-01-01T00:00:00Z',
                priority: NotificationPriority.Normal,
            };

            expect(isNotificationMessage(validNotification)).toBe(true);
        });

        it('should return false for invalid notification message - missing required fields', () => {
            const invalidNotification = {
                id: 'test-id',
                type: NotificationType.EventRegistration,
                // missing title, message, timestamp, priority
            };

            expect(isNotificationMessage(invalidNotification)).toBe(false);
        });

        it('should return false for invalid notification message - wrong types', () => {
            const invalidNotification = {
                id: 123, // should be string
                type: 'InvalidType', // should be valid NotificationType
                title: 'Test',
                message: 'Test',
                timestamp: '2024-01-01T00:00:00Z',
                priority: 'InvalidPriority', // should be valid NotificationPriority
            };

            expect(isNotificationMessage(invalidNotification)).toBe(false);
        });

        it('should return false for null or undefined', () => {
            expect(isNotificationMessage(null)).toBe(false);
            expect(isNotificationMessage(undefined)).toBe(false);
        });

        it('should return true for notification with optional fields', () => {
            const notificationWithOptionals: NotificationMessage = {
                id: 'test-id',
                type: NotificationType.PaymentCompleted,
                title: 'Payment Completed',
                message: 'Your payment was processed successfully',
                timestamp: '2024-01-01T00:00:00Z',
                priority: NotificationPriority.High,
                actionUrl: 'https://example.com/payment/123',
                metadata: { transactionId: 'tx-123' },
                data: {
                    paymentId: 'pay-123',
                    amount: 100,
                    currency: 'USD',
                    paymentMethod: PaymentMethod.CreditCard,
                    transactionDate: '2024-01-01T00:00:00Z',
                    userId: 'user-123',
                },
            };

            expect(isNotificationMessage(notificationWithOptionals)).toBe(true);
        });
    });

    describe('isEventNotificationData', () => {
        it('should return true for valid event notification data', () => {
            const validEventData: EventNotificationData = {
                eventId: 'event-123',
                eventTitle: 'Test Event',
                organizerName: 'Test Organizer',
                eventDate: '2024-06-01T18:00:00Z',
            };

            expect(isEventNotificationData(validEventData)).toBe(true);
        });

        it('should return true for event data with optional fields', () => {
            const eventDataWithOptionals: EventNotificationData = {
                eventId: 'event-123',
                eventTitle: 'Test Event',
                organizerName: 'Test Organizer',
                eventDate: '2024-06-01T18:00:00Z',
                eventLocation: 'Test Venue',
                eventImageUrl: 'https://example.com/image.jpg',
            };

            expect(isEventNotificationData(eventDataWithOptionals)).toBe(true);
        });

        it('should return false for invalid event data - missing required fields', () => {
            const invalidEventData = {
                eventId: 'event-123',
                eventTitle: 'Test Event',
                // missing organizerName and eventDate
            };

            expect(isEventNotificationData(invalidEventData)).toBe(false);
        });

        it('should return false for invalid event data - wrong types', () => {
            const invalidEventData = {
                eventId: 123, // should be string
                eventTitle: 'Test Event',
                organizerName: 'Test Organizer',
                eventDate: new Date(), // should be string
            };

            expect(isEventNotificationData(invalidEventData)).toBe(false);
        });

        it('should return false for null or undefined', () => {
            expect(isEventNotificationData(null)).toBe(false);
            expect(isEventNotificationData(undefined)).toBe(false);
        });
    });

    describe('isPaymentNotificationData', () => {
        it('should return true for valid payment notification data', () => {
            const validPaymentData: PaymentNotificationData = {
                paymentId: 'pay-123',
                amount: 100.5,
                currency: 'USD',
                paymentMethod: PaymentMethod.CreditCard,
                transactionDate: '2024-01-01T00:00:00Z',
                userId: 'user-123',
            };

            expect(isPaymentNotificationData(validPaymentData)).toBe(true);
        });

        it('should return true for payment data with optional fields', () => {
            const paymentDataWithOptionals: PaymentNotificationData = {
                paymentId: 'pay-123',
                amount: 100.5,
                currency: 'USD',
                paymentMethod: PaymentMethod.Stripe,
                transactionDate: '2024-01-01T00:00:00Z',
                userId: 'user-123',
                eventId: 'event-123',
                eventTitle: 'Test Event',
            };

            expect(isPaymentNotificationData(paymentDataWithOptionals)).toBe(
                true
            );
        });

        it('should return false for invalid payment data - missing required fields', () => {
            const invalidPaymentData = {
                paymentId: 'pay-123',
                amount: 100.5,
                // missing currency, paymentMethod, transactionDate, userId
            };

            expect(isPaymentNotificationData(invalidPaymentData)).toBe(false);
        });

        it('should return false for invalid payment data - wrong types', () => {
            const invalidPaymentData = {
                paymentId: 'pay-123',
                amount: '100.50', // should be number
                currency: 'USD',
                paymentMethod: 'InvalidMethod', // should be valid PaymentMethod
                transactionDate: '2024-01-01T00:00:00Z',
                userId: 'user-123',
            };

            expect(isPaymentNotificationData(invalidPaymentData)).toBe(false);
        });

        it('should return false for null or undefined', () => {
            expect(isPaymentNotificationData(null)).toBe(false);
            expect(isPaymentNotificationData(undefined)).toBe(false);
        });
    });

    describe('isFinancingNotificationData', () => {
        it('should return true for valid financing notification data', () => {
            const validFinancingData: FinancingNotificationData = {
                applicationId: 'app-123',
                userId: 'user-123',
                eventId: 'event-123',
                eventTitle: 'Test Event',
                requestedAmount: 5000,
                currency: 'USD',
                applicationDate: '2024-01-01T00:00:00Z',
            };

            expect(isFinancingNotificationData(validFinancingData)).toBe(true);
        });

        it('should return false for invalid financing data - missing required fields', () => {
            const invalidFinancingData = {
                applicationId: 'app-123',
                userId: 'user-123',
                // missing eventId, eventTitle, requestedAmount, currency, applicationDate
            };

            expect(isFinancingNotificationData(invalidFinancingData)).toBe(
                false
            );
        });

        it('should return false for invalid financing data - wrong types', () => {
            const invalidFinancingData = {
                applicationId: 'app-123',
                userId: 'user-123',
                eventId: 'event-123',
                eventTitle: 'Test Event',
                requestedAmount: '5000', // should be number
                currency: 'USD',
                applicationDate: '2024-01-01T00:00:00Z',
            };

            expect(isFinancingNotificationData(invalidFinancingData)).toBe(
                false
            );
        });

        it('should return false for null or undefined', () => {
            expect(isFinancingNotificationData(null)).toBe(false);
            expect(isFinancingNotificationData(undefined)).toBe(false);
        });
    });

    describe('isSystemNotificationData', () => {
        it('should return true for valid system notification data', () => {
            const validSystemData: SystemNotificationData = {
                notificationId: 'sys-123',
                category: SystemNotificationCategory.Maintenance,
                severity: NotificationPriority.High,
            };

            expect(isSystemNotificationData(validSystemData)).toBe(true);
        });

        it('should return true for system data with optional fields', () => {
            const systemDataWithOptionals: SystemNotificationData = {
                notificationId: 'sys-123',
                category: SystemNotificationCategory.Security,
                severity: NotificationPriority.Critical,
                affectedServices: ['auth', 'payments'],
                estimatedDuration: '2 hours',
                actionRequired: true,
            };

            expect(isSystemNotificationData(systemDataWithOptionals)).toBe(
                true
            );
        });

        it('should return false for invalid system data - missing required fields', () => {
            const invalidSystemData = {
                notificationId: 'sys-123',
                // missing category and severity
            };

            expect(isSystemNotificationData(invalidSystemData)).toBe(false);
        });

        it('should return false for invalid system data - wrong enum values', () => {
            const invalidSystemData = {
                notificationId: 'sys-123',
                category: 'InvalidCategory', // should be valid SystemNotificationCategory
                severity: 'InvalidSeverity', // should be valid NotificationPriority
            };

            expect(isSystemNotificationData(invalidSystemData)).toBe(false);
        });

        it('should return false for null or undefined', () => {
            expect(isSystemNotificationData(null)).toBe(false);
            expect(isSystemNotificationData(undefined)).toBe(false);
        });
    });

    describe('isSignalRError', () => {
        it('should return true for valid SignalR error', () => {
            const validError: SignalRError = {
                type: SignalRErrorType.Connection,
                message: 'Connection failed',
                timestamp: new Date(),
                canRetry: true,
            };

            expect(isSignalRError(validError)).toBe(true);
        });

        it('should return true for SignalR error with optional fields', () => {
            const errorWithOptionals: SignalRError = {
                type: SignalRErrorType.Authentication,
                message: 'Authentication failed',
                originalError: new Error('Token expired'),
                timestamp: new Date(),
                connectionState: SignalRConnectionState.Disconnected,
                canRetry: false,
                retryCount: 3,
            };

            expect(isSignalRError(errorWithOptionals)).toBe(true);
        });

        it('should return false for invalid SignalR error - missing required fields', () => {
            const invalidError = {
                type: SignalRErrorType.Network,
                // missing message, timestamp, canRetry
            };

            expect(isSignalRError(invalidError)).toBe(false);
        });

        it('should return false for invalid SignalR error - wrong types', () => {
            const invalidError = {
                type: 'InvalidType', // should be valid SignalRErrorType
                message: 'Error message',
                timestamp: '2024-01-01', // should be Date object
                canRetry: 'true', // should be boolean
            };

            expect(isSignalRError(invalidError)).toBe(false);
        });

        it('should return false for null or undefined', () => {
            expect(isSignalRError(null)).toBe(false);
            expect(isSignalRError(undefined)).toBe(false);
        });
    });
});

describe('Notification Type Enums', () => {
    describe('NotificationType', () => {
        it('should contain all expected notification types', () => {
            const expectedTypes = [
                'EventRegistration',
                'EventUpdate',
                'EventPublished',
                'EventCancelled',
                'PaymentCompleted',
                'PaymentFailed',
                'PaymentPending',
                'RecurringPaymentProcessed',
                'FinancingApplicationSubmitted',
                'FinancingApplicationApproved',
                'FinancingApplicationRejected',
                'FinancingPaymentDue',
                'SystemMaintenance',
                'SystemUpdate',
            ];

            const actualTypes = Object.values(NotificationType);
            expect(actualTypes).toEqual(expect.arrayContaining(expectedTypes));
            expect(actualTypes).toHaveLength(expectedTypes.length);
        });
    });

    describe('NotificationPriority', () => {
        it('should contain all expected priority levels', () => {
            const expectedPriorities = ['Low', 'Normal', 'High', 'Critical'];
            const actualPriorities = Object.values(NotificationPriority);

            expect(actualPriorities).toEqual(
                expect.arrayContaining(expectedPriorities)
            );
            expect(actualPriorities).toHaveLength(expectedPriorities.length);
        });
    });

    describe('PaymentMethod', () => {
        it('should contain all expected payment methods', () => {
            const expectedMethods = [
                'CreditCard',
                'DebitCard',
                'BankTransfer',
                'PayPal',
                'Stripe',
                'Paystack',
                'ApplePay',
                'GooglePay',
            ];

            const actualMethods = Object.values(PaymentMethod);
            expect(actualMethods).toEqual(
                expect.arrayContaining(expectedMethods)
            );
            expect(actualMethods).toHaveLength(expectedMethods.length);
        });
    });

    describe('SignalRErrorType', () => {
        it('should contain all expected error types', () => {
            const expectedTypes = [
                'Authentication',
                'Connection',
                'HubMethod',
                'Network',
                'Unexpected',
            ];

            const actualTypes = Object.values(SignalRErrorType);
            expect(actualTypes).toEqual(expect.arrayContaining(expectedTypes));
            expect(actualTypes).toHaveLength(expectedTypes.length);
        });
    });
});

describe('Type Safety and Integration', () => {
    it('should properly type notification data union', () => {
        const eventData: EventNotificationData = {
            eventId: 'event-123',
            eventTitle: 'Test Event',
            organizerName: 'Test Organizer',
            eventDate: '2024-06-01T18:00:00Z',
        };

        const paymentData: PaymentNotificationData = {
            paymentId: 'pay-123',
            amount: 100,
            currency: 'USD',
            paymentMethod: PaymentMethod.CreditCard,
            transactionDate: '2024-01-01T00:00:00Z',
            userId: 'user-123',
        };

        // Both should be assignable to NotificationData union type
        const notification1: NotificationMessage = {
            id: 'notif-1',
            type: NotificationType.EventRegistration,
            title: 'Event Registration',
            message: 'You have registered for an event',
            timestamp: '2024-01-01T00:00:00Z',
            priority: NotificationPriority.Normal,
            data: eventData,
        };

        const notification2: NotificationMessage = {
            id: 'notif-2',
            type: NotificationType.PaymentCompleted,
            title: 'Payment Completed',
            message: 'Your payment was processed',
            timestamp: '2024-01-01T00:00:00Z',
            priority: NotificationPriority.High,
            data: paymentData,
        };

        expect(isNotificationMessage(notification1)).toBe(true);
        expect(isNotificationMessage(notification2)).toBe(true);
    });

    it('should validate complex notification structures', () => {
        const complexNotification: NotificationMessage = {
            id: 'complex-notif-123',
            type: NotificationType.FinancingApplicationApproved,
            title: 'Financing Application Approved',
            message: 'Your financing application has been approved',
            timestamp: '2024-01-01T12:00:00Z',
            priority: NotificationPriority.High,
            actionUrl: 'https://app.example.com/financing/app-123',
            metadata: {
                applicationId: 'app-123',
                approvalDate: '2024-01-01',
                reviewerId: 'reviewer-456',
            },
            data: {
                applicationId: 'app-123',
                userId: 'user-123',
                eventId: 'event-123',
                eventTitle: 'Annual Conference 2024',
                requestedAmount: 10000,
                currency: 'USD',
                applicationDate: '2023-12-15T10:00:00Z',
            },
        };

        expect(isNotificationMessage(complexNotification)).toBe(true);
        expect(isFinancingNotificationData(complexNotification.data)).toBe(
            true
        );
    });
});
