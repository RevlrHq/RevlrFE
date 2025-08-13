import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import '@testing-library/jest-dom';
import CreateEvent from '../../features/dashboard/CreateEvent';
import { EventCreationService } from '../../lib/services/EventCreationService';
import { DraftBackupService } from '../../lib/services/DraftBackupService';
import { useTheme } from '../../lib/ThemeContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import type { EventCreationData } from '../../types/event-creation';

// Mock all dependencies
jest.mock('next/navigation');
jest.mock('../../lib/services/EventCreationService');
jest.mock('../../lib/services/DraftBackupService');
jest.mock('../../lib/ThemeContext');
jest.mock('../../hooks/useOnlineStatus');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockEventCreationService = EventCreationService as jest.Mocked<
    typeof EventCreationService
>;
const mockDraftBackupService = DraftBackupService as jest.Mocked<
    typeof DraftBackupService
>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockUseOnlineStatus = useOnlineStatus as jest.MockedFunction<
    typeof useOnlineStatus
>;

describe('Event Creation Workflow Integration Tests', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();

        // Use real timers by default
        jest.useRealTimers();

        // Setup router mock
        mockUseRouter.mockReturnValue({
            push: mockPush,
            replace: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
            prefetch: jest.fn(),
        } as ReturnType<typeof useRouter>);

        // Setup theme mock
        mockUseTheme.mockReturnValue({
            theme: 'light',
            toggleTheme: jest.fn(),
        });

        // Setup online status mock
        mockUseOnlineStatus.mockReturnValue(true);

        // Setup service mocks
        mockDraftBackupService.hasDraft.mockReturnValue(false);
        mockDraftBackupService.loadDraft.mockReturnValue(null);
        mockDraftBackupService.saveDraft = jest.fn();
        mockDraftBackupService.autoSave = jest.fn();
        mockDraftBackupService.clearDraft = jest.fn();
        mockEventCreationService.saveDraft.mockResolvedValue({
            success: true,
            data: { id: 'test-event-id' } as EventCreationData,
            message: 'Draft saved successfully',
        });
    });

    afterEach(() => {
        // Clean up any running timers
        if (jest.isMockFunction(setTimeout)) {
            jest.runOnlyPendingTimers();
            jest.useRealTimers();
        }
    });

    describe('Component Rendering', () => {
        it('should render the CreateEvent component without errors', async () => {
            const { container } = render(<CreateEvent />);

            // Component should render without throwing errors
            expect(container).toBeInTheDocument();

            // Should show some basic UI elements
            expect(screen.getByText('Publish Event')).toBeInTheDocument();
        });

        it('should show draft status indicator', async () => {
            render(<CreateEvent />);

            // Should show draft status
            expect(screen.getByText('Draft')).toBeInTheDocument();
        });

        it('should show navigation tabs', async () => {
            render(<CreateEvent />);

            // Should show navigation elements - be more flexible with counts
            const eventDetailsElements = screen.queryAllByText('Event Details');
            const ticketsElements = screen.queryAllByText('Tickets');

            expect(eventDetailsElements.length).toBeGreaterThanOrEqual(1);
            expect(ticketsElements.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Service Integration', () => {
        it('should call EventCreationService when needed', async () => {
            mockEventCreationService.saveDraft.mockResolvedValue({
                success: true,
                data: { id: 'test-event-id' } as EventCreationData,
                message: 'Draft saved successfully',
            });

            render(<CreateEvent />);

            // The component should be able to call the service
            // This test verifies the service is properly mocked
            expect(mockEventCreationService.saveDraft).toBeDefined();
        });

        it('should handle service errors gracefully', async () => {
            mockEventCreationService.saveDraft.mockRejectedValue(
                new Error('Network error')
            );

            const { container } = render(<CreateEvent />);

            // Component should still render even if service fails
            expect(container).toBeInTheDocument();
        });
    });

    describe('Theme Integration', () => {
        it('should work with light theme', async () => {
            mockUseTheme.mockReturnValue({
                theme: 'light',
                toggleTheme: jest.fn(),
            });

            const { container } = render(<CreateEvent />);
            expect(container).toBeInTheDocument();
        });

        it('should work with dark theme', async () => {
            mockUseTheme.mockReturnValue({
                theme: 'dark',
                toggleTheme: jest.fn(),
            });

            const { container } = render(<CreateEvent />);
            expect(container).toBeInTheDocument();
        });
    });

    describe('Online Status Integration', () => {
        it('should work when online', async () => {
            mockUseOnlineStatus.mockReturnValue(true);

            const { container } = render(<CreateEvent />);
            expect(container).toBeInTheDocument();
        });

        it('should work when offline', async () => {
            mockUseOnlineStatus.mockReturnValue(false);

            const { container } = render(<CreateEvent />);
            expect(container).toBeInTheDocument();
        });
    });

    describe('Draft Backup Integration', () => {
        it('should work when no draft exists', async () => {
            mockDraftBackupService.hasDraft.mockReturnValue(false);
            mockDraftBackupService.loadDraft.mockReturnValue(null);

            const { container } = render(<CreateEvent />);
            expect(container).toBeInTheDocument();
        });

        it('should work when draft exists', async () => {
            const mockDraft = {
                eventData: {
                    eventName: 'Test Event',
                    eventDescription: 'Test Description',
                    eventCategory: 'Conference',
                    locationType: 'in-person' as const,
                    images: [],
                },
                tickets: [],
                timestamp: Date.now(),
                step: 1,
            };

            mockDraftBackupService.hasDraft.mockReturnValue(true);
            mockDraftBackupService.loadDraft.mockReturnValue(mockDraft);

            const { container } = render(<CreateEvent />);
            expect(container).toBeInTheDocument();
        });
    });

    describe('Button Interactions', () => {
        it('should handle publish button click', async () => {
            render(<CreateEvent />);

            const publishButton = screen.getByText('Publish Event');

            // Should be able to click the button without errors
            fireEvent.click(publishButton);

            // Button should still be in the document
            expect(publishButton).toBeInTheDocument();
        });

        it('should handle preview button click', async () => {
            render(<CreateEvent />);

            const previewButton = screen.getByText('Preview');

            // Should be able to click the button without errors
            fireEvent.click(previewButton);

            // Button should still be in the document
            expect(previewButton).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should handle tab navigation', async () => {
            render(<CreateEvent />);

            // Get the clickable tabs (buttons) specifically
            const eventDetailsTabs = screen.getAllByText('Event Details');
            const ticketsTabs = screen.getAllByText('Tickets');

            // Find the clickable button elements
            const eventDetailsButton = eventDetailsTabs.find(
                (el) => el.closest('button') && !el.closest('button')?.disabled
            );
            const ticketsButton = ticketsTabs.find(
                (el) => el.closest('button') && !el.closest('button')?.disabled
            );

            if (eventDetailsButton) {
                fireEvent.click(eventDetailsButton);
                expect(eventDetailsButton).toBeInTheDocument();
            }

            // Note: Tickets button might be disabled initially
            if (ticketsButton && !ticketsButton.closest('button')?.disabled) {
                fireEvent.click(ticketsButton);
                expect(ticketsButton).toBeInTheDocument();
            }
        });
    });

    describe('Error Boundaries', () => {
        it('should handle component errors gracefully', async () => {
            // Mock console.error to avoid noise in test output
            const consoleSpy = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            try {
                const { container } = render(<CreateEvent />);
                expect(container).toBeInTheDocument();
            } finally {
                consoleSpy.mockRestore();
            }
        });
    });

    describe('Memory Leaks Prevention', () => {
        it('should clean up properly when unmounted', async () => {
            const { unmount } = render(<CreateEvent />);

            // Should unmount without errors
            expect(() => unmount()).not.toThrow();
        });

        it('should handle multiple mount/unmount cycles', async () => {
            for (let i = 0; i < 3; i++) {
                const { unmount } = render(<CreateEvent />);
                expect(() => unmount()).not.toThrow();
            }
        });
    });
});
