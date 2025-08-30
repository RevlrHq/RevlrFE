/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HttpStatusCode } from './HttpStatusCode';
import type { PagedCollectionOfEventRegistrationSummary } from './PagedCollectionOfEventRegistrationSummary';
export type StandardResponseOfPagedCollectionOfEventRegistrationSummary = {
    success?: boolean;
    message?: string | null;
    data?: PagedCollectionOfEventRegistrationSummary;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};

