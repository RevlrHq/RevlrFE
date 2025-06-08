/* eslint-disable boundaries/no-unknown-files */
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface NavbarProps {
    isOrganizer: boolean;
}

export const Navbar = ({ isOrganizer }: NavbarProps) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLoggedIn] = useState(true);
    const [isOrganizerLoggedIn] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !(dropdownRef.current as HTMLElement).contains(
                    event.target as Node
                )
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        // Add your logout logic here
        console.log('Logout clicked');
        setIsOpen(false);
    };

    return (
        <header className='fixed left-0 top-0 z-50 flex h-[80px] w-full bg-white shadow-sm'>
            <div className='flex w-full max-w-[1440px] items-center justify-between gap-8 px-0 py-5 md:mx-auto md:px-6'>
                <Link
                    href='/'
                    className='font-montserrat text-2xl font-extrabold text-revlr-primary-blue'
                >
                    <span className='text-yellow-400'>✨</span>REVLR
                </Link>

                <nav className='hidden w-full items-center justify-center gap-6 md:flex'>
                    {isOrganizer ? (
                        <div className='flex w-full items-center justify-between'>
                            <div className='flex w-[701px] items-center justify-center gap-16 pl-48'>
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

                            <div className='flex items-center gap-4'>
                                {isOrganizerLoggedIn ? (
                                    <>
                                        <Link
                                            href='/my-tickets'
                                            className='whitespace-nowrap font-inter text-sm font-medium text-[#001433]'
                                        >
                                            My Tickets
                                        </Link>
                                        <div className='flex items-center gap-2'>
                                            <button className='flex items-center rounded-full bg-[#F1F6FF] p-2 text-base font-semibold text-[#0066FF]'>
                                                <span>MC</span>
                                            </button>
                                            <Link
                                                href='/profile'
                                                className='font-inter text-sm font-normal text-[#001433]'
                                            >
                                                mochi@gmail.com
                                            </Link>
                                        </div>
                                    </>
                                ) : (
                                    <Link
                                        href='/signup'
                                        className='rounded-lg bg-revlr-primary-blue px-4 py-2 font-inter text-sm font-medium text-white'
                                    >
                                        Sign Up
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className='flex w-full items-center justify-between'>
                            <div className='relative flex md:w-[701px]'>
                                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-[#0066FF]'>
                                    {/* search icon */}
                                </span>
                                <input
                                    type='text'
                                    placeholder='Browse Events'
                                    className='w-full rounded-xl border border-[#E5F0FF] bg-[#F1F6FF] py-3 pl-10 pr-4 font-inter text-sm font-medium text-[#0066FF] placeholder:text-[#0066FF]'
                                />
                            </div>

                            <div className='flex items-center gap-4'>
                                <Link
                                    href='/create-event'
                                    className='whitespace-nowrap font-inter text-sm font-medium text-[#001433]'
                                >
                                    Create Event
                                </Link>
                                {isLoggedIn ? (
                                    <>
                                        <Link
                                            href='/my-tickets'
                                            className='whitespace-nowrap font-inter text-sm font-medium text-[#001433]'
                                        >
                                            My Tickets
                                        </Link>
                                        <div className='flex items-center gap-2'>
                                            <button className='flex items-center rounded-full bg-[#F1F6FF] p-2 text-base font-semibold text-[#0066FF]'>
                                                <span>MC</span>
                                            </button>
                                            <div
                                                className='relative'
                                                ref={dropdownRef}
                                            >
                                                {/* Dropdown Trigger */}
                                                <button
                                                    onClick={() =>
                                                        setIsOpen(!isOpen)
                                                    }
                                                    className='flex items-center space-x-1 font-inter text-sm font-normal text-[#001433] transition-colors hover:text-[#001433]/80'
                                                >
                                                    <span>mochi@gmail.com</span>
                                                    <ChevronDown
                                                        className={`size-4 transition-transform duration-200 ${
                                                            isOpen
                                                                ? 'rotate-180'
                                                                : ''
                                                        }`}
                                                    />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {isOpen && (
                                                    <div className='absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg'>
                                                        <Link
                                                            href='/switch-organizer'
                                                            className='flex items-center px-4 py-2 font-inter text-sm font-medium text-[#001433]'
                                                            onClick={() =>
                                                                setIsOpen(false)
                                                            }
                                                        >
                                                            Switch Organizer
                                                        </Link>

                                                        <button
                                                            onClick={
                                                                handleLogout
                                                            }
                                                            className='flex w-full items-center px-4 py-2 font-inter text-sm font-medium text-[#001433]'
                                                        >
                                                            Logout
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <Link
                                        href='/signup'
                                        className='rounded-lg bg-revlr-primary-blue px-4 py-2 font-inter text-sm font-medium text-white'
                                    >
                                        Sign Up
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                {isOrganizer ? (
                    <div className='flex flex-row gap-4 md:hidden'>
                        <div>
                            <Link
                                href='/create-event'
                                className='rounded-md bg-revlr-primary-blue px-4 py-2 text-sm font-semibold text-white'
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
                ) : (
                    <>
                        <div className='flex flex-row items-center gap-8 px-4 md:hidden'>
                            <div>
                                <svg
                                    width='24'
                                    height='24'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M9.5 16C7.68333 16 6.14583 15.3708 4.8875 14.1125C3.62917 12.8542 3 11.3167 3 9.5C3 7.68333 3.62917 6.14583 4.8875 4.8875C6.14583 3.62917 7.68333 3 9.5 3C11.3167 3 12.8542 3.62917 14.1125 4.8875C15.3708 6.14583 16 7.68333 16 9.5C16 10.2333 15.8833 10.925 15.65 11.575C15.4167 12.225 15.1 12.8 14.7 13.3L20.3 18.9C20.4833 19.0833 20.575 19.3167 20.575 19.6C20.575 19.8833 20.4833 20.1167 20.3 20.3C20.1167 20.4833 19.8833 20.575 19.6 20.575C19.3167 20.575 19.0833 20.4833 18.9 20.3L13.3 14.7C12.8 15.1 12.225 15.4167 11.575 15.65C10.925 15.8833 10.2333 16 9.5 16ZM9.5 14C10.75 14 11.8125 13.5625 12.6875 12.6875C13.5625 11.8125 14 10.75 14 9.5C14 8.25 13.5625 7.1875 12.6875 6.3125C11.8125 5.4375 10.75 5 9.5 5C8.25 5 7.1875 5.4375 6.3125 6.3125C5.4375 7.1875 5 8.25 5 9.5C5 10.75 5.4375 11.8125 6.3125 12.6875C7.1875 13.5625 8.25 14 9.5 14Z'
                                        fill='#374252'
                                    />
                                </svg>
                            </div>

                            <div>
                                <svg
                                    width='24'
                                    height='24'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M22 10.75C22.41 10.75 22.75 10.41 22.75 10V9C22.75 4.59 21.41 3.25 17 3.25H10.75V5.5C10.75 5.91 10.41 6.25 10 6.25C9.59 6.25 9.25 5.91 9.25 5.5V3.25H7C2.59 3.25 1.25 4.59 1.25 9V9.5C1.25 9.91 1.59 10.25 2 10.25C2.96 10.25 3.75 11.04 3.75 12C3.75 12.96 2.96 13.75 2 13.75C1.59 13.75 1.25 14.09 1.25 14.5V15C1.25 19.41 2.59 20.75 7 20.75H9.25V18.5C9.25 18.09 9.59 17.75 10 17.75C10.41 17.75 10.75 18.09 10.75 18.5V20.75H17C21.41 20.75 22.75 19.41 22.75 15C22.75 14.59 22.41 14.25 22 14.25C21.04 14.25 20.25 13.46 20.25 12.5C20.25 11.54 21.04 10.75 22 10.75ZM10.75 14.17C10.75 14.58 10.41 14.92 10 14.92C9.59 14.92 9.25 14.58 9.25 14.17V9.83C9.25 9.42 9.59 9.08 10 9.08C10.41 9.08 10.75 9.42 10.75 9.83V14.17Z'
                                        fill='#374252'
                                    />
                                </svg>
                            </div>

                            <div>
                                <svg
                                    width='40'
                                    height='40'
                                    viewBox='0 0 40 40'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <rect
                                        width='40'
                                        height='40'
                                        rx='20'
                                        fill='#F1F6FF'
                                    />
                                    <path
                                        d='M8.27841 14.3636H10.4091L14.1136 23.4091H14.25L17.9545 14.3636H20.0852V26H18.4148V17.5795H18.3068L14.875 25.983H13.4886L10.0568 17.5739H9.94886V26H8.27841V14.3636ZM32.1026 18.1477H30.3298C30.2616 17.7689 30.1348 17.4356 29.9491 17.1477C29.7635 16.8598 29.5363 16.6155 29.2673 16.4148C28.9984 16.214 28.6973 16.0625 28.3639 15.9602C28.0344 15.858 27.684 15.8068 27.3128 15.8068C26.6423 15.8068 26.042 15.9754 25.5116 16.3125C24.9851 16.6496 24.5685 17.1439 24.2616 17.7955C23.9586 18.447 23.8071 19.2424 23.8071 20.1818C23.8071 21.1288 23.9586 21.928 24.2616 22.5795C24.5685 23.2311 24.987 23.7235 25.5173 24.0568C26.0476 24.3902 26.6442 24.5568 27.3071 24.5568C27.6745 24.5568 28.023 24.5076 28.3526 24.4091C28.6859 24.3068 28.987 24.1572 29.256 23.9602C29.5249 23.7633 29.7522 23.5227 29.9378 23.2386C30.1272 22.9508 30.2579 22.6212 30.3298 22.25L32.1026 22.2557C32.0079 22.8277 31.8241 23.3542 31.5514 23.8352C31.2825 24.3125 30.9359 24.7254 30.5116 25.0739C30.0912 25.4186 29.6101 25.6856 29.0685 25.875C28.5268 26.0644 27.9359 26.1591 27.2957 26.1591C26.2882 26.1591 25.3904 25.9205 24.6026 25.4432C23.8147 24.9621 23.1935 24.2746 22.7389 23.3807C22.2882 22.4867 22.0628 21.4205 22.0628 20.1818C22.0628 18.9394 22.2901 17.8731 22.7446 16.983C23.1991 16.089 23.8204 15.4034 24.6082 14.9261C25.3961 14.4451 26.292 14.2045 27.2957 14.2045C27.9132 14.2045 28.4889 14.2936 29.023 14.4716C29.5609 14.6458 30.0438 14.9034 30.4719 15.2443C30.8999 15.5814 31.2541 15.9943 31.5344 16.483C31.8147 16.9678 32.0041 17.5227 32.1026 18.1477Z'
                                        fill='#0066FF'
                                    />
                                </svg>
                            </div>
                        </div>
                    </>
                )}
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
                            className='rounded-md bg-revlr-primary-blue px-4 py-2 text-center text-sm font-semibold text-white'
                        >
                            Create Event
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
};
