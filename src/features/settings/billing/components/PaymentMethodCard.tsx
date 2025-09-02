'use client';

import React from 'react';
import { CreditCard, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { PaymentMethod } from '../types';

interface PaymentMethodCardProps {
    paymentMethod: PaymentMethod;
    onRemove: (id: string) => void;
    onSetDefault: (id: string) => void;
    isRemoving?: boolean;
    isUpdating?: boolean;
}

export function PaymentMethodCard({
    paymentMethod,
    onRemove,
    onSetDefault,
    isRemoving = false,
    isUpdating = false,
}: PaymentMethodCardProps) {
    const getCardIcon = () => {
        switch (paymentMethod.brand?.toLowerCase()) {
            case 'visa':
                return '💳';
            case 'mastercard':
                return '💳';
            case 'amex':
                return '💳';
            default:
                return <CreditCard className='h-5 w-5' />;
        }
    };

    const formatExpiryDate = () => {
        if (!paymentMethod.expiryMonth || !paymentMethod.expiryYear) {
            return '';
        }
        return `${paymentMethod.expiryMonth.toString().padStart(2, '0')}/${paymentMethod.expiryYear.toString().slice(-2)}`;
    };

    return (
        <div className='flex items-center justify-between rounded-lg border bg-white p-4'>
            <div className='flex items-center gap-3'>
                <div className='text-2xl'>{getCardIcon()}</div>

                <div>
                    <div className='flex items-center gap-2'>
                        <span className='font-medium'>
                            {paymentMethod.brand?.toUpperCase()} ••••{' '}
                            {paymentMethod.last4}
                        </span>
                        {paymentMethod.isDefault && (
                            <Badge variant='secondary' className='text-xs'>
                                Default
                            </Badge>
                        )}
                        {paymentMethod.isExpired && (
                            <Badge variant='destructive' className='text-xs'>
                                Expired
                            </Badge>
                        )}
                    </div>

                    <div className='text-sm text-gray-500'>
                        {paymentMethod.type === 'card' &&
                            formatExpiryDate() && (
                                <span>Expires {formatExpiryDate()}</span>
                            )}
                        {paymentMethod.type === 'bank_account' && (
                            <span>Bank Account</span>
                        )}
                        {paymentMethod.type === 'paypal' && <span>PayPal</span>}
                    </div>
                </div>
            </div>

            <div className='flex items-center gap-2'>
                {!paymentMethod.isDefault && (
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => onSetDefault(paymentMethod.id)}
                        disabled={isUpdating}
                        className='text-xs'
                    >
                        {isUpdating ? (
                            <LoadingSpinner size='sm' />
                        ) : (
                            <>
                                <Star className='mr-1 h-3 w-3' />
                                Set Default
                            </>
                        )}
                    </Button>
                )}

                <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => onRemove(paymentMethod.id)}
                    disabled={isRemoving || isUpdating}
                    className='text-red-600 hover:text-red-700'
                >
                    {isRemoving ? (
                        <LoadingSpinner size='sm' />
                    ) : (
                        <Trash2 className='h-4 w-4' />
                    )}
                </Button>
            </div>
        </div>
    );
}
