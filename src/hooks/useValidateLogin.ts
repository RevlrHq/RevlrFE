import { useRevlrService } from './useChitService';
import { PasswordlessAuthService } from '@lib/services';
import { useState } from 'react';

interface UseValidateLoginHookReturn {
    isLoading: boolean;
    isSuccess: boolean;
    error: Error | null;
    execute: (email: string, token: string) => Promise<void>;
    reset: () => void;
}

export const useValidateLogin = (): UseValidateLoginHookReturn => {
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const { execute, isLoading } = useRevlrService({
        service: PasswordlessAuthService,
        selector: (service) => service.postApiPasswordlessAuthLoginValidate,
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
        execute: async (email: string, token: string) => {
            try {
                reset();
                await execute({ email, token });
                setIsSuccess(true);
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
                setIsSuccess(false);
            }
        },
    };
};
