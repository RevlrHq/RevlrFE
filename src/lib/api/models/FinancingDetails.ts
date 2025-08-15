/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { PaymentFrequency } from './PaymentFrequency';
export type FinancingDetails = {
    downPayment?: number;
    numberOfInstallments?: number;
    paymentFrequency?: PaymentFrequency;
    firstPaymentDueDate?: string | null;
    notes?: string | null;
};
