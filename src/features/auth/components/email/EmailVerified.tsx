'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Button } from '@components/ui/button';

import successBadge from '~/public/assets/images/success-badge.svg';

export default function EmailVerified() {
    const { push } = useRouter();

    return (
        <div className='flex items-center justify-center space-y-6 p-5'>
            <Image
                src={successBadge}
                alt='success badge image'
                className='size-32'
            />
            <div
                aria-label='account created successfully page'
                className='space-y-4'
            >
                <h1 className='text-xl font-bold leading-[26.4px]'>
                    Email Verification Successful
                </h1>
                <p className='text-sm font-normal leading-[20.72px]'>
                    Congratulations! You have successfully verified your email.
                    Continue to Login
                </p>
            </div>

            <Button
                type='button'
                aria-label='redirect button to login page'
                className='w-full'
                onClick={() => push('/auth/login')}
            >
                Continue to Login
            </Button>
        </div>
    );
}
