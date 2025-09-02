import { useState, useEffect } from 'react';
import { billingService } from '../../services';
import type { BillingTransaction, BillingError } from '../types';

interface ExportOptions {
    statusFilter?: string;
    dateRange?: string;
}

export function useBillingHistory() {
    const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<BillingError | null>(null);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        loadBillingHistory();
    }, []);

    const loadBillingHistory = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const history = await billingService.getBillingHistory();
            setTransactions(history);
        } catch (err) {
            const billingError = err as BillingError;
            setError(billingError);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadInvoice = async (transactionId: string) => {
        try {
            setIsDownloading(transactionId);
            setError(null);

            // Security validation: ensure transaction belongs to current user
            const transaction = transactions.find(
                (t) => t.id === transactionId
            );
            if (!transaction) {
                throw new Error('Transaction not found');
            }

            if (!transaction.invoiceUrl) {
                throw new Error('Invoice not available for this transaction');
            }

            const invoiceBlob =
                await billingService.downloadInvoice(transactionId);

            // Create download link
            const url = window.URL.createObjectURL(invoiceBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${transactionId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            const billingError = err as BillingError;
            setError(billingError);
        } finally {
            setIsDownloading(null);
        }
    };

    const exportHistory = async (options: ExportOptions = {}) => {
        try {
            setIsExporting(true);
            setError(null);

            // Security validation: ensure user has transactions to export
            if (transactions.length === 0) {
                throw new Error('No transactions available to export');
            }

            // Rate limiting check (would be implemented server-side as well)
            const lastExport = localStorage.getItem('lastBillingExport');
            if (lastExport) {
                const timeSinceLastExport = Date.now() - parseInt(lastExport);
                const minInterval = 60000; // 1 minute minimum between exports
                if (timeSinceLastExport < minInterval) {
                    throw new Error(
                        'Please wait before requesting another export'
                    );
                }
            }

            // Generate and download CSV file
            const csvContent = generateCSV(transactions, options);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `billing-history-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);

            // Update last export timestamp
            localStorage.setItem('lastBillingExport', Date.now().toString());
        } catch (err) {
            const billingError = err as BillingError;
            setError(billingError);
        } finally {
            setIsExporting(false);
        }
    };

    const generateCSV = (
        transactions: BillingTransaction[],
        options: ExportOptions
    ) => {
        const headers = [
            'Date',
            'Description',
            'Amount',
            'Currency',
            'Status',
            'Transaction ID',
        ];
        const rows = transactions
            .filter((transaction) => {
                if (
                    options.statusFilter &&
                    transaction.status !== options.statusFilter
                ) {
                    return false;
                }
                // Add date range filtering logic here if needed
                return true;
            })
            .map((transaction) => [
                new Date(transaction.createdAt).toLocaleDateString(),
                transaction.description,
                (transaction.amount / 100).toFixed(2),
                transaction.currency.toUpperCase(),
                transaction.status,
                transaction.id,
            ]);

        return [headers, ...rows].map((row) => row.join(',')).join('\n');
    };

    return {
        transactions,
        isLoading,
        error,
        downloadInvoice,
        exportHistory,
        isDownloading,
        isExporting,
        refetch: loadBillingHistory,
    };
}
