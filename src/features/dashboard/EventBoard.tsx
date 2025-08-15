'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '../../lib/ThemeContext';
import { useAuthStore } from '@src/stores/authStore';
import { VendorAuthUtils } from '../../lib/utils/vendorAuth';
import { useVendorEvents } from '../../hooks/useVendorEvents';
import VendorEventCard from './components/VendorEventCard';
import { LoadingStates } from '../../components/LoadingStates';
import { Search, Plus, RefreshCw } from 'lucide-react';

const EventBoard = () => {
    const { theme } = useTheme();
    const router = useRouter();
    const { user, token } = useAuthStore();
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    // Check vendor access
    const hasVendorAccess = VendorAuthUtils.hasVendorAccess(user, token);

    const {
        events,
        loading,
        error,
        totalCount,
        fetchEvents,
        refetch,
        deleteDraft,
        continueDraft,
    } = useVendorEvents(12, {
        status:
            activeTab === 'all'
                ? 'all'
                : (activeTab as 'draft' | 'active' | 'upcoming' | 'past'),
        includeDrafts: true,
        SearchTerm: searchTerm,
    });

    const tabs = [
        { id: 'all', label: 'All Events', count: totalCount },
        {
            id: 'draft',
            label: 'Drafts',
            count: events.filter((e) => e.isDraft).length,
        },
        {
            id: 'active',
            label: 'Active',
            count: events.filter((e) => e.status === 'active').length,
        },
        {
            id: 'upcoming',
            label: 'Upcoming',
            count: events.filter((e) => e.status === 'upcoming').length,
        },
        {
            id: 'past',
            label: 'Past',
            count: events.filter((e) => e.status === 'past').length,
        },
    ];

    // Redirect if no vendor access
    useEffect(() => {
        if (!hasVendorAccess) {
            router.push('/dashboard/vendor-access');
        }
    }, [hasVendorAccess, router]);

    // Refetch when tab changes
    useEffect(() => {
        if (hasVendorAccess) {
            fetchEvents(1, {
                status:
                    activeTab === 'all'
                        ? 'all'
                        : (activeTab as
                              | 'draft'
                              | 'active'
                              | 'upcoming'
                              | 'past'),
                includeDrafts: true,
                SearchTerm: searchTerm,
            });
        }
    }, [activeTab, searchTerm, hasVendorAccess, fetchEvents]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchEvents(1, {
            status:
                activeTab === 'all'
                    ? 'all'
                    : (activeTab as 'draft' | 'active' | 'upcoming' | 'past'),
            includeDrafts: true,
            SearchTerm: searchTerm,
        });
    };

    const handleContinueDraft = (event: { draftData?: unknown }) => {
        if (event.draftData) {
            continueDraft(
                event.draftData as Parameters<typeof continueDraft>[0]
            );
            router.push('/dashboard/event/create-event');
        }
    };

    const handleDeleteDraft = (event: { draftData?: { id?: string } }) => {
        if (event.draftData?.id) {
            deleteDraft(event.draftData.id);
        } else {
            deleteDraft();
        }
    };

    if (!hasVendorAccess) {
        return null; // Will redirect
    }

    return (
        <div
            className={`min-h-screen transition-colors duration-200 ${
                theme === 'dark'
                    ? 'bg-revlr-dark-bg text-white'
                    : 'bg-gray-50 text-gray-900'
            }`}
        >
            {/* Header */}
            <div
                className={`border-b px-6 py-4 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                }`}
            >
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='font-inter text-2xl font-bold'>
                            My Events
                        </h1>
                        <p
                            className={`font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            Manage your events and drafts
                        </p>
                    </div>

                    <div className='flex items-center gap-3'>
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className={`rounded-lg border p-2 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card hover:bg-revlr-dark-border'
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <Search className='size-4' />
                        </button>

                        <button
                            onClick={refetch}
                            className={`rounded-lg border p-2 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card hover:bg-revlr-dark-border'
                                    : 'border-gray-300 bg-white hover:bg-gray-50'
                            }`}
                        >
                            <RefreshCw className='size-4' />
                        </button>

                        <Link
                            href='/dashboard/event/create-event'
                            className='flex items-center gap-2 rounded-lg bg-revlr-primary-blue px-4 py-2 font-inter font-medium text-white transition-colors hover:bg-blue-700'
                        >
                            <Plus className='size-4' />
                            Create Event
                        </Link>
                    </div>
                </div>

                {/* Search Bar */}
                {showSearch && (
                    <form onSubmit={handleSearch} className='mt-4'>
                        <div className='flex gap-2'>
                            <input
                                type='text'
                                placeholder='Search events...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`flex-1 rounded-lg border px-3 py-2 font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white placeholder:text-gray-400'
                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500'
                                }`}
                            />
                            <button
                                type='submit'
                                className='rounded-lg bg-revlr-primary-blue px-4 py-2 font-inter text-sm font-medium text-white hover:bg-blue-700'
                            >
                                Search
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Tabs */}
            <div
                className={`border-b px-6 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                }`}
            >
                <div className='flex space-x-1 py-4'>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 font-inter text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-revlr-primary-blue text-white'
                                    : theme === 'dark'
                                      ? 'bg-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/80'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs ${
                                        activeTab === tab.id
                                            ? 'bg-white/20 text-white'
                                            : theme === 'dark'
                                              ? 'bg-revlr-dark-bg text-gray-400'
                                              : 'bg-gray-200 text-gray-600'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className='p-6'>
                {loading ? (
                    <LoadingStates.EventsGrid />
                ) : error ? (
                    <div className='flex flex-col items-center justify-center py-12'>
                        <div
                            className={`mb-4 rounded-full p-3 ${
                                theme === 'dark'
                                    ? 'bg-red-900/20'
                                    : 'bg-red-100'
                            }`}
                        >
                            <svg
                                className='size-8 text-red-500'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                />
                            </svg>
                        </div>
                        <h3 className='mb-2 font-inter text-lg font-semibold'>
                            Error Loading Events
                        </h3>
                        <p
                            className={`mb-4 text-center font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            {error}
                        </p>
                        <button
                            onClick={refetch}
                            className='rounded-lg bg-revlr-primary-blue px-4 py-2 font-inter font-medium text-white hover:bg-blue-700'
                        >
                            Try Again
                        </button>
                    </div>
                ) : events.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-12'>
                        <div
                            className={`mb-4 rounded-full p-12 ${
                                theme === 'dark'
                                    ? 'bg-revlr-primary-blue/10'
                                    : 'bg-blue-50'
                            }`}
                        >
                            <svg
                                width='40'
                                height='40'
                                viewBox='0 0 40 40'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M4.99805 29.102V34.1686C4.99805 34.6353 5.36471 35.002 5.83138 35.002H10.898C11.1147 35.002 11.3314 34.9186 11.4814 34.752L29.6814 16.5686L23.4314 10.3186L5.24805 28.502C5.08138 28.6686 4.99805 28.8686 4.99805 29.102ZM34.5147 11.7353C35.1647 11.0853 35.1647 10.0353 34.5147 9.3853L30.6147 5.4853C29.9647 4.8353 28.9147 4.8353 28.2647 5.4853L25.2147 8.5353L31.4647 14.7853L34.5147 11.7353Z'
                                    fill='#3D8BFF'
                                />
                            </svg>
                        </div>
                        <h2 className='mb-2 font-inter text-xl font-semibold'>
                            {activeTab === 'draft'
                                ? 'No Drafts Yet'
                                : 'Welcome to REVLR'}
                        </h2>
                        <p
                            className={`mb-6 text-center font-inter ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            {activeTab === 'draft'
                                ? 'Start creating an event to see your drafts here'
                                : 'Create your first event to start hosting memories'}
                        </p>
                        <Link
                            href='/dashboard/event/create-event'
                            className='flex items-center gap-2 rounded-lg bg-revlr-primary-blue px-6 py-3 font-inter font-semibold text-white hover:bg-blue-700'
                        >
                            <Plus className='size-4' />
                            Create Event
                        </Link>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                        {events.map((event) => (
                            <VendorEventCard
                                key={event.id}
                                event={event}
                                onContinueDraft={handleContinueDraft}
                                onDeleteDraft={handleDeleteDraft}
                                theme={theme}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventBoard;
