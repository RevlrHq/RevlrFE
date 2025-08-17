'use client';

import React, { useState } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import {
    Upload,
    ExternalLink,
    Image as ImageIcon,
    Folder,
    RefreshCw,
    AlertCircle,
    Info,
    ArrowRight,
} from 'lucide-react';

interface FallbackOption {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    action:
        | 'upload'
        | 'external'
        | 'retry'
        | 'browse_local'
        | 'use_placeholder';
    url?: string;
    onClick?: () => void;
    primary?: boolean;
}

interface MediaSearchFallbackProps {
    reason:
        | 'no_providers'
        | 'initialization_failed'
        | 'network_error'
        | 'rate_limited'
        | 'configuration_error';
    availableProviders?: number;
    totalProviders?: number;
    onRetry?: () => void;
    onUpload?: () => void;
    onBrowseLocal?: () => void;
    onUsePlaceholder?: () => void;
    className?: string;
}

export const MediaSearchFallback: React.FC<MediaSearchFallbackProps> = ({
    reason,
    availableProviders = 0,
    totalProviders = 0,
    onRetry,
    onUpload,
    onBrowseLocal,
    onUsePlaceholder,
    className = '',
}) => {
    const { theme } = useTheme();
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const getFallbackContent = () => {
        switch (reason) {
            case 'no_providers':
                return {
                    title: 'No Media Providers Available',
                    description:
                        'All media search providers are currently unavailable. You can still add images to your event using the options below.',
                    icon: <AlertCircle className='size-8 text-red-500' />,
                    severity: 'error' as const,
                };

            case 'initialization_failed':
                return {
                    title: 'Media Search Setup Failed',
                    description:
                        'There was an issue setting up the media search feature. Try the alternatives below or retry the setup.',
                    icon: <AlertCircle className='size-8 text-orange-500' />,
                    severity: 'warning' as const,
                };

            case 'network_error':
                return {
                    title: 'Connection Issue',
                    description:
                        'Unable to connect to media providers. Check your internet connection or use offline options.',
                    icon: <AlertCircle className='size-8 text-red-500' />,
                    severity: 'error' as const,
                };

            case 'rate_limited':
                return {
                    title: 'Rate Limit Reached',
                    description:
                        'Media providers have reached their usage limits. Try again later or use alternative options.',
                    icon: <Info className='size-8 text-yellow-500' />,
                    severity: 'warning' as const,
                };

            case 'configuration_error':
                return {
                    title: 'Configuration Issue',
                    description:
                        'Media providers are not properly configured. Contact support or use alternative options.',
                    icon: <AlertCircle className='size-8 text-orange-500' />,
                    severity: 'warning' as const,
                };

            default:
                return {
                    title: 'Media Search Unavailable',
                    description:
                        'The media search feature is temporarily unavailable. Please try the alternatives below.',
                    icon: <AlertCircle className='size-8 text-gray-500' />,
                    severity: 'info' as const,
                };
        }
    };

    const getFallbackOptions = (): FallbackOption[] => {
        const baseOptions: FallbackOption[] = [
            {
                id: 'upload',
                title: 'Upload Your Own Images',
                description:
                    'Upload images from your device to use in your event',
                icon: <Upload className='size-5' />,
                action: 'upload',
                onClick: onUpload,
                primary: true,
            },
            {
                id: 'browse_local',
                title: 'Browse Local Files',
                description: 'Select images from your computer or device',
                icon: <Folder className='size-5' />,
                action: 'browse_local',
                onClick: onBrowseLocal,
            },
            {
                id: 'placeholder',
                title: 'Use Placeholder Images',
                description: 'Continue with generic placeholder images for now',
                icon: <ImageIcon className='size-5' />,
                action: 'use_placeholder',
                onClick: onUsePlaceholder,
            },
        ];

        // Add retry option if applicable
        if (
            onRetry &&
            (reason === 'initialization_failed' ||
                reason === 'network_error' ||
                reason === 'rate_limited')
        ) {
            baseOptions.unshift({
                id: 'retry',
                title: 'Try Again',
                description: 'Retry connecting to media providers',
                icon: <RefreshCw className='size-5' />,
                action: 'retry',
                onClick: onRetry,
                primary:
                    reason === 'network_error' || reason === 'rate_limited',
            });
        }

        // Add external search option
        baseOptions.push({
            id: 'external_unsplash',
            title: 'Search Unsplash Directly',
            description:
                'Open Unsplash in a new tab to find and download images',
            icon: <ExternalLink className='size-5' />,
            action: 'external',
            url: 'https://unsplash.com',
        });

        baseOptions.push({
            id: 'external_pexels',
            title: 'Search Pexels Directly',
            description: 'Open Pexels in a new tab to find and download images',
            icon: <ExternalLink className='size-5' />,
            action: 'external',
            url: 'https://pexels.com',
        });

        return baseOptions;
    };

    const handleOptionClick = (option: FallbackOption) => {
        setSelectedOption(option.id);

        if (option.onClick) {
            option.onClick();
        } else if (option.url) {
            window.open(option.url, '_blank', 'noopener,noreferrer');
        }

        // Reset selection after a short delay
        setTimeout(() => setSelectedOption(null), 1000);
    };

    const content = getFallbackContent();
    const options = getFallbackOptions();

    const getSeverityColors = (severity: string) => {
        switch (severity) {
            case 'error':
                return {
                    bg: theme === 'dark' ? 'bg-red-900/10' : 'bg-red-50',
                    border: 'border-red-200',
                };
            case 'warning':
                return {
                    bg: theme === 'dark' ? 'bg-yellow-900/10' : 'bg-yellow-50',
                    border: 'border-yellow-200',
                };
            case 'info':
                return {
                    bg: theme === 'dark' ? 'bg-blue-900/10' : 'bg-blue-50',
                    border: 'border-blue-200',
                };
            default:
                return {
                    bg: theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50',
                    border: 'border-gray-200',
                };
        }
    };

    const colors = getSeverityColors(content.severity);

    return (
        <div
            className={`rounded-lg border p-6 ${colors.bg} ${colors.border} ${className}`}
        >
            {/* Header */}
            <div className='mb-6 text-center'>
                <div className='mb-4 flex justify-center'>{content.icon}</div>
                <h2
                    className={`mb-2 text-lg font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}
                >
                    {content.title}
                </h2>
                <p
                    className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                >
                    {content.description}
                </p>

                {/* Provider status */}
                {totalProviders > 0 && (
                    <div
                        className={`mt-3 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}
                    >
                        {availableProviders} of {totalProviders} providers
                        available
                    </div>
                )}
            </div>

            {/* Options Grid */}
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => handleOptionClick(option)}
                        disabled={selectedOption === option.id}
                        className={`group relative rounded-lg border p-4 text-left transition-all duration-200 ${
                            option.primary
                                ? `border-blue-300 ${theme === 'dark' ? 'bg-blue-900/20 hover:bg-blue-900/30' : 'bg-blue-50 hover:bg-blue-100'}`
                                : `${theme === 'dark' ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700' : 'border-gray-200 bg-white hover:bg-gray-50'}`
                        } ${
                            selectedOption === option.id
                                ? 'scale-95 opacity-75'
                                : 'hover:scale-105 hover:shadow-md'
                        } disabled:cursor-not-allowed`}
                    >
                        <div className='flex items-start space-x-3'>
                            <div
                                className={`shrink-0 rounded-lg p-2 ${
                                    option.primary
                                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300'
                                        : `${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`
                                }`}
                            >
                                {selectedOption === option.id ? (
                                    <RefreshCw className='size-5 animate-spin' />
                                ) : (
                                    option.icon
                                )}
                            </div>
                            <div className='min-w-0 flex-1'>
                                <h3
                                    className={`mb-1 text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}
                                >
                                    {option.title}
                                </h3>
                                <p
                                    className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                                >
                                    {option.description}
                                </p>
                            </div>
                            <ArrowRight
                                className={`size-4 opacity-0 transition-opacity group-hover:opacity-100 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                            />
                        </div>

                        {option.primary && (
                            <div className='absolute right-2 top-2'>
                                <span className='inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-800 dark:text-blue-200'>
                                    Recommended
                                </span>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Help Text */}
            <div
                className={`mt-6 rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}
            >
                <div className='flex items-start space-x-2'>
                    <Info
                        className={`mt-0.5 size-4 shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                    />
                    <div
                        className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                        <p className='mb-1 font-medium'>Need help?</p>
                        <p>
                            If you continue to experience issues, try refreshing
                            the page or{' '}
                            <a
                                href='/support'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                            >
                                contact support
                            </a>{' '}
                            for assistance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaSearchFallback;
