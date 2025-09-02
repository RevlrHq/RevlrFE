'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentMethodCard } from './PaymentMethodCard';
import { AddPaymentMethod } from './AddPaymentMethod';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import type { PaymentMethod } from '../types';

export function PaymentMethods() {
    const [showAddForm, setShowAddForm] = useState(false);
    const {
        paymentMethods,
        isLoading,
        error,
        addPaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod,
        isAdding,
        isRemoving,
        isUpdating,
    } = usePaymentMethods();

    const handleAddPaymentMethod = async (data: any) => {
        try {
            await addPaymentMethod(data);
            setShowAddForm(false);
        } catch (error) {
            // Error is handled by the hook
        }
    };

    const handleRemovePaymentMethod = async (id: string) => {
        if (
            window.confirm(
                'Are you sure you want to remove this payment method?'
            )
        ) {
            await removePaymentMethod(id);
        }
    };

    const handleSetDefault = async (id: string) => {
        await setDefaultPaymentMethod(id);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorMessage message={error.message} />;
    }

    return (
        <div className='space-y-4'>
            {paymentMethods.length === 0 ? (
                <div className='py-8 text-center'>
                    <p className='mb-4 text-gray-500'>
                        No payment methods added yet
                    </p>
                    <Button
                        onClick={() => setShowAddForm(true)}
                        className='inline-flex items-center gap-2'
                    >
                        <Plus className='h-4 w-4' />
                        Add Payment Method
                    </Button>
                </div>
            ) : (
                <>
                    <div className='grid gap-4'>
                        {paymentMethods.map((method: PaymentMethod) => (
                            <PaymentMethodCard
                                key={method.id}
                                paymentMethod={method}
                                onRemove={handleRemovePaymentMethod}
                                onSetDefault={handleSetDefault}
                                isRemoving={isRemoving === method.id}
                                isUpdating={isUpdating === method.id}
                            />
                        ))}
                    </div>

                    <div className='border-t pt-4'>
                        <Button
                            onClick={() => setShowAddForm(true)}
                            variant='outline'
                            className='inline-flex items-center gap-2'
                            disabled={isAdding}
                        >
                            <Plus className='h-4 w-4' />
                            Add Payment Method
                        </Button>
                    </div>
                </>
            )}

            {showAddForm && (
                <AddPaymentMethod
                    onSave={handleAddPaymentMethod}
                    onCancel={() => setShowAddForm(false)}
                    isLoading={isAdding}
                />
            )}
        </div>
    );
}
