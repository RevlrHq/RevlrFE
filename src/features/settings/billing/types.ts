export interface PaymentMethod {
    id: string;
    type: 'card' | 'bank_account' | 'paypal';
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
    isExpired: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface BillingTransaction {
    id: string;
    amount: number;
    currency: string;
    description: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    paymentMethodId: string;
    createdAt: Date;
    invoiceUrl?: string;
}

export interface Subscription {
    id: string;
    planName: string;
    status: 'active' | 'canceled' | 'past_due' | 'unpaid';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    amount: number;
    currency: string;
}

export interface AddPaymentMethodData {
    type: 'card' | 'bank_account';
    cardNumber?: string;
    expiryMonth?: number;
    expiryYear?: number;
    cvc?: string;
    holderName: string;
    billingAddress: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
}

export interface BillingError {
    type:
        | 'VALIDATION_ERROR'
        | 'PAYMENT_FAILED'
        | 'NETWORK_ERROR'
        | 'SERVER_ERROR';
    message: string;
    field?: string;
}
