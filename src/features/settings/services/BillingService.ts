import { ApiError } from '@/lib/api';
import type {
    PaymentMethod,
    BillingTransaction,
    Subscription,
    AddPaymentMethodData,
    BillingError,
} from '../billing/types';

/**
 * Service for managing billing operations including payment methods,
 * transaction history, and subscription management.
 * Implements security measures and validation for all billing operations.
 */
export class BillingService {
    private readonly baseUrl = '/api/billing';

    /**
     * Retrieves all payment methods for the current user
     */
    async getPaymentMethods(): Promise<PaymentMethod[]> {
        try {
            const response = await fetch(`${this.baseUrl}/payment-methods`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new ApiError(response, 'Failed to fetch payment methods');
            }

            const data = await response.json();
            return data.paymentMethods || [];
        } catch (error) {
            throw this.handleError(error, 'Failed to load payment methods');
        }
    }

    /**
     * Adds a new payment method with validation and security checks
     */
    async addPaymentMethod(data: AddPaymentMethodData): Promise<PaymentMethod> {
        this.validatePaymentMethodData(data);

        try {
            const response = await fetch(`${this.baseUrl}/payment-methods`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new ApiError(response, 'Failed to add payment method');
            }

            const result = await response.json();
            return result.paymentMethod;
        } catch (error) {
            throw this.handleError(error, 'Failed to add payment method');
        }
    }

    /**
     * Removes a payment method with safety checks
     */
    async removePaymentMethod(id: string): Promise<void> {
        if (!id) {
            throw new Error('Payment method ID is required');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/payment-methods/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new ApiError(response, 'Failed to remove payment method');
            }
        } catch (error) {
            throw this.handleError(error, 'Failed to remove payment method');
        }
    }

    /**
     * Sets a payment method as default
     */
    async setDefaultPaymentMethod(id: string): Promise<void> {
        if (!id) {
            throw new Error('Payment method ID is required');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/payment-methods/${id}/default`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new ApiError(
                    response,
                    'Failed to set default payment method'
                );
            }
        } catch (error) {
            throw this.handleError(
                error,
                'Failed to set default payment method'
            );
        }
    }

    /**
     * Retrieves billing transaction history
     */
    async getBillingHistory(): Promise<BillingTransaction[]> {
        try {
            const response = await fetch(`${this.baseUrl}/transactions`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new ApiError(response, 'Failed to fetch billing history');
            }

            const data = await response.json();
            return data.transactions || [];
        } catch (error) {
            throw this.handleError(error, 'Failed to load billing history');
        }
    }

    /**
     * Downloads an invoice for a specific transaction
     */
    async downloadInvoice(transactionId: string): Promise<Blob> {
        if (!transactionId) {
            throw new Error('Transaction ID is required');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/transactions/${transactionId}/invoice`,
                {
                    method: 'GET',
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new ApiError(response, 'Failed to download invoice');
            }

            return await response.blob();
        } catch (error) {
            throw this.handleError(error, 'Failed to download invoice');
        }
    }

    /**
     * Validates payment method data before submission
     */
    private validatePaymentMethodData(data: AddPaymentMethodData): void {
        if (!data.holderName?.trim()) {
            throw new Error('Cardholder name is required');
        }

        if (data.type === 'card') {
            if (!data.cardNumber || data.cardNumber.length < 13) {
                throw new Error('Valid card number is required');
            }
            if (
                !data.expiryMonth ||
                data.expiryMonth < 1 ||
                data.expiryMonth > 12
            ) {
                throw new Error('Valid expiry month is required');
            }
            if (
                !data.expiryYear ||
                data.expiryYear < new Date().getFullYear()
            ) {
                throw new Error('Valid expiry year is required');
            }
            if (!data.cvc || data.cvc.length < 3) {
                throw new Error('Valid CVC is required');
            }
        }

        if (!data.billingAddress?.line1?.trim()) {
            throw new Error('Billing address is required');
        }
        if (!data.billingAddress?.city?.trim()) {
            throw new Error('City is required');
        }
        if (!data.billingAddress?.postalCode?.trim()) {
            throw new Error('Postal code is required');
        }
        if (!data.billingAddress?.country?.trim()) {
            throw new Error('Country is required');
        }
    }

    /**
     * Handles and transforms errors into consistent format
     */
    private handleError(error: unknown, defaultMessage: string): BillingError {
        if (error instanceof ApiError) {
            return {
                type: 'SERVER_ERROR',
                message: error.message || defaultMessage,
            };
        }

        if (error instanceof Error) {
            return {
                type: 'VALIDATION_ERROR',
                message: error.message,
            };
        }

        return {
            type: 'NETWORK_ERROR',
            message: defaultMessage,
        };
    }
}

// Export singleton instance
export const billingService = new BillingService();
