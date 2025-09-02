import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { server } from './mocks/server';

// Configure testing library
configure({
    testIdAttribute: 'data-testid',
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
};

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
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
    value: {
        permission: 'default',
        requestPermission: jest.fn().mockResolvedValue('granted'),
    },
    writable: true,
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
    value: jest.fn().mockReturnValue('blob:mock-url'),
    writable: true,
});

// Mock URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
    value: jest.fn(),
    writable: true,
});

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock console methods in tests
const originalError = console.error;
beforeAll(() => {
    console.error = (...args: any[]) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render is no longer supported')
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});

// Global test utilities
export const mockLocalStorage = () => {
    const store: Record<string, string> = {};

    return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            Object.keys(store).forEach((key) => delete store[key]);
        }),
    };
};

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage(),
    writable: true,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
    value: mockLocalStorage(),
    writable: true,
});

// Mock fetch
global.fetch = jest.fn();

// Helper to create mock file
export const createMockFile = (
    name: string = 'test.jpg',
    type: string = 'image/jpeg',
    size: number = 1024
): File => {
    const file = new File(['mock file content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
};

// Helper to wait for async operations
export const waitForAsync = () =>
    new Promise((resolve) => setTimeout(resolve, 0));

// Mock user agent for mobile testing
export const mockMobileUserAgent = () => {
    Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
    });
};

// Mock desktop user agent
export const mockDesktopUserAgent = () => {
    Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        writable: true,
    });
};

// Mock touch support
export const mockTouchSupport = (hasTouch: boolean = true) => {
    if (hasTouch) {
        Object.defineProperty(window, 'ontouchstart', {
            value: {},
            writable: true,
        });
    } else {
        delete (window as any).ontouchstart;
    }
};

// Mock high contrast preference
export const mockHighContrast = (enabled: boolean = true) => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
            matches: query === '(prefers-contrast: high)' ? enabled : false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
};

// Mock reduced motion preference
export const mockReducedMotion = (enabled: boolean = true) => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
            matches:
                query === '(prefers-reduced-motion: reduce)' ? enabled : false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
};

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: jest.fn().mockResolvedValue(undefined),
        readText: jest.fn().mockResolvedValue(''),
    },
    writable: true,
});

// Mock geolocation API
Object.defineProperty(navigator, 'geolocation', {
    value: {
        getCurrentPosition: jest.fn(),
        watchPosition: jest.fn(),
        clearWatch: jest.fn(),
    },
    writable: true,
});

// Export common test data
export const mockUserProfile = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '+1234567890',
    bio: 'Test bio',
    organization: 'Test Org',
    website: 'https://test.com',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: new Date('2023-01-01'),
    lastLoginAt: new Date('2024-01-01'),
    emailVerified: true,
};

export const mockNotificationPreferences = {
    email: {
        eventUpdates: true,
        registrationAlerts: true,
        paymentNotifications: true,
        marketingEmails: false,
        securityAlerts: true,
    },
    push: {
        enabled: true,
        eventReminders: true,
        registrationAlerts: true,
        paymentNotifications: false,
    },
    inApp: {
        enabled: true,
        eventUpdates: true,
        systemNotifications: true,
    },
    frequency: 'immediate' as const,
};

export const mockUserSessions = [
    {
        id: '1',
        deviceInfo: 'Chrome on Windows',
        location: 'New York, US',
        lastActivity: new Date('2024-01-01'),
        isCurrentSession: true,
    },
    {
        id: '2',
        deviceInfo: 'Safari on iPhone',
        location: 'Los Angeles, US',
        lastActivity: new Date('2024-01-02'),
        isCurrentSession: false,
    },
];

export const mockMediaProviders = [
    {
        id: 'unsplash',
        name: 'Unsplash',
        isConnected: true,
        connectedAt: new Date('2024-01-01'),
        permissions: ['read'],
        status: 'active' as const,
    },
    {
        id: 'pixabay',
        name: 'Pixabay',
        isConnected: false,
        permissions: [],
        status: 'inactive' as const,
    },
];

export const mockExportHistory = [
    {
        id: 'export-1',
        requestedAt: new Date('2024-01-01'),
        completedAt: new Date('2024-01-01'),
        status: 'completed' as const,
        fileSize: 1024,
        includeEvents: true,
        includeRegistrations: true,
        includeAnalytics: false,
        includeSettings: true,
        downloadUrl: 'https://example.com/export.zip',
    },
];
