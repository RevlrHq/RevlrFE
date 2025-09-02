import { useState, useEffect, useCallback } from 'react';
import { accountService } from '../../services/AccountService';
import { useToast } from '@/hooks/use-toast';
import type {
    AccountDeletionRequest,
    AccountDeletionConfirmation,
} from '../types';

interface UseAccountDeletionReturn {
    deletionRequest: AccountDeletionRequest | null;
    hasActiveSubscription: boolean;
    isLoading: boolean;
    error: string | null;
    requestDeletion: (
        confirmation?: AccountDeletionConfirmation
    ) => Promise<void>;
    cancelDeletion: () => Promise<void>;
    exportData: () => Promise<void>;
    refreshStatus: () => Promise<void>;
}

/**
 * Hook for managing account deletion workflow
 *
 * Handles deletion requests, cancellation, and related operations
 * Requirements: 7.1, 7.2, 7.3, 7.5
 */
export function useAccountDeletion(): UseAccountDeletionReturn {
    const { toast } = useToast();
    const [deletionRequest, setDeletionRequest] =
        useState<AccountDeletionRequest | null>(null);
    const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            setError(null);

            // Fetch deletion request and subscription status in parallel
            const [deletionReq, hasSubscription] = await Promise.all([
                accountService.getDeletionRequest(),
                accountService.hasActiveSubscription(),
            ]);

            setDeletionRequest(deletionReq);
            setHasActiveSubscription(hasSubscription);
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch account status';
            setError(errorMessage);
            console.error('Error fetching account status:', err);
        }
    }, []);

    const requestDeletion = useCallback(
        async (confirmation?: AccountDeletionConfirmation) => {
            if (!confirmation) {
                // If no confirmation provided, this is just opening the dialog
                // The actual deletion will be handled by the dialog component
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const request =
                    await accountService.requestAccountDeletion(confirmation);
                setDeletionRequest(request);

                toast({
                    title: 'Deletion requested',
                    description:
                        'Your account deletion has been scheduled. Check your email for confirmation.',
                });
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to request account deletion';
                setError(errorMessage);

                toast({
                    title: 'Error',
                    description: errorMessage,
                    variant: 'destructive',
                });

                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [toast]
    );

    const cancelDeletion = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            await accountService.cancelAccountDeletion();
            setDeletionRequest(null);

            toast({
                title: 'Deletion cancelled',
                description:
                    'Your account deletion request has been cancelled.',
            });
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to cancel deletion';
            setError(errorMessage);

            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });

            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const exportData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            await accountService.requestDataExport();

            toast({
                title: 'Export requested',
                description:
                    "Your data export has been requested. You will receive an email when it's ready.",
            });
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to request data export';
            setError(errorMessage);

            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });

            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const refreshStatus = useCallback(async () => {
        await fetchStatus();
    }, [fetchStatus]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return {
        deletionRequest,
        hasActiveSubscription,
        isLoading,
        error,
        requestDeletion,
        cancelDeletion,
        exportData,
        refreshStatus,
    };
}
