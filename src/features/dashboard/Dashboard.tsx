'use client';

import Sidebar from './components/Sidebar';
import DashboardHeader from './components/DashboardHeader';
import EventBoard from './EventBoard';
import Settings from './Settings';
import { usePathname } from 'next/navigation';

export default function Dashboard() {
    const pathname = usePathname();

    const renderContent = () => {
        switch (pathname) {
            case '/dashboard':
                return <EventBoard />;
            // case '/dashboard/payouts':
            //   return <PayoutsBoard />;
            case '/dashboard/settings':
                return <Settings />;
            default:
                return <EventBoard />;
        }
    };

    return (
        <div className='flex h-screen bg-gray-50'>
            <Sidebar />

            <div className='flex flex-1 flex-col'>
                {/* Header */}
                <DashboardHeader />

                {renderContent()}
            </div>
        </div>
    );
}
