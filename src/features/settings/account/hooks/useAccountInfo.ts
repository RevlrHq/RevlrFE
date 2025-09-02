import { useState, useEffect, useCallback } from 'react';
import { accountService } from '../../services/AccountService';
import type { AccountInfo } from '../types';

interface UseAccountInfoReturn {
    accountInfo: AccountInfo | null;
    isLoading: boolean;
    error: string | null;
    refreshAccountInfo: () => Promise<void>;
}

/**
 * Hook for managing account information
 *
 * Provides account details with refresh capability
 * Requirements: 7.1, 7.4
 */
export function useAccountInfo(): UseAccountInfoReturn {
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAccountInfo = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const info = await accountService.getAccountInfo();
            setAccountInfo(info);
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch account info';
            setError(errorMessage);
            console.error('Error fetching account info:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshAccountInfo = useCallback(async () => {
        await fetchAccountInfo();
    }, [fetchAccountInfo]);

    useEffect(() => {
        fetchAccountInfo();
    }, [fetchAccountInfo]);

    return {
        accountInfo,
        isLoading,
        error,
        refreshAccountInfo,
    };
}
