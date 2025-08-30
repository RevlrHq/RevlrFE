/**
 * Comprehensive TypeScript type definitions for SignalR notification system
 * These types mirror the backend C# models and provide full type safety
 */

// ============================================================================
// Core Notification Types
// ============================================================================

/**
 * Base notification message interface
 */
export interface NotificationMessage {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: string;
    data?: NotificationData;
    priority: NotificationPriority;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Notification types supported by the system
 */
export enum NotificationType {
    // Event notifications
    EventRegistration = 'EventRegistration',
    EventUpdate = 'EventUpdate',
    EventPublished = 'EventPublished',
    EventCancelled = 'EventCancelled',

    // Payment notifications
    PaymentCompleted = 'PaymentCompleted',
    PaymentFailed = 'PaymentFailed',
    PaymentPending = 'PaymentPending',
    RecurringPaymentProcessed = 'RecurringPaymentProcessed',

    // Financing notifications
    FinancingApplicationSubmitted = 'FinancingApplicationSubmitted',
    FinancingApplicationApproved = 'FinancingApplicationApproved',
    FinancingApplicationRejected = 'FinancingApplicationRejected',
    FinancingPaymentDue = 'FinancingPaymentDue',

    // System notifications
    SystemMaintenance = 'SystemMaintenance',
    SystemUpdate = 'SystemUpdate',
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
    Low = 'Low',
    Normal = 'Normal',
    High = 'High',
    Critical = 'Critical',
}

/**
 * Union type for all notification data types
 */
export type NotificationData =
    | EventNotificationData
    | PaymentNotificationData
    | FinancingNotificationData
    | SystemNotificationData;

// ============================================================================
// Event Notification Data Types
// ============================================================================

/**
 * Base interface for event-related notifications
 */
export interface EventNotificationData {
    eventId: string;
    eventTitle: string;
    organizerName: string;
    eventDate: string;
    eventLocation?: string;
    eventImageUrl?: string;
}

/**
 * Event registration notification data
 */
export interface EventRegistrationData extends EventNotificationData {
    attendeeId: string;
    attendeeName: string;
    attendeeEmail: string;
    ticketType: string;
    ticketPrice: number;
    registrationDate: string;
    paymentStatus: PaymentStatus;
}

/**
 * Event update notification data
 */
export interface EventUpdateData extends EventNotificationData {
    updatedFields: string[];
    previousValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    updateReason?: string;
}

/**
 * Event published notification data
 */
export interface EventPublishedData extends EventNotificationData {
    publishedDate: string;
    isPublic: boolean;
    ticketSalesStartDate?: string;
}

/**
 * Event cancelled notification data
 */
export interface EventCancelledData extends EventNotificationData {
    cancellationDate: string;
    cancellationReason: string;
    refundStatus: RefundStatus;
    refundAmount?: number;
}

// ============================================================================
// Payment Notification Data Types
// ============================================================================

/**
 * Base interface for payment-related notifications
 */
export interface PaymentNotificationData {
    paymentId: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    transactionDate: string;
    userId: string;
    eventId?: string;
    eventTitle?: string;
}

/**
 * Payment completed notification data
 */
export interface PaymentCompletedData extends PaymentNotificationData {
    receiptUrl?: string;
    transactionReference: string;
    processingFee?: number;
    netAmount: number;
}

/**
 * Payment failed notification data
 */
export interface PaymentFailedData extends PaymentNotificationData {
    failureReason: string;
    errorCode?: string;
    retryUrl?: string;
    canRetry: boolean;
    maxRetryAttempts?: number;
    currentRetryAttempt?: number;
}

/**
 * Payment pending notification data
 */
export interface PaymentPendingData extends PaymentNotificationData {
    estimatedProcessingTime?: string;
    statusCheckUrl?: string;
    pendingReason?: string;
}

/**
 * Recurring payment processed notification data
 */
export interface RecurringPaymentProcessedData extends PaymentNotificationData {
    subscriptionId: string;
    billingCycle: BillingCycle;
    nextPaymentDate?: string;
    isLastPayment: boolean;
}

// ============================================================================
// Financing Notification Data Types
// ============================================================================

/**
 * Base interface for financing-related notifications
 */
export interface FinancingNotificationData {
    applicationId: string;
    userId: string;
    eventId: string;
    eventTitle: string;
    requestedAmount: number;
    currency: string;
    applicationDate: string;
}

/**
 * Financing application submitted notification data
 */
export interface FinancingApplicationSubmittedData
    extends FinancingNotificationData {
    expectedReviewTime: string;
    requiredDocuments?: string[];
    applicationStatus: FinancingApplicationStatus;
}

/**
 * Financing application approved notification data
 */
export interface FinancingApplicationApprovedData
    extends FinancingNotificationData {
    approvedAmount: number;
    interestRate: number;
    repaymentTerms: RepaymentTerms;
    approvalDate: string;
    fundingDate?: string;
    contractUrl?: string;
}

/**
 * Financing application rejected notification data
 */
export interface FinancingApplicationRejectedData
    extends FinancingNotificationData {
    rejectionReason: string;
    rejectionDate: string;
    canReapply: boolean;
    reapplicationDate?: string;
    improvementSuggestions?: string[];
}

/**
 * Financing payment due notification data
 */
export interface FinancingPaymentDueData extends FinancingNotificationData {
    paymentAmount: number;
    dueDate: string;
    paymentUrl: string;
    isOverdue: boolean;
    lateFee?: number;
    remainingBalance: number;
}

// ============================================================================
// System Notification Data Types
// ============================================================================

/**
 * System notification data
 */
export interface SystemNotificationData {
    notificationId: string;
    category: SystemNotificationCategory;
    severity: NotificationPriority;
    affectedServices?: string[];
    estimatedDuration?: string;
    actionRequired?: boolean;
}

/**
 * System maintenance notification data
 */
export interface SystemMaintenanceData extends SystemNotificationData {
    maintenanceStart: string;
    maintenanceEnd: string;
    maintenanceType: MaintenanceType;
    expectedDowntime?: string;
    alternativeServices?: string[];
}

/**
 * System update notification data
 */
export interface SystemUpdateData extends SystemNotificationData {
    updateVersion: string;
    releaseNotes?: string;
    newFeatures?: string[];
    bugFixes?: string[];
    breakingChanges?: string[];
    updateUrl?: string;
}

// ============================================================================
// Supporting Enums and Types
// ============================================================================

/**
 * Payment status enumeration
 */
export enum PaymentStatus {
    Pending = 'Pending',
    Completed = 'Completed',
    Failed = 'Failed',
    Cancelled = 'Cancelled',
    Refunded = 'Refunded',
    PartiallyRefunded = 'PartiallyRefunded',
}

/**
 * Refund status enumeration
 */
export enum RefundStatus {
    NotApplicable = 'NotApplicable',
    Pending = 'Pending',
    Processing = 'Processing',
    Completed = 'Completed',
    Failed = 'Failed',
    PartiallyCompleted = 'PartiallyCompleted',
}

/**
 * Payment method enumeration
 */
export enum PaymentMethod {
    CreditCard = 'CreditCard',
    DebitCard = 'DebitCard',
    BankTransfer = 'BankTransfer',
    PayPal = 'PayPal',
    Stripe = 'Stripe',
    Paystack = 'Paystack',
    ApplePay = 'ApplePay',
    GooglePay = 'GooglePay',
}

/**
 * Billing cycle enumeration
 */
export enum BillingCycle {
    Weekly = 'Weekly',
    Monthly = 'Monthly',
    Quarterly = 'Quarterly',
    Annually = 'Annually',
}

/**
 * Financing application status enumeration
 */
export enum FinancingApplicationStatus {
    Submitted = 'Submitted',
    UnderReview = 'UnderReview',
    RequiresDocuments = 'RequiresDocuments',
    Approved = 'Approved',
    Rejected = 'Rejected',
    Withdrawn = 'Withdrawn',
}

/**
 * Repayment terms interface
 */
export interface RepaymentTerms {
    termLength: number;
    termUnit: 'months' | 'years';
    paymentFrequency: BillingCycle;
    firstPaymentDate: string;
    totalPayments: number;
    monthlyPaymentAmount: number;
}

/**
 * System notification category enumeration
 */
export enum SystemNotificationCategory {
    Maintenance = 'Maintenance',
    Security = 'Security',
    Performance = 'Performance',
    Feature = 'Feature',
    Bug = 'Bug',
    General = 'General',
}

/**
 * Maintenance type enumeration
 */
export enum MaintenanceType {
    Scheduled = 'Scheduled',
    Emergency = 'Emergency',
    Security = 'Security',
    Performance = 'Performance',
    Infrastructure = 'Infrastructure',
}

// ============================================================================
// SignalR Connection Types
// ============================================================================

/**
 * SignalR connection state enumeration
 */
export enum SignalRConnectionState {
    Disconnected = 'Disconnected',
    Connecting = 'Connecting',
    Connected = 'Connected',
    Disconnecting = 'Disconnecting',
    Reconnecting = 'Reconnecting',
}

/**
 * SignalR error types
 */
export enum SignalRErrorType {
    Authentication = 'Authentication',
    Connection = 'Connection',
    HubMethod = 'HubMethod',
    Network = 'Network',
    Unexpected = 'Unexpected',
}

/**
 * SignalR error interface
 */
export interface SignalRError {
    type: SignalRErrorType;
    message: string;
    originalError?: Error;
    timestamp: Date;
    connectionState?: SignalRConnectionState;
    canRetry: boolean;
    retryCount?: number;
}

/**
 * SignalR connection configuration
 */
export interface SignalRConnectionConfig {
    hubUrl: string;
    accessTokenFactory: () => string | Promise<string>;
    automaticReconnect: boolean;
    reconnectIntervals: number[];
    serverTimeoutInMilliseconds: number;
    keepAliveIntervalInMilliseconds: number;
    handshakeTimeoutInMilliseconds: number;
}

/**
 * User group types for SignalR
 */
export enum UserGroupType {
    User = 'User',
    Organizer = 'Organizer',
    Admin = 'Admin',
    System = 'System',
}

/**
 * User group interface
 */
export interface UserGroup {
    groupId: string;
    groupType: UserGroupType;
    userId: string;
    joinedAt: string;
    permissions: string[];
}

// ============================================================================
// Type Guards and Validation Functions
// ============================================================================

/**
 * Type guard for NotificationMessage
 */
export function isNotificationMessage(
    obj: unknown
): obj is NotificationMessage {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    return (
        typeof obj.id === 'string' &&
        typeof obj.type === 'string' &&
        typeof obj.title === 'string' &&
        typeof obj.message === 'string' &&
        typeof obj.timestamp === 'string' &&
        Object.values(NotificationType).includes(obj.type) &&
        Object.values(NotificationPriority).includes(obj.priority)
    );
}

/**
 * Type guard for EventNotificationData
 */
export function isEventNotificationData(
    data: unknown
): data is EventNotificationData {
    if (!data || typeof data !== 'object') {
        return false;
    }

    return (
        typeof data.eventId === 'string' &&
        typeof data.eventTitle === 'string' &&
        typeof data.organizerName === 'string' &&
        typeof data.eventDate === 'string'
    );
}

/**
 * Type guard for PaymentNotificationData
 */
export function isPaymentNotificationData(
    data: unknown
): data is PaymentNotificationData {
    if (!data || typeof data !== 'object') {
        return false;
    }

    return (
        typeof data.paymentId === 'string' &&
        typeof data.amount === 'number' &&
        typeof data.currency === 'string' &&
        typeof data.transactionDate === 'string' &&
        typeof data.userId === 'string' &&
        Object.values(PaymentMethod).includes(data.paymentMethod)
    );
}

/**
 * Type guard for FinancingNotificationData
 */
export function isFinancingNotificationData(
    data: unknown
): data is FinancingNotificationData {
    if (!data || typeof data !== 'object') {
        return false;
    }

    return (
        typeof data.applicationId === 'string' &&
        typeof data.userId === 'string' &&
        typeof data.eventId === 'string' &&
        typeof data.eventTitle === 'string' &&
        typeof data.requestedAmount === 'number' &&
        typeof data.currency === 'string' &&
        typeof data.applicationDate === 'string'
    );
}

/**
 * Type guard for SystemNotificationData
 */
export function isSystemNotificationData(
    data: unknown
): data is SystemNotificationData {
    if (!data || typeof data !== 'object') {
        return false;
    }

    return (
        typeof data.notificationId === 'string' &&
        Object.values(SystemNotificationCategory).includes(data.category) &&
        Object.values(NotificationPriority).includes(data.severity)
    );
}

/**
 * Type guard for SignalRError
 */
export function isSignalRError(obj: unknown): obj is SignalRError {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    return (
        Object.values(SignalRErrorType).includes(obj.type) &&
        typeof obj.message === 'string' &&
        obj.timestamp instanceof Date &&
        typeof obj.canRetry === 'boolean'
    );
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates EventNotificationData with comprehensive field checking
 */
export function validateEventNotificationData(data: unknown): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!isEventNotificationData(data)) {
        errors.push('Invalid event notification data structure');
        return { isValid: false, errors };
    }

    // Validate required fields
    if (!data.eventId.trim()) {
        errors.push('Event ID cannot be empty');
    }

    if (!data.eventTitle.trim()) {
        errors.push('Event title cannot be empty');
    }

    if (!data.organizerName.trim()) {
        errors.push('Organizer name cannot be empty');
    }

    // Validate date format
    const eventDate = new Date(data.eventDate);
    if (isNaN(eventDate.getTime())) {
        errors.push('Event date must be a valid ISO date string');
    }

    // Validate optional fields if present
    if (
        data.eventLocation !== undefined &&
        typeof data.eventLocation !== 'string'
    ) {
        errors.push('Event location must be a string');
    }

    if (data.eventImageUrl !== undefined) {
        if (typeof data.eventImageUrl !== 'string') {
            errors.push('Event image URL must be a string');
        } else {
            try {
                new URL(data.eventImageUrl);
            } catch {
                errors.push('Event image URL must be a valid URL');
            }
        }
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Validates PaymentNotificationData with comprehensive field checking
 */
export function validatePaymentNotificationData(data: unknown): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!isPaymentNotificationData(data)) {
        errors.push('Invalid payment notification data structure');
        return { isValid: false, errors };
    }

    // Validate required fields
    if (!data.paymentId.trim()) {
        errors.push('Payment ID cannot be empty');
    }

    if (data.amount <= 0) {
        errors.push('Payment amount must be greater than 0');
    }

    if (!data.currency.trim()) {
        errors.push('Currency cannot be empty');
    }

    if (data.currency.length !== 3) {
        errors.push('Currency must be a 3-letter ISO code');
    }

    if (!data.userId.trim()) {
        errors.push('User ID cannot be empty');
    }

    // Validate date format
    const transactionDate = new Date(data.transactionDate);
    if (isNaN(transactionDate.getTime())) {
        errors.push('Transaction date must be a valid ISO date string');
    }

    // Validate optional fields if present
    if (
        data.eventId !== undefined &&
        (!data.eventId || typeof data.eventId !== 'string')
    ) {
        errors.push('Event ID must be a non-empty string if provided');
    }

    if (
        data.eventTitle !== undefined &&
        (!data.eventTitle || typeof data.eventTitle !== 'string')
    ) {
        errors.push('Event title must be a non-empty string if provided');
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Validates FinancingNotificationData with comprehensive field checking
 */
export function validateFinancingNotificationData(data: unknown): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!isFinancingNotificationData(data)) {
        errors.push('Invalid financing notification data structure');
        return { isValid: false, errors };
    }

    // Validate required fields
    if (!data.applicationId.trim()) {
        errors.push('Application ID cannot be empty');
    }

    if (!data.userId.trim()) {
        errors.push('User ID cannot be empty');
    }

    if (!data.eventId.trim()) {
        errors.push('Event ID cannot be empty');
    }

    if (!data.eventTitle.trim()) {
        errors.push('Event title cannot be empty');
    }

    if (data.requestedAmount <= 0) {
        errors.push('Requested amount must be greater than 0');
    }

    if (!data.currency.trim()) {
        errors.push('Currency cannot be empty');
    }

    if (data.currency.length !== 3) {
        errors.push('Currency must be a 3-letter ISO code');
    }

    // Validate date format
    const applicationDate = new Date(data.applicationDate);
    if (isNaN(applicationDate.getTime())) {
        errors.push('Application date must be a valid ISO date string');
    }

    return { isValid: errors.length === 0, errors };
}

/**
 * Validates SystemNotificationData with comprehensive field checking
 */
export function validateSystemNotificationData(data: unknown): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!isSystemNotificationData(data)) {
        errors.push('Invalid system notification data structure');
        return { isValid: false, errors };
    }

    // Validate required fields
    if (!data.notificationId.trim()) {
        errors.push('Notification ID cannot be empty');
    }

    // Validate optional fields if present
    if (data.affectedServices !== undefined) {
        if (!Array.isArray(data.affectedServices)) {
            errors.push('Affected services must be an array');
        } else if (
            data.affectedServices.some(
                (service: unknown) => typeof service !== 'string'
            )
        ) {
            errors.push('All affected services must be strings');
        }
    }

    if (
        data.estimatedDuration !== undefined &&
        typeof data.estimatedDuration !== 'string'
    ) {
        errors.push('Estimated duration must be a string');
    }

    if (
        data.actionRequired !== undefined &&
        typeof data.actionRequired !== 'boolean'
    ) {
        errors.push('Action required must be a boolean');
    }

    return { isValid: errors.length === 0, errors };
}

// ============================================================================
// Factory Functions for Test Data
// ============================================================================

/**
 * Creates a test EventNotificationData object
 */
export function createTestEventNotificationData(
    overrides: Partial<EventNotificationData> = {}
): EventNotificationData {
    return {
        eventId: 'test-event-123',
        eventTitle: 'Test Event 2024',
        organizerName: 'Test Organizer',
        eventDate: '2024-06-15T18:00:00Z',
        eventLocation: 'Test Venue, Test City',
        eventImageUrl: 'https://example.com/event-image.jpg',
        ...overrides,
    };
}

/**
 * Creates a test PaymentNotificationData object
 */
export function createTestPaymentNotificationData(
    overrides: Partial<PaymentNotificationData> = {}
): PaymentNotificationData {
    return {
        paymentId: 'test-payment-123',
        amount: 99.99,
        currency: 'USD',
        paymentMethod: PaymentMethod.CreditCard,
        transactionDate: '2024-01-15T10:30:00Z',
        userId: 'test-user-123',
        eventId: 'test-event-123',
        eventTitle: 'Test Event 2024',
        ...overrides,
    };
}

/**
 * Creates a test FinancingNotificationData object
 */
export function createTestFinancingNotificationData(
    overrides: Partial<FinancingNotificationData> = {}
): FinancingNotificationData {
    return {
        applicationId: 'test-app-123',
        userId: 'test-user-123',
        eventId: 'test-event-123',
        eventTitle: 'Test Event 2024',
        requestedAmount: 5000,
        currency: 'USD',
        applicationDate: '2024-01-01T09:00:00Z',
        ...overrides,
    };
}

/**
 * Creates a test SystemNotificationData object
 */
export function createTestSystemNotificationData(
    overrides: Partial<SystemNotificationData> = {}
): SystemNotificationData {
    return {
        notificationId: 'test-sys-123',
        category: SystemNotificationCategory.Maintenance,
        severity: NotificationPriority.Normal,
        affectedServices: ['auth', 'payments'],
        estimatedDuration: '2 hours',
        actionRequired: false,
        ...overrides,
    };
}

/**
 * Creates a test NotificationMessage object
 */
export function createTestNotificationMessage(
    overrides: Partial<NotificationMessage> = {}
): NotificationMessage {
    return {
        id: 'test-notification-123',
        type: NotificationType.EventRegistration,
        title: 'Test Notification',
        message: 'This is a test notification message',
        timestamp: '2024-01-15T12:00:00Z',
        priority: NotificationPriority.Normal,
        actionUrl: 'https://app.example.com/events/test-event-123',
        metadata: {
            source: 'test',
            version: '1.0',
        },
        data: createTestEventNotificationData(),
        ...overrides,
    };
}

/**
 * Creates a test SignalRError object
 */
export function createTestSignalRError(
    overrides: Partial<SignalRError> = {}
): SignalRError {
    return {
        type: SignalRErrorType.Connection,
        message: 'Test connection error',
        timestamp: new Date(),
        canRetry: true,
        retryCount: 0,
        ...overrides,
    };
}

/**
 * Creates test notification data for specific notification types
 */
export function createTestNotificationDataByType(
    type: NotificationType,
    overrides: Record<string, unknown> = {}
): NotificationData {
    switch (type) {
        case NotificationType.EventRegistration:
        case NotificationType.EventUpdate:
        case NotificationType.EventPublished:
        case NotificationType.EventCancelled:
            return createTestEventNotificationData(overrides);

        case NotificationType.PaymentCompleted:
        case NotificationType.PaymentFailed:
        case NotificationType.PaymentPending:
        case NotificationType.RecurringPaymentProcessed:
            return createTestPaymentNotificationData(overrides);

        case NotificationType.FinancingApplicationSubmitted:
        case NotificationType.FinancingApplicationApproved:
        case NotificationType.FinancingApplicationRejected:
        case NotificationType.FinancingPaymentDue:
            return createTestFinancingNotificationData(overrides);

        case NotificationType.SystemMaintenance:
        case NotificationType.SystemUpdate:
            return createTestSystemNotificationData(overrides);

        default:
            throw new Error(`Unknown notification type: ${type}`);
    }
}

/**
 * Creates a batch of test notifications
 */
export function createTestNotificationBatch(
    count: number = 5,
    types?: NotificationType[]
): NotificationMessage[] {
    const availableTypes = types || Object.values(NotificationType);
    const notifications: NotificationMessage[] = [];

    for (let i = 0; i < count; i++) {
        const type = availableTypes[i % availableTypes.length];
        const data = createTestNotificationDataByType(type);

        notifications.push(
            createTestNotificationMessage({
                id: `test-batch-${i + 1}`,
                type,
                title: `Test ${type} ${i + 1}`,
                message: `Test message for ${type} notification ${i + 1}`,
                data,
            })
        );
    }

    return notifications;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Notification handler function type
 */
export type NotificationHandler<T extends NotificationData = NotificationData> =
    (notification: NotificationMessage & { data: T }) => void | Promise<void>;

/**
 * Error handler function type
 */
export type ErrorHandler = (error: SignalRError) => void | Promise<void>;

/**
 * Connection state change handler type
 */
export type ConnectionStateChangeHandler = (
    newState: SignalRConnectionState,
    previousState?: SignalRConnectionState
) => void | Promise<void>;

/**
 * Group join result interface
 */
export interface GroupJoinResult {
    success: boolean;
    groupId: string;
    error?: string;
}

/**
 * Notification batch interface for performance optimization
 */
export interface NotificationBatch {
    notifications: NotificationMessage[];
    batchId: string;
    timestamp: string;
    totalCount: number;
}

/**
 * Connection health status interface
 */
export interface ConnectionHealthStatus {
    isHealthy: boolean;
    latency?: number;
    lastPingTime?: Date;
    consecutiveFailures: number;
    uptime: number;
}
