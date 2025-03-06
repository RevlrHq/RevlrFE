'use client';

import AppButton from '@components/app-button';
import {
    Form,
    FormControl,
    FormLabel,
    FormField,
    FormItem,
    FormMessage,
} from '@components/ui/form';
import InputPassword from '@components/input-password';

import BackButton from './bvn/BackButton';
import useResetPassword from '@features/auth/hooks/useResetPassword';

export default function ResetPassword() {
    const { form, onPasswordReset } = useResetPassword();

    const {
        control,
        handleSubmit,
        formState: { isValid, isSubmitting },
    } = form;

    return (
        <div className='w-full space-y-8 p-5 sm:space-y-14 sm:px-16'>
            <BackButton onGoBack={() => {}} />

            <div
                aria-label='Forgot password page title and description block'
                className='space-y-3'
            >
                <h1 className='text-xl font-bold leading-26 sm:text-2xl sm:font-semibold sm:text-chit-woodsmoke'>
                    Reset Password
                </h1>
                <p className='text-sm font-normal sm:text-base'>
                    Enter your new password to reset password
                </p>
            </div>

            <div className='w-full' aria-label='Forgot password form container'>
                <Form {...form}>
                    <form
                        onSubmit={handleSubmit(onPasswordReset)}
                        className='mt-6 w-full'
                        aria-label='Forgot password form'
                    >
                        <div className='space-y-4'>
                            <FormField
                                control={control}
                                name='newPassword'
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
                        </div>

                        <div className='flex flex-col items-center space-y-4 pt-16'>
                            <AppButton
                                type='submit'
                                className='w-full sm:text-lg'
                                isLoading={isSubmitting}
                                isDisabled={!isValid || isSubmitting}
                                aria-label='Submit forgot password form'
                            >
                                Reset Password
                            </AppButton>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
