'use client';

import { useState } from 'react';
import { useLogin } from '@hooks/useLogin';
import { useSignUp } from '@hooks/useSignUp';
import { extractErrorMessage } from '@lib/utils/errorUtils';
import Link from 'next/link';

interface AuthFormProps {
    mode: 'signup' | 'login';
    onSuccess?: () => void;
    onEmailChange?: (email: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({
    mode,
    onSuccess,
    onEmailChange,
}) => {
    const [email, setEmail] = useState<string>('');
    const { isLoading: isLoadingLogin, isSuccess, error, execute } = useLogin();
    const {
        isLoading: isLoadingSignUp,
        isSuccess: isSuccessSignUp,
        error: errorSignUp,
        execute: executeSignUp,
    } = useSignUp();
    const isLoading = mode === 'signup' ? isLoadingSignUp : isLoadingLogin;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (email && emailRegex.test(email)) {
            if (mode === 'signup') {
                try {
                    await executeSignUp(email);
                    if (isSuccessSignUp) {
                        onSuccess?.();
                    }
                    if (errorSignUp) {
                        console.error('Error during sign up:', errorSignUp);
                    }
                } catch (err) {
                    console.error('Unexpected error during sign up:', err);
                }
            } else {
                try {
                    await execute(email);
                    if (isSuccess) {
                        onSuccess?.();
                    }
                    if (error) {
                        console.error('Error during login:', error);
                    }
                } catch (err) {
                    console.error('Unexpected error during login:', err);
                }
            }
        } else {
            console.error('Invalid email format');
        }
    };

    const getTitle = () => {
        return mode === 'signup' ? 'Create Account' : 'Welcome Back';
    };

    const getSubtitle = () => {
        return mode === 'signup'
            ? 'Join thousands of event organizers'
            : 'Sign in to your account';
    };

    const getButtonText = () => {
        if (isLoading) return 'Please wait...';
        return mode === 'signup' ? 'Create Account' : 'Sign In';
    };

    return (
        <div className='w-full max-w-md'>
            {/* Form Card */}
            <div className='relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 p-8 shadow-2xl backdrop-blur-sm transition-all duration-300 dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
                {/* Header */}
                <div className='mb-8 space-y-2 text-center'>
                    <h2 className='font-montserrat text-2xl font-bold text-gray-900 dark:text-white'>
                        {getTitle()}
                    </h2>
                    <p className='text-gray-600 dark:text-gray-400'>
                        {getSubtitle()}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className='space-y-6'>
                    <div className='space-y-2'>
                        <label
                            htmlFor='email'
                            className='block font-inter text-sm font-medium text-gray-700 dark:text-gray-300'
                        >
                            Email Address
                        </label>
                        <div className='relative'>
                            <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500'>
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
                                        d='M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207'
                                    />
                                </svg>
                            </div>
                            <input
                                type='email'
                                id='email'
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    onEmailChange?.(e.target.value);
                                }}
                                placeholder='Enter your email'
                                required
                                className='w-full rounded-xl border border-gray-200 bg-gray-50/50 py-4 pl-12 pr-4 font-inter text-gray-800 transition-all duration-200 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 dark:border-revlr-dark-border dark:bg-revlr-dark-bg/50 dark:text-gray-200 dark:placeholder:text-gray-400 dark:focus:border-revlr-primary-yellow dark:focus:bg-revlr-dark-bg'
                            />
                        </div>
                    </div>

                    <button
                        type='submit'
                        disabled={isLoading}
                        className='w-full rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple py-4 font-inter text-base font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50'
                    >
                        {isLoading && (
                            <svg
                                className='mr-2 inline size-4 animate-spin'
                                fill='none'
                                viewBox='0 0 24 24'
                            >
                                <circle
                                    className='opacity-25'
                                    cx='12'
                                    cy='12'
                                    r='10'
                                    stroke='currentColor'
                                    strokeWidth='4'
                                ></circle>
                                <path
                                    className='opacity-75'
                                    fill='currentColor'
                                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                ></path>
                            </svg>
                        )}
                        {getButtonText()}
                    </button>
                </form>

                {/* Footer */}
                <div className='mt-8 text-center'>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                        {mode === 'signup' ? (
                            <>
                                Already have an account?{' '}
                                <Link
                                    href='/auth/login'
                                    className='font-medium text-revlr-primary-blue transition-colors duration-200 hover:text-revlr-accent-purple dark:text-revlr-primary-yellow dark:hover:text-white'
                                >
                                    Sign in
                                </Link>
                            </>
                        ) : (
                            <>
                                Don't have an account?{' '}
                                <Link
                                    href='/auth'
                                    className='font-medium text-revlr-primary-blue transition-colors duration-200 hover:text-revlr-accent-purple dark:text-revlr-primary-yellow dark:hover:text-white'
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </p>
                </div>

                {/* Error Display */}
                {(error || errorSignUp) && (
                    <div className='mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20'>
                        <p className='text-sm text-red-600 dark:text-red-400'>
                            {extractErrorMessage(error || errorSignUp)}
                        </p>
                    </div>
                )}

                {/* Success Display */}
                {(isSuccess || isSuccessSignUp) && (
                    <div className='mt-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20'>
                        <p className='text-sm text-green-600 dark:text-green-400'>
                            {mode === 'signup'
                                ? 'Account created! Check your email for verification.'
                                : 'Login successful! Please check tyour email for any further instructions.'}
                        </p>
                    </div>
                )}

                {/* Decorative Elements */}
                <div className='absolute -right-4 -top-4 size-16 rounded-full bg-gradient-to-br from-revlr-primary-blue/20 to-revlr-accent-purple/20 blur-xl'></div>
                <div className='absolute -bottom-4 -left-4 size-12 rounded-full bg-gradient-to-br from-revlr-primary-yellow/20 to-revlr-accent-orange/20 blur-xl'></div>
            </div>

            {/* Additional Info */}
            <div className='mt-6 text-center'>
                <p className='text-xs text-gray-500 dark:text-gray-400'>
                    By continuing, you agree to our{' '}
                    <Link
                        href='/terms'
                        className='text-revlr-primary-blue hover:underline dark:text-revlr-primary-yellow'
                    >
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                        href='/privacy'
                        className='text-revlr-primary-blue hover:underline dark:text-revlr-primary-yellow'
                    >
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default AuthForm;
