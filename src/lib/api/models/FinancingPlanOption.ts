/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { PaymentFrequency } from './PaymentFrequency';
export type FinancingPlanOption = {
    numberOfInstallments?: number;
    paymentFrequency?: PaymentFrequency;
    downPayment?: number;
    installmentAmount?: number;
    description?: string;
};
