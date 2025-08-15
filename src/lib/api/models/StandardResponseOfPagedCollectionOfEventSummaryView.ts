/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HttpStatusCode } from './HttpStatusCode';
import type { PagedCollectionOfEventSummaryView } from './PagedCollectionOfEventSummaryView';
export type StandardResponseOfPagedCollectionOfEventSummaryView = {
    success?: boolean;
    message?: string | null;
    data?: PagedCollectionOfEventSummaryView;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};
