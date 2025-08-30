import React from 'react';
import { CSPostHogProvider } from './PostHugProvider';
import { SignalRProvider } from './SignalRProvider';
import { ThemeProvider } from '../lib/ThemeContext';
import { VendorAuthProvider } from './VendorAuthProvider';
import { MediaProviderInitializationProvider } from './MediaProviderInitializationProvider';
import { AuthProvider } from './AuthProvider';
import { NavigationServiceInitializer } from '../components/NavigationServiceInitializer';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <CSPostHogProvider>
                    <VendorAuthProvider>
                        <MediaProviderInitializationProvider>
                            <SignalRProvider>
                                <NavigationServiceInitializer />
                                {children}
                            </SignalRProvider>
                        </MediaProviderInitializationProvider>
                    </VendorAuthProvider>
                </CSPostHogProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
