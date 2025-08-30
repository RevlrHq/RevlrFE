/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FinancingStatus } from './FinancingStatus';
import type { PaymentFrequency } from './PaymentFrequency';
export type FinancingApplicationSummary = {
    id?: string;
    dateCreated?: string;
    eventId?: string;
    eventTitle?: string;
    eventStartDate?: string;
    eventTicketId?: string;
    ticketName?: string;
    attendeeId?: string;
    attendeeFullName?: string;
    attendeeEmail?: string;
    amountFinanced?: number;
    amountPaid?: number;
    outstandingBalance?: number;
    downPayment?: number;
    status?: FinancingStatus;
    numberOfInstallments?: number;
    paymentFrequency?: PaymentFrequency;
    installmentAmount?: number;
    firstPaymentDueDate?: string;
    lastPaymentDueDate?: string;
    totalPayments?: number;
    completedPayments?: number;
    pendingPayments?: number;
    latePayments?: number;
    nextPaymentDueDate?: string | null;
    paymentProgressPercentage?: number;
};

