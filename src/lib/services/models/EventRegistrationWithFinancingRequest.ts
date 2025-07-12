/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AttendeeInfo } from './AttendeeInfo';
import type { FinancingDetails } from './FinancingDetails';
export type EventRegistrationWithFinancingRequest = {
    eventId: string;
    eventTicketId: string;
    attendee: AttendeeInfo;
    paystackReference?: string | null;
    useFinancing?: boolean;
    financingDetails?: FinancingDetails;
};
