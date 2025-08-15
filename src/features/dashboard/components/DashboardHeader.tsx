'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '../../../lib/ThemeContext';
import { useAuthStore } from '../../../stores/authStore';
import { Moon, Sun, Bell, ChevronDown, Search, Settings } from 'lucide-react';
import { useState } from 'react';

const DashboardHeader = () => {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuthStore();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const getTitleFromPath = () => {
        const segments = pathname.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1] || 'Dashboard';
        return lastSegment
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getUserInitials = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return 'U';
    };

    const getUserDisplayName = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        if (user?.firstName) {
            return user.firstName;
        }
        return user?.email || 'User';
    };

    return (
        <header
            className={`relative ${
                theme === 'dark'
                    ? 'border-revlr-dark-border bg-gradient-to-r from-revlr-dark-card via-revlr-dark-card to-revlr-primary-blue/10'
                    : 'border-gray-200 bg-gradient-to-r from-white via-revlr-primary-grey/30 to-revlr-primary-blue/5'
            } border-b backdrop-blur-sm`}
        >
            {/* Gradient overlay for extra style */}
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-revlr-primary-blue/5 via-transparent to-revlr-accent-purple/5' />

            <div className='relative flex items-center justify-between px-6 py-4'>
                {/* Left Section - Title and Search */}
                <div className='flex items-center gap-6'>
                    <h1
                        className={`bg-gradient-to-r font-inter text-2xl font-bold ${
                            theme === 'dark'
                                ? 'from-white to-gray-300'
                                : 'from-[#001433] to-revlr-primary-blue'
                        } bg-clip-text text-transparent`}
                    >
                        {getTitleFromPath()}
                    </h1>

                    {/* Quick Search */}
                    <div
                        className={`hidden items-center gap-2 rounded-lg px-3 py-2 transition-all md:flex ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-border/50 hover:bg-revlr-dark-border'
                                : 'border border-gray-200/50 bg-white/60 hover:bg-white'
                        }`}
                    >
                        <Search className='size-4 text-gray-400' />
                        <input
                            type='text'
                            placeholder='Quick search...'
                            className={`w-48 border-none bg-transparent text-sm outline-none ${
                                theme === 'dark'
                                    ? 'text-gray-300 placeholder:text-gray-500'
                                    : 'text-gray-700 placeholder:text-gray-400'
                            }`}
                        />
                    </div>
                </div>

                {/* Right Section - Actions and User */}
                <div className='flex items-center gap-4'>
                    {/* Action Buttons */}
                    <div className='flex items-center gap-2'>
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`rounded-xl p-2.5 transition-all duration-200 ${
                                theme === 'dark'
                                    ? 'bg-gradient-to-br from-revlr-dark-border to-revlr-dark-border/50 text-gray-300 hover:from-gray-600 hover:to-gray-700 hover:text-white'
                                    : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300'
                            } shadow-sm hover:shadow-md`}
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
                            className={`relative rounded-xl p-2.5 transition-all duration-200 ${
                                theme === 'dark'
                                    ? 'bg-gradient-to-br from-revlr-dark-border to-revlr-dark-border/50 text-gray-300 hover:from-gray-600 hover:to-gray-700 hover:text-white'
                                    : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300'
                            } shadow-sm hover:shadow-md`}
                        >
                            <Bell className='size-4' />
                            {/* Notification badge */}
                            <span className='absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full bg-gradient-to-r from-revlr-accent-orange to-red-500 text-xs'>
                                <span className='size-1.5 rounded-full bg-white'></span>
                            </span>
                        </button>

                        {/* Settings */}
                        <Link
                            href='/dashboard/settings'
                            className={`rounded-xl p-2.5 transition-all duration-200 ${
                                theme === 'dark'
                                    ? 'bg-gradient-to-br from-revlr-dark-border to-revlr-dark-border/50 text-gray-300 hover:from-gray-600 hover:to-gray-700 hover:text-white'
                                    : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300'
                            } shadow-sm hover:shadow-md`}
                        >
                            <Settings className='size-4' />
                        </Link>
                    </div>

                    {/* User Profile Section */}
                    <div className='relative'>
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200 ${
                                theme === 'dark'
                                    ? 'bg-gradient-to-br from-revlr-primary-blue/20 to-revlr-accent-purple/20 hover:from-revlr-primary-blue/30 hover:to-revlr-accent-purple/30'
                                    : 'bg-gradient-to-br from-revlr-primary-blue/10 to-revlr-accent-purple/10 hover:from-revlr-primary-blue/20 hover:to-revlr-accent-purple/20'
                            } border border-white/10 shadow-sm hover:shadow-md`}
                        >
                            {/* User Avatar */}
                            <div
                                className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold ${
                                    theme === 'dark'
                                        ? 'bg-gradient-to-br from-revlr-primary-blue to-revlr-accent-purple text-white'
                                        : 'bg-gradient-to-br from-revlr-primary-blue to-revlr-accent-purple text-white'
                                } shadow-inner`}
                            >
                                {getUserInitials()}
                            </div>

                            {/* User Info */}
                            <div className='hidden flex-col items-start md:flex'>
                                <span
                                    className={`text-sm font-semibold ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-[#001433]'
                                    }`}
                                >
                                    {getUserDisplayName()}
                                </span>
                                <span
                                    className={`text-xs ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    {user?.isOrganizer
                                        ? 'Organizer'
                                        : 'Attendee'}
                                </span>
                            </div>

                            <ChevronDown
                                className={`size-4 transition-transform duration-200 ${
                                    showUserMenu ? 'rotate-180' : ''
                                } ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                            />
                        </button>

                        {/* User Dropdown Menu */}
                        {showUserMenu && (
                            <div
                                className={`absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border shadow-xl ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                                        : 'border-gray-200 bg-white'
                                } backdrop-blur-sm`}
                            >
                                <div className='border-b border-gray-200/10 p-4'>
                                    <div className='flex items-center gap-3'>
                                        <div
                                            className={`flex size-10 items-center justify-center rounded-full text-sm font-semibold ${
                                                theme === 'dark'
                                                    ? 'bg-gradient-to-br from-revlr-primary-blue to-revlr-accent-purple text-white'
                                                    : 'bg-gradient-to-br from-revlr-primary-blue to-revlr-accent-purple text-white'
                                            } shadow-inner`}
                                        >
                                            {getUserInitials()}
                                        </div>
                                        <div>
                                            <p
                                                className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-[#001433]'}`}
                                            >
                                                {getUserDisplayName()}
                                            </p>
                                            <p
                                                className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                                            >
                                                {user?.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className='p-2'>
                                    <Link
                                        href='/profile'
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                                            theme === 'dark'
                                                ? 'text-gray-300 hover:bg-revlr-dark-border hover:text-white'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <Settings className='size-4' />
                                        <span>Profile Settings</span>
                                    </Link>
                                    <Link
                                        href='/logout'
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                                            theme === 'dark'
                                                ? 'text-gray-300 hover:bg-red-500/20 hover:text-red-400'
                                                : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                                        }`}
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <svg
                                            className='size-4'
                                            viewBox='0 0 18 18'
                                            fill='none'
                                        >
                                            <path
                                                d='M2.10352 2H8.10352C8.65352 2 9.10352 1.55 9.10352 1C9.10352 0.45 8.65352 0 8.10352 0H2.10352C1.00352 0 0.103516 0.9 0.103516 2V16C0.103516 17.1 1.00352 18 2.10352 18H8.10352C8.65352 18 9.10352 17.55 9.10352 17C9.10352 16.45 8.65352 16 8.10352 16H2.10352V2Z'
                                                fill='currentColor'
                                            />
                                            <path
                                                d='M17.7535 8.65L14.9635 5.86C14.6435 5.54 14.1035 5.76 14.1035 6.21V8H7.10352C6.55352 8 6.10352 8.45 6.10352 9C6.10352 9.55 6.55352 10 7.10352 10H14.1035V11.79C14.1035 12.24 14.6435 12.46 14.9535 12.14L17.7435 9.35C17.9435 9.16 17.9435 8.84 17.7535 8.65Z'
                                                fill='currentColor'
                                            />
                                        </svg>
                                        <span>Sign Out</span>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
