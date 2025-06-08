'use client';

import { useState } from 'react';

const orders = [
    {
        event: 'Sanda Music Festival 2025',
        buyer: 'Momo Chakka',
        amount: 'Free',
        status: 'Completed',
        date: '20/3/2025',
        time: '11:59 PM',
    },
    {
        event: 'Innovators Hub: Investing In...',
        buyer: 'Dennis Ray',
        amount: '$50',
        status: 'Pending',
        date: '20/3/2025',
        time: '11:59 PM',
    },
    {
        event: 'Topicals Easter Pool Party',
        buyer: 'Chinasa Godwin',
        amount: '$120',
        status: 'Refunded',
        date: '20/3/2025',
        time: '11:59 PM',
    },
];

const statusStyles: Record<'Completed' | 'Pending' | 'Refunded', string> = {
    Completed: 'text-[#13803D] border border-[#22C55E] bg-[#F1FDF4]',
    Pending: 'text-[#B45407] border border-[#F59E0B] bg-[#FFFBEA]',
    Refunded: 'text-[#B91C1D] border border-[#EF4444] bg-[#FEF3F3]',
};

const OrderHistory = () => {
    const [filterEvent, setFilterEvent] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDate, setFilterDate] = useState('');
    return (
        <div className='m-8 min-h-screen rounded-lg border border-[#F2F3F5] bg-white p-6'>
            <div className='mb-6 flex flex-row items-center justify-between'>
                <h2 className='font-inter text-sm font-semibold text-[#001433]'>
                    Orders
                </h2>
                <div className='flex items-center gap-4'>
                    <span className='font-inter text-sm font-normal text-[#001433]'>
                        Filter By:
                    </span>
                    <select
                        className='rounded border border-[#E4E6EB] px-2 py-1 font-inter text-sm font-normal text-[#001433]'
                        value={filterEvent}
                        onChange={(e) => setFilterEvent(e.target.value)}
                    >
                        <option value=''>Event</option>
                        <option value='Sanda Music Festival 2025'>
                            Sanda Music Festival 2025
                        </option>
                        <option value='Topicals Easter Pool Party'>
                            Topicals Easter Pool Party
                        </option>
                        <option value='Innovators Hub: Investing In...'>
                            Innovators Hub: Investing In...
                        </option>
                    </select>
                    <select
                        className='rounded border border-[#E4E6EB] px-2 py-1 font-inter text-sm font-normal text-[#001433]'
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    >
                        <option value=''>Date</option>
                        <option value='20/3/2025'>20/3/2025</option>
                    </select>
                    <select
                        className='rounded border border-[#E4E6EB] px-2 py-1 font-inter text-sm font-normal text-[#001433]'
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value=''>Status</option>
                        <option value='Completed'>Completed</option>
                        <option value='Pending'>Pending</option>
                        <option value='Refunded'>Refunded</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className='overflow-x-auto bg-white'>
                <table className='w-full text-left'>
                    <thead className='border-b border-[#F2F3F5] font-inter text-xs font-medium uppercase text-[#6B7380]'>
                        <tr>
                            <th className='p-6'>Event Name</th>
                            <th className='p-6'>Buyer</th>
                            <th className='p-6'>Amount</th>
                            <th className='p-6'>Status</th>
                            <th className='p-6'>Date & Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders
                            .filter(
                                (order) =>
                                    (!filterEvent ||
                                        order.event === filterEvent) &&
                                    (!filterStatus ||
                                        order.status === filterStatus) &&
                                    (!filterDate || order.date === filterDate)
                            )
                            .map((order, idx) => (
                                <tr
                                    key={idx}
                                    className='border-b hover:bg-gray-50'
                                >
                                    <td className='p-6 font-inter text-sm font-medium text-black'>
                                        {order.event}
                                    </td>
                                    <td className='p-6 font-inter text-sm font-medium text-black'>
                                        {order.buyer}
                                    </td>
                                    <td className='p-6 font-inter text-sm font-medium text-black'>
                                        {order.amount}
                                    </td>
                                    <td className='p-6'>
                                        <span
                                            className={`rounded-full px-3 py-1 font-inter text-sm font-medium ${statusStyles[order.status as keyof typeof statusStyles]}`}
                                        >
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className='p-6 font-inter text-sm font-medium text-black'>
                                        {order.date} | {order.time}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrderHistory;
