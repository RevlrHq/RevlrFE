/**
 * useSessionManager Hook
 * Manages user sessions with real-time updates and error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { SecurityService } from '../../services/SecurityService';
import type { UserSession } from '../types';

interface UseSessionManagerReturn {
    sessions: UserSession[];
    isLoading: boolean;
    error: string | null;
    terminateSession: (sessionId: string) => Promise<void>;
    terminateAllSessions: () => Promise<void>;
    refreshSessions: () => Promise<void>;
}

// Mock data for development - replace with real API calls
const mockSessions: UserSession[] = [
    {
        id: '1',
        deviceName: 'MacBook Pro',
        deviceType: 'desktop',
        browser: 'Chrome 120.0',
        location: 'San Francisco, CA',
        ipAddress: '192.168.1.100',
        lastActive: new Date(),
        isCurrent: true,
    },
    {
        id: '2',
        deviceName: 'iPhone 15',
        deviceType: 'mobile',
        browser: 'Safari Mobile',
        location: 'San Francisco, CA',
        ipAddress: '192.168.1.101',
        lastActive: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        isCurrent: false,
    },
    {
        id: '3',
        deviceName: 'Windows Desktop',
        deviceType: 'desktop',
        browser: 'Firefox 121.0',
        location: 'New York, NY',
        ipAddress: '10.0.0.50',
        lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        isCurrent: false,
    },
];

export function useSessionManager(): UseSessionManagerReturn {
    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // const securityService = new SecurityService(); // TODO: Use in production

    const refreshSessions = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // For development, use mock data
            // In production, replace with: const sessions = await securityService.getActiveSessions();
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay
            setSessions(mockSessions);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to load sessions';
            setError(errorMessage);
            console.error('Error loading sessions:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const terminateSession = useCallback(async (sessionId: string) => {
        try {
            setError(null);

            // For development, simulate API call
            // In production, replace with: await securityService.terminateSession(sessionId);
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Remove the session from the list
            setSessions((prev) =>
                prev.filter((session) => session.id !== sessionId)
            );
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to terminate session';
            setError(errorMessage);
            console.error('Error terminating session:', err);
            throw err; // Re-throw to allow component to handle
        }
    }, []);

    const terminateAllSessions = useCallback(async () => {
        try {
            setError(null);

            // For development, simulate API call
            // In production, replace with: await securityService.terminateAllSessions();
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Keep only the current session
            setSessions((prev) => prev.filter((session) => session.isCurrent));
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to terminate all sessions';
            setError(errorMessage);
            console.error('Error terminating all sessions:', err);
            throw err; // Re-throw to allow component to handle
        }
    }, []);

    // Load sessions on mount
    useEffect(() => {
        refreshSessions();
    }, [refreshSessions]);

    // Auto-refresh sessions every 5 minutes
    useEffect(() => {
        const interval = setInterval(
            () => {
                if (!isLoading) {
                    refreshSessions();
                }
            },
            5 * 60 * 1000
        ); // 5 minutes

        return () => clearInterval(interval);
    }, [isLoading, refreshSessions]);

    return {
        sessions,
        isLoading,
        error,
        terminateSession,
        terminateAllSessions,
        refreshSessions,
    };
}
