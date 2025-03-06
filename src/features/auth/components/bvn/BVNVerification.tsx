'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import AppButton from '@components/app-button';
import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group';

import VerifyOTP from './VerifyOTP';

import { cn } from '@lib/utils';
import BackButton from './BackButton';

const options = [
    {
        id: 'email',
        label: 'Email',
        description:
            'An email with verification code will be sent to chu******ess@gmail.com',
    },
    {
        id: 'phone1',
        label: 'Phone Number 1',
        description:
            'SMS with a verification code will be sent to +234817****788',
    },
    {
        id: 'phone2',
        label: 'Phone Number 2',
        description:
            'SMS with a verification code will be sent to +234909****603',
    },
    {
        id: 'alternative',
        label: 'Alternative Phone Number',
        description:
            'SMS with a verification code will be sent to your alternate phone number',
    },
];

export default function BVNVerification() {
    const [hasCode, setHasCode] = useState<boolean>(false);
    const [selected, setSelected] = useState<string>('');
    const router = useRouter();

    const toggleOtpInput = () => {
        setHasCode(!hasCode);
    };

    const goBack = (hasOtp: boolean) => {
        if (hasOtp) return setHasCode(false);

        return router.push('/auth/signup');
    };

    return (
        <div className='w-full space-y-8 p-5 sm:space-y-14 sm:px-16'>
            <BackButton onGoBack={() => goBack(hasCode)} />

            {hasCode ? (
                <VerifyOTP />
            ) : (
                <>
                    <div
                        aria-label='Sign up form for new users using BVN'
                        className='space-y-3'
                    >
                        <h1 className='text-xl font-bold leading-26 sm:text-2xl sm:font-semibold sm:text-chit-woodsmoke'>
                            Verify your BVN
                        </h1>
                        <p className='text-sm font-normal leading-[20.72px] sm:text-base'>
                            Please select how you want to receive otp for bvn
                            verification
                        </p>
                    </div>
                    <div className='w-full space-y-8'>
                        <RadioGroup>
                            {options.map(({ id, label, description }) => (
                                <VerificationItem
                                    key={id}
                                    id={id}
                                    label={label}
                                    description={description}
                                    isChecked={id == selected}
                                    selected={selected}
                                    onChange={setSelected}
                                />
                            ))}
                        </RadioGroup>
                    </div>
                    <div className='pt-14 sm:pt-16'>
                        <AppButton
                            type='submit'
                            className='font-semibold text-chit-white-smoke sm:text-lg'
                            isLoading={false}
                            onClick={() => toggleOtpInput()}
                            // isDisabled={!isValid || isSubmitting}
                        >
                            Send OTP
                        </AppButton>
                    </div>{' '}
                </>
            )}
        </div>
    );
}

type OptionsProps = {
    id: string;
    label: string;
    description: string;
    selected: string;
    isChecked: boolean;
    onChange: (value: string) => void;
};

function VerificationItem({
    id,
    label,
    description,
    selected,
    isChecked,
    onChange,
}: OptionsProps) {
    return (
        <div
            key={id}
            className='mb-3 flex items-start gap-4 focus-within:rounded-xl focus-within:ring-1 focus-within:ring-gray-100 hover:shadow-none sm:items-center'
            onClick={() => onChange(id)}
        >
            <RadioGroupItem
                id={id}
                value={selected}
                checked={isChecked}
                onChange={() => onChange(id)}
                className={cn(
                    'mt-1 size-6 border-chit-gainsboro checked:border-chit-primary',
                    isChecked && 'border-chit-primary'
                )}
            />
            <label
                htmlFor={id}
                className='flex-1 cursor-pointer space-y-2 sm:rounded-xl sm:bg-chit-milk-white sm:p-2.5'
            >
                <h2 className='text-base font-semibold leading-[21.12px] text-chit-woodsmoke sm:text-lg sm:font-medium'>
                    {label}
                </h2>
                <p className='text-xs leading-[14.64px] text-chit-ship-gray'>
                    {description}
                </p>
            </label>
        </div>
    );
}
