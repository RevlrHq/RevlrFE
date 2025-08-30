import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotificationGroups, type GroupJoinResult } from '../useNotificationGroups';
import { SignalRAuthService } from '@/lib/services/SignalRAuthService';
import type { UseSignalRResult } from '@/types/signalr';
import type { UserGroupType } from '@/types/notifications';
import { HubConnectionState } from '@microsoft/signalr';

// Mock the SignalR context
const mockSignalRContext: UseSignalRResult = {
    connection: null,
    connectionState: {
        state: HubConnectionState.Connected,
        reconnectAttempts: 0,
        isHealthy: true,
    },
    error: null,
    isConnected: true,
    isConnecting: false,
    isReconnecting: false,
    isDisconnected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    reconnect: jest.fn(),
    checkHealth: jest.fn(),
    measureLatency: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    invoke: jest.fn(),
    send: jest.fn(),
};

// Mock the SignalR provider
jest.mock('@/providers/SignalRProvider', () => ({
    useSignalRContext: () => mockSignalRContext,
}));

// Mock the SignalR auth service
jest.mock('@/lib/services/SignalRAuthService', () => ({
    SignalRAuthService: {
        getCurrentUserId: jest.fn(),
        getCurrentUserRole: jest.fn(),
        subscribeToAuthChanges: jest.fn(),
        isAuthenticated: jest.fn(),
    },
}));

const mockSignalRAuthService = SignalRAuthService as jest.Mocked<
    typeof SignalRAuthService
>;

describe('useNotificationGroups', () => {
    const mockUserId = 'test-user-123';
    const mockUserGroupId = `user_${mockUserId}`;
    const mockOrganizerGroupId = `organizer_${mockUserId}`;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset SignalR context to connected state
        mockSignalRContext.isConnected = true;
        mockSignalRContext.invoke = jest.fn().mockResolvedValue(undefined);

        // Setup default auth service mocks
        mockSignalRAuthService.getCurrentUserId.mockReturnValue(mockUserId);
        mockSignalRAuthService.getCurrentUserRole.mockReturnValue('user');
        mockSignalRAuthService.isAuthenticated.mockReturnValue(true);
        mockSignalRAuthService.subscribeToAuthChanges.mockReturnValue(() => {});
    });

    describe('initialization', () => {
        it('should initialize with empty state', () => {
            const { result } = renderHook(() =>
                useNotificationGroups({ autoJoinOnConnect: false })
            );

            expect(result.current).toBeTruthy();
            expect(result.current.joinedGroups).toEqual([]);
            expect(result.current.isJoiningGroups).toBe(false);
            expect(result.current.groupErrors).toEqual([]);
            expect(result.current.isInUserGroup).toBe(false);
            expect(result.current.isInOrganizerGroup).toBe(false);
            expect(result.current.hasActiveGroups).toBe(false);
        });

        it('should auto-join groups when connected and authenticated', async () => {
            const { result } = renderHook(() =>
                useNotificationGroups({ autoJoinOnConnect: true })
            );

            await waitFor(() => {
                expect(result.current).toBeTruthy();
            });

            await waitFor(() => {
                expect(mockSignalRContext.invoke).toHaveBeenCalledWith(
                    'JoinGroup',
                    mockUserGroupId
                );
            });

            expect(result.current.isInUserGroup).toBe(true);
        });

        it('should not auto-join when autoJoinOnConnect is false', () => {
            renderHook(() =>
                useNotificationGroups({ autoJoinOnConnect: false })
            );

            expect(mockSignalRContext.invoke).not.toHaveBeenCalled();
        });
    });

    describe('joinUserGroup', () => {
        it('should successfully join user group', async () => {
            const { result } = renderHook(() =>
                useNotificationGroups({ autoJoinOnConnect: false })
            );

            let joinResult: GroupJoinResult | undefined;
            await act(async () => {
                joinResult = await result.current.joinUserGroup();
            });

            expect(joinResult).toEqual({
                success: true,
                groupId: mockUserGroupId,
                groupType: 'User',
                connectionId: undefined,
            });
            expect(mockSignalRContext.invoke).toHaveBeenCalledWith(
                'JoinGroup',
                mockUserGroupId
            );
            expect(result.current.isInUserGroup).toBe(true);
            expect(result.current.joinedGroups).toHaveLength(1);
        });

        it('should fail when user is not authenticated', async () => {
            mockSignalRAuthService.getCurrentUserId.mockReturnValue(null);

            const { result } = renderHook(() => useNotificationGroups());

            let joinResult: GroupJoinResult | undefined;
            await act(async () => {
                joinResult = await result.current.joinUserGroup();
            });

            expect(joinResult).toEqual({
                success: false,
                groupId: '',
                groupType: 'User',
                error: 'Cannot join user group: user not authenticated',
                retryable: false,
            });
            expect(result.current.groupErrors).toHaveLength(1);
        });

        it('should fail when SignalR is not connected', async () => {
            mockSignalRContext.isConnected = false;

            const { result } = renderHook(() => useNotificationGroups());

            let joinResult: GroupJoinResult | undefined;
            await act(async () => {
                joinResult = await result.current.joinUserGroup();
            });

            expect(joinResult).toEqual({
                success: false,
                groupId: '',
                groupType: 'User',
                error: 'Cannot join user group: SignalR not connected',
                retryable: true,
            });
            expect(result.current.groupErrors).toHaveLength(1);
        });

        it('should handle SignalR invoke errors', async () => {
            const mockError = new Error('Hub method failed');
            mockSignalRContext.invoke = jest.fn().mockRejectedValue(mockError);

            const { result } = renderHook(() => useNotificationGroups());

            let joinResult: GroupJoinResult | undefined;
            await act(async () => {
                joinResult = await result.current.joinUserGroup();
            });

            expect(joinResult?.success).toBe(false);
            expect(joinResult?.error).toContain('Failed to join user group');
            expect(result.current.groupErrors).toHaveLength(1);
        });

        it('should retry on failure when retry is enabled', async () => {
            const mockError = new Error('Hub method failed');
            mockSignalRContext.invoke = jest
                .fn()
                .mockRejectedValueOnce(mockError)
                .mockResolvedValueOnce(undefined);

            const { result } = renderHook(() =>
                useNotificationGroups({
                    enableRetry: true,
                    retryIntervals: [100], // Short interval for testing
                })
            );

            let joinResult: GroupJoinResult | undefined;
            await act(async () => {
                joinResult = await result.current.joinUserGroup();
            });

            // Wait for retry
            await waitFor(
                () => {
                    expect(mockSignalRContext.invoke).toHaveBeenCalledTimes(2);
                },
                { timeout: 1000 }
            );

            expect(joinResult?.success).toBe(true);
        });
    });

    describe('joinOrganizerGroup', () => {
        beforeEach(() => {
            mockSignalRAuthService.getCurrentUserRole.mockReturnValue(
                'organizer'
            );
        });

        it('should successfully join organizer group', async () => {
            const { result } = renderHook(() => useNotificationGroups());

            let joinResult: GroupJoinResult | undefined;
            await act(async () => {
                joinResult = await result.current.joinOrganizerGroup();
            });

            expect(joinResult).toEqual({
                success: true,
                groupId: mockOrganizerGroupId,
                groupType: 'Organizer',
            });
            expect(mockSignalRContext.invoke).toHaveBeenCalledWith(
                'JoinGroup',
                mockOrganizerGroupId
            );
            expect(result.current.isInOrganizerGroup).toBe(true);
        });

        it('should fail when user is not an organizer', async () => {
            mockSignalRAuthService.getCurrentUserRole.mockReturnValue('user');

            const { result } = renderHook(() => useNotificationGroups());

            let joinResult: GroupJoinResult | undefined;
            await act(async () => {
                joinResult = await result.current.joinOrganizerGroup();
            });

            expect(joinResult).toEqual({
                success: false,
                groupId: '',
                groupType: 'Organizer',
                error: 'Cannot join organizer group: user is not an organizer',
                retryable: false,
            });
        });

        it('should work for admin users', async () => {
            mockSignalRAuthService.getCurrentUserRole.mockReturnValue('admin');

            const { result } = renderHook(() => useNotificationGroups());

            let joinResult: GroupJoinResult | undefined;
            await act(async () => {
                joinResult = await result.current.joinOrganizerGroup();
            });

            expect(joinResult?.success).toBe(true);
            expect(result.current.isInOrganizerGroup).toBe(true);
        });
    });

    describe('leaveGroup', () => {
        it('should successfully leave a group', async () => {
            const { result } = renderHook(() => useNotificationGroups());

            // First join a group
            await act(async () => {
                await result.current.joinUserGroup();
            });

            expect(result.current.joinedGroups).toHaveLength(1);

            // Then leave it
            let leaveResult: { success: boolean; groupId: string; error?: string } | undefined;
            await act(async () => {
                leaveResult = await result.current.leaveGroup(mockUserGroupId);
            });

            expect(leaveResult).toEqual({
                success: true,
                groupId: mockUserGroupId,
            });
            expect(mockSignalRContext.invoke).toHaveBeenCalledWith(
                'LeaveGroup',
                mockUserGroupId
            );
            expect(result.current.joinedGroups).toHaveLength(0);
        });

        it('should fail when SignalR is not connected', async () => {
            mockSignalRContext.isConnected = false;

            const { result } = renderHook(() => useNotificationGroups());

            let leaveResult: { success: boolean; groupId: string; error?: string } | undefined;
            await act(async () => {
                leaveResult = await result.current.leaveGroup(mockUserGroupId);
            });

            expect(leaveResult).toEqual({
                success: false,
                groupId: mockUserGroupId,
                error: 'Cannot leave group: SignalR not connected',
            });
        });
    });

    describe('leaveAllGroups', () => {
        it('should leave all active groups', async () => {
            mockSignalRAuthService.getCurrentUserRole.mockReturnValue(
                'organizer'
            );

            const { result } = renderHook(() => useNotificationGroups());

            // Join both user and organizer groups
            await act(async () => {
                await result.current.joinUserGroup();
                await result.current.joinOrganizerGroup();
            });

            expect(result.current.joinedGroups).toHaveLength(2);

            // Leave all groups
            await act(async () => {
                await result.current.leaveAllGroups();
            });

            expect(mockSignalRContext.invoke).toHaveBeenCalledWith(
                'LeaveGroup',
                mockUserGroupId
            );
            expect(mockSignalRContext.invoke).toHaveBeenCalledWith(
                'LeaveGroup',
                mockOrganizerGroupId
            );
            expect(result.current.joinedGroups).toHaveLength(0);
        });
    });

    describe('rejoinAllGroups', () => {
        it('should rejoin appropriate groups based on user role', async () => {
            mockSignalRAuthService.getCurrentUserRole.mockReturnValue(
                'organizer'
            );

            const { result } = renderHook(() => useNotificationGroups());

            await act(async () => {
                await result.current.rejoinAllGroups();
            });

            expect(mockSignalRContext.invoke).toHaveBeenCalledWith(
                'JoinGroup',
                mockUserGroupId
            );
            expect(mockSignalRContext.invoke).toHaveBeenCalledWith(
                'JoinGroup',
                mockOrganizerGroupId
            );
            expect(result.current.isInUserGroup).toBe(true);
            expect(result.current.isInOrganizerGroup).toBe(true);
        });

        it('should only join user group for regular users', async () => {
            mockSignalRAuthService.getCurrentUserRole.mockReturnValue('user');

            const { result } = renderHook(() => useNotificationGroups());

            await act(async () => {
                await result.current.rejoinAllGroups();
            });

            expect(mockSignalRContext.invoke).toHaveBeenCalledWith(
                'JoinGroup',
                mockUserGroupId
            );
            expect(mockSignalRContext.invoke).not.toHaveBeenCalledWith(
                'JoinGroup',
                mockOrganizerGroupId
            );
            expect(result.current.isInUserGroup).toBe(true);
            expect(result.current.isInOrganizerGroup).toBe(false);
        });

        it('should not rejoin when user is not authenticated', async () => {
            mockSignalRAuthService.getCurrentUserId.mockReturnValue(null);

            const { result } = renderHook(() => useNotificationGroups());

            await act(async () => {
                await result.current.rejoinAllGroups();
            });

            expect(mockSignalRContext.invoke).not.toHaveBeenCalled();
            expect(result.current.joinedGroups).toHaveLength(0);
        });
    });

    describe('connection state handling', () => {
        it('should mark groups as inactive when disconnected', async () => {
            const { result } = renderHook(() => useNotificationGroups());

            // Join a group while connected
            await act(async () => {
                await result.current.joinUserGroup();
            });

            expect(result.current.joinedGroups[0].isActive).toBe(true);

            // Simulate disconnection
            act(() => {
                mockSignalRContext.isConnected = false;
            });

            await waitFor(() => {
                expect(result.current.joinedGroups[0].isActive).toBe(false);
            });
        });

        it('should handle reconnection with auto-rejoin', async () => {
            const mockOnHandler = jest.fn();
            const mockOffHandler = jest.fn();
            mockSignalRContext.on = mockOnHandler;
            mockSignalRContext.off = mockOffHandler;

            renderHook(() =>
                useNotificationGroups({ autoRejoinOnReconnect: true })
            );

            // Verify reconnection handler is set up
            expect(mockOnHandler).toHaveBeenCalledWith(
                'Reconnected',
                expect.any(Function)
            );

            // Simulate reconnection by calling the handler
            const reconnectedHandler = mockOnHandler.mock.calls[0][1];
            await act(async () => {
                reconnectedHandler();
            });

            expect(mockSignalRContext.invoke).toHaveBeenCalledWith(
                'JoinGroup',
                mockUserGroupId
            );
        });
    });

    describe('authentication state changes', () => {
        it('should handle user logout', async () => {
            let authChangeCallback: (
                isAuthenticated: boolean,
                userId: string | null
            ) => void;
            mockSignalRAuthService.subscribeToAuthChanges.mockImplementation(
                (callback) => {
                    authChangeCallback = callback;
                    return () => {};
                }
            );

            const { result } = renderHook(() => useNotificationGroups());

            // Join a group
            await act(async () => {
                await result.current.joinUserGroup();
            });

            expect(result.current.joinedGroups).toHaveLength(1);

            // Simulate user logout
            await act(async () => {
                authChangeCallback!(false, null);
            });

            expect(result.current.joinedGroups).toHaveLength(0);
        });

        it('should handle user login/change', async () => {
            let authChangeCallback: (
                isAuthenticated: boolean,
                userId: string | null
            ) => void;
            mockSignalRAuthService.subscribeToAuthChanges.mockImplementation(
                (callback) => {
                    authChangeCallback = callback;
                    return () => {};
                }
            );

            renderHook(() => useNotificationGroups());

            // Simulate user login
            await act(async () => {
                authChangeCallback!(true, mockUserId);
            });

            expect(mockSignalRContext.invoke).toHaveBeenCalledWith(
                'JoinGroup',
                mockUserGroupId
            );
        });
    });

    describe('error handling', () => {
        it('should clear group errors', async () => {
            mockSignalRContext.isConnected = false;

            const { result } = renderHook(() => useNotificationGroups());

            // Generate an error
            await act(async () => {
                await result.current.joinUserGroup();
            });

            expect(result.current.groupErrors).toHaveLength(1);

            // Clear errors
            act(() => {
                result.current.clearGroupErrors();
            });

            expect(result.current.groupErrors).toHaveLength(0);
        });

        it('should get group error by type', async () => {
            mockSignalRContext.isConnected = false;

            const { result } = renderHook(() => useNotificationGroups());

            // Generate an error
            await act(async () => {
                await result.current.joinUserGroup();
            });

            const userError = result.current.getGroupError(
                'User' as UserGroupType
            );
            expect(userError).toBeTruthy();
            expect(userError?.message).toContain('user');

            const organizerError = result.current.getGroupError(
                'Organizer' as UserGroupType
            );
            expect(organizerError).toBeNull();
        });
    });

    describe('computed state helpers', () => {
        it('should correctly compute group membership status', async () => {
            mockSignalRAuthService.getCurrentUserRole.mockReturnValue(
                'organizer'
            );

            const { result } = renderHook(() => useNotificationGroups());

            expect(result.current.isInUserGroup).toBe(false);
            expect(result.current.isInOrganizerGroup).toBe(false);
            expect(result.current.hasActiveGroups).toBe(false);

            // Join user group
            await act(async () => {
                await result.current.joinUserGroup();
            });

            expect(result.current.isInUserGroup).toBe(true);
            expect(result.current.isInOrganizerGroup).toBe(false);
            expect(result.current.hasActiveGroups).toBe(true);

            // Join organizer group
            await act(async () => {
                await result.current.joinOrganizerGroup();
            });

            expect(result.current.isInUserGroup).toBe(true);
            expect(result.current.isInOrganizerGroup).toBe(true);
            expect(result.current.hasActiveGroups).toBe(true);
        });
    });

    describe('retry mechanism', () => {
        it('should respect max retry attempts', async () => {
            const mockError = new Error('Hub method failed');
            mockSignalRContext.invoke = jest.fn().mockRejectedValue(mockError);

            const { result } = renderHook(() =>
                useNotificationGroups({
                    enableRetry: true,
                    maxRetryAttempts: 2,
                    retryIntervals: [50, 100], // Short intervals for testing
                })
            );

            let joinResult: GroupJoinResult | undefined;
            await act(async () => {
                joinResult = await result.current.joinUserGroup();
            });

            // Wait for all retries to complete
            await waitFor(
                () => {
                    expect(mockSignalRContext.invoke).toHaveBeenCalledTimes(3); // Initial + 2 retries
                },
                { timeout: 1000 }
            );

            expect(joinResult?.success).toBe(false);
            expect(joinResult?.retryable).toBe(false);
        });

        it('should succeed on retry', async () => {
            const mockError = new Error('Hub method failed');
            mockSignalRContext.invoke = jest
                .fn()
                .mockRejectedValueOnce(mockError)
                .mockResolvedValueOnce(undefined);

            const { result } = renderHook(() =>
                useNotificationGroups({
                    enableRetry: true,
                    retryIntervals: [50], // Short interval for testing
                })
            );

            let joinResult: GroupJoinResult | undefined;
            await act(async () => {
                joinResult = await result.current.joinUserGroup();
            });

            // Wait for retry to complete
            await waitFor(
                () => {
                    expect(mockSignalRContext.invoke).toHaveBeenCalledTimes(2);
                },
                { timeout: 500 }
            );

            expect(joinResult?.success).toBe(true);
        });
    });

    describe('cleanup', () => {
        it('should clean up retry timeouts on unmount', () => {
            const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

            const { unmount } = renderHook(() => useNotificationGroups());

            unmount();

            // Verify cleanup was called (exact number depends on implementation)
            expect(clearTimeoutSpy).toHaveBeenCalled();

            clearTimeoutSpy.mockRestore();
        });
    });
});
