// Media Search Types and Interfaces

export interface MediaSearchQuery {
    query: string;
    providers?: string[];
    filters?: MediaFilters;
    page?: number;
    perPage?: number;
    sortBy?: 'relevance' | 'popularity' | 'recency' | 'downloads' | 'views';
    sortOrder?: 'asc' | 'desc';
    userId?: string; // For personalization
    eventCategory?: string; // For category-based suggestions
}

export interface MediaFilters {
    orientation?: 'landscape' | 'portrait' | 'square';
    color?: string;
    category?: string;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    mediaType?: 'image' | 'video';
    aspectRatio?: 'wide' | 'standard' | 'tall' | 'square';
    resolution?: 'low' | 'medium' | 'high' | 'ultra';
    fileSize?: 'small' | 'medium' | 'large';
    license?: 'cc0' | 'commercial' | 'editorial';
    safeSearch?: boolean;
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
    details?: Record<string, unknown>;
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
    oauth?: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
        scopes?: string[];
    };
}

export interface MediaProviderAuthState {
    isAuthenticated: boolean;
    accessToken?: string;
    scopes?: string[];
    user?: {
        id: string;
        username: string;
        name: string;
        profileUrl?: string;
        avatarUrl?: string;
    };
}

// Analytics and Usage Tracking Types
export interface SearchAnalyticsEvent {
    id: string;
    userId?: string;
    sessionId: string;
    timestamp: number;
    eventType: 'search' | 'select' | 'download' | 'preview' | 'filter_applied';
    query?: string;
    filters?: MediaFilters;
    providerId?: string;
    mediaId?: string;
    resultPosition?: number;
    totalResults?: number;
    searchDuration?: number;
    eventCategory?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
}

export interface UserBehaviorPattern {
    userId: string;
    preferredProviders: string[];
    commonSearchTerms: string[];
    preferredFilters: MediaFilters;
    averageSelectionTime: number;
    preferredImageSizes: Array<{
        width: number;
        height: number;
        frequency: number;
    }>;
    categoryPreferences: Record<string, number>;
    timeOfDayPatterns: Record<string, number>;
    lastUpdated: number;
}

export interface SearchSuggestion {
    text: string;
    type: 'query' | 'category' | 'filter' | 'trending';
    score: number;
    metadata?: {
        category?: string;
        popularity?: number;
        recentUsage?: number;
        userRelevance?: number;
    };
}

export interface PersonalizationData {
    userId: string;
    searchHistory: Array<{
        query: string;
        timestamp: number;
        resultCount: number;
        selectedItems: number;
    }>;
    selectionHistory: Array<{
        mediaId: string;
        providerId: string;
        query: string;
        timestamp: number;
        eventCategory?: string;
    }>;
    preferences: {
        preferredProviders: string[];
        preferredFilters: MediaFilters;
        excludedTags: string[];
        favoriteCategories: string[];
    };
    behaviorMetrics: {
        averageSearchTime: number;
        averageSelectionCount: number;
        mostActiveTimeOfDay: number;
        preferredImageAspectRatio: string;
    };
}

export interface SearchAnalytics {
    totalSearches: number;
    uniqueUsers: number;
    averageSearchDuration: number;
    topQueries: Array<{ query: string; count: number; avgResults: number }>;
    topCategories: Array<{ category: string; count: number }>;
    providerPerformance: Array<{
        providerId: string;
        searches: number;
        selections: number;
        avgResponseTime: number;
        errorRate: number;
    }>;
    filterUsage: Record<string, number>;
    timePatterns: Record<string, number>;
    conversionRate: number; // searches that result in selections
}

export interface PreloadingStrategy {
    popularQueries: string[];
    categoryBasedQueries: Record<string, string[]>;
    userBasedQueries: Record<string, string[]>;
    trendingQueries: string[];
    seasonalQueries: Record<string, string[]>;
    timeBasedQueries: Record<string, string[]>;
}
