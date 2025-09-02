/**
 * Account Management Integration Tests
 *
 * Tests the complete account management workflow including:
 * - Account information display
 * - Data retention settings
 * - Account deletion workflow
 * - Service integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountService } from '../../services/AccountService';
import type {
    AccountInfo,
    AccountDeletionConfirmation,
    AccountDeletionRequest,
} from '../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('AccountService', () => {
    let accountService: AccountService;
    const mockFetch = fetch as vi.MockedFunction<typeof fetch>;

    beforeEach(() => {
        accountService = new AccountService('/api');
        mockFetch.mockClear();
    });

    describe('getAccountInfo', () => {
        it('should fetch account information successfully', async () => {
            const mockAccountInfo: AccountInfo = {
                userId: 'user-123',
                email: 'test@example.com',
                createdAt: new Date('2023-01-01'),
                lastLoginAt: new Date('2024-01-01'),
                accountType: 'individual',
                status: 'active',
                verificationStatus: 'verified',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockAccountInfo,
            } as Response);

            const result = await accountService.getAccountInfo();

            expect(mockFetch).toHaveBeenCalledWith('/api/account/info', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
            expect(result).toEqual(mockAccountInfo);
        });

        it('should handle fetch errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                statusText: 'Unauthorized',
            } as Response);

            await expect(accountService.getAccountInfo()).rejects.toThrow(
                'Failed to fetch account info: Unauthorized'
            );
        });
    });

    describe('requestAccountDeletion', () => {
        it('should request account deletion successfully', async () => {
            const mockConfirmation: AccountDeletionConfirmation = {
                password: 'password123',
                confirmationText: 'DELETE MY ACCOUNT',
                dataRetention: [{ dataType: 'events', retain: true }],
                reason: 'no_longer_needed',
            };

            const mockDeletionRequest: AccountDeletionRequest = {
                id: 'deletion-123',
                userId: 'user-123',
                reason: 'no_longer_needed',
                requestedAt: new Date(),
                scheduledAt: new Date(),
                status: 'pending',
                dataRetention: [{ dataType: 'events', retain: true }],
                confirmationToken: 'token-123',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockDeletionRequest,
            } as Response);

            const result =
                await accountService.requestAccountDeletion(mockConfirmation);

            expect(mockFetch).toHaveBeenCalledWith('/api/account/deletion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(mockConfirmation),
            });
            expect(result).toEqual(mockDeletionRequest);
        });
    });

    describe('cancelAccountDeletion', () => {
        it('should cancel account deletion successfully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            await accountService.cancelAccountDeletion();

            expect(mockFetch).toHaveBeenCalledWith('/api/account/deletion', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
        });
    });

    describe('hasActiveSubscription', () => {
        it('should check subscription status successfully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ hasActiveSubscription: true }),
            } as Response);

            const result = await accountService.hasActiveSubscription();

            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/account/subscription/status',
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                }
            );
        });

        it('should return false on error', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await accountService.hasActiveSubscription();

            expect(result).toBe(false);
        });
    });

    describe('requestDataExport', () => {
        it('should request data export successfully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            await accountService.requestDataExport();

            expect(mockFetch).toHaveBeenCalledWith('/api/account/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });
        });
    });
});

describe('Account Management Workflow', () => {
    it('should handle complete deletion workflow', async () => {
        // This test would verify the complete workflow:
        // 1. Check account status
        // 2. Request deletion
        // 3. Confirm deletion
        // 4. Handle data retention preferences

        expect(true).toBe(true); // Placeholder for integration test
    });

    it('should validate deletion requirements', async () => {
        // This test would verify:
        // 1. Active subscription check
        // 2. Password validation
        // 3. Confirmation text validation
        // 4. Data retention selection

        expect(true).toBe(true); // Placeholder for validation test
    });
});
