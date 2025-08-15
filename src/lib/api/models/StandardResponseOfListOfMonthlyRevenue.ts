/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HttpStatusCode } from './HttpStatusCode';
import type { MonthlyRevenue } from './MonthlyRevenue';
export type StandardResponseOfListOfMonthlyRevenue = {
    success?: boolean;
    message?: string | null;
    data?: Array<MonthlyRevenue> | null;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};
