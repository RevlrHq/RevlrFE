import React from 'react';

const FeatureComparison = () => {
    return (
        <div className='mb-16 bg-[#F7F8FA] px-4 py-8 md:mx-auto md:px-24'>
            <h2 className='mx-auto w-full text-center font-montserrat text-xl font-semibold text-[#001433] md:w-[530px] md:text-[32px]'>
                Plan In Minutes, Not Hours
            </h2>

            <div className='mt-8 flex flex-col gap-2 md:mt-16 md:flex-row md:gap-4'>
                <div className='my-2 flex-1 rounded-md bg-[#FFFFFF] px-8 py-6 text-left md:my-6 md:p-8'>
                    <div className='flex flex-col gap-1'>
                        <h2 className='font-inter text-xl font-normal text-[#001433]'>
                            With Other
                        </h2>
                        <h6 className='font-inter text-xl font-medium text-[#001433]'>
                            Event Management Tools
                        </h6>
                    </div>
                    <ul className='mt-6 space-y-6 font-inter text-sm font-medium text-[#001433] md:text-base'>
                        {[
                            'Manually juggling spreadsheets for guest lists',
                            'Struggling to track ticket sales in real time',
                            'Last-minute confusion with vendors & payments',
                            'No easy way to engage with attendees',
                            'Stressing over refunds & event logistics',
                        ].map((item, index) => (
                            <li key={index} className='flex items-center gap-2'>
                                <svg
                                    width='20'
                                    height='20'
                                    viewBox='0 0 20 20'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <rect
                                        x='0.5'
                                        y='0.5'
                                        width='19'
                                        height='19'
                                        rx='9.5'
                                        stroke='#9DA4B0'
                                    />
                                    <path
                                        d='M13.9818 6.02444C13.7353 5.77795 13.3371 5.77795 13.0906 6.02444L10 9.10875L6.90936 6.01812C6.66287 5.77163 6.26469 5.77163 6.0182 6.01812C5.77171 6.26461 5.77171 6.66279 6.0182 6.90929L9.10883 9.99992L6.0182 13.0906C5.77171 13.337 5.77171 13.7352 6.0182 13.9817C6.26469 14.2282 6.66287 14.2282 6.90936 13.9817L10 10.8911L13.0906 13.9817C13.3371 14.2282 13.7353 14.2282 13.9818 13.9817C14.2283 13.7352 14.2283 13.337 13.9818 13.0906L10.8912 9.99992L13.9818 6.90929C14.222 6.66911 14.222 6.26461 13.9818 6.02444Z'
                                        fill='#9DA4B0'
                                    />
                                </svg>

                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className='my-2 flex-1 rounded-md bg-[#0049BB] px-8 py-6 text-left md:my-6 md:p-8'>
                    <div className='flex flex-col gap-1'>
                        <h2 className='font-inter text-xl font-normal text-[#FFFFFF]'>
                            With
                        </h2>
                        <h6 className='font-inter text-xl font-extrabold text-[#FFD700]'>
                            REVLR
                        </h6>
                    </div>
                    <ul className='mt-6 space-y-6 font-inter text-base font-medium text-[#FFFFFF]'>
                        {[
                            'Everything in one dashboard, no spreadsheets needed',
                            'Live insights on ticket sales & audience engagement',
                            'Vendors & payments are automated & streamlined',
                            'Attendees get instant updates & event reminders',
                            'Built-in refund management, zero stress',
                        ].map((item, index) => (
                            <li key={index} className='flex items-center gap-2'>
                                <svg
                                    width='24'
                                    height='24'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M8.795 15.8749L5.325 12.4049C4.935 12.0149 4.305 12.0149 3.915 12.4049C3.525 12.7949 3.525 13.4249 3.915 13.8149L8.095 17.9949C8.485 18.3849 9.115 18.3849 9.505 17.9949L20.085 7.4149C20.475 7.0249 20.475 6.3949 20.085 6.0049C19.695 5.6149 19.065 5.6149 18.675 6.0049L8.795 15.8749Z'
                                        fill='#93BEFF'
                                    />
                                </svg>
                                {item}
                            </li>
                        ))}
                    </ul>
                    <div className='flex justify-end'>
                        <button className='mt-6 rounded-xl border border-[#FFFFFF] bg-[#FFFFFF] px-2.5 py-3 text-center font-inter text-sm font-semibold text-[#001433] md:p-4'>
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeatureComparison;
