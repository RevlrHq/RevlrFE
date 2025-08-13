'use client';

import { ReactNode } from 'react';
import UserSidebar from '../../../features/dashboard/components/UserSidebar';

interface UserDashboardLayoutProps {
    children: ReactNode;
}

const UserDashboardLayout = ({ children }: UserDashboardLayoutProps) => {
    return (
        <div className='flex h-screen bg-gray-50 dark:bg-revlr-dark-bg'>
            <UserSidebar />
            <main className='flex-1 overflow-y-auto'>{children}</main>
        </div>
    );
};

// This layout should not inherit from the parent dashboard layout
UserDashboardLayout.getLayout = (page: React.ReactElement) => page;

export default UserDashboardLayout;
