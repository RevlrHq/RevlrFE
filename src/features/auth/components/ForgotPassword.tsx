'use client';

import { useEffect } from 'react';
// import Link from 'next/link';

import AppButton from '@components/app-button';
import {
    Form,
    FormControl,
    FormLabel,
    FormField,
    FormItem,
    FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';

import { useLogin, useCountdown } from '@features/auth/hooks';
import BackButton from './bvn/BackButton';

const OTP_TIMER = 60;

export default function ForgotPassword() {
    const { form, onLogin } = useLogin();
    const { countdown, isCountingDown, startTimer } = useCountdown();

    const {
        control,
        handleSubmit,
        formState: { isValid, isSubmitting },
    } = form;

    useEffect(() => {
        startTimer(OTP_TIMER);
    }, []);

    return (
        <div className='w-full space-y-8 p-5 sm:space-y-14 sm:px-16'>
            <BackButton onGoBack={() => {}} />

            <div
                aria-label='Forgot password page title and description block'
                className='space-y-3'
            >
                <h1 className='text-xl font-bold leading-26 sm:text-2xl sm:font-semibold sm:text-chit-woodsmoke'>
                    Forgot Password?
                </h1>
                <p className='text-sm font-normal sm:text-base'>
                    Enter your registered email and click on the link to reset
                    your password
                </p>
            </div>

            <div className='w-full' aria-label='Forgot password form container'>
                <Form {...form}>
                    <form
                        onSubmit={handleSubmit(onLogin)}
                        className='mt-6 w-full'
                        aria-label='Forgot password form'
                    >
                        <div className='space-y-4'>
                            <FormField
                                control={control}
                                name='id'
                                render={({ field }) => (
                                    <FormItem className='w-full space-y-1'>
                                        <FormLabel>Email address</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='text'
                                                placeholder='Enter email'
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
                                Send
                            </AppButton>
                        </div>
                    </form>
                </Form>
            </div>

            <div className='mt-4 flex w-full items-center justify-center gap-1'>
                <div className='flex items-center text-sm text-chit-primary sm:text-base'>
                    Didn't receive the code?{' '}
                    <span className='ml-1'>
                        {isCountingDown ? (
                            countdown
                        ) : (
                            <Button
                                type='button'
                                className='w-full px-1 py-0 font-medium hover:bg-transparent sm:font-semibold'
                                variant='ghost'
                                // onClick={() =>
                                //     handleEmailResend(
                                //         decodeURIComponent(email)
                                //     )
                                // }
                            >
                                Resend Link
                            </Button>
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}
