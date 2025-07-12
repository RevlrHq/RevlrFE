# OpenAPI Generated Services

This directory contains auto-generated TypeScript services based on the OpenAPI specification.

## Custom Configuration

To prevent important files from being overwritten during code generation, we use custom files:

- **Generated files**: 
  - `core/request.ts` - Gets overwritten on every codegen run
  - `core/OpenAPI.ts` - Gets overwritten on every codegen run
  - `index.ts` - Gets overwritten on every codegen run
- **Custom files** (safe to modify):
  - `core/custom-request.ts` - Custom request handler
  - `core/custom-openapi-config.ts` - Custom OpenAPI configuration with environment variables
  - `custom-index.ts` - Custom exports that use your custom configurations

## How it works

1. The `codegen` script in `package.json` uses the `--request` flag to specify our custom request file
2. The custom request file (`custom-request.ts`) is based on the original generated request file
3. You can safely modify the custom request file to add authentication, interceptors, or other customizations
4. When you run `npm run codegen`, only the models and services will be regenerated, but your custom request logic will be preserved

## Environment Configuration

The API base URL is now configured through environment variables:

- Set `NEXT_PUBLIC_API_URL` in your `.env.local` file
- Example: `NEXT_PUBLIC_API_URL=https://api.revlr.io`
- If not set, it falls back to `http://api-dev.revlr.io`

## Usage

Import from the custom index to use the environment-configured API:

```typescript
// Use this import to get environment-configured API
import { OpenAPI, PasswordlessAuthService } from '@/lib/services/custom-index';

// The OpenAPI.BASE will automatically use NEXT_PUBLIC_API_URL
console.log(OpenAPI.BASE); // Uses environment variable
```

## Running Code Generation

```bash
npm run codegen
```

This command:
1. Merges OpenAPI specifications using `openapi-merge-cli`
2. Generates TypeScript services using `openapi-typescript-codegen` with the custom request file

## Customizing Requests

To customize request behavior (e.g., add authentication tokens, request interceptors, etc.), modify the `custom-request.ts` file:

```typescript
// Example: Add authentication token
export const getHeaders = async (
    config: OpenAPIConfig,
    options: ApiRequestOptions,
    formData?: FormData
): Promise<Record<string, string>> => {
    // Your custom logic here
    const token = getAuthToken(); // Your custom token logic
    
    const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
    };
    
    return headers;
};
```

## Files Structure

- `core/` - Core API utilities
  - `custom-request.ts` - Custom request handler (safe to modify)
  - `request.ts` - Generated request handler (gets overwritten)
  - `OpenAPI.ts` - OpenAPI configuration
  - `ApiError.ts` - Error handling
  - `ApiRequestOptions.ts` - Request options types
  - `ApiResult.ts` - Result types
  - `CancelablePromise.ts` - Promise utilities
- `models/` - Generated TypeScript models
- `services/` - Generated API service classes
