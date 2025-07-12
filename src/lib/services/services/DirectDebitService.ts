/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChargeAuthorizationRequest } from '../models/ChargeAuthorizationRequest';
import type { InitializeDirectDebitRequest } from '../models/InitializeDirectDebitRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DirectDebitService {
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiDirectDebitInitialize({
        requestBody,
    }: {
        requestBody: InitializeDirectDebitRequest;
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/DirectDebit/initialize',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiDirectDebitVerify({
        reference,
    }: {
        reference: string;
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/DirectDebit/verify/{reference}',
            path: {
                reference: reference,
            },
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiDirectDebitCharge({
        requestBody,
    }: {
        requestBody: ChargeAuthorizationRequest;
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/DirectDebit/charge',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
