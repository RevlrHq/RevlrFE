'use client';

import { cn } from '@lib/utils';
import type { SettingsNavigationProps, SettingsSectionId } from '../types';

/**
 * Settings Navigation Component
 *
 * Provides tab-based navigation for different settings sections.
 * Supports keyboard navigation and accessibility features.
 */
export function SettingsNavigation({
    navigation,
    activeTab,
    onTabChange,
    user,
}: SettingsNavigationProps) {
    const handleKeyDown = (
        event: React.KeyboardEvent,
        tab: SettingsSectionId
    ) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onTabChange(tab);
        }
    };

    return (
        <nav className='space-y-1' aria-label='Settings navigation'>
            {navigation.sections.map((section) => {
                const isActive = activeTab === section.id;
                const isDisabled = !section.isEnabled;

                return (
                    <button
                        key={section.id}
                        type='button'
                        onClick={() =>
                            !isDisabled &&
                            onTabChange(section.id as SettingsSectionId)
                        }
                        onKeyDown={(e) =>
                            !isDisabled &&
                            handleKeyDown(e, section.id as SettingsSectionId)
                        }
                        disabled={isDisabled}
                        className={cn(
                            'group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                            isActive
                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300',
                            isDisabled && 'cursor-not-allowed opacity-50'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                        aria-describedby={
                            section.description
                                ? `${section.id}-description`
                                : undefined
                        }
                    >
                        {section.icon && (
                            <span
                                className='mr-3 size-5 shrink-0'
                                aria-hidden='true'
                            >
                                {/* Icon would be rendered here based on section.icon */}
                                <div className='size-5 rounded bg-gray-400' />
                            </span>
                        )}

                        <div className='flex-1 text-left'>
                            <div className='font-medium'>{section.title}</div>
                            {section.description && (
                                <div
                                    id={`${section.id}-description`}
                                    className='mt-0.5 text-xs text-gray-500 dark:text-gray-400'
                                >
                                    {section.description}
                                </div>
                            )}
                        </div>

                        {isActive && (
                            <div className='ml-3 shrink-0'>
                                <div
                                    className='size-2 rounded-full bg-blue-500'
                                    aria-hidden='true'
                                />
                            </div>
                        )}
                    </button>
                );
            })}

            {/* User info section at bottom */}
            <div className='mt-8 border-t border-gray-200 pt-6 dark:border-gray-700'>
                <div className='flex items-center px-3 py-2'>
                    <div className='shrink-0'>
                        <div className='flex size-8 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600'>
                            <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                {user?.firstName?.[0] ||
                                    user?.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                        </div>
                    </div>
                    <div className='ml-3 min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                            {user?.firstName && user?.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user?.email || 'User'}
                        </p>
                        <p className='truncate text-xs text-gray-500 dark:text-gray-400'>
                            {user?.email || 'No email'}
                        </p>
                    </div>
                </div>
            </div>
        </nav>
    );
}
