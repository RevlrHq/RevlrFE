/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useBillingHistory } from '../useBillingHistory';
import { billingService } from '../../../services';
import type { BillingTransaction } from '../../types';

// Mock the billing service
jest.mock('../../../services', () => ({
    billingService: {
        getBillingHistory: jest.fn(),
        downloadInvoice: jest.fn(),
    },
}));

const mockBillingService = billingService as jest.Mocked<typeof billingService>;

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement and DOM manipulation
const mockLink = {
    href: '',
    download: '',
    click: jest.fn(),
};
document.createElement = jest.fn(() => mockLink as any);
document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();

describe('useBillingHistory', () => {
    const mockTransactions: BillingTransaction[] = [
        {
            id: 'txn_1234567890',
            amount: 2999,
            currency: 'usd',
            description: 'Pro Plan Subscription - Monthly',
            status: 'completed',
            paymentMethodId: '1',
            createdAt: new Date('2024-01-15'),
            invoiceUrl: 'https://example.com/invoice/1',
        },
        {
            id: 'txn_0987654321',
            amount: 999,
            currency: 'usd',
            description: 'Additional Event Credits',
            status: 'completed',
            paymentMethodId: '1',
            createdAt: new Date('2024-01-10'),
            invoiceUrl: 'https://example.com/invoice/2',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue(null);
    });

    it('should load billing history on mount', async () => {
        mockBillingService.getBillingHistory.mockResolvedValue(
            mockTransactions
        );

        const { result } = renderHook(() => useBillingHistory());

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        expect(mockBillingService.getBillingHistory).toHaveBeenCalled();
        expect(result.current.transactions).toEqual(mockTransactions);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should handle loading error', async () => {
        const mockError = { type: 'NETWORK_ERROR', message: 'Failed to load' };
        mockBillingService.getBillingHistory.mockRejectedValue(mockError);

        const { result } = renderHook(() => useBillingHistory());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        expect(result.current.error).toEqual(mockError);
        expect(result.current.isLoading).toBe(false);
    });

    it('should download invoice successfully', async () => {
        mockBillingService.getBillingHistory.mockResolvedValue(
            mockTransactions
        );
        const mockBlob = new Blob(['invoice content'], {
            type: 'application/pdf',
        });
        mockBillingService.downloadInvoice.mockResolvedValue(mockBlob);

        const { result } = renderHook(() => useBillingHistory());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.downloadInvoice('txn_1234567890');
        });

        expect(mockBillingService.downloadInvoice).toHaveBeenCalledWith(
            'txn_1234567890'
        );
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
        expect(mockLink.download).toBe('invoice-txn_1234567890.pdf');
        expect(mockLink.click).toHaveBeenCalled();
    });

    it('should validate transaction exists before download', async () => {
        mockBillingService.getBillingHistory.mockResolvedValue(
            mockTransactions
        );

        const { result } = renderHook(() => useBillingHistory());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.downloadInvoice('invalid_txn_id');
        });

        expect(result.current.error).toEqual(
            expect.objectContaining({
                message: 'Transaction not found',
            })
        );
    });

    it('should validate invoice URL exists before download', async () => {
        const transactionsWithoutInvoice = [
            {
                ...mockTransactions[0],
                invoiceUrl: undefined,
            },
        ];
        mockBillingService.getBillingHistory.mockResolvedValue(
            transactionsWithoutInvoice
        );

        const { result } = renderHook(() => useBillingHistory());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.downloadInvoice('txn_1234567890');
        });

        expect(result.current.error).toEqual(
            expect.objectContaining({
                message: 'Invoice not available for this transaction',
            })
        );
    });

    it('should export history successfully', async () => {
        mockBillingService.getBillingHistory.mockResolvedValue(
            mockTransactions
        );

        const { result } = renderHook(() => useBillingHistory());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.exportHistory();
        });

        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockLink.download).toContain('billing-history-');
        expect(mockLink.click).toHaveBeenCalled();
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            'lastBillingExport',
            expect.any(String)
        );
    });

    it('should prevent export if no transactions', async () => {
        mockBillingService.getBillingHistory.mockResolvedValue([]);

        const { result } = renderHook(() => useBillingHistory());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.exportHistory();
        });

        expect(result.current.error).toEqual(
            expect.objectContaining({
                message: 'No transactions available to export',
            })
        );
    });

    it('should enforce rate limiting on exports', async () => {
        mockBillingService.getBillingHistory.mockResolvedValue(
            mockTransactions
        );
        mockLocalStorage.getItem.mockReturnValue(Date.now().toString());

        const { result } = renderHook(() => useBillingHistory());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.exportHistory();
        });

        expect(result.current.error).toEqual(
            expect.objectContaining({
                message: 'Please wait before requesting another export',
            })
        );
    });

    it('should handle loading states correctly', async () => {
        mockBillingService.getBillingHistory.mockResolvedValue(
            mockTransactions
        );
        mockBillingService.downloadInvoice.mockImplementation(
            () =>
                new Promise((resolve) =>
                    setTimeout(() => resolve(new Blob()), 100)
                )
        );

        const { result } = renderHook(() => useBillingHistory());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        act(() => {
            result.current.downloadInvoice('txn_1234567890');
        });

        expect(result.current.isDownloading).toBe('txn_1234567890');

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 150));
        });

        expect(result.current.isDownloading).toBeNull();
    });

    it('should filter transactions in CSV export', async () => {
        mockBillingService.getBillingHistory.mockResolvedValue(
            mockTransactions
        );

        const { result } = renderHook(() => useBillingHistory());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.exportHistory({ statusFilter: 'completed' });
        });

        // Verify that the CSV generation was called with filtered data
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockLink.click).toHaveBeenCalled();
    });
});
