import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDebounce, useDebouncedValue } from './useDebounce';
import { MediaSearchService } from '@/lib/services/media/MediaSearchService';
import { UnsplashProvider } from '@/lib/services/media/providers/UnsplashProvider';
import { PexelsProvider } from '@/lib/services/media/providers/PexelsProvider';
import {
    MediaSearchQuery,
    MediaSearchResult,
    MediaItem,
    MediaFilters,
    ProviderStatus,
    MediaProviderConfig,
} from '@/types/media-search';
import {
    EventCategory,
    CATEGORY_DESCRIPTIONS,
} from '@/lib/constants/eventCategories';
import {
    MediaSelectionValidator,
    SelectionValidationResult,
    SelectionLimits,
    DEFAULT_EVENT_LIMITS,
} from '@/lib/utils/mediaSelectionValidation';

export interface MediaSearchState {
    // Search state
    query: string;
    filters: MediaFilters;
    results: MediaSearchResult | null;
    isLoading: boolean;
    error: string | null;

    // UI state
    selectedItems: MediaItem[];
    previewItem: MediaItem | null;
    currentPage: number;
    hasMore: boolean;

    // Provider state
    availableProviders: ProviderStatus[];
    activeProviders: string[];
    providerErrors: Record<string, string>;

    // Suggestions
    suggestions: string[];
    showSuggestions: boolean;

    // Selection validation
    selectionValidation: SelectionValidationResult;
    isDownloading: boolean;
    downloadProgress: number;
}

export interface MediaSearchActions {
    // Search actions
    search: (query: string, filters?: MediaFilters) => Promise<void>;
    loadMore: () => Promise<void>;
    clearSearch: () => void;

    // Item selection
    selectItem: (item: MediaItem) => void;
    deselectItem: (itemId: string) => void;
    toggleItemSelection: (item: MediaItem) => void;
    clearSelection: () => void;
    reorderItems: (items: MediaItem[]) => void;

    // Preview
    previewItem: (item: MediaItem) => void;
    closePreview: () => void;

    // Filters
    applyFilters: (filters: MediaFilters) => Promise<void>;
    clearFilters: () => void;

    // Providers
    toggleProvider: (providerId: string) => void;

    // Suggestions
    getSuggestions: (query: string) => Promise<void>;
    applySuggestion: (suggestion: string) => void;
    hideSuggestions: () => void;

    // Popular content
    loadPopularContent: (category?: string) => Promise<void>;

    // Download and processing
    downloadSelected: () => Promise<void>;
    validateSelection: (item?: MediaItem) => SelectionValidationResult;
}

export interface UseMediaSearchOptions {
    initialQuery?: string;
    initialFilters?: MediaFilters;
    eventCategory?: EventCategory;
    maxSelectedItems?: number;
    debounceDelay?: number;
    enableAutoSuggestions?: boolean;
    preloadPopular?: boolean;
    selectionLimits?: SelectionLimits;
    onDownloadComplete?: (items: MediaItem[]) => void;
    onDownloadError?: (error: Error) => void;
}

export interface UseMediaSearchReturn {
    state: MediaSearchState;
    actions: MediaSearchActions;
    service: MediaSearchService;
}

// Category to search terms mapping for intelligent suggestions
const CATEGORY_SEARCH_TERMS: Record<EventCategory, string[]> = {
    [EventCategory.BusinessProfessional]: [
        'business meeting',
        'conference',
        'presentation',
        'office',
        'corporate',
        'handshake',
        'team',
        'professional',
        'networking',
        'boardroom',
    ],
    [EventCategory.TechnologyInnovation]: [
        'technology',
        'innovation',
        'startup',
        'coding',
        'computer',
        'digital',
        'software',
        'tech conference',
        'programming',
        'data',
    ],
    [EventCategory.ArtsCulture]: [
        'art',
        'culture',
        'gallery',
        'painting',
        'sculpture',
        'creative',
        'exhibition',
        'museum',
        'artistic',
        'cultural event',
    ],
    [EventCategory.MusicEntertainment]: [
        'music',
        'concert',
        'entertainment',
        'stage',
        'performance',
        'band',
        'festival',
        'dancing',
        'party',
        'celebration',
    ],
    [EventCategory.SportsFitness]: [
        'sports',
        'fitness',
        'gym',
        'exercise',
        'athletic',
        'competition',
        'training',
        'health',
        'active',
        'workout',
    ],
    [EventCategory.FoodDrink]: [
        'food',
        'restaurant',
        'cooking',
        'dining',
        'culinary',
        'chef',
        'kitchen',
        'meal',
        'drink',
        'beverage',
    ],
    [EventCategory.HealthWellness]: [
        'health',
        'wellness',
        'medical',
        'healthcare',
        'therapy',
        'meditation',
        'yoga',
        'mindfulness',
        'wellbeing',
        'healing',
    ],
    [EventCategory.EducationLearning]: [
        'education',
        'learning',
        'school',
        'university',
        'classroom',
        'teaching',
        'student',
        'academic',
        'workshop',
        'training',
    ],
    [EventCategory.CommunitySocial]: [
        'community',
        'social',
        'gathering',
        'people',
        'group',
        'networking',
        'meetup',
        'friends',
        'social event',
        'connection',
    ],
    [EventCategory.FashionBeauty]: [
        'fashion',
        'beauty',
        'style',
        'clothing',
        'makeup',
        'model',
        'runway',
        'designer',
        'glamour',
        'cosmetics',
    ],
    [EventCategory.TravelAdventure]: [
        'travel',
        'adventure',
        'vacation',
        'tourism',
        'journey',
        'exploration',
        'destination',
        'outdoor',
        'nature',
        'landscape',
    ],
    [EventCategory.FamilyKids]: [
        'family',
        'children',
        'kids',
        'parents',
        'playground',
        'toys',
        'education',
        'fun',
        'activities',
        'childcare',
    ],
    [EventCategory.ReligionSpirituality]: [
        'religion',
        'spiritual',
        'church',
        'faith',
        'prayer',
        'meditation',
        'worship',
        'ceremony',
        'sacred',
        'peace',
    ],
    [EventCategory.CharityCauses]: [
        'charity',
        'volunteer',
        'donation',
        'fundraising',
        'community service',
        'helping',
        'support',
        'cause',
        'nonprofit',
        'giving',
    ],
    [EventCategory.GovernmentPolitics]: [
        'government',
        'politics',
        'election',
        'voting',
        'civic',
        'public service',
        'policy',
        'democracy',
        'political',
        'campaign',
    ],
    [EventCategory.ScienceResearch]: [
        'science',
        'research',
        'laboratory',
        'experiment',
        'discovery',
        'innovation',
        'academic',
        'study',
        'analysis',
        'scientific',
    ],
    [EventCategory.Automotive]: [
        'automotive',
        'car',
        'vehicle',
        'driving',
        'transportation',
        'auto show',
        'racing',
        'mechanic',
        'garage',
        'automobile',
    ],
    [EventCategory.RealEstate]: [
        'real estate',
        'property',
        'house',
        'home',
        'building',
        'architecture',
        'construction',
        'investment',
        'residential',
        'commercial',
    ],
    [EventCategory.FinanceInvestment]: [
        'finance',
        'investment',
        'money',
        'banking',
        'financial',
        'economy',
        'trading',
        'business',
        'wealth',
        'market',
    ],
    [EventCategory.MarketingSales]: [
        'marketing',
        'sales',
        'advertising',
        'promotion',
        'branding',
        'campaign',
        'customer',
        'business',
        'commerce',
        'retail',
    ],
    [EventCategory.GamingEsports]: [
        'gaming',
        'esports',
        'video games',
        'competition',
        'tournament',
        'gamer',
        'console',
        'streaming',
        'online',
        'digital entertainment',
    ],
    [EventCategory.Photography]: [
        'photography',
        'camera',
        'photo',
        'portrait',
        'landscape',
        'studio',
        'photographer',
        'image',
        'picture',
        'visual',
    ],
    [EventCategory.FilmMedia]: [
        'film',
        'movie',
        'cinema',
        'video',
        'media',
        'production',
        'director',
        'actor',
        'entertainment',
        'screening',
    ],
    [EventCategory.Other]: [
        'event',
        'gathering',
        'meeting',
        'celebration',
        'occasion',
        'activity',
        'experience',
        'social',
        'community',
        'special',
    ],
};

export function useMediaSearch(
    options: UseMediaSearchOptions = {}
): UseMediaSearchReturn {
    const {
        initialQuery = '',
        initialFilters = {},
        eventCategory,
        maxSelectedItems = 10,
        debounceDelay = 500,
        enableAutoSuggestions = true,
        preloadPopular = true,
        selectionLimits = DEFAULT_EVENT_LIMITS,
        onDownloadComplete,
        onDownloadError,
    } = options;

    // Initialize service and validator
    const serviceRef = useRef<MediaSearchService | null>(null);
    const validatorRef = useRef<MediaSelectionValidator | null>(null);

    if (!serviceRef.current) {
        try {
            // Use factory to create service with proper provider configuration
            const {
                MediaSearchServiceFactory,
            } = require('@/lib/services/media/MediaSearchServiceFactory');
            serviceRef.current = MediaSearchServiceFactory.create({
                cacheSize: 1000,
                cacheExpiryMinutes: 30,
                enabledProviders: ['unsplash', 'pexels'],
            });
        } catch (error) {
            console.warn('Failed to initialize media search service:', error);
            // Fallback to basic service without providers
            serviceRef.current = new MediaSearchService();
        }
    }

    if (!validatorRef.current) {
        validatorRef.current = new MediaSelectionValidator({
            ...selectionLimits,
            maxItems: maxSelectedItems,
        });
    }

    const service = serviceRef.current;
    const validator = validatorRef.current;

    // State management
    const [state, setState] = useState<MediaSearchState>({
        query: initialQuery,
        filters: initialFilters,
        results: null,
        isLoading: false,
        error: null,
        selectedItems: [],
        previewItem: null,
        currentPage: 1,
        hasMore: false,
        availableProviders: [],
        activeProviders: [],
        providerErrors: {},
        suggestions: [],
        showSuggestions: false,
        selectionValidation: { isValid: true, errors: [], warnings: [] },
        isDownloading: false,
        downloadProgress: 0,
    });

    // Debounced search query
    const debouncedQuery = useDebouncedValue(state.query, debounceDelay);

    // Initialize providers and load popular content
    useEffect(() => {
        const initializeService = async () => {
            try {
                const providers = service.getAvailableProviders();
                const providerStatuses = providers.map((provider) =>
                    provider.getStatus()
                );

                setState((prev) => ({
                    ...prev,
                    availableProviders: providerStatuses,
                    activeProviders: providerStatuses
                        .filter((status) => status.isAvailable)
                        .map((status) => status.id),
                }));

                // Preload popular searches if enabled
                if (preloadPopular) {
                    await service.preloadPopularSearches();
                }

                // Load popular content for the event category
                if (eventCategory) {
                    await loadPopularContent(eventCategory);
                }
            } catch (error) {
                console.error(
                    'Failed to initialize media search service:',
                    error
                );
                setState((prev) => ({
                    ...prev,
                    error: 'Failed to initialize media search service',
                }));
            }
        };

        initializeService();
    }, [service, eventCategory, preloadPopular]);

    // Auto-search when debounced query changes
    useEffect(() => {
        if (debouncedQuery.trim() && debouncedQuery !== initialQuery) {
            search(debouncedQuery, state.filters);
        }
    }, [debouncedQuery]);

    // Auto-suggestions when query changes
    useEffect(() => {
        if (enableAutoSuggestions && state.query.trim().length > 2) {
            getSuggestions(state.query);
        } else {
            setState((prev) => ({
                ...prev,
                suggestions: [],
                showSuggestions: false,
            }));
        }
    }, [state.query, enableAutoSuggestions]);

    // Search function
    const search = useCallback(
        async (query: string, filters: MediaFilters = {}) => {
            if (!query.trim()) {
                setState((prev) => ({ ...prev, results: null, error: null }));
                return;
            }

            setState((prev) => ({
                ...prev,
                isLoading: true,
                error: null,
                currentPage: 1,
                showSuggestions: false,
            }));

            try {
                const searchQuery: MediaSearchQuery = {
                    query: query.trim(),
                    filters,
                    providers:
                        state.activeProviders.length > 0
                            ? state.activeProviders
                            : undefined,
                    page: 1,
                    perPage: 30,
                };

                const result = await service.searchMedia(searchQuery);

                setState((prev) => ({
                    ...prev,
                    results: result,
                    hasMore: result.hasMore,
                    isLoading: false,
                    providerErrors: {},
                }));
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Search failed';
                setState((prev) => ({
                    ...prev,
                    error: errorMessage,
                    isLoading: false,
                    results: null,
                }));
            }
        },
        [service, state.activeProviders]
    );

    // Load more results
    const loadMore = useCallback(async () => {
        if (!state.results || !state.hasMore || state.isLoading) {
            return;
        }

        setState((prev) => ({ ...prev, isLoading: true }));

        try {
            const searchQuery: MediaSearchQuery = {
                query: state.query,
                filters: state.filters,
                providers:
                    state.activeProviders.length > 0
                        ? state.activeProviders
                        : undefined,
                page: state.currentPage + 1,
                perPage: 30,
            };

            const result = await service.searchMedia(searchQuery);

            setState((prev) => ({
                ...prev,
                results: prev.results
                    ? {
                          ...result,
                          items: [...prev.results.items, ...result.items],
                      }
                    : result,
                currentPage: prev.currentPage + 1,
                hasMore: result.hasMore,
                isLoading: false,
            }));
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to load more results';
            setState((prev) => ({
                ...prev,
                error: errorMessage,
                isLoading: false,
            }));
        }
    }, [
        service,
        state.query,
        state.filters,
        state.activeProviders,
        state.results,
        state.hasMore,
        state.isLoading,
        state.currentPage,
    ]);

    // Clear search
    const clearSearch = useCallback(() => {
        setState((prev) => ({
            ...prev,
            query: '',
            results: null,
            error: null,
            currentPage: 1,
            hasMore: false,
            suggestions: [],
            showSuggestions: false,
        }));
    }, []);

    // Validation function
    const validateSelection = useCallback(
        (newItem?: MediaItem): SelectionValidationResult => {
            if (newItem) {
                return validator.validateAddition(state.selectedItems, newItem);
            } else {
                return validator.validateSelection(state.selectedItems);
            }
        },
        [validator, state.selectedItems]
    );

    // Item selection
    const selectItem = useCallback(
        (item: MediaItem) => {
            setState((prev) => {
                // Validate the addition
                const validation = validator.validateAddition(
                    prev.selectedItems,
                    item
                );

                if (!validation.isValid) {
                    // Don't add if validation fails
                    return {
                        ...prev,
                        selectionValidation: validation,
                    };
                }

                const isAlreadySelected = prev.selectedItems.some(
                    (selected) =>
                        selected.id === item.id &&
                        selected.providerId === item.providerId
                );

                if (isAlreadySelected) {
                    return prev;
                }

                const newSelectedItems = [...prev.selectedItems, item];
                const newValidation =
                    validator.validateSelection(newSelectedItems);

                return {
                    ...prev,
                    selectedItems: newSelectedItems,
                    selectionValidation: newValidation,
                };
            });
        },
        [validator]
    );

    const deselectItem = useCallback(
        (itemId: string) => {
            setState((prev) => {
                const newSelectedItems = prev.selectedItems.filter(
                    (item) =>
                        !(
                            item.id === itemId ||
                            `${item.providerId}-${item.id}` === itemId
                        )
                );

                const newValidation =
                    validator.validateSelection(newSelectedItems);

                return {
                    ...prev,
                    selectedItems: newSelectedItems,
                    selectionValidation: newValidation,
                };
            });
        },
        [validator]
    );

    const toggleItemSelection = useCallback(
        (item: MediaItem) => {
            const isSelected = state.selectedItems.some(
                (selected) =>
                    selected.id === item.id &&
                    selected.providerId === item.providerId
            );

            if (isSelected) {
                deselectItem(item.id);
            } else {
                selectItem(item);
            }
        },
        [state.selectedItems, selectItem, deselectItem]
    );

    const clearSelection = useCallback(() => {
        setState((prev) => ({
            ...prev,
            selectedItems: [],
            selectionValidation: { isValid: true, errors: [], warnings: [] },
        }));
    }, []);

    // Reorder items
    const reorderItems = useCallback((items: MediaItem[]) => {
        setState((prev) => ({
            ...prev,
            selectedItems: items,
        }));
    }, []);

    // Preview
    const previewItem = useCallback((item: MediaItem) => {
        setState((prev) => ({ ...prev, previewItem: item }));
    }, []);

    const closePreview = useCallback(() => {
        setState((prev) => ({ ...prev, previewItem: null }));
    }, []);

    // Filters
    const applyFilters = useCallback(
        async (filters: MediaFilters) => {
            setState((prev) => ({ ...prev, filters }));

            if (state.query.trim()) {
                await search(state.query, filters);
            }
        },
        [state.query, search]
    );

    const clearFilters = useCallback(() => {
        setState((prev) => ({ ...prev, filters: {} }));

        if (state.query.trim()) {
            search(state.query, {});
        }
    }, [state.query, search]);

    // Provider management
    const toggleProvider = useCallback((providerId: string) => {
        setState((prev) => {
            const isActive = prev.activeProviders.includes(providerId);
            const newActiveProviders = isActive
                ? prev.activeProviders.filter((id) => id !== providerId)
                : [...prev.activeProviders, providerId];

            return {
                ...prev,
                activeProviders: newActiveProviders,
            };
        });
    }, []);

    // Suggestions
    const getSuggestions = useCallback(
        async (query: string) => {
            try {
                const suggestions = await service.getSuggestions(query);

                // Add category-specific suggestions if event category is provided
                const categoryTerms = eventCategory
                    ? CATEGORY_SEARCH_TERMS[eventCategory] || []
                    : [];
                const categoryMatches = categoryTerms.filter((term) =>
                    term.toLowerCase().includes(query.toLowerCase())
                );

                const allSuggestions = Array.from(
                    new Set([...suggestions, ...categoryMatches])
                );

                setState((prev) => ({
                    ...prev,
                    suggestions: allSuggestions.slice(0, 8), // Limit to 8 suggestions
                    showSuggestions: allSuggestions.length > 0,
                }));
            } catch (error) {
                console.error('Failed to get suggestions:', error);
            }
        },
        [service, eventCategory]
    );

    // Download selected items
    const downloadSelected = useCallback(async () => {
        if (state.selectedItems.length === 0) {
            return;
        }

        setState((prev) => ({
            ...prev,
            isDownloading: true,
            downloadProgress: 0,
        }));

        try {
            // Import the image processor
            const { MediaImageProcessor } = await import(
                '@/lib/services/media/MediaImageProcessor'
            );

            const processedImages =
                await MediaImageProcessor.processSelectedMedia(
                    state.selectedItems,
                    (index, progress) => {
                        const overallProgress =
                            (index / state.selectedItems.length) * 100 +
                            progress / state.selectedItems.length;
                        setState((prev) => ({
                            ...prev,
                            downloadProgress: Math.min(overallProgress, 100),
                        }));
                    }
                );

            setState((prev) => ({
                ...prev,
                isDownloading: false,
                downloadProgress: 100,
            }));

            // Call completion callback
            onDownloadComplete?.(processedImages);

            // Reset download progress after a delay
            setTimeout(() => {
                setState((prev) => ({
                    ...prev,
                    downloadProgress: 0,
                }));
            }, 2000);
        } catch (error) {
            setState((prev) => ({
                ...prev,
                isDownloading: false,
                downloadProgress: 0,
            }));

            const downloadError =
                error instanceof Error ? error : new Error('Download failed');
            onDownloadError?.(downloadError);

            console.error('Failed to download selected media:', error);
        }
    }, [state.selectedItems, onDownloadComplete, onDownloadError]);

    const applySuggestion = useCallback((suggestion: string) => {
        setState((prev) => ({
            ...prev,
            query: suggestion,
            showSuggestions: false,
        }));
    }, []);

    const hideSuggestions = useCallback(() => {
        setState((prev) => ({ ...prev, showSuggestions: false }));
    }, []);

    // Popular content
    const loadPopularContent = useCallback(
        async (category?: EventCategory | string) => {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                const categoryString =
                    typeof category === 'string'
                        ? category
                        : category
                          ? CATEGORY_DESCRIPTIONS[category]
                          : undefined;

                const result = await service.getPopularMedia(categoryString);

                setState((prev) => ({
                    ...prev,
                    results: result,
                    hasMore: result.hasMore,
                    isLoading: false,
                    query: '', // Clear query when showing popular content
                }));
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Failed to load popular content';
                setState((prev) => ({
                    ...prev,
                    error: errorMessage,
                    isLoading: false,
                }));
            }
        },
        [service]
    );

    // Update query (for controlled input)
    const setQuery = useCallback((query: string) => {
        setState((prev) => ({ ...prev, query }));
    }, []);

    // Memoized actions object
    const actions = useMemo<MediaSearchActions>(
        () => ({
            search,
            loadMore,
            clearSearch,
            selectItem,
            deselectItem,
            toggleItemSelection,
            clearSelection,
            reorderItems,
            previewItem,
            closePreview,
            applyFilters,
            clearFilters,
            toggleProvider,
            getSuggestions,
            applySuggestion,
            hideSuggestions,
            loadPopularContent,
            downloadSelected,
            validateSelection,
        }),
        [
            search,
            loadMore,
            clearSearch,
            selectItem,
            deselectItem,
            toggleItemSelection,
            clearSelection,
            reorderItems,
            previewItem,
            closePreview,
            applyFilters,
            clearFilters,
            toggleProvider,
            getSuggestions,
            applySuggestion,
            hideSuggestions,
            loadPopularContent,
            downloadSelected,
            validateSelection,
        ]
    );

    // Extended state with query setter
    const extendedState = useMemo(
        () => ({
            ...state,
            setQuery,
        }),
        [state, setQuery]
    );

    return {
        state: extendedState as MediaSearchState & {
            setQuery: (query: string) => void;
        },
        actions,
        service,
    };
}

// Helper hook for category-based suggestions
export function useCategorySearchTerms(category?: EventCategory): string[] {
    return useMemo(() => {
        if (!category) return [];
        return CATEGORY_SEARCH_TERMS[category] || [];
    }, [category]);
}

// Helper hook for provider health monitoring
export function useProviderHealth(service: MediaSearchService) {
    const [health, setHealth] = useState(service.getServiceHealth());

    useEffect(() => {
        const interval = setInterval(() => {
            setHealth(service.getServiceHealth());
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [service]);

    return health;
}
