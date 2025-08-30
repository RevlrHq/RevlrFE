# Refresh Token Implementation

This document outlines the implementation of refresh token functionality in the Revlr frontend application.

## Overview

The refresh token feature provides automatic token renewal to maintain user sessions without requiring manual re-authentication. This implementation includes:

- Automatic token refresh on API 401 errors
- Proactive token refresh before expiration
- Secure token storage and management
- Graceful fallback to login when refresh fails

## Architecture

### Core Components

1. **AuthService** (`src/lib/services/AuthService.ts`)
   - Manages authentication state and token operations
   - Handles token refresh logic
   - Provides JWT token decoding and expiration checking

2. **HttpInterceptorService** (`src/lib/services/HttpInterceptorService.ts`)
   - Axios interceptors for automatic token refresh
   - Handles 401 errors and retry logic
   - Queues failed requests during token refresh

3. **AuthStore** (`src/stores/authStore.tsx`)
   - Zustand store for authentication state
   - Persists both access and refresh tokens
   - Provides methods for token updates

4. **useRefreshToken Hook** (`src/hooks/useRefreshToken.ts`)
   - React hook for manual token refresh operations
   - Provides loading states and error handling

## API Integration

### Endpoints Used

- `POST /api/PasswordlessAuth/refresh` - Refresh access token
- `POST /api/PasswordlessAuth/revoke` - Revoke refresh token

### Request/Response Models

```typescript
// Request
interface RefreshTokenRequest {
    refreshToken: string;
}

// Response
interface UserView {
    token?: string;
    refreshToken?: string;
    // ... other user properties
}
```

## Implementation Details

### Token Storage

Tokens are stored in the Zustand auth store with persistence:

```typescript
interface AuthState {
    token: string | null;           // Access token
    refreshToken: string | null;    // Refresh token
    user: UserView | null;
    isAuthenticated: boolean;
    // ... methods
}
```

### Automatic Refresh Flow

1. **Request Interceptor**: Checks token expiration before each request
2. **Response Interceptor**: Handles 401 errors by attempting token refresh
3. **Queue Management**: Failed requests are queued during refresh process
4. **Retry Logic**: Successful refresh retries all queued requests

### Token Expiration Checking

The system proactively refreshes tokens that expire within 5 minutes:

```typescript
// Check if token expires within the next 5 minutes
const timeUntilExpiry = tokenPayload.exp - currentTime;
const refreshThreshold = 5 * 60; // 5 minutes in seconds

if (timeUntilExpiry <= refreshThreshold) {
    return await this.refreshToken();
}
```

### Error Handling

- **Refresh Success**: Updates tokens and retries failed requests
- **Refresh Failure**: Logs out user and redirects to login
- **Network Errors**: Graceful degradation with user notification

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage with encryption via Zustand persistence
2. **Token Rotation**: New refresh tokens are issued with each refresh
3. **Token Revocation**: Refresh tokens are revoked on logout
4. **Expiration Handling**: Expired tokens trigger automatic refresh or logout

## Usage Examples

### Manual Token Refresh

```typescript
import { useRefreshToken } from '@hooks/useRefreshToken';

function MyComponent() {
    const { refreshToken, isRefreshing, error } = useRefreshToken();

    const handleRefresh = async () => {
        const success = await refreshToken();
        if (success) {
            console.log('Token refreshed successfully');
        }
    };

    return (
        <button onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? 'Refreshing...' : 'Refresh Token'}
        </button>
    );
}
```

### Checking Authentication Status

```typescript
import { AuthService } from '@lib/services/AuthService';

// Check if user is authenticated
const isAuth = AuthService.isAuthenticated();

// Get current token
const token = AuthService.getCurrentToken();

// Refresh token if needed
const refreshed = await AuthService.refreshTokenIfNeeded();
```

## Integration Points

### Authentication Flow

1. **Login/Registration**: Store both access and refresh tokens
2. **API Requests**: Automatic token refresh via interceptors
3. **Logout**: Revoke refresh token and clear storage

### Component Integration

The refresh token functionality is automatically initialized in the `AuthProvider`:

```typescript
// src/providers/AuthProvider.tsx
useEffect(() => {
    AuthService.initialize();
    HttpInterceptorService.initialize();
    AuthService.setupTokenSync();
}, []);
```

## Testing

The implementation includes comprehensive tests:

- **AuthService Tests**: Token management and refresh logic
- **Integration Tests**: End-to-end authentication flows
- **Error Handling Tests**: Network failures and edge cases

## Configuration

### Environment Variables

No additional environment variables are required. The system uses the existing API configuration.

### Customization Options

- **Refresh Threshold**: Modify the 5-minute threshold in `AuthService.refreshTokenIfNeeded()`
- **Retry Logic**: Adjust retry attempts in `HttpInterceptorService`
- **Storage Options**: Configure Zustand persistence settings

## Monitoring and Debugging

### Logging

Development mode includes detailed logging:

```typescript
if (process.env.NODE_ENV === 'development') {
    console.log('Token refresh successful');
    console.debug('Token refresh failed:', error);
}
```

### Error Tracking

Errors are captured and can be integrated with monitoring services:

```typescript
catch (error) {
    console.debug('Token refresh failed:', error);
    // Add your error tracking service here
    return false;
}
```

## Migration Notes

### Breaking Changes

- `setUser` method now accepts an optional `refreshToken` parameter
- Auth store includes new `refreshToken` and `updateTokens` properties
- Tests require updated mock objects with new properties

### Backward Compatibility

The implementation maintains backward compatibility:
- Existing `setUser` calls work without modification
- Missing refresh tokens are handled gracefully
- Legacy token-only authentication continues to function

## Future Enhancements

1. **Token Rotation Policy**: Implement configurable token rotation
2. **Multi-Device Management**: Track and manage tokens across devices
3. **Security Monitoring**: Add suspicious activity detection
4. **Performance Optimization**: Implement token caching strategies

## Troubleshooting

### Common Issues

1. **Infinite Refresh Loop**: Check token expiration logic
2. **Storage Issues**: Verify localStorage availability
3. **Network Errors**: Implement proper error boundaries
4. **Race Conditions**: Ensure proper request queuing

### Debug Steps

1. Check browser console for authentication logs
2. Verify token format and expiration in localStorage
3. Monitor network requests for refresh attempts
4. Test with expired tokens to verify refresh flow
