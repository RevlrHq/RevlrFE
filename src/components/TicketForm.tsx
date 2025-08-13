'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import type { EventTicket } from '@src/types/event-creation';

interface TicketFormProps {
    ticket?: EventTicket;
    onSave: (ticket: Omit<EventTicket, 'id'>) => void;
    onCancel: () => void;
    isEditing?: boolean;
}

export const TicketForm: React.FC<TicketFormProps> = ({
    ticket,
    onSave,
    onCancel,
    isEditing = false,
}) => {
    const { theme } = useTheme();

    // Form state
    const [formData, setFormData] = useState<Omit<EventTicket, 'id'>>({
        type: 'free',
        name: '',
        description: '',
        price: 0,
        quantity: 1,
        purchaseLimit: 1,
        salesPeriod: {
            startDate: '',
            endDate: '',
            startTime: '',
            endTime: '',
        },
        refundPolicy: '',
        feeOption: 'attendees',
        selected: false,
        isActive: true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Initialize form with ticket data if editing
    useEffect(() => {
        if (ticket) {
            setFormData({
                type: ticket.type,
                name: ticket.name,
                description: ticket.description || '',
                price: ticket.price || 0,
                quantity: ticket.quantity,
                purchaseLimit: ticket.purchaseLimit,
                salesPeriod: ticket.salesPeriod || {
                    startDate: '',
                    endDate: '',
                    startTime: '',
                    endTime: '',
                },
                refundPolicy: ticket.refundPolicy || '',
                feeOption: ticket.feeOption || 'attendees',
                selected: ticket.selected || false,
                isActive: ticket.isActive !== false,
            });
        }
    }, [ticket]);

    const handleInputChange = (
        field: keyof typeof formData,
        value: string | number | boolean
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: '',
            }));
        }
    };

    const handleSalesPeriodChange = (
        field: keyof NonNullable<EventTicket['salesPeriod']>,
        value: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            salesPeriod: {
                startDate: prev.salesPeriod?.startDate || '',
                endDate: prev.salesPeriod?.endDate || '',
                startTime: prev.salesPeriod?.startTime || '',
                endTime: prev.salesPeriod?.endTime || '',
                [field]: value,
            },
        }));

        // Clear error when user starts typing
        const errorKey = `salesPeriod.${field}`;
        if (errors[errorKey]) {
            setErrors((prev) => ({
                ...prev,
                [errorKey]: '',
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Required fields
        if (!formData.name.trim()) {
            newErrors.name = 'Ticket name is required';
        }

        if (formData.quantity < 1) {
            newErrors.quantity = 'Quantity must be at least 1';
        }

        if (formData.purchaseLimit < 1) {
            newErrors.purchaseLimit = 'Purchase limit must be at least 1';
        }

        if (formData.purchaseLimit > formData.quantity) {
            newErrors.purchaseLimit = 'Purchase limit cannot exceed quantity';
        }

        // Price validation for paid tickets
        if (formData.type === 'paid') {
            if (!formData.price || formData.price <= 0) {
                newErrors.price =
                    'Price must be greater than 0 for paid tickets';
            }
        }

        // Sales period validation
        if (formData.salesPeriod?.startDate && formData.salesPeriod?.endDate) {
            const startDate = new Date(formData.salesPeriod.startDate);
            const endDate = new Date(formData.salesPeriod.endDate);

            if (startDate >= endDate) {
                newErrors['salesPeriod.endDate'] =
                    'End date must be after start date';
            }

            // Check if start date is in the past
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            if (startDate < now) {
                newErrors['salesPeriod.startDate'] =
                    'Start date cannot be in the past';
            }
        }

        // Time validation
        if (
            formData.salesPeriod?.startDate &&
            formData.salesPeriod?.endDate &&
            formData.salesPeriod?.startTime &&
            formData.salesPeriod?.endTime &&
            formData.salesPeriod.startDate === formData.salesPeriod.endDate
        ) {
            const startTime = formData.salesPeriod.startTime;
            const endTime = formData.salesPeriod.endTime;

            if (startTime >= endTime) {
                newErrors['salesPeriod.endTime'] =
                    'End time must be after start time on the same day';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            onSave(formData);
        }
    };

    const inputClassName = `w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 ${
        theme === 'dark'
            ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
            : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
    } focus:outline-none focus:ring-2`;

    const errorInputClassName = `w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 border-red-500 focus:ring-red-500/20 ${
        theme === 'dark'
            ? 'bg-revlr-dark-bg text-white placeholder:text-gray-400'
            : 'bg-white text-gray-900 placeholder:text-gray-500'
    } focus:outline-none focus:ring-2`;

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <h3
                    className={`font-inter text-xl font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                >
                    {isEditing ? 'Edit Ticket' : 'Add New Ticket'}
                </h3>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
                {/* Ticket Type */}
                <div>
                    <label
                        className={`mb-3 block font-inter text-sm font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                    >
                        <span className='mr-2 text-revlr-accent-orange'>*</span>
                        Ticket Type
                    </label>
                    <div className='flex space-x-4'>
                        <label className='flex cursor-pointer items-center space-x-3'>
                            <div
                                className={`flex size-5 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                    formData.type === 'free'
                                        ? 'border-revlr-primary-blue bg-revlr-primary-blue'
                                        : theme === 'dark'
                                          ? 'border-revlr-dark-border'
                                          : 'border-gray-300'
                                }`}
                            >
                                {formData.type === 'free' && (
                                    <div className='size-2 rounded-full bg-white'></div>
                                )}
                            </div>
                            <input
                                type='radio'
                                name='ticketType'
                                value='free'
                                checked={formData.type === 'free'}
                                onChange={() =>
                                    handleInputChange('type', 'free')
                                }
                                className='hidden'
                            />
                            <span
                                className={`font-inter text-sm transition-colors duration-200 ${
                                    formData.type === 'free'
                                        ? 'font-semibold text-revlr-primary-blue'
                                        : theme === 'dark'
                                          ? 'font-medium text-gray-300'
                                          : 'font-medium text-gray-600'
                                }`}
                            >
                                Free
                            </span>
                        </label>

                        <label className='flex cursor-pointer items-center space-x-3'>
                            <div
                                className={`flex size-5 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                    formData.type === 'paid'
                                        ? 'border-revlr-primary-blue bg-revlr-primary-blue'
                                        : theme === 'dark'
                                          ? 'border-revlr-dark-border'
                                          : 'border-gray-300'
                                }`}
                            >
                                {formData.type === 'paid' && (
                                    <div className='size-2 rounded-full bg-white'></div>
                                )}
                            </div>
                            <input
                                type='radio'
                                name='ticketType'
                                value='paid'
                                checked={formData.type === 'paid'}
                                onChange={() =>
                                    handleInputChange('type', 'paid')
                                }
                                className='hidden'
                            />
                            <span
                                className={`font-inter text-sm transition-colors duration-200 ${
                                    formData.type === 'paid'
                                        ? 'font-semibold text-revlr-primary-blue'
                                        : theme === 'dark'
                                          ? 'font-medium text-gray-300'
                                          : 'font-medium text-gray-600'
                                }`}
                            >
                                Paid
                            </span>
                        </label>
                    </div>
                </div>

                {/* Basic Details */}
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div>
                        <label
                            className={`mb-2 block font-inter text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            <span className='mr-2 text-revlr-accent-orange'>
                                *
                            </span>
                            Ticket Name
                        </label>
                        <input
                            type='text'
                            placeholder='e.g., General Admission'
                            value={formData.name}
                            onChange={(e) =>
                                handleInputChange('name', e.target.value)
                            }
                            className={
                                errors.name
                                    ? errorInputClassName
                                    : inputClassName
                            }
                        />
                        {errors.name && (
                            <p className='mt-1 font-inter text-sm text-red-500'>
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {formData.type === 'paid' && (
                        <div>
                            <label
                                className={`mb-2 block font-inter text-sm font-medium ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                <span className='mr-2 text-revlr-accent-orange'>
                                    *
                                </span>
                                Price ($)
                            </label>
                            <input
                                type='number'
                                placeholder='0.00'
                                min='0'
                                step='0.01'
                                value={formData.price}
                                onChange={(e) =>
                                    handleInputChange(
                                        'price',
                                        parseFloat(e.target.value) || 0
                                    )
                                }
                                className={
                                    errors.price
                                        ? errorInputClassName
                                        : inputClassName
                                }
                            />
                            {errors.price && (
                                <p className='mt-1 font-inter text-sm text-red-500'>
                                    {errors.price}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Quantity and Limits */}
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div>
                        <label
                            className={`mb-2 block font-inter text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            <span className='mr-2 text-revlr-accent-orange'>
                                *
                            </span>
                            Available Quantity
                        </label>
                        <input
                            type='number'
                            placeholder='100'
                            min='1'
                            value={formData.quantity}
                            onChange={(e) =>
                                handleInputChange(
                                    'quantity',
                                    parseInt(e.target.value) || 1
                                )
                            }
                            className={
                                errors.quantity
                                    ? errorInputClassName
                                    : inputClassName
                            }
                        />
                        {errors.quantity && (
                            <p className='mt-1 font-inter text-sm text-red-500'>
                                {errors.quantity}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            className={`mb-2 block font-inter text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            <span className='mr-2 text-revlr-accent-orange'>
                                *
                            </span>
                            Purchase Limit per Customer
                        </label>
                        <input
                            type='number'
                            placeholder='5'
                            min='1'
                            value={formData.purchaseLimit}
                            onChange={(e) =>
                                handleInputChange(
                                    'purchaseLimit',
                                    parseInt(e.target.value) || 1
                                )
                            }
                            className={
                                errors.purchaseLimit
                                    ? errorInputClassName
                                    : inputClassName
                            }
                        />
                        {errors.purchaseLimit && (
                            <p className='mt-1 font-inter text-sm text-red-500'>
                                {errors.purchaseLimit}
                            </p>
                        )}
                    </div>
                </div>

                {/* Sales Period */}
                <div>
                    <label
                        className={`mb-3 block font-inter text-sm font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                    >
                        Sales Period
                    </label>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <div>
                            <label
                                className={`mb-2 block font-inter text-xs font-medium ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                Start Date
                            </label>
                            <input
                                type='date'
                                value={formData.salesPeriod?.startDate || ''}
                                onChange={(e) =>
                                    handleSalesPeriodChange(
                                        'startDate',
                                        e.target.value
                                    )
                                }
                                className={
                                    errors['salesPeriod.startDate']
                                        ? errorInputClassName
                                        : inputClassName
                                }
                            />
                            {errors['salesPeriod.startDate'] && (
                                <p className='mt-1 font-inter text-sm text-red-500'>
                                    {errors['salesPeriod.startDate']}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                className={`mb-2 block font-inter text-xs font-medium ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                Start Time
                            </label>
                            <input
                                type='time'
                                value={formData.salesPeriod?.startTime || ''}
                                onChange={(e) =>
                                    handleSalesPeriodChange(
                                        'startTime',
                                        e.target.value
                                    )
                                }
                                className={inputClassName}
                            />
                        </div>

                        <div>
                            <label
                                className={`mb-2 block font-inter text-xs font-medium ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                End Date
                            </label>
                            <input
                                type='date'
                                value={formData.salesPeriod?.endDate || ''}
                                onChange={(e) =>
                                    handleSalesPeriodChange(
                                        'endDate',
                                        e.target.value
                                    )
                                }
                                className={
                                    errors['salesPeriod.endDate']
                                        ? errorInputClassName
                                        : inputClassName
                                }
                            />
                            {errors['salesPeriod.endDate'] && (
                                <p className='mt-1 font-inter text-sm text-red-500'>
                                    {errors['salesPeriod.endDate']}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                className={`mb-2 block font-inter text-xs font-medium ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }`}
                            >
                                End Time
                            </label>
                            <input
                                type='time'
                                value={formData.salesPeriod?.endTime || ''}
                                onChange={(e) =>
                                    handleSalesPeriodChange(
                                        'endTime',
                                        e.target.value
                                    )
                                }
                                className={
                                    errors['salesPeriod.endTime']
                                        ? errorInputClassName
                                        : inputClassName
                                }
                            />
                            {errors['salesPeriod.endTime'] && (
                                <p className='mt-1 font-inter text-sm text-red-500'>
                                    {errors['salesPeriod.endTime']}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label
                        className={`mb-2 block font-inter text-sm font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                    >
                        Description (Optional)
                    </label>
                    <textarea
                        placeholder="Describe what's included with this ticket..."
                        rows={3}
                        value={formData.description}
                        onChange={(e) =>
                            handleInputChange('description', e.target.value)
                        }
                        className={inputClassName}
                    />
                </div>

                {/* Fee Option for Paid Tickets */}
                {formData.type === 'paid' && (
                    <div>
                        <label
                            className={`mb-3 block font-inter text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Processing Fees
                        </label>
                        <div className='flex space-x-4'>
                            <label className='flex cursor-pointer items-center space-x-3'>
                                <div
                                    className={`flex size-5 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                        formData.feeOption === 'attendees'
                                            ? 'border-revlr-primary-blue bg-revlr-primary-blue'
                                            : theme === 'dark'
                                              ? 'border-revlr-dark-border'
                                              : 'border-gray-300'
                                    }`}
                                >
                                    {formData.feeOption === 'attendees' && (
                                        <div className='size-2 rounded-full bg-white'></div>
                                    )}
                                </div>
                                <input
                                    type='radio'
                                    name='feeOption'
                                    value='attendees'
                                    checked={formData.feeOption === 'attendees'}
                                    onChange={() =>
                                        handleInputChange(
                                            'feeOption',
                                            'attendees'
                                        )
                                    }
                                    className='hidden'
                                />
                                <span
                                    className={`font-inter text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-300'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Pass to attendees
                                </span>
                            </label>

                            <label className='flex cursor-pointer items-center space-x-3'>
                                <div
                                    className={`flex size-5 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                        formData.feeOption === 'organizer'
                                            ? 'border-revlr-primary-blue bg-revlr-primary-blue'
                                            : theme === 'dark'
                                              ? 'border-revlr-dark-border'
                                              : 'border-gray-300'
                                    }`}
                                >
                                    {formData.feeOption === 'organizer' && (
                                        <div className='size-2 rounded-full bg-white'></div>
                                    )}
                                </div>
                                <input
                                    type='radio'
                                    name='feeOption'
                                    value='organizer'
                                    checked={formData.feeOption === 'organizer'}
                                    onChange={() =>
                                        handleInputChange(
                                            'feeOption',
                                            'organizer'
                                        )
                                    }
                                    className='hidden'
                                />
                                <span
                                    className={`font-inter text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-300'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Absorb fees
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Refund Policy */}
                <div>
                    <label
                        className={`mb-2 block font-inter text-sm font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                    >
                        Refund Policy (Optional)
                    </label>
                    <textarea
                        placeholder='Describe your refund policy...'
                        rows={2}
                        value={formData.refundPolicy}
                        onChange={(e) =>
                            handleInputChange('refundPolicy', e.target.value)
                        }
                        className={inputClassName}
                    />
                </div>

                {/* Form Actions */}
                <div className='flex justify-end space-x-3 pt-4'>
                    <button
                        type='button'
                        onClick={onCancel}
                        className={`rounded-xl px-6 py-3 font-inter font-medium transition-all duration-200 ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/80'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Cancel
                    </button>
                    <button
                        type='submit'
                        className='rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 font-inter font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20'
                    >
                        {isEditing ? 'Update Ticket' : 'Add Ticket'}
                    </button>
                </div>
            </form>
        </div>
    );
};
