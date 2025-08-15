# Advanced Media Search Features

This document describes the advanced search features and performance optimizations implemented for the media search system.

## Overview

The advanced search features enhance the basic media search functionality with:

1. **Advanced Filtering** - Color, orientation, category, dimensions, resolution, file size, and license filtering
2. **Smart Search Suggestions** - AI-powered suggestions based on user behavior and event categories
3. **Search Result Sorting** - Multiple sorting options including relevance, popularity, and recency
4. **Search Analytics** - Comprehensive usage tracking and optimization insights
5. **Preloading System** - Intelligent preloading of popular searches and category-based recommendations
6. **Search Result Personalization** - User behavior-based result customization

## Architecture

### Core Services

#### 1. AdvancedSearchService

Extends the base `MediaSearchService` with advanced filtering, sorting, and personalization capabilities.

```typescript
import { AdvancedSearchService } from '@/lib/services/media/AdvancedSearchService';

const advancedSearch = new AdvancedSearchService();

const results = await advancedSearch.searchMediaAdvanced(
    {
        query: 'business meeting',
        filters: {
            orientation: 'landscape',
            color: 'blue',
            resolution: 'high',
            license: 'commercial',
            safeSearch: true,
        },
        sortBy: 'popularity',
        sortOrder: 'desc',
        eventCategory: 'business',
    },
    {
        enablePersonalization: true,
        enableAnalytics: true,
        userId: 'user-123',
    }
);
```

#### 2. SearchAnalyticsService

Tracks user behavior and provides insights for optimization.

```typescript
import { SearchAnalyticsService } from '@/lib/services/media/SearchAnalyticsService';

const analytics = new SearchAnalyticsService();

// Track search events
analytics.trackSearch({
    userId: 'user-123',
    query: 'conference',
    totalResults: 50,
    searchDuration: 1200,
    eventCategory: 'business',
});

// Get analytics insights
const insights = analytics.getAnalytics();
console.log('Top queries:', insights.topQueries);
console.log('Provider performance:', insights.providerPerformance);
```

#### 3. SmartSuggestionsService

Provides intelligent search suggestions based on multiple factors.

```typescript
import { SmartSuggestionsService } from '@/lib/services/media/SmartSuggestionsService';

const suggestions = new SmartSuggestionsService(analyticsService);

const smartSuggestions = await suggestions.getSmartSuggestions({
    query: 'conf',
    userId: 'user-123',
    eventCategory: 'business',
    limit: 8,
    includeFilters: true,
});
```

#### 4. PersonalizationService

Customizes search results based on user behavior patterns.

```typescript
import { PersonalizationService } from '@/lib/services/media/PersonalizationService';

const personalization = new PersonalizationService(analyticsService);

// Update user preferences
personalization.updateUserPersonalization('user-123', {
    searchQuery: 'business meeting',
    selectedItems: [mediaItem1, mediaItem2],
    appliedFilters: { orientation: 'landscape' },
    eventCategory: 'business',
});

// Get personalized results
const personalizedResults = personalization.personalizeSearchResults(
    'user-123',
    searchResults.items
);
```

#### 5. PreloadingService

Intelligently preloads popular and relevant searches.

```typescript
import { PreloadingService } from '@/lib/services/media/PreloadingService';

const preloading = new PreloadingService(
    analyticsService,
    personalizationService,
    cache,
    searchFunction
);

// Start automatic preloading
preloading.startPreloading();

// Force immediate preload
await preloading.forcePreload();
```

## Advanced Filtering

### Supported Filter Types

1. **Orientation**: `landscape`, `portrait`, `square`
2. **Color**: `red`, `blue`, `green`, `yellow`, `orange`, `purple`, `pink`, `brown`, `black`, `white`, `gray`
3. **Resolution**: `low` (<0.5MP), `medium` (0.5-2MP), `high` (2-8MP), `ultra` (8MP+)
4. **Aspect Ratio**: `wide` (>1.5), `standard` (0.75-1.5), `tall` (<0.75), `square` (0.9-1.1)
5. **File Size**: `small` (<2MB), `medium` (2-10MB), `large` (>10MB)
6. **License**: `cc0`, `commercial`, `editorial`
7. **Safe Search**: Boolean flag for content filtering
8. **Dimensions**: `minWidth`, `maxWidth`, `minHeight`, `maxHeight`

### Filter Implementation

```typescript
const filters: MediaFilters = {
    orientation: 'landscape',
    color: 'blue',
    resolution: 'high',
    aspectRatio: 'wide',
    fileSize: 'large',
    license: 'commercial',
    safeSearch: true,
    minWidth: 1920,
    minHeight: 1080,
};
```

## Smart Search Suggestions

### Suggestion Types

1. **Query-based**: Fuzzy matching against popular queries
2. **Category-based**: Event category-specific suggestions
3. **Trending**: Recently popular search terms
4. **Personalized**: Based on user search history
5. **Filter-based**: Suggested filters based on query analysis

### Suggestion Scoring

Suggestions are scored based on:

- String similarity (Levenshtein distance)
- Popularity metrics
- User relevance
- Recency of usage
- Category matching

## Search Result Sorting

### Available Sort Options

1. **Relevance** (default): Provider health score + image quality
2. **Popularity**: Download count + view count + provider score
3. **Recency**: Upload date (when available)
4. **Downloads**: Total download count
5. **Views**: Total view count

### Custom Sorting

```typescript
const results = await advancedSearch.searchMediaAdvanced({
    query: 'business meeting',
    sortBy: 'popularity',
    sortOrder: 'desc',
});
```

## Analytics and Usage Tracking

### Tracked Events

1. **Search Events**: Query, filters, results count, duration
2. **Selection Events**: Media ID, provider, position in results
3. **Download Events**: Media ID, provider, user
4. **Filter Application**: Applied filters, context
5. **Preview Events**: Media previews and interactions

### Analytics Insights

```typescript
const analytics = analyticsService.getAnalytics();

// Key metrics
console.log('Total searches:', analytics.totalSearches);
console.log('Unique users:', analytics.uniqueUsers);
console.log('Average search duration:', analytics.averageSearchDuration);
console.log('Conversion rate:', analytics.conversionRate);

// Top performing content
console.log('Top queries:', analytics.topQueries);
console.log('Top categories:', analytics.topCategories);

// Provider performance
console.log('Provider metrics:', analytics.providerPerformance);
```

## Preloading System

### Preloading Strategies

1. **Popular Queries**: Most searched terms across all users
2. **Category-based**: Popular queries for specific event categories
3. **User-based**: Personalized queries for active users
4. **Time-based**: Queries relevant to current time of day
5. **Trending**: Recently popular search terms
6. **Seasonal**: Season-specific content

### Configuration

```typescript
const preloadingOptions = {
    enableCategoryPreloading: true,
    enableUserPreloading: true,
    enableTimeBasedPreloading: true,
    enableTrendingPreloading: true,
    enableSeasonalPreloading: false,
    maxConcurrentPreloads: 5,
    preloadingInterval: 30 * 60 * 1000, // 30 minutes
};
```

## Personalization

### User Behavior Tracking

1. **Search History**: Queries, timestamps, result counts
2. **Selection History**: Selected media, providers, categories
3. **Filter Preferences**: Commonly used filters
4. **Timing Patterns**: Most active times of day
5. **Category Preferences**: Preferred event categories

### Personalization Factors

1. **Provider Preference**: 40% weight
2. **Tag Matching**: 30% weight
3. **Aspect Ratio Preference**: 15% weight
4. **Color Preference**: 10% weight
5. **Photographer Preference**: 5% weight

## Performance Optimizations

### Caching Enhancements

1. **LRU Cache**: Least Recently Used eviction policy
2. **Category-based Caching**: Separate cache keys for categories
3. **User-specific Caching**: Personalized cache entries
4. **Time-based Caching**: Different expiry times for different content types
5. **Preloading Cache**: Proactive caching of popular content

### Search Optimizations

1. **Debounced Search**: Reduces API calls during typing
2. **Concurrent Provider Queries**: Parallel provider requests
3. **Result Deduplication**: Removes duplicate media items
4. **Intelligent Pagination**: Optimized page sizes
5. **Provider Health Monitoring**: Automatic failover

## Usage Examples

### Basic Advanced Search

```typescript
import { AdvancedSearchService } from '@/lib/services/media/AdvancedSearchService';

const searchService = new AdvancedSearchService();

const results = await searchService.searchMediaAdvanced({
    query: 'technology conference',
    filters: {
        orientation: 'landscape',
        resolution: 'high',
        safeSearch: true,
    },
    sortBy: 'relevance',
    eventCategory: 'technology',
});
```

### With Analytics and Personalization

```typescript
const results = await searchService.searchMediaAdvanced(
    {
        query: 'business presentation',
        filters: { license: 'commercial' },
        sortBy: 'popularity',
    },
    {
        enablePersonalization: true,
        enableAnalytics: true,
        userId: 'user-123',
    }
);

// Track user selection
searchService.trackSelection({
    userId: 'user-123',
    providerId: 'unsplash',
    mediaId: 'selected-image-id',
    resultPosition: 1,
    eventCategory: 'business',
});
```

### Smart Suggestions

```typescript
const suggestions = await searchService.getAdvancedSuggestions({
    query: 'tech',
    userId: 'user-123',
    eventCategory: 'technology',
    limit: 8,
    includeFilters: true,
});

suggestions.forEach((suggestion) => {
    console.log(
        `${suggestion.text} (${suggestion.type}, score: ${suggestion.score})`
    );
});
```

## Integration with UI Components

### Enhanced Search Header

```typescript
import { AdvancedMediaSearchHeader } from '@/components/media-search/AdvancedMediaSearchHeader';

<AdvancedMediaSearchHeader
    query={query}
    onQueryChange={setQuery}
    onSearch={handleSearch}
    suggestions={suggestions}
    filters={filters}
    onFiltersChange={setFilters}
    sortBy={sortBy}
    sortOrder={sortOrder}
    onSortChange={handleSortChange}
    enablePersonalization={true}
    enableSmartSuggestions={true}
    userId={currentUser?.id}
    eventCategory={eventCategory}
/>
```

## Testing

### Running Tests

```typescript
import { runAllTests } from '@/lib/services/media/test-advanced-features';

// Run comprehensive test suite
runAllTests();
```

### Test Coverage

- SearchAnalyticsService: Event tracking, analytics generation
- SmartSuggestionsService: Suggestion generation and scoring
- PersonalizationService: User behavior tracking and result customization
- AdvancedSearchService: Filtering, sorting, and integration
- PreloadingService: Cache warming and optimization

## Performance Metrics

### Expected Improvements

1. **Search Response Time**: 30-50% faster with preloading
2. **Cache Hit Rate**: 60-80% for popular queries
3. **User Engagement**: 25-40% increase in selections
4. **Search Accuracy**: 20-30% improvement with personalization
5. **Provider Efficiency**: 15-25% better resource utilization

### Monitoring

```typescript
// Get performance metrics
const cacheStats = searchService.getCacheStats();
const healthMetrics = searchService.getServiceHealth();
const preloadingStats = preloadingService.getPreloadingStats();

console.log('Cache hit rate:', cacheStats.hitRate);
console.log('Healthy providers:', healthMetrics.healthyProviders);
console.log('Preloading active:', preloadingStats.isPreloading);
```

## Configuration

### Environment Variables

```env
# Analytics
MEDIA_SEARCH_ANALYTICS_ENABLED=true
MEDIA_SEARCH_ANALYTICS_RETENTION_DAYS=30

# Personalization
MEDIA_SEARCH_PERSONALIZATION_ENABLED=true
MEDIA_SEARCH_MAX_USER_PROFILES=10000

# Preloading
MEDIA_SEARCH_PRELOADING_ENABLED=true
MEDIA_SEARCH_PRELOADING_INTERVAL=1800000
MEDIA_SEARCH_MAX_CONCURRENT_PRELOADS=5

# Caching
MEDIA_SEARCH_CACHE_SIZE=1000
MEDIA_SEARCH_CACHE_EXPIRY_MINUTES=30
```

### Service Configuration

```typescript
const config = {
    analytics: {
        enabled: true,
        maxEvents: 10000,
        retentionDays: 30,
    },
    personalization: {
        enabled: true,
        maxUserProfiles: 10000,
        behaviorWeights: {
            provider: 0.4,
            tags: 0.3,
            aspectRatio: 0.15,
            color: 0.1,
            photographer: 0.05,
        },
    },
    preloading: {
        enabled: true,
        interval: 30 * 60 * 1000,
        maxConcurrent: 5,
        strategies: {
            popular: true,
            category: true,
            user: true,
            trending: true,
            seasonal: false,
        },
    },
};
```

## Future Enhancements

1. **Machine Learning Integration**: AI-powered relevance scoring
2. **A/B Testing Framework**: Systematic feature optimization
3. **Real-time Analytics**: Live performance monitoring
4. **Advanced Personalization**: Deep learning user models
5. **Collaborative Filtering**: User similarity-based recommendations
6. **Semantic Search**: Natural language query understanding
7. **Visual Search**: Image-based search capabilities
8. **Voice Search**: Speech-to-text search integration

## Troubleshooting

### Common Issues

1. **Slow Search Performance**: Check provider health and cache hit rates
2. **Poor Suggestions**: Verify analytics data collection
3. **Personalization Not Working**: Ensure user ID is provided consistently
4. **Preloading Failures**: Check network connectivity and API limits
5. **Memory Usage**: Monitor cache size and cleanup expired entries

### Debug Tools

```typescript
// Enable debug logging
const searchService = new AdvancedSearchService();
searchService.enableDebugLogging(true);

// Get detailed metrics
const diagnostics = {
    cache: searchService.getCacheStats(),
    health: searchService.getServiceHealth(),
    analytics: analyticsService.exportData(),
};
```

This comprehensive implementation provides a robust foundation for advanced media search capabilities with significant performance improvements and user experience enhancements.
