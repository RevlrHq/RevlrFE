import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { IdentityService } from '@lib/services';
import { onErrorDisplay, ServiceMode } from '@lib/index';

import { useToast } from '@hooks/use-toast';
import { useChitService } from '@hooks/useChitService';

import { loginSchema } from '../lib/schema';
// import { useAuthStore } from '@src/stores/authStore';

export type TLoginSchema = yup.InferType<typeof loginSchema>;

export default function useLogin() {
    const router = useRouter();
    const { toast } = useToast();

    // const { user, isAuthenticated, setUser, logout } = useAuthStore();

    const { execute, isLoading } = useChitService({
        service: IdentityService,
        selector: (service) => service.postIdentityApiIdentityLogin,
        mode: ServiceMode.MUTATION,
    });

    const form = useForm<TLoginSchema>({
        resolver: yupResolver<TLoginSchema>(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            stayLoggedIn: false,
        },
    });

    // TODO: remove hard coded login values:
    const onLogin = async (values: TLoginSchema): Promise<void> => {
        try {
            const response = await execute({
                requestBody: {
                    ...values,
                    email: 'adelowomi@gmail.com',
                    password: 'Adelowomi@2322',
                },
            });

            if (!response.accessToken) {
                throw new Error('Error logging in...');
            }
            // TODO: handle user credentials
            // setUser(User, response.accessToken);

            router.push('/');
        } catch (error) {
            const errorBody = (error as { body: unknown; message: string })
                ?.body as Record<string, string>;

            onErrorDisplay(errorBody, toast, 'Authentication failed');
        }
    };

    return { form, onLogin, isLoading };
}
