# Media Search Infrastructure

This directory contains the core infrastructure for the Event Media Search Integration feature. It provides a provider-agnostic architecture for searching, caching, and managing media from multiple external providers like Unsplash, Pexels, and Pixabay.

## Architecture Overview

The infrastructure consists of four main components:

1. **MediaProvider** - Abstract base class for media provider implementations
2. **MediaSearchService** - Coordinates multiple providers and handles search operations
3. **MediaSearchCache** - LRU cache for search results and popular queries
4. **Configuration** - Environment-based configuration for API keys and settings

## Quick Start

### 1. Environment Setup

Add the required environment variables to your `.env` file:

```bash
# Media Provider API Keys
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
PEXELS_API_KEY=your_pexels_api_key
PIXABAY_API_KEY=your_pixabay_api_key

# Optional Configuration
MEDIA_CACHE_SIZE=1000
MEDIA_CACHE_EXPIRY_MINUTES=30
ENABLE_ATTRIBUTION_TRACKING=true
```

### 2. Basic Usage

```typescript
import { MediaSearchService } from '@/lib/services/media';

// Create service instance
const mediaService = new MediaSearchService();

// Register providers (will be done automatically in actual implementation)
// mediaService.registerProvider(new UnsplashProvider(config));

// Search for media
const results = await mediaService.searchMedia({
    query: 'conference',
    filters: {
        orientation: 'landscape',
        minWidth: 800,
        minHeight: 600,
    },
    page: 1,
    perPage: 20,
});

// Get popular media
const popular = await mediaService.getPopularMedia('business');

// Get search suggestions
const suggestions = await mediaService.getSuggestions('conf');
```

## Components

### MediaProvider (Abstract Base Class)

Provides the foundation for all media provider implementations:

```typescript
abstract class MediaProvider {
    abstract search(query: MediaSearchQuery): Promise<ProviderResult>;
    abstract getPopular(category?: string): Promise<ProviderResult>;
    abstract downloadMedia(item: MediaItem): Promise<Blob>;

    // Built-in rate limiting and error handling
    protected checkRateLimit(): boolean;
    protected handleError(error: unknown): MediaProviderError;
}
```

**Key Features:**

- Automatic rate limiting
- Error categorization and handling
- Health score tracking
- Request/response logging

### MediaSearchService

Coordinates multiple providers and provides unified search interface:

```typescript
class MediaSearchService {
    // Provider management
    registerProvider(provider: MediaProvider): void;
    getHealthyProviders(): MediaProvider[];

    // Search operations
    searchMedia(query: MediaSearchQuery): Promise<MediaSearchResult>;
    getPopularMedia(category?: string): Promise<MediaSearchResult>;
    getSuggestions(query: string): Promise<string[]>;

    // Cache management
    clearCache(): void;
    preloadPopularSearches(): Promise<void>;
}
```

**Key Features:**

- Multi-provider search coordination
- Automatic failover and error recovery
- Result deduplication and sorting
- Intelligent caching

### MediaSearchCache

LRU cache with expiry for search results:

```typescript
class MediaSearchCache {
    set(query: string, result: MediaSearchResult): void;
    get(query: string): MediaSearchResult | null;

    // Cache management
    clear(): void;
    cleanupExpired(): number;
    getStats(): CacheStats;

    // Preloading
    preloadPopularSearches(searchFn: Function): Promise<void>;
    warmCache(queries: string[], searchFn: Function): Promise<void>;
}
```

**Key Features:**

- LRU eviction policy
- Automatic expiry handling
- Usage statistics tracking
- Popular query preloading

## Configuration

### Environment Variables

| Variable                      | Description                    | Default |
| ----------------------------- | ------------------------------ | ------- |
| `UNSPLASH_ACCESS_KEY`         | Unsplash API access key        | -       |
| `PEXELS_API_KEY`              | Pexels API key                 | -       |
| `PIXABAY_API_KEY`             | Pixabay API key                | -       |
| `MEDIA_CACHE_SIZE`            | Maximum cache entries          | 1000    |
| `MEDIA_CACHE_EXPIRY_MINUTES`  | Cache expiry time              | 30      |
| `ENABLE_ATTRIBUTION_TRACKING` | Track attribution requirements | true    |
| `MAX_SELECTED_IMAGES`         | Maximum images per selection   | 10      |

### Provider Configuration

Each provider has its own configuration including:

- API endpoints and authentication
- Rate limiting settings
- Health monitoring parameters
- Error handling policies

## Error Handling

The infrastructure provides comprehensive error handling:

### Error Types

- `RATE_LIMIT_EXCEEDED` - Provider rate limit reached
- `API_KEY_INVALID` - Authentication failure
- `NETWORK_ERROR` - Network connectivity issues
- `PROVIDER_UNAVAILABLE` - Provider service down
- `SEARCH_FAILED` - Generic search failure

### Recovery Actions

- **Disable Temporarily** - Disable provider for specified duration
- **Retry with Backoff** - Exponential backoff retry
- **Show Error** - Display error to user

### Graceful Degradation

- Automatic provider fallback
- Partial results when some providers fail
- User-friendly error messages

## Performance Features

### Caching Strategy

- LRU eviction with configurable size limits
- Time-based expiry for fresh results
- Popular query preloading
- Cache hit rate monitoring

### Rate Limiting

- Per-provider rate limit tracking
- Automatic request throttling
- Health score-based provider selection

### Result Optimization

- Duplicate removal across providers
- Relevance-based sorting
- Progressive loading support

## Testing

The infrastructure includes comprehensive tests:

```bash
# Run media infrastructure tests
npm test -- --testPathPattern=MediaSearchInfrastructure.test.ts
```

Test coverage includes:

- Unit tests for all core classes
- Integration tests for service coordination
- Error handling and recovery scenarios
- Cache behavior and performance

## Next Steps

This infrastructure provides the foundation for:

1. **Provider Implementations** - Concrete implementations for Unsplash, Pexels, Pixabay
2. **UI Components** - React components for search interface
3. **Integration** - Integration with existing ImageUpload component
4. **Analytics** - Usage tracking and performance monitoring

## API Reference

For detailed API documentation, see the TypeScript interfaces in:

- `@/types/media-search.ts` - Core type definitions
- `@/lib/config/media-providers.ts` - Configuration options
- Individual class files for implementation details
