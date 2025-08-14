'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@src/stores/authStore';
import { DraftBackupService } from '@lib/services/DraftBackupService';

interface VendorAuthGuardProps {
    children: ReactNode;
    fallbackPath?: string;
    requireVendor?: boolean;
}

interface VendorAuthGuardState {
    isLoading: boolean;
    isAuthorized: boolean;
    error: string | null;
}

export const VendorAuthGuard = ({
    children,
    fallbackPath = '/auth/login',
    requireVendor = true,
}: VendorAuthGuardProps) => {
    const router = useRouter();
    const { user, isAuthenticated, token, _hasHydrated } = useAuthStore();
    const [state, setState] = useState<VendorAuthGuardState>({
        isLoading: true,
        isAuthorized: false,
        error: null,
    });

    useEffect(() => {
        const checkVendorAccess = async () => {
            try {
                // Wait for the auth store to hydrate from localStorage
                if (!_hasHydrated) {
                    setState((prev) => ({ ...prev, isLoading: true }));
                    return;
                }

                // Check if user is authenticated
                if (!isAuthenticated || !user || !token) {
                    setState({
                        isLoading: false,
                        isAuthorized: false,
                        error: 'Authentication required',
                    });

                    // Save any draft data before redirecting
                    if (typeof window !== 'undefined') {
                        DraftBackupService.saveDraftOnAuthExpiration();
                    }

                    // Redirect to login with return URL
                    const currentPath = window.location.pathname;
                    router.push(
                        `${fallbackPath}?returnUrl=${encodeURIComponent(currentPath)}`
                    );
                    return;
                }

                // Check vendor status if required
                if (requireVendor && !user.isOrganizer) {
                    setState({
                        isLoading: false,
                        isAuthorized: false,
                        error: 'Vendor access required',
                    });

                    // Redirect to vendor access page
                    router.push('/dashboard/vendor-access');
                    return;
                }

                // User is authorized
                setState({
                    isLoading: false,
                    isAuthorized: true,
                    error: null,
                });
            } catch (error) {
                console.error('Vendor auth check failed:', error);
                setState({
                    isLoading: false,
                    isAuthorized: false,
                    error: 'Authentication check failed',
                });
            }
        };

        checkVendorAccess();
    }, [
        isAuthenticated,
        user,
        token,
        requireVendor,
        router,
        fallbackPath,
        _hasHydrated,
    ]);

    // Show loading state
    if (state.isLoading) {
        return (
            <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
                <div className='text-center'>
                    <div className='mx-auto size-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent'></div>
                    <p className='mt-4 text-sm text-gray-600 dark:text-gray-400'>
                        Verifying access...
                    </p>
                </div>
            </div>
        );
    }

    // Show error state (this shouldn't render as we redirect on error)
    if (!state.isAuthorized) {
        return (
            <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
                <div className='text-center'>
                    <div className='mx-auto size-16 rounded-full bg-red-100 p-4 dark:bg-red-900/20'>
                        <svg
                            className='size-8 text-red-600 dark:text-red-400'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                            />
                        </svg>
                    </div>
                    <h3 className='mt-4 text-lg font-medium text-gray-900 dark:text-white'>
                        Access Denied
                    </h3>
                    <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                        {state.error}
                    </p>
                </div>
            </div>
        );
    }

    // Render protected content
    return <>{children}</>;
};

export default VendorAuthGuard;
