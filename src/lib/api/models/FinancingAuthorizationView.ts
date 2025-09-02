/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
export type FinancingAuthorizationView = {
    id?: string;
    dateCreated?: string;
    dateUpdated?: string | null;
    financingApplicationId?: string;
    authorizationCode?: string;
    channel?: string;
    cardType?: string | null;
    last4?: string | null;
    expMonth?: string | null;
    expYear?: string | null;
    bank?: string | null;
    accountName?: string | null;
    countryCode?: string | null;
    reusable?: boolean;
    active?: boolean;
    lastUsedAt?: string | null;
    usageCount?: number;
    maskedDetails?: string | null;
};

