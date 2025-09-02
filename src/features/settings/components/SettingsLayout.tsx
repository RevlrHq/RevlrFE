'use client';

import { useState } from 'react';
import { cn } from '@lib/utils';
import type { SettingsLayoutProps, SettingsSectionId } from '../types';
import { SettingsNavigation } from './SettingsNavigation';

/**
 * Settings Layout Component
 *
 * Provides the main layout structure for the settings page with responsive navigation
 * and content areas. Handles tab switching and mobile navigation states.
 */
export function SettingsLayout({
    children,
    navigation,
    user,
    activeTab,
    onTabChange,
    onTabHover,
}: SettingsLayoutProps) {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const handleTabChange = (tab: SettingsSectionId) => {
        onTabChange(tab);
        setIsMobileNavOpen(false); // Close mobile nav on tab change
    };

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
            <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
                <div className='py-6'>
                    {/* Header */}
                    <div className='mb-8'>
                        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
                            Settings
                        </h1>
                        <p className='mt-2 text-gray-600 dark:text-gray-400'>
                            Manage your account settings and preferences
                        </p>
                    </div>

                    <div className='lg:grid lg:grid-cols-12 lg:gap-x-8'>
                        {/* Mobile navigation toggle */}
                        <div className='mb-6 lg:hidden'>
                            <button
                                type='button'
                                onClick={() =>
                                    setIsMobileNavOpen(!isMobileNavOpen)
                                }
                                className='flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                aria-expanded={isMobileNavOpen}
                                aria-controls='mobile-settings-nav'
                            >
                                <span>Navigation</span>
                                <svg
                                    className={cn(
                                        'h-5 w-5 transform transition-transform',
                                        isMobileNavOpen ? 'rotate-180' : ''
                                    )}
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M19 9l-7 7-7-7'
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Navigation sidebar */}
                        <div className='lg:col-span-3'>
                            <div
                                id='mobile-settings-nav'
                                className={cn(
                                    'lg:block',
                                    isMobileNavOpen ? 'block' : 'hidden'
                                )}
                            >
                                <SettingsNavigation
                                    navigation={navigation}
                                    activeTab={activeTab}
                                    onTabChange={handleTabChange}
                                    onTabHover={onTabHover}
                                    user={user}
                                />
                            </div>
                        </div>

                        {/* Main content */}
                        <div className='lg:col-span-9'>
                            <div className='rounded-lg bg-white shadow dark:bg-gray-800'>
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
