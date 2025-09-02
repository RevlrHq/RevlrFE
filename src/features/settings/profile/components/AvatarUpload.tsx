import React, { useState, useRef, useCallback } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import { LoadingSpinner } from '../../shared/components';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Upload,
    X,
    User,
    Camera,
    AlertCircle,
    Trash2,
    RotateCcw,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';

interface AvatarUploadProps {
    currentAvatar?: string;
    userName: string;
    className?: string;
}

/**
 * AvatarUpload - Component for avatar management with drag-and-drop
 *
 * Features:
 * - Drag and drop file upload
 * - Image preview and cropping
 * - File validation and error handling
 * - Avatar removal with confirmation
 *
 * Requirements: 1.1, 1.3, 9.1
 */
export const AvatarUpload: React.FC<AvatarUploadProps> = ({
    currentAvatar,
    userName,
    className,
}) => {
    const { uploadAvatar, removeAvatar, isUploadingAvatar, error } =
        useProfileStore();
    const [isDragOver, setIsDragOver] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showCropDialog, setShowCropDialog] = useState(false);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // File validation
    const validateFile = (file: File): string | null => {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            return 'Please upload a JPEG, PNG, or WebP image';
        }

        if (file.size > maxSize) {
            return 'Image must be smaller than 5MB';
        }

        return null;
    };

    // Handle file selection
    const handleFileSelect = useCallback((file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setUploadError(validationError);
            return;
        }

        setUploadError(null);
        setSelectedFile(file);

        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setShowCropDialog(true);
    }, []);

    // Handle drag events
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        },
        [handleFileSelect]
    );

    // Handle file input change
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    // Handle upload
    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            await uploadAvatar(selectedFile);
            setShowCropDialog(false);
            setSelectedFile(null);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
        } catch (err) {
            setUploadError(
                err instanceof Error ? err.message : 'Failed to upload avatar'
            );
        }
    };

    // Handle remove avatar
    const handleRemoveAvatar = async () => {
        try {
            await removeAvatar();
            setShowRemoveDialog(false);
        } catch (err) {
            setUploadError(
                err instanceof Error ? err.message : 'Failed to remove avatar'
            );
        }
    };

    // Cancel upload
    const handleCancel = () => {
        setShowCropDialog(false);
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setUploadError(null);
    };

    // Get user initials for fallback
    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map((part) => part.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className={className}>
            {/* Error Display */}
            {(uploadError || error) && (
                <Alert variant='destructive' className='mb-4'>
                    <AlertCircle className='size-4' />
                    <AlertDescription>{uploadError || error}</AlertDescription>
                </Alert>
            )}

            <div className='flex items-start gap-6'>
                {/* Avatar Display */}
                <div className='relative'>
                    <div className='size-24 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100'>
                        {currentAvatar ? (
                            <img
                                src={currentAvatar}
                                alt={`${userName}'s avatar`}
                                className='size-full object-cover'
                            />
                        ) : (
                            <div className='flex size-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-semibold text-white'>
                                {getUserInitials(userName)}
                            </div>
                        )}
                    </div>

                    {/* Loading Overlay */}
                    {isUploadingAvatar && (
                        <div className='absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50'>
                            <LoadingSpinner size='sm' className='text-white' />
                        </div>
                    )}
                </div>

                {/* Upload Controls */}
                <div className='flex-1 space-y-3'>
                    {/* Drag and Drop Area */}
                    <div
                        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                            isDragOver
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                        } `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className='mx-auto mb-2 size-8 text-gray-400' />
                        <p className='mb-1 text-sm text-gray-600'>
                            Drag and drop an image here, or click to browse
                        </p>
                        <p className='text-xs text-gray-500'>
                            JPEG, PNG, or WebP • Max 5MB
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex gap-2'>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                        >
                            <Camera className='mr-2 size-4' />
                            Choose Photo
                        </Button>

                        {currentAvatar && (
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setShowRemoveDialog(true)}
                                disabled={isUploadingAvatar}
                                className='text-red-600 hover:text-red-700'
                            >
                                <Trash2 className='mr-2 size-4' />
                                Remove
                            </Button>
                        )}
                    </div>

                    {/* Hidden File Input */}
                    <input
                        ref={fileInputRef}
                        type='file'
                        accept='image/jpeg,image/png,image/webp'
                        onChange={handleFileInputChange}
                        className='hidden'
                    />
                </div>
            </div>

            {/* Crop/Preview Dialog */}
            <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
                <DialogContent className='max-w-md'>
                    <DialogHeader>
                        <DialogTitle>Upload Avatar</DialogTitle>
                    </DialogHeader>

                    <div className='space-y-4'>
                        {/* Preview */}
                        {previewUrl && (
                            <div className='flex justify-center'>
                                <div className='size-32 overflow-hidden rounded-full border-2 border-gray-200'>
                                    <img
                                        src={previewUrl}
                                        alt='Avatar preview'
                                        className='size-full object-cover'
                                    />
                                </div>
                            </div>
                        )}

                        <p className='text-center text-sm text-gray-600'>
                            Your avatar will be cropped to a square and resized
                            automatically.
                        </p>

                        {/* Action Buttons */}
                        <div className='flex justify-end gap-2'>
                            <Button
                                variant='outline'
                                onClick={handleCancel}
                                disabled={isUploadingAvatar}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={isUploadingAvatar}
                            >
                                {isUploadingAvatar ? (
                                    <>
                                        <LoadingSpinner
                                            size='sm'
                                            className='mr-2'
                                        />
                                        Uploading...
                                    </>
                                ) : (
                                    'Upload Avatar'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Remove Confirmation Dialog */}
            <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
                <DialogContent className='max-w-md'>
                    <DialogHeader>
                        <DialogTitle>Remove Avatar</DialogTitle>
                    </DialogHeader>

                    <div className='space-y-4'>
                        <p className='text-sm text-gray-600'>
                            Are you sure you want to remove your profile
                            picture? This action cannot be undone.
                        </p>

                        <div className='flex justify-end gap-2'>
                            <Button
                                variant='outline'
                                onClick={() => setShowRemoveDialog(false)}
                                disabled={isUploadingAvatar}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant='destructive'
                                onClick={handleRemoveAvatar}
                                disabled={isUploadingAvatar}
                            >
                                {isUploadingAvatar ? (
                                    <>
                                        <LoadingSpinner
                                            size='sm'
                                            className='mr-2'
                                        />
                                        Removing...
                                    </>
                                ) : (
                                    'Remove Avatar'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
