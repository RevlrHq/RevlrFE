import React, { useState } from 'react';
import { EventImage, EventCreationData } from '@/types/event-creation';
import { AttributionService } from '@/lib/services/media/AttributionService';
import { ComplianceDashboard } from './ComplianceDashboard';

interface ComplianceExampleProps {
    eventData: EventCreationData;
    images: EventImage[];
    onUpdateEventData?: (eventData: EventCreationData) => void;
    onReplaceImage?: (imageId: string) => void;
}

export const ComplianceExample: React.FC<ComplianceExampleProps> = ({
    eventData,
    images,
    onUpdateEventData,
    onReplaceImage,
}) => {
    const [isFixingAttribution, setIsFixingAttribution] = useState(false);

    const handleFixAttribution = async (
        imagesNeedingAttribution: EventImage[]
    ) => {
        if (!onUpdateEventData) return;

        setIsFixingAttribution(true);
        try {
            // Use the AttributionService to automatically insert attribution
            const updatedEventData =
                AttributionService.autoInsertAttributionWithPlacement(
                    eventData,
                    imagesNeedingAttribution,
                    'auto'
                );

            onUpdateEventData(updatedEventData);
        } catch (error) {
            console.error('Failed to fix attribution:', error);
        } finally {
            setIsFixingAttribution(false);
        }
    };

    return (
        <div className='space-y-6'>
            <div className='rounded-xl bg-white p-6 shadow-lg dark:bg-revlr-dark-card'>
                <h2 className='mb-4 text-xl font-semibold text-gray-900 dark:text-white'>
                    Media Compliance Dashboard
                </h2>
                <p className='mb-6 text-gray-600 dark:text-gray-400'>
                    Monitor and manage license compliance for all external media
                    in your event.
                </p>

                <ComplianceDashboard
                    images={images}
                    eventData={eventData}
                    onFixAttribution={handleFixAttribution}
                    onReplaceImage={onReplaceImage}
                />
            </div>

            {/* Usage Instructions */}
            <div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
                <h3 className='mb-2 font-medium text-blue-800 dark:text-blue-200'>
                    How to Use the Compliance Dashboard
                </h3>
                <ul className='space-y-1 text-sm text-blue-700 dark:text-blue-300'>
                    <li>• Review all license violations and warnings</li>
                    <li>
                        • Use "Auto-Fix Attribution" to automatically add
                        required attributions
                    </li>
                    <li>• Replace images that don't allow commercial use</li>
                    <li>• Export compliance reports for record keeping</li>
                    <li>• Monitor ongoing compliance as you add more images</li>
                </ul>
            </div>

            {isFixingAttribution && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
                    <div className='mx-4 w-full max-w-sm rounded-lg bg-white p-6 dark:bg-revlr-dark-card'>
                        <div className='flex items-center space-x-3'>
                            <div className='size-6 animate-spin rounded-full border-b-2 border-blue-600'></div>
                            <span className='text-gray-900 dark:text-white'>
                                Fixing attribution...
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplianceExample;
