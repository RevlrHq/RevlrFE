/**
 * Shared settings types and interfaces
 */

export interface SettingsSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export interface SettingsCardProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export interface SettingsFormFieldProps {
    label: string;
    description?: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
}

export interface SaveButtonProps {
    isLoading?: boolean;
    disabled?: boolean;
    onClick: () => void;
    text?: string;
    className?: string;
}

export interface CancelButtonProps {
    onClick: () => void;
    text?: string;
    className?: string;
}

export interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    isLoading?: boolean;
}

export interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
    className?: string;
}

export interface SuccessMessageProps {
    message: string;
    onDismiss?: () => void;
    autoHide?: boolean;
    duration?: number;
    className?: string;
}

export interface FormValidationError {
    field: string;
    message: string;
    code?: string;
}

export interface ApiError {
    message: string;
    code?: string;
    field?: string;
    details?: Record<string, unknown>;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
}

export interface SortInfo {
    field: string;
    direction: 'asc' | 'desc';
}

export interface FilterInfo {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
    value: unknown;
}

export interface SearchInfo {
    query: string;
    fields?: string[];
}

export interface SettingsQuery {
    pagination?: PaginationInfo;
    sort?: SortInfo[];
    filters?: FilterInfo[];
    search?: SearchInfo;
}

export interface SettingsListResponse<T> {
    data: T[];
    pagination: PaginationInfo;
    total: number;
}

export interface SettingsFormHook<T> {
    data: T;
    errors: Record<string, string>;
    isDirty: boolean;
    isValid: boolean;
    isSubmitting: boolean;
    setValue: (field: keyof T, value: T[keyof T]) => void;
    setError: (field: keyof T, message: string) => void;
    clearError: (field: keyof T) => void;
    reset: (newData?: T) => void;
    submit: () => Promise<void>;
    validate: () => boolean;
}

export interface SettingsNavigationHook {
    currentSection: string;
    sections: import('./core').SettingsSection[];
    navigateToSection: (sectionId: string) => void;
    canNavigate: (sectionId: string) => boolean;
    hasUnsavedChanges: boolean;
}

export interface SettingsStateHook<T> {
    data: T | null;
    isLoading: boolean;
    error: ApiError | null;
    refetch: () => Promise<void>;
    update: (updates: Partial<T>) => Promise<void>;
    reset: () => void;
}
