export { UnsplashProvider } from './UnsplashProvider';
export { PexelsProvider } from './PexelsProvider';
export { PixabayProvider } from './PixabayProvider';

// Export provider factory function
import { UnsplashProvider } from './UnsplashProvider';
import { PexelsProvider } from './PexelsProvider';
import { PixabayProvider } from './PixabayProvider';
import { MediaProvider } from '../MediaProvider';
import { MediaProviderConfig } from '@/types/media-search';

/**
 * Create a provider instance by ID
 */
export function createProvider(
    providerId: string,
    config: MediaProviderConfig
): MediaProvider | null {
    switch (providerId.toLowerCase()) {
        case 'unsplash':
            return new UnsplashProvider(config);
        case 'pexels':
            return new PexelsProvider(config);
        case 'pixabay':
            return new PixabayProvider(config);
        default:
            console.warn(`Unknown provider ID: ${providerId}`);
            return null;
    }
}

/**
 * Get all available provider IDs
 */
export function getAvailableProviderIds(): string[] {
    return ['unsplash', 'pexels', 'pixabay'];
}

/**
 * Check if a provider ID is supported
 */
export function isProviderSupported(providerId: string): boolean {
    return getAvailableProviderIds().includes(providerId.toLowerCase());
}
