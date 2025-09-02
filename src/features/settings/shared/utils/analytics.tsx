/**
 * Analytics tracking for settings usage
 * Provides insights into how users interact with settings
 */

import React from 'react';

export interface SettingsAnalyticsEvent {
    action: string;
    section: string;
    details?: Record<string, any>;
    timestamp: Date;
    userId?: string;
    sessionId?: string;
}

export interface SettingsUsageMetrics {
    sectionViews: Record<string, number>;
    settingsChanged: Record<string, number>;
    timeSpent: Record<string, number>;
    errorEncountered: Record<string, number>;
    helpViewed: Record<string, number>;
}

class SettingsAnalytics {
    private events: SettingsAnalyticsEvent[] = [];
    private sessionStartTime: Date = new Date();
    private currentSection: string = '';
    private sectionStartTime: Date = new Date();

    /**
     * Track a settings event
     */
    track(action: string, section: string, details?: Record<string, any>): void {
        const event: SettingsAnalyticsEvent = {
            action,
            section,
            details,
            timestamp: new Date(),
            userId: this.getCurrentUserId(),
            sessionId: this.getSessionId(),
        };

        this.events.push(event);
        this.sendToAnalytics(event);

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Settings Analytics:', event);
        }
    }

    /**
     * Track section view
     */
    trackSectionView(section: string): void {
        // Track time spent in previous section
        if (this.currentSection && this.currentSection !== section) {
            const timeSpent = Date.now() - this.sectionStartTime.getTime();
            this.track('section_time_spent', this.currentSection, {
                timeSpent: Math.round(timeSpent / 1000), // seconds
            });
        }

        this.currentSection = section;
        this.sectionStartTime = new Date();
        
        this.track('section_view', section);
    }

    /**
     * Track setting change
     */
    trackSettingChange(
        section: string,
        setting: string,
        oldValue: any,
        newValue: any
    ): void {
        this.track('setting_changed', section, {
            setting,
            oldValue: this.sanitizeValue(oldValue),
            newValue: this.sanitizeValue(newValue),
            valueType: typeof newValue,
        });
    }

    /**
     * Track form submission
     */
    trackFormSubmission(
        section: string,
        formName: string,
        success: boolean,
        errors?: string[]
    ): void {
        this.track('form_submission', section, {
            formName,
            success,
            errors: errors?.length || 0,
            errorTypes: errors,
        });
    }

    /**
     * Track help interaction
     */
    trackHelpInteraction(section: string, helpType: string, content?: string): void {
        this.track('help_interaction', section, {
            helpType, // tooltip, guide, faq, etc.
            contentLength: content?.length || 0,
        });
    }

    /**
     * Track error occurrence
     */
    trackError(
        section: string,
        errorType: string,
        errorMessage: string,
        context?: Record<string, any>
    ): void {
        this.track('error_encountered', section, {
            errorType,
            errorMessage: this.sanitizeErrorMessage(errorMessage),
            context,
        });
    }

    /**
     * Track search usage
     */
    trackSearch(query: string, resultsCount: number, section?: string): void {
        this.track('search_performed', section || 'global', {
            queryLength: query.length,
            resultsCount,
            hasResults: resultsCount > 0,
        });
    }

    /**
     * Track export request
     */
    trackExportRequest(
        exportType: string,
        dataTypes: string[],
        success: boolean
    ): void {
        this.track('data_export_requested', 'data-export', {
            exportType,
            dataTypes,
            dataTypesCount: dataTypes.length,
            success,
        });
    }

    /**
     * Track onboarding interaction
     */
    trackOnboarding(action: string, step?: number, completed?: boolean): void {
        this.track('onboarding_interaction', 'onboarding', {
            action, // started, step_viewed, completed, skipped
            step,
            completed,
        });
    }

    /**
     * Track performance metrics
     */
    trackPerformance(section: string, metric: string, value: number): void {
        this.track('performance_metric', section, {
            metric, // load_time, render_time, api_response_time
            value: Math.round(value),
            unit: 'ms',
        });
    }

    /**
     * Get usage metrics summary
     */
    getUsageMetrics(): SettingsUsageMetrics {
        const metrics: SettingsUsageMetrics = {
            sectionViews: {},
            settingsChanged: {},
            timeSpent: {},
            errorEncountered: {},
            helpViewed: {},
        };

        this.events.forEach(event => {
            const { action, section } = event;

            switch (action) {
                case 'section_view':
                    metrics.sectionViews[section] = (metrics.sectionViews[section] || 0) + 1;
                    break;
                case 'setting_changed':
                    metrics.settingsChanged[section] = (metrics.settingsChanged[section] || 0) + 1;
                    break;
                case 'section_time_spent':
                    const timeSpent = event.details?.timeSpent || 0;
                    metrics.timeSpent[section] = (metrics.timeSpent[section] || 0) + timeSpent;
                    break;
                case 'error_encountered':
                    metrics.errorEncountered[section] = (metrics.errorEncountered[section] || 0) + 1;
                    break;
                case 'help_interaction':
                    metrics.helpViewed[section] = (metrics.helpViewed[section] || 0) + 1;
                    break;
            }
        });

        return metrics;
    }

    /**
     * Export analytics data
     */
    exportData(): {
        events: SettingsAnalyticsEvent[];
        metrics: SettingsUsageMetrics;
        session: {
            startTime: Date;
            duration: number;
            eventsCount: number;
        };
    } {
        return {
            events: this.events,
            metrics: this.getUsageMetrics(),
            session: {
                startTime: this.sessionStartTime,
                duration: Date.now() - this.sessionStartTime.getTime(),
                eventsCount: this.events.length,
            },
        };
    }

    /**
     * Clear analytics data
     */
    clear(): void {
        this.events = [];
        this.sessionStartTime = new Date();
        this.currentSection = '';
        this.sectionStartTime = new Date();
    }

    /**
     * Send event to external analytics service
     */
    private sendToAnalytics(event: SettingsAnalyticsEvent): void {
        // Send to Google Analytics if available
        if (typeof window !== 'undefined' && 'gtag' in window) {
            (window as any).gtag('event', event.action, {
                event_category: 'settings',
                event_label: event.section,
                custom_map: event.details,
            });
        }

        // Send to other analytics services
        this.sendToCustomAnalytics(event);
    }

    /**
     * Send to custom analytics service
     */
    private sendToCustomAnalytics(event: SettingsAnalyticsEvent): void {
        // This would integrate with your custom analytics service
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
            fetch('/api/analytics/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            }).catch(error => {
                console.warn('Failed to send analytics event:', error);
            });
        }
    }

    /**
     * Get current user ID
     */
    private getCurrentUserId(): string | undefined {
        // This would get the user ID from your auth system
        if (typeof window !== 'undefined') {
            try {
                const authData = localStorage.getItem('auth-storage');
                if (authData) {
                    const parsed = JSON.parse(authData);
                    return parsed.state?.user?.id;
                }
            } catch (error) {
                // Ignore parsing errors
            }
        }
        return undefined;
    }

    /**
     * Get session ID
     */
    private getSessionId(): string {
        if (typeof window !== 'undefined') {
            let sessionId = sessionStorage.getItem('settings-session-id');
            if (!sessionId) {
                sessionId = `settings-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                sessionStorage.setItem('settings-session-id', sessionId);
            }
            return sessionId;
        }
        return 'server-session';
    }

    /**
     * Sanitize values to remove sensitive information
     */
    private sanitizeValue(value: any): any {
        if (typeof value === 'string') {
            // Remove email addresses, phone numbers, etc.
            return value
                .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
                .replace(/\b\d{3}-?\d{3}-?\d{4}\b/g, '[PHONE]')
                .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]');
        }
        
        if (typeof value === 'object' && value !== null) {
            const sanitized: any = {};
            for (const [key, val] of Object.entries(value)) {
                if (key.toLowerCase().includes('password') || 
                    key.toLowerCase().includes('token') ||
                    key.toLowerCase().includes('secret')) {
                    sanitized[key] = '[REDACTED]';
                } else {
                    sanitized[key] = this.sanitizeValue(val);
                }
            }
            return sanitized;
        }

        return value;
    }

    /**
     * Sanitize error messages
     */
    private sanitizeErrorMessage(message: string): string {
        return message
            .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
            .replace(/\b\d{3}-?\d{3}-?\d{4}\b/g, '[PHONE]')
            .replace(/token[:\s]+[a-zA-Z0-9]+/gi, 'token: [REDACTED]')
            .replace(/password[:\s]+.+/gi, 'password: [REDACTED]');
    }
}

// Create singleton instance
export const settingsAnalytics = new SettingsAnalytics();

/**
 * React hook for settings analytics
 */
export function useSettingsAnalytics() {
    return {
        trackSectionView: settingsAnalytics.trackSectionView.bind(settingsAnalytics),
        trackSettingChange: settingsAnalytics.trackSettingChange.bind(settingsAnalytics),
        trackFormSubmission: settingsAnalytics.trackFormSubmission.bind(settingsAnalytics),
        trackHelpInteraction: settingsAnalytics.trackHelpInteraction.bind(settingsAnalytics),
        trackError: settingsAnalytics.trackError.bind(settingsAnalytics),
        trackSearch: settingsAnalytics.trackSearch.bind(settingsAnalytics),
        trackExportRequest: settingsAnalytics.trackExportRequest.bind(settingsAnalytics),
        trackOnboarding: settingsAnalytics.trackOnboarding.bind(settingsAnalytics),
        trackPerformance: settingsAnalytics.trackPerformance.bind(settingsAnalytics),
        getUsageMetrics: settingsAnalytics.getUsageMetrics.bind(settingsAnalytics),
        exportData: settingsAnalytics.exportData.bind(settingsAnalytics),
    };
}

/**
 * Higher-order component for automatic analytics tracking
 */
export function withSettingsAnalytics<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    sectionName: string
) {
    return function AnalyticsWrappedComponent(props: P) {
        const analytics = useSettingsAnalytics();

        React.useEffect(() => {
            analytics.trackSectionView(sectionName);
        }, [analytics]);

        return <WrappedComponent {...props} />;
    };
}

/**
 * Performance tracking utilities
 */
export const performanceTracking = {
    /**
     * Measure component render time
     */
    measureRender: (componentName: string, section: string) => {
        const startTime = performance.now();
        
        return () => {
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            settingsAnalytics.trackPerformance(section, 'render_time', renderTime);
        };
    },

    /**
     * Measure API call time
     */
    measureApiCall: async <T>(
        apiCall: () => Promise<T>,
        section: string,
        apiName: string
    ): Promise<T> => {
        const startTime = performance.now();
        
        try {
            const result = await apiCall();
            const endTime = performance.now();
            const apiTime = endTime - startTime;
            
            settingsAnalytics.trackPerformance(section, `api_${apiName}_time`, apiTime);
            return result;
        } catch (error) {
            const endTime = performance.now();
            const apiTime = endTime - startTime;
            
            settingsAnalytics.trackPerformance(section, `api_${apiName}_error_time`, apiTime);
            settingsAnalytics.trackError(section, 'api_error', String(error), { apiName });
            throw error;
        }
    },

    /**
     * Measure form submission time
     */
    measureFormSubmission: async <T>(
        submission: () => Promise<T>,
        section: string,
        formName: string
    ): Promise<T> => {
        const startTime = performance.now();
        
        try {
            const result = await submission();
            const endTime = performance.now();
            const submissionTime = endTime - startTime;
            
            settingsAnalytics.trackPerformance(section, `form_${formName}_time`, submissionTime);
            settingsAnalytics.trackFormSubmission(section, formName, true);
            return result;
        } catch (error) {
            const endTime = performance.now();
            const submissionTime = endTime - startTime;
            
            settingsAnalytics.trackPerformance(section, `form_${formName}_error_time`, submissionTime);
            settingsAnalytics.trackFormSubmission(section, formName, false, [String(error)]);
            throw error;
        }
    },
};