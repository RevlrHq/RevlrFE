import { DragItem, DropResult } from '@/types/dashboard-customization';

export interface DragDropHandlers {
    onDragStart: (e: React.DragEvent, item: DragItem) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, targetId?: string) => void;
    onDragEnd: (e: React.DragEvent) => void;
}

export interface DragDropState {
    isDragging: boolean;
    draggedItem: DragItem | null;
    dragOverTarget: string | null;
}

export class DragDropManager {
    private static instance: DragDropManager;
    private draggedItem: DragItem | null = null;
    private dragOverTarget: string | null = null;
    private onDropCallback: ((result: DropResult) => void) | null = null;

    static getInstance(): DragDropManager {
        if (!DragDropManager.instance) {
            DragDropManager.instance = new DragDropManager();
        }
        return DragDropManager.instance;
    }

    setOnDropCallback(callback: (result: DropResult) => void): void {
        this.onDropCallback = callback;
    }

    createHandlers(): DragDropHandlers {
        return {
            onDragStart: (e: React.DragEvent, item: DragItem) => {
                this.draggedItem = item;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', item.id);

                // Add visual feedback
                if (e.currentTarget instanceof HTMLElement) {
                    e.currentTarget.style.opacity = '0.5';
                }
            },

            onDragOver: (e: React.DragEvent) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            },

            onDragEnter: (e: React.DragEvent) => {
                e.preventDefault();
                const target = e.currentTarget as HTMLElement;
                const targetId = target.dataset.dropTarget;

                if (targetId && targetId !== this.draggedItem?.id) {
                    this.dragOverTarget = targetId;
                    target.classList.add('drag-over');
                }
            },

            onDragLeave: (e: React.DragEvent) => {
                const target = e.currentTarget as HTMLElement;
                const relatedTarget = e.relatedTarget as HTMLElement;

                // Only remove highlight if we're actually leaving the drop zone
                if (!target.contains(relatedTarget)) {
                    target.classList.remove('drag-over');
                    this.dragOverTarget = null;
                }
            },

            onDrop: (e: React.DragEvent, targetId?: string) => {
                e.preventDefault();
                const target = e.currentTarget as HTMLElement;
                target.classList.remove('drag-over');

                if (this.draggedItem && this.onDropCallback) {
                    const rect = target.getBoundingClientRect();
                    const position = {
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                    };

                    const result: DropResult = {
                        draggedId: this.draggedItem.id,
                        targetId: targetId || this.dragOverTarget || undefined,
                        position,
                    };

                    this.onDropCallback(result);
                }

                this.cleanup();
            },

            onDragEnd: (e: React.DragEvent) => {
                // Restore visual state
                if (e.currentTarget instanceof HTMLElement) {
                    e.currentTarget.style.opacity = '1';
                }

                // Clean up any remaining drag-over classes
                document.querySelectorAll('.drag-over').forEach((el) => {
                    el.classList.remove('drag-over');
                });

                this.cleanup();
            },
        };
    }

    private cleanup(): void {
        this.draggedItem = null;
        this.dragOverTarget = null;
    }

    getDraggedItem(): DragItem | null {
        return this.draggedItem;
    }

    getDragOverTarget(): string | null {
        return this.dragOverTarget;
    }
}

// Grid utilities for snapping widgets to grid positions
export class GridUtils {
    static readonly GRID_SIZE = 12; // 12-column grid
    static readonly MIN_WIDGET_WIDTH = 2;
    static readonly MIN_WIDGET_HEIGHT = 2;

    static snapToGrid(
        position: { x: number; y: number },
        containerWidth: number
    ): { x: number; y: number } {
        const cellWidth = containerWidth / this.GRID_SIZE;
        const cellHeight = 100; // Fixed cell height in pixels

        return {
            x: Math.round(position.x / cellWidth),
            y: Math.round(position.y / cellHeight),
        };
    }

    static getGridPosition(widget: {
        position: { x: number; y: number; width: number; height: number };
    }): string {
        const { x, y, width, height } = widget.position;
        return `grid-area: ${y + 1} / ${x + 1} / ${y + height + 1} / ${x + width + 1}`;
    }

    static isValidPosition(
        position: { x: number; y: number; width: number; height: number },
        existingWidgets: Array<{
            id: string;
            position: { x: number; y: number; width: number; height: number };
        }>,
        excludeId?: string
    ): boolean {
        const { x, y, width, height } = position;

        // Check bounds
        if (
            x < 0 ||
            y < 0 ||
            x + width > this.GRID_SIZE ||
            width < this.MIN_WIDGET_WIDTH ||
            height < this.MIN_WIDGET_HEIGHT
        ) {
            return false;
        }

        // Check for overlaps
        for (const widget of existingWidgets) {
            if (widget.id === excludeId) continue;

            const wx = widget.position.x;
            const wy = widget.position.y;
            const ww = widget.position.width;
            const wh = widget.position.height;

            // Check if rectangles overlap
            if (
                !(
                    x >= wx + ww ||
                    x + width <= wx ||
                    y >= wy + wh ||
                    y + height <= wy
                )
            ) {
                return false;
            }
        }

        return true;
    }

    static findNearestValidPosition(
        desiredPosition: {
            x: number;
            y: number;
            width: number;
            height: number;
        },
        existingWidgets: Array<{
            id: string;
            position: { x: number; y: number; width: number; height: number };
        }>,
        excludeId?: string
    ): { x: number; y: number; width: number; height: number } {
        const {
            x,
            y,
            width: initialWidth,
            height: initialHeight,
        } = desiredPosition;
        let width = initialWidth;
        let height = initialHeight;

        // Ensure minimum dimensions
        width = Math.max(width, this.MIN_WIDGET_WIDTH);
        height = Math.max(height, this.MIN_WIDGET_HEIGHT);

        // Try the desired position first
        if (
            this.isValidPosition(
                { x, y, width, height },
                existingWidgets,
                excludeId
            )
        ) {
            return { x, y, width, height };
        }

        // Search for the nearest valid position
        for (
            let searchRadius = 1;
            searchRadius <= this.GRID_SIZE;
            searchRadius++
        ) {
            for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                    const newX = Math.max(
                        0,
                        Math.min(x + dx, this.GRID_SIZE - width)
                    );
                    const newY = Math.max(0, y + dy);

                    if (
                        this.isValidPosition(
                            { x: newX, y: newY, width, height },
                            existingWidgets,
                            excludeId
                        )
                    ) {
                        return { x: newX, y: newY, width, height };
                    }
                }
            }
        }

        // If no valid position found, place at the bottom
        const maxY = Math.max(
            0,
            ...existingWidgets
                .filter((w) => w.id !== excludeId)
                .map((w) => w.position.y + w.position.height)
        );

        return { x: 0, y: maxY, width, height };
    }
}
