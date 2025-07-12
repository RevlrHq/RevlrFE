import { useRevlrService } from './useChitService';
import { PasswordlessAuthService } from '@lib/services/custom-index';
import { useState } from 'react';

interface UseEmailVerificationHookReturn {
    isLoading: boolean;
    isSuccess: boolean;
    error: Error | null;
    execute: (
        email: string,
        code: string,
        firstName: string,
        lastName: string,
        isOrganizer: boolean
    ) => Promise<void>;
    reset: () => void;
}

export const useEmailVerification = (): UseEmailVerificationHookReturn => {
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const { execute, isLoading } = useRevlrService({
        service: PasswordlessAuthService,
        selector: (service) => service.postApiPasswordlessAuthVerify,
        mode: 'mutation',
    });

    const reset = () => {
        setIsSuccess(false);
        setError(null);
    };

    return {
        isLoading,
        isSuccess,
        error,
        reset,
        execute: async (
            email: string,
            token: string,
            firstName: string,
            lastName: string,
            isOrganizer: boolean
        ) => {
            try {
                reset();
                await execute({
                    requestBody: {
                        email,
                        token,
                        firstName,
                        lastName,
                        isOrganizer,
                    },
                });
                setIsSuccess(true);
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
                setIsSuccess(false);
            }
        },
    };
};
