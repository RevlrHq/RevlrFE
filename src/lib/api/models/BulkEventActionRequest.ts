/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { BulkEventAction } from './BulkEventAction';
import type { NullableOfEventStatus } from './NullableOfEventStatus';
export type BulkEventActionRequest = {
    eventIds?: Array<string>;
    action?: BulkEventAction;
    newStatus?: NullableOfEventStatus;
    reason?: string | null;
};
