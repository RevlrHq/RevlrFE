'use client';

// import Link from 'next/link';
import { useEffect } from 'react';

import AppButton from '@components/app-button';
import { Button } from '@components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@components/ui/form';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@components/ui/input-otp';

import useAuth, { type OtpSchemaType } from '@features/auth/hooks/useAuth';
import useCountdown from '@features/auth/hooks/useCountdown';

const OTP_TIMER = 60;

export default function VerifyOTP() {
    const { OTPForm } = useAuth();
    const { countdown, isCountingDown, startTimer } = useCountdown();

    const {
        control,
        formState: { isValid, isSubmitting },
    } = OTPForm;

    function onSubmit(values: OtpSchemaType) {
        console.log(values);
    }

    useEffect(() => {
        startTimer(OTP_TIMER);
    }, []);

    return (
        <div className='w-full'>
            <div className='space-y-12'>
                <div
                    aria-label='Input fields to verify BVN for new users'
                    className='space-y-3'
                >
                    <h1 className='text-xl font-bold leading-26 sm:text-2xl sm:font-semibold sm:text-chit-woodsmoke'>
                        Verify your BVN
                    </h1>
                    <p className='text-sm font-normal leading-[20.72px] sm:text-base sm:leading-[23.68px]'>
                        Please enter the code sent to chu*********ess@gmail.com
                        to verify your BVN
                    </p>
                </div>

                <Form {...OTPForm}>
                    <form
                        onSubmit={OTPForm.handleSubmit(onSubmit)}
                        className='w-full'
                    >
                        <FormField
                            control={control}
                            name='otp'
                            render={({ field }) => (
                                <FormItem className='flex w-full flex-col items-center'>
                                    <FormControl>
                                        <InputOTP maxLength={6} {...field}>
                                            <InputOTPGroup>
                                                <InputOTPSlot
                                                    index={0}
                                                    className='size-[75.96px]'
                                                />
                                                <InputOTPSlot
                                                    index={1}
                                                    className='size-[75.96px]'
                                                />
                                                <InputOTPSlot
                                                    index={2}
                                                    className='size-[75.96px]'
                                                />
                                                <InputOTPSlot
                                                    index={3}
                                                    className='size-[75.96px]'
                                                />
                                                <InputOTPSlot
                                                    index={4}
                                                    className='size-[75.96px]'
                                                />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className='mt-20 flex items-center gap-4'>
                            <AppButton
                                type='submit'
                                className='sm:text-lg'
                                isLoading={isSubmitting}
                                isDisabled={!isValid || isSubmitting}
                            >
                                Verify
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
                                Resend OTP
                            </Button>
                        )}
                    </span>
                </div>
            </div>

            {/* <div className='mt-14'>
                <AppButton
                    type='submit'
                    className='text-chit-white-smoke font-semibold'
                    isLoading={false}
                    // isDisabled={!isValid || isSubmitting}
                >
                    Send OTP
                </AppButton>
            </div> */}
        </div>
    );
}
