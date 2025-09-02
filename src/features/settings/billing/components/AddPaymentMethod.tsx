'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '../../shared/components/LoadingSpinner';
import type { AddPaymentMethodData } from '../types';

interface AddPaymentMethodProps {
    onSave: (data: AddPaymentMethodData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function AddPaymentMethod({
    onSave,
    onCancel,
    isLoading = false,
}: AddPaymentMethodProps) {
    const [paymentType, setPaymentType] = useState<'card' | 'bank_account'>(
        'card'
    );
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<AddPaymentMethodData>();

    const onSubmit = async (data: AddPaymentMethodData) => {
        await onSave({ ...data, type: paymentType });
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 20 }, (_, i) => currentYear + i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
            <div className='mx-4 w-full max-w-md rounded-lg bg-white p-6'>
                <div className='mb-4 flex items-center justify-between'>
                    <h3 className='text-lg font-semibold'>
                        Add Payment Method
                    </h3>
                    <Button variant='ghost' size='sm' onClick={onCancel}>
                        <X className='h-4 w-4' />
                    </Button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                    <div>
                        <Label htmlFor='paymentType'>Payment Type</Label>
                        <Select
                            value={paymentType}
                            onValueChange={(value: 'card' | 'bank_account') =>
                                setPaymentType(value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='card'>
                                    Credit/Debit Card
                                </SelectItem>
                                <SelectItem value='bank_account'>
                                    Bank Account
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {paymentType === 'card' && (
                        <>
                            <div>
                                <Label htmlFor='cardNumber'>Card Number</Label>
                                <Input
                                    id='cardNumber'
                                    {...register('cardNumber', {
                                        required: 'Card number is required',
                                        pattern: {
                                            value: /^[0-9\s]{13,19}$/,
                                            message: 'Invalid card number',
                                        },
                                    })}
                                    placeholder='1234 5678 9012 3456'
                                    maxLength={19}
                                />
                                {errors.cardNumber && (
                                    <p className='mt-1 text-sm text-red-600'>
                                        {errors.cardNumber.message}
                                    </p>
                                )}
                            </div>

                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <Label htmlFor='expiryMonth'>
                                        Expiry Month
                                    </Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setValue(
                                                'expiryMonth',
                                                parseInt(value)
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder='Month' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map((month) => (
                                                <SelectItem
                                                    key={month}
                                                    value={month.toString()}
                                                >
                                                    {month
                                                        .toString()
                                                        .padStart(2, '0')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor='expiryYear'>
                                        Expiry Year
                                    </Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setValue(
                                                'expiryYear',
                                                parseInt(value)
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder='Year' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((year) => (
                                                <SelectItem
                                                    key={year}
                                                    value={year.toString()}
                                                >
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor='cvc'>CVC</Label>
                                <Input
                                    id='cvc'
                                    {...register('cvc', {
                                        required: 'CVC is required',
                                        pattern: {
                                            value: /^[0-9]{3,4}$/,
                                            message: 'Invalid CVC',
                                        },
                                    })}
                                    placeholder='123'
                                    maxLength={4}
                                />
                                {errors.cvc && (
                                    <p className='mt-1 text-sm text-red-600'>
                                        {errors.cvc.message}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    <div>
                        <Label htmlFor='holderName'>Cardholder Name</Label>
                        <Input
                            id='holderName'
                            {...register('holderName', {
                                required: 'Name is required',
                            })}
                            placeholder='John Doe'
                        />
                        {errors.holderName && (
                            <p className='mt-1 text-sm text-red-600'>
                                {errors.holderName.message}
                            </p>
                        )}
                    </div>

                    <div className='space-y-3'>
                        <Label>Billing Address</Label>

                        <Input
                            {...register('billingAddress.line1', {
                                required: 'Address is required',
                            })}
                            placeholder='Street address'
                        />
                        {errors.billingAddress?.line1 && (
                            <p className='text-sm text-red-600'>
                                {errors.billingAddress.line1.message}
                            </p>
                        )}

                        <Input
                            {...register('billingAddress.line2')}
                            placeholder='Apartment, suite, etc. (optional)'
                        />

                        <div className='grid grid-cols-2 gap-3'>
                            <Input
                                {...register('billingAddress.city', {
                                    required: 'City is required',
                                })}
                                placeholder='City'
                            />
                            <Input
                                {...register('billingAddress.state', {
                                    required: 'State is required',
                                })}
                                placeholder='State'
                            />
                        </div>

                        <div className='grid grid-cols-2 gap-3'>
                            <Input
                                {...register('billingAddress.postalCode', {
                                    required: 'Postal code is required',
                                })}
                                placeholder='Postal code'
                            />
                            <Input
                                {...register('billingAddress.country', {
                                    required: 'Country is required',
                                })}
                                placeholder='Country'
                            />
                        </div>
                    </div>

                    <div className='flex gap-3 pt-4'>
                        <Button
                            type='submit'
                            disabled={isLoading}
                            className='flex-1'
                        >
                            {isLoading ? (
                                <LoadingSpinner size='sm' />
                            ) : (
                                'Add Payment Method'
                            )}
                        </Button>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
