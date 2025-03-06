'use client';

import { Button } from '@components/ui/button';
import { useState } from 'react';

export default function TestStates() {
    const [shouldError, setShouldError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (shouldError) {
        throw new Error('This is a test error');
    }

    if (isLoading) {
        // This will trigger the loading.tsx
        return null;
    }

    return (
        <div className='space-y-4 p-4'>
            <Button onClick={() => setShouldError(true)} variant='destructive'>
                Trigger Error
            </Button>

            <Button
                onClick={async () => {
                    setIsLoading(true);
                    await new Promise((resolve) => setTimeout(resolve, 3000));
                    setIsLoading(false);
                }}
            >
                Test Loading (3s)
            </Button>
        </div>
    );
}
