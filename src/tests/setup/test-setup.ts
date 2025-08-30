/**
 * Test Setup and Configuration
 *
 * This file contains global test setup, mocks, and utilities
 * that are used across all test files.
 */

import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    root: Element | null = null;
    rootMargin: string = '0px';
    thresholds: ReadonlyArray<number> = [0];

    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }
} as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
    value: jest.fn(),
    writable: true,
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
    value: jest.fn(() => 'mocked-url'),
    writable: true,
});

Object.defineProperty(URL, 'revokeObjectURL', {
    value: jest.fn(),
    writable: true,
});

// Mock File and FileReader
global.File = class MockFile {
    constructor(
        public parts: (string | Blob | ArrayBuffer | ArrayBufferView)[],
        public name: string,
        public options: FilePropertyBag = {}
    ) {
        this.size = parts.reduce((acc, part) => {
            if (typeof part === 'string') return acc + part.length;
            if (part instanceof ArrayBuffer) return acc + part.byteLength;
            return acc + (part as Blob).size || 0;
        }, 0);
        this.type = options.type || '';
        this.lastModified = options.lastModified || Date.now();
    }

    size: number;
    type: string;
    lastModified: number;

    slice() {
        return new MockFile([], this.name);
    }

    stream() {
        return new ReadableStream();
    }

    text() {
        return Promise.resolve(this.parts.join(''));
    }

    arrayBuffer() {
        return Promise.resolve(new ArrayBuffer(0));
    }
} as unknown as typeof File;

global.FileReader = class MockFileReader {
    result: string | ArrayBuffer | null = null;
    error: DOMException | null = null;
    readyState: 0 | 1 | 2 = 0;

    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null =
        null;
    onerror:
        | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
        | null = null;
    onprogress:
        | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
        | null = null;
    onabort:
        | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
        | null = null;
    onloadend:
        | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
        | null = null;
    onloadstart:
        | ((this: FileReader, ev: ProgressEvent<FileReader>) => void)
        | null = null;

    readAsDataURL() {
        setTimeout(() => {
            this.result = 'data:image/jpeg;base64,mock-base64-data';
            this.readyState = 2;
            if (this.onload) {
                this.onload({} as ProgressEvent<FileReader>);
            }
        }, 0);
    }

    readAsText() {
        setTimeout(() => {
            this.result = 'mock file content';
            this.readyState = 2;
            if (this.onload) {
                this.onload({} as ProgressEvent<FileReader>);
            }
        }, 0);
    }

    readAsArrayBuffer() {
        setTimeout(() => {
            this.result = new ArrayBuffer(0);
            this.readyState = 2;
            if (this.onload) {
                this.onload({} as ProgressEvent<FileReader>);
            }
        }, 0);
    }

    readAsBinaryString() {
        setTimeout(() => {
            this.result = 'mock binary string';
            this.readyState = 2;
            if (this.onload) {
                this.onload({} as ProgressEvent<FileReader>);
            }
        }, 0);
    }

    abort() {}

    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
        return true;
    }

    // FileReader constants
    static readonly EMPTY = 0;
    static readonly LOADING = 1;
    static readonly DONE = 2;

    readonly EMPTY = 0;
    readonly LOADING = 1;
    readonly DONE = 2;
} as unknown as typeof FileReader;

// Mock Blob
global.Blob = class MockBlob {
    constructor(
        public parts: (string | Blob | ArrayBuffer | ArrayBufferView)[] = [],
        public options: BlobPropertyBag = {}
    ) {
        this.size = parts.reduce((acc, part) => {
            if (typeof part === 'string') return acc + part.length;
            if (part instanceof ArrayBuffer) return acc + part.byteLength;
            return acc + (part as Blob).size || 0;
        }, 0);
        this.type = options.type || '';
    }

    size: number;
    type: string;

    slice() {
        return new MockBlob();
    }

    stream() {
        return new ReadableStream();
    }

    text() {
        return Promise.resolve(this.parts.join(''));
    }

    arrayBuffer() {
        return Promise.resolve(new ArrayBuffer(0));
    }
} as unknown as typeof Blob;

// Mock crypto for ID generation
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () =>
            'mock-uuid-' + Math.random().toString(36).substr(2, 9),
        getRandomValues: <T extends ArrayBufferView | null>(arr: T): T => {
            if (arr) {
                const uint8Array = new Uint8Array(
                    arr.buffer,
                    arr.byteOffset,
                    arr.byteLength
                );
                for (let i = 0; i < uint8Array.length; i++) {
                    uint8Array[i] = Math.floor(Math.random() * 256);
                }
            }
            return arr;
        },
    },
});

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: jest.fn().mockResolvedValue(undefined),
        readText: jest.fn().mockResolvedValue(''),
    },
    writable: true,
    configurable: true,
});

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
    value: {
        getCurrentPosition: jest.fn().mockImplementation((success) => {
            success({
                coords: {
                    latitude: 40.7128,
                    longitude: -74.006,
                    accuracy: 100,
                    altitude: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null,
                },
                timestamp: Date.now(),
            });
        }),
        watchPosition: jest.fn(),
        clearWatch: jest.fn(),
    },
    writable: true,
});

// Mock performance API
Object.defineProperty(global, 'performance', {
    value: {
        now: jest.fn(() => Date.now()),
        mark: jest.fn(),
        measure: jest.fn(),
        getEntriesByName: jest.fn(() => []),
        getEntriesByType: jest.fn(() => []),
    },
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn((cb) => setTimeout(cb, 0));
global.cancelIdleCallback = jest.fn();

// Mock HTMLCanvasElement
global.HTMLCanvasElement = class MockCanvas {
    width: number = 0;
    height: number = 0;

    getContext = jest.fn(() => ({
        drawImage: jest.fn(),
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    }));

    toBlob = jest.fn((callback, type = 'image/png') => {
        const blob = new Blob(['compressed'], { type });
        setTimeout(() => callback(blob), 0);
    });

    toDataURL = jest.fn((type = 'image/png') => {
        if (type === 'image/webp') {
            return 'data:image/webp;base64,mock-webp-data';
        }
        return 'data:image/png;base64,mock-png-data';
    });
} as unknown as typeof HTMLCanvasElement;

// Mock document.createElement for canvas
const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName: string) => {
    if (tagName === 'canvas') {
        return new global.HTMLCanvasElement();
    }
    return originalCreateElement.call(document, tagName);
});

// Mock Image constructor
global.Image = class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src: string = '';
    width: number = 800;
    height: number = 600;

    constructor() {
        setTimeout(() => {
            if (this.onload) {
                this.onload();
            }
        }, 0);
    }
} as unknown as typeof Image;

// Suppress console warnings in tests unless explicitly needed
const originalConsoleWarn = console.warn;
const originalConsoleError = console.debug;

beforeEach(() => {
    console.warn = jest.fn();
    console.debug = jest.fn();

    // Ensure clean timer state
    jest.clearAllTimers();

    // Use real timers by default, but only if fake timers are currently active
    if (jest.isMockFunction(setTimeout)) {
        jest.useRealTimers();
    }
});

afterEach(() => {
    console.warn = originalConsoleWarn;
    console.debug = originalConsoleError;
});

// Global test utilities
export const createMockFile = (
    name: string = 'test.jpg',
    size: number = 1024,
    type: string = 'image/jpeg'
): File => {
    const content = 'x'.repeat(size);
    return new File([content], name, { type });
};

export const createMockImage = (
    id: string = 'test-img',
    url: string = 'https://example.com/test.jpg'
) => ({
    id,
    url,
    cdnUrl: url,
    name: 'test.jpg',
    size: 1024,
    mimeType: 'image/jpeg',
    order: 0,
});

export const createMockEventData = (overrides = {}) => ({
    eventName: 'Test Event',
    eventDescription:
        'This is a test event description that meets the minimum length requirement',
    eventCategory: 'Conference',
    locationType: 'in-person' as const,
    locationDetails: {
        venueName: 'Test Venue',
        address: '123 Test St, Test City, TC 12345',
    },
    dateRange: {
        startDate: '2024-12-20',
        endDate: '2024-12-21',
    },
    timeRange: {
        startTime: '09:00',
        endTime: '17:00',
    },
    timezone: 'America/New_York',
    images: [createMockImage()],
    organizerName: 'Test Organizer',
    ...overrides,
});

export const createMockTicket = (overrides = {}) => ({
    id: 'test-ticket-' + Math.random().toString(36).substr(2, 9),
    type: 'free' as const,
    name: 'Test Ticket',
    quantity: 100,
    purchaseLimit: 2,
    ...overrides,
});

// Custom matchers for better test assertions
expect.extend({
    toBeValidEventData(received) {
        const requiredFields = [
            'eventName',
            'eventDescription',
            'eventCategory',
            'locationType',
        ];

        const missingFields = requiredFields.filter(
            (field) => !received[field]
        );

        if (missingFields.length > 0) {
            return {
                message: () =>
                    `Expected event data to be valid, but missing fields: ${missingFields.join(', ')}`,
                pass: false,
            };
        }

        return {
            message: () => 'Expected event data to be invalid',
            pass: true,
        };
    },

    toBeValidTicket(received) {
        const requiredFields = ['name', 'quantity', 'purchaseLimit'];
        const missingFields = requiredFields.filter(
            (field) => !received[field]
        );

        if (missingFields.length > 0) {
            return {
                message: () =>
                    `Expected ticket to be valid, but missing fields: ${missingFields.join(', ')}`,
                pass: false,
            };
        }

        if (
            received.type === 'paid' &&
            (!received.price || received.price <= 0)
        ) {
            return {
                message: () => 'Expected paid ticket to have a valid price',
                pass: false,
            };
        }

        return {
            message: () => 'Expected ticket to be invalid',
            pass: true,
        };
    },
});

// Note: Jest matcher types are extended via expect.extend() above
// TypeScript will infer the types automatically

// Mock environment variables for tests
process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY = 'test-uploadcare-key';
process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.test.com';

// Setup fake timers for tests that need them
export const setupFakeTimers = () => {
    jest.useFakeTimers();
    return () => jest.useRealTimers();
};

// Helper for async testing
export const waitForNextTick = () =>
    new Promise((resolve) => setTimeout(resolve, 0));

// Helper for testing error boundaries
export const throwError = (message: string = 'Test error') => {
    throw new Error(message);
};

// Mock data generators
export const generateMockEvents = (count: number = 5) => {
    return Array.from({ length: count }, (_, i) =>
        createMockEventData({
            eventName: `Test Event ${i + 1}`,
            id: `event-${i + 1}`,
        })
    );
};

export const generateMockTickets = (count: number = 3) => {
    return Array.from({ length: count }, (_, i) =>
        createMockTicket({
            name: `Ticket ${i + 1}`,
            type: i % 2 === 0 ? 'free' : 'paid',
            price: i % 2 === 0 ? undefined : (i + 1) * 25,
        })
    );
};

// Test data cleanup
afterEach(() => {
    // Clear localStorage after each test
    localStorage.clear();

    // Clear sessionStorage after each test
    sessionStorage.clear();

    // Reset any global mocks
    jest.clearAllMocks();

    // Clean up any pending timers
    jest.clearAllTimers();

    // Ensure real timers are restored
    if (jest.isMockFunction(setTimeout)) {
        jest.useRealTimers();
    }
});

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
    console.debug('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Test setup configuration object
const testSetup = {};

export default testSetup;
