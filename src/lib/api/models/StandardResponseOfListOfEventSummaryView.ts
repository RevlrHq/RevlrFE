/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventSummaryView } from './EventSummaryView';
import type { HttpStatusCode } from './HttpStatusCode';
export type StandardResponseOfListOfEventSummaryView = {
    success?: boolean;
    message?: string | null;
    data?: Array<EventSummaryView> | null;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};

