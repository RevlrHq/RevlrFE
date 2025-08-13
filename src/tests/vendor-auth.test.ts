import { VendorAuthUtils } from '@lib/utils/vendorAuth';
import { UserView } from '@lib/services';

describe('VendorAuthUtils', () => {
    const mockVendorUser: UserView = {
        id: '1',
        email: 'vendor@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        isOrganizer: true,
        token: 'mock-token',
    };

    const mockRegularUser: UserView = {
        id: '2',
        email: 'user@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '+1234567891',
        isOrganizer: false,
        token: 'mock-token',
    };

    const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lp-38RKzJl8h6SW5ZAeOCbWCNKBYZQXW7zMhgWZ8_Qs';

    describe('isVendor', () => {
        it('should return true for vendor users', () => {
            expect(VendorAuthUtils.isVendor(mockVendorUser)).toBe(true);
        });

        it('should return false for regular users', () => {
            expect(VendorAuthUtils.isVendor(mockRegularUser)).toBe(false);
        });

        it('should return false for null user', () => {
            expect(VendorAuthUtils.isVendor(null)).toBe(false);
        });
    });

    describe('isAuthenticated', () => {
        it('should return true when user and token are present', () => {
            expect(
                VendorAuthUtils.isAuthenticated(mockVendorUser, mockToken)
            ).toBe(true);
        });

        it('should return false when user is null', () => {
            expect(VendorAuthUtils.isAuthenticated(null, mockToken)).toBe(
                false
            );
        });

        it('should return false when token is null', () => {
            expect(VendorAuthUtils.isAuthenticated(mockVendorUser, null)).toBe(
                false
            );
        });
    });

    describe('hasVendorAccess', () => {
        it('should return true for authenticated vendor', () => {
            expect(
                VendorAuthUtils.hasVendorAccess(mockVendorUser, mockToken)
            ).toBe(true);
        });

        it('should return false for authenticated regular user', () => {
            expect(
                VendorAuthUtils.hasVendorAccess(mockRegularUser, mockToken)
            ).toBe(false);
        });

        it('should return false for unauthenticated vendor', () => {
            expect(VendorAuthUtils.hasVendorAccess(mockVendorUser, null)).toBe(
                false
            );
        });
    });

    describe('getRedirectInfo', () => {
        it('should redirect to login for unauthenticated user', () => {
            const result = VendorAuthUtils.getRedirectInfo(
                null,
                null,
                '/create-event'
            );
            expect(result.reason).toBe('authentication_required');
            expect(result.path).toContain('/auth/login');
            expect(result.path).toContain('returnUrl');
        });

        it('should redirect to vendor access for authenticated non-vendor', () => {
            const result = VendorAuthUtils.getRedirectInfo(
                mockRegularUser,
                mockToken,
                '/create-event'
            );
            expect(result.reason).toBe('vendor_access_required');
            expect(result.path).toBe('/dashboard/vendor-access');
        });

        it('should not redirect for authenticated vendor', () => {
            const result = VendorAuthUtils.getRedirectInfo(
                mockVendorUser,
                mockToken,
                '/create-event'
            );
            expect(result.reason).toBe('authorized');
            expect(result.path).toBe('');
        });
    });

    describe('getUserRole', () => {
        it('should return "Vendor" for vendor users', () => {
            expect(VendorAuthUtils.getUserRole(mockVendorUser)).toBe('Vendor');
        });

        it('should return "User" for regular users', () => {
            expect(VendorAuthUtils.getUserRole(mockRegularUser)).toBe('User');
        });

        it('should return "Guest" for null user', () => {
            expect(VendorAuthUtils.getUserRole(null)).toBe('Guest');
        });
    });

    describe('canPerformVendorAction', () => {
        it('should allow vendor actions for authenticated vendor', () => {
            expect(
                VendorAuthUtils.canPerformVendorAction(
                    mockVendorUser,
                    mockToken,
                    'create_event'
                )
            ).toBe(true);
        });

        it('should deny vendor actions for regular user', () => {
            expect(
                VendorAuthUtils.canPerformVendorAction(
                    mockRegularUser,
                    mockToken,
                    'create_event'
                )
            ).toBe(false);
        });

        it('should deny vendor actions for unauthenticated user', () => {
            expect(
                VendorAuthUtils.canPerformVendorAction(
                    null,
                    null,
                    'create_event'
                )
            ).toBe(false);
        });
    });

    describe('isValidTokenFormat', () => {
        it('should return true for valid JWT format', () => {
            expect(VendorAuthUtils.isValidTokenFormat(mockToken)).toBe(true);
        });

        it('should return false for invalid token format', () => {
            expect(VendorAuthUtils.isValidTokenFormat('invalid-token')).toBe(
                false
            );
        });

        it('should return false for null token', () => {
            expect(VendorAuthUtils.isValidTokenFormat(null)).toBe(false);
        });
    });

    describe('getUnauthorizedMessage', () => {
        it('should return login message for unauthenticated user', () => {
            const message = VendorAuthUtils.getUnauthorizedMessage(
                null,
                null,
                'create events'
            );
            expect(message).toContain('logged in');
            expect(message).toContain('create events');
        });

        it('should return vendor access message for regular user', () => {
            const message = VendorAuthUtils.getUnauthorizedMessage(
                mockRegularUser,
                mockToken,
                'create events'
            );
            expect(message).toContain('Vendor access');
            expect(message).toContain('create events');
        });
    });
});
