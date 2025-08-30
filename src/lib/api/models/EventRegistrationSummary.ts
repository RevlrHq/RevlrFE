/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaymentStatus } from './PaymentStatus';
export type EventRegistrationSummary = {
    registrationId?: string;
    eventId?: string;
    eventTitle?: string;
    attendeeFirstName?: string;
    attendeeLastName?: string;
    attendeeEmail?: string;
    ticketName?: string;
    amountPaid?: number;
    paymentStatus?: PaymentStatus;
    registrationDate?: string;
    isFinanced?: boolean;
};

