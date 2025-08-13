'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@src/lib/ThemeContext';

interface LocationDetails {
    venueName?: string;
    address?: string;
    googleMapsLink?: string;
    eventLink?: string;
    platform?: string;
}

interface LocationSelectorProps {
    locationType: 'in-person' | 'virtual' | 'hybrid';
    locationDetails?: LocationDetails;
    onLocationTypeChange: (type: 'in-person' | 'virtual' | 'hybrid') => void;
    onLocationDetailsChange: (field: string, value: string) => void;
    errors?: {
        venueName?: string;
        address?: string;
        googleMapsLink?: string;
        eventLink?: string;
        platform?: string;
    };
}

const VIRTUAL_PLATFORMS = [
    { value: 'zoom', label: 'Zoom' },
    { value: 'teams', label: 'Microsoft Teams' },
    { value: 'meet', label: 'Google Meet' },
    { value: 'webex', label: 'Cisco Webex' },
    { value: 'youtube', label: 'YouTube Live' },
    { value: 'twitch', label: 'Twitch' },
    { value: 'custom', label: 'Custom Platform' },
];

export const LocationSelector: React.FC<LocationSelectorProps> = ({
    locationType,
    locationDetails,
    onLocationTypeChange,
    onLocationDetailsChange,
    errors = {},
}) => {
    const { theme } = useTheme();
    const [isValidatingAddress, setIsValidatingAddress] = useState(false);
    const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);

    // URL validation for virtual links
    const validateURL = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    // Address validation with Google Maps integration
    const validateAddress = async (address: string) => {
        if (!address.trim()) return;

        setIsValidatingAddress(true);
        try {
            // In a real implementation, you would use Google Places API
            // For now, we'll simulate address validation
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Mock suggestions
            const suggestions = [
                `${address}, City, State`,
                `${address}, Different City, State`,
            ];
            setAddressSuggestions(suggestions);
        } catch (error) {
            console.warn('Address validation failed:', error);
        } finally {
            setIsValidatingAddress(false);
        }
    };

    // Debounced address validation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (
                locationDetails?.address &&
                locationDetails.address.length > 3
            ) {
                validateAddress(locationDetails.address);
            } else {
                setAddressSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [locationDetails?.address]);

    const inputClassName = (hasError: boolean) => `
        w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200
        ${
            hasError
                ? 'border-red-500 focus:ring-red-500/20'
                : theme === 'dark'
                  ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                  : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
        }
        focus:outline-none focus:ring-2
    `;

    const selectClassName = (hasError: boolean) => `
        w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200
        ${
            hasError
                ? 'border-red-500 focus:ring-red-500/20'
                : theme === 'dark'
                  ? 'border-revlr-dark-border bg-revlr-dark-bg text-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
        }
        focus:outline-none focus:ring-2
    `;

    const errorTextClassName = 'mt-1 font-inter text-sm text-red-500';

    return (
        <div
            className={`rounded-xl p-8 shadow-lg transition-all duration-200 ${
                theme === 'dark'
                    ? 'border border-revlr-dark-border bg-revlr-dark-card'
                    : 'border border-gray-200 bg-white'
            }`}
        >
            <label
                className={`mb-6 block font-inter text-lg font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
            >
                <span className='mr-2 text-revlr-accent-orange'>*</span>
                Location
            </label>

            {/* Location Type Tabs */}
            <div className='mb-6 flex flex-row gap-6'>
                {[
                    { key: 'in-person', label: 'In-Person' },
                    { key: 'virtual', label: 'Virtual' },
                    { key: 'hybrid', label: 'Hybrid' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        type='button'
                        onClick={() =>
                            onLocationTypeChange(
                                key as 'in-person' | 'virtual' | 'hybrid'
                            )
                        }
                        className={`pb-3 font-inter text-sm font-medium transition-all duration-200 ${
                            locationType === key
                                ? 'border-b-2 border-revlr-primary-blue text-revlr-primary-blue'
                                : theme === 'dark'
                                  ? 'text-gray-400 hover:text-gray-300'
                                  : 'text-gray-600 hover:text-gray-700'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* In-Person Location Fields */}
            {(locationType === 'in-person' || locationType === 'hybrid') && (
                <div className='mb-6 space-y-4'>
                    <div>
                        <input
                            type='text'
                            placeholder='Venue Name'
                            value={locationDetails?.venueName || ''}
                            onChange={(e) =>
                                onLocationDetailsChange(
                                    'venueName',
                                    e.target.value
                                )
                            }
                            className={inputClassName(!!errors.venueName)}
                        />
                        {errors.venueName && (
                            <p className={errorTextClassName}>
                                {errors.venueName}
                            </p>
                        )}
                    </div>

                    <div className='relative'>
                        <input
                            type='text'
                            placeholder='Address'
                            value={locationDetails?.address || ''}
                            onChange={(e) =>
                                onLocationDetailsChange(
                                    'address',
                                    e.target.value
                                )
                            }
                            className={inputClassName(!!errors.address)}
                        />
                        {isValidatingAddress && (
                            <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                                <div className='size-4 animate-spin rounded-full border-2 border-revlr-primary-blue border-t-transparent'></div>
                            </div>
                        )}
                        {errors.address && (
                            <p className={errorTextClassName}>
                                {errors.address}
                            </p>
                        )}

                        {/* Address Suggestions */}
                        {addressSuggestions.length > 0 && (
                            <div
                                className={`absolute z-10 mt-1 w-full rounded-xl border shadow-lg ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                                        : 'border-gray-200 bg-white'
                                }`}
                            >
                                {addressSuggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        type='button'
                                        onClick={() => {
                                            onLocationDetailsChange(
                                                'address',
                                                suggestion
                                            );
                                            setAddressSuggestions([]);
                                        }}
                                        className={`w-full p-3 text-left font-inter text-sm transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl ${
                                            theme === 'dark'
                                                ? 'text-gray-300 hover:bg-revlr-dark-border/20'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <input
                            type='url'
                            placeholder='Google Maps Link (optional)'
                            value={locationDetails?.googleMapsLink || ''}
                            onChange={(e) =>
                                onLocationDetailsChange(
                                    'googleMapsLink',
                                    e.target.value
                                )
                            }
                            className={inputClassName(!!errors.googleMapsLink)}
                        />
                        {errors.googleMapsLink && (
                            <p className={errorTextClassName}>
                                {errors.googleMapsLink}
                            </p>
                        )}
                        <p
                            className={`mt-1 font-inter text-xs ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-500'
                            }`}
                        >
                            Helps attendees find your venue easily
                        </p>
                    </div>
                </div>
            )}

            {/* Virtual Location Fields */}
            {(locationType === 'virtual' || locationType === 'hybrid') && (
                <div className='space-y-4'>
                    <div>
                        <select
                            value={locationDetails?.platform || ''}
                            onChange={(e) =>
                                onLocationDetailsChange(
                                    'platform',
                                    e.target.value
                                )
                            }
                            className={selectClassName(!!errors.platform)}
                        >
                            <option value=''>Select Platform</option>
                            {VIRTUAL_PLATFORMS.map(({ value, label }) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        {errors.platform && (
                            <p className={errorTextClassName}>
                                {errors.platform}
                            </p>
                        )}
                    </div>

                    <div>
                        <input
                            type='url'
                            placeholder='Event Link'
                            value={locationDetails?.eventLink || ''}
                            onChange={(e) =>
                                onLocationDetailsChange(
                                    'eventLink',
                                    e.target.value
                                )
                            }
                            className={inputClassName(!!errors.eventLink)}
                        />
                        {errors.eventLink && (
                            <p className={errorTextClassName}>
                                {errors.eventLink}
                            </p>
                        )}
                        {locationDetails?.eventLink &&
                            !validateURL(locationDetails.eventLink) && (
                                <p className={errorTextClassName}>
                                    Please enter a valid URL
                                </p>
                            )}
                        <p
                            className={`mt-1 font-inter text-xs ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-500'
                            }`}
                        >
                            The link attendees will use to join your virtual
                            event
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
