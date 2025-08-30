'use client';

import { useState } from 'react';
import { SelectIcon } from '@src/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEmailVerification } from '@hooks/useVerifyEmail';

const Signin = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const [userFirstStepFilledIn, setUserFirstStepFilledIn] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const { execute, isLoading, isSuccess, error } = useEmailVerification();

    const handleFirstStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (firstName && lastName) {
            setUserFirstStepFilledIn(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const userData = {
            firstName,
            lastName,
            organizerType:
                selectedOption === 'To organise events' ? true : false,
            email,
            token,
        };
        if (userData.email && token) {
            try {
                await execute(
                    userData.email,
                    token,
                    userData.firstName,
                    userData.lastName,
                    userData.organizerType
                );

                if (isSuccess) {
                    router.push('/dashboard');
                }
                if (error) {
                    console.debug('Error during login:', error);
                }
            } catch (err) {
                console.debug('Unexpected error during login:', err);
            }
        } else {
            console.debug('Email or token is missing');
        }
    };

    const handleSelection = (option: string) => {
        setSelectedOption(option);
        setIsOpen(false);
    };
    return (
        <div className='flex min-h-screen items-center justify-center bg-gray-50'>
            {userFirstStepFilledIn ? (
                <div className='w-full max-w-[500px] rounded-xl bg-white p-8 shadow-md transition-all duration-300'>
                    <h2 className='text-center font-inter text-xl font-semibold text-[#000000]'>
                        What do you want to use REVLR for?
                    </h2>

                    <div className='relative mt-12 w-full'>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className='flex w-full items-center justify-between rounded-lg border border-gray-300 p-3 text-left font-inter text-base font-normal text-[#1F2938] focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                            {selectedOption || 'Select option'}
                            <span
                                className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            >
                                <SelectIcon />
                            </span>
                        </button>

                        <div
                            className={`absolute mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg transition-all duration-500 ${
                                isOpen
                                    ? 'max-h-40 opacity-100'
                                    : 'max-h-0 opacity-0'
                            }`}
                        >
                            <ul className='py-2'>
                                <li
                                    onClick={() =>
                                        handleSelection('To organise events')
                                    }
                                    className='cursor-pointer p-3 font-inter text-base font-normal text-[#1F2938] hover:bg-gray-100'
                                >
                                    To organise events
                                </li>
                                <li
                                    onClick={() =>
                                        handleSelection('To attend events')
                                    }
                                    className='cursor-pointer p-3 font-inter text-base font-normal text-[#1F2938] hover:bg-gray-100'
                                >
                                    To attend events
                                </li>
                            </ul>
                        </div>
                    </div>

                    <button
                        type='button'
                        disabled={!selectedOption}
                        onClick={handleSubmit}
                        className={`w-full rounded-lg px-6 py-3 font-semibold text-white transition-all ${
                            selectedOption
                                ? 'bg-[#0066FF] hover:bg-blue-700'
                                : 'cursor-not-allowed bg-gray-400'
                        } ${isOpen ? 'mt-36' : 'mt-12'}`}
                    >
                        {isLoading ? 'Loading....' : 'Finish'}
                    </button>
                </div>
            ) : (
                <div className='w-full max-w-[500px] space-y-16 rounded-xl bg-white p-8 shadow-md'>
                    <h2 className='text-center font-inter text-xl font-semibold text-[#000000]'>
                        Sign Up or Login
                    </h2>
                    <form onSubmit={handleFirstStep} className='space-y-6'>
                        <div className='space-y-2'>
                            <label
                                htmlFor='firstName'
                                className='font-inter text-sm font-medium text-[#374252]'
                            >
                                First Name
                            </label>
                            <input
                                type='text'
                                id='firstName'
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder='Adelowo'
                                required
                                className='w-full rounded-lg border border-[#E4E6EB] p-4 text-base font-normal text-[#001433] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>
                        <div className='space-y-2'>
                            <label
                                htmlFor='lastName'
                                className='font-inter text-sm font-medium text-[#374252]'
                            >
                                Last Name
                            </label>
                            <input
                                type='text'
                                id='lastName'
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder='Ajibola'
                                required
                                className='w-full rounded-lg border border-[#E4E6EB] p-4 text-base font-normal text-[#001433] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>
                        <p className='font-inter text-sm font-normal text-[#374252]'>
                            By signing up, you agree to our{' '}
                            <span className='font-medium text-[#0066FF]'>
                                Terms of Use
                            </span>{' '}
                            and{' '}
                            <span className='font-medium text-[#0066FF]'>
                                Privacy Policy
                            </span>
                            .
                        </p>
                        <button
                            type='submit'
                            disabled={!firstName && !lastName}
                            className={`w-full rounded-lg px-6 py-4 font-inter text-sm font-medium text-white duration-300 focus:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                !firstName || !lastName
                                    ? 'cursor-not-allowed bg-[#CFE2FF]'
                                    : 'bg-[#0066FF] hover:bg-blue-600'
                            }`}
                        >
                            Agree & Sign Up
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Signin;
