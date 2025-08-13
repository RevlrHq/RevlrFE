import { DraftBackupService } from '../../lib/services/DraftBackupService';
import type {
    EventCreationData,
    EventTicket,
    DraftBackup,
} from '../../types/event-creation';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: jest.fn((index: number) => Object.keys(store)[index] || null),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock console methods to avoid noise in tests
let consoleSpy: {
    warn: jest.SpyInstance;
    log: jest.SpyInstance;
};

describe('DraftBackupService', () => {
    const mockEventData: EventCreationData = {
        eventName: 'Test Event',
        eventDescription: 'Test Description',
        eventCategory: 'Conference',
        locationType: 'in-person',
        images: [
            {
                id: 'img1',
                url: 'https://example.com/image.jpg',
                name: 'test.jpg',
                size: 1024,
                mimeType: 'image/jpeg',
                order: 0,
            },
        ],
    };

    const mockTickets: EventTicket[] = [
        {
            id: 'ticket1',
            type: 'free',
            name: 'General Admission',
            quantity: 100,
            purchaseLimit: 2,
        },
        {
            id: 'ticket2',
            type: 'paid',
            name: 'VIP Ticket',
            price: 50,
            quantity: 50,
            purchaseLimit: 1,
        },
    ];

    beforeEach(() => {
        localStorageMock.clear();
        jest.clearAllMocks();

        // Set up console spies fresh for each test
        consoleSpy = {
            warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
            log: jest.spyOn(console, 'log').mockImplementation(() => {}),
        };
    });

    afterAll(() => {
        consoleSpy.warn.mockRestore();
        consoleSpy.log.mockRestore();
    });

    describe('saveDraft', () => {
        it('should save draft to localStorage', () => {
            DraftBackupService.saveDraft(mockEventData, mockTickets, 2);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'event_creation_draft',
                expect.stringContaining('"eventName":"Test Event"')
            );

            const savedData = JSON.parse(
                localStorageMock.getItem('event_creation_draft')!
            );
            expect(savedData.eventData.eventName).toBe('Test Event');
            expect(savedData.tickets).toHaveLength(2);
            expect(savedData.step).toBe(2);
            expect(savedData.timestamp).toBeCloseTo(Date.now(), -2);
        });

        it('should handle localStorage errors gracefully', () => {
            localStorageMock.setItem.mockImplementationOnce(() => {
                throw new Error('Storage quota exceeded');
            });

            expect(() => {
                DraftBackupService.saveDraft(mockEventData, mockTickets, 1);
            }).not.toThrow();

            expect(consoleSpy.warn).toHaveBeenCalledWith(
                'Failed to save draft to local storage:',
                expect.any(Error)
            );
        });
    });

    describe('loadDraft', () => {
        it('should load draft from localStorage', () => {
            const mockBackup: DraftBackup = {
                eventData: mockEventData,
                tickets: mockTickets,
                timestamp: Date.now(),
                step: 2,
            };

            localStorageMock.setItem(
                'event_creation_draft',
                JSON.stringify(mockBackup)
            );

            const loaded = DraftBackupService.loadDraft();

            expect(loaded).not.toBeNull();
            expect(loaded!.eventData.eventName).toBe('Test Event');
            expect(loaded!.tickets).toHaveLength(2);
            expect(loaded!.step).toBe(2);
        });

        it('should return null when no draft exists', () => {
            const loaded = DraftBackupService.loadDraft();
            expect(loaded).toBeNull();
        });

        it('should return null and clear corrupted data', () => {
            localStorageMock.setItem('event_creation_draft', 'invalid json');

            const loaded = DraftBackupService.loadDraft();

            expect(loaded).toBeNull();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(
                'event_creation_draft'
            );
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                'Failed to load draft from local storage:',
                expect.any(Error)
            );
        });

        it('should return null and clear expired draft', () => {
            const expiredBackup: DraftBackup = {
                eventData: mockEventData,
                tickets: mockTickets,
                timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
                step: 1,
            };

            localStorageMock.setItem(
                'event_creation_draft',
                JSON.stringify(expiredBackup)
            );

            const loaded = DraftBackupService.loadDraft();

            expect(loaded).toBeNull();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(
                'event_creation_draft'
            );
        });
    });

    describe('clearDraft', () => {
        it('should clear draft from localStorage', () => {
            localStorageMock.setItem('event_creation_draft', 'some data');

            DraftBackupService.clearDraft();

            expect(localStorageMock.removeItem).toHaveBeenCalledWith(
                'event_creation_draft'
            );
        });

        it('should handle localStorage errors gracefully', () => {
            localStorageMock.removeItem.mockImplementationOnce(() => {
                throw new Error('Storage error');
            });

            expect(() => {
                DraftBackupService.clearDraft();
            }).not.toThrow();

            expect(consoleSpy.warn).toHaveBeenCalledWith(
                'Failed to clear draft from local storage:',
                expect.any(Error)
            );
        });
    });

    describe('hasDraft', () => {
        it('should return true when valid draft exists', () => {
            const mockBackup: DraftBackup = {
                eventData: mockEventData,
                tickets: mockTickets,
                timestamp: Date.now(),
                step: 1,
            };

            localStorageMock.setItem(
                'event_creation_draft',
                JSON.stringify(mockBackup)
            );

            expect(DraftBackupService.hasDraft()).toBe(true);
        });

        it('should return false when no draft exists', () => {
            expect(DraftBackupService.hasDraft()).toBe(false);
        });

        it('should return false when draft is expired', () => {
            const expiredBackup: DraftBackup = {
                eventData: mockEventData,
                tickets: mockTickets,
                timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
                step: 1,
            };

            localStorageMock.setItem(
                'event_creation_draft',
                JSON.stringify(expiredBackup)
            );

            expect(DraftBackupService.hasDraft()).toBe(false);
        });

        it('should return false when draft is corrupted', () => {
            localStorageMock.setItem('event_creation_draft', 'invalid json');

            expect(DraftBackupService.hasDraft()).toBe(false);
        });
    });

    describe('getDraftAge', () => {
        it('should return draft age in minutes', () => {
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            const mockBackup: DraftBackup = {
                eventData: mockEventData,
                tickets: mockTickets,
                timestamp: fiveMinutesAgo,
                step: 1,
            };

            localStorageMock.setItem(
                'event_creation_draft',
                JSON.stringify(mockBackup)
            );

            const age = DraftBackupService.getDraftAge();

            expect(age).toBeCloseTo(5, 0);
        });

        it('should return null when no draft exists', () => {
            const age = DraftBackupService.getDraftAge();
            expect(age).toBeNull();
        });

        it('should return null when draft is corrupted', () => {
            localStorageMock.setItem('event_creation_draft', 'invalid json');

            const age = DraftBackupService.getDraftAge();
            expect(age).toBeNull();
        });
    });

    describe('autoSave', () => {
        beforeEach(() => {
            // Clear any existing auto-save timestamp
            localStorageMock.removeItem('last_auto_save');
        });

        it('should auto-save when enough time has passed', () => {
            DraftBackupService.autoSave(mockEventData, mockTickets, 1);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'event_creation_draft',
                expect.stringContaining('"eventName":"Test Event"')
            );
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'last_auto_save',
                expect.any(String)
            );
        });

        it('should not auto-save when not enough time has passed', () => {
            // Set recent auto-save timestamp
            localStorageMock.setItem('last_auto_save', Date.now().toString());

            DraftBackupService.autoSave(mockEventData, mockTickets, 1);

            // Should not save draft (only the timestamp was set above)
            expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
        });

        it('should auto-save when no previous timestamp exists', () => {
            DraftBackupService.autoSave(mockEventData, mockTickets, 1);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'event_creation_draft',
                expect.any(String)
            );
        });
    });

    describe('createBackupWithMetadata', () => {
        it('should create backup with metadata', () => {
            const metadata = {
                reason: 'user_action',
                userAction: 'step_change',
            };

            DraftBackupService.createBackupWithMetadata(
                mockEventData,
                mockTickets,
                2,
                metadata
            );

            const savedData = JSON.parse(
                localStorageMock.getItem('event_creation_draft')!
            );
            expect(savedData.metadata).toEqual(metadata);
            expect(savedData.step).toBe(2);
        });
    });

    describe('restoreFromBackup', () => {
        it('should restore valid backup', () => {
            const mockBackup: DraftBackup = {
                eventData: mockEventData,
                tickets: mockTickets,
                timestamp: Date.now(),
                step: 2,
            };

            localStorageMock.setItem(
                'event_creation_draft',
                JSON.stringify(mockBackup)
            );

            const result = DraftBackupService.restoreFromBackup();

            expect(result).not.toBeNull();
            expect(result!.isValid).toBe(true);
            expect(result!.data.eventData.eventName).toBe('Test Event');
        });

        it('should return null when no backup exists', () => {
            const result = DraftBackupService.restoreFromBackup();
            expect(result).toBeNull();
        });

        it('should return invalid backup when data is corrupted', () => {
            const invalidBackup = {
                eventData: null, // Invalid
                tickets: mockTickets,
                timestamp: Date.now(),
                step: 1,
            };

            localStorageMock.setItem(
                'event_creation_draft',
                JSON.stringify(invalidBackup)
            );

            const result = DraftBackupService.restoreFromBackup();

            expect(result).not.toBeNull();
            expect(result!.isValid).toBe(false);
        });
    });

    describe('getStorageInfo', () => {
        it('should return storage information', () => {
            localStorageMock.setItem('test_key', 'test_value');

            const info = DraftBackupService.getStorageInfo();

            expect(info.used).toBeGreaterThan(0);
            expect(info.available).toBeGreaterThan(0);
            expect(info.percentage).toBeGreaterThanOrEqual(0);
            expect(info.percentage).toBeLessThanOrEqual(100);
        });

        it('should handle storage calculation errors', () => {
            // Mock localStorage.key to throw error instead of hasOwnProperty
            const originalKey = localStorage.key;
            localStorage.key = jest.fn().mockImplementation(() => {
                throw new Error('Storage error');
            });

            const info = DraftBackupService.getStorageInfo();

            expect(info.used).toBe(0);
            expect(info.available).toBe(5242880); // 5MB in bytes
            expect(info.percentage).toBe(0);

            // Restore original method
            localStorage.key = originalKey;
        });
    });

    describe('cleanup', () => {
        it('should clean up expired backups', () => {
            const expiredBackup: DraftBackup = {
                eventData: mockEventData,
                tickets: mockTickets,
                timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
                step: 1,
            };

            localStorageMock.setItem(
                'event_creation_draft',
                JSON.stringify(expiredBackup)
            );

            DraftBackupService.cleanup();

            expect(localStorageMock.removeItem).toHaveBeenCalledWith(
                'event_creation_draft'
            );
        });

        it('should not clean up valid backups', () => {
            const validBackup: DraftBackup = {
                eventData: mockEventData,
                tickets: mockTickets,
                timestamp: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
                step: 1,
            };

            localStorageMock.setItem(
                'event_creation_draft',
                JSON.stringify(validBackup)
            );

            DraftBackupService.cleanup();

            expect(localStorageMock.removeItem).not.toHaveBeenCalled();
        });

        it('should clean up corrupted backups', () => {
            localStorageMock.setItem('event_creation_draft', 'invalid json');

            DraftBackupService.cleanup();

            expect(localStorageMock.removeItem).toHaveBeenCalledWith(
                'event_creation_draft'
            );
        });
    });

    describe('saveDraftOnAuthExpiration', () => {
        beforeEach(() => {
            // Mock DOM elements
            document.body.innerHTML = `
                <form>
                    <input name="eventName" value="Emergency Event" />
                    <textarea name="description">Emergency Description</textarea>
                    <select name="category">
                        <option value="Conference" selected>Conference</option>
                    </select>
                    <input name="startDate" value="2024-12-20" />
                    <input name="endDate" value="2024-12-21" />
                    <input name="startTime" value="09:00" />
                    <input name="endTime" value="17:00" />
                    <input name="timezone" value="America/New_York" />
                    <select name="locationType">
                        <option value="in-person" selected>In Person</option>
                    </select>
                    <input name="venue" value="Emergency Venue" />
                    <input name="address" value="123 Emergency St" />
                    <input name="organizerName" value="Emergency Organizer" />
                    <input name="organizerWebsite" value="https://emergency.com" />
                </form>
            `;
        });

        afterEach(() => {
            document.body.innerHTML = '';
        });

        it('should save emergency backup from form data', () => {
            DraftBackupService.saveDraftOnAuthExpiration();

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'event_creation_draft',
                expect.stringContaining('"eventName":"Emergency Event"')
            );

            const savedData = JSON.parse(
                localStorageMock.getItem('event_creation_draft')!
            );
            expect(savedData.eventData.eventName).toBe('Emergency Event');
            expect(savedData.eventData.description).toBe(
                'Emergency Description'
            );
            expect(savedData.metadata.reason).toBe('auth_expiration');
            expect(consoleSpy.log).toHaveBeenCalledWith(
                'Emergency draft backup saved due to authentication expiration'
            );
        });

        it('should not save when no meaningful form data exists', () => {
            document.body.innerHTML = '<form></form>';

            DraftBackupService.saveDraftOnAuthExpiration();

            expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });

        it('should handle DOM errors gracefully', () => {
            // Mock querySelectorAll to throw error
            const originalQuerySelectorAll = document.querySelectorAll;
            document.querySelectorAll = jest.fn().mockImplementation(() => {
                throw new Error('DOM error');
            });

            expect(() => {
                DraftBackupService.saveDraftOnAuthExpiration();
            }).not.toThrow();

            expect(consoleSpy.warn).toHaveBeenCalledWith(
                'Failed to save emergency draft backup:',
                expect.any(Error)
            );

            // Restore original method
            document.querySelectorAll = originalQuerySelectorAll;
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle localStorage quota exceeded', () => {
            localStorageMock.setItem.mockImplementationOnce(() => {
                const error = new Error('QuotaExceededError');
                error.name = 'QuotaExceededError';
                throw error;
            });

            expect(() => {
                DraftBackupService.saveDraft(mockEventData, mockTickets, 1);
            }).not.toThrow();

            expect(consoleSpy.warn).toHaveBeenCalledWith(
                'Failed to save draft to local storage:',
                expect.any(Error)
            );
        });

        it('should handle malformed JSON in localStorage', () => {
            localStorageMock.setItem(
                'event_creation_draft',
                '{"invalid": json}'
            );

            const loaded = DraftBackupService.loadDraft();

            expect(loaded).toBeNull();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(
                'event_creation_draft'
            );
        });

        it('should handle missing required fields in backup validation', () => {
            const invalidBackup = {
                eventData: mockEventData,
                // Missing tickets array
                timestamp: Date.now(),
                step: 1,
            };

            localStorageMock.setItem(
                'event_creation_draft',
                JSON.stringify(invalidBackup)
            );

            const result = DraftBackupService.restoreFromBackup();

            expect(result).not.toBeNull();
            expect(result!.isValid).toBe(false);
        });

        it('should handle invalid step number in backup', () => {
            const invalidBackup = {
                eventData: mockEventData,
                tickets: mockTickets,
                timestamp: Date.now(),
                step: 'invalid', // Should be number
            };

            localStorageMock.setItem(
                'event_creation_draft',
                JSON.stringify(invalidBackup)
            );

            const result = DraftBackupService.restoreFromBackup();

            expect(result).not.toBeNull();
            expect(result!.isValid).toBe(false);
        });

        it('should handle localStorage being disabled', () => {
            // Mock localStorage to be null (disabled)
            Object.defineProperty(window, 'localStorage', {
                value: null,
                configurable: true,
            });

            expect(() => {
                DraftBackupService.saveDraft(mockEventData, mockTickets, 1);
            }).not.toThrow();

            // Restore localStorage
            Object.defineProperty(window, 'localStorage', {
                value: localStorageMock,
                configurable: true,
            });
        });
    });
});
