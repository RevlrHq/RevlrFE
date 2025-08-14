// Media Search Infrastructure Exports

// Core classes
export { MediaProvider } from './MediaProvider';
export { MediaSearchService } from './MediaSearchService';
export { MediaSearchCache } from './MediaSearchCache';

// Types and interfaces
export type {
    MediaSearchQuery,
    MediaFilters,
    MediaItem,
    AttributionInfo,
    LicenseInfo,
    MediaSearchResult,
    ProviderResult,
    RateLimit,
    MediaProviderError,
    MediaProviderErrorType,
    ProviderStatus,
    CachedResult,
    MediaProviderConfig,
} from '@/types/media-search';

// Configuration (import directly from config file when needed)
// export * from '@/lib/config/media-providers';

// Error recovery types
export type { ErrorRecoveryAction } from './MediaSearchService';
