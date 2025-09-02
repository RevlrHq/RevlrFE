'use client';

import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { BillingTransaction } from '../types';

interface InvoiceItemProps {
    transaction: BillingTransaction;
    onDownload: (transactionId: string) => void;
    isDownloading?: boolean;
}

export function InvoiceItem({
    transaction,
    onDownload,
    isDownloading = false,
}: InvoiceItemProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'refunded':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatAmount = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount / 100); // Assuming amount is in cents
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(date));
    };

    return (
        <div className='flex items-center justify-between rounded-lg border bg-white p-4 hover:bg-gray-50'>
            <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-gray-100 p-2'>
                    <FileText className='h-4 w-4 text-gray-600' />
                </div>

                <div>
                    <div className='flex items-center gap-2'>
                        <span className='font-medium'>
                            {transaction.description}
                        </span>
                        <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status.charAt(0).toUpperCase() +
                                transaction.status.slice(1)}
                        </Badge>
                    </div>

                    <div className='text-sm text-gray-500'>
                        {formatDate(transaction.createdAt)} • ID:{' '}
                        {transaction.id.slice(-8)}
                    </div>
                </div>
            </div>

            <div className='flex items-center gap-4'>
                <div className='text-right'>
                    <div className='font-semibold'>
                        {formatAmount(transaction.amount, transaction.currency)}
                    </div>
                </div>

                {transaction.invoiceUrl && (
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => onDownload(transaction.id)}
                        disabled={isDownloading}
                        className='text-blue-600 hover:text-blue-700'
                    >
                        {isDownloading ? (
                            <LoadingSpinner size='sm' />
                        ) : (
                            <Download className='h-4 w-4' />
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
