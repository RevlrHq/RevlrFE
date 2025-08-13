'use client';

import React from 'react';
import { useTheme } from '@src/lib/ThemeContext';

interface ProgressStep {
    id: number;
    title: string;
    description?: string;
    isCompleted: boolean;
    isActive: boolean;
    isAccessible: boolean;
}

interface ProgressIndicatorProps {
    steps: ProgressStep[];
    onStepClick?: (stepId: number) => void;
    className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
    steps,
    onStepClick,
    className = '',
}) => {
    const { theme } = useTheme();

    const handleStepClick = (step: ProgressStep) => {
        if (step.isAccessible && onStepClick) {
            onStepClick(step.id);
        }
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Mobile Progress Bar */}
            <div className='block md:hidden'>
                <div className='mb-4'>
                    <div className='flex items-center justify-between text-sm'>
                        <span
                            className={`font-inter font-medium ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-600'
                            }`}
                        >
                            Step {steps.find((s) => s.isActive)?.id || 1} of{' '}
                            {steps.length}
                        </span>
                        <span
                            className={`font-inter font-medium ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-600'
                            }`}
                        >
                            {Math.round(
                                (steps.filter((s) => s.isCompleted).length /
                                    steps.length) *
                                    100
                            )}
                            % Complete
                        </span>
                    </div>
                    <div
                        className={`mt-2 h-2 rounded-full ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-border'
                                : 'bg-gray-200'
                        }`}
                    >
                        <div
                            className='h-2 rounded-full bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple transition-all duration-300'
                            style={{
                                width: `${(steps.filter((s) => s.isCompleted).length / steps.length) * 100}%`,
                            }}
                        />
                    </div>
                </div>
                <div
                    className={`rounded-xl p-4 ${
                        theme === 'dark'
                            ? 'border border-revlr-dark-border bg-revlr-dark-card'
                            : 'border border-gray-200 bg-white'
                    }`}
                >
                    <h3
                        className={`font-inter font-semibold ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}
                    >
                        {steps.find((s) => s.isActive)?.title}
                    </h3>
                    {steps.find((s) => s.isActive)?.description && (
                        <p
                            className={`mt-1 font-inter text-sm ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            {steps.find((s) => s.isActive)?.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Desktop Progress Steps */}
            <div className='hidden md:block'>
                <nav aria-label='Progress'>
                    <ol className='flex items-center justify-between'>
                        {steps.map((step, index) => (
                            <li key={step.id} className='relative flex-1'>
                                {/* Connector Line */}
                                {index < steps.length - 1 && (
                                    <div
                                        className={`absolute left-1/2 top-5 h-0.5 w-full -translate-x-1/2 ${
                                            step.isCompleted
                                                ? 'bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple'
                                                : theme === 'dark'
                                                  ? 'bg-revlr-dark-border'
                                                  : 'bg-gray-200'
                                        }`}
                                        style={{
                                            left: '50%',
                                            width: 'calc(100% - 2rem)',
                                        }}
                                    />
                                )}

                                <button
                                    type='button'
                                    onClick={() => handleStepClick(step)}
                                    disabled={!step.isAccessible}
                                    className={`group relative flex w-full flex-col items-center p-4 transition-all duration-200 ${
                                        step.isAccessible
                                            ? 'cursor-pointer hover:scale-105'
                                            : 'cursor-not-allowed opacity-50'
                                    }`}
                                    aria-current={
                                        step.isActive ? 'step' : undefined
                                    }
                                >
                                    {/* Step Circle */}
                                    <div
                                        className={`relative z-10 flex size-10 items-center justify-center rounded-full border-2 font-inter text-sm font-semibold transition-all duration-200 ${
                                            step.isCompleted
                                                ? 'border-transparent bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple text-white shadow-lg'
                                                : step.isActive
                                                  ? 'border-revlr-primary-blue bg-revlr-primary-blue text-white shadow-lg'
                                                  : theme === 'dark'
                                                    ? 'border-revlr-dark-border bg-revlr-dark-card text-gray-400'
                                                    : 'border-gray-300 bg-white text-gray-500'
                                        } ${
                                            step.isAccessible &&
                                            !step.isActive &&
                                            !step.isCompleted
                                                ? 'group-hover:border-revlr-primary-blue group-hover:text-revlr-primary-blue'
                                                : ''
                                        }`}
                                    >
                                        {step.isCompleted ? (
                                            <svg
                                                className='size-5'
                                                fill='currentColor'
                                                viewBox='0 0 20 20'
                                                aria-hidden='true'
                                            >
                                                <path
                                                    fillRule='evenodd'
                                                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                                    clipRule='evenodd'
                                                />
                                            </svg>
                                        ) : (
                                            step.id
                                        )}
                                    </div>

                                    {/* Step Label */}
                                    <div className='mt-3 text-center'>
                                        <h3
                                            className={`font-inter text-sm font-semibold transition-colors duration-200 ${
                                                step.isActive
                                                    ? 'text-revlr-primary-blue'
                                                    : step.isCompleted
                                                      ? theme === 'dark'
                                                          ? 'text-white'
                                                          : 'text-gray-900'
                                                      : theme === 'dark'
                                                        ? 'text-gray-400'
                                                        : 'text-gray-500'
                                            } ${
                                                step.isAccessible &&
                                                !step.isActive &&
                                                !step.isCompleted
                                                    ? 'group-hover:text-revlr-primary-blue'
                                                    : ''
                                            }`}
                                        >
                                            {step.title}
                                        </h3>
                                        {step.description && (
                                            <p
                                                className={`mt-1 font-inter text-xs transition-colors duration-200 ${
                                                    step.isActive
                                                        ? theme === 'dark'
                                                            ? 'text-gray-300'
                                                            : 'text-gray-600'
                                                        : theme === 'dark'
                                                          ? 'text-gray-500'
                                                          : 'text-gray-400'
                                                } ${
                                                    step.isAccessible &&
                                                    !step.isActive &&
                                                    !step.isCompleted
                                                        ? 'group-hover:text-gray-600'
                                                        : ''
                                                }`}
                                            >
                                                {step.description}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>
        </div>
    );
};

export default ProgressIndicator;
