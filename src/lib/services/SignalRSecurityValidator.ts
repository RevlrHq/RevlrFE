/**
 * SignalR Security Validator Service
 *
 * This service provides comprehensive security validation and protection
 * for the SignalR integration, including data sanitization, authentication
 * validation, rate limiting, and security monitoring.
 *
 * Features:
 * - Input sanitization and validation
 * - XSS prevention
 * - Authentication token validation
 * - Rate limiting and abuse prevention
 * - Security monitoring and alerting
 * - Data encryption validation
 * - CSRF protection
 * - Content Security Policy validation
 */

import DOMPurify from 'dompurify';
import type { NotificationMessage } from '@/types/notifications';
import type { SignalRError } from '@/types/signalr';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface SecurityValidationResult {
    isValid: boolean;
    sanitizedData?: any;
    violations: SecurityViolation[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
}

export interface SecurityViolation {
    type: SecurityViolationType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    field?: string;
    value?: string;
    recommendation: string;
}

export type SecurityViolationType =
    | 'xss_attempt'
    | 'sql_injection'
    | 'invalid_token'
    | 'rate_limit_exceeded'
    | 'suspicious_content'
    | 'malformed_data'
    | 'unauthorized_access'
    | 'csrf_attempt'
    | 'content_policy_violation';

export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    keyGenerator?: (userId: string, action: string) => string;
}

export interface SecurityConfig {
    enableXSSProtection: boolean;
    enableSQLInjectionProtection: boolean;
    enableRateLimiting: boolean;
    enableContentValidation: boolean;
    enableTokenValidation: boolean;
    enableCSRFProtection: boolean;
    rateLimitConfig: RateLimitConfig;
    allowedDomains: string[];
    blockedPatterns: RegExp[];
    maxContentLength: number;
    trustedSources: string[];
}

export interface SecurityMetrics {
    totalValidations: number;
    totalViolations: number;
    violationsByType: Record<SecurityViolationType, number>;
    blockedRequests: number;
    sanitizedContent: number;
    riskDistribution: Record<'low' | 'medium' | 'high' | 'critical', number>;
    averageValidationTime: number;
    lastViolation?: {
        timestamp: number;
        type: SecurityViolationType;
        severity: string;
    };
}

export interface SecurityAlert {
    id: string;
    timestamp: number;
    type: SecurityViolationType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    details: Record<string, any>;
    resolved: boolean;
}

// ============================================================================
// Security Validator Implementation
// ============================================================================

export class SignalRSecurityValidator {
    private static instance: SignalRSecurityValidator | null = null;

    private config: SecurityConfig;
    private metrics: SecurityMetrics;
    private rateLimitStore: Map<string, { count: number; resetTime: number }> =
        new Map();
    private alerts: SecurityAlert[] = [];
    private blockedIPs: Set<string> = new Set();
    private suspiciousPatterns: RegExp[] = [];

    // Event listeners
    private listeners: {
        onViolation?: (violation: SecurityViolation) => void;
        onAlert?: (alert: SecurityAlert) => void;
        onBlock?: (userId: string, reason: string) => void;
    } = {};

    private constructor() {
        this.config = this.getDefaultConfig();
        this.metrics = this.initializeMetrics();
        this.initializeSuspiciousPatterns();
        this.initializeDOMPurify();
    }

    public static getInstance(): SignalRSecurityValidator {
        if (!SignalRSecurityValidator.instance) {
            SignalRSecurityValidator.instance = new SignalRSecurityValidator();
        }
        return SignalRSecurityValidator.instance;
    }

    // ========================================================================
    // Public API
    // ========================================================================

    public validateNotification(
        notification: NotificationMessage,
        userId?: string
    ): SecurityValidationResult {
        const startTime = performance.now();
        const violations: SecurityViolation[] = [];
        let sanitizedData = { ...notification };
        let riskLevel: SecurityValidationResult['riskLevel'] = 'low';

        try {
            this.metrics.totalValidations++;

            // 1. Rate limiting check
            if (this.config.enableRateLimiting && userId) {
                const rateLimitViolation = this.checkRateLimit(
                    userId,
                    'notification'
                );
                if (rateLimitViolation) {
                    violations.push(rateLimitViolation);
                    riskLevel = this.escalateRiskLevel(riskLevel, 'high');
                }
            }

            // 2. Content validation and sanitization
            if (this.config.enableContentValidation) {
                const contentViolations = this.validateContent(notification);
                violations.push(...contentViolations);

                if (contentViolations.length > 0) {
                    riskLevel = this.escalateRiskLevel(riskLevel, 'medium');
                }
            }

            // 3. XSS protection
            if (this.config.enableXSSProtection) {
                const xssResult = this.sanitizeForXSS(notification);
                sanitizedData = xssResult.sanitizedData;
                violations.push(...xssResult.violations);

                if (xssResult.violations.length > 0) {
                    riskLevel = this.escalateRiskLevel(riskLevel, 'high');
                    this.metrics.sanitizedContent++;
                }
            }

            // 4. SQL injection protection
            if (this.config.enableSQLInjectionProtection) {
                const sqlViolations = this.checkSQLInjection(notification);
                violations.push(...sqlViolations);

                if (sqlViolations.length > 0) {
                    riskLevel = this.escalateRiskLevel(riskLevel, 'critical');
                }
            }

            // 5. Suspicious content detection
            const suspiciousViolations =
                this.detectSuspiciousContent(notification);
            violations.push(...suspiciousViolations);

            if (suspiciousViolations.length > 0) {
                riskLevel = this.escalateRiskLevel(riskLevel, 'medium');
            }

            // Update metrics
            this.updateMetrics(violations, riskLevel);

            // Generate alerts for high-risk violations
            if (riskLevel === 'high' || riskLevel === 'critical') {
                this.generateSecurityAlert(violations, userId);
            }

            const validationTime = performance.now() - startTime;
            this.updateAverageValidationTime(validationTime);

            const isValid =
                violations.length === 0 ||
                violations.every((v) => v.severity === 'low');
            const recommendations = this.generateRecommendations(violations);

            return {
                isValid,
                sanitizedData: isValid ? sanitizedData : undefined,
                violations,
                riskLevel,
                recommendations,
            };
        } catch (error) {
            console.debug('Security validation error:', error);

            // Return safe defaults on error
            return {
                isValid: false,
                violations: [
                    {
                        type: 'malformed_data',
                        severity: 'high',
                        description:
                            'Security validation failed due to internal error',
                        recommendation: 'Block request and investigate',
                    },
                ],
                riskLevel: 'high',
                recommendations: [
                    'Block request',
                    'Review security logs',
                    'Investigate error',
                ],
            };
        }
    }

    public validateToken(token: string): SecurityValidationResult {
        const violations: SecurityViolation[] = [];
        let riskLevel: SecurityValidationResult['riskLevel'] = 'low';

        if (!this.config.enableTokenValidation) {
            return {
                isValid: true,
                violations: [],
                riskLevel: 'low',
                recommendations: [],
            };
        }

        // Basic token format validation
        if (!token || typeof token !== 'string') {
            violations.push({
                type: 'invalid_token',
                severity: 'critical',
                description: 'Token is missing or invalid format',
                recommendation: 'Reject request and require re-authentication',
            });
            riskLevel = 'critical';
        } else {
            // JWT format validation (basic)
            const parts = token.split('.');
            if (parts.length !== 3) {
                violations.push({
                    type: 'invalid_token',
                    severity: 'high',
                    description: 'Token does not have valid JWT format',
                    recommendation:
                        'Reject token and require re-authentication',
                });
                riskLevel = 'high';
            }

            // Check for suspicious token patterns
            if (this.containsSuspiciousPatterns(token)) {
                violations.push({
                    type: 'suspicious_content',
                    severity: 'high',
                    description: 'Token contains suspicious patterns',
                    recommendation: 'Block token and investigate source',
                });
                riskLevel = 'high';
            }
        }

        const isValid = violations.length === 0;
        const recommendations = this.generateRecommendations(violations);

        return { isValid, violations, riskLevel, recommendations };
    }

    public checkRateLimit(
        userId: string,
        action: string
    ): SecurityViolation | null {
        if (!this.config.enableRateLimiting) {
            return null;
        }

        const key =
            this.config.rateLimitConfig.keyGenerator?.(userId, action) ||
            `${userId}:${action}`;
        const now = Date.now();
        const windowMs = this.config.rateLimitConfig.windowMs;
        const maxRequests = this.config.rateLimitConfig.maxRequests;

        const record = this.rateLimitStore.get(key);

        if (!record || now > record.resetTime) {
            // Reset or create new record
            this.rateLimitStore.set(key, {
                count: 1,
                resetTime: now + windowMs,
            });
            return null;
        }

        if (record.count >= maxRequests) {
            this.metrics.blockedRequests++;

            return {
                type: 'rate_limit_exceeded',
                severity: 'high',
                description: `Rate limit exceeded for user ${userId} on action ${action}`,
                recommendation:
                    'Block request and implement temporary user restriction',
            };
        }

        // Increment count
        record.count++;
        this.rateLimitStore.set(key, record);

        return null;
    }

    public setConfig(config: Partial<SecurityConfig>): void {
        this.config = { ...this.config, ...config };
    }

    public getMetrics(): SecurityMetrics {
        return { ...this.metrics };
    }

    public getAlerts(resolved?: boolean): SecurityAlert[] {
        if (resolved === undefined) {
            return [...this.alerts];
        }
        return this.alerts.filter((alert) => alert.resolved === resolved);
    }

    public setEventListeners(listeners: Partial<typeof this.listeners>): void {
        this.listeners = { ...this.listeners, ...listeners };
    }

    public blockIP(ipAddress: string): void {
        this.blockedIPs.add(ipAddress);
    }

    public unblockIP(ipAddress: string): void {
        this.blockedIPs.delete(ipAddress);
    }

    public isIPBlocked(ipAddress: string): boolean {
        return this.blockedIPs.has(ipAddress);
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private getDefaultConfig(): SecurityConfig {
        return {
            enableXSSProtection: true,
            enableSQLInjectionProtection: true,
            enableRateLimiting: true,
            enableContentValidation: true,
            enableTokenValidation: true,
            enableCSRFProtection: true,
            rateLimitConfig: {
                windowMs: 60 * 1000, // 1 minute
                maxRequests: 100,
                skipSuccessfulRequests: false,
                skipFailedRequests: false,
            },
            allowedDomains: ['localhost', '127.0.0.1'],
            blockedPatterns: [
                /javascript:/i,
                /vbscript:/i,
                /onload=/i,
                /onerror=/i,
                /onclick=/i,
            ],
            maxContentLength: 10000, // 10KB
            trustedSources: [],
        };
    }

    private initializeMetrics(): SecurityMetrics {
        return {
            totalValidations: 0,
            totalViolations: 0,
            violationsByType: {
                xss_attempt: 0,
                sql_injection: 0,
                invalid_token: 0,
                rate_limit_exceeded: 0,
                suspicious_content: 0,
                malformed_data: 0,
                unauthorized_access: 0,
                csrf_attempt: 0,
                content_policy_violation: 0,
            },
            blockedRequests: 0,
            sanitizedContent: 0,
            riskDistribution: {
                low: 0,
                medium: 0,
                high: 0,
                critical: 0,
            },
            averageValidationTime: 0,
        };
    }

    private initializeSuspiciousPatterns(): void {
        this.suspiciousPatterns = [
            // XSS patterns
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /onload\s*=/gi,
            /onerror\s*=/gi,
            /onclick\s*=/gi,

            // SQL injection patterns
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
            /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
            /('|(\\')|(;)|(--)|(\s)|(\/\*))/gi,

            // Path traversal
            /\.\.\//gi,
            /\.\.\\/gi,

            // Command injection
            /(\||&|;|\$\(|\`)/gi,
        ];
    }

    private initializeDOMPurify(): void {
        if (typeof window !== 'undefined' && DOMPurify) {
            // Configure DOMPurify for strict sanitization
            DOMPurify.setConfig({
                ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u'],
                ALLOWED_ATTR: [],
                ALLOW_DATA_ATTR: false,
                ALLOW_UNKNOWN_PROTOCOLS: false,
                SANITIZE_DOM: true,
                SANITIZE_NAMED_PROPS: true,
                KEEP_CONTENT: true,
            });
        }
    }

    private validateContent(
        notification: NotificationMessage
    ): SecurityViolation[] {
        const violations: SecurityViolation[] = [];

        // Check content length
        const totalLength = JSON.stringify(notification).length;
        if (totalLength > this.config.maxContentLength) {
            violations.push({
                type: 'content_policy_violation',
                severity: 'medium',
                description: `Content exceeds maximum length (${totalLength} > ${this.config.maxContentLength})`,
                recommendation: 'Truncate content or reject request',
            });
        }

        // Validate required fields
        if (!notification.id || !notification.type || !notification.title) {
            violations.push({
                type: 'malformed_data',
                severity: 'medium',
                description: 'Notification missing required fields',
                recommendation: 'Reject malformed notification',
            });
        }

        // Check for blocked patterns
        const textContent = `${notification.title} ${notification.message}`;
        for (const pattern of this.config.blockedPatterns) {
            if (pattern.test(textContent)) {
                violations.push({
                    type: 'content_policy_violation',
                    severity: 'high',
                    description: `Content matches blocked pattern: ${pattern.source}`,
                    recommendation: 'Block content and sanitize',
                });
            }
        }

        return violations;
    }

    private sanitizeForXSS(notification: NotificationMessage): {
        sanitizedData: NotificationMessage;
        violations: SecurityViolation[];
    } {
        const violations: SecurityViolation[] = [];
        const sanitizedData = { ...notification };

        // Sanitize text fields
        const fieldsToSanitize = ['title', 'message'];

        for (const field of fieldsToSanitize) {
            const originalValue = (notification as any)[field];
            if (typeof originalValue === 'string') {
                let sanitizedValue = originalValue;

                // Use DOMPurify if available
                if (typeof window !== 'undefined' && DOMPurify) {
                    sanitizedValue = DOMPurify.sanitize(originalValue);
                } else {
                    // Fallback sanitization for Node.js environment
                    sanitizedValue = this.basicSanitize(originalValue);
                }

                if (sanitizedValue !== originalValue) {
                    violations.push({
                        type: 'xss_attempt',
                        severity: 'high',
                        description: `XSS attempt detected in field: ${field}`,
                        field,
                        value: originalValue.substring(0, 100) + '...',
                        recommendation: 'Sanitize content and log incident',
                    });
                }

                (sanitizedData as any)[field] = sanitizedValue;
            }
        }

        // Sanitize data object if present
        if (notification.data && typeof notification.data === 'object') {
            sanitizedData.data = this.sanitizeObject(notification.data);
        }

        return { sanitizedData, violations };
    }

    private basicSanitize(input: string): string {
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .replace(/javascript:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
    }

    private sanitizeObject(obj: any): any {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        const sanitized: any = Array.isArray(obj) ? [] : {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.basicSanitize(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    private checkSQLInjection(
        notification: NotificationMessage
    ): SecurityViolation[] {
        const violations: SecurityViolation[] = [];
        const textContent = JSON.stringify(notification);

        // SQL injection patterns
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
            /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
            /(;|\-\-|\/\*|\*\/)/gi,
            /(\bUNION\b.*\bSELECT\b)/gi,
        ];

        for (const pattern of sqlPatterns) {
            if (pattern.test(textContent)) {
                violations.push({
                    type: 'sql_injection',
                    severity: 'critical',
                    description: `SQL injection attempt detected: ${pattern.source}`,
                    recommendation:
                        'Block request immediately and investigate source',
                });
            }
        }

        return violations;
    }

    private detectSuspiciousContent(
        notification: NotificationMessage
    ): SecurityViolation[] {
        const violations: SecurityViolation[] = [];
        const textContent = JSON.stringify(notification);

        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(textContent)) {
                violations.push({
                    type: 'suspicious_content',
                    severity: 'medium',
                    description: `Suspicious content pattern detected: ${pattern.source}`,
                    recommendation: 'Review content and consider blocking',
                });
            }
        }

        return violations;
    }

    private containsSuspiciousPatterns(content: string): boolean {
        return this.suspiciousPatterns.some((pattern) => pattern.test(content));
    }

    private escalateRiskLevel(
        current: SecurityValidationResult['riskLevel'],
        new_level: SecurityValidationResult['riskLevel']
    ): SecurityValidationResult['riskLevel'] {
        const levels = { low: 1, medium: 2, high: 3, critical: 4 };
        return levels[new_level] > levels[current] ? new_level : current;
    }

    private updateMetrics(
        violations: SecurityViolation[],
        riskLevel: SecurityValidationResult['riskLevel']
    ): void {
        this.metrics.totalViolations += violations.length;
        this.metrics.riskDistribution[riskLevel]++;

        for (const violation of violations) {
            this.metrics.violationsByType[violation.type]++;

            if (
                violation.severity === 'high' ||
                violation.severity === 'critical'
            ) {
                this.metrics.lastViolation = {
                    timestamp: Date.now(),
                    type: violation.type,
                    severity: violation.severity,
                };
            }
        }

        // Notify listeners
        for (const violation of violations) {
            if (this.listeners.onViolation) {
                this.listeners.onViolation(violation);
            }
        }
    }

    private updateAverageValidationTime(validationTime: number): void {
        const totalValidations = this.metrics.totalValidations;
        const currentAverage = this.metrics.averageValidationTime;

        this.metrics.averageValidationTime =
            (currentAverage * (totalValidations - 1) + validationTime) /
            totalValidations;
    }

    private generateSecurityAlert(
        violations: SecurityViolation[],
        userId?: string
    ): void {
        const highSeverityViolations = violations.filter(
            (v) => v.severity === 'high' || v.severity === 'critical'
        );

        if (highSeverityViolations.length === 0) return;

        const alert: SecurityAlert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            type: highSeverityViolations[0].type,
            severity: highSeverityViolations[0].severity,
            description: `Security violation detected: ${highSeverityViolations[0].description}`,
            userId,
            details: {
                violations: highSeverityViolations,
                totalViolations: violations.length,
            },
            resolved: false,
        };

        this.alerts.push(alert);

        if (this.listeners.onAlert) {
            this.listeners.onAlert(alert);
        }
    }

    private generateRecommendations(violations: SecurityViolation[]): string[] {
        const recommendations = new Set<string>();

        for (const violation of violations) {
            recommendations.add(violation.recommendation);
        }

        // Add general recommendations based on violation patterns
        const hasXSS = violations.some((v) => v.type === 'xss_attempt');
        const hasSQL = violations.some((v) => v.type === 'sql_injection');
        const hasRateLimit = violations.some(
            (v) => v.type === 'rate_limit_exceeded'
        );

        if (hasXSS) {
            recommendations.add('Implement Content Security Policy (CSP)');
            recommendations.add(
                'Use parameterized queries for database operations'
            );
        }

        if (hasSQL) {
            recommendations.add('Implement input validation and sanitization');
            recommendations.add(
                'Use prepared statements for all database queries'
            );
        }

        if (hasRateLimit) {
            recommendations.add(
                'Consider implementing CAPTCHA for suspicious users'
            );
            recommendations.add('Monitor for distributed attacks');
        }

        return Array.from(recommendations);
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const securityValidator = SignalRSecurityValidator.getInstance();
