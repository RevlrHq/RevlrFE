import DashboardPaymentTabs from '@features/dashboard/components/DashboardPaymentTabs';

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='min-h-screen bg-gray-50'>
            <DashboardPaymentTabs />
            <main>{children}</main>
        </div>
    );
};

export default layout;
