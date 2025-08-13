'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '../../../lib/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const DashboardHeader = () => {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();

    const getTitleFromPath = () => {
        const segments = pathname.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1] || 'Dashboard';
        return lastSegment
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <header
            className={`flex items-center justify-between border-b p-4 ${
                theme === 'dark'
                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                    : 'border-gray-200 bg-white'
            }`}
        >
            <h1
                className={`font-inter text-xl font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-[#001433]'
                }`}
            >
                {getTitleFromPath()}
            </h1>

            <div className='flex items-center gap-3'>
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className={`rounded-lg p-2 transition-colors ${
                        theme === 'dark'
                            ? 'bg-revlr-dark-border text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? (
                        <Sun className='size-4' />
                    ) : (
                        <Moon className='size-4' />
                    )}
                </button>

                {/* Notifications */}
                <button
                    className={`rounded-lg p-2 transition-colors ${
                        theme === 'dark'
                            ? 'text-gray-300 hover:bg-revlr-dark-border'
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <svg
                        width='20'
                        height='20'
                        viewBox='0 0 24 24'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                    >
                        <path
                            d='M12.0005 21.75C13.1005 21.75 14.0005 20.85 14.0005 19.75H10.0005C10.0005 20.85 10.8905 21.75 12.0005 21.75ZM18.0005 15.75V10.75C18.0005 7.68 16.3605 5.11 13.5005 4.43V3.75C13.5005 2.92 12.8305 2.25 12.0005 2.25C11.1705 2.25 10.5005 2.92 10.5005 3.75V4.43C7.63054 5.11 6.00054 7.67 6.00054 10.75V15.75L4.71054 17.04C4.08054 17.67 4.52054 18.75 5.41054 18.75H18.5805C19.4705 18.75 19.9205 17.67 19.2905 17.04L18.0005 15.75Z'
                            fill='currentColor'
                        />
                    </svg>
                </button>

                {/* User Avatar */}
                <div className='relative'>
                    <button
                        className={`flex items-center rounded-full p-2 text-base font-semibold transition-colors ${
                            theme === 'dark'
                                ? 'bg-revlr-primary-blue/20 text-revlr-primary-blue'
                                : 'bg-[#F1F6FF] text-[#0066FF]'
                        }`}
                    >
                        <span>MC</span>
                    </button>
                </div>

                {/* User Email */}
                <Link
                    href='/profile'
                    className={`font-inter text-sm font-normal transition-colors hover:underline ${
                        theme === 'dark' ? 'text-gray-300' : 'text-[#001433]'
                    }`}
                >
                    mochi@gmail.com
                </Link>

                {/* Dropdown Arrow */}
                <button
                    className={`p-1 transition-colors ${
                        theme === 'dark' ? 'text-gray-300' : 'text-[#001433]'
                    }`}
                >
                    <svg
                        width='16'
                        height='16'
                        viewBox='0 0 20 20'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                    >
                        <path
                            d='M13.2292 7.5001L9.99583 10.7334L6.7625 7.5001C6.4375 7.1751 5.9125 7.1751 5.5875 7.5001C5.2625 7.8251 5.2625 8.3501 5.5875 8.6751L9.4125 12.5001C9.7375 12.8251 10.2625 12.8251 10.5875 12.5001L14.4125 8.6751C14.7375 8.3501 14.7375 7.8251 14.4125 7.5001C14.0875 7.18343 13.5542 7.1751 13.2292 7.5001Z'
                            fill='currentColor'
                        />
                    </svg>
                </button>
            </div>
        </header>
    );
};

export default DashboardHeader;
