import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@src/stores/authStore';
import { EventsService, EventView2 } from '../lib/api';
import { DraftBackupService } from '../lib/services/DraftBackupService';
import { VendorAuthUtils } from '../lib/utils/vendorAuth';
import type { EventFilters } from './useEvents';
import type { DraftBackup } from '../types/event-creation';

export interface ExtendedDraftBackup extends DraftBackup {
    id?: string;
}

export interface VendorEvent
    extends Omit<EventView2, 'images' | 'locationType'> {
    isDraft?: boolean;
    draftData?: ExtendedDraftBackup;
    lastModified?: Date;
    images?: Array<string>;
    // Map EventView2 properties to match our naming conventions
    eventName?: string;
    eventDescription?: string;
    eventCategory?: string;
    virtualLink?: string;
    // Override locationType to support both API number and our string types
    locationType?: number | 'in-person' | 'virtual' | 'hybrid';
}

export interface VendorEventFilters extends EventFilters {
    includeDrafts?: boolean;
    status?: 'all' | 'draft' | 'published' | 'active' | 'upcoming' | 'past';
}

export interface UseVendorEventsResult {
    events: VendorEvent[];
    drafts: DraftBackup[];
    loading: boolean;
    error: string | null;
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    fetchEvents: (page?: number, filters?: VendorEventFilters) => Promise<void>;
    refetch: () => Promise<void>;
    deleteDraft: (draftId?: string) => void;
    continueDraft: (draft: DraftBackup) => void;
}

export const useVendorEvents = (
    initialPageSize: number = 8,
    initialFilters?: VendorEventFilters
): UseVendorEventsResult => {
    const { user, token } = useAuthStore();
    const [events, setEvents] = useState<VendorEvent[]>([]);
    const [drafts, setDrafts] = useState<DraftBackup[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageSize] = useState(initialPageSize);
    const [filters, setFilters] = useState<VendorEventFilters>(
        initialFilters || {}
    );

    // Check vendor access
    const hasVendorAccess = VendorAuthUtils.hasVendorAccess(user, token);

    const loadDrafts = useCallback(() => {
        try {
            const localDrafts: DraftBackup[] = [];

            // Load main draft
            const mainDraft = DraftBackupService.loadDraft();
            if (mainDraft) {
                localDrafts.push(mainDraft);
            }

            // Load additional drafts from localStorage (if any)
            const keys = Object.keys(localStorage);
            const draftKeys = keys.filter((key) =>
                key.startsWith('event_draft_')
            );

            draftKeys.forEach((key) => {
                try {
                    const draftData = localStorage.getItem(key);
                    if (draftData) {
                        const draft = JSON.parse(draftData);
                        if (draft && draft.eventData && draft.timestamp) {
                            localDrafts.push({
                                ...draft,
                                id: key.replace('event_draft_', ''),
                            } as ExtendedDraftBackup);
                        }
                    }
                } catch (err) {
                    console.warn(`Failed to load draft ${key}:`, err);
                }
            });

            // Sort drafts by timestamp (newest first)
            localDrafts.sort((a, b) => b.timestamp - a.timestamp);

            setDrafts(localDrafts);
            return localDrafts;
        } catch (err) {
            console.warn('Failed to load drafts:', err);
            return [];
        }
    }, []);

    const fetchEvents = useCallback(
        async (page: number = 1, newFilters?: VendorEventFilters) => {
            if (!hasVendorAccess) {
                setError('Vendor access required to view events');
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const currentFilters = newFilters || filters;
                const loadedDrafts = loadDrafts();

                // If only showing drafts, return drafts only
                if (currentFilters.status === 'draft') {
                    const filteredDrafts = loadedDrafts.filter((draft) => {
                        if (currentFilters.SearchTerm) {
                            return draft.eventData.eventName
                                ?.toLowerCase()
                                .includes(
                                    currentFilters.SearchTerm.toLowerCase()
                                );
                        }
                        return true;
                    });

                    // Convert drafts to VendorEvent format
                    const draftEvents: VendorEvent[] = filteredDrafts.map(
                        (draft) => ({
                            id:
                                (draft as ExtendedDraftBackup).id ||
                                `draft_${draft.timestamp}`,
                            title:
                                draft.eventData.eventName || 'Untitled Event',
                            eventName:
                                draft.eventData.eventName || 'Untitled Event',
                            description: draft.eventData.eventDescription || '',
                            eventDescription:
                                draft.eventData.eventDescription || '',
                            category: draft.eventData.eventCategory || '',
                            eventCategory: draft.eventData.eventCategory || '',
                            startDate:
                                draft.eventData.dateRange?.startDate || '',
                            endDate: draft.eventData.dateRange?.endDate || '',
                            startTime:
                                draft.eventData.timeRange?.startTime || '',
                            endTime: draft.eventData.timeRange?.endTime || '',
                            locationType:
                                draft.eventData.locationType === 'in-person'
                                    ? 0
                                    : draft.eventData.locationType === 'virtual'
                                      ? 1
                                      : draft.eventData.locationType ===
                                          'hybrid'
                                        ? 2
                                        : 0,
                            venue:
                                draft.eventData.locationDetails?.venueName ||
                                '',
                            address:
                                draft.eventData.locationDetails?.address || '',
                            virtualLink:
                                draft.eventData.locationDetails?.eventLink ||
                                '',
                            virtualMeetingUrl:
                                draft.eventData.locationDetails?.eventLink ||
                                '',
                            organizerName: draft.eventData.organizerName || '',
                            organizerWebsite:
                                draft.eventData.organizerWebsite || '',
                            images:
                                draft.eventData.images?.map(
                                    (img) => img.url || img.cdnUrl || ''
                                ) || [],
                            status: 'draft',
                            isDraft: true,
                            draftData: draft as ExtendedDraftBackup,
                            lastModified: new Date(draft.timestamp),
                            dateCreated: new Date(
                                draft.timestamp
                            ).toISOString(),
                            dateUpdated: new Date(
                                draft.timestamp
                            ).toISOString(),
                        })
                    );

                    setEvents(draftEvents);
                    setTotalCount(draftEvents.length);
                    setTotalPages(Math.ceil(draftEvents.length / pageSize));
                    setCurrentPage(page);

                    if (newFilters) {
                        setFilters(newFilters);
                    }

                    setLoading(false);
                    return;
                }

                // Build API parameters for published events
                const apiParams: Record<string, unknown> = {
                    PageNumber: page,
                    PageSize: pageSize,
                    SortBy: currentFilters.SortBy || 'createdAt',
                    SortOrder: currentFilters.SortOrder || 'desc',
                    SearchTerm: currentFilters.SearchTerm,
                    StartDate: currentFilters.StartDate,
                    EndDate: currentFilters.EndDate,
                    LocationType: currentFilters.LocationType,
                    IncludeTickets:
                        currentFilters.IncludeTickets !== undefined
                            ? currentFilters.IncludeTickets
                            : true,
                    MinPrice: currentFilters.MinPrice,
                    MaxPrice: currentFilters.MaxPrice,
                    Category:
                        currentFilters.Category &&
                        currentFilters.Category !== 'All'
                            ? currentFilters.Category
                            : undefined,
                    Status:
                        currentFilters.Status === 'all'
                            ? undefined
                            : currentFilters.Status,
                    Organizer: user?.id, // Filter by current user's events
                    City: currentFilters.City,
                    IncludePastEvents: currentFilters.IncludePastEvents,
                };

                // Remove undefined values
                Object.keys(apiParams).forEach((key) => {
                    if (
                        apiParams[key] === undefined ||
                        apiParams[key] === null ||
                        apiParams[key] === ''
                    ) {
                        delete apiParams[key];
                    }
                });

                const response = await EventsService.getApiEvents({
                    pageNumber: apiParams.PageNumber as number,
                    pageSize: apiParams.PageSize as number,
                    sortBy: apiParams.SortBy as string,
                    sortOrder: apiParams.SortOrder as string,
                    searchTerm: apiParams.SearchTerm as string,
                    category: apiParams.Category as string,
                    categories: currentFilters.Categories,
                    startDate: apiParams.StartDate as string,
                    endDate: apiParams.EndDate as string,
                    locationType: apiParams.LocationType as string | undefined,
                    minPrice: apiParams.MinPrice as number,
                    maxPrice: apiParams.MaxPrice as number,
                    includeTickets: apiParams.IncludeTickets as boolean,
                    status: apiParams.Status as string,
                    organizer: apiParams.Organizer as string,
                    city: apiParams.City as string,
                    includePastEvents: apiParams.IncludePastEvents as boolean,
                });

                if (response.data && response.success) {
                    const pagedData = response.data;
                    let vendorEvents: VendorEvent[] = (
                        pagedData.items || []
                    ).map((event) => ({
                        ...event,
                        isDraft: false,
                    }));

                    // Include drafts if requested and not filtering by specific status
                    if (
                        currentFilters.includeDrafts &&
                        currentFilters.status !== 'published'
                    ) {
                        const draftEvents: VendorEvent[] = loadedDrafts.map(
                            (draft) => ({
                                id:
                                    (draft as ExtendedDraftBackup).id ||
                                    `draft_${draft.timestamp}`,
                                title:
                                    draft.eventData.eventName ||
                                    'Untitled Event',
                                eventName:
                                    draft.eventData.eventName ||
                                    'Untitled Event',
                                description:
                                    draft.eventData.eventDescription || '',
                                eventDescription:
                                    draft.eventData.eventDescription || '',
                                category: draft.eventData.eventCategory || '',
                                eventCategory:
                                    draft.eventData.eventCategory || '',
                                startDate:
                                    draft.eventData.dateRange?.startDate || '',
                                endDate:
                                    draft.eventData.dateRange?.endDate || '',
                                startTime:
                                    draft.eventData.timeRange?.startTime || '',
                                endTime:
                                    draft.eventData.timeRange?.endTime || '',
                                locationType:
                                    draft.eventData.locationType === 'in-person'
                                        ? 0
                                        : draft.eventData.locationType ===
                                            'virtual'
                                          ? 1
                                          : draft.eventData.locationType ===
                                              'hybrid'
                                            ? 2
                                            : 0,
                                venue:
                                    draft.eventData.locationDetails
                                        ?.venueName || '',
                                address:
                                    draft.eventData.locationDetails?.address ||
                                    '',
                                virtualLink:
                                    draft.eventData.locationDetails
                                        ?.eventLink || '',
                                virtualMeetingUrl:
                                    draft.eventData.locationDetails
                                        ?.eventLink || '',
                                organizerName:
                                    draft.eventData.organizerName || '',
                                organizerWebsite:
                                    draft.eventData.organizerWebsite || '',
                                images:
                                    draft.eventData.images?.map(
                                        (img) => img.url || img.cdnUrl || ''
                                    ) || [],
                                status: 'draft',
                                isDraft: true,
                                draftData: draft as ExtendedDraftBackup,
                                lastModified: new Date(draft.timestamp),
                                dateCreated: new Date(
                                    draft.timestamp
                                ).toISOString(),
                                dateUpdated: new Date(
                                    draft.timestamp
                                ).toISOString(),
                            })
                        );

                        vendorEvents = [...draftEvents, ...vendorEvents];
                    }

                    setEvents(vendorEvents);
                    setTotalCount(
                        (pagedData.metadata?.totalCount || 0) +
                            (currentFilters.includeDrafts
                                ? loadedDrafts.length
                                : 0)
                    );
                    setTotalPages(pagedData.metadata?.totalPages || 0);
                    setCurrentPage(page);

                    if (newFilters) {
                        setFilters(newFilters);
                    }
                } else {
                    throw new Error(
                        response.message || 'Failed to fetch events'
                    );
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'An error occurred while fetching events';
                setError(errorMessage);
                console.error('Error fetching vendor events:', err);
            } finally {
                setLoading(false);
            }
        },
        [pageSize, hasVendorAccess, user?.id, loadDrafts]
    );

    const refetch = useCallback(() => {
        return fetchEvents(currentPage, filters);
    }, [fetchEvents, currentPage, filters]);

    const deleteDraft = useCallback(
        (draftId?: string) => {
            try {
                if (draftId) {
                    localStorage.removeItem(`event_draft_${draftId}`);
                } else {
                    DraftBackupService.clearDraft();
                }

                // Reload drafts
                loadDrafts();

                // Refetch events to update the list
                refetch();
            } catch (err) {
                console.warn('Failed to delete draft:', err);
            }
        },
        [loadDrafts, refetch]
    );

    const continueDraft = useCallback((draft: ExtendedDraftBackup) => {
        try {
            // Save the draft as the current working draft
            DraftBackupService.saveDraft(
                draft.eventData,
                draft.tickets,
                draft.step
            );

            // Navigate to create event page (this would be handled by the component using this hook)
            console.log('Continue draft:', draft);
        } catch (err) {
            console.warn('Failed to continue draft:', err);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        if (hasVendorAccess) {
            fetchEvents(1, { ...initialFilters, includeDrafts: true });
        } else {
            setError('Vendor access required');
        }
    }, [hasVendorAccess]);

    // Load drafts on mount
    useEffect(() => {
        loadDrafts();
    }, [loadDrafts]);

    return {
        events,
        drafts,
        loading,
        error,
        totalCount,
        currentPage,
        totalPages,
        hasNextPage: currentPage < totalPages && totalPages > 0,
        hasPreviousPage: currentPage > 1,
        fetchEvents,
        refetch,
        deleteDraft,
        continueDraft,
    };
};
