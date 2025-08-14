# Media Providers

This directory contains implementations of media providers for the Event Media Search Integration feature.

## Overview

Media providers are responsible for integrating with external APIs to search, preview, and download media content. Each provider extends the base `MediaProvider` class and implements the required interface methods.

## Implemented Providers

### UnsplashProvider

The `UnsplashProvider` integrates with the Unsplash API to provide access to high-quality stock photography.

**Features:**

- Search photos using keywords, filters, and pagination
- Get popular/featured photos by category
- Download images with proper attribution tracking
- Rate limiting and error handling
- Health monitoring and automatic recovery
- License compliance and attribution management

**API Integration:**

- Uses Unsplash API v1
- Requires `UNSPLASH_ACCESS_KEY` environment variable
- Supports 50 requests per hour (demo app limit)
- Implements proper download tracking as required by Unsplash

**Attribution Requirements:**

- All Unsplash photos require attribution
- Attribution format: "Photo by [Photographer Name] on Unsplash"
- Attribution can be placed in image captions, event descriptions, or footer
- Includes photographer profile links and photo URLs

**Search Features:**

- Keyword-based search with relevance ranking
- Orientation filters (landscape, portrait, square)
- Color filters (black_and_white, black, white, yellow, orange, red, purple, magenta, green, teal, blue)
- Category-based suggestions using featured collections
- Pagination with infinite scroll support

**Quality Validation:**

- Minimum resolution recommendations (800x600)
- Aspect ratio validation for common use cases
- File size and dimension information
- Quality warnings for low-resolution images

**Error Handling:**

- Graceful degradation when API is unavailable
- Rate limit detection and automatic backoff
- Network error recovery with retry logic
- Health score tracking for provider reliability

## Usage

```typescript
import { createProvider } from '@/lib/services/media/providers';
import { MEDIA_PROVIDER_CONFIGS } from '@/lib/config/media-providers';

// Create provider instance
const provider = createProvider('unsplash', MEDIA_PROVIDER_CONFIGS.unsplash);

// Search for images
const result = await provider.search({
    query: 'conference',
    page: 1,
    perPage: 20,
    filters: {
        orientation: 'landscape',
        color: 'blue',
    },
});

// Get popular images for a category
const popular = await provider.getPopular('business');

// Download an image
const blob = await provider.downloadMedia(mediaItem);
```

## Configuration

Provider configurations are managed in `src/lib/config/media-providers.ts`:

```typescript
export const MEDIA_PROVIDER_CONFIGS = {
    unsplash: {
        apiKey: process.env.UNSPLASH_ACCESS_KEY,
        secretKey: process.env.UNSPLASH_SECRET_KEY,
        baseUrl: 'https://api.unsplash.com',
        rateLimit: { requests: 50, window: 3600 },
        enabled: !!process.env.UNSPLASH_ACCESS_KEY,
    },
    // ... other providers
};
```

## Testing

Comprehensive test suites are available:

- `UnsplashProvider.test.ts` - Unit tests for Unsplash provider
- `providers-integration.test.ts` - Integration tests for provider factory

Run tests with:

```bash
npm test -- --testPathPattern=UnsplashProvider
```

## Adding New Providers

To add a new provider:

1. Create a new class extending `MediaProvider`
2. Implement required abstract methods
3. Add configuration to `media-providers.ts`
4. Update the provider factory in `index.ts`
5. Add comprehensive tests

Example structure:

```typescript
export class NewProvider extends MediaProvider {
    readonly id = 'new-provider';
    readonly name = 'New Provider';
    readonly baseUrl = 'https://api.newprovider.com';
    readonly rateLimit: RateLimit;

    async search(query: MediaSearchQuery): Promise<ProviderResult> {
        // Implementation
    }

    async getPopular(category?: string): Promise<ProviderResult> {
        // Implementation
    }

    async downloadMedia(item: MediaItem): Promise<Blob> {
        // Implementation
    }
}
```

## License Compliance

Each provider must handle license compliance according to the source's requirements:

- **Unsplash**: Requires attribution, allows commercial use
- **Pexels**: (To be implemented) Requires attribution, allows commercial use
- **Pixabay**: (To be implemented) Various licenses, some require attribution

The `AttributionService` helps generate proper attribution text and ensures compliance with each provider's licensing terms.

## Performance Considerations

- Implement proper caching to reduce API calls
- Use rate limiting to stay within API quotas
- Implement health monitoring for automatic failover
- Optimize image downloads with progress tracking
- Use lazy loading for large result sets

## Security

- API keys are managed server-side via environment variables
- All requests include proper User-Agent headers
- Content validation ensures safe media downloads
- Error handling prevents sensitive information leakage
