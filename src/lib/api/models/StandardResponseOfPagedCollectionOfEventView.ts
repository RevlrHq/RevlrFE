/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HttpStatusCode } from './HttpStatusCode';
import type { PagedCollectionOfEventView } from './PagedCollectionOfEventView';
export type StandardResponseOfPagedCollectionOfEventView = {
    success?: boolean;
    message?: string | null;
    data?: PagedCollectionOfEventView;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};

