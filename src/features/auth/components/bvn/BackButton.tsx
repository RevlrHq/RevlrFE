import React from 'react';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@components/ui/button';

type BackButtonProps = {
    onGoBack: () => void;
};

export default function BackButton({ onGoBack }: BackButtonProps) {
    return (
        <Button
            asChild
            variant='link'
            className='cursor-pointer px-0 no-underline'
            role='button'
            onClick={() => onGoBack()}
        >
            <span className='flex items-center gap-3'>
                <ArrowLeft data-testid='lucide-arrow-left' />{' '}
                <span className='hidden text-xl text-chit-woodsmoke sm:inline-block'>
                    Back
                </span>
            </span>
        </Button>
    );
}
