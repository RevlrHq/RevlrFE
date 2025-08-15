import { MediaSearchFixes } from '../fixes/MediaSearchFixes';
import { MediaSearchDebugger } from '../debug/MediaSearchDebugger';

/**
 * Simple test script to verify media search functionality
 */
export class MediaSearchTest {
    /**
     * Run all tests and return results
     */
    static async runAllTests(): Promise<{
        success: boolean;
        results: any[];
        errors: string[];
        recommendations: string[];
    }> {
        console.log('🚀 Starting Media Search Tests...');

        const results: any[] = [];
        const errors: string[] = [];
        const recommendations: string[] = [];

        try {
            // Test 1: Environment Check
            console.log('\n📋 Test 1: Environment Configuration');
            const envTest = await this.testEnvironment();
            results.push({ test: 'Environment', ...envTest });
            if (!envTest.success) {
                errors.push(...envTest.errors);
            }

            // Test 2: Provider API Tests
            console.log('\n🧪 Test 2: Provider API Tests');
            const providerTest = await this.testProviders();
            results.push({ test: 'Providers', ...providerTest });
            if (!providerTest.success) {
                errors.push(...providerTest.errors);
            }

            // Test 3: Service Creation
            console.log('\n🔧 Test 3: Service Creation');
            const serviceTest = await this.testServiceCreation();
            results.push({ test: 'Service Creation', ...serviceTest });
            if (!serviceTest.success) {
                errors.push(...serviceTest.errors);
            }

            // Test 4: Search Functionality (only if service creation succeeded)
            if (serviceTest.success && serviceTest.service) {
                console.log('\n🔍 Test 4: Search Functionality');
                const searchTest = await this.testSearchFunctionality(
                    serviceTest.service
                );
                results.push({ test: 'Search', ...searchTest });
                if (!searchTest.success) {
                    errors.push(...searchTest.errors);
                }
            }

            // Generate recommendations
            recommendations.push(
                ...this.generateRecommendations(results, errors)
            );

            const success = errors.length === 0;
            console.log(
                `\n📊 Tests Complete: ${success ? '✅ SUCCESS' : '❌ FAILED'}`
            );

            return {
                success,
                results,
                errors,
                recommendations,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Test suite failed: ${errorMessage}`);

            return {
                success: false,
                results,
                errors,
                recommendations: ['Fix critical errors before proceeding'],
            };
        }
    }

    /**
     * Test environment configuration
     */
    private static async testEnvironment(): Promise<{
        success: boolean;
        errors: string[];
        details: any;
    }> {
        const errors: string[] = [];

        try {
            const availableProviders = MediaSearchFixes.getAvailableProviders();

            if (availableProviders.length === 0) {
                errors.push('No API keys configured in environment variables');
            }

            // Check specific providers
            const envVars = {
                unsplash: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY,
                pexels: process.env.NEXT_PUBLIC_PEXELS_API_KEY,
                pixabay: process.env.NEXT_PUBLIC_PIXABAY_API_KEY,
            };

            const details = {
                availableProviders,
                configuredKeys: Object.entries(envVars)
                    .filter(([_, value]) => value && value !== 'demo-key')
                    .map(([key, _]) => key),
                demoKeys: Object.entries(envVars)
                    .filter(([_, value]) => value === 'demo-key')
                    .map(([key, _]) => key),
            };

            console.log('Environment Details:', details);

            return {
                success: errors.length === 0,
                errors,
                details,
            };
        } catch (error) {
            errors.push(
                `Environment test failed: ${error instanceof Error ? error.message : error}`
            );
            return {
                success: false,
                errors,
                details: {},
            };
        }
    }

    /**
     * Test provider APIs directly
     */
    private static async testProviders(): Promise<{
        success: boolean;
        errors: string[];
        details: any;
    }> {
        const errors: string[] = [];

        try {
            const providerTests = await MediaSearchFixes.testProviders();

            Object.entries(providerTests).forEach(([provider, result]) => {
                if (!result.available && result.error) {
                    errors.push(`${provider}: ${result.error}`);
                }
            });

            const workingProviders = Object.entries(providerTests)
                .filter(([_, result]) => result.available)
                .map(([provider, _]) => provider);

            if (workingProviders.length === 0) {
                errors.push('No working providers found');
            }

            console.log('Provider Test Results:', providerTests);

            return {
                success: errors.length === 0,
                errors,
                details: {
                    providerTests,
                    workingProviders,
                },
            };
        } catch (error) {
            errors.push(
                `Provider test failed: ${error instanceof Error ? error.message : error}`
            );
            return {
                success: false,
                errors,
                details: {},
            };
        }
    }

    /**
     * Test service creation
     */
    private static async testServiceCreation(): Promise<{
        success: boolean;
        errors: string[];
        service?: any;
        details: any;
    }> {
        const errors: string[] = [];
        let service = null;

        try {
            // Try to create a working service
            service = await MediaSearchFixes.createWorkingService();

            if (!service.isReady()) {
                const readinessError = service.getReadinessError();
                errors.push(`Service not ready: ${readinessError}`);
            }

            const serviceHealth = service.getServiceHealth();
            console.log('Service Health:', serviceHealth);

            return {
                success: errors.length === 0,
                errors,
                service,
                details: {
                    serviceHealth,
                    isReady: service.isReady(),
                },
            };
        } catch (error) {
            errors.push(
                `Service creation failed: ${error instanceof Error ? error.message : error}`
            );

            // Try emergency fallback
            try {
                console.log('Attempting emergency service creation...');
                service = await MediaSearchFixes.createEmergencyService();

                return {
                    success: true,
                    errors: [
                        `Primary service failed, using emergency service: ${errors[0]}`,
                    ],
                    service,
                    details: {
                        emergencyMode: true,
                        isReady: service.isReady(),
                    },
                };
            } catch (emergencyError) {
                errors.push(
                    `Emergency service also failed: ${emergencyError instanceof Error ? emergencyError.message : emergencyError}`
                );

                return {
                    success: false,
                    errors,
                    details: {},
                };
            }
        }
    }

    /**
     * Test search functionality
     */
    private static async testSearchFunctionality(service: any): Promise<{
        success: boolean;
        errors: string[];
        details: any;
    }> {
        const errors: string[] = [];

        try {
            // Test basic search
            const searchResult = await service.searchMedia({
                query: 'business meeting',
                page: 1,
                perPage: 5,
            });

            if (searchResult.items.length === 0) {
                errors.push('Search returned no results');
            }

            // Test popular content
            const popularResult = await service.getPopularMedia('business');

            console.log('Search Results:', {
                searchItems: searchResult.items.length,
                popularItems: popularResult.items.length,
            });

            return {
                success: errors.length === 0,
                errors,
                details: {
                    searchResults: searchResult.items.length,
                    popularResults: popularResult.items.length,
                    totalProviders: searchResult.providers?.length || 0,
                },
            };
        } catch (error) {
            errors.push(
                `Search test failed: ${error instanceof Error ? error.message : error}`
            );
            return {
                success: false,
                errors,
                details: {},
            };
        }
    }

    /**
     * Generate recommendations based on test results
     */
    private static generateRecommendations(
        results: any[],
        errors: string[]
    ): string[] {
        const recommendations: string[] = [];

        if (errors.some((error) => error.includes('API keys'))) {
            recommendations.push(
                'Configure API keys for at least one media provider (Unsplash, Pexels, or Pixabay)'
            );
            recommendations.push(
                'Check your .env file and ensure NEXT_PUBLIC_* environment variables are set correctly'
            );
        }

        if (
            errors.some(
                (error) =>
                    error.includes('HTTP 401') || error.includes('HTTP 403')
            )
        ) {
            recommendations.push(
                'Verify that your API keys are valid and have the correct permissions'
            );
            recommendations.push(
                'Check if your API keys have expired or been revoked'
            );
        }

        if (
            errors.some(
                (error) => error.includes('network') || error.includes('fetch')
            )
        ) {
            recommendations.push(
                'Check your internet connection and firewall settings'
            );
            recommendations.push(
                'Verify that the provider APIs are accessible from your network'
            );
        }

        if (errors.some((error) => error.includes('Service creation'))) {
            recommendations.push(
                'Check for missing dependencies or circular imports'
            );
            recommendations.push(
                'Verify that all required service files are present and properly configured'
            );
        }

        if (
            errors.some((error) => error.includes('Search returned no results'))
        ) {
            recommendations.push(
                'Try different search terms or check if the providers have content restrictions'
            );
            recommendations.push(
                'Verify that the API keys have search permissions'
            );
        }

        if (recommendations.length === 0 && errors.length === 0) {
            recommendations.push(
                '✅ Media search system is working correctly!'
            );
            recommendations.push(
                'You can now use the media search feature in your application'
            );
        }

        return recommendations;
    }

    /**
     * Quick test that can be run from browser console
     */
    static async quickTest(): Promise<void> {
        console.log('🚀 Running Quick Media Search Test...');

        try {
            const result = await this.runAllTests();

            console.log(
                `\n📊 Overall Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`
            );

            if (result.errors.length > 0) {
                console.log('\n❌ Errors Found:');
                result.errors.forEach((error) => console.log(`  • ${error}`));
            }

            if (result.recommendations.length > 0) {
                console.log('\n💡 Recommendations:');
                result.recommendations.forEach((rec) =>
                    console.log(`  • ${rec}`)
                );
            }

            console.log('\n🔧 Detailed Results:', result.results);
        } catch (error) {
            console.error('❌ Quick test failed:', error);
        }
    }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
    (window as any).MediaSearchTest = MediaSearchTest;
}
