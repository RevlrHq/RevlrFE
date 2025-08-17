import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportModal } from '@/components/ExportModal';
import { getExportFields } from '@/lib/constants/exportFields';

// Mock the UI components
jest.mock('@/components/ui/dialog', () => ({
    Dialog: ({
        children,
        open,
    }: {
        children: React.ReactNode;
        open: boolean;
    }) => (open ? <div data-testid='dialog'>{children}</div> : null),
    DialogContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid='dialog-content'>{children}</div>
    ),
    DialogHeader: ({ children }: { children: React.ReactNode }) => (
        <div data-testid='dialog-header'>{children}</div>
    ),
    DialogTitle: ({ children }: { children: React.ReactNode }) => (
        <h2 data-testid='dialog-title'>{children}</h2>
    ),
    DialogDescription: ({ children }: { children: React.ReactNode }) => (
        <p data-testid='dialog-description'>{children}</p>
    ),
    DialogFooter: ({ children }: { children: React.ReactNode }) => (
        <div data-testid='dialog-footer'>{children}</div>
    ),
}));

jest.mock('@/components/ui/button', () => ({
    Button: ({
        children,
        onClick,
        disabled,
        ...props
    }: {
        children: React.ReactNode;
        onClick?: () => void;
        disabled?: boolean;
        [key: string]: unknown;
    }) => (
        <button onClick={onClick} disabled={disabled} {...props}>
            {children}
        </button>
    ),
}));

jest.mock('@/components/ui/progress', () => ({
    Progress: ({ value }: { value: number }) => (
        <div data-testid='progress' data-value={value} />
    ),
}));

jest.mock('@/components/ui/checkbox', () => ({
    Checkbox: ({
        checked,
        onCheckedChange,
        disabled,
        id,
    }: {
        checked: boolean;
        onCheckedChange?: (checked: boolean) => void;
        disabled?: boolean;
        id: string;
    }) => (
        <input
            type='checkbox'
            checked={checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            disabled={disabled}
            data-testid={`checkbox-${id}`}
        />
    ),
}));

jest.mock('@/components/ui/label', () => ({
    Label: ({
        children,
        htmlFor,
    }: {
        children: React.ReactNode;
        htmlFor?: string;
    }) => <label htmlFor={htmlFor}>{children}</label>,
}));

jest.mock('@/components/ui/radio-group', () => ({
    RadioGroup: ({
        children,
        value,
        onValueChange,
    }: {
        children: React.ReactNode;
        value: string;
        onValueChange: (value: string) => void;
    }) => (
        <div data-testid='radio-group' data-value={value}>
            {React.Children.map(children, (child) =>
                React.cloneElement(child as React.ReactElement, {
                    onValueChange,
                })
            )}
        </div>
    ),
    RadioGroupItem: ({
        value,
        onValueChange,
    }: {
        value: string;
        onValueChange?: (value: string) => void;
    }) => (
        <input
            type='radio'
            value={value}
            onChange={() => onValueChange?.(value)}
            data-testid={`radio-${value}`}
        />
    ),
}));

jest.mock('@/components/ui/separator', () => ({
    Separator: () => <hr data-testid='separator' />,
}));

describe('ExportModal', () => {
    const mockOnClose = jest.fn();
    const mockOnExport = jest.fn();

    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        onExport: mockOnExport,
        dataType: 'events' as const,
        availableFields: getExportFields('events'),
        totalRecords: 100,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockOnExport.mockResolvedValue(undefined);
    });

    it('renders correctly when open', () => {
        render(<ExportModal {...defaultProps} />);

        expect(screen.getByTestId('dialog')).toBeInTheDocument();
        expect(screen.getByTestId('dialog-title')).toHaveTextContent(
            'Export Events'
        );
        expect(screen.getByTestId('dialog-description')).toHaveTextContent(
            '100 records available'
        );
    });

    it('does not render when closed', () => {
        render(<ExportModal {...defaultProps} isOpen={false} />);

        expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('displays correct data type labels', () => {
        const { rerender } = render(
            <ExportModal {...defaultProps} dataType='events' />
        );
        expect(screen.getByTestId('dialog-title')).toHaveTextContent(
            'Export Events'
        );

        rerender(
            <ExportModal
                {...defaultProps}
                dataType='registrations'
                availableFields={getExportFields('registrations')}
            />
        );
        expect(screen.getByTestId('dialog-title')).toHaveTextContent(
            'Export Registrations'
        );

        rerender(
            <ExportModal
                {...defaultProps}
                dataType='revenue'
                availableFields={getExportFields('revenue')}
            />
        );
        expect(screen.getByTestId('dialog-title')).toHaveTextContent(
            'Export Revenue Reports'
        );
    });

    it('allows format selection', async () => {
        const user = userEvent.setup();
        render(<ExportModal {...defaultProps} />);

        const csvRadio = screen.getByTestId('radio-csv');
        const pdfRadio = screen.getByTestId('radio-pdf');
        const excelRadio = screen.getByTestId('radio-excel');

        expect(csvRadio).toBeInTheDocument();
        expect(pdfRadio).toBeInTheDocument();
        expect(excelRadio).toBeInTheDocument();

        await user.click(pdfRadio);
        expect(screen.getByTestId('radio-group')).toHaveAttribute(
            'data-value',
            'pdf'
        );
    });

    it('handles field selection correctly', async () => {
        const user = userEvent.setup();
        render(<ExportModal {...defaultProps} />);

        const firstField = defaultProps.availableFields[0];
        const checkbox = screen.getByTestId(`checkbox-${firstField.key}`);

        // Field should be checked if required
        if (firstField.required) {
            expect(checkbox).toBeChecked();
            expect(checkbox).toBeDisabled();
        } else {
            expect(checkbox).not.toBeChecked();
            await user.click(checkbox);
            expect(checkbox).toBeChecked();
        }
    });

    it('handles select all functionality', async () => {
        const user = userEvent.setup();
        render(<ExportModal {...defaultProps} />);

        const selectAllButton = screen.getByText('Select All');
        await user.click(selectAllButton);

        // All non-required checkboxes should be checked
        defaultProps.availableFields.forEach((field) => {
            const checkbox = screen.getByTestId(`checkbox-${field.key}`);
            expect(checkbox).toBeChecked();
        });
    });

    it('handles select required only functionality', async () => {
        const user = userEvent.setup();
        render(<ExportModal {...defaultProps} />);

        // First select all
        const selectAllButton = screen.getByText('Select All');
        await user.click(selectAllButton);

        // Then select required only
        const selectRequiredButton = screen.getByText('Required Only');
        await user.click(selectRequiredButton);

        // Only required fields should be checked
        defaultProps.availableFields.forEach((field) => {
            const checkbox = screen.getByTestId(`checkbox-${field.key}`);
            if (field.required) {
                expect(checkbox).toBeChecked();
            } else {
                expect(checkbox).not.toBeChecked();
            }
        });
    });

    it('calls onExport with correct options', async () => {
        const user = userEvent.setup();
        render(<ExportModal {...defaultProps} />);

        // Select PDF format
        const pdfRadio = screen.getByTestId('radio-pdf');
        await user.click(pdfRadio);

        // Select additional field
        const optionalField = defaultProps.availableFields.find(
            (f) => !f.required
        );
        if (optionalField) {
            const checkbox = screen.getByTestId(
                `checkbox-${optionalField.key}`
            );
            await user.click(checkbox);
        }

        // Click export
        const exportButton = screen.getByText(/Export/);
        await user.click(exportButton);

        await waitFor(() => {
            expect(mockOnExport).toHaveBeenCalledWith({
                format: 'pdf',
                dataType: 'events',
                includeFields: expect.arrayContaining(
                    defaultProps.availableFields
                        .filter((f) => f.required)
                        .map((f) => f.key)
                ),
            });
        });
    });

    it('shows progress during export', async () => {
        const user = userEvent.setup();
        mockOnExport.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        );

        render(<ExportModal {...defaultProps} />);

        const exportButton = screen.getByText(/Export/);
        await user.click(exportButton);

        expect(screen.getByTestId('progress')).toBeInTheDocument();
        expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('shows success state after export', async () => {
        const user = userEvent.setup();
        render(<ExportModal {...defaultProps} />);

        const exportButton = screen.getByText(/Export/);
        await user.click(exportButton);

        await waitFor(() => {
            expect(
                screen.getByText('Export completed successfully!')
            ).toBeInTheDocument();
        });
    });

    it('shows error state on export failure', async () => {
        const user = userEvent.setup();
        const errorMessage = 'Export failed due to network error';
        mockOnExport.mockRejectedValue(new Error(errorMessage));

        render(<ExportModal {...defaultProps} />);

        const exportButton = screen.getByText(/Export/);
        await user.click(exportButton);

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('prevents export with no fields selected', async () => {
        // Create props with no required fields
        const propsWithNoRequired = {
            ...defaultProps,
            availableFields: defaultProps.availableFields.map((f) => ({
                ...f,
                required: false,
            })),
        };

        render(<ExportModal {...propsWithNoRequired} />);

        const exportButton = screen.getByText(/Export/);
        expect(exportButton).toBeDisabled();
    });

    it('calls onClose when cancel is clicked', async () => {
        const user = userEvent.setup();
        render(<ExportModal {...defaultProps} />);

        const cancelButton = screen.getByText('Cancel');
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('prevents closing during export', async () => {
        mockOnExport.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        );

        render(<ExportModal {...defaultProps} />);

        const exportButton = screen.getByText(/Export/);
        await user.click(exportButton);

        const cancelButton = screen.getByText('Exporting...');
        expect(cancelButton).toBeDisabled();
    });

    it('displays field count correctly', () => {
        render(<ExportModal {...defaultProps} />);

        const requiredCount = defaultProps.availableFields.filter(
            (f) => f.required
        ).length;
        const totalCount = defaultProps.availableFields.length;

        expect(
            screen.getByText(
                `${requiredCount} of ${totalCount} fields selected`
            )
        ).toBeInTheDocument();
    });

    it('shows required field indicators', () => {
        render(<ExportModal {...defaultProps} />);

        defaultProps.availableFields.forEach((field) => {
            if (field.required) {
                expect(
                    screen.getByText(`${field.label} *`)
                ).toBeInTheDocument();
            } else {
                expect(screen.getByText(field.label)).toBeInTheDocument();
                expect(
                    screen.queryByText(`${field.label} *`)
                ).not.toBeInTheDocument();
            }
        });
    });
});
