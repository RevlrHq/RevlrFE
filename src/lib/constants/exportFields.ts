export interface ExportField {
    key: string;
    label: string;
    description?: string;
    required?: boolean;
}

export const EVENT_EXPORT_FIELDS: ExportField[] = [
    {
        key: 'id',
        label: 'Event ID',
        description: 'Unique identifier for the event',
        required: true,
    },
    {
        key: 'title',
        label: 'Event Title',
        description: 'Name of the event',
        required: true,
    },
    {
        key: 'status',
        label: 'Status',
        description: 'Current status of the event',
        required: true,
    },
    {
        key: 'category',
        label: 'Category',
        description: 'Event category or type',
    },
    {
        key: 'startDate',
        label: 'Start Date',
        description: 'Event start date and time',
        required: true,
    },
    {
        key: 'endDate',
        label: 'End Date',
        description: 'Event end date and time',
    },
    {
        key: 'isVirtual',
        label: 'Virtual Event',
        description: 'Whether the event is virtual or in-person',
    },
    {
        key: 'venue',
        label: 'Venue',
        description: 'Event location or venue name',
    },
    {
        key: 'registrationCount',
        label: 'Registrations',
        description: 'Total number of registrations',
    },
    {
        key: 'ticketsSold',
        label: 'Tickets Sold',
        description: 'Number of tickets sold',
    },
    {
        key: 'totalTickets',
        label: 'Total Tickets',
        description: 'Total number of available tickets',
    },
    {
        key: 'revenue',
        label: 'Revenue',
        description: 'Total revenue generated from the event',
    },
    {
        key: 'dateCreated',
        label: 'Created Date',
        description: 'Date when the event was created',
    },
    {
        key: 'dateUpdated',
        label: 'Last Updated',
        description: 'Date when the event was last modified',
    },
];

export const REGISTRATION_EXPORT_FIELDS: ExportField[] = [
    {
        key: 'registrationId',
        label: 'Registration ID',
        description: 'Unique identifier for the registration',
        required: true,
    },
    {
        key: 'eventId',
        label: 'Event ID',
        description: 'Unique identifier for the associated event',
        required: true,
    },
    {
        key: 'eventTitle',
        label: 'Event Title',
        description: 'Name of the associated event',
        required: true,
    },
    {
        key: 'attendeeFirstName',
        label: 'First Name',
        description: 'Attendee first name',
        required: true,
    },
    {
        key: 'attendeeLastName',
        label: 'Last Name',
        description: 'Attendee last name',
        required: true,
    },
    {
        key: 'attendeeEmail',
        label: 'Email Address',
        description: 'Attendee email address',
        required: true,
    },
    {
        key: 'ticketName',
        label: 'Ticket Type',
        description: 'Type or name of the ticket purchased',
    },
    {
        key: 'amountPaid',
        label: 'Amount Paid',
        description: 'Amount paid for the registration',
    },
    {
        key: 'paymentStatus',
        label: 'Payment Status',
        description: 'Current payment status',
        required: true,
    },
    {
        key: 'registrationDate',
        label: 'Registration Date',
        description: 'Date when the registration was completed',
        required: true,
    },
    {
        key: 'isFinanced',
        label: 'Financed',
        description: 'Whether the registration is financed',
    },
];

export const REVENUE_EXPORT_FIELDS: ExportField[] = [
    {
        key: 'year',
        label: 'Year',
        description: 'Year of the revenue data',
    },
    {
        key: 'month',
        label: 'Month Number',
        description: 'Month number (1-12)',
    },
    {
        key: 'monthName',
        label: 'Month Name',
        description: 'Full name of the month',
        required: true,
    },
    {
        key: 'revenue',
        label: 'Revenue',
        description: 'Total revenue for the period',
        required: true,
    },
    {
        key: 'eventCount',
        label: 'Event Count',
        description: 'Number of events in the period',
    },
    {
        key: 'registrationCount',
        label: 'Registration Count',
        description: 'Number of registrations in the period',
    },
    // Event revenue breakdown fields
    {
        key: 'eventId',
        label: 'Event ID',
        description: 'Unique identifier for the event',
    },
    {
        key: 'eventTitle',
        label: 'Event Title',
        description: 'Name of the event',
    },
    {
        key: 'totalRevenue',
        label: 'Total Revenue',
        description: 'Total revenue from the event',
    },
    {
        key: 'ticketRevenue',
        label: 'Ticket Revenue',
        description: 'Revenue from ticket sales',
    },
    {
        key: 'fees',
        label: 'Fees',
        description: 'Platform and processing fees',
    },
    {
        key: 'netRevenue',
        label: 'Net Revenue',
        description: 'Revenue after fees and deductions',
    },
];

export const getExportFields = (
    dataType: 'events' | 'registrations' | 'revenue'
): ExportField[] => {
    switch (dataType) {
        case 'events':
            return EVENT_EXPORT_FIELDS;
        case 'registrations':
            return REGISTRATION_EXPORT_FIELDS;
        case 'revenue':
            return REVENUE_EXPORT_FIELDS;
        default:
            return [];
    }
};
