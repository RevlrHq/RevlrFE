'use client';

import React from 'react';
import { useTheme } from '@src/lib/ThemeContext';

// Generic skeleton component
interface SkeletonProps {
    className?: string;
    width?: string;
    height?: string;
    rounded?: boolean;
    animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    width = 'w-full',
    height = 'h-4',
    rounded = true,
    animate = true,
}) => {
    const { theme } = useTheme();

    return (
        <div
            className={`${width} ${height} ${rounded ? 'rounded' : ''} ${
                theme === 'dark' ? 'bg-revlr-dark-border' : 'bg-gray-200'
            } ${animate ? 'animate-pulse' : ''} ${className}`}
        />
    );
};

// Form field skeleton
export const FormFieldSkeleton: React.FC<{ label?: boolean }> = ({
    label = true,
}) => {
    return (
        <div className='space-y-2'>
            {label && <Skeleton width='w-24' height='h-4' />}
            <Skeleton height='h-12' rounded />
        </div>
    );
};

// Card skeleton
export const CardSkeleton: React.FC<{
    className?: string;
    children?: React.ReactNode;
}> = ({ className = '', children }) => {
    const { theme } = useTheme();

    return (
        <div
            className={`rounded-xl p-8 shadow-lg ${
                theme === 'dark'
                    ? 'border border-revlr-dark-border bg-revlr-dark-card'
                    : 'border border-gray-200 bg-white'
            } ${className}`}
        >
            {children || (
                <div className='space-y-4'>
                    <Skeleton width='w-32' height='h-6' />
                    <div className='space-y-3'>
                        <Skeleton height='h-4' />
                        <Skeleton height='h-4' width='w-3/4' />
                        <Skeleton height='h-4' width='w-1/2' />
                    </div>
                </div>
            )}
        </div>
    );
};

// Event creation form skeleton
export const EventFormSkeleton: React.FC = () => {
    return (
        <div className='space-y-6 p-6'>
            <div className='flex flex-row gap-6'>
                <div className='flex flex-1 flex-col space-y-6'>
                    {/* Images Section Skeleton */}
                    <CardSkeleton>
                        <div className='space-y-4'>
                            <Skeleton width='w-20' height='h-6' />
                            <div className='grid grid-cols-2 gap-4'>
                                <Skeleton height='h-32' rounded />
                                <Skeleton height='h-32' rounded />
                            </div>
                        </div>
                    </CardSkeleton>

                    {/* Basic Details Skeleton */}
                    <CardSkeleton>
                        <div className='space-y-4'>
                            <FormFieldSkeleton />
                            <FormFieldSkeleton />
                            <FormFieldSkeleton />
                        </div>
                    </CardSkeleton>

                    {/* Location Skeleton */}
                    <CardSkeleton>
                        <div className='space-y-4'>
                            <div className='flex space-x-4'>
                                <Skeleton width='w-20' height='h-10' rounded />
                                <Skeleton width='w-20' height='h-10' rounded />
                                <Skeleton width='w-20' height='h-10' rounded />
                            </div>
                            <FormFieldSkeleton />
                            <FormFieldSkeleton />
                        </div>
                    </CardSkeleton>
                </div>

                <div className='flex flex-1 flex-col space-y-6'>
                    {/* Organizer Details Skeleton */}
                    <CardSkeleton>
                        <div className='space-y-4'>
                            <FormFieldSkeleton />
                            <FormFieldSkeleton />
                            <div className='grid grid-cols-2 gap-4'>
                                <FormFieldSkeleton />
                                <FormFieldSkeleton />
                            </div>
                        </div>
                    </CardSkeleton>
                </div>
            </div>
        </div>
    );
};

// Ticket management skeleton
export const TicketManagementSkeleton: React.FC = () => {
    return (
        <div className='space-y-6 p-6'>
            <CardSkeleton>
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <Skeleton width='w-32' height='h-6' />
                        <Skeleton width='w-24' height='h-10' rounded />
                    </div>
                    <div className='space-y-3'>
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className='flex items-center justify-between rounded-lg border p-4'
                            >
                                <div className='space-y-2'>
                                    <Skeleton width='w-24' height='h-5' />
                                    <Skeleton width='w-16' height='h-4' />
                                </div>
                                <div className='flex space-x-2'>
                                    <Skeleton
                                        width='w-16'
                                        height='h-8'
                                        rounded
                                    />
                                    <Skeleton
                                        width='w-16'
                                        height='h-8'
                                        rounded
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardSkeleton>
        </div>
    );
};

// Loading spinner component
interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    color = 'border-revlr-primary-blue',
    className = '',
}) => {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-3',
    };

    return (
        <div
            className={`animate-spin rounded-full border-t-transparent ${color} ${sizeClasses[size]} ${className}`}
        />
    );
};

// Button loading state
interface LoadingButtonProps {
    isLoading: boolean;
    children: React.ReactNode;
    loadingText?: string;
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
    isLoading,
    children,
    loadingText,
    className = '',
    disabled = false,
    onClick,
    type = 'button',
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`flex items-center justify-center space-x-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
            {isLoading && <LoadingSpinner size='sm' color='border-current' />}
            <span>{isLoading && loadingText ? loadingText : children}</span>
        </button>
    );
};

// Full page loading overlay
interface LoadingOverlayProps {
    isVisible: boolean;
    message?: string;
    className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    isVisible,
    message = 'Loading...',
    className = '',
}) => {
    const { theme } = useTheme();

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${className}`}
        >
            <div
                className={`rounded-xl p-8 shadow-xl ${
                    theme === 'dark'
                        ? 'border border-revlr-dark-border bg-revlr-dark-card'
                        : 'border border-gray-200 bg-white'
                }`}
            >
                <div className='flex flex-col items-center space-y-4'>
                    <LoadingSpinner size='lg' />
                    <p
                        className={`font-inter text-sm ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}
                    >
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Inline loading state for sections
interface InlineLoadingProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
    message = 'Loading...',
    size = 'md',
    className = '',
}) => {
    const { theme } = useTheme();

    return (
        <div
            className={`flex items-center justify-center space-x-3 py-8 ${className}`}
        >
            <LoadingSpinner size={size} />
            <span
                className={`font-inter text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}
            >
                {message}
            </span>
        </div>
    );
};

// Events grid skeleton
export const EventsGridSkeleton: React.FC = () => {
    return (
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                    key={i}
                    className='flex flex-row gap-4 rounded-lg bg-white p-6 shadow-sm'
                >
                    <Skeleton width='w-48' height='h-48' rounded />
                    <div className='flex flex-1 flex-col justify-between'>
                        <div className='space-y-4'>
                            <Skeleton width='w-3/4' height='h-6' />
                            <div className='space-y-2'>
                                <Skeleton width='w-1/2' height='h-4' />
                                <Skeleton width='w-1/3' height='h-4' />
                            </div>
                        </div>
                        <div className='flex items-center justify-between'>
                            <Skeleton width='w-20' height='h-4' />
                            <Skeleton width='w-16' height='h-6' rounded />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const LoadingStatesDefault = {
    Skeleton,
    FormFieldSkeleton,
    CardSkeleton,
    EventFormSkeleton,
    TicketManagementSkeleton,
    EventsGridSkeleton,
    LoadingSpinner,
    LoadingButton,
    LoadingOverlay,
    InlineLoading,
};

export default LoadingStatesDefault;

export const LoadingStates = {
    Skeleton,
    FormFieldSkeleton,
    CardSkeleton,
    EventFormSkeleton,
    TicketManagementSkeleton,
    EventsGrid: EventsGridSkeleton,
    LoadingSpinner,
    LoadingButton,
    LoadingOverlay,
    InlineLoading,
};
