'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { MediaItem } from '@/types/media-search';
import { MediaCard } from './MediaCard';
import { GripVertical, ArrowUp, ArrowDown, Move } from 'lucide-react';

interface DragDropMediaGridProps {
    items: MediaItem[];
    selectedItems: MediaItem[];
    onReorder: (items: MediaItem[]) => void;
    onSelect: (item: MediaItem) => void;
    onPreview: (item: MediaItem) => void;
    disabled?: boolean;
    className?: string;
    showReorderControls?: boolean;
    gridCols?: number;
}

interface DragState {
    draggedIndex: number | null;
    dragOverIndex: number | null;
    isDragging: boolean;
    dragOffset: { x: number; y: number };
}

export const DragDropMediaGrid: React.FC<DragDropMediaGridProps> = ({
    items,
    selectedItems,
    onReorder,
    onSelect,
    onPreview,
    disabled = false,
    className = '',
    showReorderControls = true,
    gridCols = 6,
}) => {
    const { theme } = useTheme();
    const [dragState, setDragState] = useState<DragState>({
        draggedIndex: null,
        dragOverIndex: null,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
    });

    const gridRef = useRef<HTMLDivElement>(null);
    const dragImageRef = useRef<HTMLDivElement>(null);

    // Handle drag start
    const handleDragStart = useCallback(
        (e: React.DragEvent, index: number) => {
            if (disabled) return;

            const item = items[index];

            setDragState((prev) => ({
                ...prev,
                draggedIndex: index,
                isDragging: true,
            }));

            // Set drag data
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData(
                'text/plain',
                JSON.stringify({
                    index,
                    itemId: item.id,
                    providerId: item.providerId,
                })
            );

            // Create custom drag image
            if (dragImageRef.current) {
                const rect = e.currentTarget.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const offsetY = e.clientY - rect.top;

                setDragState((prev) => ({
                    ...prev,
                    dragOffset: { x: offsetX, y: offsetY },
                }));

                e.dataTransfer.setDragImage(
                    dragImageRef.current,
                    offsetX,
                    offsetY
                );
            }
        },
        [disabled, items]
    );

    // Handle drag over
    const handleDragOver = useCallback(
        (e: React.DragEvent, index: number) => {
            if (disabled || dragState.draggedIndex === null) return;

            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            if (index !== dragState.dragOverIndex) {
                setDragState((prev) => ({
                    ...prev,
                    dragOverIndex: index,
                }));
            }
        },
        [disabled, dragState.draggedIndex, dragState.dragOverIndex]
    );

    // Handle drag leave
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        // Only clear drag over if we're leaving the grid entirely
        if (!gridRef.current?.contains(e.relatedTarget as Node)) {
            setDragState((prev) => ({
                ...prev,
                dragOverIndex: null,
            }));
        }
    }, []);

    // Handle drop
    const handleDrop = useCallback(
        (e: React.DragEvent, dropIndex: number) => {
            e.preventDefault();

            if (disabled || dragState.draggedIndex === null) {
                setDragState({
                    draggedIndex: null,
                    dragOverIndex: null,
                    isDragging: false,
                    dragOffset: { x: 0, y: 0 },
                });
                return;
            }

            const { draggedIndex } = dragState;

            if (draggedIndex !== dropIndex) {
                const newItems = [...items];
                const draggedItem = newItems[draggedIndex];

                // Remove the dragged item
                newItems.splice(draggedIndex, 1);

                // Insert at new position
                const insertIndex =
                    draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
                newItems.splice(insertIndex, 0, draggedItem);

                onReorder(newItems);
            }

            setDragState({
                draggedIndex: null,
                dragOverIndex: null,
                isDragging: false,
                dragOffset: { x: 0, y: 0 },
            });
        },
        [disabled, dragState.draggedIndex, items, onReorder]
    );

    // Handle drag end
    const handleDragEnd = useCallback(() => {
        setDragState({
            draggedIndex: null,
            dragOverIndex: null,
            isDragging: false,
            dragOffset: { x: 0, y: 0 },
        });
    }, []);

    // Move item up/down
    const moveItem = useCallback(
        (index: number, direction: 'up' | 'down') => {
            if (disabled) return;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= items.length) return;

            const newItems = [...items];
            [newItems[index], newItems[newIndex]] = [
                newItems[newIndex],
                newItems[index],
            ];
            onReorder(newItems);
        },
        [disabled, items, onReorder]
    );

    // Check if item is selected
    const isSelected = useCallback(
        (item: MediaItem) => {
            return selectedItems.some(
                (selected) =>
                    selected.id === item.id &&
                    selected.providerId === item.providerId
            );
        },
        [selectedItems]
    );

    // Get grid column classes
    const getGridCols = () => {
        switch (gridCols) {
            case 2:
                return 'grid-cols-2';
            case 3:
                return 'grid-cols-3';
            case 4:
                return 'grid-cols-4';
            case 5:
                return 'grid-cols-5';
            case 6:
                return 'grid-cols-6';
            default:
                return 'grid-cols-6';
        }
    };

    return (
        <div className={`relative ${className}`}>
            {/* Main Grid */}
            <div
                ref={gridRef}
                className={`grid gap-4 ${getGridCols()}`}
                onDragLeave={handleDragLeave}
            >
                {items.map((item, index) => {
                    const isDragged = dragState.draggedIndex === index;
                    const isDragOver = dragState.dragOverIndex === index;
                    const isItemSelected = isSelected(item);

                    return (
                        <div
                            key={`${item.providerId}-${item.id}`}
                            className={`relative transition-all duration-200 ${
                                isDragged ? 'scale-95 opacity-50' : ''
                            } ${isDragOver ? 'scale-105' : ''}`}
                            draggable={!disabled}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                        >
                            {/* Drop indicator */}
                            {isDragOver && dragState.draggedIndex !== index && (
                                <div className='absolute inset-0 z-10 rounded-xl border-2 border-dashed border-revlr-primary-blue bg-revlr-primary-blue/10' />
                            )}

                            {/* Drag handle */}
                            {!disabled && (
                                <div className='absolute left-2 top-2 z-20 opacity-0 transition-opacity group-hover:opacity-100'>
                                    <div className='cursor-move rounded bg-black/70 p-1 text-white'>
                                        <GripVertical className='size-3' />
                                    </div>
                                </div>
                            )}

                            {/* Order indicator */}
                            <div className='absolute right-2 top-2 z-20 flex size-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white'>
                                {index + 1}
                            </div>

                            {/* Media Card */}
                            <div className='group'>
                                <MediaCard
                                    item={item}
                                    isSelected={isItemSelected}
                                    onSelect={() => onSelect(item)}
                                    onPreview={() => onPreview(item)}
                                    disabled={disabled}
                                />
                            </div>

                            {/* Reorder Controls */}
                            {showReorderControls && !disabled && (
                                <div className='absolute bottom-2 left-2 z-20 flex flex-col space-y-1 opacity-0 transition-opacity group-hover:opacity-100'>
                                    {index > 0 && (
                                        <button
                                            onClick={() =>
                                                moveItem(index, 'up')
                                            }
                                            className='rounded bg-black/70 p-1 text-white transition-colors hover:bg-black/90'
                                            title='Move up'
                                        >
                                            <ArrowUp className='size-3' />
                                        </button>
                                    )}
                                    {index < items.length - 1 && (
                                        <button
                                            onClick={() =>
                                                moveItem(index, 'down')
                                            }
                                            className='rounded bg-black/70 p-1 text-white transition-colors hover:bg-black/90'
                                            title='Move down'
                                        >
                                            <ArrowDown className='size-3' />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Custom Drag Image (hidden) */}
            <div
                ref={dragImageRef}
                className='pointer-events-none fixed -left-full -top-full'
                style={{ zIndex: -1 }}
            >
                {dragState.draggedIndex !== null && (
                    <div className='size-32 overflow-hidden rounded-xl border-2 border-revlr-primary-blue bg-white shadow-lg'>
                        <img
                            src={items[dragState.draggedIndex]?.thumbnailUrl}
                            alt='Dragging'
                            className='size-full object-cover'
                        />
                        <div className='absolute inset-0 flex items-center justify-center bg-revlr-primary-blue/20'>
                            <Move className='size-6 text-revlr-primary-blue' />
                        </div>
                    </div>
                )}
            </div>

            {/* Drag Instructions */}
            {!disabled && items.length > 1 && (
                <div
                    className={`mt-4 text-center text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                    <p>Drag items to reorder, or use the arrow buttons</p>
                </div>
            )}

            {/* Empty State */}
            {items.length === 0 && (
                <div
                    className={`py-12 text-center ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                    <Move className='mx-auto mb-4 size-12 opacity-50' />
                    <p>No items to display</p>
                </div>
            )}
        </div>
    );
};
