'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    OrganizerService,
    MonthlyRevenue,
    EventRevenueBreakdown,
    RevenueStatistics,
    OrganizerRevenueReportRequest,
} from '../lib/api';

export interface RevenueFilters {
    startDate?: string;
    endDate?: string;
    eventId?: string;
    includeMonthlyBreakdown?: boolean;
    includeEventBreakdown?: boolean;
    includePendingPayments?: boolean;
}

export interface UseOrganizerRevenueResult {
    monthlyRevenue: MonthlyRevenue[];
    eventRevenue: EventRevenueBreakdown[];
    revenueStatistics: RevenueStatistics | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
    generateCustomReport: (
        request: OrganizerRevenueReportRequest
    ) => Promise<void>;
}

export const useOrganizerRevenue = (
    filters?: RevenueFilters
): UseOrganizerRevenueResult => {
    const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
    const [eventRevenue, setEventRevenue] = useState<EventRevenueBreakdown[]>(
        []
    );
    const [revenueStatistics, setRevenueStatistics] =
        useState<RevenueStatistics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMonthlyRevenue = useCallback(async () => {
        try {
            const response =
                await OrganizerService.getApiOrganizerReportsMonthlyRevenue({
                    startDate: filters?.startDate,
                    endDate: filters?.endDate,
                });

            if (response.success && response.data) {
                setMonthlyRevenue(response.data);
            } else {
                setError(
                    response.message || 'Failed to fetch monthly revenue data'
                );
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch monthly revenue data'
            );
        }
    }, [filters?.startDate, filters?.endDate]);

    const fetchEventRevenue = useCallback(async () => {
        try {
            const response =
                await OrganizerService.getApiOrganizerReportsEventRevenue({
                    startDate: filters?.startDate,
                    endDate: filters?.endDate,
                });

            if (response.success && response.data) {
                setEventRevenue(response.data);
            } else {
                setError(
                    response.message || 'Failed to fetch event revenue data'
                );
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch event revenue data'
            );
        }
    }, [filters?.startDate, filters?.endDate]);

    const generateCustomReport = useCallback(
        async (request: OrganizerRevenueReportRequest) => {
            setLoading(true);
            setError(null);

            try {
                const response =
                    await OrganizerService.postApiOrganizerRevenueReport({
                        requestBody: request,
                    });

                if (response.success && response.data) {
                    setRevenueStatistics(response.data);

                    // Update monthly and event data if included in the report
                    if (response.data.monthlyBreakdown) {
                        setMonthlyRevenue(response.data.monthlyBreakdown);
                    }
                    if (response.data.eventBreakdown) {
                        setEventRevenue(response.data.eventBreakdown);
                    }
                } else {
                    setError(
                        response.message || 'Failed to generate revenue report'
                    );
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to generate revenue report'
                );
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await Promise.all([fetchMonthlyRevenue(), fetchEventRevenue()]);
        } catch (err) {
            // Errors are handled in individual fetch functions
        } finally {
            setLoading(false);
        }
    }, [fetchMonthlyRevenue, fetchEventRevenue]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return {
        monthlyRevenue,
        eventRevenue,
        revenueStatistics,
        loading,
        error,
        refetch,
        generateCustomReport,
    };
};
