import { useState, useEffect, useCallback, useRef } from 'react';
import { useSignalRContext } from '@/providers/SignalRProvider';
import { SignalRAuthService } from '@/lib/services/SignalRAuthService';
import type { SignalRError, SignalRErrorType } from '@/types/signalr';
import type { UserGroupType } from '@/types/notifications';

// Group management interfaces
export interface NotificationGroup {
    groupId: string;
    groupType: UserGroupType;
    userId: string;
    joinedAt: Date;
    isActive: boolean;
    connectionId?: string;
    lastActivity?: Date;
}

export interface GroupJoinResult {
    success: boolean;
    groupId: string;
    groupType: UserGroupType;
    error?: string;
    retryable?: boolean;
    connectionId?: string;
}

export interface GroupLeaveResult {
    success: boolean;
    groupId: string;
    error?: string;
}

export interface RoleBasedGroupAssignment {
    userId: string;
    userRole: string | null;
    requiredGroups: Array<{ groupId: string; groupType: UserGroupType }>;
    currentGroups: NotificationGroup[];
    groupsToJoin: Array<{ groupId: string; groupType: UserGroupType }>;
    groupsToLeave: string[];
}

export interface MultiConnectionInfo {
    connectionId: string;
    userId: string;
    joinedGroups: string[];
    lastActivity: Date;
    isActive: boolean;
}

export interface UseNotificationGroupsOptions {
    autoJoinOnConnect?: boolean;
    autoRejoinOnReconnect?: boolean;
    enableRetry?: boolean;
    maxRetryAttempts?: number;
    retryIntervals?: number[];
    enableLogging?: boolean;
}

export interface UseNotificationGroupsResult {
    // Group state
    joinedGroups: NotificationGroup[];
    isJoiningGroups: boolean;
    groupErrors: SignalRError[];

    // Group management actions
    joinUserGroup: () => Promise<GroupJoinResult>;
    joinOrganizerGroup: () => Promise<GroupJoinResult>;
    leaveGroup: (groupId: string) => Promise<GroupLeaveResult>;
    leaveAllGroups: () => Promise<void>;
    rejoinAllGroups: () => Promise<void>;

    // Role-based group management
    assignGroupsForRole: (
        userId: string,
        userRole: string | null
    ) => Promise<RoleBasedGroupAssignment>;
    syncGroupsWithRole: () => Promise<void>;
    handleRoleChange: (newRole: string | null) => Promise<void>;

    // Multiple connection handling
    handleConnectionChange: (connectionId: string) => Promise<void>;
    getConnectionInfo: () => MultiConnectionInfo | null;

    // Group status helpers
    isInUserGroup: boolean;
    isInOrganizerGroup: boolean;
    hasActiveGroups: boolean;
    getGroupsByType: (groupType: UserGroupType) => NotificationGroup[];

    // Error handling
    clearGroupErrors: () => void;
    getGroupError: (groupType: UserGroupType) => SignalRError | null;
}

// Default configuration
const DEFAULT_OPTIONS: Required<UseNotificationGroupsOptions> = {
    autoJoinOnConnect: true,
    autoRejoinOnReconnect: true,
    enableRetry: true,
    maxRetryAttempts: 3,
    retryIntervals: [1000, 3000, 5000], // 1s, 3s, 5s
    enableLogging: process.env.NODE_ENV === 'development',
};

// Helper function to create group errors
const createGroupError = (
    type: SignalRErrorType,
    message: string,
    originalError?: Error,
    retryable: boolean = true
): SignalRError => ({
    type,
    message,
    originalError,
    timestamp: new Date(),
    retryable,
});

// Helper function to determine user groups based on role
const determineUserGroups = (
    userId: string,
    userRole: string | null
): {
    userGroupId: string;
    organizerGroupId?: string;
    allUserGroupId: string;
} => {
    const userGroupId = `user_${userId}`;
    const allUserGroupId = 'all_users'; // Global group for all authenticated users
    const organizerGroupId =
        userRole === 'organizer' || userRole === 'admin'
            ? `organizer_${userId}`
            : undefined;

    return { userGroupId, organizerGroupId, allUserGroupId };
};

// Helper function to determine which groups a user should join based on role
const getRequiredGroupsForRole = (
    userId: string,
    userRole: string | null
): Array<{ groupId: string; groupType: UserGroupType }> => {
    const { userGroupId, organizerGroupId, allUserGroupId } =
        determineUserGroups(userId, userRole);
    const groups: Array<{ groupId: string; groupType: UserGroupType }> = [
        { groupId: allUserGroupId, groupType: 'User' as UserGroupType },
        { groupId: userGroupId, groupType: 'User' as UserGroupType },
    ];

    if (organizerGroupId) {
        groups.push({
            groupId: organizerGroupId,
            groupType: 'Organizer' as UserGroupType,
        });
    }

    return groups;
};

/**
 * Hook for managing SignalR notification group membership
 * Handles automatic group joining based on user role and connection state
 */
export const useNotificationGroups = (
    options: UseNotificationGroupsOptions = {}
): UseNotificationGroupsResult => {
    const finalOptions = { ...DEFAULT_OPTIONS, ...options };

    // Get SignalR context
    const signalR = useSignalRContext();

    // State management
    const [joinedGroups, setJoinedGroups] = useState<NotificationGroup[]>([]);
    const [isJoiningGroups, setIsJoiningGroups] = useState(false);
    const [groupErrors, setGroupErrors] = useState<SignalRError[]>([]);
    const [currentRole, setCurrentRole] = useState<string | null>(null);

    // Refs for cleanup and retry management
    const retryTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const retryAttemptsRef = useRef<Map<string, number>>(new Map());
    const isJoiningRef = useRef(false);
    const connectionInfoRef = useRef<MultiConnectionInfo | null>(null);

    // Helper function to log messages
    const log = useCallback(
        (message: string, ...args: unknown[]) => {
            if (finalOptions.enableLogging) {
                console.log(`[NotificationGroups] ${message}`, ...args);
            }
        },
        [finalOptions.enableLogging]
    );

    // Helper function to add group error
    const addGroupError = useCallback((error: SignalRError) => {
        setGroupErrors((prev) => [...prev, error]);
    }, []);

    // Helper function to clear group errors
    const clearGroupErrors = useCallback(() => {
        setGroupErrors([]);
    }, []);

    // Helper function to get group error by type
    const getGroupError = useCallback(
        (groupType: UserGroupType): SignalRError | null => {
            return (
                groupErrors.find((error) =>
                    error.message.includes(groupType.toLowerCase())
                ) || null
            );
        },
        [groupErrors]
    );

    // Helper function to update joined groups
    const updateJoinedGroups = useCallback(
        (
            groupId: string,
            groupType: UserGroupType,
            isActive: boolean,
            connectionId?: string
        ) => {
            const userId = SignalRAuthService.getCurrentUserId();
            if (!userId) return;

            setJoinedGroups((prev) => {
                const existingIndex = prev.findIndex(
                    (g) => g.groupId === groupId
                );

                if (existingIndex >= 0) {
                    // Update existing group
                    const updated = [...prev];
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        isActive,
                        connectionId:
                            connectionId || updated[existingIndex].connectionId,
                        lastActivity: new Date(),
                    };
                    return updated;
                } else if (isActive) {
                    // Add new group
                    return [
                        ...prev,
                        {
                            groupId,
                            groupType,
                            userId,
                            joinedAt: new Date(),
                            isActive: true,
                            connectionId,
                            lastActivity: new Date(),
                        },
                    ];
                }

                return prev;
            });
        },
        []
    );

    // Helper function to remove group
    const removeGroup = useCallback((groupId: string) => {
        setJoinedGroups((prev) => prev.filter((g) => g.groupId !== groupId));
    }, []);

    // Helper function to retry group join with exponential backoff
    const retryGroupJoin = useCallback(
        async (
            groupId: string,
            groupType: UserGroupType,
            joinFunction: () => Promise<GroupJoinResult>
        ): Promise<GroupJoinResult> => {
            const currentAttempts = retryAttemptsRef.current.get(groupId) || 0;

            if (currentAttempts >= finalOptions.maxRetryAttempts) {
                const error = createGroupError(
                    'hub_method' as SignalRErrorType,
                    `Failed to join ${groupType} group after ${finalOptions.maxRetryAttempts} attempts`,
                    undefined,
                    false
                );
                addGroupError(error);
                return {
                    success: false,
                    groupId,
                    groupType,
                    error: error.message,
                    retryable: false,
                };
            }

            const retryDelay =
                finalOptions.retryIntervals[
                    Math.min(
                        currentAttempts,
                        finalOptions.retryIntervals.length - 1
                    )
                ];

            log(
                `Retrying ${groupType} group join in ${retryDelay}ms (attempt ${currentAttempts + 1})`
            );

            return new Promise((resolve) => {
                const timeoutId = setTimeout(async () => {
                    retryTimeoutsRef.current.delete(groupId);
                    retryAttemptsRef.current.set(groupId, currentAttempts + 1);

                    try {
                        const result = await joinFunction();
                        if (result.success) {
                            retryAttemptsRef.current.delete(groupId);
                        }
                        resolve(result);
                    } catch (error) {
                        resolve({
                            success: false,
                            groupId,
                            groupType,
                            error: (error as Error).message,
                            retryable: true,
                        });
                    }
                }, retryDelay);

                retryTimeoutsRef.current.set(groupId, timeoutId);
            });
        },
        [
            finalOptions.maxRetryAttempts,
            finalOptions.retryIntervals,
            log,
            addGroupError,
        ]
    );

    // Join user-specific group
    const joinUserGroup = useCallback(async (): Promise<GroupJoinResult> => {
        const userId = SignalRAuthService.getCurrentUserId();
        if (!userId) {
            const error = createGroupError(
                'authentication' as SignalRErrorType,
                'Cannot join user group: user not authenticated',
                undefined,
                false
            );
            addGroupError(error);
            return {
                success: false,
                groupId: '',
                groupType: 'User' as UserGroupType,
                error: error.message,
                retryable: false,
            };
        }

        if (!signalR.isConnected) {
            const error = createGroupError(
                'connection' as SignalRErrorType,
                'Cannot join user group: SignalR not connected',
                undefined,
                true
            );
            addGroupError(error);
            return {
                success: false,
                groupId: '',
                groupType: 'User' as UserGroupType,
                error: error.message,
                retryable: true,
            };
        }

        const { userGroupId } = determineUserGroups(
            userId,
            SignalRAuthService.getCurrentUserRole()
        );

        try {
            log(`Joining user group: ${userGroupId}`);
            await signalR.invoke('JoinGroup', userGroupId);

            const connectionId = signalR.connectionState.connectionId;
            updateJoinedGroups(
                userGroupId,
                'User' as UserGroupType,
                true,
                connectionId
            );
            log(`Successfully joined user group: ${userGroupId}`);

            return {
                success: true,
                groupId: userGroupId,
                groupType: 'User' as UserGroupType,
                connectionId,
            };
        } catch (error) {
            const signalRError = createGroupError(
                'hub_method' as SignalRErrorType,
                `Failed to join user group: ${(error as Error).message}`,
                error as Error,
                true
            );
            addGroupError(signalRError);

            log(`Failed to join user group: ${(error as Error).message}`);

            // Retry if enabled
            if (finalOptions.enableRetry) {
                return await retryGroupJoin(
                    userGroupId,
                    'User' as UserGroupType,
                    joinUserGroup
                );
            }

            return {
                success: false,
                groupId: userGroupId,
                groupType: 'User' as UserGroupType,
                error: signalRError.message,
                retryable: true,
            };
        }
    }, [
        signalR,
        updateJoinedGroups,
        log,
        addGroupError,
        finalOptions.enableRetry,
        retryGroupJoin,
    ]);

    // Join organizer-specific group
    const joinOrganizerGroup =
        useCallback(async (): Promise<GroupJoinResult> => {
            const userId = SignalRAuthService.getCurrentUserId();
            const userRole = SignalRAuthService.getCurrentUserRole();

            if (!userId) {
                const error = createGroupError(
                    'authentication' as SignalRErrorType,
                    'Cannot join organizer group: user not authenticated',
                    undefined,
                    false
                );
                addGroupError(error);
                return {
                    success: false,
                    groupId: '',
                    groupType: 'Organizer' as UserGroupType,
                    error: error.message,
                    retryable: false,
                };
            }

            if (userRole !== 'organizer' && userRole !== 'admin') {
                const error = createGroupError(
                    'authentication' as SignalRErrorType,
                    'Cannot join organizer group: user is not an organizer',
                    undefined,
                    false
                );
                addGroupError(error);
                return {
                    success: false,
                    groupId: '',
                    groupType: 'Organizer' as UserGroupType,
                    error: error.message,
                    retryable: false,
                };
            }

            if (!signalR.isConnected) {
                const error = createGroupError(
                    'connection' as SignalRErrorType,
                    'Cannot join organizer group: SignalR not connected',
                    undefined,
                    true
                );
                addGroupError(error);
                return {
                    success: false,
                    groupId: '',
                    groupType: 'Organizer' as UserGroupType,
                    error: error.message,
                    retryable: true,
                };
            }

            const { organizerGroupId } = determineUserGroups(userId, userRole);
            if (!organizerGroupId) {
                const error = createGroupError(
                    'authentication' as SignalRErrorType,
                    'Cannot determine organizer group ID',
                    undefined,
                    false
                );
                addGroupError(error);
                return {
                    success: false,
                    groupId: '',
                    groupType: 'Organizer' as UserGroupType,
                    error: error.message,
                    retryable: false,
                };
            }

            try {
                log(`Joining organizer group: ${organizerGroupId}`);
                await signalR.invoke('JoinGroup', organizerGroupId);

                const connectionId = signalR.connectionState.connectionId;
                updateJoinedGroups(
                    organizerGroupId,
                    'Organizer' as UserGroupType,
                    true,
                    connectionId
                );
                log(`Successfully joined organizer group: ${organizerGroupId}`);

                return {
                    success: true,
                    groupId: organizerGroupId,
                    groupType: 'Organizer' as UserGroupType,
                    connectionId,
                };
            } catch (error) {
                const signalRError = createGroupError(
                    'hub_method' as SignalRErrorType,
                    `Failed to join organizer group: ${(error as Error).message}`,
                    error as Error,
                    true
                );
                addGroupError(signalRError);

                log(
                    `Failed to join organizer group: ${(error as Error).message}`
                );

                // Retry if enabled
                if (finalOptions.enableRetry) {
                    return await retryGroupJoin(
                        organizerGroupId,
                        'Organizer' as UserGroupType,
                        joinOrganizerGroup
                    );
                }

                return {
                    success: false,
                    groupId: organizerGroupId,
                    groupType: 'Organizer' as UserGroupType,
                    error: signalRError.message,
                    retryable: true,
                };
            }
        }, [
            signalR,
            updateJoinedGroups,
            log,
            addGroupError,
            finalOptions.enableRetry,
            retryGroupJoin,
        ]);

    // Leave a specific group
    const leaveGroup = useCallback(
        async (groupId: string): Promise<GroupLeaveResult> => {
            if (!signalR.isConnected) {
                const error = createGroupError(
                    'connection' as SignalRErrorType,
                    'Cannot leave group: SignalR not connected',
                    undefined,
                    true
                );
                addGroupError(error);
                return {
                    success: false,
                    groupId,
                    error: error.message,
                };
            }

            try {
                log(`Leaving group: ${groupId}`);
                await signalR.invoke('LeaveGroup', groupId);

                removeGroup(groupId);
                log(`Successfully left group: ${groupId}`);

                return {
                    success: true,
                    groupId,
                };
            } catch (error) {
                const signalRError = createGroupError(
                    'hub_method' as SignalRErrorType,
                    `Failed to leave group: ${(error as Error).message}`,
                    error as Error,
                    true
                );
                addGroupError(signalRError);

                log(`Failed to leave group: ${(error as Error).message}`);

                return {
                    success: false,
                    groupId,
                    error: signalRError.message,
                };
            }
        },
        [signalR, removeGroup, log, addGroupError]
    );

    // Leave all groups
    const leaveAllGroups = useCallback(async (): Promise<void> => {
        log('Leaving all groups');
        const currentGroups = [...joinedGroups];

        for (const group of currentGroups) {
            if (group.isActive) {
                await leaveGroup(group.groupId);
            }
        }

        // Clear any remaining groups from state
        setJoinedGroups([]);
        log('Left all groups');
    }, [joinedGroups, leaveGroup, log]);

    // Rejoin all appropriate groups
    const rejoinAllGroups = useCallback(async (): Promise<void> => {
        if (isJoiningRef.current) {
            log('Group joining already in progress, skipping rejoin');
            return;
        }

        isJoiningRef.current = true;
        setIsJoiningGroups(true);

        try {
            log('Rejoining all appropriate groups');
            const userId = SignalRAuthService.getCurrentUserId();
            const userRole = SignalRAuthService.getCurrentUserRole();

            if (!userId) {
                log('Cannot rejoin groups: user not authenticated');
                return;
            }

            // Clear existing groups
            setJoinedGroups([]);

            // Join user group
            const userResult = await joinUserGroup();
            if (!userResult.success) {
                log(`Failed to rejoin user group: ${userResult.error}`);
            }

            // Join organizer group if applicable
            if (userRole === 'organizer' || userRole === 'admin') {
                const organizerResult = await joinOrganizerGroup();
                if (!organizerResult.success) {
                    log(
                        `Failed to rejoin organizer group: ${organizerResult.error}`
                    );
                }
            }

            log('Completed rejoining groups');
        } catch (error) {
            log(`Error during group rejoin: ${(error as Error).message}`);
            const signalRError = createGroupError(
                'hub_method' as SignalRErrorType,
                `Failed to rejoin groups: ${(error as Error).message}`,
                error as Error,
                true
            );
            addGroupError(signalRError);
        } finally {
            setIsJoiningGroups(false);
            isJoiningRef.current = false;
        }
    }, [joinUserGroup, joinOrganizerGroup, log, addGroupError]);

    // Role-based group assignment
    const assignGroupsForRole = useCallback(
        async (
            userId: string,
            userRole: string | null
        ): Promise<RoleBasedGroupAssignment> => {
            const requiredGroups = getRequiredGroupsForRole(userId, userRole);
            const currentGroups = joinedGroups.filter(
                (g) => g.userId === userId
            );

            const currentGroupIds = new Set(
                currentGroups.map((g) => g.groupId)
            );
            const requiredGroupIds = new Set(
                requiredGroups.map((g) => g.groupId)
            );

            const groupsToJoin = requiredGroups.filter(
                (g) => !currentGroupIds.has(g.groupId)
            );
            const groupsToLeave = currentGroups
                .filter((g) => !requiredGroupIds.has(g.groupId))
                .map((g) => g.groupId);

            return {
                userId,
                userRole,
                requiredGroups,
                currentGroups,
                groupsToJoin,
                groupsToLeave,
            };
        },
        [joinedGroups]
    );

    // Sync groups with current user role
    const syncGroupsWithRole = useCallback(async (): Promise<void> => {
        const userId = SignalRAuthService.getCurrentUserId();
        const userRole = SignalRAuthService.getCurrentUserRole();

        if (!userId || !signalR.isConnected) {
            log(
                'Cannot sync groups: user not authenticated or SignalR not connected'
            );
            return;
        }

        try {
            log(`Syncing groups for user ${userId} with role ${userRole}`);
            const assignment = await assignGroupsForRole(userId, userRole);

            // Leave groups that are no longer needed
            for (const groupId of assignment.groupsToLeave) {
                log(`Leaving unnecessary group: ${groupId}`);
                await leaveGroup(groupId);
            }

            // Join required groups
            for (const group of assignment.groupsToJoin) {
                log(
                    `Joining required group: ${group.groupId} (${group.groupType})`
                );

                if (group.groupType === ('User' as UserGroupType)) {
                    if (
                        group.groupId.startsWith('user_') ||
                        group.groupId === 'all_users'
                    ) {
                        await joinUserGroup();
                    }
                } else if (group.groupType === ('Organizer' as UserGroupType)) {
                    await joinOrganizerGroup();
                }
            }

            setCurrentRole(userRole);
            log('Group synchronization completed');
        } catch (error) {
            log(`Error during group sync: ${(error as Error).message}`);
            const signalRError = createGroupError(
                'hub_method' as SignalRErrorType,
                `Failed to sync groups with role: ${(error as Error).message}`,
                error as Error,
                true
            );
            addGroupError(signalRError);
        }
    }, [
        signalR.isConnected,
        assignGroupsForRole,
        leaveGroup,
        joinUserGroup,
        joinOrganizerGroup,
        log,
        addGroupError,
    ]);

    // Handle role change
    const handleRoleChange = useCallback(
        async (newRole: string | null): Promise<void> => {
            if (currentRole === newRole) {
                log(`Role unchanged: ${newRole}`);
                return;
            }

            log(`Handling role change from ${currentRole} to ${newRole}`);

            try {
                await syncGroupsWithRole();
                log(
                    `Role change handled successfully: ${currentRole} -> ${newRole}`
                );
            } catch (error) {
                log(`Error handling role change: ${(error as Error).message}`);
                const signalRError = createGroupError(
                    'hub_method' as SignalRErrorType,
                    `Failed to handle role change: ${(error as Error).message}`,
                    error as Error,
                    true
                );
                addGroupError(signalRError);
            }
        },
        [currentRole, syncGroupsWithRole, log, addGroupError]
    );

    // Handle connection change (for multiple connections)
    const handleConnectionChange = useCallback(
        async (connectionId: string): Promise<void> => {
            log(`Handling connection change: ${connectionId}`);

            const userId = SignalRAuthService.getCurrentUserId();
            if (!userId) {
                log('Cannot handle connection change: user not authenticated');
                return;
            }

            // Update connection info
            connectionInfoRef.current = {
                connectionId,
                userId,
                joinedGroups: joinedGroups
                    .filter((g) => g.isActive)
                    .map((g) => g.groupId),
                lastActivity: new Date(),
                isActive: true,
            };

            // Update all active groups with new connection ID
            setJoinedGroups((prev) =>
                prev.map((group) => ({
                    ...group,
                    connectionId: group.isActive
                        ? connectionId
                        : group.connectionId,
                    lastActivity: group.isActive
                        ? new Date()
                        : group.lastActivity,
                }))
            );

            log(`Connection change handled: ${connectionId}`);
        },
        [joinedGroups, log]
    );

    // Get connection info
    const getConnectionInfo = useCallback((): MultiConnectionInfo | null => {
        return connectionInfoRef.current;
    }, []);

    // Get groups by type
    const getGroupsByType = useCallback(
        (groupType: UserGroupType): NotificationGroup[] => {
            return joinedGroups.filter(
                (group) => group.groupType === groupType
            );
        },
        [joinedGroups]
    );

    // Auto-join groups on connection
    useEffect(() => {
        if (
            finalOptions.autoJoinOnConnect &&
            signalR.isConnected &&
            !isJoiningRef.current &&
            joinedGroups.length === 0
        ) {
            rejoinAllGroups();
        }
    }, [
        signalR.isConnected,
        finalOptions.autoJoinOnConnect,
        joinedGroups.length,
        rejoinAllGroups,
    ]);

    // Handle reconnection
    useEffect(() => {
        if (finalOptions.autoRejoinOnReconnect && signalR.isConnected) {
            const handleReconnected = () => {
                log('SignalR reconnected, rejoining groups');
                rejoinAllGroups();
            };

            // Listen for reconnection events
            signalR.on('Reconnected', handleReconnected);

            return () => {
                signalR.off('Reconnected', handleReconnected);
            };
        }
    }, [signalR, finalOptions.autoRejoinOnReconnect, rejoinAllGroups, log]);

    // Handle disconnection cleanup
    useEffect(() => {
        if (!signalR.isConnected) {
            // Mark all groups as inactive when disconnected
            setJoinedGroups((prev) =>
                prev.map((group) => ({ ...group, isActive: false }))
            );

            // Clear retry timeouts
            retryTimeoutsRef.current.forEach((timeout) =>
                clearTimeout(timeout)
            );
            retryTimeoutsRef.current.clear();
            retryAttemptsRef.current.clear();
        }
    }, [signalR.isConnected]);

    // Handle authentication state changes
    useEffect(() => {
        const unsubscribe = SignalRAuthService.subscribeToAuthChanges(
            async (isAuthenticated, userId) => {
                if (!isAuthenticated) {
                    log('User logged out, leaving all groups');
                    await leaveAllGroups();
                    setCurrentRole(null);
                } else if (userId && signalR.isConnected) {
                    log(
                        'User authentication changed, syncing groups with role'
                    );
                    await syncGroupsWithRole();
                }
            }
        );

        return unsubscribe;
    }, [signalR.isConnected, leaveAllGroups, syncGroupsWithRole, log]);

    // Handle connection ID changes
    useEffect(() => {
        const connectionId = signalR.connectionState.connectionId;
        if (connectionId && signalR.isConnected) {
            handleConnectionChange(connectionId);
        }
    }, [
        signalR.connectionState.connectionId,
        signalR.isConnected,
        handleConnectionChange,
    ]);

    // Monitor role changes
    useEffect(() => {
        const userRole = SignalRAuthService.getCurrentUserRole();
        if (userRole !== currentRole && signalR.isConnected) {
            handleRoleChange(userRole);
        }
    }, [currentRole, signalR.isConnected, handleRoleChange]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Clear retry timeouts
            retryTimeoutsRef.current.forEach((timeout) =>
                clearTimeout(timeout)
            );
            retryTimeoutsRef.current.clear();
            retryAttemptsRef.current.clear();
        };
    }, []);

    // Computed state helpers
    const isInUserGroup = joinedGroups.some(
        (group) =>
            group.groupType === ('User' as UserGroupType) && group.isActive
    );
    const isInOrganizerGroup = joinedGroups.some(
        (group) =>
            group.groupType === ('Organizer' as UserGroupType) && group.isActive
    );
    const hasActiveGroups = joinedGroups.some((group) => group.isActive);

    return {
        // Group state
        joinedGroups,
        isJoiningGroups,
        groupErrors,

        // Group management actions
        joinUserGroup,
        joinOrganizerGroup,
        leaveGroup,
        leaveAllGroups,
        rejoinAllGroups,

        // Role-based group management
        assignGroupsForRole,
        syncGroupsWithRole,
        handleRoleChange,

        // Multiple connection handling
        handleConnectionChange,
        getConnectionInfo,

        // Group status helpers
        isInUserGroup,
        isInOrganizerGroup,
        hasActiveGroups,
        getGroupsByType,

        // Error handling
        clearGroupErrors,
        getGroupError,
    };
};
