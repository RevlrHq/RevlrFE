'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import { useTouchGestures } from '@src/hooks/useTouchGestures';
import {
    Menu,
    X,
    Home,
    Calendar,
    BarChart3,
    DollarSign,
    Users,
    Settings,
    Bell,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { Button } from './ui/button';

interface MobileDashboardSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    isCollapsible: boolean;
    isCollapsed: boolean;
    children: React.ReactNode;
    priority: 'high' | 'medium' | 'low';
}

interface MobileDashboardLayoutProps {
    sections: MobileDashboardSection[];
    onSectionToggle: (sectionId: string) => void;
    className?: string;
    showSearch?: boolean;
    showFilters?: boolean;
    onSearch?: (query: string) => void;
    onFilterToggle?: () => void;
}

export const MobileDashboardLayout: React.FC<MobileDashboardLayoutProps> = ({
    sections,
    onSectionToggle,
    className = '',
    showSearch = true,
    showFilters = true,
    onSearch,
    onFilterToggle,
}) => {
    const { theme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // Touch gestures for navigation
    const { attachGestureListeners } = useTouchGestures({
        onSwipeRight: () => setIsMenuOpen(true),
        onSwipeLeft: () => setIsMenuOpen(false),
        enableSwipe: true,
        swipeThreshold: 100,
    });

    // Attach gesture listeners to main content
    useEffect(() => {
        const mainContent = document.getElementById('mobile-dashboard-content');
        if (mainContent) {
            return attachGestureListeners(mainContent);
        }
    }, [attachGestureListeners]);

    // Handle search input
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        onSearch?.(value);
    };

    // Handle section collapse/expand
    const handleSectionToggle = (sectionId: string) => {
        onSectionToggle(sectionId);
    };

    // Navigation items for mobile menu
    const navigationItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <Home className='size-5' />,
            href: '/dashboard',
        },
        {
            id: 'events',
            label: 'Events',
            icon: <Calendar className='size-5' />,
            href: '/dashboard/events',
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: <BarChart3 className='size-5' />,
            href: '/dashboard/analytics',
        },
        {
            id: 'revenue',
            label: 'Revenue',
            icon: <DollarSign className='size-5' />,
            href: '/dashboard/revenue',
        },
        {
            id: 'attendees',
            label: 'Attendees',
            icon: <Users className='size-5' />,
            href: '/dashboard/attendees',
        },
        {
            id: 'settings',
            label: 'Settings',
            icon: <Settings className='size-5' />,
            href: '/dashboard/settings',
        },
    ];

    return (
        <div className={`min-h-screen ${className}`}>
            {/* Mobile Header */}
            <div
                className={`sticky top-0 z-40 border-b ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                }`}
            >
                <div className='flex items-center justify-between p-4'>
                    {/* Menu Button */}
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setIsMenuOpen(true)}
                        className='p-2'
                        aria-label='Open navigation menu'
                    >
                        <Menu className='size-6' />
                    </Button>

                    {/* Search Bar (Mobile) */}
                    {showSearch && (
                        <div className='mx-4 flex-1'>
                            <div className='relative'>
                                <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
                                <input
                                    type='text'
                                    placeholder='Search...'
                                    value={searchQuery}
                                    onChange={(e) =>
                                        handleSearchChange(e.target.value)
                                    }
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                    className={`w-full rounded-lg border py-2 pl-10 pr-4 text-sm transition-all duration-200 ${
                                        isSearchFocused
                                            ? 'border-revlr-primary-blue ring-2 ring-revlr-primary-blue/20'
                                            : theme === 'dark'
                                              ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                              : 'border-gray-300 bg-white text-gray-900'
                                    }`}
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className='flex items-center gap-2'>
                        {showFilters && (
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={onFilterToggle}
                                className='p-2'
                                aria-label='Toggle filters'
                            >
                                <Filter className='size-5' />
                            </Button>
                        )}
                        <Button
                            variant='ghost'
                            size='sm'
                            className='p-2'
                            aria-label='Notifications'
                        >
                            <Bell className='size-5' />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMenuOpen && (
                <div
                    className='fixed inset-0 z-50 bg-black/50'
                    onClick={() => setIsMenuOpen(false)}
                >
                    <div
                        className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] transition-transform duration-300${
                            theme === 'dark'
                                ? 'border-r border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-r border-gray-200 bg-white'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Menu Header */}
                        <div className='flex items-center justify-between border-b border-gray-200 p-4 dark:border-revlr-dark-border'>
                            <h2 className='text-lg font-semibold'>
                                Navigation
                            </h2>
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => setIsMenuOpen(false)}
                                className='p-2'
                                aria-label='Close menu'
                            >
                                <X className='size-5' />
                            </Button>
                        </div>

                        {/* Navigation Items */}
                        <div className='p-4'>
                            <nav className='space-y-2'>
                                {navigationItems.map((item) => (
                                    <a
                                        key={item.id}
                                        href={item.href}
                                        className={`flex items-center gap-3 rounded-lg p-3 transition-colors duration-200 ${
                                            theme === 'dark'
                                                ? 'text-gray-300 hover:bg-revlr-dark-border hover:text-white'
                                                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item.icon}
                                        <span className='font-medium'>
                                            {item.label}
                                        </span>
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div id='mobile-dashboard-content' className='space-y-4 p-4'>
                {sections.map((section) => (
                    <MobileDashboardSection
                        key={section.id}
                        section={section}
                        onToggle={() => handleSectionToggle(section.id)}
                        theme={theme}
                    />
                ))}
            </div>
        </div>
    );
};

// Individual mobile dashboard section component
interface MobileDashboardSectionProps {
    section: MobileDashboardSection;
    onToggle: () => void;
    theme: string;
}

const MobileDashboardSection: React.FC<MobileDashboardSectionProps> = ({
    section,
    onToggle,
    theme,
}) => {
    return (
        <div
            className={`rounded-xl border transition-all duration-200 ${
                theme === 'dark'
                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                    : 'border-gray-200 bg-white'
            }`}
        >
            {/* Section Header */}
            {section.isCollapsible && (
                <button
                    onClick={onToggle}
                    className={`flex w-full items-center justify-between p-4 text-left transition-colors duration-200 ${
                        theme === 'dark'
                            ? 'hover:bg-revlr-dark-border/50'
                            : 'hover:bg-gray-50'
                    }`}
                    aria-expanded={!section.isCollapsed}
                    aria-controls={`section-${section.id}`}
                >
                    <div className='flex items-center gap-3'>
                        <div
                            className={`rounded-lg p-2 ${
                                section.priority === 'high'
                                    ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                    : section.priority === 'medium'
                                      ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                                      : 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                            }`}
                        >
                            {section.icon}
                        </div>
                        <h3 className='text-lg font-semibold'>
                            {section.title}
                        </h3>
                    </div>
                    {section.isCollapsed ? (
                        <ChevronDown className='size-5' />
                    ) : (
                        <ChevronUp className='size-5' />
                    )}
                </button>
            )}

            {/* Section Content */}
            {(!section.isCollapsible || !section.isCollapsed) && (
                <div
                    id={`section-${section.id}`}
                    className={section.isCollapsible ? 'px-4 pb-4' : 'p-4'}
                >
                    {section.children}
                </div>
            )}
        </div>
    );
};

export default MobileDashboardLayout;
