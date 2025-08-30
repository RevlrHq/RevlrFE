'use client';

import { useState } from 'react';
import { useVerifyUser } from '@hooks/useVerifyUser';
import { extractErrorMessage } from '@lib/utils/errorUtils';
import { StandardResponseOfUserView } from '@lib/services';

interface VerifyFormProps {
    email: string;
    token: string | null;
    onSuccess?: (data: StandardResponseOfUserView) => void;
}

const VerifyForm: React.FC<VerifyFormProps> = ({ email, token, onSuccess }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isOrganizer, setIsOrganizer] = useState(false);
    const { isLoading, isSuccess, error, execute } = useVerifyUser();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (firstName && lastName && token) {
            try {
                const response = await execute(
                    email,
                    token,
                    firstName,
                    lastName,
                    isOrganizer
                );
                if (response) {
                    onSuccess?.(response);
                }
            } catch (err) {
                console.debug('Unexpected error during verification:', err);
            }
        } else {
            console.debug('Missing required fields');
        }
    };

    return (
        <div className='w-full max-w-md'>
            <div className='relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 p-8 shadow-2xl backdrop-blur-sm transition-all duration-300 dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'>
                <div className='mb-8 space-y-2 text-center'>
                    <h2 className='font-montserrat text-2xl font-bold text-gray-900 dark:text-white'>
                        Verify Your Account
                    </h2>
                    <p className='text-gray-600 dark:text-gray-400'>
                        Please provide your details to continue.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className='space-y-6'>
                    <div className='space-y-2'>
                        <label
                            htmlFor='firstName'
                            className='block font-inter text-sm font-medium text-gray-700 dark:text-gray-300'
                        >
                            First Name
                        </label>
                        <input
                            type='text'
                            id='firstName'
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder='Enter your first name'
                            required
                            className='w-full rounded-xl border border-gray-200 bg-gray-50/50 p-4 font-inter text-gray-800 transition-all duration-200 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 dark:border-revlr-dark-border dark:bg-revlr-dark-bg/50 dark:text-gray-200 dark:placeholder:text-gray-400 dark:focus:border-revlr-primary-yellow dark:focus:bg-revlr-dark-bg'
                        />
                    </div>
                    <div className='space-y-2'>
                        <label
                            htmlFor='lastName'
                            className='block font-inter text-sm font-medium text-gray-700 dark:text-gray-300'
                        >
                            Last Name
                        </label>
                        <input
                            type='text'
                            id='lastName'
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder='Enter your last name'
                            required
                            className='w-full rounded-xl border border-gray-200 bg-gray-50/50 p-4 font-inter text-gray-800 transition-all duration-200 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 dark:border-revlr-dark-border dark:bg-revlr-dark-bg/50 dark:text-gray-200 dark:placeholder:text-gray-400 dark:focus:border-revlr-primary-yellow dark:focus:bg-revlr-dark-bg'
                        />
                    </div>
                    <div className='flex items-center'>
                        <input
                            type='checkbox'
                            id='isOrganizer'
                            checked={isOrganizer}
                            onChange={(e) => setIsOrganizer(e.target.checked)}
                            className='size-4 rounded border-gray-300 text-revlr-primary-blue focus:ring-revlr-primary-blue'
                        />
                        <label
                            htmlFor='isOrganizer'
                            className='ml-2 block text-sm text-gray-900 dark:text-gray-300'
                        >
                            I am an organizer
                        </label>
                    </div>

                    <button
                        type='submit'
                        disabled={isLoading}
                        className='w-full rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple py-4 font-inter text-base font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50'
                    >
                        {isLoading ? 'Verifying...' : 'Complete Registration'}
                    </button>
                </form>

                {error && (
                    <div className='mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20'>
                        <p className='text-sm text-red-600 dark:text-red-400'>
                            {extractErrorMessage(error)}
                        </p>
                    </div>
                )}

                {isSuccess && (
                    <div className='mt-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20'>
                        <p className='text-sm text-green-600 dark:text-green-400'>
                            Verification successful! Redirecting...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyForm;
