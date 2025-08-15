/**
 * ABTestingService - A/B testing framework for media search interface improvements
 * Supports feature flags, variant assignment, and conversion tracking
 */

import MediaAnalyticsService from './MediaAnalyticsService';

export interface ABTest {
    id: string;
    name: string;
    description: string;
    variants: ABTestVariant[];
    trafficAllocation: number; // Percentage of users to include (0-100)
    isActive: boolean;
    startDate: string;
    endDate?: string;
    targetMetric: string;
    minimumSampleSize: number;
    createdAt: string;
}

export interface ABTestVariant {
    id: string;
    name: string;
    description: string;
    weight: number; // Percentage of test traffic (0-100)
    config: Record<string, any>;
}

export interface ABTestAssignment {
    testId: string;
    variantId: string;
    userId?: string;
    sessionId: string;
    assignedAt: number;
}

export interface ABTestResult {
    testId: string;
    variantId: string;
    exposures: number;
    conversions: number;
    conversionRate: number;
    confidence: number;
    isSignificant: boolean;
}

class ABTestingService {
    private static instance: ABTestingService;
    private analytics: MediaAnalyticsService;
    private activeTests: Map<string, ABTest> = new Map();
    private userAssignments: Map<string, Map<string, ABTestAssignment>> =
        new Map();
    private sessionId: string;
    private userId?: string;

    private constructor() {
        this.analytics = MediaAnalyticsService.getInstance();
        this.sessionId = this.generateSessionId();
        this.loadActiveTests();
    }

    static getInstance(): ABTestingService {
        if (!ABTestingService.instance) {
            ABTestingService.instance = new ABTestingService();
        }
        return ABTestingService.instance;
    }

    /**
     * Initialize the A/B testing service with user context
     */
    initialize(userId?: string): void {
        this.userId = userId;
        this.loadUserAssignments();
    }

    /**
     * Get variant for a specific test
     */
    getVariant(testId: string): ABTestVariant | null {
        const test = this.activeTests.get(testId);
        if (!test || !test.isActive) {
            return null;
        }

        // Check if user is already assigned
        const userKey = this.userId || this.sessionId;
        const userAssignments = this.userAssignments.get(userKey);
        const existingAssignment = userAssignments?.get(testId);

        if (existingAssignment) {
            const variant = test.variants.find(
                (v) => v.id === existingAssignment.variantId
            );
            if (variant) {
                // Track exposure
                this.trackExposure(testId, variant.id);
                return variant;
            }
        }

        // Assign user to test
        const assignment = this.assignUserToTest(test);
        if (assignment) {
            const variant = test.variants.find(
                (v) => v.id === assignment.variantId
            );
            if (variant) {
                this.trackExposure(testId, variant.id);
                return variant;
            }
        }

        return null;
    }

    /**
     * Check if a feature is enabled for the current user
     */
    isFeatureEnabled(testId: string, featureKey: string): boolean {
        const variant = this.getVariant(testId);
        return variant?.config[featureKey] === true;
    }

    /**
     * Get configuration value for a test variant
     */
    getConfig<T>(testId: string, configKey: string, defaultValue: T): T {
        const variant = this.getVariant(testId);
        return variant?.config[configKey] ?? defaultValue;
    }

    /**
     * Track a conversion event
     */
    trackConversion(
        testId: string,
        conversionType: string = 'default',
        metadata?: Record<string, any>
    ): void {
        const userKey = this.userId || this.sessionId;
        const userAssignments = this.userAssignments.get(userKey);
        const assignment = userAssignments?.get(testId);

        if (assignment) {
            this.analytics.trackABTestEvent({
                testId,
                variant: assignment.variantId,
                eventType: 'conversion',
                metadata: {
                    conversionType,
                    ...metadata,
                },
            });
        }
    }

    /**
     * Track an interaction event
     */
    trackInteraction(
        testId: string,
        interactionType: string,
        metadata?: Record<string, any>
    ): void {
        const userKey = this.userId || this.sessionId;
        const userAssignments = this.userAssignments.get(userKey);
        const assignment = userAssignments?.get(testId);

        if (assignment) {
            this.analytics.trackABTestEvent({
                testId,
                variant: assignment.variantId,
                eventType: 'interaction',
                metadata: {
                    interactionType,
                    ...metadata,
                },
            });
        }
    }

    /**
     * Get all active tests
     */
    getActiveTests(): ABTest[] {
        return Array.from(this.activeTests.values()).filter(
            (test) => test.isActive
        );
    }

    /**
     * Get user's current test assignments
     */
    getUserAssignments(): ABTestAssignment[] {
        const userKey = this.userId || this.sessionId;
        const assignments = this.userAssignments.get(userKey);
        return assignments ? Array.from(assignments.values()) : [];
    }

    /**
     * Force assign user to a specific variant (for testing/debugging)
     */
    forceAssignment(testId: string, variantId: string): void {
        const test = this.activeTests.get(testId);
        if (!test) return;

        const variant = test.variants.find((v) => v.id === variantId);
        if (!variant) return;

        const userKey = this.userId || this.sessionId;
        const assignment: ABTestAssignment = {
            testId,
            variantId,
            userId: this.userId,
            sessionId: this.sessionId,
            assignedAt: Date.now(),
        };

        if (!this.userAssignments.has(userKey)) {
            this.userAssignments.set(userKey, new Map());
        }
        this.userAssignments.get(userKey)!.set(testId, assignment);

        this.saveUserAssignments();
    }

    /**
     * Clear all test assignments (for testing)
     */
    clearAssignments(): void {
        const userKey = this.userId || this.sessionId;
        this.userAssignments.delete(userKey);
        this.saveUserAssignments();
    }

    // Private methods

    private generateSessionId(): string {
        return `ab_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private assignUserToTest(test: ABTest): ABTestAssignment | null {
        // Check if user should be included in test
        const userKey = this.userId || this.sessionId;
        const hash = this.hashString(userKey + test.id);
        const userPercentile = (hash % 100) + 1;

        if (userPercentile > test.trafficAllocation) {
            return null; // User not included in test
        }

        // Assign to variant based on weights
        const variant = this.selectVariantByWeight(test.variants, hash);
        if (!variant) return null;

        const assignment: ABTestAssignment = {
            testId: test.id,
            variantId: variant.id,
            userId: this.userId,
            sessionId: this.sessionId,
            assignedAt: Date.now(),
        };

        // Store assignment
        if (!this.userAssignments.has(userKey)) {
            this.userAssignments.set(userKey, new Map());
        }
        this.userAssignments.get(userKey)!.set(test.id, assignment);

        this.saveUserAssignments();
        return assignment;
    }

    private selectVariantByWeight(
        variants: ABTestVariant[],
        hash: number
    ): ABTestVariant | null {
        const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
        if (totalWeight === 0) return null;

        const targetWeight = (hash % totalWeight) + 1;
        let currentWeight = 0;

        for (const variant of variants) {
            currentWeight += variant.weight;
            if (targetWeight <= currentWeight) {
                return variant;
            }
        }

        return variants[0]; // Fallback
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    private trackExposure(testId: string, variantId: string): void {
        this.analytics.trackABTestEvent({
            testId,
            variant: variantId,
            eventType: 'exposure',
        });
    }

    private loadActiveTests(): void {
        // In a real implementation, this would load from an API or configuration service
        // For now, we'll define some example tests
        const exampleTests: ABTest[] = [
            {
                id: 'media_search_layout',
                name: 'Media Search Layout Test',
                description:
                    'Test different layouts for the media search interface',
                variants: [
                    {
                        id: 'control',
                        name: 'Control (Grid)',
                        description: 'Standard grid layout',
                        weight: 50,
                        config: {
                            layout: 'grid',
                            cardsPerRow: 6,
                            showProviderBadges: true,
                        },
                    },
                    {
                        id: 'masonry',
                        name: 'Masonry Layout',
                        description: 'Pinterest-style masonry layout',
                        weight: 50,
                        config: {
                            layout: 'masonry',
                            cardsPerRow: 4,
                            showProviderBadges: false,
                        },
                    },
                ],
                trafficAllocation: 50, // 50% of users
                isActive: true,
                startDate: new Date().toISOString(),
                targetMetric: 'media_selection_rate',
                minimumSampleSize: 1000,
                createdAt: new Date().toISOString(),
            },
            {
                id: 'search_suggestions',
                name: 'Search Suggestions Test',
                description: 'Test different approaches to search suggestions',
                variants: [
                    {
                        id: 'control',
                        name: 'Control (Category-based)',
                        description: 'Show suggestions based on event category',
                        weight: 33,
                        config: {
                            suggestionType: 'category',
                            maxSuggestions: 5,
                        },
                    },
                    {
                        id: 'popular',
                        name: 'Popular Searches',
                        description: 'Show popular search terms',
                        weight: 33,
                        config: {
                            suggestionType: 'popular',
                            maxSuggestions: 8,
                        },
                    },
                    {
                        id: 'ai_powered',
                        name: 'AI-Powered Suggestions',
                        description:
                            'Use AI to generate contextual suggestions',
                        weight: 34,
                        config: {
                            suggestionType: 'ai',
                            maxSuggestions: 6,
                            useEventContext: true,
                        },
                    },
                ],
                trafficAllocation: 30, // 30% of users
                isActive: true,
                startDate: new Date().toISOString(),
                targetMetric: 'search_success_rate',
                minimumSampleSize: 500,
                createdAt: new Date().toISOString(),
            },
        ];

        exampleTests.forEach((test) => {
            this.activeTests.set(test.id, test);
        });
    }

    private loadUserAssignments(): void {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const stored = localStorage.getItem('ab_test_assignments');
                if (stored) {
                    const assignments = JSON.parse(stored);
                    for (const [userKey, userAssignments] of Object.entries(
                        assignments
                    )) {
                        const assignmentMap = new Map();
                        for (const [testId, assignment] of Object.entries(
                            userAssignments as any
                        )) {
                            assignmentMap.set(testId, assignment);
                        }
                        this.userAssignments.set(userKey, assignmentMap);
                    }
                }
            } catch (error) {
                console.warn('Failed to load A/B test assignments:', error);
            }
        }
    }

    private saveUserAssignments(): void {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const assignments: any = {};
                for (const [
                    userKey,
                    userAssignments,
                ] of this.userAssignments.entries()) {
                    assignments[userKey] = {};
                    for (const [
                        testId,
                        assignment,
                    ] of userAssignments.entries()) {
                        assignments[userKey][testId] = assignment;
                    }
                }
                localStorage.setItem(
                    'ab_test_assignments',
                    JSON.stringify(assignments)
                );
            } catch (error) {
                console.warn('Failed to save A/B test assignments:', error);
            }
        }
    }
}

export default ABTestingService;
