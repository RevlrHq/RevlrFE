/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventCategoriesResponse } from './EventCategoriesResponse';
import type { HttpStatusCode } from './HttpStatusCode';
export type StandardResponseOfEventCategoriesResponse = {
    success?: boolean;
    message?: string | null;
    data?: EventCategoriesResponse;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};
