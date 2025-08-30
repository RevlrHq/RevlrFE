/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DateRange } from './DateRange';
import type { EventSocialLinks2 } from './EventSocialLinks2';
import type { LocationDetails } from './LocationDetails';
import type { TimeRange } from './TimeRange';
export type EventCreationRequest = {
    images?: Array<string>;
    organizerLogo?: string;
    organizerName?: string;
    organizerWebsite?: string | null;
    socials?: EventSocialLinks2;
    eventName: string;
    eventDescription: string;
    eventCategory: string;
    dateRange?: DateRange;
    timeRange?: TimeRange;
    timezone?: string;
    locationType?: string;
    locationDetails?: LocationDetails;
    isDraft?: boolean;
};

