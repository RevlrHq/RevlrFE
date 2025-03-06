'use client';
import { useState } from 'react';

import Link from 'next/link';

import AppLogo from '@components/app-logo';
import { Button } from '@components/ui/button';

import AuthCarousel from './AuthCarousel';

export default function SplashScreen() {
    const [] = useState<boolean>(false);

    return (
        <section className='h-dvh w-full bg-gradient-to-t from-[#211364] to-[#442BB6]'>
            <header className='px-5 pt-4'>
                <AppLogo />
            </header>

            <section className='grid size-full grid-cols-1 md:grid-cols-2 md:gap-6 md:p-4'>
                <div className='relative flex size-full items-center justify-center overflow-hidden'>
                    <AuthCarousel />
                </div>
                <div className='flex flex-col'>
                    <div className='h-full rounded-t-3xl bg-chit-milk-white'>
                        <div className='grid grid-cols-1 gap-4 px-5 pt-16'>
                            <Button className='w-full font-semibold'>
                                Sign Up with Email
                            </Button>
                            <Button
                                variant='outline'
                                className='font-semibold text-chit-primary'
                            >
                                Sign Up with BVN
                            </Button>
                        </div>

                        <p className='mb-0 mt-6 text-center text-sm text-chit-ship-gray'>
                            Already have an account?{' '}
                            <Link href='/auth/login'>Login</Link>
                        </p>
                    </div>
                </div>
            </section>
        </section>
    );
}
