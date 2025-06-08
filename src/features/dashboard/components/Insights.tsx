'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    ReferenceLine,
    Label,
} from 'recharts';
import StatsCard from './StatsCard';

const Insights = () => {
    const revenueData = [
        { day: 'Mon', value: 10000 },
        { day: 'Tue', value: 25000, highlighted: true },
        { day: 'Wed', value: 15000 },
        { day: 'Thu', value: 10000 },
        { day: 'Fri', value: 20000 },
        { day: 'Sat', value: 12000 },
        { day: 'Sun', value: 18000 },
    ];

    const trafficData = [
        { name: 'Search Ads', value: 30 },
        { name: 'Social', value: 25 },
        { name: 'Social Media', value: 65 },
        { name: 'Word-of-mouth', value: 45 },
    ];

    const ticketTypeData = [
        { name: 'Early Bird', value: 30, color: '#3b82f6' },
        { name: 'General', value: 50, color: '#1d4ed8' },
        { name: 'VIP', value: 20, color: '#1e40af' },
    ];

    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const currentDay = 9;
    const peakDays = [1, 9, 23, 29];

    const highPeakDays = [9, 29];
    return (
        <div className='m-8 min-h-screen bg-gray-50 py-6'>
            <div className=''>
                <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                    <StatsCard
                        icon={
                            <svg
                                width='14'
                                height='14'
                                viewBox='0 0 14 14'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <rect
                                    width='14'
                                    height='14'
                                    rx='7'
                                    fill='#3D8BFF'
                                />
                                <path
                                    d='M7.12 6.51111C6.212 6.24889 5.92 5.97778 5.92 5.55556C5.92 5.07111 6.324 4.73333 7 4.73333C7.568 4.73333 7.852 4.97333 7.956 5.35556C8.004 5.53333 8.136 5.66667 8.304 5.66667H8.424C8.688 5.66667 8.876 5.37778 8.784 5.10222C8.616 4.57778 8.224 4.14222 7.6 3.97333V3.66667C7.6 3.29778 7.332 3 7 3C6.668 3 6.4 3.29778 6.4 3.66667V3.96C5.624 4.14667 5 4.70667 5 5.56444C5 6.59111 5.764 7.10222 6.88 7.4C7.88 7.66667 8.08 8.05778 8.08 8.47111C8.08 8.77778 7.884 9.26667 7 9.26667C6.34 9.26667 6 9.00444 5.868 8.63111C5.808 8.45778 5.672 8.33333 5.508 8.33333H5.396C5.128 8.33333 4.94 8.63556 5.04 8.91111C5.268 9.52889 5.8 9.89333 6.4 10.0356V10.3333C6.4 10.7022 6.668 11 7 11C7.332 11 7.6 10.7022 7.6 10.3333V10.0444C8.38 9.88 9 9.37778 9 8.46667C9 7.20444 8.028 6.77333 7.12 6.51111Z'
                                    fill='white'
                                />
                            </svg>
                        }
                        title='Total Revenue'
                        value='$26,000'
                        textColor='text-gray-900'
                    />
                    <StatsCard
                        icon={
                            <svg
                                width='16'
                                height='16'
                                viewBox='0 0 16 16'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M4.00016 14.0002H2.00016C1.82335 14.0002 1.65378 13.9299 1.52876 13.8049C1.40373 13.6799 1.3335 13.5103 1.3335 13.3335V8.00016C1.3335 7.82335 1.40373 7.65378 1.52876 7.52876C1.65378 7.40373 1.82335 7.3335 2.00016 7.3335H4.00016C4.17697 7.3335 4.34654 7.40373 4.47157 7.52876C4.59659 7.65378 4.66683 7.82335 4.66683 8.00016V13.3335C4.66683 13.5103 4.59659 13.6799 4.47157 13.8049C4.34654 13.9299 4.17697 14.0002 4.00016 14.0002ZM8.66683 14.0002H6.66683C6.49002 14.0002 6.32045 13.9299 6.19543 13.8049C6.0704 13.6799 6.00016 13.5103 6.00016 13.3335V2.00016C6.00016 1.82335 6.0704 1.65378 6.19543 1.52876C6.32045 1.40373 6.49002 1.3335 6.66683 1.3335H8.66683C8.84364 1.3335 9.01321 1.40373 9.13823 1.52876C9.26326 1.65378 9.3335 1.82335 9.3335 2.00016V13.3335C9.3335 13.5103 9.26326 13.6799 9.13823 13.8049C9.01321 13.9299 8.84364 14.0002 8.66683 14.0002ZM13.3335 14.0002H11.3335C11.1567 14.0002 10.9871 13.9299 10.8621 13.8049C10.7371 13.6799 10.6668 13.5103 10.6668 13.3335V6.00016C10.6668 5.82335 10.7371 5.65378 10.8621 5.52876C10.9871 5.40373 11.1567 5.3335 11.3335 5.3335H13.3335C13.5103 5.3335 13.6799 5.40373 13.8049 5.52876C13.9299 5.65378 14.0002 5.82335 14.0002 6.00016V13.3335C14.0002 13.5103 13.9299 13.6799 13.8049 13.8049C13.6799 13.9299 13.5103 14.0002 13.3335 14.0002Z'
                                    fill='#3D8BFF'
                                />
                            </svg>
                        }
                        title='Revenue Growth Rate'
                        value='+12%'
                        subtitle='This Week vs Last Week'
                        textColor='text-green-600'
                    />
                    <StatsCard
                        icon={
                            <svg
                                width='16'
                                height='16'
                                viewBox='0 0 16 16'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M14.6668 7.1665C14.9402 7.1665 15.1668 6.93984 15.1668 6.6665V5.99984C15.1668 3.05984 14.2735 2.1665 11.3335 2.1665H7.16683V3.6665C7.16683 3.93984 6.94016 4.1665 6.66683 4.1665C6.3935 4.1665 6.16683 3.93984 6.16683 3.6665V2.1665H4.66683C1.72683 2.1665 0.833496 3.05984 0.833496 5.99984V6.33317C0.833496 6.6065 1.06016 6.83317 1.3335 6.83317C1.9735 6.83317 2.50016 7.35984 2.50016 7.99984C2.50016 8.63984 1.9735 9.1665 1.3335 9.1665C1.06016 9.1665 0.833496 9.39317 0.833496 9.6665V9.99984C0.833496 12.9398 1.72683 13.8332 4.66683 13.8332H6.16683V12.3332C6.16683 12.0598 6.3935 11.8332 6.66683 11.8332C6.94016 11.8332 7.16683 12.0598 7.16683 12.3332V13.8332H11.3335C14.2735 13.8332 15.1668 12.9398 15.1668 9.99984C15.1668 9.7265 14.9402 9.49984 14.6668 9.49984C14.0268 9.49984 13.5002 8.97317 13.5002 8.33317C13.5002 7.69317 14.0268 7.1665 14.6668 7.1665ZM7.16683 9.4465C7.16683 9.71984 6.94016 9.9465 6.66683 9.9465C6.3935 9.9465 6.16683 9.71984 6.16683 9.4465V6.55317C6.16683 6.27984 6.3935 6.05317 6.66683 6.05317C6.94016 6.05317 7.16683 6.27984 7.16683 6.55317V9.4465Z'
                                    fill='#3D8BFF'
                                />
                            </svg>
                        }
                        title='Total Tickets Sold'
                        value='3,240'
                        textColor='text-gray-900'
                    />
                    <StatsCard
                        icon={
                            <svg
                                width='16'
                                height='16'
                                viewBox='0 0 16 16'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M13.333 2.00033H12.6663V1.33366C12.6663 0.966992 12.3663 0.666992 11.9997 0.666992C11.633 0.666992 11.333 0.966992 11.333 1.33366V2.00033H4.66634V1.33366C4.66634 0.966992 4.36634 0.666992 3.99967 0.666992C3.63301 0.666992 3.33301 0.966992 3.33301 1.33366V2.00033H2.66634C1.93301 2.00033 1.33301 2.60033 1.33301 3.33366V14.0003C1.33301 14.7337 1.93301 15.3337 2.66634 15.3337H13.333C14.0663 15.3337 14.6663 14.7337 14.6663 14.0003V3.33366C14.6663 2.60033 14.0663 2.00033 13.333 2.00033ZM12.6663 14.0003H3.33301C2.96634 14.0003 2.66634 13.7003 2.66634 13.3337V5.33366H13.333V13.3337C13.333 13.7003 13.033 14.0003 12.6663 14.0003Z'
                                    fill='#3D8BFF'
                                />
                            </svg>
                        }
                        title='Days to Event'
                        value='15'
                        textColor='text-gray-900'
                    />
                </div>

                <div className='mb-6 rounded-xl bg-white p-6 shadow-sm'>
                    <div className='mb-4 flex items-center justify-between'>
                        <h2 className='font-inter text-sm font-semibold text-[#001433]'>
                            Revenue Overview
                        </h2>
                        <div className='flex items-center justify-center gap-2 rounded-md border border-[#E4E6EB] bg-white px-2 py-1 font-inter text-xs font-medium text-[#001433] shadow-sm'>
                            <svg
                                width='16'
                                height='16'
                                viewBox='0 0 16 16'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M9.67041 4.94L6.61708 8L9.67041 11.06L8.73041 12L4.73041 8L8.73041 4L9.67041 4.94Z'
                                    fill='#1F2938'
                                />
                            </svg>
                            <span className='mr-2'>Daily</span>
                            <svg
                                width='16'
                                height='16'
                                viewBox='0 0 16 16'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M6.32959 4.94L9.38292 8L6.32959 11.06L7.26959 12L11.2696 8L7.26959 4L6.32959 4.94Z'
                                    fill='#1F2938'
                                />
                            </svg>
                        </div>
                    </div>

                    <div className='h-64'>
                        <ResponsiveContainer width='100%' height='100%'>
                            <LineChart
                                data={revenueData}
                                margin={{
                                    top: 5,
                                    right: 20,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray='3 3'
                                    vertical={false}
                                    stroke='#f0f0f0'
                                />
                                <XAxis
                                    dataKey='day'
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af' }}
                                    tickFormatter={(value) =>
                                        `${value / 1000}K`
                                    }
                                />
                                <Tooltip
                                    formatter={(value) => [
                                        `$${value}`,
                                        'Revenue',
                                    ]}
                                    labelStyle={{ color: '#6b7280' }}
                                    contentStyle={{
                                        borderRadius: '4px',
                                        border: 'none',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    }}
                                />
                                <Line
                                    type='monotone'
                                    dataKey='value'
                                    stroke='#3b82f6'
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{
                                        r: 6,
                                        fill: '#3b82f6',
                                        stroke: '#fff',
                                        strokeWidth: 2,
                                    }}
                                    fill='url(#colorUv)'
                                />

                                <ReferenceLine
                                    x='Tue'
                                    stroke='#3b82f6'
                                    strokeDasharray='3 3'
                                >
                                    <Label
                                        position='top'
                                        value='$25K'
                                        fill='#3b82f6'
                                        fontSize={12}
                                    />
                                </ReferenceLine>

                                <defs>
                                    <linearGradient
                                        id='colorUv'
                                        x1='0'
                                        y1='0'
                                        x2='0'
                                        y2='1'
                                    >
                                        <stop
                                            offset='5%'
                                            stopColor='#3b82f6'
                                            stopOpacity={0.1}
                                        />
                                        <stop
                                            offset='95%'
                                            stopColor='#3b82f6'
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <div className='rounded-lg bg-white p-4 shadow-sm'>
                        <div className='mb-4 flex items-center justify-between'>
                            <h2 className='font-inter text-sm font-semibold text-[#001433]'>
                                Peak Sales Day
                            </h2>
                            <div className='flex items-center justify-center gap-2 rounded-md border border-[#E4E6EB] bg-white px-2 py-1 font-inter text-xs font-medium text-[#001433] shadow-sm'>
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 16 16'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M9.67041 4.94L6.61708 8L9.67041 11.06L8.73041 12L4.73041 8L8.73041 4L9.67041 4.94Z'
                                        fill='#1F2938'
                                    />
                                </svg>

                                <span className='mx-2'>March</span>
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 16 16'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M6.32959 4.94L9.38292 8L6.32959 11.06L7.26959 12L11.2696 8L7.26959 4L6.32959 4.94Z'
                                        fill='#1F2938'
                                    />
                                </svg>
                            </div>
                        </div>

                        <div className='grid grid-cols-7 gap-1 text-center'>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(
                                (day, index) => (
                                    <div
                                        key={`day-${index}`}
                                        className='py-2 text-xs font-medium text-gray-500'
                                    >
                                        {day}
                                    </div>
                                )
                            )}

                            {days.map((day) => {
                                const isHighPeak = highPeakDays.includes(day);
                                const isPeak = peakDays.includes(day);
                                const isCurrent = day === currentDay;

                                let bgColor = 'bg-white';
                                if (isHighPeak) bgColor = 'bg-blue-500';
                                else if (isPeak) bgColor = 'bg-blue-400';

                                let textColor = 'text-gray-700';
                                if (isHighPeak || isPeak)
                                    textColor = 'text-white';

                                return (
                                    <div
                                        key={`calendar-day-${day}`}
                                        className={`flex aspect-square items-center justify-center rounded-md text-sm ${bgColor} ${textColor} ${isCurrent ? 'ring-2 ring-blue-500' : ''} `}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>

                        <div className='mt-6 flex gap-4'>
                            <div className='flex items-center'>
                                <div className='mr-2 size-3 rounded-sm bg-yellow-400'></div>
                                <span className='font-inter text-sm font-normal text-[#001433]'>
                                    Standard Peak Day
                                </span>
                            </div>
                            <div className='flex items-center'>
                                <div className='mr-2 size-3 rounded-sm bg-blue-500'></div>
                                <span className='font-inter text-sm font-normal text-[#001433]'>
                                    Peak Sales
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className='rounded-lg bg-white p-4 shadow-sm'>
                        <div className='mb-4 flex items-center justify-between'>
                            <h2 className='font-inter text-sm font-semibold text-[#001433]'>
                                Top Traffic Sources
                            </h2>
                            <div className='flex items-center justify-center gap-2 rounded-md border border-[#E4E6EB] bg-white px-2 py-1 font-inter text-xs font-medium text-[#001433] shadow-sm'>
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 16 16'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M9.67041 4.94L6.61708 8L9.67041 11.06L8.73041 12L4.73041 8L8.73041 4L9.67041 4.94Z'
                                        fill='#1F2938'
                                    />
                                </svg>
                                <span className='mr-2 text-sm text-gray-500'>
                                    March
                                </span>
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 16 16'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M6.32959 4.94L9.38292 8L6.32959 11.06L7.26959 12L11.2696 8L7.26959 4L6.32959 4.94Z'
                                        fill='#1F2938'
                                    />
                                </svg>
                            </div>
                        </div>

                        <div className='flex h-64 items-baseline'>
                            <ResponsiveContainer width='100%' height='100%'>
                                <BarChart
                                    data={trafficData}
                                    margin={{
                                        top: 20,
                                        right: 5,
                                        left: 5,
                                        bottom: 5,
                                    }}
                                >
                                    <XAxis
                                        dataKey='name'
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        formatter={(value) => [
                                            `${value}%`,
                                            'Traffic',
                                        ]}
                                        labelStyle={{ color: '#6b7280' }}
                                        contentStyle={{
                                            borderRadius: '4px',
                                            border: 'none',
                                            boxShadow:
                                                '0 2px 8px rgba(0,0,0,0.15)',
                                        }}
                                    />
                                    <Bar
                                        dataKey='value'
                                        fill='#3b82f6'
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className='rounded-lg bg-white p-4 shadow-sm md:col-span-2 lg:col-span-1'>
                        <div className='mb-4 flex items-center justify-between'>
                            <h2 className='font-inter text-sm font-semibold text-[#001433]'>
                                Ticket Type Performance
                            </h2>
                            <div className='flex items-center justify-center gap-2 rounded-md border border-[#E4E6EB] bg-white px-2 py-1 font-inter text-xs font-medium text-[#001433] shadow-sm'>
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 16 16'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M9.67041 4.94L6.61708 8L9.67041 11.06L8.73041 12L4.73041 8L8.73041 4L9.67041 4.94Z'
                                        fill='#1F2938'
                                    />
                                </svg>
                                <span className='mr-2 text-sm text-gray-500'>
                                    March
                                </span>
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 16 16'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M6.32959 4.94L9.38292 8L6.32959 11.06L7.26959 12L11.2696 8L7.26959 4L6.32959 4.94Z'
                                        fill='#1F2938'
                                    />
                                </svg>
                            </div>
                        </div>

                        <div className='flex h-64 items-center justify-center'>
                            <div className='w-full max-w-xs'>
                                <ResponsiveContainer width='100%' height={220}>
                                    <PieChart>
                                        <Pie
                                            data={ticketTypeData}
                                            cx='50%'
                                            cy='50%'
                                            innerRadius={0}
                                            outerRadius={80}
                                            dataKey='value'
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            {ticketTypeData.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                    />
                                                )
                                            )}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [
                                                `${value}%`,
                                                'Percentage',
                                            ]}
                                            contentStyle={{
                                                borderRadius: '4px',
                                                border: 'none',
                                                boxShadow:
                                                    '0 2px 8px rgba(0,0,0,0.15)',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                <div className='mt-4 flex flex-wrap justify-center gap-10'>
                                    {ticketTypeData.map((entry, index) => (
                                        <div
                                            key={`legend-${index}`}
                                            className='flex flex-col items-center gap-2'
                                        >
                                            <div className='flex flex-row gap-2'>
                                                <div
                                                    className='size-3 rounded-full'
                                                    style={{
                                                        backgroundColor:
                                                            entry.color,
                                                    }}
                                                ></div>
                                                <span className='font-inter text-sm font-normal text-[#333333]'>
                                                    {entry.name}
                                                </span>
                                            </div>

                                            <span className='font-inter text-sm font-normal text-[#333333]'>
                                                {entry.value}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Insights;
