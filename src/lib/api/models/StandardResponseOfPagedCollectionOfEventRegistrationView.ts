/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HttpStatusCode } from './HttpStatusCode';
import type { PagedCollectionOfEventRegistrationView } from './PagedCollectionOfEventRegistrationView';
export type StandardResponseOfPagedCollectionOfEventRegistrationView = {
    success?: boolean;
    message?: string | null;
    data?: PagedCollectionOfEventRegistrationView;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};

