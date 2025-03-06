'use client';

import { Button } from '@components/ui/button';
import { useRouter } from 'next/navigation';

export default function AccountCreated() {
    const { push } = useRouter();

    return (
        <div className='flex items-center justify-center space-y-6 p-5 sm:space-y-12 sm:px-16'>
            <div
                aria-label='account created successfully page'
                className='space-y-4'
            >
                <h1 className='text-xl font-bold leading-26'>
                    Account Successfully Created
                </h1>
                <p className='text-sm font-normal leading-[20.72px]'>
                    Your account is set up and ready to go.
                </p>
            </div>

            <Button
                type='button'
                aria-label='button to login page'
                className='w-full'
                onClick={() => push('/auth/login')}
            >
                Continue to Login
            </Button>
        </div>
    );
}
