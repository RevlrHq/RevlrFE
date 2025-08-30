import React, { useState } from 'react';
import { MediaItem } from '@/types/media-search';
import { EventCreationData } from '@/types/event-creation';
import { AttributionService } from '@/lib/services/media/AttributionService';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';

interface AttributionPreviewProps {
    item: MediaItem;
    eventData?: EventCreationData;
    placement?: 'event-description' | 'image-caption' | 'footer';
    className?: string;
}

export const AttributionPreview: React.FC<AttributionPreviewProps> = ({
    item,
    eventData,
    placement = 'event-description',
    className = '',
}) => {
    const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    if (!item.attribution.required) {
        return (
            <div
                className={`rounded-lg bg-green-50 p-3 dark:bg-green-900/20 ${className}`}
            >
                <div className='flex items-center text-green-800 dark:text-green-200'>
                    <Check className='mr-2 size-4' />
                    <span className='font-medium'>No attribution required</span>
                </div>
            </div>
        );
    }

    const textAttribution = AttributionService.generateAttributionText(
        item,
        'text'
    );
    const htmlAttribution = AttributionService.generateAttributionText(
        item,
        'html'
    );
    const markdownAttribution = AttributionService.generateAttributionText(
        item,
        'markdown'
    );

    const copyToClipboard = async (text: string, format: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedFormat(format);
            setTimeout(() => setCopiedFormat(null), 2000);
        } catch (err) {
            console.debug('Failed to copy attribution:', err);
        }
    };

    const formatEventPreview = () => {
        if (!eventData) return null;

        const formattedAttribution =
            AttributionService.formatAttributionForEvent(
                item,
                eventData,
                placement
            );

        return eventData.eventDescription + formattedAttribution;
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <h3 className='font-semibold text-gray-900 dark:text-white'>
                    Attribution Required
                </h3>
                {eventData && (
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className='flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                    >
                        {showPreview ? (
                            <>
                                <EyeOff className='size-4' />
                                <span>Hide Preview</span>
                            </>
                        ) : (
                            <>
                                <Eye className='size-4' />
                                <span>Show Preview</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Attribution Formats */}
            <div className='space-y-3'>
                <AttributionFormat
                    label='Plain Text'
                    content={textAttribution}
                    onCopy={() => copyToClipboard(textAttribution, 'text')}
                    copied={copiedFormat === 'text'}
                />

                <AttributionFormat
                    label='HTML'
                    content={htmlAttribution}
                    onCopy={() => copyToClipboard(htmlAttribution, 'html')}
                    copied={copiedFormat === 'html'}
                    isHtml
                />

                <AttributionFormat
                    label='Markdown'
                    content={markdownAttribution}
                    onCopy={() =>
                        copyToClipboard(markdownAttribution, 'markdown')
                    }
                    copied={copiedFormat === 'markdown'}
                />
            </div>

            {/* Placement Information */}
            <div className='rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20'>
                <h4 className='mb-2 font-medium text-blue-800 dark:text-blue-200'>
                    Recommended Placement:
                </h4>
                <p className='text-sm text-blue-700 dark:text-blue-300'>
                    {getPlacementDescription(item.attribution.placement)}
                </p>
            </div>

            {/* Event Preview */}
            {showPreview && eventData && (
                <div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-800'>
                    <h4 className='mb-3 font-medium text-gray-900 dark:text-white'>
                        Event Description Preview:
                    </h4>
                    <div className='rounded border bg-white p-3 text-sm dark:bg-gray-900'>
                        <div className='whitespace-pre-wrap text-gray-700 dark:text-gray-300'>
                            {formatEventPreview()}
                        </div>
                    </div>
                </div>
            )}

            {/* Usage Guidelines */}
            <div className='rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20'>
                <h4 className='mb-2 font-medium text-yellow-800 dark:text-yellow-200'>
                    Usage Guidelines:
                </h4>
                <ul className='space-y-1 text-sm text-yellow-700 dark:text-yellow-300'>
                    <li>• Attribution must be visible to event attendees</li>
                    <li>• Links should be preserved when possible</li>
                    <li>• Attribution cannot be removed or modified</li>
                    {item.providerId === 'unsplash' && (
                        <li>
                            • Consider adding attribution even if not required
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

interface AttributionFormatProps {
    label: string;
    content: string;
    onCopy: () => void;
    copied: boolean;
    isHtml?: boolean;
}

const AttributionFormat: React.FC<AttributionFormatProps> = ({
    label,
    content,
    onCopy,
    copied,
    isHtml = false,
}) => {
    return (
        <div className='rounded-lg border border-gray-200 dark:border-gray-700'>
            <div className='flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800'>
                <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    {label}
                </span>
                <button
                    onClick={onCopy}
                    className='flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                >
                    {copied ? (
                        <>
                            <Check className='size-3' />
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className='size-3' />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <div className='p-3'>
                {isHtml ? (
                    <div className='space-y-2'>
                        <div
                            className='text-sm text-gray-700 dark:text-gray-300'
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                        <div className='rounded bg-gray-100 p-2 font-mono text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400'>
                            {content}
                        </div>
                    </div>
                ) : (
                    <div className='font-mono text-sm text-gray-700 dark:text-gray-300'>
                        {content}
                    </div>
                )}
            </div>
        </div>
    );
};

const getPlacementDescription = (placement: string): string => {
    switch (placement) {
        case 'event-description':
            return "Add attribution to the end of your event description. This ensures it's visible to all attendees.";
        case 'image-caption':
            return 'Include attribution as a caption directly below the image. This provides clear context for the image source.';
        case 'footer':
            return 'Add attribution in a credits section at the bottom of your event page or materials.';
        case 'none':
            return 'No attribution required for this image.';
        default:
            return 'Follow the specific placement requirements for this image license.';
    }
};

export default AttributionPreview;
