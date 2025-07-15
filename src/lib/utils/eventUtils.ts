import { EventView2, EventTicketView } from '../services';

export const formatEventDate = (
    startDate?: string,
    startTime?: string
): string => {
    if (!startDate) return 'Date TBD';

    try {
        const date = new Date(startDate);
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };

        let formattedDate = date.toLocaleDateString('en-US', options);

        if (startTime) {
            const time = new Date(`1970-01-01T${startTime}`);
            const timeOptions: Intl.DateTimeFormatOptions = {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            };
            formattedDate += `, ${time.toLocaleTimeString('en-US', timeOptions)}`;
        }

        return formattedDate;
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Date TBD';
    }
};

export const getEventPrice = (
    event: EventView2
): { price: number; isFree: boolean; displayPrice: string } => {
    if (!event.tickets || event.tickets.length === 0) {
        return { price: 0, isFree: true, displayPrice: 'Free' };
    }

    const prices = event.tickets
        .map((ticket: EventTicketView) => ticket.price || 0)
        .filter((price: number) => price > 0);

    if (prices.length === 0) {
        return { price: 0, isFree: true, displayPrice: 'Free' };
    }

    const minPrice = Math.min(...prices);
    return {
        price: minPrice,
        isFree: false,
        displayPrice: `From $${minPrice}`,
    };
};

export const getEventLocation = (event: EventView2): string => {
    if (event.isVirtual) {
        return 'Virtual Event';
    }

    if (event.venue) {
        return event.venue;
    }

    if (event.address) {
        return event.address;
    }

    return 'Location TBD';
};

export const getEventImage = (event: EventView2): string => {
    if (event.bannerImageUrl) {
        return event.bannerImageUrl;
    }

    if (event.images && event.images.length > 0) {
        return event.images[0];
    }

    // Fallback to a default image
    return '/assets/images/event-image.png';
};

export const mapSortOptionToApi = (
    sortOption: string
): { sortBy: string; sortOrder: string } => {
    switch (sortOption) {
        case 'Newest':
            return { sortBy: 'DateCreated', sortOrder: 'desc' };
        case 'Price: Low to High':
            return { sortBy: 'Title', sortOrder: 'asc' }; // API doesn't support price sorting directly
        case 'Price: High to Low':
            return { sortBy: 'Title', sortOrder: 'desc' }; // API doesn't support price sorting directly
        case 'Upcoming':
            return { sortBy: 'StartDate', sortOrder: 'asc' };
        case 'Trending':
        default:
            return { sortBy: 'StartDate', sortOrder: 'asc' };
    }
};

export const mapDateRangeToApi = (
    dateRange: string
): { startDate?: string; endDate?: string } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange) {
        case 'Today':
            return {
                startDate: today.toISOString(),
                endDate: new Date(
                    today.getTime() + 24 * 60 * 60 * 1000
                ).toISOString(),
            };
        case 'Tomorrow':
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            return {
                startDate: tomorrow.toISOString(),
                endDate: new Date(
                    tomorrow.getTime() + 24 * 60 * 60 * 1000
                ).toISOString(),
            };
        case 'This Week':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            return {
                startDate: startOfWeek.toISOString(),
                endDate: endOfWeek.toISOString(),
            };
        case 'This Weekend':
            const saturday = new Date(today);
            saturday.setDate(today.getDate() + (6 - today.getDay()));
            const sunday = new Date(saturday);
            sunday.setDate(saturday.getDate() + 1);
            return {
                startDate: saturday.toISOString(),
                endDate: new Date(
                    sunday.getTime() + 24 * 60 * 60 * 1000
                ).toISOString(),
            };
        case 'Next Week':
            const nextWeekStart = new Date(today);
            nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
            const nextWeekEnd = new Date(nextWeekStart);
            nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
            return {
                startDate: nextWeekStart.toISOString(),
                endDate: nextWeekEnd.toISOString(),
            };
        case 'This Month':
            const startOfMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );
            const endOfMonth = new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                0
            );
            return {
                startDate: startOfMonth.toISOString(),
                endDate: new Date(
                    endOfMonth.getTime() + 24 * 60 * 60 * 1000
                ).toISOString(),
            };
        default:
            return {};
    }
};

export const mapLocationTypeToApi = (eventType: string): string | undefined => {
    switch (eventType) {
        case 'In-person':
        case 'in-person':
        case 'inperson':
            return '0'; // In-Person events
        case 'Virtual':
        case 'virtual':
            return '1'; // Virtual events
        case 'Hybrid':
        case 'hybrid':
            return '2'; // Hybrid events
        default:
            return undefined;
    }
};
