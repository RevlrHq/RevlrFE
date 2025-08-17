import { ExportService } from '@/lib/services/ExportService';
import type {
    EventSummaryView,
    EventRegistrationSummary,
    MonthlyRevenue,
} from '@/lib/api';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock Blob
global.Blob = jest.fn().mockImplementation((content, options) => ({
    content,
    options,
    size: content[0].length,
    type: options?.type || 'text/plain',
})) as any;

// Mock document methods
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

describe('ExportService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('exportEvents', () => {
        const mockEvents: EventSummaryView[] = [
            {
                id: '1',
                title: 'Test Event 1',
                status: 'Published',
                category: 'Conference',
                categoryDescription: 'Business Conference',
                startDate: '2024-01-15T10:00:00Z',
                endDate: '2024-01-15T18:00:00Z',
                isVirtual: false,
                venue: 'Convention Center',
                registrationCount: 50,
                ticketsSold: 45,
                totalTickets: 100,
                revenue: 2250,
                dateCreated: '2024-01-01T00:00:00Z',
                dateUpdated: '2024-01-10T00:00:00Z',
            },
            {
                id: '2',
                title: 'Test Event 2',
                status: 'Draft',
                category: 'Workshop',
                categoryDescription: 'Technical Workshop',
                startDate: '2024-02-20T14:00:00Z',
                endDate: '2024-02-20T17:00:00Z',
                isVirtual: true,
                venue: null,
                registrationCount: 25,
                ticketsSold: 20,
                totalTickets: 50,
                revenue: 1000,
                dateCreated: '2024-01-15T00:00:00Z',
                dateUpdated: null,
            },
        ];

        it('exports events to CSV successfully', async () => {
            const result = await ExportService.exportEvents(mockEvents, {
                format: 'csv',
                includeFields: ['id', 'title', 'status', 'revenue'],
            });

            expect(result.success).toBe(true);
            expect(result.filename).toMatch(
                /events_export_\d{4}-\d{2}-\d{2}\.csv/
            );
            expect(global.Blob).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.stringContaining('id,title,status,revenue'),
                ]),
                { type: 'text/csv;charset=utf-8;' }
            );
        });

        it('exports events to PDF successfully', async () => {
            const result = await ExportService.exportEvents(mockEvents, {
                format: 'pdf',
                includeFields: ['id', 'title', 'status'],
            });

            expect(result.success).toBe(true);
            expect(result.filename).toMatch(
                /events_export_\d{4}-\d{2}-\d{2}\.html/
            );
            expect(global.Blob).toHaveBeenCalledWith(
                expect.arrayContaining([expect.stringContaining('<table>')]),
                { type: 'text/html' }
            );
        });

        it('exports events to Excel successfully', async () => {
            const result = await ExportService.exportEvents(mockEvents, {
                format: 'excel',
                includeFields: ['id', 'title', 'revenue'],
            });

            expect(result.success).toBe(true);
            expect(result.filename).toMatch(
                /events_export_\d{4}-\d{2}-\d{2}\.xlsx/
            );
            expect(global.Blob).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.stringContaining('Id\tTitle\tRevenue'),
                ]),
                { type: 'application/vnd.ms-excel;charset=utf-8;' }
            );
        });

        it('handles empty events array', async () => {
            const result = await ExportService.exportEvents([], {
                format: 'csv',
                includeFields: ['id', 'title'],
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('No data to export');
        });

        it('filters fields correctly', async () => {
            const result = await ExportService.exportEvents(mockEvents, {
                format: 'csv',
                includeFields: ['id', 'title'],
            });

            expect(result.success).toBe(true);
            const blobCall = (global.Blob as jest.Mock).mock.calls[0];
            const csvContent = blobCall[0][0];

            expect(csvContent).toContain('id,title');
            expect(csvContent).not.toContain('status');
            expect(csvContent).not.toContain('revenue');
        });

        it('formats dates correctly', async () => {
            const result = await ExportService.exportEvents(mockEvents, {
                format: 'csv',
                includeFields: ['id', 'startDate'],
            });

            expect(result.success).toBe(true);
            const blobCall = (global.Blob as jest.Mock).mock.calls[0];
            const csvContent = blobCall[0][0];

            expect(csvContent).toContain('1/15/2024'); // Formatted date
        });

        it('handles boolean values correctly', async () => {
            const result = await ExportService.exportEvents(mockEvents, {
                format: 'csv',
                includeFields: ['id', 'isVirtual'],
            });

            expect(result.success).toBe(true);
            const blobCall = (global.Blob as jest.Mock).mock.calls[0];
            const csvContent = blobCall[0][0];

            expect(csvContent).toContain('No'); // false -> 'No'
            expect(csvContent).toContain('Yes'); // true -> 'Yes'
        });
    });

    describe('exportRegistrations', () => {
        const mockRegistrations: EventRegistrationSummary[] = [
            {
                registrationId: 'reg1',
                eventId: 'event1',
                eventTitle: 'Test Event',
                attendeeFirstName: 'John',
                attendeeLastName: 'Doe',
                attendeeEmail: 'john@example.com',
                ticketName: 'General Admission',
                amountPaid: 50,
                paymentStatus: 'Completed',
                registrationDate: '2024-01-10T12:00:00Z',
                isFinanced: false,
            },
            {
                registrationId: 'reg2',
                eventId: 'event1',
                eventTitle: 'Test Event',
                attendeeFirstName: 'Jane',
                attendeeLastName: 'Smith',
                attendeeEmail: 'jane@example.com',
                ticketName: 'VIP',
                amountPaid: 100,
                paymentStatus: 'Pending',
                registrationDate: '2024-01-11T15:30:00Z',
                isFinanced: true,
            },
        ];

        it('exports registrations to CSV successfully', async () => {
            const result = await ExportService.exportRegistrations(
                mockRegistrations,
                {
                    format: 'csv',
                    includeFields: [
                        'registrationId',
                        'attendeeEmail',
                        'amountPaid',
                    ],
                }
            );

            expect(result.success).toBe(true);
            expect(result.filename).toMatch(
                /registrations_export_\d{4}-\d{2}-\d{2}\.csv/
            );
        });

        it('handles personal data correctly', async () => {
            const result = await ExportService.exportRegistrations(
                mockRegistrations,
                {
                    format: 'csv',
                    includeFields: [
                        'attendeeFirstName',
                        'attendeeLastName',
                        'attendeeEmail',
                    ],
                }
            );

            expect(result.success).toBe(true);
            const blobCall = (global.Blob as jest.Mock).mock.calls[0];
            const csvContent = blobCall[0][0];

            expect(csvContent).toContain('John');
            expect(csvContent).toContain('john@example.com');
        });
    });

    describe('exportRevenue', () => {
        const mockMonthlyRevenue: MonthlyRevenue[] = [
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

        it('exports monthly revenue to CSV successfully', async () => {
            const result = await ExportService.exportRevenue(
                mockMonthlyRevenue,
                {
                    format: 'csv',
                    includeFields: ['monthName', 'revenue', 'eventCount'],
                }
            );

            expect(result.success).toBe(true);
            expect(result.filename).toMatch(
                /revenue_export_\d{4}-\d{2}-\d{2}\.csv/
            );
        });

        it('handles revenue data correctly', async () => {
            const result = await ExportService.exportRevenue(
                mockMonthlyRevenue,
                {
                    format: 'csv',
                    includeFields: ['monthName', 'revenue'],
                }
            );

            expect(result.success).toBe(true);
            const blobCall = (global.Blob as jest.Mock).mock.calls[0];
            const csvContent = blobCall[0][0];

            expect(csvContent).toContain('January');
            expect(csvContent).toContain('5000');
            expect(csvContent).toContain('February');
            expect(csvContent).toContain('7500');
        });
    });

    describe('error handling', () => {
        it('handles unsupported format', async () => {
            const result = await ExportService.exportData([], {
                format: 'xml' as any,
                dataType: 'events',
                includeFields: [],
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Unsupported export format');
        });

        it('handles export errors gracefully', async () => {
            // Mock Blob to throw an error
            (global.Blob as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Blob creation failed');
            });

            const result = await ExportService.exportEvents(
                [
                    {
                        id: '1',
                        title: 'Test',
                    } as EventSummaryView,
                ],
                {
                    format: 'csv',
                    includeFields: ['id', 'title'],
                }
            );

            expect(result.success).toBe(false);
            expect(result.error).toBe('Blob creation failed');
        });
    });

    describe('CSV formatting', () => {
        it('escapes commas in CSV values', async () => {
            const eventWithComma: EventSummaryView = {
                id: '1',
                title: 'Event, with comma',
                venue: 'Location, City',
            };

            const result = await ExportService.exportEvents([eventWithComma], {
                format: 'csv',
                includeFields: ['id', 'title', 'venue'],
            });

            expect(result.success).toBe(true);
            const blobCall = (global.Blob as jest.Mock).mock.calls[0];
            const csvContent = blobCall[0][0];

            expect(csvContent).toContain('"Event, with comma"');
            expect(csvContent).toContain('"Location, City"');
        });

        it('escapes quotes in CSV values', async () => {
            const eventWithQuote: EventSummaryView = {
                id: '1',
                title: 'Event "Special" Title',
            };

            const result = await ExportService.exportEvents([eventWithQuote], {
                format: 'csv',
                includeFields: ['id', 'title'],
            });

            expect(result.success).toBe(true);
            const blobCall = (global.Blob as jest.Mock).mock.calls[0];
            const csvContent = blobCall[0][0];

            expect(csvContent).toContain('"Event ""Special"" Title"');
        });
    });

    describe('file download', () => {
        it('creates download link correctly', async () => {
            await ExportService.exportEvents(
                [
                    {
                        id: '1',
                        title: 'Test',
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
