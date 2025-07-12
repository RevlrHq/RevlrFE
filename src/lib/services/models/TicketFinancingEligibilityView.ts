/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FinancingPlanOption } from './FinancingPlanOption';
import type { PaymentFrequency } from './PaymentFrequency';
export type TicketFinancingEligibilityView = {
    eventId?: string;
    eventTitle?: string;
    eventStartDate?: string;
    eventTicketId?: string;
    ticketName?: string;
    ticketPrice?: number;
    isEligibleForFinancing?: boolean;
    ineligibilityReason?: string | null;
    minimumDownPayment?: number;
    maximumNumberOfInstallments?: number;
    availablePaymentFrequencies?: Array<PaymentFrequency>;
    samplePaymentPlans?: Array<FinancingPlanOption>;
};
