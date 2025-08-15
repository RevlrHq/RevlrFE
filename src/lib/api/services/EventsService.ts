/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventCreationRequest } from '../models/EventCreationRequest';
import type { EventRegistrationRequest } from '../models/EventRegistrationRequest';
import type { EventRegistrationWithFinancingRequest } from '../models/EventRegistrationWithFinancingRequest';
import type { EventTicketCreationRequest } from '../models/EventTicketCreationRequest';
import type { StandardResponseOfboolean } from '../models/StandardResponseOfboolean';
import type { StandardResponseOfEventCategoriesResponse } from '../models/StandardResponseOfEventCategoriesResponse';
import type { StandardResponseOfEventRegistrationView } from '../models/StandardResponseOfEventRegistrationView';
import type { StandardResponseOfEventView } from '../models/StandardResponseOfEventView';
import type { StandardResponseOfFinancingAuthorizationView } from '../models/StandardResponseOfFinancingAuthorizationView';
import type { StandardResponseOfFinancingPaymentView } from '../models/StandardResponseOfFinancingPaymentView';
import type { StandardResponseOfPagedCollectionOfEventRegistrationView } from '../models/StandardResponseOfPagedCollectionOfEventRegistrationView';
import type { StandardResponseOfPagedCollectionOfEventView } from '../models/StandardResponseOfPagedCollectionOfEventView';
import type { StandardResponseOfTicketFinancingEligibilityView } from '../models/StandardResponseOfTicketFinancingEligibilityView';
import type { TicketFinancingEligibilityRequest } from '../models/TicketFinancingEligibilityRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EventsService {
    /**
     * @returns StandardResponseOfEventView OK
     * @throws ApiError
     */
    public static postApiEvents({
        requestBody,
    }: {
        requestBody: EventCreationRequest;
    }): CancelablePromise<StandardResponseOfEventView> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Events',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfPagedCollectionOfEventView OK
     * @throws ApiError
     */
    public static getApiEvents({
        pageNumber,
        pageSize,
        sortBy,
        sortOrder,
        searchTerm,
        category,
        categories,
        categoryGroup,
        categorySearch,
        startDate,
        endDate,
        locationType,
        minPrice,
        maxPrice,
        includeTickets,
        status,
        organizer,
        daysFromNow,
        city,
        includePastEvents,
    }: {
        pageNumber?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: string;
        searchTerm?: string;
        category?: string;
        categories?: Array<string>;
        categoryGroup?: string;
        categorySearch?: string;
        startDate?: string;
        endDate?: string;
        locationType?: string;
        minPrice?: number;
        maxPrice?: number;
        includeTickets?: boolean;
        status?: string;
        organizer?: string;
        daysFromNow?: number;
        city?: string;
        includePastEvents?: boolean;
    }): CancelablePromise<StandardResponseOfPagedCollectionOfEventView> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Events',
            query: {
                PageNumber: pageNumber,
                PageSize: pageSize,
                SortBy: sortBy,
                SortOrder: sortOrder,
                SearchTerm: searchTerm,
                Category: category,
                Categories: categories,
                CategoryGroup: categoryGroup,
                CategorySearch: categorySearch,
                StartDate: startDate,
                EndDate: endDate,
                LocationType: locationType,
                MinPrice: minPrice,
                MaxPrice: maxPrice,
                IncludeTickets: includeTickets,
                Status: status,
                Organizer: organizer,
                DaysFromNow: daysFromNow,
                City: city,
                IncludePastEvents: includePastEvents,
            },
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfEventView OK
     * @throws ApiError
     */
    public static postApiEventsDraft({
        requestBody,
    }: {
        requestBody: EventCreationRequest;
    }): CancelablePromise<StandardResponseOfEventView> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Events/draft',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfEventView OK
     * @throws ApiError
     */
    public static putApiEvents({
        eventId,
        requestBody,
    }: {
        eventId: string;
        requestBody: EventCreationRequest;
    }): CancelablePromise<StandardResponseOfEventView> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/Events/{eventId}',
            path: {
                eventId: eventId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfEventView OK
     * @throws ApiError
     */
    public static getApiEvents1({
        eventId,
    }: {
        eventId: string;
    }): CancelablePromise<StandardResponseOfEventView> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Events/{eventId}',
            path: {
                eventId: eventId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfboolean OK
     * @throws ApiError
     */
    public static deleteApiEvents({
        eventId,
    }: {
        eventId: string;
    }): CancelablePromise<StandardResponseOfboolean> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/Events/{eventId}',
            path: {
                eventId: eventId,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfEventView OK
     * @throws ApiError
     */
    public static postApiEventsTickets({
        eventId,
        requestBody,
    }: {
        eventId: string;
        requestBody: Array<EventTicketCreationRequest>;
    }): CancelablePromise<StandardResponseOfEventView> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Events/{eventId}/tickets',
            path: {
                eventId: eventId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfEventView OK
     * @throws ApiError
     */
    public static postApiEventsPublish({
        eventId,
    }: {
        eventId: string;
    }): CancelablePromise<StandardResponseOfEventView> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Events/{eventId}/publish',
            path: {
                eventId: eventId,
            },
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfEventCategoriesResponse OK
     * @throws ApiError
     */
    public static getApiEventsCategories(): CancelablePromise<StandardResponseOfEventCategoriesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Events/categories',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfEventRegistrationView Created
     * @throws ApiError
     */
    public static postApiEventsRegister({
        requestBody,
    }: {
        requestBody: EventRegistrationRequest;
    }): CancelablePromise<StandardResponseOfEventRegistrationView> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Events/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfTicketFinancingEligibilityView OK
     * @throws ApiError
     */
    public static postApiEventsCheckFinancingEligibility({
        requestBody,
    }: {
        requestBody: TicketFinancingEligibilityRequest;
    }): CancelablePromise<StandardResponseOfTicketFinancingEligibilityView> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Events/check-financing-eligibility',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfEventRegistrationView Created
     * @throws ApiError
     */
    public static postApiEventsRegisterWithFinancing({
        requestBody,
    }: {
        requestBody: EventRegistrationWithFinancingRequest;
    }): CancelablePromise<StandardResponseOfEventRegistrationView> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Events/register-with-financing',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfEventRegistrationView OK
     * @throws ApiError
     */
    public static getApiEventsRegistrations({
        registrationId,
    }: {
        registrationId: string;
    }): CancelablePromise<StandardResponseOfEventRegistrationView> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Events/registrations/{registrationId}',
            path: {
                registrationId: registrationId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfboolean OK
     * @throws ApiError
     */
    public static deleteApiEventsRegistrations({
        registrationId,
    }: {
        registrationId: string;
    }): CancelablePromise<StandardResponseOfboolean> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/Events/registrations/{registrationId}',
            path: {
                registrationId: registrationId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfPagedCollectionOfEventRegistrationView OK
     * @throws ApiError
     */
    public static getApiEventsRegistrations1({
        eventId,
        pageNumber,
        pageSize,
        sortBy,
        sortOrder,
    }: {
        eventId: string;
        pageNumber?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: string;
    }): CancelablePromise<StandardResponseOfPagedCollectionOfEventRegistrationView> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Events/{eventId}/registrations',
            path: {
                eventId: eventId,
            },
            query: {
                PageNumber: pageNumber,
                PageSize: pageSize,
                SortBy: sortBy,
                SortOrder: sortOrder,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfPagedCollectionOfEventRegistrationView OK
     * @throws ApiError
     */
    public static getApiEventsRegistrationsUser({
        email,
        pageNumber,
        pageSize,
        sortBy,
        sortOrder,
    }: {
        email?: string;
        pageNumber?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: string;
    }): CancelablePromise<StandardResponseOfPagedCollectionOfEventRegistrationView> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Events/registrations/user',
            query: {
                email: email,
                PageNumber: pageNumber,
                PageSize: pageSize,
                SortBy: sortBy,
                SortOrder: sortOrder,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfEventRegistrationView OK
     * @throws ApiError
     */
    public static putApiEventsRegistrationsPayment({
        registrationId,
        paystackReference,
    }: {
        registrationId: string;
        paystackReference?: string;
    }): CancelablePromise<StandardResponseOfEventRegistrationView> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/Events/registrations/{registrationId}/payment',
            path: {
                registrationId: registrationId,
            },
            query: {
                paystackReference: paystackReference,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfFinancingPaymentView OK
     * @throws ApiError
     */
    public static postApiEventsFinancingProcessPayment({
        financingApplicationId,
        paymentId,
    }: {
        financingApplicationId?: string;
        paymentId?: string;
    }): CancelablePromise<StandardResponseOfFinancingPaymentView> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Events/financing/process-payment',
            query: {
                financingApplicationId: financingApplicationId,
                paymentId: paymentId,
            },
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfFinancingAuthorizationView OK
     * @throws ApiError
     */
    public static postApiEventsPaystackWebhook({
        requestBody,
        eventType,
    }: {
        requestBody: string;
        eventType?: string;
    }): CancelablePromise<StandardResponseOfFinancingAuthorizationView> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Events/paystack-webhook',
            query: {
                eventType: eventType,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
}
