'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@src/lib/ThemeContext';

interface DateRange {
    startDate: string;
    endDate: string;
}

interface TimeRange {
    startTime: string;
    endTime: string;
}

interface DateTimeSelectorProps {
    dateRange?: DateRange;
    timeRange?: TimeRange;
    timezone?: string;
    onDateRangeChange: (dateRange: DateRange) => void;
    onTimeRangeChange: (timeRange: TimeRange) => void;
    onTimezoneChange: (timezone: string) => void;
    errors?: {
        startDate?: string;
        endDate?: string;
        startTime?: string;
        endTime?: string;
        timezone?: string;
    };
}

// Common timezones
const TIMEZONES = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKST)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AEST)' },
    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
];

export const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
    dateRange,
    timeRange,
    timezone,
    onDateRangeChange,
    onTimeRangeChange,
    onTimezoneChange,
    errors = {},
}) => {
    const { theme } = useTheme();
    const [detectedTimezone, setDetectedTimezone] = useState<string>('');

    // Detect user's timezone
    useEffect(() => {
        try {
            const userTimezone =
                Intl.DateTimeFormat().resolvedOptions().timeZone;
            setDetectedTimezone(userTimezone);

            // Set default timezone if none selected
            if (!timezone) {
                onTimezoneChange(userTimezone);
            }
        } catch (error) {
            console.warn('Failed to detect timezone:', error);
            setDetectedTimezone('UTC');
            if (!timezone) {
                onTimezoneChange('UTC');
            }
        }
    }, [timezone, onTimezoneChange]);

    // Validate dates are in the future
    const validateFutureDate = (date: string): boolean => {
        if (!date) return true; // Empty is handled by required validation
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
    };

    // Validate end date is after start date
    const validateDateRange = (startDate: string, endDate: string): boolean => {
        if (!startDate || !endDate) return true;
        return new Date(endDate) >= new Date(startDate);
    };

    // Validate end time is after start time (for same day events)
    const validateTimeRange = (
        startTime: string,
        endTime: string,
        startDate: string,
        endDate: string
    ): boolean => {
        if (!startTime || !endTime || !startDate || !endDate) return true;

        // If it's the same day, end time must be after start time
        if (startDate === endDate) {
            return endTime > startTime;
        }

        return true; // Different days, time validation not needed
    };

    // Format date for input (YYYY-MM-DD)
    const formatDateForInput = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    // Get minimum date (today)
    const getMinDate = (): string => {
        return formatDateForInput(new Date());
    };

    // Handle date changes with validation
    const handleStartDateChange = (value: string) => {
        const newDateRange = { ...dateRange, startDate: value };

        // If end date is before new start date, update it
        if (dateRange?.endDate && value > dateRange.endDate) {
            newDateRange.endDate = value;
        }

        onDateRangeChange(newDateRange as DateRange);
    };

    const handleEndDateChange = (value: string) => {
        onDateRangeChange({ ...dateRange, endDate: value } as DateRange);
    };

    const inputClassName = (hasError: boolean) => `
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
                Date & Time
            </label>

            <div className='space-y-6'>
                {/* Date Range */}
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div>
                        <label
                            className={`mb-2 block font-inter text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-700'
                            }`}
                        >
                            Start Date
                        </label>
                        <input
                            type='date'
                            value={dateRange?.startDate || ''}
                            min={getMinDate()}
                            onChange={(e) =>
                                handleStartDateChange(e.target.value)
                            }
                            className={inputClassName(
                                !!errors.startDate ||
                                    (dateRange?.startDate
                                        ? !validateFutureDate(
                                              dateRange.startDate
                                          )
                                        : false)
                            )}
                        />
                        {errors.startDate && (
                            <p className={errorTextClassName}>
                                {errors.startDate}
                            </p>
                        )}
                        {dateRange?.startDate &&
                            !validateFutureDate(dateRange.startDate) && (
                                <p className={errorTextClassName}>
                                    Start date must be in the future
                                </p>
                            )}
                    </div>

                    <div>
                        <label
                            className={`mb-2 block font-inter text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-700'
                            }`}
                        >
                            End Date
                        </label>
                        <input
                            type='date'
                            value={dateRange?.endDate || ''}
                            min={dateRange?.startDate || getMinDate()}
                            onChange={(e) =>
                                handleEndDateChange(e.target.value)
                            }
                            className={inputClassName(
                                !!errors.endDate ||
                                    (dateRange?.startDate && dateRange?.endDate
                                        ? !validateDateRange(
                                              dateRange.startDate,
                                              dateRange.endDate
                                          )
                                        : false)
                            )}
                        />
                        {errors.endDate && (
                            <p className={errorTextClassName}>
                                {errors.endDate}
                            </p>
                        )}
                        {dateRange?.startDate &&
                            dateRange?.endDate &&
                            !validateDateRange(
                                dateRange.startDate,
                                dateRange.endDate
                            ) && (
                                <p className={errorTextClassName}>
                                    End date must be after start date
                                </p>
                            )}
                    </div>
                </div>

                {/* Time Range */}
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div>
                        <label
                            className={`mb-2 block font-inter text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-700'
                            }`}
                        >
                            Start Time
                        </label>
                        <input
                            type='time'
                            value={timeRange?.startTime || ''}
                            onChange={(e) =>
                                onTimeRangeChange({
                                    ...timeRange,
                                    startTime: e.target.value,
                                } as TimeRange)
                            }
                            className={inputClassName(!!errors.startTime)}
                        />
                        {errors.startTime && (
                            <p className={errorTextClassName}>
                                {errors.startTime}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            className={`mb-2 block font-inter text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-700'
                            }`}
                        >
                            End Time
                        </label>
                        <input
                            type='time'
                            value={timeRange?.endTime || ''}
                            onChange={(e) =>
                                onTimeRangeChange({
                                    ...timeRange,
                                    endTime: e.target.value,
                                } as TimeRange)
                            }
                            className={inputClassName(
                                !!errors.endTime ||
                                    (timeRange?.startTime &&
                                    timeRange?.endTime &&
                                    dateRange?.startDate &&
                                    dateRange?.endDate
                                        ? !validateTimeRange(
                                              timeRange.startTime,
                                              timeRange.endTime,
                                              dateRange.startDate,
                                              dateRange.endDate
                                          )
                                        : false)
                            )}
                        />
                        {errors.endTime && (
                            <p className={errorTextClassName}>
                                {errors.endTime}
                            </p>
                        )}
                        {timeRange?.startTime &&
                            timeRange?.endTime &&
                            dateRange?.startDate &&
                            dateRange?.endDate &&
                            !validateTimeRange(
                                timeRange.startTime,
                                timeRange.endTime,
                                dateRange.startDate,
                                dateRange.endDate
                            ) && (
                                <p className={errorTextClassName}>
                                    End time must be after start time for
                                    same-day events
                                </p>
                            )}
                    </div>
                </div>

                {/* Timezone */}
                <div>
                    <label
                        className={`mb-2 block font-inter text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}
                    >
                        Timezone
                    </label>
                    <select
                        value={timezone || ''}
                        onChange={(e) => onTimezoneChange(e.target.value)}
                        className={selectClassName(!!errors.timezone)}
                    >
                        <option value=''>Select Timezone</option>
                        {detectedTimezone && (
                            <option value={detectedTimezone}>
                                {detectedTimezone} (Detected)
                            </option>
                        )}
                        <optgroup label='Common Timezones'>
                            {TIMEZONES.map(({ value, label }) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                    {errors.timezone && (
                        <p className={errorTextClassName}>{errors.timezone}</p>
                    )}
                    <p
                        className={`mt-1 font-inter text-xs ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}
                    >
                        This helps attendees see the correct time in their
                        location
                    </p>
                </div>

                {/* Event Duration Display */}
                {dateRange?.startDate &&
                    dateRange?.endDate &&
                    timeRange?.startTime &&
                    timeRange?.endTime && (
                        <div
                            className={`rounded-lg p-4 ${
                                theme === 'dark'
                                    ? 'bg-revlr-dark-bg'
                                    : 'bg-gray-50'
                            }`}
                        >
                            <h4
                                className={`mb-2 font-inter text-sm font-medium ${
                                    theme === 'dark'
                                        ? 'text-gray-300'
                                        : 'text-gray-700'
                                }`}
                            >
                                Event Summary
                            </h4>
                            <div
                                className={`space-y-1 font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                <p>
                                    <strong>Start:</strong>{' '}
                                    {new Date(
                                        dateRange.startDate
                                    ).toLocaleDateString()}{' '}
                                    at {timeRange.startTime}
                                </p>
                                <p>
                                    <strong>End:</strong>{' '}
                                    {new Date(
                                        dateRange.endDate
                                    ).toLocaleDateString()}{' '}
                                    at {timeRange.endTime}
                                </p>
                                {timezone && (
                                    <p>
                                        <strong>Timezone:</strong>{' '}
                                        {TIMEZONES.find(
                                            (tz) => tz.value === timezone
                                        )?.label || timezone}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
};
