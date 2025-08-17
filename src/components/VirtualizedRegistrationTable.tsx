'use client';

import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { EventRegistrationSummary } from '../lib/api';
import { useTheme } from '../lib/ThemeContext';
import {
    User,
    Mail,
    Calendar,
    DollarSign,
    CreditCard,
    FileText,
} from 'lucide-react';

interface VirtualizedRegistrationTableProps {
    registrations: EventRegistrationSummary[];
    height?: number;
    itemHeight?: number;
}

interface RegistrationRowProps {
    index: number;
    style: React.CSSProperties;
    data: {
        registrations: EventRegistrationSummary[];
        theme: string;
        formatCurrency: (amount: number | undefined) => string;
        formatDate: (dateString: string | undefined) => string;
        getPaymentStatusBadge: (status: number | undefined) => React.ReactNode;
    };
}

const RegistrationRow: React.FC<RegistrationRowProps> = ({
    index,
    style,
    data,
}) => {
    const {
        registrations,
        theme,
        formatCurrency,
        formatDate,
        getPaymentStatusBadge,
    } = data;
    const registration = registrations[index];

    return (
        <div
            style={style}
            className={`flex items-center border-b px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}
        >
            {/* Attendee */}
            <div className='flex min-w-0 flex-1 items-center'>
                <div className='size-10 shrink-0'>
                    <div className='flex size-10 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600'>
                        <User className='size-5 text-gray-500 dark:text-gray-400' />
                    </div>
                </div>
                <div className='ml-4 min-w-0 flex-1'>
                    <div className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                        {registration.attendeeFirstName}{' '}
                        {registration.attendeeLastName}
                    </div>
                    <div className='flex items-center truncate text-sm text-gray-500 dark:text-gray-400'>
                        <Mail className='mr-1 size-3 shrink-0' />
                        <span className='truncate'>
                            {registration.attendeeEmail}
                        </span>
                    </div>
                </div>
            </div>

            {/* Event */}
            <div className='w-48 shrink-0'>
                <div className='truncate text-sm text-gray-900 dark:text-white'>
                    {registration.eventTitle}
                </div>
            </div>

            {/* Ticket */}
            <div className='w-32 shrink-0'>
                <div className='truncate text-sm text-gray-900 dark:text-white'>
                    {registration.ticketName}
                </div>
            </div>

            {/* Amount */}
            <div className='w-24 shrink-0'>
                <div className='flex items-center text-sm font-medium text-gray-900 dark:text-white'>
                    <DollarSign className='mr-1 size-3 shrink-0' />
                    <span className='truncate'>
                        {formatCurrency(registration.amountPaid)}
                    </span>
                </div>
            </div>

            {/* Status */}
            <div className='w-24 shrink-0'>
                {getPaymentStatusBadge(registration.paymentStatus)}
            </div>

            {/* Registration Date */}
            <div className='w-32 shrink-0'>
                <div className='flex items-center text-sm text-gray-900 dark:text-white'>
                    <Calendar className='mr-1 size-3 shrink-0' />
                    <span className='truncate'>
                        {formatDate(registration.registrationDate)}
                    </span>
                </div>
            </div>

            {/* Financing */}
            <div className='w-24 shrink-0'>
                {registration.isFinanced ? (
                    <span className='inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
                        <CreditCard className='mr-1 size-3' />
                        Financed
                    </span>
                ) : (
                    <span className='text-xs text-gray-400'>-</span>
                )}
            </div>
        </div>
    );
};

const VirtualizedRegistrationTable: React.FC<
    VirtualizedRegistrationTableProps
> = ({ registrations, height = 600, itemHeight = 80 }) => {
    const { theme } = useTheme();

    const formatCurrency = useCallback((amount: number | undefined) => {
        if (amount === undefined) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    }, []);

    const formatDate = useCallback((dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }, []);

    const getPaymentStatusBadge = useCallback((status: number | undefined) => {
        const statusMap: Record<number, { label: string; className: string }> =
            {
                0: {
                    label: 'Pending',
                    className:
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                },
                1: {
                    label: 'Completed',
                    className:
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                },
                2: {
                    label: 'Failed',
                    className:
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                },
                3: {
                    label: 'Cancelled',
                    className:
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
                },
            };

        const statusInfo = statusMap[status || 0] || statusMap[0];

        return (
            <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}
            >
                {statusInfo.label}
            </span>
        );
    }, []);

    const itemData = useMemo(
        () => ({
            registrations,
            theme,
            formatCurrency,
            formatDate,
            getPaymentStatusBadge,
        }),
        [
            registrations,
            theme,
            formatCurrency,
            formatDate,
            getPaymentStatusBadge,
        ]
    );

    if (registrations.length === 0) {
        return (
            <div className='flex h-64 items-center justify-center'>
                <div className='text-center'>
                    <FileText className='mx-auto size-12 text-gray-400' />
                    <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-white'>
                        No registrations found
                    </h3>
                    <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                        Try adjusting your search or filters
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
        >
            {/* Header */}
            <div
                className={`flex items-center border-b px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 ${
                    theme === 'dark'
                        ? 'border-gray-700 bg-gray-700'
                        : 'border-gray-200 bg-gray-50'
                }`}
            >
                <div className='min-w-0 flex-1'>Attendee</div>
                <div className='w-48 shrink-0'>Event</div>
                <div className='w-32 shrink-0'>Ticket</div>
                <div className='w-24 shrink-0'>Amount</div>
                <div className='w-24 shrink-0'>Status</div>
                <div className='w-32 shrink-0'>Registration Date</div>
                <div className='w-24 shrink-0'>Financing</div>
            </div>

            {/* Virtualized list */}
            <List
                height={height}
                itemCount={registrations.length}
                itemSize={itemHeight}
                itemData={itemData}
                overscanCount={5}
            >
                {RegistrationRow}
            </List>
        </div>
    );
};

export default React.memo(VirtualizedRegistrationTable);
