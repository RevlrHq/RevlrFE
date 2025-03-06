import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { IdentityService } from '@lib/services';
import { onErrorDisplay } from '@lib/utils';

import { useToast } from '@hooks/use-toast';
import { useChitService } from '@hooks/useChitService';

import { passwordResetSchema } from '../lib/schema';
import { ServiceMode } from '@lib/index';

export type TPasswordResetSchema = yup.InferType<typeof passwordResetSchema>;

export default function useResetPassword() {
    const router = useRouter();
    const { toast } = useToast();

    const { execute, isLoading } = useChitService({
        service: IdentityService,
        selector: (service) => service.postIdentityApiIdentityResetPassword,
        mode: ServiceMode.MUTATION,
    });

    const form = useForm<TPasswordResetSchema>({
        resolver: yupResolver<TPasswordResetSchema>(passwordResetSchema),
        defaultValues: {
            email: '' as string,
            resetCode: '' as string,
            newPassword: '',
        },
    });

    const onPasswordReset = async (
        values: TPasswordResetSchema
    ): Promise<void> => {
        try {
            const response = await execute({
                requestBody: {
                    email: values.email as string,
                    resetCode: values.resetCode as string,
                    ...values,
                },
            });

            if (!response.success) {
                throw new Error(response.message || 'Error logging in...');
            }

            router.push('/');
        } catch (error) {
            const errorBody = (error as { body: unknown; message: string })
                ?.body as Record<string, string>;

            onErrorDisplay(errorBody, toast, 'Authentication failed');
        }
    };

    return { form, onPasswordReset, isLoading };
}
