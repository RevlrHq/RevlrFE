import React from 'react';
import CreateEvent from '@features/dashboard/CreateEvent';
import VendorAuthGuard from '@components/VendorAuthGuard';
import { MediaSearchDebugger } from '@/lib/services/media/debug/MediaSearchDebugger';

const page = async () => {
    await MediaSearchDebugger.quickTest();
    return (
        <VendorAuthGuard requireVendor={true}>
            <CreateEvent />
        </VendorAuthGuard>
    );
};

export default page;
