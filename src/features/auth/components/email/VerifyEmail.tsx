'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Button } from '@components/ui/button';

import successBadge from '~/public/assets/images/success-badge.svg';

export default function VerifyEmail() {
    const { push } = useRouter();

    return (
        <div className='flex items-center justify-center space-y-6 p-5'>
            <Image
                src={successBadge}
                alt='success badge image'
                className='size-20'
            />
            <div
                aria-label='account created successfully page'
                className='space-y-4'
            >
                <h1 className='text-xl font-bold leading-[26.4px]'>
                    Verify Your Email
                </h1>
                <p className='text-sm font-normal leading-[20.72px]'>
                    You're almost there! We’ve sent a verification link to
                    chu***ess@gmail.com to verify your email To complete your
                    account setup, please verify your email address.
                </p>
            </div>

            <Button
                type='button'
                aria-label='button to login page'
                className='w-full'
                onClick={() => push('/auth/login')}
            >
                Resend link
            </Button>
        </div>
    );
}
