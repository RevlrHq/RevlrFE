import { EventView } from '../../../lib/services/models/EventView';
import { EventTicketView } from '../../../lib/services/models/EventTicketView';

interface TicketDetailsProps {
    event: EventView;
}

const TicketDetails = ({ event }: TicketDetailsProps) => {
    const tickets = event.tickets || [];

    if (tickets.length === 0) return null;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTicketStatus = (ticket: EventTicketView) => {
        const now = new Date();
        const saleStart = ticket.saleStartDate
            ? new Date(ticket.saleStartDate)
            : null;
        const saleEnd = ticket.saleEndDate
            ? new Date(ticket.saleEndDate)
            : null;

        if (saleStart && now < saleStart) {
            return {
                status: 'upcoming',
                text: 'Sale Not Started',
                color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            };
        }

        if (saleEnd && now > saleEnd) {
            return {
                status: 'ended',
                text: 'Sale Ended',
                color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            };
        }

        if (ticket.availableQuantity === 0) {
            return {
                status: 'soldout',
                text: 'Sold Out',
                color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            };
        }

        return {
            status: 'available',
            text: 'Available',
            color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        };
    };

    const getTotalTickets = () => {
        return tickets.reduce(
            (total, ticket) => total + (ticket.quantity || 0),
            0
        );
    };

    const getAvailableTickets = () => {
        return tickets.reduce((total, ticket) => {
            if (
                ticket.availableQuantity === null ||
                ticket.availableQuantity === undefined
            ) {
                return total; // Unlimited tickets don't count towards total
            }
            return total + ticket.availableQuantity;
        }, 0);
    };

    const getSoldTickets = () => {
        return tickets.reduce((total, ticket) => {
            if (ticket.quantity === null || ticket.quantity === undefined) {
                return total;
            }
            const available = ticket.availableQuantity || 0;
            return total + (ticket.quantity - available);
        }, 0);
    };

    return (
        <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-revlr-dark-card dark:shadow-none'>
            <h2 className='mb-4 text-xl font-semibold text-gray-900 dark:text-white'>
                Ticket Information
            </h2>

            {/* Ticket Summary */}
            <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
                <div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
                    <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                        {tickets.length}
                    </div>
                    <div className='text-sm text-blue-600 dark:text-blue-400'>
                        Ticket Types
                    </div>
                </div>

                {getTotalTickets() > 0 && (
                    <div className='rounded-lg bg-green-50 p-4 dark:bg-green-900/20'>
                        <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                            {getAvailableTickets()}
                        </div>
                        <div className='text-sm text-green-600 dark:text-green-400'>
                            Available
                        </div>
                    </div>
                )}

                {getSoldTickets() > 0 && (
                    <div className='rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20'>
                        <div className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
                            {getSoldTickets()}
                        </div>
                        <div className='text-sm text-orange-600 dark:text-orange-400'>
                            Sold
                        </div>
                    </div>
                )}
            </div>

            {/* Detailed Ticket List */}
            <div className='space-y-4'>
                {tickets.map((ticket, index) => {
                    const ticketStatus = getTicketStatus(ticket);

                    return (
                        <div
                            key={ticket.id || index}
                            className='rounded-lg border border-gray-200 p-4 dark:border-revlr-dark-border'
                        >
                            <div className='flex items-start justify-between'>
                                <div className='flex-1'>
                                    <div className='flex items-center space-x-3'>
                                        <h3 className='font-semibold text-gray-900 dark:text-white'>
                                            {ticket.name}
                                        </h3>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${ticketStatus.color}`}
                                        >
                                            {ticketStatus.text}
                                        </span>
                                    </div>

                                    {ticket.description && (
                                        <p className='mt-1 text-sm text-gray-600 dark:text-gray-300'>
                                            {ticket.description}
                                        </p>
                                    )}
                                </div>

                                <div className='ml-4 text-right'>
                                    <div className='text-lg font-bold text-gray-900 dark:text-white'>
                                        {ticket.price === 0
                                            ? 'Free'
                                            : formatPrice(ticket.price || 0)}
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Details Grid */}
                            <div className='mt-4 grid grid-cols-2 gap-4 text-sm'>
                                {/* Quantity Information */}
                                <div>
                                    <span className='font-medium text-gray-700 dark:text-gray-300'>
                                        Quantity:
                                    </span>
                                    <div className='mt-1'>
                                        {ticket.quantity === null ||
                                        ticket.quantity === undefined ? (
                                            <span className='text-gray-600 dark:text-gray-400'>
                                                Unlimited
                                            </span>
                                        ) : (
                                            <span className='text-gray-900 dark:text-white'>
                                                {ticket.quantity.toLocaleString()}{' '}
                                                total
                                            </span>
                                        )}
                                    </div>
                                    {ticket.availableQuantity !== null &&
                                        ticket.availableQuantity !==
                                            undefined && (
                                            <div className='text-green-600 dark:text-green-400'>
                                                {ticket.availableQuantity.toLocaleString()}{' '}
                                                available
                                            </div>
                                        )}
                                </div>

                                {/* Sale Period */}
                                <div>
                                    <span className='font-medium text-gray-700 dark:text-gray-300'>
                                        Sale Period:
                                    </span>
                                    <div className='mt-1 space-y-1'>
                                        {ticket.saleStartDate && (
                                            <div className='text-gray-600 dark:text-gray-400'>
                                                From:{' '}
                                                {formatDate(
                                                    ticket.saleStartDate
                                                )}
                                            </div>
                                        )}
                                        {ticket.saleEndDate && (
                                            <div className='text-gray-600 dark:text-gray-400'>
                                                Until:{' '}
                                                {formatDate(ticket.saleEndDate)}
                                            </div>
                                        )}
                                        {!ticket.saleStartDate &&
                                            !ticket.saleEndDate && (
                                                <div className='text-gray-600 dark:text-gray-400'>
                                                    No restrictions
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Dates */}
                            {(ticket.dateCreated || ticket.dateUpdated) && (
                                <div className='mt-4 border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-revlr-dark-border dark:text-gray-400'>
                                    {ticket.dateCreated && (
                                        <span>
                                            Created:{' '}
                                            {formatDate(ticket.dateCreated)}
                                        </span>
                                    )}
                                    {ticket.dateCreated &&
                                        ticket.dateUpdated &&
                                        ' • '}
                                    {ticket.dateUpdated && (
                                        <span>
                                            Updated:{' '}
                                            {formatDate(ticket.dateUpdated)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TicketDetails;
