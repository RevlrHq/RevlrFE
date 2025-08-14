import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaSearchHeader } from '@src/components/media-search/MediaSearchHeader';
import { MediaSearchSidebar } from '@src/components/media-search/MediaSearchSidebar';
import { ProviderStatusIndicator } from '@src/components/media-search/ProviderStatusIndicator';
import { ThemeProvider } from '@src/lib/ThemeContext';
import type { MediaFilters, ProviderStatus } from '@src/types/media-search';
import { EventCategory } from '@src/lib/constants/eventCategories';

// Mock providers for testing
const mockProviders: ProviderStatus[] = [
    {
        id: 'unsplash',
        name: 'Unsplash',
        isAvailable: true,
        rateLimit: { requests: 50, window: 3600, remaining: 45 },
        healthScore: 95,
    },
    {
        id: 'pexels',
        name: 'Pexels',
        isAvailable: true,
        rateLimit: { requests: 200, window: 3600, remaining: 180 },
        healthScore: 88,
    },
    {
        id: 'pixabay',
        name: 'Pixabay',
        isAvailable: false,
        rateLimit: { requests: 100, window: 3600, remaining: 0 },
        healthScore: 0,
        lastError: {
            type: 'provider_unavailable' as any,
            providerId: 'pixabay',
            message: 'Service temporarily unavailable',
        },
    },
];

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeProvider>{children}</ThemeProvider>
);

describe('MediaSearchHeader', () => {
    const defaultProps = {
        query: '',
        onQueryChange: jest.fn(),
        onSearch: jest.fn(),
        suggestions: [],
        showSuggestions: false,
        onSuggestionSelect: jest.fn(),
        onHideSuggestions: jest.fn(),
        filters: {} as MediaFilters,
        onFiltersChange: jest.fn(),
        showFilters: false,
        onToggleFilters: jest.fn(),
        onClearSearch: jest.fn(),
        onResetFilters: jest.fn(),
        availableProviders: mockProviders,
        activeProviders: ['unsplash', 'pexels'],
        onToggleProvider: jest.fn(),
        searchHistory: ['conference', 'business meeting'],
        onClearHistory: jest.fn(),
        savedSearches: ['technology', 'startup'],
        onSaveSearch: jest.fn(),
        onRemoveSavedSearch: jest.fn(),
    };

    it('renders search input correctly', () => {
        render(
            <TestWrapper>
                <MediaSearchHeader {...defaultProps} />
            </TestWrapper>
        );

        expect(
            screen.getByPlaceholderText('Search for images and videos...')
        ).toBeInTheDocument();
    });

    it('handles search input changes', () => {
        const onQueryChange = jest.fn();
        render(
            <TestWrapper>
                <MediaSearchHeader
                    {...defaultProps}
                    onQueryChange={onQueryChange}
                />
            </TestWrapper>
        );

        const searchInput = screen.getByPlaceholderText(
            'Search for images and videos...'
        );
        fireEvent.change(searchInput, { target: { value: 'test query' } });

        expect(onQueryChange).toHaveBeenCalledWith('test query');
    });

    it('displays category context when eventCategory is provided', () => {
        render(
            <TestWrapper>
                <MediaSearchHeader
                    {...defaultProps}
                    eventCategory={EventCategory.BusinessProfessional}
                />
            </TestWrapper>
        );

        expect(
            screen.getByText(/Searching for Business & Professional events/)
        ).toBeInTheDocument();
    });

    it('shows suggestions when available', () => {
        render(
            <TestWrapper>
                <MediaSearchHeader
                    {...defaultProps}
                    suggestions={['conference', 'meeting']}
                    showSuggestions={true}
                />
            </TestWrapper>
        );

        expect(screen.getByText('conference')).toBeInTheDocument();
        expect(screen.getByText('meeting')).toBeInTheDocument();
    });

    it('handles filter toggle', () => {
        const onToggleFilters = jest.fn();
        render(
            <TestWrapper>
                <MediaSearchHeader
                    {...defaultProps}
                    onToggleFilters={onToggleFilters}
                />
            </TestWrapper>
        );

        const filterButton = screen.getByTitle('Toggle filters');
        fireEvent.click(filterButton);

        expect(onToggleFilters).toHaveBeenCalled();
    });
});

describe('MediaSearchSidebar', () => {
    const defaultProps = {
        filters: {} as MediaFilters,
        onFiltersChange: jest.fn(),
        onResetFilters: jest.fn(),
        isVisible: true,
        onClose: jest.fn(),
    };

    it('renders when visible', () => {
        render(
            <TestWrapper>
                <MediaSearchSidebar {...defaultProps} />
            </TestWrapper>
        );

        expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('does not render when not visible', () => {
        render(
            <TestWrapper>
                <MediaSearchSidebar {...defaultProps} isVisible={false} />
            </TestWrapper>
        );

        expect(screen.queryByText('Filters')).not.toBeInTheDocument();
    });

    it('displays media type filters', () => {
        render(
            <TestWrapper>
                <MediaSearchSidebar {...defaultProps} />
            </TestWrapper>
        );

        expect(screen.getByText('Media Type')).toBeInTheDocument();
        expect(screen.getByText('All Media')).toBeInTheDocument();
        expect(screen.getByText('Images Only')).toBeInTheDocument();
        expect(screen.getByText('Videos Only')).toBeInTheDocument();
    });

    it('displays orientation filters', () => {
        render(
            <TestWrapper>
                <MediaSearchSidebar {...defaultProps} />
            </TestWrapper>
        );

        expect(screen.getByText('Orientation')).toBeInTheDocument();
        expect(screen.getByText('Any Orientation')).toBeInTheDocument();
        expect(screen.getByText('Landscape')).toBeInTheDocument();
        expect(screen.getByText('Portrait')).toBeInTheDocument();
        expect(screen.getByText('Square')).toBeInTheDocument();
    });

    it('handles filter changes', () => {
        const onFiltersChange = jest.fn();
        render(
            <TestWrapper>
                <MediaSearchSidebar
                    {...defaultProps}
                    onFiltersChange={onFiltersChange}
                />
            </TestWrapper>
        );

        const landscapeRadio = screen.getByDisplayValue('landscape');
        fireEvent.click(landscapeRadio);

        expect(onFiltersChange).toHaveBeenCalledWith({
            orientation: 'landscape',
        });
    });

    it('shows event category context when provided', () => {
        render(
            <TestWrapper>
                <MediaSearchSidebar
                    {...defaultProps}
                    eventCategory={EventCategory.TechnologyInnovation}
                />
            </TestWrapper>
        );

        expect(screen.getByText('Current Event Category')).toBeInTheDocument();
        expect(screen.getByText('Technology & Innovation')).toBeInTheDocument();
    });
});

describe('ProviderStatusIndicator', () => {
    const defaultProps = {
        providers: mockProviders,
        activeProviders: ['unsplash', 'pexels'],
        onToggleProvider: jest.fn(),
    };

    it('renders provider status summary', () => {
        render(
            <TestWrapper>
                <ProviderStatusIndicator {...defaultProps} />
            </TestWrapper>
        );

        expect(screen.getByText('Provider Status')).toBeInTheDocument();
        expect(screen.getByText('2/2 active')).toBeInTheDocument();
    });

    it('displays all providers', () => {
        render(
            <TestWrapper>
                <ProviderStatusIndicator {...defaultProps} showDetails={true} />
            </TestWrapper>
        );

        expect(screen.getByText('Unsplash')).toBeInTheDocument();
        expect(screen.getByText('Pexels')).toBeInTheDocument();
        expect(screen.getByText('Pixabay')).toBeInTheDocument();
    });

    it('shows provider health scores when details enabled', () => {
        render(
            <TestWrapper>
                <ProviderStatusIndicator {...defaultProps} showDetails={true} />
            </TestWrapper>
        );

        expect(screen.getByText('Health: 95%')).toBeInTheDocument();
        expect(screen.getByText('Health: 88%')).toBeInTheDocument();
        expect(screen.getByText('Health: 0%')).toBeInTheDocument();
    });

    it('displays error messages for unavailable providers', () => {
        render(
            <TestWrapper>
                <ProviderStatusIndicator {...defaultProps} showDetails={true} />
            </TestWrapper>
        );

        expect(
            screen.getByText('Service temporarily unavailable')
        ).toBeInTheDocument();
        expect(screen.getByText('Unavailable')).toBeInTheDocument();
    });

    it('handles provider toggle', () => {
        const onToggleProvider = jest.fn();
        render(
            <TestWrapper>
                <ProviderStatusIndicator
                    {...defaultProps}
                    onToggleProvider={onToggleProvider}
                    showDetails={true}
                />
            </TestWrapper>
        );

        const unsplashCheckbox = screen.getByLabelText(
            'Toggle Unsplash provider'
        );
        fireEvent.click(unsplashCheckbox);

        expect(onToggleProvider).toHaveBeenCalledWith('unsplash');
    });

    it('shows empty state when no providers available', () => {
        render(
            <TestWrapper>
                <ProviderStatusIndicator
                    providers={[]}
                    activeProviders={[]}
                    onToggleProvider={jest.fn()}
                />
            </TestWrapper>
        );

        expect(
            screen.getByText('No media providers available')
        ).toBeInTheDocument();
    });
});
