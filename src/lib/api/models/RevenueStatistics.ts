/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventRevenueBreakdown } from './EventRevenueBreakdown';
import type { MonthlyRevenue } from './MonthlyRevenue';
export type RevenueStatistics = {
    totalRevenue?: number;
    thisMonthRevenue?: number;
    lastMonthRevenue?: number;
    pendingRevenue?: number;
    refundedRevenue?: number;
    monthlyBreakdown?: Array<MonthlyRevenue>;
    eventBreakdown?: Array<EventRevenueBreakdown>;
};

