/**
 * Billing settings types and interfaces
 */

export interface BillingSettings {
    paymentMethods: PaymentMethod[];
    defaultPaymentMethod?: string;
    billingAddress: BillingAddress;
    subscription?: Subscription;
    invoiceHistory: Invoice[];
    taxSettings: TaxSettings;
}

export interface PaymentMethod {
    id: string;
    type: PaymentMethodType;
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
    isDefault: boolean;
    billingAddress?: BillingAddress;
    createdAt: Date;
}

export type PaymentMethodType =
    | 'card'
    | 'bank_account'
    | 'paypal'
    | 'apple_pay'
    | 'google_pay';

export interface BillingAddress {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface Subscription {
    id: string;
    planId: string;
    planName: string;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    trialEnd?: Date;
    amount: number;
    currency: string;
    interval: 'month' | 'year';
}

export type SubscriptionStatus =
    | 'active'
    | 'canceled'
    | 'incomplete'
    | 'incomplete_expired'
    | 'past_due'
    | 'trialing'
    | 'unpaid';

export interface Invoice {
    id: string;
    number: string;
    status: InvoiceStatus;
    amount: number;
    currency: string;
    dueDate: Date;
    paidAt?: Date;
    downloadUrl?: string;
    description: string;
    lineItems: InvoiceLineItem[];
}

export type InvoiceStatus =
    | 'draft'
    | 'open'
    | 'paid'
    | 'void'
    | 'uncollectible';

export interface InvoiceLineItem {
    id: string;
    description: string;
    quantity: number;
    unitAmount: number;
    amount: number;
}

export interface TaxSettings {
    taxId?: string;
    taxExempt: boolean;
    automaticTax: boolean;
    taxRates: TaxRate[];
}

export interface TaxRate {
    id: string;
    displayName: string;
    percentage: number;
    jurisdiction: string;
    type: 'sales_tax' | 'vat' | 'gst';
}

export interface AddPaymentMethodRequest {
    type: PaymentMethodType;
    token: string;
    billingAddress: BillingAddress;
    setAsDefault: boolean;
}

export interface UpdateBillingAddressRequest {
    address: BillingAddress;
}

export interface PaymentMethodsProps {
    paymentMethods: PaymentMethod[];
    defaultPaymentMethod?: string;
    onAdd: (request: AddPaymentMethodRequest) => Promise<void>;
    onRemove: (paymentMethodId: string) => Promise<void>;
    onSetDefault: (paymentMethodId: string) => Promise<void>;
    isLoading?: boolean;
}

export interface PaymentMethodCardProps {
    paymentMethod: PaymentMethod;
    isDefault: boolean;
    onSetDefault: () => Promise<void>;
    onRemove: () => Promise<void>;
    isLoading?: boolean;
}

export interface AddPaymentMethodProps {
    onAdd: (request: AddPaymentMethodRequest) => Promise<void>;
    isLoading?: boolean;
}

export interface BillingHistoryProps {
    invoices: Invoice[];
    onDownload: (invoiceId: string) => Promise<void>;
    onLoadMore: () => Promise<void>;
    hasMore: boolean;
    isLoading?: boolean;
}

export interface InvoiceItemProps {
    invoice: Invoice;
    onDownload: () => Promise<void>;
    isDownloading?: boolean;
}

export interface SubscriptionInfoProps {
    subscription?: Subscription;
    onCancel: () => Promise<void>;
    onReactivate: () => Promise<void>;
    onChangePlan: (planId: string) => Promise<void>;
    isLoading?: boolean;
}
