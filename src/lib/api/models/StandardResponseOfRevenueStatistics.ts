/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HttpStatusCode } from './HttpStatusCode';
import type { RevenueStatistics2 } from './RevenueStatistics2';
export type StandardResponseOfRevenueStatistics = {
    success?: boolean;
    message?: string | null;
    data?: RevenueStatistics2;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};
