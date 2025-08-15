'use client';

import React, { useState } from 'react';
import { MediaSearchTestComponent } from '@/components/MediaSearchTestComponent';
import PerformanceDashboard from '@/components/media-search/PerformanceDashboard';

/**
 * Test page for the Media Search Performance Dashboard
 * This page allows testing the dashboard functionality in isolation
 */
export default function TestMediaDashboardPage() {
    const [showDashboard, setShowDashboard] = useState(false);

    return (
        <div className='min-h-screen bg-gray-50 p-8 dark:bg-gray-900'>
            <div className='mx-auto max-w-6xl'>
                <div className='mb-8'>
                    <h1 className='mb-4 text-3xl font-bold text-gray-900 dark:text-white'>
                        Media Search Performance Dashboard Test
                    </h1>
                    <p className='mb-6 text-gray-600 dark:text-gray-400'>
                        This page allows you to test the Media Search
                        Performance Dashboard functionality. Use the media
                        search component below to generate some activity, then
                        open the dashboard to view the metrics.
                    </p>

                    <div className='mb-8 flex gap-4'>
                        <button
                            onClick={() => setShowDashboard(true)}
                            className='rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700'
                        >
                            Open Performance Dashboard
                        </button>

                        <button
                            onClick={() => {
                                // Clear localStorage analytics data for testing
                                localStorage.removeItem(
                                    'media_search_analytics'
                                );
                                localStorage.removeItem('ab_test_assignments');
                                alert(
                                    'Analytics data cleared! Try some searches and then open the dashboard.'
                                );
                            }}
                            className='rounded-lg bg-gray-600 px-6 py-3 text-white transition-colors hover:bg-gray-700'
                        >
                            Clear Analytics Data
                        </button>
                    </div>
                </div>

                {/* Media Search Test Component */}
                <div className='mb-8 rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800'>
                    <h2 className='mb-4 text-xl font-semibold text-gray-900 dark:text-white'>
                        Media Search Test Component
                    </h2>
                    <p className='mb-4 text-gray-600 dark:text-gray-400'>
                        Use this component to perform searches and generate
                        analytics data:
                    </p>
                    <MediaSearchTestComponent />
                </div>

                {/* Instructions */}
                <div className='rounded-xl bg-blue-50 p-6 dark:bg-blue-900/20'>
                    <h3 className='mb-3 text-lg font-semibold text-blue-900 dark:text-blue-100'>
                        Testing Instructions
                    </h3>
                    <ol className='list-inside list-decimal space-y-2 text-blue-800 dark:text-blue-200'>
                        <li>
                            Try searching for different terms (e.g., "nature",
                            "business", "technology")
                        </li>
                        <li>
                            Select and deselect some images if the search works
                        </li>
                        <li>
                            Open the Performance Dashboard to see the metrics
                        </li>
                        <li>
                            The dashboard should show provider health, response
                            times, and other analytics
                        </li>
                        <li>
                            If no real data is available, the dashboard will
                            show mock data
                        </li>
                    </ol>

                    <div className='mt-4 rounded-lg bg-yellow-100 p-4 dark:bg-yellow-900/20'>
                        <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                            <strong>Note:</strong> The dashboard is designed to
                            work even when the media search providers are not
                            properly configured. It will show mock data and
                            fallback information to demonstrate the interface
                            and functionality.
                        </p>
                    </div>
                </div>
            </div>

            {/* Performance Dashboard */}
            <PerformanceDashboard
                isVisible={showDashboard}
                onClose={() => setShowDashboard(false)}
            />
        </div>
    );
}
