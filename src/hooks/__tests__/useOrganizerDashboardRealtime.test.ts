import { renderHook, act, waitFor } from '@testing-library/react';
import { useOrganizerDashboardRealtime } from '../useOrganizerDashboardRealtime';
import { useTypedNotificationHandler } from '../useTypedNotificationHandler';
import { useNotificationHistory } from '../useNotificationHistory';
import {
    NotificationType,
    PaymentStatus,
    FinancingApplicationStatus,
    BillingCycle,
    createTestNotificationMessage,
    createTestEventNotificationData,
    createTestPaymentNotificationData,
    createTestFinancingNotificationData,
} from '@/types/notifications';
import type {
    EventRegistrationData,
    PaymentCompletedData,
    FinancingApplicationSubmittedData,
    FinancingApplicationApprovedData,
} from '@/types/notifications';

// Mock dependencies
jest.mock('../useTypedNotificationHandler');
jest.mock('../useNotificationHistory');

const mockNotificationHandler = {
    isProcessing: false,
    processingQueue: [],
    notificationHistory: [],
    historyStats: {
        total: 0,
        unread: 0,
        dismissed: 0,
        recentCount: 0,
    },
    processNotification: jest.fn(),
    processNotificationBatch: jest.fn(),
    navigateToNotification: jest.fn(),
    getNotificationRoute: jest.fn(),
    clearHistory: jest.fn(),
    getHistoryByType: jest.fn(),
    markNotificationAsRead: jest.fn(),
    dismissNotification: jest.fn(),
    getUnreadCount: jest.fn(),
    shouldShowToast: jest.fn(),
    shouldAutoNavigate: jest.fn(),
    shouldPersistInHistory: jest.fn(),
    registerEventHandler: jest.fn(),
    registerPaymentHandler: jest.fn(),
    registerFinancingHandler: jest.fn(),
    registerSystemHandler: jest.fn(),
};

const mockHistoryManager = {
    history: [],
    stats: {
        total: 0,
        unread: 0,
        dismissed: 0,
        recentCount: 0,
    },
    addNotification: jest.fn(),
    markAsRead: jest.fn(),
    markAsUnread: jest.fn(),
    markAllAsRead: jest.fn(),
    markSelectedAsRead: jest.fn(),
    dismiss: jest.fn(),
    dismissSelected: jest.fn(),
    remove: jest.fn(),
    removeSelected: jest.fn(),
    clear: jest.fn(),
    getByType: jest.fn(),
    getUnreadCount: jest.fn(),
};

// Helper function to create test notification data
const createEventRegistrationData = (
    overrides: Partial<EventRegistrationData> = {}
): EventRegistrationData => ({
    ...createTestEventNotificationData(),
    attendeeId: 'attendee-123',
    attendeeName: 'John Doe',
    attendeeEmail: 'john@example.com',
    ticketType: 'General Admission',
    ticketPrice: 50.0,
    registrationDate: '2024-01-15T10:00:00Z',
    paymentStatus: PaymentStatus.Completed,
    ...overrides,
});

const createPaymentCompletedData = (
    overrides: Partial<PaymentCompletedData> = {}
): PaymentCompletedData => ({
    ...createTestPaymentNotificationData(),
    receiptUrl: 'https://example.com/receipt',
    transactionReference: 'txn-123',
    processingFee: 2.5,
    netAmount: 47.5,
    ...overrides,
});

const createFinancingSubmittedData = (
    overrides: Partial<FinancingApplicationSubmittedData> = {}
): FinancingApplicationSubmittedData => ({
    ...createTestFinancingNotificationData(),
    expectedReviewTime: '3-5 business days',
    requiredDocuments: ['ID', 'Bank Statement'],
    applicationStatus: FinancingApplicationStatus.Submitted,
    ...overrides,
});

describe('useOrganizerDashboardRealtime', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useTypedNotificationHandler as jest.Mock).mockReturnValue(
            mockNotificationHandler
        );
        (useNotificationHistory as jest.Mock).mockReturnValue(
            mockHistoryManager
        );
    });

    describe('Initialization', () => {
        it('initializes with default metrics', async () => {
            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                })
            );

            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            expect(result.current.metrics).toEqual(
                expect.objectContaining({
                    totalEvents: 0,
                    activeEvents: 0,
                    totalRevenue: 0,
                    totalAttendees: 0,
                    lastUpdated: expect.any(Date),
                })
            );
            expect(result.current.isMetricsLoading).toBe(false);
            expect(result.current.metricsError).toBeNull();
        });

        it('initializes with empty update history', () => {
            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                })
            );

            expect(result.current.eventStatusChanges).toEqual([]);
            expect(result.current.registrationUpdates).toEqual([]);
            expect(result.current.revenueUpdates).toEqual([]);
            expect(result.current.financingUpdates).toEqual([]);
            expect(result.current.updateHistory).toEqual([]);
        });

        it('calls onMetricsUpdate callback when metrics are initialized', async () => {
            const onMetricsUpdate = jest.fn();

            renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                    onMetricsUpdate,
                })
            );

            await waitFor(() => {
                expect(onMetricsUpdate).toHaveBeenCalledWith(
                    expect.objectContaining({
                        totalEvents: 0,
                        totalRevenue: 0,
                    })
                );
            });
        });
    });

    describe('Metrics Updates', () => {
        it('updates metrics when registration notification is received', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                })
            );

            // Wait for initial metrics
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            const initialMetrics = result.current.metrics!;

            // Simulate registration notification
            const registrationNotification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createEventRegistrationData(),
            });

            act(() => {
                notificationCallback(registrationNotification);
            });

            expect(result.current.metrics).toEqual(
                expect.objectContaining({
                    totalAttendees: initialMetrics.totalAttendees + 1,
                    monthlyAttendees: initialMetrics.monthlyAttendees + 1,
                    totalRevenue: initialMetrics.totalRevenue + 50.0,
                    monthlyRevenue: initialMetrics.monthlyRevenue + 50.0,
                })
            );
        });

        it('updates metrics when payment completed notification is received', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                })
            );

            // Wait for initial metrics
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            const initialMetrics = result.current.metrics!;

            // Simulate payment completed notification
            const paymentNotification = createTestNotificationMessage({
                type: NotificationType.PaymentCompleted,
                data: createPaymentCompletedData({ netAmount: 100.0 }),
            });

            act(() => {
                notificationCallback(paymentNotification);
            });

            expect(result.current.metrics).toEqual(
                expect.objectContaining({
                    totalRevenue: initialMetrics.totalRevenue + 100.0,
                    monthlyRevenue: initialMetrics.monthlyRevenue + 100.0,
                })
            );
        });

        it('updates metrics when event published notification is received', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                })
            );

            // Wait for initial metrics
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            const initialMetrics = result.current.metrics!;

            // Simulate event published notification
            const eventNotification = createTestNotificationMessage({
                type: NotificationType.EventPublished,
                data: createTestEventNotificationData(),
            });

            act(() => {
                notificationCallback(eventNotification);
            });

            expect(result.current.metrics).toEqual(
                expect.objectContaining({
                    publishedEvents: initialMetrics.publishedEvents + 1,
                    activeEvents: initialMetrics.activeEvents + 1,
                })
            );
        });
    });

    describe('Event Status Changes', () => {
        it('tracks event status changes', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const onEventStatusChange = jest.fn();

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                    onEventStatusChange,
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            // Simulate event published notification
            const eventNotification = createTestNotificationMessage({
                type: NotificationType.EventPublished,
                data: createTestEventNotificationData({
                    eventId: 'event-123',
                    eventTitle: 'Test Event',
                }),
            });

            act(() => {
                notificationCallback(eventNotification);
            });

            expect(result.current.eventStatusChanges).toHaveLength(1);
            expect(result.current.eventStatusChanges[0]).toEqual(
                expect.objectContaining({
                    eventId: 'event-123',
                    eventTitle: 'Test Event',
                    oldStatus: 'Draft',
                    newStatus: 'Published',
                    organizerId: 'org-123',
                })
            );

            expect(onEventStatusChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventId: 'event-123',
                    newStatus: 'Published',
                })
            );
        });

        it('handles event cancellation status changes', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            // Simulate event cancelled notification
            const eventNotification = createTestNotificationMessage({
                type: NotificationType.EventCancelled,
                data: createTestEventNotificationData(),
            });

            act(() => {
                notificationCallback(eventNotification);
            });

            expect(result.current.eventStatusChanges[0]).toEqual(
                expect.objectContaining({
                    oldStatus: 'Published',
                    newStatus: 'Cancelled',
                })
            );
        });
    });

    describe('Registration Updates', () => {
        it('tracks registration updates', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const onRegistrationUpdate = jest.fn();

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                    onRegistrationUpdate,
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            // Simulate registration notification
            const registrationData = createEventRegistrationData({
                attendeeName: 'Jane Smith',
                ticketPrice: 75.0,
            });

            const registrationNotification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: registrationData,
            });

            act(() => {
                notificationCallback(registrationNotification);
            });

            expect(result.current.registrationUpdates).toHaveLength(1);
            expect(result.current.registrationUpdates[0]).toEqual(
                expect.objectContaining({
                    attendeeName: 'Jane Smith',
                    ticketPrice: 75.0,
                    totalRegistrations: 1,
                    revenue: 75.0,
                })
            );

            expect(onRegistrationUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    attendeeName: 'Jane Smith',
                    ticketPrice: 75.0,
                })
            );
        });

        it('updates total registration count correctly', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            // Add multiple registrations
            const registrations = [
                createTestNotificationMessage({
                    type: NotificationType.EventRegistration,
                    data: createEventRegistrationData({
                        attendeeName: 'User 1',
                    }),
                }),
                createTestNotificationMessage({
                    type: NotificationType.EventRegistration,
                    data: createEventRegistrationData({
                        attendeeName: 'User 2',
                    }),
                }),
            ];

            registrations.forEach((notification) => {
                act(() => {
                    notificationCallback(notification);
                });
            });

            expect(result.current.registrationUpdates).toHaveLength(2);
            expect(
                result.current.registrationUpdates[0].totalRegistrations
            ).toBe(2);
        });
    });

    describe('Revenue Updates', () => {
        it('tracks revenue updates', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const onRevenueUpdate = jest.fn();

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                    onRevenueUpdate,
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            // Simulate payment completed notification
            const paymentData = createPaymentCompletedData({
                amount: 100.0,
                netAmount: 95.0,
            });

            const paymentNotification = createTestNotificationMessage({
                type: NotificationType.PaymentCompleted,
                data: paymentData,
            });

            act(() => {
                notificationCallback(paymentNotification);
            });

            expect(result.current.revenueUpdates).toHaveLength(1);
            expect(result.current.revenueUpdates[0]).toEqual(
                expect.objectContaining({
                    amount: 100.0,
                    netAmount: 95.0,
                    totalRevenue: 95.0,
                    organizerId: 'org-123',
                })
            );

            expect(onRevenueUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: 100.0,
                    netAmount: 95.0,
                })
            );
        });

        it('calculates total and monthly revenue correctly', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            // Add multiple payments
            const payments = [
                createTestNotificationMessage({
                    type: NotificationType.PaymentCompleted,
                    data: createPaymentCompletedData({ netAmount: 50.0 }),
                }),
                createTestNotificationMessage({
                    type: NotificationType.PaymentCompleted,
                    data: createPaymentCompletedData({ netAmount: 75.0 }),
                }),
            ];

            payments.forEach((notification) => {
                act(() => {
                    notificationCallback(notification);
                });
            });

            expect(result.current.revenueUpdates).toHaveLength(2);
            expect(result.current.revenueUpdates[0].totalRevenue).toBe(125.0);
            expect(result.current.revenueUpdates[0].monthlyRevenue).toBe(125.0);
        });
    });

    describe('Financing Updates', () => {
        it('tracks financing application submissions', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const onFinancingUpdate = jest.fn();

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                    onFinancingUpdate,
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            // Simulate financing application submitted notification
            const financingData = createFinancingSubmittedData({
                requestedAmount: 5000,
            });

            const financingNotification = createTestNotificationMessage({
                type: NotificationType.FinancingApplicationSubmitted,
                data: financingData,
            });

            act(() => {
                notificationCallback(financingNotification);
            });

            expect(result.current.financingUpdates).toHaveLength(1);
            expect(result.current.financingUpdates[0]).toEqual(
                expect.objectContaining({
                    requestedAmount: 5000,
                    status: 'Submitted',
                    previousStatus: 'Draft',
                })
            );

            expect(onFinancingUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'Submitted',
                    requestedAmount: 5000,
                })
            );
        });

        it('tracks financing application approvals', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            // Simulate financing application approved notification
            const approvedData: FinancingApplicationApprovedData = {
                ...createTestFinancingNotificationData(),
                approvedAmount: 4500,
                interestRate: 5.5,
                repaymentTerms: {
                    termLength: 12,
                    termUnit: 'months',
                    paymentFrequency: BillingCycle.Monthly,
                    firstPaymentDate: '2024-02-01',
                    totalPayments: 12,
                    monthlyPaymentAmount: 400,
                },
                approvalDate: '2024-01-20T10:00:00Z',
                fundingDate: '2024-01-25T10:00:00Z',
            };

            const financingNotification = createTestNotificationMessage({
                type: NotificationType.FinancingApplicationApproved,
                data: approvedData,
            });

            act(() => {
                notificationCallback(financingNotification);
            });

            expect(result.current.financingUpdates[0]).toEqual(
                expect.objectContaining({
                    status: 'Approved',
                    previousStatus: 'Under Review',
                    approvedAmount: 4500,
                    interestRate: 5.5,
                })
            );
        });
    });

    describe('Update History', () => {
        it('maintains update history with correct types', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            // Add different types of notifications
            const notifications = [
                createTestNotificationMessage({
                    type: NotificationType.EventRegistration,
                    data: createEventRegistrationData(),
                }),
                createTestNotificationMessage({
                    type: NotificationType.PaymentCompleted,
                    data: createPaymentCompletedData(),
                }),
                createTestNotificationMessage({
                    type: NotificationType.EventPublished,
                    data: createTestEventNotificationData(),
                }),
            ];

            notifications.forEach((notification) => {
                act(() => {
                    notificationCallback(notification);
                });
            });

            expect(result.current.updateHistory).toHaveLength(4); // 3 notifications + 1 metrics update

            const updateTypes = result.current.updateHistory.map(
                (update) => update.type
            );
            expect(updateTypes).toContain('registration');
            expect(updateTypes).toContain('revenue');
            expect(updateTypes).toContain('event_status');
            expect(updateTypes).toContain('dashboard_metrics');
        });

        it('limits update history to maxUpdateHistory', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                    maxUpdateHistory: 3,
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            // Add more notifications than the limit
            const notifications = Array.from({ length: 5 }, (_, i) =>
                createTestNotificationMessage({
                    type: NotificationType.EventRegistration,
                    data: createEventRegistrationData({
                        attendeeName: `User ${i}`,
                    }),
                })
            );

            notifications.forEach((notification) => {
                act(() => {
                    notificationCallback(notification);
                });
            });

            expect(result.current.updateHistory.length).toBeLessThanOrEqual(3);
        });
    });

    describe('Statistics', () => {
        it('calculates statistics correctly', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            // Add some notifications
            const notifications = [
                createTestNotificationMessage({
                    type: NotificationType.EventRegistration,
                    data: createEventRegistrationData(),
                }),
                createTestNotificationMessage({
                    type: NotificationType.PaymentCompleted,
                    data: createPaymentCompletedData({ netAmount: 100.0 }),
                }),
                createTestNotificationMessage({
                    type: NotificationType.FinancingApplicationSubmitted,
                    data: createFinancingSubmittedData(),
                }),
            ];

            notifications.forEach((notification) => {
                act(() => {
                    notificationCallback(notification);
                });
            });

            expect(result.current.stats).toEqual(
                expect.objectContaining({
                    totalUpdates: expect.any(Number),
                    todayUpdates: expect.any(Number),
                    recentRegistrations: 1,
                    recentRevenue: 100.0,
                    pendingFinancing: 1,
                })
            );
        });
    });

    describe('Actions', () => {
        it('refreshes metrics', async () => {
            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            const initialLastUpdated = result.current.metrics!.lastUpdated;

            // Wait a bit to ensure timestamp difference
            await new Promise((resolve) => setTimeout(resolve, 10));

            await act(async () => {
                await result.current.refreshMetrics();
            });

            expect(result.current.metrics!.lastUpdated).not.toEqual(
                initialLastUpdated
            );
        });

        it('clears update history', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            // Add some notifications
            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createEventRegistrationData(),
            });

            act(() => {
                notificationCallback(notification);
            });

            expect(result.current.updateHistory.length).toBeGreaterThan(0);

            act(() => {
                result.current.clearUpdateHistory();
            });

            expect(result.current.updateHistory).toEqual([]);
            expect(result.current.eventStatusChanges).toEqual([]);
            expect(result.current.registrationUpdates).toEqual([]);
            expect(result.current.revenueUpdates).toEqual([]);
            expect(result.current.financingUpdates).toEqual([]);
        });

        it('filters updates by type', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            // Add different types of notifications
            const notifications = [
                createTestNotificationMessage({
                    type: NotificationType.EventRegistration,
                    data: createEventRegistrationData(),
                }),
                createTestNotificationMessage({
                    type: NotificationType.PaymentCompleted,
                    data: createPaymentCompletedData(),
                }),
            ];

            notifications.forEach((notification) => {
                act(() => {
                    notificationCallback(notification);
                });
            });

            const registrationUpdates =
                result.current.getUpdatesByType('registration');
            const revenueUpdates = result.current.getUpdatesByType('revenue');

            expect(registrationUpdates).toHaveLength(1);
            expect(revenueUpdates).toHaveLength(1);
            expect(registrationUpdates[0].type).toBe('registration');
            expect(revenueUpdates[0].type).toBe('revenue');
        });
    });

    describe('External Callbacks', () => {
        it('registers and calls external callbacks', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            const metricsCallback = jest.fn();
            const registrationCallback = jest.fn();

            // Register callbacks
            const unsubscribeMetrics =
                result.current.onMetricsChange(metricsCallback);
            const unsubscribeRegistration =
                result.current.onRegistrationChange(registrationCallback);

            // Trigger notification
            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createEventRegistrationData(),
            });

            act(() => {
                notificationCallback(notification);
            });

            expect(metricsCallback).toHaveBeenCalled();
            expect(registrationCallback).toHaveBeenCalled();

            // Unsubscribe and verify callbacks are not called
            unsubscribeMetrics();
            unsubscribeRegistration();

            const anotherNotification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createEventRegistrationData({
                    attendeeName: 'Another User',
                }),
            });

            act(() => {
                notificationCallback(anotherNotification);
            });

            // Callbacks should not be called again after unsubscribing
            expect(metricsCallback).toHaveBeenCalledTimes(1);
            expect(registrationCallback).toHaveBeenCalledTimes(1);
        });
    });

    describe('Configuration Options', () => {
        it('respects enableMetricsUpdates option', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                    enableMetricsUpdates: false,
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            const initialMetrics = result.current.metrics!;

            // Trigger notification that would normally update metrics
            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createEventRegistrationData(),
            });

            act(() => {
                notificationCallback(notification);
            });

            // Metrics should not have changed
            expect(result.current.metrics).toEqual(initialMetrics);
        });

        it('respects enableRegistrationUpdates option', async () => {
            let notificationCallback: (notification: unknown) => void;
            (useTypedNotificationHandler as jest.Mock).mockImplementation(
                (options) => {
                    notificationCallback = options.onNotificationReceived;
                    return mockNotificationHandler;
                }
            );

            const { result } = renderHook(() =>
                useOrganizerDashboardRealtime({
                    organizerId: 'org-123',
                    enableRegistrationUpdates: false,
                })
            );

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.metrics).not.toBeNull();
            });

            // Trigger registration notification
            const notification = createTestNotificationMessage({
                type: NotificationType.EventRegistration,
                data: createEventRegistrationData(),
            });

            act(() => {
                notificationCallback(notification);
            });

            // Registration updates should be empty
            expect(result.current.registrationUpdates).toEqual([]);
        });
    });
});
