/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FinancingPaymentView } from './FinancingPaymentView';
import type { HttpStatusCode } from './HttpStatusCode';
export type StandardResponseOfFinancingPaymentView = {
    success?: boolean;
    message?: string | null;
    data?: FinancingPaymentView;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};

