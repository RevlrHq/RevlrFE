/**
 * Offline indicator component for graceful degradation
 */

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface OfflineIndicatorProps {
    showWhenOnline?: boolean;
    className?: string;
    onRetryConnection?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
    showWhenOnline = false,
    className = '',
    onRetryConnection,
}) => {
    const isOnline = useOnlineStatus();
    const [wasOffline, setWasOffline] = useState(false);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        if (!isOnline) {
            setWasOffline(true);
        } else if (wasOffline) {
            setShowReconnected(true);
            const timer = setTimeout(() => {
                setShowReconnected(false);
                setWasOffline(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, wasOffline]);

    // Show reconnected message
    if (showReconnected && isOnline) {
        return (
            <Alert className={`border-green-500 bg-green-50 text-green-800 ${className}`}>
                <Wifi className="h-4 w-4 text-green-600" />
                <AlertDescription className="flex items-center justify-between">
                    <span>Connection restored! You're back online.</span>
                    {onRetryConnection && (
                        <Button
                            onClick={onRetryConnection}
                            variant="outline"
                            size="sm"
                            className="ml-2"
                        >
                            Refresh Data
                        </Button>
                    )}
                </AlertDescription>
            </Alert>
        );
    }

    // Show offline message
    if (!isOnline) {
        return (
            <Alert variant="destructive" className={className}>
                <WifiOff className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                    <div>
                        <div className="font-medium">You're offline</div>
                        <div className="text-sm opacity-90">
                            Some features may not work properly. Check your internet connection.
                        </div>
                    </div>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        size="sm"
                        className="ml-2"
                    >
                        Retry
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    // Show online status if requested
    if (showWhenOnline) {
        return (
            <Alert className={`border-green-500 bg-green-50 text-green-800 ${className}`}>
                <Wifi className="h-4 w-4 text-green-600" />
                <AlertDescription>
                    Connected
                </AlertDescription>
            </Alert>
        );
    }

    return null;
};

/**
 * Hook for offline-aware data fetching
 */
export const useOfflineAwareFetch = () => {
    const isOnline = useOnlineStatus();
    const [offlineData, setOfflineData] = useState<Map<string, any>>(new Map());

    const fetchWithOfflineSupport = async <T>(
        key: string,
        fetchFn: () => Promise<T>,
        fallbackData?: T
    ): Promise<T> => {
        if (!isOnline) {
            // Return cached data if available
            if (offlineData.has(key)) {
                return offlineData.get(key);
            }
            
            // Return fallback data if provided
            if (fallbackData !== undefined) {
                return fallbackData;
            }
            
            throw new Error('No internet connection and no cached data available');
        }

        try {
            const data = await fetchFn();
            // Cache the data for offline use
            setOfflineData(prev => new Map(prev).set(key, data));
            return data;
        } catch (error) {
            // If online but fetch fails, try to return cached data
            if (offlineData.has(key)) {
                return offlineData.get(key);
            }
            throw error;
        }
    };

    const clearOfflineCache = (key?: string) => {
        if (key) {
            setOfflineData(prev => {
                const newMap = new Map(prev);
                newMap.delete(key);
                return newMap;
            });
        } else {
            setOfflineData(new Map());
        }
    };

    return {
        isOnline,
        fetchWithOfflineSupport,
        clearOfflineCache,
        hasOfflineData: (key: string) => offlineData.has(key),
    };
};