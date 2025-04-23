'use client';

import { useState, useEffect } from 'react';
import { useSignUp } from '@hooks/useSignUp';
import AuthForm from './components/AuthForm';

const auth = () => {
    const [email, setEmail] = useState('');
    const [userSignedIn, setUserSignedIn] = useState(false);
    const [seconds, setSeconds] = useState(30);
    const [showButton, setShowButton] = useState(false);
    const { isSuccess, error, execute } = useSignUp();

    useEffect(() => {
        if (seconds > 0) {
            const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setShowButton(true);
        }
    }, [seconds]);

    const handleSuccess = () => {
        setUserSignedIn(true);
        setSeconds(30);
        setShowButton(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (email && emailRegex.test(email)) {
            try {
                await execute(email);

                if (isSuccess) {
                    setUserSignedIn(true);
                    setSeconds(30);
                }
                if (error) {
                    console.error('Error during login:', error);
                }
            } catch (err) {
                console.error('Unexpected error during login:', err);
            }
        } else {
            console.error('Invalid email format');
        }
    };

    return (
        <div className='flex min-h-screen items-center justify-center bg-gray-50'>
            {userSignedIn ? (
                <div className='w-full max-w-md space-y-6 rounded-xl bg-white p-8 text-center shadow-md'>
                    <h2 className='font-inter text-xl font-semibold text-[#000000]'>
                        Check Your Email
                    </h2>
                    <p className='font-inter text-sm font-normal text-[#000000]'>
                        We have sent you a verification link to continue. Ensure
                        to check your spam folder too.
                    </p>
                    <div className='flex flex-row items-center justify-center gap-2'>
                        <h2 className='font-inter text-sm font-normal text-[#4C5563]'>
                            Didn’t get the email?
                        </h2>
                        {!showButton && (
                            <span className='font-inter text-sm font-medium text-[#9DA4B0]'>
                                Resend link in {seconds}s
                            </span>
                        )}
                        {showButton && (
                            <button
                                onClick={handleSubmit}
                                className='text-sm font-medium text-blue-600 hover:underline'
                            >
                                Resend Link
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <AuthForm
                    mode='signup'
                    onSuccess={() => handleSuccess()}
                    onEmailChange={(val) => setEmail(val)}
                />
            )}
        </div>
    );
};

export default auth;
