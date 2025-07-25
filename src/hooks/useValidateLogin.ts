import { StandardResponseOfUserView } from '@lib/services';
import { useState } from 'react';
import axios from 'axios';

interface UseValidateLoginHookReturn {
    isLoading: boolean;
    isSuccess: boolean;
    error: Error | null;
    execute: (
        email: string,
        token: string
    ) => Promise<StandardResponseOfUserView | null>;
    reset: () => void;
}

export const useValidateLogin = (): UseValidateLoginHookReturn => {
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const reset = () => {
        setIsSuccess(false);
        setError(null);
        setIsLoading(false);
    };

    return {
        isLoading,
        isSuccess,
        error,
        reset,
        execute: async (
            email: string,
            token: string
        ): Promise<StandardResponseOfUserView | null> => {
            try {
                reset();
                setIsLoading(true);

                // Build URL manually to avoid double-encoding the token
                const baseUrl =
                    process.env.NEXT_PUBLIC_API_URL ||
                    'https://revlr-api-dev-g6dtb4cebbfpfgcv.canadacentral-01.azurewebsites.net';

                // Manually construct query string with proper encoding only for email
                const url = `${baseUrl}/api/PasswordlessAuth/login/validate?token=${token}&email=${encodeURIComponent(email)}`;

                const response = await axios.post(url, null, {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                });

                setIsSuccess(true);
                setIsLoading(false);
                return response.data;
            } catch (err) {
                console.error('API call error:', err);
                if (axios.isAxiosError(err)) {
                    console.error('Response status:', err.response?.status);
                    console.error(
                        'Response data:',
                        JSON.stringify(err.response?.data, null, 2)
                    );
                    console.error(
                        'Response headers:',
                        JSON.stringify(err.response?.headers, null, 2)
                    );
                }
                setError(err instanceof Error ? err : new Error(String(err)));
                setIsSuccess(false);
                setIsLoading(false);
                return null;
            }
        },
    };
};
