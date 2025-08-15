import React, { useState, useEffect } from 'react';
import { EventImage, EventCreationData } from '@/types/event-creation';
import {
    LicenseValidator,
    ComplianceCheckResult,
} from '@/lib/services/media/LicenseValidator';
import { AttributionService } from '@/lib/services/media/AttributionService';
import { LicenseChangeNotificationService } from '@/lib/services/media/LicenseChangeNotificationService';
import {
    AlertTriangle,
    Check,
    Info,
    RefreshCw,
    Download,
    Eye,
} from 'lucide-react';

interface ComplianceDashboardProps {
    images: EventImage[];
    eventData: EventCreationData;
    onFixAttribution?: (images: EventImage[]) => void;
    onReplaceImage?: (imageId: string) => void;
    className?: string;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
    images,
    eventData,
    onFixAttribution,
    onReplaceImage,
    className = '',
}) => {
    const [complianceResult, setComplianceResult] =
        useState<ComplianceCheckResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<
        'overview' | 'violations' | 'warnings'
    >('overview');

    useEffect(() => {
        checkCompliance();
    }, [images, eventData]);

    const checkCompliance = async () => {
        setIsLoading(true);
        try {
            const result = LicenseValidator.checkEventCompliance(
                images,
                eventData
            );
            setComplianceResult(result);
        } catch (error) {
            console.error('Failed to check compliance:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoFixAttribution = () => {
        const imagesNeedingAttribution = images.filter(
            (img) => img.source === 'external' && img.attribution?.required
        );

        if (onFixAttribution) {
            onFixAttribution(imagesNeedingAttribution);
        }
    };

    const generateComplianceReport = () => {
        if (!complianceResult) return;

        const report = LicenseValidator.generateComplianceReport(
            images,
            eventData
        );
        const reportContent = JSON.stringify(report, null, 2);

        const blob = new Blob([reportContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-report-${eventData.id || 'draft'}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div
                className={`flex items-center justify-center p-8 ${className}`}
            >
                <RefreshCw className='h-6 w-6 animate-spin text-blue-500' />
                <span className='ml-2 text-gray-600 dark:text-gray-400'>
                    Checking compliance...
                </span>
            </div>
        );
    }

    if (!complianceResult) {
        return (
            <div className={`p-8 text-center ${className}`}>
                <p className='text-gray-600 dark:text-gray-400'>
                    Unable to check compliance. Please try again.
                </p>
                <button
                    onClick={checkCompliance}
                    className='mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
                >
                    Retry
                </button>
            </div>
        );
    }

    const externalImages = images.filter((img) => img.source === 'external');
    const criticalViolations = complianceResult.violations.filter(
        (v) => v.severity === 'critical'
    );
    const highViolations = complianceResult.violations.filter(
        (v) => v.severity === 'high'
    );

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                    License Compliance
                </h2>
                <div className='flex items-center space-x-2'>
                    <button
                        onClick={checkCompliance}
                        className='flex items-center space-x-1 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    >
                        <RefreshCw className='h-4 w-4' />
                        <span>Refresh</span>
                    </button>
                    <button
                        onClick={generateComplianceReport}
                        className='flex items-center space-x-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700'
                    >
                        <Download className='h-4 w-4' />
                        <span>Export Report</span>
                    </button>
                </div>
            </div>

            {/* Compliance Status */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
                <ComplianceMetric
                    label='Total Images'
                    value={images.length}
                    icon={<Eye className='h-5 w-5' />}
                    color='gray'
                />
                <ComplianceMetric
                    label='External Images'
                    value={externalImages.length}
                    icon={<Info className='h-5 w-5' />}
                    color='blue'
                />
                <ComplianceMetric
                    label='Violations'
                    value={complianceResult.violations.length}
                    icon={<AlertTriangle className='h-5 w-5' />}
                    color={
                        complianceResult.violations.length > 0 ? 'red' : 'green'
                    }
                />
                <ComplianceMetric
                    label='Warnings'
                    value={complianceResult.warnings.length}
                    icon={<Info className='h-5 w-5' />}
                    color={
                        complianceResult.warnings.length > 0
                            ? 'yellow'
                            : 'green'
                    }
                />
            </div>

            {/* Overall Status */}
            <div
                className={`rounded-lg p-4 ${
                    complianceResult.isCompliant
                        ? 'border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                }`}
            >
                <div className='flex items-center'>
                    {complianceResult.isCompliant ? (
                        <Check className='mr-2 h-5 w-5 text-green-600 dark:text-green-400' />
                    ) : (
                        <AlertTriangle className='mr-2 h-5 w-5 text-red-600 dark:text-red-400' />
                    )}
                    <span
                        className={`font-medium ${
                            complianceResult.isCompliant
                                ? 'text-green-800 dark:text-green-200'
                                : 'text-red-800 dark:text-red-200'
                        }`}
                    >
                        {complianceResult.isCompliant
                            ? 'All images are compliant'
                            : `${complianceResult.violations.length} compliance issue${complianceResult.violations.length > 1 ? 's' : ''} found`}
                    </span>
                </div>
            </div>

            {/* Quick Actions */}
            {!complianceResult.isCompliant && (
                <div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
                    <h3 className='mb-3 font-medium text-blue-800 dark:text-blue-200'>
                        Quick Actions
                    </h3>
                    <div className='flex flex-wrap gap-2'>
                        {complianceResult.violations.some(
                            (v) => v.type === 'attribution'
                        ) && (
                            <button
                                onClick={handleAutoFixAttribution}
                                className='rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700'
                            >
                                Auto-Fix Attribution
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('violations')}
                            className='rounded-lg border border-blue-600 bg-white px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-blue-900/20'
                        >
                            View Details
                        </button>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className='border-b border-gray-200 dark:border-gray-700'>
                <nav className='flex space-x-8'>
                    {[
                        { id: 'overview', label: 'Overview', count: null },
                        {
                            id: 'violations',
                            label: 'Violations',
                            count: complianceResult.violations.length,
                        },
                        {
                            id: 'warnings',
                            label: 'Warnings',
                            count: complianceResult.warnings.length,
                        },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`border-b-2 px-1 py-2 text-sm font-medium ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {tab.label}
                            {tab.count !== null && tab.count > 0 && (
                                <span className='ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-900 dark:bg-gray-800 dark:text-gray-100'>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className='space-y-4'>
                {activeTab === 'overview' && (
                    <OverviewTab
                        complianceResult={complianceResult}
                        images={images}
                        eventData={eventData}
                    />
                )}

                {activeTab === 'violations' && (
                    <ViolationsTab
                        violations={complianceResult.violations}
                        onReplaceImage={onReplaceImage}
                    />
                )}

                {activeTab === 'warnings' && (
                    <WarningsTab warnings={complianceResult.warnings} />
                )}
            </div>
        </div>
    );
};

interface ComplianceMetricProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: 'gray' | 'blue' | 'red' | 'green' | 'yellow';
}

const ComplianceMetric: React.FC<ComplianceMetricProps> = ({
    label,
    value,
    icon,
    color,
}) => {
    const colorClasses = {
        gray: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    };

    return (
        <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
            <div className='flex items-center'>
                {icon}
                <div className='ml-3'>
                    <p className='text-sm font-medium opacity-75'>{label}</p>
                    <p className='text-2xl font-semibold'>{value}</p>
                </div>
            </div>
        </div>
    );
};

// Additional tab components would be implemented here...
const OverviewTab: React.FC<any> = ({
    complianceResult,
    images,
    eventData,
}) => (
    <div className='space-y-4'>
        <p className='text-gray-600 dark:text-gray-400'>
            Overview of compliance status for all external images in this event.
        </p>
        {complianceResult.recommendations.length > 0 && (
            <div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
                <h4 className='mb-2 font-medium text-blue-800 dark:text-blue-200'>
                    Recommendations:
                </h4>
                <ul className='space-y-1 text-sm text-blue-700 dark:text-blue-300'>
                    {complianceResult.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                    ))}
                </ul>
            </div>
        )}
    </div>
);

const ViolationsTab: React.FC<any> = ({ violations, onReplaceImage }) => (
    <div className='space-y-4'>
        {violations.length === 0 ? (
            <div className='py-8 text-center'>
                <Check className='mx-auto mb-4 h-12 w-12 text-green-500' />
                <p className='text-gray-600 dark:text-gray-400'>
                    No violations found!
                </p>
            </div>
        ) : (
            violations.map((violation, index) => (
                <div
                    key={index}
                    className='rounded-lg border border-red-200 p-4 dark:border-red-800'
                >
                    <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                            <div className='mb-2 flex items-center'>
                                <AlertTriangle className='mr-2 h-4 w-4 text-red-500' />
                                <span className='font-medium text-red-800 dark:text-red-200'>
                                    {violation.severity.toUpperCase()} -{' '}
                                    {violation.type}
                                </span>
                            </div>
                            <p className='mb-2 text-gray-700 dark:text-gray-300'>
                                {violation.message}
                            </p>
                            {violation.resolution && (
                                <p className='text-sm text-gray-600 dark:text-gray-400'>
                                    <strong>Resolution:</strong>{' '}
                                    {violation.resolution}
                                </p>
                            )}
                        </div>
                        {onReplaceImage && (
                            <button
                                onClick={() =>
                                    onReplaceImage(violation.imageId)
                                }
                                className='ml-4 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700'
                            >
                                Replace Image
                            </button>
                        )}
                    </div>
                </div>
            ))
        )}
    </div>
);

const WarningsTab: React.FC<any> = ({ warnings }) => (
    <div className='space-y-4'>
        {warnings.length === 0 ? (
            <div className='py-8 text-center'>
                <Check className='mx-auto mb-4 h-12 w-12 text-green-500' />
                <p className='text-gray-600 dark:text-gray-400'>No warnings!</p>
            </div>
        ) : (
            warnings.map((warning, index) => (
                <div
                    key={index}
                    className='rounded-lg border border-yellow-200 p-4 dark:border-yellow-800'
                >
                    <div className='flex items-start'>
                        <Info className='mr-2 mt-0.5 h-4 w-4 text-yellow-500' />
                        <div className='flex-1'>
                            <p className='mb-1 text-gray-700 dark:text-gray-300'>
                                {warning.message}
                            </p>
                            {warning.suggestion && (
                                <p className='text-sm text-gray-600 dark:text-gray-400'>
                                    <strong>Suggestion:</strong>{' '}
                                    {warning.suggestion}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ))
        )}
    </div>
);

export default ComplianceDashboard;
