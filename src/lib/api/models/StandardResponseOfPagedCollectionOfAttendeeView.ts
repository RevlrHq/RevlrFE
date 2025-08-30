/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { HttpStatusCode } from './HttpStatusCode';
import type { PagedCollectionOfAttendeeView } from './PagedCollectionOfAttendeeView';
export type StandardResponseOfPagedCollectionOfAttendeeView = {
    success?: boolean;
    message?: string | null;
    data?: PagedCollectionOfAttendeeView;
    statusCode?: HttpStatusCode;
    errors?: unknown;
    timestamp?: string;
};
