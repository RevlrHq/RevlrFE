'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NavigationService } from '@/lib/services/NavigationService';

/**
 * Component that initializes the NavigationService with Next.js router
 * Should be included in the root layout or main app component
 */
export function NavigationServiceInitializer() {
    const router = useRouter();

    useEffect(() => {
        // Initialize NavigationService with the router
        NavigationService.initialize(router);

        if (process.env.NODE_ENV === 'development') {
            console.log('NavigationService initialized with Next.js router');
        }
    }, [router]);

    // This component doesn't render anything
    return null;
}
