import React from 'react';
import Image from 'next/image';

const TicketCard = ({
    ticket,
}: {
    ticket: {
        id: number;
        title: string;
        date: string;
        location: string;
        quantity: string;
        price: string;
        image: string;
    };
}) => {
    return (
        <div className='flex w-[730px] gap-11 rounded-lg border border-[#F2F3F5] bg-white p-8'>
            <div className='relative mb-2 size-48 rounded-xl'>
                <Image
                    src='/assets/images/event-image.png'
                    alt='sanda-music-festival'
                    fill
                    className='object-cover'
                />
            </div>

            <div className='flex w-full flex-col gap-8'>
                <div className='flex flex-col gap-2 border-b border-[#E4E6EB]'>
                    <h3 className='font-inter text-lg font-semibold text-[#001433]'>
                        {ticket.title}
                    </h3>
                    <p className='font-inter text-base font-normal text-[#001433]'>
                        {ticket.date}
                    </p>
                    <p className='mb-4 font-inter text-base font-normal text-[#001433]'>
                        {ticket.location}
                    </p>
                </div>

                <div className='flex items-center justify-between'>
                    <span className='font-inter text-sm font-normal text-[#001433]'>
                        {ticket.quantity}
                    </span>
                    <span className='font-inter text-sm font-normal text-[#001433]'>
                        {ticket.price}
                    </span>
                </div>

                <div>
                    <button className='w-full items-center rounded-xl border border-[#E5F0FF] bg-[#F1F6FF] px-5 py-4 font-inter text-sm font-semibold text-[#0066FF]'>
                        Download Ticket
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TicketCard;
