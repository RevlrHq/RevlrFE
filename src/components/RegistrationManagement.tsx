'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTheme } from '../lib/ThemeContext';
import { EventRegistrationSummary } from '../lib/api';
import {
    useOrganizerRegistrations,
    RegistrationFilters,
} from '../hooks/useOrganizerRegistrations';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from './ui/dialog';
import {
    Search,
    Filter,
    Download,
    RefreshCw,
    Calendar,
    DollarSign,
    User,
    Mail,
    CreditCard,
    FileText,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useDebounce } from '../hooks/useDebounce';

interface RegistrationManagementProps {
    className?: string;
}

const RegistrationManagement: React.FC<RegistrationManagementProps> = ({
    className = '',
}) => {
    const { theme } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [sortBy, setSortBy] = useState<string>('registrationDate');
    const [sortOrder, setSortOrder] = useState<string>('desc');
    const [filters, setFilters] = useState<RegistrationFilters>({});

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const {
        registrations,
        loading,
        error,
        totalCount,
        currentPage,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        fetchRegistrations,
        refetch,
    } = useOrganizerRegistrations(10, {
        searchTerm: debouncedSearchTerm,
        sortBy,
        sortOrder,
        ...filters,
    });

    const handleSearch = useCallback((value: string) => {
        setSearchTerm(value);
    }, []);

    const handleSort = useCallback(
        (field: string) => {
            if (sortBy === field) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
                setSortBy(field);
                setSortOrder('asc');
            }
        },
        [sortBy, sortOrder]
    );

    const handlePageChange = useCallback(
        (page: number) => {
            fetchRegistrations(page);
        },
        [fetchRegistrations]
    );

    const handleFilterChange = useCallback(
        (newFilters: Partial<RegistrationFilters>) => {
            setFilters((prev) => ({ ...prev, ...newFilters }));
        },
        []
    );

    const handleExport = useCallback((format: 'csv' | 'excel' | 'pdf') => {
        // Implementation for data export
        console.log(`Exporting registrations as ${format}`);
        setShowExportModal(false);
    }, []);

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

    const getSortIcon = useCallback(
        (field: string) => {
            if (sortBy !== field) return <ArrowUpDown className='h-4 w-4' />;
            return sortOrder === 'asc' ? (
                <ArrowUp className='h-4 w-4' />
            ) : (
                <ArrowDown className='h-4 w-4' />
            );
        },
        [sortBy, sortOrder]
    );

    if (error) {
        return (
            <div className={`p-6 ${className}`}>
                <div className='py-8 text-center'>
                    <div className='mb-2 text-red-500'>
                        Error loading registrations
                    </div>
                    <p className='mb-4 text-gray-600 dark:text-gray-400'>
                        {error}
                    </p>
                    <Button onClick={refetch} variant='outline'>
                        <RefreshCw className='mr-2 h-4 w-4' />
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
                <div>
                    <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                        Registration Management
                    </h2>
                    <p className='text-gray-600 dark:text-gray-400'>
                        Manage and track event registrations
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                    <Button
                        variant='outline'
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className='mr-2 h-4 w-4' />
                        Filters
                    </Button>
                    <Button
                        variant='outline'
                        onClick={() => setShowExportModal(true)}
                    >
                        <Download className='mr-2 h-4 w-4' />
                        Export
                    </Button>
                    <Button variant='outline' onClick={refetch}>
                        <RefreshCw className='mr-2 h-4 w-4' />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Search and Stats */}
            <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
                <div className='relative max-w-md flex-1'>
                    <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                    <Input
                        placeholder='Search registrations...'
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className='pl-10'
                    />
                </div>
                <div className='text-sm text-gray-600 dark:text-gray-400'>
                    {totalCount} total registrations
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className='space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Payment Status
                            </label>
                            <select
                                className='w-full rounded-md border p-2 dark:border-gray-600 dark:bg-gray-700'
                                onChange={(e) =>
                                    handleFilterChange({
                                        paymentStatus:
                                            e.target.value || undefined,
                                    })
                                }
                            >
                                <option value=''>All Statuses</option>
                                <option value='0'>Pending</option>
                                <option value='1'>Completed</option>
                                <option value='2'>Failed</option>
                                <option value='3'>Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Financing
                            </label>
                            <select
                                className='w-full rounded-md border p-2 dark:border-gray-600 dark:bg-gray-700'
                                onChange={(e) =>
                                    handleFilterChange({
                                        isFinanced:
                                            e.target.value === ''
                                                ? undefined
                                                : e.target.value === 'true',
                                    })
                                }
                            >
                                <option value=''>All</option>
                                <option value='true'>Financed</option>
                                <option value='false'>Not Financed</option>
                            </select>
                        </div>
                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Date Range
                            </label>
                            <div className='flex gap-2'>
                                <Input
                                    type='date'
                                    placeholder='Start Date'
                                    onChange={(e) =>
                                        handleFilterChange({
                                            registrationStartDate:
                                                e.target.value || undefined,
                                        })
                                    }
                                />
                                <Input
                                    type='date'
                                    placeholder='End Date'
                                    onChange={(e) =>
                                        handleFilterChange({
                                            registrationEndDate:
                                                e.target.value || undefined,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className='overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800'>
                <div className='overflow-x-auto'>
                    <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                        <thead className='bg-gray-50 dark:bg-gray-700'>
                            <tr>
                                <th
                                    className='cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600'
                                    onClick={() =>
                                        handleSort('attendeeFirstName')
                                    }
                                >
                                    <div className='flex items-center gap-1'>
                                        Attendee
                                        {getSortIcon('attendeeFirstName')}
                                    </div>
                                </th>
                                <th
                                    className='cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600'
                                    onClick={() => handleSort('eventTitle')}
                                >
                                    <div className='flex items-center gap-1'>
                                        Event
                                        {getSortIcon('eventTitle')}
                                    </div>
                                </th>
                                <th
                                    className='cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600'
                                    onClick={() => handleSort('ticketName')}
                                >
                                    <div className='flex items-center gap-1'>
                                        Ticket
                                        {getSortIcon('ticketName')}
                                    </div>
                                </th>
                                <th
                                    className='cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600'
                                    onClick={() => handleSort('amountPaid')}
                                >
                                    <div className='flex items-center gap-1'>
                                        Amount
                                        {getSortIcon('amountPaid')}
                                    </div>
                                </th>
                                <th
                                    className='cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600'
                                    onClick={() => handleSort('paymentStatus')}
                                >
                                    <div className='flex items-center gap-1'>
                                        Status
                                        {getSortIcon('paymentStatus')}
                                    </div>
                                </th>
                                <th
                                    className='cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600'
                                    onClick={() =>
                                        handleSort('registrationDate')
                                    }
                                >
                                    <div className='flex items-center gap-1'>
                                        Registration Date
                                        {getSortIcon('registrationDate')}
                                    </div>
                                </th>
                                <th className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300'>
                                    Financing
                                </th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800'>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index}>
                                        <td className='whitespace-nowrap px-6 py-4'>
                                            <Skeleton className='h-4 w-32' />
                                        </td>
                                        <td className='whitespace-nowrap px-6 py-4'>
                                            <Skeleton className='h-4 w-24' />
                                        </td>
                                        <td className='whitespace-nowrap px-6 py-4'>
                                            <Skeleton className='h-4 w-20' />
                                        </td>
                                        <td className='whitespace-nowrap px-6 py-4'>
                                            <Skeleton className='h-4 w-16' />
                                        </td>
                                        <td className='whitespace-nowrap px-6 py-4'>
                                            <Skeleton className='h-6 w-20' />
                                        </td>
                                        <td className='whitespace-nowrap px-6 py-4'>
                                            <Skeleton className='h-4 w-24' />
                                        </td>
                                        <td className='whitespace-nowrap px-6 py-4'>
                                            <Skeleton className='h-4 w-16' />
                                        </td>
                                    </tr>
                                ))
                            ) : registrations.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className='px-6 py-12 text-center'
                                    >
                                        <div className='text-gray-500 dark:text-gray-400'>
                                            <FileText className='mx-auto mb-4 h-12 w-12 opacity-50' />
                                            <p className='mb-2 text-lg font-medium'>
                                                No registrations found
                                            </p>
                                            <p className='text-sm'>
                                                Try adjusting your search or
                                                filters
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                registrations.map((registration) => (
                                    <tr
                                        key={registration.registrationId}
                                        className='hover:bg-gray-50 dark:hover:bg-gray-700'
                                    >
                                        <td className='whitespace-nowrap px-6 py-4'>
                                            <div className='flex items-center'>
                                                <div className='h-10 w-10 flex-shrink-0'>
                                                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600'>
                                                        <User className='h-5 w-5 text-gray-500 dark:text-gray-400' />
                                                    </div>
                                                </div>
                                                <div className='ml-4'>
                                                    <div className='text-sm font-medium text-gray-900 dark:text-white'>
                                                        {
                                                            registration.attendeeFirstName
                                                        }{' '}
                                                        {
                                                            registration.attendeeLastName
                                                        }
                                                    </div>
                                                    <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                                                        <Mail className='mr-1 h-3 w-3' />
                                                        {
                                                            registration.attendeeEmail
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='whitespace-nowrap px-6 py-4'>
                                            <div className='text-sm text-gray-900 dark:text-white'>
                                                {registration.eventTitle}
                                            </div>
                                        </td>
                                        <td className='whitespace-nowrap px-6 py-4'>
                                            <div className='text-sm text-gray-900 dark:text-white'>
                                                {registration.ticketName}
                                            </div>
                                        </td>
                                        <td className='whitespace-nowrap px-6 py-4'>
                                            <div className='flex items-center text-sm font-medium text-gray-900 dark:text-white'>
                                                <DollarSign className='mr-1 h-3 w-3' />
                                                {formatCurrency(
                                                    registration.amountPaid
                                                )}
                                            </div>
                                        </td>
                                        <td className='whitespace-nowrap px-6 py-4'>
                                            {getPaymentStatusBadge(
                                                registration.paymentStatus
                                            )}
                                        </td>
                                        <td className='whitespace-nowrap px-6 py-4'>
                                            <div className='flex items-center text-sm text-gray-900 dark:text-white'>
                                                <Calendar className='mr-1 h-3 w-3' />
                                                {formatDate(
                                                    registration.registrationDate
                                                )}
                                            </div>
                                        </td>
                                        <td className='whitespace-nowrap px-6 py-4'>
                                            {registration.isFinanced ? (
                                                <span className='inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
                                                    <CreditCard className='mr-1 h-3 w-3' />
                                                    Financed
                                                </span>
                                            ) : (
                                                <span className='text-xs text-gray-400'>
                                                    -
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className='flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 sm:px-6'>
                        <div className='flex flex-1 justify-between sm:hidden'>
                            <Button
                                variant='outline'
                                onClick={() =>
                                    handlePageChange(currentPage - 1)
                                }
                                disabled={!hasPreviousPage}
                            >
                                Previous
                            </Button>
                            <Button
                                variant='outline'
                                onClick={() =>
                                    handlePageChange(currentPage + 1)
                                }
                                disabled={!hasNextPage}
                            >
                                Next
                            </Button>
                        </div>
                        <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
                            <div>
                                <p className='text-sm text-gray-700 dark:text-gray-300'>
                                    Showing{' '}
                                    <span className='font-medium'>
                                        {(currentPage - 1) * 10 + 1}
                                    </span>{' '}
                                    to{' '}
                                    <span className='font-medium'>
                                        {Math.min(currentPage * 10, totalCount)}
                                    </span>{' '}
                                    of{' '}
                                    <span className='font-medium'>
                                        {totalCount}
                                    </span>{' '}
                                    results
                                </p>
                            </div>
                            <div>
                                <nav
                                    className='relative z-0 inline-flex -space-x-px rounded-md shadow-sm'
                                    aria-label='Pagination'
                                >
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        onClick={() =>
                                            handlePageChange(currentPage - 1)
                                        }
                                        disabled={!hasPreviousPage}
                                        className='relative inline-flex items-center rounded-l-md px-2 py-2'
                                    >
                                        <ChevronLeft className='h-5 w-5' />
                                    </Button>

                                    {Array.from(
                                        { length: Math.min(5, totalPages) },
                                        (_, i) => {
                                            const page = i + 1;
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        currentPage === page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size='sm'
                                                    onClick={() =>
                                                        handlePageChange(page)
                                                    }
                                                    className='relative inline-flex items-center px-4 py-2'
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        }
                                    )}

                                    <Button
                                        variant='outline'
                                        size='sm'
                                        onClick={() =>
                                            handlePageChange(currentPage + 1)
                                        }
                                        disabled={!hasNextPage}
                                        className='relative inline-flex items-center rounded-r-md px-2 py-2'
                                    >
                                        <ChevronRight className='h-5 w-5' />
                                    </Button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Export Modal */}
            <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Export Registrations</DialogTitle>
                        <DialogDescription>
                            Choose the format for exporting registration data
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <Button
                            onClick={() => handleExport('csv')}
                            className='w-full justify-start'
                            variant='outline'
                        >
                            <FileText className='mr-2 h-4 w-4' />
                            Export as CSV
                        </Button>
                        <Button
                            onClick={() => handleExport('excel')}
                            className='w-full justify-start'
                            variant='outline'
                        >
                            <FileText className='mr-2 h-4 w-4' />
                            Export as Excel
                        </Button>
                        <Button
                            onClick={() => handleExport('pdf')}
                            className='w-full justify-start'
                            variant='outline'
                        >
                            <FileText className='mr-2 h-4 w-4' />
                            Export as PDF
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RegistrationManagement;
