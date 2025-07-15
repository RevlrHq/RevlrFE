import { useState } from 'react';
import { EventView } from '../../../lib/services/models/EventView';
import { EventTicketView } from '../../../lib/services/models/EventTicketView';

interface EventTicketSectionProps {
    event: EventView;
}

interface TicketSelection {
    ticketId: string;
    quantity: number;
}

const EventTicketSection = ({ event }: EventTicketSectionProps) => {
    const [selectedTickets, setSelectedTickets] = useState<TicketSelection[]>(
        []
    );
    const [isRegistering, setIsRegistering] = useState(false);

    const tickets = event.tickets || [];
    const hasTickets = tickets.length > 0;

    const updateTicketQuantity = (ticketId: string, quantity: number) => {
        setSelectedTickets((prev) => {
            const existing = prev.find((t) => t.ticketId === ticketId);
            if (existing) {
                if (quantity === 0) {
                    return prev.filter((t) => t.ticketId !== ticketId);
                }
                return prev.map((t) =>
                    t.ticketId === ticketId ? { ...t, quantity } : t
                );
            } else if (quantity > 0) {
                return [...prev, { ticketId, quantity }];
            }
            return prev;
        });
    };

    const getTotalPrice = () => {
        return selectedTickets.reduce((total, selection) => {
            const ticket = tickets.find((t) => t.id === selection.ticketId);
            return total + (ticket?.price || 0) * selection.quantity;
        }, 0);
    };

    const getTotalQuantity = () => {
        return selectedTickets.reduce(
            (total, selection) => total + selection.quantity,
            0
        );
    };

    const handleRegister = async () => {
        if (selectedTickets.length === 0) return;

        setIsRegistering(true);
        try {
            // TODO: Implement registration logic
            console.log('Registering for tickets:', selectedTickets);
            // This would typically navigate to a registration/checkout page
        } catch (error) {
            console.error('Registration failed:', error);
        } finally {
            setIsRegistering(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(price);
    };

    const isTicketAvailable = (ticket: EventTicketView) => {
        if (
            ticket.availableQuantity === null ||
            ticket.availableQuantity === undefined
        ) {
            return true; // Unlimited tickets
        }
        return ticket.availableQuantity > 0;
    };

    const getTicketAvailabilityText = (ticket: EventTicketView) => {
        if (
            ticket.availableQuantity === null ||
            ticket.availableQuantity === undefined
        ) {
            return 'Unlimited';
        }
        if (ticket.availableQuantity === 0) {
            return 'Sold Out';
        }
        return `${ticket.availableQuantity} left`;
    };

    if (!hasTickets) {
        return (
            <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-revlr-dark-card dark:shadow-none'>
                <h2 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
                    Event Registration
                </h2>
                <div className='py-8 text-center'>
                    <svg
                        className='mx-auto size-12 text-gray-400 dark:text-gray-500'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'
                        />
                    </svg>
                    <p className='mt-2 text-sm text-gray-600 dark:text-gray-300'>
                        No tickets available for this event
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-revlr-dark-card dark:shadow-none'>
            <h2 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
                Select Tickets
            </h2>

            <div className='space-y-4'>
                {tickets.map((ticket) => {
                    const selectedQuantity =
                        selectedTickets.find((t) => t.ticketId === ticket.id)
                            ?.quantity || 0;
                    const available = isTicketAvailable(ticket);
                    const maxQuantity = Math.min(
                        10, // Max 10 tickets per type
                        ticket.availableQuantity || 10
                    );

                    return (
                        <div
                            key={ticket.id}
                            className={`rounded-lg border p-4 ${
                                available
                                    ? 'border-gray-200 dark:border-revlr-dark-border'
                                    : 'border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                            }`}
                        >
                            <div className='flex items-start justify-between'>
                                <div className='flex-1'>
                                    <h3
                                        className={`font-medium ${
                                            available
                                                ? 'text-gray-900 dark:text-white'
                                                : 'text-gray-500 dark:text-gray-400'
                                        }`}
                                    >
                                        {ticket.name}
                                    </h3>
                                    {ticket.description && (
                                        <p
                                            className={`mt-1 text-sm ${
                                                available
                                                    ? 'text-gray-600 dark:text-gray-300'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`}
                                        >
                                            {ticket.description}
                                        </p>
                                    )}
                                    <div className='mt-2 flex items-center space-x-4'>
                                        <span
                                            className={`text-lg font-semibold ${
                                                available
                                                    ? 'text-blue-600 dark:text-blue-400'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`}
                                        >
                                            {ticket.price === 0
                                                ? 'Free'
                                                : formatPrice(
                                                      ticket.price || 0
                                                  )}
                                        </span>
                                        <span
                                            className={`text-sm ${
                                                available
                                                    ? 'text-gray-500 dark:text-gray-400'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`}
                                        >
                                            {getTicketAvailabilityText(ticket)}
                                        </span>
                                    </div>
                                </div>

                                {available && (
                                    <div className='ml-4 flex items-center space-x-2'>
                                        <button
                                            onClick={() =>
                                                updateTicketQuantity(
                                                    ticket.id!,
                                                    Math.max(
                                                        0,
                                                        selectedQuantity - 1
                                                    )
                                                )
                                            }
                                            disabled={selectedQuantity === 0}
                                            className='flex size-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                        >
                                            -
                                        </button>
                                        <span className='w-8 text-center text-sm font-medium text-gray-900 dark:text-white'>
                                            {selectedQuantity}
                                        </span>
                                        <button
                                            onClick={() =>
                                                updateTicketQuantity(
                                                    ticket.id!,
                                                    selectedQuantity + 1
                                                )
                                            }
                                            disabled={
                                                selectedQuantity >= maxQuantity
                                            }
                                            className='flex size-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                        >
                                            +
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Sale Period */}
                            {(ticket.saleStartDate || ticket.saleEndDate) && (
                                <div className='mt-3 text-xs text-gray-500 dark:text-gray-400'>
                                    {ticket.saleStartDate && (
                                        <span>
                                            Sale starts:{' '}
                                            {new Date(
                                                ticket.saleStartDate
                                            ).toLocaleDateString()}
                                        </span>
                                    )}
                                    {ticket.saleStartDate &&
                                        ticket.saleEndDate &&
                                        ' • '}
                                    {ticket.saleEndDate && (
                                        <span>
                                            Sale ends:{' '}
                                            {new Date(
                                                ticket.saleEndDate
                                            ).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary and Register Button */}
            {selectedTickets.length > 0 && (
                <div className='mt-6 space-y-4 border-t border-gray-200 pt-4 dark:border-revlr-dark-border'>
                    <div className='flex justify-between text-sm'>
                        <span className='text-gray-600 dark:text-gray-300'>
                            {getTotalQuantity()} ticket
                            {getTotalQuantity() !== 1 ? 's' : ''}
                        </span>
                        <span className='font-semibold text-gray-900 dark:text-white'>
                            {formatPrice(getTotalPrice())}
                        </span>
                    </div>
                    <button
                        onClick={handleRegister}
                        disabled={isRegistering}
                        className='w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                        {isRegistering ? 'Processing...' : 'Register for Event'}
                    </button>
                </div>
            )}

            {selectedTickets.length === 0 && (
                <div className='mt-6 border-t border-gray-200 pt-4 dark:border-revlr-dark-border'>
                    <button
                        disabled
                        className='w-full cursor-not-allowed rounded-md bg-gray-300 px-4 py-3 text-sm font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    >
                        Select tickets to register
                    </button>
                </div>
            )}
        </div>
    );
};

export default EventTicketSection;
