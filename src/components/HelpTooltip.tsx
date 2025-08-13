'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@src/lib/ThemeContext';

interface HelpTooltipProps {
    content: string | React.ReactNode;
    title?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    trigger?: 'hover' | 'click';
    children: React.ReactNode;
    className?: string;
    maxWidth?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
    content,
    title,
    position = 'top',
    trigger = 'hover',
    children,
    className = '',
    maxWidth = 'max-w-xs',
}) => {
    const { theme } = useTheme();
    const [isVisible, setIsVisible] = useState(false);
    const [actualPosition, setActualPosition] = useState(position);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const showTooltip = () => setIsVisible(true);
    const hideTooltip = () => setIsVisible(false);

    // Calculate optimal position based on viewport
    useEffect(() => {
        if (isVisible && tooltipRef.current && triggerRef.current) {
            const tooltip = tooltipRef.current;
            const trigger = triggerRef.current;
            const rect = trigger.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight,
            };

            let newPosition = position;

            // Check if tooltip would overflow viewport
            switch (position) {
                case 'top':
                    if (rect.top - tooltipRect.height < 10) {
                        newPosition = 'bottom';
                    }
                    break;
                case 'bottom':
                    if (
                        rect.bottom + tooltipRect.height >
                        viewport.height - 10
                    ) {
                        newPosition = 'top';
                    }
                    break;
                case 'left':
                    if (rect.left - tooltipRect.width < 10) {
                        newPosition = 'right';
                    }
                    break;
                case 'right':
                    if (rect.right + tooltipRect.width > viewport.width - 10) {
                        newPosition = 'left';
                    }
                    break;
            }

            setActualPosition(newPosition);
        }
    }, [isVisible, position]);

    // Handle click outside to close tooltip
    useEffect(() => {
        if (trigger === 'click' && isVisible) {
            const handleClickOutside = (event: MouseEvent) => {
                if (
                    tooltipRef.current &&
                    triggerRef.current &&
                    !tooltipRef.current.contains(event.target as Node) &&
                    !triggerRef.current.contains(event.target as Node)
                ) {
                    hideTooltip();
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () =>
                document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [trigger, isVisible]);

    const getTooltipClasses = () => {
        const baseClasses = `absolute z-50 px-3 py-2 text-sm font-inter rounded-lg shadow-lg border transition-all duration-200 ${maxWidth} ${
            theme === 'dark'
                ? 'bg-revlr-dark-card border-revlr-dark-border text-white'
                : 'bg-white border-gray-200 text-gray-900'
        }`;

        const positionClasses = {
            top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
            bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
            left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
            right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
        };

        return `${baseClasses} ${positionClasses[actualPosition]}`;
    };

    const getArrowClasses = () => {
        const arrowColor =
            theme === 'dark' ? 'border-revlr-dark-card' : 'border-white';

        const arrowClasses = {
            top: `absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-4 ${arrowColor}`,
            bottom: `absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-4 ${arrowColor}`,
            left: `absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-4 ${arrowColor}`,
            right: `absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-4 ${arrowColor}`,
        };

        return arrowClasses[actualPosition];
    };

    const triggerProps =
        trigger === 'hover'
            ? {
                  onMouseEnter: showTooltip,
                  onMouseLeave: hideTooltip,
              }
            : {
                  onClick: () => setIsVisible(!isVisible),
              };

    return (
        <div className={`relative inline-block ${className}`}>
            <div ref={triggerRef} {...triggerProps} className='cursor-help'>
                {children}
            </div>

            {isVisible && (
                <div
                    ref={tooltipRef}
                    className={getTooltipClasses()}
                    role='tooltip'
                    aria-hidden={!isVisible}
                >
                    {/* Arrow */}
                    <div className={getArrowClasses()} />

                    {/* Content */}
                    <div>
                        {title && (
                            <div
                                className={`mb-1 font-semibold ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                {title}
                            </div>
                        )}
                        <div
                            className={
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-600'
                            }
                        >
                            {content}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper component for form field help
interface FormFieldHelpProps {
    content: string | React.ReactNode;
    title?: string;
    className?: string;
}

export const FormFieldHelp: React.FC<FormFieldHelpProps> = ({
    content,
    title,
    className = '',
}) => {
    const { theme } = useTheme();

    return (
        <HelpTooltip
            content={content}
            title={title}
            position='top'
            trigger='hover'
            className={className}
        >
            <svg
                className={`size-4 transition-colors duration-200 ${
                    theme === 'dark'
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-400 hover:text-gray-600'
                }`}
                fill='currentColor'
                viewBox='0 0 20 20'
                aria-hidden='true'
            >
                <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z'
                    clipRule='evenodd'
                />
            </svg>
        </HelpTooltip>
    );
};

export default HelpTooltip;
