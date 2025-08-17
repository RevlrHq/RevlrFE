'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    Users,
    DollarSign,
    Calendar,
    AlertTriangle,
    Star,
    Target,
    Activity,
} from 'lucide-react';
import { EventPerformanceChart } from '@/components/charts/EventPerformanceChart';
import { useEventPerformanceAnalytics } from '@/hooks/useEventPerformanceAnalytics';
import { EventSummaryView, EventPerformanceView } from '@/lib/api';
import {
    formatCurrency,
    formatNumber,
    formatPercentage,
} from '@/lib/utils/chartConfig';

interface EventPerformanceAnalyticsProps {
    className?: string;
    timeRange?: {
        startDate?: string;
        endDate?: string;
    };
    maxTopEvents?: number;
    showRecommendations?: boolean;
    showAlerts?: boolean;
}

interface PerformanceMetric {
    label: string;
    value: string | number;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
    color: string;
}

interface PerformanceAlert {
    id: string;
    type: 'warning' | 'info' | 'success';
    title: string;
    description: string;
    eventId?: string;
    eventTitle?: string;
}

interface EventRecommendation {
    id: string;
    type: 'optimization' | 'marketing' | 'pricing';
    title: string;
    description: string;
    eventId?: string;
    eventTitle?: string;
    impact: 'high' | 'medium' | 'low';
}

export const EventPerformanceAnalytics: React.FC<
    EventPerformanceAnalyticsProps
> = ({
    className = '',
    timeRange,
    maxTopEvents = 10,
    showRecommendations = true,
    showAlerts = true,
}) => {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

    const {
        topPerformingEvents,
        eventPerformance,
        loading,
        error,
        fetchTopPerforming,
        fetchEventPerformance,
        refetch,
    } = useEventPerformanceAnalytics({
        maxEvents: maxTopEvents,
        timeRange,
    });

    // Calculate performance metrics
    const performanceMetrics = useMemo((): PerformanceMetric[] => {
        if (!topPerformingEvents || topPerformingEvents.length === 0) {
            return [];
        }

        const totalRevenue = topPerformingEvents.reduce(
            (sum, event) => sum + (event.revenue || 0),
            0
        );
        const totalRegistrations = topPerformingEvents.reduce(
            (sum, event) => sum + (event.registrationCount || 0),
            0
        );
        const totalTicketsSold = topPerformingEvents.reduce(
            (sum, event) => sum + (event.ticketsSold || 0),
            0
        );
        const totalTickets = topPerformingEvents.reduce(
            (sum, event) => sum + (event.totalTickets || 0),
            0
        );

        const averageRevenue = totalRevenue / topPerformingEvents.length;
        const averageSalesRate =
            totalTickets > 0 ? (totalTicketsSold / totalTickets) * 100 : 0;

        return [
            {
                label: 'Total Revenue',
                value: formatCurrency(totalRevenue),
                trend: 'up',
                icon: <DollarSign className='h-4 w-4' />,
                color: 'text-green-600',
            },
            {
                label: 'Total Registrations',
                value: formatNumber(totalRegistrations),
                trend: 'up',
                icon: <Users className='h-4 w-4' />,
                color: 'text-blue-600',
            },
            {
                label: 'Average Revenue',
                value: formatCurrency(averageRevenue),
                trend: 'neutral',
                icon: <BarChart3 className='h-4 w-4' />,
                color: 'text-purple-600',
            },
            {
                label: 'Average Sales Rate',
                value: formatPercentage(averageSalesRate / 100),
                trend:
                    averageSalesRate > 70
                        ? 'up'
                        : averageSalesRate > 40
                          ? 'neutral'
                          : 'down',
                icon: <Target className='h-4 w-4' />,
                color:
                    averageSalesRate > 70
                        ? 'text-green-600'
                        : averageSalesRate > 40
                          ? 'text-yellow-600'
                          : 'text-red-600',
            },
        ];
    }, [topPerformingEvents]);

    // Generate performance alerts
    const performanceAlerts = useMemo((): PerformanceAlert[] => {
        if (
            !showAlerts ||
            !topPerformingEvents ||
            topPerformingEvents.length === 0
        ) {
            return [];
        }

        const alerts: PerformanceAlert[] = [];

        // Check for low-performing events
        const lowPerformingEvents = topPerformingEvents.filter((event) => {
            const salesRate =
                event.totalTickets && event.totalTickets > 0
                    ? (event.ticketsSold || 0) / event.totalTickets
                    : 0;
            return salesRate < 0.3; // Less than 30% sales rate
        });

        if (lowPerformingEvents.length > 0) {
            alerts.push({
                id: 'low-sales-rate',
                type: 'warning',
                title: 'Low Sales Rate Detected',
                description: `${lowPerformingEvents.length} event(s) have sales rates below 30%. Consider reviewing pricing or marketing strategies.`,
            });
        }

        // Check for events with no registrations
        const noRegistrationEvents = topPerformingEvents.filter(
            (event) => (event.registrationCount || 0) === 0
        );

        if (noRegistrationEvents.length > 0) {
            alerts.push({
                id: 'no-registrations',
                type: 'warning',
                title: 'Events Without Registrations',
                description: `${noRegistrationEvents.length} event(s) have no registrations yet. Review event visibility and promotion.`,
            });
        }

        // Check for high-performing events
        const highPerformingEvents = topPerformingEvents.filter((event) => {
            const salesRate =
                event.totalTickets && event.totalTickets > 0
                    ? (event.ticketsSold || 0) / event.totalTickets
                    : 0;
            return salesRate > 0.8; // More than 80% sales rate
        });

        if (highPerformingEvents.length > 0) {
            alerts.push({
                id: 'high-performance',
                type: 'success',
                title: 'High-Performing Events',
                description: `${highPerformingEvents.length} event(s) have excellent sales rates above 80%. Great job!`,
            });
        }

        return alerts;
    }, [topPerformingEvents, showAlerts]);

    // Generate event recommendations
    const eventRecommendations = useMemo((): EventRecommendation[] => {
        if (
            !showRecommendations ||
            !topPerformingEvents ||
            topPerformingEvents.length === 0
        ) {
            return [];
        }

        const recommendations: EventRecommendation[] = [];

        // Pricing optimization recommendations
        const lowRevenueEvents = topPerformingEvents.filter(
            (event) =>
                (event.revenue || 0) <
                (topPerformingEvents.reduce(
                    (sum, e) => sum + (e.revenue || 0),
                    0
                ) /
                    topPerformingEvents.length) *
                    0.5
        );

        if (lowRevenueEvents.length > 0) {
            recommendations.push({
                id: 'pricing-optimization',
                type: 'pricing',
                title: 'Optimize Pricing Strategy',
                description:
                    'Some events are generating below-average revenue. Consider adjusting ticket prices or adding premium tiers.',
                impact: 'high',
            });
        }

        // Marketing recommendations
        const lowRegistrationEvents = topPerformingEvents.filter(
            (event) =>
                (event.registrationCount || 0) <
                (topPerformingEvents.reduce(
                    (sum, e) => sum + (e.registrationCount || 0),
                    0
                ) /
                    topPerformingEvents.length) *
                    0.6
        );

        if (lowRegistrationEvents.length > 0) {
            recommendations.push({
                id: 'marketing-boost',
                type: 'marketing',
                title: 'Increase Marketing Efforts',
                description:
                    'Several events have low registration numbers. Consider boosting social media promotion or email campaigns.',
                impact: 'medium',
            });
        }

        // Capacity optimization
        const nearCapacityEvents = topPerformingEvents.filter((event) => {
            const salesRate =
                event.totalTickets && event.totalTickets > 0
                    ? (event.ticketsSold || 0) / event.totalTickets
                    : 0;
            return salesRate > 0.9;
        });

        if (nearCapacityEvents.length > 0) {
            recommendations.push({
                id: 'capacity-expansion',
                type: 'optimization',
                title: 'Consider Capacity Expansion',
                description:
                    'Some events are nearly sold out. Consider increasing capacity or adding additional sessions.',
                impact: 'high',
            });
        }

        return recommendations;
    }, [topPerformingEvents, showRecommendations]);

    if (loading) {
        return (
            <div className={`space-y-6 ${className}`}>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className='pb-2'>
                                <Skeleton className='h-4 w-24' />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className='mb-2 h-8 w-20' />
                                <Skeleton className='h-3 w-16' />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className='h-6 w-48' />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className='h-64 w-full' />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className={className}>
                <Alert>
                    <AlertTriangle className='h-4 w-4' />
                    <AlertDescription>
                        Failed to load performance analytics: {error}
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={refetch}
                            className='ml-2'
                        >
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Performance Metrics Overview */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                {performanceMetrics.map((metric, index) => (
                    <Card key={index}>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>
                                {metric.label}
                            </CardTitle>
                            <div className={metric.color}>{metric.icon}</div>
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold'>
                                {metric.value}
                            </div>
                            {metric.trend && (
                                <div className='flex items-center text-xs text-muted-foreground'>
                                    {metric.trend === 'up' && (
                                        <TrendingUp className='mr-1 h-3 w-3 text-green-500' />
                                    )}
                                    {metric.trend === 'down' && (
                                        <TrendingDown className='mr-1 h-3 w-3 text-red-500' />
                                    )}
                                    {metric.trend === 'neutral' && (
                                        <Activity className='mr-1 h-3 w-3 text-gray-500' />
                                    )}
                                    {metric.change &&
                                        `${metric.change > 0 ? '+' : ''}${metric.change}%`}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Performance Analytics Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className='space-y-4'
            >
                <TabsList>
                    <TabsTrigger value='overview'>Overview</TabsTrigger>
                    <TabsTrigger value='trends'>Trends</TabsTrigger>
                    <TabsTrigger value='individual'>
                        Individual Events
                    </TabsTrigger>
                    {showRecommendations && (
                        <TabsTrigger value='recommendations'>
                            Recommendations
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value='overview' className='space-y-4'>
                    {/* Top Performing Events Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <Star className='h-5 w-5' />
                                Top Performing Events
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EventPerformanceChart
                                data={topPerformingEvents || []}
                                height={400}
                                maxEvents={maxTopEvents}
                                metric='both'
                            />
                        </CardContent>
                    </Card>

                    {/* Performance Alerts */}
                    {performanceAlerts.length > 0 && (
                        <div className='space-y-2'>
                            <h3 className='flex items-center gap-2 text-lg font-semibold'>
                                <AlertTriangle className='h-5 w-5' />
                                Performance Alerts
                            </h3>
                            {performanceAlerts.map((alert) => (
                                <Alert
                                    key={alert.id}
                                    className={
                                        alert.type === 'warning'
                                            ? 'border-yellow-200 bg-yellow-50'
                                            : alert.type === 'success'
                                              ? 'border-green-200 bg-green-50'
                                              : 'border-blue-200 bg-blue-50'
                                    }
                                >
                                    <AlertTriangle className='h-4 w-4' />
                                    <div>
                                        <div className='font-medium'>
                                            {alert.title}
                                        </div>
                                        <AlertDescription>
                                            {alert.description}
                                        </AlertDescription>
                                    </div>
                                </Alert>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value='trends' className='space-y-4'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Trends Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='py-8 text-center text-muted-foreground'>
                                <BarChart3 className='mx-auto mb-4 h-12 w-12 opacity-50' />
                                <p>
                                    Trend analysis will be available with more
                                    historical data.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value='individual' className='space-y-4'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Individual Event Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-4'>
                                {topPerformingEvents &&
                                topPerformingEvents.length > 0 ? (
                                    topPerformingEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className='space-y-2 rounded-lg border p-4'
                                        >
                                            <div className='flex items-center justify-between'>
                                                <h4 className='font-medium'>
                                                    {event.title}
                                                </h4>
                                                <Badge
                                                    variant={
                                                        event.status ===
                                                        'Published'
                                                            ? 'default'
                                                            : event.status ===
                                                                'Draft'
                                                              ? 'secondary'
                                                              : 'outline'
                                                    }
                                                >
                                                    {event.status}
                                                </Badge>
                                            </div>
                                            <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
                                                <div>
                                                    <span className='text-muted-foreground'>
                                                        Revenue:
                                                    </span>
                                                    <div className='font-medium'>
                                                        {formatCurrency(
                                                            event.revenue || 0
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className='text-muted-foreground'>
                                                        Registrations:
                                                    </span>
                                                    <div className='font-medium'>
                                                        {formatNumber(
                                                            event.registrationCount ||
                                                                0
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className='text-muted-foreground'>
                                                        Tickets Sold:
                                                    </span>
                                                    <div className='font-medium'>
                                                        {formatNumber(
                                                            event.ticketsSold ||
                                                                0
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className='text-muted-foreground'>
                                                        Sales Rate:
                                                    </span>
                                                    <div className='font-medium'>
                                                        {event.totalTickets &&
                                                        event.totalTickets > 0
                                                            ? formatPercentage(
                                                                  (event.ticketsSold ||
                                                                      0) /
                                                                      event.totalTickets
                                                              )
                                                            : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                onClick={() => {
                                                    setSelectedEventId(
                                                        event.id || null
                                                    );
                                                    if (event.id) {
                                                        fetchEventPerformance(
                                                            event.id
                                                        );
                                                    }
                                                }}
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className='py-8 text-center text-muted-foreground'>
                                        <Calendar className='mx-auto mb-4 h-12 w-12 opacity-50' />
                                        <p>
                                            No event performance data available.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {showRecommendations && (
                    <TabsContent value='recommendations' className='space-y-4'>
                        <Card>
                            <CardHeader>
                                <CardTitle className='flex items-center gap-2'>
                                    <Target className='h-5 w-5' />
                                    Performance Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {eventRecommendations.length > 0 ? (
                                    <div className='space-y-4'>
                                        {eventRecommendations.map(
                                            (recommendation) => (
                                                <div
                                                    key={recommendation.id}
                                                    className='rounded-lg border p-4'
                                                >
                                                    <div className='mb-2 flex items-start justify-between'>
                                                        <h4 className='font-medium'>
                                                            {
                                                                recommendation.title
                                                            }
                                                        </h4>
                                                        <Badge
                                                            variant={
                                                                recommendation.impact ===
                                                                'high'
                                                                    ? 'destructive'
                                                                    : recommendation.impact ===
                                                                        'medium'
                                                                      ? 'default'
                                                                      : 'secondary'
                                                            }
                                                        >
                                                            {
                                                                recommendation.impact
                                                            }{' '}
                                                            impact
                                                        </Badge>
                                                    </div>
                                                    <p className='mb-2 text-sm text-muted-foreground'>
                                                        {
                                                            recommendation.description
                                                        }
                                                    </p>
                                                    <Badge variant='outline'>
                                                        {recommendation.type}
                                                    </Badge>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div className='py-8 text-center text-muted-foreground'>
                                        <Target className='mx-auto mb-4 h-12 w-12 opacity-50' />
                                        <p>
                                            No recommendations available at this
                                            time.
                                        </p>
                                        <p className='mt-2 text-xs'>
                                            Recommendations will appear based on
                                            your event performance data.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default EventPerformanceAnalytics;
