/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HttpStatusCode } from './HttpStatusCode';
import type { OrganizerDashboardView } from './OrganizerDashboardView';
export type StandardResponseOfOrganizerDashboardView = {
    success?: boolean;
    message?: string | null;
    data?: OrganizerDashboardView;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};
