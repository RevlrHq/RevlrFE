'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';

interface PostLoginAction {
    type: 'register-for-event';
    eventId: string;
    selectedTickets: Array<{
        ticketId: string;
        quantity: number;
        ticketName: string;
        ticketPrice: number;
    }>;
}

export const usePostLoginAction = () => {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            const storedAction = localStorage.getItem('postLoginAction');

            if (storedAction) {
                try {
                    const action: PostLoginAction = JSON.parse(storedAction);

                    // Clear the stored action
                    localStorage.removeItem('postLoginAction');

                    // Handle the action based on type
                    switch (action.type) {
                        case 'register-for-event':
                            // Navigate to checkout with the stored ticket information
                            const checkoutParams = new URLSearchParams({
                                eventId: action.eventId,
                                tickets: JSON.stringify(action.selectedTickets),
                            });

                            router.push(
                                `/ticket-checkout?${checkoutParams.toString()}`
                            );
                            break;

                        default:
                            console.warn(
                                'Unknown post-login action type:',
                                action.type
                            );
                    }
                } catch (error) {
                    console.error('Error parsing post-login action:', error);
                    localStorage.removeItem('postLoginAction');
                }
            }
        }
    }, [isAuthenticated, router]);

    const clearPostLoginAction = () => {
        localStorage.removeItem('postLoginAction');
    };

    return {
        clearPostLoginAction,
    };
};
