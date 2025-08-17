import React from 'react';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import EnhancedEventTable from '../../components/EnhancedEventTable';

// Simple mock setup
jest.mock('../../lib/api', () => ({
    OrganizerService: {
        getApiOrganizerEvents: jest.fn().mockResolvedValue({
            success: true,
            data: {
                items: [],
                totalPages: 1,
                totalItems: 0,
                pageNumber: 1,
                pageSize: 10,
            },
            message: null,
        }),
        postApiOrganizerEventsBulkAction: jest.fn(),
        postApiOrganizerEventsDuplicate: jest.fn(),
    },
}));

jest.mock('../../lib/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

// Mock the child components to avoid complex rendering issues
jest.mock('../../components/EventTableRow', () => {
    return function MockEventTableRow() {
        return (
            <tr>
                <td>Mock Event Row</td>
            </tr>
        );
    };
});

jest.mock('../../components/EventMobileCard', () => {
    return function MockEventMobileCard() {
        return <div>Mock Event Card</div>;
    };
});

jest.mock('../../components/EventTablePagination', () => {
    return function MockEventTablePagination() {
        return <div>Mock Pagination</div>;
    };
});

jest.mock('../../components/EventTableModals', () => {
    return function MockEventTableModals() {
        return <div>Mock Modals</div>;
    };
});

describe('EnhancedEventTable - Simple Integration', () => {
    it('renders without crashing', () => {
        render(<EnhancedEventTable />);

        // Check for basic elements
        expect(
            screen.getByPlaceholderText('Search events...')
        ).toBeInTheDocument();
        expect(screen.getByText('Filters')).toBeInTheDocument();
        expect(screen.getByText('Export')).toBeInTheDocument();
        expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('renders with custom props', () => {
        const mockOnEventView = jest.fn();
        const mockOnEventEdit = jest.fn();

        render(
            <EnhancedEventTable
                onEventView={mockOnEventView}
                onEventEdit={mockOnEventEdit}
                showActions={true}
                showBulkActions={true}
                showExport={true}
                defaultPageSize={25}
            />
        );

        expect(
            screen.getByPlaceholderText('Search events...')
        ).toBeInTheDocument();
    });

    it('renders with disabled features', () => {
        render(
            <EnhancedEventTable
                showActions={false}
                showBulkActions={false}
                showExport={false}
            />
        );

        expect(
            screen.getByPlaceholderText('Search events...')
        ).toBeInTheDocument();
        expect(screen.getByText('Filters')).toBeInTheDocument();
        expect(screen.queryByText('Export')).not.toBeInTheDocument();
    });
});
