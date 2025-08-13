'use client';

import React, { forwardRef } from 'react';

interface AnnouncementRegionProps {
    className?: string;
}

export const AnnouncementRegion = forwardRef<
    HTMLDivElement,
    AnnouncementRegionProps
>(({ className = 'sr-only' }, ref) => {
    return (
        <div
            ref={ref}
            aria-live='polite'
            aria-atomic='true'
            className={className}
        />
    );
});

AnnouncementRegion.displayName = 'AnnouncementRegion';

export default AnnouncementRegion;
