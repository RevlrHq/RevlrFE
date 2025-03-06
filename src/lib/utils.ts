import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Toast } from '@hooks/use-toast';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isObjectEmpty(objectName: Record<string, string>): boolean {
    if (!objectName) return true;
    return Object.keys(objectName).length === 0;
}

// handle errors display
export function onErrorDisplay(
    errors: { body?: { errors?: Record<string, string>; message?: string } },
    toast: ({ ...props }: Toast) => void,
    title?: string
) {
    if (isObjectEmpty(errors?.body?.errors as Record<string, string>)) {
        toast({
            title: title || 'Action Failed.',
            description: errors?.body?.message,
            variant: 'destructive',
        });

        return;
    }

    Object.entries(errors?.body?.errors || {}).forEach(([, message]) => {
        toast({
            title: title || 'Action Failed.',
            description: message as string,
            variant: 'destructive',
        });
    });
}
