import Image from 'next/image';

const EventSteps = () => {
    return (
        <div className='mx-auto mb-16 px-24 py-8'>
            <h2 className='text-center text-3xl font-semibold text-[#001433]'>
                From Idea To Sold-Out Event—Fast!
            </h2>
            <p className='text-center text-3xl font-semibold text-[#001433]'>
                Create & Manage Events In 3 Easy Steps
            </p>

            <div className='mt-12 flex flex-col items-center gap-16 md:flex-row'>
                <div className='relative h-[500px] w-[490px] overflow-hidden rounded-lg'>
                    <Image
                        src='/assets/images/toolclips.png'
                        alt='image'
                        fill
                        className='object-cover transition-transform duration-300 group-hover:scale-105'
                    />
                </div>

                <div className='w-[465px]'>
                    <div className='mb-12 flex flex-col'>
                        <div className='flex flex-col gap-4 border-l-4 border-[#FFD700] bg-[#FFD7000D] px-5 py-6'>
                            <div className='text-[20px] font-semibold text-[#1F2938]'>
                                1. Enter Event Details{' '}
                            </div>
                            <p className='text-lg font-normal text-[#6B7380]'>
                                Add key info and select ticket types in minutes.
                            </p>
                        </div>

                        <div className='flex flex-col gap-4 px-5 py-6'>
                            <div className='text-[20px] font-semibold text-[#1F2938]'>
                                2. Engage Your Audience
                            </div>
                            <p className='text-lg font-normal text-[#6B7380]'>
                                Automate invitations, RSVPs and reminders to
                                keep attendees informed.
                            </p>
                        </div>

                        <div className='flex flex-col gap-4 px-5 py-6'>
                            <div className='text-[20px] font-semibold text-[#1F2938]'>
                                3. Sell & Manage Effortlessly
                            </div>
                            <p className='text-lg font-normal text-[#6B7380]'>
                                Monitor real-time analytics to optimise
                                attendance, engagement and overall event
                                success.
                            </p>
                        </div>
                    </div>

                    <button className='rounded-md bg-[#FFD700] px-6 py-4 text-center text-base font-semibold text-[#001433]'>
                        Try REVLR Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventSteps;
