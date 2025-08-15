/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventPerformanceView } from './EventPerformanceView';
import type { HttpStatusCode } from './HttpStatusCode';
export type StandardResponseOfEventPerformanceView = {
    success?: boolean;
    message?: string | null;
    data?: EventPerformanceView;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};
