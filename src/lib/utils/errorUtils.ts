/**
 * Utility functions for handling API errors
 */

/**
 * Extracts a user-friendly error message from various error types
 * @param error - The error object (could be string, Error, or ApiError)
 * @returns A user-friendly error message string
 */
export const extractErrorMessage = (error: unknown): string => {
    if (typeof error === 'string') {
        return error;
    }

    if (error instanceof Error) {
        // Check if it's an ApiError with a body containing the actual error message
        if ('body' in error && error.body) {
            // Try to extract error message from API response body
            if (typeof error.body === 'string') {
                return error.body;
            } else if (typeof error.body === 'object' && error.body !== null) {
                // Common API error response patterns
                const errorBody = error.body as {
                    message?: string;
                    error?: string;
                    detail?: string;
                    title?: string;
                };
                return (
                    errorBody.message ||
                    errorBody.error ||
                    errorBody.detail ||
                    errorBody.title ||
                    JSON.stringify(errorBody)
                );
            }
        }
        return error.message;
    }

    return 'An error occurred. Please try again.';
};

/**
 * Checks if an error is an API error with a specific status code
 * @param error - The error object
 * @param statusCode - The status code to check for
 * @returns True if the error is an ApiError with the specified status code
 */
export const isApiErrorWithStatus = (
    error: unknown,
    statusCode: number
): boolean => {
    return (
        error instanceof Error &&
        'status' in error &&
        error.status === statusCode
    );
};

/**
 * Checks if an error is a network/connection error
 * @param error - The error object
 * @returns True if the error appears to be a network error
 */
export const isNetworkError = (error: unknown): boolean => {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (
            message.includes('network') ||
            message.includes('connection') ||
            message.includes('timeout') ||
            message.includes('fetch')
        );
    }
    return false;
};
