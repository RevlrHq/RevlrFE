'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrganizerRealtime } from '@/hooks/useOrganizerRealtime';
import { OrganizerNotificationCenter } from '@/components/OrganizerNotificationCenter';
import { RealtimeConnectionStatus } from '@/components/RealtimeConnectionStatus';

interface OrganizerRealtimeExampleProps {
    organizerId: string;
}

export const OrganizerRealtimeExample: React.FC<
    OrganizerRealtimeExampleProps
> = ({ organizerId }) => {
    const {
        isConnected,
        dashboardUpdates,
        eventStatusUpdates,
        registrationUpdates,
        revenueUpdates,
        notifications,
        unreadCount,
        onDashboardUpdate,
        onEventStatusUpdate,
        onRegistrationUpdate,
        onRevenueUpdate,
    } = useOrganizerRealtime({
        organizerId,
        enableNotifications: true,
        enableToasts: true,
    });

    // Example of subscribing to specific updates
    useEffect(() => {
        const unsubscribeDashboard = onDashboardUpdate((update) => {
            console.log('Dashboard updated:', update);
        });

        const unsubscribeEvents = onEventStatusUpdate((update) => {
            console.log('Event status changed:', update);
        });

        const unsubscribeRegistrations = onRegistrationUpdate((update) => {
            console.log('New registration:', update);
        });

        const unsubscribeRevenue = onRevenueUpdate((update) => {
            console.log('Revenue updated:', update);
        });

        return () => {
            unsubscribeDashboard();
            unsubscribeEvents();
            unsubscribeRegistrations();
            unsubscribeRevenue();
        };
    }, [
        onDashboardUpdate,
        onEventStatusUpdate,
        onRegistrationUpdate,
        onRevenueUpdate,
    ]);

    return (
        <div className='space-y-6'>
            {/* Header with connection status and notifications */}
            <div className='flex items-center justify-between'>
                <h2 className='text-2xl font-bold'>Real-time Dashboard</h2>
                <div className='flex items-center gap-4'>
                    <RealtimeConnectionStatus
                        organizerId={organizerId}
                        variant='badge'
                        showLabel
                    />
                    <OrganizerNotificationCenter organizerId={organizerId} />
                </div>
            </div>

            {/* Real-time metrics */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-sm font-medium'>
                            Total Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                            {dashboardUpdates?.totalEvents ?? '--'}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-sm font-medium'>
                            Active Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                            {dashboardUpdates?.activeEvents ?? '--'}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-sm font-medium'>
                            Total Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                            $
                            {dashboardUpdates?.totalRevenue?.toLocaleString() ??
                                '--'}
                        </div>
                        {dashboardUpdates?.revenueGrowth && (
                            <Badge variant='secondary' className='mt-1'>
                                {dashboardUpdates.revenueGrowth > 0 ? '+' : ''}
                                {
                                    dashboardUpdates.revenueGrowth
                                }%
                            </Badge>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='pb-2'>
                        <CardTitle className='text-sm font-medium'>
                            Total Attendees
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                            {dashboardUpdates?.totalAttendees?.toLocaleString() ??
                                '--'}
                        </div>
                        {dashboardUpdates?.attendeeGrowth && (
                            <Badge variant='secondary' className='mt-1'>
                                {dashboardUpdates.attendeeGrowth > 0 ? '+' : ''}
                                {
                                    dashboardUpdates.attendeeGrowth
                                }%
                            </Badge>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent activity */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                {/* Recent event status changes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Event Updates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-3'>
                            {eventStatusUpdates
                                .slice(0, 5)
                                .map((update, index) => (
                                    <div
                                        key={`${update.eventId}-${index}`}
                                        className='flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800'
                                    >
                                        <div>
                                            <p className='font-medium'>
                                                {update.eventTitle}
                                            </p>
                                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                                {update.oldStatus} →{' '}
                                                {update.newStatus}
                                            </p>
                                        </div>
                                        <Badge variant='outline'>
                                            {new Date(
                                                update.timestamp
                                            ).toLocaleTimeString()}
                                        </Badge>
                                    </div>
                                ))}
                            {eventStatusUpdates.length === 0 && (
                                <p className='py-4 text-center text-gray-500'>
                                    No recent event updates
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent registrations */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Registrations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-3'>
                            {registrationUpdates
                                .slice(0, 5)
                                .map((update, index) => (
                                    <div
                                        key={`${update.registration.registrationId}-${index}`}
                                        className='flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800'
                                    >
                                        <div>
                                            <p className='font-medium'>
                                                {
                                                    update.registration
                                                        .attendeeFirstName
                                                }{' '}
                                                {
                                                    update.registration
                                                        .attendeeLastName
                                                }
                                            </p>
                                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                                {update.eventTitle}
                                            </p>
                                        </div>
                                        <div className='text-right'>
                                            <p className='font-medium'>
                                                $
                                                {update.registration.amountPaid?.toFixed(
                                                    2
                                                )}
                                            </p>
                                            <p className='text-xs text-gray-500'>
                                                {new Date(
                                                    update.timestamp
                                                ).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            {registrationUpdates.length === 0 && (
                                <p className='py-4 text-center text-gray-500'>
                                    No recent registrations
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Connection status info */}
            <Card>
                <CardHeader>
                    <CardTitle>Real-time Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='grid grid-cols-2 gap-4 text-center md:grid-cols-4'>
                        <div>
                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                Connection
                            </p>
                            <p className='font-medium'>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </p>
                        </div>
                        <div>
                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                Notifications
                            </p>
                            <p className='font-medium'>
                                {notifications.length}
                            </p>
                        </div>
                        <div>
                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                Unread
                            </p>
                            <p className='font-medium'>{unreadCount}</p>
                        </div>
                        <div>
                            <p className='text-sm text-gray-600 dark:text-gray-400'>
                                Revenue Updates
                            </p>
                            <p className='font-medium'>
                                {revenueUpdates.length}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OrganizerRealtimeExample;
