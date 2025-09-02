import React, { useState } from 'react';
import { SettingsCard, SettingsSection } from '../../shared/components';
import { ExportRequest } from './ExportRequest';
import { ExportHistory } from './ExportHistory';
import { useDataExport, useExportHistory } from '../hooks';
import type { DataExportRequest } from '../types';

interface DataExportSettingsProps {
    className?: string;
}

const DataExportSettings: React.FC<DataExportSettingsProps> = ({
    className = '',
}) => {
    const [activeTab, setActiveTab] = useState<'request' | 'history'>(
        'request'
    );

    const { requestExport, isRequesting, availableDataTypes } = useDataExport();

    const {
        history,
        downloadExport,
        deleteExport,
        loadMore,
        isLoading: isHistoryLoading,
        isDownloading,
        isDeleting,
    } = useExportHistory();

    const handleExportRequest = async (request: DataExportRequest) => {
        await requestExport(request);
        setActiveTab('history');
    };

    return (
        <div className={`space-y-6 ${className}`}>
            <SettingsSection
                title='Data Export'
                description='Export your account data for backup or transfer purposes'
            >
                <SettingsCard
                    title='Export Your Data'
                    description='Download a copy of your data in various formats'
                >
                    <div className='space-y-4'>
                        {/* Tab Navigation */}
                        <div className='flex space-x-1 rounded-lg bg-gray-100 p-1'>
                            <button
                                onClick={() => setActiveTab('request')}
                                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                    activeTab === 'request'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                New Export
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                    activeTab === 'history'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Export History
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'request' && (
                            <ExportRequest
                                onSubmit={handleExportRequest}
                                isLoading={isRequesting}
                                availableDataTypes={availableDataTypes}
                            />
                        )}

                        {activeTab === 'history' && (
                            <ExportHistory
                                history={history}
                                onDownload={downloadExport}
                                onDelete={deleteExport}
                                onLoadMore={loadMore}
                                isLoading={isHistoryLoading}
                                isDownloading={isDownloading}
                                isDeleting={isDeleting}
                            />
                        )}
                    </div>
                </SettingsCard>
            </SettingsSection>
        </div>
    );
};

// Default export for lazy loading
export default DataExportSettings;
