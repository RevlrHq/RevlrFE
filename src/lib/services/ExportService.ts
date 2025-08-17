import type {
    EventSummaryView,
    EventRegistrationSummary,
    MonthlyRevenue,
    EventRevenueBreakdown,
} from '@/lib/api';
import type {
    ExportOptions,
    ExportFormat,
    ExportDataType,
} from '@/components/ExportModal';

export interface ExportResult {
    success: boolean;
    filename: string;
    downloadUrl?: string;
    error?: string;
}

export class ExportService {
    /**
     * Export data based on the provided options
     */
    static async exportData(
        data: any[],
        options: ExportOptions,
        filename?: string
    ): Promise<ExportResult> {
        try {
            const exportFilename = filename || this.generateFilename(options);

            switch (options.format) {
                case 'csv':
                    return await this.exportToCSV(
                        data,
                        options,
                        exportFilename
                    );
                case 'pdf':
                    return await this.exportToPDF(
                        data,
                        options,
                        exportFilename
                    );
                case 'excel':
                    return await this.exportToExcel(
                        data,
                        options,
                        exportFilename
                    );
                default:
                    throw new Error(
                        `Unsupported export format: ${options.format}`
                    );
            }
        } catch (error) {
            return {
                success: false,
                filename: '',
                error: error instanceof Error ? error.message : 'Export failed',
            };
        }
    }

    /**
     * Export events data
     */
    static async exportEvents(
        events: EventSummaryView[],
        options: Omit<ExportOptions, 'dataType'>
    ): Promise<ExportResult> {
        const processedData = events.map((event) => ({
            id: event.id || '',
            title: event.title || '',
            status: event.status || '',
            category: event.categoryDescription || event.category || '',
            startDate: event.startDate
                ? new Date(event.startDate).toLocaleDateString()
                : '',
            endDate: event.endDate
                ? new Date(event.endDate).toLocaleDateString()
                : '',
            isVirtual: event.isVirtual ? 'Yes' : 'No',
            venue: event.venue || 'N/A',
            registrationCount: event.registrationCount || 0,
            ticketsSold: event.ticketsSold || 0,
            totalTickets: event.totalTickets || 0,
            revenue: event.revenue || 0,
            dateCreated: event.dateCreated
                ? new Date(event.dateCreated).toLocaleDateString()
                : '',
            dateUpdated: event.dateUpdated
                ? new Date(event.dateUpdated).toLocaleDateString()
                : '',
        }));

        return this.exportData(processedData, {
            ...options,
            dataType: 'events',
        });
    }

    /**
     * Export registrations data
     */
    static async exportRegistrations(
        registrations: EventRegistrationSummary[],
        options: Omit<ExportOptions, 'dataType'>
    ): Promise<ExportResult> {
        const processedData = registrations.map((registration) => ({
            registrationId: registration.registrationId || '',
            eventId: registration.eventId || '',
            eventTitle: registration.eventTitle || '',
            attendeeFirstName: registration.attendeeFirstName || '',
            attendeeLastName: registration.attendeeLastName || '',
            attendeeEmail: registration.attendeeEmail || '',
            ticketName: registration.ticketName || '',
            amountPaid: registration.amountPaid || 0,
            paymentStatus: registration.paymentStatus || '',
            registrationDate: registration.registrationDate
                ? new Date(registration.registrationDate).toLocaleDateString()
                : '',
            isFinanced: registration.isFinanced ? 'Yes' : 'No',
        }));

        return this.exportData(processedData, {
            ...options,
            dataType: 'registrations',
        });
    }

    /**
     * Export revenue data
     */
    static async exportRevenue(
        revenueData: MonthlyRevenue[] | EventRevenueBreakdown[],
        options: Omit<ExportOptions, 'dataType'>
    ): Promise<ExportResult> {
        let processedData: any[];

        // Check if it's monthly revenue data
        if (revenueData.length > 0 && 'monthName' in revenueData[0]) {
            const monthlyData = revenueData as MonthlyRevenue[];
            processedData = monthlyData.map((item) => ({
                year: item.year || '',
                month: item.month || '',
                monthName: item.monthName || '',
                revenue: item.revenue || 0,
                eventCount: item.eventCount || 0,
                registrationCount: item.registrationCount || 0,
            }));
        } else {
            // Assume it's event revenue breakdown
            const eventData = revenueData as EventRevenueBreakdown[];
            processedData = eventData.map((item) => ({
                eventId: (item as any).eventId || '',
                eventTitle: (item as any).eventTitle || '',
                totalRevenue: (item as any).totalRevenue || 0,
                ticketRevenue: (item as any).ticketRevenue || 0,
                fees: (item as any).fees || 0,
                netRevenue: (item as any).netRevenue || 0,
                registrationCount: (item as any).registrationCount || 0,
            }));
        }

        return this.exportData(processedData, {
            ...options,
            dataType: 'revenue',
        });
    }

    /**
     * Export to CSV format
     */
    private static async exportToCSV(
        data: any[],
        options: ExportOptions,
        filename: string
    ): Promise<ExportResult> {
        if (data.length === 0) {
            throw new Error('No data to export');
        }

        // Filter data based on selected fields
        const filteredData = this.filterDataByFields(
            data,
            options.includeFields
        );

        // Generate CSV content
        const headers = Object.keys(filteredData[0]);
        const csvContent = [
            headers.join(','),
            ...filteredData.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header];
                        // Escape commas and quotes in CSV
                        if (
                            typeof value === 'string' &&
                            (value.includes(',') || value.includes('"'))
                        ) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    })
                    .join(',')
            ),
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        this.downloadFile(blob, filename);

        return {
            success: true,
            filename,
            downloadUrl: URL.createObjectURL(blob),
        };
    }

    /**
     * Export to PDF format
     */
    private static async exportToPDF(
        data: any[],
        options: ExportOptions,
        filename: string
    ): Promise<ExportResult> {
        // For PDF export, we'll create a simple HTML table and convert it
        // In a real implementation, you might use libraries like jsPDF or Puppeteer

        if (data.length === 0) {
            throw new Error('No data to export');
        }

        const filteredData = this.filterDataByFields(
            data,
            options.includeFields
        );
        const headers = Object.keys(filteredData[0]);

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${this.getDataTypeLabel(options.dataType)} Export</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; margin-bottom: 20px; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .export-info { margin-bottom: 20px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <h1>${this.getDataTypeLabel(options.dataType)} Export</h1>
                <div class="export-info">
                    <p>Export Date: ${new Date().toLocaleDateString()}</p>
                    <p>Total Records: ${filteredData.length}</p>
                    <p>Format: PDF</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            ${headers.map((header) => `<th>${this.formatHeaderName(header)}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredData
                            .map(
                                (row) => `
                            <tr>
                                ${headers.map((header) => `<td>${row[header] || ''}</td>`).join('')}
                            </tr>
                        `
                            )
                            .join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        // Create a blob with HTML content
        // In a real implementation, you would convert this HTML to PDF
        const blob = new Blob([htmlContent], { type: 'text/html' });
        this.downloadFile(blob, filename.replace('.pdf', '.html'));

        return {
            success: true,
            filename: filename.replace('.pdf', '.html'),
            downloadUrl: URL.createObjectURL(blob),
        };
    }

    /**
     * Export to Excel format
     */
    private static async exportToExcel(
        data: any[],
        options: ExportOptions,
        filename: string
    ): Promise<ExportResult> {
        // For Excel export, we'll create a CSV with Excel-specific formatting
        // In a real implementation, you might use libraries like SheetJS or ExcelJS

        if (data.length === 0) {
            throw new Error('No data to export');
        }

        const filteredData = this.filterDataByFields(
            data,
            options.includeFields
        );
        const headers = Object.keys(filteredData[0]);

        // Create Excel-compatible CSV with UTF-8 BOM
        const csvContent = [
            headers.map((header) => this.formatHeaderName(header)).join('\t'),
            ...filteredData.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header];
                        // Format numbers and dates for Excel
                        if (typeof value === 'number') {
                            return value.toString();
                        }
                        if (typeof value === 'string' && value.includes('\t')) {
                            return `"${value}"`;
                        }
                        return value || '';
                    })
                    .join('\t')
            ),
        ].join('\n');

        // Add UTF-8 BOM for proper Excel encoding
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvContent], {
            type: 'application/vnd.ms-excel;charset=utf-8;',
        });

        this.downloadFile(blob, filename);

        return {
            success: true,
            filename,
            downloadUrl: URL.createObjectURL(blob),
        };
    }

    /**
     * Filter data based on selected fields
     */
    private static filterDataByFields(
        data: any[],
        includeFields: string[]
    ): any[] {
        return data.map((item) => {
            const filteredItem: any = {};
            includeFields.forEach((field) => {
                if (field in item) {
                    filteredItem[field] = item[field];
                }
            });
            return filteredItem;
        });
    }

    /**
     * Generate filename based on export options
     */
    private static generateFilename(options: ExportOptions): string {
        const timestamp = new Date().toISOString().split('T')[0];
        const dataTypeLabel = options.dataType.toLowerCase();
        const extension = this.getFileExtension(options.format);

        return `${dataTypeLabel}_export_${timestamp}.${extension}`;
    }

    /**
     * Get file extension for format
     */
    private static getFileExtension(format: ExportFormat): string {
        switch (format) {
            case 'csv':
                return 'csv';
            case 'pdf':
                return 'pdf';
            case 'excel':
                return 'xlsx';
            default:
                return 'txt';
        }
    }

    /**
     * Get human-readable data type label
     */
    private static getDataTypeLabel(dataType: ExportDataType): string {
        switch (dataType) {
            case 'events':
                return 'Events';
            case 'registrations':
                return 'Registrations';
            case 'revenue':
                return 'Revenue Report';
            default:
                return 'Data';
        }
    }

    /**
     * Format header names for display
     */
    private static formatHeaderName(header: string): string {
        return header
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
    }

    /**
     * Download file to user's device
     */
    private static downloadFile(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the URL object after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
