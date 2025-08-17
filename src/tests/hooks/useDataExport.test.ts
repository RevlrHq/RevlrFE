import { renderHook, act } from '@testing-library/react';
import { useDataExport } from '@/hooks/useDataExport';
import { ExportService } from '@/lib/services/ExportService';
import type {
    EventSummaryView,
    EventRegistrationSummary,
    MonthlyRevenue,
} from '@/lib/api';

// Mock the ExportService
jest.mock('@/lib/services/ExportService');
const mockExportService = ExportService as jest.Mocked<typeof ExportService>;

describe('useDataExport', () => {
    const mockOnExportStart = jest.fn();
    const mockOnExportComplete = jest.fn();
    const mockOnExportError = jest.fn();

    const mockEvents: EventSummaryView[] = [
        {
            id: '1',
            title: 'Test Event',
            status: 'Published',
        } as EventSummaryView,
    ];

    const mockRegistrations: EventRegistrationSummary[] = [
        {
            registrationId: 'reg1',
            eventId: 'event1',
            attendeeEmail: 'test@example.com',
        } as EventRegistrationSummary,
    ];

    const mockRevenue: MonthlyRevenue[] = [
        {
            year: 2024,
            month: 1,
            monthName: 'January',
            revenue: 1000,
        } as MonthlyRevenue,
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Default successful mock
        mockExportService.exportEvents.mockResolvedValue({
            success: true,
            filename: 'test-export.csv',
            downloadUrl: 'mock-url',
        });

        mockExportService.exportRegistrations.mockResolvedValue({
            success: true,
            filename: 'test-registrations.csv',
            downloadUrl: 'mock-url',
        });

        mockExportService.exportRevenue.mockResolvedValue({
            success: true,
            filename: 'test-revenue.csv',
            downloadUrl: 'mock-url',
        });

        mockExportService.exportData.mockResolvedValue({
            success: true,
            filename: 'test-data.csv',
            downloadUrl: 'mock-url',
        });
    });

    it('initializes with correct default state', () => {
        const { result } = renderHook(() => useDataExport());

        expect(result.current.isExporting).toBe(false);
        expect(result.current.exportProgress).toBe(0);
        expect(result.current.exportError).toBe(null);
    });

    describe('exportEvents', () => {
        it('exports events successfully', async () => {
            const { result } = renderHook(() =>
                useDataExport({
                    onExportStart: mockOnExportStart,
                    onExportComplete: mockOnExportComplete,
                })
            );

            let exportPromise: Promise<any>;

            act(() => {
                exportPromise = result.current.exportEvents(mockEvents, {
                    format: 'csv',
                    includeFields: ['id', 'title'],
                });
            });

            expect(result.current.isExporting).toBe(true);
            expect(mockOnExportStart).toHaveBeenCalled();

            await act(async () => {
                const exportResult = await exportPromise;
                expect(exportResult.success).toBe(true);
            });

            expect(mockExportService.exportEvents).toHaveBeenCalledWith(
                mockEvents,
                {
                    format: 'csv',
                    includeFields: ['id', 'title'],
                }
            );
            expect(mockOnExportComplete).toHaveBeenCalledWith({
                success: true,
                filename: 'test-export.csv',
                downloadUrl: 'mock-url',
            });
            expect(result.current.isExporting).toBe(false);
            expect(result.current.exportProgress).toBe(100);
        });

        it('handles export failure', async () => {
            const errorMessage = 'Export failed';
            mockExportService.exportEvents.mockRejectedValue(
                new Error(errorMessage)
            );

            const { result } = renderHook(() =>
                useDataExport({
                    onExportError: mockOnExportError,
                })
            );

            await act(async () => {
                const exportResult = await result.current.exportEvents(
                    mockEvents,
                    {
                        format: 'csv',
                        includeFields: ['id', 'title'],
                    }
                );
                expect(exportResult.success).toBe(false);
                expect(exportResult.error).toBe(errorMessage);
            });

            expect(result.current.exportError).toBe(errorMessage);
            expect(mockOnExportError).toHaveBeenCalledWith(errorMessage);
            expect(result.current.isExporting).toBe(false);
        });

        it('handles service returning error result', async () => {
            const errorResult = {
                success: false,
                filename: '',
                error: 'Service error',
            };
            mockExportService.exportEvents.mockResolvedValue(errorResult);

            const { result } = renderHook(() =>
                useDataExport({
                    onExportError: mockOnExportError,
                })
            );

            await act(async () => {
                const exportResult = await result.current.exportEvents(
                    mockEvents,
                    {
                        format: 'csv',
                        includeFields: ['id', 'title'],
                    }
                );
                expect(exportResult).toEqual(errorResult);
            });

            expect(result.current.exportError).toBe('Service error');
            expect(mockOnExportError).toHaveBeenCalledWith('Service error');
        });
    });

    describe('exportRegistrations', () => {
        it('exports registrations successfully', async () => {
            const { result } = renderHook(() =>
                useDataExport({
                    onExportComplete: mockOnExportComplete,
                })
            );

            await act(async () => {
                await result.current.exportRegistrations(mockRegistrations, {
                    format: 'excel',
                    includeFields: ['registrationId', 'attendeeEmail'],
                });
            });

            expect(mockExportService.exportRegistrations).toHaveBeenCalledWith(
                mockRegistrations,
                {
                    format: 'excel',
                    includeFields: ['registrationId', 'attendeeEmail'],
                }
            );
            expect(mockOnExportComplete).toHaveBeenCalled();
        });
    });

    describe('exportRevenue', () => {
        it('exports revenue successfully', async () => {
            const { result } = renderHook(() =>
                useDataExport({
                    onExportComplete: mockOnExportComplete,
                })
            );

            await act(async () => {
                await result.current.exportRevenue(mockRevenue, {
                    format: 'pdf',
                    includeFields: ['monthName', 'revenue'],
                });
            });

            expect(mockExportService.exportRevenue).toHaveBeenCalledWith(
                mockRevenue,
                {
                    format: 'pdf',
                    includeFields: ['monthName', 'revenue'],
                }
            );
            expect(mockOnExportComplete).toHaveBeenCalled();
        });
    });

    describe('exportData', () => {
        it('exports generic data successfully', async () => {
            const genericData = [{ id: 1, name: 'Test' }];
            const { result } = renderHook(() => useDataExport());

            await act(async () => {
                await result.current.exportData(genericData, {
                    format: 'csv',
                    dataType: 'events',
                    includeFields: ['id', 'name'],
                });
            });

            expect(mockExportService.exportData).toHaveBeenCalledWith(
                genericData,
                {
                    format: 'csv',
                    dataType: 'events',
                    includeFields: ['id', 'name'],
                }
            );
        });
    });

    describe('clearError', () => {
        it('clears export error', async () => {
            mockExportService.exportEvents.mockRejectedValue(
                new Error('Test error')
            );

            const { result } = renderHook(() => useDataExport());

            // Trigger an error
            await act(async () => {
                await result.current.exportEvents(mockEvents, {
                    format: 'csv',
                    includeFields: ['id', 'title'],
                });
            });

            expect(result.current.exportError).toBe('Test error');

            // Clear the error
            act(() => {
                result.current.clearError();
            });

            expect(result.current.exportError).toBe(null);
        });
    });

    describe('progress tracking', () => {
        it('tracks progress during export', async () => {
            const { result } = renderHook(() => useDataExport());

            await act(async () => {
                await result.current.exportEvents(mockEvents, {
                    format: 'csv',
                    includeFields: ['id', 'title'],
                });
            });

            expect(result.current.exportProgress).toBe(100);
        });
    });
});
