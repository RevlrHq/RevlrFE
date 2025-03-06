'use client';

import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { Button } from '@components/ui/button';
import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <Alert variant='destructive' className='max-w-md'>
        <AlertTitle>Something went wrong!</AlertTitle>
        <AlertDescription className='mt-2'>
          {error.message || 'An unexpected error occurred'}
        </AlertDescription>
        <Button onClick={reset} className='mt-4'>
          Try again
        </Button>
      </Alert>
    </div>
  );
}
