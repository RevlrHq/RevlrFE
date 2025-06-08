import React from 'react';
import Image from 'next/image';

const ResaleCard = () => {
    return (
        // <div className='flex flex-row rounded-xl bg-[#FFD7001A] p-10 md:mx-auto md:max-w-6xl'>
        //     <div className='flex flex-1 flex-col gap-12'>
        //         <div className='flex w-[140px] items-center justify-center rounded-full border border-[#FFD700] bg-[#FFD700] px-2 py-1 font-inter text-sm font-semibold text-[#4C5563]'>
        //             NEW FEATURE
        //         </div>
        //         <div className='flex flex-col gap-4'>
        //             <div>
        //                 <h2 className='font-montserrat text-[24px] font-semibold text-[#001433]'>
        //                     Bought a ticket but can’t attend?
        //                 </h2>
        //                 <h2 className='font-montserrat text-[24px] font-semibold text-[#001433]'>
        //                     Easily resell your ticket.
        //                 </h2>
        //             </div>
        //             <p className='font-inter text-base font-normal text-[#4C5563]'>
        //                 List it before the event and get your money back — no
        //                 stress.
        //             </p>
        //         </div>
        //         <button className='w-48 gap-2 rounded-xl border border-revlr-primary-blue bg-revlr-primary-blue px-6 py-4 font-inter text-base font-medium text-white'>
        //             Resell Your Ticket
        //         </button>
        //     </div>
        //     <div className='relative flex flex-1 items-center justify-center'>
        //         <Image
        //             src='/assets/images/resale.png'
        //             alt='sanda-music-festival'
        //             width={500}
        //             height={500}
        //             className='object-cover'
        //         />
        //     </div>
        // </div>

        <div className='flex flex-col-reverse items-center gap-6 rounded-xl bg-[#FFD7001A] p-6 md:mx-auto md:max-w-6xl md:flex-row md:items-start md:p-10'>
            {/* Text Content */}
            <div className='flex flex-1 flex-col gap-6 md:gap-12'>
                <div className='flex w-fit items-center justify-center rounded-full border border-[#FFD700] bg-[#FFD700] px-2 py-1 font-inter text-xs font-semibold text-[#4C5563] md:text-sm'>
                    NEW FEATURE
                </div>
                <div className='flex flex-col gap-2 md:gap-4'>
                    <h2 className='font-montserrat text-xl font-semibold text-[#001433] md:text-2xl'>
                        Bought a ticket but can’t attend?
                    </h2>
                    <h2 className='font-montserrat text-xl font-semibold text-[#001433] md:text-2xl'>
                        Easily resell your ticket.
                    </h2>
                    <p className='font-inter text-sm font-normal text-[#4C5563] md:text-base'>
                        List it before the event and get your money back — no
                        stress.
                    </p>
                </div>
                <button className='w-48 gap-2 rounded-xl border border-revlr-primary-blue bg-revlr-primary-blue px-6 py-4 font-inter text-base font-medium text-white'>
                    Resell Your Ticket
                </button>
            </div>

            {/* Image */}
            <div className='relative flex w-full max-w-sm items-center justify-center md:flex-1'>
                <Image
                    src='/assets/images/resale.png'
                    alt='sanda-music-festival'
                    width={500}
                    height={500}
                    className='object-contain'
                />
            </div>
        </div>
    );
};

export default ResaleCard;
