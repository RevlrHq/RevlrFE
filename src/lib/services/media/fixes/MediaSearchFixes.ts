import { MediaSearchServiceFactory } from '../MediaSearchServiceFactory';
import { MediaProviderInitializer } from '../MediaProviderInitializer';

/**
 * Collection of fixes for common media search issues
 */
export class MediaSearchFixes {
    /**
     * Fix 1: Environment variable configuration issue
     * The MediaSearchServiceFactory is looking for different env var names than what's in .env
     */
    static fixEnvironmentVariables(): void {
        console.log('🔧 Applying environment variable fixes...');

        // The factory expects UNSPLASH_SECRET_KEY but .env has NEXT_PUBLIC_UNSPLASH_SECRET_KEY
        if (
            typeof window === 'undefined' &&
            process.env.NEXT_PUBLIC_UNSPLASH_SECRET_KEY
        ) {
            process.env.UNSPLASH_SECRET_KEY =
                process.env.NEXT_PUBLIC_UNSPLASH_SECRET_KEY;
        }

        // Ensure all required variables are available
        const requiredVars = [
            'NEXT_PUBLIC_UNSPLASH_ACCESS_KEY',
            'NEXT_PUBLIC_PEXELS_API_KEY',
            'NEXT_PUBLIC_PIXABAY_API_KEY',
        ];

        const missing = requiredVars.filter((varName) => !process.env[varName]);
        if (missing.length > 0) {
            console.warn('⚠️ Missing environment variables:', missing);
        }
    }

    /**
     * Fix 2: Create a simplified service factory that bypasses complex initialization
     */
    static async createSimplifiedService() {
        console.log('🔧 Creating simplified media search service...');

        try {
            // Apply environment fixes first
            this.fixEnvironmentVariables();

            // Create service with minimal configuration
            const service = await MediaSearchServiceFactory.create({
                cacheSize: 100,
                cacheExpiryMinutes: 15,
                enabledProviders: this.getAvailableProviders(),
            });

            console.log('✅ Simplified service created successfully');
            return service;
        } catch (error) {
            console.debug('❌ Failed to create simplified service:', error);
            throw error;
        }
    }

    /**
     * Fix 3: Get available providers based on environment configuration
     */
    static getAvailableProviders(): string[] {
        const providers: string[] = [];

        if (
            process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY &&
            process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY !== 'demo-key'
        ) {
            providers.push('unsplash');
        }

        if (
            process.env.NEXT_PUBLIC_PEXELS_API_KEY &&
            process.env.NEXT_PUBLIC_PEXELS_API_KEY !== 'demo-key'
        ) {
            providers.push('pexels');
        }

        if (
            process.env.NEXT_PUBLIC_PIXABAY_API_KEY &&
            process.env.NEXT_PUBLIC_PIXABAY_API_KEY !== 'demo-key'
        ) {
            providers.push('pixabay');
        }

        console.log('📋 Available providers:', providers);
        return providers;
    }

    /**
     * Fix 4: Test individual provider functionality
     */
    static async testProviders() {
        console.log('🧪 Testing individual providers...');

        const results = {
            unsplash: { available: false, error: null as string | null },
            pexels: { available: false, error: null as string | null },
            pixabay: { available: false, error: null as string | null },
        };

        // Test Unsplash
        if (process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY) {
            try {
                const response = await fetch(
                    'https://api.unsplash.com/photos?per_page=1',
                    {
                        headers: {
                            Authorization: `Client-ID ${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`,
                        },
                    }
                );

                if (response.ok) {
                    results.unsplash.available = true;
                    console.log('✅ Unsplash API is working');
                } else {
                    results.unsplash.error = `HTTP ${response.status}: ${response.statusText}`;
                    console.log(
                        '❌ Unsplash API error:',
                        results.unsplash.error
                    );
                }
            } catch (error) {
                results.unsplash.error =
                    error instanceof Error ? error.message : 'Unknown error';
                console.log('❌ Unsplash API error:', results.unsplash.error);
            }
        }

        // Test Pexels
        if (process.env.NEXT_PUBLIC_PEXELS_API_KEY) {
            try {
                const response = await fetch(
                    'https://api.pexels.com/v1/curated?per_page=1',
                    {
                        headers: {
                            Authorization:
                                process.env.NEXT_PUBLIC_PEXELS_API_KEY,
                        },
                    }
                );

                if (response.ok) {
                    results.pexels.available = true;
                    console.log('✅ Pexels API is working');
                } else {
                    results.pexels.error = `HTTP ${response.status}: ${response.statusText}`;
                    console.log('❌ Pexels API error:', results.pexels.error);
                }
            } catch (error) {
                results.pexels.error =
                    error instanceof Error ? error.message : 'Unknown error';
                console.log('❌ Pexels API error:', results.pexels.error);
            }
        }

        // Test Pixabay
        if (process.env.NEXT_PUBLIC_PIXABAY_API_KEY) {
            try {
                const response = await fetch(
                    `https://pixabay.com/api/?key=${process.env.NEXT_PUBLIC_PIXABAY_API_KEY}&q=test&per_page=3`
                );

                if (response.ok) {
                    results.pixabay.available = true;
                    console.log('✅ Pixabay API is working');
                } else {
                    results.pixabay.error = `HTTP ${response.status}: ${response.statusText}`;
                    console.log('❌ Pixabay API error:', results.pixabay.error);
                }
            } catch (error) {
                results.pixabay.error =
                    error instanceof Error ? error.message : 'Unknown error';
                console.log('❌ Pixabay API error:', results.pixabay.error);
            }
        }

        return results;
    }

    /**
     * Fix 5: Create a working media search service with fallbacks
     */
    static async createWorkingService() {
        console.log('🚀 Creating working media search service...');

        try {
            // First, test which providers are actually working
            const providerTests = await this.testProviders();
            const workingProviders = Object.entries(providerTests)
                .filter(([_, result]) => result.available)
                .map(([provider, _]) => provider);

            if (workingProviders.length === 0) {
                throw new Error(
                    'No working providers found. Please check your API keys.'
                );
            }

            console.log('🎯 Working providers:', workingProviders);

            // Apply environment fixes
            this.fixEnvironmentVariables();

            // Create service with only working providers
            const service = await MediaSearchServiceFactory.create({
                cacheSize: 100,
                cacheExpiryMinutes: 15,
                enabledProviders: workingProviders,
            });

            // Verify service is ready
            if (!service.isReady()) {
                const error = service.getReadinessError();
                throw new Error(`Service not ready: ${error}`);
            }

            console.log('✅ Working media search service created successfully');
            return service;
        } catch (error) {
            console.debug('❌ Failed to create working service:', error);
            throw error;
        }
    }

    /**
     * Fix 6: Comprehensive diagnostic and repair
     */
    static async diagnoseAndFix() {
        console.log(
            '🔍 Starting comprehensive media search diagnosis and repair...'
        );

        const report = {
            environmentIssues: [] as string[],
            providerIssues: [] as string[],
            serviceIssues: [] as string[],
            fixes: [] as string[],
            workingService: null as any,
        };

        // Step 1: Check environment
        console.log('📋 Step 1: Checking environment...');
        const availableProviders = this.getAvailableProviders();
        if (availableProviders.length === 0) {
            report.environmentIssues.push('No API keys configured');
        } else {
            report.fixes.push(
                `Found ${availableProviders.length} configured providers`
            );
        }

        // Step 2: Test providers
        console.log('🧪 Step 2: Testing providers...');
        const providerTests = await this.testProviders();
        const workingProviders = Object.entries(providerTests)
            .filter(([_, result]) => result.available)
            .map(([provider, _]) => provider);

        Object.entries(providerTests).forEach(([provider, result]) => {
            if (!result.available && result.error) {
                report.providerIssues.push(`${provider}: ${result.error}`);
            }
        });

        if (workingProviders.length === 0) {
            report.serviceIssues.push('No working providers available');
            return report;
        }

        // Step 3: Create working service
        console.log('🔧 Step 3: Creating working service...');
        try {
            const service = await this.createWorkingService();
            report.workingService = service;
            report.fixes.push(
                'Successfully created working media search service'
            );

            // Step 4: Test search functionality
            console.log('🔍 Step 4: Testing search functionality...');
            const searchResult = await service.searchMedia({
                query: 'business meeting',
                page: 1,
                perPage: 5,
            });

            if (searchResult.items.length > 0) {
                report.fixes.push(
                    `Search test successful: found ${searchResult.items.length} items`
                );
            } else {
                report.serviceIssues.push('Search returned no results');
            }
        } catch (error) {
            report.serviceIssues.push(
                `Service creation failed: ${error instanceof Error ? error.message : error}`
            );
        }

        // Generate summary
        console.log('\n📊 Diagnosis Summary:');
        console.log('Environment Issues:', report.environmentIssues);
        console.log('Provider Issues:', report.providerIssues);
        console.log('Service Issues:', report.serviceIssues);
        console.log('Applied Fixes:', report.fixes);

        return report;
    }

    /**
     * Fix 7: Quick fix for useMediaSearch hook
     */
    static getFixedUseMediaSearchConfig() {
        return {
            // Disable complex initialization that might be failing
            preloadPopular: false,
            enableAutoSuggestions: false,
            debounceDelay: 1000, // Longer delay to reduce API calls
            maxSelectedItems: 5, // Reduce complexity
            selectionLimits: {
                maxItems: 5,
                maxFileSize: 10 * 1024 * 1024, // 10MB
                allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
            },
        };
    }

    /**
     * Emergency fallback: Create a minimal working service
     */
    static async createEmergencyService() {
        console.log('🚨 Creating emergency fallback service...');

        // Just try to create the most basic service possible
        try {
            this.fixEnvironmentVariables();

            // Try with just one provider
            const providers = this.getAvailableProviders();
            if (providers.length === 0) {
                throw new Error('No providers available');
            }

            const service = await MediaSearchServiceFactory.create({
                enabledProviders: [providers[0]], // Just use the first available
                cacheSize: 10,
                cacheExpiryMinutes: 5,
            });

            console.log(
                '✅ Emergency service created with provider:',
                providers[0]
            );
            return service;
        } catch (error) {
            console.debug('❌ Emergency service creation failed:', error);
            throw error;
        }
    }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
    (window as any).MediaSearchFixes = MediaSearchFixes;
}
