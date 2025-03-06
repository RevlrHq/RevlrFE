'use client';

import React from 'react';
import Link from 'next/link';

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
import InputPassword from '@components/input-password';
import { Checkbox } from '@components/ui/checkbox';

import useLogin from '../hooks/useLogin';

export default function Login() {
    const { form, onLogin } = useLogin();

    const {
        control,
        handleSubmit,
        formState: { isValid, isSubmitting },
    } = form;

    return (
        <div className='w-full space-y-8 p-5 sm:space-y-14 sm:px-16'>
            <div
                aria-label='login page title and description block'
                className='space-y-3'
            >
                <h1 className='text-xl font-bold leading-26 sm:text-2xl sm:font-semibold sm:text-chit-woodsmoke'>
                    Sign in to CHIT
                </h1>
                <p className='text-sm font-normal sm:text-base'>
                    Please enter your details to login
                </p>
            </div>

            <div className='w-full' aria-label='login form'>
                <Form {...form}>
                    <form
                        onSubmit={handleSubmit(onLogin)}
                        className='mt-6 w-full'
                    >
                        <div className='space-y-4'>
                            <FormField
                                control={control}
                                name='email'
                                render={({ field }) => (
                                    <FormItem className='w-full space-y-1'>
                                        <FormLabel>
                                            Email, CHIT ID or Phone number{' '}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type='text'
                                                placeholder='Enter email, user id or phone number'
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className='text-xs sm:text-sm' />
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
                                        <FormMessage className='text-xs sm:text-sm' />
                                    </FormItem>
                                )}
                            />

                            <div className='mt-4 flex w-full items-center justify-between gap-1'>
                                <FormField
                                    control={form.control}
                                    name='stayLoggedIn'
                                    render={({ field }) => (
                                        <FormItem className='flex items-center space-x-3 space-y-0'>
                                            <FormControl>
                                                <Checkbox
                                                    checked={
                                                        field.value as boolean
                                                    }
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            </FormControl>
                                            <div className='text-xs leading-none text-chit-ship-gray'>
                                                <FormLabel>
                                                    Remember Password
                                                </FormLabel>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Link
                                    href='/forgot-password'
                                    className='text-xs text-chit-ship-gray'
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <div className='flex flex-col items-center space-y-4 pt-16'>
                            <AppButton
                                type='submit'
                                className='w-full sm:text-lg'
                                isLoading={isSubmitting}
                                isDisabled={!isValid || isSubmitting}
                            >
                                Login
                            </AppButton>

                            <p className='text-sm font-light text-chit-ship-gray sm:text-base'>
                                Don’t have an account?{' '}
                                <Link
                                    href='/auth/login'
                                    className='text-chit-indigo sm:font-medium'
                                >
                                    Sign Up
                                </Link>
                            </p>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
