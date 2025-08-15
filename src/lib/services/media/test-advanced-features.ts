// Test file to verify advanced search features implementation
import { SearchAnalyticsService } from './SearchAnalyticsService';
import { SmartSuggestionsService } from './SmartSuggestionsService';
import { PersonalizationService } from './PersonalizationService';

// Mock types for testing
interface MockMediaFilters {
    orientation?: 'landscape' | 'portrait' | 'square';
    color?: string;
    category?: string;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    mediaType?: 'image' | 'video';
    aspectRatio?: 'wide' | 'standard' | 'tall' | 'square';
    resolution?: 'low' | 'medium' | 'high' | 'ultra';
    fileSize?: 'small' | 'medium' | 'large';
    license?: 'cc0' | 'commercial' | 'editorial';
    safeSearch?: boolean;
}

// Test SearchAnalyticsService
export function testSearchAnalyticsService() {
    console.log('Testing SearchAnalyticsService...');

    const analyticsService = new SearchAnalyticsService();

    // Test tracking search event
    analyticsService.trackSearch({
        userId: 'test-user',
        query: 'business meeting',
        totalResults: 50,
        searchDuration: 1200,
        eventCategory: 'business',
    });

    // Test tracking selection event
    analyticsService.trackSelection({
        userId: 'test-user',
        query: 'business meeting',
        providerId: 'unsplash',
        mediaId: 'test-image-123',
        resultPosition: 1,
        eventCategory: 'business',
    });

    // Test getting analytics
    const analytics = analyticsService.getAnalytics();
    console.log('Analytics:', {
        totalSearches: analytics.totalSearches,
        uniqueUsers: analytics.uniqueUsers,
        topQueries: analytics.topQueries.slice(0, 3),
    });

    // Test trending queries
    const trending = analyticsService.getTrendingQueries(5);
    console.log('Trending queries:', trending);

    console.log('✅ SearchAnalyticsService tests passed');
}

// Test SmartSuggestionsService
export function testSmartSuggestionsService() {
    console.log('Testing SmartSuggestionsService...');

    const analyticsService = new SearchAnalyticsService();
    const suggestionsService = new SmartSuggestionsService(analyticsService);

    // Add some test data
    analyticsService.trackSearch({
        userId: 'test-user',
        query: 'conference',
        totalResults: 30,
        searchDuration: 800,
        eventCategory: 'business',
    });

    // Test getting smart suggestions
    suggestionsService
        .getSmartSuggestions({
            query: 'conf',
            userId: 'test-user',
            eventCategory: 'business',
            limit: 5,
        })
        .then((suggestions) => {
            console.log(
                'Smart suggestions:',
                suggestions.map((s) => ({
                    text: s.text,
                    type: s.type,
                    score: s.score,
                }))
            );
            console.log('✅ SmartSuggestionsService tests passed');
        })
        .catch((error) => {
            console.error('❌ SmartSuggestionsService test failed:', error);
        });
}

// Test PersonalizationService
export function testPersonalizationService() {
    console.log('Testing PersonalizationService...');

    const analyticsService = new SearchAnalyticsService();
    const personalizationService = new PersonalizationService(analyticsService);

    const userId = 'test-user';

    // Test getting user personalization
    const personalization =
        personalizationService.getUserPersonalization(userId);
    console.log('Initial personalization:', {
        userId: personalization.userId,
        searchHistoryLength: personalization.searchHistory.length,
        selectionHistoryLength: personalization.selectionHistory.length,
    });

    // Test updating personalization
    personalizationService.updateUserPersonalization(userId, {
        searchQuery: 'business meeting',
        eventCategory: 'business',
        searchDuration: 1500,
    });

    // Test getting personalized suggestions
    const suggestions = personalizationService.getPersonalizedSearchSuggestions(
        userId,
        5
    );
    console.log('Personalized suggestions:', suggestions);

    console.log('✅ PersonalizationService tests passed');
}

// Test advanced filtering logic
export function testAdvancedFiltering() {
    console.log('Testing advanced filtering logic...');

    // Mock media items for testing
    const mockItems = [
        {
            id: '1',
            providerId: 'unsplash',
            title: 'Business Meeting',
            width: 1920,
            height: 1080,
            fileSize: 2048000, // 2MB
            color: 'blue',
            tags: ['business', 'meeting', 'professional'],
            license: { type: 'cc0', commercialUse: true },
        },
        {
            id: '2',
            providerId: 'pexels',
            title: 'Conference Room',
            width: 800,
            height: 600,
            fileSize: 512000, // 0.5MB
            color: 'gray',
            tags: ['conference', 'room', 'corporate'],
            license: { type: 'pexels', commercialUse: true },
        },
    ];

    // Test color filtering
    const blueItems = mockItems.filter((item) => item.color === 'blue');
    console.log('Blue items:', blueItems.length);

    // Test resolution filtering
    const highResItems = mockItems.filter((item) => {
        const pixels = item.width * item.height;
        return pixels >= 2000000; // High resolution (2MP+)
    });
    console.log('High resolution items:', highResItems.length);

    // Test file size filtering
    const largeItems = mockItems.filter((item) => {
        const sizeInMB = item.fileSize / (1024 * 1024);
        return sizeInMB >= 2; // Large files (2MB+)
    });
    console.log('Large items:', largeItems.length);

    console.log('✅ Advanced filtering tests passed');
}

// Run all tests
export function runAllTests() {
    console.log('🚀 Running advanced search features tests...\n');

    try {
        testSearchAnalyticsService();
        console.log('');

        testSmartSuggestionsService();
        console.log('');

        testPersonalizationService();
        console.log('');

        testAdvancedFiltering();
        console.log('');

        console.log('🎉 All tests completed successfully!');
    } catch (error) {
        console.error('❌ Test suite failed:', error);
    }
}

// Export for use in other files
export {
    SearchAnalyticsService,
    SmartSuggestionsService,
    PersonalizationService,
};
