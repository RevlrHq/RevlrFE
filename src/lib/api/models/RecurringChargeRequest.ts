/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { RecurringChargeMetadata } from './RecurringChargeMetadata';
export type RecurringChargeRequest = {
    authorization_code?: string;
    email?: string;
    amount?: number;
    callback_url?: string | null;
    metadata?: RecurringChargeMetadata;
};

