'use client';

import React from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import { EventValidationUtils } from '@src/lib/utils/eventValidation';
import type {
    EventCreationData,
    EventTicket,
    ValidationErrors,
} from '@src/types/event-creation';

interface PrePublishValidationProps {
    eventData: EventCreationData;
    tickets: EventTicket[];
    errors: ValidationErrors;
    onFixError: (field: string) => void;
}

export const PrePublishValidation: React.FC<PrePublishValidationProps> = ({
    eventData,
    tickets,
    errors,
    onFixError,
}) => {
    const { theme } = useTheme();

    let validationSummary;
    try {
        validationSummary = EventValidationUtils.getValidationSummary(
            eventData,
            tickets
        );
    } catch {
        // Fallback to basic validation if summary fails
        validationSummary = {
            totalErrors: Object.keys(errors || {}).length,
            errorsByCategory: {},
            missingRequiredFields: Object.keys(errors || {}),
        };
    }

    const hasErrors = validationSummary.totalErrors > 0;

    // Helper function to get category for a field
    const getCategoryForField = (field: string): string => {
        if (
            ['eventName', 'eventDescription', 'eventCategory'].includes(field)
        ) {
            return 'Basic Information';
        }
        if (['startDate', 'endDate', 'startTime', 'endTime'].includes(field)) {
            return 'Date & Time';
        }
        if (
            ['locationType', 'venueName', 'address', 'eventLink'].includes(
                field
            )
        ) {
            return 'Location';
        }
        if (['organizerName', 'organizerWebsite'].includes(field)) {
            return 'Organizer';
        }
        if (field.includes('ticket')) {
            return 'Tickets';
        }
        if (field === 'images') {
            return 'Images';
        }
        return 'Other';
    };

    if (!hasErrors) {
        return (
            <div
                className={`rounded-xl p-4 ${
                    theme === 'dark'
                        ? 'border border-revlr-accent-green/20 bg-revlr-accent-green/10'
                        : 'border border-green-200 bg-green-50'
                }`}
            >
                <div className='flex items-center space-x-3'>
                    <div className='shrink-0'>
                        <svg
                            className='size-5 text-revlr-accent-green'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                            />
                        </svg>
                    </div>
                    <div>
                        <h3 className='font-medium text-revlr-accent-green'>
                            Ready to Publish
                        </h3>
                        <p
                            className={`text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            All required information has been provided. Your
                            event is ready to be published.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const getFieldDisplayName = (field: string): string => {
        const fieldNames: Record<string, string> = {
            eventName: 'Event Name',
            eventDescription: 'Event Description',
            eventCategory: 'Event Category',
            startDate: 'Start Date',
            endDate: 'End Date',
            startTime: 'Start Time',
            endTime: 'End Time',
            locationType: 'Location Type',
            venueName: 'Venue Name',
            address: 'Address',
            eventLink: 'Event Link',
            images: 'Event Images',
            tickets: 'Tickets',
            organizerName: 'Organizer Name',
            organizerWebsite: 'Organizer Website',
        };
        return fieldNames[field] || field;
    };

    return (
        <div
            className={`rounded-xl p-6 ${
                theme === 'dark'
                    ? 'border border-red-500/20 bg-red-500/10'
                    : 'border border-red-200 bg-red-50'
            }`}
        >
            <div className='flex items-start space-x-3'>
                <div className='shrink-0'>
                    <svg
                        className='size-5 text-red-500'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                        />
                    </svg>
                </div>
                <div className='flex-1'>
                    <h3 className='mb-2 font-medium text-red-500'>
                        Cannot Publish Event
                    </h3>
                    <p
                        className={`mb-4 text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                    >
                        Please fix the following {validationSummary.totalErrors}{' '}
                        issue{validationSummary.totalErrors !== 1 ? 's' : ''}{' '}
                        before publishing:
                    </p>

                    {/* Error Summary by Category */}
                    <div className='space-y-4'>
                        {Object.entries(validationSummary.errorsByCategory).map(
                            ([category, count]) => (
                                <div key={category}>
                                    <h4
                                        className={`mb-2 text-sm font-medium ${
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        {category} ({count} issue
                                        {count !== 1 ? 's' : ''})
                                    </h4>
                                    <div className='space-y-2'>
                                        {Object.entries(errors)
                                            .filter(
                                                ([field]) =>
                                                    getCategoryForField(
                                                        field
                                                    ) === category
                                            )
                                            .map(([field, error]) => (
                                                <div
                                                    key={field}
                                                    className={`flex items-center justify-between rounded-lg p-3 ${
                                                        theme === 'dark'
                                                            ? 'border border-revlr-dark-border bg-revlr-dark-bg'
                                                            : 'border border-gray-200 bg-white'
                                                    }`}
                                                >
                                                    <div className='flex-1'>
                                                        <div
                                                            className={`text-sm font-medium ${
                                                                theme === 'dark'
                                                                    ? 'text-white'
                                                                    : 'text-gray-900'
                                                            }`}
                                                        >
                                                            {getFieldDisplayName(
                                                                field
                                                            )}
                                                        </div>
                                                        <div className='text-sm text-red-500'>
                                                            {typeof error ===
                                                            'string'
                                                                ? error
                                                                : 'Validation error'}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            onFixError(field)
                                                        }
                                                        className='ml-3 rounded-lg bg-revlr-primary-blue px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-revlr-primary-blue/90'
                                                    >
                                                        Fix
                                                    </button>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className='mt-4 border-t border-red-200 pt-4 dark:border-red-500/20'>
                        <div className='grid grid-cols-2 gap-4 text-sm'>
                            <div>
                                <span
                                    className={`font-medium ${
                                        theme === 'dark'
                                            ? 'text-gray-300'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    Missing Required Fields:
                                </span>
                                <span className='ml-2 font-semibold text-red-500'>
                                    {
                                        validationSummary.missingRequiredFields
                                            .length
                                    }
                                </span>
                            </div>
                            <div>
                                <span
                                    className={`font-medium ${
                                        theme === 'dark'
                                            ? 'text-gray-300'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    Total Issues:
                                </span>
                                <span className='ml-2 font-semibold text-red-500'>
                                    {validationSummary.totalErrors}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
