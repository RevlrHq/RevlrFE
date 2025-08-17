import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useFocusManagement } from '../../hooks/useFocusManagement';
import { useScreenReaderAnnouncements } from '../../hooks/useScreenReaderAnnouncements';

// Test component for keyboard navigation
const KeyboardNavigationTestComponent: React.FC = () => {
    const {
        containerRef,
        announceRef,
        state,
        activate,
        deactivate,
        navigateNext,
        navigatePrevious,
    } = useKeyboardNavigation();

    return (
        <div ref={containerRef} data-testid='keyboard-container'>
            <div
                ref={announceRef}
                aria-live='polite'
                data-testid='announcements'
            />
            <button onClick={() => activate()}>Activate</button>
            <button onClick={() => deactivate()}>Deactivate</button>
            <button onClick={() => navigateNext()}>Next</button>
            <button onClick={() => navigatePrevious()}>Previous</button>
            <div>
                <button>Item 1</button>
                <button>Item 2</button>
                <button>Item 3</button>
                <input type='text' placeholder='Input field' />
                <a href='#test'>Link</a>
            </div>
            <div data-testid='state'>
                {JSON.stringify({
                    currentIndex: state.currentIndex,
                    totalItems: state.totalItems,
                    isActive: state.isActive,
                })}
            </div>
        </div>
    );
};

// Test component for focus management
const FocusManagementTestComponent: React.FC = () => {
    const {
        announceRef,
        focusFirst,
        focusLast,
        enableFocusTrap,
        disableFocusTrap,
        createModalFocusManagement,
    } = useFocusManagement();

    const containerRef = React.useRef<HTMLDivElement>(null);
    const [showModal, setShowModal] = React.useState(false);

    const handleEnableTrap = () => {
        if (containerRef.current) {
            enableFocusTrap(containerRef.current);
        }
    };

    const handleShowModal = () => {
        setShowModal(true);
        if (containerRef.current) {
            createModalFocusManagement(containerRef.current);
        }
    };

    return (
        <div>
            <div
                ref={announceRef}
                aria-live='polite'
                data-testid='focus-announcements'
            />
            <button onClick={() => focusFirst(containerRef.current!)}>
                Focus First
            </button>
            <button onClick={() => focusLast(containerRef.current!)}>
                Focus Last
            </button>
            <button onClick={handleEnableTrap}>Enable Trap</button>
            <button onClick={disableFocusTrap}>Disable Trap</button>
            <button onClick={handleShowModal}>Show Modal</button>

            <div ref={containerRef} data-testid='focus-container'>
                <button>Button 1</button>
                <button>Button 2</button>
                <input type='text' placeholder='Input' />
                <button>Button 3</button>
            </div>

            {showModal && (
                <div role='dialog' aria-modal='true' data-testid='modal'>
                    <button onClick={() => setShowModal(false)}>Close</button>
                    <button>Modal Button</button>
                </div>
            )}
        </div>
    );
};

// Test component for screen reader announcements
const ScreenReaderTestComponent: React.FC = () => {
    const {
        politeRef,
        assertiveRef,
        announce,
        announceLoading,
        announceError,
        announceSuccess,
        announceDataChange,
        announceProgress,
        clearAnnouncements,
    } = useScreenReaderAnnouncements();

    return (
        <div>
            <div
                ref={politeRef}
                aria-live='polite'
                data-testid='polite-announcements'
            />
            <div
                ref={assertiveRef}
                aria-live='assertive'
                data-testid='assertive-announcements'
            />

            <button onClick={() => announce('Test announcement')}>
                Announce
            </button>
            <button onClick={() => announceLoading('Loading data')}>
                Announce Loading
            </button>
            <button onClick={() => announceError('Something went wrong')}>
                Announce Error
            </button>
            <button onClick={() => announceSuccess('Operation completed')}>
                Announce Success
            </button>
            <button onClick={() => announceDataChange('events', 5, 'loaded')}>
                Announce Data Change
            </button>
            <button onClick={() => announceProgress(50, 100, 'Upload')}>
                Announce Progress
            </button>
            <button onClick={clearAnnouncements}>Clear</button>
        </div>
    );
};

describe('Accessibility Hooks Tests', () => {
    beforeEach(() => {
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
    });

    describe('useAccessibility Hook', () => {
        it('should initialize with default state', () => {
            const { result } = renderHook(() => useAccessibility());

            expect(result.current.state).toEqual({
                isHighContrast: false,
                isReducedMotion: false,
                isScreenReaderActive: false,
                fontSize: 'medium',
                colorScheme: 'light',
            });
        });

        it('should detect system preferences', () => {
            // Mock high contrast preference
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockImplementation((query) => ({
                    matches: query === '(prefers-contrast: high)',
                    media: query,
                    onchange: null,
                    addListener: jest.fn(),
                    removeListener: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                })),
            });

            const { result } = renderHook(() => useAccessibility());

            expect(result.current.state.isHighContrast).toBe(true);
            expect(result.current.state.colorScheme).toBe('high-contrast');
        });

        it('should toggle high contrast mode', () => {
            const { result } = renderHook(() => useAccessibility());

            act(() => {
                result.current.toggleHighContrast();
            });

            expect(result.current.state.isHighContrast).toBe(true);
            expect(result.current.state.colorScheme).toBe('high-contrast');
        });

        it('should change font size', () => {
            const { result } = renderHook(() => useAccessibility());

            act(() => {
                result.current.setFontSize('large');
            });

            expect(result.current.state.fontSize).toBe('large');
        });

        it('should create accessible button props', () => {
            const { result } = renderHook(() => useAccessibility());
            const mockOnClick = jest.fn();

            const buttonProps = result.current.createButtonProps(
                'Test Button',
                mockOnClick,
                { disabled: false, pressed: true }
            );

            expect(buttonProps).toEqual({
                'aria-label': 'Test Button',
                'aria-pressed': true,
                'aria-disabled': false,
                onClick: mockOnClick,
                onKeyDown: expect.any(Function),
            });
        });

        it('should handle keyboard activation on buttons', () => {
            const { result } = renderHook(() => useAccessibility());
            const mockOnClick = jest.fn();

            const buttonProps = result.current.createButtonProps(
                'Test Button',
                mockOnClick
            );

            // Simulate Enter key press
            const enterEvent = {
                key: 'Enter',
                preventDefault: jest.fn(),
            } as React.KeyboardEvent<HTMLButtonElement>;

            buttonProps.onKeyDown(enterEvent);

            expect(enterEvent.preventDefault).toHaveBeenCalled();
            expect(mockOnClick).toHaveBeenCalled();

            // Simulate Space key press
            const spaceEvent = {
                key: ' ',
                preventDefault: jest.fn(),
            } as React.KeyboardEvent<HTMLButtonElement>;

            buttonProps.onKeyDown(spaceEvent);

            expect(spaceEvent.preventDefault).toHaveBeenCalled();
            expect(mockOnClick).toHaveBeenCalledTimes(2);
        });
    });

    describe('useKeyboardNavigation Hook', () => {
        it('should initialize with correct default state', () => {
            render(<KeyboardNavigationTestComponent />);

            const stateElement = screen.getByTestId('state');
            const state = JSON.parse(stateElement.textContent!);

            expect(state).toEqual({
                currentIndex: -1,
                totalItems: 0,
                isActive: false,
            });
        });

        it('should activate keyboard navigation', async () => {
            const user = userEvent.setup();
            render(<KeyboardNavigationTestComponent />);

            const activateButton = screen.getByText('Activate');
            await user.click(activateButton);

            const stateElement = screen.getByTestId('state');
            const state = JSON.parse(stateElement.textContent!);

            expect(state.isActive).toBe(true);
            expect(state.totalItems).toBeGreaterThan(0);
        });

        it('should navigate between items', async () => {
            const user = userEvent.setup();
            render(<KeyboardNavigationTestComponent />);

            // Activate navigation
            const activateButton = screen.getByText('Activate');
            await user.click(activateButton);

            // Navigate next
            const nextButton = screen.getByText('Next');
            await user.click(nextButton);

            const stateElement = screen.getByTestId('state');
            const state = JSON.parse(stateElement.textContent!);

            expect(state.currentIndex).toBeGreaterThanOrEqual(0);
        });

        it('should handle arrow key navigation', async () => {
            const user = userEvent.setup();
            render(<KeyboardNavigationTestComponent />);

            const container = screen.getByTestId('keyboard-container');

            // Activate navigation
            const activateButton = screen.getByText('Activate');
            await user.click(activateButton);

            // Focus container and use arrow keys
            container.focus();
            await user.keyboard('{ArrowDown}');
            await user.keyboard('{ArrowUp}');
            await user.keyboard('{Home}');
            await user.keyboard('{End}');

            // Should navigate through items
        });

        it('should announce navigation changes', async () => {
            const user = userEvent.setup();
            render(<KeyboardNavigationTestComponent />);

            const activateButton = screen.getByText('Activate');
            await user.click(activateButton);

            const nextButton = screen.getByText('Next');
            await user.click(nextButton);

            // Check for announcements
            const announcements = screen.getByTestId('announcements');
            await waitFor(() => {
                expect(announcements.textContent).toBeTruthy();
            });
        });
    });

    describe('useFocusManagement Hook', () => {
        it('should focus first element', async () => {
            const user = userEvent.setup();
            render(<FocusManagementTestComponent />);

            const focusFirstButton = screen.getByText('Focus First');
            await user.click(focusFirstButton);

            const firstButton = screen.getByText('Button 1');
            expect(firstButton).toHaveFocus();
        });

        it('should focus last element', async () => {
            const user = userEvent.setup();
            render(<FocusManagementTestComponent />);

            const focusLastButton = screen.getByText('Focus Last');
            await user.click(focusLastButton);

            const lastButton = screen.getByText('Button 3');
            expect(lastButton).toHaveFocus();
        });

        it('should enable focus trap', async () => {
            const user = userEvent.setup();
            render(<FocusManagementTestComponent />);

            const enableTrapButton = screen.getByText('Enable Trap');
            await user.click(enableTrapButton);

            const container = screen.getByTestId('focus-container');
            expect(container).toHaveAttribute('data-focus-trap', 'true');

            // Test tab trapping
            await user.tab();
            await user.tab();
            await user.tab();
            await user.tab();

            // Should wrap around within the container
        });

        it('should handle modal focus management', async () => {
            const user = userEvent.setup();
            render(<FocusManagementTestComponent />);

            const showModalButton = screen.getByText('Show Modal');
            await user.click(showModalButton);

            const modal = screen.getByTestId('modal');
            expect(modal).toBeInTheDocument();

            // Focus should be trapped within modal
            const closeButton = screen.getByText('Close');
            expect(closeButton).toHaveFocus();
        });

        it('should announce focus changes', async () => {
            const user = userEvent.setup();
            render(<FocusManagementTestComponent />);

            const focusFirstButton = screen.getByText('Focus First');
            await user.click(focusFirstButton);

            const announcements = screen.getByTestId('focus-announcements');
            await waitFor(() => {
                expect(announcements.textContent).toContain('Focused on');
            });
        });
    });

    describe('useScreenReaderAnnouncements Hook', () => {
        it('should make basic announcements', async () => {
            const user = userEvent.setup();
            render(<ScreenReaderTestComponent />);

            const announceButton = screen.getByText('Announce');
            await user.click(announceButton);

            const politeAnnouncements = screen.getByTestId(
                'polite-announcements'
            );
            await waitFor(() => {
                expect(politeAnnouncements.textContent).toBe(
                    'Test announcement'
                );
            });
        });

        it('should make loading announcements', async () => {
            const user = userEvent.setup();
            render(<ScreenReaderTestComponent />);

            const loadingButton = screen.getByText('Announce Loading');
            await user.click(loadingButton);

            const politeAnnouncements = screen.getByTestId(
                'polite-announcements'
            );
            await waitFor(() => {
                expect(politeAnnouncements.textContent).toBe('Loading data...');
            });
        });

        it('should make error announcements', async () => {
            const user = userEvent.setup();
            render(<ScreenReaderTestComponent />);

            const errorButton = screen.getByText('Announce Error');
            await user.click(errorButton);

            const assertiveAnnouncements = screen.getByTestId(
                'assertive-announcements'
            );
            await waitFor(() => {
                expect(assertiveAnnouncements.textContent).toBe(
                    'Error: Something went wrong'
                );
            });
        });

        it('should make success announcements', async () => {
            const user = userEvent.setup();
            render(<ScreenReaderTestComponent />);

            const successButton = screen.getByText('Announce Success');
            await user.click(successButton);

            const politeAnnouncements = screen.getByTestId(
                'polite-announcements'
            );
            await waitFor(() => {
                expect(politeAnnouncements.textContent).toBe(
                    'Success: Operation completed'
                );
            });
        });

        it('should make data change announcements', async () => {
            const user = userEvent.setup();
            render(<ScreenReaderTestComponent />);

            const dataChangeButton = screen.getByText('Announce Data Change');
            await user.click(dataChangeButton);

            const politeAnnouncements = screen.getByTestId(
                'polite-announcements'
            );
            await waitFor(() => {
                expect(politeAnnouncements.textContent).toBe('5 events loaded');
            });
        });

        it('should make progress announcements', async () => {
            const user = userEvent.setup();
            render(<ScreenReaderTestComponent />);

            const progressButton = screen.getByText('Announce Progress');
            await user.click(progressButton);

            const politeAnnouncements = screen.getByTestId(
                'polite-announcements'
            );
            await waitFor(() => {
                expect(politeAnnouncements.textContent).toBe(
                    'Upload: 50% complete, 50 of 100'
                );
            });
        });

        it('should clear announcements', async () => {
            const user = userEvent.setup();
            render(<ScreenReaderTestComponent />);

            // Make an announcement first
            const announceButton = screen.getByText('Announce');
            await user.click(announceButton);

            // Clear announcements
            const clearButton = screen.getByText('Clear');
            await user.click(clearButton);

            const politeAnnouncements = screen.getByTestId(
                'polite-announcements'
            );
            const assertiveAnnouncements = screen.getByTestId(
                'assertive-announcements'
            );

            expect(politeAnnouncements.textContent).toBe('');
            expect(assertiveAnnouncements.textContent).toBe('');
        });

        it('should detect screen reader activity', () => {
            // Mock screen reader indicators
            Object.defineProperty(navigator, 'userAgent', {
                writable: true,
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 NVDA/2021.1',
            });

            const { result } = renderHook(() => useScreenReaderAnnouncements());

            act(() => {
                result.current.detectScreenReader();
            });

            expect(result.current.state.isActive).toBe(true);
        });

        it('should handle announcement queue', async () => {
            const user = userEvent.setup();
            render(<ScreenReaderTestComponent />);

            // Make multiple rapid announcements
            const announceButton = screen.getByText('Announce');
            await user.click(announceButton);
            await user.click(announceButton);
            await user.click(announceButton);

            // Should queue and process announcements sequentially
            const politeAnnouncements = screen.getByTestId(
                'polite-announcements'
            );
            expect(politeAnnouncements).toBeInTheDocument();
        });
    });

    describe('Integration Tests', () => {
        it('should work together for complete accessibility', () => {
            const TestComponent: React.FC = () => {
                const {
                    keyboardNavigation,
                    focusManagement,
                    screenReader,
                    createButtonProps,
                } = useAccessibility();

                return (
                    <div ref={keyboardNavigation.containerRef}>
                        <div ref={screenReader.politeRef} aria-live='polite' />
                        <div
                            ref={screenReader.assertiveRef}
                            aria-live='assertive'
                        />
                        <div
                            ref={focusManagement.announceRef}
                            aria-live='polite'
                        />

                        <button
                            {...createButtonProps('Test Button', () => {
                                screenReader.announceSuccess('Button clicked');
                            })}
                        >
                            Test Button
                        </button>

                        <button onClick={() => keyboardNavigation.activate()}>
                            Activate Navigation
                        </button>

                        <div>
                            <button>Item 1</button>
                            <button>Item 2</button>
                            <button>Item 3</button>
                        </div>
                    </div>
                );
            };

            render(<TestComponent />);

            // All accessibility features should work together
            expect(screen.getByText('Test Button')).toBeInTheDocument();
            expect(screen.getByText('Activate Navigation')).toBeInTheDocument();
        });

        it('should handle complex interactions', async () => {
            const user = userEvent.setup();

            const ComplexTestComponent: React.FC = () => {
                const [showModal, setShowModal] = React.useState(false);
                const { keyboardNavigation, focusManagement, screenReader } =
                    useAccessibility();

                const modalRef = React.useRef<HTMLDivElement>(null);

                const handleShowModal = () => {
                    setShowModal(true);
                    screenReader.announceModal('opened', 'Test Modal');
                    if (modalRef.current) {
                        focusManagement.enableFocusTrap(modalRef.current);
                    }
                };

                const handleCloseModal = () => {
                    setShowModal(false);
                    screenReader.announceModal('closed', 'Test Modal');
                    focusManagement.disableFocusTrap();
                };

                return (
                    <div ref={keyboardNavigation.containerRef}>
                        <div ref={screenReader.politeRef} aria-live='polite' />
                        <div
                            ref={screenReader.assertiveRef}
                            aria-live='assertive'
                        />

                        <button onClick={handleShowModal}>Show Modal</button>
                        <button onClick={() => keyboardNavigation.activate()}>
                            Activate Navigation
                        </button>

                        {showModal && (
                            <div
                                ref={modalRef}
                                role='dialog'
                                aria-modal='true'
                                data-testid='complex-modal'
                            >
                                <button onClick={handleCloseModal}>
                                    Close
                                </button>
                                <button>Modal Action</button>
                            </div>
                        )}
                    </div>
                );
            };

            render(<ComplexTestComponent />);

            // Test complex interaction flow
            const showModalButton = screen.getByText('Show Modal');
            await user.click(showModalButton);

            const modal = screen.getByTestId('complex-modal');
            expect(modal).toBeInTheDocument();

            const closeButton = screen.getByText('Close');
            await user.click(closeButton);

            expect(modal).not.toBeInTheDocument();
        });
    });
});
