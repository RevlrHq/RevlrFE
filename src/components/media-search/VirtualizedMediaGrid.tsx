'use client';

import React, {
    useMemo,
    useCallback,
    useRef,
    useEffect,
    useState,
} from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { MediaItem } from '@/types/media-search';
import { MediaCard } from './MediaCard';
import { useTheme } from '@/lib/ThemeContext';

interface VirtualizedMediaGridProps {
    items: MediaItem[];
    selectedItems: MediaItem[];
    onSelectItem: (item: MediaItem) => void;
    onPreviewItem: (item: MediaItem) => void;
    disabled?: boolean;
    className?: string;
    onLoadMore?: () => void;
    hasMore?: boolean;
    isLoading?: boolean;
}

interface GridCellProps {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
    data: {
        items: MediaItem[];
        selectedItems: MediaItem[];
        onSelectItem: (item: MediaItem) => void;
        onPreviewItem: (item: MediaItem) => void;
        disabled: boolean;
        columnsPerRow: number;
        isItemSelected: (item: MediaItem) => boolean;
    };
}

const CARD_SIZE = 200; // Base card size in pixels
const GAP_SIZE = 16; // Gap between cards in pixels
const MIN_COLUMNS = 2;
const MAX_COLUMNS = 8;

export const VirtualizedMediaGrid: React.FC<VirtualizedMediaGridProps> = ({
    items,
    selectedItems,
    onSelectItem,
    onPreviewItem,
    disabled = false,
    className = '',
    onLoadMore,
    hasMore = false,
    isLoading = false,
}) => {
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<Grid>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Calculate responsive columns based on container width
    const columnsPerRow = useMemo(() => {
        if (containerSize.width === 0) return MIN_COLUMNS;

        const availableWidth = containerSize.width - GAP_SIZE * 2; // Account for padding
        const cardWithGap = CARD_SIZE + GAP_SIZE;
        const calculatedColumns = Math.floor(availableWidth / cardWithGap);

        return Math.max(MIN_COLUMNS, Math.min(MAX_COLUMNS, calculatedColumns));
    }, [containerSize.width]);

    // Calculate grid dimensions
    const { rowCount, columnWidth, rowHeight } = useMemo(() => {
        const rows = Math.ceil(items.length / columnsPerRow);
        const colWidth =
            (containerSize.width - GAP_SIZE * (columnsPerRow + 1)) /
            columnsPerRow;
        const cardHeight = colWidth; // Square aspect ratio

        return {
            rowCount: rows,
            columnWidth: colWidth + GAP_SIZE,
            rowHeight: cardHeight + GAP_SIZE,
        };
    }, [items.length, columnsPerRow, containerSize.width]);

    // Helper function to check if item is selected
    const isItemSelected = useCallback(
        (item: MediaItem) => {
            return selectedItems.some(
                (selected) =>
                    selected.id === item.id &&
                    selected.providerId === item.providerId
            );
        },
        [selectedItems]
    );

    // Resize observer to track container size
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            const [entry] = entries;
            if (entry) {
                setContainerSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    // Handle scroll for infinite loading
    const handleScroll = useCallback(
        ({
            scrollTop,
            scrollHeight,
            clientHeight,
        }: {
            scrollTop: number;
            scrollHeight: number;
            clientHeight: number;
        }) => {
            if (!onLoadMore || !hasMore || isLoading) return;

            // Trigger load more when scrolled to 80% of content
            const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
            if (scrollPercentage > 0.8) {
                onLoadMore();
            }
        },
        [onLoadMore, hasMore, isLoading]
    );

    // Grid cell renderer
    const GridCell: React.FC<GridCellProps> = ({
        columnIndex,
        rowIndex,
        style,
        data,
    }) => {
        const itemIndex = rowIndex * data.columnsPerRow + columnIndex;
        const item = data.items[itemIndex];

        if (!item) {
            return <div style={style} />; // Empty cell
        }

        return (
            <div
                style={{
                    ...style,
                    padding: GAP_SIZE / 2,
                }}
            >
                <MediaCard
                    item={item}
                    isSelected={data.isItemSelected(item)}
                    onSelect={() => data.onSelectItem(item)}
                    onPreview={() => data.onPreviewItem(item)}
                    disabled={data.disabled}
                    index={itemIndex}
                />
            </div>
        );
    };

    // Prepare data for grid cells
    const gridData = useMemo(
        () => ({
            items,
            selectedItems,
            onSelectItem,
            onPreviewItem,
            disabled,
            columnsPerRow,
            isItemSelected,
        }),
        [
            items,
            selectedItems,
            onSelectItem,
            onPreviewItem,
            disabled,
            columnsPerRow,
            isItemSelected,
        ]
    );

    // Don't render if no container size yet
    if (containerSize.width === 0 || containerSize.height === 0) {
        return (
            <div
                ref={containerRef}
                className={`flex-1 ${className}`}
                style={{ minHeight: '400px' }}
            >
                <div className='flex h-full items-center justify-center'>
                    <div className='size-6 animate-spin rounded-full border-b-2 border-revlr-primary-blue'></div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`flex-1 ${className}`}
            style={{ minHeight: '400px' }}
        >
            {items.length > 0 ? (
                <Grid
                    ref={gridRef}
                    height={containerSize.height}
                    width={containerSize.width}
                    columnCount={columnsPerRow}
                    columnWidth={columnWidth}
                    rowCount={rowCount}
                    rowHeight={rowHeight}
                    itemData={gridData}
                    onScroll={handleScroll}
                    overscanRowCount={2} // Render 2 extra rows for smooth scrolling
                    overscanColumnCount={1}
                >
                    {GridCell}
                </Grid>
            ) : (
                <div className='flex h-full items-center justify-center'>
                    <div className='text-center'>
                        <p
                            className={`font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            No items to display
                        </p>
                    </div>
                </div>
            )}

            {/* Loading indicator for infinite scroll */}
            {isLoading && items.length > 0 && (
                <div className='flex justify-center py-4'>
                    <div className='flex items-center space-x-2'>
                        <div className='size-4 animate-spin rounded-full border-b-2 border-revlr-primary-blue'></div>
                        <span
                            className={`font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            Loading more images...
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
