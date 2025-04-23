/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HttpStatusCode } from './HttpStatusCode';
import type { UserView } from './UserView';
export type StandardResponseOfUserView = {
    success?: boolean;
    message?: string | null;
    data?: UserView;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};
