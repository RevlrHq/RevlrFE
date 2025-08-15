/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { DailyRegistrationStats } from './DailyRegistrationStats';
import type { TicketPerformance } from './TicketPerformance';
export type EventPerformanceView = {
    eventId?: string;
    eventTitle?: string;
    startDate?: string;
    endDate?: string;
    totalTickets?: number;
    ticketsSold?: number;
    salesRate?: number;
    totalRevenue?: number;
    averageTicketPrice?: number;
    totalRegistrations?: number;
    completedRegistrations?: number;
    pendingRegistrations?: number;
    cancelledRegistrations?: number;
    ticketPerformance?: Array<TicketPerformance>;
    dailyStats?: Array<DailyRegistrationStats>;
};
