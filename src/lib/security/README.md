# SignalR Security Implementation

This directory contains comprehensive security utilities for the SignalR integration rewrite, implementing data validation, sanitization, rate limiting, and XSS prevention measures.

## Overview

The security implementation provides multiple layers of protection:

1. **Data Sanitization** - HTML content sanitization and input validation
2. **Rate Limiting** - Client-side rate limiting to prevent abuse
3. **Token Security** - JWT token validation and secure storage
4. **SignalR Middleware** - Security middleware for SignalR connections

## Components

### Data Sanitization (`sanitization.ts`)

Provides comprehensive data sanitization and validation:

- **HTML Sanitization**: Uses DOMPurify to sanitize HTML content
- **Input Validation**: Validates notification messages and user actions
- **XSS Prevention**: Blocks dangerous scripts and event handlers
- **URL Sanitization**: Prevents javascript: and data: URL attacks

```typescript
import {
    sanitizeNotificationContent,
    validateNotificationMessage,
} from '@/lib/security';

// Sanitize HTML content
const safeContent = sanitizeNotificationContent(
    '<p>Hello <script>alert("xss")</script></p>'
);
// Result: '<p>Hello </p>'

// Validate notification structure
const validation = validateNotificationMessage(notificationData);
if (!validation.isValid) {
    console.debug('Invalid notification:', validation.errors);
}
```

### Rate Limiting (`rate-limiting.ts`)

Client-side rate limiting to prevent abuse:

- **Configurable Limits**: Set max requests per time window
- **Multiple Limiters**: Separate limits for different operations
- **Blocking Behavior**: Temporary blocking when limits exceeded
- **Key-based Tracking**: Per-user and per-action rate limiting

```typescript
import { checkSignalRMethodLimit, recordSignalRMethod } from '@/lib/security';

// Check if method call is allowed
const limitResult = checkSignalRMethodLimit('user123', 'JoinGroup');
if (!limitResult.allowed) {
    throw new Error(
        `Rate limit exceeded. Retry after ${limitResult.retryAfter}ms`
    );
}

// Record the method call
recordSignalRMethod('user123', 'JoinGroup', true);
```

### Token Security (`token-security.ts`)

JWT token validation and secure storage:

- **Token Validation**: Validates JWT format and expiration
- **Secure Storage**: Obfuscated token storage in localStorage/sessionStorage
- **Refresh Management**: Automatic token refresh with retry logic
- **Scope Checking**: Validate token permissions

```typescript
import { validateTokenFormat, SecureTokenStorage } from '@/lib/security';

// Validate token
const validation = validateTokenFormat(token);
if (!validation.isValid) {
    console.debug('Invalid token:', validation.errors);
}

// Secure storage
const storage = new SecureTokenStorage();
storage.setToken('access', token);
const retrievedToken = storage.getToken('access');
```

### SignalR Security Middleware (`signalr-security-middleware.ts`)

Security middleware for SignalR connections:

- **Method Whitelisting**: Only allow approved SignalR methods
- **Data Sanitization**: Automatic sanitization of method arguments
- **Rate Limiting Integration**: Built-in rate limiting for method calls
- **Violation Tracking**: Track and log security violations

```typescript
import { createSecurityMiddleware } from '@/lib/security';

const middleware = createSecurityMiddleware({
    enableRateLimiting: true,
    enableDataSanitization: true,
    allowedMethods: ['JoinGroup', 'LeaveGroup', 'SendNotification'],
});

const secureConnection = middleware.wrapConnection(hubConnection, token);
await secureConnection.secureInvoke('JoinGroup', 'group1');
```

### Security Hook (`useSignalRSecurity.ts`)

React hook for integrated security management:

- **Token Management**: Automatic token validation and refresh
- **Rate Limiting**: Built-in rate limit checking
- **Data Validation**: Notification and action validation
- **Security Status**: Real-time security status monitoring

```typescript
import { useSignalRSecurity } from '@/hooks/useSignalRSecurity';

const security = useSignalRSecurity({
    enableRateLimiting: true,
    enableTokenValidation: true,
    enableDataSanitization: true,
});

// Check if method is allowed
const limitResult = security.checkMethodLimit('JoinGroup');
if (!limitResult.allowed) {
    // Handle rate limit
}

// Validate and sanitize notification
const securityResult = security.validateAndSanitizeNotification(notification);
if (securityResult.allowed) {
    // Process sanitized notification
    processNotification(securityResult.sanitizedData);
}
```

## Security Features

### XSS Prevention

- Removes dangerous HTML tags (`<script>`, `<iframe>`, `<object>`, etc.)
- Strips event handlers (`onclick`, `onerror`, etc.)
- Sanitizes URLs to prevent `javascript:` and `data:` attacks
- Validates and escapes user input

### Rate Limiting

- **SignalR Methods**: 30 requests per minute
- **Notification Actions**: 100 requests per minute
- **Connections**: 10 attempts per 5 minutes
- **Input Validation**: 200 requests per minute

### Token Security

- JWT format validation
- Expiration checking
- Automatic refresh (10 minutes before expiry)
- Secure storage with obfuscation
- Scope and permission validation

### Data Validation

- Required field validation
- Type checking
- Format validation (email, URLs, etc.)
- Content length limits
- Dangerous pattern detection

## Testing

Comprehensive test suites cover:

- **Sanitization Tests**: XSS prevention, HTML sanitization, input validation
- **Rate Limiting Tests**: Limit enforcement, key isolation, configuration options
- **Token Security Tests**: JWT validation, storage operations, refresh logic
- **Middleware Tests**: Method whitelisting, data sanitization, violation tracking

Run tests:

```bash
pnpm test src/lib/security/__tests__/sanitization.test.ts
pnpm test src/lib/security/__tests__/rate-limiting-simple.test.ts
pnpm test src/lib/security/__tests__/signalr-security-middleware.test.ts
```

## Configuration

### Environment Variables

```env
# SignalR Hub URL (already configured)
NEXT_PUBLIC_SIGNALR_HUB_URL=wss://api.example.com/signalrhub
```

### Security Configuration

```typescript
// Default security configuration
const securityConfig = {
    enableRateLimiting: true,
    enableTokenValidation: true,
    enableDataSanitization: true,
    enableXSSPrevention: true,
    logSecurityEvents: process.env.NODE_ENV === 'development',
};
```

## Integration

The security utilities integrate with:

- **SignalR Hooks**: `useSignalR`, `useTypedNotificationHandler`
- **Authentication**: `useAuthStore`, JWT token management
- **Error Handling**: `useSignalRErrorHandler`
- **Notification System**: Toast notifications, validation

## Security Best Practices

1. **Always sanitize** user input and notification content
2. **Validate tokens** before making SignalR calls
3. **Check rate limits** before performing actions
4. **Log security events** in development for debugging
5. **Use secure storage** for sensitive tokens
6. **Implement proper error handling** for security failures
7. **Monitor security violations** and adjust limits as needed

## Production Considerations

- Rate limits may need adjustment based on usage patterns
- Security logging should be configured for monitoring
- Token refresh intervals should match backend configuration
- Storage encryption may be needed for highly sensitive applications
- Consider implementing server-side rate limiting as well

This security implementation provides comprehensive protection for the SignalR integration while maintaining good performance and user experience.
