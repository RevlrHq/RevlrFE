import { Skeleton } from '@components/ui/skeleton';

export default function Loading() {
    return (
        <div className='space-y-4 p-4'>
            <Skeleton className='h-8 w-full max-w-sm' />
            <Skeleton className='h-32 w-full' />
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                <Skeleton className='h-24' />
                <Skeleton className='h-24' />
                <Skeleton className='h-24' />
            </div>
        </div>
    );
}
