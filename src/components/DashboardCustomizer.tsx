'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDashboardCustomization } from '@/hooks/useDashboardCustomization';
import { DragDropManager, GridUtils } from '@/lib/utils/drag-drop';
import { DashboardWidget, DropResult } from '@/types/dashboard-customization';
import { useTheme } from '@/lib/ThemeContext';
import {
    Settings,
    Eye,
    EyeOff,
    Move,
    RotateCcw,
    X,
    Plus,
    Download,
    Upload,
    Trash2,
    Copy,
    Grid3X3,
    Sun,
    Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

interface DashboardCustomizerProps {
    children: React.ReactNode;
    className?: string;
}

export const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({
    children,
    className = '',
}) => {
    const { theme, toggleTheme } = useTheme();
    const {
        preferences,
        currentLayout,
        layouts,
        isCustomizing,
        setCurrentLayout,
        createLayout,

        deleteLayout,
        duplicateLayout,
        updateWidgetVisibility,
        updateWidgetPosition,
        updatePreferences,
        toggleCustomization,
        exitCustomization,
        exportLayout,
        importLayout,
        resetToDefault,
        resetWidgetPositions,
    } = useDashboardCustomization();

    const [showLayoutManager, setShowLayoutManager] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [newLayoutName, setNewLayoutName] = useState('');
    const [importData, setImportData] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize drag and drop
    useEffect(() => {
        const dragDropManager = DragDropManager.getInstance();
        dragDropManager.setOnDropCallback(handleDrop);
    }, [handleDrop]);

    const handleDrop = useCallback(
        (result: DropResult) => {
            if (!currentLayout) return;

            const widget = currentLayout.widgets.find(
                (w) => w.id === result.draggedId
            );
            if (!widget || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const gridPosition = GridUtils.snapToGrid(
                result.position,
                containerRect.width,
                containerRect.height
            );

            const newPosition = GridUtils.findNearestValidPosition(
                {
                    x: gridPosition.x,
                    y: gridPosition.y,
                    width: widget.position.width,
                    height: widget.position.height,
                },
                currentLayout.widgets,
                widget.id
            );

            updateWidgetPosition(widget.id, newPosition);
        },
        [currentLayout, updateWidgetPosition]
    );

    const handleCreateLayout = useCallback(() => {
        if (newLayoutName.trim()) {
            const layoutId = createLayout(newLayoutName.trim());
            setCurrentLayout(layoutId);
            setNewLayoutName('');
            setShowLayoutManager(false);
        }
    }, [newLayoutName, createLayout, setCurrentLayout]);

    const handleDuplicateLayout = useCallback(
        (layoutId: string) => {
            const originalLayout = layouts.find((l) => l.id === layoutId);
            if (originalLayout) {
                const newName = `${originalLayout.name} (Copy)`;
                const newLayoutId = duplicateLayout(layoutId, newName);
                if (newLayoutId) {
                    setCurrentLayout(newLayoutId);
                }
            }
        },
        [layouts, duplicateLayout, setCurrentLayout]
    );

    const handleExportLayout = useCallback(
        (layoutId: string) => {
            const data = exportLayout(layoutId);
            if (data) {
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `dashboard-layout-${layoutId}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        },
        [exportLayout]
    );

    const handleImportLayout = useCallback(() => {
        if (importData.trim()) {
            const success = importLayout(importData.trim());
            if (success) {
                setImportData('');
                setShowLayoutManager(false);
            } else {
                alert('Failed to import layout. Please check the format.');
            }
        }
    }, [importData, importLayout]);

    const handleFileImport = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result as string;
                    if (content) {
                        const success = importLayout(content);
                        if (!success) {
                            alert(
                                'Failed to import layout. Please check the file format.'
                            );
                        }
                    }
                };
                reader.readAsText(file);
            }
        },
        [importLayout]
    );

    const dragDropHandlers = DragDropManager.getInstance().createHandlers();

    if (!currentLayout) {
        return <div>Loading dashboard...</div>;
    }

    return (
        <div className={`relative ${className}`}>
            {/* Customization Toolbar */}
            {isCustomizing && (
                <div
                    className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg border p-2 shadow-lg ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border bg-revlr-dark-card'
                            : 'border-gray-200 bg-white'
                    }`}
                >
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setShowLayoutManager(true)}
                        title='Manage Layouts'
                    >
                        <Grid3X3 className='size-4' />
                    </Button>

                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setShowPreferences(true)}
                        title='Preferences'
                    >
                        <Settings className='size-4' />
                    </Button>

                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={resetWidgetPositions}
                        title='Reset Positions'
                    >
                        <RotateCcw className='size-4' />
                    </Button>

                    <div className='h-4 w-px bg-gray-300 dark:bg-gray-600' />

                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={exitCustomization}
                        title='Exit Customization'
                    >
                        <X className='size-4' />
                    </Button>
                </div>
            )}

            {/* Customization Toggle Button */}
            {!isCustomizing && (
                <Button
                    variant='ghost'
                    size='sm'
                    onClick={toggleCustomization}
                    className='fixed right-4 top-4 z-40'
                    title='Customize Dashboard'
                >
                    <Settings className='size-4' />
                </Button>
            )}

            {/* Dashboard Container */}
            <div
                ref={containerRef}
                className={`dashboard-grid ${isCustomizing ? 'customizing' : ''}`}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)',
                    gap: '1rem',
                    minHeight: '100vh',
                    padding: '1rem',
                }}
                onDragOver={
                    isCustomizing ? dragDropHandlers.onDragOver : undefined
                }
                onDrop={isCustomizing ? dragDropHandlers.onDrop : undefined}
            >
                {currentLayout.widgets
                    .filter((widget) => widget.isVisible)
                    .map((widget) => (
                        <DashboardWidgetWrapper
                            key={widget.id}
                            widget={widget}
                            isCustomizing={isCustomizing}
                            onVisibilityToggle={updateWidgetVisibility}
                            dragDropHandlers={dragDropHandlers}
                        >
                            {children}
                        </DashboardWidgetWrapper>
                    ))}
            </div>

            {/* Widget Visibility Panel */}
            {isCustomizing && (
                <div
                    className={`fixed left-4 top-1/2 w-64 -translate-y-1/2 rounded-lg border p-4 shadow-lg ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border bg-revlr-dark-card'
                            : 'border-gray-200 bg-white'
                    }`}
                >
                    <h3 className='mb-3 font-semibold'>Widget Visibility</h3>
                    <div className='space-y-2'>
                        {currentLayout.widgets.map((widget) => (
                            <div
                                key={widget.id}
                                className='flex items-center justify-between'
                            >
                                <span className='text-sm'>{widget.title}</span>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() =>
                                        updateWidgetVisibility(
                                            widget.id,
                                            !widget.isVisible
                                        )
                                    }
                                >
                                    {widget.isVisible ? (
                                        <Eye className='size-4' />
                                    ) : (
                                        <EyeOff className='size-4' />
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Layout Manager Dialog */}
            <Dialog
                open={showLayoutManager}
                onOpenChange={setShowLayoutManager}
            >
                <DialogContent className='max-w-2xl'>
                    <DialogHeader>
                        <DialogTitle>Manage Dashboard Layouts</DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue='layouts' className='w-full'>
                        <TabsList className='grid w-full grid-cols-3'>
                            <TabsTrigger value='layouts'>Layouts</TabsTrigger>
                            <TabsTrigger value='create'>Create</TabsTrigger>
                            <TabsTrigger value='import'>
                                Import/Export
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value='layouts' className='space-y-4'>
                            <div className='grid gap-4'>
                                {layouts.map((layout) => (
                                    <div
                                        key={layout.id}
                                        className={`flex items-center justify-between rounded-lg border p-4 ${
                                            layout.id ===
                                            preferences.currentLayoutId
                                                ? 'border-revlr-primary-blue bg-blue-50 dark:bg-blue-950/20'
                                                : 'border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        <div>
                                            <h4 className='font-medium'>
                                                {layout.name}
                                            </h4>
                                            {layout.description && (
                                                <p className='text-sm text-gray-600 dark:text-gray-400'>
                                                    {layout.description}
                                                </p>
                                            )}
                                            <p className='text-xs text-gray-500'>
                                                {layout.widgets.length} widgets
                                            </p>
                                        </div>

                                        <div className='flex items-center gap-2'>
                                            {layout.id !==
                                                preferences.currentLayoutId && (
                                                <Button
                                                    variant='ghost'
                                                    size='sm'
                                                    onClick={() =>
                                                        setCurrentLayout(
                                                            layout.id
                                                        )
                                                    }
                                                >
                                                    Use
                                                </Button>
                                            )}

                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                onClick={() =>
                                                    handleDuplicateLayout(
                                                        layout.id
                                                    )
                                                }
                                            >
                                                <Copy className='size-4' />
                                            </Button>

                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                onClick={() =>
                                                    handleExportLayout(
                                                        layout.id
                                                    )
                                                }
                                            >
                                                <Download className='size-4' />
                                            </Button>

                                            {!layout.isDefault && (
                                                <Button
                                                    variant='ghost'
                                                    size='sm'
                                                    onClick={() =>
                                                        deleteLayout(layout.id)
                                                    }
                                                >
                                                    <Trash2 className='size-4' />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value='create' className='space-y-4'>
                            <div className='space-y-4'>
                                <div>
                                    <Label htmlFor='layout-name'>
                                        Layout Name
                                    </Label>
                                    <Input
                                        id='layout-name'
                                        value={newLayoutName}
                                        onChange={(e) =>
                                            setNewLayoutName(e.target.value)
                                        }
                                        placeholder='Enter layout name'
                                    />
                                </div>

                                <Button
                                    onClick={handleCreateLayout}
                                    disabled={!newLayoutName.trim()}
                                >
                                    <Plus className='mr-2 size-4' />
                                    Create Layout
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value='import' className='space-y-4'>
                            <div className='space-y-4'>
                                <div>
                                    <Label>Import from File</Label>
                                    <div className='flex gap-2'>
                                        <input
                                            ref={fileInputRef}
                                            type='file'
                                            accept='.json'
                                            onChange={handleFileImport}
                                            className='hidden'
                                        />
                                        <Button
                                            variant='outline'
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                        >
                                            <Upload className='mr-2 size-4' />
                                            Choose File
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor='import-data'>
                                        Or paste JSON data
                                    </Label>
                                    <textarea
                                        id='import-data'
                                        value={importData}
                                        onChange={(e) =>
                                            setImportData(e.target.value)
                                        }
                                        placeholder='Paste layout JSON here...'
                                        className='min-h-32 w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800'
                                    />
                                </div>

                                <Button
                                    onClick={handleImportLayout}
                                    disabled={!importData.trim()}
                                >
                                    Import Layout
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Preferences Dialog */}
            <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dashboard Preferences</DialogTitle>
                    </DialogHeader>

                    <div className='space-y-6'>
                        <div className='space-y-4'>
                            <div className='flex items-center justify-between'>
                                <Label>Theme</Label>
                                <div className='flex items-center gap-2'>
                                    <Button
                                        variant={
                                            theme === 'light'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        size='sm'
                                        onClick={() =>
                                            theme !== 'light' && toggleTheme()
                                        }
                                    >
                                        <Sun className='size-4' />
                                    </Button>
                                    <Button
                                        variant={
                                            theme === 'dark'
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        size='sm'
                                        onClick={() =>
                                            theme !== 'dark' && toggleTheme()
                                        }
                                    >
                                        <Moon className='size-4' />
                                    </Button>
                                </div>
                            </div>

                            <div className='flex items-center justify-between'>
                                <Label>Compact Mode</Label>
                                <Switch
                                    checked={preferences.compactMode}
                                    onCheckedChange={(checked) =>
                                        updatePreferences({
                                            compactMode: checked,
                                        })
                                    }
                                />
                            </div>

                            <div className='flex items-center justify-between'>
                                <Label>Show Animations</Label>
                                <Switch
                                    checked={preferences.showAnimations}
                                    onCheckedChange={(checked) =>
                                        updatePreferences({
                                            showAnimations: checked,
                                        })
                                    }
                                />
                            </div>

                            <div className='flex items-center justify-between'>
                                <Label>Auto Refresh</Label>
                                <Switch
                                    checked={preferences.autoRefresh}
                                    onCheckedChange={(checked) =>
                                        updatePreferences({
                                            autoRefresh: checked,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className='flex justify-between'>
                            <Button variant='outline' onClick={resetToDefault}>
                                Reset to Default
                            </Button>
                            <Button onClick={() => setShowPreferences(false)}>
                                Done
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Customization Styles */}
            <style jsx>{`
                .dashboard-grid.customizing .widget-wrapper {
                    border: 2px dashed transparent;
                    transition: border-color 0.2s;
                }

                .dashboard-grid.customizing .widget-wrapper:hover {
                    border-color: #3b82f6;
                }

                .dashboard-grid.customizing .widget-wrapper.dragging {
                    opacity: 0.5;
                    transform: rotate(5deg);
                }

                .drag-over {
                    border-color: #10b981 !important;
                    background-color: rgba(16, 185, 129, 0.1);
                }
            `}</style>
        </div>
    );
};

// Widget Wrapper Component
interface DashboardWidgetWrapperProps {
    widget: DashboardWidget;
    isCustomizing: boolean;
    onVisibilityToggle: (widgetId: string, isVisible: boolean) => void;
    dragDropHandlers: Record<string, unknown>;
    children: React.ReactNode;
}

const DashboardWidgetWrapper: React.FC<DashboardWidgetWrapperProps> = ({
    widget,
    isCustomizing,
    onVisibilityToggle,
    dragDropHandlers,
    children,
}) => {
    const { theme } = useTheme();
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e: React.DragEvent) => {
        setIsDragging(true);
        dragDropHandlers.onDragStart(e, {
            id: widget.id,
            type: widget.type,
            position: widget.position,
        });
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setIsDragging(false);
        dragDropHandlers.onDragEnd(e);
    };

    return (
        <div
            className={`widget-wrapper ${isDragging ? 'dragging' : ''}`}
            style={{
                gridArea: GridUtils.getGridPosition(widget),
            }}
            draggable={isCustomizing}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            data-widget-id={widget.id}
            data-drop-target={widget.id}
        >
            {isCustomizing && (
                <div
                    className={`absolute -top-8 right-0 flex items-center gap-1 rounded-t-lg px-2 py-1 text-xs ${
                        theme === 'dark'
                            ? 'bg-revlr-dark-card text-white'
                            : 'bg-white text-gray-900'
                    } border border-b-0`}
                >
                    <Move className='size-3 cursor-move' />
                    <span>{widget.title}</span>
                    <Button
                        variant='ghost'
                        size='sm'
                        className='size-4 p-0'
                        onClick={() => onVisibilityToggle(widget.id, false)}
                    >
                        <EyeOff className='size-3' />
                    </Button>
                </div>
            )}

            <div
                className={`size-full rounded-lg ${
                    isCustomizing
                        ? 'ring-2 ring-blue-200 dark:ring-blue-800'
                        : ''
                }`}
            >
                {children}
            </div>
        </div>
    );
};
