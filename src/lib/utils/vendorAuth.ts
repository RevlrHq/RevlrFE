import { UserView } from '@lib/services';

/**
 * Vendor authentication and authorization utilities
 */
export class VendorAuthUtils {
    /**
     * Check if a user has vendor/organizer privileges
     * @param user - The user object to check
     * @returns boolean indicating if user is a vendor
     */
    static isVendor(user: UserView | null): boolean {
        return user?.isOrganizer === true;
    }

    /**
     * Check if a user is authenticated
     * @param user - The user object to check
     * @param token - The authentication token
     * @returns boolean indicating if user is authenticated
     */
    static isAuthenticated(
        user: UserView | null,
        token: string | null
    ): boolean {
        return !!(user && token);
    }

    /**
     * Check if a user has vendor access and is authenticated
     * @param user - The user object to check
     * @param token - The authentication token
     * @returns boolean indicating if user has full vendor access
     */
    static hasVendorAccess(
        user: UserView | null,
        token: string | null
    ): boolean {
        return this.isAuthenticated(user, token) && this.isVendor(user);
    }

    /**
     * Get the appropriate redirect path for a user based on their status
     * @param user - The user object to check
     * @param token - The authentication token
     * @param currentPath - The current path the user was trying to access
     * @returns object with redirect path and reason
     */
    static getRedirectInfo(
        user: UserView | null,
        token: string | null,
        currentPath: string = ''
    ): { path: string; reason: string } {
        // Not authenticated at all
        if (!this.isAuthenticated(user, token)) {
            return {
                path: `/auth/login?returnUrl=${encodeURIComponent(currentPath)}`,
                reason: 'authentication_required',
            };
        }

        // Authenticated but not a vendor
        if (!this.isVendor(user)) {
            return {
                path: '/dashboard/vendor-access',
                reason: 'vendor_access_required',
            };
        }

        // Should not redirect - user has proper access
        return {
            path: '',
            reason: 'authorized',
        };
    }

    /**
     * Get user role display name
     * @param user - The user object to check
     * @returns string representing the user's role
     */
    static getUserRole(user: UserView | null): string {
        if (!user) return 'Guest';
        if (this.isVendor(user)) return 'Vendor';
        return 'User';
    }

    /**
     * Check if user can perform vendor-specific actions
     * @param user - The user object to check
     * @param token - The authentication token
     * @param action - The specific action to check (optional)
     * @returns boolean indicating if action is allowed
     */
    static canPerformVendorAction(
        user: UserView | null,
        token: string | null,
        action?: string
    ): boolean {
        const hasAccess = this.hasVendorAccess(user, token);

        // For now, all vendor actions require the same level of access
        // In the future, this could be extended to check specific permissions
        switch (action) {
            case 'create_event':
            case 'manage_events':
            case 'view_analytics':
            case 'manage_tickets':
            case 'handle_payouts':
                return hasAccess;
            default:
                return hasAccess;
        }
    }

    /**
     * Validate token format (basic JWT structure check)
     * @param token - The token to validate
     * @returns boolean indicating if token has valid format
     */
    static isValidTokenFormat(token: string | null): boolean {
        if (!token) return false;

        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;

            // Try to decode the payload to ensure it's valid base64
            JSON.parse(atob(parts[1]));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check if token is expired
     * @param token - The JWT token to check
     * @returns boolean indicating if token is expired
     */
    static isTokenExpired(token: string | null): boolean {
        if (!token || !this.isValidTokenFormat(token)) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            return Date.now() >= expirationTime;
        } catch {
            return true;
        }
    }

    /**
     * Get token expiration time
     * @param token - The JWT token to check
     * @returns Date object representing expiration time, or null if invalid
     */
    static getTokenExpiration(token: string | null): Date | null {
        if (!token || !this.isValidTokenFormat(token)) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return new Date(payload.exp * 1000);
        } catch {
            return null;
        }
    }

    /**
     * Get minutes until token expiration
     * @param token - The JWT token to check
     * @returns number of minutes until expiration, or null if invalid/expired
     */
    static getMinutesUntilExpiration(token: string | null): number | null {
        const expirationDate = this.getTokenExpiration(token);
        if (!expirationDate) return null;

        const minutesUntilExpiry = Math.floor(
            (expirationDate.getTime() - Date.now()) / (1000 * 60)
        );
        return minutesUntilExpiry > 0 ? minutesUntilExpiry : 0;
    }

    /**
     * Create error message for unauthorized access
     * @param user - The user object
     * @param token - The authentication token
     * @param action - The action that was attempted
     * @returns string error message
     */
    static getUnauthorizedMessage(
        user: UserView | null,
        token: string | null,
        action: string = 'access this resource'
    ): string {
        if (!this.isAuthenticated(user, token)) {
            return `You must be logged in to ${action}.`;
        }

        if (!this.isVendor(user)) {
            return `Vendor access is required to ${action}. Please apply for vendor status.`;
        }

        if (this.isTokenExpired(token)) {
            return `Your session has expired. Please log in again to ${action}.`;
        }

        return `You are not authorized to ${action}.`;
    }
}

export default VendorAuthUtils;
