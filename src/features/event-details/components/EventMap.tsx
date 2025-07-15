'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { EventView } from '../../../lib/services/models/EventView';

// Dynamically import the map components to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);

const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);

const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);

const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
    ssr: false,
});

interface EventMapProps {
    event: EventView;
}

interface Coordinates {
    lat: number;
    lng: number;
}

const EventMap = ({ event }: EventMapProps) => {
    const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Function to geocode address using a free geocoding service
    const geocodeAddress = async (
        address: string
    ): Promise<Coordinates | null> => {
        try {
            // Using Nominatim (OpenStreetMap's geocoding service) - free and no API key required
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
            );

            if (!response.ok) {
                throw new Error('Geocoding failed');
            }

            const data = await response.json();

            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                };
            }

            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    };

    useEffect(() => {
        const loadCoordinates = async () => {
            setIsLoading(true);
            setError(null);

            // If event is virtual, don't show map
            if (event.isVirtual) {
                setIsLoading(false);
                return;
            }

            // Try to get coordinates from address
            const fullAddress = [event.venue, event.address]
                .filter(Boolean)
                .join(', ');

            if (fullAddress) {
                const coords = await geocodeAddress(fullAddress);
                if (coords) {
                    setCoordinates(coords);
                } else {
                    setError('Unable to locate address on map');
                }
            } else {
                setError('No address available');
            }

            setIsLoading(false);
        };

        loadCoordinates();
    }, [event.venue, event.address, event.isVirtual]);

    // Don't render map for virtual events
    if (event.isVirtual) {
        return null;
    }

    // Don't render if no address information
    if (!event.venue && !event.address) {
        return null;
    }

    return (
        <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-revlr-dark-card dark:shadow-none'>
            <h2 className='mb-4 text-xl font-semibold text-gray-900 dark:text-white'>
                Event Location
            </h2>

            {isLoading && (
                <div className='flex h-64 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800'>
                    <div className='text-center'>
                        <div className='mx-auto size-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent'></div>
                        <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                            Loading map...
                        </p>
                    </div>
                </div>
            )}

            {error && (
                <div className='rounded-lg bg-gray-100 p-4 dark:bg-gray-800'>
                    <div className='flex items-center space-x-2'>
                        <svg
                            className='size-5 text-gray-400'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                            />
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                            />
                        </svg>
                        <div>
                            <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                {event.venue && <span>{event.venue}</span>}
                            </p>
                            <p className='text-sm text-gray-600 dark:text-gray-300'>
                                {event.address}
                            </p>
                            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                                {error}
                            </p>
                        </div>
                    </div>

                    {event.googleMapsLink && (
                        <div className='mt-3'>
                            <a
                                href={event.googleMapsLink}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                            >
                                <svg
                                    className='mr-1 size-4'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                                    />
                                </svg>
                                View on Google Maps
                            </a>
                        </div>
                    )}
                </div>
            )}

            {coordinates && !isLoading && !error && (
                <div className='space-y-4'>
                    <div className='h-64 w-full overflow-hidden rounded-lg'>
                        <MapContainer
                            center={[coordinates.lat, coordinates.lng]}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                            className='z-0'
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                            />
                            <Marker
                                position={[coordinates.lat, coordinates.lng]}
                            >
                                <Popup>
                                    <div className='text-center'>
                                        <p className='font-semibold'>
                                            {event.title}
                                        </p>
                                        {event.venue && (
                                            <p className='text-sm'>
                                                {event.venue}
                                            </p>
                                        )}
                                        {event.address && (
                                            <p className='text-sm text-gray-600'>
                                                {event.address}
                                            </p>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    </div>

                    {/* Address info below map */}
                    <div className='flex items-start space-x-3'>
                        <div className='shrink-0'>
                            <svg
                                className='size-5 text-gray-400 dark:text-gray-500'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                                />
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                                />
                            </svg>
                        </div>
                        <div className='flex-1'>
                            {event.venue && (
                                <p className='text-sm font-medium text-gray-900 dark:text-white'>
                                    {event.venue}
                                </p>
                            )}
                            {event.address && (
                                <p className='text-sm text-gray-600 dark:text-gray-300'>
                                    {event.address}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Google Maps link */}
                    {event.googleMapsLink && (
                        <div className='border-t border-gray-200 pt-2 dark:border-revlr-dark-border'>
                            <a
                                href={event.googleMapsLink}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                            >
                                <svg
                                    className='mr-1 size-4'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                                    />
                                </svg>
                                View on Google Maps
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventMap;
