'use client';

import { ComponentType } from 'react';
import VendorAuthGuard from './VendorAuthGuard';

interface WithVendorAuthOptions {
    requireVendor?: boolean;
    fallbackPath?: string;
}

/**
 * Higher-order component that wraps a component with vendor authentication
 * @param WrappedComponent - The component to protect
 * @param options - Configuration options for the auth guard
 * @returns Protected component
 */
export function withVendorAuth<P extends object>(
    WrappedComponent: ComponentType<P>,
    options: WithVendorAuthOptions = {}
) {
    const { requireVendor = true, fallbackPath = '/auth/login' } = options;

    const WithVendorAuthComponent = (props: P) => {
        return (
            <VendorAuthGuard
                requireVendor={requireVendor}
                fallbackPath={fallbackPath}
            >
                <WrappedComponent {...props} />
            </VendorAuthGuard>
        );
    };

    // Set display name for debugging
    WithVendorAuthComponent.displayName = `withVendorAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

    return WithVendorAuthComponent;
}

export default withVendorAuth;
