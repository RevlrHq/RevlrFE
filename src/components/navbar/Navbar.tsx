/* eslint-disable boundaries/no-unknown-files */
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface NavbarProps {
    isOrganizer: boolean;
}

export const Navbar = ({ isOrganizer }: NavbarProps) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className='fixed left-0 top-0 z-50 flex h-[80px] w-full bg-white shadow-sm'>
            <div className='flex w-full max-w-[1440px] items-center justify-between gap-8 px-6 py-5 md:mx-auto md:px-24'>
                <Link
                    href='/'
                    className='font-montserrat text-2xl font-extrabold text-revlr-primary'
                >
                    <span className='text-yellow-400'>✨</span>REVLR
                </Link>

                <nav className='hidden items-center gap-6 md:flex'>
                    {isOrganizer ? (
                        <div className='flex w-[701px] items-center gap-16'>
                            <Link
                                href='/signup'
                                className='text-sm font-medium text-[#001433]'
                            >
                                Sign Up
                            </Link>
                            <Link
                                href='/how-it-works'
                                className='text-sm font-medium text-[#001433]'
                            >
                                How It Works
                            </Link>
                            <Link
                                href='/events'
                                className='text-sm font-medium text-[#001433]'
                            >
                                Browse Events
                            </Link>
                        </div>
                    ) : (
                        <div className='relative flex items-center'>
                            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 16 16'
                                    fill='none'
                                    xmlns='http:www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M5.91667 11.3333C4.40278 11.3333 3.12153 10.809 2.07292 9.76042C1.02431 8.71181 0.5 7.43056 0.5 5.91667C0.5 4.40278 1.02431 3.12153 2.07292 2.07292C3.12153 1.02431 4.40278 0.5 5.91667 0.5C7.43056 0.5 8.71181 1.02431 9.76042 2.07292C10.809 3.12153 11.3333 4.40278 11.3333 5.91667C11.3333 6.52778 11.2361 7.10417 11.0417 7.64583C10.8472 8.1875 10.5833 8.66667 10.25 9.08333L14.9167 13.75C15.0694 13.9028 15.1458 14.0972 15.1458 14.3333C15.1458 14.5694 15.0694 14.7639 14.9167 14.9167C14.7639 15.0694 14.5694 15.1458 14.3333 15.1458C14.0972 15.1458 13.9028 15.0694 13.75 14.9167L9.08333 10.25C8.66667 10.5833 8.1875 10.8472 7.64583 11.0417C7.10417 11.2361 6.52778 11.3333 5.91667 11.3333ZM5.91667 9.66667C6.95833 9.66667 7.84375 9.30208 8.57292 8.57292C9.30208 7.84375 9.66667 6.95833 9.66667 5.91667C9.66667 4.875 9.30208 3.98958 8.57292 3.26042C7.84375 2.53125 6.95833 2.16667 5.91667 2.16667C4.875 2.16667 3.98958 2.53125 3.26042 3.26042C2.53125 3.98958 2.16667 4.875 2.16667 5.91667C2.16667 6.95833 2.53125 7.84375 3.26042 8.57292C3.98958 9.30208 4.875 9.66667 5.91667 9.66667Z'
                                        fill='#0066FF'
                                    />
                                </svg>
                            </span>
                            <input
                                type='text'
                                placeholder='Browse Events'
                                className='w-[300px] rounded-md border py-2 pl-10 pr-4 font-inter text-sm font-medium md:w-[701px]'
                            />
                        </div>
                    )}

                    {isOrganizer ? (
                        <div className=''>
                            <Link
                                href='/create-event'
                                className='hidden rounded-md bg-revlr-primary px-4 py-2 text-sm font-semibold text-white md:block'
                            >
                                Create Event
                            </Link>
                        </div>
                    ) : (
                        <div className='absolute inset-x-0 top-16 z-10 hidden w-full bg-white p-4 shadow-md md:static md:flex md:w-auto md:items-center md:gap-6 md:p-0 md:shadow-none'>
                            <div className='mb-4 flex items-center gap-2 md:mb-0'>
                                <span className='flex items-center gap-2 font-inter text-sm font-medium text-[#001433]'>
                                    <svg
                                        width='20'
                                        height='20'
                                        viewBox='0 0 20 20'
                                        fill='none'
                                        xmlns='http:www.w3.org/2000/svg'
                                    >
                                        <path
                                            d='M9.99992 1.80104C6.49992 1.80104 3.33325 4.48437 3.33325 8.63437C3.33325 11.2844 5.37492 14.401 9.44992 17.9927C9.76659 18.2677 10.2416 18.2677 10.5583 17.9927C14.6249 14.401 16.6666 11.2844 16.6666 8.63437C16.6666 4.48437 13.4999 1.80104 9.99992 1.80104ZM9.99992 10.1344C9.08325 10.1344 8.33325 9.38437 8.33325 8.46771C8.33325 7.55104 9.08325 6.80104 9.99992 6.80104C10.9166 6.80104 11.6666 7.55104 11.6666 8.46771C11.6666 9.38437 10.9166 10.1344 9.99992 10.1344Z'
                                            fill='#4C5563'
                                        />
                                    </svg>
                                    Lagos
                                    <svg
                                        width='10'
                                        height='8'
                                        viewBox='0 0 10 8'
                                        fill='none'
                                        xmlns='http:www.w3.org/2000/svg'
                                    >
                                        <path
                                            d='M8.825 0.912476L5 4.72914L1.175 0.912476L0 2.08748L5 7.08748L10 2.08748L8.825 0.912476Z'
                                            fill='#0066FF'
                                        />
                                    </svg>
                                </span>
                            </div>
                            <Link
                                href='/signup'
                                className='block whitespace-nowrap font-inter text-sm font-medium text-[#001433]'
                            >
                                Sign Up
                            </Link>
                            <Link
                                href='/create-event'
                                className='block whitespace-nowrap font-inter text-sm font-medium text-[#001433]'
                            >
                                Create Event
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                <div className='flex flex-row gap-4 md:hidden'>
                    <div>
                        <Link
                            href='/create-event'
                            className='rounded-md bg-revlr-primary px-4 py-2 text-sm font-semibold text-white'
                        >
                            Create Event
                        </Link>
                    </div>

                    <button
                        className='rounded-md bg-gray-100 p-2'
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? (
                            <svg
                                width='16'
                                height='12'
                                viewBox='0 0 16 12'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M0.888889 11.3333H15.1111C15.6 11.3333 16 10.9333 16 10.4444C16 9.95555 15.6 9.55555 15.1111 9.55555H0.888889C0.4 9.55555 0 9.95555 0 10.4444C0 10.9333 0.4 11.3333 0.888889 11.3333ZM0.888889 6.88889H15.1111C15.6 6.88889 16 6.48889 16 6C16 5.51111 15.6 5.11111 15.1111 5.11111H0.888889C0.4 5.11111 0 5.51111 0 6C0 6.48889 0.4 6.88889 0.888889 6.88889ZM0 1.55555C0 2.04444 0.4 2.44444 0.888889 2.44444H15.1111C15.6 2.44444 16 2.04444 16 1.55555C16 1.06666 15.6 0.666664 15.1111 0.666664H0.888889C0.4 0.666664 0 1.06666 0 1.55555Z'
                                    fill='#001433'
                                />
                            </svg>
                        ) : (
                            <svg
                                width='16'
                                height='12'
                                viewBox='0 0 16 12'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M0.888889 11.3333H15.1111C15.6 11.3333 16 10.9333 16 10.4444C16 9.95555 15.6 9.55555 15.1111 9.55555H0.888889C0.4 9.55555 0 9.95555 0 10.4444C0 10.9333 0.4 11.3333 0.888889 11.3333ZM0.888889 6.88889H15.1111C15.6 6.88889 16 6.48889 16 6C16 5.51111 15.6 5.11111 15.1111 5.11111H0.888889C0.4 5.11111 0 5.51111 0 6C0 6.48889 0.4 6.88889 0.888889 6.88889ZM0 1.55555C0 2.04444 0.4 2.44444 0.888889 2.44444H15.1111C15.6 2.44444 16 2.04444 16 1.55555C16 1.06666 15.6 0.666664 15.1111 0.666664H0.888889C0.4 0.666664 0 1.06666 0 1.55555Z'
                                    fill='#001433'
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className='absolute left-0 top-20 w-full bg-white p-6 shadow-md md:hidden'>
                    <nav className='flex flex-col gap-4'>
                        <Link
                            href='/signup'
                            className='text-sm font-medium text-[#001433]'
                        >
                            Sign Up
                        </Link>
                        <Link
                            href='/how-it-works'
                            className='text-sm font-medium text-[#001433]'
                        >
                            How It Works
                        </Link>
                        <Link
                            href='/events'
                            className='text-sm font-medium text-[#001433]'
                        >
                            Browse Events
                        </Link>
                        <Link
                            href='/create-event'
                            className='rounded-md bg-revlr-primary px-4 py-2 text-center text-sm font-semibold text-white'
                        >
                            Create Event
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
};
