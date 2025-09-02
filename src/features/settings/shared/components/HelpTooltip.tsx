'use client';

import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpTooltipProps {
    content: string;
    title?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function HelpTooltip({
    content,
    title,
    position = 'top',
    className = '',
    size = 'md',
}: HelpTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    const sizeClasses = {
        sm: 'w-48',
        md: 'w-64',
        lg: 'w-80',
    };

    const positionClasses = {
        top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
        top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
        bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
        left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
        right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800',
    };

    return (
        <div className={`relative inline-block ${className}`}>
            <button
                type='button'
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onFocus={() => setIsVisible(true)}
                onBlur={() => setIsVisible(false)}
                onClick={() => setIsVisible(!isVisible)}
                className='inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition-colors duration-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-gray-500 dark:hover:text-gray-300'
                aria-label='Help information'
                aria-describedby={isVisible ? 'tooltip-content' : undefined}
            >
                <HelpCircle className='h-4 w-4' />
            </button>

            {isVisible && (
                <div
                    id='tooltip-content'
                    role='tooltip'
                    className={`absolute z-50 ${sizeClasses[size]} ${positionClasses[position]} pointer-events-none rounded-lg bg-gray-800 p-3 text-sm text-white shadow-lg`}
                >
                    {/* Arrow */}
                    <div
                        className={`absolute h-0 w-0 border-4 ${arrowClasses[position]}`}
                    />

                    {/* Close button for mobile */}
                    <button
                        type='button'
                        onClick={() => setIsVisible(false)}
                        className='pointer-events-auto absolute right-1 top-1 p-1 text-gray-300 hover:text-white md:hidden'
                        aria-label='Close help'
                    >
                        <X className='h-3 w-3' />
                    </button>

                    {/* Content */}
                    <div className='space-y-2'>
                        {title && (
                            <div className='font-semibold text-white'>
                                {title}
                            </div>
                        )}
                        <div className='leading-relaxed text-gray-200'>
                            {content}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface HelpSectionProps {
    title: string;
    children: React.ReactNode;
    helpContent?: string;
    helpTitle?: string;
    className?: string;
}

export function HelpSection({
    title,
    children,
    helpContent,
    helpTitle,
    className = '',
}: HelpSectionProps) {
    return (
        <div className={`space-y-4 ${className}`}>
            <div className='flex items-center gap-2'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    {title}
                </h3>
                {helpContent && (
                    <HelpTooltip
                        content={helpContent}
                        title={helpTitle}
                        position='right'
                    />
                )}
            </div>
            {children}
        </div>
    );
}

interface InlineHelpProps {
    content: string;
    className?: string;
}

export function InlineHelp({ content, className = '' }: InlineHelpProps) {
    return (
        <div
            className={`mt-1 text-sm text-gray-600 dark:text-gray-400 ${className}`}
        >
            <div className='flex items-start gap-2'>
                <HelpCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400' />
                <span>{content}</span>
            </div>
        </div>
    );
}
