/**
 * Data sanitization utilities for SignalR notifications and user input
 * Provides HTML sanitization, input validation, and XSS prevention
 */

import DOMPurify from 'dompurify';
import type { NotificationMessage } from '@/types/notifications';

// ============================================================================
// HTML Sanitization Configuration
// ============================================================================

/**
 * DOMPurify configuration for notification content
 */
const NOTIFICATION_SANITIZE_CONFIG: DOMPurify.Config = {
    ALLOWED_TAGS: [
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
    ALLOWED_ATTR: ['href', 'title', 'class', 'id', 'target', 'rel'],
    ALLOWED_URI_REGEXP:
        /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea'],
    FORBID_ATTR: [
        'onerror',
        'onload',
        'onclick',
        'onmouseover',
        'onfocus',
        'onblur',
    ],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    SANITIZE_DOM: true,
    WHOLE_DOCUMENT: false,
    FORCE_BODY: false,
};

/**
 * Strict DOMPurify configuration for user input
 */
const STRICT_SANITIZE_CONFIG: DOMPurify.Config = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: [],
    FORBID_TAGS: [
        'script',
        'object',
        'embed',
        'form',
        'input',
        'textarea',
        'iframe',
    ],
    FORBID_ATTR: [
        'onerror',
        'onload',
        'onclick',
        'onmouseover',
        'onfocus',
        'onblur',
    ],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    SANITIZE_DOM: true,
    WHOLE_DOCUMENT: false,
};

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Sanitizes HTML content for notification display
 * Uses moderate sanitization allowing basic formatting
 */
export function sanitizeNotificationContent(content: string): string {
    if (!content || typeof content !== 'string') {
        return '';
    }

    try {
        return DOMPurify.sanitize(content, NOTIFICATION_SANITIZE_CONFIG);
    } catch (error) {
        console.debug('Error sanitizing notification content:', error);
        // Fallback: strip all HTML tags
        return content.replace(/<[^>]*>/g, '');
    }
}

/**
 * Sanitizes user input with strict rules
 * Removes most HTML tags and attributes
 */
export function sanitizeUserInput(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    try {
        return DOMPurify.sanitize(input, STRICT_SANITIZE_CONFIG);
    } catch (error) {
        console.debug('Error sanitizing user input:', error);
        // Fallback: strip all HTML tags
        return input.replace(/<[^>]*>/g, '');
    }
}

/**
 * Sanitizes URLs to prevent XSS attacks
 */
export function sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
        return '';
    }

    try {
        // Use DOMPurify's URL sanitization
        const sanitized = DOMPurify.sanitize(url, {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
            ALLOWED_URI_REGEXP:
                /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
        });

        // Additional validation for common XSS patterns
        const dangerousPatterns = [
            /javascript:/i,
            /data:/i,
            /vbscript:/i,
            /on\w+=/i,
            /<script/i,
            /expression\(/i,
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(sanitized)) {
                console.warn('Potentially dangerous URL blocked:', url);
                return '';
            }
        }

        return sanitized;
    } catch (error) {
        console.debug('Error sanitizing URL:', error);
        return '';
    }
}

/**
 * Sanitizes notification message content
 */
export function sanitizeNotificationMessage(
    message: NotificationMessage
): NotificationMessage {
    return {
        ...message,
        title: sanitizeNotificationContent(message.title),
        message: sanitizeNotificationContent(message.message),
        actionUrl: message.actionUrl
            ? sanitizeUrl(message.actionUrl)
            : undefined,
        // Sanitize metadata if it contains string values
        metadata: message.metadata
            ? sanitizeMetadata(message.metadata)
            : undefined,
    };
}

/**
 * Sanitizes metadata object recursively
 */
function sanitizeMetadata(
    metadata: Record<string, unknown>
): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeUserInput(value);
        } else if (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value)
        ) {
            sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map((item) =>
                typeof item === 'string' ? sanitizeUserInput(item) : item
            );
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

// ============================================================================
// Input Validation Functions
// ============================================================================

/**
 * Validates required fields in notification data
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Validates notification message structure and required fields
 */
export function validateNotificationMessage(
    message: unknown
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!message) {
        errors.push('Notification message is required');
        return { isValid: false, errors, warnings };
    }

    if (!message.id || typeof message.id !== 'string') {
        errors.push('Notification ID is required and must be a string');
    }

    if (!message.type || typeof message.type !== 'string') {
        errors.push('Notification type is required and must be a string');
    }

    if (!message.title || typeof message.title !== 'string') {
        errors.push('Notification title is required and must be a string');
    }

    if (!message.message || typeof message.message !== 'string') {
        errors.push('Notification message is required and must be a string');
    }

    if (!message.timestamp || typeof message.timestamp !== 'string') {
        errors.push('Notification timestamp is required and must be a string');
    }

    if (!message.priority || typeof message.priority !== 'string') {
        errors.push('Notification priority is required and must be a string');
    }

    // Validate optional fields
    if (message.actionUrl && typeof message.actionUrl !== 'string') {
        errors.push('Action URL must be a string if provided');
    }

    if (message.metadata && typeof message.metadata !== 'object') {
        errors.push('Metadata must be an object if provided');
    }

    // Check for potentially dangerous content
    if (message.title && containsPotentialXSS(message.title)) {
        warnings.push('Title contains potentially dangerous content');
    }

    if (message.message && containsPotentialXSS(message.message)) {
        warnings.push('Message contains potentially dangerous content');
    }

    if (message.actionUrl && containsPotentialXSS(message.actionUrl)) {
        warnings.push('Action URL contains potentially dangerous content');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Checks if content contains potential XSS patterns
 */
function containsPotentialXSS(content: string): boolean {
    const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+=/i,
        /expression\(/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /data:text\/html/i,
        /vbscript:/i,
    ];

    return xssPatterns.some((pattern) => pattern.test(content));
}

/**
 * Validates user action input
 */
export function validateUserAction(
    action: string,
    data?: unknown
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!action || typeof action !== 'string') {
        errors.push('Action is required and must be a string');
        return { isValid: false, errors, warnings };
    }

    // Validate action name format
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(action)) {
        errors.push(
            'Action name must start with a letter and contain only letters, numbers, underscores, and hyphens'
        );
    }

    // Validate data if provided
    if (data !== undefined) {
        if (typeof data === 'string' && containsPotentialXSS(data)) {
            warnings.push('Action data contains potentially dangerous content');
        }

        if (typeof data === 'object' && data !== null) {
            const stringValues = JSON.stringify(data);
            if (containsPotentialXSS(stringValues)) {
                warnings.push(
                    'Action data object contains potentially dangerous content'
                );
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validates and sanitizes form input data
 */
export function validateAndSanitizeFormData(
    formData: Record<string, unknown>
): {
    sanitized: Record<string, unknown>;
    validation: ValidationResult;
} {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(formData)) {
        // Validate key format
        if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(key)) {
            errors.push(`Invalid field name: ${key}`);
            continue;
        }

        // Sanitize and validate value
        if (typeof value === 'string') {
            const sanitizedValue = sanitizeUserInput(value);
            sanitized[key] = sanitizedValue;

            if (containsPotentialXSS(value)) {
                warnings.push(
                    `Field ${key} contains potentially dangerous content`
                );
            }
        } else if (typeof value === 'number' || typeof value === 'boolean') {
            sanitized[key] = value;
        } else if (value === null || value === undefined) {
            sanitized[key] = value;
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map((item) =>
                typeof item === 'string' ? sanitizeUserInput(item) : item
            );
        } else if (typeof value === 'object') {
            const nestedResult = validateAndSanitizeFormData(
                value as Record<string, unknown>
            );
            sanitized[key] = nestedResult.sanitized;
            errors.push(
                ...nestedResult.validation.errors.map((err) => `${key}.${err}`)
            );
            warnings.push(
                ...nestedResult.validation.warnings.map(
                    (warn) => `${key}.${warn}`
                )
            );
        } else {
            errors.push(
                `Unsupported data type for field ${key}: ${typeof value}`
            );
        }
    }

    return {
        sanitized,
        validation: {
            isValid: errors.length === 0,
            errors,
            warnings,
        },
    };
}
