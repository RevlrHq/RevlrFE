'use client';

import { useState } from 'react';
import { EventsService } from '../lib/services/services/EventsService';
import { EventRegistrationRequest } from '../lib/services/models/EventRegistrationRequest';
import { AttendeeInfo } from '../lib/services/models/AttendeeInfo';
import { NewUserRegistrationInfo } from '../lib/services/models/NewUserRegistrationInfo';
import { useAuthStore } from '../stores/authStore';
import { useToast } from './use-toast';

// Import Paystack types
interface PaystackTransaction {
    reference: string;
    status: string;
    trans: string;
    transaction: string;
    trxref: string;
}

interface PaystackPopup {
    resumeTransaction: (
        accessCode: string,
        callbacks: {
            onSuccess: (transaction: PaystackTransaction) => void;
            onCancel: () => void;
            onError: (error: { message?: string }) => void;
        }
    ) => void;
}

declare global {
    interface Window {
        PaystackPop: new () => PaystackPopup;
    }
}

interface TicketSelection {
    ticketId: string;
    quantity: number;
    ticketName: string;
    ticketPrice: number;
}

interface GuestInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

interface UseEventRegistrationProps {
    eventId: string;
    selectedTickets: TicketSelection[];
    guestInfo?: GuestInfo;
    isNewUser?: boolean;
    newUserInfo?: NewUserRegistrationInfo;
}

export const useEventRegistration = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [registrationId, setRegistrationId] = useState<string | null>(null);
    const { user } = useAuthStore();
    const { toast } = useToast();

    const registerForEvent = async ({
        eventId,
        selectedTickets,
        guestInfo,
        isNewUser = false,
        newUserInfo,
    }: UseEventRegistrationProps) => {
        setIsLoading(true);

        try {
            // For now, we'll use the first ticket in the selection
            // In a real implementation, you might need to handle multiple tickets differently
            const primaryTicket = selectedTickets[0];

            if (!primaryTicket) {
                throw new Error('No ticket selected');
            }

            // Prepare attendee info
            const attendeeInfo: AttendeeInfo = guestInfo
                ? {
                      firstName: guestInfo.firstName,
                      lastName: guestInfo.lastName,
                      email: guestInfo.email,
                      phoneNumber: guestInfo.phone || null,
                  }
                : {
                      firstName: user?.firstName || '',
                      lastName: user?.lastName || '',
                      email: user?.email || '',
                      phoneNumber: user?.phoneNumber || null,
                  };

            // Prepare registration request
            const registrationRequest: EventRegistrationRequest = {
                eventId,
                eventTicketId: primaryTicket.ticketId,
                attendee: attendeeInfo,
                isNewUser,
                newUserInfo: isNewUser ? newUserInfo : undefined,
            };

            // Call the registration API
            const response = await EventsService.postApiEventsRegister({
                requestBody: registrationRequest,
            });

            if (response.success && response.data) {
                setRegistrationId(response.data.id || null);

                // Check if payment is required (ticket price > 0)
                const totalPrice = selectedTickets.reduce(
                    (total, ticket) =>
                        total + ticket.ticketPrice * ticket.quantity,
                    0
                );

                if (totalPrice > 0) {
                    // If the API returns a paystack reference, use it to initialize payment
                    // For now, we'll assume the API doesn't return it and we need to initialize payment separately
                    const paymentResult = await initializePayment({
                        email: attendeeInfo.email,
                        amount: totalPrice * 100, // Convert to kobo (Paystack expects amount in kobo)
                        registrationId: response.data.id || '',
                        attendeeInfo,
                        paystackReference: response.data.paymentReference!,
                        accessCode: response.data.paymentAccessCode!,
                    });

                    return paymentResult;
                } else {
                    // Free event - registration is complete
                    return {
                        success: true,
                        registrationId: response.data.id,
                        paymentReference: null,
                        requiresPayment: false,
                    };
                }
            } else {
                throw new Error(response.message || 'Registration failed');
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : 'Registration failed';
            console.error('Registration error:', error);
            toast({
                title: 'Registration Failed',
                description:
                    errorMessage ||
                    'An error occurred during registration. Please try again.',
                variant: 'destructive',
            });

            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setIsLoading(false);
        }
    };

    const initializePayment = async ({
        registrationId,
        accessCode,
    }: {
        email: string;
        amount: number;
        registrationId: string;
        attendeeInfo: AttendeeInfo;
        paystackReference: string;
        accessCode?: string;
    }) => {
        return new Promise((resolve, reject) => {
            try {
                // Load Paystack script if not already loaded
                if (!window.PaystackPop) {
                    const script = document.createElement('script');
                    script.src = 'https://js.paystack.co/v2/inline.js';
                    script.onload = () => {
                        initializePaystackPopup();
                    };
                    script.onerror = () => {
                        reject(new Error('Failed to load Paystack script'));
                    };
                    document.head.appendChild(script);
                } else {
                    initializePaystackPopup();
                }

                function initializePaystackPopup() {
                    const popup = new window.PaystackPop();

                    // Resume the transaction with callbacks
                    popup.resumeTransaction(accessCode!, {
                        onSuccess: async (transaction: PaystackTransaction) => {
                            try {
                                console.log(
                                    'Transaction successful:',
                                    transaction
                                );
                                // Verify the payment with our backend
                                const verificationResult = await verifyPayment(
                                    registrationId,
                                    transaction.reference
                                );
                                resolve(verificationResult);
                            } catch (error) {
                                console.error(
                                    'Payment verification error:',
                                    error
                                );
                                reject(error);
                            }
                        },
                        onCancel: () => {
                            console.log('Payment cancelled by user');
                            reject(new Error('Payment was cancelled by user'));
                        },
                        onError: (error: { message?: string }) => {
                            console.error('Paystack error:', error);
                            reject(
                                new Error(error.message || 'Payment failed')
                            );
                        },
                    });
                }
            } catch (error) {
                console.error('Payment initialization error:', error);
                reject(error);
            }
        });
    };

    const verifyPayment = async (
        registrationId: string,
        paystackReference: string
    ) => {
        try {
            const response =
                await EventsService.putApiEventsRegistrationsPayment({
                    registrationId,
                    paystackReference,
                });

            if (response.success && response.data) {
                // Display success message from API
                toast({
                    title: 'Payment Successful!',
                    description:
                        response.message ||
                        'Your payment has been verified and registration is complete.',
                });

                return {
                    success: true,
                    registrationId: response.data.id,
                    paymentReference: paystackReference,
                    requiresPayment: false,
                    message:
                        response.message || 'Payment verified successfully',
                };
            } else {
                // Display error message from API
                const errorMessage =
                    response.message || 'Payment verification failed';
                toast({
                    title: 'Payment Verification Failed',
                    description: errorMessage,
                    variant: 'destructive',
                });

                throw new Error(errorMessage);
            }
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Payment verification failed';
            console.error('Payment verification error:', error);

            // Display exact error message from API
            toast({
                title: 'Payment Verification Failed',
                description: errorMessage,
                variant: 'destructive',
            });

            throw error;
        }
    };

    return {
        registerForEvent,
        isLoading,
        registrationId,
    };
};
