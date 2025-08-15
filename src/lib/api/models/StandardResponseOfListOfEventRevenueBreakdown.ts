/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventRevenueBreakdown } from './EventRevenueBreakdown';
import type { HttpStatusCode } from './HttpStatusCode';
export type StandardResponseOfListOfEventRevenueBreakdown = {
    success?: boolean;
    message?: string | null;
    data?: Array<EventRevenueBreakdown> | null;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};
