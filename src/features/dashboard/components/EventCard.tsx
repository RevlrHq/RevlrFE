import React from 'react';
import Image from 'next/image';

interface IEventCardProps {
    event: {
        id: string;
        title: string;
        date: string;
        time: string;
        ticketsSold: number;
        status: string;
        image?: string;
    };
}

const EventCard = ({ event }: IEventCardProps) => {
    const getStatusBadgeStyles = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-[#F1FDF4] text-[#13803D] border-[#22C55E]';
            case 'Past':
                return 'bg-[#F7F8FA] text-[#6B7380] border-[#6B7380]';
            case 'Upcoming':
                return 'bg-[#F1F6FF] text-[#0066FF] border-[#0066FF]';
            case 'Drafts':
                return 'bg-[#FFFBEA] text-[#B45407] border-[#F59E0B]';
            default:
                return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const getTicketSalesText = (sales: number, status: string) => {
        if (status === 'Active' && sales === 0) return 'Sold Out';
        if (status === 'Past') return `${sales} Sold`;
        if (sales === 0) return '0 sold';
        return `${sales} sold`;
    };

    return (
        <div className='flex flex-row gap-4 rounded-lg bg-white p-6 shadow-sm'>
            <div className='relative size-48 overflow-hidden rounded-xl'>
                {event.image ? (
                    <div className='relative size-full'>
                        <Image
                            src={event.image}
                            alt={event.title}
                            layout='fill'
                            objectFit='cover'
                            className='rounded-xl'
                        />
                    </div>
                ) : (
                    <div className='flex size-full items-center justify-center bg-gray-200'>
                        <svg
                            className='size-10 text-gray-400'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                            ></path>
                        </svg>
                    </div>
                )}
            </div>

            {/* Event Details */}
            <div className='flex grow flex-col justify-between'>
                <div className='space-y-4'>
                    <h2 className='font-inter text-base font-semibold text-[#001433]'>
                        {event.title}
                    </h2>

                    {/* Date */}
                    <div className='flex items-center gap-2 text-gray-600'>
                        <svg
                            width='14'
                            height='16'
                            viewBox='0 0 14 16'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M12.332 2.00008H11.6654V1.33341C11.6654 0.966748 11.3654 0.666748 10.9987 0.666748C10.632 0.666748 10.332 0.966748 10.332 1.33341V2.00008H3.66536V1.33341C3.66536 0.966748 3.36536 0.666748 2.9987 0.666748C2.63203 0.666748 2.33203 0.966748 2.33203 1.33341V2.00008H1.66536C0.932031 2.00008 0.332031 2.60008 0.332031 3.33341V14.0001C0.332031 14.7334 0.932031 15.3334 1.66536 15.3334H12.332C13.0654 15.3334 13.6654 14.7334 13.6654 14.0001V3.33341C13.6654 2.60008 13.0654 2.00008 12.332 2.00008ZM11.6654 14.0001H2.33203C1.96536 14.0001 1.66536 13.7001 1.66536 13.3334V5.33341H12.332V13.3334C12.332 13.7001 12.032 14.0001 11.6654 14.0001Z'
                                fill='#374252'
                            />
                        </svg>
                        <span className='font-inter text-sm font-medium text-[#374252]'>
                            {event.date || 'Not Set'}
                        </span>
                    </div>

                    {/* Time */}
                    <div className='flex items-center gap-2 text-gray-600'>
                        <svg
                            className='size-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                            ></path>
                        </svg>
                        <span className='font-inter text-sm font-medium text-[#374252]'>
                            {event.time || 'Not Set'}
                        </span>
                    </div>
                </div>

                <div className='flex items-center justify-between'>
                    {/* Ticket Sales */}
                    <div className='flex items-center gap-2 text-gray-500'>
                        <svg
                            width='20'
                            height='20'
                            viewBox='0 0 20 20'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M18.3346 8.95825C18.6763 8.95825 18.9596 8.67492 18.9596 8.33325V7.49992C18.9596 3.82492 17.843 2.70825 14.168 2.70825H8.95964V4.58325C8.95964 4.92492 8.6763 5.20825 8.33464 5.20825C7.99297 5.20825 7.70964 4.92492 7.70964 4.58325V2.70825H5.83464C2.15964 2.70825 1.04297 3.82492 1.04297 7.49992V7.91658C1.04297 8.25825 1.3263 8.54158 1.66797 8.54158C2.46797 8.54158 3.1263 9.19992 3.1263 9.99992C3.1263 10.7999 2.46797 11.4583 1.66797 11.4583C1.3263 11.4583 1.04297 11.7416 1.04297 12.0833V12.4999C1.04297 16.1749 2.15964 17.2916 5.83464 17.2916H7.70964V15.4166C7.70964 15.0749 7.99297 14.7916 8.33464 14.7916C8.6763 14.7916 8.95964 15.0749 8.95964 15.4166V17.2916H14.168C17.843 17.2916 18.9596 16.1749 18.9596 12.4999C18.9596 12.1583 18.6763 11.8749 18.3346 11.8749C17.5346 11.8749 16.8763 11.2166 16.8763 10.4166C16.8763 9.61659 17.5346 8.95825 18.3346 8.95825ZM8.95964 11.8083C8.95964 12.1499 8.6763 12.4333 8.33464 12.4333C7.99297 12.4333 7.70964 12.1499 7.70964 11.8083V8.19159C7.70964 7.84992 7.99297 7.56659 8.33464 7.56659C8.6763 7.56659 8.95964 7.84992 8.95964 8.19159V11.8083Z'
                                fill='#292D32'
                            />
                        </svg>
                        <span className='font-inter text-sm font-normal text-[#001433]'>
                            {getTicketSalesText(
                                event.ticketsSold,
                                event.status
                            )}
                        </span>
                    </div>

                    {/* Status Badge */}
                    <span
                        className={`rounded-full border px-2 py-1 font-inter text-xs font-medium ${getStatusBadgeStyles(event.status)}`}
                    >
                        {event.status}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default EventCard;
