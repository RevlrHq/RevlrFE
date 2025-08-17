'use client';

import React from 'react';
import { ThemeProvider } from '../lib/ThemeContext';
import EnhancedEventTable from './EnhancedEventTable';

const EnhancedEventTableDemo: React.FC = () => {
    const handleEventView = (eventId: string) => {
        console.log('View event:', eventId);
    };

    const handleEventEdit = (eventId: string) => {
        console.log('Edit event:', eventId);
    };

    return (
        <ThemeProvider>
            <div className='min-h-screen bg-gray-50 p-6 dark:bg-revlr-dark-bg'>
                <div className='mx-auto max-w-7xl'>
                    <h1 className='mb-6 text-2xl font-bold text-gray-900 dark:text-white'>
                        Enhanced Event Management
                    </h1>

                    <EnhancedEventTable
                        onEventView={handleEventView}
                        onEventEdit={handleEventEdit}
                        showActions={true}
                        showBulkActions={true}
                        showExport={true}
                        defaultPageSize={10}
                    />
                </div>
            </div>
        </ThemeProvider>
    );
};

export default EnhancedEventTableDemo;
