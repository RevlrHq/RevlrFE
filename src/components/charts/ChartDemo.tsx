'use client';

import React, { useState } from 'react';
import {
    RevenueChart,
    EventPerformanceChart,
    AttendeeAnalyticsChart,
} from '@/components/charts';
import {
    generateMockMonthlyRevenue,
    generateMockEventSummaryView,
    generateMockAttendeeAnalyticsView,
} from '@/tests/utils/chartTestUtils';

export const ChartDemo: React.FC = () => {
    const [isDark, setIsDark] = useState(false);

    const revenueData = generateMockMonthlyRevenue(12);
    const eventData = generateMockEventSummaryView(10);
    const attendeeData = generateMockAttendeeAnalyticsView();

    return (
        <div
            className={`space-y-8 p-8 ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}
        >
            <div className='flex items-center justify-between'>
                <h1 className='text-3xl font-bold text-foreground'>
                    Chart Components Demo
                </h1>
                <button
                    onClick={() => setIsDark(!isDark)}
                    className='rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90'
                >
                    Toggle {isDark ? 'Light' : 'Dark'} Mode
                </button>
            </div>

            <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
                {/* Revenue Chart */}
                <div className='space-y-4'>
                    <h2 className='text-xl font-semibold text-foreground'>
                        Revenue Chart
                    </h2>
                    <RevenueChart
                        data={revenueData}
                        isDark={isDark}
                        height={300}
                        showEventCount={false}
                    />
                </div>

                {/* Revenue Chart with Event Count */}
                <div className='space-y-4'>
                    <h2 className='text-xl font-semibold text-foreground'>
                        Revenue Chart with Event Count
                    </h2>
                    <RevenueChart
                        data={revenueData}
                        isDark={isDark}
                        height={300}
                        showEventCount={true}
                    />
                </div>

                {/* Event Performance Chart */}
                <div className='space-y-4'>
                    <h2 className='text-xl font-semibold text-foreground'>
                        Event Performance Chart
                    </h2>
                    <EventPerformanceChart
                        data={eventData}
                        isDark={isDark}
                        height={400}
                        metric='both'
                        maxEvents={8}
                    />
                </div>

                {/* Attendee Analytics Doughnut */}
                <div className='space-y-4'>
                    <h2 className='text-xl font-semibold text-foreground'>
                        Attendee Analytics (Doughnut)
                    </h2>
                    <AttendeeAnalyticsChart
                        data={attendeeData}
                        isDark={isDark}
                        height={300}
                        chartType='doughnut'
                        showSpending={false}
                    />
                </div>

                {/* Attendee Analytics Bar */}
                <div className='space-y-4 lg:col-span-2'>
                    <h2 className='text-xl font-semibold text-foreground'>
                        Attendee Analytics (Bar Chart with Spending)
                    </h2>
                    <AttendeeAnalyticsChart
                        data={attendeeData}
                        isDark={isDark}
                        height={300}
                        chartType='bar'
                        showSpending={true}
                    />
                </div>
            </div>

            {/* Empty State Examples */}
            <div className='space-y-4'>
                <h2 className='text-xl font-semibold text-foreground'>
                    Empty State Examples
                </h2>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <RevenueChart data={[]} isDark={isDark} height={200} />
                    <EventPerformanceChart
                        data={[]}
                        isDark={isDark}
                        height={200}
                    />
                    <AttendeeAnalyticsChart
                        data={{ attendeeSegments: [] } as any}
                        isDark={isDark}
                        height={200}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChartDemo;
