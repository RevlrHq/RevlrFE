/**
 * Enhanced error boundary specifically for dashboard sections
 * Provides contextual error messages and recovery options
 */

import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { errorLogger } from '@/lib/error-handling/ErrorLogger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    onRetry?: () => void;
    section?: string;
    showDetails?: boolean;
    className?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    retryCount: number;
    isRetrying: boolean;
}

export class DashboardErrorBoundary extends Component<Props, State> {
    private retryTimeoutId: NodeJS.Timeout | null = null;

    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0,
            isRetrying: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ errorInfo });

        // Log the error
        errorLogger.logComponentError(
            error,
            this.props.section || 'DashboardSection',
            this.props,
            this.state
        );

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);
    }

    componentWillUnmount() {
        if (this.retryTimeoutId) {
            clearTimeout(this.retryTimeoutId);
        }
    }

    handleRetry = () => {
        const { onRetry } = this.props;
        const { retryCount } = this.state;

        // Limit retry attempts
        if (retryCount >= 3) {
            return;
        }

        this.setState({ isRetrying: true });

        // Call custom retry handler if provided
        if (onRetry) {
            onRetry();
        }

        // Reset error state after a short delay
        this.retryTimeoutId = setTimeout(() => {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                retryCount: retryCount + 1,
                isRetrying: false,
            });
        }, 1000);
    };

    handleReportError = () => {
        const { error, errorInfo } = this.state;
        if (!error) return;

        // Create error report
        const report = {
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
            },
            errorInfo,
            section: this.props.section,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
        };

        // Copy to clipboard
        navigator.clipboard
            .writeText(JSON.stringify(report, null, 2))
            .then(() => {
                alert(
                    'Error report copied to clipboard. Please share this with support.'
                );
            });
    };

    render() {
        const { hasError, error, errorInfo, retryCount, isRetrying } =
            this.state;
        const { children, fallback, section, showDetails, className } =
            this.props;

        if (hasError && error) {
            // Use custom fallback if provided
            if (fallback) {
                return fallback;
            }

            // Default error UI
            return (
                <Card className={`border-destructive/50 ${className || ''}`}>
                    <CardHeader className='pb-3'>
                        <CardTitle className='flex items-center gap-2 text-destructive'>
                            <AlertCircle className='size-5' />
                            {section
                                ? `${section} Error`
                                : 'Something went wrong'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <Alert variant='destructive'>
                            <AlertTitle>Error Details</AlertTitle>
                            <AlertDescription className='mt-2'>
                                {this.getErrorMessage(error)}
                            </AlertDescription>
                        </Alert>

                        {showDetails && errorInfo && (
                            <details className='text-sm'>
                                <summary className='mb-2 cursor-pointer font-medium'>
                                    Technical Details
                                </summary>
                                <pre className='max-h-32 overflow-auto rounded bg-muted p-3 text-xs'>
                                    {error.stack}
                                </pre>
                            </details>
                        )}

                        <div className='flex flex-wrap gap-2'>
                            <Button
                                onClick={this.handleRetry}
                                disabled={isRetrying || retryCount >= 3}
                                variant='outline'
                                size='sm'
                            >
                                {isRetrying ? (
                                    <>
                                        <RefreshCw className='mr-2 size-4 animate-spin' />
                                        Retrying...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className='mr-2 size-4' />
                                        Try Again{' '}
                                        {retryCount > 0 &&
                                            `(${3 - retryCount} left)`}
                                    </>
                                )}
                            </Button>

                            <Button
                                onClick={() => window.location.reload()}
                                variant='outline'
                                size='sm'
                            >
                                <Home className='mr-2 size-4' />
                                Refresh Page
                            </Button>

                            {process.env.NODE_ENV === 'development' && (
                                <Button
                                    onClick={this.handleReportError}
                                    variant='outline'
                                    size='sm'
                                >
                                    <Bug className='mr-2 size-4' />
                                    Copy Error Report
                                </Button>
                            )}
                        </div>

                        {retryCount >= 3 && (
                            <Alert>
                                <AlertTitle>Need Help?</AlertTitle>
                                <AlertDescription>
                                    If this problem persists, please contact
                                    support or try refreshing the page.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            );
        }

        return children;
    }

    private getErrorMessage(error: Error): string {
        // Provide user-friendly error messages
        const message = error.message.toLowerCase();

        if (message.includes('network') || message.includes('fetch')) {
            return 'Unable to connect to the server. Please check your internet connection and try again.';
        }

        if (message.includes('unauthorized') || message.includes('401')) {
            return 'Your session has expired. Please refresh the page to log in again.';
        }

        if (message.includes('forbidden') || message.includes('403')) {
            return "You don't have permission to access this information.";
        }

        if (message.includes('not found') || message.includes('404')) {
            return 'The requested information could not be found.';
        }

        if (message.includes('timeout')) {
            return 'The request took too long to complete. Please try again.';
        }

        if (message.includes('server') || message.includes('500')) {
            return 'A server error occurred. Our team has been notified and is working on a fix.';
        }

        // Return original message for unknown errors
        return error.message || 'An unexpected error occurred.';
    }
}
