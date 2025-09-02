'use client';

import React from 'react';
import { PaymentMethods } from './components/PaymentMethods';
import { BillingHistory } from './components/BillingHistory';
import { SettingsCard } from '../shared/components/SettingsCard';
import { SettingsSection } from '../shared/components/SettingsSection';

interface BillingSettingsProps {
    className?: string;
}

function BillingSettings({ className }: BillingSettingsProps) {
    return (
        <div className={className}>
            <SettingsSection title='Billing & Payments'>
                <div className='space-y-6'>
                    <SettingsCard
                        title='Payment Methods'
                        description='Manage your payment methods and billing information'
                    >
                        <PaymentMethods />
                    </SettingsCard>

                    <SettingsCard
                        title='Billing History'
                        description='View your transaction history and download invoices'
                    >
                        <BillingHistory />
                    </SettingsCard>
                </div>
            </SettingsSection>
        </div>
    );
}

// Default export for lazy loading
export default BillingSettings;
