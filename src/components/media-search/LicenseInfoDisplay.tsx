import React from 'react';
import { LicenseInfo, AttributionInfo } from '@/types/media-search';
import { LicenseValidator } from '@/lib/services/media/LicenseValidator';
import { AlertTriangle, Check, Info, ExternalLink } from 'lucide-react';

interface LicenseInfoDisplayProps {
    license: LicenseInfo;
    attribution: AttributionInfo;
    compact?: boolean;
    showValidation?: boolean;
    className?: string;
}

export const LicenseInfoDisplay: React.FC<LicenseInfoDisplayProps> = ({
    license,
    attribution,
    compact = false,
    showValidation = true,
    className = '',
}) => {
    const validation = showValidation
        ? LicenseValidator.validateLicense(license)
        : null;

    if (compact) {
        return (
            <div className={`flex items-center space-x-2 text-sm ${className}`}>
                <LicenseIcon license={license} />
                <span className='font-medium'>{license.name}</span>
                {attribution.required && (
                    <span className='text-orange-600 dark:text-orange-400'>
                        Attribution Required
                    </span>
                )}
                {validation && !validation.isValid && (
                    <AlertTriangle className='size-4 text-red-500' />
                )}
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* License Header */}
            <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                    <LicenseIcon license={license} />
                    <h3 className='font-semibold text-gray-900 dark:text-white'>
                        {license.name}
                    </h3>
                </div>
                <a
                    href={license.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
                >
                    <span>View License</span>
                    <ExternalLink className='size-3' />
                </a>
            </div>

            {/* License Details */}
            <div className='grid grid-cols-2 gap-4 text-sm'>
                <div className='space-y-2'>
                    <div className='flex items-center space-x-2'>
                        {license.commercialUse ? (
                            <Check className='size-4 text-green-500' />
                        ) : (
                            <AlertTriangle className='size-4 text-red-500' />
                        )}
                        <span>Commercial Use</span>
                    </div>

                    <div className='flex items-center space-x-2'>
                        {attribution.required ? (
                            <Info className='size-4 text-orange-500' />
                        ) : (
                            <Check className='size-4 text-green-500' />
                        )}
                        <span>
                            Attribution{' '}
                            {attribution.required ? 'Required' : 'Optional'}
                        </span>
                    </div>
                </div>

                <div className='space-y-2'>
                    <div className='text-gray-600 dark:text-gray-400'>
                        <span className='font-medium'>Type:</span>{' '}
                        {license.type.toUpperCase()}
                    </div>

                    {attribution.required && (
                        <div className='text-gray-600 dark:text-gray-400'>
                            <span className='font-medium'>Placement:</span>{' '}
                            {attribution.placement}
                        </div>
                    )}
                </div>
            </div>

            {/* Attribution Preview */}
            {attribution.required && attribution.text && (
                <div className='rounded-lg bg-gray-50 p-3 dark:bg-gray-800'>
                    <h4 className='mb-2 font-medium text-gray-900 dark:text-white'>
                        Required Attribution:
                    </h4>
                    <p className='font-mono text-sm text-gray-700 dark:text-gray-300'>
                        {attribution.text}
                    </p>
                </div>
            )}

            {/* Restrictions */}
            {license.restrictions && license.restrictions.length > 0 && (
                <div className='rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20'>
                    <h4 className='mb-2 flex items-center font-medium text-yellow-800 dark:text-yellow-200'>
                        <AlertTriangle className='mr-1 size-4' />
                        Restrictions:
                    </h4>
                    <ul className='space-y-1 text-sm text-yellow-700 dark:text-yellow-300'>
                        {license.restrictions.map((restriction, index) => (
                            <li key={index} className='flex items-start'>
                                <span className='mr-2'>•</span>
                                <span>{restriction}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Validation Results */}
            {validation && <ValidationDisplay validation={validation} />}
        </div>
    );
};

interface LicenseIconProps {
    license: LicenseInfo;
    className?: string;
}

const LicenseIcon: React.FC<LicenseIconProps> = ({
    license,
    className = 'h-5 w-5',
}) => {
    const getIconColor = () => {
        if (!license.commercialUse) return 'text-red-500';
        if (license.attribution.required) return 'text-orange-500';
        return 'text-green-500';
    };

    return (
        <div className={`${className} ${getIconColor()}`}>
            {license.type === 'cc0' ? (
                <div className='flex size-full items-center justify-center rounded bg-current text-xs font-bold text-white'>
                    CC0
                </div>
            ) : (
                <Info className='size-full' />
            )}
        </div>
    );
};

interface ValidationDisplayProps {
    validation: ReturnType<typeof LicenseValidator.validateLicense>;
}

const ValidationDisplay: React.FC<ValidationDisplayProps> = ({
    validation,
}) => {
    if (validation.isValid && validation.warnings.length === 0) {
        return (
            <div className='rounded-lg bg-green-50 p-3 dark:bg-green-900/20'>
                <div className='flex items-center text-green-800 dark:text-green-200'>
                    <Check className='mr-2 size-4' />
                    <span className='font-medium'>
                        License is valid for commercial use
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className='space-y-2'>
            {/* Errors */}
            {validation.errors.length > 0 && (
                <div className='rounded-lg bg-red-50 p-3 dark:bg-red-900/20'>
                    <h4 className='mb-2 flex items-center font-medium text-red-800 dark:text-red-200'>
                        <AlertTriangle className='mr-1 size-4' />
                        License Issues:
                    </h4>
                    <ul className='space-y-1 text-sm text-red-700 dark:text-red-300'>
                        {validation.errors.map((error, index) => (
                            <li key={index} className='flex items-start'>
                                <span className='mr-2'>•</span>
                                <span>{error}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && (
                <div className='rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20'>
                    <h4 className='mb-2 flex items-center font-medium text-yellow-800 dark:text-yellow-200'>
                        <Info className='mr-1 size-4' />
                        Important Notes:
                    </h4>
                    <ul className='space-y-1 text-sm text-yellow-700 dark:text-yellow-300'>
                        {validation.warnings.map((warning, index) => (
                            <li key={index} className='flex items-start'>
                                <span className='mr-2'>•</span>
                                <span>{warning}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default LicenseInfoDisplay;
