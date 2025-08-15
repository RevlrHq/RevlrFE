'use client';

import React, { useState, useCallback } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { MediaItem } from '@/types/media-search';
import { MediaCollection } from '@/lib/services/media/MediaCollectionsService';
import {
    X,
    Download,
    Share2,
    Copy,
    Mail,
    FileText,
    FileSpreadsheet,
    Archive,
    Link,
    Users,
    Calendar,
    Tag,
    Image as ImageIcon,
    Check,
    AlertCircle,
} from 'lucide-react';

interface MediaExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    items?: MediaItem[];
    collection?: MediaCollection;
    title?: string;
}

interface ExportOptions {
    format: 'json' | 'csv' | 'zip' | 'share';
    includeMetadata: boolean;
    includeImages: boolean;
    includeAttribution: boolean;
    shareExpiration: number; // hours
    sharePublic: boolean;
    customFields: string[];
}

export const MediaExportModal: React.FC<MediaExportModalProps> = ({
    isOpen,
    onClose,
    items = [],
    collection,
    title = 'Export Media',
}) => {
    const { theme } = useTheme();
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        format: 'json',
        includeMetadata: true,
        includeImages: false,
        includeAttribution: true,
        shareExpiration: 24,
        sharePublic: false,
        customFields: [],
    });

    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const exportData = collection ? collection.items : items;
    const exportCount = exportData.length;

    // Handle export option changes
    const updateExportOption = useCallback(
        <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
            setExportOptions((prev) => ({ ...prev, [key]: value }));
        },
        []
    );

    // Handle export
    const handleExport = useCallback(async () => {
        if (exportCount === 0) return;

        setIsExporting(true);
        setExportProgress(0);

        try {
            switch (exportOptions.format) {
                case 'json':
                    await exportAsJSON();
                    break;
                case 'csv':
                    await exportAsCSV();
                    break;
                case 'zip':
                    await exportAsZIP();
                    break;
                case 'share':
                    await createShareLink();
                    break;
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
            setExportProgress(0);
        }
    }, [exportOptions, exportCount]);

    // Export as JSON
    const exportAsJSON = async () => {
        const exportData = {
            title: collection?.name || title,
            description: collection?.description,
            exportedAt: new Date().toISOString(),
            totalItems: exportCount,
            items: items.map((item) => ({
                id: item.id,
                providerId: item.providerId,
                title: item.title,
                description: item.description,
                downloadUrl: item.downloadUrl,
                thumbnailUrl: item.thumbnailUrl,
                ...(exportOptions.includeMetadata && {
                    width: item.width,
                    height: item.height,
                    fileSize: item.fileSize,
                    mediaType: item.mediaType,
                    tags: item.tags,
                    color: item.color,
                }),
                ...(exportOptions.includeAttribution && {
                    photographer: item.photographer,
                    attribution: item.attribution,
                    license: item.license,
                }),
            })),
            ...(collection && {
                collectionId: collection.id,
                tags: collection.tags,
                createdAt: collection.createdAt,
                updatedAt: collection.updatedAt,
            }),
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json',
        });

        downloadBlob(blob, `${collection?.name || 'media-export'}.json`);
    };

    // Export as CSV
    const exportAsCSV = async () => {
        const headers = [
            'Title',
            'Provider',
            'Download URL',
            'Thumbnail URL',
            ...(exportOptions.includeMetadata
                ? [
                      'Width',
                      'Height',
                      'File Size',
                      'Media Type',
                      'Tags',
                      'Color',
                  ]
                : []),
            ...(exportOptions.includeAttribution
                ? [
                      'Photographer',
                      'Attribution Required',
                      'License Type',
                      'License URL',
                  ]
                : []),
        ];

        const rows = items.map((item) => [
            `"${item.title.replace(/"/g, '""')}"`,
            item.providerId,
            item.downloadUrl,
            item.thumbnailUrl,
            ...(exportOptions.includeMetadata
                ? [
                      item.width,
                      item.height,
                      item.fileSize || '',
                      item.mediaType,
                      `"${item.tags.join(';')}"`,
                      item.color || '',
                  ]
                : []),
            ...(exportOptions.includeAttribution
                ? [
                      `"${item.photographer?.name || ''}"`,
                      item.attribution.required,
                      item.license.type,
                      item.license.url,
                  ]
                : []),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.join(',')),
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });

        downloadBlob(blob, `${collection?.name || 'media-export'}.csv`);
    };

    // Export as ZIP (mock implementation)
    const exportAsZIP = async () => {
        // In a real implementation, this would use JSZip to create a ZIP file
        // with the actual images and a metadata file

        for (let i = 0; i < exportCount; i++) {
            setExportProgress((i / exportCount) * 100);
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const zipData = {
            readme: 'This ZIP file would contain the actual images and metadata',
            items: items.map((item) => ({
                filename: `${item.id}.jpg`,
                title: item.title,
                url: item.downloadUrl,
            })),
        };

        const blob = new Blob([JSON.stringify(zipData, null, 2)], {
            type: 'application/zip',
        });

        downloadBlob(blob, `${collection?.name || 'media-export'}.zip`);
    };

    // Create share link
    const createShareLink = async () => {
        // Mock share link creation
        const shareToken = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const url = `${window.location.origin}/shared/${shareToken}`;

        setShareUrl(url);

        // In a real implementation, this would save the share data to a backend
        console.log('Share link created:', url);
    };

    // Download blob helper
    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Copy share URL
    const copyShareUrl = useCallback(async () => {
        if (!shareUrl) return;

        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (error) {
            console.error('Failed to copy URL:', error);
        }
    }, [shareUrl]);

    // Share via email
    const shareViaEmail = useCallback(() => {
        if (!shareUrl) return;

        const subject = encodeURIComponent(
            `Shared Media Collection: ${collection?.name || title}`
        );
        const body = encodeURIComponent(
            `Check out this media collection: ${shareUrl}`
        );
        window.open(`mailto:?subject=${subject}&body=${body}`);
    }, [shareUrl, collection?.name, title]);

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4'>
            <div
                className={`relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl shadow-2xl ${
                    theme === 'dark' ? 'bg-revlr-dark-bg' : 'bg-white'
                }`}
            >
                {/* Header */}
                <div
                    className={`flex items-center justify-between border-b p-6 ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border'
                            : 'border-gray-200'
                    }`}
                >
                    <div>
                        <h2
                            className={`font-inter text-xl font-semibold ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            {title}
                        </h2>
                        <p
                            className={`mt-1 font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            Export {exportCount} items
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isExporting}
                        className={`rounded-full p-2 transition-colors ${
                            theme === 'dark'
                                ? 'text-gray-400 hover:bg-revlr-dark-card hover:text-white'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        } ${isExporting ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                        <X className='size-5' />
                    </button>
                </div>

                {/* Content */}
                <div className='max-h-[60vh] overflow-y-auto p-6'>
                    {/* Export Format Selection */}
                    <div className='mb-6'>
                        <h3
                            className={`mb-3 font-inter text-lg font-medium ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                        >
                            Export Format
                        </h3>
                        <div className='grid grid-cols-2 gap-3'>
                            {[
                                {
                                    value: 'json',
                                    label: 'JSON',
                                    icon: FileText,
                                    desc: 'Structured data format',
                                },
                                {
                                    value: 'csv',
                                    label: 'CSV',
                                    icon: FileSpreadsheet,
                                    desc: 'Spreadsheet compatible',
                                },
                                {
                                    value: 'zip',
                                    label: 'ZIP',
                                    icon: Archive,
                                    desc: 'Images + metadata',
                                },
                                {
                                    value: 'share',
                                    label: 'Share Link',
                                    icon: Share2,
                                    desc: 'Shareable URL',
                                },
                            ].map(({ value, label, icon: Icon, desc }) => (
                                <button
                                    key={value}
                                    onClick={() =>
                                        updateExportOption(
                                            'format',
                                            value as any
                                        )
                                    }
                                    disabled={isExporting}
                                    className={`flex items-center space-x-3 rounded-lg border p-4 text-left transition-colors ${
                                        exportOptions.format === value
                                            ? 'border-revlr-primary-blue bg-revlr-primary-blue/10'
                                            : theme === 'dark'
                                              ? 'border-revlr-dark-border hover:border-revlr-primary-blue/50'
                                              : 'border-gray-200 hover:border-revlr-primary-blue/50'
                                    } ${isExporting ? 'cursor-not-allowed opacity-50' : ''}`}
                                >
                                    <Icon
                                        className={`size-5 ${
                                            exportOptions.format === value
                                                ? 'text-revlr-primary-blue'
                                                : theme === 'dark'
                                                  ? 'text-gray-400'
                                                  : 'text-gray-500'
                                        }`}
                                    />
                                    <div>
                                        <p
                                            className={`font-inter font-medium ${
                                                theme === 'dark'
                                                    ? 'text-white'
                                                    : 'text-gray-900'
                                            }`}
                                        >
                                            {label}
                                        </p>
                                        <p
                                            className={`text-xs ${
                                                theme === 'dark'
                                                    ? 'text-gray-400'
                                                    : 'text-gray-600'
                                            }`}
                                        >
                                            {desc}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Export Options */}
                    {exportOptions.format !== 'share' && (
                        <div className='mb-6'>
                            <h3
                                className={`mb-3 font-inter text-lg font-medium ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                Export Options
                            </h3>
                            <div className='space-y-3'>
                                {[
                                    {
                                        key: 'includeMetadata',
                                        label: 'Include metadata (dimensions, file size, etc.)',
                                    },
                                    {
                                        key: 'includeAttribution',
                                        label: 'Include attribution and license info',
                                    },
                                    ...(exportOptions.format === 'zip'
                                        ? [
                                              {
                                                  key: 'includeImages',
                                                  label: 'Download actual images (larger file size)',
                                              },
                                          ]
                                        : []),
                                ].map(({ key, label }) => (
                                    <label
                                        key={key}
                                        className='flex items-center space-x-3'
                                    >
                                        <input
                                            type='checkbox'
                                            checked={
                                                exportOptions[
                                                    key as keyof ExportOptions
                                                ] as boolean
                                            }
                                            onChange={(e) =>
                                                updateExportOption(
                                                    key as keyof ExportOptions,
                                                    e.target.checked as any
                                                )
                                            }
                                            disabled={isExporting}
                                            className='rounded border-gray-300 text-revlr-primary-blue focus:ring-revlr-primary-blue disabled:cursor-not-allowed disabled:opacity-50'
                                        />
                                        <span
                                            className={`font-inter text-sm ${
                                                theme === 'dark'
                                                    ? 'text-gray-300'
                                                    : 'text-gray-700'
                                            }`}
                                        >
                                            {label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Share Options */}
                    {exportOptions.format === 'share' && (
                        <div className='mb-6'>
                            <h3
                                className={`mb-3 font-inter text-lg font-medium ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                Share Options
                            </h3>
                            <div className='space-y-4'>
                                <div>
                                    <label
                                        className={`block font-inter text-sm font-medium ${
                                            theme === 'dark'
                                                ? 'text-gray-300'
                                                : 'text-gray-700'
                                        }`}
                                    >
                                        Link expires in
                                    </label>
                                    <select
                                        value={exportOptions.shareExpiration}
                                        onChange={(e) =>
                                            updateExportOption(
                                                'shareExpiration',
                                                parseInt(e.target.value)
                                            )
                                        }
                                        disabled={isExporting}
                                        className={`mt-1 block w-full rounded-lg border px-3 py-2 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 ${
                                            theme === 'dark'
                                                ? 'border-revlr-dark-border bg-revlr-dark-card text-white'
                                                : 'border-gray-300 bg-white text-gray-900'
                                        } ${isExporting ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                        <option value={1}>1 hour</option>
                                        <option value={24}>24 hours</option>
                                        <option value={168}>1 week</option>
                                        <option value={720}>1 month</option>
                                        <option value={0}>Never</option>
                                    </select>
                                </div>

                                <label className='flex items-center space-x-3'>
                                    <input
                                        type='checkbox'
                                        checked={exportOptions.sharePublic}
                                        onChange={(e) =>
                                            updateExportOption(
                                                'sharePublic',
                                                e.target.checked
                                            )
                                        }
                                        disabled={isExporting}
                                        className='rounded border-gray-300 text-revlr-primary-blue focus:ring-revlr-primary-blue disabled:cursor-not-allowed disabled:opacity-50'
                                    />
                                    <span
                                        className={`font-inter text-sm ${
                                            theme === 'dark'
                                                ? 'text-gray-300'
                                                : 'text-gray-700'
                                        }`}
                                    >
                                        Make publicly discoverable
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Share URL Display */}
                    {shareUrl && (
                        <div className='mb-6'>
                            <h3
                                className={`mb-3 font-inter text-lg font-medium ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                Share Link
                            </h3>
                            <div
                                className={`rounded-lg border p-4 ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                                        : 'border-gray-200 bg-gray-50'
                                }`}
                            >
                                <div className='flex items-center space-x-2'>
                                    <input
                                        type='text'
                                        value={shareUrl}
                                        readOnly
                                        className={`flex-1 rounded border-0 bg-transparent font-inter text-sm focus:outline-none ${
                                            theme === 'dark'
                                                ? 'text-gray-300'
                                                : 'text-gray-700'
                                        }`}
                                    />
                                    <button
                                        onClick={copyShareUrl}
                                        className={`rounded p-2 transition-colors ${
                                            copySuccess
                                                ? 'bg-green-500 text-white'
                                                : theme === 'dark'
                                                  ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                                  : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                        }`}
                                        title={
                                            copySuccess
                                                ? 'Copied!'
                                                : 'Copy link'
                                        }
                                    >
                                        {copySuccess ? (
                                            <Check className='size-4' />
                                        ) : (
                                            <Copy className='size-4' />
                                        )}
                                    </button>
                                    <button
                                        onClick={shareViaEmail}
                                        className={`rounded p-2 transition-colors ${
                                            theme === 'dark'
                                                ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                                                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                        }`}
                                        title='Share via email'
                                    >
                                        <Mail className='size-4' />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Export Progress */}
                    {isExporting && (
                        <div className='mb-6'>
                            <div className='mb-2 flex items-center justify-between'>
                                <span
                                    className={`font-inter text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-300'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    Exporting...
                                </span>
                                <span
                                    className={`font-inter text-sm ${
                                        theme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    {Math.round(exportProgress)}%
                                </span>
                            </div>
                            <div
                                className={`h-2 w-full rounded-full ${
                                    theme === 'dark'
                                        ? 'bg-revlr-dark-border'
                                        : 'bg-gray-200'
                                }`}
                            >
                                <div
                                    className='h-2 rounded-full bg-revlr-primary-blue transition-all duration-300'
                                    style={{ width: `${exportProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className={`border-t p-6 ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border'
                            : 'border-gray-200'
                    }`}
                >
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2 text-sm'>
                            <ImageIcon
                                className={`size-4 ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-500'
                                }`}
                            />
                            <span
                                className={
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-600'
                                }
                            >
                                {exportCount} items selected
                            </span>
                        </div>

                        <div className='flex space-x-3'>
                            <button
                                onClick={onClose}
                                disabled={isExporting}
                                className={`rounded-xl border px-4 py-2 font-inter font-medium transition-colors ${
                                    theme === 'dark'
                                        ? 'border-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                } ${isExporting ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={isExporting || exportCount === 0}
                                className='rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-4 py-2 font-inter font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'
                            >
                                <div className='flex items-center space-x-2'>
                                    {exportOptions.format === 'share' ? (
                                        <Share2 className='size-4' />
                                    ) : (
                                        <Download className='size-4' />
                                    )}
                                    <span>
                                        {isExporting
                                            ? 'Exporting...'
                                            : exportOptions.format === 'share'
                                              ? 'Create Share Link'
                                              : 'Export'}
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
