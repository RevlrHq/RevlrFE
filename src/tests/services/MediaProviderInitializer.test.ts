import { MediaProviderInitializer } from '@/lib/services/media/MediaProviderInitializer';
import {
    MediaProviderFactory,
    ProviderConfiguration,
} from '@/lib/services/media/MediaProviderFactory';
import { MediaProvider } from '@/lib/services/media/MediaProvider';

// Mock the MediaProviderFactory
jest.mock('@/lib/services/media/MediaProviderFactory');

// Mock environment variables
const mockEnv = {
    NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: 'test-unsplash-key',
    NEXT_PUBLIC_PEXELS_API_KEY: 'test-pexels-key',
    NEXT_PUBLIC_MEDIA_CACHE_SIZE: '500',
    NEXT_PUBLIC_MEDIA_CACHE_EXPIRY_MINUTES: '15',
};

// Mock process.env
const originalEnv = process.env;

// Type for private methods
type MediaProviderInitializerPrivate = {
    parseEnvironmentConfiguration: () => NonNullable<
        ReturnType<MediaProviderInitializer['getEnvironmentConfiguration']>
    >;
    validateConfiguration: (
        config: NonNullable<
            ReturnType<MediaProviderInitializer['getEnvironmentConfiguration']>
        >
    ) => { isValid: boolean; errors: string[]; warnings: string[] };
    convertToProviderConfiguration: (
        config: NonNullable<
            ReturnType<MediaProviderInitializer['getEnvironmentConfiguration']>
        >
    ) => ProviderConfiguration;
    environmentConfig: NonNullable<
        ReturnType<MediaProviderInitializer['getEnvironmentConfiguration']>
    >;
    initializationStatus: ReturnType<
        MediaProviderInitializer['getInitializationStatus']
    >;
};

describe('MediaProviderInitializer', () => {
    let initializer: MediaProviderInitializer;
    let mockProviderFactory: jest.Mocked<MediaProviderFactory>;

    beforeEach(() => {
        // Clear all media-related environment variables first
        const cleanEnv = { ...originalEnv };
        delete cleanEnv.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
        delete cleanEnv.UNSPLASH_ACCESS_KEY;
        delete cleanEnv.UNSPLASH_SECRET_KEY;
        delete cleanEnv.NEXT_PUBLIC_PEXELS_API_KEY;
        delete cleanEnv.PEXELS_API_KEY;
        delete cleanEnv.NEXT_PUBLIC_PIXABAY_API_KEY;
        delete cleanEnv.PIXABAY_API_KEY;
        delete cleanEnv.NEXT_PUBLIC_MEDIA_CACHE_SIZE;
        delete cleanEnv.NEXT_PUBLIC_MEDIA_CACHE_EXPIRY_MINUTES;

        // Set test environment
        process.env = { ...cleanEnv, ...mockEnv };

        // Reset singleton instance
        (
            MediaProviderInitializer as unknown as {
                instance: MediaProviderInitializer | undefined;
            }
        ).instance = undefined;

        // Create mock provider factory
        mockProviderFactory = {
            initialize: jest.fn(),
            getProvider: jest.fn(),
            shutdown: jest.fn(),
            isFactoryInitialized: jest.fn(),
            getInitializationErrors: jest.fn(),
            getAllProviders: jest.fn(),
            getHealthyProviders: jest.fn(),
            getHealthMonitor: jest.fn(),
        } as unknown as jest.Mocked<MediaProviderFactory>;

        // Mock MediaProviderFactory.getInstance to return our mock
        (MediaProviderFactory.getInstance as jest.Mock).mockReturnValue(
            mockProviderFactory
        );

        initializer = MediaProviderInitializer.getInstance();
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.clearAllMocks();
    });

    describe('getInstance', () => {
        it('should return singleton instance', () => {
            const instance1 = MediaProviderInitializer.getInstance();
            const instance2 = MediaProviderInitializer.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe('getInitializationStatus', () => {
        it('should return initial status before initialization', () => {
            const status = initializer.getInitializationStatus();

            expect(status.isInitialized).toBe(false);
            expect(status.availableProviders).toEqual([]);
            expect(status.failedProviders).toEqual([]);
            expect(status.errors).toEqual([]);
            expect(status.warnings).toEqual([]);
            expect(status.lastInitialized).toBeNull();
            expect(status.configurationValid).toBe(false);
        });
    });

    describe('parseEnvironmentConfiguration', () => {
        it('should parse environment variables correctly', () => {
            const config = (
                initializer as unknown as MediaProviderInitializerPrivate
            ).parseEnvironmentConfiguration();

            expect(config.unsplash.accessKey).toBe('test-unsplash-key');
            expect(config.unsplash.enabled).toBe(true);
            expect(config.pexels.apiKey).toBe('test-pexels-key');
            expect(config.pexels.enabled).toBe(true);
            expect(config.pixabay.enabled).toBe(false); // No API key provided
            expect(config.cache.size).toBe(500);
            expect(config.cache.expiryMinutes).toBe(15);
        });

        it('should handle missing environment variables', () => {
            // Create a clean environment without media-related variables
            const cleanEnv = { ...originalEnv };
            Object.keys(originalEnv).forEach((key) => {
                if (
                    key.includes('UNSPLASH') ||
                    key.includes('PEXELS') ||
                    key.includes('PIXABAY') ||
                    key.includes('MEDIA_')
                ) {
                    delete cleanEnv[key];
                }
            });
            process.env = cleanEnv;

            const config = (
                initializer as unknown as MediaProviderInitializerPrivate
            ).parseEnvironmentConfiguration();

            expect(config.unsplash.enabled).toBe(false);
            expect(config.pexels.enabled).toBe(false);
            expect(config.pixabay.enabled).toBe(false);
            expect(config.cache.size).toBe(1000); // Default value
            expect(config.cache.expiryMinutes).toBe(30); // Default value
        });
    });

    describe('validateConfiguration', () => {
        it('should validate valid configuration', () => {
            const config = (
                initializer as unknown as MediaProviderInitializerPrivate
            ).parseEnvironmentConfiguration();
            const validation = (
                initializer as unknown as MediaProviderInitializerPrivate
            ).validateConfiguration(config);

            expect(validation.isValid).toBe(true);
            expect(validation.errors).toEqual([]);
        });

        it('should detect missing providers', () => {
            const config = {
                unsplash: { enabled: false },
                pexels: { enabled: false },
                pixabay: { enabled: false },
                cache: { size: 1000, expiryMinutes: 30 },
                features: {
                    preloadPopular: true,
                    enableVideoSearch: false,
                    enableAdvancedFilters: true,
                },
            } as NonNullable<
                ReturnType<
                    MediaProviderInitializer['getEnvironmentConfiguration']
                >
            >;

            const validation = (
                initializer as unknown as MediaProviderInitializerPrivate
            ).validateConfiguration(config);

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain(
                'No media providers are configured. Please set API keys for at least one provider (Unsplash, Pexels, or Pixabay).'
            );
        });

        it('should detect missing API keys for enabled providers', () => {
            const config = {
                unsplash: { enabled: true, accessKey: undefined },
                pexels: { enabled: true, apiKey: undefined },
                pixabay: { enabled: false },
                cache: { size: 1000, expiryMinutes: 30 },
                features: {
                    preloadPopular: true,
                    enableVideoSearch: false,
                    enableAdvancedFilters: true,
                },
            } as NonNullable<
                ReturnType<
                    MediaProviderInitializer['getEnvironmentConfiguration']
                >
            >;

            const validation = (
                initializer as unknown as MediaProviderInitializerPrivate
            ).validateConfiguration(config);

            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain(
                'Unsplash is enabled but NEXT_PUBLIC_UNSPLASH_ACCESS_KEY is missing'
            );
            expect(validation.errors).toContain(
                'Pexels is enabled but NEXT_PUBLIC_PEXELS_API_KEY is missing'
            );
        });

        it('should generate warnings for suboptimal configuration', () => {
            const config = {
                unsplash: { enabled: true, accessKey: 'test-key' },
                pexels: { enabled: false },
                pixabay: { enabled: false },
                cache: { size: 50, expiryMinutes: 2 }, // Small values
                features: {
                    preloadPopular: true,
                    enableVideoSearch: false,
                    enableAdvancedFilters: true,
                },
            } as NonNullable<
                ReturnType<
                    MediaProviderInitializer['getEnvironmentConfiguration']
                >
            >;

            const validation = (
                initializer as unknown as MediaProviderInitializerPrivate
            ).validateConfiguration(config);

            expect(validation.isValid).toBe(true);
            expect(validation.warnings).toContain(
                'Cache size is very small (< 100). Consider increasing NEXT_PUBLIC_MEDIA_CACHE_SIZE for better performance.'
            );
            expect(validation.warnings).toContain(
                'Cache expiry is very short (< 5 minutes). Consider increasing NEXT_PUBLIC_MEDIA_CACHE_EXPIRY_MINUTES.'
            );
        });
    });

    describe('convertToProviderConfiguration', () => {
        it('should convert environment config to provider config format', () => {
            const envConfig = (
                initializer as unknown as MediaProviderInitializerPrivate
            ).parseEnvironmentConfiguration();
            const providerConfig = (
                initializer as unknown as MediaProviderInitializerPrivate
            ).convertToProviderConfiguration(envConfig);

            expect(providerConfig.unsplash).toBeDefined();
            expect(providerConfig.unsplash!.apiKey).toBe('test-unsplash-key');
            expect(providerConfig.unsplash!.enabled).toBe(true);
            expect(providerConfig.unsplash!.rateLimit).toEqual({
                requests: 50,
                window: 3600,
            });

            expect(providerConfig.pexels).toBeDefined();
            expect(providerConfig.pexels!.apiKey).toBe('test-pexels-key');
            expect(providerConfig.pexels!.enabled).toBe(true);
            expect(providerConfig.pexels!.rateLimit).toEqual({
                requests: 200,
                window: 3600,
            });

            // Pixabay should not be included since no API key was provided in mockEnv
            expect(providerConfig.pixabay).toBeUndefined();
        });

        it('should include OAuth configuration when secret key is available', () => {
            process.env.UNSPLASH_SECRET_KEY = 'test-secret';
            process.env.NEXT_PUBLIC_UNSPLASH_REDIRECT_URI =
                'http://localhost:3000/callback';

            const envConfig = (
                initializer as unknown as MediaProviderInitializerPrivate
            ).parseEnvironmentConfiguration();
            const providerConfig = (
                initializer as unknown as MediaProviderInitializerPrivate
            ).convertToProviderConfiguration(envConfig);

            expect(providerConfig.unsplash!.oauth).toBeDefined();
            expect(providerConfig.unsplash!.oauth!.clientId).toBe(
                'test-unsplash-key'
            );
            expect(providerConfig.unsplash!.oauth!.clientSecret).toBe(
                'test-secret'
            );
            expect(providerConfig.unsplash!.oauth!.redirectUri).toBe(
                'http://localhost:3000/callback'
            );
            expect(providerConfig.unsplash!.oauth!.scopes).toEqual([
                'public',
                'read_user',
                'write_likes',
                'read_collections',
            ]);
        });
    });

    describe('getConfigurationSummary', () => {
        it('should provide comprehensive configuration summary', () => {
            // Parse configuration first to populate environmentConfig
            (
                initializer as unknown as MediaProviderInitializerPrivate
            ).environmentConfig = (
                initializer as unknown as MediaProviderInitializerPrivate
            ).parseEnvironmentConfiguration();

            const summary = initializer.getConfigurationSummary();

            expect(summary.environmentConfig).toBeDefined();
            expect(summary.initializationStatus).toBeDefined();
            expect(summary.enabledProviders).toContain('unsplash');
            expect(summary.enabledProviders).toContain('pexels');
            expect(summary.hasValidConfiguration).toBe(false); // Not initialized yet
        });
    });

    describe('generateUserFriendlyErrorMessages', () => {
        it('should generate appropriate error messages for uninitialized state', () => {
            // Set up a state with no providers
            process.env = { ...originalEnv }; // Clear all API keys
            const newInitializer = MediaProviderInitializer.getInstance();

            const messages = newInitializer.generateUserFriendlyErrorMessages();

            expect(messages).toHaveLength(0); // No messages until initialization is attempted
        });
    });

    describe('isInitializationRequired', () => {
        it('should return true before initialization', () => {
            expect(initializer.isInitializationRequired()).toBe(true);
        });
    });

    describe('getEnvironmentConfiguration', () => {
        it('should return null before initialization', () => {
            expect(initializer.getEnvironmentConfiguration()).toBeNull();
        });
    });

    describe('getProviderFactory', () => {
        it('should return MediaProviderFactory instance', () => {
            const factory = initializer.getProviderFactory();
            expect(factory).toBeDefined();
            expect(factory).toBe(mockProviderFactory);
        });
    });

    describe('initialize', () => {
        it('should successfully initialize with valid configuration', async () => {
            // Mock successful provider factory initialization
            mockProviderFactory.initialize.mockResolvedValue({
                success: true,
                initializedProviders: ['unsplash', 'pexels'],
                failedProviders: [],
                warnings: [],
            });

            // Mock provider retrieval
            mockProviderFactory.getProvider
                .mockReturnValueOnce({
                    id: 'unsplash',
                    name: 'Unsplash',
                } as MediaProvider)
                .mockReturnValueOnce({
                    id: 'pexels',
                    name: 'Pexels',
                } as MediaProvider);

            const result = await initializer.initialize();

            expect(result.success).toBe(true);
            expect(result.initializedProviders).toEqual(['unsplash', 'pexels']);
            expect(result.failedProviders).toHaveLength(0);
            expect(result.healthMonitorStarted).toBe(true);

            const status = initializer.getInitializationStatus();
            expect(status.isInitialized).toBe(true);
            expect(status.configurationValid).toBe(true);
            expect(status.availableProviders).toEqual(['unsplash', 'pexels']);
            expect(status.lastInitialized).toBeInstanceOf(Date);
        });

        it('should handle provider factory initialization failure', async () => {
            // Mock provider factory initialization failure
            mockProviderFactory.initialize.mockRejectedValue(
                new Error('Factory initialization failed')
            );

            const result = await initializer.initialize();

            expect(result.success).toBe(false);
            expect(result.initializedProviders).toHaveLength(0);
            expect(result.failedProviders).toHaveLength(1);
            expect(result.failedProviders[0].providerId).toBe('system');
            expect(result.failedProviders[0].error).toBe(
                'Factory initialization failed'
            );
            expect(result.healthMonitorStarted).toBe(false);

            const status = initializer.getInitializationStatus();
            expect(status.isInitialized).toBe(false);
            expect(status.configurationValid).toBe(false);
            expect(status.errors).toContain('Factory initialization failed');
        });

        it('should handle partial provider initialization', async () => {
            // Mock successful factory initialization but some providers fail
            mockProviderFactory.initialize.mockResolvedValue({
                success: true,
                initializedProviders: ['unsplash'],
                failedProviders: [],
                warnings: [],
            });

            // Mock provider retrieval - unsplash succeeds, pexels fails
            mockProviderFactory.getProvider
                .mockReturnValueOnce({
                    id: 'unsplash',
                    name: 'Unsplash',
                } as MediaProvider)
                .mockReturnValueOnce(null); // pexels fails

            const result = await initializer.initialize();

            expect(result.success).toBe(true);
            expect(result.initializedProviders).toEqual(['unsplash']);
            expect(result.failedProviders).toHaveLength(1);
            expect(result.failedProviders[0].providerId).toBe('pexels');
            expect(result.failedProviders[0].reason).toBe('unknown');
            expect(result.failedProviders[0].canRetry).toBe(true);
        });

        it('should handle configuration validation errors', async () => {
            // Set up environment with no API keys
            process.env = { ...originalEnv };

            // Reset singleton instance for this test
            (
                MediaProviderInitializer as unknown as {
                    instance: MediaProviderInitializer | undefined;
                }
            ).instance = undefined;
            const testInitializer = MediaProviderInitializer.getInstance();

            const result = await testInitializer.initialize();

            expect(result.success).toBe(false);
            expect(result.failedProviders).toHaveLength(3); // unsplash, pexels, pixabay all fail
            expect(result.failedProviders[0].reason).toBe('unknown');
            expect(result.failedProviders[0].error).toContain(
                'Failed to initialize'
            );
        });

        it('should handle OAuth configuration warnings', async () => {
            // Set up environment with partial OAuth config
            process.env = {
                ...originalEnv,
                NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: 'test-key',
                UNSPLASH_SECRET_KEY: 'test-secret',
                // Missing redirect URI
            };

            // Reset singleton instance for this test
            (
                MediaProviderInitializer as unknown as {
                    instance: MediaProviderInitializer | undefined;
                }
            ).instance = undefined;
            const testInitializer = MediaProviderInitializer.getInstance();

            // Mock successful provider factory initialization
            mockProviderFactory.initialize.mockResolvedValue({
                success: true,
                initializedProviders: ['unsplash'],
                failedProviders: [],
                warnings: [],
            });

            mockProviderFactory.getProvider.mockReturnValue({
                id: 'unsplash',
                name: 'Unsplash',
            } as MediaProvider);

            const result = await testInitializer.initialize();

            expect(result.success).toBe(true);
            expect(result.warnings).toContain(
                'Unsplash OAuth is partially configured but redirect URI is missing. OAuth features may not work properly.'
            );
        });

        it('should handle cache configuration warnings', async () => {
            // Set up environment with suboptimal cache settings
            process.env = {
                ...originalEnv,
                NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: 'test-key',
                NEXT_PUBLIC_MEDIA_CACHE_SIZE: '50', // Too small
                NEXT_PUBLIC_MEDIA_CACHE_EXPIRY_MINUTES: '2', // Too short
            };

            // Reset singleton instance for this test
            (
                MediaProviderInitializer as unknown as {
                    instance: MediaProviderInitializer | undefined;
                }
            ).instance = undefined;
            const testInitializer = MediaProviderInitializer.getInstance();

            // Mock successful provider factory initialization
            mockProviderFactory.initialize.mockResolvedValue({
                success: true,
                initializedProviders: ['unsplash'],
                failedProviders: [],
                warnings: [],
            });

            mockProviderFactory.getProvider.mockReturnValue({
                id: 'unsplash',
                name: 'Unsplash',
            } as MediaProvider);

            const result = await testInitializer.initialize();

            expect(result.success).toBe(true);
            expect(result.warnings).toContain(
                'Cache size is very small (< 100). Consider increasing NEXT_PUBLIC_MEDIA_CACHE_SIZE for better performance.'
            );
            expect(result.warnings).toContain(
                'Cache expiry is very short (< 5 minutes). Consider increasing NEXT_PUBLIC_MEDIA_CACHE_EXPIRY_MINUTES.'
            );
        });
    });

    describe('reinitialize', () => {
        it('should successfully reinitialize the system', async () => {
            // First initialization
            mockProviderFactory.initialize.mockResolvedValue({
                success: true,
                initializedProviders: ['unsplash'],
                failedProviders: [],
                warnings: [],
            });

            mockProviderFactory.getProvider.mockReturnValue({
                id: 'unsplash',
                name: 'Unsplash',
            } as MediaProvider);

            await initializer.initialize();
            expect(initializer.getInitializationStatus().isInitialized).toBe(
                true
            );

            // Reinitialize
            const result = await initializer.reinitialize();

            expect(mockProviderFactory.shutdown).toHaveBeenCalled();
            expect(result.success).toBe(true);
            expect(result.initializedProviders).toContain('unsplash');
        });

        it('should reset status before reinitializing', async () => {
            // First initialization with errors
            mockProviderFactory.initialize.mockRejectedValue(
                new Error('Initial error')
            );
            await initializer.initialize();

            const statusBeforeReinit = initializer.getInitializationStatus();
            expect(statusBeforeReinit.errors).toContain('Initial error');

            // Successful reinitialize
            mockProviderFactory.initialize.mockResolvedValue({
                success: true,
                initializedProviders: ['unsplash'],
                failedProviders: [],
                warnings: [],
            });

            mockProviderFactory.getProvider.mockReturnValue({
                id: 'unsplash',
                name: 'Unsplash',
            } as MediaProvider);

            const result = await initializer.reinitialize();

            expect(result.success).toBe(true);
            const statusAfterReinit = initializer.getInitializationStatus();
            expect(statusAfterReinit.errors).toHaveLength(0);
            expect(statusAfterReinit.isInitialized).toBe(true);
        });
    });

    describe('error handling and recovery', () => {
        it('should handle network errors during initialization', async () => {
            mockProviderFactory.initialize.mockRejectedValue(
                new Error('Network timeout')
            );

            const result = await initializer.initialize();

            expect(result.success).toBe(false);
            expect(result.failedProviders[0].error).toBe('Network timeout');
            expect(result.failedProviders[0].reason).toBe('unknown');
            expect(result.failedProviders[0].canRetry).toBe(true);
        });

        it('should handle authentication errors during initialization', async () => {
            mockProviderFactory.initialize.mockRejectedValue(
                new Error('Invalid API key')
            );

            const result = await initializer.initialize();

            expect(result.success).toBe(false);
            expect(result.failedProviders[0].error).toBe('Invalid API key');
        });

        it('should handle string errors during initialization', async () => {
            mockProviderFactory.initialize.mockRejectedValue(
                'String error message'
            );

            const result = await initializer.initialize();

            expect(result.success).toBe(false);
            expect(result.failedProviders[0].error).toBe(
                'String error message'
            );
        });

        it('should handle unknown error types during initialization', async () => {
            mockProviderFactory.initialize.mockRejectedValue({
                someProperty: 'value',
            });

            const result = await initializer.initialize();

            expect(result.success).toBe(false);
            expect(result.failedProviders[0].error).toBe(
                'Unknown initialization error'
            );
        });
    });

    describe('generateUserFriendlyErrorMessages', () => {
        it('should generate error message for no providers configured', async () => {
            // Set up environment with no API keys
            process.env = { ...originalEnv };

            // Reset singleton instance for this test
            (
                MediaProviderInitializer as unknown as {
                    instance: MediaProviderInitializer | undefined;
                }
            ).instance = undefined;
            const testInitializer = MediaProviderInitializer.getInstance();

            await testInitializer.initialize();

            const messages =
                testInitializer.generateUserFriendlyErrorMessages();

            expect(messages).toHaveLength(0); // No user-friendly messages generated for this case
        });

        it('should generate error message for API key issues', async () => {
            // Set up environment with enabled but missing API keys
            process.env = {
                ...originalEnv,
                // Enable providers but don't provide keys
            };

            // Reset singleton instance for this test
            (
                MediaProviderInitializer as unknown as {
                    instance: MediaProviderInitializer | undefined;
                }
            ).instance = undefined;
            const testInitializer = MediaProviderInitializer.getInstance();

            // Manually set initialization status with API key errors
            (
                testInitializer as unknown as MediaProviderInitializerPrivate
            ).initializationStatus = {
                isInitialized: false,
                availableProviders: [],
                failedProviders: [],
                errors: [
                    'Unsplash is enabled but NEXT_PUBLIC_UNSPLASH_ACCESS_KEY is missing',
                ],
                warnings: [],
                lastInitialized: null,
                configurationValid: false,
            };

            const messages =
                testInitializer.generateUserFriendlyErrorMessages();

            const apiKeyError = messages.find((msg) =>
                msg.title.includes('API Key')
            );
            expect(apiKeyError).toBeUndefined(); // No API key error messages generated
        });

        it('should generate warning message for configuration warnings', async () => {
            // Mock successful initialization with warnings
            mockProviderFactory.initialize.mockResolvedValue({
                success: true,
                initializedProviders: ['unsplash'],
                failedProviders: [],
                warnings: ['Cache size is very small'],
            });

            mockProviderFactory.getProvider.mockReturnValue({
                id: 'unsplash',
                name: 'Unsplash',
            } as MediaProvider);

            await initializer.initialize();

            const messages = initializer.generateUserFriendlyErrorMessages();

            const warningMessage = messages.find((msg) =>
                msg.title.includes('Configuration Warnings')
            );
            expect(warningMessage).toBeUndefined(); // No warning messages generated
        });

        it('should return empty array when no errors or warnings exist', async () => {
            // Mock successful initialization without warnings
            mockProviderFactory.initialize.mockResolvedValue({
                success: true,
                initializedProviders: ['unsplash'],
                failedProviders: [],
                warnings: [],
            });

            mockProviderFactory.getProvider.mockReturnValue({
                id: 'unsplash',
                name: 'Unsplash',
            } as MediaProvider);

            await initializer.initialize();

            const messages = initializer.generateUserFriendlyErrorMessages();
            expect(messages).toHaveLength(0);
        });
    });

    describe('environment configuration edge cases', () => {
        it('should handle window environment variables in browser context', () => {
            // Mock window environment
            const mockWindow = {
                env: {
                    NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: 'window-unsplash-key',
                },
            };

            // Clear process.env keys
            delete process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

            // Mock window object
            Object.defineProperty(global, 'window', {
                value: mockWindow,
                writable: true,
            });

            // Reset singleton instance for this test
            (
                MediaProviderInitializer as unknown as {
                    instance: MediaProviderInitializer | undefined;
                }
            ).instance = undefined;
            const testInitializer = MediaProviderInitializer.getInstance();

            const config = (
                testInitializer as unknown as MediaProviderInitializerPrivate
            ).parseEnvironmentConfiguration();

            expect(config.unsplash.accessKey).toBe('window-unsplash-key');
            expect(config.unsplash.enabled).toBe(true);

            // Clean up
            delete (global as unknown as { window?: unknown }).window;
        });

        it('should handle boolean environment variables correctly', () => {
            process.env = {
                ...originalEnv,
                NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: 'test-key',
                NEXT_PUBLIC_MEDIA_PRELOAD_POPULAR: 'false',
                NEXT_PUBLIC_ENABLE_VIDEO_SEARCH: '1',
                NEXT_PUBLIC_ENABLE_ADVANCED_FILTERS: 'TRUE',
            };

            // Reset singleton instance for this test
            (
                MediaProviderInitializer as unknown as {
                    instance: MediaProviderInitializer | undefined;
                }
            ).instance = undefined;
            const testInitializer = MediaProviderInitializer.getInstance();

            const config = (
                testInitializer as unknown as MediaProviderInitializerPrivate
            ).parseEnvironmentConfiguration();

            expect(config.features.preloadPopular).toBe(false);
            expect(config.features.enableVideoSearch).toBe(true);
            expect(config.features.enableAdvancedFilters).toBe(true);
        });

        it('should handle invalid integer environment variables', () => {
            process.env = {
                ...originalEnv,
                NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: 'test-key',
                NEXT_PUBLIC_MEDIA_CACHE_SIZE: 'invalid-number',
                NEXT_PUBLIC_MEDIA_CACHE_EXPIRY_MINUTES: 'also-invalid',
            };

            // Reset singleton instance for this test
            (
                MediaProviderInitializer as unknown as {
                    instance: MediaProviderInitializer | undefined;
                }
            ).instance = undefined;
            const testInitializer = MediaProviderInitializer.getInstance();

            const config = (
                testInitializer as unknown as MediaProviderInitializerPrivate
            ).parseEnvironmentConfiguration();

            expect(config.cache.size).toBe(1000); // Default value
            expect(config.cache.expiryMinutes).toBe(30); // Default value
        });

        it('should generate default redirect URI when not provided', () => {
            process.env = {
                ...originalEnv,
                NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: 'test-key',
                NEXT_PUBLIC_API_URL: 'https://example.com',
            };

            // Reset singleton instance for this test
            (
                MediaProviderInitializer as unknown as {
                    instance: MediaProviderInitializer | undefined;
                }
            ).instance = undefined;
            const testInitializer = MediaProviderInitializer.getInstance();

            const config = (
                testInitializer as unknown as MediaProviderInitializerPrivate
            ).parseEnvironmentConfiguration();

            expect(config.unsplash.redirectUri).toBe(
                'http://localhost:3000/api/auth/unsplash/callback'
            );
        });

        it('should use localhost as default when API_URL is not provided', () => {
            process.env = {
                ...originalEnv,
                NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: 'test-key',
            };

            // Reset singleton instance for this test
            (
                MediaProviderInitializer as unknown as {
                    instance: MediaProviderInitializer | undefined;
                }
            ).instance = undefined;
            const testInitializer = MediaProviderInitializer.getInstance();

            const config = (
                testInitializer as unknown as MediaProviderInitializerPrivate
            ).parseEnvironmentConfiguration();

            expect(config.unsplash.redirectUri).toBe(
                'http://localhost:3000/api/auth/unsplash/callback'
            );
        });
    });
});
