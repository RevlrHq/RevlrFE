/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { EventCategory } from './EventCategory';
import type { EventStatus } from './EventStatus';
export type EventSummaryView = {
    id?: string;
    title?: string;
    bannerImageUrl?: string | null;
    startDate?: string;
    endDate?: string;
    status?: EventStatus;
    category?: EventCategory;
    categoryDescription?: string;
    isVirtual?: boolean;
    venue?: string | null;
    registrationCount?: number;
    ticketsSold?: number;
    totalTickets?: number;
    revenue?: number;
    dateCreated?: string;
    dateUpdated?: string | null;
};
