/**
 * Unit tests for notification data model validation and factory functions
 * Tests validation functions and factory functions for creating test data
 */

import {
    // Validation functions
    validateEventNotificationData,
    validatePaymentNotificationData,
    validateFinancingNotificationData,
    validateSystemNotificationData,

    // Factory functions
    createTestEventNotificationData,
    createTestPaymentNotificationData,
    createTestFinancingNotificationData,
    createTestSystemNotificationData,
    createTestNotificationMessage,
    createTestSignalRError,
    createTestNotificationDataByType,
    createTestNotificationBatch,

    // Types and enums
    NotificationType,
    NotificationPriority,
    PaymentMethod,
    SystemNotificationCategory,
    SignalRErrorType,
    EventNotificationData,
} from '../notifications';

describe('Notification Data Validation', () => {
    describe('validateEventNotificationData', () => {
        it('should validate correct event notification data', () => {
            const validData = createTestEventNotificationData();
            const result = validateEventNotificationData(validData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject data with empty required fields', () => {
            const invalidData = createTestEventNotificationData({
                eventId: '',
                eventTitle: '   ',
                organizerName: '',
            });

            const result = validateEventNotificationData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Event ID cannot be empty');
            expect(result.errors).toContain('Event title cannot be empty');
            expect(result.errors).toContain('Organizer name cannot be empty');
        });

        it('should reject data with invalid date format', () => {
            const invalidData = {
                ...createTestEventNotificationData(),
                eventDate: 'invalid-date',
            };

            const result = validateEventNotificationData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Event date must be a valid ISO date string'
            );
        });

        it('should reject data with invalid image URL', () => {
            const invalidData = createTestEventNotificationData({
                eventImageUrl: 'not-a-valid-url',
            });

            const result = validateEventNotificationData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Event image URL must be a valid URL'
            );
        });

        it('should validate data without optional fields', () => {
            const minimalData = {
                eventId: 'event-123',
                eventTitle: 'Test Event',
                organizerName: 'Test Organizer',
                eventDate: '2024-06-01T18:00:00Z',
            };

            const result = validateEventNotificationData(minimalData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject completely invalid data structure', () => {
            const invalidData = { invalid: 'data' };
            const result = validateEventNotificationData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Invalid event notification data structure'
            );
        });
    });

    describe('validatePaymentNotificationData', () => {
        it('should validate correct payment notification data', () => {
            const validData = createTestPaymentNotificationData();
            const result = validatePaymentNotificationData(validData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject data with empty required fields', () => {
            const invalidData = createTestPaymentNotificationData({
                paymentId: '',
                currency: '   ',
                userId: '',
            });

            const result = validatePaymentNotificationData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Payment ID cannot be empty');
            expect(result.errors).toContain('Currency cannot be empty');
            expect(result.errors).toContain('User ID cannot be empty');
        });

        it('should reject data with invalid amount', () => {
            const invalidData = createTestPaymentNotificationData({
                amount: -10,
            });

            const result = validatePaymentNotificationData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Payment amount must be greater than 0'
            );
        });

        it('should reject data with invalid currency format', () => {
            const invalidData = createTestPaymentNotificationData({
                currency: 'INVALID',
            });

            const result = validatePaymentNotificationData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Currency must be a 3-letter ISO code'
            );
        });

        it('should reject data with invalid date format', () => {
            const invalidData = {
                ...createTestPaymentNotificationData(),
                transactionDate: 'invalid-date',
            };

            const result = validatePaymentNotificationData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Transaction date must be a valid ISO date string'
            );
        });

        it('should validate data without optional fields', () => {
            const minimalData = {
                paymentId: 'pay-123',
                amount: 100,
                currency: 'USD',
                paymentMethod: PaymentMethod.CreditCard,
                transactionDate: '2024-01-01T00:00:00Z',
                userId: 'user-123',
            };

            const result = validatePaymentNotificationData(minimalData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('validateFinancingNotificationData', () => {
        it('should validate correct financing notification data', () => {
            const validData = createTestFinancingNotificationData();
            const result = validateFinancingNotificationData(validData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject data with empty required fields', () => {
            const invalidData = createTestFinancingNotificationData({
                applicationId: '',
                userId: '   ',
                eventId: '',
                eventTitle: '   ',
            });

            const result = validateFinancingNotificationData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Application ID cannot be empty');
            expect(result.errors).toContain('User ID cannot be empty');
            expect(result.errors).toContain('Event ID cannot be empty');
            expect(result.errors).toContain('Event title cannot be empty');
        });

        it('should reject data with invalid requested amount', () => {
            const invalidData = createTestFinancingNotificationData({
                requestedAmount: -1000,
            });

            const result = validateFinancingNotificationData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Requested amount must be greater than 0'
            );
        });

        it('should reject data with invalid currency format', () => {
            const invalidData = createTestFinancingNotificationData({
                currency: 'US',
            });

            const result = validateFinancingNotificationData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Currency must be a 3-letter ISO code'
            );
        });

        it('should reject data with invalid date format', () => {
            const invalidData = {
                ...createTestFinancingNotificationData(),
                applicationDate: 'not-a-date',
            };

            const result = validateFinancingNotificationData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Application date must be a valid ISO date string'
            );
        });
    });

    describe('validateSystemNotificationData', () => {
        it('should validate correct system notification data', () => {
            const validData = createTestSystemNotificationData();
            const result = validateSystemNotificationData(validData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject data with empty notification ID', () => {
            const invalidData = createTestSystemNotificationData({
                notificationId: '',
            });

            const result = validateSystemNotificationData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Notification ID cannot be empty');
        });

        it('should reject data with invalid affected services', () => {
            const invalidData = {
                ...createTestSystemNotificationData(),
                affectedServices: ['valid-service', 123, 'another-service'],
            };

            const result = validateSystemNotificationData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'All affected services must be strings'
            );
        });

        it('should reject data with non-array affected services', () => {
            const invalidData = {
                ...createTestSystemNotificationData(),
                affectedServices: 'not-an-array',
            };

            const result = validateSystemNotificationData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Affected services must be an array'
            );
        });

        it('should validate data without optional fields', () => {
            const minimalData = {
                notificationId: 'sys-123',
                category: SystemNotificationCategory.General,
                severity: NotificationPriority.Low,
            };

            const result = validateSystemNotificationData(minimalData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });
});

describe('Factory Functions', () => {
    describe('createTestEventNotificationData', () => {
        it('should create valid event notification data with defaults', () => {
            const data = createTestEventNotificationData();

            expect(data.eventId).toBe('test-event-123');
            expect(data.eventTitle).toBe('Test Event 2024');
            expect(data.organizerName).toBe('Test Organizer');
            expect(data.eventDate).toBe('2024-06-15T18:00:00Z');
            expect(data.eventLocation).toBe('Test Venue, Test City');
            expect(data.eventImageUrl).toBe(
                'https://example.com/event-image.jpg'
            );
        });

        it('should allow overriding default values', () => {
            const overrides = {
                eventId: 'custom-event-456',
                eventTitle: 'Custom Event Title',
                organizerName: 'Custom Organizer',
            };

            const data = createTestEventNotificationData(overrides);

            expect(data.eventId).toBe('custom-event-456');
            expect(data.eventTitle).toBe('Custom Event Title');
            expect(data.organizerName).toBe('Custom Organizer');
            expect(data.eventDate).toBe('2024-06-15T18:00:00Z'); // Should keep default
        });

        it('should create data that passes validation', () => {
            const data = createTestEventNotificationData();
            const result = validateEventNotificationData(data);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('createTestPaymentNotificationData', () => {
        it('should create valid payment notification data with defaults', () => {
            const data = createTestPaymentNotificationData();

            expect(data.paymentId).toBe('test-payment-123');
            expect(data.amount).toBe(99.99);
            expect(data.currency).toBe('USD');
            expect(data.paymentMethod).toBe(PaymentMethod.CreditCard);
            expect(data.userId).toBe('test-user-123');
        });

        it('should allow overriding default values', () => {
            const overrides = {
                paymentId: 'custom-payment-456',
                amount: 150.0,
                paymentMethod: PaymentMethod.PayPal,
            };

            const data = createTestPaymentNotificationData(overrides);

            expect(data.paymentId).toBe('custom-payment-456');
            expect(data.amount).toBe(150.0);
            expect(data.paymentMethod).toBe(PaymentMethod.PayPal);
            expect(data.currency).toBe('USD'); // Should keep default
        });

        it('should create data that passes validation', () => {
            const data = createTestPaymentNotificationData();
            const result = validatePaymentNotificationData(data);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('createTestFinancingNotificationData', () => {
        it('should create valid financing notification data with defaults', () => {
            const data = createTestFinancingNotificationData();

            expect(data.applicationId).toBe('test-app-123');
            expect(data.userId).toBe('test-user-123');
            expect(data.eventId).toBe('test-event-123');
            expect(data.requestedAmount).toBe(5000);
            expect(data.currency).toBe('USD');
        });

        it('should create data that passes validation', () => {
            const data = createTestFinancingNotificationData();
            const result = validateFinancingNotificationData(data);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('createTestSystemNotificationData', () => {
        it('should create valid system notification data with defaults', () => {
            const data = createTestSystemNotificationData();

            expect(data.notificationId).toBe('test-sys-123');
            expect(data.category).toBe(SystemNotificationCategory.Maintenance);
            expect(data.severity).toBe(NotificationPriority.Normal);
            expect(data.affectedServices).toEqual(['auth', 'payments']);
        });

        it('should create data that passes validation', () => {
            const data = createTestSystemNotificationData();
            const result = validateSystemNotificationData(data);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('createTestNotificationMessage', () => {
        it('should create valid notification message with defaults', () => {
            const message = createTestNotificationMessage();

            expect(message.id).toBe('test-notification-123');
            expect(message.type).toBe(NotificationType.EventRegistration);
            expect(message.title).toBe('Test Notification');
            expect(message.priority).toBe(NotificationPriority.Normal);
            expect(message.data).toBeDefined();
        });

        it('should allow overriding default values', () => {
            const overrides = {
                id: 'custom-notification-456',
                type: NotificationType.PaymentCompleted,
                title: 'Custom Notification',
                priority: NotificationPriority.High,
            };

            const message = createTestNotificationMessage(overrides);

            expect(message.id).toBe('custom-notification-456');
            expect(message.type).toBe(NotificationType.PaymentCompleted);
            expect(message.title).toBe('Custom Notification');
            expect(message.priority).toBe(NotificationPriority.High);
        });
    });

    describe('createTestSignalRError', () => {
        it('should create valid SignalR error with defaults', () => {
            const error = createTestSignalRError();

            expect(error.type).toBe(SignalRErrorType.Connection);
            expect(error.message).toBe('Test connection error');
            expect(error.canRetry).toBe(true);
            expect(error.retryCount).toBe(0);
            expect(error.timestamp).toBeInstanceOf(Date);
        });

        it('should allow overriding default values', () => {
            const overrides = {
                type: SignalRErrorType.Authentication,
                message: 'Custom error message',
                canRetry: false,
                retryCount: 3,
            };

            const error = createTestSignalRError(overrides);

            expect(error.type).toBe(SignalRErrorType.Authentication);
            expect(error.message).toBe('Custom error message');
            expect(error.canRetry).toBe(false);
            expect(error.retryCount).toBe(3);
        });
    });

    describe('createTestNotificationDataByType', () => {
        it('should create event data for event notification types', () => {
            const eventTypes = [
                NotificationType.EventRegistration,
                NotificationType.EventUpdate,
                NotificationType.EventPublished,
                NotificationType.EventCancelled,
            ];

            eventTypes.forEach((type) => {
                const data = createTestNotificationDataByType(type);
                expect(validateEventNotificationData(data).isValid).toBe(true);
            });
        });

        it('should create payment data for payment notification types', () => {
            const paymentTypes = [
                NotificationType.PaymentCompleted,
                NotificationType.PaymentFailed,
                NotificationType.PaymentPending,
                NotificationType.RecurringPaymentProcessed,
            ];

            paymentTypes.forEach((type) => {
                const data = createTestNotificationDataByType(type);
                expect(validatePaymentNotificationData(data).isValid).toBe(
                    true
                );
            });
        });

        it('should create financing data for financing notification types', () => {
            const financingTypes = [
                NotificationType.FinancingApplicationSubmitted,
                NotificationType.FinancingApplicationApproved,
                NotificationType.FinancingApplicationRejected,
                NotificationType.FinancingPaymentDue,
            ];

            financingTypes.forEach((type) => {
                const data = createTestNotificationDataByType(type);
                expect(validateFinancingNotificationData(data).isValid).toBe(
                    true
                );
            });
        });

        it('should create system data for system notification types', () => {
            const systemTypes = [
                NotificationType.SystemMaintenance,
                NotificationType.SystemUpdate,
            ];

            systemTypes.forEach((type) => {
                const data = createTestNotificationDataByType(type);
                expect(validateSystemNotificationData(data).isValid).toBe(true);
            });
        });

        it('should allow overriding default values', () => {
            const overrides = { eventId: 'custom-event-789' };
            const data = createTestNotificationDataByType(
                NotificationType.EventRegistration,
                overrides
            );

            expect((data as EventNotificationData).eventId).toBe(
                'custom-event-789'
            );
        });
    });

    describe('createTestNotificationBatch', () => {
        it('should create default batch of 5 notifications', () => {
            const batch = createTestNotificationBatch();

            expect(batch).toHaveLength(5);
            batch.forEach((notification, index) => {
                expect(notification.id).toBe(`test-batch-${index + 1}`);
                expect(notification.title).toContain(`Test`);
                expect(notification.data).toBeDefined();
            });
        });

        it('should create custom number of notifications', () => {
            const batch = createTestNotificationBatch(10);

            expect(batch).toHaveLength(10);
        });

        it('should use specified notification types', () => {
            const types = [
                NotificationType.EventRegistration,
                NotificationType.PaymentCompleted,
            ];
            const batch = createTestNotificationBatch(4, types);

            expect(batch).toHaveLength(4);
            expect(batch[0].type).toBe(NotificationType.EventRegistration);
            expect(batch[1].type).toBe(NotificationType.PaymentCompleted);
            expect(batch[2].type).toBe(NotificationType.EventRegistration);
            expect(batch[3].type).toBe(NotificationType.PaymentCompleted);
        });

        it('should create notifications with valid data', () => {
            const batch = createTestNotificationBatch(3);

            batch.forEach((notification) => {
                expect(notification.id).toBeTruthy();
                expect(notification.type).toBeTruthy();
                expect(notification.title).toBeTruthy();
                expect(notification.message).toBeTruthy();
                expect(notification.timestamp).toBeTruthy();
                expect(notification.priority).toBeTruthy();
                expect(notification.data).toBeTruthy();
            });
        });
    });
});
