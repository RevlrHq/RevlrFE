import type {
    DraftBackup,
    EventCreationData,
    EventTicket,
} from '../../types/event-creation';

const DRAFT_STORAGE_KEY = 'event_creation_draft';
const BACKUP_EXPIRY_HOURS = 24;

export class DraftBackupService {
    /**
     * Save draft to local storage
     */
    static saveDraft(
        eventData: EventCreationData,
        tickets: EventTicket[],
        step: number = 1
    ): void {
        try {
            const backup: DraftBackup = {
                eventData,
                tickets,
                timestamp: Date.now(),
                step,
            };

            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(backup));
        } catch (error) {
            console.warn('Failed to save draft to local storage:', error);
        }
    }

    /**
     * Load draft from local storage
     */
    static loadDraft(): DraftBackup | null {
        try {
            const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (!stored) return null;

            const backup: DraftBackup = JSON.parse(stored);

            // Check if backup has expired
            if (this.isExpired(backup.timestamp)) {
                this.clearDraft();
                return null;
            }

            return backup;
        } catch (error) {
            console.warn('Failed to load draft from local storage:', error);
            this.clearDraft();
            return null;
        }
    }

    /**
     * Clear draft from local storage
     */
    static clearDraft(): void {
        try {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (error) {
            console.warn('Failed to clear draft from local storage:', error);
        }
    }

    /**
     * Check if there's a draft available
     */
    static hasDraft(): boolean {
        try {
            const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (!stored) return false;

            const backup: DraftBackup = JSON.parse(stored);
            return !this.isExpired(backup.timestamp);
        } catch (error) {
            return false;
        }
    }

    /**
     * Get draft age in minutes
     */
    static getDraftAge(): number | null {
        try {
            const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (!stored) return null;

            const backup: DraftBackup = JSON.parse(stored);
            return Math.floor((Date.now() - backup.timestamp) / (1000 * 60));
        } catch (error) {
            return null;
        }
    }

    /**
     * Check if backup has expired
     */
    private static isExpired(timestamp: number): boolean {
        const expiryTime = BACKUP_EXPIRY_HOURS * 60 * 60 * 1000; // Convert to milliseconds
        return Date.now() - timestamp > expiryTime;
    }

    /**
     * Save auto-backup with throttling
     */
    static autoSave(
        eventData: EventCreationData,
        tickets: EventTicket[],
        step: number = 1
    ): void {
        // Throttle auto-saves to prevent excessive localStorage writes
        if (this.shouldAutoSave()) {
            this.saveDraft(eventData, tickets, step);
            this.setLastAutoSave();
        }
    }

    /**
     * Check if enough time has passed since last auto-save
     */
    private static shouldAutoSave(): boolean {
        const lastAutoSave = localStorage.getItem('last_auto_save');
        if (!lastAutoSave) return true;

        const timeSinceLastSave = Date.now() - parseInt(lastAutoSave);
        const minInterval = 30 * 1000; // 30 seconds minimum between auto-saves

        return timeSinceLastSave > minInterval;
    }

    /**
     * Record timestamp of last auto-save
     */
    private static setLastAutoSave(): void {
        try {
            localStorage.setItem('last_auto_save', Date.now().toString());
        } catch (error) {
            console.warn('Failed to set last auto-save timestamp:', error);
        }
    }

    /**
     * Create a backup with metadata
     */
    static createBackupWithMetadata(
        eventData: EventCreationData,
        tickets: EventTicket[],
        step: number,
        metadata?: { reason?: string; userAction?: string }
    ): void {
        try {
            const backup: DraftBackup & { metadata?: any } = {
                eventData,
                tickets,
                timestamp: Date.now(),
                step,
                metadata,
            };

            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(backup));
        } catch (error) {
            console.warn('Failed to create backup with metadata:', error);
        }
    }

    /**
     * Restore from backup with validation
     */
    static restoreFromBackup(): { data: DraftBackup; isValid: boolean } | null {
        const backup = this.loadDraft();
        if (!backup) return null;

        const isValid = this.validateBackup(backup);
        return { data: backup, isValid };
    }

    /**
     * Validate backup data integrity
     */
    private static validateBackup(backup: DraftBackup): boolean {
        try {
            // Check required fields
            if (
                !backup.eventData ||
                !backup.tickets ||
                typeof backup.step !== 'number'
            ) {
                return false;
            }

            // Validate event data structure
            if (typeof backup.eventData.eventName !== 'string') {
                return false;
            }

            // Validate tickets array
            if (!Array.isArray(backup.tickets)) {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get storage usage information
     */
    static getStorageInfo(): {
        used: number;
        available: number;
        percentage: number;
    } {
        try {
            let used = 0;

            // Calculate used storage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    const value = localStorage.getItem(key);
                    if (value) {
                        used += key.length + value.length;
                    }
                }
            }

            // Estimate available storage (most browsers have ~5-10MB limit)
            const estimatedLimit = 5 * 1024 * 1024; // 5MB
            const available = Math.max(0, estimatedLimit - used);

            return {
                used,
                available,
                percentage: (used / estimatedLimit) * 100,
            };
        } catch (error) {
            return { used: 0, available: 0, percentage: 0 };
        }
    }

    /**
     * Clean up old or corrupted backups
     */
    static cleanup(): void {
        try {
            const backup = this.loadDraft();
            if (backup && this.isExpired(backup.timestamp)) {
                this.clearDraft();
            }
        } catch (error) {
            // If there's any error loading, clear the corrupted data
            this.clearDraft();
        }
    }

    /**
     * Save draft when authentication expires
     * This method attempts to preserve any form data when user session expires
     */
    static saveDraftOnAuthExpiration(): void {
        try {
            // Try to get current form data from DOM or global state
            // This is a fallback mechanism when auth expires unexpectedly
            const formElements = document.querySelectorAll(
                'input, textarea, select'
            );
            const formData: Record<string, any> = {};

            formElements.forEach((element) => {
                const input = element as
                    | HTMLInputElement
                    | HTMLTextAreaElement
                    | HTMLSelectElement;
                if (input.name && input.value) {
                    formData[input.name] = input.value;
                }
            });

            // Only save if we have meaningful form data
            if (Object.keys(formData).length > 0) {
                const emergencyBackup = {
                    eventData: {
                        eventName: formData.eventName || '',
                        description: formData.description || '',
                        category: formData.category || '',
                        startDate: formData.startDate || '',
                        endDate: formData.endDate || '',
                        startTime: formData.startTime || '',
                        endTime: formData.endTime || '',
                        timezone: formData.timezone || '',
                        locationType: formData.locationType || 'in-person',
                        venue: formData.venue || '',
                        address: formData.address || '',
                        virtualLink: formData.virtualLink || '',
                        organizerName: formData.organizerName || '',
                        organizerWebsite: formData.organizerWebsite || '',
                        facebook: formData.facebook || '',
                        instagram: formData.instagram || '',
                        twitter: formData.twitter || '',
                        images: [],
                        status: 'draft' as const,
                    },
                    tickets: [],
                    timestamp: Date.now(),
                    step: 1,
                    metadata: {
                        reason: 'auth_expiration',
                        userAction: 'emergency_backup',
                    },
                };

                localStorage.setItem(
                    DRAFT_STORAGE_KEY,
                    JSON.stringify(emergencyBackup)
                );
                console.log(
                    'Emergency draft backup saved due to authentication expiration'
                );
            }
        } catch (error) {
            console.warn('Failed to save emergency draft backup:', error);
        }
    }
}
