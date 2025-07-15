interface EventDetailsErrorProps {
    error: string | null;
    onRetry: () => void;
}

const EventDetailsError = ({ error, onRetry }: EventDetailsErrorProps) => {
    return (
        <div className='min-h-screen bg-gray-50'>
            <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
                <div className='flex min-h-[400px] items-center justify-center'>
                    <div className='text-center'>
                        <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100'>
                            <svg
                                className='size-8 text-red-600'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                                />
                            </svg>
                        </div>
                        <h2 className='mb-2 text-2xl font-bold text-gray-900'>
                            Event Not Found
                        </h2>
                        <p className='mb-6 text-gray-600'>
                            {error ||
                                'The event you are looking for could not be found.'}
                        </p>
                        <div className='space-x-4'>
                            <button
                                onClick={onRetry}
                                className='inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className='inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailsError;
