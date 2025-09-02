import { setupServer } from 'msw/node';
import { rest } from 'msw';
import {
    mockUserProfile,
    mockNotificationPreferences,
    mockUserSessions,
    mockMediaProviders,
    mockExportHistory,
} from '../test-setup';

// Mock API handlers
export const handlers = [
    // Profile endpoints
    rest.get('/api/profile', (req, res, ctx) => {
        return res(ctx.json(mockUserProfile));
    }),

    rest.put('/api/profile', (req, res, ctx) => {
        return res(ctx.json({ ...mockUserProfile, ...req.body }));
    }),

    rest.post('/api/profile/avatar', (req, res, ctx) => {
        return res(
            ctx.json({ avatarUrl: 'https://example.com/new-avatar.jpg' })
        );
    }),

    rest.delete('/api/profile/avatar', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
    }),

    // Security endpoints
    rest.get('/api/security/sessions', (req, res, ctx) => {
        return res(ctx.json(mockUserSessions));
    }),

    rest.delete('/api/security/sessions/:sessionId', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
    }),

    rest.post('/api/security/revoke-all-sessions', (req, res, ctx) => {
        return res(ctx.json({ revokedCount: 1 }));
    }),

    rest.post('/api/security/change-email', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
    }),

    rest.post('/api/security/change-password', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
    }),

    // Notification endpoints
    rest.get('/api/notifications/preferences', (req, res, ctx) => {
        return res(ctx.json(mockNotificationPreferences));
    }),

    rest.patch('/api/notifications/preferences', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
    }),

    rest.post('/api/notifications/test', (req, res, ctx) => {
        return res(ctx.json({ sent: true }));
    }),

    // Media provider endpoints
    rest.get('/api/media-providers', (req, res, ctx) => {
        return res(ctx.json(mockMediaProviders));
    }),

    rest.post('/api/media-providers/:providerId/connect', (req, res, ctx) => {
        return res(ctx.json({ authUrl: 'https://oauth.example.com' }));
    }),

    rest.delete('/api/media-providers/:providerId', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
    }),

    rest.post('/api/media-providers/:providerId/refresh', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
    }),

    // Data export endpoints
    rest.post('/api/data-export/request', (req, res, ctx) => {
        return res(
            ctx.json({
                id: 'export-123',
                requestedAt: new Date(),
                status: 'pending',
                ...req.body,
            })
        );
    }),

    rest.get('/api/data-export/history', (req, res, ctx) => {
        return res(ctx.json(mockExportHistory));
    }),

    rest.get('/api/data-export/:exportId/download', (req, res, ctx) => {
        const blob = new Blob(['export data'], { type: 'application/json' });
        return res(
            ctx.set('Content-Type', 'application/octet-stream'),
            ctx.set('Content-Disposition', 'attachment; filename="export.zip"'),
            ctx.body(blob)
        );
    }),

    rest.delete('/api/data-export/:exportId', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
    }),

    // Billing endpoints
    rest.get('/api/billing/payment-methods', (req, res, ctx) => {
        return res(
            ctx.json([
                {
                    id: 'pm_1',
                    type: 'card',
                    last4: '4242',
                    brand: 'visa',
                    expiryMonth: 12,
                    expiryYear: 2025,
                    isDefault: true,
                },
            ])
        );
    }),

    rest.post('/api/billing/payment-methods', (req, res, ctx) => {
        return res(
            ctx.json({
                id: 'pm_new',
                type: 'card',
                last4: '1234',
                brand: 'visa',
                expiryMonth: 12,
                expiryYear: 2027,
                isDefault: false,
            })
        );
    }),

    rest.delete(
        '/api/billing/payment-methods/:paymentMethodId',
        (req, res, ctx) => {
            return res(ctx.json({ success: true }));
        }
    ),

    rest.get('/api/billing/history', (req, res, ctx) => {
        return res(
            ctx.json([
                {
                    id: 'inv_1',
                    amount: 2999,
                    currency: 'usd',
                    status: 'paid',
                    createdAt: new Date('2024-01-01'),
                    description: 'Monthly subscription',
                },
            ])
        );
    }),

    // Account endpoints
    rest.get('/api/account/info', (req, res, ctx) => {
        return res(
            ctx.json({
                id: '1',
                createdAt: new Date('2023-01-01'),
                lastLoginAt: new Date('2024-01-01'),
                emailVerified: true,
                subscriptionStatus: 'active',
                storageUsed: 1024,
                storageLimit: 10240,
            })
        );
    }),

    rest.post('/api/account/delete', (req, res, ctx) => {
        return res(
            ctx.json({
                scheduledDeletionDate: new Date('2024-02-01'),
                confirmationSent: true,
            })
        );
    }),

    rest.delete('/api/account/delete', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
    }),

    // Interface preferences endpoints
    rest.get('/api/interface/preferences', (req, res, ctx) => {
        return res(
            ctx.json({
                theme: 'light',
                dashboardLayout: 'comfortable',
                defaultEventView: 'grid',
                defaultAnalyticsView: 'overview',
                sidebarCollapsed: false,
                showWelcomeMessages: true,
                dateFormat: 'MM/DD/YYYY',
                timeFormat: '12h',
                currency: 'USD',
                language: 'en',
            })
        );
    }),

    rest.patch('/api/interface/preferences', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
    }),

    // Error simulation handlers (can be activated in specific tests)
    rest.get('/api/profile/error', (req, res, ctx) => {
        return res(
            ctx.status(500),
            ctx.json({ error: 'Internal server error' })
        );
    }),

    rest.get('/api/profile/network-error', (req, res, ctx) => {
        return res.networkError('Network error');
    }),

    rest.get('/api/profile/auth-error', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }),

    // Validation error handlers
    rest.put('/api/profile/validation-error', (req, res, ctx) => {
        return res(
            ctx.status(400),
            ctx.json({
                error: 'Validation failed',
                details: {
                    firstName: 'First name is required',
                    email: 'Invalid email format',
                },
            })
        );
    }),
];

// Create server instance
export const server = setupServer(...handlers);

// Helper functions for test-specific handlers
export const mockNetworkError = (endpoint: string) => {
    server.use(
        rest.all(endpoint, (req, res, ctx) => {
            return res.networkError('Network connection failed');
        })
    );
};

export const mockAuthError = (endpoint: string) => {
    server.use(
        rest.all(endpoint, (req, res, ctx) => {
            return res(
                ctx.status(401),
                ctx.json({ error: 'Authentication required' })
            );
        })
    );
};

export const mockValidationError = (
    endpoint: string,
    errors: Record<string, string>
) => {
    server.use(
        rest.all(endpoint, (req, res, ctx) => {
            return res(
                ctx.status(400),
                ctx.json({
                    error: 'Validation failed',
                    details: errors,
                })
            );
        })
    );
};

export const mockServerError = (endpoint: string) => {
    server.use(
        rest.all(endpoint, (req, res, ctx) => {
            return res(
                ctx.status(500),
                ctx.json({ error: 'Internal server error' })
            );
        })
    );
};

export const mockSlowResponse = (endpoint: string, delay: number = 2000) => {
    server.use(
        rest.all(endpoint, (req, res, ctx) => {
            return res(ctx.delay(delay), ctx.json({ success: true }));
        })
    );
};
