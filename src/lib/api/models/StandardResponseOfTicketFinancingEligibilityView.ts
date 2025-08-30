/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HttpStatusCode } from './HttpStatusCode';
import type { TicketFinancingEligibilityView } from './TicketFinancingEligibilityView';
export type StandardResponseOfTicketFinancingEligibilityView = {
    success?: boolean;
    message?: string | null;
    data?: TicketFinancingEligibilityView;
    statusCode?: HttpStatusCode;
    errors?: any;
    timestamp?: string;
};

