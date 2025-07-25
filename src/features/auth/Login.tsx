'use client';

import { useEffect, useState, useRef } from 'react';
import AuthForm from './components/AuthForm';
import { useSearchParams, useRouter } from 'next/navigation';
import { useValidateLogin } from '@hooks/useValidateLogin';
import { useTheme } from '../../lib/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import Link from 'next/link';

const Login = () => {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Get token and fix the space issue caused by URL decoding of + characters
    const rawToken = searchParams.get('token');
    const token = rawToken ? rawToken.replace(/ /g, '+') : null;
    const email = searchParams.get('email') || '';
    const { isLoading, error, execute } = useValidateLogin();
    const { theme, toggleTheme } = useTheme();
    const { setUser } = useAuthStore();
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(
        null
    );
    const hasVerified = useRef(false);

    useEffect(() => {
        const verifyToken = async () => {
            if (!token || !email || hasVerified.current) return;

            hasVerified.current = true;
            setIsVerifying(true);
            setVerificationError(null);

            try {
                const response = await execute(email, token);

                // The response should contain user data and token
                if (response && response.data) {
                    const userData = response.data;
                    const authToken = userData.token || token;

                    // Set user in auth store
                    setUser(userData, authToken);

                    // Redirect to dashboard
                    router.push('/dashboard');
                }
            } catch (err) {
                console.error('Error verifying token:', err);
                setVerificationError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to verify login token'
                );
                hasVerified.current = false; // Allow retry on error
            } finally {
                setIsVerifying(false);
            }
        };

        verifyToken();
    }, [token, email]); // Removed execute, setUser, router from dependencies

    const handleSuccess = () => {
        router.push('/dashboard');
    };

    // Show loading state during token verification
    if (token && email && (isVerifying || isLoading)) {
        return (
            <div className='relative min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 transition-all duration-500 dark:from-revlr-dark-bg dark:via-revlr-dark-bg dark:to-revlr-dark-card'>
                <div className='bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%230066FF" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] dark:bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23FFD700" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] absolute inset-0'></div>

                <div className='relative z-10 flex min-h-screen items-center justify-center px-6'>
                    <div className='space-y-6 text-center'>
                        <div className='inline-flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple'>
                            <div className='size-8 animate-spin rounded-full border-4 border-white border-t-transparent'></div>
                        </div>
                        <div className='space-y-2'>
                            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                                Verifying your login...
                            </h2>
                            <p className='text-gray-600 dark:text-gray-400'>
                                Please wait while we authenticate your account
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state if token verification failed
    if (token && email && (verificationError || error)) {
        return (
            <div className='relative min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 transition-all duration-500 dark:from-revlr-dark-bg dark:via-revlr-dark-bg dark:to-revlr-dark-card'>
                <div className='bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%230066FF" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] dark:bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23FFD700" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] absolute inset-0'></div>

                <header className='relative z-10 flex items-center justify-between p-6 md:p-8'>
                    <Link
                        href='/'
                        className='font-montserrat text-2xl font-extrabold text-revlr-primary-blue transition-colors duration-300 dark:text-white'
                    >
                        <span className='text-revlr-primary-yellow'>🎉</span>
                        REVLR
                    </Link>
                </header>

                <div className='relative z-10 flex min-h-[calc(100vh-120px)] items-center justify-center px-6'>
                    <div className='max-w-md space-y-6 text-center'>
                        <div className='inline-flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20'>
                            <svg
                                className='size-8 text-red-600 dark:text-red-400'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                                />
                            </svg>
                        </div>
                        <div className='space-y-2'>
                            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                                Login Failed
                            </h2>
                            <p className='text-gray-600 dark:text-gray-400'>
                                {verificationError ||
                                    error?.message ||
                                    'The login link is invalid or has expired.'}
                            </p>
                        </div>
                        <div className='space-y-3'>
                            <button
                                onClick={() => router.push('/auth/login')}
                                className='w-full rounded-lg bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 font-medium text-white transition-all duration-200 hover:shadow-lg'
                            >
                                Try Again
                            </button>
                            <Link
                                href='/'
                                className='block text-sm text-gray-600 transition-colors hover:text-revlr-primary-blue dark:text-gray-400 dark:hover:text-revlr-primary-yellow'
                            >
                                Return to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                                        🚀
                                    </span>
                                    <span className='text-sm font-medium text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                        Welcome Back
                                    </span>
                                </div>

                                <h1 className='font-montserrat text-4xl font-bold leading-tight text-gray-900 dark:text-white md:text-5xl'>
                                    Continue Your
                                    <span className='bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple bg-clip-text text-transparent'>
                                        {' '}
                                        Event Journey
                                    </span>
                                </h1>

                                <p className='text-lg leading-relaxed text-gray-600 dark:text-gray-300'>
                                    Access your dashboard to manage events, view
                                    analytics, and connect with your audience.
                                    Your next great event is just a login away.
                                </p>
                            </div>

                            {/* Features */}
                            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                                {[
                                    { icon: '📊', text: 'Real-time Analytics' },
                                    { icon: '🎫', text: 'Smart Ticketing' },
                                    { icon: '💳', text: 'Secure Payments' },
                                    { icon: '🔄', text: 'Easy Management' },
                                ].map((feature, index) => (
                                    <div
                                        key={index}
                                        className='flex items-center gap-3 rounded-xl border border-gray-200/50 bg-white/60 p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg dark:border-revlr-dark-border dark:bg-revlr-dark-card/60'
                                    >
                                        <span className='text-2xl'>
                                            {feature.icon}
                                        </span>
                                        <span className='font-medium text-gray-800 dark:text-gray-200'>
                                            {feature.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Stats */}
                            <div className='grid grid-cols-3 gap-6 border-t border-gray-200/50 pt-8 dark:border-revlr-dark-border'>
                                {[
                                    { number: '50K+', label: 'Events' },
                                    { number: '2M+', label: 'Tickets' },
                                    { number: '98%', label: 'Satisfaction' },
                                ].map((stat, index) => (
                                    <div key={index} className='text-center'>
                                        <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                                            {stat.number}
                                        </div>
                                        <div className='text-sm text-gray-600 dark:text-gray-400'>
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Side - Login Form */}
                        <div className='flex justify-center lg:justify-end'>
                            <AuthForm
                                mode='login'
                                onSuccess={() => handleSuccess()}
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

export default Login;
