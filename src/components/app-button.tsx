'use client';

import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@components/ui/button';

import { cn } from '@lib/utils';

interface IAppButtonProps {
    type: 'button' | 'submit' | 'reset';
    className?: string;
    isDisabled?: boolean;
    isLoading?: boolean;
    children: React.ReactNode;
    // onClick?: () => void;
}

export default function AppButton({
    type = 'button',
    className,
    isDisabled,
    isLoading,
    children,
    ...props
}: IAppButtonProps & ButtonProps) {
    return (
        <>
            <Button
                type={type}
                className={cn('w-full', className)}
                disabled={isDisabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <Loader2 className='mr-2 size-4 animate-spin' />
                        Please wait
                    </>
                ) : (
                    children
                )}
            </Button>
        </>
    );
}
