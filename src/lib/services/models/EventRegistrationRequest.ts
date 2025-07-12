/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AttendeeInfo } from './AttendeeInfo';
export type EventRegistrationRequest = {
    eventId: string;
    eventTicketId: string;
    attendee: AttendeeInfo;
    paystackReference?: string | null;
};
