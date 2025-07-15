import React from 'react';
import { CSPostHogProvider } from './PostHugProvider';
import { SignalRProvider } from './SignalRProvider';
import { ThemeProvider } from '../lib/ThemeContext';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <CSPostHogProvider>
                <SignalRProvider>{children}</SignalRProvider>
            </CSPostHogProvider>
        </ThemeProvider>
    );
}
