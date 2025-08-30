/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FinancingAuthorizationView } from './FinancingAuthorizationView';
import type { HttpStatusCode } from './HttpStatusCode';
export type StandardResponseOfFinancingAuthorizationView = {
    success?: boolean;
    message?: string | null;
    data?: FinancingAuthorizationView;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};

