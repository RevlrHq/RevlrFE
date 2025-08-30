/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventRegistrationView } from './EventRegistrationView';
import type { HttpStatusCode } from './HttpStatusCode';
export type StandardResponseOfEventRegistrationView = {
    success?: boolean;
    message?: string | null;
    data?: EventRegistrationView;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};

