import { DragDropManager, GridUtils } from '@/lib/utils/drag-drop';
import { DragItem, DropResult } from '@/types/dashboard-customization';

describe('DragDropManager', () => {
    let manager: DragDropManager;
    let mockCallback: jest.Mock<void, [DropResult]>;

    beforeEach(() => {
        manager = DragDropManager.getInstance();
        mockCallback = jest.fn();
        manager.setOnDropCallback(mockCallback);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('is a singleton', () => {
        const manager1 = DragDropManager.getInstance();
        const manager2 = DragDropManager.getInstance();
        expect(manager1).toBe(manager2);
    });

    it('creates drag handlers', () => {
        const handlers = manager.createHandlers();

        expect(handlers).toHaveProperty('onDragStart');
        expect(handlers).toHaveProperty('onDragOver');
        expect(handlers).toHaveProperty('onDragEnter');
        expect(handlers).toHaveProperty('onDragLeave');
        expect(handlers).toHaveProperty('onDrop');
        expect(handlers).toHaveProperty('onDragEnd');
    });

    describe('drag handlers', () => {
        let handlers: {
            onDragStart: (event: DragEvent, item: DragItem) => void;
            onDragOver: (event: DragEvent) => void;
            onDragEnter: (event: DragEvent) => void;
            onDragLeave: (event: DragEvent) => void;
            onDrop: (event: DragEvent, targetId: string) => void;
            onDragEnd: (event: DragEvent) => void;
        };
        let mockEvent: Partial<DragEvent>;
        let mockElement: {
            style: { opacity?: string };
            dataset: { dropTarget: string };
            classList: { add: jest.Mock; remove: jest.Mock };
            contains: jest.Mock;
            getBoundingClientRect: jest.Mock;
        };

        beforeEach(() => {
            handlers = manager.createHandlers();

            mockElement = {
                style: {},
                dataset: { dropTarget: 'target-id' },
                classList: {
                    add: jest.fn(),
                    remove: jest.fn(),
                },
                contains: jest.fn(() => false),
                getBoundingClientRect: jest.fn(() => ({
                    left: 100,
                    top: 100,
                    width: 200,
                    height: 200,
                })),
            };

            mockEvent = {
                preventDefault: jest.fn(),
                currentTarget: mockElement as EventTarget,
                relatedTarget: null,
                clientX: 150,
                clientY: 150,
                dataTransfer: {
                    effectAllowed: '',
                    dropEffect: '',
                    setData: jest.fn(),
                } as DataTransfer,
            } as Partial<DragEvent>;
        });

        it('handles drag start', () => {
            const dragItem: DragItem = {
                id: 'widget-1',
                type: 'statistics',
                position: { x: 0, y: 0 },
            };

            handlers.onDragStart(mockEvent as DragEvent, dragItem);

            expect(mockEvent.dataTransfer?.effectAllowed).toBe('move');
            expect(mockEvent.dataTransfer?.setData).toHaveBeenCalledWith(
                'text/plain',
                'widget-1'
            );
            expect(mockElement.style.opacity).toBe('0.5');
            expect(manager.getDraggedItem()).toEqual(dragItem);
        });

        it('handles drag over', () => {
            handlers.onDragOver(mockEvent as DragEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockEvent.dataTransfer?.dropEffect).toBe('move');
        });

        it('handles drag enter', () => {
            const dragItem: DragItem = {
                id: 'widget-1',
                type: 'statistics',
                position: { x: 0, y: 0 },
            };
            handlers.onDragStart(mockEvent as DragEvent, dragItem);

            handlers.onDragEnter(mockEvent as DragEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockElement.classList.add).toHaveBeenCalledWith('drag-over');
            expect(manager.getDragOverTarget()).toBe('target-id');
        });

        it('handles drag leave', () => {
            handlers.onDragLeave(mockEvent as DragEvent);

            expect(mockElement.classList.remove).toHaveBeenCalledWith(
                'drag-over'
            );
        });

        it('handles drop', () => {
            const dragItem: DragItem = {
                id: 'widget-1',
                type: 'statistics',
                position: { x: 0, y: 0 },
            };
            handlers.onDragStart(mockEvent as DragEvent, dragItem);

            handlers.onDrop(mockEvent as DragEvent, 'drop-target');

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockElement.classList.remove).toHaveBeenCalledWith(
                'drag-over'
            );
            expect(mockCallback).toHaveBeenCalledWith({
                draggedId: 'widget-1',
                targetId: 'drop-target',
                position: { x: 50, y: 50 }, // clientX/Y - rect.left/top
            });
        });

        it('handles drag end', () => {
            handlers.onDragEnd(mockEvent as DragEvent);

            expect(mockElement.style.opacity).toBe('1');
            expect(manager.getDraggedItem()).toBeNull();
        });
    });
});

describe('GridUtils', () => {
    describe('snapToGrid', () => {
        it('snaps position to grid', () => {
            const position = { x: 150, y: 250 };
            const containerWidth = 1200;
            const containerHeight = 800;

            const snapped = GridUtils.snapToGrid(
                position,
                containerWidth,
                containerHeight
            );

            expect(snapped.x).toBe(2); // 150 / (1200/12) = 1.5 -> 2
            expect(snapped.y).toBe(3); // 250 / 100 = 2.5 -> 3
        });
    });

    describe('getGridPosition', () => {
        it('generates CSS grid area string', () => {
            const widget = {
                position: { x: 2, y: 1, width: 4, height: 3 },
            };

            const gridArea = GridUtils.getGridPosition(widget);

            expect(gridArea).toBe('grid-area: 2 / 3 / 5 / 7');
        });
    });

    describe('isValidPosition', () => {
        const existingWidgets = [
            {
                id: 'widget-1',
                position: { x: 0, y: 0, width: 4, height: 2 },
            },
            {
                id: 'widget-2',
                position: { x: 4, y: 0, width: 4, height: 2 },
            },
        ];

        it('validates position within bounds', () => {
            const validPosition = { x: 8, y: 0, width: 4, height: 2 };
            const isValid = GridUtils.isValidPosition(
                validPosition,
                existingWidgets
            );
            expect(isValid).toBe(true);
        });

        it('rejects position outside grid bounds', () => {
            const invalidPosition = { x: 10, y: 0, width: 4, height: 2 };
            const isValid = GridUtils.isValidPosition(
                invalidPosition,
                existingWidgets
            );
            expect(isValid).toBe(false);
        });

        it('rejects position with insufficient width', () => {
            const invalidPosition = { x: 8, y: 0, width: 1, height: 2 };
            const isValid = GridUtils.isValidPosition(
                invalidPosition,
                existingWidgets
            );
            expect(isValid).toBe(false);
        });

        it('rejects position with insufficient height', () => {
            const invalidPosition = { x: 8, y: 0, width: 4, height: 1 };
            const isValid = GridUtils.isValidPosition(
                invalidPosition,
                existingWidgets
            );
            expect(isValid).toBe(false);
        });

        it('rejects overlapping position', () => {
            const overlappingPosition = { x: 2, y: 0, width: 4, height: 2 };
            const isValid = GridUtils.isValidPosition(
                overlappingPosition,
                existingWidgets
            );
            expect(isValid).toBe(false);
        });

        it('allows position when excluding overlapping widget', () => {
            const overlappingPosition = { x: 0, y: 0, width: 4, height: 2 }; // Same as widget-1
            const isValid = GridUtils.isValidPosition(
                overlappingPosition,
                existingWidgets,
                'widget-1'
            );
            expect(isValid).toBe(true);
        });

        it('rejects negative positions', () => {
            const invalidPosition = { x: -1, y: 0, width: 4, height: 2 };
            const isValid = GridUtils.isValidPosition(
                invalidPosition,
                existingWidgets
            );
            expect(isValid).toBe(false);
        });
    });

    describe('findNearestValidPosition', () => {
        const existingWidgets = [
            {
                id: 'widget-1',
                position: { x: 0, y: 0, width: 6, height: 4 },
            },
        ];

        it('returns desired position if valid', () => {
            const desiredPosition = { x: 6, y: 0, width: 4, height: 4 };
            const nearestPosition = GridUtils.findNearestValidPosition(
                desiredPosition,
                existingWidgets
            );
            expect(nearestPosition).toEqual(desiredPosition);
        });

        it('finds nearest valid position when desired is invalid', () => {
            const desiredPosition = { x: 2, y: 1, width: 4, height: 4 }; // overlaps with widget-1
            const nearestPosition = GridUtils.findNearestValidPosition(
                desiredPosition,
                existingWidgets
            );

            expect(nearestPosition.width).toBe(4);
            expect(nearestPosition.height).toBe(4);
            expect(
                GridUtils.isValidPosition(nearestPosition, existingWidgets)
            ).toBe(true);
        });

        it('enforces minimum dimensions', () => {
            const desiredPosition = { x: 6, y: 0, width: 1, height: 1 };
            const nearestPosition = GridUtils.findNearestValidPosition(
                desiredPosition,
                existingWidgets
            );

            expect(nearestPosition.width).toBe(GridUtils.MIN_WIDGET_WIDTH);
            expect(nearestPosition.height).toBe(GridUtils.MIN_WIDGET_HEIGHT);
        });

        it('places widget at bottom when no valid position found', () => {
            const existingWidgetsFullGrid = Array.from(
                { length: 6 },
                (_, i) => ({
                    id: `widget-${i}`,
                    position: {
                        x: (i % 6) * 2,
                        y: Math.floor(i / 6) * 2,
                        width: 2,
                        height: 2,
                    },
                })
            );

            const desiredPosition = { x: 0, y: 0, width: 2, height: 2 };
            const nearestPosition = GridUtils.findNearestValidPosition(
                desiredPosition,
                existingWidgetsFullGrid
            );

            expect(nearestPosition.x).toBe(0);
            expect(nearestPosition.y).toBeGreaterThan(0);
        });

        it('excludes specified widget from collision detection', () => {
            const desiredPosition = { x: 2, y: 1, width: 4, height: 4 };
            const nearestPosition = GridUtils.findNearestValidPosition(
                desiredPosition,
                existingWidgets,
                'widget-1'
            );

            expect(nearestPosition).toEqual(desiredPosition);
        });
    });
});
