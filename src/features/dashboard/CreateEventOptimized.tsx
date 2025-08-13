'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import { useEventCreation } from '@src/hooks/useEventCreation';
import {
    usePerformanceTracking,
    useFormTracking,
} from '@src/hooks/usePerformanceTracking';
import {
    ComponentPreloader,
    initializeBundleOptimizations,
} from '@src/lib/utils/bundleOptimization';
import { MonitoringService } from '@src/lib/services/MonitoringService';

// Lazy load components
import {
    LazyWrapper,
    LazyImageUpload,
    LazyTicketManagement,
    LazyLocationSelector,
    LazyOrganizerDetails,
    LazyDateTimeSelector,
    LazyPrePublishValidation,
    useLazySection,
} from '@src/components/LazyComponents';

// Import only essential components synchronously
import { EventStatusIndicator } from '@src/components/EventStatusIndicator';
import { CategorySelector } from '@src/components/CategorySelector';
import { ProgressIndicator } from '@src/components/ProgressIndicator';
import { FormFieldHelp } from '@src/components/HelpTooltip';
import {
    AutoSaveIndicator,
    RecoveryPrompt,
} from '@src/components/AutoSaveIndicator';
import LoadingStates from '@src/components/LoadingStates';
import { AnnouncementRegion } from '@src/components/AnnouncementRegion';

const CreateEventOptimized = () => {
    const { theme } = useTheme();

    // Performance tracking
    const { trackAction, trackError } = usePerformanceTracking('CreateEvent');
    const { trackStepStart, trackStepError, trackFieldInteraction } =
        useFormTracking('event_creation', 2);

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
        goToStep,
        nextStep,
        previousStep,
        canProceedToStep,
        restoreFromBackup,
        clearBackup,
        validateForPublishing,
        isReadyForPublishing,
    } = useEventCreation({
        autoSaveInterval: 30000, // 30 seconds
    });

    // Local UI state
    const [showBackupPrompt, setShowBackupPrompt] = useState(false);

    // Lazy section visibility
    const { ref: imagesSectionRef, isVisible: imagesVisible } =
        useLazySection(0.1);
    const { ref: ticketsSectionRef, isVisible: ticketsVisible } =
        useLazySection(0.1);
    const { ref: locationSectionRef, isVisible: locationVisible } =
        useLazySection(0.1);
    const { ref: organizerSectionRef, isVisible: organizerVisible } =
        useLazySection(0.1);

    // Initialize bundle optimizations
    useEffect(() => {
        initializeBundleOptimizations();
        MonitoringService.initialize();

        // Track form start
        trackAction('form_start');
        trackStepStart(1);
    }, [trackAction, trackStepStart]);

    // Preload components based on current step
    useEffect(() => {
        ComponentPreloader.preloadForStep(currentStep);
        trackStepStart(currentStep);
    }, [currentStep, trackStepStart]);

    // Check for backup on mount
    useEffect(() => {
        if (hasBackup && !eventData.eventName) {
            setShowBackupPrompt(true);
        }
    }, [hasBackup, eventData.eventName]);

    // Form field handlers with performance tracking
    const handleEventNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        trackFieldInteraction('eventName', 'change');
        updateEventData({ eventName: e.target.value });
    };

    const handleEventDescriptionChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        trackFieldInteraction('eventDescription', 'change');
        updateEventData({ eventDescription: e.target.value });
    };

    const handleEventCategoryChange = (category: string) => {
        trackFieldInteraction('eventCategory', 'change');
        updateEventData({ eventCategory: category });
    };

    const handleSaveDraft = async () => {
        trackAction('save_draft');
        try {
            const result = await saveDraft();
            if (result.success) {
                trackAction('save_draft_success');
            } else {
                trackStepError(result.message || 'Save failed');
                trackAction('save_draft_error');
            }
        } catch (error) {
            trackError(error as Error, 'save_draft');
        }
    };

    const handlePublishClick = () => {
        trackAction('publish_attempt');
        if (isReadyForPublishing()) {
            // Direct publish without modal for now
            trackAction('publish_confirmed');
        } else {
            validateForPublishing();
            trackAction('publish_validation_failed');
        }
    };

    // Progress steps configuration
    const progressSteps = [
        {
            id: 1,
            title: 'Event Details',
            description: 'Basic information, images, and location',
            isCompleted: !!(
                eventData.eventName &&
                eventData.eventDescription &&
                eventData.eventCategory &&
                eventData.images?.length > 0
            ),
            isActive: currentStep === 1,
            isAccessible: true,
        },
        {
            id: 2,
            title: 'Tickets',
            description: 'Configure ticket types and pricing',
            isCompleted:
                tickets.length > 0 &&
                tickets.every((t) => t.name && t.quantity > 0),
            isActive: currentStep === 2,
            isAccessible: canProceedToStep(2),
        },
    ];

    return (
        <div
            className={`min-h-screen transition-colors duration-200 ${
                theme === 'dark'
                    ? 'bg-revlr-dark-bg text-white'
                    : 'bg-gray-50 text-gray-900'
            }`}
        >
            {/* Announcement region for screen readers */}
            <AnnouncementRegion />

            {/* Header with progress indicator */}
            <div className='sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
                <div className='mx-auto max-w-7xl p-4'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-4'>
                            <h1 className='text-2xl font-bold'>Create Event</h1>
                            <EventStatusIndicator
                                status={eventData.status || 'draft'}
                            />
                        </div>

                        <div className='flex items-center space-x-4'>
                            <AutoSaveIndicator
                                isSaving={isSaving}
                                lastSaved={lastSaved}
                                hasUnsavedChanges={hasUnsavedChanges}
                                isOnline={true}
                            />
                        </div>
                    </div>

                    <div className='mt-4'>
                        <ProgressIndicator
                            steps={progressSteps}
                            onStepClick={(step) => {
                                if (canProceedToStep(step as 1 | 2)) {
                                    goToStep(step as 1 | 2);
                                    trackAction(`navigate_to_step_${step}`);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Recovery prompt */}
            {showBackupPrompt && (
                <RecoveryPrompt
                    isOpen={showBackupPrompt}
                    onClose={() => setShowBackupPrompt(false)}
                    onRestore={() => {
                        restoreFromBackup();
                        setShowBackupPrompt(false);
                        trackAction('backup_restored');
                    }}
                    onDiscard={() => {
                        clearBackup();
                        setShowBackupPrompt(false);
                        trackAction('backup_discarded');
                    }}
                />
            )}

            {/* Main content */}
            <div className='mx-auto max-w-7xl px-4 py-6'>
                {currentStep === 1 && (
                    <div className='space-y-6'>
                        {/* Images Section - Lazy loaded */}
                        <div ref={imagesSectionRef}>
                            {imagesVisible && (
                                <LazyWrapper
                                    fallback={
                                        <LoadingStates.EventFormSkeleton />
                                    }
                                >
                                    <LazyImageUpload
                                        images={eventData.images || []}
                                        onImagesChange={(images) => {
                                            updateEventData({ images });
                                            trackFieldInteraction(
                                                'images',
                                                'change'
                                            );
                                        }}
                                        maxImages={5}
                                        maxFileSize={5 * 1024 * 1024}
                                        error={
                                            typeof errors.images === 'string'
                                                ? errors.images
                                                : undefined
                                        }
                                    />
                                </LazyWrapper>
                            )}
                        </div>

                        {/* Basic Details Section */}
                        <div
                            className={`rounded-xl p-8 shadow-lg transition-all duration-200 ${
                                theme === 'dark'
                                    ? 'border border-revlr-dark-border bg-revlr-dark-card'
                                    : 'border border-gray-200 bg-white'
                            }`}
                        >
                            <div className='mb-6 flex items-center space-x-2'>
                                <label
                                    className={`block font-inter text-lg font-semibold ${
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
                                <FormFieldHelp
                                    title='Basic Event Information'
                                    content='Provide essential information about your event including a compelling title, detailed description, and appropriate category to help attendees find and understand your event.'
                                />
                            </div>

                            <div className='space-y-4'>
                                <div>
                                    <div className='mb-2 flex items-center space-x-2'>
                                        <label
                                            className={`font-inter text-sm font-medium ${
                                                theme === 'dark'
                                                    ? 'text-white'
                                                    : 'text-gray-900'
                                            }`}
                                        >
                                            Event Name *
                                        </label>
                                        <FormFieldHelp content='Choose a clear, descriptive name that captures the essence of your event.' />
                                    </div>
                                    <input
                                        type='text'
                                        placeholder='Enter your event name'
                                        value={eventData.eventName || ''}
                                        onChange={handleEventNameChange}
                                        onFocus={() =>
                                            trackFieldInteraction(
                                                'eventName',
                                                'focus'
                                            )
                                        }
                                        onBlur={() =>
                                            trackFieldInteraction(
                                                'eventName',
                                                'blur'
                                            )
                                        }
                                        className={`w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
                                            errors.eventName
                                                ? 'border-red-500 focus:ring-red-500/20'
                                                : theme === 'dark'
                                                  ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                                  : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                        } focus:outline-none focus:ring-2`}
                                    />
                                    {errors.eventName && (
                                        <p
                                            className='mt-1 font-inter text-sm text-red-500'
                                            role='alert'
                                        >
                                            {typeof errors.eventName ===
                                            'string'
                                                ? errors.eventName
                                                : 'Validation error'}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <div className='mb-2 flex items-center space-x-2'>
                                        <label
                                            className={`font-inter text-sm font-medium ${
                                                theme === 'dark'
                                                    ? 'text-white'
                                                    : 'text-gray-900'
                                            }`}
                                        >
                                            Event Description *
                                        </label>
                                        <FormFieldHelp content='Provide a detailed description of your event. Include what attendees can expect, key highlights, and any important information they should know.' />
                                    </div>
                                    <textarea
                                        placeholder='Describe your event in detail'
                                        rows={4}
                                        value={eventData.eventDescription || ''}
                                        onChange={handleEventDescriptionChange}
                                        onFocus={() =>
                                            trackFieldInteraction(
                                                'eventDescription',
                                                'focus'
                                            )
                                        }
                                        onBlur={() =>
                                            trackFieldInteraction(
                                                'eventDescription',
                                                'blur'
                                            )
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
                                        <p
                                            className='mt-1 font-inter text-sm text-red-500'
                                            role='alert'
                                        >
                                            {typeof errors.eventDescription ===
                                            'string'
                                                ? errors.eventDescription
                                                : 'Validation error'}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <div className='mb-2 flex items-center space-x-2'>
                                        <label
                                            className={`font-inter text-sm font-medium ${
                                                theme === 'dark'
                                                    ? 'text-white'
                                                    : 'text-gray-900'
                                            }`}
                                        >
                                            Event Category *
                                        </label>
                                        <FormFieldHelp content='Select the category that best describes your event. This helps attendees discover your event when browsing by category.' />
                                    </div>
                                    <CategorySelector
                                        value={eventData.eventCategory || ''}
                                        onChange={handleEventCategoryChange}
                                        error={
                                            typeof errors.eventCategory ===
                                            'string'
                                                ? errors.eventCategory
                                                : undefined
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location Section - Lazy loaded */}
                        <div ref={locationSectionRef}>
                            {locationVisible && (
                                <LazyWrapper
                                    fallback={
                                        <LoadingStates.EventFormSkeleton />
                                    }
                                >
                                    <LazyLocationSelector
                                        locationType={
                                            eventData.locationType ||
                                            'in-person'
                                        }
                                        locationDetails={
                                            eventData.locationDetails
                                        }
                                        onLocationTypeChange={(type) => {
                                            updateEventData({
                                                locationType: type,
                                            });
                                            trackFieldInteraction(
                                                'locationType',
                                                'change'
                                            );
                                        }}
                                        onLocationDetailsChange={(
                                            field,
                                            value
                                        ) => {
                                            updateEventData({
                                                locationDetails: {
                                                    ...eventData.locationDetails,
                                                    [field]: value,
                                                },
                                            });
                                            trackFieldInteraction(
                                                `location_${field}`,
                                                'change'
                                            );
                                        }}
                                        errors={{
                                            venueName:
                                                typeof errors.venueName ===
                                                'string'
                                                    ? errors.venueName
                                                    : undefined,
                                            address:
                                                typeof errors.address ===
                                                'string'
                                                    ? errors.address
                                                    : undefined,
                                            googleMapsLink:
                                                typeof errors.googleMapsLink ===
                                                'string'
                                                    ? errors.googleMapsLink
                                                    : undefined,
                                            eventLink:
                                                typeof errors.eventLink ===
                                                'string'
                                                    ? errors.eventLink
                                                    : undefined,
                                            platform:
                                                typeof errors.platform ===
                                                'string'
                                                    ? errors.platform
                                                    : undefined,
                                        }}
                                    />
                                </LazyWrapper>
                            )}
                        </div>

                        {/* Date & Time Section - Lazy loaded */}
                        <LazyWrapper
                            fallback={<LoadingStates.EventFormSkeleton />}
                        >
                            <LazyDateTimeSelector
                                dateRange={eventData.dateRange}
                                timeRange={eventData.timeRange}
                                timezone={eventData.timezone}
                                onDateRangeChange={(dateRange) => {
                                    updateEventData({ dateRange });
                                    trackFieldInteraction(
                                        'dateRange',
                                        'change'
                                    );
                                }}
                                onTimeRangeChange={(timeRange) => {
                                    updateEventData({ timeRange });
                                    trackFieldInteraction(
                                        'timeRange',
                                        'change'
                                    );
                                }}
                                onTimezoneChange={(timezone) => {
                                    updateEventData({ timezone });
                                    trackFieldInteraction('timezone', 'change');
                                }}
                                errors={{
                                    startDate:
                                        typeof errors.startDate === 'string'
                                            ? errors.startDate
                                            : undefined,
                                    endDate:
                                        typeof errors.endDate === 'string'
                                            ? errors.endDate
                                            : undefined,
                                    startTime:
                                        typeof errors.startTime === 'string'
                                            ? errors.startTime
                                            : undefined,
                                    endTime:
                                        typeof errors.endTime === 'string'
                                            ? errors.endTime
                                            : undefined,
                                    timezone:
                                        typeof errors.timezone === 'string'
                                            ? errors.timezone
                                            : undefined,
                                }}
                            />
                        </LazyWrapper>

                        {/* Organizer Details Section - Lazy loaded */}
                        <div ref={organizerSectionRef}>
                            {organizerVisible && (
                                <LazyWrapper
                                    fallback={
                                        <LoadingStates.EventFormSkeleton />
                                    }
                                >
                                    <LazyOrganizerDetails
                                        organizerName={eventData.organizerName}
                                        organizerWebsite={
                                            eventData.organizerWebsite
                                        }
                                        organizerLogo={eventData.organizerLogo}
                                        socials={eventData.socials}
                                        onOrganizerChange={(field, value) => {
                                            updateEventData({ [field]: value });
                                            trackFieldInteraction(
                                                `organizer_${field}`,
                                                'change'
                                            );
                                        }}
                                        onSocialLinksChange={(field, value) => {
                                            updateEventData({
                                                socials: {
                                                    ...eventData.socials,
                                                    [field]: value,
                                                },
                                            });
                                            trackFieldInteraction(
                                                `social_${field}`,
                                                'change'
                                            );
                                        }}
                                        errors={{
                                            organizerName:
                                                typeof errors.organizerName ===
                                                'string'
                                                    ? errors.organizerName
                                                    : undefined,
                                            organizerWebsite:
                                                typeof errors.organizerWebsite ===
                                                'string'
                                                    ? errors.organizerWebsite
                                                    : undefined,
                                            organizerLogo:
                                                typeof errors.organizerLogo ===
                                                'string'
                                                    ? errors.organizerLogo
                                                    : undefined,
                                        }}
                                    />
                                </LazyWrapper>
                            )}
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className='space-y-6'>
                        {/* Tickets Section - Lazy loaded */}
                        <div ref={ticketsSectionRef}>
                            {ticketsVisible && (
                                <LazyWrapper
                                    fallback={
                                        <LoadingStates.TicketManagementSkeleton />
                                    }
                                >
                                    <LazyTicketManagement
                                        eventData={eventData}
                                        tickets={tickets}
                                        onAddTicket={(ticket) => {
                                            addTicket(ticket);
                                            trackAction('ticket_added');
                                        }}
                                        onUpdateTicket={(
                                            ticketId: string,
                                            updates
                                        ) => {
                                            updateTicket(ticketId, updates);
                                            trackAction('ticket_updated');
                                        }}
                                        onDeleteTicket={(ticketId: string) => {
                                            removeTicket(ticketId);
                                            trackAction('ticket_removed');
                                        }}
                                        errors={
                                            errors as Record<string, string>
                                        }
                                    />
                                </LazyWrapper>
                            )}
                        </div>

                        {/* Pre-publish validation */}
                        <LazyWrapper
                            fallback={
                                <div className='p-4'>Loading validation...</div>
                            }
                        >
                            <LazyPrePublishValidation
                                eventData={eventData}
                                tickets={tickets}
                                errors={errors}
                                onFixError={(field) => {
                                    trackAction(`fix_error_${field}`);
                                    // Navigate to appropriate step based on field
                                    if (
                                        [
                                            'eventName',
                                            'eventDescription',
                                            'eventCategory',
                                            'images',
                                        ].includes(field)
                                    ) {
                                        goToStep(1);
                                    }
                                }}
                            />
                        </LazyWrapper>
                    </div>
                )}

                {/* Action buttons */}
                <div className='mt-8 flex justify-between'>
                    <div>
                        {currentStep > 1 && (
                            <button
                                onClick={() => {
                                    previousStep();
                                    trackAction(
                                        `navigate_to_step_${currentStep - 1}`
                                    );
                                }}
                                className='rounded-xl border border-gray-300 px-6 py-3 font-inter font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-revlr-dark-border dark:text-gray-300 dark:hover:bg-revlr-dark-bg'
                            >
                                Previous
                            </button>
                        )}
                    </div>

                    <div className='flex space-x-4'>
                        <button
                            onClick={handleSaveDraft}
                            disabled={isSaving}
                            className='rounded-xl border border-revlr-primary-blue px-6 py-3 font-inter font-medium text-revlr-primary-blue transition-colors hover:bg-revlr-primary-blue/10 disabled:opacity-50'
                        >
                            {isSaving ? 'Saving...' : 'Save Draft'}
                        </button>

                        {currentStep < 2 ? (
                            <button
                                onClick={() => {
                                    if (
                                        canProceedToStep(
                                            (currentStep + 1) as 1 | 2
                                        )
                                    ) {
                                        nextStep();
                                        trackAction(
                                            `navigate_to_step_${currentStep + 1}`
                                        );
                                    }
                                }}
                                disabled={
                                    !canProceedToStep(
                                        (currentStep + 1) as 1 | 2
                                    )
                                }
                                className='rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 font-inter font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50'
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={handlePublishClick}
                                disabled={
                                    isPublishing || !isReadyForPublishing()
                                }
                                className='rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 font-inter font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50'
                            >
                                {isPublishing
                                    ? 'Publishing...'
                                    : 'Publish Event'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateEventOptimized;
