import { useState } from 'react';
import { EventView } from '../../../lib/services/models/EventView';
import { EventTicketView } from '../../../lib/services/models/EventTicketView';
import { useAuthStore } from '../../../stores/authStore';
import TicketRegistrationFlow from './TicketRegistrationFlow';

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
    const [showRegistrationFlow, setShowRegistrationFlow] = useState(false);
    const { isAuthenticated } = useAuthStore();

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

    const handleRegister = () => {
        if (selectedTickets.length === 0) return;

        // If user is authenticated, proceed directly to checkout
        if (isAuthenticated) {
            // TODO: Implement authenticated user registration logic
            console.log(
                'Authenticated user registering for tickets:',
                selectedTickets
            );
            // For now, just navigate to checkout with tickets
            const ticketsForCheckout = selectedTickets.map((selection) => {
                const ticket = tickets.find((t) => t.id === selection.ticketId);
                return {
                    ticketId: selection.ticketId,
                    quantity: selection.quantity,
                    ticketName: ticket?.name || 'Unknown Ticket',
                    ticketPrice: ticket?.price || 0,
                };
            });

            const checkoutParams = new URLSearchParams({
                eventId: event.id!,
                tickets: JSON.stringify(ticketsForCheckout),
            });

            window.location.href = `/ticket-checkout?${checkoutParams.toString()}`;
        } else {
            // Show registration flow for non-authenticated users
            setShowRegistrationFlow(true);
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
            <div className='rounded-2xl border border-gray-200/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
                <div className='mb-4 flex items-center gap-3'>
                    <div className='rounded-xl bg-gradient-to-br from-revlr-primary-blue to-revlr-accent-purple p-3'>
                        <svg
                            className='size-5 text-white'
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
                    </div>
                    <h2 className='font-montserrat text-lg font-bold text-gray-900 dark:text-white'>
                        Event Registration
                    </h2>
                </div>
                <div className='py-8 text-center'>
                    <div className='mx-auto mb-4 size-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-4 dark:from-revlr-dark-bg dark:to-revlr-dark-border'>
                        <svg
                            className='size-8 text-gray-400 dark:text-gray-500'
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
                    </div>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                        No tickets available for this event
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className='rounded-2xl border border-gray-200/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
            <div className='mb-6 flex items-center gap-3'>
                <div className='rounded-xl bg-gradient-to-br from-revlr-primary-blue to-revlr-accent-purple p-3'>
                    <svg
                        className='size-5 text-white'
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
                </div>
                <h2 className='font-montserrat text-lg font-bold text-gray-900 dark:text-white'>
                    Select Tickets
                </h2>
            </div>

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
                            className={`rounded-xl border p-4 transition-all duration-300 ${
                                available
                                    ? 'border-gray-200/50 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md dark:border-revlr-dark-border/50 dark:from-revlr-dark-card dark:to-revlr-dark-bg'
                                    : 'border-gray-200/30 bg-gray-50/50 dark:border-gray-700/30 dark:bg-gray-800/50'
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
                                                    ? 'bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple bg-clip-text text-transparent'
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
                                            className='flex size-8 items-center justify-center rounded-full border border-gray-200/50 bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-gradient-to-r hover:from-revlr-primary-blue hover:to-revlr-accent-purple hover:text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-revlr-dark-border/50 dark:bg-revlr-dark-card/80 dark:text-gray-300'
                                        >
                                            -
                                        </button>
                                        <span className='w-8 text-center text-sm font-semibold text-gray-900 dark:text-white'>
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
                                            className='flex size-8 items-center justify-center rounded-full border border-gray-200/50 bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-gradient-to-r hover:from-revlr-primary-blue hover:to-revlr-accent-purple hover:text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-revlr-dark-border/50 dark:bg-revlr-dark-card/80 dark:text-gray-300'
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
                        className='w-full rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/50 focus:ring-offset-2'
                    >
                        Register for Event
                    </button>
                </div>
            )}

            {selectedTickets.length === 0 && (
                <div className='mt-6 border-t border-gray-200 pt-4 dark:border-revlr-dark-border'>
                    <button
                        disabled
                        className='w-full cursor-not-allowed rounded-xl bg-gray-200/50 px-6 py-4 font-semibold text-gray-400 backdrop-blur-sm dark:bg-gray-700/50 dark:text-gray-500'
                    >
                        Select tickets to register
                    </button>
                </div>
            )}

            {/* Registration Flow Modal */}
            {showRegistrationFlow && (
                <TicketRegistrationFlow
                    event={event}
                    selectedTickets={selectedTickets.map((selection) => {
                        const ticket = tickets.find(
                            (t) => t.id === selection.ticketId
                        );
                        return {
                            ticketId: selection.ticketId,
                            quantity: selection.quantity,
                            ticketName: ticket?.name || 'Unknown Ticket',
                            ticketPrice: ticket?.price || 0,
                        };
                    })}
                    onClose={() => setShowRegistrationFlow(false)}
                />
            )}
        </div>
    );
};

export default EventTicketSection;
