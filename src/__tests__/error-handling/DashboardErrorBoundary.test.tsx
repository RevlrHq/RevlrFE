/**
 * Tests for DashboardErrorBoundary component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardErrorBoundary } from '@/components/error-handling/DashboardErrorBoundary';
import { errorLogger } from '@/lib/error-handling/ErrorLogger';

// Mock the error logger
jest.mock('@/lib/error-handling/ErrorLogger', () => ({
    errorLogger: {
        logComponentError: jest.fn(),
    },
}));

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
    },
});

// Mock alert
global.alert = jest.fn();

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({
    shouldThrow = true,
}) => {
    if (shouldThrow) {
        throw new Error('Test error message');
    }
    return <div>No error</div>;
};

describe('DashboardErrorBoundary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Suppress console.error for these tests
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Error Handling', () => {
        it('should render children when there is no error', () => {
            render(
                <DashboardErrorBoundary section='Test Section'>
                    <ThrowError shouldThrow={false} />
                </DashboardErrorBoundary>
            );

            expect(screen.getByText('No error')).toBeInTheDocument();
        });

        it('should render error UI when child component throws', () => {
            render(
                <DashboardErrorBoundary section='Test Section'>
                    <ThrowError />
                </DashboardErrorBoundary>
            );

            expect(screen.getByText('Test Section Error')).toBeInTheDocument();
            expect(screen.getByText(/Test error message/)).toBeInTheDocument();
        });

        it('should render custom fallback when provided', () => {
            const customFallback = <div>Custom error fallback</div>;

            render(
                <DashboardErrorBoundary
                    section='Test Section'
                    fallback={customFallback}
                >
                    <ThrowError />
                </DashboardErrorBoundary>
            );

            expect(
                screen.getByText('Custom error fallback')
            ).toBeInTheDocument();
            expect(
                screen.queryByText('Test Section Error')
            ).not.toBeInTheDocument();
        });
    });

    describe('Error Messages', () => {
        const errorMessageTests = [
            {
                error: new Error('Network error occurred'),
                expectedMessage:
                    'Unable to connect to the server. Please check your internet connection and try again.',
            },
            {
                error: new Error('401 Unauthorized'),
                expectedMessage:
                    'Your session has expired. Please refresh the page to log in again.',
            },
            {
                error: new Error('403 Forbidden'),
                expectedMessage:
                    "You don't have permission to access this information.",
            },
            {
                error: new Error('404 Not found'),
                expectedMessage:
                    'The requested information could not be found.',
            },
            {
                error: new Error('Request timeout'),
                expectedMessage:
                    'The request took too long to complete. Please try again.',
            },
            {
                error: new Error('500 Server error'),
                expectedMessage:
                    'A server error occurred. Our team has been notified and is working on a fix.',
            },
            {
                error: new Error('Unknown error'),
                expectedMessage: 'Unknown error',
            },
        ];

        errorMessageTests.forEach(({ error, expectedMessage }) => {
            it(`should display user-friendly message for: ${error.message}`, () => {
                const ThrowSpecificError = () => {
                    throw error;
                };

                render(
                    <DashboardErrorBoundary section='Test Section'>
                        <ThrowSpecificError />
                    </DashboardErrorBoundary>
                );

                expect(screen.getByText(expectedMessage)).toBeInTheDocument();
            });
        });
    });

    describe('Retry Functionality', () => {
        it('should call onRetry when retry button is clicked', async () => {
            const onRetry = jest.fn();

            render(
                <DashboardErrorBoundary
                    section='Test Section'
                    onRetry={onRetry}
                >
                    <ThrowError />
                </DashboardErrorBoundary>
            );

            const retryButton = screen.getByText(/Try Again/);
            fireEvent.click(retryButton);

            expect(onRetry).toHaveBeenCalledTimes(1);
        });

        it('should reset error state after retry', async () => {
            const onRetry = jest.fn();
            let shouldThrow = true;

            const ConditionalThrow = () => {
                if (shouldThrow) {
                    throw new Error('Test error');
                }
                return <div>Success after retry</div>;
            };

            const { rerender } = render(
                <DashboardErrorBoundary
                    section='Test Section'
                    onRetry={onRetry}
                >
                    <ConditionalThrow />
                </DashboardErrorBoundary>
            );

            expect(screen.getByText('Test Section Error')).toBeInTheDocument();

            const retryButton = screen.getByText(/Try Again/);
            fireEvent.click(retryButton);

            // Simulate successful retry
            shouldThrow = false;

            await waitFor(() => {
                rerender(
                    <DashboardErrorBoundary
                        section='Test Section'
                        onRetry={onRetry}
                    >
                        <ConditionalThrow />
                    </DashboardErrorBoundary>
                );
            });

            await waitFor(() => {
                expect(
                    screen.getByText('Success after retry')
                ).toBeInTheDocument();
            });
        });

        it('should disable retry button after max attempts', () => {
            render(
                <DashboardErrorBoundary section='Test Section'>
                    <ThrowError />
                </DashboardErrorBoundary>
            );

            const retryButton = screen.getByText(/Try Again/);

            // Click retry button 3 times (max attempts)
            fireEvent.click(retryButton);
            fireEvent.click(retryButton);
            fireEvent.click(retryButton);

            expect(retryButton).toBeDisabled();
            expect(screen.getByText(/Need Help\?/)).toBeInTheDocument();
        });

        it('should show retry count', () => {
            render(
                <DashboardErrorBoundary section='Test Section'>
                    <ThrowError />
                </DashboardErrorBoundary>
            );

            const retryButton = screen.getByText(/Try Again/);
            fireEvent.click(retryButton);

            expect(
                screen.getByText(/Try Again \(2 left\)/)
            ).toBeInTheDocument();
        });
    });

    describe('Additional Actions', () => {
        it('should refresh page when refresh button is clicked', () => {
            const mockReload = jest.fn();
            Object.defineProperty(window, 'location', {
                value: { reload: mockReload },
                writable: true,
            });

            render(
                <DashboardErrorBoundary section='Test Section'>
                    <ThrowError />
                </DashboardErrorBoundary>
            );

            const refreshButton = screen.getByText(/Refresh Page/);
            fireEvent.click(refreshButton);

            expect(mockReload).toHaveBeenCalledTimes(1);
        });

        it('should show error report button in development', () => {
            const originalEnv = process.env.NODE_ENV;
            Object.defineProperty(process.env, 'NODE_ENV', {
                value: 'development',
                writable: true,
            });

            render(
                <DashboardErrorBoundary section='Test Section'>
                    <ThrowError />
                </DashboardErrorBoundary>
            );

            expect(screen.getByText(/Copy Error Report/)).toBeInTheDocument();

            Object.defineProperty(process.env, 'NODE_ENV', {
                value: originalEnv,
                writable: true,
            });
        });

        it('should copy error report to clipboard', async () => {
            const originalEnv = process.env.NODE_ENV;
            Object.defineProperty(process.env, 'NODE_ENV', {
                value: 'development',
                writable: true,
            });

            render(
                <DashboardErrorBoundary section='Test Section'>
                    <ThrowError />
                </DashboardErrorBoundary>
            );

            const reportButton = screen.getByText(/Copy Error Report/);
            fireEvent.click(reportButton);

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                expect.stringContaining('Test error message')
            );
            expect(global.alert).toHaveBeenCalledWith(
                'Error report copied to clipboard. Please share this with support.'
            );

            Object.defineProperty(process.env, 'NODE_ENV', {
                value: originalEnv,
                writable: true,
            });
        });
    });

    describe('Technical Details', () => {
        it('should show technical details when showDetails is true', () => {
            render(
                <DashboardErrorBoundary
                    section='Test Section'
                    showDetails={true}
                >
                    <ThrowError />
                </DashboardErrorBoundary>
            );

            expect(screen.getByText('Technical Details')).toBeInTheDocument();
        });

        it('should hide technical details by default', () => {
            render(
                <DashboardErrorBoundary section='Test Section'>
                    <ThrowError />
                </DashboardErrorBoundary>
            );

            expect(
                screen.queryByText('Technical Details')
            ).not.toBeInTheDocument();
        });
    });

    describe('Error Logging Integration', () => {
        it('should log component errors', () => {
            render(
                <DashboardErrorBoundary section='Test Section'>
                    <ThrowError />
                </DashboardErrorBoundary>
            );

            expect(errorLogger.logComponentError).toHaveBeenCalledWith(
                expect.any(Error),
                'Test Section',
                expect.any(Object),
                expect.any(Object)
            );
        });

        it('should call custom onError handler', () => {
            const onError = jest.fn();

            render(
                <DashboardErrorBoundary
                    section='Test Section'
                    onError={onError}
                >
                    <ThrowError />
                </DashboardErrorBoundary>
            );

            expect(onError).toHaveBeenCalledWith(
                expect.any(Error),
                expect.any(Object)
            );
        });
    });

    describe('Styling and Accessibility', () => {
        it('should apply custom className', () => {
            const { container } = render(
                <DashboardErrorBoundary
                    section='Test Section'
                    className='custom-class'
                >
                    <ThrowError />
                </DashboardErrorBoundary>
            );

            expect(container.firstChild).toHaveClass('custom-class');
        });

        it('should have proper ARIA attributes', () => {
            render(
                <DashboardErrorBoundary section='Test Section'>
                    <ThrowError />
                </DashboardErrorBoundary>
            );

            const alert = screen.getByRole('alert');
            expect(alert).toBeInTheDocument();
        });
    });
});
