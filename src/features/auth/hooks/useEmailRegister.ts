import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';

import { useToast } from '@hooks/use-toast';

import { signUpWithEmail } from '../lib/schema';

import { IdentityService } from '@lib/services';
import { onErrorDisplay } from '@lib/index';

export type SignUpEmailSchemaType = yup.InferType<typeof signUpWithEmail>;

const DEFAULT_VALUES = {
    surname: '',
    firstName: '',
    otherName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
};
export default function useEmailRegister() {
    const router = useRouter();
    const { toast } = useToast();

    const {
        control,
        handleSubmit,
        getValues,
        formState: { isValid, isSubmitting },
    } = useForm<SignUpEmailSchemaType>({
        resolver: yupResolver<SignUpEmailSchemaType>(signUpWithEmail),
        defaultValues: DEFAULT_VALUES,
    });

    const onSubmit = async (data: SignUpEmailSchemaType) => {
        try {
            const response = await IdentityService.register({
                requestBody: data,
            });

            if (!response.status) {
                throw new Error(
                    response.message || 'Error registering user...'
                );
            }

            router.push({
                pathname: '/auth/signup/verify',
                query: { email: data.email },
            });
        } catch (error) {
            const errorBody = (error as { body: unknown; message: string })
                ?.body as Record<string, string>;

            onErrorDisplay(errorBody, toast, 'Authentication Error');
        }
    };

    return {
        control,
        isValid,
        isSubmitting,
        handleSubmit,
        getValues,
        onSubmit,
    };
}
