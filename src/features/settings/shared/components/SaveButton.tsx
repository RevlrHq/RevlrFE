'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SaveButtonProps {
    onClick?: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    children?: React.ReactNode;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
}

export function SaveButton({
    onClick,
    isLoading = false,
    disabled = false,
    children = 'Save Changes',
    className,
    type = 'button',
}: SaveButtonProps) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || isLoading}
            className={cn(
                'inline-flex items-center justify-center rounded-md px-4 py-2',
                'bg-blue-600 text-sm font-medium text-white',
                'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'transition-colors duration-200',
                className
            )}
        >
            {isLoading && <Loader2 className='mr-2 size-4 animate-spin' />}
            {children}
        </button>
    );
}
