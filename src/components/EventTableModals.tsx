'use client';

import React, { useState } from 'react';
import { EventDuplicationRequest } from '../lib/api';
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

interface BulkActionConfig {
    action: number;
    newStatus?: number;
    reason?: string;
}

interface ExportConfig {
    format: 'csv' | 'excel' | 'pdf';
    includeFields: string[];
}

interface EventTableModalsProps {
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    showBulkActionsModal: boolean;
    setShowBulkActionsModal: (show: boolean) => void;
    showExportModal: boolean;
    setShowExportModal: (show: boolean) => void;
    showDuplicateModal: boolean;
    setShowDuplicateModal: (show: boolean) => void;
    filters: EventTableFilters;
    handleFilterChange: (key: keyof EventTableFilters, value: any) => void;
    clearFilters: () => void;
    bulkActionConfig: BulkActionConfig;
    setBulkActionConfig: React.Dispatch<React.SetStateAction<BulkActionConfig>>;
    handleBulkAction: () => void;
    selectedEvents: Set<string>;
    exportConfig: ExportConfig;
    setExportConfig: React.Dispatch<React.SetStateAction<ExportConfig>>;
    handleExport: () => void;
    handleDuplicateEvent: (data: EventDuplicationRequest) => void;
    duplicateEventId: string | null;
    setDuplicateEventId: (id: string | null) => void;
    loading: boolean;
    theme: string;
}

const EventTableModals: React.FC<EventTableModalsProps> = ({
    showFilters,
    setShowFilters,
    showBulkActionsModal,
    setShowBulkActionsModal,
    showExportModal,
    setShowExportModal,
    showDuplicateModal,
    setShowDuplicateModal,
    filters,
    handleFilterChange,
    clearFilters,
    bulkActionConfig,
    setBulkActionConfig,
    handleBulkAction,
    selectedEvents,
    exportConfig,
    setExportConfig,
    handleExport,
    handleDuplicateEvent,
    duplicateEventId,
    setDuplicateEventId,
    loading,
    theme,
}) => {
    return (
        <>
            {/* Filters Modal */}
            <Dialog open={showFilters} onOpenChange={setShowFilters}>
                <DialogContent className='max-w-2xl'>
                    <DialogHeader>
                        <DialogTitle>Filter Events</DialogTitle>
                        <DialogDescription>
                            Apply filters to narrow down your event list
                        </DialogDescription>
                    </DialogHeader>

                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) =>
                                    handleFilterChange('status', e.target.value)
                                }
                                className={`w-full rounded-lg border px-3 py-2 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            >
                                <option value=''>All Statuses</option>
                                <option value='0'>Draft</option>
                                <option value='1'>Published</option>
                                <option value='2'>Cancelled</option>
                                <option value='3'>Completed</option>
                            </select>
                        </div>

                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Category
                            </label>
                            <select
                                value={filters.category}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'category',
                                        e.target.value
                                    )
                                }
                                className={`w-full rounded-lg border px-3 py-2 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            >
                                <option value=''>All Categories</option>
                                <option value='0'>Conference</option>
                                <option value='1'>Workshop</option>
                                <option value='2'>Seminar</option>
                                <option value='3'>Networking</option>
                                <option value='4'>Entertainment</option>
                                <option value='5'>Sports</option>
                                <option value='6'>Other</option>
                            </select>
                        </div>

                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Start Date
                            </label>
                            <input
                                type='date'
                                value={filters.startDate}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'startDate',
                                        e.target.value
                                    )
                                }
                                className={`w-full rounded-lg border px-3 py-2 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            />
                        </div>

                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                End Date
                            </label>
                            <input
                                type='date'
                                value={filters.endDate}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'endDate',
                                        e.target.value
                                    )
                                }
                                className={`w-full rounded-lg border px-3 py-2 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            />
                        </div>

                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Event Type
                            </label>
                            <select
                                value={
                                    filters.isVirtual === null
                                        ? ''
                                        : filters.isVirtual.toString()
                                }
                                onChange={(e) =>
                                    handleFilterChange(
                                        'isVirtual',
                                        e.target.value === ''
                                            ? null
                                            : e.target.value === 'true'
                                    )
                                }
                                className={`w-full rounded-lg border px-3 py-2 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            >
                                <option value=''>All Types</option>
                                <option value='false'>In-Person</option>
                                <option value='true'>Virtual</option>
                            </select>
                        </div>

                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Has Registrations
                            </label>
                            <select
                                value={
                                    filters.hasRegistrations === null
                                        ? ''
                                        : filters.hasRegistrations.toString()
                                }
                                onChange={(e) =>
                                    handleFilterChange(
                                        'hasRegistrations',
                                        e.target.value === ''
                                            ? null
                                            : e.target.value === 'true'
                                    )
                                }
                                className={`w-full rounded-lg border px-3 py-2 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            >
                                <option value=''>All Events</option>
                                <option value='true'>With Registrations</option>
                                <option value='false'>
                                    Without Registrations
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Min Revenue
                            </label>
                            <input
                                type='number'
                                value={filters.minRevenue || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'minRevenue',
                                        e.target.value
                                            ? Number(e.target.value)
                                            : null
                                    )
                                }
                                placeholder='0'
                                className={`w-full rounded-lg border px-3 py-2 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            />
                        </div>

                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Max Revenue
                            </label>
                            <input
                                type='number'
                                value={filters.maxRevenue || ''}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'maxRevenue',
                                        e.target.value
                                            ? Number(e.target.value)
                                            : null
                                    )
                                }
                                placeholder='No limit'
                                className={`w-full rounded-lg border px-3 py-2 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant='outline' onClick={clearFilters}>
                            Clear All
                        </Button>
                        <Button onClick={() => setShowFilters(false)}>
                            Apply Filters
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Actions Modal */}
            <Dialog
                open={showBulkActionsModal}
                onOpenChange={setShowBulkActionsModal}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Actions</DialogTitle>
                        <DialogDescription>
                            Apply actions to {selectedEvents.size} selected
                            event{selectedEvents.size !== 1 ? 's' : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-4'>
                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Action
                            </label>
                            <select
                                value={bulkActionConfig.action}
                                onChange={(e) =>
                                    setBulkActionConfig((prev) => ({
                                        ...prev,
                                        action: Number(e.target.value),
                                    }))
                                }
                                className={`w-full rounded-lg border px-3 py-2 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            >
                                <option value={0}>Change Status</option>
                                <option value={1}>Delete Events</option>
                                <option value={2}>Archive Events</option>
                            </select>
                        </div>

                        {bulkActionConfig.action === 0 && (
                            <div>
                                <label className='mb-2 block text-sm font-medium'>
                                    New Status
                                </label>
                                <select
                                    value={bulkActionConfig.newStatus || ''}
                                    onChange={(e) =>
                                        setBulkActionConfig((prev) => ({
                                            ...prev,
                                            newStatus: Number(e.target.value),
                                        }))
                                    }
                                    className={`w-full rounded-lg border px-3 py-2 ${
                                        theme === 'dark'
                                            ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                            : 'border-gray-300 bg-white text-gray-900'
                                    }`}
                                >
                                    <option value=''>Select Status</option>
                                    <option value={0}>Draft</option>
                                    <option value={1}>Published</option>
                                    <option value={2}>Cancelled</option>
                                    <option value={3}>Completed</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Reason (Optional)
                            </label>
                            <textarea
                                value={bulkActionConfig.reason || ''}
                                onChange={(e) =>
                                    setBulkActionConfig((prev) => ({
                                        ...prev,
                                        reason: e.target.value,
                                    }))
                                }
                                placeholder='Enter reason for this action...'
                                rows={3}
                                className={`w-full rounded-lg border px-3 py-2 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => setShowBulkActionsModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleBulkAction} disabled={loading}>
                            {loading ? 'Processing...' : 'Apply Action'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export Modal */}
            <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Export Events</DialogTitle>
                        <DialogDescription>
                            Choose export format and fields to include
                        </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-4'>
                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Export Format
                            </label>
                            <select
                                value={exportConfig.format}
                                onChange={(e) =>
                                    setExportConfig((prev) => ({
                                        ...prev,
                                        format: e.target.value as
                                            | 'csv'
                                            | 'excel'
                                            | 'pdf',
                                    }))
                                }
                                className={`w-full rounded-lg border px-3 py-2 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                            >
                                <option value='csv'>CSV</option>
                                <option value='excel'>Excel</option>
                                <option value='pdf'>PDF</option>
                            </select>
                        </div>

                        <div>
                            <label className='mb-2 block text-sm font-medium'>
                                Fields to Include
                            </label>
                            <div className='grid grid-cols-2 gap-2'>
                                {[
                                    { key: 'title', label: 'Title' },
                                    { key: 'status', label: 'Status' },
                                    { key: 'startDate', label: 'Start Date' },
                                    { key: 'endDate', label: 'End Date' },
                                    { key: 'venue', label: 'Venue' },
                                    { key: 'category', label: 'Category' },
                                    {
                                        key: 'registrationCount',
                                        label: 'Registrations',
                                    },
                                    { key: 'revenue', label: 'Revenue' },
                                    {
                                        key: 'ticketsSold',
                                        label: 'Tickets Sold',
                                    },
                                    {
                                        key: 'totalTickets',
                                        label: 'Total Tickets',
                                    },
                                    {
                                        key: 'dateCreated',
                                        label: 'Date Created',
                                    },
                                ].map((field) => (
                                    <label
                                        key={field.key}
                                        className='flex items-center gap-2'
                                    >
                                        <Checkbox
                                            checked={exportConfig.includeFields.includes(
                                                field.key
                                            )}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setExportConfig((prev) => ({
                                                        ...prev,
                                                        includeFields: [
                                                            ...prev.includeFields,
                                                            field.key,
                                                        ],
                                                    }));
                                                } else {
                                                    setExportConfig((prev) => ({
                                                        ...prev,
                                                        includeFields:
                                                            prev.includeFields.filter(
                                                                (f) =>
                                                                    f !==
                                                                    field.key
                                                            ),
                                                    }));
                                                }
                                            }}
                                        />
                                        <span className='text-sm'>
                                            {field.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => setShowExportModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={
                                loading ||
                                exportConfig.includeFields.length === 0
                            }
                        >
                            {loading ? 'Exporting...' : 'Export'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Duplicate Event Modal */}
            <Dialog
                open={showDuplicateModal}
                onOpenChange={setShowDuplicateModal}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Duplicate Event</DialogTitle>
                        <DialogDescription>
                            Create a copy of this event with new details
                        </DialogDescription>
                    </DialogHeader>

                    <DuplicateEventForm
                        onSubmit={handleDuplicateEvent}
                        onCancel={() => {
                            setShowDuplicateModal(false);
                            setDuplicateEventId(null);
                        }}
                        loading={loading}
                        theme={theme}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
};

// Duplicate Event Form Component
interface DuplicateEventFormProps {
    onSubmit: (data: EventDuplicationRequest) => void;
    onCancel: () => void;
    loading: boolean;
    theme: string;
}

const DuplicateEventForm: React.FC<DuplicateEventFormProps> = ({
    onSubmit,
    onCancel,
    loading,
    theme,
}) => {
    const [formData, setFormData] = useState<EventDuplicationRequest>({
        newTitle: '',
        newStartDate: '',
        newEndDate: '',
        copyTickets: true,
        copyImages: true,
        initialStatus: 0, // Draft
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
                <label className='mb-2 block text-sm font-medium'>
                    New Event Title
                </label>
                <input
                    type='text'
                    value={formData.newTitle || ''}
                    onChange={(e) =>
                        setFormData((prev) => ({
                            ...prev,
                            newTitle: e.target.value,
                        }))
                    }
                    placeholder='Enter new event title'
                    required
                    className={`w-full rounded-lg border px-3 py-2 ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                            : 'border-gray-300 bg-white text-gray-900'
                    }`}
                />
            </div>

            <div className='grid grid-cols-2 gap-4'>
                <div>
                    <label className='mb-2 block text-sm font-medium'>
                        New Start Date
                    </label>
                    <input
                        type='datetime-local'
                        value={formData.newStartDate || ''}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                newStartDate: e.target.value,
                            }))
                        }
                        required
                        className={`w-full rounded-lg border px-3 py-2 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                : 'border-gray-300 bg-white text-gray-900'
                        }`}
                    />
                </div>

                <div>
                    <label className='mb-2 block text-sm font-medium'>
                        New End Date
                    </label>
                    <input
                        type='datetime-local'
                        value={formData.newEndDate || ''}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                newEndDate: e.target.value,
                            }))
                        }
                        className={`w-full rounded-lg border px-3 py-2 ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                : 'border-gray-300 bg-white text-gray-900'
                        }`}
                    />
                </div>
            </div>

            <div>
                <label className='mb-2 block text-sm font-medium'>
                    Initial Status
                </label>
                <select
                    value={formData.initialStatus || 0}
                    onChange={(e) =>
                        setFormData((prev) => ({
                            ...prev,
                            initialStatus: Number(e.target.value),
                        }))
                    }
                    className={`w-full rounded-lg border px-3 py-2 ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                            : 'border-gray-300 bg-white text-gray-900'
                    }`}
                >
                    <option value={0}>Draft</option>
                    <option value={1}>Published</option>
                </select>
            </div>

            <div className='space-y-2'>
                <label className='flex items-center gap-2'>
                    <Checkbox
                        checked={formData.copyTickets || false}
                        onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                                ...prev,
                                copyTickets: checked as boolean,
                            }))
                        }
                    />
                    <span className='text-sm'>Copy ticket configuration</span>
                </label>

                <label className='flex items-center gap-2'>
                    <Checkbox
                        checked={formData.copyImages || false}
                        onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                                ...prev,
                                copyImages: checked as boolean,
                            }))
                        }
                    />
                    <span className='text-sm'>Copy event images</span>
                </label>
            </div>

            <DialogFooter>
                <Button type='button' variant='outline' onClick={onCancel}>
                    Cancel
                </Button>
                <Button type='submit' disabled={loading}>
                    {loading ? 'Creating...' : 'Duplicate Event'}
                </Button>
            </DialogFooter>
        </form>
    );
};

export default EventTableModals;
