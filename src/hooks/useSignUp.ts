import { useRevlrService } from './useChitService';
import { useState } from 'react';
import { PasswordlessAuthService } from '@lib/services';

interface UseSignUpHookReturn {
    isLoading: boolean;
    isSuccess: boolean;
    error: Error | null;
    execute: (email: string) => Promise<void>;
    reset: () => void;
}

export const useSignUp = (): UseSignUpHookReturn => {
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const { execute, isLoading } = useRevlrService({
        service: PasswordlessAuthService,
        selector: (service) => service.postApiPasswordlessAuthRegister,
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
        execute: async (email: string) => {
            try {
                reset();
                await execute({ email });
                setIsSuccess(true);
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
                setIsSuccess(false);
            }
        },
    };
};
