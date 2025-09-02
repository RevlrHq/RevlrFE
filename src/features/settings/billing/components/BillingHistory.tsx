'use client';

import React, { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { InvoiceItem } from './InvoiceItem';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { useBillingHistory } from '../hooks/useBillingHistory';
import type { BillingTransaction } from '../types';

export function BillingHistory() {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateRange, setDateRange] = useState<string>('all');

    const {
        transactions,
        isLoading,
        error,
        downloadInvoice,
        exportHistory,
        isDownloading,
        isExporting,
    } = useBillingHistory();

    const filteredTransactions = transactions.filter(
        (transaction: BillingTransaction) => {
            if (statusFilter !== 'all' && transaction.status !== statusFilter) {
                return false;
            }

            if (dateRange !== 'all') {
                const transactionDate = new Date(transaction.createdAt);
                const now = new Date();

                switch (dateRange) {
                    case '30days':
                        return (
                            transactionDate >=
                            new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                        );
                    case '90days':
                        return (
                            transactionDate >=
                            new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                        );
                    case '1year':
                        return (
                            transactionDate >=
                            new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
                        );
                    default:
                        return true;
                }
            }

            return true;
        }
    );

    const handleDownloadInvoice = async (transactionId: string) => {
        await downloadInvoice(transactionId);
    };

    const handleExportHistory = async () => {
        await exportHistory({
            statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
            dateRange: dateRange !== 'all' ? dateRange : undefined,
        });
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorMessage message={error.message} />;
    }

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                    <div className='flex items-center gap-2'>
                        <Filter className='h-4 w-4 text-gray-500' />
                        <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger className='w-32'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>All Status</SelectItem>
                                <SelectItem value='completed'>
                                    Completed
                                </SelectItem>
                                <SelectItem value='pending'>Pending</SelectItem>
                                <SelectItem value='failed'>Failed</SelectItem>
                                <SelectItem value='refunded'>
                                    Refunded
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className='w-32'>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='all'>All Time</SelectItem>
                            <SelectItem value='30days'>Last 30 days</SelectItem>
                            <SelectItem value='90days'>Last 90 days</SelectItem>
                            <SelectItem value='1year'>Last year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    variant='outline'
                    size='sm'
                    onClick={handleExportHistory}
                    disabled={isExporting}
                    className='inline-flex items-center gap-2'
                >
                    {isExporting ? (
                        <LoadingSpinner size='sm' />
                    ) : (
                        <Download className='h-4 w-4' />
                    )}
                    Export
                </Button>
            </div>

            {filteredTransactions.length === 0 ? (
                <div className='py-8 text-center'>
                    <p className='text-gray-500'>No transactions found</p>
                </div>
            ) : (
                <div className='space-y-2'>
                    {filteredTransactions.map(
                        (transaction: BillingTransaction) => (
                            <InvoiceItem
                                key={transaction.id}
                                transaction={transaction}
                                onDownload={handleDownloadInvoice}
                                isDownloading={isDownloading === transaction.id}
                            />
                        )
                    )}
                </div>
            )}

            {filteredTransactions.length > 0 && (
                <div className='pt-4 text-center text-sm text-gray-500'>
                    Showing {filteredTransactions.length} of{' '}
                    {transactions.length} transactions
                </div>
            )}
        </div>
    );
}
