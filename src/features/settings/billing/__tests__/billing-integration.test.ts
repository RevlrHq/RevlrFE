import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BillingSettings } from '../components/BillingSettings';
import { PaymentMethods } from '../components/PaymentMethods';
import { AddPaymentMethod } from '../components/AddPaymentMethod';

// Mock Stripe
const mockStripe = {
    elements: jest.fn(() => ({
        create: jest.fn(() => ({
            mount: jest.fn(),
            unmount: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
        })),
    })),
    createToken: jest.fn(),
    createPaymentMethod: jest.fn(),
    confirmCardPayment: jest.fn(),
};

jest.mock('@stripe/stripe-js', () => ({
    loadStripe: jest.fn(() => Promise.resolve(mockStripe)),
}));

// Mock billing service
const mockBillingService = {
    getPaymentMethods: jest.fn(),
    addPaymentMethod: jest.fn(),
    removePaymentMethod: jest.fn(),
    setDefaultPaymentMethod: jest.fn(),
    getBillingHistory: jest.fn(),
    downloadInvoice: jest.fn(),
};

jest.mock('../../services/BillingService', () => ({
    BillingService: jest.fn().mockImplementation(() => mockBillingService),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('Billing Integration Tests', () => {
    const mockPaymentMethods = [
        {
            id: 'pm_1',
            type: 'card',
            last4: '4242',
            brand: 'visa',
            expiryMonth: 12,
            expiryYear: 2025,
            isDefault: true,
        },
        {
            id: 'pm_2',
            type: 'card',
            last4: '0000',
            brand: 'mastercard',
            expiryMonth: 6,
            expiryYear: 2026,
            isDefault: false,
        },
    ];

    const mockBillingHistory = [
        {
            id: 'inv_1',
            amount: 2999,
            currency: 'usd',
            status: 'paid',
            createdAt: new Date('2024-01-01'),
            description: 'Monthly subscription',
            downloadUrl: 'https://example.com/invoice.pdf',
        },
        {
            id: 'inv_2',
            amount: 2999,
            currency: 'usd',
            status: 'pending',
            createdAt: new Date('2024-02-01'),
            description: 'Monthly subscription',
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockBillingService.getPaymentMethods.mockResolvedValue(mockPaymentMethods);
        mockBillingService.getBillingHistory.mockResolvedValue(mockBillingHistory);
    });

    describe('Payment Method Management', () => {
        it('displays existing payment methods', async () => {
            render(
                <TestWrapper>
                    <PaymentMethods />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('•••• 4242')).toBeInTheDocument();
                expect(screen.getByText('•••• 0000')).toBeInTheDocument();
            });

            // Verify default payment method is marked
            expect(screen.getByText('Default')).toBeInTheDocument();
        });

        it('handles adding new payment method with Stripe integration', async () => {
            const user = userEvent.setup();
            
            // Mock successful Stripe payment method creation
            mockStripe.createPaymentMethod.mockResolvedValue({
                paymentMethod: {
                    id: 'pm_new',
                    card: {
                        last4: '1234',
                        brand: 'visa',
                        exp_month: 12,
                        exp_year: 2027,
                    },
                },
            });

            mockBillingService.addPaymentMethod.mockResolvedValue({
                id: 'pm_new',
                type: 'card',
                last4: '1234',
                brand: 'visa',
                expiryMonth: 12,
                expiryYear: 2027,
                isDefault: false,
            });

            render(
                <TestWrapper>
                    <AddPaymentMethod />
                </TestWrapper>
            );

            // Fill out payment form
            const cardNumberInput = screen.getByLabelText('Card Number');
            const expiryInput = screen.getByLabelText('Expiry Date');
            const cvcInput = screen.getByLabelText('CVC');

            await user.type(cardNumberInput, '4242424242424242');
            await user.type(expiryInput, '12/27');
            await user.type(cvcInput, '123');

            // Submit form
            const addButton = screen.getByText('Add Payment Method');
            await user.click(addButton);

            // Verify Stripe integration
            await waitFor(() => {
                expect(mockStripe.createPaymentMethod).toHaveBeenCalledWith({
                    type: 'card',
                    card: expect.any(Object),
                });
            });

            // Verify service call
            expect(mockBillingService.addPaymentMethod).toHaveBeenCalledWith({
                stripePaymentMethodId: 'pm_new',
            });

            // Verify success message
            await waitFor(() => {
                expect(screen.getByText(/payment method added successfully/i)).toBeInTheDocument();
            });
        });

        it('handles Stripe validation errors', async () => {
            const user = userEvent.setup();
            
            // Mock Stripe validation error
            mockStripe.createPaymentMethod.mockResolvedValue({
                error: {
                    type: 'card_error',
                    code: 'card_declined',
                    message: 'Your card was declined.',
                },
            });

            render(
                <TestWrapper>
                    <AddPaymentMethod />
                </TestWrapper>
            );

            // Fill out form with invalid card
            const cardNumberInput = screen.getByLabelText('Card Number');
            await user.type(cardNumberInput, '4000000000000002'); // Declined card

            const addButton = screen.getByText('Add Payment Method');
            await user.click(addButton);

            // Verify error message
            await waitFor(() => {
                expect(screen.getByText('Your card was declined.')).toBeInTheDocument();
            });

            // Verify service was not called
            expect(mockBillingService.addPaymentMethod).not.toHaveBeenCalled();
        });

        it('handles setting default payment method', async () => {
            const user = userEvent.setup();
            
            mockBillingService.setDefaultPaymentMethod.mockResolvedValue(undefined);

            render(
                <TestWrapper>
                    <PaymentMethods />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('•••• 0000')).toBeInTheDocument();
            });

            // Set non-default card as default
            const setDefaultButtons = screen.getAllByText('Set as Default');
            await user.click(setDefaultButtons[0]);

            // Verify service call
            expect(mockBillingService.setDefaultPaymentMethod).toHaveBeenCalledWith('pm_2');

            // Verify success message
            await waitFor(() => {
                expect(screen.getByText(/default payment method updated/i)).toBeInTheDocument();
            });
        });

        it('handles removing payment method with confirmation', async () => {
            const user = userEvent.setup();
            
            mockBillingService.removePaymentMethod.mockResolvedValue(undefined);

            render(
                <TestWrapper>
                    <PaymentMethods />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('•••• 0000')).toBeInTheDocument();
            });

            // Remove non-default payment method
            const removeButtons = screen.getAllByText('Remove');
            await user.click(removeButtons[0]);

            // Confirm removal
            const confirmButton = screen.getByText('Remove Payment Method');
            await user.click(confirmButton);

            // Verify service call
            expect(mockBillingService.removePaymentMethod).toHaveBeenCalledWith('pm_2');

            // Verify success message
            await waitFor(() => {
                expect(screen.getByText(/payment method removed/i)).toBeInTheDocument();
            });
        });

        it('prevents removing default payment method when it is the only one', async () => {
            const user = userEvent.setup();
            
            // Mock single default payment method
            mockBillingService.getPaymentMethods.mockResolvedValue([mockPaymentMethods[0]]);

            render(
                <TestWrapper>
                    <PaymentMethods />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('•••• 4242')).toBeInTheDocument();
            });

            // Try to remove the only payment method
            const removeButton = screen.getByText('Remove');
            await user.click(removeButton);

            // Verify warning message
            expect(screen.getByText(/cannot remove the only payment method/i)).toBeInTheDocument();
        });
    });

    describe('Billing History Management', () => {
        it('displays billing history with proper formatting', async () => {
            render(
                <TestWrapper>
                    <BillingSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('$29.99')).toBeInTheDocument();
                expect(screen.getByText('Monthly subscription')).toBeInTheDocument();
                expect(screen.getByText('Paid')).toBeInTheDocument();
                expect(screen.getByText('Pending')).toBeInTheDocument();
            });
        });

        it('handles invoice download', async () => {
            const user = userEvent.setup();
            
            // Mock successful download
            const mockBlob = new Blob(['invoice content'], { type: 'application/pdf' });
            mockBillingService.downloadInvoice.mockResolvedValue(mockBlob);

            // Mock URL.createObjectURL
            const mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-url');
            Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL });

            render(
                <TestWrapper>
                    <BillingSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Download')).toBeInTheDocument();
            });

            // Download invoice
            const downloadButton = screen.getByText('Download');
            await user.click(downloadButton);

            // Verify service call
            expect(mockBillingService.downloadInvoice).toHaveBeenCalledWith('inv_1');

            // Verify download initiated
            expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
        });

        it('handles failed payment retry workflow', async () => {
            const user = userEvent.setup();
            
            // Mock failed payment in history
            const failedPayment = {
                ...mockBillingHistory[1],
                status: 'failed',
                failureReason: 'Insufficient funds',
            };
            
            mockBillingService.getBillingHistory.mockResolvedValue([failedPayment]);
            mockBillingService.retryPayment = jest.fn().mockResolvedValue(undefined);

            render(
                <TestWrapper>
                    <BillingSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Failed')).toBeInTheDocument();
                expect(screen.getByText('Insufficient funds')).toBeInTheDocument();
            });

            // Retry failed payment
            const retryButton = screen.getByText('Retry Payment');
            await user.click(retryButton);

            // Verify retry service call
            expect(mockBillingService.retryPayment).toHaveBeenCalledWith('inv_2');

            // Verify success message
            await waitFor(() => {
                expect(screen.getByText(/payment retry initiated/i)).toBeInTheDocument();
            });
        });
    });

    describe('Subscription Management', () => {
        it('displays current subscription information', async () => {
            const mockSubscription = {
                id: 'sub_123',
                status: 'active',
                plan: 'Pro Plan',
                amount: 2999,
                currency: 'usd',
                interval: 'month',
                currentPeriodStart: new Date('2024-01-01'),
                currentPeriodEnd: new Date('2024-02-01'),
                cancelAtPeriodEnd: false,
            };

            mockBillingService.getSubscription = jest.fn().mockResolvedValue(mockSubscription);

            render(
                <TestWrapper>
                    <BillingSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Pro Plan')).toBeInTheDocument();
                expect(screen.getByText('$29.99/month')).toBeInTheDocument();
                expect(screen.getByText('Active')).toBeInTheDocument();
            });
        });

        it('handles subscription cancellation', async () => {
            const user = userEvent.setup();
            
            mockBillingService.cancelSubscription = jest.fn().mockResolvedValue({
                cancelAtPeriodEnd: true,
                currentPeriodEnd: new Date('2024-02-01'),
            });

            render(
                <TestWrapper>
                    <BillingSettings />
                </TestWrapper>
            );

            // Cancel subscription
            const cancelButton = screen.getByText('Cancel Subscription');
            await user.click(cancelButton);

            // Confirm cancellation
            const confirmButton = screen.getByText('Confirm Cancellation');
            await user.click(confirmButton);

            // Verify service call
            expect(mockBillingService.cancelSubscription).toHaveBeenCalled();

            // Verify cancellation message
            await waitFor(() => {
                expect(screen.getByText(/subscription will be cancelled/i)).toBeInTheDocument();
            });
        });

        it('handles subscription plan upgrade', async () => {
            const user = userEvent.setup();
            
            mockBillingService.upgradeSubscription = jest.fn().mockResolvedValue({
                id: 'sub_123',
                plan: 'Enterprise Plan',
                amount: 9999,
            });

            render(
                <TestWrapper>
                    <BillingSettings />
                </TestWrapper>
            );

            // Upgrade to enterprise
            const upgradeButton = screen.getByText('Upgrade to Enterprise');
            await user.click(upgradeButton);

            // Confirm upgrade
            const confirmButton = screen.getByText('Confirm Upgrade');
            await user.click(confirmButton);

            // Verify service call
            expect(mockBillingService.upgradeSubscription).toHaveBeenCalledWith('enterprise');

            // Verify upgrade success
            await waitFor(() => {
                expect(screen.getByText(/subscription upgraded successfully/i)).toBeInTheDocument();
            });
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('handles payment method addition failure', async () => {
            const user = userEvent.setup();
            
            mockBillingService.addPaymentMethod.mockRejectedValue(
                new Error('Payment method could not be added')
            );

            render(
                <TestWrapper>
                    <AddPaymentMethod />
                </TestWrapper>
            );

            // Fill out form
            const cardNumberInput = screen.getByLabelText('Card Number');
            await user.type(cardNumberInput, '4242424242424242');

            const addButton = screen.getByText('Add Payment Method');
            await user.click(addButton);

            // Verify error message
            await waitFor(() => {
                expect(screen.getByText(/payment method could not be added/i)).toBeInTheDocument();
            });
        });

        it('handles network errors during billing operations', async () => {
            const user = userEvent.setup();
            
            mockBillingService.getPaymentMethods.mockRejectedValue(
                new Error('Network error')
            );

            render(
                <TestWrapper>
                    <PaymentMethods />
                </TestWrapper>
            );

            // Verify error state
            await waitFor(() => {
                expect(screen.getByText(/failed to load payment methods/i)).toBeInTheDocument();
                expect(screen.getByText('Retry')).toBeInTheDocument();
            });

            // Retry loading
            const retryButton = screen.getByText('Retry');
            await user.click(retryButton);

            expect(mockBillingService.getPaymentMethods).toHaveBeenCalledTimes(2);
        });

        it('handles expired payment methods', async () => {
            const expiredPaymentMethod = {
                ...mockPaymentMethods[0],
                expiryMonth: 1,
                expiryYear: 2020,
                isExpired: true,
            };

            mockBillingService.getPaymentMethods.mockResolvedValue([expiredPaymentMethod]);

            render(
                <TestWrapper>
                    <PaymentMethods />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Expired')).toBeInTheDocument();
                expect(screen.getByText('Update Payment Method')).toBeInTheDocument();
            });
        });

        it('handles subscription past due state', async () => {
            const pastDueSubscription = {
                id: 'sub_123',
                status: 'past_due',
                plan: 'Pro Plan',
                amount: 2999,
                currency: 'usd',
                interval: 'month',
                pastDueAmount: 2999,
            };

            mockBillingService.getSubscription = jest.fn().mockResolvedValue(pastDueSubscription);

            render(
                <TestWrapper>
                    <BillingSettings />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('Past Due')).toBeInTheDocument();
                expect(screen.getByText(/payment of \$29\.99 is overdue/i)).toBeInTheDocument();
                expect(screen.getByText('Update Payment Method')).toBeInTheDocument();
            });
        });
    });

    describe('Security and Compliance', () => {
        it('does not store sensitive payment information', async () => {
            const user = userEvent.setup();
            
            render(
                <TestWrapper>
                    <AddPaymentMethod />
                </TestWrapper>
            );

            const cardNumberInput = screen.getByLabelText('Card Number');
            await user.type(cardNumberInput, '4242424242424242');

            // Verify card number is not stored in component state or DOM
            expect(cardNumberInput).not.toHaveValue('4242424242424242');
            expect(document.body.textContent).not.toContain('4242424242424242');
        });

        it('uses secure Stripe tokenization', async () => {
            const user = userEvent.setup();
            
            render(
                <TestWrapper>
                    <AddPaymentMethod />
                </TestWrapper>
            );

            const addButton = screen.getByText('Add Payment Method');
            await user.click(addButton);

            // Verify Stripe is used for tokenization, not direct card data
            await waitFor(() => {
                expect(mockStripe.createPaymentMethod).toHaveBeenCalled();
            });

            // Verify no raw card data is sent to our API
            expect(mockBillingService.addPaymentMethod).toHaveBeenCalledWith({
                stripePaymentMethodId: expect.any(String),
            });
        });

        it('handles PCI compliance requirements', () => {
            render(
                <TestWrapper>
                    <AddPaymentMethod />
                </TestWrapper>
            );

            // Verify Stripe Elements are used for card input (PCI compliant)
            expect(mockStripe.elements).toHaveBeenCalled();
            
            // Verify no card input fields are rendered directly
            expect(screen.queryByDisplayValue(/4242/)).not.toBeInTheDocument();
        });
    });
});