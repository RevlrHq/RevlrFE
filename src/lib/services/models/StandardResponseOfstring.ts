/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HttpStatusCode } from './HttpStatusCode';
export type StandardResponseOfstring = {
    success?: boolean;
    message?: string | null;
    data?: string | null;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};
