/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AttendeeAnalyticsView } from './AttendeeAnalyticsView';
import type { HttpStatusCode } from './HttpStatusCode';
export type StandardResponseOfAttendeeAnalyticsView = {
    success?: boolean;
    message?: string | null;
    data?: AttendeeAnalyticsView;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};
