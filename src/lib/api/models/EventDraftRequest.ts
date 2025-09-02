/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { DateRange2 } from './DateRange2';
import type { EventSocialLinks2 } from './EventSocialLinks2';
import type { LocationDetails2 } from './LocationDetails2';
import type { TimeRange2 } from './TimeRange2';
export type EventDraftRequest = {
    images?: Array<string> | null;
    organizerLogo?: string | null;
    organizerName?: string | null;
    organizerWebsite?: string | null;
    socials?: EventSocialLinks2;
    eventName: string;
    eventDescription?: string | null;
    eventCategory?: string | null;
    dateRange?: DateRange2;
    timeRange?: TimeRange2;
    timezone?: string | null;
    locationType?: string | null;
    locationDetails?: LocationDetails2;
};

