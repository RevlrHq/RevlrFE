import { MediaItem, MediaSearchQuery } from '@/types/media-search';
import { EventCategory } from '@/lib/constants/eventCategories';

export interface EventTemplate {
    id: string;
    name: string;
    category: EventCategory;
    description: string;
    suggestedMedia: MediaSuggestion[];
    mediaKeywords: string[];
    colorPalette: string[];
    style:
        | 'professional'
        | 'casual'
        | 'creative'
        | 'elegant'
        | 'modern'
        | 'vintage';
    mood:
        | 'energetic'
        | 'calm'
        | 'inspiring'
        | 'celebratory'
        | 'focused'
        | 'welcoming';
}

export interface MediaSuggestion {
    type: 'hero' | 'background' | 'accent' | 'icon' | 'decoration';
    keywords: string[];
    filters: {
        orientation?: 'landscape' | 'portrait' | 'square';
        minWidth?: number;
        minHeight?: number;
        color?: string;
        style?: string;
    };
    priority: number; // 1-10, higher is more important
    description: string;
}

export interface TemplateMediaRecommendation {
    template: EventTemplate;
    recommendations: Array<{
        suggestion: MediaSuggestion;
        items: MediaItem[];
        confidence: number; // 0-1
    }>;
    totalRecommendations: number;
}

export interface EventTemplateMediaService {
    // Template management
    getTemplatesByCategory(category: EventCategory): Promise<EventTemplate[]>;
    getTemplate(templateId: string): Promise<EventTemplate | null>;
    getAllTemplates(): Promise<EventTemplate[]>;

    // Media recommendations
    getMediaRecommendationsForTemplate(
        templateId: string
    ): Promise<TemplateMediaRecommendation>;
    getMediaRecommendationsForEvent(
        category: EventCategory,
        eventTitle?: string,
        eventDescription?: string,
        customKeywords?: string[]
    ): Promise<TemplateMediaRecommendation[]>;

    // Smart suggestions
    generateSearchQueriesFromTemplate(template: EventTemplate): string[];
    generateSearchQueriesFromEvent(
        category: EventCategory,
        title?: string,
        description?: string
    ): string[];

    // Template-based filtering
    filterMediaByTemplate(
        items: MediaItem[],
        template: EventTemplate
    ): MediaItem[];
    scoreMediaForTemplate(item: MediaItem, template: EventTemplate): number;

    // Auto-population
    autoPopulateEventMedia(
        templateId: string,
        maxItems?: number
    ): Promise<MediaItem[]>;
}

class EventTemplateMediaServiceImpl implements EventTemplateMediaService {
    private templates: EventTemplate[] = [
        {
            id: 'business-conference',
            name: 'Business Conference',
            category: EventCategory.BusinessProfessional,
            description:
                'Professional conference and business meeting template',
            suggestedMedia: [
                {
                    type: 'hero',
                    keywords: [
                        'business meeting',
                        'conference',
                        'presentation',
                        'professional',
                    ],
                    filters: {
                        orientation: 'landscape',
                        minWidth: 1920,
                        minHeight: 1080,
                    },
                    priority: 10,
                    description: 'Main hero image for conference promotion',
                },
                {
                    type: 'background',
                    keywords: [
                        'office',
                        'corporate',
                        'modern building',
                        'business',
                    ],
                    filters: { orientation: 'landscape', color: 'blue' },
                    priority: 8,
                    description: 'Professional background images',
                },
                {
                    type: 'accent',
                    keywords: [
                        'handshake',
                        'team',
                        'networking',
                        'collaboration',
                    ],
                    filters: { orientation: 'square' },
                    priority: 6,
                    description: 'Supporting images for networking aspects',
                },
            ],
            mediaKeywords: [
                'business',
                'professional',
                'conference',
                'meeting',
                'corporate',
                'team',
                'presentation',
            ],
            colorPalette: [
                '#1e40af',
                '#3b82f6',
                '#60a5fa',
                '#93c5fd',
                '#dbeafe',
            ],
            style: 'professional',
            mood: 'focused',
        },
        {
            id: 'tech-innovation',
            name: 'Technology & Innovation',
            category: EventCategory.TechnologyInnovation,
            description: 'Modern tech event and innovation showcase template',
            suggestedMedia: [
                {
                    type: 'hero',
                    keywords: [
                        'technology',
                        'innovation',
                        'digital',
                        'futuristic',
                    ],
                    filters: { orientation: 'landscape', minWidth: 1920 },
                    priority: 10,
                    description: 'Cutting-edge technology hero image',
                },
                {
                    type: 'background',
                    keywords: [
                        'circuit board',
                        'code',
                        'data',
                        'abstract tech',
                    ],
                    filters: { orientation: 'landscape', color: 'blue' },
                    priority: 8,
                    description: 'Tech-themed background images',
                },
                {
                    type: 'accent',
                    keywords: ['startup', 'coding', 'computer', 'innovation'],
                    filters: { orientation: 'square' },
                    priority: 7,
                    description: 'Innovation and startup imagery',
                },
            ],
            mediaKeywords: [
                'technology',
                'innovation',
                'digital',
                'startup',
                'coding',
                'computer',
                'data',
                'future',
            ],
            colorPalette: [
                '#7c3aed',
                '#8b5cf6',
                '#a78bfa',
                '#c4b5fd',
                '#ede9fe',
            ],
            style: 'modern',
            mood: 'inspiring',
        },
        {
            id: 'music-festival',
            name: 'Music Festival',
            category: EventCategory.MusicEntertainment,
            description: 'Vibrant music festival and concert template',
            suggestedMedia: [
                {
                    type: 'hero',
                    keywords: ['music festival', 'concert', 'stage', 'crowd'],
                    filters: { orientation: 'landscape', minWidth: 1920 },
                    priority: 10,
                    description: 'Dynamic concert or festival scene',
                },
                {
                    type: 'background',
                    keywords: [
                        'music',
                        'instruments',
                        'sound waves',
                        'colorful',
                    ],
                    filters: { orientation: 'landscape' },
                    priority: 8,
                    description: 'Musical and colorful backgrounds',
                },
                {
                    type: 'accent',
                    keywords: [
                        'dancing',
                        'celebration',
                        'party',
                        'entertainment',
                    ],
                    filters: { orientation: 'square' },
                    priority: 7,
                    description: 'Celebration and entertainment imagery',
                },
            ],
            mediaKeywords: [
                'music',
                'concert',
                'festival',
                'stage',
                'performance',
                'dancing',
                'celebration',
                'party',
            ],
            colorPalette: [
                '#f59e0b',
                '#f97316',
                '#ef4444',
                '#ec4899',
                '#8b5cf6',
            ],
            style: 'creative',
            mood: 'energetic',
        },
        {
            id: 'wellness-retreat',
            name: 'Wellness Retreat',
            category: EventCategory.HealthWellness,
            description: 'Peaceful wellness and health event template',
            suggestedMedia: [
                {
                    type: 'hero',
                    keywords: ['wellness', 'meditation', 'yoga', 'peaceful'],
                    filters: { orientation: 'landscape', minWidth: 1920 },
                    priority: 10,
                    description: 'Serene wellness and meditation imagery',
                },
                {
                    type: 'background',
                    keywords: ['nature', 'spa', 'zen', 'calm', 'green'],
                    filters: { orientation: 'landscape', color: 'green' },
                    priority: 8,
                    description: 'Natural and calming backgrounds',
                },
                {
                    type: 'accent',
                    keywords: ['healthy', 'balance', 'mindfulness', 'therapy'],
                    filters: { orientation: 'square' },
                    priority: 6,
                    description: 'Health and balance themed images',
                },
            ],
            mediaKeywords: [
                'wellness',
                'health',
                'meditation',
                'yoga',
                'spa',
                'nature',
                'calm',
                'peaceful',
            ],
            colorPalette: [
                '#10b981',
                '#34d399',
                '#6ee7b7',
                '#a7f3d0',
                '#d1fae5',
            ],
            style: 'elegant',
            mood: 'calm',
        },
        {
            id: 'food-festival',
            name: 'Food Festival',
            category: EventCategory.FoodDrink,
            description: 'Delicious food and culinary event template',
            suggestedMedia: [
                {
                    type: 'hero',
                    keywords: [
                        'food festival',
                        'culinary',
                        'delicious',
                        'gourmet',
                    ],
                    filters: { orientation: 'landscape', minWidth: 1920 },
                    priority: 10,
                    description: 'Appetizing food festival scenes',
                },
                {
                    type: 'background',
                    keywords: [
                        'restaurant',
                        'kitchen',
                        'ingredients',
                        'cooking',
                    ],
                    filters: { orientation: 'landscape' },
                    priority: 8,
                    description: 'Culinary and restaurant backgrounds',
                },
                {
                    type: 'accent',
                    keywords: ['chef', 'dining', 'food', 'beverage'],
                    filters: { orientation: 'square' },
                    priority: 7,
                    description: 'Chef and dining imagery',
                },
            ],
            mediaKeywords: [
                'food',
                'culinary',
                'restaurant',
                'chef',
                'cooking',
                'dining',
                'delicious',
                'gourmet',
            ],
            colorPalette: [
                '#dc2626',
                '#ea580c',
                '#f59e0b',
                '#eab308',
                '#84cc16',
            ],
            style: 'creative',
            mood: 'celebratory',
        },
    ];

    async getTemplatesByCategory(
        category: EventCategory
    ): Promise<EventTemplate[]> {
        return this.templates.filter(
            (template) => template.category === category
        );
    }

    async getTemplate(templateId: string): Promise<EventTemplate | null> {
        return (
            this.templates.find((template) => template.id === templateId) ||
            null
        );
    }

    async getAllTemplates(): Promise<EventTemplate[]> {
        return [...this.templates];
    }

    async getMediaRecommendationsForTemplate(
        templateId: string
    ): Promise<TemplateMediaRecommendation> {
        const template = await this.getTemplate(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        // Mock implementation - in real app, this would search media providers
        const recommendations = await Promise.all(
            template.suggestedMedia.map(async (suggestion) => {
                const mockItems = await this.generateMockMediaItems(
                    suggestion.keywords,
                    suggestion.filters
                );
                return {
                    suggestion,
                    items: mockItems,
                    confidence: 0.8 + Math.random() * 0.2, // 0.8-1.0
                };
            })
        );

        return {
            template,
            recommendations,
            totalRecommendations: recommendations.reduce(
                (sum, rec) => sum + rec.items.length,
                0
            ),
        };
    }

    async getMediaRecommendationsForEvent(
        category: EventCategory,
        eventTitle?: string,
        eventDescription?: string,
        customKeywords: string[] = []
    ): Promise<TemplateMediaRecommendation[]> {
        const templates = await this.getTemplatesByCategory(category);

        const recommendations = await Promise.all(
            templates.map(async (template) => {
                // Score template relevance based on event details
                const relevanceScore = this.calculateTemplateRelevance(
                    template,
                    eventTitle,
                    eventDescription,
                    customKeywords
                );

                if (relevanceScore < 0.3) {
                    return null; // Skip low-relevance templates
                }

                const templateRecommendation =
                    await this.getMediaRecommendationsForTemplate(template.id);

                // Adjust confidence scores based on relevance
                templateRecommendation.recommendations.forEach((rec) => {
                    rec.confidence *= relevanceScore;
                });

                return templateRecommendation;
            })
        );

        return recommendations.filter(
            (rec) => rec !== null
        ) as TemplateMediaRecommendation[];
    }

    generateSearchQueriesFromTemplate(template: EventTemplate): string[] {
        const queries: string[] = [];

        // Add template-specific keywords
        queries.push(...template.mediaKeywords);

        // Add style and mood combinations
        queries.push(`${template.style} ${template.category.toLowerCase()}`);
        queries.push(`${template.mood} ${template.category.toLowerCase()}`);

        // Add suggestion-specific queries
        template.suggestedMedia.forEach((suggestion) => {
            queries.push(...suggestion.keywords);

            // Combine keywords for more specific searches
            if (suggestion.keywords.length > 1) {
                queries.push(suggestion.keywords.slice(0, 2).join(' '));
            }
        });

        // Remove duplicates and return
        return Array.from(new Set(queries));
    }

    generateSearchQueriesFromEvent(
        category: EventCategory,
        title?: string,
        description?: string
    ): string[] {
        const queries: string[] = [];

        // Add category-based queries
        queries.push(
            category
                .toLowerCase()
                .replace(/([A-Z])/g, ' $1')
                .trim()
        );

        // Extract keywords from title
        if (title) {
            const titleWords = title
                .toLowerCase()
                .split(/\s+/)
                .filter((word) => word.length > 3)
                .filter(
                    (word) =>
                        !['the', 'and', 'for', 'with', 'event'].includes(word)
                );
            queries.push(...titleWords);
        }

        // Extract keywords from description
        if (description) {
            const descWords = description
                .toLowerCase()
                .split(/\s+/)
                .filter((word) => word.length > 4)
                .filter(
                    (word) =>
                        ![
                            'the',
                            'and',
                            'for',
                            'with',
                            'event',
                            'will',
                            'this',
                        ].includes(word)
                )
                .slice(0, 5); // Limit to top 5 words
            queries.push(...descWords);
        }

        return Array.from(new Set(queries));
    }

    filterMediaByTemplate(
        items: MediaItem[],
        template: EventTemplate
    ): MediaItem[] {
        return items
            .map((item) => ({
                item,
                score: this.scoreMediaForTemplate(item, template),
            }))
            .filter(({ score }) => score > 0.3) // Minimum relevance threshold
            .sort((a, b) => b.score - a.score)
            .map(({ item }) => item);
    }

    scoreMediaForTemplate(item: MediaItem, template: EventTemplate): number {
        let score = 0;

        // Check keyword matches in title and tags
        const itemText =
            `${item.title} ${item.description || ''} ${item.tags.join(' ')}`.toLowerCase();
        const templateKeywords = template.mediaKeywords.map((k) =>
            k.toLowerCase()
        );

        templateKeywords.forEach((keyword) => {
            if (itemText.includes(keyword)) {
                score += 0.2;
            }
        });

        // Check color palette match
        if (
            item.color &&
            template.colorPalette.some(
                (color) => this.colorDistance(item.color!, color) < 50
            )
        ) {
            score += 0.1;
        }

        // Check dimensions for suggested media types
        template.suggestedMedia.forEach((suggestion) => {
            if (
                suggestion.filters.minWidth &&
                item.width >= suggestion.filters.minWidth
            ) {
                score += 0.05;
            }
            if (
                suggestion.filters.minHeight &&
                item.height >= suggestion.filters.minHeight
            ) {
                score += 0.05;
            }
            if (suggestion.filters.orientation) {
                const itemOrientation = this.getImageOrientation(item);
                if (itemOrientation === suggestion.filters.orientation) {
                    score += 0.1;
                }
            }
        });

        return Math.min(score, 1.0); // Cap at 1.0
    }

    async autoPopulateEventMedia(
        templateId: string,
        maxItems: number = 5
    ): Promise<MediaItem[]> {
        const recommendation =
            await this.getMediaRecommendationsForTemplate(templateId);

        const allItems: Array<{
            item: MediaItem;
            priority: number;
            confidence: number;
        }> = [];

        recommendation.recommendations.forEach((rec) => {
            rec.items.forEach((item) => {
                allItems.push({
                    item,
                    priority: rec.suggestion.priority,
                    confidence: rec.confidence,
                });
            });
        });

        // Sort by priority and confidence
        allItems.sort((a, b) => {
            const scoreA = a.priority * a.confidence;
            const scoreB = b.priority * b.confidence;
            return scoreB - scoreA;
        });

        // Remove duplicates and limit results
        const uniqueItems = new Map<string, MediaItem>();
        allItems.forEach(({ item }) => {
            const key = `${item.providerId}-${item.id}`;
            if (!uniqueItems.has(key)) {
                uniqueItems.set(key, item);
            }
        });

        return Array.from(uniqueItems.values()).slice(0, maxItems);
    }

    private calculateTemplateRelevance(
        template: EventTemplate,
        eventTitle?: string,
        eventDescription?: string,
        customKeywords: string[] = []
    ): number {
        let relevance = 0.5; // Base relevance

        const eventText =
            `${eventTitle || ''} ${eventDescription || ''} ${customKeywords.join(' ')}`.toLowerCase();

        // Check keyword matches
        template.mediaKeywords.forEach((keyword) => {
            if (eventText.includes(keyword.toLowerCase())) {
                relevance += 0.1;
            }
        });

        // Check custom keywords
        customKeywords.forEach((keyword) => {
            if (
                template.mediaKeywords.some((tk) =>
                    tk.toLowerCase().includes(keyword.toLowerCase())
                )
            ) {
                relevance += 0.15;
            }
        });

        return Math.min(relevance, 1.0);
    }

    private async generateMockMediaItems(
        keywords: string[],
        filters: any
    ): Promise<MediaItem[]> {
        // Mock implementation - in real app, this would call media search service
        const mockItems: MediaItem[] = [];

        for (let i = 0; i < 3; i++) {
            mockItems.push({
                id: `mock_${Date.now()}_${i}`,
                providerId: 'unsplash',
                title: `${keywords[0]} image ${i + 1}`,
                description: `High quality ${keywords.join(', ')} image`,
                thumbnailUrl: `https://picsum.photos/300/200?random=${Date.now() + i}`,
                previewUrl: `https://picsum.photos/800/600?random=${Date.now() + i}`,
                downloadUrl: `https://picsum.photos/1920/1080?random=${Date.now() + i}`,
                width: filters.minWidth || 1920,
                height: filters.minHeight || 1080,
                fileSize: 2500000,
                mediaType: 'image',
                attribution: {
                    required: false,
                    placement: 'none',
                },
                license: {
                    type: 'unsplash',
                    name: 'Unsplash License',
                    url: 'https://unsplash.com/license',
                    commercialUse: true,
                    attribution: {
                        required: false,
                        placement: 'none',
                    },
                },
                tags: keywords,
                color: filters.color || '#3b82f6',
                photographer: {
                    name: 'Template Photographer',
                    profileUrl: 'https://unsplash.com/@photographer',
                },
            });
        }

        return mockItems;
    }

    private colorDistance(color1: string, color2: string): number {
        // Simple color distance calculation
        // In a real implementation, this would use proper color space calculations
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');

        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);

        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);

        return Math.sqrt(
            Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2)
        );
    }

    private getImageOrientation(
        item: MediaItem
    ): 'landscape' | 'portrait' | 'square' {
        const ratio = item.width / item.height;

        if (Math.abs(ratio - 1) < 0.1) {
            return 'square';
        } else if (ratio > 1) {
            return 'landscape';
        } else {
            return 'portrait';
        }
    }
}

export const eventTemplateMediaService = new EventTemplateMediaServiceImpl();
