'use client';

import { useState } from 'react';
import { useLogin } from '@hooks/useLogin';
import { useSignUp } from '@hooks/useSignUp';

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
        return mode === 'signup' ? 'Sign Up' : 'Log In';
    };

    const getButtonText = () => {
        if (isLoading) return 'Loading...';
        return mode === 'signup' ? 'Sign Up' : 'Log In';
    };

    return (
        <div
            className={`w-full max-w-md space-y-16 rounded-xl bg-white p-8 shadow-md`}
        >
            <h2 className='text-center font-inter text-xl font-semibold text-[#000000]'>
                {getTitle()}
            </h2>
            <form onSubmit={handleSubmit} className='space-y-8'>
                <div className='space-y-2'>
                    <label
                        htmlFor='email'
                        className='font-inter text-sm font-medium text-[#374252]'
                    >
                        Email
                    </label>
                    <input
                        type='email'
                        id='email'
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            onEmailChange?.(e.target.value);
                        }}
                        placeholder='Email'
                        required
                        className='w-full rounded-lg border border-[#E4E6EB] p-4 text-base font-normal text-[#001433] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                </div>
                <button
                    type='submit'
                    className='w-full rounded-lg bg-[#0066FF] px-6 py-4 font-inter text-base font-semibold text-white duration-300 hover:bg-blue-600'
                    disabled={isLoading}
                >
                    {getButtonText()}
                </button>
            </form>
        </div>
    );
};

export default AuthForm;
