'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@src/lib/ThemeContext';
import { useEventCreation } from '@src/hooks/useEventCreation';
import { useOnlineStatus } from '@src/hooks/useOnlineStatus';
import {
    useKeyboardNavigation,
    useFocusAnnouncement,
} from '@src/hooks/useKeyboardNavigation';
import { ImageUpload } from '@src/components/ImageUpload';
import { TicketManagement } from '@src/components/TicketManagement';
import { PublishConfirmationModal } from '@src/components/PublishConfirmationModal';
import { PublishSuccessModal } from '@src/components/PublishSuccessModal';
import { PrePublishValidation } from '@src/components/PrePublishValidation';
import { EventStatusIndicator } from '@src/components/EventStatusIndicator';
import { LocationSelector } from '@src/components/LocationSelector';
import { CategorySelector } from '@src/components/CategorySelector';
import { OrganizerDetails } from '@src/components/OrganizerDetails';
import { DateTimeSelector } from '@src/components/DateTimeSelector';
import { ProgressIndicator } from '@src/components/ProgressIndicator';
import { HelpTooltip, FormFieldHelp } from '@src/components/HelpTooltip';
import {
    AutoSaveIndicator,
    RecoveryPrompt,
} from '@src/components/AutoSaveIndicator';
import {
    LoadingButton,
    EventFormSkeleton,
    TicketManagementSkeleton,
    LoadingOverlay,
} from '@src/components/LoadingStates';
import { MobileFormLayout } from '@src/components/MobileFormLayout';
import { AnnouncementRegion } from '@src/components/AnnouncementRegion';
import DevAutoPopulateButton from '@src/components/DevAutoPopulateButton';
import { Toaster } from '@src/components/ui/toaster';
import type {
    EventImage,
    EventCreationStep,
    EventTicket,
    EventCreationData,
} from '@src/types/event-creation';
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
        nextStep,
        previousStep,
        canProceedToStep,
        restoreFromBackup,
        clearBackup,
        validateForPublishing,
        isReadyForPublishing,
        isLoading,
    } = useEventCreation({
        autoSaveInterval: 30000, // 30 seconds
    });

    // Local UI state
    const [modalOpen, setModalOpen] = useState(false);
    const [showBackupPrompt, setShowBackupPrompt] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);

    // Accessibility and keyboard navigation
    const { announce, announceRef } = useFocusAnnouncement();
    const { containerRef } = useKeyboardNavigation({
        onNext: () => {
            const nextStepNumber = (currentStep + 1) as EventCreationStep;
            if (canProceedToStep(nextStepNumber)) {
                nextStep();
                announce(`Moved to step ${nextStepNumber}`);
            }
        },
        onPrevious: () => {
            if (currentStep > 1) {
                previousStep();
                announce(`Moved to step ${currentStep - 1}`);
            }
        },
        onSave: () => {
            handleSaveDraft();
        },
        onPublish: () => {
            if (isReadyForPublishing()) {
                handlePublishClick();
            }
        },
        enableShortcuts: true,
    });

    // Detect mobile view
    useEffect(() => {
        const checkMobile = () => {
            setIsMobileView(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    const handleEventCategoryChange = (category: string) => {
        updateEventData({ eventCategory: category });
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

    const handleDateRangeChange = (dateRange: {
        startDate: string;
        endDate: string;
    }) => {
        updateEventData({ dateRange });
    };

    const handleTimeRangeChange = (timeRange: {
        startTime: string;
        endTime: string;
    }) => {
        updateEventData({ timeRange });
    };

    const handleTimezoneChange = (timezone: string) => {
        updateEventData({ timezone });
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
        await handleSaveDraft();
    };

    const handleSaveDraft = async () => {
        try {
            const result = await saveDraft();
            if (result.success) {
                announce('Draft saved successfully');
            } else {
                announce(
                    `Failed to save draft: ${result.message}`,
                    'assertive'
                );
            }
        } catch {
            announce('Failed to save draft', 'assertive');
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

    // Auto-populate handlers for development
    const handleAutoPopulateEvent = (
        sampleEventData: Partial<EventCreationData>
    ) => {
        updateEventData(sampleEventData);
        announce('Form auto-populated with sample data');
    };

    const handleAutoPopulateTickets = async (sampleTickets: EventTicket[]) => {
        // Clear existing tickets first
        for (const ticket of tickets) {
            if (ticket.id) {
                await removeTicket(ticket.id);
            }
        }

        // Add sample tickets
        for (const ticket of sampleTickets) {
            const { ...ticketWithoutId } = ticket;
            await addTicket(ticketWithoutId);
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
                eventData.images.length > 0
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

    // Mobile form sections
    const mobileSections = [
        {
            id: 'details',
            title: 'Event Details',
            description:
                'Add basic information, images, and location details for your event',
            isCompleted: progressSteps[0].isCompleted,
            hasErrors: !!(
                errors.eventName ||
                errors.eventDescription ||
                errors.eventCategory ||
                errors.images
            ),
            children: renderEventDetailsForm(),
        },
        {
            id: 'tickets',
            title: 'Tickets',
            description: 'Configure ticket types, pricing, and availability',
            isCompleted: progressSteps[1].isCompleted,
            hasErrors: Object.keys(errors).some((key) =>
                key.includes('ticket')
            ),
            children: renderTicketsForm(),
        },
    ];

    function renderEventDetailsForm() {
        if (isLoading) {
            return <EventFormSkeleton />;
        }

        return (
            <div className='space-y-6'>
                <div
                    className={`${isMobileView ? 'space-y-6' : 'flex flex-row gap-6'}`}
                >
                    <div
                        className={`${isMobileView ? '' : 'flex flex-1 flex-col'} space-y-6`}
                    >
                        {/* Images Section */}
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
                                    Images
                                </label>
                                <FormFieldHelp
                                    title='Event Images'
                                    content='Upload high-quality images that showcase your event. The first image will be used as the main event cover. Supported formats: JPEG, PNG, WebP (max 5MB each).'
                                />
                            </div>
                            <p
                                className={`mb-4 font-inter text-sm font-normal ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                Add at least 1 image for your event
                            </p>

                            <ImageUpload
                                images={eventData.images}
                                onImagesChange={handleImagesChange}
                                maxImages={5}
                                maxFileSize={5 * 1024 * 1024}
                                enableMediaSearch={true}
                                eventCategory={eventData.eventCategory}
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
                                        <FormFieldHelp content='Choose a clear, descriptive name that captures the essence of your event. This will be the first thing potential attendees see.' />
                                    </div>
                                    <input
                                        type='text'
                                        placeholder='Enter your event name'
                                        value={eventData.eventName}
                                        onChange={handleEventNameChange}
                                        aria-describedby={
                                            errors.eventName
                                                ? 'event-name-error'
                                                : undefined
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
                                            id='event-name-error'
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
                                        value={eventData.eventDescription}
                                        onChange={handleEventDescriptionChange}
                                        aria-describedby={
                                            errors.eventDescription
                                                ? 'event-description-error'
                                                : undefined
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
                                            id='event-description-error'
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
                                        value={eventData.eventCategory}
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

                        {/* Location Section */}
                        <LocationSelector
                            locationType={eventData.locationType}
                            locationDetails={eventData.locationDetails}
                            onLocationTypeChange={handleLocationTypeChange}
                            onLocationDetailsChange={
                                handleLocationDetailsChange
                            }
                            errors={{
                                venueName:
                                    typeof errors.venueName === 'string'
                                        ? errors.venueName
                                        : undefined,
                                address:
                                    typeof errors.address === 'string'
                                        ? errors.address
                                        : undefined,
                                googleMapsLink:
                                    typeof errors.googleMapsLink === 'string'
                                        ? errors.googleMapsLink
                                        : undefined,
                                eventLink:
                                    typeof errors.eventLink === 'string'
                                        ? errors.eventLink
                                        : undefined,
                                platform:
                                    typeof errors.platform === 'string'
                                        ? errors.platform
                                        : undefined,
                            }}
                        />

                        {/* Date & Time Section */}
                        <DateTimeSelector
                            dateRange={eventData.dateRange}
                            timeRange={eventData.timeRange}
                            timezone={eventData.timezone}
                            onDateRangeChange={handleDateRangeChange}
                            onTimeRangeChange={handleTimeRangeChange}
                            onTimezoneChange={handleTimezoneChange}
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
                    </div>

                    {!isMobileView && (
                        <div className='flex flex-1 flex-col space-y-6'>
                            {/* Organizer Details Section */}
                            <OrganizerDetails
                                organizerName={eventData.organizerName}
                                organizerWebsite={eventData.organizerWebsite}
                                organizerLogo={eventData.organizerLogo}
                                socials={eventData.socials}
                                onOrganizerChange={handleOrganizerChange}
                                onSocialLinksChange={handleSocialLinksChange}
                                errors={{
                                    organizerName:
                                        typeof errors.organizerName === 'string'
                                            ? errors.organizerName
                                            : undefined,
                                    organizerWebsite:
                                        typeof errors.organizerWebsite ===
                                        'string'
                                            ? errors.organizerWebsite
                                            : undefined,
                                    organizerLogo:
                                        typeof errors.organizerLogo === 'string'
                                            ? errors.organizerLogo
                                            : undefined,
                                }}
                            />
                        </div>
                    )}

                    {isMobileView && (
                        <div className='space-y-6'>
                            {/* Organizer Details Section - Mobile */}
                            <OrganizerDetails
                                organizerName={eventData.organizerName}
                                organizerWebsite={eventData.organizerWebsite}
                                organizerLogo={eventData.organizerLogo}
                                socials={eventData.socials}
                                onOrganizerChange={handleOrganizerChange}
                                onSocialLinksChange={handleSocialLinksChange}
                                errors={{
                                    organizerName:
                                        typeof errors.organizerName === 'string'
                                            ? errors.organizerName
                                            : undefined,
                                    organizerWebsite:
                                        typeof errors.organizerWebsite ===
                                        'string'
                                            ? errors.organizerWebsite
                                            : undefined,
                                    organizerLogo:
                                        typeof errors.organizerLogo === 'string'
                                            ? errors.organizerLogo
                                            : undefined,
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    function renderTicketsForm() {
        if (isLoading) {
            return <TicketManagementSkeleton />;
        }

        return (
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
        );
    }

    // Mobile view
    if (isMobileView) {
        return (
            <div
                ref={containerRef}
                className={`min-h-screen transition-all duration-200 ${
                    theme === 'dark'
                        ? 'bg-revlr-dark-bg text-white'
                        : 'bg-revlr-primary-grey text-gray-900'
                }`}
            >
                <AnnouncementRegion ref={announceRef} />

                <MobileFormLayout
                    sections={mobileSections}
                    currentSection={currentStep === 1 ? 'details' : 'tickets'}
                    onSectionChange={(sectionId) => {
                        const step = sectionId === 'details' ? 1 : 2;
                        goToStep(step);
                        announce(`Switched to ${sectionId} section`);
                    }}
                />

                {/* Recovery Prompt */}
                <RecoveryPrompt
                    isOpen={showBackupPrompt}
                    onRestore={handleRestoreBackup}
                    onDiscard={handleDiscardBackup}
                    onClose={() => setShowBackupPrompt(false)}
                    lastSaved={lastSaved}
                />

                {/* Modals */}
                <PublishConfirmationModal
                    isOpen={showPublishModal}
                    onClose={() => setShowPublishModal(false)}
                    onConfirm={handleConfirmPublish}
                    eventData={eventData}
                    tickets={tickets}
                    isPublishing={isPublishing}
                />

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
                        image:
                            eventData.images[0]?.url ||
                            '/placeholder-event.jpg',
                    }}
                />

                <LoadingOverlay
                    isVisible={isLoading}
                    message='Loading event data...'
                />

                <Toaster />
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`min-h-screen transition-all duration-200 ${
                theme === 'dark'
                    ? 'bg-revlr-dark-bg text-white'
                    : 'bg-revlr-primary-grey text-gray-900'
            }`}
        >
            <AnnouncementRegion ref={announceRef} />

            {/* Enhanced Header with Progress Indicator */}
            <div
                className={`border-b ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                }`}
            >
                {/* Progress Indicator */}
                <div className='px-6 pt-6'>
                    <ProgressIndicator
                        steps={progressSteps}
                        onStepClick={(stepId) => {
                            if (canProceedToStep(stepId as EventCreationStep)) {
                                goToStep(stepId as EventCreationStep);
                                announce(`Navigated to step ${stepId}`);
                            }
                        }}
                    />
                </div>

                {/* Header Actions */}
                <div className='flex items-center justify-between p-6'>
                    <div className='flex items-center space-x-4'>
                        <EventStatusIndicator
                            status={eventData.status || 'draft'}
                            size='md'
                        />

                        <AutoSaveIndicator
                            isSaving={isSaving}
                            lastSaved={lastSaved}
                            hasUnsavedChanges={hasUnsavedChanges}
                            hasError={!!errors.general}
                            isOnline={isOnline}
                            onRetry={handleSaveDraft}
                        />
                    </div>

                    <div className='flex items-center space-x-3'>
                        <DevAutoPopulateButton
                            onPopulateEvent={handleAutoPopulateEvent}
                            onPopulateTickets={handleAutoPopulateTickets}
                            disabled={isSaving || isPublishing}
                        />

                        <HelpTooltip
                            title='Keyboard Shortcuts'
                            content={
                                <div className='space-y-2 text-xs'>
                                    <div>
                                        <kbd className='rounded bg-gray-100 px-1 py-0.5 text-gray-800'>
                                            Ctrl+S
                                        </kbd>{' '}
                                        Save draft
                                    </div>
                                    <div>
                                        <kbd className='rounded bg-gray-100 px-1 py-0.5 text-gray-800'>
                                            Ctrl+Shift+Enter
                                        </kbd>{' '}
                                        Publish
                                    </div>
                                    <div>
                                        <kbd className='rounded bg-gray-100 px-1 py-0.5 text-gray-800'>
                                            ←/→
                                        </kbd>{' '}
                                        Navigate steps
                                    </div>
                                </div>
                            }
                            position='bottom'
                        >
                            <button
                                className={`rounded-lg p-2 transition-colors duration-200 ${
                                    theme === 'dark'
                                        ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-gray-300'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-600'
                                }`}
                                aria-label='View keyboard shortcuts'
                            >
                                <svg
                                    className='size-4'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                    />
                                </svg>
                            </button>
                        </HelpTooltip>

                        <LoadingButton
                            isLoading={isSaving}
                            loadingText='Saving...'
                            onClick={() => setModalOpen(true)}
                            disabled={isSaving || isPublishing}
                            className={`rounded-xl px-6 py-3 font-inter font-medium transition-all duration-200 ${
                                theme === 'dark'
                                    ? 'border border-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/20'
                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            Preview
                        </LoadingButton>

                        <LoadingButton
                            isLoading={isPublishing}
                            loadingText='Publishing...'
                            onClick={handlePublishClick}
                            disabled={isSaving || isPublishing}
                            className='rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-8 py-3 font-inter font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 disabled:cursor-not-allowed disabled:opacity-50'
                        >
                            {eventData.status === 'published'
                                ? 'Update Event'
                                : 'Publish Event'}
                        </LoadingButton>
                    </div>
                </div>
            </div>

            {/* General error display */}
            {errors.general && (
                <div
                    className='mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-4'
                    role='alert'
                >
                    <div className='flex items-center space-x-2'>
                        <svg
                            className='size-5 text-red-500'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                        >
                            <path
                                fillRule='evenodd'
                                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                                clipRule='evenodd'
                            />
                        </svg>
                        <p className='font-inter text-sm text-red-700'>
                            {typeof errors.general === 'string'
                                ? errors.general
                                : 'Validation error'}
                        </p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {currentStep === 1 ? (
                    <div className='space-y-6 p-6'>
                        {renderEventDetailsForm()}
                    </div>
                ) : (
                    <div className='space-y-6 p-6'>{renderTicketsForm()}</div>
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

            {/* Recovery Prompt */}
            <RecoveryPrompt
                isOpen={showBackupPrompt}
                onRestore={handleRestoreBackup}
                onDiscard={handleDiscardBackup}
                onClose={() => setShowBackupPrompt(false)}
                lastSaved={lastSaved}
            />

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

            <LoadingOverlay
                isVisible={isLoading}
                message='Loading event data...'
            />

            <Toaster />
        </div>
    );
};

export default CreateEvent;
