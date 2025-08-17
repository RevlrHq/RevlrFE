import React from 'react';
import {
    X,
    AlertTriangle,
    Info,
    CheckCircle,
    AlertCircle,
    Wifi,
    WifiOff,
} from 'lucide-react';
import { ErrorNotification } from '@/lib/services/media/ErrorNotificationService';

interface ErrorNotificationDisplayProps {
    notifications: ErrorNotification[];
    onDismiss: (id: string) => void;
    onAction: (id: string, action: string, handler?: () => void) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    className?: string;
}

/**
 * Component for displaying error notifications with user-friendly messages
 */
export const ErrorNotificationDisplay: React.FC<
    ErrorNotificationDisplayProps
> = ({
    notifications,
    onDismiss,
    onAction,
    position = 'top-right',
    className = '',
}) => {
    if (notifications.length === 0) {
        return null;
    }

    const getPositionClasses = () => {
        switch (position) {
            case 'top-left':
                return 'top-4 left-4';
            case 'bottom-right':
                return 'bottom-4 right-4';
            case 'bottom-left':
                return 'bottom-4 left-4';
            case 'top-right':
            default:
                return 'top-4 right-4';
        }
    };

    const getNotificationIcon = (type: ErrorNotification['type']) => {
        switch (type) {
            case 'error':
                return <AlertCircle className='size-5 text-red-500' />;
            case 'warning':
                return <AlertTriangle className='size-5 text-yellow-500' />;
            case 'success':
                return <CheckCircle className='size-5 text-green-500' />;
            case 'info':
            default:
                return <Info className='size-5 text-blue-500' />;
        }
    };

    const getNotificationStyles = (type: ErrorNotification['type']) => {
        const baseStyles = 'border-l-4 shadow-lg';

        switch (type) {
            case 'error':
                return `${baseStyles} bg-red-50 border-red-500 dark:bg-red-900/20 dark:border-red-400`;
            case 'warning':
                return `${baseStyles} bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20 dark:border-yellow-400`;
            case 'success':
                return `${baseStyles} bg-green-50 border-green-500 dark:bg-green-900/20 dark:border-green-400`;
            case 'info':
            default:
                return `${baseStyles} bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-400`;
        }
    };

    const getNetworkIcon = (notification: ErrorNotification) => {
        if (notification.id === 'offline-notification') {
            return <WifiOff className='size-5 text-red-500' />;
        }
        if (notification.id === 'online-notification') {
            return <Wifi className='size-5 text-green-500' />;
        }
        return null;
    };

    return (
        <div
            className={`fixed z-50 flex w-full max-w-sm flex-col space-y-3 ${getPositionClasses()} ${className}`}
            role='region'
            aria-label='Error notifications'
        >
            {notifications.map((notification) => {
                const networkIcon = getNetworkIcon(notification);

                return (
                    <div
                        key={notification.id}
                        className={`rounded-lg p-4 transition-all duration-300 ease-in-out${getNotificationStyles(
                            notification.type
                        )}`}
                        role='alert'
                        aria-live={
                            notification.type === 'error'
                                ? 'assertive'
                                : 'polite'
                        }
                    >
                        <div className='flex items-start'>
                            <div className='shrink-0'>
                                {networkIcon ||
                                    getNotificationIcon(notification.type)}
                            </div>

                            <div className='ml-3 flex-1'>
                                <h3 className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                    {notification.title}
                                </h3>

                                <p className='mt-1 text-sm text-gray-700 dark:text-gray-300'>
                                    {notification.message}
                                </p>

                                {/* Provider information */}
                                {notification.metadata?.providerId && (
                                    <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                        Provider:{' '}
                                        {notification.metadata.providerId}
                                    </p>
                                )}

                                {/* Actions */}
                                {notification.actions &&
                                    notification.actions.length > 0 && (
                                        <div className='mt-3 flex space-x-2'>
                                            {notification.actions.map(
                                                (action, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => {
                                                            if (
                                                                action.action ===
                                                                'dismiss'
                                                            ) {
                                                                onDismiss(
                                                                    notification.id
                                                                );
                                                            } else {
                                                                onAction(
                                                                    notification.id,
                                                                    action.action,
                                                                    action.handler
                                                                );
                                                            }
                                                        }}
                                                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                                            action.primary
                                                                ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                                                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                                                        }`}
                                                        aria-label={`${action.label} for ${notification.title}`}
                                                    >
                                                        {action.label}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                            </div>

                            {/* Dismiss button */}
                            {notification.metadata?.canDismiss !== false && (
                                <div className='ml-4 shrink-0'>
                                    <button
                                        onClick={() =>
                                            onDismiss(notification.id)
                                        }
                                        className='inline-flex text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                                        aria-label={`Dismiss ${notification.title}`}
                                    >
                                        <X className='size-4' />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Progress bar for persistent notifications */}
                        {notification.duration && notification.duration > 0 && (
                            <div className='mt-3'>
                                <div className='h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
                                    <div
                                        className='h-1 rounded-full bg-blue-600 transition-all duration-100 ease-linear'
                                        style={{
                                            animation: `shrink ${notification.duration}ms linear forwards`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            <style jsx>{`
                @keyframes shrink {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
            `}</style>
        </div>
    );
};

/**
 * Hook for managing error notifications
 */
export const useErrorNotifications = () => {
    const [notifications, setNotifications] = React.useState<
        ErrorNotification[]
    >([]);

    const addNotification = React.useCallback(
        (notification: ErrorNotification) => {
            setNotifications((prev) => {
                // Check for duplicates
                const exists = prev.some((n) => n.id === notification.id);
                if (exists) {
                    return prev;
                }

                const newNotifications = [...prev, notification];

                // Auto-dismiss if duration is set
                if (notification.duration && notification.duration > 0) {
                    setTimeout(() => {
                        setNotifications((current) =>
                            current.filter((n) => n.id !== notification.id)
                        );
                    }, notification.duration);
                }

                return newNotifications;
            });
        },
        []
    );

    const removeNotification = React.useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const clearAllNotifications = React.useCallback(() => {
        setNotifications([]);
    }, []);

    const handleAction = React.useCallback(
        (id: string, action: string, handler?: () => void) => {
            if (handler) {
                handler();
            }

            // Remove notification after action (except for retry actions)
            if (action !== 'retry') {
                removeNotification(id);
            }
        },
        [removeNotification]
    );

    return {
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        handleAction,
    };
};

/**
 * Network status indicator component
 */
export const NetworkStatusIndicator: React.FC<{
    networkStatus: 'online' | 'offline' | 'slow';
    className?: string;
}> = ({ networkStatus, className = '' }) => {
    if (networkStatus === 'online') {
        return null; // Don't show anything when online
    }

    return (
        <div
            className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm ${
                networkStatus === 'offline'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
            } ${className}`}
            role='status'
            aria-live='polite'
        >
            {networkStatus === 'offline' ? (
                <WifiOff className='size-4' />
            ) : (
                <Wifi className='size-4' />
            )}
            <span>
                {networkStatus === 'offline'
                    ? 'You are offline'
                    : 'Slow connection detected'}
            </span>
        </div>
    );
};

interface ServiceHealth {
    isHealthy: boolean;
    totalProviders: number;
    healthyProviders: number;
    disabledProviders?: number;
    circuitBreakerStatus?: Record<string, string>;
    errorRate?: number;
}

/**
 * Service health indicator component
 */
export const ServiceHealthIndicator: React.FC<{
    health: ServiceHealth | null | undefined;
    className?: string;
}> = ({ health, className = '' }) => {
    if (!health || health.isHealthy) {
        return null;
    }

    const getHealthColor = () => {
        if (health.healthyProviders === 0) {
            return 'text-red-600 dark:text-red-400';
        }
        if (health.healthyProviders < health.totalProviders / 2) {
            return 'text-yellow-600 dark:text-yellow-400';
        }
        return 'text-green-600 dark:text-green-400';
    };

    return (
        <div
            className={`flex items-center space-x-2 rounded-md bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800 ${className}`}
            role='status'
            aria-live='polite'
        >
            <div
                className={`size-2 rounded-full ${getHealthColor().replace('text-', 'bg-')}`}
            />
            <span className={getHealthColor()}>
                {health.healthyProviders} of {health.totalProviders} services
                available
            </span>
        </div>
    );
};
