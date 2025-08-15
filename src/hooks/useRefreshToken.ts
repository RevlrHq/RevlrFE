import { useState, useCallback } from 'react';
import { AuthService } from '@lib/services/AuthService';

interface UseRefreshTokenReturn {
    isRefreshing: boolean;
    refreshToken: () => Promise<boolean>;
    refreshTokenIfNeeded: () => Promise<boolean>;
    revokeRefreshToken: () => Promise<boolean>;
    error: string | null;
}

/**
 * Hook for managing refresh token operations
 */
export const useRefreshToken = (): UseRefreshTokenReturn => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshToken = useCallback(async (): Promise<boolean> => {
        if (isRefreshing) return false;

        setIsRefreshing(true);
        setError(null);

        try {
            const success = await AuthService.refreshToken();
            if (!success) {
                setError('Failed to refresh token');
            }
            return success;
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            return false;
        } finally {
            setIsRefreshing(false);
        }
    }, [isRefreshing]);

    const refreshTokenIfNeeded = useCallback(async (): Promise<boolean> => {
        if (isRefreshing) return false;

        setIsRefreshing(true);
        setError(null);

        try {
            const success = await AuthService.refreshTokenIfNeeded();
            if (!success) {
                setError('Failed to refresh token');
            }
            return success;
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            return false;
        } finally {
            setIsRefreshing(false);
        }
    }, [isRefreshing]);

    const revokeRefreshToken = useCallback(async (): Promise<boolean> => {
        setError(null);

        try {
            const success = await AuthService.revokeRefreshToken();
            if (!success) {
                setError('Failed to revoke refresh token');
            }
            return success;
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            return false;
        }
    }, []);

    return {
        isRefreshing,
        refreshToken,
        refreshTokenIfNeeded,
        revokeRefreshToken,
        error,
    };
};
