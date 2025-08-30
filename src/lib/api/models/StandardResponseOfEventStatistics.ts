/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventStatistics2 } from './EventStatistics2';
import type { HttpStatusCode } from './HttpStatusCode';
export type StandardResponseOfEventStatistics = {
    success?: boolean;
    message?: string | null;
    data?: EventStatistics2;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};

