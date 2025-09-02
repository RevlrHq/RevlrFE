/**
 * Profile settings types and interfaces
 */

export interface ProfileFormData {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    organizationName?: string;
    organizationWebsite?: string;
    bio?: string;
    avatar?: File | string;
}

export interface ProfileUpdateRequest {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    organizationName?: string;
    organizationWebsite?: string;
    bio?: string;
}

export interface AvatarUploadRequest {
    file: File;
    userId: string;
}

export interface AvatarUploadResponse {
    success: boolean;
    avatarUrl?: string;
    message?: string;
}

export interface ContactInformationData {
    email: string;
    phoneNumber: string;
}

export interface PersonalDetailsData {
    firstName: string;
    lastName: string;
    bio?: string;
}

export interface OrganizationInfoData {
    organizationName?: string;
    organizationWebsite?: string;
}

export interface ProfileFormProps {
    initialData: ProfileFormData;
    onSubmit: (data: ProfileUpdateRequest) => Promise<void>;
    isLoading?: boolean;
}

export interface AvatarUploadProps {
    currentAvatar?: string;
    onUpload: (file: File) => Promise<void>;
    isUploading?: boolean;
}

export interface ContactInformationProps {
    data: ContactInformationData;
    onChange: (data: ContactInformationData) => void;
    errors?: Record<string, string>;
}

export interface PersonalDetailsProps {
    data: PersonalDetailsData;
    onChange: (data: PersonalDetailsData) => void;
    errors?: Record<string, string>;
}

export interface OrganizationInfoProps {
    data: OrganizationInfoData;
    onChange: (data: OrganizationInfoData) => void;
    errors?: Record<string, string>;
}
