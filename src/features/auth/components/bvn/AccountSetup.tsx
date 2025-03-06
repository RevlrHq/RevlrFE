'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormContext } from 'react-hook-form';

import AppButton from '@components/app-button';
import { Button } from '@components/ui/button';
import {
    Form,
    FormControl,
    FormLabel,
    FormField,
    FormItem,
    FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import InputPassword from '@components/input-password';
import BackButton from './BackButton';

import useAuth, {
    type SignUpEmailSchemaType,
} from '@features/auth/hooks/useAuth';

const steps = [
    {
        id: 'confirm-details',
        // label: 'Email',
        description:
            'Please confirm your details and proceed to create a password',
    },
    {
        id: 'set-password',
        description:
            'Please set a password to create an account and get started.',
    },
];

export default function AccountSetup() {
    const [step, setStep] = useState<number>(0);
    const router = useRouter();

    const { signUpForm } = useAuth();

    const {
        control,
        handleSubmit,
        formState: { isSubmitting },
    } = signUpForm;

    const goForward = (): void => {
        if (step <= 2) {
            setStep((prevStep) => prevStep + 1);
        }
    };

    const goBack = (): void => {
        console.log({ step });
        if (step == 0) return router.replace('/auth/signup/bvn/verify');
        setStep((prevStep) => prevStep - 1);
    };

    async function onSubmit(values: SignUpEmailSchemaType) {
        // router.push('/auth/account-created');
        console.log(values);
    }

    return (
        <div className='space-y-8 p-5 sm:space-y-16 sm:px-16'>
            <BackButton onGoBack={() => goBack()} />

            <div
                aria-label='Input fields to confirm details and setup password'
                className='space-y-3'
            >
                <h1 className='text-xl font-bold leading-26'>
                    You’re almost there
                </h1>
                <p className='text-sm font-normal leading-[20.72px]'>
                    {steps[step].description}
                </p>
            </div>

            <div className='w-full'>
                <Form {...signUpForm}>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className='mt-6 w-full space-y-4'
                    >
                        {step == 0 && <PersonalInformation />}

                        {step == 1 && (
                            <>
                                <FormField
                                    control={control}
                                    name='password'
                                    render={({ field }) => (
                                        <FormItem className='w-full space-y-1'>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <InputPassword
                                                    placeholder='Create password'
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className='text-xs sm:text-sm' />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name='confirmPassword'
                                    render={({ field }) => (
                                        <FormItem className='w-full space-y-1'>
                                            <FormLabel>
                                                Confirm Password
                                            </FormLabel>
                                            <FormControl>
                                                <InputPassword
                                                    placeholder='Confirm password'
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className='text-xs sm:text-sm' />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={control}
                                    name='referral'
                                    render={({ field }) => (
                                        <FormItem className='w-full space-y-1'>
                                            <FormLabel>
                                                Referral ID (optional)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type='text'
                                                    placeholder='Enter referral ID'
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <div className='flex flex-col-reverse pt-16 sm:flex-row sm:justify-end sm:space-x-2'>
                            {step == 1 ? (
                                <AppButton
                                    type='submit'
                                    className='w-full sm:text-lg'
                                    isLoading={isSubmitting}
                                    isDisabled={isSubmitting}
                                >
                                    Create an account
                                </AppButton>
                            ) : (
                                <Button
                                    type='button'
                                    className='w-full sm:text-lg'
                                    onClick={() => goForward()}
                                >
                                    Set Password
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}

function PersonalInformation() {
    const { control } = useFormContext<SignUpEmailSchemaType>();

    return (
        <div className='space-y-4'>
            <FormField
                control={control}
                name='surname'
                render={({ field }) => (
                    <FormItem className='w-full space-y-1'>
                        <FormLabel>Surname</FormLabel>
                        <FormControl>
                            <Input
                                type='text'
                                placeholder='Enter surname'
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name='firstName'
                render={({ field }) => (
                    <FormItem className='w-full space-y-1'>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                            <Input
                                type='text'
                                placeholder='Enter first name'
                                {...field}
                                onChange={field.onChange}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={control}
                name='otherName'
                render={({ field }) => (
                    <FormItem className='w-full space-y-1'>
                        <FormLabel>Other Names</FormLabel>
                        <FormControl>
                            <Input
                                type='text'
                                placeholder='Enter other name'
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name='phoneNumber'
                render={({ field }) => (
                    <FormItem className='w-full space-y-1'>
                        <FormLabel>Other Names</FormLabel>
                        <FormControl>
                            <Input
                                type='text'
                                placeholder='Enter other name'
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name='email'
                render={({ field }) => (
                    <FormItem className='w-full space-y-1'>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                            <Input
                                type='text'
                                placeholder='Enter email'
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
