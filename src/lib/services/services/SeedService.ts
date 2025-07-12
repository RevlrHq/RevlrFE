/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StandardResponseOfObject } from '../models/StandardResponseOfObject';
import type { StandardResponseOfstring } from '../models/StandardResponseOfstring';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SeedService {
    /**
     * @returns StandardResponseOfstring OK
     * @throws ApiError
     */
    public static postApiSeedSeedData(): CancelablePromise<StandardResponseOfstring> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Seed/seed-data',
        });
    }
    /**
     * @returns StandardResponseOfObject OK
     * @throws ApiError
     */
    public static getApiSeedSeedInfo(): CancelablePromise<StandardResponseOfObject> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Seed/seed-info',
        });
    }
}
