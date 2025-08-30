/**
 * Security utilities index
 * Exports all security-related functions and classes
 */

// Data sanitization and validation
export {
    sanitizeNotificationContent,
    sanitizeUserInput,
    sanitizeUrl,
    sanitizeNotificationMessage,
    validateNotificationMessage,
    validateUserAction,
    validateAndSanitizeFormData,
    type ValidationResult,
} from './sanitization';

// Rate limiting
export {
    ClientRateLimiter,
    signalRMethodLimiter,
    notificationActionLimiter,
    connectionLimiter,
    inputValidationLimiter,
    generateRateLimitKey,
    generateSignalRKey,
    generateNotificationKey,
    checkSignalRMethodLimit,
    recordSignalRMethod,
    checkNotificationActionLimit,
    recordNotificationAction,
    checkConnectionLimit,
    recordConnectionAttempt,
    formatRateLimitError,
    useRateLimit,
    type RateLimitConfig,
    type RateLimitResult,
    type RateLimitEntry,
} from './rate-limiting';

// Token security
export {
    validateTokenFormat,
    extractTokenClaims,
    shouldRefreshToken,
    SecureTokenStorage,
    TokenRefreshManager,
    defaultTokenStorage,
    defaultTokenRefreshManager,
    extractUserIdFromToken,
    tokenHasScope,
    getTokenExpirationTime,
    type TokenValidationResult,
    type TokenClaims,
    type SecureStorageOptions,
    type TokenRefreshConfig,
} from './token-security';

// SignalR security middleware
export {
    SignalRSecurityMiddleware,
    createSecurityMiddleware,
    createDevelopmentSecurityMiddleware,
    createProductionSecurityMiddleware,
    type SecurityMiddlewareConfig,
    type SecurityViolation,
    type SecureHubConnection,
} from './signalr-security-middleware';

// Security constants
export const SECURITY_CONSTANTS = {
    DEFAULT_RATE_LIMITS: {
        SIGNALR_METHODS: 30,
        NOTIFICATION_ACTIONS: 100,
        CONNECTIONS: 10,
        INPUT_VALIDATION: 200,
    },
    DEFAULT_TIMEOUTS: {
        RATE_LIMIT_WINDOW: 60000, // 1 minute
        TOKEN_REFRESH_THRESHOLD: 600000, // 10 minutes
        CONNECTION_RETRY_DELAY: 1000, // 1 second
    },
    ALLOWED_HTML_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'span',
        'div',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'a',
    ],
    FORBIDDEN_PATTERNS: [
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /on\w+=/i,
        /<script/i,
        /expression\(/i,
    ],
} as const;
