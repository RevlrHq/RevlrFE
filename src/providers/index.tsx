import React from 'react';
import { CSPostHogProvider } from './PostHugProvider';
import { SignalRProvider } from './SignalRProvider';
export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <CSPostHogProvider>
            <SignalRProvider>{children}</SignalRProvider>
        </CSPostHogProvider>
    );
}
