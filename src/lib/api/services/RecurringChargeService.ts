/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RecurringChargeRequest } from '../models/RecurringChargeRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RecurringChargeService {
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiRecurringChargeCharge({
        requestBody,
    }: {
        requestBody: RecurringChargeRequest;
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/RecurringCharge/charge',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiRecurringChargeAuthorizations({
        email,
        userId,
    }: {
        email: string;
        userId?: string;
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/RecurringCharge/authorizations/{email}',
            path: {
                email: email,
            },
            query: {
                UserId: userId,
            },
        });
    }
}
