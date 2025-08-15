/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TicketSalesPeriod } from './TicketSalesPeriod';
export type EventTicketCreationRequest = {
    selected?: boolean;
    type: string;
    name: string;
    quantity: number;
    purchaseLimit: number;
    salesPeriod?: TicketSalesPeriod;
    price?: number | null;
    description?: string | null;
    refundPolicy?: string | null;
    feeOption?: string | null;
};
