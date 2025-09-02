/**
 * Account settings types and interfaces
 */

export interface AccountSettings {
    accountInfo: AccountInfo;
    dataRetention: DataRetentionSettings;
    deletionRequest?: AccountDeletionRequest;
}

export interface AccountInfo {
    userId: string;
    email: string;
    createdAt: Date;
    lastLoginAt: Date;
    accountType: AccountType;
    status: AccountStatus;
    verificationStatus: VerificationStatus;
}

export type AccountType = 'individual' | 'organization' | 'enterprise';
export type AccountStatus =
    | 'active'
    | 'suspended'
    | 'pending_deletion'
    | 'deleted';
export type VerificationStatus =
    | 'unverified'
    | 'pending'
    | 'verified'
    | 'rejected';

export interface DataRetentionSettings {
    retainEventData: boolean;
    retainAnalytics: boolean;
    retainMediaFiles: boolean;
    retentionPeriodDays: number;
    autoDeleteAfterInactivity: boolean;
    inactivityPeriodDays: number;
}

export interface AccountDeletionRequest {
    id: string;
    userId: string;
    reason: DeletionReason;
    customReason?: string;
    requestedAt: Date;
    scheduledAt: Date;
    status: DeletionStatus;
    dataRetention: DataRetentionChoice[];
    confirmationToken: string;
}

export type DeletionReason =
    | 'no_longer_needed'
    | 'privacy_concerns'
    | 'switching_platforms'
    | 'cost_concerns'
    | 'technical_issues'
    | 'other';

export type DeletionStatus =
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'completed'
    | 'cancelled';

export interface DataRetentionChoice {
    dataType: string;
    retain: boolean;
    retentionPeriodDays?: number;
}

export interface AccountDeletionConfirmation {
    password: string;
    confirmationText: string;
    dataRetention: DataRetentionChoice[];
    reason: DeletionReason;
    customReason?: string;
}

export interface AccountInfoProps {
    accountInfo: AccountInfo;
    onRefresh: () => Promise<void>;
    isLoading?: boolean;
}

export interface DataRetentionProps {
    settings: DataRetentionSettings;
    onChange: (settings: DataRetentionSettings) => void;
    onSave: () => Promise<void>;
    isLoading?: boolean;
}

export interface AccountDeletionProps {
    onRequestDeletion: (
        confirmation: AccountDeletionConfirmation
    ) => Promise<void>;
    onCancelDeletion: () => Promise<void>;
    existingRequest?: AccountDeletionRequest;
    isLoading?: boolean;
}

export interface DeletionConfirmationProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (confirmation: AccountDeletionConfirmation) => Promise<void>;
    isLoading?: boolean;
}

export interface DangerZoneProps {
    onRequestDeletion: () => void;
    onExportData: () => void;
    hasActiveSubscription: boolean;
    hasPendingDeletion: boolean;
}

export interface AccountVerification {
    type: 'email' | 'phone' | 'identity';
    status: VerificationStatus;
    verifiedAt?: Date;
    expiresAt?: Date;
}

export interface AccountActivity {
    id: string;
    type: ActivityType;
    description: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    location?: string;
}

export type ActivityType =
    | 'login'
    | 'logout'
    | 'password_change'
    | 'email_change'
    | 'profile_update'
    | 'settings_change'
    | 'data_export'
    | 'account_deletion_request';
