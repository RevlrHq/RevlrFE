import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignalRContext } from '@/providers/SignalRProvider';
import { useToast } from '@/hooks/use-toast';
import { useNotificationHistory } from '@/hooks/useNotificationHistory';
import { NavigationService } from '@/lib/services/NavigationService';
import { SignalRStateService } from '@/lib/services/SignalRStateService';
import {
    NotificationMessage,
    NotificationType,
    NotificationPriority,
    isNotificationMessage,
    isEventNotificationData,
    isPaymentNotificationData,
    isFinancingNotificationData,
    isSystemNotificationData,
    validateEventNotificationData,
    validatePaymentNotificationData,
    validateFinancingNotificationData,
    validateSystemNotificationData,
} from '@/types/notifications';
import type {
    NotificationData,
    EventNotificationData,
    PaymentNotificationData,
    FinancingNotificationData,
    SystemNotificationData,
} from '@/types/notifications';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Notification handler function type for specific notification types
 */
export type TypedNotificationHandler<
    T extends NotificationData = NotificationData,
> = (notification: NotificationMessage & { data: T }) => void | Promise<void>;

/**
 * Notification routing configuration
 */
export interface NotificationRouting {
    // Event notification routes
    [NotificationType.EventRegistration]: string;
    [NotificationType.EventUpdate]: string;
    [NotificationType.EventPublished]: string;
    [NotificationType.EventCancelled]: string;

    // Payment notification routes
    [NotificationType.PaymentCompleted]: string;
    [NotificationType.PaymentFailed]: string;
    [NotificationType.PaymentPending]: string;
    [NotificationType.RecurringPaymentProcessed]: string;

    // Financing notification routes
    [NotificationType.FinancingApplicationSubmitted]: string;
    [NotificationType.FinancingApplicationApproved]: string;
    [NotificationType.FinancingApplicationRejected]: string;
    [NotificationType.FinancingPaymentDue]: string;

    // System notification routes
    [NotificationType.SystemMaintenance]: string;
    [NotificationType.SystemUpdate]: string;
}

/**
 * Notification processing result
 */
export interface NotificationProcessingResult {
    success: boolean;
    notificationId: string;
    type: NotificationType;
    error?: string;
    navigated?: boolean;
    toastShown?: boolean;
}

/**
 * Notification batch processing options
 */
export interface NotificationBatchOptions {
    batchSize: number;
    batchDelay: number;
    enableBatching: boolean;
}

/**
 * Notification history entry
 */
export interface NotificationHistoryEntry {
    notification: NotificationMessage;
    processedAt: Date;
    result: NotificationProcessingResult;
}

/**
 * Priority-based display configuration
 */
export interface PriorityDisplayConfig {
    [NotificationPriority.Critical]: {
        showToast: boolean;
        autoNavigate: boolean;
        persistInHistory: boolean;
        toastDuration?: number;
        soundAlert?: boolean;
    };
    [NotificationPriority.High]: {
        showToast: boolean;
        autoNavigate: boolean;
        persistInHistory: boolean;
        toastDuration?: number;
        soundAlert?: boolean;
    };
    [NotificationPriority.Normal]: {
        showToast: boolean;
        autoNavigate: boolean;
        persistInHistory: boolean;
        toastDuration?: number;
        soundAlert?: boolean;
    };
    [NotificationPriority.Low]: {
        showToast: boolean;
        autoNavigate: boolean;
        persistInHistory: boolean;
        toastDuration?: number;
        soundAlert?: boolean;
    };
}

/**
 * Hook options
 */
export interface UseTypedNotificationHandlerOptions {
    // Routing configuration
    routing?: Partial<NotificationRouting>;

    // Processing options
    enableAutoNavigation?: boolean;
    enableToastNotifications?: boolean;
    enableValidation?: boolean;
    enableLogging?: boolean;

    // Priority-based display configuration
    priorityConfig?: Partial<PriorityDisplayConfig>;

    // Batching options
    batchOptions?: Partial<NotificationBatchOptions>;

    // History management
    enableHistory?: boolean;
    maxHistorySize?: number;
    historyOptions?: {
        enablePersistence?: boolean;
        storageKey?: string;
        enableAutoCleanup?: boolean;
        maxAge?: number;
    };

    // Custom handlers
    onNotificationReceived?: (notification: NotificationMessage) => void;
    onNotificationProcessed?: (result: NotificationProcessingResult) => void;
    onValidationError?: (
        notification: NotificationMessage,
        errors: string[]
    ) => void;
    onNavigationError?: (
        notification: NotificationMessage,
        error: Error
    ) => void;
    onPriorityAction?: (
        notification: NotificationMessage,
        action: 'toast' | 'navigate' | 'sound'
    ) => void;
}

/**
 * Hook result interface
 */
export interface UseTypedNotificationHandlerResult {
    // Processing state
    isProcessing: boolean;
    processingQueue: NotificationMessage[];

    // History integration
    notificationHistory: NotificationHistoryEntry[];
    historyStats: {
        total: number;
        unread: number;
        dismissed: number;
        recentCount: number;
    };

    // Manual processing
    processNotification: (
        notification: NotificationMessage
    ) => Promise<NotificationProcessingResult>;
    processNotificationBatch: (
        notifications: NotificationMessage[]
    ) => Promise<NotificationProcessingResult[]>;

    // Navigation helpers
    navigateToNotification: (
        notification: NotificationMessage
    ) => Promise<boolean>;
    getNotificationRoute: (notification: NotificationMessage) => string | null;

    // History management
    clearHistory: () => void;
    getHistoryByType: (type: NotificationType) => NotificationHistoryEntry[];
    markNotificationAsRead: (notificationId: string) => boolean;
    dismissNotification: (notificationId: string) => boolean;
    getUnreadCount: () => number;

    // Priority-based actions
    shouldShowToast: (notification: NotificationMessage) => boolean;
    shouldAutoNavigate: (notification: NotificationMessage) => boolean;
    shouldPersistInHistory: (notification: NotificationMessage) => boolean;

    // Custom handler registration
    registerEventHandler: (
        handler: TypedNotificationHandler<EventNotificationData>
    ) => () => void;
    registerPaymentHandler: (
        handler: TypedNotificationHandler<PaymentNotificationData>
    ) => () => void;
    registerFinancingHandler: (
        handler: TypedNotificationHandler<FinancingNotificationData>
    ) => () => void;
    registerSystemHandler: (
        handler: TypedNotificationHandler<SystemNotificationData>
    ) => () => void;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_ROUTING: NotificationRouting = {
    // Event routes
    [NotificationType.EventRegistration]: '/dashboard/events/{eventId}',
    [NotificationType.EventUpdate]: '/dashboard/events/{eventId}',
    [NotificationType.EventPublished]: '/events/{eventId}',
    [NotificationType.EventCancelled]: '/dashboard/events/{eventId}',

    // Payment routes
    [NotificationType.PaymentCompleted]: '/dashboard/payment/history',
    [NotificationType.PaymentFailed]: '/dashboard/payment/retry',
    [NotificationType.PaymentPending]: '/dashboard/payment/status',
    [NotificationType.RecurringPaymentProcessed]: '/dashboard/payment/history',

    // Financing routes
    [NotificationType.FinancingApplicationSubmitted]:
        '/dashboard/financing/applications',
    [NotificationType.FinancingApplicationApproved]:
        '/dashboard/financing/approved',
    [NotificationType.FinancingApplicationRejected]:
        '/dashboard/financing/applications',
    [NotificationType.FinancingPaymentDue]: '/dashboard/financing/payments',

    // System routes
    [NotificationType.SystemMaintenance]: '/dashboard/system/maintenance',
    [NotificationType.SystemUpdate]: '/dashboard/system/updates',
};

const DEFAULT_BATCH_OPTIONS: NotificationBatchOptions = {
    batchSize: 5,
    batchDelay: 1000, // 1 second
    enableBatching: true,
};

const DEFAULT_PRIORITY_CONFIG: PriorityDisplayConfig = {
    [NotificationPriority.Critical]: {
        showToast: true,
        autoNavigate: true,
        persistInHistory: true,
        toastDuration: 10000, // 10 seconds
        soundAlert: true,
    },
    [NotificationPriority.High]: {
        showToast: true,
        autoNavigate: false,
        persistInHistory: true,
        toastDuration: 8000, // 8 seconds
        soundAlert: true,
    },
    [NotificationPriority.Normal]: {
        showToast: true,
        autoNavigate: false,
        persistInHistory: true,
        toastDuration: 5000, // 5 seconds
        soundAlert: false,
    },
    [NotificationPriority.Low]: {
        showToast: false,
        autoNavigate: false,
        persistInHistory: true,
        toastDuration: 3000, // 3 seconds
        soundAlert: false,
    },
};

const DEFAULT_OPTIONS: Required<UseTypedNotificationHandlerOptions> = {
    routing: DEFAULT_ROUTING,
    enableAutoNavigation: false, // Don't auto-navigate by default
    enableToastNotifications: true,
    enableValidation: true,
    enableLogging: process.env.NODE_ENV === 'development',
    priorityConfig: DEFAULT_PRIORITY_CONFIG,
    batchOptions: DEFAULT_BATCH_OPTIONS,
    enableHistory: true,
    maxHistorySize: 100,
    historyOptions: {
        enablePersistence: true,
        storageKey: 'signalr_notification_history',
        enableAutoCleanup: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    onNotificationReceived: () => {},
    onNotificationProcessed: () => {},
    onValidationError: () => {},
    onNavigationError: () => {},
    onPriorityAction: () => {},
};

// ============================================================================
// Helper Functions
// ============================================================================


/**
 * Validates notification data based on type
 */
const validateNotificationData = (
    notification: NotificationMessage
): {
    isValid: boolean;
    errors: string[];
} => {
    if (!notification.data) {
        return { isValid: true, errors: [] }; // Data is optional
    }

    switch (notification.type) {
        case NotificationType.EventRegistration:
        case NotificationType.EventUpdate:
        case NotificationType.EventPublished:
        case NotificationType.EventCancelled:
            if (isEventNotificationData(notification.data)) {
                return validateEventNotificationData(notification.data);
            }
            return {
                isValid: false,
                errors: ['Invalid event notification data structure'],
            };

        case NotificationType.PaymentCompleted:
        case NotificationType.PaymentFailed:
        case NotificationType.PaymentPending:
        case NotificationType.RecurringPaymentProcessed:
            if (isPaymentNotificationData(notification.data)) {
                return validatePaymentNotificationData(notification.data);
            }
            return {
                isValid: false,
                errors: ['Invalid payment notification data structure'],
            };

        case NotificationType.FinancingApplicationSubmitted:
        case NotificationType.FinancingApplicationApproved:
        case NotificationType.FinancingApplicationRejected:
        case NotificationType.FinancingPaymentDue:
            if (isFinancingNotificationData(notification.data)) {
                return validateFinancingNotificationData(notification.data);
            }
            return {
                isValid: false,
                errors: ['Invalid financing notification data structure'],
            };

        case NotificationType.SystemMaintenance:
        case NotificationType.SystemUpdate:
            if (isSystemNotificationData(notification.data)) {
                return validateSystemNotificationData(notification.data);
            }
            return {
                isValid: false,
                errors: ['Invalid system notification data structure'],
            };

        default:
            return {
                isValid: false,
                errors: [`Unknown notification type: ${notification.type}`],
            };
    }
};

/**
 * Interpolates route template with notification data
 */
const interpolateRoute = (
    template: string,
    notification: NotificationMessage
): string => {
    let route = template;

    // Replace common placeholders
    if (notification.data) {
        if (isEventNotificationData(notification.data)) {
            route = route.replace('{eventId}', notification.data.eventId);
        }
        if (isPaymentNotificationData(notification.data)) {
            route = route.replace('{paymentId}', notification.data.paymentId);
            if (notification.data.eventId) {
                route = route.replace('{eventId}', notification.data.eventId);
            }
        }
        if (isFinancingNotificationData(notification.data)) {
            route = route.replace(
                '{applicationId}',
                notification.data.applicationId
            );
            route = route.replace('{eventId}', notification.data.eventId);
        }
        if (isSystemNotificationData(notification.data)) {
            route = route.replace(
                '{notificationId}',
                notification.data.notificationId
            );
        }
    }

    // Use actionUrl if available and no interpolation was done
    if (route === template && notification.actionUrl) {
        return notification.actionUrl;
    }

    return route;
};

/**
 * Gets toast variant based on notification priority
 */
const getToastVariant = (
    priority: NotificationPriority
): 'default' | 'destructive' => {
    switch (priority) {
        case 'Critical':
        case 'High':
            return 'destructive';
        default:
            return 'default';
    }
};

// ============================================================================
// Main Hook Implementation
// ============================================================================

/**
 * Hook for handling typed SignalR notifications with routing and validation
 */
export const useTypedNotificationHandler = (
    options: UseTypedNotificationHandlerOptions = {}
): UseTypedNotificationHandlerResult => {
    const finalOptions = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
    const finalRouting = useMemo(() => ({ ...DEFAULT_ROUTING, ...finalOptions.routing }), [finalOptions.routing]);
    const finalBatchOptions = useMemo(() => ({
        ...DEFAULT_BATCH_OPTIONS,
        ...finalOptions.batchOptions,
    }), [finalOptions.batchOptions]);
    const finalPriorityConfig = useMemo(() => ({
        ...DEFAULT_PRIORITY_CONFIG,
        ...finalOptions.priorityConfig,
    }), [finalOptions.priorityConfig]);

    // Dependencies
    const signalR = useSignalRContext();
    const router = useRouter();
    const { toast } = useToast();

    // History manager integration
    const historyManager = useNotificationHistory({
        config: {
            maxSize: finalOptions.maxHistorySize,
            enablePersistence: finalOptions.historyOptions?.enablePersistence ?? true,
            storageKey: finalOptions.historyOptions?.storageKey ?? 'signalr_notification_history',
            enableAutoCleanup: finalOptions.historyOptions?.enableAutoCleanup ?? true,
            maxAge: finalOptions.historyOptions?.maxAge ?? 7 * 24 * 60 * 60 * 1000,
            cleanupInterval: 60 * 60 * 1000,
        },
        enableLogging: finalOptions.enableLogging,
    });

    // State
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingQueue, setProcessingQueue] = useState<
        NotificationMessage[]
    >([]);

    // Refs for handlers and batch processing
    const eventHandlersRef = useRef<
        Set<TypedNotificationHandler<EventNotificationData>>
    >(new Set());
    const paymentHandlersRef = useRef<
        Set<TypedNotificationHandler<PaymentNotificationData>>
    >(new Set());
    const financingHandlersRef = useRef<
        Set<TypedNotificationHandler<FinancingNotificationData>>
    >(new Set());
    const systemHandlersRef = useRef<
        Set<TypedNotificationHandler<SystemNotificationData>>
    >(new Set());
    const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const batchQueueRef = useRef<NotificationMessage[]>([]);

    // Helper function to log messages
    const log = useCallback(
        (message: string, ...args: unknown[]) => {
            if (finalOptions.enableLogging) {
                console.log(`[TypedNotificationHandler] ${message}`, ...args);
            }
        },
        [finalOptions.enableLogging]
    );

    // Priority-based helper functions
    const shouldShowToast = useCallback(
        (notification: NotificationMessage): boolean => {
            const config = finalPriorityConfig[notification.priority];
            return finalOptions.enableToastNotifications && config.showToast;
        },
        [finalOptions.enableToastNotifications, finalPriorityConfig]
    );

    const shouldAutoNavigate = useCallback(
        (notification: NotificationMessage): boolean => {
            const config = finalPriorityConfig[notification.priority];
            return finalOptions.enableAutoNavigation && config.autoNavigate;
        },
        [finalOptions.enableAutoNavigation, finalPriorityConfig]
    );

    const shouldPersistInHistory = useCallback(
        (notification: NotificationMessage): boolean => {
            const config = finalPriorityConfig[notification.priority];
            return finalOptions.enableHistory && config.persistInHistory;
        },
        [finalOptions.enableHistory, finalPriorityConfig]
    );

    const shouldPlaySoundAlert = useCallback(
        (notification: NotificationMessage): boolean => {
            const config = finalPriorityConfig[notification.priority];
            return config.soundAlert || false;
        },
        [finalPriorityConfig]
    );

    const getToastDuration = useCallback(
        (notification: NotificationMessage): number => {
            const config = finalPriorityConfig[notification.priority];
            return config.toastDuration || 5000;
        },
        [finalPriorityConfig]
    );

    // Helper function to add to history
    const addToHistory = useCallback(
        (notification: NotificationMessage) => {
            if (!shouldPersistInHistory(notification)) return;

            // Add to history manager
            historyManager.addNotification(notification);

            log(
                `Added notification to history: ${notification.id} - ${notification.title}`
            );
        },
        [shouldPersistInHistory, historyManager, log]
    );

    // Get notification route
    const getNotificationRoute = useCallback(
        (notification: NotificationMessage): string | null => {
            const template = finalRouting[notification.type];
            if (!template) {
                log(
                    `No route template found for notification type: ${notification.type}`
                );
                return null;
            }

            try {
                return interpolateRoute(template, notification);
            } catch (error) {
                log(
                    `Error interpolating route for ${notification.type}:`,
                    error
                );
                return null;
            }
        },
        [finalRouting, log]
    );

    // Navigate to notification
    const navigateToNotification = useCallback(
        async (notification: NotificationMessage): Promise<boolean> => {
            try {
                // Initialize NavigationService with router
                NavigationService.initialize(router);

                // Use actionUrl if available, otherwise get route from template
                const actionUrl =
                    notification.actionUrl ||
                    getNotificationRoute(notification);
                if (!actionUrl) {
                    log(
                        `Cannot navigate: no route available for ${notification.type}`
                    );
                    return false;
                }

                log(`Navigating to: ${actionUrl}`);

                // Use NavigationService for consistent navigation handling
                NavigationService.handleNotificationClick(
                    actionUrl,
                    notification.id
                );
                return true;
            } catch (error) {
                log(`Navigation error for ${notification.type}:`, error);
                finalOptions.onNavigationError?.(notification, error as Error);
                return false;
            }
        },
        [getNotificationRoute, router, log, finalOptions]
    );

    // Show toast notification
    const showToastNotification = useCallback(
        (notification: NotificationMessage): boolean => {
            if (!shouldShowToast(notification)) {
                return false;
            }

            try {
                const variant = getToastVariant(notification.priority);
                const duration = getToastDuration(notification);

                // Play sound alert if configured
                if (shouldPlaySoundAlert(notification)) {
                    finalOptions.onPriorityAction?.(notification, 'sound');
                }

                // Trigger priority action callback
                finalOptions.onPriorityAction?.(notification, 'toast');

                toast({
                    title: notification.title,
                    description: notification.message,
                    variant,
                    duration,
                });

                log(
                    `Toast shown for ${notification.type} (${notification.priority}): ${notification.title}`
                );
                return true;
            } catch (error) {
                log(`Error showing toast for ${notification.type}:`, error);
                return false;
            }
        },
        [
            shouldShowToast,
            shouldPlaySoundAlert,
            getToastDuration,
            toast,
            log,
            finalOptions,
        ]
    );

    // Call custom handlers based on notification type
    const callCustomHandlers = useCallback(
        async (notification: NotificationMessage): Promise<void> => {
            try {
                switch (notification.type) {
                    case NotificationType.EventRegistration:
                    case NotificationType.EventUpdate:
                    case NotificationType.EventPublished:
                    case NotificationType.EventCancelled:
                        if (isEventNotificationData(notification.data)) {
                            const typedNotification =
                                notification as NotificationMessage & {
                                    data: EventNotificationData;
                                };
                            for (const handler of eventHandlersRef.current) {
                                await handler(typedNotification);
                            }
                        }
                        break;

                    case NotificationType.PaymentCompleted:
                    case NotificationType.PaymentFailed:
                    case NotificationType.PaymentPending:
                    case NotificationType.RecurringPaymentProcessed:
                        if (isPaymentNotificationData(notification.data)) {
                            const typedNotification =
                                notification as NotificationMessage & {
                                    data: PaymentNotificationData;
                                };
                            for (const handler of paymentHandlersRef.current) {
                                await handler(typedNotification);
                            }
                        }
                        break;

                    case NotificationType.FinancingApplicationSubmitted:
                    case NotificationType.FinancingApplicationApproved:
                    case NotificationType.FinancingApplicationRejected:
                    case NotificationType.FinancingPaymentDue:
                        if (isFinancingNotificationData(notification.data)) {
                            const typedNotification =
                                notification as NotificationMessage & {
                                    data: FinancingNotificationData;
                                };
                            for (const handler of financingHandlersRef.current) {
                                await handler(typedNotification);
                            }
                        }
                        break;

                    case NotificationType.SystemMaintenance:
                    case NotificationType.SystemUpdate:
                        if (isSystemNotificationData(notification.data)) {
                            const typedNotification =
                                notification as NotificationMessage & {
                                    data: SystemNotificationData;
                                };
                            for (const handler of systemHandlersRef.current) {
                                await handler(typedNotification);
                            }
                        }
                        break;
                }
            } catch (error) {
                log(
                    `Error calling custom handlers for ${notification.type}:`,
                    error
                );
            }
        },
        [log]
    );

    // Process single notification
    const processNotification = useCallback(
        async (
            notification: NotificationMessage
        ): Promise<NotificationProcessingResult> => {
            const result: NotificationProcessingResult = {
                success: false,
                notificationId: notification.id,
                type: notification.type,
                navigated: false,
                toastShown: false,
            };

            try {
                log(
                    `Processing notification: ${notification.type} - ${notification.title}`
                );

                // Validate notification structure
                if (!isNotificationMessage(notification)) {
                    result.error = 'Invalid notification message structure';
                    return result;
                }

                // Validate notification data if enabled
                if (finalOptions.enableValidation) {
                    const validation = validateNotificationData(notification);
                    if (!validation.isValid) {
                        result.error = `Validation failed: ${validation.errors.join(', ')}`;
                        finalOptions.onValidationError?.(
                            notification,
                            validation.errors
                        );
                        return result;
                    }
                }

                // Call notification received callback
                finalOptions.onNotificationReceived?.(notification);

                // Update state management with notification
                SignalRStateService.handleNotification(notification);

                // Show toast notification
                if (finalOptions.enableToastNotifications) {
                    result.toastShown = showToastNotification(notification);
                }

                // Handle priority-based auto-navigation
                if (shouldAutoNavigate(notification)) {
                    finalOptions.onPriorityAction?.(notification, 'navigate');
                    result.navigated =
                        await navigateToNotification(notification);
                }

                // Call custom handlers
                await callCustomHandlers(notification);

                result.success = true;
                log(`Successfully processed notification: ${notification.id}`);
            } catch (error) {
                result.error = (error as Error).message;
                log(`Error processing notification ${notification.id}:`, error);
            } finally {
                // Add to history and call processed callback
                addToHistory(notification);
                finalOptions.onNotificationProcessed?.(result);
            }

            return result;
        },
        [
            log,
            finalOptions,
            showToastNotification,
            shouldAutoNavigate,
            navigateToNotification,
            callCustomHandlers,
            addToHistory,
        ]
    );

    // Process notification batch
    const processNotificationBatch = useCallback(
        async (
            notifications: NotificationMessage[]
        ): Promise<NotificationProcessingResult[]> => {
            setIsProcessing(true);

            try {
                log(
                    `Processing batch of ${notifications.length} notifications`
                );
                const results: NotificationProcessingResult[] = [];

                for (const notification of notifications) {
                    const result = await processNotification(notification);
                    results.push(result);
                }

                log(
                    `Completed batch processing: ${results.filter((r) => r.success).length}/${results.length} successful`
                );
                return results;
            } finally {
                setIsProcessing(false);
            }
        },
        [processNotification, log]
    );

    // Batch processing handler
    const processBatch = useCallback(async () => {
        if (batchQueueRef.current.length === 0) return;

        const batch = [...batchQueueRef.current];
        batchQueueRef.current = [];

        setProcessingQueue([]);
        await processNotificationBatch(batch);
    }, [processNotificationBatch]);

    // Add notification to batch queue
    const addToBatchQueue = useCallback(
        (notification: NotificationMessage) => {
            if (!finalBatchOptions.enableBatching) {
                // Process immediately if batching is disabled
                processNotification(notification);
                return;
            }

            batchQueueRef.current.push(notification);
            setProcessingQueue([...batchQueueRef.current]);

            // Clear existing timeout
            if (batchTimeoutRef.current) {
                clearTimeout(batchTimeoutRef.current);
            }

            // Process batch when size limit reached or after delay
            if (batchQueueRef.current.length >= finalBatchOptions.batchSize) {
                processBatch();
            } else {
                batchTimeoutRef.current = setTimeout(
                    processBatch,
                    finalBatchOptions.batchDelay
                );
            }
        },
        [finalBatchOptions, processNotification, processBatch]
    );

    // History management functions
    const clearHistory = useCallback(() => {
        historyManager.clearHistory();
        log('Notification history cleared');
    }, [historyManager, log]);

    const getHistoryByType = useCallback(
        (type: NotificationType): NotificationHistoryEntry[] => {
            return historyManager.entries
                .filter((entry) => entry.notification.type === type)
                .map((entry) => ({
                    notification: entry.notification,
                    processedAt: entry.receivedAt,
                    result: {
                        success: true,
                        notificationId: entry.notification.id,
                        type: entry.notification.type,
                    },
                }));
        },
        [historyManager.entries]
    );

    // Custom handler registration functions
    const registerEventHandler = useCallback(
        (
            handler: TypedNotificationHandler<EventNotificationData>
        ): (() => void) => {
            eventHandlersRef.current.add(handler);
            log('Event handler registered');

            return () => {
                eventHandlersRef.current.delete(handler);
                log('Event handler unregistered');
            };
        },
        [log]
    );

    const registerPaymentHandler = useCallback(
        (
            handler: TypedNotificationHandler<PaymentNotificationData>
        ): (() => void) => {
            paymentHandlersRef.current.add(handler);
            log('Payment handler registered');

            return () => {
                paymentHandlersRef.current.delete(handler);
                log('Payment handler unregistered');
            };
        },
        [log]
    );

    const registerFinancingHandler = useCallback(
        (
            handler: TypedNotificationHandler<FinancingNotificationData>
        ): (() => void) => {
            financingHandlersRef.current.add(handler);
            log('Financing handler registered');

            return () => {
                financingHandlersRef.current.delete(handler);
                log('Financing handler unregistered');
            };
        },
        [log]
    );

    const registerSystemHandler = useCallback(
        (
            handler: TypedNotificationHandler<SystemNotificationData>
        ): (() => void) => {
            systemHandlersRef.current.add(handler);
            log('System handler registered');

            return () => {
                systemHandlersRef.current.delete(handler);
                log('System handler unregistered');
            };
        },
        [log]
    );

    // Set up SignalR notification listeners
    useEffect(() => {
        if (!signalR.isConnected) return;

        log('Setting up SignalR notification listeners');

        // Listen for all notification types
        const handleNotification = (notification: NotificationMessage) => {
            log(
                `Received notification: ${notification.type} - ${notification.title}`
            );
            addToBatchQueue(notification);
        };

        // Register listeners for each notification type
        Object.values(NotificationType).forEach((type) => {
            signalR.on(`Receive${type}`, (...args: unknown[]) => {
                const notification = args[0] as NotificationMessage;
                handleNotification(notification);
            });
        });

        // Generic notification listener as fallback
        signalR.on('ReceiveNotification', (...args: unknown[]) => {
            const notification = args[0] as NotificationMessage;
            handleNotification(notification);
        });

        // Cleanup function
        return () => {
            log('Cleaning up SignalR notification listeners');

            Object.values(NotificationType).forEach((type) => {
                signalR.off(`Receive${type}`);
            });

            signalR.off('ReceiveNotification');
        };
    }, [signalR, addToBatchQueue, log]);

    // Cleanup batch timeout on unmount
    useEffect(() => {
        return () => {
            if (batchTimeoutRef.current) {
                clearTimeout(batchTimeoutRef.current);
            }
        };
    }, []);

    return {
        // Processing state
        isProcessing,
        processingQueue,

        // History integration
        notificationHistory: historyManager.entries.map((entry) => ({
            notification: entry.notification,
            processedAt: entry.receivedAt,
            result: {
                success: true,
                notificationId: entry.notification.id,
                type: entry.notification.type,
                navigated: false,
                toastShown: false,
            },
        })),
        historyStats: {
            total: historyManager.stats.total,
            unread: historyManager.stats.unread,
            dismissed: historyManager.stats.dismissed,
            recentCount: historyManager.stats.recentCount,
        },

        // Manual processing
        processNotification,
        processNotificationBatch,

        // Navigation helpers
        navigateToNotification,
        getNotificationRoute,

        // History management
        clearHistory,
        getHistoryByType,
        markNotificationAsRead: historyManager.markAsRead,
        dismissNotification: historyManager.dismissNotification,
        getUnreadCount: historyManager.getUnreadCount,

        // Priority-based actions
        shouldShowToast,
        shouldAutoNavigate,
        shouldPersistInHistory,

        // Custom handler registration
        registerEventHandler,
        registerPaymentHandler,
        registerFinancingHandler,
        registerSystemHandler,
    };
};
