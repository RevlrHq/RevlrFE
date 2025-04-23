'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';

const tabs = [
    { name: 'Insights', path: '/dashboard/payment/insights' },
    { name: 'Order History', path: '/dashboard/payment/order-history' },
    { name: 'Payout Management', path: '/dashboard/payment/payout-management' },
];

const DashboardPaymentTabs = () => {
    const pathname = usePathname();
    const router = useRouter();
    return (
        <div className='flex border-b border-[#E4E6EB] bg-white px-4 pb-0 pt-8'>
            {tabs.map((tab) => {
                const isActive = pathname === tab.path;

                return (
                    <button
                        key={tab.name}
                        onClick={() => router.push(tab.path)}
                        className={clsx(
                            'relative mr-6 pb-4 font-inter text-sm font-normal transition-colors',
                            isActive
                                ? 'text-revlr-primary-blue'
                                : 'text-[#374252]'
                        )}
                    >
                        {tab.name}
                        {isActive && (
                            <div className='absolute bottom-0 left-0 h-0.5 w-full bg-revlr-primary-blue' />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default DashboardPaymentTabs;
