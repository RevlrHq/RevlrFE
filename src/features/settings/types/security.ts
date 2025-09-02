/**
 * Security settings types and interfaces
 */

export interface SecuritySettings {
    twoFactorEnabled: boolean;
    emailChangeRequested: boolean;
    pendingEmail?: string;
    activeSessions: UserSession[];
    lastPasswordChange?: Date;
}

export interface UserSession {
    id: string;
    deviceName: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    location: string;
    ipAddress: string;
    lastActive: Date;
    isCurrent: boolean;
}

export interface EmailChangeRequest {
    newEmail: string;
    currentPassword: string;
}

export interface EmailChangeConfirmation {
    token: string;
    newEmail: string;
}

export interface PasswordChangeRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export interface TwoFactorSetupRequest {
    password: string;
}

export interface TwoFactorSetupResponse {
    qrCode: string;
    backupCodes: string[];
    secret: string;
}

export interface TwoFactorConfirmRequest {
    code: string;
    secret: string;
}

export interface SessionTerminationRequest {
    sessionId: string;
    terminateAll?: boolean;
}

export interface EmailChangeFormProps {
    currentEmail: string;
    onSubmit: (request: EmailChangeRequest) => Promise<void>;
    isLoading?: boolean;
}

export interface SessionManagerProps {
    sessions: UserSession[];
    onTerminateSession: (sessionId: string) => Promise<void>;
    onTerminateAll: () => Promise<void>;
    isLoading?: boolean;
}

export interface SessionItemProps {
    session: UserSession;
    onTerminate: (sessionId: string) => Promise<void>;
    isTerminating?: boolean;
}

export interface PasswordSettingsProps {
    lastPasswordChange?: Date;
    onChangePassword: (request: PasswordChangeRequest) => Promise<void>;
    isLoading?: boolean;
}

export interface TwoFactorAuthProps {
    isEnabled: boolean;
    onEnable: (
        request: TwoFactorSetupRequest
    ) => Promise<TwoFactorSetupResponse>;
    onDisable: (password: string) => Promise<void>;
    onConfirm: (request: TwoFactorConfirmRequest) => Promise<void>;
    isLoading?: boolean;
}
