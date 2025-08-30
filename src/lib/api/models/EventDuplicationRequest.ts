/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventStatus } from './EventStatus';
export type EventDuplicationRequest = {
    sourceEventId?: string;
    newTitle?: string;
    newStartDate?: string;
    newEndDate?: string;
    copyTickets?: boolean;
    copyImages?: boolean;
    initialStatus?: EventStatus;
};

