import { OrganizationAndEnterpriseIcon } from '@src/icons';

const RevlrLandingSection = () => {
    return (
        <section className='p-4 text-center md:px-24 md:py-16'>
            <h1 className='mb-4 font-montserrat text-xl font-semibold text-[#001433] md:text-[32px]'>
                Who Is REVLR For?
            </h1>

            <p className='mx-auto mb-16 max-w-[470px] font-inter text-sm font-normal text-[#4C5563] md:text-lg'>
                While most event platforms focus on ticketing or logistics,
                REVLR offers an all-in-one event ecosystem for organizations,
                businesses and independent planners.
            </p>

            <div className='grid gap-6 md:grid-cols-3'>
                <div className='group relative h-[400px] cursor-pointer rounded-lg bg-[#F1F6FF] px-8 pb-2 pt-8'>
                    <div className='hidden justify-center pb-6 pt-24 md:flex'>
                        <OrganizationAndEnterpriseIcon />
                    </div>
                    <h2 className='hidden pb-3 text-xl font-semibold text-[#374252] md:block'>
                        For Organizations & Enterprises
                    </h2>
                    <p className='hidden text-base font-normal text-[#6B7380] md:block'>
                        Manage multiple events, track performance and easily
                        connect to your business tools.
                    </p>
                    <img
                        src='/assets/images/organization.png'
                        alt='Organizations Hover Image'
                        className='absolute inset-0 mx-auto block size-full rounded-lg object-cover group-hover:block md:hidden'
                    />
                </div>

                <div className='group relative h-[400px] cursor-pointer rounded-lg bg-[#F1F6FF] px-8 pb-2 pt-8'>
                    <div className='hidden justify-center pb-6 pt-24 md:flex'></div>
                    <h2 className='hidden pb-3 text-xl font-semibold text-[#374252] md:block'>
                        For Individual Event Creators
                    </h2>
                    <p className='hidden text-base font-normal text-[#6B7380] md:block'>
                        Customize event pages, automate guest engagement & boost
                        ticket sales.
                    </p>
                    <img
                        src='/assets/images/individual.png'
                        alt='Organizations Hover Image'
                        className='absolute inset-0 mx-auto block size-full rounded-lg object-cover group-hover:block md:hidden'
                    />
                </div>

                <div className='group relative h-[400px] cursor-pointer rounded-lg bg-[#F1F6FF] px-8 pb-2 pt-8'>
                    <div className='hidden justify-center pb-6 pt-24 md:flex'>
                        <svg
                            width='157'
                            height='156'
                            viewBox='0 0 157 156'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M104.42 71.5318C115.157 71.5318 123.76 62.8642 123.76 52.1268C123.76 41.3895 115.157 32.7219 104.42 32.7219C93.6827 32.7219 85.0152 41.3895 85.0152 52.1268C85.0152 62.8642 93.6827 71.5318 104.42 71.5318ZM52.6736 71.5318C63.411 71.5318 72.0139 62.8642 72.0139 52.1268C72.0139 41.3895 63.411 32.7219 52.6736 32.7219C41.9363 32.7219 33.2687 41.3895 33.2687 52.1268C33.2687 62.8642 41.9363 71.5318 52.6736 71.5318ZM52.6736 84.4684C37.6025 84.4684 7.39551 92.0363 7.39551 107.107V116.81C7.39551 120.367 10.3062 123.278 13.8638 123.278H91.4835C95.0411 123.278 97.9518 120.367 97.9518 116.81V107.107C97.9518 92.0363 67.7448 84.4684 52.6736 84.4684ZM104.42 84.4684C102.544 84.4684 100.41 84.5977 98.1458 84.7918C98.2752 84.8565 98.3399 84.9858 98.4046 85.0505C105.778 90.4192 110.888 97.599 110.888 107.107V116.81C110.888 119.074 110.436 121.273 109.724 123.278H143.23C146.788 123.278 149.698 120.367 149.698 116.81V107.107C149.698 92.0363 119.491 84.4684 104.42 84.4684Z'
                                fill='#3D8BFF'
                            />
                        </svg>
                    </div>
                    <h2 className='hidden pb-3 text-xl font-semibold text-[#374252] md:block'>
                        For Attendees
                    </h2>
                    <p className='hidden text-base font-normal text-[#6B7380] md:block'>
                        Discover events, buy & resell tickets and get real-time
                        updates fast.
                    </p>
                    <img
                        src='/assets/images/attendee.png'
                        alt='Organizations Hover Image'
                        className='absolute inset-0 mx-auto block size-full rounded-lg object-cover group-hover:block md:hidden'
                    />
                </div>
            </div>
        </section>
    );
};

export default RevlrLandingSection;
