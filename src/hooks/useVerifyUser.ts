import { useRevlrService } from './useChitService';
import { PasswordlessAuthService, StandardResponseOfUserView } from '@lib/api';
import { useState } from 'react';

interface UseVerifyUserHookReturn {
    isLoading: boolean;
    isSuccess: boolean;
    error: Error | null;
    execute: (
        email: string,
        token: string,
        firstName: string,
        lastName: string,
        isOrganizer: boolean
    ) => Promise<StandardResponseOfUserView | undefined>;
    reset: () => void;
}

export const useVerifyUser = (): UseVerifyUserHookReturn => {
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const { execute, isLoading } = useRevlrService({
        service: PasswordlessAuthService,
        selector: (service) => service.postApiPasswordlessAuthVerify,
        mode: 'query',
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
                const response = await execute({
                    requestBody: {
                        email,
                        token,
                        firstName,
                        lastName,
                        isOrganizer,
                    },
                });
                setIsSuccess(true);
                return response;
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
                setIsSuccess(false);
            }
        },
    };
};
