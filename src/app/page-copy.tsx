'use client';

import { useChitService } from '@hooks/useChitService';
import { IdentityService } from '@lib/services';

export default function Home() {
    const { execute, isLoading } = useChitService({
        service: IdentityService,
        selector: (service) => service.postIdentityApiIdentityLogin,
        mode: 'mutation',
    });

    const handleLogin = async () => {
        try {
            const response = await execute({
                requestBody: {
                    email: 'adelowomi@gmail.com',
                    password: 'Adelowomi@2322',
                },
            });

            console.log('🚀 ~ handleLogin ~ response:', response);

            // Handle success
        } catch (error) {
            console.log('🚀 ~ handleLogin ~ error:', error);
            // Handle error
        }
    };
    return (
        <>
            <h1 className='text-8xl'>
                Lets Build Chit! The beginning of the future of payments
            </h1>
            <button onClick={handleLogin}>Login</button>
            {isLoading && <div>Loading...</div>}
        </>
    );
}
