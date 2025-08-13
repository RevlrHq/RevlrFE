'use client';

import { useState, useRef } from 'react';
import { useTheme } from '@src/lib/ThemeContext';

interface OrganizerDetailsProps {
    organizerName?: string;
    organizerWebsite?: string;
    organizerLogo?: string;
    socials?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        website?: string;
        linkedin?: string;
    };
    onOrganizerChange: (field: string, value: string) => void;
    onSocialLinksChange: (field: string, value: string) => void;
    errors?: {
        organizerName?: string;
        organizerWebsite?: string;
        organizerLogo?: string;
        [key: string]: string | undefined;
    };
}

export const OrganizerDetails: React.FC<OrganizerDetailsProps> = ({
    organizerName,
    organizerWebsite,
    organizerLogo,
    socials = {},
    onOrganizerChange,
    onSocialLinksChange,
    errors = {},
}) => {
    const { theme } = useTheme();
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // URL validation
    const validateURL = (url: string): boolean => {
        if (!url.trim()) return true; // Empty is valid (optional field)
        try {
            new URL(url.startsWith('http') ? url : `https://${url}`);
            return true;
        } catch {
            return false;
        }
    };

    // Handle logo upload
    const handleLogoUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image size must be less than 2MB');
            return;
        }

        setIsUploadingLogo(true);
        try {
            // In a real implementation, you would upload to your image service
            // For now, we'll create a local URL
            const imageUrl = URL.createObjectURL(file);
            onOrganizerChange('organizerLogo', imageUrl);
        } catch (error) {
            console.error('Failed to upload logo:', error);
            alert('Failed to upload logo. Please try again.');
        } finally {
            setIsUploadingLogo(false);
        }
    };

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

    const errorTextClassName = 'mt-1 font-inter text-sm text-red-500';

    const socialPlatforms = [
        {
            key: 'website',
            label: 'Website',
            placeholder: 'https://yourwebsite.com',
            icon: '🌐',
        },
        {
            key: 'facebook',
            label: 'Facebook',
            placeholder: 'https://facebook.com/yourpage',
            icon: '📘',
        },
        {
            key: 'instagram',
            label: 'Instagram',
            placeholder: 'https://instagram.com/youraccount',
            icon: '📷',
        },
        {
            key: 'twitter',
            label: 'X (Twitter)',
            placeholder: 'https://x.com/youraccount',
            icon: '🐦',
        },
        {
            key: 'linkedin',
            label: 'LinkedIn',
            placeholder: 'https://linkedin.com/company/yourcompany',
            icon: '💼',
        },
    ];

    return (
        <div className='space-y-6'>
            {/* Organizer Details Section */}
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
                    Organizer Details
                </label>

                <div className='space-y-6'>
                    {/* Logo Upload */}
                    <div>
                        <label
                            className={`mb-2 block font-inter text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-700'
                            }`}
                        >
                            Organizer Logo
                        </label>

                        <div className='flex items-center gap-4'>
                            <div
                                className={`flex size-16 items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 ${
                                    organizerLogo
                                        ? 'border-transparent'
                                        : theme === 'dark'
                                          ? 'border-revlr-dark-border hover:border-revlr-primary-blue/50'
                                          : 'border-gray-300 hover:border-revlr-primary-blue/50'
                                }`}
                            >
                                {organizerLogo ? (
                                    <img
                                        src={organizerLogo}
                                        alt='Organizer Logo'
                                        className='size-full rounded-xl object-cover'
                                    />
                                ) : (
                                    <svg
                                        className={`size-6 ${
                                            theme === 'dark'
                                                ? 'text-gray-400'
                                                : 'text-gray-500'
                                        }`}
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                                        />
                                    </svg>
                                )}
                            </div>

                            <div className='flex-1'>
                                <input
                                    ref={fileInputRef}
                                    type='file'
                                    accept='image/*'
                                    onChange={handleLogoUpload}
                                    className='hidden'
                                />
                                <button
                                    type='button'
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={isUploadingLogo}
                                    className={`rounded-xl px-4 py-2 font-inter text-sm font-medium transition-all duration-200 ${
                                        theme === 'dark'
                                            ? 'border border-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/20'
                                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                    {isUploadingLogo ? (
                                        <div className='flex items-center gap-2'>
                                            <div className='size-4 animate-spin rounded-full border-2 border-current border-t-transparent'></div>
                                            Uploading...
                                        </div>
                                    ) : organizerLogo ? (
                                        'Change Logo'
                                    ) : (
                                        'Upload Logo'
                                    )}
                                </button>
                                {organizerLogo && (
                                    <button
                                        type='button'
                                        onClick={() =>
                                            onOrganizerChange(
                                                'organizerLogo',
                                                ''
                                            )
                                        }
                                        className='ml-2 rounded-xl px-4 py-2 font-inter text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>

                        <p
                            className={`mt-1 font-inter text-xs ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-500'
                            }`}
                        >
                            Upload a logo for your organization (max 2MB,
                            JPG/PNG)
                        </p>

                        {errors.organizerLogo && (
                            <p className={errorTextClassName}>
                                {errors.organizerLogo}
                            </p>
                        )}
                    </div>

                    {/* Organizer Name */}
                    <div>
                        <label
                            className={`mb-2 block font-inter text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-700'
                            }`}
                        >
                            Organizer Name
                        </label>
                        <input
                            type='text'
                            placeholder='Your Organization Name'
                            value={organizerName || ''}
                            onChange={(e) =>
                                onOrganizerChange(
                                    'organizerName',
                                    e.target.value
                                )
                            }
                            className={inputClassName(!!errors.organizerName)}
                        />
                        {errors.organizerName && (
                            <p className={errorTextClassName}>
                                {errors.organizerName}
                            </p>
                        )}
                    </div>

                    {/* Organizer Website */}
                    <div>
                        <label
                            className={`mb-2 block font-inter text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-700'
                            }`}
                        >
                            Website
                        </label>
                        <input
                            type='url'
                            placeholder='https://yourwebsite.com'
                            value={organizerWebsite || ''}
                            onChange={(e) =>
                                onOrganizerChange(
                                    'organizerWebsite',
                                    e.target.value
                                )
                            }
                            className={inputClassName(
                                !!errors.organizerWebsite ||
                                    (organizerWebsite
                                        ? !validateURL(organizerWebsite)
                                        : false)
                            )}
                        />
                        {errors.organizerWebsite && (
                            <p className={errorTextClassName}>
                                {errors.organizerWebsite}
                            </p>
                        )}
                        {organizerWebsite && !validateURL(organizerWebsite) && (
                            <p className={errorTextClassName}>
                                Please enter a valid URL
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Social Links Section */}
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
                    Social Links
                    <p
                        className={`mt-1 font-inter text-sm font-normal ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                    >
                        Help attendees connect with you on social media
                    </p>
                </label>

                <div className='space-y-4'>
                    {socialPlatforms.map(
                        ({ key, label, placeholder, icon }) => (
                            <div key={key}>
                                <label
                                    className={`mb-2 flex items-center gap-2 font-inter text-sm font-medium ${
                                        theme === 'dark'
                                            ? 'text-gray-300'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    <span>{icon}</span>
                                    {label}
                                </label>
                                <input
                                    type='url'
                                    placeholder={placeholder}
                                    value={
                                        socials[key as keyof typeof socials] ||
                                        ''
                                    }
                                    onChange={(e) =>
                                        onSocialLinksChange(key, e.target.value)
                                    }
                                    className={inputClassName(
                                        !!errors[key] ||
                                            (socials[
                                                key as keyof typeof socials
                                            ]
                                                ? !validateURL(
                                                      socials[
                                                          key as keyof typeof socials
                                                      ] || ''
                                                  )
                                                : false)
                                    )}
                                />
                                {errors[key] && (
                                    <p className={errorTextClassName}>
                                        {errors[key]}
                                    </p>
                                )}
                                {socials[key as keyof typeof socials] &&
                                    !validateURL(
                                        socials[key as keyof typeof socials] ||
                                            ''
                                    ) && (
                                        <p className={errorTextClassName}>
                                            Please enter a valid URL
                                        </p>
                                    )}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
