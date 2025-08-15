/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { AttendeeInfo } from './AttendeeInfo';
import type { NewUserRegistrationInfo } from './NewUserRegistrationInfo';
export type EventRegistrationRequest = {
    eventId: string;
    eventTicketId: string;
    attendee: AttendeeInfo;
    paystackReference?: string | null;
    isNewUser?: boolean;
    newUserInfo?: NewUserRegistrationInfo;
};
