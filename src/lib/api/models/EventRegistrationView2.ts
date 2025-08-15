/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { FinancingApplicationSummary } from './FinancingApplicationSummary';
export type EventRegistrationView2 = {
    id?: string;
    eventId?: string;
    eventTitle?: string;
    eventTicketId?: string;
    ticketName?: string;
    attendeeId?: string;
    attendeeFullName?: string;
    attendeeEmail?: string;
    attendeePhoneNumber?: string | null;
    registrationNumber?: string;
    registrationDate?: string;
    paymentStatus?: string;
    amountPaid?: number;
    dateCreated?: string;
    dateUpdated?: string | null;
    paymentAccessCode?: string | null;
    paymentReference?: string | null;
    isFinanced?: boolean;
    financingApplicationId?: string | null;
    financingDetails?: FinancingApplicationSummary;
    isNewUserRegistration?: boolean;
    verificationEmailSent?: boolean;
};
