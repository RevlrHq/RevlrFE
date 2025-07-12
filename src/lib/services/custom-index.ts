/* Custom services index - exports custom OpenAPI configuration */
/* This file allows you to use custom configurations without being overwritten */

// Export custom OpenAPI configuration
export { OpenAPI } from './core/custom-openapi-config';
export type { OpenAPIConfig } from './core/custom-openapi-config';

// Export other core utilities
export { ApiError } from './core/ApiError';
export { CancelablePromise, CancelError } from './core/CancelablePromise';

// Re-export generated models (these will be updated when codegen runs)
export type { HttpStatusCode } from './models/HttpStatusCode';
export type { StandardResponseOfstring } from './models/StandardResponseOfstring';
export type { StandardResponseOfUserView } from './models/StandardResponseOfUserView';
export type { UserView } from './models/UserView';
export type { VerifyAndRegisterUserInput } from './models/VerifyAndRegisterUserInput';

// Re-export generated services (these will be updated when codegen runs)
export { PasswordlessAuthService } from './services/PasswordlessAuthService';
export { TestService } from './services/TestService';
