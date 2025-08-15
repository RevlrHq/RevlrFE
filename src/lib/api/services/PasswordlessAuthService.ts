/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { StandardResponseOfstring } from '../models/StandardResponseOfstring';
import type { StandardResponseOfUserView } from '../models/StandardResponseOfUserView';
import type { VerifyAndRegisterUserInput } from '../models/VerifyAndRegisterUserInput';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PasswordlessAuthService {
    /**
     * @returns StandardResponseOfstring OK
     * @throws ApiError
     */
    public static postApiPasswordlessAuthRegister({
        email,
    }: {
        email?: string;
    }): CancelablePromise<StandardResponseOfstring> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/PasswordlessAuth/register',
            query: {
                email: email,
            },
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfUserView OK
     * @throws ApiError
     */
    public static postApiPasswordlessAuthVerify({
        requestBody,
    }: {
        requestBody: VerifyAndRegisterUserInput;
    }): CancelablePromise<StandardResponseOfUserView> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/PasswordlessAuth/verify',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfstring OK
     * @throws ApiError
     */
    public static postApiPasswordlessAuthLoginRequest({
        email,
    }: {
        email?: string;
    }): CancelablePromise<StandardResponseOfstring> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/PasswordlessAuth/login/request',
            query: {
                email: email,
            },
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfUserView OK
     * @throws ApiError
     */
    public static postApiPasswordlessAuthLoginValidate({
        token,
        email,
    }: {
        token?: string;
        email?: string;
    }): CancelablePromise<StandardResponseOfUserView> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/PasswordlessAuth/login/validate',
            query: {
                token: token,
                email: email,
            },
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
}
