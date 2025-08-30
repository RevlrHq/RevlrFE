/**
 * SignalR Testing Component
 *
 * Comprehensive testing interface for the SignalR notification system.
 * Provides manual testing capabilities for all notification types, connection
 * scenarios, and error conditions.
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Play,
    RefreshCw,
    Wifi,
    WifiOff,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Activity,
    Users,
    Bell,
    Trash2,
    Download,
} from 'lucide-react';

import { useSignalR } from '@/hooks/useSignalR';
import { useTypedNotificationHandler } from '@/hooks/useTypedNotificationHandler';
import { useNotificationGroups } from '@/hooks/useNotificationGroups';
import {
    signalRTestService,
    TestScenarios,
} from '@/services/SignalRTestService';
import {
    NotificationType,
    NotificationPriority,
    SignalRErrorType,
} from '@/types/notifications';
import { HubConnectionState } from '@microsoft/signalr';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface TestResult {
    id: string;
    timestamp: Date;
    type: 'notification' | 'connection' | 'error' | 'health';
    success: boolean;
    message: string;
    details?: Record<string, unknown>;
}

interface ConnectionInfo {
    connectionId?: string;
    state: HubConnectionState;
    userId?: string;
    groups: string[];
    latency?: number;
    isHealthy: boolean;
    lastConnected?: Date;
    reconnectAttempts: number;
}

interface TestConfiguration {
    userId?: string;
    autoConnect: boolean;
    enableLogging: boolean;
    batchSize: number;
    intervalMs: number;
    enableHealthCheck: boolean;
    healthCheckInterval: number;
}

// ============================================================================
// Main Component
// ============================================================================

export const SignalRTester: React.FC = () => {
    // State management
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [isRunningTest, setIsRunningTest] = useState(false);
    const [selectedNotificationType, setSelectedNotificationType] =
        useState<NotificationType>(NotificationType.EventRegistration);
    const [selectedPriority, setSelectedPriority] =
        useState<NotificationPriority>(NotificationPriority.Normal);
    const [customUserId, setCustomUserId] = useState('');
    const [customData, setCustomData] = useState('{}');
    const [testConfig, setTestConfig] = useState<TestConfiguration>({
        autoConnect: true,
        enableLogging: true,
        batchSize: 5,
        intervalMs: 1000,
        enableHealthCheck: true,
        healthCheckInterval: 30000,
    });

    // SignalR hooks
    const {
        connection,
        connectionState,
        error,
        isConnected,
        isConnecting,
        connect,
        disconnect,
        reconnect,
        measureLatency,
    } = useSignalR({
        autoConnect: testConfig.autoConnect,
        enableHealthCheck: testConfig.enableHealthCheck,
        healthCheckInterval: testConfig.healthCheckInterval,
        config: {
            enableLogging: testConfig.enableLogging,
        },
    });

    const notificationHandler = useTypedNotificationHandler();
    const { joinedGroups, joinGroup } = useNotificationGroups();

    // ============================================================================
    // Helper Functions
    // ============================================================================

    const addTestResult = useCallback(
        (result: Omit<TestResult, 'id' | 'timestamp'>) => {
            const newResult: TestResult = {
                id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date(),
                ...result,
            };
            setTestResults((prev) => [newResult, ...prev.slice(0, 99)]); // Keep last 100 results
        },
        []
    );

    const parseCustomData = useCallback(() => {
        try {
            return customData ? JSON.parse(customData) : {};
        } catch (error) {
            addTestResult({
                type: 'error',
                success: false,
                message: 'Invalid JSON in custom data',
                details: { error: (error as Error).message },
            });
            return {};
        }
    }, [customData, addTestResult]);

    const getConnectionInfo = useCallback((): ConnectionInfo => {
        return {
            connectionId: connection?.connectionId || undefined,
            state: connectionState.state,
            userId: customUserId || 'current-user',
            groups: joinedGroups.map(group => typeof group === 'string' ? group : group.toString()),
            latency: connectionState.latency,
            isHealthy: connectionState.isHealthy,
            lastConnected: connectionState.lastConnected,
            reconnectAttempts: connectionState.reconnectAttempts,
        };
    }, [connection, connectionState, customUserId, joinedGroups]);

    // ============================================================================
    // Test Functions
    // ============================================================================

    const sendSingleNotification = async () => {
        setIsRunningTest(true);
        try {
            const parsedData = parseCustomData();
            const response = await signalRTestService.sendTestNotification({
                type: selectedNotificationType,
                userId: customUserId || undefined,
                priority: selectedPriority,
                customData: parsedData,
            });

            addTestResult({
                type: 'notification',
                success: response.sent,
                message: `Sent ${selectedNotificationType} notification`,
                details: response as unknown as Record<string, unknown>,
            });
        } catch (error) {
            addTestResult({
                type: 'notification',
                success: false,
                message: `Failed to send notification: ${(error as Error).message}`,
                details: { error },
            });
        } finally {
            setIsRunningTest(false);
        }
    };

    const sendBatchNotifications = async (
        scenario: keyof typeof TestScenarios
    ) => {
        setIsRunningTest(true);
        try {
            const requests = TestScenarios[scenario](customUserId || undefined) as never[];
            const responses =
                await signalRTestService.sendBatchTestNotifications({
                    notifications: requests,
                    batchSize: testConfig.batchSize,
                    intervalMs: testConfig.intervalMs,
                });

            addTestResult({
                type: 'notification',
                success: responses.every((r) => r.sent),
                message: `Sent ${scenario} batch (${responses.length} notifications)`,
                details: { responses, scenario },
            });
        } catch (error) {
            addTestResult({
                type: 'notification',
                success: false,
                message: `Failed to send batch: ${(error as Error).message}`,
                details: { error, scenario },
            });
        } finally {
            setIsRunningTest(false);
        }
    };

    const testConnection = async () => {
        setIsRunningTest(true);
        try {
            const response = await signalRTestService.testConnection({
                userId: customUserId || undefined,
                groupTypes: ['User', 'Organizer'],
                testDuration: 5000,
            });

            addTestResult({
                type: 'connection',
                success: true,
                message: 'Connection test completed',
                details: response as unknown as Record<string, unknown>,
            });
        } catch (error) {
            addTestResult({
                type: 'connection',
                success: false,
                message: `Connection test failed: ${(error as Error).message}`,
                details: { error },
            });
        } finally {
            setIsRunningTest(false);
        }
    };

    const performHealthCheck = async () => {
        setIsRunningTest(true);
        try {
            const [serviceHealth, connectionHealth, latency] =
                await Promise.all([
                    signalRTestService.healthCheck(),
                    signalRTestService.getConnectionHealth(),
                    measureLatency(),
                ]);

            addTestResult({
                type: 'health',
                success: serviceHealth.status === 'healthy',
                message: `Health check: ${serviceHealth.status}`,
                details: { serviceHealth, connectionHealth, latency },
            });
        } catch (error) {
            addTestResult({
                type: 'health',
                success: false,
                message: `Health check failed: ${(error as Error).message}`,
                details: { error },
            });
        } finally {
            setIsRunningTest(false);
        }
    };

    const simulateError = async (errorType: SignalRErrorType) => {
        setIsRunningTest(true);
        try {
            const response = await signalRTestService.simulateError(
                errorType,
                customUserId || undefined
            );

            addTestResult({
                type: 'error',
                success: response.simulated,
                message: `Simulated ${errorType} error`,
                details: response,
            });
        } catch (error) {
            addTestResult({
                type: 'error',
                success: false,
                message: `Failed to simulate error: ${(error as Error).message}`,
                details: { error, errorType },
            });
        } finally {
            setIsRunningTest(false);
        }
    };

    const testErrorRecovery = async (errorType: SignalRErrorType) => {
        setIsRunningTest(true);
        try {
            const response = await signalRTestService.testErrorRecovery(
                errorType,
                customUserId || undefined
            );

            addTestResult({
                type: 'error',
                success: response.recoverySuccessful,
                message: `Error recovery test: ${response.recoverySuccessful ? 'Success' : 'Failed'}`,
                details: response,
            });
        } catch (error) {
            addTestResult({
                type: 'error',
                success: false,
                message: `Error recovery test failed: ${(error as Error).message}`,
                details: { error, errorType },
            });
        } finally {
            setIsRunningTest(false);
        }
    };

    const clearResults = () => {
        setTestResults([]);
        // Clear notifications if the handler supports it
        if ('clearNotifications' in notificationHandler && typeof notificationHandler.clearNotifications === 'function') {
            notificationHandler.clearNotifications();
        }
    };

    const exportResults = () => {
        const data = {
            timestamp: new Date().toISOString(),
            connectionInfo: getConnectionInfo(),
            testResults,
            notifications: ('notifications' in notificationHandler && Array.isArray(notificationHandler.notifications)) ? notificationHandler.notifications : [],
            configuration: testConfig,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `signalr-test-results-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ============================================================================
    // Connection Status Component
    // ============================================================================

    const ConnectionStatus: React.FC = () => {
        const connectionInfo = getConnectionInfo();
        const getStatusColor = () => {
            switch (connectionInfo.state) {
                case HubConnectionState.Connected:
                    return 'bg-green-500';
                case HubConnectionState.Connecting:
                case HubConnectionState.Reconnecting:
                    return 'bg-yellow-500';
                case HubConnectionState.Disconnected:
                    return 'bg-red-500';
                default:
                    return 'bg-gray-500';
            }
        };

        const getStatusIcon = () => {
            switch (connectionInfo.state) {
                case HubConnectionState.Connected:
                    return <Wifi className='size-4' />;
                case HubConnectionState.Connecting:
                case HubConnectionState.Reconnecting:
                    return <RefreshCw className='size-4 animate-spin' />;
                case HubConnectionState.Disconnected:
                    return <WifiOff className='size-4' />;
                default:
                    return <AlertTriangle className='size-4' />;
            }
        };

        return (
            <Card>
                <CardHeader className='pb-3'>
                    <CardTitle className='flex items-center gap-2'>
                        <Activity className='size-5' />
                        Connection Status
                    </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='flex items-center gap-3'>
                        <div
                            className={`size-3 rounded-full ${getStatusColor()}`}
                        />
                        <div className='flex items-center gap-2'>
                            {getStatusIcon()}
                            <span className='font-medium'>
                                {connectionInfo.state}
                            </span>
                        </div>
                    </div>

                    {connectionInfo.connectionId && (
                        <div className='text-sm text-muted-foreground'>
                            <strong>Connection ID:</strong>{' '}
                            {connectionInfo.connectionId}
                        </div>
                    )}

                    {connectionInfo.latency !== undefined && (
                        <div className='text-sm text-muted-foreground'>
                            <strong>Latency:</strong> {connectionInfo.latency}ms
                        </div>
                    )}

                    <div className='text-sm text-muted-foreground'>
                        <strong>Health:</strong>{' '}
                        <Badge
                            variant={
                                connectionInfo.isHealthy
                                    ? 'default'
                                    : 'destructive'
                            }
                        >
                            {connectionInfo.isHealthy ? 'Healthy' : 'Unhealthy'}
                        </Badge>
                    </div>

                    {connectionInfo.groups.length > 0 && (
                        <div className='text-sm text-muted-foreground'>
                            <strong>Groups:</strong>
                            <div className='mt-1 flex flex-wrap gap-1'>
                                {connectionInfo.groups.map((group) => (
                                    <Badge
                                        key={group}
                                        variant='outline'
                                        className='text-xs'
                                    >
                                        {group}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {connectionInfo.reconnectAttempts > 0 && (
                        <div className='text-sm text-muted-foreground'>
                            <strong>Reconnect Attempts:</strong>{' '}
                            {connectionInfo.reconnectAttempts}
                        </div>
                    )}

                    <div className='flex gap-2'>
                        <Button
                            size='sm'
                            onClick={connect}
                            disabled={isConnected || isConnecting}
                        >
                            Connect
                        </Button>
                        <Button
                            size='sm'
                            variant='outline'
                            onClick={disconnect}
                            disabled={!isConnected && !isConnecting}
                        >
                            Disconnect
                        </Button>
                        <Button
                            size='sm'
                            variant='outline'
                            onClick={reconnect}
                            disabled={isConnecting}
                        >
                            <RefreshCw className='mr-1 size-4' />
                            Reconnect
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // ============================================================================
    // Test Results Component
    // ============================================================================

    const TestResults: React.FC = () => {
        const getResultIcon = (result: TestResult) => {
            if (result.success) {
                return <CheckCircle className='size-4 text-green-500' />;
            } else {
                return <XCircle className='size-4 text-red-500' />;
            }
        };

        const getResultBadge = (type: TestResult['type']) => {
            const variants = {
                notification: 'default',
                connection: 'secondary',
                error: 'destructive',
                health: 'outline',
            } as const;

            return <Badge variant={variants[type]}>{type}</Badge>;
        };

        return (
            <Card>
                <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                        <CardTitle className='flex items-center gap-2'>
                            <Bell className='size-5' />
                            Test Results ({
                                testResults.length
                            })
                        </CardTitle>
                        <div className='flex gap-2'>
                            <Button
                                size='sm'
                                variant='outline'
                                onClick={exportResults}
                            >
                                <Download className='mr-1 size-4' />
                                Export
                            </Button>
                            <Button
                                size='sm'
                                variant='outline'
                                onClick={clearResults}
                            >
                                <Trash2 className='mr-1 size-4' />
                                Clear
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className='h-96'>
                        {testResults.length === 0 ? (
                            <div className='py-8 text-center text-muted-foreground'>
                                No test results yet. Run some tests to see
                                results here.
                            </div>
                        ) : (
                            <div className='space-y-3'>
                                {testResults.map((result) => (
                                    <div
                                        key={result.id}
                                        className='space-y-2 rounded-lg border p-3'
                                    >
                                        <div className='flex items-center justify-between'>
                                            <div className='flex items-center gap-2'>
                                                {getResultIcon(result)}
                                                {getResultBadge(result.type)}
                                                <span className='text-sm font-medium'>
                                                    {result.message}
                                                </span>
                                            </div>
                                            <span className='text-xs text-muted-foreground'>
                                                {result.timestamp.toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {result.details && (
                                            <details className='text-xs'>
                                                <summary className='cursor-pointer text-muted-foreground'>
                                                    View Details
                                                </summary>
                                                <pre className='mt-2 overflow-auto rounded bg-muted p-2 text-xs'>
                                                    {JSON.stringify(
                                                        result.details,
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        );
    };

    // ============================================================================
    // Render
    // ============================================================================

    return (
        <div className='container mx-auto space-y-6 p-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-3xl font-bold'>
                        SignalR Testing Dashboard
                    </h1>
                    <p className='text-muted-foreground'>
                        Comprehensive testing interface for SignalR
                        notifications and connections
                    </p>
                </div>
                {error && (
                    <Alert className='max-w-md'>
                        <AlertTriangle className='size-4' />
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                )}
            </div>

            <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                <div className='lg:col-span-2'>
                    <Tabs defaultValue='notifications' className='space-y-4'>
                        <TabsList className='grid w-full grid-cols-4'>
                            <TabsTrigger value='notifications'>
                                Notifications
                            </TabsTrigger>
                            <TabsTrigger value='connection'>
                                Connection
                            </TabsTrigger>
                            <TabsTrigger value='errors'>Errors</TabsTrigger>
                            <TabsTrigger value='config'>Config</TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value='notifications'
                            className='space-y-4'
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        Send Test Notifications
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='space-y-4'>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className='space-y-2'>
                                            <Label>Notification Type</Label>
                                            <Select
                                                value={selectedNotificationType}
                                                onValueChange={(value) =>
                                                    setSelectedNotificationType(
                                                        value as NotificationType
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.values(
                                                        NotificationType
                                                    ).map((type) => (
                                                        <SelectItem
                                                            key={type}
                                                            value={type}
                                                        >
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className='space-y-2'>
                                            <Label>Priority</Label>
                                            <Select
                                                value={selectedPriority}
                                                onValueChange={(value) =>
                                                    setSelectedPriority(
                                                        value as NotificationPriority
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.values(
                                                        NotificationPriority
                                                    ).map((priority) => (
                                                        <SelectItem
                                                            key={priority}
                                                            value={priority}
                                                        >
                                                            {priority}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className='space-y-2'>
                                        <Label>User ID (optional)</Label>
                                        <Input
                                            value={customUserId}
                                            onChange={(e) =>
                                                setCustomUserId(e.target.value)
                                            }
                                            placeholder='Leave empty for current user'
                                        />
                                    </div>

                                    <div className='space-y-2'>
                                        <Label>Custom Data (JSON)</Label>
                                        <Textarea
                                            value={customData}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                                setCustomData(e.target.value)
                                            }
                                            placeholder='{"key": "value"}'
                                            rows={3}
                                        />
                                    </div>

                                    <div className='flex gap-2'>
                                        <Button
                                            onClick={sendSingleNotification}
                                            disabled={isRunningTest}
                                        >
                                            <Play className='mr-2 size-4' />
                                            Send Single
                                        </Button>
                                    </div>

                                    <Separator />

                                    <div className='space-y-3'>
                                        <h4 className='font-medium'>
                                            Batch Test Scenarios
                                        </h4>
                                        <div className='grid grid-cols-2 gap-2'>
                                            {Object.keys(TestScenarios).map(
                                                (scenario) => (
                                                    <Button
                                                        key={scenario}
                                                        variant='outline'
                                                        size='sm'
                                                        onClick={() =>
                                                            sendBatchNotifications(
                                                                scenario as keyof typeof TestScenarios
                                                            )
                                                        }
                                                        disabled={isRunningTest}
                                                    >
                                                        {scenario
                                                            .replace(
                                                                /([A-Z])/g,
                                                                ' $1'
                                                            )
                                                            .trim()}
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value='connection' className='space-y-4'>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Connection Testing</CardTitle>
                                </CardHeader>
                                <CardContent className='space-y-4'>
                                    <div className='flex gap-2'>
                                        <Button
                                            onClick={testConnection}
                                            disabled={isRunningTest}
                                        >
                                            <Activity className='mr-2 size-4' />
                                            Test Connection
                                        </Button>
                                        <Button
                                            onClick={performHealthCheck}
                                            disabled={isRunningTest}
                                        >
                                            <CheckCircle className='mr-2 size-4' />
                                            Health Check
                                        </Button>
                                    </div>

                                    <Separator />

                                    <div className='space-y-3'>
                                        <h4 className='font-medium'>
                                            Group Management
                                        </h4>
                                        <div className='flex gap-2'>
                                            <Button
                                                size='sm'
                                                variant='outline'
                                                onClick={() =>
                                                    joinGroup('User')
                                                }
                                            >
                                                <Users className='mr-1 size-4' />
                                                Join User Group
                                            </Button>
                                            <Button
                                                size='sm'
                                                variant='outline'
                                                onClick={() =>
                                                    joinGroup('Organizer')
                                                }
                                            >
                                                <Users className='mr-1 size-4' />
                                                Join Organizer Group
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value='errors' className='space-y-4'>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Error Testing</CardTitle>
                                </CardHeader>
                                <CardContent className='space-y-4'>
                                    <div className='space-y-3'>
                                        <h4 className='font-medium'>
                                            Simulate Errors
                                        </h4>
                                        <div className='grid grid-cols-2 gap-2'>
                                            {Object.values(
                                                SignalRErrorType
                                            ).map((errorType) => (
                                                <Button
                                                    key={errorType}
                                                    variant='outline'
                                                    size='sm'
                                                    onClick={() =>
                                                        simulateError(errorType)
                                                    }
                                                    disabled={isRunningTest}
                                                >
                                                    {errorType}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className='space-y-3'>
                                        <h4 className='font-medium'>
                                            Test Error Recovery
                                        </h4>
                                        <div className='grid grid-cols-2 gap-2'>
                                            {Object.values(
                                                SignalRErrorType
                                            ).map((errorType) => (
                                                <Button
                                                    key={errorType}
                                                    variant='outline'
                                                    size='sm'
                                                    onClick={() =>
                                                        testErrorRecovery(
                                                            errorType
                                                        )
                                                    }
                                                    disabled={isRunningTest}
                                                >
                                                    Recover {errorType}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value='config' className='space-y-4'>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Test Configuration</CardTitle>
                                </CardHeader>
                                <CardContent className='space-y-4'>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className='space-y-2'>
                                            <Label>Batch Size</Label>
                                            <Input
                                                type='number'
                                                value={testConfig.batchSize}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    setTestConfig((prev) => ({
                                                        ...prev,
                                                        batchSize:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 5,
                                                    }))
                                                }
                                            />
                                        </div>

                                        <div className='space-y-2'>
                                            <Label>Interval (ms)</Label>
                                            <Input
                                                type='number'
                                                value={testConfig.intervalMs}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    setTestConfig((prev) => ({
                                                        ...prev,
                                                        intervalMs:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 1000,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className='space-y-4'>
                                        <div className='flex items-center justify-between'>
                                            <Label>Auto Connect</Label>
                                            <Switch
                                                checked={testConfig.autoConnect}
                                                onCheckedChange={(checked) =>
                                                    setTestConfig((prev) => ({
                                                        ...prev,
                                                        autoConnect: checked,
                                                    }))
                                                }
                                            />
                                        </div>

                                        <div className='flex items-center justify-between'>
                                            <Label>Enable Logging</Label>
                                            <Switch
                                                checked={
                                                    testConfig.enableLogging
                                                }
                                                onCheckedChange={(checked) =>
                                                    setTestConfig((prev) => ({
                                                        ...prev,
                                                        enableLogging: checked,
                                                    }))
                                                }
                                            />
                                        </div>

                                        <div className='flex items-center justify-between'>
                                            <Label>Enable Health Check</Label>
                                            <Switch
                                                checked={
                                                    testConfig.enableHealthCheck
                                                }
                                                onCheckedChange={(checked) =>
                                                    setTestConfig((prev) => ({
                                                        ...prev,
                                                        enableHealthCheck:
                                                            checked,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className='space-y-6'>
                    <ConnectionStatus />
                    <TestResults />
                </div>
            </div>
        </div>
    );
};

export default SignalRTester;
