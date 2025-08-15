import { MediaItem, AttributionInfo, LicenseInfo } from '@/types/media-search';
import { EventImage, EventCreationData } from '@/types/event-creation';

export interface AttributionRequirement {
    required: boolean;
    text: string;
    linkUrl?: string;
    placement: 'event-description' | 'image-caption' | 'footer' | 'none';
    format: 'text' | 'html' | 'markdown';
}

export interface AttributionValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface LicenseValidationResult {
    isValid: boolean;
    commercialUseAllowed: boolean;
    attributionRequired: boolean;
    restrictions: string[];
    errors: string[];
}

export class AttributionService {
    /**
     * Generate proper attribution text for a media item
     */
    static generateAttributionText(
        item: MediaItem,
        format: 'text' | 'html' | 'markdown' = 'text'
    ): string {
        if (!item.attribution.required) {
            return '';
        }

        const photographer = item.photographer?.name || 'Unknown';
        const providerName = this.getProviderDisplayName(item.providerId);
        const photoUrl = item.photographer?.profileUrl;

        switch (format) {
            case 'html':
                return this.generateHtmlAttribution(
                    item,
                    photographer,
                    providerName,
                    photoUrl
                );
            case 'markdown':
                return this.generateMarkdownAttribution(
                    item,
                    photographer,
                    providerName,
                    photoUrl
                );
            default:
                return this.generateTextAttribution(
                    item,
                    photographer,
                    providerName
                );
        }
    }

    /**
     * Generate HTML attribution
     */
    private static generateHtmlAttribution(
        item: MediaItem,
        photographer: string,
        providerName: string,
        photoUrl?: string
    ): string {
        const photographerLink = photoUrl
            ? `<a href="${photoUrl}" target="_blank" rel="noopener">${photographer}</a>`
            : photographer;

        const providerLink = `<a href="${this.getProviderUrl(item.providerId)}" target="_blank" rel="noopener">${providerName}</a>`;

        switch (item.providerId) {
            case 'unsplash':
                return `Photo by ${photographerLink} on ${providerLink}`;
            case 'pexels':
                return `Photo by ${photographerLink} from ${providerLink}`;
            case 'pixabay':
                return `Image by ${photographerLink} from ${providerLink}`;
            default:
                return `Photo by ${photographerLink} on ${providerLink}`;
        }
    }

    /**
     * Generate Markdown attribution
     */
    private static generateMarkdownAttribution(
        item: MediaItem,
        photographer: string,
        providerName: string,
        photoUrl?: string
    ): string {
        const photographerLink = photoUrl
            ? `[${photographer}](${photoUrl})`
            : photographer;

        const providerLink = `[${providerName}](${this.getProviderUrl(item.providerId)})`;

        switch (item.providerId) {
            case 'unsplash':
                return `Photo by ${photographerLink} on ${providerLink}`;
            case 'pexels':
                return `Photo by ${photographerLink} from ${providerLink}`;
            case 'pixabay':
                return `Image by ${photographerLink} from ${providerLink}`;
            default:
                return `Photo by ${photographerLink} on ${providerLink}`;
        }
    }

    /**
     * Generate plain text attribution
     */
    private static generateTextAttribution(
        item: MediaItem,
        photographer: string,
        providerName: string
    ): string {
        switch (item.providerId) {
            case 'unsplash':
                return `Photo by ${photographer} on ${providerName}`;
            case 'pexels':
                return `Photo by ${photographer} from ${providerName}`;
            case 'pixabay':
                return `Image by ${photographer} from ${providerName}`;
            default:
                return `Photo by ${photographer} on ${providerName}`;
        }
    }

    /**
     * Validate license for commercial use
     */
    static validateLicenseForCommercialUse(
        license: LicenseInfo
    ): LicenseValidationResult {
        const errors: string[] = [];
        const restrictions: string[] = [];

        // Check if commercial use is allowed
        if (!license.commercialUse) {
            errors.push('License does not allow commercial use');
        }

        // Add provider-specific restrictions
        switch (license.type) {
            case 'unsplash':
                restrictions.push(
                    'Cannot be used to create a competing service'
                );
                restrictions.push('Cannot be sold as a standalone product');
                break;
            case 'pexels':
                restrictions.push(
                    'Cannot be used for pornographic or illegal content'
                );
                restrictions.push('Cannot be sold as a standalone product');
                break;
            case 'pixabay':
                restrictions.push(
                    'Cannot be used for pornographic or illegal content'
                );
                restrictions.push(
                    'Cannot be redistributed as a standalone product'
                );
                break;
            case 'cc0':
                // No restrictions for CC0
                break;
        }

        // Add any custom restrictions from the license
        if (license.restrictions) {
            restrictions.push(...license.restrictions);
        }

        return {
            isValid: errors.length === 0,
            commercialUseAllowed: license.commercialUse,
            attributionRequired: license.attribution.required,
            restrictions,
            errors,
        };
    }

    /**
     * Get attribution placement recommendation
     */
    static getAttributionPlacement(license: LicenseInfo): string {
        if (!license.attribution.required) {
            return 'none';
        }

        // Provider-specific placement preferences
        switch (license.type) {
            case 'unsplash':
                return 'image-caption'; // Unsplash prefers visible attribution
            case 'pexels':
                return 'footer'; // Pexels allows footer attribution
            case 'pixabay':
                return 'footer'; // Pixabay allows footer attribution
            case 'cc0':
                return 'none'; // CC0 doesn't require attribution
            default:
                return license.attribution.placement;
        }
    }

    /**
     * Format attribution for event description
     */
    static formatAttributionForEvent(
        item: MediaItem,
        eventData: EventCreationData,
        placement:
            | 'event-description'
            | 'image-caption'
            | 'footer' = 'event-description'
    ): string {
        if (!item.attribution.required) {
            return '';
        }

        const attribution = this.generateAttributionText(item, 'markdown');

        switch (placement) {
            case 'event-description':
                return `\n\n---\n*${attribution}*`;
            case 'image-caption':
                return attribution;
            case 'footer':
                return `\n\n*Image credits: ${attribution}*`;
            default:
                return attribution;
        }
    }

    /**
     * Validate attribution compliance for multiple images
     */
    static validateAttributionCompliance(
        images: EventImage[],
        eventData: EventCreationData
    ): AttributionValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        const externalImages = images.filter(
            (img) => img.source === 'external'
        );

        for (const image of externalImages) {
            if (!image.attribution || !image.license) {
                errors.push(
                    `Image ${image.name} is missing attribution or license information`
                );
                continue;
            }

            // Validate license for commercial use
            const licenseValidation = this.validateLicenseForCommercialUse(
                image.license
            );
            if (!licenseValidation.isValid) {
                errors.push(
                    `Image ${image.name}: ${licenseValidation.errors.join(', ')}`
                );
            }

            // Check if attribution is properly included
            if (image.attribution.required) {
                const hasAttribution = this.checkAttributionInEvent(
                    image,
                    eventData
                );
                if (!hasAttribution) {
                    warnings.push(
                        `Image ${image.name} requires attribution but none found in event description`
                    );
                }
            }

            // Check for license restrictions
            if (licenseValidation.restrictions.length > 0) {
                warnings.push(
                    `Image ${image.name} has restrictions: ${licenseValidation.restrictions.join(', ')}`
                );
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    /**
     * Check if attribution is included in event data
     */
    private static checkAttributionInEvent(
        image: EventImage,
        eventData: EventCreationData
    ): boolean {
        if (!image.attribution?.required || !image.photographer) {
            return true; // No attribution required
        }

        const photographerName = image.photographer.name;
        const providerName = this.getProviderDisplayName(
            image.providerId || ''
        );

        // Check in event description
        const description = eventData.eventDescription?.toLowerCase() || '';
        const hasPhotographerName = description.includes(
            photographerName.toLowerCase()
        );
        const hasProviderName = description.includes(
            providerName.toLowerCase()
        );

        return hasPhotographerName && hasProviderName;
    }

    /**
     * Auto-insert attribution into event description
     */
    static autoInsertAttribution(
        eventData: EventCreationData,
        images: EventImage[]
    ): EventCreationData {
        const externalImages = images.filter(
            (img) => img.source === 'external' && img.attribution?.required
        );

        if (externalImages.length === 0) {
            return eventData;
        }

        // Generate attribution text for all external images
        const attributions = externalImages
            .map((img) => {
                if (!img.photographer) return null;

                const item: MediaItem = {
                    id: img.originalId || img.id,
                    providerId: img.providerId || '',
                    title: img.name,
                    thumbnailUrl: img.url,
                    previewUrl: img.url,
                    downloadUrl: img.originalUrl || img.url,
                    width: 0,
                    height: 0,
                    mediaType: 'image',
                    attribution: img.attribution!,
                    license: img.license!,
                    tags: [],
                    photographer: img.photographer,
                };

                return this.generateAttributionText(item, 'text');
            })
            .filter(Boolean);

        if (attributions.length === 0) {
            return eventData;
        }

        // Remove existing attribution section if present
        let description = eventData.eventDescription || '';
        const attributionRegex = /\n\n---\n(?:Image credits?:.*?)(?=\n\n|$)/s;
        description = description.replace(attributionRegex, '');

        // Add attribution section to event description
        const attributionSection =
            attributions.length === 1
                ? `\n\n---\nImage credit: ${attributions[0]}`
                : `\n\n---\nImage credits:\n${attributions.map((attr) => `• ${attr}`).join('\n')}`;

        return {
            ...eventData,
            eventDescription: description + attributionSection,
        };
    }

    /**
     * Auto-insert attribution with smart placement
     */
    static autoInsertAttributionWithPlacement(
        eventData: EventCreationData,
        images: EventImage[],
        preferredPlacement: 'event-description' | 'footer' | 'auto' = 'auto'
    ): EventCreationData {
        const externalImages = images.filter(
            (img) => img.source === 'external' && img.attribution?.required
        );

        if (externalImages.length === 0) {
            return eventData;
        }

        // Group images by preferred placement
        const placementGroups = this.groupImagesByPlacement(
            externalImages,
            preferredPlacement
        );

        let updatedEventData = { ...eventData };

        // Handle event description attributions
        if (placementGroups['event-description'].length > 0) {
            updatedEventData = this.insertAttributionInDescription(
                updatedEventData,
                placementGroups['event-description']
            );
        }

        // Handle footer attributions
        if (placementGroups['footer'].length > 0) {
            updatedEventData = this.insertAttributionInFooter(
                updatedEventData,
                placementGroups['footer']
            );
        }

        return updatedEventData;
    }

    /**
     * Group images by their preferred attribution placement
     */
    private static groupImagesByPlacement(
        images: EventImage[],
        defaultPlacement: string
    ): Record<string, EventImage[]> {
        const groups: Record<string, EventImage[]> = {
            'event-description': [],
            footer: [],
            'image-caption': [],
        };

        images.forEach((image) => {
            let placement = defaultPlacement;

            if (defaultPlacement === 'auto' && image.license) {
                placement = this.getAttributionPlacement(image.license);
            }

            if (placement === 'none') {
                return; // Skip images that don't need attribution
            }

            const group = groups[placement] || groups['event-description'];
            group.push(image);
        });

        return groups;
    }

    /**
     * Insert attribution in event description
     */
    private static insertAttributionInDescription(
        eventData: EventCreationData,
        images: EventImage[]
    ): EventCreationData {
        const attributions = images
            .map((img) => this.generateAttributionForImage(img))
            .filter(Boolean);

        if (attributions.length === 0) {
            return eventData;
        }

        let description = eventData.eventDescription || '';

        // Remove existing attribution section
        const attributionRegex = /\n\n---\n(?:Image credits?:.*?)(?=\n\n|$)/s;
        description = description.replace(attributionRegex, '');

        // Add new attribution section
        const attributionSection =
            attributions.length === 1
                ? `\n\n---\nImage credit: ${attributions[0]}`
                : `\n\n---\nImage credits:\n${attributions.map((attr) => `• ${attr}`).join('\n')}`;

        return {
            ...eventData,
            eventDescription: description + attributionSection,
        };
    }

    /**
     * Insert attribution in footer (for future use)
     */
    private static insertAttributionInFooter(
        eventData: EventCreationData,
        images: EventImage[]
    ): EventCreationData {
        // This would be used if we had a footer field in the event data
        // For now, we'll add it to the description with a footer-style format
        const attributions = images
            .map((img) => this.generateAttributionForImage(img))
            .filter(Boolean);

        if (attributions.length === 0) {
            return eventData;
        }

        const footerSection = `\n\n*Image credits: ${attributions.join(', ')}*`;

        return {
            ...eventData,
            eventDescription:
                (eventData.eventDescription || '') + footerSection,
        };
    }

    /**
     * Generate attribution text for a single image
     */
    private static generateAttributionForImage(
        image: EventImage
    ): string | null {
        if (!image.photographer || !image.attribution?.required) {
            return null;
        }

        const item: MediaItem = {
            id: image.originalId || image.id,
            providerId: image.providerId || '',
            title: image.name,
            thumbnailUrl: image.url,
            previewUrl: image.url,
            downloadUrl: image.originalUrl || image.url,
            width: 0,
            height: 0,
            mediaType: 'image',
            attribution: image.attribution,
            license: image.license!,
            tags: [],
            photographer: image.photographer,
        };

        return this.generateAttributionText(item, 'text');
    }

    /**
     * Generate attribution requirements for a media item
     */
    static getAttributionRequirement(item: MediaItem): AttributionRequirement {
        if (!item.attribution.required) {
            return {
                required: false,
                text: '',
                placement: 'none',
                format: 'text',
            };
        }

        return {
            required: true,
            text: this.generateAttributionText(item, 'text'),
            linkUrl: item.photographer?.profileUrl,
            placement: this.getAttributionPlacement(item.license) as any,
            format: 'text',
        };
    }

    /**
     * Track attribution for compliance monitoring
     */
    static trackAttributionUsage(
        image: EventImage,
        eventId: string,
        attributionPlacement: string
    ): void {
        // This would typically log to an analytics service or database
        // for compliance monitoring and reporting
        console.log('Attribution tracked:', {
            imageId: image.id,
            providerId: image.providerId,
            originalId: image.originalId,
            eventId,
            attributionPlacement,
            photographer: image.photographer?.name,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Get provider display name
     */
    private static getProviderDisplayName(providerId: string): string {
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

    /**
     * Get provider URL
     */
    private static getProviderUrl(providerId: string): string {
        switch (providerId) {
            case 'unsplash':
                return 'https://unsplash.com';
            case 'pexels':
                return 'https://pexels.com';
            case 'pixabay':
                return 'https://pixabay.com';
            default:
                return '#';
        }
    }

    /**
     * Handle license change notifications
     */
    static async handleLicenseChange(
        providerId: string,
        affectedImages: EventImage[],
        newLicenseTerms: LicenseInfo
    ): Promise<void> {
        // This would typically:
        // 1. Update the license information in the database
        // 2. Notify affected event organizers
        // 3. Check if existing usage is still compliant
        // 4. Suggest actions if compliance is affected

        console.log('License change detected:', {
            providerId,
            affectedImageCount: affectedImages.length,
            newLicenseTerms,
            timestamp: new Date().toISOString(),
        });

        // Validate new license terms against existing usage
        for (const image of affectedImages) {
            const validation =
                this.validateLicenseForCommercialUse(newLicenseTerms);
            if (!validation.isValid) {
                console.warn(
                    `Image ${image.id} may no longer be compliant:`,
                    validation.errors
                );
            }
        }
    }
}
