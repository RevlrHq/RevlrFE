import { useEffect } from 'react';

import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';

import { OTPSchema, signUpWithBVN, signUpWithEmail } from '../lib/schema';

// import { useAuthStore } from '@src/stores/authStore';
import { useChitService } from '@hooks/useChitService';
import { IdentityService } from '@lib/services';
import { ServiceMode } from '@lib/index';

export type OtpSchemaType = yup.InferType<typeof OTPSchema>;
export type SignUpBVNSchemaType = yup.InferType<typeof signUpWithBVN>;
export type SignUpEmailSchemaType = yup.InferType<typeof signUpWithEmail>;

export default function useAuth() {
    // const { user, isAuthenticated, setUser, logout } = useAuthStore();

    const { isLoading } = useChitService({
        service: IdentityService,
        selector: (service) => service.getIdentityApiIdentityManageInfo,
        enabled: true,
        mode: ServiceMode.QUERY,
    });

    const OTPForm = useForm<OtpSchemaType>({
        mode: 'onChange',
        resolver: yupResolver<OtpSchemaType>(OTPSchema),
        defaultValues: {
            otp: '',
        },
    });

    const signUpForm = useForm<SignUpEmailSchemaType>({
        resolver: yupResolver<SignUpEmailSchemaType>(signUpWithEmail),
        defaultValues: {
            surname: '',
            firstName: '',
            otherName: '',
            phoneNumber: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    useEffect(() => {});

    return {
        OTPForm,
        signUpForm,
        isLoading,
    };
}
