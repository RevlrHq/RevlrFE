/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventView } from './EventView';
import type { HttpStatusCode } from './HttpStatusCode';
export type StandardResponseOfEventView = {
    success?: boolean;
    message?: string | null;
    data?: EventView;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};

