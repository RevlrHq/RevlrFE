'use client';

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/tabs';
import Insights from './components/Insights';
import OrderHistory from './components/OrderHistory';
import PayoutManagement from './components/PayoutManagement';

const Payment = () => {
    const [activeTab, setActiveTab] = useState('insights');

    return (
        <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full pt-4'
        >
            <TabsList className='w-full justify-start rounded-none border-b border-[#F2F3F5] bg-white pb-2'>
                <TabsTrigger
                    value='insights'
                    className={`pb-5 font-inter text-sm font-normal ${activeTab === 'insights' ? 'rounded-none border-b border-revlr-primary-blue !text-revlr-primary-blue' : 'text-[#374252]'}`}
                >
                    Insights
                </TabsTrigger>
                <TabsTrigger
                    value='order-history'
                    className={`pb-5 font-inter text-sm font-normal ${activeTab === 'order-history' ? 'rounded-none border-b border-revlr-primary-blue !text-revlr-primary-blue' : 'text-[#374252]'}`}
                >
                    Order History
                </TabsTrigger>
                <TabsTrigger
                    value='payout-management'
                    className={`pb-5 font-inter text-sm font-normal ${activeTab === 'payout-management' ? 'rounded-none border-b border-revlr-primary-blue !text-revlr-primary-blue' : 'text-[#374252]'}`}
                >
                    Payout Management
                </TabsTrigger>
            </TabsList>

            <TabsContent value='insights' className='py-8'>
                <Insights />
            </TabsContent>

            <TabsContent value='order-history' className='p-6'>
                <OrderHistory />
            </TabsContent>

            <TabsContent value='payout-management' className='p-6'>
                <PayoutManagement />
            </TabsContent>
        </Tabs>
    );
};

export default Payment;
