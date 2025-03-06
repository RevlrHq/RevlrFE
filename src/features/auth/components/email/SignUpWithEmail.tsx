'use client';

// import { useState } from 'react';

import AppButton from '@components/app-button';
import {
    Form,
    FormControl,
    FormLabel,
    FormField,
    FormItem,
    FormMessage,
    FormDescription,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import InputPassword from '@components/input-password';
import { PhoneInput } from '@components/phone-input';

import useAuth, {
    type SignUpEmailSchemaType,
} from '@features/auth/hooks/useAuth';
import Link from 'next/link';

export default function SignUpWithEmail() {
    const { signUpForm } = useAuth();

    const {
        control,
        handleSubmit,
        formState: { isSubmitting },
    } = signUpForm;

    async function onSubmit(values: SignUpEmailSchemaType) {
        console.log(values);
    }

    return (
        <div className='space-y-8 pt-9 md:p-16'>
            <div
                aria-label='Input fields to confirm details and setup password'
                className='space-y-3'
            >
                <h1 className='text-xl font-bold leading-26'>
                    Hi! Welcome to CHIT
                </h1>
                <p className='text-sm font-normal leading-[20.72px]'>
                    Please fill out the form to create an account and get
                    started.
                </p>
            </div>

            <div className='w-full'>
                <Form {...signUpForm}>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className='mt-6 w-full'
                    >
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
                                name='phoneNumber'
                                render={({ field }) => (
                                    <FormItem className='w-full space-y-1'>
                                        <FormLabel>Phone Number </FormLabel>
                                        <FormControl>
                                            <PhoneInput
                                                placeholder='8145092367'
                                                defaultCountry='NG'
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
                                                placeholder='enter email'
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                        <FormDescription className='text-xs text-chit-ship-gray'>
                                            Password must contain at least six
                                            letters, 1 number, and a character
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name='confirmPassword'
                                render={({ field }) => (
                                    <FormItem className='w-full space-y-1'>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <InputPassword
                                                placeholder='Confirm password'
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name='referral'
                                render={({ field }) => (
                                    <FormItem className='w-full space-y-1'>
                                        <FormLabel>
                                            Referral ID{' '}
                                            <span className='text-chit-woodsmoke/35'>
                                                {' '}
                                                (optional)
                                            </span>
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

                            <div className='w-full'>
                                <p className='text-sm font-light text-chit-baltic-sea'>
                                    By signing up, you agree to our{' '}
                                    <Link href='/' className='text-chit-indigo'>
                                        Terms of Service
                                    </Link>{' '}
                                    {' and '}
                                    <Link href='/' className='text-chit-indigo'>
                                        Privacy Policy.
                                    </Link>
                                </p>
                            </div>
                        </div>

                        <div className='flex flex-col items-center space-y-4 pt-16'>
                            <AppButton
                                type='submit'
                                className='w-full'
                                isLoading={isSubmitting}
                                isDisabled={isSubmitting}
                            >
                                Create an account
                            </AppButton>

                            <p className='text-sm font-light text-chit-ship-gray'>
                                Already have an account?{' '}
                                <Link
                                    href='/auth/login'
                                    className='text-chit-indigo'
                                >
                                    Log in
                                </Link>
                            </p>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
