/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { AddressInfo } from './AddressInfo';
import type { BankAccountInfo } from './BankAccountInfo';
export type InitializeDirectDebitRequest = {
    email?: string;
    channel?: string;
    callback_url?: string | null;
    account?: BankAccountInfo;
    address?: AddressInfo;
};
