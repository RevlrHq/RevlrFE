/**
 * Unit tests for data sanitization and validation utilities
 * Tests HTML sanitization, input validation, and XSS prevention
 */

import {
    sanitizeNotificationContent,
    sanitizeUserInput,
    sanitizeUrl,
    sanitizeNotificationMessage,
    validateNotificationMessage,
    validateUserAction,
    validateAndSanitizeFormData,
} from '../sanitization';
import type {
    NotificationMessage,
    NotificationType,
    NotificationPriority,
} from '@/types/notifications';

describe('Sanitization Utilities', () => {
    describe('sanitizeNotificationContent', () => {
        it('should allow safe HTML tags', () => {
            const input = '<p>Hello <strong>world</strong>!</p>';
            const result = sanitizeNotificationContent(input);
            expect(result).toBe('<p>Hello <strong>world</strong>!</p>');
        });

        it('should remove dangerous script tags', () => {
            const input = '<p>Hello</p><script>alert("xss")</script>';
            const result = sanitizeNotificationContent(input);
            expect(result).toBe('<p>Hello</p>');
        });

        it('should remove dangerous event handlers', () => {
            const input = '<p onclick="alert(\'xss\')">Click me</p>';
            const result = sanitizeNotificationContent(input);
            expect(result).toBe('<p>Click me</p>');
        });

        it('should sanitize malicious links', () => {
            const input = '<a href="javascript:alert(\'xss\')">Click</a>';
            const result = sanitizeNotificationContent(input);
            expect(result).toBe('<a>Click</a>');
        });

        it('should preserve safe links', () => {
            const input =
                '<a href="https://example.com" target="_blank">Link</a>';
            const result = sanitizeNotificationContent(input);
            expect(result).toContain('href="https://example.com"');
            expect(result).toContain('target="_blank"');
        });

        it('should handle empty or invalid input', () => {
            expect(sanitizeNotificationContent('')).toBe('');
            expect(sanitizeNotificationContent(null as unknown as string)).toBe(
                ''
            );
            expect(
                sanitizeNotificationContent(undefined as unknown as string)
            ).toBe('');
        });

        it('should handle malformed HTML gracefully', () => {
            const input = '<p>Unclosed tag<div>Nested</p>';
            const result = sanitizeNotificationContent(input);
            expect(result).toContain('Unclosed tag');
            expect(result).toContain('Nested');
        });
    });

    describe('sanitizeUserInput', () => {
        it('should be more restrictive than notification content', () => {
            const input =
                '<p>Hello <strong>world</strong> <a href="https://example.com">link</a></p>';
            const result = sanitizeUserInput(input);
            expect(result).toBe('<p>Hello <strong>world</strong> link</p>');
        });

        it('should remove all dangerous content', () => {
            const input =
                '<script>alert("xss")</script><p onclick="evil()">Text</p>';
            const result = sanitizeUserInput(input);
            expect(result).toBe('<p>Text</p>');
        });

        it('should handle edge cases', () => {
            expect(sanitizeUserInput('')).toBe('');
            expect(sanitizeUserInput('<>')).toBe('&lt;&gt;'); // DOMPurify escapes invalid tags
            expect(sanitizeUserInput('Plain text')).toBe('Plain text');
        });
    });

    describe('sanitizeUrl', () => {
        it('should allow safe HTTP URLs', () => {
            const url = 'https://example.com/path?param=value';
            const result = sanitizeUrl(url);
            expect(result).toBe(url);
        });

        it('should allow mailto URLs', () => {
            const url = 'mailto:test@example.com';
            const result = sanitizeUrl(url);
            expect(result).toBe(url);
        });

        it('should block javascript URLs', () => {
            const url = 'javascript:alert("xss")';
            const result = sanitizeUrl(url);
            expect(result).toBe('');
        });

        it('should block data URLs', () => {
            const url = 'data:text/html,<script>alert("xss")</script>';
            const result = sanitizeUrl(url);
            expect(result).toBe('');
        });

        it('should block vbscript URLs', () => {
            const url = 'vbscript:msgbox("xss")';
            const result = sanitizeUrl(url);
            expect(result).toBe('');
        });

        it('should handle invalid input', () => {
            expect(sanitizeUrl('')).toBe('');
            expect(sanitizeUrl(null as unknown as string)).toBe('');
            expect(sanitizeUrl(undefined as unknown as string)).toBe('');
        });
    });

    describe('sanitizeNotificationMessage', () => {
        const createTestMessage = (): NotificationMessage => ({
            id: 'test-123',
            type: 'Event' as NotificationType,
            title: '<strong>Event</strong> Update',
            message: '<p>Your event has been <em>updated</em>!</p>',
            timestamp: '2024-01-01T00:00:00Z',
            priority: 'Medium' as NotificationPriority,
            actionUrl: 'https://example.com/event/123',
            metadata: {
                eventId: '123',
                description: '<script>alert("xss")</script>Safe content',
            },
        });

        it('should sanitize all string fields', () => {
            const message = createTestMessage();
            const result = sanitizeNotificationMessage(message);

            expect(result.title).toBe('<strong>Event</strong> Update');
            expect(result.message).toBe(
                '<p>Your event has been <em>updated</em>!</p>'
            );
            expect(result.actionUrl).toBe('https://example.com/event/123');
        });

        it('should sanitize metadata recursively', () => {
            const message = createTestMessage();
            const result = sanitizeNotificationMessage(message);

            expect(result.metadata?.eventId).toBe('123');
            expect(result.metadata?.description).toBe('Safe content');
        });

        it('should handle missing optional fields', () => {
            const message: NotificationMessage = {
                id: 'test-123',
                type: 'Event' as NotificationType,
                title: 'Title',
                message: 'Message',
                timestamp: '2024-01-01T00:00:00Z',
                priority: 'Medium' as NotificationPriority,
            };

            const result = sanitizeNotificationMessage(message);
            expect(result.actionUrl).toBeUndefined();
            expect(result.metadata).toBeUndefined();
        });
    });
});

describe('Validation Utilities', () => {
    describe('validateNotificationMessage', () => {
        const createValidMessage = () => ({
            id: 'test-123',
            type: 'Event',
            title: 'Test Title',
            message: 'Test message',
            timestamp: '2024-01-01T00:00:00Z',
            priority: 'Medium',
        });

        it('should validate a correct notification message', () => {
            const message = createValidMessage();
            const result = validateNotificationMessage(message);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should require all mandatory fields', () => {
            const result = validateNotificationMessage({});

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Notification ID is required and must be a string'
            );
            expect(result.errors).toContain(
                'Notification type is required and must be a string'
            );
            expect(result.errors).toContain(
                'Notification title is required and must be a string'
            );
            expect(result.errors).toContain(
                'Notification message is required and must be a string'
            );
            expect(result.errors).toContain(
                'Notification timestamp is required and must be a string'
            );
            expect(result.errors).toContain(
                'Notification priority is required and must be a string'
            );
        });

        it('should validate field types', () => {
            const message = {
                id: 123,
                type: null,
                title: [],
                message: {},
                timestamp: true,
                priority: undefined,
            };

            const result = validateNotificationMessage(message);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should validate optional fields when present', () => {
            const message = {
                ...createValidMessage(),
                actionUrl: 123,
                metadata: 'not an object',
            };

            const result = validateNotificationMessage(message);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Action URL must be a string if provided'
            );
            expect(result.errors).toContain(
                'Metadata must be an object if provided'
            );
        });

        it('should warn about potentially dangerous content', () => {
            const message = {
                ...createValidMessage(),
                title: '<script>alert("xss")</script>Title',
                message: 'Message with javascript:alert("xss")',
                actionUrl: 'javascript:alert("xss")',
            };

            const result = validateNotificationMessage(message);
            expect(result.warnings).toContain(
                'Title contains potentially dangerous content'
            );
            expect(result.warnings).toContain(
                'Message contains potentially dangerous content'
            );
            expect(result.warnings).toContain(
                'Action URL contains potentially dangerous content'
            );
        });

        it('should handle null or undefined input', () => {
            const result = validateNotificationMessage(null);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Notification message is required');
        });
    });

    describe('validateUserAction', () => {
        it('should validate correct action names', () => {
            const result = validateUserAction('dismissNotification');
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should require action to be a string', () => {
            const result = validateUserAction(null as unknown as string);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Action is required and must be a string'
            );
        });

        it('should validate action name format', () => {
            const result = validateUserAction('123invalid');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                'Action name must start with a letter and contain only letters, numbers, underscores, and hyphens'
            );
        });

        it('should allow valid action name formats', () => {
            const validNames = [
                'action',
                'action_name',
                'action-name',
                'action123',
                'Action_Name-123',
            ];

            validNames.forEach((name) => {
                const result = validateUserAction(name);
                expect(result.isValid).toBe(true);
            });
        });

        it('should warn about dangerous data', () => {
            const result = validateUserAction(
                'validAction',
                '<script>alert("xss")</script>'
            );
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain(
                'Action data contains potentially dangerous content'
            );
        });

        it('should validate object data', () => {
            const data = {
                field: '<script>alert("xss")</script>value',
            };

            const result = validateUserAction('validAction', data);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toContain(
                'Action data object contains potentially dangerous content'
            );
        });
    });

    describe('validateAndSanitizeFormData', () => {
        it('should sanitize and validate form data', () => {
            const formData = {
                name: 'John <script>alert("xss")</script> Doe',
                email: 'john@example.com',
                age: 30,
                active: true,
                tags: ['tag1', '<script>alert("xss")</script>tag2'],
            };

            const result = validateAndSanitizeFormData(formData);

            expect(result.validation.isValid).toBe(true);
            expect(result.sanitized.name).toBe('John  Doe');
            expect(result.sanitized.email).toBe('john@example.com');
            expect(result.sanitized.age).toBe(30);
            expect(result.sanitized.active).toBe(true);
            expect(result.sanitized.tags).toEqual(['tag1', 'tag2']);
        });

        it('should validate field names', () => {
            const formData = {
                '123invalid': 'value',
                valid_field: 'value',
            };

            const result = validateAndSanitizeFormData(formData);

            expect(result.validation.isValid).toBe(false);
            expect(result.validation.errors).toContain(
                'Invalid field name: 123invalid'
            );
            expect(result.sanitized.valid_field).toBe('value');
        });

        it('should handle nested objects', () => {
            const formData = {
                user: {
                    name: 'John <script>alert("xss")</script>',
                    profile: {
                        bio: 'Bio with <script>alert("xss")</script>',
                    },
                },
            };

            const result = validateAndSanitizeFormData(formData);

            expect(result.validation.isValid).toBe(true);
            expect(result.sanitized.user.name).toBe('John ');
            expect(result.sanitized.user.profile.bio).toBe('Bio with ');
        });

        it('should warn about dangerous content', () => {
            const formData = {
                description: '<script>alert("xss")</script>Safe content',
            };

            const result = validateAndSanitizeFormData(formData);

            expect(result.validation.isValid).toBe(true);
            expect(result.validation.warnings).toContain(
                'Field description contains potentially dangerous content'
            );
        });

        it('should handle unsupported data types', () => {
            const formData = {
                func: () => 'function',
                symbol: Symbol('test'),
            };

            const result = validateAndSanitizeFormData(formData);

            expect(result.validation.isValid).toBe(false);
            expect(result.validation.errors).toContain(
                'Unsupported data type for field func: function'
            );
            expect(result.validation.errors).toContain(
                'Unsupported data type for field symbol: symbol'
            );
        });
    });
});

describe('XSS Prevention', () => {
    describe('sanitizeNotificationContent', () => {
        it('should block dangerous XSS payloads', () => {
            const dangerousPayloads = [
                '<script>alert("xss")</script>',
                '<img src="x" onerror="alert(\'xss\')">',
                '<iframe src="javascript:alert(\'xss\')"></iframe>',
                '<object data="javascript:alert(\'xss\')"></object>',
                '<embed src="javascript:alert(\'xss\')">',
                '<form><input type="text" onfocus="alert(\'xss\')"></form>',
                '<div onmouseover="alert(\'xss\')">Hover me</div>',
            ];

            dangerousPayloads.forEach((payload) => {
                const result = sanitizeNotificationContent(payload);
                // Should not contain script tags or event handlers
                expect(result).not.toContain('<script');
                expect(result).not.toContain('onerror');
                expect(result).not.toContain('onload');
                expect(result).not.toContain('onclick');
                expect(result).not.toContain('onmouseover');
                expect(result).not.toContain('onfocus');
            });
        });

        it('should handle URL-based XSS attempts', () => {
            // These are plain text, not HTML, so they won't be sanitized by DOMPurify
            const result1 = sanitizeNotificationContent(
                'javascript:alert("xss")'
            );
            const result2 = sanitizeNotificationContent(
                'vbscript:msgbox("xss")'
            );

            // They should remain as-is since they're not in HTML context
            expect(result1).toBe('javascript:alert("xss")');
            expect(result2).toBe('vbscript:msgbox("xss")');
        });
    });

    describe('sanitizeUserInput', () => {
        it('should block dangerous HTML XSS payloads with strict rules', () => {
            const htmlPayloads = [
                '<script>alert("xss")</script>',
                '<img src="x" onerror="alert(\'xss\')">',
                '<iframe src="javascript:alert(\'xss\')"></iframe>',
                '<object data="javascript:alert(\'xss\')"></object>',
                '<embed src="javascript:alert(\'xss\')">',
                '<form><input type="text" onfocus="alert(\'xss\')"></form>',
                '<div onmouseover="alert(\'xss\')">Hover me</div>',
            ];

            htmlPayloads.forEach((payload) => {
                const result = sanitizeUserInput(payload);
                // Should not contain dangerous HTML elements or event handlers
                expect(result).not.toContain('<script');
                expect(result).not.toContain('<iframe');
                expect(result).not.toContain('<object');
                expect(result).not.toContain('<embed');
                expect(result).not.toContain('onerror');
                expect(result).not.toContain('onload');
                expect(result).not.toContain('onclick');
                expect(result).not.toContain('onmouseover');
                expect(result).not.toContain('onfocus');
            });
        });

        it('should handle plain text XSS attempts', () => {
            // Plain text URLs are not sanitized by DOMPurify
            const result1 = sanitizeUserInput('javascript:alert("xss")');
            const result2 = sanitizeUserInput('vbscript:msgbox("xss")');

            expect(result1).toBe('javascript:alert("xss")');
            expect(result2).toBe('vbscript:msgbox("xss")');
        });
    });

    describe('sanitizeUrl', () => {
        it('should block dangerous URL schemes', () => {
            const dangerousUrls = [
                'javascript:alert("xss")',
                'data:text/html,<script>alert("xss")</script>',
                'vbscript:msgbox("xss")',
                'javascript://comment%0aalert("xss")',
            ];

            dangerousUrls.forEach((url) => {
                const result = sanitizeUrl(url);
                expect(result).toBe('');
            });
        });
    });
});
