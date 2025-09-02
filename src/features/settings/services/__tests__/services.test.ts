import {
    ProfileService,
    SecurityService,
    NotificationService,
    MediaProviderService,
    ExportService,
    BillingService,
    AccountService,
} from '../index';

// Mock axios
jest.mock('axios', () => ({
    create: jest.fn(() => ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        patch: jest.fn(),
    })),
}));

// Mock API client
const mockApiClient = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
};

describe('Settings Services', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('ProfileService', () => {
        let profileService: ProfileService;

        beforeEach(() => {
            profileService = new ProfileService();
            // Mock the api client
            (profileService as any).apiClient = mockApiClient;
        });

        describe('getProfile', () => {
            it('fetches user profile successfully', async () => {
                const mockProfile = {
                    id: '1',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phoneNumber: '+1234567890',
                    bio: 'Test bio',
                    organization: 'Test Org',
                    website: 'https://test.com',
                    avatarUrl: 'https://example.com/avatar.jpg',
                };

                mockApiClient.get.mockResolvedValue({ data: mockProfile });

                const result = await profileService.getProfile();

                expect(mockApiClient.get).toHaveBeenCalledWith('/profile');
                expect(result).toEqual(mockProfile);
            });

            it('handles API errors', async () => {
                const error = new Error('Network error');
                mockApiClient.get.mockRejectedValue(error);

                await expect(profileService.getProfile()).rejects.toThrow(
                    'Network error'
                );
            });
        });

        describe('updateProfile', () => {
            it('updates profile successfully', async () => {
                const updateData = {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    organization: 'New Org',
                };

                const mockUpdatedProfile = {
                    id: '1',
                    ...updateData,
                    email: 'jane@example.com',
                };

                mockApiClient.put.mockResolvedValue({
                    data: mockUpdatedProfile,
                });

                const result = await profileService.updateProfile(updateData);

                expect(mockApiClient.put).toHaveBeenCalledWith(
                    '/profile',
                    updateData
                );
                expect(result).toEqual(mockUpdatedProfile);
            });

            it('validates required fields', async () => {
                const invalidData = { firstName: '' };

                await expect(
                    profileService.updateProfile(invalidData)
                ).rejects.toThrow('First name is required');
            });
        });

        describe('uploadAvatar', () => {
            it('uploads avatar successfully', async () => {
                const file = new File(['avatar'], 'avatar.jpg', {
                    type: 'image/jpeg',
                });
                const mockAvatarUrl = 'https://example.com/new-avatar.jpg';

                mockApiClient.post.mockResolvedValue({
                    data: { avatarUrl: mockAvatarUrl },
                });

                const result = await profileService.uploadAvatar(file);

                expect(mockApiClient.post).toHaveBeenCalledWith(
                    '/profile/avatar',
                    expect.any(FormData),
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );
                expect(result).toBe(mockAvatarUrl);
            });

            it('validates file type', async () => {
                const file = new File(['document'], 'doc.pdf', {
                    type: 'application/pdf',
                });

                await expect(profileService.uploadAvatar(file)).rejects.toThrow(
                    'Invalid file type. Please upload an image.'
                );
            });

            it('validates file size', async () => {
                const largeFile = new File(
                    ['x'.repeat(6 * 1024 * 1024)],
                    'large.jpg',
                    {
                        type: 'image/jpeg',
                    }
                );

                await expect(
                    profileService.uploadAvatar(largeFile)
                ).rejects.toThrow('File size must be less than 5MB');
            });
        });

        describe('removeAvatar', () => {
            it('removes avatar successfully', async () => {
                mockApiClient.delete.mockResolvedValue({
                    data: { success: true },
                });

                await profileService.removeAvatar();

                expect(mockApiClient.delete).toHaveBeenCalledWith(
                    '/profile/avatar'
                );
            });
        });
    });

    describe('SecurityService', () => {
        let securityService: SecurityService;

        beforeEach(() => {
            securityService = new SecurityService();
            (securityService as any).apiClient = mockApiClient;
        });

        describe('changeEmail', () => {
            it('initiates email change successfully', async () => {
                const newEmail = 'new@example.com';
                mockApiClient.post.mockResolvedValue({
                    data: { success: true },
                });

                await securityService.changeEmail(newEmail);

                expect(mockApiClient.post).toHaveBeenCalledWith(
                    '/security/change-email',
                    {
                        newEmail,
                    }
                );
            });

            it('validates email format', async () => {
                const invalidEmail = 'invalid-email';

                await expect(
                    securityService.changeEmail(invalidEmail)
                ).rejects.toThrow('Invalid email format');
            });
        });

        describe('getActiveSessions', () => {
            it('fetches active sessions successfully', async () => {
                const mockSessions = [
                    {
                        id: '1',
                        deviceInfo: 'Chrome on Windows',
                        location: 'New York, US',
                        lastActivity: new Date('2024-01-01'),
                        isCurrentSession: true,
                    },
                    {
                        id: '2',
                        deviceInfo: 'Safari on iPhone',
                        location: 'Los Angeles, US',
                        lastActivity: new Date('2024-01-02'),
                        isCurrentSession: false,
                    },
                ];

                mockApiClient.get.mockResolvedValue({ data: mockSessions });

                const result = await securityService.getActiveSessions();

                expect(mockApiClient.get).toHaveBeenCalledWith(
                    '/security/sessions'
                );
                expect(result).toEqual(mockSessions);
            });
        });

        describe('revokeSession', () => {
            it('revokes session successfully', async () => {
                const sessionId = 'session-123';
                mockApiClient.delete.mockResolvedValue({
                    data: { success: true },
                });

                await securityService.revokeSession(sessionId);

                expect(mockApiClient.delete).toHaveBeenCalledWith(
                    `/security/sessions/${sessionId}`
                );
            });

            it('prevents revoking current session', async () => {
                const currentSessionId = 'current-session';

                await expect(
                    securityService.revokeSession(currentSessionId, true)
                ).rejects.toThrow('Cannot revoke current session');
            });
        });

        describe('revokeAllSessions', () => {
            it('revokes all other sessions successfully', async () => {
                mockApiClient.post.mockResolvedValue({
                    data: { revokedCount: 3 },
                });

                const result = await securityService.revokeAllSessions();

                expect(mockApiClient.post).toHaveBeenCalledWith(
                    '/security/revoke-all-sessions'
                );
                expect(result.revokedCount).toBe(3);
            });
        });
    });

    describe('NotificationService', () => {
        let notificationService: NotificationService;

        beforeEach(() => {
            notificationService = new NotificationService();
            (notificationService as any).apiClient = mockApiClient;
        });

        describe('getPreferences', () => {
            it('fetches notification preferences successfully', async () => {
                const mockPreferences = {
                    email: {
                        eventUpdates: true,
                        registrationAlerts: true,
                        paymentNotifications: true,
                        marketingEmails: false,
                        securityAlerts: true,
                    },
                    push: {
                        enabled: true,
                        eventReminders: true,
                        registrationAlerts: true,
                        paymentNotifications: false,
                    },
                    inApp: {
                        enabled: true,
                        eventUpdates: true,
                        systemNotifications: true,
                    },
                    frequency: 'immediate',
                };

                mockApiClient.get.mockResolvedValue({ data: mockPreferences });

                const result = await notificationService.getPreferences();

                expect(mockApiClient.get).toHaveBeenCalledWith(
                    '/notifications/preferences'
                );
                expect(result).toEqual(mockPreferences);
            });
        });

        describe('updatePreferences', () => {
            it('updates notification preferences successfully', async () => {
                const updates = {
                    email: { marketingEmails: true },
                    frequency: 'daily' as const,
                };

                mockApiClient.patch.mockResolvedValue({
                    data: { success: true },
                });

                await notificationService.updatePreferences(updates);

                expect(mockApiClient.patch).toHaveBeenCalledWith(
                    '/notifications/preferences',
                    updates
                );
            });

            it('validates frequency values', async () => {
                const invalidUpdates = {
                    frequency: 'invalid' as any,
                };

                await expect(
                    notificationService.updatePreferences(invalidUpdates)
                ).rejects.toThrow('Invalid frequency value');
            });
        });

        describe('testNotification', () => {
            it('sends test notification successfully', async () => {
                const notificationType = 'email';
                mockApiClient.post.mockResolvedValue({ data: { sent: true } });

                await notificationService.testNotification(notificationType);

                expect(mockApiClient.post).toHaveBeenCalledWith(
                    '/notifications/test',
                    {
                        type: notificationType,
                    }
                );
            });
        });
    });

    describe('MediaProviderService', () => {
        let mediaProviderService: MediaProviderService;

        beforeEach(() => {
            mediaProviderService = new MediaProviderService();
            (mediaProviderService as any).apiClient = mockApiClient;
        });

        describe('getConnectedProviders', () => {
            it('fetches connected providers successfully', async () => {
                const mockProviders = [
                    {
                        id: 'unsplash',
                        name: 'Unsplash',
                        isConnected: true,
                        connectedAt: new Date('2024-01-01'),
                        permissions: ['read'],
                        status: 'active' as const,
                    },
                    {
                        id: 'pixabay',
                        name: 'Pixabay',
                        isConnected: false,
                        permissions: [],
                        status: 'inactive' as const,
                    },
                ];

                mockApiClient.get.mockResolvedValue({ data: mockProviders });

                const result =
                    await mediaProviderService.getConnectedProviders();

                expect(mockApiClient.get).toHaveBeenCalledWith(
                    '/media-providers'
                );
                expect(result).toEqual(mockProviders);
            });
        });

        describe('connectProvider', () => {
            it('initiates provider connection successfully', async () => {
                const providerId = 'unsplash';
                const mockAuthUrl =
                    'https://unsplash.com/oauth/authorize?client_id=123';

                mockApiClient.post.mockResolvedValue({
                    data: { authUrl: mockAuthUrl },
                });

                const result =
                    await mediaProviderService.connectProvider(providerId);

                expect(mockApiClient.post).toHaveBeenCalledWith(
                    `/media-providers/${providerId}/connect`
                );
                expect(result).toBe(mockAuthUrl);
            });
        });

        describe('disconnectProvider', () => {
            it('disconnects provider successfully', async () => {
                const providerId = 'unsplash';
                mockApiClient.delete.mockResolvedValue({
                    data: { success: true },
                });

                await mediaProviderService.disconnectProvider(providerId);

                expect(mockApiClient.delete).toHaveBeenCalledWith(
                    `/media-providers/${providerId}`
                );
            });
        });

        describe('refreshConnection', () => {
            it('refreshes provider connection successfully', async () => {
                const providerId = 'unsplash';
                mockApiClient.post.mockResolvedValue({
                    data: { success: true },
                });

                await mediaProviderService.refreshConnection(providerId);

                expect(mockApiClient.post).toHaveBeenCalledWith(
                    `/media-providers/${providerId}/refresh`
                );
            });
        });
    });

    describe('ExportService', () => {
        let exportService: ExportService;

        beforeEach(() => {
            exportService = new ExportService();
            (exportService as any).apiClient = mockApiClient;
        });

        describe('requestExport', () => {
            it('creates export request successfully', async () => {
                const options = {
                    includeEvents: true,
                    includeRegistrations: true,
                    includeAnalytics: false,
                    includeSettings: true,
                };

                const mockExportRequest = {
                    id: 'export-123',
                    requestedAt: new Date(),
                    status: 'pending' as const,
                    ...options,
                };

                mockApiClient.post.mockResolvedValue({
                    data: mockExportRequest,
                });

                const result = await exportService.requestExport(options);

                expect(mockApiClient.post).toHaveBeenCalledWith(
                    '/data-export/request',
                    options
                );
                expect(result).toEqual(mockExportRequest);
            });

            it('validates export options', async () => {
                const invalidOptions = {};

                await expect(
                    exportService.requestExport(invalidOptions)
                ).rejects.toThrow(
                    'At least one data type must be selected for export'
                );
            });
        });

        describe('getExportHistory', () => {
            it('fetches export history successfully', async () => {
                const mockHistory = [
                    {
                        id: 'export-1',
                        requestedAt: new Date('2024-01-01'),
                        completedAt: new Date('2024-01-01'),
                        status: 'completed' as const,
                        fileSize: 1024,
                        includeEvents: true,
                        includeRegistrations: true,
                        includeAnalytics: false,
                        includeSettings: true,
                    },
                ];

                mockApiClient.get.mockResolvedValue({ data: mockHistory });

                const result = await exportService.getExportHistory();

                expect(mockApiClient.get).toHaveBeenCalledWith(
                    '/data-export/history'
                );
                expect(result).toEqual(mockHistory);
            });
        });

        describe('downloadExport', () => {
            it('downloads export file successfully', async () => {
                const exportId = 'export-123';
                const mockBlob = new Blob(['export data'], {
                    type: 'application/json',
                });

                mockApiClient.get.mockResolvedValue({ data: mockBlob });

                const result = await exportService.downloadExport(exportId);

                expect(mockApiClient.get).toHaveBeenCalledWith(
                    `/data-export/${exportId}/download`,
                    {
                        responseType: 'blob',
                    }
                );
                expect(result).toEqual(mockBlob);
            });
        });

        describe('cancelExport', () => {
            it('cancels export request successfully', async () => {
                const exportId = 'export-123';
                mockApiClient.delete.mockResolvedValue({
                    data: { success: true },
                });

                await exportService.cancelExport(exportId);

                expect(mockApiClient.delete).toHaveBeenCalledWith(
                    `/data-export/${exportId}`
                );
            });

            it('prevents canceling completed exports', async () => {
                const exportId = 'export-123';
                const error = new Error('Cannot cancel completed export');
                mockApiClient.delete.mockRejectedValue(error);

                await expect(
                    exportService.cancelExport(exportId)
                ).rejects.toThrow('Cannot cancel completed export');
            });
        });
    });

    describe('BillingService', () => {
        let billingService: BillingService;

        beforeEach(() => {
            billingService = new BillingService();
            (billingService as any).apiClient = mockApiClient;
        });

        describe('getPaymentMethods', () => {
            it('fetches payment methods successfully', async () => {
                const mockPaymentMethods = [
                    {
                        id: 'pm_123',
                        type: 'card',
                        last4: '4242',
                        brand: 'visa',
                        expiryMonth: 12,
                        expiryYear: 2025,
                        isDefault: true,
                    },
                ];

                mockApiClient.get.mockResolvedValue({
                    data: mockPaymentMethods,
                });

                const result = await billingService.getPaymentMethods();

                expect(mockApiClient.get).toHaveBeenCalledWith(
                    '/billing/payment-methods'
                );
                expect(result).toEqual(mockPaymentMethods);
            });
        });

        describe('addPaymentMethod', () => {
            it('adds payment method successfully', async () => {
                const paymentMethodData = {
                    type: 'card',
                    card: {
                        number: '4242424242424242',
                        expiryMonth: 12,
                        expiryYear: 2025,
                        cvc: '123',
                    },
                };

                const mockPaymentMethod = {
                    id: 'pm_new',
                    ...paymentMethodData,
                    last4: '4242',
                    brand: 'visa',
                };

                mockApiClient.post.mockResolvedValue({
                    data: mockPaymentMethod,
                });

                const result =
                    await billingService.addPaymentMethod(paymentMethodData);

                expect(mockApiClient.post).toHaveBeenCalledWith(
                    '/billing/payment-methods',
                    paymentMethodData
                );
                expect(result).toEqual(mockPaymentMethod);
            });
        });

        describe('removePaymentMethod', () => {
            it('removes payment method successfully', async () => {
                const paymentMethodId = 'pm_123';
                mockApiClient.delete.mockResolvedValue({
                    data: { success: true },
                });

                await billingService.removePaymentMethod(paymentMethodId);

                expect(mockApiClient.delete).toHaveBeenCalledWith(
                    `/billing/payment-methods/${paymentMethodId}`
                );
            });
        });

        describe('getBillingHistory', () => {
            it('fetches billing history successfully', async () => {
                const mockHistory = [
                    {
                        id: 'inv_123',
                        amount: 2999,
                        currency: 'usd',
                        status: 'paid',
                        createdAt: new Date('2024-01-01'),
                        description: 'Monthly subscription',
                    },
                ];

                mockApiClient.get.mockResolvedValue({ data: mockHistory });

                const result = await billingService.getBillingHistory();

                expect(mockApiClient.get).toHaveBeenCalledWith(
                    '/billing/history'
                );
                expect(result).toEqual(mockHistory);
            });
        });
    });

    describe('AccountService', () => {
        let accountService: AccountService;

        beforeEach(() => {
            accountService = new AccountService();
            (accountService as any).apiClient = mockApiClient;
        });

        describe('getAccountInfo', () => {
            it('fetches account information successfully', async () => {
                const mockAccountInfo = {
                    id: 'user-123',
                    createdAt: new Date('2023-01-01'),
                    lastLoginAt: new Date('2024-01-01'),
                    emailVerified: true,
                    subscriptionStatus: 'active',
                    storageUsed: 1024,
                    storageLimit: 10240,
                };

                mockApiClient.get.mockResolvedValue({ data: mockAccountInfo });

                const result = await accountService.getAccountInfo();

                expect(mockApiClient.get).toHaveBeenCalledWith('/account/info');
                expect(result).toEqual(mockAccountInfo);
            });
        });

        describe('requestAccountDeletion', () => {
            it('initiates account deletion successfully', async () => {
                const deletionRequest = {
                    confirmationEmail: 'user@example.com',
                    reason: 'No longer needed',
                    feedback: 'Great service',
                    immediateDataRemoval: false,
                };

                const mockResponse = {
                    scheduledDeletionDate: new Date('2024-02-01'),
                    confirmationSent: true,
                };

                mockApiClient.post.mockResolvedValue({ data: mockResponse });

                const result =
                    await accountService.requestAccountDeletion(
                        deletionRequest
                    );

                expect(mockApiClient.post).toHaveBeenCalledWith(
                    '/account/delete',
                    deletionRequest
                );
                expect(result).toEqual(mockResponse);
            });

            it('validates deletion request', async () => {
                const invalidRequest = {
                    confirmationEmail: 'invalid-email',
                };

                await expect(
                    accountService.requestAccountDeletion(invalidRequest)
                ).rejects.toThrow('Invalid email format');
            });
        });

        describe('cancelAccountDeletion', () => {
            it('cancels account deletion successfully', async () => {
                mockApiClient.delete.mockResolvedValue({
                    data: { success: true },
                });

                await accountService.cancelAccountDeletion();

                expect(mockApiClient.delete).toHaveBeenCalledWith(
                    '/account/delete'
                );
            });
        });
    });
});
