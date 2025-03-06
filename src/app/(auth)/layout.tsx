// import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

import AppLogo from '@components/app-logo';
import AuthCarousel from '@features/auth/components/AuthCarousel';

export const metadata: Metadata = {
    title: 'Chit - Authentication ',
    description: '',
};

type AuthLayoutProps = {
    children: ReactNode;
};

export default function Authlayout({ children }: AuthLayoutProps) {
    return (
        <section className='h-dvh w-full'>
            <header className='h-14 px-5 pt-4 sm:hidden'>
                <AppLogo />
            </header>

            <section className='grid size-full grid-cols-1 md:grid-cols-2 md:gap-6 md:p-4'>
                <div className='relative order-first hidden size-full overflow-hidden rounded-[32px] bg-gradient-to-t from-[#211364] to-[#442BB6] sm:order-last sm:flex sm:flex-col'>
                    <div className='hidden h-12 px-20 pt-10 sm:block'>
                        <AppLogo isIcon={true} />
                    </div>

                    <div className='flex size-full items-center justify-center'>
                        <AuthCarousel />
                    </div>
                </div>
                <div className='order-last flex flex-col rounded-3xl bg-chit-milk-white sm:order-first sm:bg-white'>
                    {children}
                </div>
            </section>
        </section>
    );
}
