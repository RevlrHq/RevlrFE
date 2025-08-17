// Media Search Infrastructure Exports

// Core classes
export { MediaProvider } from './MediaProvider';
export { MediaSearchService } from './MediaSearchService';

export { MediaSearchCache } from './MediaSearchCache';
export { MediaProviderFactory } from './MediaProviderFactory';
export { MediaProviderInitializer } from './MediaProviderInitializer';
export { ProviderHealthMonitor } from './ProviderHealthMonitor';
export { MediaImageProcessor } from './MediaImageProcessor';
export { AttributionService } from './AttributionService';
export { LicenseValidator } from './LicenseValidator';
export { LicenseChangeNotificationService } from './LicenseChangeNotificationService';

// Error Handling Services
export { ErrorHandlingService } from './ErrorHandlingService';
export { ErrorLoggingService } from './ErrorLoggingService';
export { ErrorNotificationService } from './ErrorNotificationService';
export { ErrorCategorizationService } from './ErrorCategorizationService';
export { ProviderHealthStatusService } from './ProviderHealthStatusService';

// Advanced search features
export { AdvancedSearchService } from './AdvancedSearchService';
export { SearchAnalyticsService } from './SearchAnalyticsService';
export { SmartSuggestionsService } from './SmartSuggestionsService';
export { PersonalizationService } from './PersonalizationService';
export { PreloadingService } from './PreloadingService';

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

// Processing types
export type {
    ProcessingOptions,
    ProcessingProgress,
    ProcessingError,
    ProcessingResult,
    CancellationToken,
} from './MediaImageProcessor';

// Attribution types
export type {
    AttributionRequirement,
    AttributionValidationResult,
    LicenseValidationResult,
} from './AttributionService';

export type {
    ComplianceCheckResult,
    ComplianceViolation,
    ComplianceWarning,
    LicenseChangeImpact,
} from './LicenseValidator';

export type {
    LicenseChangeNotification,
    NotificationRecipient,
    LicenseChangeEvent,
} from './LicenseChangeNotificationService';

// Configuration (import directly from config file when needed)
// export * from '@/lib/config/media-providers';

// Error recovery types
export type { ErrorRecoveryAction } from './MediaSearchService';

// Provider initialization types
export type {
    InitializationStatus,
    ProviderInitializationError,
    InitializationResult,
    MediaSearchEnvironmentConfig,
} from './MediaProviderInitializer';
