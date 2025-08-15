import { MediaSearchServiceFactory } from '../MediaSearchServiceFactory';
import { MediaProviderInitializer } from '../MediaProviderInitializer';

/**
 * Debug utility to diagnose media search issues
 */
export class MediaSearchDebugger {
    static async diagnoseIssues(): Promise<{
        status: 'working' | 'partial' | 'broken';
        issues: string[];
        warnings: string[];
        recommendations: string[];
        providerStatus: Record<string, any>;
        environmentConfig: any;
    }> {
        const issues: string[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];
        let status: 'working' | 'partial' | 'broken' = 'working';

        console.log('🔍 Starting Media Search Diagnostics...');

        // 1. Check environment variables
        console.log('📋 Checking environment configuration...');
        const envCheck = this.checkEnvironmentVariables();
        if (envCheck.issues.length > 0) {
            issues.push(...envCheck.issues);
            status = 'broken';
        }
        if (envCheck.warnings.length > 0) {
            warnings.push(...envCheck.warnings);
            if (status === 'working') status = 'partial';
        }

        // 2. Test provider initialization
        console.log('🚀 Testing provider initialization...');
        const initResult = await this.testProviderInitialization();
        if (!initResult.success) {
            issues.push(`Provider initialization failed: ${initResult.error}`);
            status = 'broken';
        }

        // 3. Test service creation
        console.log('🔧 Testing service creation...');
        const serviceResult = await this.testServiceCreation();
        if (!serviceResult.success) {
            issues.push(`Service creation failed: ${serviceResult.error}`);
            status = 'broken';
        }

        // 4. Test actual search functionality
        if (status !== 'broken') {
            console.log('🔍 Testing search functionality...');
            const searchResult = await this.testSearchFunctionality();
            if (!searchResult.success) {
                issues.push(
                    `Search functionality failed: ${searchResult.error}`
                );
                status = searchResult.partial ? 'partial' : 'broken';
            }
        }

        // 5. Generate recommendations
        recommendations.push(...this.generateRecommendations(issues, warnings));

        const result = {
            status,
            issues,
            warnings,
            recommendations,
            providerStatus: initResult.providerStatus || {},
            environmentConfig: envCheck.config,
        };

        console.log('📊 Diagnostics Complete:', result);
        return result;
    }

    private static checkEnvironmentVariables(): {
        issues: string[];
        warnings: string[];
        config: any;
    } {
        const issues: string[] = [];
        const warnings: string[] = [];

        const config = {
            unsplash: {
                accessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY,
                secretKey: process.env.NEXT_PUBLIC_UNSPLASH_SECRET_KEY,
                redirectUri: process.env.NEXT_PUBLIC_UNSPLASH_REDIRECT_URI,
            },
            pexels: {
                apiKey: process.env.NEXT_PUBLIC_PEXELS_API_KEY,
            },
            pixabay: {
                apiKey: process.env.NEXT_PUBLIC_PIXABAY_API_KEY,
            },
        };

        // Check if at least one provider is configured
        const hasUnsplash = !!config.unsplash.accessKey;
        const hasPexels = !!config.pexels.apiKey;
        const hasPixabay = !!config.pixabay.apiKey;

        if (!hasUnsplash && !hasPexels && !hasPixabay) {
            issues.push(
                'No media provider API keys found in environment variables'
            );
        }

        // Check individual providers
        if (!hasUnsplash) {
            warnings.push(
                'Unsplash API key not configured (NEXT_PUBLIC_UNSPLASH_ACCESS_KEY)'
            );
        } else if (config.unsplash.accessKey === 'demo-key') {
            warnings.push(
                'Unsplash is using demo key - functionality will be limited'
            );
        }

        if (!hasPexels) {
            warnings.push(
                'Pexels API key not configured (NEXT_PUBLIC_PEXELS_API_KEY)'
            );
        } else if (config.pexels.apiKey === 'demo-key') {
            warnings.push(
                'Pexels is using demo key - functionality will be limited'
            );
        }

        if (!hasPixabay) {
            warnings.push(
                'Pixabay API key not configured (NEXT_PUBLIC_PIXABAY_API_KEY)'
            );
        } else if (config.pixabay.apiKey === 'demo-key') {
            warnings.push(
                'Pixabay is using demo key - functionality will be limited'
            );
        }

        return { issues, warnings, config };
    }

    private static async testProviderInitialization(): Promise<{
        success: boolean;
        error?: string;
        providerStatus?: any;
    }> {
        try {
            const initializer = MediaProviderInitializer.getInstance();
            const result = await initializer.initialize();

            if (!result.success) {
                return {
                    success: false,
                    error: `Failed to initialize providers: ${result.failedProviders.map((p) => `${p.providerId}: ${p.error}`).join(', ')}`,
                    providerStatus: {
                        initialized: result.initializedProviders,
                        failed: result.failedProviders,
                        warnings: result.warnings,
                    },
                };
            }

            return {
                success: true,
                providerStatus: {
                    initialized: result.initializedProviders,
                    failed: result.failedProviders,
                    warnings: result.warnings,
                },
            };
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unknown initialization error',
            };
        }
    }

    private static async testServiceCreation(): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const service = await MediaSearchServiceFactory.create();

            if (!service.isReady()) {
                const readinessError = service.getReadinessError();
                return {
                    success: false,
                    error: readinessError || 'Service is not ready',
                };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unknown service creation error',
            };
        }
    }

    private static async testSearchFunctionality(): Promise<{
        success: boolean;
        partial?: boolean;
        error?: string;
    }> {
        try {
            const service = await MediaSearchServiceFactory.create();

            // Test basic search
            const result = await service.searchMedia({
                query: 'test',
                page: 1,
                perPage: 5,
            });

            if (result.items.length === 0) {
                // Check if it's a provider issue or search issue
                const providers = service.getAvailableProviders();
                const healthyProviders = service.getHealthyProviders();

                if (providers.length === 0) {
                    return {
                        success: false,
                        error: 'No providers available',
                    };
                }

                if (healthyProviders.length === 0) {
                    return {
                        success: false,
                        error: 'No healthy providers available',
                    };
                }

                if (healthyProviders.length < providers.length) {
                    return {
                        success: true,
                        partial: true,
                        error: `Only ${healthyProviders.length} of ${providers.length} providers are healthy`,
                    };
                }

                return {
                    success: false,
                    error: 'Search returned no results - possible API key or network issue',
                };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unknown search error',
            };
        }
    }

    private static generateRecommendations(
        issues: string[],
        warnings: string[]
    ): string[] {
        const recommendations: string[] = [];

        if (issues.some((issue) => issue.includes('API keys'))) {
            recommendations.push(
                'Set up API keys for at least one media provider (Unsplash, Pexels, or Pixabay)'
            );
            recommendations.push(
                'Check the .env file and ensure NEXT_PUBLIC_* environment variables are set'
            );
        }

        if (issues.some((issue) => issue.includes('initialization'))) {
            recommendations.push(
                'Check network connectivity and API key validity'
            );
            recommendations.push(
                'Verify that the API keys have the correct permissions'
            );
        }

        if (issues.some((issue) => issue.includes('Service creation'))) {
            recommendations.push(
                'Check for missing dependencies or circular imports'
            );
            recommendations.push(
                'Verify that all required service files are present'
            );
        }

        if (warnings.some((warning) => warning.includes('demo key'))) {
            recommendations.push(
                'Replace demo API keys with real API keys for full functionality'
            );
        }

        if (recommendations.length === 0) {
            recommendations.push(
                'Media search system appears to be configured correctly'
            );
        }

        return recommendations;
    }

    /**
     * Quick test function that can be called from browser console
     */
    static async quickTest(): Promise<void> {
        console.log('🚀 Running Quick Media Search Test...');

        try {
            const result = await this.diagnoseIssues();

            console.log(`\n📊 Status: ${result.status.toUpperCase()}`);

            if (result.issues.length > 0) {
                console.log('\n❌ Issues Found:');
                result.issues.forEach((issue) => console.log(`  • ${issue}`));
            }

            if (result.warnings.length > 0) {
                console.log('\n⚠️ Warnings:');
                result.warnings.forEach((warning) =>
                    console.log(`  • ${warning}`)
                );
            }

            if (result.recommendations.length > 0) {
                console.log('\n💡 Recommendations:');
                result.recommendations.forEach((rec) =>
                    console.log(`  • ${rec}`)
                );
            }

            console.log('\n🔧 Provider Status:', result.providerStatus);
        } catch (error) {
            console.error('❌ Quick test failed:', error);
        }
    }
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
    (window as any).MediaSearchDebugger = MediaSearchDebugger;
}
