'use client';

import { useEffect } from 'react';
import AuthForm from './components/AuthForm';
import { useSearchParams, useRouter } from 'next/navigation';
import { useValidateLogin } from '@hooks/useValidateLogin';

const Login = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const email = searchParams.get('email') || '';
    const { isSuccess, error, execute } = useValidateLogin();

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) return;

            try {
                await execute(email, token);
                if (isSuccess) {
                    router.push('/dashboard');
                    console.log('Token verified successfully!');
                }
                if (error) {
                    console.error('Error during sign up:', error);
                }
            } catch (err) {
                console.error('Error verifying token:', err);
            }
        };

        verifyToken();
    }, [token, router]);

    const handleSuccess = () => {
        console.log('Login successful!');
    };
    return (
        <div className='flex min-h-screen items-center justify-center bg-gray-50'>
            <AuthForm mode='login' onSuccess={() => handleSuccess()} />
        </div>
    );
};

export default Login;
