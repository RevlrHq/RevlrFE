import { LicenseInfo, MediaItem } from '@/types/media-search';
import { EventImage, EventCreationData } from '@/types/event-creation';

export interface LicenseValidationResult {
    isValid: boolean;
    commercialUseAllowed: boolean;
    attributionRequired: boolean;
    restrictions: string[];
    errors: string[];
    warnings: string[];
}

export interface ComplianceCheckResult {
    isCompliant: boolean;
    violations: ComplianceViolation[];
    warnings: ComplianceWarning[];
    recommendations: string[];
}

export interface ComplianceViolation {
    type: 'license' | 'attribution' | 'usage' | 'restriction';
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    imageId: string;
    providerId: string;
    resolution?: string;
}

export interface ComplianceWarning {
    type: 'attribution' | 'license' | 'usage';
    message: string;
    imageId: string;
    providerId: string;
    suggestion?: string;
}

export interface LicenseChangeImpact {
    affectedImages: EventImage[];
    newViolations: ComplianceViolation[];
    resolvedViolations: string[];
    actionRequired: boolean;
    recommendations: string[];
}

export class LicenseValidator {
    /**
     * Validate a license for commercial use compliance
     */
    static validateLicense(license: LicenseInfo): LicenseValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const restrictions: string[] = [];

        // Check commercial use permission
        if (!license.commercialUse) {
            errors.push('License does not permit commercial use');
        }

        // Provider-specific validation
        switch (license.type) {
            case 'unsplash':
                this.validateUnsplashLicense(license, restrictions, warnings);
                break;
            case 'pexels':
                this.validatePexelsLicense(license, restrictions, warnings);
                break;
            case 'pixabay':
                this.validatePixabayLicense(license, restrictions, warnings);
                break;
            case 'cc0':
                this.validateCC0License(license, restrictions, warnings);
                break;
            default:
                warnings.push(`Unknown license type: ${license.type}`);
        }

        // Add custom restrictions from license
        if (license.restrictions) {
            restrictions.push(...license.restrictions);
        }

        return {
            isValid: errors.length === 0,
            commercialUseAllowed: license.commercialUse,
            attributionRequired: license.attribution.required,
            restrictions,
            errors,
            warnings,
        };
    }

    /**
     * Validate Unsplash license compliance
     */
    private static validateUnsplashLicense(
        license: LicenseInfo,
        restrictions: string[],
        warnings: string[]
    ): void {
        restrictions.push('Cannot be used to create a competing image service');
        restrictions.push('Cannot be sold as a standalone product');
        restrictions.push(
            'Cannot be used for wallpaper or print-on-demand services'
        );

        if (license.attribution.required) {
            warnings.push(
                'Attribution is strongly recommended for Unsplash images'
            );
        }
    }

    /**
     * Validate Pexels license compliance
     */
    private static validatePexelsLicense(
        license: LicenseInfo,
        restrictions: string[],
        warnings: string[]
    ): void {
        restrictions.push('Cannot be used for pornographic or illegal content');
        restrictions.push('Cannot be sold as a standalone product');
        restrictions.push(
            'Cannot be used to create competing stock photo services'
        );

        warnings.push(
            'Attribution is appreciated but not required for Pexels images'
        );
    }

    /**
     * Validate Pixabay license compliance
     */
    private static validatePixabayLicense(
        license: LicenseInfo,
        restrictions: string[],
        warnings: string[]
    ): void {
        restrictions.push('Cannot be used for pornographic or illegal content');
        restrictions.push('Cannot be redistributed as a standalone product');
        restrictions.push('Cannot be used to create competing stock services');

        warnings.push(
            'Attribution is appreciated but not required for Pixabay images'
        );
    }

    /**
     * Validate CC0 license compliance
     */
    private static validateCC0License(
        license: LicenseInfo,
        restrictions: string[],
        warnings: string[]
    ): void {
        // CC0 has no restrictions
        warnings.push(
            'CC0 license allows unlimited use with no attribution required'
        );
    }

    /**
     * Check compliance for multiple images in an event
     */
    static checkEventCompliance(
        images: EventImage[],
        eventData: EventCreationData
    ): ComplianceCheckResult {
        const violations: ComplianceViolation[] = [];
        const warnings: ComplianceWarning[] = [];
        const recommendations: string[] = [];

        const externalImages = images.filter(
            (img) => img.source === 'external'
        );

        for (const image of externalImages) {
            if (!image.license) {
                violations.push({
                    type: 'license',
                    severity: 'critical',
                    message: 'Missing license information',
                    imageId: image.id,
                    providerId: image.providerId || 'unknown',
                    resolution: 'Add license information or remove image',
                });
                continue;
            }

            // Validate license
            const licenseValidation = this.validateLicense(image.license);

            if (!licenseValidation.isValid) {
                licenseValidation.errors.forEach((error) => {
                    violations.push({
                        type: 'license',
                        severity: 'critical',
                        message: error,
                        imageId: image.id,
                        providerId: image.providerId || 'unknown',
                        resolution:
                            'Replace with compliant image or obtain proper license',
                    });
                });
            }

            // Check attribution compliance
            if (image.attribution?.required) {
                const hasAttribution = this.checkAttributionInEventData(
                    image,
                    eventData
                );
                if (!hasAttribution) {
                    violations.push({
                        type: 'attribution',
                        severity: 'high',
                        message:
                            'Required attribution missing from event description',
                        imageId: image.id,
                        providerId: image.providerId || 'unknown',
                        resolution: 'Add attribution to event description',
                    });
                }
            }

            // Add warnings for license restrictions
            licenseValidation.warnings.forEach((warning) => {
                warnings.push({
                    type: 'license',
                    message: warning,
                    imageId: image.id,
                    providerId: image.providerId || 'unknown',
                    suggestion: 'Review license terms and ensure compliance',
                });
            });
        }

        // Generate recommendations
        if (violations.length > 0) {
            recommendations.push(
                'Review and resolve all license violations before publishing'
            );
        }

        if (warnings.length > 0) {
            recommendations.push(
                'Consider addressing license warnings for better compliance'
            );
        }

        const attributionViolations = violations.filter(
            (v) => v.type === 'attribution'
        );
        if (attributionViolations.length > 0) {
            recommendations.push(
                'Use automatic attribution insertion to ensure compliance'
            );
        }

        return {
            isCompliant: violations.length === 0,
            violations,
            warnings,
            recommendations,
        };
    }

    /**
     * Check if attribution is present in event data
     */
    private static checkAttributionInEventData(
        image: EventImage,
        eventData: EventCreationData
    ): boolean {
        if (!image.attribution?.required || !image.photographer) {
            return true;
        }

        const photographerName = image.photographer.name.toLowerCase();
        const providerName = this.getProviderName(
            image.providerId || ''
        ).toLowerCase();
        const description = eventData.eventDescription?.toLowerCase() || '';

        return (
            description.includes(photographerName) &&
            description.includes(providerName)
        );
    }

    /**
     * Assess impact of license changes on existing images
     */
    static assessLicenseChangeImpact(
        affectedImages: EventImage[],
        oldLicense: LicenseInfo,
        newLicense: LicenseInfo
    ): LicenseChangeImpact {
        const newViolations: ComplianceViolation[] = [];
        const resolvedViolations: string[] = [];
        const recommendations: string[] = [];

        // Validate new license
        const newValidation = this.validateLicense(newLicense);
        const oldValidation = this.validateLicense(oldLicense);

        // Check if commercial use status changed
        if (oldLicense.commercialUse && !newLicense.commercialUse) {
            affectedImages.forEach((image) => {
                newViolations.push({
                    type: 'license',
                    severity: 'critical',
                    message: 'License no longer allows commercial use',
                    imageId: image.id,
                    providerId: image.providerId || 'unknown',
                    resolution: 'Replace image or obtain commercial license',
                });
            });
            recommendations.push(
                'Replace all affected images with commercially licensed alternatives'
            );
        }

        // Check if attribution requirements changed
        if (
            !oldLicense.attribution.required &&
            newLicense.attribution.required
        ) {
            affectedImages.forEach((image) => {
                newViolations.push({
                    type: 'attribution',
                    severity: 'high',
                    message: 'License now requires attribution',
                    imageId: image.id,
                    providerId: image.providerId || 'unknown',
                    resolution: 'Add attribution to event descriptions',
                });
            });
            recommendations.push('Add attribution for all affected images');
        } else if (
            oldLicense.attribution.required &&
            !newLicense.attribution.required
        ) {
            resolvedViolations.push('Attribution no longer required');
        }

        // Check for new restrictions
        const newRestrictions = newValidation.restrictions.filter(
            (r) => !oldValidation.restrictions.includes(r)
        );

        if (newRestrictions.length > 0) {
            recommendations.push(
                `Review new restrictions: ${newRestrictions.join(', ')}`
            );
        }

        return {
            affectedImages,
            newViolations,
            resolvedViolations,
            actionRequired: newViolations.length > 0,
            recommendations,
        };
    }

    /**
     * Generate compliance report for an event
     */
    static generateComplianceReport(
        images: EventImage[],
        eventData: EventCreationData
    ): {
        summary: {
            totalImages: number;
            externalImages: number;
            compliantImages: number;
            violationCount: number;
            warningCount: number;
        };
        details: ComplianceCheckResult;
        actionItems: string[];
    } {
        const externalImages = images.filter(
            (img) => img.source === 'external'
        );
        const compliance = this.checkEventCompliance(images, eventData);

        const compliantImages =
            externalImages.length -
            new Set(compliance.violations.map((v) => v.imageId)).size;

        const actionItems: string[] = [];

        // Critical violations
        const criticalViolations = compliance.violations.filter(
            (v) => v.severity === 'critical'
        );
        if (criticalViolations.length > 0) {
            actionItems.push(
                `Resolve ${criticalViolations.length} critical license violations`
            );
        }

        // Attribution violations
        const attributionViolations = compliance.violations.filter(
            (v) => v.type === 'attribution'
        );
        if (attributionViolations.length > 0) {
            actionItems.push(
                `Add attribution for ${attributionViolations.length} images`
            );
        }

        // Recommendations
        actionItems.push(...compliance.recommendations);

        return {
            summary: {
                totalImages: images.length,
                externalImages: externalImages.length,
                compliantImages,
                violationCount: compliance.violations.length,
                warningCount: compliance.warnings.length,
            },
            details: compliance,
            actionItems,
        };
    }

    /**
     * Validate image usage context
     */
    static validateUsageContext(
        image: EventImage,
        eventData: EventCreationData,
        usageContext: {
            isCommercial: boolean;
            isPublic: boolean;
            isPaid: boolean;
            audience: 'internal' | 'public' | 'commercial';
        }
    ): LicenseValidationResult {
        if (!image.license) {
            return {
                isValid: false,
                commercialUseAllowed: false,
                attributionRequired: false,
                restrictions: [],
                errors: ['Missing license information'],
                warnings: [],
            };
        }

        const baseValidation = this.validateLicense(image.license);
        const contextErrors: string[] = [...baseValidation.errors];
        const contextWarnings: string[] = [...baseValidation.warnings];

        // Check commercial use context
        if (usageContext.isCommercial && !image.license.commercialUse) {
            contextErrors.push(
                'License does not allow commercial use in this context'
            );
        }

        // Check paid event context
        if (usageContext.isPaid && image.providerId === 'unsplash') {
            contextWarnings.push(
                'Unsplash images in paid events should include attribution'
            );
        }

        // Check audience context
        if (
            usageContext.audience === 'commercial' &&
            !image.license.commercialUse
        ) {
            contextErrors.push('License does not allow commercial audience');
        }

        return {
            ...baseValidation,
            isValid: contextErrors.length === 0,
            errors: contextErrors,
            warnings: contextWarnings,
        };
    }

    /**
     * Get provider display name
     */
    private static getProviderName(providerId: string): string {
        switch (providerId) {
            case 'unsplash':
                return 'Unsplash';
            case 'pexels':
                return 'Pexels';
            case 'pixabay':
                return 'Pixabay';
            default:
                return providerId.charAt(0).toUpperCase() + providerId.slice(1);
        }
    }
}
