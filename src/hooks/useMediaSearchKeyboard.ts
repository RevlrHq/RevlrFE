import { useEffect, useCallback, useRef, useState } from 'react';
import { MediaItem } from '@src/types/media-search';

interface MediaSearchKeyboardOptions {
    items: MediaItem[];
    selectedItems: MediaItem[];
    onSelectItem: (item: MediaItem) => void;
    onPreviewItem: (item: MediaItem) => void;
    onSearch: (query: string) => void;
    onToggleFilters: () => void;
    onToggleViewMode: () => void;
    onUseSelected: () => void;
    onClose: () => void;
    onVoiceSearch?: () => void;
    gridColumns?: number;
    isModalOpen?: boolean;
    disabled?: boolean;
}

interface KeyboardState {
    focusedIndex: number;
    isSearchFocused: boolean;
    selectedIndices: Set<number>;
}

export function useMediaSearchKeyboard({
    items,
    selectedItems,
    onSelectItem,
    onPreviewItem,
    onSearch,
    onToggleFilters,
    onToggleViewMode,
    onUseSelected,
    onClose,
    onVoiceSearch,
    gridColumns = 6,
    isModalOpen = true,
    disabled = false,
}: MediaSearchKeyboardOptions) {
    const [state, setState] = useState<KeyboardState>({
        focusedIndex: -1,
        isSearchFocused: false,
        selectedIndices: new Set(),
    });

    const searchInputRef = useRef<HTMLInputElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const announcementRef = useRef<HTMLDivElement>(null);

    // Update selected indices when selectedItems changes
    useEffect(() => {
        const newSelectedIndices = new Set<number>();
        selectedItems.forEach((selectedItem) => {
            const index = items.findIndex(
                (item) =>
                    item.id === selectedItem.id &&
                    item.providerId === selectedItem.providerId
            );
            if (index !== -1) {
                newSelectedIndices.add(index);
            }
        });
        setState((prev) => ({ ...prev, selectedIndices: newSelectedIndices }));
    }, [selectedItems, items]);

    // Announce changes to screen readers
    const announce = useCallback((message: string) => {
        if (announcementRef.current) {
            announcementRef.current.textContent = message;
            setTimeout(() => {
                if (announcementRef.current) {
                    announcementRef.current.textContent = '';
                }
            }, 1000);
        }
    }, []);

    // Focus management
    const focusItem = useCallback(
        (index: number) => {
            if (index < 0 || index >= items.length) return;

            setState((prev) => ({
                ...prev,
                focusedIndex: index,
                isSearchFocused: false,
            }));

            // Focus the actual DOM element
            const gridElement = gridRef.current;
            if (gridElement) {
                const itemElement = gridElement.children[index] as HTMLElement;
                if (itemElement) {
                    itemElement.focus();
                }
            }

            // Announce the focused item
            const item = items[index];
            const isSelected = state.selectedIndices.has(index);
            announce(
                `Image ${index + 1} of ${items.length}: ${item.title} by ${
                    item.photographer?.name || 'Unknown'
                }. ${isSelected ? 'Selected' : 'Not selected'}`
            );
        },
        [items, state.selectedIndices, announce]
    );

    // Focus search input
    const focusSearch = useCallback(() => {
        setState((prev) => ({
            ...prev,
            isSearchFocused: true,
            focusedIndex: -1,
        }));
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
        announce('Search input focused');
    }, [announce]);

    // Navigation functions
    const moveUp = useCallback(() => {
        if (state.focusedIndex === -1) return;
        const newIndex = Math.max(0, state.focusedIndex - gridColumns);
        focusItem(newIndex);
    }, [state.focusedIndex, gridColumns, focusItem]);

    const moveDown = useCallback(() => {
        if (state.focusedIndex === -1) return;
        const newIndex = Math.min(
            items.length - 1,
            state.focusedIndex + gridColumns
        );
        focusItem(newIndex);
    }, [state.focusedIndex, gridColumns, items.length, focusItem]);

    const moveLeft = useCallback(() => {
        if (state.focusedIndex === -1) return;
        const newIndex = Math.max(0, state.focusedIndex - 1);
        focusItem(newIndex);
    }, [state.focusedIndex, focusItem]);

    const moveRight = useCallback(() => {
        if (state.focusedIndex === -1) return;
        const newIndex = Math.min(items.length - 1, state.focusedIndex + 1);
        focusItem(newIndex);
    }, [state.focusedIndex, items.length, focusItem]);

    const moveToFirst = useCallback(() => {
        if (items.length > 0) {
            focusItem(0);
        }
    }, [items.length, focusItem]);

    const moveToLast = useCallback(() => {
        if (items.length > 0) {
            focusItem(items.length - 1);
        }
    }, [items.length, focusItem]);

    // Selection functions
    const selectCurrentItem = useCallback(() => {
        if (state.focusedIndex >= 0 && state.focusedIndex < items.length) {
            const item = items[state.focusedIndex];
            onSelectItem(item);

            const wasSelected = state.selectedIndices.has(state.focusedIndex);
            announce(
                wasSelected
                    ? `Deselected ${item.title}`
                    : `Selected ${item.title}. ${selectedItems.length + (wasSelected ? 0 : 1)} items selected`
            );
        }
    }, [
        state.focusedIndex,
        items,
        onSelectItem,
        state.selectedIndices,
        selectedItems.length,
        announce,
    ]);

    const previewCurrentItem = useCallback(() => {
        if (state.focusedIndex >= 0 && state.focusedIndex < items.length) {
            const item = items[state.focusedIndex];
            onPreviewItem(item);
            announce(`Previewing ${item.title}`);
        }
    }, [state.focusedIndex, items, onPreviewItem, announce]);

    const selectRange = useCallback(
        (startIndex: number, endIndex: number) => {
            const start = Math.min(startIndex, endIndex);
            const end = Math.max(startIndex, endIndex);

            for (let i = start; i <= end; i++) {
                if (i < items.length && !state.selectedIndices.has(i)) {
                    onSelectItem(items[i]);
                }
            }

            announce(`Selected ${end - start + 1} items`);
        },
        [items, state.selectedIndices, onSelectItem, announce]
    );

    // Search functions
    const performQuickSearch = useCallback(
        (query: string) => {
            onSearch(query);
            announce(`Searching for ${query}`);
        },
        [onSearch, announce]
    );

    // Main keyboard event handler
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!isModalOpen || disabled) return;

            const { key, ctrlKey, metaKey, shiftKey } = event;
            const isModifierPressed = ctrlKey || metaKey;

            // Global shortcuts (work regardless of focus)
            if (isModifierPressed) {
                switch (key.toLowerCase()) {
                    case 'f':
                        event.preventDefault();
                        onToggleFilters();
                        announce('Toggled filters');
                        return;
                    case 'g':
                        event.preventDefault();
                        onToggleViewMode();
                        announce('Toggled view mode');
                        return;
                    case 'a':
                        event.preventDefault();
                        // Select all visible items
                        items.forEach((item) => {
                            if (
                                !selectedItems.some(
                                    (selected) =>
                                        selected.id === item.id &&
                                        selected.providerId === item.providerId
                                )
                            ) {
                                onSelectItem(item);
                            }
                        });
                        announce(`Selected all ${items.length} items`);
                        return;
                    case 'enter':
                        event.preventDefault();
                        onUseSelected();
                        announce('Using selected images');
                        return;
                    case 'v':
                        if (onVoiceSearch) {
                            event.preventDefault();
                            onVoiceSearch();
                            announce('Voice search activated');
                        }
                        return;
                }
            }

            // Handle escape key
            if (key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }

            // Handle search input focus
            if (key === '/' || (key === 'f' && !isModifierPressed)) {
                event.preventDefault();
                focusSearch();
                return;
            }

            // Don't handle other keys when search is focused
            if (state.isSearchFocused) {
                return;
            }

            // Grid navigation
            switch (key) {
                case 'ArrowUp':
                    event.preventDefault();
                    moveUp();
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    moveDown();
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    moveLeft();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    moveRight();
                    break;
                case 'Home':
                    event.preventDefault();
                    moveToFirst();
                    break;
                case 'End':
                    event.preventDefault();
                    moveToLast();
                    break;
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    if (shiftKey && state.focusedIndex >= 0) {
                        // Range selection
                        const lastSelectedIndex = Math.max(
                            ...Array.from(state.selectedIndices)
                        );
                        if (lastSelectedIndex >= 0) {
                            selectRange(lastSelectedIndex, state.focusedIndex);
                        } else {
                            selectCurrentItem();
                        }
                    } else {
                        selectCurrentItem();
                    }
                    break;
                case 'p':
                case 'P':
                    event.preventDefault();
                    previewCurrentItem();
                    break;
                case 'Tab':
                    // Allow default tab behavior but update focus state
                    if (!shiftKey && state.focusedIndex === items.length - 1) {
                        setState((prev) => ({
                            ...prev,
                            focusedIndex: -1,
                            isSearchFocused: false,
                        }));
                    } else if (shiftKey && state.focusedIndex === 0) {
                        focusSearch();
                    }
                    break;
            }

            // Quick search with letter keys
            if (key.length === 1 && key.match(/[a-zA-Z0-9]/)) {
                performQuickSearch(key);
            }
        },
        [
            isModalOpen,
            disabled,
            state.isSearchFocused,
            state.focusedIndex,
            state.selectedIndices,
            items,
            selectedItems,
            onToggleFilters,
            onToggleViewMode,
            onSelectItem,
            onUseSelected,
            onVoiceSearch,
            onClose,
            focusSearch,
            moveUp,
            moveDown,
            moveLeft,
            moveRight,
            moveToFirst,
            moveToLast,
            selectCurrentItem,
            previewCurrentItem,
            selectRange,
            performQuickSearch,
            announce,
        ]
    );

    // Attach keyboard event listener
    useEffect(() => {
        if (isModalOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isModalOpen, handleKeyDown]);

    // Focus first item when modal opens
    useEffect(() => {
        if (isModalOpen && items.length > 0 && state.focusedIndex === -1) {
            // Small delay to ensure modal is fully rendered
            setTimeout(() => {
                focusItem(0);
            }, 100);
        }
    }, [isModalOpen, items.length, state.focusedIndex, focusItem]);

    // Keyboard shortcuts help
    const getKeyboardShortcuts = useCallback(() => {
        return [
            { key: 'Arrow Keys', description: 'Navigate through images' },
            { key: 'Enter/Space', description: 'Select/deselect image' },
            {
                key: 'Shift + Enter/Space',
                description: 'Select range of images',
            },
            { key: 'P', description: 'Preview image' },
            { key: '/', description: 'Focus search input' },
            { key: 'Ctrl/Cmd + F', description: 'Toggle filters' },
            { key: 'Ctrl/Cmd + G', description: 'Toggle view mode' },
            { key: 'Ctrl/Cmd + A', description: 'Select all images' },
            { key: 'Ctrl/Cmd + Enter', description: 'Use selected images' },
            { key: 'Ctrl/Cmd + V', description: 'Voice search' },
            { key: 'Home', description: 'Go to first image' },
            { key: 'End', description: 'Go to last image' },
            { key: 'Escape', description: 'Close modal' },
            { key: 'Tab', description: 'Navigate between sections' },
            { key: 'Any letter/number', description: 'Quick search' },
        ];
    }, []);

    return {
        state,
        focusItem,
        focusSearch,
        searchInputRef,
        gridRef,
        announcementRef,
        getKeyboardShortcuts,
        // Navigation functions for external use
        moveUp,
        moveDown,
        moveLeft,
        moveRight,
        moveToFirst,
        moveToLast,
        selectCurrentItem,
        previewCurrentItem,
    };
}

export default useMediaSearchKeyboard;
