'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/tabs';
import { Button } from '@components/ui/button';
import { Checkbox } from '@components/ui/checkbox';
import { Input } from '@components/ui/input';
import { Switch } from '@components/ui/switch';
import Image from 'next/image';
import { Info } from 'lucide-react';

const EventManagement = () => {
    const [activeTab, setActiveTab] = useState('tickets');

    const eventDetails = {
        name: 'Sanda Music Festival 2025',
        date: 'Wednesday, April 15 2025',
        time: '5:00 PM - 5:00 AM',
        location: 'Central Park, 123 Festival Road, Echo City',
        status: 'Upcoming',
    };
    const [devices, setDevices] = useState([
        { id: 1, name: "Gabriel's iPhone", type: 'phone', time: '2 mins ago' },
        { id: 2, name: "Momo's iPhone", type: 'phone', time: '2 mins ago' },
        { id: 3, name: "Dolly's tab", type: 'tablet', time: 'Just now' },
    ]);

    const ticketTypes = [
        {
            name: 'General Admission',
            price: 'Free',
            quantity: 500,
            salesStart: '17/2/2025 | 8:00 AM',
            salesEnd: '20/3/2025 | 11:59 PM',
            limit: 3,
        },
        {
            name: 'VIP',
            price: '$80',
            quantity: 100,
            salesStart: '17/2/2025 | 8:00 AM',
            salesEnd: '20/3/2025 | 11:59 PM',
            limit: 2,
        },
    ];

    const orders = [
        {
            name: 'Momo Chakka',
            email: 'mochi@gmail.com',
            ticket: 'General - Free',
            quantity: 1,
            status: 'Completed',
            date: '20/3/2025 | 11:59 PM',
        },
        {
            name: 'Dennis Ray',
            email: 'denray@gmail.com',
            ticket: 'Min Access - $50',
            quantity: 2,
            status: 'Pending',
            date: '20/3/2025 | 11:59 PM',
        },
        {
            name: 'Momo Chakka',
            email: 'mochi@gmail.com',
            ticket: 'General - Free',
            quantity: 1,
            status: 'Completed',
            date: '20/3/2025 | 11:59 PM',
        },
        {
            name: 'Momo Chakka',
            email: 'mochi@gmail.com',
            ticket: 'General - Free',
            quantity: 1,
            status: 'Completed',
            date: '20/3/2025 | 11:59 PM',
        },
        {
            name: 'Chinasa Godwin',
            email: 'nasagodwin@gmail.com',
            ticket: 'All Access - $120',
            quantity: 1,
            status: 'Refunded',
            date: '20/3/2025 | 11:59 PM',
        },
        {
            name: 'Dennis Ray',
            email: 'denray@gmail.com',
            ticket: 'Min Access - $50',
            quantity: 3,
            status: 'Pending',
            date: '20/3/2025 | 11:59 PM',
        },
        {
            name: 'Chinasa Godwin',
            email: 'nasagodwin@gmail.com',
            ticket: 'All Access - $120',
            quantity: 1,
            status: 'Refunded',
            date: '20/3/2025 | 11:59 PM',
        },
        {
            name: 'Dennis Ray',
            email: 'denray@gmail.com',
            ticket: 'Min Access - $50',
            quantity: 1,
            status: 'Pending',
            date: '20/3/2025 | 11:59 PM',
        },
    ];

    const stats = {
        revenue: '$26,000',
        ticketsSold: 350,
        totalTickets: 500,
        conversionRate: '5%',
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed':
                return 'bg-[#F1FDF4] text-[#13803D] border-[#22C55E]';
            case 'Pending':
                return 'bg-[#FFFBEA] text-[#B45407] border-[#F59E0B]';
            case 'Refunded':
                return 'bg-[#FEF3F3] border-[#EF4444] text-[#EF4444]';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const handleRemoveDevice = (id: number) => {
        setDevices(devices.filter((device) => device.id !== id));
    };

    const handleResetAccess = () => {
        setDevices([]);
    };

    return (
        <div className='m-10 flex flex-col gap-16 overflow-hidden rounded-lg bg-white p-6 shadow-sm'>
            <div className='flex justify-between'>
                <div className='flex justify-between gap-10'>
                    <div className='relative mb-2 size-40 rounded-xl'>
                        <Image
                            src='/assets/images/event-image.png'
                            alt='sanda-music-festival'
                            fill
                            className='object-cover'
                        />
                    </div>

                    <div className='flex flex-col gap-4'>
                        <div className='flex items-center justify-between gap-4'>
                            <h1 className='font-inter text-lg font-semibold text-[#001433]'>
                                {eventDetails.name}
                            </h1>
                            <span className='rounded-full border border-revlr-primary-blue bg-[#F1F6FF] px-2 py-1 font-inter text-xs font-medium text-revlr-primary-blue'>
                                {eventDetails.status}
                            </span>
                        </div>

                        <div className='flex items-center gap-2'>
                            <svg
                                width='16'
                                height='16'
                                viewBox='0 0 16 16'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M13.332 2.00008H12.6654V1.33341C12.6654 0.966748 12.3654 0.666748 11.9987 0.666748C11.632 0.666748 11.332 0.966748 11.332 1.33341V2.00008H4.66536V1.33341C4.66536 0.966748 4.36536 0.666748 3.9987 0.666748C3.63203 0.666748 3.33203 0.966748 3.33203 1.33341V2.00008H2.66536C1.93203 2.00008 1.33203 2.60008 1.33203 3.33341V14.0001C1.33203 14.7334 1.93203 15.3334 2.66536 15.3334H13.332C14.0654 15.3334 14.6654 14.7334 14.6654 14.0001V3.33341C14.6654 2.60008 14.0654 2.00008 13.332 2.00008ZM12.6654 14.0001H3.33203C2.96536 14.0001 2.66536 13.7001 2.66536 13.3334V5.33342H13.332V13.3334C13.332 13.7001 13.032 14.0001 12.6654 14.0001Z'
                                    fill='#374252'
                                />
                            </svg>

                            <span className='font-inter text-sm font-normal text-[#374252]'>
                                {eventDetails.date}
                            </span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <svg
                                width='14'
                                height='14'
                                viewBox='0 0 14 14'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M6.9987 0.333252C3.33203 0.333252 0.332031 3.33325 0.332031 6.99992C0.332031 10.6666 3.33203 13.6666 6.9987 13.6666C10.6654 13.6666 13.6654 10.6666 13.6654 6.99992C13.6654 3.33325 10.6654 0.333252 6.9987 0.333252ZM9.36536 9.53325L6.64536 7.85992C6.44536 7.73992 6.32536 7.52659 6.32536 7.29325V4.16659C6.33203 3.89325 6.5587 3.66659 6.83203 3.66659C7.10536 3.66659 7.33203 3.89325 7.33203 4.16659V7.13325L9.89203 8.67325C10.132 8.81992 10.212 9.13325 10.0654 9.37325C9.9187 9.60659 9.60536 9.67992 9.36536 9.53325Z'
                                    fill='#374252'
                                />
                            </svg>

                            <span className='font-inter text-sm font-normal text-[#374252]'>
                                {eventDetails.time}
                            </span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <svg
                                width='12'
                                height='14'
                                viewBox='0 0 12 14'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M6.0013 0.440674C3.2013 0.440674 0.667969 2.58734 0.667969 5.90734C0.667969 8.02734 2.3013 10.5207 5.5613 13.394C5.81464 13.614 6.19464 13.614 6.44797 13.394C9.7013 10.5207 11.3346 8.02734 11.3346 5.90734C11.3346 2.58734 8.8013 0.440674 6.0013 0.440674ZM6.0013 7.10734C5.26797 7.10734 4.66797 6.50734 4.66797 5.77401C4.66797 5.04067 5.26797 4.44067 6.0013 4.44067C6.73464 4.44067 7.33464 5.04067 7.33464 5.77401C7.33464 6.50734 6.73464 7.10734 6.0013 7.10734Z'
                                    fill='#374252'
                                />
                            </svg>

                            <span className='font-inter text-sm font-normal text-[#374252]'>
                                {eventDetails.location}
                            </span>
                        </div>
                    </div>
                </div>

                <div className='mt-auto flex items-baseline space-x-3'>
                    <Button
                        variant='outline'
                        size='sm'
                        className='h-8 border border-[#E4E6EB] px-3 py-1 font-inter text-sm font-medium text-[#001433]'
                    >
                        Edit Event Details
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        className='h-8 border border-[#E4E6EB] px-3 py-1 font-inter text-sm font-medium text-[#001433]'
                    >
                        View Event Page
                    </Button>
                    <Button
                        variant='outline'
                        size='sm'
                        className='h-8 border border-[#E4E6EB] px-3 py-1 font-inter text-sm font-medium text-[#001433]'
                    >
                        Share Event
                    </Button>
                </div>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className='w-full'
            >
                <TabsList className='w-full justify-start rounded-none border-b border-[#F2F3F5] bg-white pb-2'>
                    <TabsTrigger
                        value='tickets'
                        className={`pb-5 font-inter text-sm font-normal ${activeTab === 'tickets' ? 'rounded-none border-b border-revlr-primary-blue !text-revlr-primary-blue' : 'text-[#374252]'}`}
                    >
                        Tickets
                    </TabsTrigger>
                    <TabsTrigger
                        value='orders'
                        className={`pb-5 font-inter text-sm font-normal ${activeTab === 'orders' ? 'rounded-none border-b border-revlr-primary-blue !text-revlr-primary-blue' : 'text-[#374252]'}`}
                    >
                        Orders
                    </TabsTrigger>
                    <TabsTrigger
                        value='reminders'
                        className={`pb-5 font-inter text-sm font-normal ${activeTab === 'reminders' ? 'rounded-none border-b border-revlr-primary-blue !text-revlr-primary-blue' : 'text-[#374252]'}`}
                    >
                        Reminders
                    </TabsTrigger>
                    <TabsTrigger
                        value='insights'
                        className={`pb-5 font-inter text-sm font-normal ${activeTab === 'insights' ? 'rounded-none border-b border-revlr-primary-blue !text-revlr-primary-blue' : 'text-[#374252]'}`}
                    >
                        Insights
                    </TabsTrigger>
                    <TabsTrigger
                        value='check-in'
                        className={`pb-5 font-inter text-sm font-normal ${activeTab === 'check-in' ? 'rounded-none border-b border-revlr-primary-blue !text-revlr-primary-blue' : 'text-[#374252]'}`}
                    >
                        Check-In
                    </TabsTrigger>
                </TabsList>

                {/* Tickets Tab */}
                <TabsContent value='tickets' className='py-8'>
                    <h3 className='pb-8 font-inter text-sm font-medium text-[#001433]'>
                        Tickets
                    </h3>
                    <table className='w-full'>
                        <thead>
                            <tr className='border-b text-left font-inter text-xs font-medium text-[#6B7380]'>
                                <th className='flex gap-4 pb-2 pl-3'>
                                    <svg
                                        width='18'
                                        height='18'
                                        viewBox='0 0 18 18'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <path
                                            d='M9.0013 0.666748C4.4013 0.666748 0.667969 4.40008 0.667969 9.00008C0.667969 13.6001 4.4013 17.3334 9.0013 17.3334C13.6013 17.3334 17.3346 13.6001 17.3346 9.00008C17.3346 4.40008 13.6013 0.666748 9.0013 0.666748ZM12.1596 8.75842L9.59297 11.3251C9.26797 11.6501 8.74297 11.6501 8.40964 11.3251L5.84297 8.75842C5.51797 8.43341 5.51797 7.90008 5.84297 7.57508C6.16797 7.25008 6.69297 7.25008 7.01797 7.57508L9.0013 9.55842L10.9846 7.57508C11.3096 7.25008 11.8346 7.25008 12.1596 7.57508C12.4846 7.90008 12.4846 8.43341 12.1596 8.75842Z'
                                            fill='#9DA4B0'
                                        />
                                    </svg>
                                    TICKET NAME
                                </th>
                                <th className='pb-2'>PRICE</th>
                                <th className='pb-2'>QUANTITY</th>
                                <th className='pb-2'>
                                    SALES START DATE & TIME
                                </th>
                                <th className='pb-2'>SALES END DATE & TIME</th>
                                <th className='pb-2'>PURCHASE LIMIT</th>
                                <th className='pb-2'>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ticketTypes.map((ticket, index) => (
                                <tr
                                    key={index}
                                    className='border-b font-inter text-sm font-medium'
                                >
                                    <td className='flex items-center py-4'>
                                        <label className='flex cursor-pointer items-center space-x-3'>
                                            <input
                                                type='radio'
                                                checked={index === 1}
                                                onChange={() => {}}
                                                className='peer sr-only'
                                            />
                                            <div className='hidden text-blue-600 peer-checked:block'>
                                                <svg
                                                    width='20'
                                                    height='20'
                                                    viewBox='0 0 20 20'
                                                    fill='none'
                                                    xmlns='http://www.w3.org/2000/svg'
                                                >
                                                    <path
                                                        d='M10.0013 1.66675C5.4013 1.66675 1.66797 5.40008 1.66797 10.0001C1.66797 14.6001 5.4013 18.3334 10.0013 18.3334C14.6013 18.3334 18.3346 14.6001 18.3346 10.0001C18.3346 5.40008 14.6013 1.66675 10.0013 1.66675ZM13.1596 9.75842L10.593 12.3251C10.268 12.6501 9.74297 12.6501 9.40964 12.3251L6.84297 9.75842C6.51797 9.43341 6.51797 8.90008 6.84297 8.57508C7.16797 8.25008 7.69297 8.25008 8.01797 8.57508L10.0013 10.5584L11.9846 8.57508C12.3096 8.25008 12.8346 8.25008 13.1596 8.57508C13.4846 8.90008 13.4846 9.43341 13.1596 9.75842Z'
                                                        fill='#0066FF'
                                                    />
                                                </svg>
                                            </div>
                                            <div className='text-gray-400 peer-checked:hidden'>
                                                <svg
                                                    width='18'
                                                    height='18'
                                                    viewBox='0 0 18 18'
                                                    fill='none'
                                                    xmlns='http://www.w3.org/2000/svg'
                                                >
                                                    <path
                                                        d='M9.0013 0.666748C4.4013 0.666748 0.667969 4.40008 0.667969 9.00008C0.667969 13.6001 4.4013 17.3334 9.0013 17.3334C13.6013 17.3334 17.3346 13.6001 17.3346 9.00008C17.3346 4.40008 13.6013 0.666748 9.0013 0.666748ZM12.1596 8.75842L9.59297 11.3251C9.26797 11.6501 8.74297 11.6501 8.40964 11.3251L5.84297 8.75842C5.51797 8.43341 5.51797 7.90008 5.84297 7.57508C6.16797 7.25008 6.69297 7.25008 7.01797 7.57508L9.0013 9.55842L10.9846 7.57508C11.3096 7.25008 11.8346 7.25008 12.1596 7.57508C12.4846 7.90008 12.4846 8.43341 12.1596 8.75842Z'
                                                        fill='#E4E6EB'
                                                    />
                                                </svg>
                                            </div>

                                            <span>{ticket.name}</span>
                                        </label>
                                    </td>
                                    <td className='py-4'>{ticket.price}</td>
                                    <td className='py-4'>{ticket.quantity}</td>
                                    <td className='py-4'>
                                        {ticket.salesStart}
                                    </td>
                                    <td className='py-4'>{ticket.salesEnd}</td>
                                    <td className='py-4'>{ticket.limit}</td>
                                    <td className='flex space-x-6 py-4'>
                                        <svg
                                            width='16'
                                            height='16'
                                            viewBox='0 0 16 16'
                                            fill='none'
                                            xmlns='http://www.w3.org/2000/svg'
                                        >
                                            <path
                                                d='M0.5 12.5511V15.0844C0.5 15.3178 0.683333 15.5011 0.916667 15.5011H3.45C3.55833 15.5011 3.66667 15.4594 3.74167 15.3761L12.8417 6.28444L9.71667 3.15944L0.625 12.2511C0.541667 12.3344 0.5 12.4344 0.5 12.5511ZM15.2583 3.86777C15.5833 3.54277 15.5833 3.01777 15.2583 2.69277L13.3083 0.742773C12.9833 0.417773 12.4583 0.417773 12.1333 0.742773L10.6083 2.26777L13.7333 5.39277L15.2583 3.86777Z'
                                                fill='#0066FF'
                                            />
                                        </svg>

                                        <svg
                                            width='20'
                                            height='20'
                                            viewBox='0 0 20 20'
                                            fill='none'
                                            xmlns='http://www.w3.org/2000/svg'
                                        >
                                            <path
                                                fill-rule='evenodd'
                                                clip-rule='evenodd'
                                                d='M11.8993 1.66675C12.6167 1.66675 13.2537 2.1258 13.4805 2.80636L13.934 4.16675H16.6667C17.1269 4.16675 17.5 4.53985 17.5 5.00008C17.5 5.46031 17.1269 5.8334 16.6667 5.83341L16.6646 5.89279L15.9417 16.0115C15.8483 17.3198 14.7597 18.3334 13.4482 18.3334H6.55187C5.24027 18.3334 4.15167 17.3198 4.05822 16.0115L3.33545 5.89279C3.33403 5.87287 3.33332 5.85307 3.3333 5.83341C2.87307 5.8334 2.5 5.46031 2.5 5.00008C2.5 4.53985 2.8731 4.16675 3.33333 4.16675H6.06603L6.51949 2.80636C6.74635 2.1258 7.38325 1.66675 8.10063 1.66675H11.8993ZM7.5 8.33341C7.07263 8.33341 6.72041 8.6551 6.67227 9.06956L6.66667 9.16675V14.1667C6.66667 14.627 7.03976 15.0001 7.5 15.0001C7.92737 15.0001 8.27959 14.6784 8.32773 14.2639L8.33333 14.1667V9.16675C8.33333 8.7065 7.96024 8.33341 7.5 8.33341ZM12.5 8.33341C12.0398 8.33341 11.6667 8.7065 11.6667 9.16675V14.1667C11.6667 14.627 12.0398 15.0001 12.5 15.0001C12.9602 15.0001 13.3333 14.627 13.3333 14.1667V9.16675C13.3333 8.7065 12.9602 8.33341 12.5 8.33341ZM11.8993 3.33341H8.10063L7.82286 4.16675H12.1772L11.8993 3.33341Z'
                                                fill='#0066FF'
                                            />
                                        </svg>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </TabsContent>

                <TabsContent value='orders' className='p-6'>
                    <div className='mb-6'>
                        <div className='flex flex-col gap-4'>
                            <div className='flex flex-row gap-2'>
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 16 16'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M14.6654 7.16675C14.9387 7.16675 15.1654 6.94008 15.1654 6.66675V6.00008C15.1654 3.06008 14.272 2.16675 11.332 2.16675H7.16536V3.66675C7.16536 3.94008 6.9387 4.16675 6.66536 4.16675C6.39203 4.16675 6.16536 3.94008 6.16536 3.66675V2.16675H4.66536C1.72536 2.16675 0.832031 3.06008 0.832031 6.00008V6.33342C0.832031 6.60675 1.0587 6.83342 1.33203 6.83342C1.97203 6.83342 2.4987 7.36008 2.4987 8.00008C2.4987 8.64008 1.97203 9.16675 1.33203 9.16675C1.0587 9.16675 0.832031 9.39341 0.832031 9.66675V10.0001C0.832031 12.9401 1.72536 13.8334 4.66536 13.8334H6.16536V12.3334C6.16536 12.0601 6.39203 11.8334 6.66536 11.8334C6.9387 11.8334 7.16536 12.0601 7.16536 12.3334V13.8334H11.332C14.272 13.8334 15.1654 12.9401 15.1654 10.0001C15.1654 9.72675 14.9387 9.50008 14.6654 9.50008C14.0254 9.50008 13.4987 8.97341 13.4987 8.33342C13.4987 7.69341 14.0254 7.16675 14.6654 7.16675ZM7.16536 9.44675C7.16536 9.72008 6.9387 9.94675 6.66536 9.94675C6.39203 9.94675 6.16536 9.72008 6.16536 9.44675V6.55341C6.16536 6.28008 6.39203 6.05341 6.66536 6.05341C6.9387 6.05341 7.16536 6.28008 7.16536 6.55341V9.44675Z'
                                        fill='#3D8BFF'
                                    />
                                </svg>

                                <h5 className='font-inter text-sm font-medium text-[#9DA4B0]'>
                                    Tickets Sold
                                </h5>
                            </div>
                            <div>
                                <span className='font-inter text-2xl font-semibold text-[#001433]'>
                                    350
                                </span>
                                <span className='font-inter text-base font-medium text-[#374252]'>
                                    /500
                                </span>
                            </div>
                            <h5 className='mb-4 font-inter text-xs font-normal text-[#4C5563]'>
                                150 left
                            </h5>
                        </div>

                        <hr />

                        <div className='mb-8 flex justify-between'>
                            <div className='relative mt-2 w-64'>
                                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500'>
                                    <svg
                                        width='20'
                                        height='20'
                                        viewBox='0 0 20 20'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <path
                                            d='M7.91667 13.3333C6.40278 13.3333 5.12153 12.809 4.07292 11.7604C3.02431 10.7118 2.5 9.43056 2.5 7.91667C2.5 6.40278 3.02431 5.12153 4.07292 4.07292C5.12153 3.02431 6.40278 2.5 7.91667 2.5C9.43056 2.5 10.7118 3.02431 11.7604 4.07292C12.809 5.12153 13.3333 6.40278 13.3333 7.91667C13.3333 8.52778 13.2361 9.10417 13.0417 9.64583C12.8472 10.1875 12.5833 10.6667 12.25 11.0833L16.9167 15.75C17.0694 15.9028 17.1458 16.0972 17.1458 16.3333C17.1458 16.5694 17.0694 16.7639 16.9167 16.9167C16.7639 17.0694 16.5694 17.1458 16.3333 17.1458C16.0972 17.1458 15.9028 17.0694 15.75 16.9167L11.0833 12.25C10.6667 12.5833 10.1875 12.8472 9.64583 13.0417C9.10417 13.2361 8.52778 13.3333 7.91667 13.3333ZM7.91667 11.6667C8.95833 11.6667 9.84375 11.3021 10.5729 10.5729C11.3021 9.84375 11.6667 8.95833 11.6667 7.91667C11.6667 6.875 11.3021 5.98958 10.5729 5.26042C9.84375 4.53125 8.95833 4.16667 7.91667 4.16667C6.875 4.16667 5.98958 4.53125 5.26042 5.26042C4.53125 5.98958 4.16667 6.875 4.16667 7.91667C4.16667 8.95833 4.53125 9.84375 5.26042 10.5729C5.98958 11.3021 6.875 11.6667 7.91667 11.6667Z'
                                            fill='#001433'
                                        />
                                    </svg>
                                </span>

                                <Input
                                    placeholder='Search'
                                    className='h-10 border border-[#F2F3F5] bg-[#F7F8FA] pl-10 text-sm'
                                />
                            </div>

                            <div className='flex items-center space-x-4'>
                                <span className='font-inter text-sm font-normal text-[#001433]'>
                                    Filter By:
                                </span>
                                <select className='gap-2 rounded-md border border-[#E4E6EB] px-2.5 py-1 font-inter text-sm font-normal text-[#001433]'>
                                    <option>Ticket Price</option>
                                </select>
                                <select className='gap-2 rounded-md border border-[#E4E6EB] px-2.5 py-1 font-inter text-sm font-normal text-[#001433]'>
                                    <option>Status</option>
                                </select>
                            </div>
                        </div>

                        <table className='w-full'>
                            <thead>
                                <tr className='border-b text-left font-inter text-xs font-normal text-[#6B7380]'>
                                    <th className='pb-2'>BUYER NAME</th>
                                    <th className='pb-2'>BUYER EMAIL</th>
                                    <th className='pb-2'>
                                        TICKET NAME - PRICE
                                    </th>
                                    <th className='pb-2'>QUANTITY</th>
                                    <th className='pb-2'>STATUS</th>
                                    <th className='pb-2'>DATE & TIME</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order, index) => (
                                    <tr
                                        key={index}
                                        className='border-b font-inter text-sm font-medium text-black'
                                    >
                                        <td className='py-4'>{order.name}</td>
                                        <td className='py-4'>{order.email}</td>
                                        <td className='py-4'>{order.ticket}</td>
                                        <td className='py-4'>
                                            {order.quantity}
                                        </td>
                                        <td className='py-4'>
                                            <span
                                                className={`rounded-full border px-3 py-1 font-inter text-sm font-medium ${getStatusColor(order.status)}`}
                                            >
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className='py-4'>{order.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>

                <TabsContent value='reminders' className='p-6'>
                    <div className=''>
                        <div className='mb-8 flex gap-4'>
                            <div>
                                <h3 className='mb-2 font-inter text-sm font-medium text-[#001433]'>
                                    Enable/Disable Reminders
                                </h3>
                                <p className='mb-3 font-inter text-sm font-normal text-[#001433]'>
                                    Turn reminders on or off for this event.
                                </p>
                            </div>
                            <Switch />
                        </div>

                        <div className='mb-8'>
                            <h3 className='mb-2 font-inter text-sm font-medium text-[#001433]'>
                                Choose Reminder Frequency
                            </h3>
                            <div className='space-y-3'>
                                <div className='flex items-center'>
                                    <Checkbox
                                        id='reminder-3days'
                                        className='mr-2'
                                    />
                                    <label
                                        htmlFor='reminder-3days'
                                        className='font-inter text-sm font-normal text-[#374252]'
                                    >
                                        3 days before event
                                    </label>
                                </div>
                                <div className='flex items-center'>
                                    <Checkbox
                                        id='reminder-1day'
                                        className='mr-2'
                                    />
                                    <label
                                        htmlFor='reminder-1day'
                                        className='font-inter text-sm font-normal text-[#374252]'
                                    >
                                        1 day before event
                                    </label>
                                </div>
                                <div className='flex items-center'>
                                    <Checkbox
                                        id='reminder-morning'
                                        className='mr-2'
                                    />
                                    <label
                                        htmlFor='reminder-morning'
                                        className='font-inter text-sm font-normal text-[#374252]'
                                    >
                                        Morning of the event
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className='mb-8'>
                            <div className='mb-2 flex items-center justify-between'>
                                <h3 className='font-inter text-sm font-medium text-[#001433]'>
                                    Reminder Message (optional)
                                </h3>
                                <Button
                                    variant='link'
                                    size='sm'
                                    className='font-inter text-xs font-medium text-revlr-primary-blue'
                                >
                                    Preview Message
                                </Button>
                            </div>
                            <Input
                                placeholder='Add a friendly message your attendees will receive along with the event details.'
                                className='h-24 pt-3 text-sm'
                            />
                        </div>

                        <div className='flex justify-end'>
                            <Button className='border border-[#E5F0FF] bg-[#F1F6FF] font-inter text-sm font-semibold text-revlr-primary-blue'>
                                Save Reminder Settings
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value='insights' className='p-6'>
                    <div className='mb-8'>
                        <div className='mb-6 grid grid-cols-3 gap-6'>
                            <div className='flex flex-col gap-4 rounded-none border-r border-[#E4E6EB] p-4'>
                                <div className='mb-1 flex items-center'>
                                    <svg
                                        width='16'
                                        height='16'
                                        viewBox='0 0 16 16'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <path
                                            d='M14.6654 7.16675C14.9387 7.16675 15.1654 6.94008 15.1654 6.66675V6.00008C15.1654 3.06008 14.272 2.16675 11.332 2.16675H7.16536V3.66675C7.16536 3.94008 6.9387 4.16675 6.66536 4.16675C6.39203 4.16675 6.16536 3.94008 6.16536 3.66675V2.16675H4.66536C1.72536 2.16675 0.832031 3.06008 0.832031 6.00008V6.33341C0.832031 6.60675 1.0587 6.83341 1.33203 6.83341C1.97203 6.83341 2.4987 7.36008 2.4987 8.00008C2.4987 8.64008 1.97203 9.16675 1.33203 9.16675C1.0587 9.16675 0.832031 9.39341 0.832031 9.66675V10.0001C0.832031 12.9401 1.72536 13.8334 4.66536 13.8334H6.16536V12.3334C6.16536 12.0601 6.39203 11.8334 6.66536 11.8334C6.9387 11.8334 7.16536 12.0601 7.16536 12.3334V13.8334H11.332C14.272 13.8334 15.1654 12.9401 15.1654 10.0001C15.1654 9.72675 14.9387 9.50008 14.6654 9.50008C14.0254 9.50008 13.4987 8.97341 13.4987 8.33341C13.4987 7.69341 14.0254 7.16675 14.6654 7.16675ZM7.16536 9.44675C7.16536 9.72008 6.9387 9.94675 6.66536 9.94675C6.39203 9.94675 6.16536 9.72008 6.16536 9.44675V6.55341C6.16536 6.28008 6.39203 6.05341 6.66536 6.05341C6.9387 6.05341 7.16536 6.28008 7.16536 6.55341V9.44675Z'
                                            fill='#3D8BFF'
                                        />
                                    </svg>

                                    <span className='font-inter text-sm font-medium text-[#9DA4B0]'>
                                        Total Revenue
                                    </span>
                                </div>
                                <div className='font-inter text-2xl font-semibold text-[#001433]'>
                                    {stats.revenue}
                                </div>
                            </div>

                            <div className='flex flex-col gap-4 rounded-none border-r border-[#E4E6EB] p-4'>
                                <div className='mb-1 flex items-center'>
                                    <svg
                                        width='16'
                                        height='16'
                                        viewBox='0 0 16 16'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <path
                                            d='M14.6654 7.16675C14.9387 7.16675 15.1654 6.94008 15.1654 6.66675V6.00008C15.1654 3.06008 14.272 2.16675 11.332 2.16675H7.16536V3.66675C7.16536 3.94008 6.9387 4.16675 6.66536 4.16675C6.39203 4.16675 6.16536 3.94008 6.16536 3.66675V2.16675H4.66536C1.72536 2.16675 0.832031 3.06008 0.832031 6.00008V6.33341C0.832031 6.60675 1.0587 6.83341 1.33203 6.83341C1.97203 6.83341 2.4987 7.36008 2.4987 8.00008C2.4987 8.64008 1.97203 9.16675 1.33203 9.16675C1.0587 9.16675 0.832031 9.39341 0.832031 9.66675V10.0001C0.832031 12.9401 1.72536 13.8334 4.66536 13.8334H6.16536V12.3334C6.16536 12.0601 6.39203 11.8334 6.66536 11.8334C6.9387 11.8334 7.16536 12.0601 7.16536 12.3334V13.8334H11.332C14.272 13.8334 15.1654 12.9401 15.1654 10.0001C15.1654 9.72675 14.9387 9.50008 14.6654 9.50008C14.0254 9.50008 13.4987 8.97341 13.4987 8.33341C13.4987 7.69341 14.0254 7.16675 14.6654 7.16675ZM7.16536 9.44675C7.16536 9.72008 6.9387 9.94675 6.66536 9.94675C6.39203 9.94675 6.16536 9.72008 6.16536 9.44675V6.55341C6.16536 6.28008 6.39203 6.05341 6.66536 6.05341C6.9387 6.05341 7.16536 6.28008 7.16536 6.55341V9.44675Z'
                                            fill='#3D8BFF'
                                        />
                                    </svg>

                                    <span className='font-inter text-sm font-medium text-[#9DA4B0]'>
                                        Tickets Sold
                                    </span>
                                </div>
                                <div className='font-inter text-2xl font-semibold text-[#001433]'>
                                    {stats.ticketsSold}
                                </div>
                            </div>

                            <div className='flex flex-col gap-4 rounded-none border-r border-[#E4E6EB] p-4'>
                                <div className='mb-1 flex items-center'>
                                    <svg
                                        width='16'
                                        height='16'
                                        viewBox='0 0 16 16'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <path
                                            d='M14.6654 7.16675C14.9387 7.16675 15.1654 6.94008 15.1654 6.66675V6.00008C15.1654 3.06008 14.272 2.16675 11.332 2.16675H7.16536V3.66675C7.16536 3.94008 6.9387 4.16675 6.66536 4.16675C6.39203 4.16675 6.16536 3.94008 6.16536 3.66675V2.16675H4.66536C1.72536 2.16675 0.832031 3.06008 0.832031 6.00008V6.33341C0.832031 6.60675 1.0587 6.83341 1.33203 6.83341C1.97203 6.83341 2.4987 7.36008 2.4987 8.00008C2.4987 8.64008 1.97203 9.16675 1.33203 9.16675C1.0587 9.16675 0.832031 9.39341 0.832031 9.66675V10.0001C0.832031 12.9401 1.72536 13.8334 4.66536 13.8334H6.16536V12.3334C6.16536 12.0601 6.39203 11.8334 6.66536 11.8334C6.9387 11.8334 7.16536 12.0601 7.16536 12.3334V13.8334H11.332C14.272 13.8334 15.1654 12.9401 15.1654 10.0001C15.1654 9.72675 14.9387 9.50008 14.6654 9.50008C14.0254 9.50008 13.4987 8.97341 13.4987 8.33341C13.4987 7.69341 14.0254 7.16675 14.6654 7.16675ZM7.16536 9.44675C7.16536 9.72008 6.9387 9.94675 6.66536 9.94675C6.39203 9.94675 6.16536 9.72008 6.16536 9.44675V6.55341C6.16536 6.28008 6.39203 6.05341 6.66536 6.05341C6.9387 6.05341 7.16536 6.28008 7.16536 6.55341V9.44675Z'
                                            fill='#3D8BFF'
                                        />
                                    </svg>

                                    <span className='font-inter text-sm font-medium text-[#9DA4B0]'>
                                        Conversion rate
                                    </span>
                                </div>
                                <div className='font-inter text-2xl font-semibold text-[#001433]'>
                                    {stats.conversionRate}
                                </div>
                            </div>
                        </div>

                        <h3 className='mb-4 text-base font-medium'>
                            Sales Overtime
                        </h3>
                        <div className='relative h-64 rounded-lg border bg-white p-4'>
                            <div className='absolute inset-0 flex items-center justify-center'>
                                <div className='relative h-48 w-full overflow-hidden rounded-lg bg-blue-100'>
                                    <div className='absolute bottom-0 left-0 size-full'>
                                        <svg
                                            viewBox='0 0 300 100'
                                            className='size-full'
                                            preserveAspectRatio='none'
                                        >
                                            <path
                                                d='M0,50 C15,30 35,80 50,50 C65,20 85,60 100,40 C115,20 135,45 150,50 C165,55 185,40 200,60 C215,80 235,30 250,50 C265,70 285,50 300,60 L300,100 L0,100 Z'
                                                fill='rgba(59, 130, 246, 0.3)'
                                                stroke='rgba(59, 130, 246, 0.6)'
                                                strokeWidth='2'
                                            />
                                        </svg>
                                    </div>

                                    <div className='absolute left-1/3 top-1/4 rounded bg-blue-500 px-3 py-1 text-xs text-white'>
                                        80 Tickets
                                    </div>
                                </div>
                            </div>

                            <div className='absolute inset-x-4 bottom-4 flex justify-between text-xs text-gray-500'>
                                <span>Feb 17</span>
                                <span>Feb 18</span>
                                <span>Feb 19</span>
                                <span>Thu</span>
                                <span>Fri</span>
                                <span>Sat</span>
                                <span>Sun</span>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value='check-in' className='p-6'>
                    <div className=''>
                        <div className='mb-12 flex flex-col items-start justify-between md:flex-row'>
                            <div className='mb-4 md:mb-0'>
                                <h1 className='mb-2 font-inter text-sm font-semibold text-[#001433]'>
                                    Fast, Easy Check-In for Your Event
                                </h1>
                                <p className='font-inter text-sm font-normal text-[#374252]'>
                                    Open check-in mode on your phone or tablet
                                    to scan attendee tickets. No dashboard
                                    access needed
                                </p>
                            </div>
                            <button className='rounded-lg bg-[#0066FF] p-4 font-inter text-sm font-semibold text-white'>
                                Open Check-In on Mobile
                            </button>
                        </div>

                        <div className='mb-8'>
                            <div className='mb-6 flex items-center justify-between'>
                                <h2 className='font-inter text-sm font-semibold text-[#001433]'>
                                    Devices with Check-In Access:{' '}
                                    {devices.length}/5
                                </h2>
                                <button
                                    onClick={handleResetAccess}
                                    className='rounded-lg border border-[#E4E6EB] p-2 font-inter text-sm font-medium text-[#001433] transition duration-200 hover:bg-gray-50'
                                >
                                    Reset Access
                                </button>
                            </div>

                            <div className='divide-y divide-gray-200'>
                                {devices.map((device) => (
                                    <div
                                        key={device.id}
                                        className='flex items-center gap-8 py-4'
                                    >
                                        <div className='flex items-center'>
                                            <span className='font-inter text-sm font-medium text-[#000000]'>
                                                {device.name}
                                            </span>
                                        </div>
                                        <div className='flex items-center justify-start gap-2'>
                                            <span className='font-inter text-sm font-normal text-[#374252]'>
                                                {device.time}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleRemoveDevice(
                                                        device.id
                                                    )
                                                }
                                                className='font-inter text-sm font-semibold text-[#0066FF] transition duration-200'
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className='mb-10'>
                            <h2 className='mb-4 font-inter text-sm font-semibold text-[#001433]'>
                                Instructions:
                            </h2>
                            <ol className='space-y-6 font-inter text-sm font-normal text-[#374252]'>
                                <li className='flex items-start gap-2'>
                                    <span className=''>1.</span>
                                    <span>Click "Open Check-In on Mobile"</span>
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className=''>2.</span>
                                    <span>
                                        Copy the link or scan the QR code
                                    </span>
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className=''>3.</span>
                                    <span>Open it on a device and log in</span>
                                </li>
                                <li className='flex items-start gap-2'>
                                    <span className=''>4.</span>
                                    <span>Start scanning tickets</span>
                                </li>
                            </ol>
                        </div>

                        <div className='rounded-lg border border-[#F59E0B] bg-[#FFFBEA] p-4'>
                            <div className='flex'>
                                <Info
                                    size={20}
                                    className='mr-2 mt-1 shrink-0 text-yellow-700'
                                />
                                <div>
                                    <h3 className='mb-1 font-inter text-sm font-semibold text-[#B45407]'>
                                        Security Note:
                                    </h3>
                                    <p className='mb-1 font-inter text-sm font-normal text-[#B45407]'>
                                        This check-in link is private. It can
                                        only be accessed by logged-in users and
                                        limited to 5 devices for added security.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
            {/* <Modal isOpen={shareModalOpen} onClose={onModalClose}>
                <div className='flex justify-center space-x-6 p-4'>
                    <button className='rounded-full p-2 hover:bg-gray-100'>
                        <Share className='h-6 w-6' />
                    </button>
                    <button className='rounded-full p-2 hover:bg-gray-100'>
                        <div className='flex h-6 w-6 items-center justify-center font-bold'>
                            f
                        </div>
                    </button>
                    <button className='rounded-full p-2 hover:bg-gray-100'>
                        <div className='flex h-6 w-6 items-center justify-center font-bold'>
                            X
                        </div>
                    </button>
                    <button className='rounded-full p-2 hover:bg-gray-100'>
                        <div className='flex h-6 w-6 items-center justify-center'></div>
                    </button>
                    <button className='rounded-full p-2 hover:bg-gray-100'>
                        <Copy className='h-6 w-6' />
                    </button>
                </div>
            </Modal> */}
        </div>
    );
};

export default EventManagement;
