'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    content: React.ReactNode;
    targetElement?: string; // CSS selector for highlighting
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface SettingsOnboardingProps {
    steps: OnboardingStep[];
    isVisible: boolean;
    onComplete: () => void;
    onSkip: () => void;
    className?: string;
}

export function SettingsOnboarding({
    steps,
    isVisible,
    onComplete,
    onSkip,
    className = '',
}: SettingsOnboardingProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (!isVisible) return;

        // Highlight target element if specified
        const step = steps[currentStep];
        if (step.targetElement) {
            const element = document.querySelector(step.targetElement);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('settings-onboarding-highlight');
            }
        }

        return () => {
            // Clean up highlights
            document
                .querySelectorAll('.settings-onboarding-highlight')
                .forEach((el) => {
                    el.classList.remove('settings-onboarding-highlight');
                });
        };
    }, [currentStep, isVisible, steps]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentStep(currentStep + 1);
                setIsAnimating(false);
            }, 150);
        } else {
            onComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentStep(currentStep - 1);
                setIsAnimating(false);
            }, 150);
        }
    };

    const handleStepClick = (stepIndex: number) => {
        if (stepIndex !== currentStep) {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentStep(stepIndex);
                setIsAnimating(false);
            }, 150);
        }
    };

    if (!isVisible) return null;

    const currentStepData = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    return (
        <>
            {/* Overlay */}
            <div className='fixed inset-0 z-40 bg-black bg-opacity-50' />

            {/* Onboarding Modal */}
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
            >
                <div className='max-h-[90vh] w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800'>
                    {/* Header */}
                    <div className='flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700'>
                        <div className='flex items-center gap-3'>
                            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                                Settings Tour
                            </h2>
                            <span className='text-sm text-gray-500 dark:text-gray-400'>
                                {currentStep + 1} of {steps.length}
                            </span>
                        </div>
                        <button
                            onClick={onSkip}
                            className='p-1 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300'
                            aria-label='Skip tour'
                        >
                            <X className='h-5 w-5' />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className='px-4 py-2'>
                        <div className='flex gap-1'>
                            {steps.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleStepClick(index)}
                                    className={`h-2 flex-1 rounded-full transition-colors duration-200 ${
                                        index <= currentStep
                                            ? 'bg-blue-500'
                                            : 'bg-gray-200 dark:bg-gray-600'
                                    }`}
                                    aria-label={`Go to step ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className='max-h-96 space-y-4 overflow-y-auto p-4'>
                        <div
                            className={`transition-opacity duration-150 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
                        >
                            <h3 className='mb-2 text-xl font-semibold text-gray-900 dark:text-white'>
                                {currentStepData.title}
                            </h3>
                            <p className='mb-4 text-gray-600 dark:text-gray-300'>
                                {currentStepData.description}
                            </p>
                            <div className='text-sm text-gray-700 dark:text-gray-200'>
                                {currentStepData.content}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className='flex items-center justify-between border-t border-gray-200 p-4 dark:border-gray-700'>
                        <button
                            onClick={onSkip}
                            className='text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        >
                            Skip Tour
                        </button>

                        <div className='flex items-center gap-2'>
                            <button
                                onClick={handlePrevious}
                                disabled={currentStep === 0}
                                className='flex items-center gap-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            >
                                <ChevronLeft className='h-4 w-4' />
                                Previous
                            </button>

                            <button
                                onClick={handleNext}
                                className='flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700'
                            >
                                {isLastStep ? (
                                    <>
                                        <Check className='h-4 w-4' />
                                        Finish
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ChevronRight className='h-4 w-4' />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS for highlighting */}
            <style jsx global>{`
                .settings-onboarding-highlight {
                    position: relative;
                    z-index: 45;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
                    border-radius: 8px;
                    transition: box-shadow 0.3s ease;
                }
            `}</style>
        </>
    );
}

// Hook for managing onboarding state
export function useSettingsOnboarding() {
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
    const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);

    useEffect(() => {
        // Check if user has seen onboarding
        const seen = localStorage.getItem('settings-onboarding-seen');
        if (!seen) {
            setIsOnboardingVisible(true);
        } else {
            setHasSeenOnboarding(true);
        }
    }, []);

    const completeOnboarding = () => {
        localStorage.setItem('settings-onboarding-seen', 'true');
        setHasSeenOnboarding(true);
        setIsOnboardingVisible(false);
    };

    const skipOnboarding = () => {
        localStorage.setItem('settings-onboarding-seen', 'true');
        setHasSeenOnboarding(true);
        setIsOnboardingVisible(false);
    };

    const resetOnboarding = () => {
        localStorage.removeItem('settings-onboarding-seen');
        setHasSeenOnboarding(false);
        setIsOnboardingVisible(true);
    };

    return {
        hasSeenOnboarding,
        isOnboardingVisible,
        completeOnboarding,
        skipOnboarding,
        resetOnboarding,
    };
}

// Predefined onboarding steps for settings
export const defaultSettingsOnboardingSteps: OnboardingStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to Settings!',
        description: "Let's take a quick tour of your new settings page.",
        content: (
            <div className='space-y-3'>
                <p>
                    Your settings page has been redesigned to give you more
                    control over your Revlr experience.
                </p>
                <ul className='list-inside list-disc space-y-1 text-sm'>
                    <li>Manage your profile and security</li>
                    <li>Customize notifications and interface</li>
                    <li>Connect media providers</li>
                    <li>Export your data and manage billing</li>
                </ul>
            </div>
        ),
    },
    {
        id: 'navigation',
        title: 'Easy Navigation',
        description:
            'Use the sidebar to navigate between different settings sections.',
        targetElement: '[data-onboarding="settings-navigation"]',
        content: (
            <div className='space-y-3'>
                <p>
                    Click on any section in the sidebar to jump directly to
                    those settings.
                </p>
                <p>
                    Each section is organized to help you find what you need
                    quickly.
                </p>
            </div>
        ),
    },
    {
        id: 'profile',
        title: 'Profile Settings',
        description: 'Keep your profile information up to date.',
        targetElement: '[data-onboarding="profile-section"]',
        content: (
            <div className='space-y-3'>
                <p>
                    Update your personal information, upload a profile photo,
                    and set your preferences.
                </p>
                <p>
                    A complete profile helps build trust with event attendees.
                </p>
            </div>
        ),
    },
    {
        id: 'security',
        title: 'Security Features',
        description: 'Protect your account with advanced security options.',
        targetElement: '[data-onboarding="security-section"]',
        content: (
            <div className='space-y-3'>
                <p>
                    Manage your login sessions, change your email, and monitor
                    account activity.
                </p>
                <p>Regular security checkups help keep your account safe.</p>
            </div>
        ),
    },
    {
        id: 'notifications',
        title: 'Notification Control',
        description: 'Customize how and when you receive updates.',
        targetElement: '[data-onboarding="notifications-section"]',
        content: (
            <div className='space-y-3'>
                <p>Choose between email, push, and in-app notifications.</p>
                <p>Set frequency preferences to avoid notification overload.</p>
            </div>
        ),
    },
    {
        id: 'help',
        title: 'Help is Always Available',
        description:
            'Look for help icons throughout the settings for additional guidance.',
        content: (
            <div className='space-y-3'>
                <p>
                    Hover over the{' '}
                    <span className='inline-flex items-center'>
                        <span className='mr-1 inline-block h-4 w-4 rounded-full bg-gray-300'></span>
                    </span>{' '}
                    icons to get helpful tips and explanations.
                </p>
                <p>
                    You can also access the full user guide from the help menu.
                </p>
            </div>
        ),
    },
];
