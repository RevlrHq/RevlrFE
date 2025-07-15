const EventDetailsLoading = () => {
    return (
        <div className='min-h-screen bg-gray-50'>
            <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
                <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
                    {/* Main Content Skeleton */}
                    <div className='lg:col-span-2'>
                        {/* Header Skeleton */}
                        <div className='mb-8 animate-pulse'>
                            <div className='mb-4 h-64 w-full rounded-lg bg-gray-300 sm:h-80'></div>
                            <div className='mb-2 h-8 w-3/4 rounded bg-gray-300'></div>
                            <div className='mb-4 h-4 w-1/2 rounded bg-gray-300'></div>
                            <div className='flex space-x-4'>
                                <div className='h-4 w-24 rounded bg-gray-300'></div>
                                <div className='h-4 w-32 rounded bg-gray-300'></div>
                            </div>
                        </div>

                        {/* Content Skeleton */}
                        <div className='animate-pulse space-y-4'>
                            <div className='h-6 w-32 rounded bg-gray-300'></div>
                            <div className='space-y-2'>
                                <div className='h-4 w-full rounded bg-gray-300'></div>
                                <div className='h-4 w-full rounded bg-gray-300'></div>
                                <div className='h-4 w-3/4 rounded bg-gray-300'></div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className='lg:col-span-1'>
                        <div className='sticky top-8 space-y-6'>
                            {/* Ticket Section Skeleton */}
                            <div className='animate-pulse rounded-lg bg-white p-6 shadow-sm'>
                                <div className='mb-4 h-6 w-24 rounded bg-gray-300'></div>
                                <div className='space-y-3'>
                                    <div className='h-16 w-full rounded bg-gray-300'></div>
                                    <div className='h-10 w-full rounded bg-gray-300'></div>
                                </div>
                            </div>

                            {/* Organizer Section Skeleton */}
                            <div className='animate-pulse rounded-lg bg-white p-6 shadow-sm'>
                                <div className='mb-4 h-6 w-32 rounded bg-gray-300'></div>
                                <div className='flex items-center space-x-3'>
                                    <div className='size-12 rounded-full bg-gray-300'></div>
                                    <div className='space-y-2'>
                                        <div className='h-4 w-24 rounded bg-gray-300'></div>
                                        <div className='h-3 w-32 rounded bg-gray-300'></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailsLoading;
