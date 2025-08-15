/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TestService {
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiTestTestEndpoint(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Test/test-endpoint',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiTestCorsTest(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Test/cors-test',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static optionsApiTestCorsTest(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'OPTIONS',
            url: '/api/Test/cors-test',
        });
    }
}
