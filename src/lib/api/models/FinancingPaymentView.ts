/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { PaymentStatus } from './PaymentStatus';
export type FinancingPaymentView = {
    id?: string;
    dateCreated?: string;
    dateUpdated?: string | null;
    financingApplicationId?: string;
    amount?: number;
    dueDate?: string;
    paymentDate?: string | null;
    status?: PaymentStatus;
    paymentMethod?: string | null;
    transactionReference?: string | null;
    installmentNumber?: number;
    isLate?: boolean;
    lateFee?: number | null;
    daysLate?: number;
    notes?: string | null;
};
