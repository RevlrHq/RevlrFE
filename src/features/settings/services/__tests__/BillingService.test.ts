import { BillingService } from '../BillingService';
import type { AddPaymentMethodData } from '../../billing/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('BillingService', () => {
    let billingService: BillingService;
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
        billingService = new BillingService();
        mockFetch.mockClear();
    });

    describe('getPaymentMethods', () => {
        it('should fetch payment methods successfully', async () => {
            const mockPaymentMethods = [
                {
                    id: '1',
                    type: 'card' as const,
                    last4: '4242',
                    brand: 'visa',
                    isDefault: true,
                    isExpired: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ paymentMethods: mockPaymentMethods }),
            } as Response);

            const result = await billingService.getPaymentMethods();

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/billing/payment-methods',
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                }
            );
            expect(result).toEqual(mockPaymentMethods);
        });

        it('should handle API errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            } as Response);

            await expect(
                billingService.getPaymentMethods()
            ).rejects.toMatchObject({
                type: 'SERVER_ERROR',
            });
        });
    });

    describe('addPaymentMethod', () => {
        const validPaymentData: AddPaymentMethodData = {
            type: 'card',
            cardNumber: '4242424242424242',
            expiryMonth: 12,
            expiryYear: 2025,
            cvc: '123',
            holderName: 'John Doe',
            billingAddress: {
                line1: '123 Main St',
                city: 'New York',
                state: 'NY',
                postalCode: '10001',
                country: 'US',
            },
        };

        it('should add payment method successfully', async () => {
            const mockPaymentMethod = {
                id: '2',
                type: 'card' as const,
                last4: '4242',
                brand: 'visa',
                isDefault: false,
                isExpired: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ paymentMethod: mockPaymentMethod }),
            } as Response);

            const result =
                await billingService.addPaymentMethod(validPaymentData);

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/billing/payment-methods',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(validPaymentData),
                }
            );
            expect(result).toEqual(mockPaymentMethod);
        });

        it('should validate required fields', async () => {
            const invalidData = { ...validPaymentData, holderName: '' };

            await expect(
                billingService.addPaymentMethod(invalidData)
            ).rejects.toThrow('Cardholder name is required');
        });

        it('should validate card number for card type', async () => {
            const invalidData = { ...validPaymentData, cardNumber: '123' };

            await expect(
                billingService.addPaymentMethod(invalidData)
            ).rejects.toThrow('Valid card number is required');
        });

        it('should validate expiry date', async () => {
            const invalidData = { ...validPaymentData, expiryYear: 2020 };

            await expect(
                billingService.addPaymentMethod(invalidData)
            ).rejects.toThrow('Valid expiry year is required');
        });

        it('should validate billing address', async () => {
            const invalidData = {
                ...validPaymentData,
                billingAddress: {
                    ...validPaymentData.billingAddress,
                    line1: '',
                },
            };

            await expect(
                billingService.addPaymentMethod(invalidData)
            ).rejects.toThrow('Billing address is required');
        });
    });

    describe('removePaymentMethod', () => {
        it('should remove payment method successfully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            await billingService.removePaymentMethod('1');

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/billing/payment-methods/1',
                {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                }
            );
        });

        it('should validate payment method ID', async () => {
            await expect(
                billingService.removePaymentMethod('')
            ).rejects.toThrow('Payment method ID is required');
        });
    });

    describe('setDefaultPaymentMethod', () => {
        it('should set default payment method successfully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            await billingService.setDefaultPaymentMethod('1');

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/billing/payment-methods/1/default',
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                }
            );
        });

        it('should validate payment method ID', async () => {
            await expect(
                billingService.setDefaultPaymentMethod('')
            ).rejects.toThrow('Payment method ID is required');
        });
    });

    describe('getBillingHistory', () => {
        it('should fetch billing history successfully', async () => {
            const mockTransactions = [
                {
                    id: 'txn_1',
                    amount: 2999,
                    currency: 'usd',
                    description: 'Test transaction',
                    status: 'completed' as const,
                    paymentMethodId: '1',
                    createdAt: new Date(),
                },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ transactions: mockTransactions }),
            } as Response);

            const result = await billingService.getBillingHistory();

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/billing/transactions',
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                }
            );
            expect(result).toEqual(mockTransactions);
        });
    });

    describe('downloadInvoice', () => {
        it('should download invoice successfully', async () => {
            const mockBlob = new Blob(['invoice content'], {
                type: 'application/pdf',
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                blob: async () => mockBlob,
            } as Response);

            const result = await billingService.downloadInvoice('txn_1');

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/billing/transactions/txn_1/invoice',
                {
                    method: 'GET',
                    credentials: 'include',
                }
            );
            expect(result).toEqual(mockBlob);
        });

        it('should validate transaction ID', async () => {
            await expect(billingService.downloadInvoice('')).rejects.toThrow(
                'Transaction ID is required'
            );
        });
    });
});
