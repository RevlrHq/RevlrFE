'use client';

import { useState, useEffect } from 'react';
import { useSignUp } from '@hooks/useSignUp';
import { usePostLoginAction } from '@hooks/usePostLoginAction';
import AuthForm from './components/AuthForm';
import { useTheme } from '../../lib/ThemeContext';
import Link from 'next/link';

const Auth = () => {
    const [email, setEmail] = useState('');
    const [userSignedIn, setUserSignedIn] = useState(false);
    const [seconds, setSeconds] = useState(30);
    const [showButton, setShowButton] = useState(false);
    const { isSuccess, error, execute } = useSignUp();
    const { theme, toggleTheme } = useTheme();

    // Initialize post-login action hook
    usePostLoginAction();

    useEffect(() => {
        if (seconds > 0) {
            const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setShowButton(true);
        }
    }, [seconds]);

    const handleSuccess = () => {
        setUserSignedIn(true);
        setSeconds(30);
        setShowButton(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (email && emailRegex.test(email)) {
            try {
                await execute(email);

                if (isSuccess) {
                    setUserSignedIn(true);
                    setSeconds(30);
                }
                if (error) {
                    console.error('Error during login:', error);
                }
            } catch (err) {
                console.error('Unexpected error during login:', err);
            }
        } else {
            console.error('Invalid email format');
        }
    };

    if (userSignedIn) {
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
                        <span className='text-revlr-primary-yellow'>🎉</span>
                        REVLR
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

                {/* Main Content - Email Verification */}
                <div className='relative z-10 flex min-h-[calc(100vh-120px)] items-center justify-center px-6'>
                    <div className='w-full max-w-md'>
                        <div className='relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 p-8 shadow-2xl backdrop-blur-sm transition-all duration-300 dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
                            {/* Success Icon */}
                            <div className='mb-6 flex justify-center'>
                                <div className='flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-green-600'>
                                    <svg
                                        className='size-8 text-white'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Header */}
                            <div className='mb-6 space-y-2 text-center'>
                                <h2 className='font-montserrat text-2xl font-bold text-gray-900 dark:text-white'>
                                    Check Your Email
                                </h2>
                                <p className='text-gray-600 dark:text-gray-400'>
                                    We've sent you a verification link to
                                    continue. Make sure to check your spam
                                    folder too.
                                </p>
                            </div>

                            {/* Email Display */}
                            <div className='mb-6 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-revlr-dark-border dark:bg-revlr-dark-bg/50'>
                                <p className='text-center font-medium text-gray-800 dark:text-gray-200'>
                                    {email}
                                </p>
                            </div>

                            {/* Resend Section */}
                            <div className='space-y-4 text-center'>
                                <p className='text-sm text-gray-600 dark:text-gray-400'>
                                    Didn't receive the email?
                                </p>

                                {!showButton ? (
                                    <div className='flex items-center justify-center gap-2'>
                                        <div className='size-4 animate-spin rounded-full border-2 border-revlr-primary-blue border-t-transparent dark:border-revlr-primary-yellow'></div>
                                        <span className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                                            Resend available in {seconds}s
                                        </span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        className='rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 font-inter text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl'
                                    >
                                        Resend Verification Email
                                    </button>
                                )}
                            </div>

                            {/* Decorative Elements */}
                            <div className='absolute -right-4 -top-4 size-16 rounded-full bg-gradient-to-br from-revlr-primary-blue/20 to-revlr-accent-purple/20 blur-xl'></div>
                            <div className='absolute -bottom-4 -left-4 size-12 rounded-full bg-gradient-to-br from-revlr-primary-yellow/20 to-revlr-accent-orange/20 blur-xl'></div>
                        </div>

                        {/* Back to Sign Up */}
                        <div className='mt-6 text-center'>
                            <button
                                onClick={() => setUserSignedIn(false)}
                                className='text-sm text-revlr-primary-blue hover:underline dark:text-revlr-primary-yellow'
                            >
                                ← Back to Sign Up
                            </button>
                        </div>
                    </div>
                </div>

                {/* Floating Elements */}
                <div className='absolute right-20 top-20 size-20 rounded-full bg-gradient-to-br from-revlr-primary-yellow to-revlr-accent-orange opacity-20 blur-xl'></div>
                <div className='absolute bottom-20 left-20 size-16 rounded-full bg-gradient-to-br from-revlr-accent-purple to-revlr-primary-blue opacity-20 blur-xl'></div>
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
                                        ✨
                                    </span>
                                    <span className='text-sm font-medium text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                        Join REVLR Today
                                    </span>
                                </div>

                                <h1 className='font-montserrat text-4xl font-bold leading-tight text-gray-900 dark:text-white md:text-5xl'>
                                    Start Your
                                    <span className='bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple bg-clip-text text-transparent'>
                                        {' '}
                                        Event Journey
                                    </span>
                                </h1>

                                <p className='text-lg leading-relaxed text-gray-600 dark:text-gray-300'>
                                    Join thousands of event organizers who trust
                                    REVLR to create, manage, and grow their
                                    events. From intimate gatherings to
                                    large-scale conferences, we've got you
                                    covered.
                                </p>
                            </div>

                            {/* Features */}
                            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                                {[
                                    { icon: '🚀', text: 'Quick Setup' },
                                    { icon: '💰', text: 'Smart Pricing' },
                                    { icon: '📈', text: 'Growth Tools' },
                                    { icon: '🎯', text: 'Target Audience' },
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
                                    { number: '50K+', label: 'Events Created' },
                                    { number: '2M+', label: 'Tickets Sold' },
                                    { number: '98%', label: 'Success Rate' },
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

                        {/* Right Side - Sign Up Form */}
                        <div className='flex justify-center lg:justify-end'>
                            <AuthForm
                                mode='signup'
                                onSuccess={() => handleSuccess()}
                                onEmailChange={(val) => setEmail(val)}
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

export default Auth;
