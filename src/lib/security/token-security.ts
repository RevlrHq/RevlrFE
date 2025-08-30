/**
 * Secure token management utilities for SignalR authentication
 * Provides token validation, secure storage, and refresh management
 */

// ============================================================================
// Token Validation
// ============================================================================

export interface TokenValidationResult {
    isValid: boolean;
    isExpired: boolean;
    expiresAt?: Date;
    errors: string[];
    warnings: string[];
}

export interface TokenClaims {
    sub?: string;
    iat?: number;
    exp?: number;
    aud?: string;
    iss?: string;
    [key: string]: unknown;
}

/**
 * Validates JWT token format and structure
 */
export function validateTokenFormat(token: string): TokenValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!token || typeof token !== 'string') {
        errors.push('Token is required and must be a string');
        return { isValid: false, isExpired: false, errors, warnings };
    }

    // Check JWT format (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
        errors.push('Invalid JWT format: token must have 3 parts');
        return { isValid: false, isExpired: false, errors, warnings };
    }

    try {
        // Validate header
        const header = JSON.parse(atob(parts[0]));
        if (!header.alg || !header.typ) {
            errors.push('Invalid JWT header: missing algorithm or type');
        }

        // Validate payload
        const payload = JSON.parse(atob(parts[1]));
        const claims: TokenClaims = payload;

        // Check required claims
        if (!claims.sub) {
            warnings.push('Token missing subject (sub) claim');
        }

        if (!claims.iat) {
            warnings.push('Token missing issued at (iat) claim');
        }

        if (!claims.exp) {
            errors.push('Token missing expiration (exp) claim');
        }

        // Check expiration
        let isExpired = false;
        let expiresAt: Date | undefined;

        if (claims.exp) {
            expiresAt = new Date(claims.exp * 1000);
            isExpired = Date.now() >= claims.exp * 1000;

            if (isExpired) {
                errors.push('Token has expired');
            }

            // Warn if token expires soon (within 5 minutes)
            const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
            if (claims.exp * 1000 < fiveMinutesFromNow && !isExpired) {
                warnings.push('Token expires within 5 minutes');
            }
        }

        // Validate signature format (basic check)
        if (!parts[2] || parts[2].length < 10) {
            errors.push('Invalid or missing token signature');
        }

        return {
            isValid: errors.length === 0,
            isExpired,
            expiresAt,
            errors,
            warnings,
        };
    } catch (error) {
        errors.push(
            `Failed to parse token: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return { isValid: false, isExpired: false, errors, warnings };
    }
}

/**
 * Extracts claims from a JWT token
 */
export function extractTokenClaims(token: string): TokenClaims | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const payload = JSON.parse(atob(parts[1]));
        return payload as TokenClaims;
    } catch (error) {
        console.debug('Failed to extract token claims:', error);
        return null;
    }
}

/**
 * Checks if token needs refresh (expires within threshold)
 */
export function shouldRefreshToken(
    token: string,
    thresholdMinutes: number = 10
): boolean {
    const claims = extractTokenClaims(token);
    if (!claims?.exp) {
        return true; // Refresh if we can't determine expiration
    }

    const expirationTime = claims.exp * 1000;
    const thresholdTime = Date.now() + thresholdMinutes * 60 * 1000;

    return expirationTime <= thresholdTime;
}

// ============================================================================
// Secure Token Storage
// ============================================================================

export interface SecureStorageOptions {
    keyPrefix?: string;
    encryptionKey?: string;
    useSessionStorage?: boolean;
}

/**
 * Secure token storage manager
 */
export class SecureTokenStorage {
    private keyPrefix: string;
    private storage: Storage;

    constructor(options: SecureStorageOptions = {}) {
        this.keyPrefix = options.keyPrefix || 'signalr_';
        this.storage = options.useSessionStorage
            ? sessionStorage
            : localStorage;
    }

    /**
     * Store token securely
     */
    setToken(key: string, token: string): void {
        try {
            const fullKey = this.keyPrefix + key;

            // Basic obfuscation (not encryption, but better than plain text)
            const obfuscated = this.obfuscateToken(token);

            this.storage.setItem(fullKey, obfuscated);
        } catch (error) {
            console.debug('Failed to store token:', error);
            throw new Error('Failed to store authentication token');
        }
    }

    /**
     * Retrieve token securely
     */
    getToken(key: string): string | null {
        try {
            const fullKey = this.keyPrefix + key;
            const obfuscated = this.storage.getItem(fullKey);

            if (!obfuscated) {
                return null;
            }

            return this.deobfuscateToken(obfuscated);
        } catch {
            return null;
        }
    }

    /**
     * Remove token
     */
    removeToken(key: string): void {
        try {
            const fullKey = this.keyPrefix + key;
            this.storage.removeItem(fullKey);
        } catch (error) {
            console.debug('Failed to remove token:', error);
        }
    }

    /**
     * Clear all tokens
     */
    clearAllTokens(): void {
        try {
            const keys = Object.keys(this.storage);
            keys.forEach((key) => {
                if (key.startsWith(this.keyPrefix)) {
                    this.storage.removeItem(key);
                }
            });
        } catch (error) {
            console.debug('Failed to clear tokens:', error);
        }
    }

    /**
     * Check if token exists
     */
    hasToken(key: string): boolean {
        const fullKey = this.keyPrefix + key;
        return this.storage.getItem(fullKey) !== null;
    }

    /**
     * Basic token obfuscation (not cryptographically secure)
     */
    private obfuscateToken(token: string): string {
        // Simple base64 encoding with character shifting
        const encoded = btoa(token);
        return encoded
            .split('')
            .map((char) => String.fromCharCode(char.charCodeAt(0) + 1))
            .join('');
    }

    /**
     * Reverse token obfuscation
     */
    private deobfuscateToken(obfuscated: string): string {
        try {
            const shifted = obfuscated
                .split('')
                .map((char) => String.fromCharCode(char.charCodeAt(0) - 1))
                .join('');
            return atob(shifted);
        } catch {
            throw new Error('Failed to deobfuscate token');
        }
    }
}

// ============================================================================
// Token Refresh Management
// ============================================================================

export interface TokenRefreshConfig {
    refreshThresholdMinutes: number;
    maxRetryAttempts: number;
    retryDelayMs: number;
    onTokenRefreshed?: (newToken: string) => void;
    onRefreshFailed?: (error: Error) => void;
}

/**
 * Token refresh manager
 */
export class TokenRefreshManager {
    private config: TokenRefreshConfig;
    private refreshPromise: Promise<string> | null = null;
    private retryCount = 0;

    constructor(config: TokenRefreshConfig) {
        this.config = config;
    }

    /**
     * Check if token needs refresh and handle it
     */
    async ensureValidToken(
        currentToken: string,
        refreshFunction: () => Promise<string>
    ): Promise<string> {
        // Validate current token
        const validation = validateTokenFormat(currentToken);

        if (!validation.isValid || validation.isExpired) {
            return this.refreshToken(refreshFunction);
        }

        // Check if token needs refresh soon
        if (
            shouldRefreshToken(
                currentToken,
                this.config.refreshThresholdMinutes
            )
        ) {
            // Start refresh in background but return current token
            this.refreshTokenInBackground(refreshFunction);
        }

        return currentToken;
    }

    /**
     * Force token refresh
     */
    async refreshToken(
        refreshFunction: () => Promise<string>
    ): Promise<string> {
        // Return existing refresh promise if one is in progress
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = this.performRefresh(refreshFunction);

        try {
            const newToken = await this.refreshPromise;
            this.retryCount = 0;
            this.config.onTokenRefreshed?.(newToken);
            return newToken;
        } catch (error) {
            this.config.onRefreshFailed?.(error as Error);
            throw error;
        } finally {
            this.refreshPromise = null;
        }
    }

    /**
     * Refresh token in background
     */
    private refreshTokenInBackground(
        refreshFunction: () => Promise<string>
    ): void {
        this.refreshToken(refreshFunction).catch((error) => {
            console.warn('Background token refresh failed:', error);
        });
    }

    /**
     * Perform token refresh with retry logic
     */
    private async performRefresh(
        refreshFunction: () => Promise<string>
    ): Promise<string> {
        let lastError: Error = new Error('Unknown error');

        for (
            let attempt = 0;
            attempt <= this.config.maxRetryAttempts;
            attempt++
        ) {
            try {
                if (attempt > 0) {
                    // Wait before retry
                    await new Promise((resolve) =>
                        setTimeout(
                            resolve,
                            this.config.retryDelayMs * Math.pow(2, attempt - 1)
                        )
                    );
                }

                const newToken = await refreshFunction();

                // Validate the new token
                const validation = validateTokenFormat(newToken);
                if (!validation.isValid) {
                    throw new Error(
                        `Invalid token received: ${validation.errors.join(', ')}`
                    );
                }

                return newToken;
            } catch (error) {
                lastError = error as Error;
                console.warn(
                    `Token refresh attempt ${attempt + 1} failed:`,
                    error
                );
            }
        }

        throw new Error(
            `Token refresh failed after ${this.config.maxRetryAttempts + 1} attempts: ${lastError.message}`
        );
    }

    /**
     * Cancel any ongoing refresh
     */
    cancelRefresh(): void {
        this.refreshPromise = null;
        this.retryCount = 0;
    }
}

// ============================================================================
// Default Instances
// ============================================================================

/**
 * Default secure token storage instance
 */
export const defaultTokenStorage = new SecureTokenStorage({
    keyPrefix: 'signalr_auth_',
    useSessionStorage: false,
});

/**
 * Default token refresh manager
 */
export const defaultTokenRefreshManager = new TokenRefreshManager({
    refreshThresholdMinutes: 10,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safely extract user ID from token
 */
export function extractUserIdFromToken(token: string): string | null {
    const claims = extractTokenClaims(token);
    return claims?.sub || claims?.userId || claims?.id || null;
}

/**
 * Check if token has required scopes/permissions
 */
export function tokenHasScope(token: string, requiredScope: string): boolean {
    const claims = extractTokenClaims(token);
    if (!claims) return false;

    const scopes = claims.scope || claims.scopes || claims.permissions || [];
    const scopeArray = Array.isArray(scopes) ? scopes : typeof scopes === 'string' ? scopes.split(' ') : [];

    return scopeArray.includes(requiredScope);
}

/**
 * Get token expiration time in milliseconds
 */
export function getTokenExpirationTime(token: string): number | null {
    const claims = extractTokenClaims(token);
    return claims?.exp ? claims.exp * 1000 : null;
}
