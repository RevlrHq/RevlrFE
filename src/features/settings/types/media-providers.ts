/**
 * Media provider settings types and interfaces
 */

export interface MediaProvider {
    id: string;
    name: string;
    type: MediaProviderType;
    description: string;
    icon: string;
    isConnected: boolean;
    connectionStatus: ConnectionStatus;
    permissions: ProviderPermission[];
    connectedAt?: Date;
    lastSync?: Date;
    config?: ProviderConfig;
}

export type MediaProviderType =
    | 'unsplash'
    | 'pexels'
    | 'shutterstock'
    | 'getty'
    | 'adobe'
    | 'google_drive'
    | 'dropbox'
    | 'onedrive';

export type ConnectionStatus =
    | 'connected'
    | 'disconnected'
    | 'error'
    | 'pending'
    | 'expired';

export interface ProviderPermission {
    id: string;
    name: string;
    description: string;
    required: boolean;
    granted: boolean;
}

export interface ProviderConfig {
    apiKey?: string;
    clientId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    customSettings?: Record<string, unknown>;
}

export interface MediaProviderConnection {
    providerId: string;
    authUrl?: string;
    permissions: string[];
    config?: Partial<ProviderConfig>;
}

export interface MediaProviderDisconnection {
    providerId: string;
    revokeAccess: boolean;
}

export interface ConnectedProvidersProps {
    providers: MediaProvider[];
    onConnect: (connection: MediaProviderConnection) => Promise<void>;
    onDisconnect: (disconnection: MediaProviderDisconnection) => Promise<void>;
    onRefresh: (providerId: string) => Promise<void>;
    isLoading?: boolean;
}

export interface ProviderCardProps {
    provider: MediaProvider;
    onConnect: () => void;
    onDisconnect: () => void;
    onConfigure: () => void;
    isLoading?: boolean;
}

export interface ConnectionDialogProps {
    provider: MediaProvider;
    isOpen: boolean;
    onClose: () => void;
    onConnect: (connection: MediaProviderConnection) => Promise<void>;
}

export interface PermissionManagerProps {
    provider: MediaProvider;
    onUpdatePermissions: (permissions: string[]) => Promise<void>;
    isLoading?: boolean;
}

export interface ProviderStatusProps {
    status: ConnectionStatus;
    lastSync?: Date;
    error?: string;
}

export interface MediaProviderSearchResult {
    id: string;
    providerId: string;
    url: string;
    thumbnailUrl: string;
    title?: string;
    description?: string;
    tags: string[];
    license: string;
    attribution?: string;
}

export interface MediaProviderSearchRequest {
    query: string;
    providers: string[];
    filters?: {
        license?: string[];
        size?: string;
        orientation?: 'landscape' | 'portrait' | 'square';
        color?: string;
    };
    pagination?: {
        page: number;
        limit: number;
    };
}
