import React from 'react';

const ResaleCard = () => {
    return (
        <div className='rounded-xl bg-[#FFD7001A] p-10'>
            <div className='flex flex-col gap-12'>
                <div className='rounded-full border border-[#FFD700] bg-[#FFD700] px-2 py-1 font-inter text-sm font-semibold text-[#4C5563]'>
                    NEW FEATURE
                </div>
                <div className='flex flex-col gap-4'>
                    <h2 className='font-montserrat text-[32px] font-semibold text-[#001433]'>
                        Bought a ticket but can’t attend? Easily resell your
                        ticket.
                    </h2>
                    <p className='font-inter text-lg font-normal text-[#6B7380]'>
                        {' '}
                        List it before the event and get your money back — no
                        stress.
                    </p>
                </div>
                <button>Resell Your Ticket</button>
            </div>
            <div></div>
        </div>
    );
};

export default ResaleCard;
