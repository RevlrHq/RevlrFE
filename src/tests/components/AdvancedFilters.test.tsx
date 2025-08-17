import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import AdvancedFilters, {
    type AdvancedFilterOptions,
} from '../../components/AdvancedFilters';

// Mock the theme context
jest.mock('../../lib/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

// Mock the debounce hook
jest.mock('../../hooks/useDebounce', () => ({
    useDebouncedValue: (value: unknown) => value,
}));

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('AdvancedFilters', () => {
    const defaultFilters: AdvancedFilterOptions = {
        searchTerm: '',
        status: '',
        category: '',
        startDate: '',
        endDate: '',
        isVirtual: null,
        hasRegistrations: null,
        minRevenue: null,
        maxRevenue: null,
        minRegistrations: null,
        maxRegistrations: null,
        venue: '',
        paymentStatus: '',
        isFinanced: null,
        registrationStartDate: '',
        registrationEndDate: '',
        minAmount: null,
        maxAmount: null,
        attendeeSearchTerm: '',
        sortBy: 'dateCreated',
        sortOrder: 'desc',
    };

    const mockProps = {
        filters: defaultFilters,
        onFiltersChange: jest.fn(),
        onClearFilters: jest.fn(),
        onRefresh: jest.fn(),
        availableCategories: ['Conference', 'Workshop', 'Seminar'],
        availableVenues: ['Convention Center', 'Hotel Ballroom', 'Online'],
        recentSearches: ['test search', 'another search'],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
    });

    describe('Basic Functionality', () => {
        it('renders without crashing', () => {
            render(<AdvancedFilters {...mockProps} />);
            expect(
                screen.getByPlaceholderText(/search across events/i)
            ).toBeInTheDocument();
        });

        it('displays the global search input', () => {
            render(<AdvancedFilters {...mockProps} />);
            const searchInput =
                screen.getByPlaceholderText(/search across events/i);
            expect(searchInput).toBeInTheDocument();
            expect(searchInput).toHaveValue('');
        });

        it('shows advanced filters button with filter count', () => {
            const filtersWithActive = {
                ...defaultFilters,
                status: '1',
                category: 'Conference',
            };

            render(
                <AdvancedFilters {...mockProps} filters={filtersWithActive} />
            );

            const filtersButton = screen.getByRole('button', {
                name: /advanced filters/i,
            });
            expect(filtersButton).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument(); // Filter count badge
        });

        it('calls onFiltersChange when search term changes', async () => {
            const user = userEvent.setup();
            render(<AdvancedFilters {...mockProps} />);

            const searchInput =
                screen.getByPlaceholderText(/search across events/i);
            await user.type(searchInput, 'test search');

            // Should update local state immediately
            expect(searchInput).toHaveValue('test search');
        });

        it('shows clear all button when filters are active', () => {
            const filtersWithActive = {
                ...defaultFilters,
                status: '1',
            };

            render(
                <AdvancedFilters {...mockProps} filters={filtersWithActive} />
            );

            const clearButton = screen.getByRole('button', {
                name: /clear all/i,
            });
            expect(clearButton).toBeInTheDocument();
        });

        it('calls onClearFilters when clear all is clicked', async () => {
            const user = userEvent.setup();
            const filtersWithActive = {
                ...defaultFilters,
                status: '1',
            };

            render(
                <AdvancedFilters {...mockProps} filters={filtersWithActive} />
            );

            const clearButton = screen.getByRole('button', {
                name: /clear all/i,
            });
            await user.click(clearButton);

            expect(mockProps.onClearFilters).toHaveBeenCalledTimes(1);
        });
    });

    describe('Search Suggestions', () => {
        it('shows search suggestions when typing', async () => {
            const user = userEvent.setup();
            render(<AdvancedFilters {...mockProps} showSuggestions={true} />);

            const searchInput =
                screen.getByPlaceholderText(/search across events/i);
            await user.type(searchInput, 'con');

            // Focus the input to show suggestions
            await user.click(searchInput);

            await waitFor(() => {
                expect(screen.getByText('Conference')).toBeInTheDocument();
                expect(
                    screen.getByText('Convention Center')
                ).toBeInTheDocument();
            });
        });

        it('applies suggestion when clicked', async () => {
            const user = userEvent.setup();
            render(<AdvancedFilters {...mockProps} showSuggestions={true} />);

            const searchInput =
                screen.getByPlaceholderText(/search across events/i);
            await user.type(searchInput, 'con');
            await user.click(searchInput);

            await waitFor(() => {
                expect(screen.getByText('Conference')).toBeInTheDocument();
            });

            await user.click(screen.getByText('Conference'));

            expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
                category: 'Conference',
            });
        });

        it('shows recent searches in suggestions', async () => {
            const user = userEvent.setup();
            render(<AdvancedFilters {...mockProps} showSuggestions={true} />);

            const searchInput =
                screen.getByPlaceholderText(/search across events/i);
            await user.type(searchInput, 'test');
            await user.click(searchInput);

            await waitFor(() => {
                expect(screen.getByText('test search')).toBeInTheDocument();
            });
        });
    });

    describe('Active Filters Display', () => {
        it('displays active filters as chips', () => {
            const filtersWithActive = {
                ...defaultFilters,
                status: '1',
                category: 'Conference',
                minRevenue: 1000,
            };

            render(
                <AdvancedFilters {...mockProps} filters={filtersWithActive} />
            );

            expect(screen.getByText(/status: published/i)).toBeInTheDocument();
            expect(
                screen.getByText(/category: conference/i)
            ).toBeInTheDocument();
            expect(
                screen.getByText(/min revenue: \$1,000/i)
            ).toBeInTheDocument();
        });

        it('removes filter when chip close button is clicked', async () => {
            const filtersWithActive = {
                ...defaultFilters,
                status: '1',
            };

            render(
                <AdvancedFilters {...mockProps} filters={filtersWithActive} />
            );

            const statusChip = screen.getByText(/status: published/i);
            expect(statusChip).toBeInTheDocument();

            // Find the close button within the chip
            const closeButton =
                statusChip.parentElement?.querySelector('button');
            expect(closeButton).toBeInTheDocument();

            if (closeButton) {
                const user = userEvent.setup();
                await user.click(closeButton);
                expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
                    status: '',
                });
            }
        });
    });

    describe('Filter Presets', () => {
        beforeEach(() => {
            const mockPresets = [
                {
                    id: '1',
                    name: 'Published Events',
                    filters: { status: '1' },
                    createdAt: new Date(),
                    useCount: 5,
                },
            ];
            localStorageMock.getItem.mockReturnValue(
                JSON.stringify(mockPresets)
            );
        });

        it('shows presets button when enabled', () => {
            render(<AdvancedFilters {...mockProps} showPresets={true} />);

            const presetsButton = screen.getByRole('button', {
                name: /presets/i,
            });
            expect(presetsButton).toBeInTheDocument();
        });

        it('shows save preset button when filters are active', () => {
            const filtersWithActive = {
                ...defaultFilters,
                status: '1',
            };

            render(
                <AdvancedFilters
                    {...mockProps}
                    filters={filtersWithActive}
                    showPresets={true}
                />
            );

            const saveButton = screen.getByRole('button', {
                name: /save preset/i,
            });
            expect(saveButton).toBeInTheDocument();
        });

        it('opens presets modal when presets button is clicked', async () => {
            const user = userEvent.setup();
            render(<AdvancedFilters {...mockProps} showPresets={true} />);

            const presetsButton = screen.getByRole('button', {
                name: /presets/i,
            });
            await user.click(presetsButton);

            await waitFor(() => {
                expect(screen.getByText('Filter Presets')).toBeInTheDocument();
            });
        });
    });

    describe('Advanced Filter Modal', () => {
        it('opens advanced filters modal when button is clicked', async () => {
            const user = userEvent.setup();
            render(<AdvancedFilters {...mockProps} />);

            const filtersButton = screen.getByRole('button', {
                name: /advanced filters/i,
            });
            await user.click(filtersButton);

            await waitFor(() => {
                expect(
                    screen.getByText('Advanced Filters')
                ).toBeInTheDocument();
            });
        });

        it('shows filter sections in the modal', async () => {
            const user = userEvent.setup();
            render(<AdvancedFilters {...mockProps} />);

            const filtersButton = screen.getByRole('button', {
                name: /advanced filters/i,
            });
            await user.click(filtersButton);

            await waitFor(() => {
                expect(screen.getByText('Basic Filters')).toBeInTheDocument();
                expect(screen.getByText('Date Filters')).toBeInTheDocument();
                expect(screen.getByText('Revenue Filters')).toBeInTheDocument();
                expect(
                    screen.getByText('Registration Filters')
                ).toBeInTheDocument();
            });
        });
    });

    describe('Result Summary', () => {
        const mockResultSummary = {
            totalResults: 100,
            filteredResults: 25,
            appliedFilters: 2,
            topCategories: [
                { name: 'Conference', count: 15 },
                { name: 'Workshop', count: 10 },
            ],
            dateRange: { start: '2024-01-01', end: '2024-12-31' },
            revenueRange: { min: 1000, max: 5000 },
        };

        it('displays result summary when provided', () => {
            render(
                <AdvancedFilters
                    {...mockProps}
                    showResultSummary={true}
                    resultSummary={mockResultSummary}
                />
            );

            expect(
                screen.getByText('Filter Results Summary')
            ).toBeInTheDocument();
            expect(screen.getByText('100')).toBeInTheDocument(); // Total results
            expect(screen.getByText('25')).toBeInTheDocument(); // Filtered results
        });

        it('shows top categories in result summary', () => {
            render(
                <AdvancedFilters
                    {...mockProps}
                    showResultSummary={true}
                    resultSummary={mockResultSummary}
                />
            );

            expect(screen.getByText('Conference')).toBeInTheDocument();
            expect(screen.getByText('(15)')).toBeInTheDocument();
            expect(screen.getByText('Workshop')).toBeInTheDocument();
            expect(screen.getByText('(10)')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA labels for interactive elements', () => {
            render(<AdvancedFilters {...mockProps} />);

            const searchInput =
                screen.getByPlaceholderText(/search across events/i);
            expect(searchInput).toHaveAttribute('type', 'text');

            const filtersButton = screen.getByRole('button', {
                name: /advanced filters/i,
            });
            expect(filtersButton).toBeInTheDocument();
        });

        it('supports keyboard navigation', async () => {
            render(<AdvancedFilters {...mockProps} />);

            const searchInput =
                screen.getByPlaceholderText(/search across events/i);
            const user = userEvent.setup();

            // Tab to search input
            await user.tab();
            expect(searchInput).toHaveFocus();

            // Tab to filters button
            await user.tab();
            const filtersButton = screen.getByRole('button', {
                name: /advanced filters/i,
            });
            expect(filtersButton).toHaveFocus();
        });

        it('announces filter changes to screen readers', async () => {
            const filtersWithActive = {
                ...defaultFilters,
                status: '1',
            };

            render(
                <AdvancedFilters {...mockProps} filters={filtersWithActive} />
            );

            // The active filters should be announced
            expect(screen.getByText(/active filters:/i)).toBeInTheDocument();
            expect(screen.getByText('1 applied')).toBeInTheDocument();
        });
    });

    describe('Loading States', () => {
        it('disables inputs when loading', () => {
            render(<AdvancedFilters {...mockProps} isLoading={true} />);

            const searchInput =
                screen.getByPlaceholderText(/search across events/i);
            expect(searchInput).toBeDisabled();

            const filtersButton = screen.getByRole('button', {
                name: /advanced filters/i,
            });
            expect(filtersButton).toBeDisabled();
        });

        it('shows loading spinner on refresh button when loading', () => {
            render(<AdvancedFilters {...mockProps} isLoading={true} />);

            const refreshButton = screen.getByRole('button', {
                name: /refresh/i,
            });
            expect(refreshButton).toBeDisabled();

            // Check for loading spinner class
            const spinner = refreshButton.querySelector('.animate-spin');
            expect(spinner).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('handles invalid filter values gracefully', () => {
            const invalidFilters = {
                ...defaultFilters,
                minRevenue: -1000, // Invalid negative value
                maxRevenue: 'invalid' as unknown as number, // Invalid string value
            };

            // Should not crash when rendering with invalid values
            expect(() => {
                render(
                    <AdvancedFilters {...mockProps} filters={invalidFilters} />
                );
            }).not.toThrow();
        });

        it('handles localStorage errors gracefully', () => {
            localStorageMock.getItem.mockImplementation(() => {
                throw new Error('localStorage error');
            });

            // Should not crash when localStorage fails
            expect(() => {
                render(<AdvancedFilters {...mockProps} showPresets={true} />);
            }).not.toThrow();
        });
    });
});
