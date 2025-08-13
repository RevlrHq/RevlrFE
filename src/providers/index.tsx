import React from 'react';
import { CSPostHogProvider } from './PostHugProvider';
import { SignalRProvider } from './SignalRProvider';
import { ThemeProvider } from '../lib/ThemeContext';
import { VendorAuthProvider } from './VendorAuthProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <CSPostHogProvider>
                <VendorAuthProvider>
                    <SignalRProvider>{children}</SignalRProvider>
                </VendorAuthProvider>
            </CSPostHogProvider>
        </ThemeProvider>
    );
}
