// Media Search Types and Interfaces

export interface MediaSearchQuery {
    query: string;
    providers?: string[];
    filters?: MediaFilters;
    page?: number;
    perPage?: number;
}

export interface MediaFilters {
    orientation?: 'landscape' | 'portrait' | 'square';
    color?: string;
    category?: string;
    minWidth?: number;
    minHeight?: number;
    mediaType?: 'image' | 'video';
}

export interface MediaItem {
    id: string;
    providerId: string;
    title: string;
    description?: string;
    thumbnailUrl: string;
    previewUrl: string;
    downloadUrl: string;
    width: number;
    height: number;
    fileSize?: number;
    mediaType: 'image' | 'video';
    attribution: AttributionInfo;
    license: LicenseInfo;
    tags: string[];
    color?: string;
    photographer?: {
        name: string;
        profileUrl?: string;
        avatarUrl?: string;
    };
}

export interface AttributionInfo {
    required: boolean;
    text?: string;
    linkUrl?: string;
    placement: 'event-description' | 'image-caption' | 'footer' | 'none';
}

export interface LicenseInfo {
    type: 'cc0' | 'unsplash' | 'pexels' | 'pixabay-standard';
    name: string;
    url: string;
    commercialUse: boolean;
    attribution: AttributionInfo;
    restrictions?: string[];
}

export interface MediaSearchResult {
    items: MediaItem[];
    totalResults: number;
    hasMore: boolean;
    nextPage?: number;
    providers: ProviderResult[];
}

export interface ProviderResult {
    providerId: string;
    items: MediaItem[];
    totalResults: number;
    hasMore: boolean;
    nextPage?: number;
    error?: MediaProviderError;
}

export interface RateLimit {
    requests: number;
    window: number; // in seconds
    remaining?: number;
    resetTime?: number;
}

export enum MediaProviderErrorType {
    RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
    API_KEY_INVALID = 'api_key_invalid',
    NETWORK_ERROR = 'network_error',
    PROVIDER_UNAVAILABLE = 'provider_unavailable',
    SEARCH_FAILED = 'search_failed',
    DOWNLOAD_FAILED = 'download_failed',
}

export interface MediaProviderError {
    type: MediaProviderErrorType;
    providerId: string;
    message: string;
    retryAfter?: number;
    details?: any;
}

export interface ProviderStatus {
    id: string;
    name: string;
    isAvailable: boolean;
    rateLimit: RateLimit;
    lastError?: MediaProviderError;
    healthScore: number; // 0-100
}

export interface CachedResult {
    result: MediaSearchResult;
    timestamp: number;
    accessCount: number;
    query: string;
}

export interface MediaProviderConfig {
    apiKey: string;
    secretKey?: string;
    baseUrl: string;
    rateLimit: RateLimit;
    enabled: boolean;
}
