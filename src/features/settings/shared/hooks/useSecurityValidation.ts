/**
 * Security validation hook for forms and user inputs
 * Provides comprehensive validation with security measures
 */

import { useCallback, useMemo } from 'react';
import {
    sanitizeInput,
    securityValidation,
    RateLimiter,
} from '../utils/security';
import {
    validateSecureInput,
    validatePassword,
    validateEmail,
    validateFileUpload,
} from '../utils/validation';
import { auditService } from '../../services/AuditService';

export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
    sanitizedData: Record<string, any>;
}

export interface SecurityValidationOptions {
    enableRateLimit?: boolean;
    rateLimitKey?: string;
    maxAttempts?: number;
    windowMs?: number;
    logValidationAttempts?: boolean;
}

export const useSecurityValidation = (
    options: SecurityValidationOptions = {}
) => {
    const {
        enableRateLimit = false,
        rateLimitKey = 'form_validation',
        maxAttempts = 10,
        windowMs = 60 * 1000, // 1 minute
        logValidationAttempts = false,
    } = options;

    /**
     * Validate form data with security checks
     */
    const validateForm = useCallback(
        async (
            data: Record<string, any>,
            rules: Record<string, (value: any) => string | null>
        ): Promise<ValidationResult> => {
            // Check rate limiting if enabled
            if (
                enableRateLimit &&
                RateLimiter.isRateLimited(rateLimitKey, maxAttempts, windowMs)
            ) {
                const resetTime = RateLimiter.getResetTime(rateLimitKey);
                return {
                    isValid: false,
                    errors: {
                        _form: `Too many validation attempts. Try again in ${Math.ceil(resetTime / 1000)} seconds.`,
                    },
                    sanitizedData: {},
                };
            }

            const errors: Record<string, string> = {};
            const sanitizedData: Record<string, any> = {};

            // Record rate limit attempt if enabled
            if (enableRateLimit) {
                RateLimiter.recordAttempt(rateLimitKey, windowMs);
            }

            // Validate each field
            for (const [field, value] of Object.entries(data)) {
                try {
                    // Skip validation for undefined/null values unless required
                    if (value === undefined || value === null) {
                        continue;
                    }

                    // Sanitize input based on field type
                    let sanitizedValue = value;
                    if (typeof value === 'string') {
                        // Apply appropriate sanitization
                        if (field.toLowerCase().includes('email')) {
                            sanitizedValue = sanitizeInput.email(value);
                        } else if (field.toLowerCase().includes('phone')) {
                            sanitizedValue = sanitizeInput.phone(value);
                        } else if (
                            field.toLowerCase().includes('url') ||
                            field.toLowerCase().includes('website')
                        ) {
                            sanitizedValue = sanitizeInput.url(value);
                        } else {
                            sanitizedValue = sanitizeInput.text(value);
                        }

                        // Security validation for all text inputs
                        if (!securityValidation.isSafeInput(sanitizedValue)) {
                            errors[field] =
                                'Input contains potentially malicious content';
                            continue;
                        }

                        // Additional validation for secure inputs
                        const securityError =
                            validateSecureInput(sanitizedValue);
                        if (securityError) {
                            errors[field] = securityError;
                            continue;
                        }
                    }

                    // Apply field-specific validation rules
                    if (rules[field]) {
                        const validationError = rules[field](sanitizedValue);
                        if (validationError) {
                            errors[field] = validationError;
                            continue;
                        }
                    }

                    sanitizedData[field] = sanitizedValue;
                } catch (error) {
                    errors[field] = 'Validation error occurred';
                    console.error(
                        `Validation error for field ${field}:`,
                        error
                    );
                }
            }

            const isValid = Object.keys(errors).length === 0;

            // Log validation attempts if enabled
            if (logValidationAttempts) {
                await auditService.logEvent(
                    'FORM_VALIDATION',
                    'form_data',
                    {
                        fields: Object.keys(data),
                        isValid,
                        errorCount: Object.keys(errors).length,
                    },
                    isValid
                );
            }

            return {
                isValid,
                errors,
                sanitizedData,
            };
        },
        [
            enableRateLimit,
            rateLimitKey,
            maxAttempts,
            windowMs,
            logValidationAttempts,
        ]
    );

    /**
     * Validate specific field types with enhanced security
     */
    const validators = useMemo(
        () => ({
            email: (value: string) => {
                const sanitized = sanitizeInput.email(value);
                if (!securityValidation.isSafeInput(sanitized)) {
                    return 'Email contains potentially malicious content';
                }
                if (securityValidation.isSuspiciousEmail(sanitized)) {
                    return 'Email from suspicious domain not allowed';
                }
                return validateEmail(sanitized);
            },

            password: (value: string) => {
                if (!securityValidation.isStrongPassword(value)) {
                    return 'Password does not meet security requirements';
                }
                return validatePassword(value);
            },

            secureText: (value: string, maxLength: number = 255) => {
                const sanitized = sanitizeInput.text(value);
                if (!securityValidation.isSafeInput(sanitized)) {
                    return 'Input contains potentially malicious content';
                }
                return validateSecureInput(sanitized, maxLength);
            },

            file: (file: File) => {
                return validateFileUpload(file);
            },

            url: (value: string) => {
                const sanitized = sanitizeInput.url(value);
                if (!sanitized) {
                    return 'Invalid URL format';
                }
                return null;
            },
        }),
        []
    );

    /**
     * Validate file uploads with security checks
     */
    const validateFile = useCallback(
        async (
            file: File,
            additionalChecks?: (file: File) => Promise<string | null>
        ): Promise<string | null> => {
            // Basic security validation
            const basicError = validateFileUpload(file);
            if (basicError) return basicError;

            // Additional custom checks
            if (additionalChecks) {
                const customError = await additionalChecks(file);
                if (customError) return customError;
            }

            // Log file upload validation
            if (logValidationAttempts) {
                await auditService.logEvent(
                    'FILE_VALIDATION',
                    'file_upload',
                    {
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type,
                    },
                    true
                );
            }

            return null;
        },
        [logValidationAttempts]
    );

    /**
     * Check if user is currently rate limited
     */
    const isRateLimited = useCallback(() => {
        if (!enableRateLimit) return false;
        return RateLimiter.isRateLimited(rateLimitKey, maxAttempts, windowMs);
    }, [enableRateLimit, rateLimitKey, maxAttempts, windowMs]);

    /**
     * Get remaining attempts before rate limit
     */
    const getRemainingAttempts = useCallback(() => {
        if (!enableRateLimit) return maxAttempts;
        return RateLimiter.getRemainingAttempts(rateLimitKey, maxAttempts);
    }, [enableRateLimit, rateLimitKey, maxAttempts]);

    /**
     * Get time until rate limit resets
     */
    const getResetTime = useCallback(() => {
        if (!enableRateLimit) return 0;
        return RateLimiter.getResetTime(rateLimitKey);
    }, [enableRateLimit, rateLimitKey]);

    return {
        validateForm,
        validators,
        validateFile,
        isRateLimited,
        getRemainingAttempts,
        getResetTime,
    };
};
