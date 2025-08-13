import React from 'react';
import CreateEvent from '@features/dashboard/CreateEvent';
import VendorAuthGuard from '@components/VendorAuthGuard';

const page = () => {
    return (
        <VendorAuthGuard requireVendor={true}>
            <CreateEvent />
        </VendorAuthGuard>
    );
};

export default page;
