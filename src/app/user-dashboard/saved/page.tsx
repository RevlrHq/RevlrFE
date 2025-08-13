'use client';

import { useState } from 'react';
import { useTheme } from '../../../lib/ThemeContext';
import Link from 'next/link';
import {
    Calendar,
    MapPin,
    Clock,
    Heart,
    Users,
    Search,
    ChevronRight,
    X,
    Share2,
} from 'lucide-react';

interface SavedEvent {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    image: string;
    category: string;
    price: number;
    attendees: number;
    savedDate: string;
    organizer: string;
}

const SavedEventsPage = () => {
    const { theme } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Mock saved events data - replace with actual API calls
    const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([
        {
            id: '1',
            title: 'Startup Pitch Night',
            date: '2024-03-01',
            time: '07:00 PM',
            location: 'Lagos, Nigeria',
            image: '/assets/images/flyer3.png',
            category: 'Business',
            price: 5000,
            attendees: 150,
            savedDate: '2024-01-15',
            organizer: 'TechHub Lagos',
        },
        {
            id: '2',
            title: 'Food & Wine Festival',
            date: '2024-03-05',
            time: '12:00 PM',
            location: 'Abuja, Nigeria',
            image: '/assets/images/flyer4.png',
            category: 'Food',
            price: 8000,
            attendees: 300,
            savedDate: '2024-01-20',
            organizer: 'Culinary Arts Society',
        },
        {
            id: '3',
            title: 'Photography Workshop',
            date: '2024-03-10',
            time: '10:00 AM',
            location: 'Lagos, Nigeria',
            image: '/assets/images/flyer5.png',
            category: 'Education',
            price: 12000,
            attendees: 50,
            savedDate: '2024-01-25',
            organizer: 'Visual Arts Academy',
        },
        {
            id: '4',
            title: 'Jazz Night Live',
            date: '2024-03-15',
            time: '08:00 PM',
            location: 'Port Harcourt, Nigeria',
            image: '/assets/images/flyer.png',
            category: 'Music',
            price: 6000,
            attendees: 200,
            savedDate: '2024-02-01',
            organizer: 'Jazz Society PH',
        },
        {
            id: '5',
            title: 'Digital Marketing Summit',
            date: '2024-03-20',
            time: '09:00 AM',
            location: 'Lagos, Nigeria',
            image: '/assets/images/flyer2.png',
            category: 'Business',
            price: 15000,
            attendees: 400,
            savedDate: '2024-02-05',
            organizer: 'Marketing Professionals',
        },
    ]);

    const categories = [
        'all',
        'Business',
        'Food',
        'Education',
        'Music',
        'Technology',
        'Art',
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getDaysUntil = (dateString: string) => {
        const eventDate = new Date(dateString);
        const today = new Date();
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays < 7) return `${diffDays} days`;
        return formatDate(dateString);
    };

    const handleRemoveFromSaved = (eventId: string) => {
        setSavedEvents((prev) => prev.filter((event) => event.id !== eventId));
    };

    const filteredEvents = savedEvents.filter((event) => {
        const matchesSearch =
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.organizer.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
            selectedCategory === 'all' || event.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            Business:
                'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
            Food: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
            Education:
                'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            Music: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
            Technology:
                'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
            Art: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
        };
        return (
            colors[category] ||
            'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
        );
    };

    return (
        <div
            className={`min-h-screen transition-colors duration-200 ${
                theme === 'dark'
                    ? 'bg-revlr-dark-bg text-white'
                    : 'bg-gray-50 text-gray-900'
            }`}
        >
            {/* Header Section */}
            <div
                className={`${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                } border-b px-6 py-4`}
            >
                <div className='flex items-center justify-between'>
                    <div>
                        <h1 className='font-inter text-2xl font-bold'>
                            Saved Events
                        </h1>
                        <p
                            className={`font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            Your wishlist of events you're interested in
                            attending.
                        </p>
                    </div>

                    <div className='flex items-center gap-3'>
                        <div className='relative'>
                            <input
                                type='text'
                                placeholder='Search saved events...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`rounded-lg border py-2 pl-10 pr-4 font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white placeholder:text-gray-400'
                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500'
                                }`}
                            />
                            <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
                        </div>

                        <select
                            value={selectedCategory}
                            onChange={(e) =>
                                setSelectedCategory(e.target.value)
                            }
                            className={`rounded-lg border px-3 py-2 font-inter text-sm ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                    : 'border-gray-300 bg-white text-gray-900'
                            }`}
                        >
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category === 'all'
                                        ? 'All Categories'
                                        : category}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className='p-6'>
                {/* Stats */}
                <div className='mb-6'>
                    <div className='flex items-center gap-6 text-sm'>
                        <span
                            className={
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }
                        >
                            {savedEvents.length} events saved
                        </span>
                        <span
                            className={
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }
                        >
                            {filteredEvents.length} showing
                        </span>
                    </div>
                </div>

                {/* Events Grid */}
                {filteredEvents.length === 0 ? (
                    <div
                        className={`py-12 text-center ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                    >
                        <Heart className='mx-auto mb-4 size-16 opacity-50' />
                        <h3 className='mb-2 font-inter text-lg font-semibold'>
                            {savedEvents.length === 0
                                ? 'No saved events yet'
                                : 'No events match your search'}
                        </h3>
                        <p className='mb-4 font-inter text-sm'>
                            {savedEvents.length === 0
                                ? "Start building your wishlist by saving events you're interested in."
                                : 'Try adjusting your search terms or category filter.'}
                        </p>
                        <Link
                            href='/events'
                            className='inline-flex items-center gap-2 rounded-lg bg-revlr-primary-blue px-4 py-2 font-inter font-medium text-white transition-colors hover:bg-blue-700'
                        >
                            Browse Events <ChevronRight className='size-4' />
                        </Link>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                        {filteredEvents.map((event) => (
                            <div
                                key={event.id}
                                className={`overflow-hidden rounded-xl border ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                                        : 'border-gray-200 bg-white'
                                } group transition-shadow hover:shadow-lg`}
                            >
                                <div className='relative'>
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className='h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105'
                                    />
                                    <button
                                        onClick={() =>
                                            handleRemoveFromSaved(event.id)
                                        }
                                        className='absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-lg transition-colors hover:bg-white'
                                        title='Remove from saved'
                                    >
                                        <X className='size-4 text-gray-600' />
                                    </button>
                                    <div className='absolute left-3 top-3'>
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(event.category)}`}
                                        >
                                            {event.category}
                                        </span>
                                    </div>
                                </div>

                                <div className='p-4'>
                                    <h3 className='mb-2 font-inter text-lg font-semibold transition-colors group-hover:text-revlr-primary-blue'>
                                        {event.title}
                                    </h3>

                                    <div className='mb-4 space-y-2'>
                                        <div className='flex items-center gap-2 text-sm'>
                                            <Calendar className='size-4' />
                                            <span>
                                                {getDaysUntil(event.date)}
                                            </span>
                                            <Clock className='ml-2 size-4' />
                                            <span>{event.time}</span>
                                        </div>
                                        <div className='flex items-center gap-2 text-sm'>
                                            <MapPin className='size-4' />
                                            <span>{event.location}</span>
                                        </div>
                                        <div className='flex items-center gap-2 text-sm'>
                                            <Users className='size-4' />
                                            <span>
                                                {event.attendees} interested
                                            </span>
                                        </div>
                                    </div>

                                    <div className='mb-4 flex items-center justify-between'>
                                        <div>
                                            <p className='font-inter text-lg font-semibold text-revlr-primary-blue'>
                                                {formatCurrency(event.price)}
                                            </p>
                                            <p
                                                className={`font-inter text-xs ${
                                                    theme === 'dark'
                                                        ? 'text-gray-400'
                                                        : 'text-gray-600'
                                                }`}
                                            >
                                                by {event.organizer}
                                            </p>
                                        </div>
                                        <p
                                            className={`font-inter text-xs ${
                                                theme === 'dark'
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            Saved {formatDate(event.savedDate)}
                                        </p>
                                    </div>

                                    <div className='flex items-center gap-2'>
                                        <Link
                                            href={`/events/${event.id}`}
                                            className='flex-1 rounded-lg bg-revlr-primary-blue px-4 py-2 text-center font-inter font-medium text-white transition-colors hover:bg-blue-700'
                                        >
                                            View Details
                                        </Link>
                                        <button
                                            className={`rounded-lg border p-2 ${
                                                theme === 'dark'
                                                    ? 'border-revlr-dark-border hover:bg-revlr-dark-border'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Share2 className='size-4' />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedEventsPage;
