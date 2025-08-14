# Unsplash OAuth Implementation

This document describes the implementation of OAuth2 authentication for the Unsplash API integration in the REVLR platform.

## Overview

The Unsplash OAuth implementation allows users to authenticate with their Unsplash accounts to access additional features like:
- Liking/unliking photos
- Accessing private collections
- Viewing user's liked photos
- Higher rate limits for authenticated requests

## Architecture

### Core Components

1. **UnsplashOAuthService** (`src/lib/services/media/auth/UnsplashOAuthService.ts`)
   - Handles OAuth2 flow
   - Manages access tokens
   - Provides user authentication state

2. **UnsplashProvider** (`src/lib/services/media/providers/UnsplashProvider.ts`)
   - Updated to support both public and authenticated requests
   - Integrates with OAuth service
   - Provides authenticated API methods

3. **useUnsplashAuth Hook** (`src/hooks/useUnsplashAuth.ts`)
   - React hook for managing authentication state
   - Handles OAuth callbacks
   - Provides authentication methods

4. **UnsplashAuthButton Component** (`src/components/UnsplashAuthButton.tsx`)
   - UI component for authentication
   - Handles OAuth flow initiation
   - Displays user information

5. **OAuth Callback Route** (`src/app/api/auth/unsplash/callback/route.ts`)
   - Next.js API route for handling OAuth callbacks
   - Redirects back to the application with auth parameters

## OAuth Flow

### 1. Initiation
```typescript
const { login } = useUnsplashAuth();
login(['public', 'read_user', 'write_likes', 'read_collections']);
```

### 2. Authorization
- User is redirected to Unsplash OAuth authorization page
- User grants permissions for requested scopes
- Unsplash redirects back to callback URL with authorization code

### 3. Token Exchange
```typescript
const tokenResponse = await oauthService.exchangeCodeForToken(code);
```

### 4. User Profile Fetch
```typescript
const user = await oauthService.fetchUserProfile();
```

### 5. Authenticated Requests
```typescript
const headers = oauthService.getAuthorizationHeader();
// Uses Bearer token instead of Client-ID
```

## Configuration

### Environment Variables

```env
# Required for OAuth
UNSPLASH_ACCESS_KEY=your_access_key
UNSPLASH_SECRET_KEY=your_secret_key
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_access_key
NEXT_PUBLIC_UNSPLASH_REDIRECT_URI=http://localhost:3000/api/auth/unsplash/callback
```

### Unsplash Application Setup

1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Create a new application
3. Set redirect URI to: `http://localhost:3000/api/auth/unsplash/callback`
4. Copy Access Key and Secret Key to environment variables

## Available Scopes

| Scope | Description |
|-------|-------------|
| `public` | Default. Read public data |
| `read_user` | Access user's private data |
| `write_user` | Update the user's profile |
| `read_photos` | Read private data from user's photos |
| `write_photos` | Update photos on user's behalf |
| `write_likes` | Like or unlike photos |
| `write_followers` | Follow or unfollow users |
| `read_collections` | View user's private collections |
| `write_collections` | Create and update collections |

## Usage Examples

### Basic Authentication Button
```tsx
import { UnsplashAuthButton } from '@/components/UnsplashAuthButton';

function MyComponent() {
  return <UnsplashAuthButton />;
}
```

### Authentication Status
```tsx
import { UnsplashAuthStatus } from '@/components/UnsplashAuthButton';

function MyComponent() {
  return <UnsplashAuthStatus />;
}
```

### Using Authentication Hook
```tsx
import { useUnsplashAuth } from '@/hooks/useUnsplashAuth';

function MyComponent() {
  const { 
    isAuthenticated, 
    authState, 
    login, 
    logout, 
    likePhoto 
  } = useUnsplashAuth();

  const handleLikePhoto = async (photoId: string) => {
    if (!isAuthenticated) {
      login();
      return;
    }
    
    const result = await likePhoto(photoId);
    if (result.success) {
      console.log('Photo liked!');
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {authState.user?.name}!</p>
      ) : (
        <button onClick={() => login()}>Connect to Unsplash</button>
      )}
    </div>
  );
}
```

### Accessing User's Liked Photos
```tsx
const { getUserLikedPhotos } = useUnsplashAuth();

const likedPhotos = await getUserLikedPhotos(1, 20);
```

## API Methods

### UnsplashProvider OAuth Methods

```typescript
// Check authentication status
provider.isAuthenticated(): boolean

// Get auth state
provider.getAuthState(): MediaProviderAuthState

// Like/unlike photos
provider.likePhoto(photoId: string): Promise<{success: boolean, error?: string}>
provider.unlikePhoto(photoId: string): Promise<{success: boolean, error?: string}>

// Get user content
provider.getUserLikedPhotos(page?: number, perPage?: number): Promise<ProviderResult>
provider.getUserPhotos(page?: number, perPage?: number): Promise<ProviderResult>

// OAuth management
provider.getAuthorizationUrl(state?: string): string | undefined
provider.handleOAuthCallback(code?, error?, state?): Promise<{success: boolean, error?: string}>
provider.signOut(): Promise<void>
```

## Security Considerations

1. **State Parameter**: Used to prevent CSRF attacks
2. **Token Storage**: Access tokens are stored in localStorage
3. **Scope Validation**: Requests validate required scopes before execution
4. **Error Handling**: Comprehensive error handling for OAuth failures

## Rate Limits

- **Public (Client-ID)**: 50 requests per hour
- **Authenticated (Bearer)**: 5000 requests per hour

## Error Handling

The implementation handles various OAuth errors:

- Invalid authorization code
- Network errors during token exchange
- Expired or invalid tokens
- Insufficient scopes for requested actions

## Testing

### Manual Testing
1. Start the development server
2. Navigate to a page with the UnsplashAuthButton
3. Click "Connect to Unsplash"
4. Complete OAuth flow on Unsplash
5. Verify authentication state and available features

### Unit Tests
```typescript
// Test OAuth service
describe('UnsplashOAuthService', () => {
  it('should generate authorization URL', () => {
    const service = new UnsplashOAuthService(config);
    const url = service.getAuthorizationUrl('test-state');
    expect(url).toContain('unsplash.com/oauth/authorize');
  });
});
```

## Troubleshooting

### Common Issues

1. **"OAuth not configured"**
   - Check environment variables are set correctly
   - Ensure UNSPLASH_SECRET_KEY is provided

2. **"Invalid redirect URI"**
   - Verify redirect URI in Unsplash app settings matches environment variable
   - Check for trailing slashes or protocol mismatches

3. **"Invalid state parameter"**
   - Clear browser storage and try again
   - Check for multiple OAuth attempts in same session

4. **Rate limit errors**
   - Authenticated requests have higher limits
   - Implement proper error handling and retry logic

## Future Enhancements

1. **Token Refresh**: Implement automatic token refresh (if Unsplash supports it)
2. **Batch Operations**: Support for batch liking/collecting photos
3. **User Collections**: Full collection management interface
4. **Photo Upload**: Support for uploading photos to Unsplash
5. **Analytics**: Track OAuth usage and success rates

## References

- [Unsplash API Documentation](https://unsplash.com/documentation)
- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)
- [Unsplash Developer Guidelines](https://unsplash.com/documentation#guidelines--crediting)
