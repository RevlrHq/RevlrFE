import { useState, useEffect } from 'react';
import { billingService } from '../../services';
import type {
    PaymentMethod,
    AddPaymentMethodData,
    BillingError,
} from '../types';

export function usePaymentMethods() {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<BillingError | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isRemoving, setIsRemoving] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    useEffect(() => {
        loadPaymentMethods();
    }, []);

    const loadPaymentMethods = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const methods = await billingService.getPaymentMethods();
            setPaymentMethods(methods);
        } catch (err) {
            const billingError = err as BillingError;
            setError(billingError);
        } finally {
            setIsLoading(false);
        }
    };

    const addPaymentMethod = async (data: AddPaymentMethodData) => {
        try {
            setIsAdding(true);
            setError(null);

            // Client-side validation for security
            if (!data.holderName?.trim()) {
                throw new Error('Cardholder name is required');
            }

            if (data.type === 'card' && data.cardNumber) {
                // Basic card number validation (Luhn algorithm would be better)
                const cleanCardNumber = data.cardNumber.replace(/\s/g, '');
                if (!/^\d{13,19}$/.test(cleanCardNumber)) {
                    throw new Error('Invalid card number format');
                }
            }

            const newMethod = await billingService.addPaymentMethod(data);
            setPaymentMethods((prev) => [...prev, newMethod]);
        } catch (err) {
            const billingError = err as BillingError;
            setError(billingError);
            throw err;
        } finally {
            setIsAdding(false);
        }
    };

    const removePaymentMethod = async (id: string) => {
        try {
            setIsRemoving(id);
            setError(null);

            // Security check: prevent removing the only payment method if there are active subscriptions
            const methodToRemove = paymentMethods.find((m) => m.id === id);
            if (methodToRemove?.isDefault && paymentMethods.length === 1) {
                // This check would ideally be done on the server side as well
                const hasActiveSubscriptions = await checkActiveSubscriptions();
                if (hasActiveSubscriptions) {
                    throw new Error(
                        'Cannot remove the only payment method with active subscriptions'
                    );
                }
            }

            await billingService.removePaymentMethod(id);
            setPaymentMethods((prev) =>
                prev.filter((method) => method.id !== id)
            );
        } catch (err) {
            const billingError = err as BillingError;
            setError(billingError);
        } finally {
            setIsRemoving(null);
        }
    };

    // Helper function to check for active subscriptions
    const checkActiveSubscriptions = async (): Promise<boolean> => {
        // This would make an API call to check for active subscriptions
        // For now, return false as a placeholder
        return false;
    };

    const setDefaultPaymentMethod = async (id: string) => {
        try {
            setIsUpdating(id);
            setError(null);

            await billingService.setDefaultPaymentMethod(id);
            setPaymentMethods((prev) =>
                prev.map((method) => ({
                    ...method,
                    isDefault: method.id === id,
                }))
            );
        } catch (err) {
            const billingError = err as BillingError;
            setError(billingError);
        } finally {
            setIsUpdating(null);
        }
    };

    return {
        paymentMethods,
        isLoading,
        error,
        addPaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod,
        isAdding,
        isRemoving,
        isUpdating,
        refetch: loadPaymentMethods,
    };
}
