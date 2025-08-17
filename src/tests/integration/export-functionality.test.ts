import { ExportService } from '@/lib/services/ExportService';
import { getExportFields } from '@/lib/constants/exportFields';
import type {
    EventSummaryView,
    EventRegistrationSummary,
    MonthlyRevenue,
} from '@/lib/api';

// Mock DOM methods for file download
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();
global.Blob = jest.fn().mockImplementation((content, options) => ({
    content,
    options,
    size: content[0].length,
    type: options?.type || 'text/plain',
})) as jest.MockedClass<typeof Blob>;

const mockLink = {
    href: '',
    download: '',
    click: jest.fn(),
};

Object.defineProperty(document, 'createElement', {
    value: jest.fn().mockImplementation((tagName) => {
        if (tagName === 'a') {
            return mockLink;
        }
        return {};
    }),
});

Object.defineProperty(document.body, 'appendChild', {
    value: jest.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
    value: jest.fn(),
});

describe('Export Functionality Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Field Definitions', () => {
        it('provides correct fields for events export', () => {
            const fields = getExportFields('events');

            expect(fields).toHaveLength(14);
            expect(fields.find((f) => f.key === 'id')).toBeDefined();
            expect(fields.find((f) => f.key === 'title')).toBeDefined();
            expect(fields.find((f) => f.key === 'revenue')).toBeDefined();

            // Check required fields
            const requiredFields = fields.filter((f) => f.required);
            expect(requiredFields.length).toBeGreaterThan(0);
            expect(requiredFields.find((f) => f.key === 'id')).toBeDefined();
        });

        it('provides correct fields for registrations export', () => {
            const fields = getExportFields('registrations');

            expect(fields).toHaveLength(11);
            expect(
                fields.find((f) => f.key === 'registrationId')
            ).toBeDefined();
            expect(fields.find((f) => f.key === 'attendeeEmail')).toBeDefined();
            expect(fields.find((f) => f.key === 'paymentStatus')).toBeDefined();
        });

        it('provides correct fields for revenue export', () => {
            const fields = getExportFields('revenue');

            expect(fields).toHaveLength(12);
            expect(fields.find((f) => f.key === 'monthName')).toBeDefined();
            expect(fields.find((f) => f.key === 'revenue')).toBeDefined();
        });
    });

    describe('End-to-End Export Flow', () => {
        const mockEvents: EventSummaryView[] = [
            {
                id: '1',
                title: 'Tech Conference 2024',
                status: 'Published',
                category: 'Conference',
                categoryDescription: 'Technology Conference',
                startDate: '2024-03-15T09:00:00Z',
                endDate: '2024-03-15T17:00:00Z',
                isVirtual: false,
                venue: 'Convention Center',
                registrationCount: 150,
                ticketsSold: 140,
                totalTickets: 200,
                revenue: 7000,
                dateCreated: '2024-01-01T00:00:00Z',
                dateUpdated: '2024-02-15T00:00:00Z',
            },
            {
                id: '2',
                title: 'Virtual Workshop',
                status: 'Draft',
                category: 'Workshop',
                categoryDescription: 'Online Workshop',
                startDate: '2024-04-20T14:00:00Z',
                endDate: '2024-04-20T16:00:00Z',
                isVirtual: true,
                venue: null,
                registrationCount: 50,
                ticketsSold: 45,
                totalTickets: 100,
                revenue: 2250,
                dateCreated: '2024-02-01T00:00:00Z',
                dateUpdated: null,
            },
        ];

        it('exports events data with selected fields', async () => {
            const result = await ExportService.exportEvents(mockEvents, {
                format: 'csv',
                includeFields: [
                    'id',
                    'title',
                    'status',
                    'revenue',
                    'isVirtual',
                ],
            });

            expect(result.success).toBe(true);
            expect(result.filename).toMatch(
                /events_export_\d{4}-\d{2}-\d{2}\.csv/
            );

            // Verify CSV content structure
            const blobCall = (global.Blob as jest.Mock).mock.calls[0];
            const csvContent = blobCall[0][0];

            expect(csvContent).toContain('id,title,status,revenue,isVirtual');
            expect(csvContent).toContain('Tech Conference 2024');
            expect(csvContent).toContain('Virtual Workshop');
            expect(csvContent).toContain('Yes'); // isVirtual: true -> 'Yes'
            expect(csvContent).toContain('No'); // isVirtual: false -> 'No'
        });

        it('handles data formatting correctly', async () => {
            const result = await ExportService.exportEvents(mockEvents, {
                format: 'csv',
                includeFields: ['title', 'startDate', 'venue'],
            });

            expect(result.success).toBe(true);

            const blobCall = (global.Blob as jest.Mock).mock.calls[0];
            const csvContent = blobCall[0][0];

            // Check date formatting
            expect(csvContent).toContain('3/15/2024');
            expect(csvContent).toContain('4/20/2024');

            // Check null handling
            expect(csvContent).toContain('N/A'); // null venue -> 'N/A'
        });

        it('exports to different formats', async () => {
            // Test PDF export
            const pdfResult = await ExportService.exportEvents(mockEvents, {
                format: 'pdf',
                includeFields: ['id', 'title', 'revenue'],
            });

            expect(pdfResult.success).toBe(true);
            expect(pdfResult.filename).toMatch(
                /events_export_\d{4}-\d{2}-\d{2}\.html/
            );

            // Test Excel export
            const excelResult = await ExportService.exportEvents(mockEvents, {
                format: 'excel',
                includeFields: ['id', 'title', 'revenue'],
            });

            expect(excelResult.success).toBe(true);
            expect(excelResult.filename).toMatch(
                /events_export_\d{4}-\d{2}-\d{2}\.xlsx/
            );
        });

        it('handles registration data export', async () => {
            const mockRegistrations: EventRegistrationSummary[] = [
                {
                    registrationId: 'reg-001',
                    eventId: 'event-1',
                    eventTitle: 'Tech Conference 2024',
                    attendeeFirstName: 'John',
                    attendeeLastName: 'Doe',
                    attendeeEmail: 'john.doe@example.com',
                    ticketName: 'General Admission',
                    amountPaid: 50,
                    paymentStatus: 'Completed',
                    registrationDate: '2024-02-15T10:30:00Z',
                    isFinanced: false,
                },
            ];

            const result = await ExportService.exportRegistrations(
                mockRegistrations,
                {
                    format: 'csv',
                    includeFields: [
                        'registrationId',
                        'attendeeEmail',
                        'amountPaid',
                        'paymentStatus',
                    ],
                }
            );

            expect(result.success).toBe(true);

            const blobCall = (global.Blob as jest.Mock).mock.calls[0];
            const csvContent = blobCall[0][0];

            expect(csvContent).toContain(
                'registrationId,attendeeEmail,amountPaid,paymentStatus'
            );
            expect(csvContent).toContain('reg-001');
            expect(csvContent).toContain('john.doe@example.com');
            expect(csvContent).toContain('50');
            expect(csvContent).toContain('Completed');
        });

        it('handles revenue data export', async () => {
            const mockRevenue: MonthlyRevenue[] = [
                {
                    year: 2024,
                    month: 1,
                    monthName: 'January',
                    revenue: 5000,
                    eventCount: 3,
                    registrationCount: 150,
                },
                {
                    year: 2024,
                    month: 2,
                    monthName: 'February',
                    revenue: 7500,
                    eventCount: 5,
                    registrationCount: 200,
                },
            ];

            const result = await ExportService.exportRevenue(mockRevenue, {
                format: 'csv',
                includeFields: ['monthName', 'revenue', 'eventCount'],
            });

            expect(result.success).toBe(true);

            const blobCall = (global.Blob as jest.Mock).mock.calls[0];
            const csvContent = blobCall[0][0];

            expect(csvContent).toContain('monthName,revenue,eventCount');
            expect(csvContent).toContain('January');
            expect(csvContent).toContain('February');
            expect(csvContent).toContain('5000');
            expect(csvContent).toContain('7500');
        });
    });

    describe('Error Handling', () => {
        it('handles empty data gracefully', async () => {
            const result = await ExportService.exportEvents([], {
                format: 'csv',
                includeFields: ['id', 'title'],
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('No data to export');
        });

        it('handles invalid format', async () => {
            const result = await ExportService.exportData([{ id: 1 }], {
                format: 'xml' as 'csv' | 'pdf' | 'excel',
                dataType: 'events',
                includeFields: ['id'],
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Unsupported export format');
        });
    });

    describe('File Download', () => {
        it('triggers file download correctly', async () => {
            await ExportService.exportEvents(
                [
                    {
                        id: '1',
                        title: 'Test Event',
                    } as EventSummaryView,
                ],
                {
                    format: 'csv',
                    includeFields: ['id', 'title'],
                }
            );

            expect(document.createElement).toHaveBeenCalledWith('a');
            expect(mockLink.href).toBe('mock-url');
            expect(mockLink.download).toMatch(
                /events_export_\d{4}-\d{2}-\d{2}\.csv/
            );
            expect(mockLink.click).toHaveBeenCalled();
            expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
            expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
        });
    });
});
