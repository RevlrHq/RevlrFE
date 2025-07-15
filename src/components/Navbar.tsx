'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '../lib/ThemeContext';

interface NavbarProps {
    isOrganizer: boolean;
}

export const Navbar = ({ isOrganizer }: NavbarProps) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    return (
        <header className='fixed left-0 top-0 z-50 flex h-[80px] w-full border-b border-gray-200 bg-white/80 backdrop-blur-md transition-all duration-300 dark:border-revlr-dark-border dark:bg-revlr-dark-bg/80'>
            <div className='flex w-full max-w-[1440px] items-center justify-between gap-8 px-6 py-5 md:mx-auto md:px-24'>
                {/* Logo */}
                <Link
                    href='/'
                    className='font-montserrat text-2xl font-extrabold text-revlr-primary-blue transition-colors duration-300 dark:text-white'
                >
                    <span className='text-revlr-primary-yellow'>🎉</span>REVLR
                </Link>

                {/* Desktop Navigation */}
                <nav className='hidden items-center gap-8 md:flex'>
                    {isOrganizer ? (
                        <div className='flex items-center gap-8'>
                            <Link
                                href='/features'
                                className='text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-revlr-primary-blue dark:text-gray-300 dark:hover:text-white'
                            >
                                Features
                            </Link>
                            <Link
                                href='/pricing'
                                className='text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-revlr-primary-blue dark:text-gray-300 dark:hover:text-white'
                            >
                                Pricing
                            </Link>
                            <Link
                                href='/how-it-works'
                                className='text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-revlr-primary-blue dark:text-gray-300 dark:hover:text-white'
                            >
                                How It Works
                            </Link>
                            <Link
                                href='/events'
                                className='text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-revlr-primary-blue dark:text-gray-300 dark:hover:text-white'
                            >
                                Browse Events
                            </Link>
                        </div>
                    ) : (
                        <div className='relative flex items-center'>
                            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 16 16'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M5.91667 11.3333C4.40278 11.3333 3.12153 10.809 2.07292 9.76042C1.02431 8.71181 0.5 7.43056 0.5 5.91667C0.5 4.40278 1.02431 3.12153 2.07292 2.07292C3.12153 1.02431 4.40278 0.5 5.91667 0.5C7.43056 0.5 8.71181 1.02431 9.76042 2.07292C10.809 3.12153 11.3333 4.40278 11.3333 5.91667C11.3333 6.52778 11.2361 7.10417 11.0417 7.64583C10.8472 8.1875 10.5833 8.66667 10.25 9.08333L14.9167 13.75C15.0694 13.9028 15.1458 14.0972 15.1458 14.3333C15.1458 14.5694 15.0694 14.7639 14.9167 14.9167C14.7639 15.0694 14.5694 15.1458 14.3333 15.1458C14.0972 15.1458 13.9028 15.0694 13.75 14.9167L9.08333 10.25C8.66667 10.5833 8.1875 10.8472 7.64583 11.0417C7.10417 11.2361 6.52778 11.3333 5.91667 11.3333ZM5.91667 9.66667C6.95833 9.66667 7.84375 9.30208 8.57292 8.57292C9.30208 7.84375 9.66667 6.95833 9.66667 5.91667C9.66667 4.875 9.30208 3.98958 8.57292 3.26042C7.84375 2.53125 6.95833 2.16667 5.91667 2.16667C4.875 2.16667 3.98958 2.53125 3.26042 3.26042C2.53125 3.98958 2.16667 4.875 2.16667 5.91667C2.16667 6.95833 2.53125 7.84375 3.26042 8.57292C3.98958 9.30208 4.875 9.66667 5.91667 9.66667Z'
                                        fill='currentColor'
                                    />
                                </svg>
                            </span>
                            <input
                                type='text'
                                placeholder='Search events, venues, organizers...'
                                className='w-[400px] rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 font-inter text-sm font-medium text-gray-700 transition-all duration-200 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 dark:border-revlr-dark-border dark:bg-revlr-dark-card dark:text-gray-300 dark:placeholder:text-gray-400 dark:focus:border-revlr-primary-yellow'
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className='flex items-center gap-4'>
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className='rounded-lg bg-gray-100 p-2 transition-colors duration-200 hover:bg-gray-200 dark:bg-revlr-dark-card dark:hover:bg-revlr-dark-border'
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

                        {!isOrganizer && (
                            <div className='flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400'>
                                <svg
                                    className='size-4'
                                    fill='currentColor'
                                    viewBox='0 0 20 20'
                                >
                                    <path
                                        fillRule='evenodd'
                                        d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
                                        clipRule='evenodd'
                                    />
                                </svg>
                                Lagos
                                <svg
                                    className='size-3'
                                    fill='currentColor'
                                    viewBox='0 0 20 20'
                                >
                                    <path
                                        fillRule='evenodd'
                                        d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                                        clipRule='evenodd'
                                    />
                                </svg>
                            </div>
                        )}

                        <Link
                            href='/auth/login'
                            className='text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-revlr-primary-blue dark:text-gray-300 dark:hover:text-white'
                        >
                            Sign In
                        </Link>

                        <Link
                            href='/create-event'
                            className='rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl'
                        >
                            {isOrganizer ? 'Create Event' : 'List Event'}
                        </Link>
                    </div>
                </nav>

                {/* Mobile Menu Button */}
                <div className='flex items-center gap-4 md:hidden'>
                    <button
                        onClick={toggleTheme}
                        className='rounded-lg bg-gray-100 p-2 transition-colors duration-200 hover:bg-gray-200 dark:bg-revlr-dark-card dark:hover:bg-revlr-dark-border'
                        aria-label='Toggle theme'
                    >
                        {theme === 'light' ? (
                            <svg
                                className='size-4 text-gray-600'
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
                                className='size-4 text-revlr-primary-yellow'
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

                    <Link
                        href='/create-event'
                        className='rounded-lg bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-4 py-2 text-sm font-semibold text-white'
                    >
                        Create
                    </Link>

                    <button
                        className='rounded-md bg-gray-100 p-2 transition-colors duration-200 dark:bg-revlr-dark-card'
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? (
                            <svg
                                className='size-5 text-gray-600 dark:text-gray-300'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M6 18L18 6M6 6l12 12'
                                />
                            </svg>
                        ) : (
                            <svg
                                className='size-5 text-gray-600 dark:text-gray-300'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M4 6h16M4 12h16M4 18h16'
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className='absolute left-0 top-20 w-full border-b border-gray-200 bg-white/95 p-6 shadow-lg backdrop-blur-md transition-all duration-300 dark:border-revlr-dark-border dark:bg-revlr-dark-bg/95 md:hidden'>
                    <nav className='flex flex-col gap-4'>
                        {isOrganizer ? (
                            <>
                                <Link
                                    href='/features'
                                    className='text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-revlr-primary-blue dark:text-gray-300 dark:hover:text-white'
                                >
                                    Features
                                </Link>
                                <Link
                                    href='/pricing'
                                    className='text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-revlr-primary-blue dark:text-gray-300 dark:hover:text-white'
                                >
                                    Pricing
                                </Link>
                                <Link
                                    href='/how-it-works'
                                    className='text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-revlr-primary-blue dark:text-gray-300 dark:hover:text-white'
                                >
                                    How It Works
                                </Link>
                                <Link
                                    href='/events'
                                    className='text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-revlr-primary-blue dark:text-gray-300 dark:hover:text-white'
                                >
                                    Browse Events
                                </Link>
                            </>
                        ) : (
                            <div className='relative mb-4'>
                                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                    <svg
                                        className='size-4'
                                        fill='currentColor'
                                        viewBox='0 0 20 20'
                                    >
                                        <path
                                            fillRule='evenodd'
                                            d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                </span>
                                <input
                                    type='text'
                                    placeholder='Search events...'
                                    className='w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 font-inter text-sm font-medium text-gray-700 transition-all duration-200 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 dark:border-revlr-dark-border dark:bg-revlr-dark-card dark:text-gray-300 dark:placeholder:text-gray-400'
                                />
                            </div>
                        )}

                        <Link
                            href='/auth/login'
                            className='text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-revlr-primary-blue dark:text-gray-300 dark:hover:text-white'
                        >
                            Sign In
                        </Link>

                        <Link
                            href='/create-event'
                            className='rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 text-center text-sm font-semibold text-white transition-all duration-200'
                        >
                            Create Event
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
};
