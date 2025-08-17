'use client';

import React, { useState, useCallback } from 'react';
import { useTheme } from '../lib/ThemeContext';
import {
    OrganizerService,
    EventSummaryView,
    EventStatus,
    BulkEventActionRequest,
    EventDuplicationRequest,
} from '../lib/api';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from './ui/dialog';
import {
    Search,
    Filter,
    Download,
    MoreHorizontal,
    Edit,
    Copy,
    Eye,
    Calendar,
    Users,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    Archive,
} from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import EventTableRow from './EventTableRow';
import EventMobileCard from './EventMobileCard';
import EventTablePagination from './EventTablePagination';
import EventTableModals from './EventTableModals';

// Types for the component
interface EventTableFilters {
    searchTerm: string;
    status: string;
    category: string;
    startDate: string;
    endDate: string;
    isVirtual: boolean | null;
    hasRegistrations: boolean | null;
    minRevenue: number | null;
    maxRevenue: number | null;
    minRegistrations: number | null;
    maxRegistrations: number | null;
}

interface SortConfig {
    field: string;
    direction: 'asc' | 'desc';
}

interface PaginationConfig {
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
}

interface BulkActionConfig {
    action: number;
    newStatus?: number;
    reason?: string;
}

interface ExportConfig {
    format: 'csv' | 'excel' | 'pdf';
    includeFields: string[];
}

interface EnhancedEventTableProps {
    className?: string;
    onEventSelect?: (event: EventSummaryView) => void;
    onEventEdit?: (eventId: string) => void;
    onEventView?: (eventId: string) => void;
    showActions?: boolean;
    showBulkActions?: boolean;
    showExport?: boolean;
    defaultPageSize?: number;
}

const EnhancedEventTable: React.FC<EnhancedEventTableProps> = ({
    className = '',
    onEventSelect,
    onEventEdit,
    onEventView,
    showActions = true,
    showBulkActions = true,
    showExport = true,
    defaultPageSize = 10,
}) => {
    const { theme } = useTheme();

    // State management
    const [events, setEvents] = useState<EventSummaryView[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvents, setSelectedEvents] = useState<Set<string>>(
        new Set()
    );

    // Filters and sorting
    const [filters, setFilters] = useState<EventTableFilters>({
        searchTerm: '',
        status: '',
        category: '',
        startDate: '',
        endDate: '',
        isVirtual: null,
        hasRegistrations: null,
        minRevenue: null,
        maxRevenue: null,
        minRegistrations: null,
        maxRegistrations: null,
    });

    const [sortConfig, setSortConfig] = useState<SortConfig>({
        field: 'dateCreated',
        direction: 'desc',
    });

    const [pagination, setPagination] = useState<PaginationConfig>({
        pageNumber: 1,
        pageSize: defaultPageSize,
        totalPages: 1,
        totalItems: 0,
    });

    // Modal states
    const [showFilters, setShowFilters] = useState(false);
    const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateEventId, setDuplicateEventId] = useState<string | null>(
        null
    );

    // Bulk action and export configs
    const [bulkActionConfig, setBulkActionConfig] = useState<BulkActionConfig>({
        action: 0,
    });
    const [exportConfig, setExportConfig] = useState<ExportConfig>({
        format: 'csv',
        includeFields: [
            'title',
            'status',
            'startDate',
            'registrationCount',
            'revenue',
        ],
    });

    // Fetch events data
    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await OrganizerService.getApiOrganizerEvents({
                pageNumber: pagination.pageNumber,
                pageSize: pagination.pageSize,
                sortBy: sortConfig.field,
                sortOrder: sortConfig.direction,
                searchTerm: filters.searchTerm || undefined,
                status: filters.status || undefined,
                category: filters.category || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
                isVirtual: filters.isVirtual ?? undefined,
                hasRegistrations: filters.hasRegistrations ?? undefined,
                minRevenue: filters.minRevenue ?? undefined,
                maxRevenue: filters.maxRevenue ?? undefined,
                minRegistrations: filters.minRegistrations ?? undefined,
                maxRegistrations: filters.maxRegistrations ?? undefined,
            });

            if (response.success && response.data) {
                setEvents(response.data.items || []);
                setPagination((prev) => ({
                    ...prev,
                    totalPages: response.data.totalPages || 1,
                    totalItems: response.data.totalItems || 0,
                }));
            } else {
                setError(response.message || 'Failed to fetch events');
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'An error occurred while fetching events'
            );
        } finally {
            setLoading(false);
        }
    }, [filters, sortConfig, pagination.pageNumber, pagination.pageSize]);

    // Load events on component mount and when dependencies change
    React.useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Bulk action handlers
    const handleBulkAction = async () => {
        if (selectedEvents.size === 0) return;

        setLoading(true);
        try {
            const request: BulkEventActionRequest = {
                eventIds: Array.from(selectedEvents),
                action: bulkActionConfig.action,
                newStatus: bulkActionConfig.newStatus,
                reason: bulkActionConfig.reason,
            };

            const response =
                await OrganizerService.postApiOrganizerEventsBulkAction({
                    requestBody: request,
                });

            if (response.success) {
                setSelectedEvents(new Set());
                setShowBulkActionsModal(false);
                fetchEvents(); // Refresh the data
            } else {
                setError(response.message || 'Bulk action failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bulk action failed');
        } finally {
            setLoading(false);
        }
    };

    // Event duplication handler
    const handleDuplicateEvent = async (
        duplicateData: EventDuplicationRequest
    ) => {
        if (!duplicateEventId) return;

        setLoading(true);
        try {
            const request: EventDuplicationRequest = {
                sourceEventId: duplicateEventId,
                ...duplicateData,
            };

            const response =
                await OrganizerService.postApiOrganizerEventsDuplicate({
                    requestBody: request,
                });

            if (response.success) {
                setShowDuplicateModal(false);
                setDuplicateEventId(null);
                fetchEvents(); // Refresh the data
            } else {
                setError(response.message || 'Event duplication failed');
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Event duplication failed'
            );
        } finally {
            setLoading(false);
        }
    };

    // Export handler
    const handleExport = async () => {
        setLoading(true);
        try {
            // Get all events with current filters (without pagination)
            const response = await OrganizerService.getApiOrganizerEvents({
                pageNumber: 1,
                pageSize: 10000, // Large number to get all events
                sortBy: sortConfig.field,
                sortOrder: sortConfig.direction,
                searchTerm: filters.searchTerm || undefined,
                status: filters.status || undefined,
                category: filters.category || undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
                isVirtual: filters.isVirtual ?? undefined,
                hasRegistrations: filters.hasRegistrations ?? undefined,
                minRevenue: filters.minRevenue ?? undefined,
                maxRevenue: filters.maxRevenue ?? undefined,
                minRegistrations: filters.minRegistrations ?? undefined,
                maxRegistrations: filters.maxRegistrations ?? undefined,
            });

            if (response.success && response.data?.items) {
                const exportData = response.data.items.map((event) => {
                    const row: any = {};

                    if (exportConfig.includeFields.includes('title'))
                        row.Title = event.title;
                    if (exportConfig.includeFields.includes('status'))
                        row.Status = getStatusLabel(event.status!);
                    if (exportConfig.includeFields.includes('startDate'))
                        row['Start Date'] = formatDate(event.startDate!);
                    if (
                        exportConfig.includeFields.includes('endDate') &&
                        event.endDate
                    )
                        row['End Date'] = formatDate(event.endDate);
                    if (exportConfig.includeFields.includes('venue'))
                        row.Venue =
                            event.venue ||
                            (event.isVirtual ? 'Virtual' : 'TBA');
                    if (exportConfig.includeFields.includes('category'))
                        row.Category = event.categoryDescription;
                    if (
                        exportConfig.includeFields.includes('registrationCount')
                    )
                        row.Registrations = event.registrationCount || 0;
                    if (exportConfig.includeFields.includes('revenue'))
                        row.Revenue = event.revenue || 0;
                    if (exportConfig.includeFields.includes('ticketsSold'))
                        row['Tickets Sold'] = event.ticketsSold || 0;
                    if (exportConfig.includeFields.includes('totalTickets'))
                        row['Total Tickets'] = event.totalTickets || 0;
                    if (exportConfig.includeFields.includes('dateCreated'))
                        row['Date Created'] = formatDate(event.dateCreated!);

                    return row;
                });

                // Generate and download the file
                downloadCSV(exportData, 'events-export.csv');
                setShowExportModal(false);
            } else {
                setError(response.message || 'Export failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Export failed');
        } finally {
            setLoading(false);
        }
    };

    // CSV download utility
    const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map((row) =>
                headers.map((header) => `"${row[header] || ''}"`).join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Event status helpers
    const getStatusColor = (status: EventStatus) => {
        switch (status) {
            case 1: // Published
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 0: // Draft
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 2: // Cancelled
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 3: // Completed
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const getStatusLabel = (status: EventStatus) => {
        switch (status) {
            case 1:
                return 'Published';
            case 0:
                return 'Draft';
            case 2:
                return 'Cancelled';
            case 3:
                return 'Completed';
            default:
                return 'Unknown';
        }
    };

    const getStatusIcon = (status: EventStatus) => {
        switch (status) {
            case 1:
                return <CheckCircle className='h-4 w-4' />;
            case 0:
                return <Clock className='h-4 w-4' />;
            case 2:
                return <XCircle className='h-4 w-4' />;
            case 3:
                return <Archive className='h-4 w-4' />;
            default:
                return <Clock className='h-4 w-4' />;
        }
    };

    // Utility functions
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    // Selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedEvents(new Set(events.map((event) => event.id!)));
        } else {
            setSelectedEvents(new Set());
        }
    };

    const handleSelectEvent = (eventId: string, checked: boolean) => {
        const newSelected = new Set(selectedEvents);
        if (checked) {
            newSelected.add(eventId);
        } else {
            newSelected.delete(eventId);
        }
        setSelectedEvents(newSelected);
    };

    // Sorting handlers
    const handleSort = (field: string) => {
        setSortConfig((prev) => ({
            field,
            direction:
                prev.field === field && prev.direction === 'asc'
                    ? 'desc'
                    : 'asc',
        }));
    };

    const getSortIcon = (field: string) => {
        if (sortConfig.field !== field) {
            return <ArrowUpDown className='h-4 w-4 opacity-50' />;
        }
        return sortConfig.direction === 'asc' ? (
            <ArrowUp className='h-4 w-4' />
        ) : (
            <ArrowDown className='h-4 w-4' />
        );
    };

    // Pagination handlers
    const handlePageChange = (newPage: number) => {
        setPagination((prev) => ({ ...prev, pageNumber: newPage }));
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPagination((prev) => ({
            ...prev,
            pageSize: newPageSize,
            pageNumber: 1,
        }));
    };

    // Filter handlers
    const handleFilterChange = (key: keyof EventTableFilters, value: any) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPagination((prev) => ({ ...prev, pageNumber: 1 })); // Reset to first page
    };

    const clearFilters = () => {
        setFilters({
            searchTerm: '',
            status: '',
            category: '',
            startDate: '',
            endDate: '',
            isVirtual: null,
            hasRegistrations: null,
            minRevenue: null,
            maxRevenue: null,
            minRegistrations: null,
            maxRegistrations: null,
        });
    };

    return (
        <>
            <div className={`space-y-4 ${className}`}>
                {/* Header with search and actions */}
                <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='max-w-md flex-1'>
                        <div className='relative'>
                            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                            <input
                                type='text'
                                placeholder='Search events...'
                                value={filters.searchTerm}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'searchTerm',
                                        e.target.value
                                    )
                                }
                                className={`w-full rounded-lg border py-2 pl-10 pr-4 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            />
                        </div>
                    </div>

                    <div className='flex items-center gap-2'>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setShowFilters(true)}
                            className='flex items-center gap-2'
                        >
                            <Filter className='h-4 w-4' />
                            Filters
                        </Button>

                        {showExport && (
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setShowExportModal(true)}
                                className='flex items-center gap-2'
                            >
                                <Download className='h-4 w-4' />
                                Export
                            </Button>
                        )}

                        <Button
                            variant='outline'
                            size='sm'
                            onClick={fetchEvents}
                            disabled={loading}
                            className='flex items-center gap-2'
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                            />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Bulk actions bar */}
                {showBulkActions && selectedEvents.size > 0 && (
                    <div
                        className={`flex items-center justify-between rounded-lg border p-4 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-blue-200 bg-blue-50'
                        }`}
                    >
                        <span className='text-sm font-medium'>
                            {selectedEvents.size} event
                            {selectedEvents.size !== 1 ? 's' : ''} selected
                        </span>
                        <div className='flex items-center gap-2'>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setShowBulkActionsModal(true)}
                            >
                                Bulk Actions
                            </Button>
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => setSelectedEvents(new Set())}
                            >
                                Clear Selection
                            </Button>
                        </div>
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className='space-y-4'>
                        {Array.from({ length: pagination.pageSize }).map(
                            (_, index) => (
                                <div
                                    key={index}
                                    className='flex items-center space-x-4 rounded-lg border p-4'
                                >
                                    <Skeleton className='h-4 w-4' />
                                    <Skeleton className='h-16 w-16 rounded' />
                                    <div className='flex-1 space-y-2'>
                                        <Skeleton className='h-4 w-3/4' />
                                        <Skeleton className='h-3 w-1/2' />
                                    </div>
                                    <Skeleton className='h-6 w-20' />
                                    <Skeleton className='h-8 w-8' />
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div
                        className={`rounded-lg border p-6 ${
                            theme === 'dark'
                                ? 'border-red-800 bg-red-900/20 text-red-400'
                                : 'border-red-200 bg-red-50 text-red-800'
                        }`}
                    >
                        <div className='mb-2 flex items-center gap-2'>
                            <XCircle className='h-5 w-5' />
                            <h3 className='font-semibold'>
                                Error loading events
                            </h3>
                        </div>
                        <p className='mb-4 text-sm'>{error}</p>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={fetchEvents}
                            className='flex items-center gap-2'
                        >
                            <RefreshCw className='h-4 w-4' />
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Events table */}
                {!loading && !error && (
                    <>
                        {/* Desktop table view */}
                        <div className='hidden overflow-x-auto lg:block'>
                            <table className='w-full'>
                                <thead>
                                    <tr
                                        className={`border-b ${
                                            theme === 'dark'
                                                ? 'border-revlr-dark-border'
                                                : 'border-gray-200'
                                        }`}
                                    >
                                        {showBulkActions && (
                                            <th className='w-12 p-4 text-left'>
                                                <Checkbox
                                                    checked={
                                                        selectedEvents.size ===
                                                            events.length &&
                                                        events.length > 0
                                                    }
                                                    onCheckedChange={
                                                        handleSelectAll
                                                    }
                                                    aria-label='Select all events'
                                                />
                                            </th>
                                        )}
                                        <th className='p-4 text-left'>
                                            <button
                                                onClick={() =>
                                                    handleSort('title')
                                                }
                                                className='flex items-center gap-2 font-semibold hover:text-blue-600'
                                            >
                                                Event
                                                {getSortIcon('title')}
                                            </button>
                                        </th>
                                        <th className='p-4 text-left'>
                                            <button
                                                onClick={() =>
                                                    handleSort('status')
                                                }
                                                className='flex items-center gap-2 font-semibold hover:text-blue-600'
                                            >
                                                Status
                                                {getSortIcon('status')}
                                            </button>
                                        </th>
                                        <th className='p-4 text-left'>
                                            <button
                                                onClick={() =>
                                                    handleSort('startDate')
                                                }
                                                className='flex items-center gap-2 font-semibold hover:text-blue-600'
                                            >
                                                Date
                                                {getSortIcon('startDate')}
                                            </button>
                                        </th>
                                        <th className='p-4 text-left'>
                                            <button
                                                onClick={() =>
                                                    handleSort(
                                                        'registrationCount'
                                                    )
                                                }
                                                className='flex items-center gap-2 font-semibold hover:text-blue-600'
                                            >
                                                Registrations
                                                {getSortIcon(
                                                    'registrationCount'
                                                )}
                                            </button>
                                        </th>
                                        <th className='p-4 text-left'>
                                            <button
                                                onClick={() =>
                                                    handleSort('revenue')
                                                }
                                                className='flex items-center gap-2 font-semibold hover:text-blue-600'
                                            >
                                                Revenue
                                                {getSortIcon('revenue')}
                                            </button>
                                        </th>
                                        {showActions && (
                                            <th className='w-20 p-4 text-left'>
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((event) => (
                                        <EventTableRow
                                            key={event.id}
                                            event={event}
                                            selected={selectedEvents.has(
                                                event.id!
                                            )}
                                            onSelect={(checked) =>
                                                handleSelectEvent(
                                                    event.id!,
                                                    checked
                                                )
                                            }
                                            onView={() =>
                                                onEventView?.(event.id!)
                                            }
                                            onEdit={() =>
                                                onEventEdit?.(event.id!)
                                            }
                                            onDuplicate={() => {
                                                setDuplicateEventId(event.id!);
                                                setShowDuplicateModal(true);
                                            }}
                                            showBulkActions={showBulkActions}
                                            showActions={showActions}
                                            theme={theme}
                                            formatCurrency={formatCurrency}
                                            formatDate={formatDate}
                                            getStatusColor={getStatusColor}
                                            getStatusLabel={getStatusLabel}
                                            getStatusIcon={getStatusIcon}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile card view */}
                        <div className='space-y-4 lg:hidden'>
                            {events.map((event) => (
                                <EventMobileCard
                                    key={event.id}
                                    event={event}
                                    selected={selectedEvents.has(event.id!)}
                                    onSelect={(checked) =>
                                        handleSelectEvent(event.id!, checked)
                                    }
                                    onView={() => onEventView?.(event.id!)}
                                    onEdit={() => onEventEdit?.(event.id!)}
                                    onDuplicate={() => {
                                        setDuplicateEventId(event.id!);
                                        setShowDuplicateModal(true);
                                    }}
                                    showBulkActions={showBulkActions}
                                    showActions={showActions}
                                    theme={theme}
                                    formatCurrency={formatCurrency}
                                    formatDate={formatDate}
                                    getStatusColor={getStatusColor}
                                    getStatusLabel={getStatusLabel}
                                    getStatusIcon={getStatusIcon}
                                />
                            ))}
                        </div>

                        {/* Empty state */}
                        {events.length === 0 && (
                            <div className='flex flex-col items-center justify-center py-12'>
                                <Calendar className='mb-4 h-12 w-12 text-gray-400' />
                                <h3 className='mb-2 text-lg font-semibold'>
                                    No events found
                                </h3>
                                <p
                                    className={`mb-4 text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    {Object.values(filters).some(
                                        (v) => v !== '' && v !== null
                                    )
                                        ? 'Try adjusting your filters to see more events.'
                                        : 'Create your first event to get started.'}
                                </p>
                                {Object.values(filters).some(
                                    (v) => v !== '' && v !== null
                                ) && (
                                    <Button
                                        variant='outline'
                                        onClick={clearFilters}
                                    >
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {events.length > 0 && (
                            <EventTablePagination
                                pagination={pagination}
                                onPageChange={handlePageChange}
                                onPageSizeChange={handlePageSizeChange}
                                theme={theme}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            <EventTableModals
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                showBulkActionsModal={showBulkActionsModal}
                setShowBulkActionsModal={setShowBulkActionsModal}
                showExportModal={showExportModal}
                setShowExportModal={setShowExportModal}
                showDuplicateModal={showDuplicateModal}
                setShowDuplicateModal={setShowDuplicateModal}
                filters={filters}
                handleFilterChange={handleFilterChange}
                clearFilters={clearFilters}
                bulkActionConfig={bulkActionConfig}
                setBulkActionConfig={setBulkActionConfig}
                handleBulkAction={handleBulkAction}
                selectedEvents={selectedEvents}
                exportConfig={exportConfig}
                setExportConfig={setExportConfig}
                handleExport={handleExport}
                handleDuplicateEvent={handleDuplicateEvent}
                duplicateEventId={duplicateEventId}
                setDuplicateEventId={setDuplicateEventId}
                loading={loading}
                theme={theme}
            />
        </>
    );
};

export default EnhancedEventTable;
