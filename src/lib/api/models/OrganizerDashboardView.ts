/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventRegistrationSummary } from './EventRegistrationSummary';
import type { EventStatistics } from './EventStatistics';
import type { EventSummaryView } from './EventSummaryView';
import type { RevenueStatistics } from './RevenueStatistics';
export type OrganizerDashboardView = {
    organizerId?: string;
    organizerName?: string;
    organizerEmail?: string | null;
    statistics?: EventStatistics;
    recentEvents?: Array<EventSummaryView>;
    upcomingEvents?: Array<any>;
    recentRegistrations?: Array<EventRegistrationSummary>;
    revenue?: RevenueStatistics;
};

