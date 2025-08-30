/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BulkEventActionRequest } from '../models/BulkEventActionRequest';
import type { EventDuplicationRequest } from '../models/EventDuplicationRequest';
import type { OrganizerRevenueReportRequest } from '../models/OrganizerRevenueReportRequest';
import type { StandardResponseOfAttendeeAnalyticsView } from '../models/StandardResponseOfAttendeeAnalyticsView';
import type { StandardResponseOfboolean } from '../models/StandardResponseOfboolean';
import type { StandardResponseOfEventPerformanceView } from '../models/StandardResponseOfEventPerformanceView';
import type { StandardResponseOfEventStatistics } from '../models/StandardResponseOfEventStatistics';
import type { StandardResponseOfEventView } from '../models/StandardResponseOfEventView';
import type { StandardResponseOfListOfEventRevenueBreakdown } from '../models/StandardResponseOfListOfEventRevenueBreakdown';
import type { StandardResponseOfListOfEventSummaryView } from '../models/StandardResponseOfListOfEventSummaryView';
import type { StandardResponseOfListOfMonthlyRevenue } from '../models/StandardResponseOfListOfMonthlyRevenue';
import type { StandardResponseOfOrganizerDashboardView } from '../models/StandardResponseOfOrganizerDashboardView';
import type { StandardResponseOfPagedCollectionOfAttendeeView } from '../models/StandardResponseOfPagedCollectionOfAttendeeView';
import type { StandardResponseOfPagedCollectionOfEventRegistrationSummary } from '../models/StandardResponseOfPagedCollectionOfEventRegistrationSummary';
import type { StandardResponseOfPagedCollectionOfEventRegistrationView } from '../models/StandardResponseOfPagedCollectionOfEventRegistrationView';
import type { StandardResponseOfPagedCollectionOfEventSummaryView } from '../models/StandardResponseOfPagedCollectionOfEventSummaryView';
import type { StandardResponseOfRevenueStatistics } from '../models/StandardResponseOfRevenueStatistics';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OrganizerService {
    /**
     * @returns StandardResponseOfOrganizerDashboardView OK
     * @throws ApiError
     */
    public static getApiOrganizerDashboard(): CancelablePromise<StandardResponseOfOrganizerDashboardView> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Organizer/dashboard',
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfEventStatistics OK
     * @throws ApiError
     */
    public static getApiOrganizerStatistics(): CancelablePromise<StandardResponseOfEventStatistics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Organizer/statistics',
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfRevenueStatistics OK
     * @throws ApiError
     */
    public static postApiOrganizerRevenueReport({
        requestBody,
    }: {
        requestBody: OrganizerRevenueReportRequest,
    }): CancelablePromise<StandardResponseOfRevenueStatistics> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Organizer/revenue-report',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfPagedCollectionOfEventSummaryView OK
     * @throws ApiError
     */
    public static getApiOrganizerEvents({
        pageNumber,
        pageSize,
        sortBy,
        sortOrder,
        searchTerm,
        status,
        category,
        startDate,
        endDate,
        isVirtual,
        hasRegistrations,
        minRevenue,
        maxRevenue,
        minRegistrations,
        maxRegistrations,
    }: {
        pageNumber?: number,
        pageSize?: number,
        sortBy?: string,
        sortOrder?: string,
        searchTerm?: string,
        status?: string,
        category?: string,
        startDate?: string,
        endDate?: string,
        isVirtual?: boolean,
        hasRegistrations?: boolean,
        minRevenue?: number,
        maxRevenue?: number,
        minRegistrations?: number,
        maxRegistrations?: number,
    }): CancelablePromise<StandardResponseOfPagedCollectionOfEventSummaryView> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Organizer/events',
            query: {
                'PageNumber': pageNumber,
                'PageSize': pageSize,
                'SortBy': sortBy,
                'SortOrder': sortOrder,
                'SearchTerm': searchTerm,
                'Status': status,
                'Category': category,
                'StartDate': startDate,
                'EndDate': endDate,
                'IsVirtual': isVirtual,
                'HasRegistrations': hasRegistrations,
                'MinRevenue': minRevenue,
                'MaxRevenue': maxRevenue,
                'MinRegistrations': minRegistrations,
                'MaxRegistrations': maxRegistrations,
            },
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfEventView Created
     * @throws ApiError
     */
    public static postApiOrganizerEventsDuplicate({
        requestBody,
    }: {
        requestBody: EventDuplicationRequest,
    }): CancelablePromise<StandardResponseOfEventView> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Organizer/events/duplicate',
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
     * @returns StandardResponseOfboolean OK
     * @throws ApiError
     */
    public static postApiOrganizerEventsBulkAction({
        requestBody,
    }: {
        requestBody: BulkEventActionRequest,
    }): CancelablePromise<StandardResponseOfboolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Organizer/events/bulk-action',
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
     * @returns StandardResponseOfEventPerformanceView OK
     * @throws ApiError
     */
    public static getApiOrganizerEventsPerformance({
        eventId,
    }: {
        eventId: string,
    }): CancelablePromise<StandardResponseOfEventPerformanceView> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Organizer/events/{eventId}/performance',
            path: {
                'eventId': eventId,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfListOfEventSummaryView OK
     * @throws ApiError
     */
    public static getApiOrganizerEventsTopPerforming({
        count = 10,
        startDate = null,
        endDate = null,
    }: {
        count?: number,
        startDate?: string,
        endDate?: string,
    }): CancelablePromise<StandardResponseOfListOfEventSummaryView> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Organizer/events/top-performing',
            query: {
                'count': count,
                'startDate': startDate,
                'endDate': endDate,
            },
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfPagedCollectionOfEventRegistrationSummary OK
     * @throws ApiError
     */
    public static getApiOrganizerRegistrations({
        pageNumber,
        pageSize,
        sortBy,
        sortOrder,
        searchTerm,
        eventId,
        paymentStatus,
        isFinanced,
        registrationStartDate,
        registrationEndDate,
        minAmount,
        maxAmount,
    }: {
        pageNumber?: number,
        pageSize?: number,
        sortBy?: string,
        sortOrder?: string,
        searchTerm?: string,
        eventId?: string,
        paymentStatus?: string,
        isFinanced?: boolean,
        registrationStartDate?: string,
        registrationEndDate?: string,
        minAmount?: number,
        maxAmount?: number,
    }): CancelablePromise<StandardResponseOfPagedCollectionOfEventRegistrationSummary> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Organizer/registrations',
            query: {
                'PageNumber': pageNumber,
                'PageSize': pageSize,
                'SortBy': sortBy,
                'SortOrder': sortOrder,
                'SearchTerm': searchTerm,
                'EventId': eventId,
                'PaymentStatus': paymentStatus,
                'IsFinanced': isFinanced,
                'RegistrationStartDate': registrationStartDate,
                'RegistrationEndDate': registrationEndDate,
                'MinAmount': minAmount,
                'MaxAmount': maxAmount,
            },
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfPagedCollectionOfEventRegistrationView OK
     * @throws ApiError
     */
    public static getApiOrganizerEventsRegistrations({
        eventId,
        pageNumber,
        pageSize,
        sortBy,
        sortOrder,
    }: {
        eventId: string,
        pageNumber?: number,
        pageSize?: number,
        sortBy?: string,
        sortOrder?: string,
    }): CancelablePromise<StandardResponseOfPagedCollectionOfEventRegistrationView> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Organizer/events/{eventId}/registrations',
            path: {
                'eventId': eventId,
            },
            query: {
                'PageNumber': pageNumber,
                'PageSize': pageSize,
                'SortBy': sortBy,
                'SortOrder': sortOrder,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfListOfMonthlyRevenue OK
     * @throws ApiError
     */
    public static getApiOrganizerReportsMonthlyRevenue({
        startDate = null,
        endDate = null,
    }: {
        startDate?: string,
        endDate?: string,
    }): CancelablePromise<StandardResponseOfListOfMonthlyRevenue> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Organizer/reports/monthly-revenue',
            query: {
                'startDate': startDate,
                'endDate': endDate,
            },
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfListOfEventRevenueBreakdown OK
     * @throws ApiError
     */
    public static getApiOrganizerReportsEventRevenue({
        startDate = null,
        endDate = null,
    }: {
        startDate?: string,
        endDate?: string,
    }): CancelablePromise<StandardResponseOfListOfEventRevenueBreakdown> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Organizer/reports/event-revenue',
            query: {
                'startDate': startDate,
                'endDate': endDate,
            },
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfPagedCollectionOfAttendeeView OK
     * @throws ApiError
     */
    public static getApiOrganizerAttendees({
        pageNumber,
        pageSize,
        sortBy,
        sortOrder,
        searchTerm = null,
    }: {
        pageNumber?: number,
        pageSize?: number,
        sortBy?: string,
        sortOrder?: string,
        searchTerm?: string,
    }): CancelablePromise<StandardResponseOfPagedCollectionOfAttendeeView> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Organizer/attendees',
            query: {
                'PageNumber': pageNumber,
                'PageSize': pageSize,
                'SortBy': sortBy,
                'SortOrder': sortOrder,
                'searchTerm': searchTerm,
            },
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @returns StandardResponseOfAttendeeAnalyticsView OK
     * @throws ApiError
     */
    public static getApiOrganizerAttendeesAnalytics(): CancelablePromise<StandardResponseOfAttendeeAnalyticsView> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Organizer/attendees/analytics',
            errors: {
                401: `Unauthorized`,
                500: `Internal Server Error`,
            },
        });
    }
}
