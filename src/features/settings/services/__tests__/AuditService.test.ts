/**
 * Tests for AuditService
 */

import { AuditService, auditService } from '../AuditService';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock navigator
Object.defineProperty(window, 'navigator', {
    value: {
        userAgent: 'Mozilla/5.0 (Test Browser)',
    },
    writable: true,
});

describe('AuditService', () => {
    let service: AuditService;

    beforeEach(() => {
        service = new AuditService();
        mockFetch.mockClear();
        jest.clearAllTimers();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('logEvent', () => {
        it('should log a basic event', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            await service.logEvent('PROFILE_UPDATE', 'user_profile', {
                field: 'name',
            });

            // Fast-forward timers to trigger batch send
            jest.advanceTimersByTime(5000);

            expect(mockFetch).toHaveBeenCalledWith('/api/audit/events', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: expect.stringContaining('"action":"PROFILE_UPDATE"'),
            });
        });

        it('should send critical events immediately', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            await service.logEvent('PASSWORD_CHANGE', 'user_password');

            // Should not need to advance timers for critical events
            expect(mockFetch).toHaveBeenCalledWith('/api/audit/events', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: expect.stringContaining('"action":"PASSWORD_CHANGE"'),
            });
        });

        it('should batch non-critical events', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            // Log multiple non-critical events
            await service.logEvent('PROFILE_UPDATE', 'user_profile');
            await service.logEvent(
                'NOTIFICATION_PREFERENCES_UPDATE',
                'user_preferences'
            );

            // Should not send immediately
            expect(mockFetch).not.toHaveBeenCalled();

            // Fast-forward to trigger batch send
            jest.advanceTimersByTime(5000);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1]?.body as string);
            expect(body.events).toHaveLength(2);
        });

        it('should send when batch size is reached', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            // Log enough events to trigger batch send
            for (let i = 0; i < 10; i++) {
                await service.logEvent('PROFILE_UPDATE', 'user_profile', {
                    attempt: i,
                });
            }

            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should sanitize sensitive details', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            await service.logEvent('PROFILE_UPDATE', 'user_profile', {
                password: 'secret123',
                token: 'abc123',
                normalField: 'value',
            });

            jest.advanceTimersByTime(5000);

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1]?.body as string);
            const event = body.events[0];

            expect(event.details.password).toBe('[REDACTED]');
            expect(event.details.token).toBe('[REDACTED]');
            expect(event.details.normalField).toBe('value');
        });
    });

    describe('logProfileUpdate', () => {
        it('should log profile update with changed fields', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            await service.logProfileUpdate({
                firstName: 'John',
                lastName: 'Doe',
            });

            jest.advanceTimersByTime(5000);

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1]?.body as string);
            const event = body.events[0];

            expect(event.action).toBe('PROFILE_UPDATE');
            expect(event.resource).toBe('user_profile');
            expect(event.details.changedFields).toEqual([
                'firstName',
                'lastName',
            ]);
        });
    });

    describe('logEmailChangeRequest', () => {
        it('should log email change with domain information', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            await service.logEmailChangeRequest(
                'old@example.com',
                'new@gmail.com'
            );

            jest.advanceTimersByTime(5000);

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1]?.body as string);
            const event = body.events[0];

            expect(event.action).toBe('EMAIL_CHANGE_REQUEST');
            expect(event.details.oldEmailDomain).toBe('example.com');
            expect(event.details.newEmailDomain).toBe('gmail.com');
        });
    });

    describe('logSessionTermination', () => {
        it('should log single session termination', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            await service.logSessionTermination('session-123');

            jest.advanceTimersByTime(5000);

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1]?.body as string);
            const event = body.events[0];

            expect(event.action).toBe('SESSION_TERMINATE');
            expect(event.details.sessionId).toBe('session-123');
        });

        it('should log terminate all sessions', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            await service.logSessionTermination('', true);

            jest.advanceTimersByTime(5000);

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1]?.body as string);
            const event = body.events[0];

            expect(event.action).toBe('SESSION_TERMINATE_ALL');
            expect(event.details.sessionId).toBe('all');
        });
    });

    describe('logDataExportRequest', () => {
        it('should log data export request', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            await service.logDataExportRequest('full_export');

            jest.advanceTimersByTime(5000);

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1]?.body as string);
            const event = body.events[0];

            expect(event.action).toBe('DATA_EXPORT_REQUEST');
            expect(event.resource).toBe('user_data');
            expect(event.details.exportType).toBe('full_export');
        });
    });

    describe('logAccountDeletionRequest', () => {
        it('should log account deletion request with reason', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            await service.logAccountDeletionRequest(
                'Not satisfied with service'
            );

            jest.advanceTimersByTime(5000);

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1]?.body as string);
            const event = body.events[0];

            expect(event.action).toBe('ACCOUNT_DELETION_REQUEST');
            expect(event.details.reason).toBe('provided');
        });

        it('should log account deletion request without reason', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            await service.logAccountDeletionRequest();

            jest.advanceTimersByTime(5000);

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1]?.body as string);
            const event = body.events[0];

            expect(event.details.reason).toBe('not_provided');
        });
    });

    describe('logSensitiveAccess', () => {
        it('should log sensitive settings access', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            await service.logSensitiveAccess('security');

            jest.advanceTimersByTime(5000);

            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1]?.body as string);
            const event = body.events[0];

            expect(event.action).toBe('SENSITIVE_DATA_ACCESS');
            expect(event.resource).toBe('settings_security');
            expect(event.details.section).toBe('security');
        });
    });

    describe('flushEvents', () => {
        it('should send all pending events immediately', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
            } as Response);

            // Add some events
            await service.logEvent('PROFILE_UPDATE', 'user_profile');
            await service.logEvent(
                'NOTIFICATION_PREFERENCES_UPDATE',
                'user_preferences'
            );

            // Flush immediately
            await service.flushEvents();

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const callArgs = mockFetch.mock.calls[0];
            const body = JSON.parse(callArgs[1]?.body as string);
            expect(body.events).toHaveLength(2);
        });

        it('should handle send failures gracefully', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await service.logEvent('PROFILE_UPDATE', 'user_profile');

            // Should not throw
            await expect(service.flushEvents()).resolves.not.toThrow();
        });
    });

    describe('getUserAuditLog', () => {
        it('should fetch user audit log', async () => {
            const mockAuditLog = [
                {
                    id: '1',
                    action: 'PROFILE_UPDATE',
                    timestamp: '2023-01-01T00:00:00Z',
                    success: true,
                },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockAuditLog,
            } as Response);

            const result = await service.getUserAuditLog(10, 0);

            expect(result).toEqual(mockAuditLog);
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/audit/user-log?limit=10&offset=0',
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        });

        it('should handle fetch errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(service.getUserAuditLog()).rejects.toThrow(
                'Failed to load audit log'
            );
        });
    });

    describe('singleton instance', () => {
        it('should provide a singleton instance', () => {
            expect(auditService).toBeInstanceOf(AuditService);
        });
    });
});
