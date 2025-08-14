// Event Creation Types
export interface EventCreationData {
    // Basic Information
    eventName: string;
    eventDescription: string;
    eventCategory: string;

    // Date and Time
    dateRange?: {
        startDate: string;
        endDate: string;
    };
    timeRange?: {
        startTime: string;
        endTime: string;
    };
    timezone?: string;

    // Location
    locationType: 'in-person' | 'virtual' | 'hybrid';
    locationDetails?: {
        venueName?: string;
        address?: string;
        googleMapsLink?: string;
        eventLink?: string;
        platform?: string;
    };

    // Images and Media
    images: EventImage[];

    // Organizer Information
    organizerName?: string;
    organizerWebsite?: string;
    organizerLogo?: string;

    // Social Links
    socials?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        website?: string;
        linkedin?: string;
    };

    // Metadata
    isDraft?: boolean;
    status?: 'draft' | 'published';
    id?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface EventTicket {
    id?: string;
    type: 'free' | 'paid';
    name: string;
    description?: string;
    price?: number;
    quantity: number;
    purchaseLimit: number;
    salesPeriod?: {
        startDate: string;
        endDate: string;
        startTime?: string;
        endTime?: string;
    };
    refundPolicy?: string;
    feeOption?: 'organizer' | 'attendees';
    selected?: boolean;
    isActive?: boolean;
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationErrors {
    [key: string]: string | ValidationError[];
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationErrors;
}

export interface EventCreationError {
    type: 'validation' | 'network' | 'authentication' | 'server' | 'upload';
    message: string;
    field?: string;
    details?: unknown;
}

export interface DraftBackup {
    eventData: EventCreationData;
    tickets: EventTicket[];
    timestamp: number;
    step: number;
}

export interface EventCreationState {
    eventData: EventCreationData;
    tickets: EventTicket[];
    currentStep: number;
    isLoading: boolean;
    isSaving: boolean;
    isPublishing: boolean;
    errors: ValidationErrors;
    lastSaved?: Date;
    hasUnsavedChanges: boolean;
}

// API Response Types
export interface EventCreationResponse {
    success: boolean;
    data?: EventCreationData & { tickets?: EventTicket[] };
    message?: string;
    errors?: ValidationErrors;
}

// Image Types
export interface EventImage {
    id: string;
    url: string;
    cdnUrl?: string;
    name: string;
    size: number;
    mimeType: string;
    isUploading?: boolean;
    uploadProgress?: number;
    error?: string;
    order: number;

    // Extended properties for external media
    source?: 'upload' | 'external';
    providerId?: string;
    originalId?: string;
    attribution?: {
        required: boolean;
        text?: string;
        linkUrl?: string;
        placement: 'event-description' | 'image-caption' | 'footer' | 'none';
    };
    license?: {
        type: 'cc0' | 'unsplash' | 'pexels' | 'pixabay-standard';
        name: string;
        url: string;
        commercialUse: boolean;
        restrictions?: string[];
    };
    photographer?: {
        name: string;
        profileUrl?: string;
        avatarUrl?: string;
    };
    downloadedAt?: string;
    originalUrl?: string;
}

export interface ImageUploadOptions {
    maxFiles: number;
    maxFileSize: number; // in bytes
    acceptedTypes: string[];
    compressionQuality: number;
    maxWidth: number;
    maxHeight: number;
}

export interface ImageValidationResult {
    isValid: boolean;
    errors: string[];
}

// Form Step Types
export type EventCreationStep = 1 | 2 | 3 | 4;

export interface StepValidation {
    step: EventCreationStep;
    isValid: boolean;
    errors: ValidationErrors;
    requiredFields: string[];
}
