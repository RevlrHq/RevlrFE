'use client';

import React, { useState } from 'react';
import { useTheme } from '@src/lib/ThemeContext';

interface MobileFormSection {
    id: string;
    title: string;
    description?: string;
    icon?: React.ReactNode;
    isCompleted: boolean;
    hasErrors: boolean;
    children: React.ReactNode;
}

interface MobileFormLayoutProps {
    sections: MobileFormSection[];
    currentSection: string;
    onSectionChange: (sectionId: string) => void;
    className?: string;
}

export const MobileFormLayout: React.FC<MobileFormLayoutProps> = ({
    sections,
    currentSection,
    onSectionChange,
    className = '',
}) => {
    const { theme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const currentSectionData = sections.find((s) => s.id === currentSection);
    const currentIndex = sections.findIndex((s) => s.id === currentSection);

    const handleNext = () => {
        if (currentIndex < sections.length - 1) {
            onSectionChange(sections[currentIndex + 1].id);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            onSectionChange(sections[currentIndex - 1].id);
        }
    };

    return (
        <div className={`min-h-screen ${className}`}>
            {/* Mobile Header */}
            <div
                className={`sticky top-0 z-40 border-b ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                }`}
            >
                {/* Progress Bar */}
                <div
                    className={`h-1 ${
                        theme === 'dark'
                            ? 'bg-revlr-dark-border'
                            : 'bg-gray-200'
                    }`}
                >
                    <div
                        className='h-1 bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple transition-all duration-300'
                        style={{
                            width: `${((currentIndex + 1) / sections.length) * 100}%`,
                        }}
                    />
                </div>

                {/* Header Content */}
                <div className='flex items-center justify-between p-4'>
                    <div className='flex items-center space-x-3'>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`rounded-lg p-2 transition-colors duration-200 ${
                                theme === 'dark'
                                    ? 'text-gray-300 hover:bg-revlr-dark-border'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            aria-label='Toggle section menu'
                        >
                            <svg
                                className='size-5'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M4 6h16M4 12h16M4 18h16'
                                />
                            </svg>
                        </button>
                        <div>
                            <h1
                                className={`font-inter font-semibold ${
                                    theme === 'dark'
                                        ? 'text-white'
                                        : 'text-gray-900'
                                }`}
                            >
                                {currentSectionData?.title}
                            </h1>
                            <p
                                className={`font-inter text-xs ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-500'
                                }`}
                            >
                                Step {currentIndex + 1} of {sections.length}
                            </p>
                        </div>
                    </div>

                    {/* Section Status */}
                    <div className='flex items-center space-x-2'>
                        {currentSectionData?.hasErrors && (
                            <div className='flex items-center space-x-1'>
                                <svg
                                    className='size-4 text-red-500'
                                    fill='currentColor'
                                    viewBox='0 0 20 20'
                                >
                                    <path
                                        fillRule='evenodd'
                                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                                        clipRule='evenodd'
                                    />
                                </svg>
                                <span className='font-inter text-xs text-red-500'>
                                    Errors
                                </span>
                            </div>
                        )}
                        {currentSectionData?.isCompleted &&
                            !currentSectionData.hasErrors && (
                                <div className='flex items-center space-x-1'>
                                    <svg
                                        className='size-4 text-green-500'
                                        fill='currentColor'
                                        viewBox='0 0 20 20'
                                    >
                                        <path
                                            fillRule='evenodd'
                                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                    <span className='font-inter text-xs text-green-500'>
                                        Complete
                                    </span>
                                </div>
                            )}
                    </div>
                </div>
            </div>

            {/* Section Menu Overlay */}
            {isMenuOpen && (
                <div
                    className='fixed inset-0 z-50 bg-black/50'
                    onClick={() => setIsMenuOpen(false)}
                >
                    <div
                        className={`absolute left-0 top-0 h-full w-80 max-w-[90vw] transition-transform duration-300${
                            theme === 'dark'
                                ? 'border-r border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-r border-gray-200 bg-white'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className='p-4'>
                            <div className='mb-6 flex items-center justify-between'>
                                <h2
                                    className={`font-inter text-lg font-semibold ${
                                        theme === 'dark'
                                            ? 'text-white'
                                            : 'text-gray-900'
                                    }`}
                                >
                                    Form Sections
                                </h2>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`rounded-lg p-2 transition-colors duration-200 ${
                                        theme === 'dark'
                                            ? 'text-gray-300 hover:bg-revlr-dark-border'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <svg
                                        className='size-5'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M6 18L18 6M6 6l12 12'
                                        />
                                    </svg>
                                </button>
                            </div>

                            <div className='space-y-2'>
                                {sections.map((section, index) => (
                                    <button
                                        key={section.id}
                                        onClick={() => {
                                            onSectionChange(section.id);
                                            setIsMenuOpen(false);
                                        }}
                                        className={`w-full rounded-lg p-3 text-left transition-all duration-200 ${
                                            section.id === currentSection
                                                ? 'border border-revlr-primary-blue/20 bg-gradient-to-r from-revlr-primary-blue/10 to-revlr-accent-purple/10'
                                                : theme === 'dark'
                                                  ? 'hover:bg-revlr-dark-border/50'
                                                  : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className='flex items-center space-x-3'>
                                            <div
                                                className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold ${
                                                    section.isCompleted
                                                        ? 'bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple text-white'
                                                        : section.hasErrors
                                                          ? 'bg-red-100 text-red-600'
                                                          : section.id ===
                                                              currentSection
                                                            ? 'bg-revlr-primary-blue text-white'
                                                            : theme === 'dark'
                                                              ? 'bg-revlr-dark-border text-gray-400'
                                                              : 'bg-gray-200 text-gray-600'
                                                }`}
                                            >
                                                {section.isCompleted ? (
                                                    <svg
                                                        className='size-4'
                                                        fill='currentColor'
                                                        viewBox='0 0 20 20'
                                                    >
                                                        <path
                                                            fillRule='evenodd'
                                                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                                            clipRule='evenodd'
                                                        />
                                                    </svg>
                                                ) : section.hasErrors ? (
                                                    <svg
                                                        className='size-4'
                                                        fill='currentColor'
                                                        viewBox='0 0 20 20'
                                                    >
                                                        <path
                                                            fillRule='evenodd'
                                                            d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                                                            clipRule='evenodd'
                                                        />
                                                    </svg>
                                                ) : (
                                                    index + 1
                                                )}
                                            </div>
                                            <div className='flex-1'>
                                                <h3
                                                    className={`font-inter font-medium ${
                                                        section.id ===
                                                        currentSection
                                                            ? 'text-revlr-primary-blue'
                                                            : theme === 'dark'
                                                              ? 'text-white'
                                                              : 'text-gray-900'
                                                    }`}
                                                >
                                                    {section.title}
                                                </h3>
                                                {section.description && (
                                                    <p
                                                        className={`mt-1 font-inter text-xs ${
                                                            theme === 'dark'
                                                                ? 'text-gray-400'
                                                                : 'text-gray-500'
                                                        }`}
                                                    >
                                                        {section.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className='flex-1 p-4'>
                {currentSectionData?.description && (
                    <div
                        className={`mb-6 rounded-lg p-4 ${
                            theme === 'dark'
                                ? 'border border-revlr-dark-border bg-revlr-dark-border/20'
                                : 'border border-blue-200 bg-blue-50'
                        }`}
                    >
                        <p
                            className={`font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-blue-700'
                            }`}
                        >
                            {currentSectionData.description}
                        </p>
                    </div>
                )}

                {currentSectionData?.children}
            </div>

            {/* Mobile Navigation Footer */}
            <div
                className={`sticky bottom-0 border-t p-4 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border bg-revlr-dark-card'
                        : 'border-gray-200 bg-white'
                }`}
            >
                <div className='flex items-center justify-between'>
                    <button
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className={`flex items-center space-x-2 rounded-xl px-4 py-2 font-inter font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                            theme === 'dark'
                                ? 'border border-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/20 disabled:hover:bg-transparent'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:hover:bg-transparent'
                        }`}
                    >
                        <svg
                            className='size-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M15 19l-7-7 7-7'
                            />
                        </svg>
                        <span>Previous</span>
                    </button>

                    <div className='flex items-center space-x-2'>
                        {sections.map((_, index) => (
                            <div
                                key={index}
                                className={`size-2 rounded-full transition-all duration-200 ${
                                    index === currentIndex
                                        ? 'w-6 bg-revlr-primary-blue'
                                        : index < currentIndex
                                          ? 'bg-green-500'
                                          : theme === 'dark'
                                            ? 'bg-revlr-dark-border'
                                            : 'bg-gray-300'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={currentIndex === sections.length - 1}
                        className={`flex items-center space-x-2 rounded-xl px-4 py-2 font-inter font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                            currentIndex === sections.length - 1
                                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                                : 'bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90'
                        }`}
                    >
                        <span>
                            {currentIndex === sections.length - 1
                                ? 'Complete'
                                : 'Next'}
                        </span>
                        <svg
                            className='size-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M9 5l7 7-7 7'
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileFormLayout;
