'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/types/dashboard-customization';
import { useTheme } from '@/lib/ThemeContext';
import { Share2, Copy, Download, Mail } from 'lucide-react';
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

interface DashboardLayoutSharingProps {
    layout: DashboardLayout;
    isOpen: boolean;
    onClose: () => void;
}

export const DashboardLayoutSharing: React.FC<DashboardLayoutSharingProps> = ({
    layout,
    isOpen,
    onClose,
}) => {
    const { theme } = useTheme();
    const [copySuccess, setCopySuccess] = useState(false);

    // Generate a shareable URL (in a real app, this would be a backend endpoint)
    const generateShareUrl = () => {
        const layoutData = encodeURIComponent(JSON.stringify(layout));
        const baseUrl =
            typeof window !== 'undefined' ? window.location.origin : '';
        return `${baseUrl}/dashboard/shared?layout=${layoutData}`;
    };

    const handleCopyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    const handleExportAsFile = () => {
        const data = JSON.stringify(layout, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${layout.name.toLowerCase().replace(/\s+/g, '-')}-layout.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleEmailShare = () => {
        const subject = encodeURIComponent(`Dashboard Layout: ${layout.name}`);
        const body = encodeURIComponent(
            `I'd like to share my dashboard layout "${layout.name}" with you.\n\n` +
                `Description: ${layout.description || 'No description provided'}\n\n` +
                `You can import this layout using the following JSON data:\n\n` +
                JSON.stringify(layout, null, 2)
        );
        window.open(`mailto:?subject=${subject}&body=${body}`);
    };

    const layoutJson = JSON.stringify(layout, null, 2);
    const shareableUrl = generateShareUrl();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className='max-w-2xl'>
                <DialogHeader>
                    <DialogTitle className='flex items-center gap-2'>
                        <Share2 className='size-5' />
                        Share Dashboard Layout
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue='link' className='w-full'>
                    <TabsList className='grid w-full grid-cols-4'>
                        <TabsTrigger value='link'>Link</TabsTrigger>
                        <TabsTrigger value='json'>JSON</TabsTrigger>
                        <TabsTrigger value='file'>File</TabsTrigger>
                        <TabsTrigger value='email'>Email</TabsTrigger>
                    </TabsList>

                    <TabsContent value='link' className='space-y-4'>
                        <div>
                            <Label>Shareable Link</Label>
                            <div className='flex gap-2'>
                                <Input
                                    value={shareableUrl}
                                    readOnly
                                    className='font-mono text-sm'
                                />
                                <Button
                                    variant='outline'
                                    onClick={() =>
                                        handleCopyToClipboard(shareableUrl)
                                    }
                                >
                                    {copySuccess ? (
                                        'Copied!'
                                    ) : (
                                        <Copy className='size-4' />
                                    )}
                                </Button>
                            </div>
                            <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                                Anyone with this link can import your dashboard
                                layout.
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value='json' className='space-y-4'>
                        <div>
                            <Label>Layout JSON Data</Label>
                            <textarea
                                value={layoutJson}
                                readOnly
                                className='mt-2 h-64 w-full rounded-md border border-gray-300 p-3 font-mono text-sm dark:border-gray-600 dark:bg-gray-800'
                            />
                            <div className='mt-2 flex gap-2'>
                                <Button
                                    variant='outline'
                                    onClick={() =>
                                        handleCopyToClipboard(layoutJson)
                                    }
                                >
                                    {copySuccess ? 'Copied!' : 'Copy JSON'}
                                </Button>
                            </div>
                            <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                                Copy this JSON data and share it with others.
                                They can paste it in the import section.
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value='file' className='space-y-4'>
                        <div className='text-center'>
                            <div className='mb-4'>
                                <Download className='mx-auto size-12 text-gray-400' />
                            </div>
                            <h3 className='mb-2 text-lg font-semibold'>
                                Export as File
                            </h3>
                            <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
                                Download your layout as a JSON file that can be
                                easily shared and imported.
                            </p>
                            <Button onClick={handleExportAsFile}>
                                <Download className='mr-2 size-4' />
                                Download Layout File
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value='email' className='space-y-4'>
                        <div className='text-center'>
                            <div className='mb-4'>
                                <Mail className='mx-auto size-12 text-gray-400' />
                            </div>
                            <h3 className='mb-2 text-lg font-semibold'>
                                Share via Email
                            </h3>
                            <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
                                Send your dashboard layout via email with import
                                instructions.
                            </p>
                            <Button onClick={handleEmailShare}>
                                <Mail className='mr-2 size-4' />
                                Open Email Client
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>

                <div
                    className={`mt-6 rounded-lg border p-4 ${
                        theme === 'dark'
                            ? 'border-gray-700 bg-gray-800'
                            : 'border-gray-200 bg-gray-50'
                    }`}
                >
                    <h4 className='mb-2 font-semibold'>Layout Information</h4>
                    <div className='space-y-1 text-sm'>
                        <p>
                            <strong>Name:</strong> {layout.name}
                        </p>
                        {layout.description && (
                            <p>
                                <strong>Description:</strong>{' '}
                                {layout.description}
                            </p>
                        )}
                        <p>
                            <strong>Widgets:</strong> {layout.widgets.length}
                        </p>
                        <p>
                            <strong>Created:</strong>{' '}
                            {new Date(layout.createdAt).toLocaleDateString()}
                        </p>
                        <p>
                            <strong>Last Updated:</strong>{' '}
                            {new Date(layout.updatedAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
