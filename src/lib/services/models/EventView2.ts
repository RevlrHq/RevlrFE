/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventSocialLinks } from './EventSocialLinks';
import type { EventTicketView } from './EventTicketView';
import type { LocationType } from './LocationType';
export type EventView2 = {
    id?: string;
    title?: string;
    description?: string;
    category?: string;
    categoryDescription?: string;
    images?: Array<string>;
    bannerImageUrl?: string | null;
    organizerLogo?: string;
    organizerName?: string;
    organizerWebsite?: string | null;
    socials?: EventSocialLinks;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    timezone?: string;
    locationType?: LocationType;
    isVirtual?: boolean;
    venue?: string | null;
    address?: string | null;
    googleMapsLink?: string | null;
    virtualMeetingUrl?: string | null;
    maxAttendees?: number | null;
    status?: string;
    dateCreated?: string;
    dateUpdated?: string | null;
    tickets?: Array<EventTicketView>;
};
