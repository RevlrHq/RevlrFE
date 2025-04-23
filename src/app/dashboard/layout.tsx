import Sidebar from '@features/dashboard/components/Sidebar';
import DashboardHeader from '@features/dashboard/components/DashboardHeader';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className='flex h-screen bg-gray-50'>
            <Sidebar />

            <div className='flex flex-1 flex-col overflow-hidden'>
                <DashboardHeader />

                <main className='overflow-y-auto'>{children}</main>
            </div>
        </div>
    );
}
