/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { usePaymentMethods } from '../usePaymentMethods';
import { billingService } from '../../../services';
import type { PaymentMethod, AddPaymentMethodData } from '../../types';

// Mock the billing service
jest.mock('../../../services', () => ({
    billingService: {
        getPaymentMethods: jest.fn(),
        addPaymentMethod: jest.fn(),
        removePaymentMethod: jest.fn(),
        setDefaultPaymentMethod: jest.fn(),
    },
}));

const mockBillingService = billingService as jest.Mocked<typeof billingService>;

describe('usePaymentMethods', () => {
    const mockPaymentMethods: PaymentMethod[] = [
        {
            id: '1',
            type: 'card',
            last4: '4242',
            brand: 'visa',
            expiryMonth: 12,
            expiryYear: 2025,
            isDefault: true,
            isExpired: false,
            createdAt: new Date('2023-01-15'),
            updatedAt: new Date('2023-01-15'),
        },
        {
            id: '2',
            type: 'card',
            last4: '1234',
            brand: 'mastercard',
            expiryMonth: 8,
            expiryYear: 2024,
            isDefault: false,
            isExpired: false,
            createdAt: new Date('2022-06-10'),
            updatedAt: new Date('2022-06-10'),
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should load payment methods on mount', async () => {
        mockBillingService.getPaymentMethods.mockResolvedValue(
            mockPaymentMethods
        );

        const { result } = renderHook(() => usePaymentMethods());

        expect(result.current.isLoading).toBe(true);

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        expect(mockBillingService.getPaymentMethods).toHaveBeenCalled();
        expect(result.current.paymentMethods).toEqual(mockPaymentMethods);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('should handle loading error', async () => {
        const mockError = { type: 'NETWORK_ERROR', message: 'Failed to load' };
        mockBillingService.getPaymentMethods.mockRejectedValue(mockError);

        const { result } = renderHook(() => usePaymentMethods());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        expect(result.current.error).toEqual(mockError);
        expect(result.current.isLoading).toBe(false);
    });

    it('should add payment method successfully', async () => {
        mockBillingService.getPaymentMethods.mockResolvedValue(
            mockPaymentMethods
        );

        const newPaymentMethod: PaymentMethod = {
            id: '3',
            type: 'card',
            last4: '5555',
            brand: 'mastercard',
            expiryMonth: 6,
            expiryYear: 2026,
            isDefault: false,
            isExpired: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        mockBillingService.addPaymentMethod.mockResolvedValue(newPaymentMethod);

        const { result } = renderHook(() => usePaymentMethods());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        const paymentData: AddPaymentMethodData = {
            type: 'card',
            cardNumber: '5555555555554444',
            expiryMonth: 6,
            expiryYear: 2026,
            cvc: '123',
            holderName: 'Jane Doe',
            billingAddress: {
                line1: '456 Oak St',
                city: 'Los Angeles',
                state: 'CA',
                postalCode: '90210',
                country: 'US',
            },
        };

        await act(async () => {
            await result.current.addPaymentMethod(paymentData);
        });

        expect(mockBillingService.addPaymentMethod).toHaveBeenCalledWith(
            paymentData
        );
        expect(result.current.paymentMethods).toHaveLength(3);
        expect(result.current.paymentMethods[2]).toEqual(newPaymentMethod);
    });

    it('should validate payment method data before adding', async () => {
        mockBillingService.getPaymentMethods.mockResolvedValue([]);

        const { result } = renderHook(() => usePaymentMethods());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        const invalidData: AddPaymentMethodData = {
            type: 'card',
            cardNumber: '123', // Invalid card number
            holderName: 'John Doe',
            billingAddress: {
                line1: '123 Main St',
                city: 'New York',
                state: 'NY',
                postalCode: '10001',
                country: 'US',
            },
        };

        await act(async () => {
            try {
                await result.current.addPaymentMethod(invalidData);
            } catch (error) {
                expect(error).toEqual(
                    expect.objectContaining({
                        message: 'Invalid card number format',
                    })
                );
            }
        });
    });

    it('should remove payment method successfully', async () => {
        mockBillingService.getPaymentMethods.mockResolvedValue(
            mockPaymentMethods
        );
        mockBillingService.removePaymentMethod.mockResolvedValue();

        const { result } = renderHook(() => usePaymentMethods());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.removePaymentMethod('2');
        });

        expect(mockBillingService.removePaymentMethod).toHaveBeenCalledWith(
            '2'
        );
        expect(result.current.paymentMethods).toHaveLength(1);
        expect(result.current.paymentMethods[0].id).toBe('1');
    });

    it('should set default payment method successfully', async () => {
        mockBillingService.getPaymentMethods.mockResolvedValue(
            mockPaymentMethods
        );
        mockBillingService.setDefaultPaymentMethod.mockResolvedValue();

        const { result } = renderHook(() => usePaymentMethods());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        await act(async () => {
            await result.current.setDefaultPaymentMethod('2');
        });

        expect(mockBillingService.setDefaultPaymentMethod).toHaveBeenCalledWith(
            '2'
        );
        expect(result.current.paymentMethods[0].isDefault).toBe(false);
        expect(result.current.paymentMethods[1].isDefault).toBe(true);
    });

    it('should handle loading states correctly', async () => {
        mockBillingService.getPaymentMethods.mockResolvedValue(
            mockPaymentMethods
        );
        mockBillingService.addPaymentMethod.mockImplementation(
            () =>
                new Promise((resolve) =>
                    setTimeout(() => resolve({} as PaymentMethod), 100)
                )
        );

        const { result } = renderHook(() => usePaymentMethods());

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        const paymentData: AddPaymentMethodData = {
            type: 'card',
            cardNumber: '4111111111111111',
            holderName: 'Test User',
            billingAddress: {
                line1: '123 Test St',
                city: 'Test City',
                state: 'TS',
                postalCode: '12345',
                country: 'US',
            },
        };

        act(() => {
            result.current.addPaymentMethod(paymentData);
        });

        expect(result.current.isAdding).toBe(true);

        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 150));
        });

        expect(result.current.isAdding).toBe(false);
    });
});
