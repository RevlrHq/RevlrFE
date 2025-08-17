'use client';

import React from 'react';
import { DashboardWidget } from '@/types/dashboard-customization';
import { useTheme } from '@/lib/ThemeContext';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface WidgetConfigPanelProps {
    widget: DashboardWidget;
    isOpen: boolean;
    onClose: () => void;
    onConfigUpdate: (widgetId: string, config: Record<string, unknown>) => void;
}

export const WidgetConfigPanel: React.FC<WidgetConfigPanelProps> = ({
    widget,
    isOpen,
    onClose,
    onConfigUpdate,
}) => {
    useTheme();
    const config = widget.config || {};

    const handleConfigChange = (key: string, value: unknown) => {
        const newConfig = { ...config, [key]: value };
        onConfigUpdate(widget.id, newConfig);
    };

    const renderStatisticsConfig = () => (
        <div className='space-y-4'>
            <div className='flex items-center justify-between'>
                <Label>Show Growth Indicators</Label>
                <Switch
                    checked={config.showGrowthIndicators ?? true}
                    onCheckedChange={(checked) =>
                        handleConfigChange('showGrowthIndicators', checked)
                    }
                />
            </div>

            <div className='flex items-center justify-between'>
                <Label>Show Comparisons</Label>
                <Switch
                    checked={config.showComparisons ?? true}
                    onCheckedChange={(checked) =>
                        handleConfigChange('showComparisons', checked)
                    }
                />
            </div>

            <div className='flex items-center justify-between'>
                <Label>Animate Counters</Label>
                <Switch
                    checked={config.animateCounters ?? true}
                    onCheckedChange={(checked) =>
                        handleConfigChange('animateCounters', checked)
                    }
                />
            </div>
        </div>
    );

    const renderAnalyticsConfig = () => (
        <div className='space-y-4'>
            <div>
                <Label>Chart Type</Label>
                <Select
                    value={config.chartType || 'line'}
                    onValueChange={(value) =>
                        handleConfigChange('chartType', value)
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder='Select chart type' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='line'>Line Chart</SelectItem>
                        <SelectItem value='bar'>Bar Chart</SelectItem>
                        <SelectItem value='area'>Area Chart</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className='flex items-center justify-between'>
                <Label>Show Legend</Label>
                <Switch
                    checked={config.showLegend ?? true}
                    onCheckedChange={(checked) =>
                        handleConfigChange('showLegend', checked)
                    }
                />
            </div>

            <div className='flex items-center justify-between'>
                <Label>Show Data Labels</Label>
                <Switch
                    checked={config.showDataLabels ?? false}
                    onCheckedChange={(checked) =>
                        handleConfigChange('showDataLabels', checked)
                    }
                />
            </div>
        </div>
    );

    const renderEventsConfig = () => (
        <div className='space-y-4'>
            <div>
                <Label>Maximum Items</Label>
                <Input
                    type='number'
                    min='1'
                    max='20'
                    value={config.maxItems || 5}
                    onChange={(e) =>
                        handleConfigChange(
                            'maxItems',
                            parseInt(e.target.value) || 5
                        )
                    }
                />
            </div>

            <div className='flex items-center justify-between'>
                <Label>Show Status</Label>
                <Switch
                    checked={config.showStatus ?? true}
                    onCheckedChange={(checked) =>
                        handleConfigChange('showStatus', checked)
                    }
                />
            </div>

            <div className='flex items-center justify-between'>
                <Label>Show Thumbnails</Label>
                <Switch
                    checked={config.showThumbnails ?? true}
                    onCheckedChange={(checked) =>
                        handleConfigChange('showThumbnails', checked)
                    }
                />
            </div>
        </div>
    );

    const renderRevenueConfig = () => (
        <div className='space-y-4'>
            <div>
                <Label>Currency</Label>
                <Select
                    value={config.currency || 'NGN'}
                    onValueChange={(value) =>
                        handleConfigChange('currency', value)
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder='Select currency' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='NGN'>Nigerian Naira (₦)</SelectItem>
                        <SelectItem value='USD'>US Dollar ($)</SelectItem>
                        <SelectItem value='EUR'>Euro (€)</SelectItem>
                        <SelectItem value='GBP'>British Pound (£)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className='flex items-center justify-between'>
                <Label>Show Projections</Label>
                <Switch
                    checked={config.showProjections ?? true}
                    onCheckedChange={(checked) =>
                        handleConfigChange('showProjections', checked)
                    }
                />
            </div>

            <div className='flex items-center justify-between'>
                <Label>Show Breakdown</Label>
                <Switch
                    checked={config.showBreakdown ?? false}
                    onCheckedChange={(checked) =>
                        handleConfigChange('showBreakdown', checked)
                    }
                />
            </div>
        </div>
    );

    const renderWidgetConfig = () => {
        switch (widget.type) {
            case 'statistics':
                return renderStatisticsConfig();
            case 'analytics':
                return renderAnalyticsConfig();
            case 'events':
                return renderEventsConfig();
            case 'revenue':
                return renderRevenueConfig();
            default:
                return (
                    <div className='text-center text-gray-500'>
                        No configuration options available for this widget.
                    </div>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='max-w-md'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <Settings className='size-5' />
                        Configure {widget.title}
                    </DialogTitle>
                </DialogHeader>

                <div className='space-y-6'>
                    <div>
                        <Label>Widget Title</Label>
                        <Input
                            value={widget.title}
                            onChange={(e) =>
                                handleConfigChange('title', e.target.value)
                            }
                            placeholder='Enter widget title'
                        />
                    </div>

                    {renderWidgetConfig()}

                    <div className='flex justify-end'>
                        <Button onClick={onClose}>Done</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
