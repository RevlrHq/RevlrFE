'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useTheme } from '../../lib/ThemeContext';
import Link from 'next/link';
import VerifyForm from './components/VerifyForm';
import { StandardResponseOfUserView } from '@lib/services';
import { useAuthStore } from '@src/stores/authStore';

const Verify = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setUser } = useAuthStore();
    let token = searchParams.get('token');
    if (token) {
        token = token.replace(/ /g, '+');
    }
    const email = searchParams.get('email') || '';
    const { theme, toggleTheme } = useTheme();

    const handleSuccess = (data: StandardResponseOfUserView) => {
        setUser(data.data!, data?.data?.token as string);
        if (data.data?.isOrganizer as boolean) {
            router.push('/dashboard/event/create-event');
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div className='relative min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 transition-all duration-500 dark:from-revlr-dark-bg dark:via-revlr-dark-bg dark:to-revlr-dark-card'>
            {/* Background Pattern */}
            <div className='bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%230066FF" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] dark:bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23FFD700" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] absolute inset-0'></div>

            {/* Header */}
            <header className='relative z-10 flex items-center justify-between p-6 md:p-8'>
                <Link
                    href='/'
                    className='font-montserrat text-2xl font-extrabold text-revlr-primary-blue transition-colors duration-300 dark:text-white'
                >
                    <span className='text-revlr-primary-yellow'>🎉</span>REVLR
                </Link>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className='rounded-lg bg-white/80 p-2 shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-white dark:bg-revlr-dark-card/80 dark:hover:bg-revlr-dark-border'
                    aria-label='Toggle theme'
                >
                    {theme === 'light' ? (
                        <svg
                            className='size-5 text-gray-600'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
                            />
                        </svg>
                    ) : (
                        <svg
                            className='size-5 text-revlr-primary-yellow'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                            />
                        </svg>
                    )}
                </button>
            </header>

            {/* Main Content */}
            <div className='relative z-10 flex min-h-[calc(100vh-120px)] items-center justify-center px-6'>
                <div className='w-full max-w-6xl'>
                    <div className='grid items-center gap-16 lg:grid-cols-2'>
                        {/* Left Side - Welcome Content */}
                        <div className='space-y-8 text-center lg:text-left'>
                            <div className='space-y-6'>
                                <div className='inline-flex items-center gap-2 rounded-full border border-revlr-primary-blue/20 bg-gradient-to-r from-revlr-primary-blue/10 to-revlr-accent-purple/10 px-4 py-2 dark:from-revlr-primary-blue/20 dark:to-revlr-accent-purple/20'>
                                    <span className='text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                        ✅
                                    </span>
                                    <span className='text-sm font-medium text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                        Final Step
                                    </span>
                                </div>

                                <h1 className='font-montserrat text-4xl font-bold leading-tight text-gray-900 dark:text-white md:text-5xl'>
                                    Complete Your
                                    <span className='bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple bg-clip-text text-transparent'>
                                        {' '}
                                        Profile
                                    </span>
                                </h1>

                                <p className='text-lg leading-relaxed text-gray-600 dark:text-gray-300'>
                                    Just a few more details to get you started.
                                    Let us know who you are to personalize your
                                    experience.
                                </p>
                            </div>
                        </div>

                        {/* Right Side - Verification Form */}
                        <div className='flex justify-center lg:justify-end'>
                            <VerifyForm
                                email={email}
                                token={token}
                                onSuccess={handleSuccess}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Elements */}
            <div className='absolute right-20 top-20 size-20 rounded-full bg-gradient-to-br from-revlr-primary-yellow to-revlr-accent-orange opacity-20 blur-xl'></div>
            <div className='absolute bottom-20 left-20 size-16 rounded-full bg-gradient-to-br from-revlr-accent-purple to-revlr-primary-blue opacity-20 blur-xl'></div>
        </div>
    );
};

export default Verify;
