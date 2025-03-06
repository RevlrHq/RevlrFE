import React from 'react';
import Link from 'next/link';

import { Info } from 'lucide-react';

import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import AppButton from '@components/app-button';

import { signUpWithBVN } from '@features/auth/lib/schema';

type FormSchema = yup.InferType<typeof signUpWithBVN>;

export default function SignUpWithBVN() {
    const form = useForm<FormSchema>({
        resolver: yupResolver(signUpWithBVN),
        defaultValues: {
            bvn: '',
        },
    });

    const {
        formState: { isValid, isSubmitting },
    } = form;

    function onSubmit(values: FormSchema) {
        console.log(values);
    }

    return (
        <div className='w-full space-y-8 pt-9 sm:space-y-14 sm:py-10'>
            <div
                aria-label='Sign up form for new users using BVN'
                className='space-y-3'
            >
                <h1 className='text-xl font-bold leading-normal sm:text-3xl'>
                    Hi! Welcome to CHIT
                </h1>
                <p className='text-sm font-normal sm:text-base'>
                    Please input your BVN for verification to get started.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
                    <FormField
                        control={form.control}
                        name='bvn'
                        render={({ field }) => (
                            <FormItem className='w-full'>
                                <FormLabel>Enter BVN</FormLabel>
                                <FormControl>
                                    <Input
                                        type='text'
                                        placeholder='Enter BVN'
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription className='text-chit-baltic-sea'>
                                    Don’t know your BVN?{' '}
                                    <span className='text-chit-indigo'>
                                        Retrieve BVN.
                                    </span>
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className='mt-8 flex w-full gap-2 rounded-xl border border-chit-link-water bg-chit-white-smoke px-3 py-4'>
                        <div className='w-4 shrink-0 sm:mt-1'>
                            <Info className='size-4 text-chit-indigo' />
                        </div>
                        <div className='sm:space-y-2'>
                            <h2 className='text-sm font-medium leading-[18.3px] text-chit-indigo sm:text-base'>
                                Why We Need Your BVN
                            </h2>
                            <p className='text-xs leading-17 text-chit-ship-gray sm:text-sm sm:leading-[19.24px] sm:text-chit-black-cow'>
                                Your BVN ensures your account is unique and
                                secure. It’s a trusted way to confirm your
                                identity. Rest assured, we don’t have access to
                                your bank account or sensitive financial
                                details.
                            </p>
                        </div>
                    </div>

                    <div className='mt-8 flex items-center gap-4 sm:mt-16'>
                        <AppButton
                            type='submit'
                            className='font-bold sm:text-lg'
                            isLoading={isSubmitting}
                            isDisabled={!isValid || isSubmitting}
                        >
                            Verify BVN
                        </AppButton>
                    </div>

                    <div className='mt-4 flex w-full items-center justify-center gap-1'>
                        <p className='text-sm text-chit-baltic-sea sm:text-base sm:font-light sm:text-chit-ship-gray'>
                            Already have an account?{' '}
                            <Link
                                href='/auth/login'
                                className='text-chit-indigo sm:font-medium'
                            >
                                Log in
                            </Link>
                        </p>
                    </div>
                </form>
            </Form>
        </div>
    );
}
