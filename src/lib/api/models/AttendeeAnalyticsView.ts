/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AttendeeSegment } from './AttendeeSegment';
import type { TopAttendee } from './TopAttendee';
export type AttendeeAnalyticsView = {
    totalUniqueAttendees?: number;
    newAttendeesThisMonth?: number;
    returningAttendees?: number;
    averageSpendPerAttendee?: number;
    attendeeSegments?: Array<AttendeeSegment>;
    topAttendees?: Array<TopAttendee>;
};

