'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { MediaItem } from '@/types/media-search';
import {
    X,
    Download,
    Eye,
    Trash2,
    Grid,
    List,
    ArrowUp,
    ArrowDown,
    Check,
    AlertTriangle,
    Image as ImageIcon,
    Video,
    Info,
} from 'lucide-react';

interface SelectedMediaPanelProps {
    selectedItems: MediaItem[];
    onRemoveItem: (itemId: string) => void;
    onClearAll: () => void;
    onPreviewItem: (item: MediaItem) => void;
    onDownloadSelected: () => Promise<void>;
    onReorderItems?: (items: MediaItem[]) => void;
    maxSelections?: number;
    isDownloading?: boolean;
    downloadProgress?: number;
    className?: string;
}

export const SelectedMediaPanel: React.FC<SelectedMediaPanelProps> = ({
    selectedItems,
    onRemoveItem,
    onClearAll,
    onPreviewItem,
    onDownloadSelected,
    onReorderItems,
    maxSelections = 10,
    isDownloading = false,
    downloadProgress = 0,
    className = '',
}) => {
    const { theme } = useTheme();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Calculate total file size
    const totalFileSize = useMemo(() => {
        return selectedItems.reduce(
            (total, item) => total + (item.fileSize || 0),
            0
        );
    }, [selectedItems]);

    // Format file size
    const formatFileSize = useCallback((bytes: number) => {
        if (bytes === 0) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
    }, []);

    // Get selection status
    const selectionStatus = useMemo(() => {
        const count = selectedItems.length;
        const isAtLimit = count >= maxSelections;
        const isEmpty = count === 0;

        return {
            count,
            maxSelections,
            isAtLimit,
            isEmpty,
            percentage: (count / maxSelections) * 100,
        };
    }, [selectedItems.length, maxSelections]);

    // Drag and drop handlers
    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', ''); // Required for Firefox
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOverIndex(null);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent, dropIndex: number) => {
            e.preventDefault();

            if (
                draggedIndex === null ||
                draggedIndex === dropIndex ||
                !onReorderItems
            ) {
                setDraggedIndex(null);
                setDragOverIndex(null);
                return;
            }

            const newItems = [...selectedItems];
            const draggedItem = newItems[draggedIndex];

            // Remove the dragged item
            newItems.splice(draggedIndex, 1);

            // Insert at new position
            const insertIndex =
                draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
            newItems.splice(insertIndex, 0, draggedItem);

            onReorderItems(newItems);
            setDraggedIndex(null);
            setDragOverIndex(null);
        },
        [draggedIndex, selectedItems, onReorderItems]
    );

    const handleDragEnd = useCallback(() => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    }, []);

    // Move item up/down
    const moveItem = useCallback(
        (index: number, direction: 'up' | 'down') => {
            if (!onReorderItems) return;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= selectedItems.length) return;

            const newItems = [...selectedItems];
            [newItems[index], newItems[newIndex]] = [
                newItems[newIndex],
                newItems[index],
            ];
            onReorderItems(newItems);
        },
        [selectedItems, onReorderItems]
    );

    if (selectionStatus.isEmpty) {
        return (
            <div
                className={`w-80 border-l border-gray-200 bg-white dark:border-revlr-dark-border dark:bg-revlr-dark-card ${className}`}
            >
                <div className='p-6'>
                    <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
                        Selected Images
                    </h3>
                    <div className='py-12 text-center'>
                        <ImageIcon className='mx-auto mb-4 size-12 text-gray-400' />
                        <p className='mb-2 text-sm text-gray-500 dark:text-gray-400'>
                            No images selected
                        </p>
                        <p className='text-xs text-gray-400 dark:text-gray-500'>
                            Select up to {maxSelections} images for your event
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex w-80 flex-col border-l border-gray-200 bg-white dark:border-revlr-dark-border dark:bg-revlr-dark-card ${className}`}
        >
            {/* Header */}
            <div className='border-b border-gray-200 p-6 dark:border-revlr-dark-border'>
                <div className='mb-4 flex items-center justify-between'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                        Selected Images
                    </h3>
                    <div className='flex items-center space-x-2'>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`rounded p-1 ${
                                viewMode === 'grid'
                                    ? 'bg-revlr-primary-blue text-white'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                            title='Grid view'
                        >
                            <Grid className='size-4' />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`rounded p-1 ${
                                viewMode === 'list'
                                    ? 'bg-revlr-primary-blue text-white'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                            title='List view'
                        >
                            <List className='size-4' />
                        </button>
                    </div>
                </div>

                {/* Selection status */}
                <div className='space-y-3'>
                    <div className='flex items-center justify-between text-sm'>
                        <span className='text-gray-600 dark:text-gray-400'>
                            {selectionStatus.count} of {maxSelections} selected
                        </span>
                        {totalFileSize > 0 && (
                            <span className='text-gray-500 dark:text-gray-400'>
                                {formatFileSize(totalFileSize)}
                            </span>
                        )}
                    </div>

                    {/* Progress bar */}
                    <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-revlr-dark-border'>
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                                selectionStatus.isAtLimit
                                    ? 'bg-orange-500'
                                    : 'bg-revlr-primary-blue'
                            }`}
                            style={{ width: `${selectionStatus.percentage}%` }}
                        />
                    </div>

                    {selectionStatus.isAtLimit && (
                        <div className='flex items-center space-x-2 text-orange-600 dark:text-orange-400'>
                            <AlertTriangle className='size-4' />
                            <span className='text-xs'>
                                Maximum selection reached
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Selected items list */}
            <div className='flex-1 overflow-y-auto p-4'>
                {viewMode === 'grid' ? (
                    <div className='grid grid-cols-2 gap-3'>
                        {selectedItems.map((item, index) => (
                            <SelectedMediaCard
                                key={`${item.providerId}-${item.id}`}
                                item={item}
                                index={index}
                                onRemove={() =>
                                    onRemoveItem(
                                        `${item.providerId}-${item.id}`
                                    )
                                }
                                onPreview={() => onPreviewItem(item)}
                                onMoveUp={
                                    index > 0
                                        ? () => moveItem(index, 'up')
                                        : undefined
                                }
                                onMoveDown={
                                    index < selectedItems.length - 1
                                        ? () => moveItem(index, 'down')
                                        : undefined
                                }
                                isDragging={draggedIndex === index}
                                isDragOver={dragOverIndex === index}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                canReorder={!!onReorderItems}
                            />
                        ))}
                    </div>
                ) : (
                    <div className='space-y-2'>
                        {selectedItems.map((item, index) => (
                            <SelectedMediaListItem
                                key={`${item.providerId}-${item.id}`}
                                item={item}
                                index={index}
                                onRemove={() =>
                                    onRemoveItem(
                                        `${item.providerId}-${item.id}`
                                    )
                                }
                                onPreview={() => onPreviewItem(item)}
                                onMoveUp={
                                    index > 0
                                        ? () => moveItem(index, 'up')
                                        : undefined
                                }
                                onMoveDown={
                                    index < selectedItems.length - 1
                                        ? () => moveItem(index, 'down')
                                        : undefined
                                }
                                isDragging={draggedIndex === index}
                                isDragOver={dragOverIndex === index}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                canReorder={!!onReorderItems}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className='border-t border-gray-200 p-6 dark:border-revlr-dark-border'>
                <div className='space-y-3'>
                    {/* Download progress */}
                    {isDownloading && (
                        <div className='space-y-2'>
                            <div className='flex items-center justify-between text-sm'>
                                <span className='text-gray-600 dark:text-gray-400'>
                                    Downloading...
                                </span>
                                <span className='text-gray-500 dark:text-gray-400'>
                                    {Math.round(downloadProgress)}%
                                </span>
                            </div>
                            <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-revlr-dark-border'>
                                <div
                                    className='h-2 rounded-full bg-revlr-primary-blue transition-all duration-300'
                                    style={{ width: `${downloadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <button
                        onClick={onDownloadSelected}
                        disabled={isDownloading || selectionStatus.isEmpty}
                        className='w-full rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-4 py-3 font-inter font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                        <div className='flex items-center justify-center space-x-2'>
                            <Download className='size-4' />
                            <span>
                                {isDownloading
                                    ? 'Downloading...'
                                    : `Use Selected (${selectionStatus.count})`}
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={onClearAll}
                        disabled={isDownloading || selectionStatus.isEmpty}
                        className='w-full rounded-xl border border-gray-300 px-4 py-3 font-inter font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-revlr-dark-border dark:text-gray-200 dark:hover:bg-revlr-dark-border'
                    >
                        <div className='flex items-center justify-center space-x-2'>
                            <Trash2 className='size-4' />
                            <span>Clear All</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Selected Media Card Component (Grid View)
interface SelectedMediaCardProps {
    item: MediaItem;
    index: number;
    onRemove: () => void;
    onPreview: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isDragging: boolean;
    isDragOver: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onDragEnd: () => void;
    canReorder: boolean;
}

const SelectedMediaCard: React.FC<SelectedMediaCardProps> = ({
    item,
    index,
    onRemove,
    onPreview,
    onMoveUp,
    onMoveDown,
    isDragging,
    isDragOver,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    canReorder,
}) => {
    return (
        <div
            className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                isDragging
                    ? 'scale-95 opacity-50'
                    : isDragOver
                      ? 'border-revlr-primary-blue bg-revlr-primary-blue/10'
                      : 'border-gray-200 hover:border-revlr-primary-blue/50 dark:border-revlr-dark-border'
            }`}
            draggable={canReorder}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >
            {/* Image */}
            <img
                src={item.thumbnailUrl}
                alt={item.title}
                className='h-full w-full object-cover'
            />

            {/* Order indicator */}
            <div className='absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white'>
                {index + 1}
            </div>

            {/* Media type indicator */}
            {item.mediaType === 'video' && (
                <div className='absolute right-2 top-2 rounded bg-purple-500/80 px-2 py-1 text-xs font-medium text-white'>
                    <Video className='size-3' />
                </div>
            )}

            {/* Hover overlay */}
            <div className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
                <div className='flex space-x-2'>
                    <button
                        onClick={onPreview}
                        className='rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30'
                        title='Preview'
                    >
                        <Eye className='size-4' />
                    </button>
                    <button
                        onClick={onRemove}
                        className='rounded-full bg-red-500/80 p-2 text-white transition-colors hover:bg-red-500'
                        title='Remove'
                    >
                        <X className='size-4' />
                    </button>
                </div>
            </div>

            {/* Reorder controls */}
            {canReorder && (
                <div className='absolute bottom-2 right-2 flex flex-col space-y-1 opacity-0 transition-opacity group-hover:opacity-100'>
                    {onMoveUp && (
                        <button
                            onClick={onMoveUp}
                            className='rounded bg-black/70 p-1 text-white transition-colors hover:bg-black/90'
                            title='Move up'
                        >
                            <ArrowUp className='size-3' />
                        </button>
                    )}
                    {onMoveDown && (
                        <button
                            onClick={onMoveDown}
                            className='rounded bg-black/70 p-1 text-white transition-colors hover:bg-black/90'
                            title='Move down'
                        >
                            <ArrowDown className='size-3' />
                        </button>
                    )}
                </div>
            )}

            {/* Attribution indicator */}
            {item.attribution.required && (
                <div className='absolute bottom-2 left-2 rounded bg-orange-500/80 px-1.5 py-0.5 text-xs font-bold text-white'>
                    ©
                </div>
            )}
        </div>
    );
};

// Selected Media List Item Component (List View)
interface SelectedMediaListItemProps extends SelectedMediaCardProps {}

const SelectedMediaListItem: React.FC<SelectedMediaListItemProps> = ({
    item,
    index,
    onRemove,
    onPreview,
    onMoveUp,
    onMoveDown,
    isDragging,
    isDragOver,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    canReorder,
}) => {
    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
    };

    return (
        <div
            className={`flex items-center space-x-3 rounded-lg border p-3 transition-all duration-200 ${
                isDragging
                    ? 'scale-95 opacity-50'
                    : isDragOver
                      ? 'border-revlr-primary-blue bg-revlr-primary-blue/10'
                      : 'border-gray-200 hover:border-revlr-primary-blue/50 dark:border-revlr-dark-border'
            }`}
            draggable={canReorder}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >
            {/* Order indicator */}
            <div className='flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-revlr-primary-blue text-xs font-bold text-white'>
                {index + 1}
            </div>

            {/* Thumbnail */}
            <div className='relative size-12 flex-shrink-0 overflow-hidden rounded'>
                <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className='h-full w-full object-cover'
                />
                {item.mediaType === 'video' && (
                    <div className='absolute inset-0 flex items-center justify-center bg-black/50'>
                        <Video className='size-4 text-white' />
                    </div>
                )}
                {item.attribution.required && (
                    <div className='absolute bottom-0 right-0 bg-orange-500 px-1 py-0.5 text-xs font-bold text-white'>
                        ©
                    </div>
                )}
            </div>

            {/* Item info */}
            <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                    {item.title}
                </p>
                <div className='flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400'>
                    <span>
                        {item.width} × {item.height}
                    </span>
                    {item.fileSize && (
                        <>
                            <span>•</span>
                            <span>{formatFileSize(item.fileSize)}</span>
                        </>
                    )}
                    <span>•</span>
                    <span className='capitalize'>{item.providerId}</span>
                </div>
            </div>

            {/* Actions */}
            <div className='flex items-center space-x-1'>
                {canReorder && (
                    <div className='flex flex-col space-y-1'>
                        {onMoveUp && (
                            <button
                                onClick={onMoveUp}
                                className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                title='Move up'
                            >
                                <ArrowUp className='size-3' />
                            </button>
                        )}
                        {onMoveDown && (
                            <button
                                onClick={onMoveDown}
                                className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                title='Move down'
                            >
                                <ArrowDown className='size-3' />
                            </button>
                        )}
                    </div>
                )}

                <button
                    onClick={onPreview}
                    className='p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                    title='Preview'
                >
                    <Eye className='size-4' />
                </button>

                <button
                    onClick={onRemove}
                    className='p-2 text-red-400 hover:text-red-600'
                    title='Remove'
                >
                    <X className='size-4' />
                </button>
            </div>
        </div>
    );
};
