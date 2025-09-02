'use client';

import { SettingsPage } from '@features/settings';
import { useAuthStore } from '@src/stores/authStore';
import { DashboardErrorBoundary } from '@components/error-handling/DashboardErrorBoundary';

const page = () => {
    const { user } = useAuthStore();

    return (
        <DashboardErrorBoundary
            section='Settings'
            showDetails={process.env.NODE_ENV === 'development'}
        >
            <SettingsPage user={user} />
        </DashboardErrorBoundary>
    );
};

export default page;
