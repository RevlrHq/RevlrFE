'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GreaterIcon } from '@src/icons';
import { useTheme } from '@src/lib/ThemeContext';
import { useEventCreation } from '@src/hooks/useEventCreation';
import { useOnlineStatus } from '@src/hooks/useOnlineStatus';
import { DraftStatusIndicator } from '@src/components/DraftStatusIndicator';
import { ImageUpload } from '@src/components/ImageUpload';
import { TicketManagement } from '@src/components/TicketManagement';
import { PublishConfirmationModal } from '@src/components/PublishConfirmationModal';
import { PublishSuccessModal } from '@src/components/PublishSuccessModal';
import { PrePublishValidation } from '@src/components/PrePublishValidation';
import { EventStatusIndicator } from '@src/components/EventStatusIndicator';
import type { EventImage } from '@src/types/event-creation';
import EventModal from './components/EventModal';

const CreateEvent = () => {
    const { theme } = useTheme();
    const isOnline = useOnlineStatus();
    const router = useRouter();

    // Initialize event creation hook
    const {
        eventData,
        tickets,
        currentStep,
        isSaving,
        isPublishing,
        errors,
        lastSaved,
        hasUnsavedChanges,
        hasBackup,
        updateEventData,
        addTicket,
        updateTicket,
        removeTicket,
        saveDraft,
        publishEvent,
        goToStep,
        restoreFromBackup,
        clearBackup,
        validateForPublishing,
        isReadyForPublishing,
    } = useEventCreation({
        autoSaveInterval: 30000, // 30 seconds
    });

    // Local UI state
    const [modalOpen, setModalOpen] = useState(false);
    const [showBackupPrompt, setShowBackupPrompt] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Check for backup on mount
    useEffect(() => {
        if (hasBackup && !eventData.eventName) {
            setShowBackupPrompt(true);
        }
    }, [hasBackup, eventData.eventName]);

    // Form field handlers
    const handleEventNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateEventData({ eventName: e.target.value });
    };

    const handleEventDescriptionChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        updateEventData({ eventDescription: e.target.value });
    };

    const handleEventCategoryChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        updateEventData({ eventCategory: e.target.value });
    };

    const handleLocationTypeChange = (
        type: 'in-person' | 'virtual' | 'hybrid'
    ) => {
        updateEventData({ locationType: type });
    };

    const handleLocationDetailsChange = (field: string, value: string) => {
        updateEventData({
            locationDetails: {
                ...eventData.locationDetails,
                [field]: value,
            },
        });
    };

    const handleOrganizerChange = (field: string, value: string) => {
        updateEventData({ [field]: value });
    };

    const handleSocialLinksChange = (field: string, value: string) => {
        updateEventData({
            socials: {
                ...eventData.socials,
                [field]: value,
            },
        });
    };

    const handleTicketSelect = (ticketId: string) => {
        updateTicket(ticketId, { selected: true });
        // Deselect other tickets
        tickets.forEach((ticket) => {
            if (ticket.id !== ticketId) {
                updateTicket(ticket.id!, { selected: false });
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const result = await saveDraft();
            if (result.success) {
                alert('Draft saved successfully!');
            } else {
                alert(`Failed to save draft: ${result.message}`);
            }
        } catch {
            alert('Failed to save draft');
        }
    };

    const handleImagesChange = (images: EventImage[]) => {
        updateEventData({ images });
    };

    const handleRestoreBackup = () => {
        restoreFromBackup();
        setShowBackupPrompt(false);
    };

    const handleDiscardBackup = () => {
        clearBackup();
        setShowBackupPrompt(false);
    };

    // Publishing handlers
    const handlePublishClick = () => {
        if (isReadyForPublishing()) {
            setShowPublishModal(true);
        } else {
            // Show validation errors - they will be displayed in the PrePublishValidation component
            validateForPublishing();
        }
    };

    const handleConfirmPublish = async () => {
        try {
            const result = await publishEvent();
            if (result.success) {
                setShowPublishModal(false);
                setShowSuccessModal(true);
            } else {
                // Errors will be shown in the validation component
                setShowPublishModal(false);
            }
        } catch (error) {
            console.error('Failed to publish event:', error);
            setShowPublishModal(false);
        }
    };

    const handleViewEvent = () => {
        if (eventData.id) {
            router.push(`/events/${eventData.id}`);
        }
    };

    const handleManageEvent = () => {
        router.push('/dashboard/event');
    };

    const handleFixError = (field: string) => {
        // Navigate to the appropriate step based on the field
        if (
            [
                'eventName',
                'eventDescription',
                'eventCategory',
                'images',
            ].includes(field)
        ) {
            goToStep(1);
        } else if (
            [
                'startDate',
                'endDate',
                'startTime',
                'endTime',
                'locationType',
                'venueName',
                'address',
                'eventLink',
            ].includes(field)
        ) {
            goToStep(2);
        } else if (field.includes('ticket') || field === 'tickets') {
            goToStep(2); // Assuming tickets are on step 2
        }
    };

    return (
        <div
            className={`min-h-screen transition-all duration-200 ${
                theme === 'dark'
                    ? 'bg-revlr-dark-bg text-white'
                    : 'bg-revlr-primary-grey text-gray-900'
            }`}
        >
            {/* Header */}
            <div
                className={`border-b px-4 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                }`}
            >
                <div
                    className={`flex items-center justify-between p-4 ${
                        theme === 'dark' ? 'bg-revlr-dark-card' : 'bg-white'
                    }`}
                >
                    <div className='flex items-center space-x-2 text-sm'>
                        <span
                            className={`cursor-pointer font-inter text-sm font-medium transition-colors duration-200 ${
                                currentStep === 1
                                    ? 'font-semibold text-revlr-primary-blue'
                                    : theme === 'dark'
                                      ? 'text-gray-400 hover:text-gray-300'
                                      : 'text-gray-500 hover:text-gray-600'
                            }`}
                            onClick={() => goToStep(1)}
                        >
                            Event Details
                        </span>
                        <span
                            className={
                                theme === 'dark'
                                    ? 'text-revlr-dark-border'
                                    : 'text-gray-300'
                            }
                        >
                            <GreaterIcon />
                        </span>
                        <span
                            className={`cursor-pointer font-inter text-sm font-medium transition-colors duration-200 ${
                                currentStep === 2
                                    ? 'font-semibold text-revlr-primary-blue'
                                    : theme === 'dark'
                                      ? 'text-gray-400 hover:text-gray-300'
                                      : 'text-gray-500 hover:text-gray-600'
                            }`}
                            onClick={() => goToStep(2)}
                        >
                            Tickets
                        </span>
                    </div>

                    <div className='flex items-center space-x-4'>
                        <EventStatusIndicator
                            status={eventData.status || 'draft'}
                            size='md'
                        />

                        <DraftStatusIndicator
                            isSaving={isSaving}
                            lastSaved={lastSaved}
                            hasUnsavedChanges={hasUnsavedChanges}
                            hasError={!!errors.general}
                            isOnline={isOnline}
                        />

                        <div className='flex space-x-3'>
                            <button
                                onClick={() => setModalOpen(true)}
                                disabled={isSaving || isPublishing}
                                className={`rounded-xl px-6 py-3 font-inter font-medium transition-all duration-200 ${
                                    theme === 'dark'
                                        ? 'border border-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/20'
                                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                                {isSaving ? 'Saving...' : 'Preview'}
                            </button>

                            <button
                                onClick={handlePublishClick}
                                disabled={isSaving || isPublishing}
                                className='rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-8 py-3 font-inter font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 disabled:cursor-not-allowed disabled:opacity-50'
                            >
                                {isPublishing ? (
                                    <div className='flex items-center space-x-2'>
                                        <div className='size-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                                        <span>Publishing...</span>
                                    </div>
                                ) : eventData.status === 'published' ? (
                                    'Update Event'
                                ) : (
                                    'Publish Event'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Backup restoration prompt */}
            {showBackupPrompt && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
                    <div
                        className={`mx-4 max-w-md rounded-xl p-6 shadow-xl ${
                            theme === 'dark'
                                ? 'border border-revlr-dark-border bg-revlr-dark-card'
                                : 'border border-gray-200 bg-white'
                        }`}
                    >
                        <h3
                            className={`mb-4 text-lg font-semibold ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Restore Previous Draft?
                        </h3>
                        <p
                            className={`mb-6 text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-600'
                            }`}
                        >
                            We found a previous draft of your event. Would you
                            like to restore it?
                        </p>
                        <div className='flex space-x-3'>
                            <button
                                onClick={handleRestoreBackup}
                                className='flex-1 rounded-lg bg-revlr-primary-blue px-4 py-2 font-medium text-white transition-colors hover:bg-revlr-primary-blue/90'
                            >
                                Restore
                            </button>
                            <button
                                onClick={handleDiscardBackup}
                                className={`flex-1 rounded-lg px-4 py-2 font-medium transition-colors ${
                                    theme === 'dark'
                                        ? 'bg-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/80'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Start Fresh
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* General error display */}
            {errors.general && (
                <div className='mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-4'>
                    <p className='font-inter text-sm text-red-700'>
                        {typeof errors.general === 'string'
                            ? errors.general
                            : 'Validation error'}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {currentStep === 1 ? (
                    <div className='space-y-6 p-6'>
                        <div className='flex flex-row gap-6'>
                            <div className='flex flex-1 flex-col space-y-6'>
                                {/* Images Section */}
                                <div
                                    className={`rounded-xl p-8 shadow-lg transition-all duration-200 ${
                                        theme === 'dark'
                                            ? 'border border-revlr-dark-border bg-revlr-dark-card'
                                            : 'border border-gray-200 bg-white'
                                    }`}
                                >
                                    <label
                                        className={`mb-6 block font-inter text-lg font-semibold ${
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        <span className='mr-2 text-revlr-accent-orange'>
                                            *
                                        </span>
                                        Images
                                        <p
                                            className={`mt-1 font-inter text-sm font-normal ${
                                                theme === 'dark'
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            Add at least 1 image for your event
                                        </p>
                                    </label>

                                    <ImageUpload
                                        images={eventData.images}
                                        onImagesChange={handleImagesChange}
                                        maxImages={5}
                                        maxFileSize={5 * 1024 * 1024}
                                        error={
                                            typeof errors.images === 'string'
                                                ? errors.images
                                                : undefined
                                        }
                                    />
                                </div>

                                {/* Basic Details Section */}
                                <div
                                    className={`rounded-xl p-8 shadow-lg transition-all duration-200 ${
                                        theme === 'dark'
                                            ? 'border border-revlr-dark-border bg-revlr-dark-card'
                                            : 'border border-gray-200 bg-white'
                                    }`}
                                >
                                    <label
                                        className={`mb-6 block font-inter text-lg font-semibold ${
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        <span className='mr-2 text-revlr-accent-orange'>
                                            *
                                        </span>
                                        Basic Details
                                    </label>

                                    <div className='space-y-4'>
                                        <div>
                                            <input
                                                type='text'
                                                placeholder='Event Name'
                                                value={eventData.eventName}
                                                onChange={handleEventNameChange}
                                                className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    errors.eventName
                                                        ? 'border-red-500 focus:ring-red-500/20'
                                                        : theme === 'dark'
                                                          ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                          : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            />
                                            {errors.eventName && (
                                                <p className='mt-1 font-inter text-sm text-red-500'>
                                                    {typeof errors.eventName ===
                                                    'string'
                                                        ? errors.eventName
                                                        : 'Validation error'}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <textarea
                                                placeholder='Event Description'
                                                rows={4}
                                                value={
                                                    eventData.eventDescription
                                                }
                                                onChange={
                                                    handleEventDescriptionChange
                                                }
                                                className={`w-full resize-none rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    errors.eventDescription
                                                        ? 'border-red-500 focus:ring-red-500/20'
                                                        : theme === 'dark'
                                                          ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                          : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            />
                                            {errors.eventDescription && (
                                                <p className='mt-1 font-inter text-sm text-red-500'>
                                                    {typeof errors.eventDescription ===
                                                    'string'
                                                        ? errors.eventDescription
                                                        : 'Validation error'}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <select
                                                value={eventData.eventCategory}
                                                onChange={
                                                    handleEventCategoryChange
                                                }
                                                className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    errors.eventCategory
                                                        ? 'border-red-500 focus:ring-red-500/20'
                                                        : theme === 'dark'
                                                          ? 'border-revlr-dark-border bg-revlr-dark-bg text-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                          : 'border-gray-300 bg-white text-gray-900 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            >
                                                <option value=''>
                                                    Select Category
                                                </option>
                                                <option value='conference'>
                                                    Conference
                                                </option>
                                                <option value='workshop'>
                                                    Workshop
                                                </option>
                                                <option value='networking'>
                                                    Networking
                                                </option>
                                                <option value='social'>
                                                    Social
                                                </option>
                                                <option value='entertainment'>
                                                    Entertainment
                                                </option>
                                                <option value='sports'>
                                                    Sports
                                                </option>
                                                <option value='other'>
                                                    Other
                                                </option>
                                            </select>
                                            {errors.eventCategory && (
                                                <p className='mt-1 font-inter text-sm text-red-500'>
                                                    {typeof errors.eventCategory ===
                                                    'string'
                                                        ? errors.eventCategory
                                                        : 'Validation error'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Location Section */}
                                <div
                                    className={`rounded-xl p-8 shadow-lg transition-all duration-200 ${
                                        theme === 'dark'
                                            ? 'border border-revlr-dark-border bg-revlr-dark-card'
                                            : 'border border-gray-200 bg-white'
                                    }`}
                                >
                                    <label
                                        className={`mb-6 block font-inter text-lg font-semibold ${
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        <span className='mr-2 text-revlr-accent-orange'>
                                            *
                                        </span>
                                        Location
                                    </label>

                                    <div className='mb-6 flex flex-row gap-6'>
                                        <button
                                            type='button'
                                            onClick={() =>
                                                handleLocationTypeChange(
                                                    'in-person'
                                                )
                                            }
                                            className={`pb-3 font-inter text-sm font-medium transition-all duration-200 ${
                                                eventData.locationType ===
                                                'in-person'
                                                    ? 'border-b-2 border-revlr-primary-blue text-revlr-primary-blue'
                                                    : theme === 'dark'
                                                      ? 'text-gray-400 hover:text-gray-300'
                                                      : 'text-gray-600 hover:text-gray-700'
                                            }`}
                                        >
                                            In-Person
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() =>
                                                handleLocationTypeChange(
                                                    'virtual'
                                                )
                                            }
                                            className={`pb-3 font-inter text-sm font-medium transition-all duration-200 ${
                                                eventData.locationType ===
                                                'virtual'
                                                    ? 'border-b-2 border-revlr-primary-blue text-revlr-primary-blue'
                                                    : theme === 'dark'
                                                      ? 'text-gray-400 hover:text-gray-300'
                                                      : 'text-gray-600 hover:text-gray-700'
                                            }`}
                                        >
                                            Virtual
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() =>
                                                handleLocationTypeChange(
                                                    'hybrid'
                                                )
                                            }
                                            className={`pb-3 font-inter text-sm font-medium transition-all duration-200 ${
                                                eventData.locationType ===
                                                'hybrid'
                                                    ? 'border-b-2 border-revlr-primary-blue text-revlr-primary-blue'
                                                    : theme === 'dark'
                                                      ? 'text-gray-400 hover:text-gray-300'
                                                      : 'text-gray-600 hover:text-gray-700'
                                            }`}
                                        >
                                            Hybrid
                                        </button>
                                    </div>

                                    {eventData.locationType === 'in-person' && (
                                        <div className='space-y-4'>
                                            <input
                                                type='text'
                                                placeholder='Venue Name'
                                                value={
                                                    eventData.locationDetails
                                                        ?.venueName || ''
                                                }
                                                onChange={(e) =>
                                                    handleLocationDetailsChange(
                                                        'venueName',
                                                        e.target.value
                                                    )
                                                }
                                                className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    theme === 'dark'
                                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            />
                                            <input
                                                type='text'
                                                placeholder='Address'
                                                value={
                                                    eventData.locationDetails
                                                        ?.address || ''
                                                }
                                                onChange={(e) =>
                                                    handleLocationDetailsChange(
                                                        'address',
                                                        e.target.value
                                                    )
                                                }
                                                className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    theme === 'dark'
                                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            />
                                            <input
                                                type='text'
                                                placeholder='Google Maps Links'
                                                value={
                                                    eventData.locationDetails
                                                        ?.googleMapsLink || ''
                                                }
                                                onChange={(e) =>
                                                    handleLocationDetailsChange(
                                                        'googleMapsLink',
                                                        e.target.value
                                                    )
                                                }
                                                className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    theme === 'dark'
                                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            />
                                        </div>
                                    )}

                                    {eventData.locationType === 'virtual' && (
                                        <div>
                                            <input
                                                type='text'
                                                placeholder='Event Link'
                                                value={
                                                    eventData.locationDetails
                                                        ?.eventLink || ''
                                                }
                                                onChange={(e) =>
                                                    handleLocationDetailsChange(
                                                        'eventLink',
                                                        e.target.value
                                                    )
                                                }
                                                className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    theme === 'dark'
                                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            />
                                        </div>
                                    )}

                                    {eventData.locationType === 'hybrid' && (
                                        <div className='space-y-4'>
                                            <input
                                                type='text'
                                                placeholder='Venue Name'
                                                value={
                                                    eventData.locationDetails
                                                        ?.venueName || ''
                                                }
                                                onChange={(e) =>
                                                    handleLocationDetailsChange(
                                                        'venueName',
                                                        e.target.value
                                                    )
                                                }
                                                className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    theme === 'dark'
                                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            />
                                            <input
                                                type='text'
                                                placeholder='Address'
                                                value={
                                                    eventData.locationDetails
                                                        ?.address || ''
                                                }
                                                onChange={(e) =>
                                                    handleLocationDetailsChange(
                                                        'address',
                                                        e.target.value
                                                    )
                                                }
                                                className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    theme === 'dark'
                                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            />
                                            <input
                                                type='text'
                                                placeholder='Google Maps Links'
                                                value={
                                                    eventData.locationDetails
                                                        ?.googleMapsLink || ''
                                                }
                                                onChange={(e) =>
                                                    handleLocationDetailsChange(
                                                        'googleMapsLink',
                                                        e.target.value
                                                    )
                                                }
                                                className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    theme === 'dark'
                                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            />
                                            <input
                                                type='text'
                                                placeholder='Event Link'
                                                value={
                                                    eventData.locationDetails
                                                        ?.eventLink || ''
                                                }
                                                onChange={(e) =>
                                                    handleLocationDetailsChange(
                                                        'eventLink',
                                                        e.target.value
                                                    )
                                                }
                                                className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    theme === 'dark'
                                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className='flex flex-1 flex-col space-y-6'>
                                {/* Organizer Details Section */}
                                <div
                                    className={`rounded-xl p-8 shadow-lg transition-all duration-200 ${
                                        theme === 'dark'
                                            ? 'border border-revlr-dark-border bg-revlr-dark-card'
                                            : 'border border-gray-200 bg-white'
                                    }`}
                                >
                                    <label
                                        className={`mb-6 block font-inter text-lg font-semibold ${
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        Organizer Details
                                    </label>
                                    <div className='space-y-4'>
                                        <div className='flex flex-row items-center gap-4'>
                                            <button
                                                className={`flex size-12 items-center justify-center rounded-full border transition-all duration-200 ${
                                                    theme === 'dark'
                                                        ? 'border-revlr-dark-border bg-revlr-dark-bg hover:bg-revlr-dark-border'
                                                        : 'border-gray-300 bg-white hover:bg-gray-50'
                                                }`}
                                            >
                                                <span
                                                    className={`text-xl ${
                                                        theme === 'dark'
                                                            ? 'text-gray-400'
                                                            : 'text-gray-500'
                                                    }`}
                                                >
                                                    <svg
                                                        width='24'
                                                        height='24'
                                                        viewBox='0 0 24 24'
                                                        fill='none'
                                                        xmlns='http://www.w3.org/2000/svg'
                                                    >
                                                        <path
                                                            d='M18 13H13V18C13 18.55 12.55 19 12 19C11.45 19 11 18.55 11 18V13H6C5.45 13 5 12.55 5 12C5 11.45 5.45 11 6 11H11V6C11 5.45 11.45 5 12 5C12.55 5 13 5.45 13 6V11H18C18.55 11 19 11.45 19 12C19 12.55 18.55 13 18 13Z'
                                                            fill='currentColor'
                                                        />
                                                    </svg>
                                                </span>
                                            </button>
                                            <span
                                                className={`font-inter text-sm font-medium ${
                                                    theme === 'dark'
                                                        ? 'text-gray-300'
                                                        : 'text-gray-600'
                                                }`}
                                            >
                                                Add Logo
                                            </span>
                                        </div>

                                        <div>
                                            <input
                                                type='text'
                                                placeholder='Organizer Name'
                                                value={
                                                    eventData.organizerName ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    handleOrganizerChange(
                                                        'organizerName',
                                                        e.target.value
                                                    )
                                                }
                                                className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    theme === 'dark'
                                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            />
                                        </div>

                                        <div>
                                            <input
                                                type='text'
                                                placeholder='Organizer Website'
                                                value={
                                                    eventData.organizerWebsite ||
                                                    ''
                                                }
                                                onChange={(e) =>
                                                    handleOrganizerChange(
                                                        'organizerWebsite',
                                                        e.target.value
                                                    )
                                                }
                                                className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    theme === 'dark'
                                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Social Links Section */}
                                <div
                                    className={`rounded-xl p-8 shadow-lg transition-all duration-200 ${
                                        theme === 'dark'
                                            ? 'border border-revlr-dark-border bg-revlr-dark-card'
                                            : 'border border-gray-200 bg-white'
                                    }`}
                                >
                                    <label
                                        className={`mb-6 block font-inter text-lg font-semibold ${
                                            theme === 'dark'
                                                ? 'text-white'
                                                : 'text-gray-900'
                                        }`}
                                    >
                                        Socials
                                    </label>
                                    <div className='space-y-4'>
                                        <div>
                                            <input
                                                type='text'
                                                placeholder='Facebook'
                                                value={
                                                    eventData.socials
                                                        ?.facebook || ''
                                                }
                                                onChange={(e) =>
                                                    handleSocialLinksChange(
                                                        'facebook',
                                                        e.target.value
                                                    )
                                                }
                                                className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    theme === 'dark'
                                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            />
                                        </div>

                                        <div>
                                            <input
                                                type='text'
                                                placeholder='Instagram'
                                                value={
                                                    eventData.socials
                                                        ?.instagram || ''
                                                }
                                                onChange={(e) =>
                                                    handleSocialLinksChange(
                                                        'instagram',
                                                        e.target.value
                                                    )
                                                }
                                                className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    theme === 'dark'
                                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            />
                                        </div>

                                        <div>
                                            <input
                                                type='text'
                                                placeholder='X (Twitter)'
                                                value={
                                                    eventData.socials
                                                        ?.twitter || ''
                                                }
                                                onChange={(e) =>
                                                    handleSocialLinksChange(
                                                        'twitter',
                                                        e.target.value
                                                    )
                                                }
                                                className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                                    theme === 'dark'
                                                        ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                } focus:outline-none focus:ring-2`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className='space-y-6 p-6'>
                        <TicketManagement
                            tickets={tickets}
                            eventData={eventData}
                            onAddTicket={addTicket}
                            onUpdateTicket={updateTicket}
                            onDeleteTicket={removeTicket}
                            onSelectTicket={handleTicketSelect}
                            isLoading={isSaving}
                            errors={
                                Object.fromEntries(
                                    Object.entries(errors).filter(
                                        ([, value]) => typeof value === 'string'
                                    )
                                ) as Record<string, string>
                            }
                        />
                    </div>
                )}
            </form>

            {/* Pre-publish validation */}
            {!isReadyForPublishing() && Object.keys(errors).length > 0 && (
                <div className='p-6'>
                    <PrePublishValidation
                        eventData={eventData}
                        tickets={tickets}
                        errors={errors}
                        onFixError={handleFixError}
                    />
                </div>
            )}

            {/* Publish Confirmation Modal */}
            <PublishConfirmationModal
                isOpen={showPublishModal}
                onClose={() => setShowPublishModal(false)}
                onConfirm={handleConfirmPublish}
                eventData={eventData}
                tickets={tickets}
                isPublishing={isPublishing}
            />

            {/* Publish Success Modal */}
            <PublishSuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                onViewEvent={handleViewEvent}
                onManageEvent={handleManageEvent}
                eventData={eventData}
            />

            <EventModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                event={{
                    title: eventData.eventName || 'Untitled Event',
                    date: eventData.dateRange?.startDate || 'TBD',
                    time: eventData.timeRange?.startTime || 'TBD',
                    location:
                        eventData.locationDetails?.venueName ||
                        eventData.locationDetails?.eventLink ||
                        'TBD',
                    image: eventData.images[0]?.url || '/placeholder-event.jpg',
                }}
            />
        </div>
    );
};

export default CreateEvent;
