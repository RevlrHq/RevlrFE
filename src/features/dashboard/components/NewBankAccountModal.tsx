import { useState } from 'react';

interface NewBankAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const banks = [
    {
        id: 1,
        name: 'Access Bank',
        code: '044',
        country: 'Nigeria',
    },
    {
        id: 2,
        name: 'GTBank',
        code: '058',
        country: 'Nigeria',
    },
    {
        id: 3,
        name: 'Zenith Bank',
        code: '057',
        country: 'Nigeria',
    },
    {
        id: 4,
        name: 'First Bank of Nigeria',
        code: '011',
        country: 'Nigeria',
    },
    {
        id: 5,
        name: 'United Bank for Africa',
        code: '033',
        country: 'Nigeria',
    },
    {
        id: 6,
        name: 'Fidelity Bank',
        code: '070',
        country: 'Nigeria',
    },
    {
        id: 7,
        name: 'Stanbic IBTC Bank',
        code: '221',
        country: 'Nigeria',
    },
    {
        id: 8,
        name: 'Sterling Bank',
        code: '232',
        country: 'Nigeria',
    },
    {
        id: 9,
        name: 'Union Bank',
        code: '032',
        country: 'Nigeria',
    },
    {
        id: 10,
        name: 'Wema Bank',
        code: '035',
        country: 'Nigeria',
    },
];

const NewBankAccountModal: React.FC<NewBankAccountModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [selectedBank, setSelectedBank] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [isDefaultAccount, setIsDefaultAccount] = useState(false);
    const [verificationMethod, setVerificationMethod] = useState('email');
    const [displayAccountName, setDisplayAccountName] = useState(false);
    const [fetchAccountName, setFetchAccountName] = useState(false);
    const [verificationCode, setVerificationCode] = useState([
        '',
        '',
        '',
        '',
        '',
        '',
    ]);
    const [resendTimer] = useState(120);
    const [step, setStep] = useState(1);

    const handleCodeChange = (index: number, value: number) => {
        const newCode = [...verificationCode];
        newCode[index] = value.toString();
        setVerificationCode(newCode);

        // Auto-focus next input if value is entered
        if (value && index < 5) {
            const nextInput = document.getElementById(
                `code-input-${index + 1}`
            );
            if (nextInput) {
                nextInput.focus();
            }
        }
    };

    const handleAccountNumberChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const value = e.target.value;
        setAccountNumber(value);
        if (value.length === 10) {
            setFetchAccountName(true);
            setTimeout(() => {
                setDisplayAccountName(true);
                setFetchAccountName(false);
            }, 5000);
        }
    };

    if (!isOpen) return null;
    return (
        <div className='fixed inset-y-0 right-0 z-50 flex'>
            {/* Backdrop */}
            <div
                className='fixed inset-0 bg-black opacity-25'
                onClick={onClose}
            />

            {/* Modal */}
            <div className='relative flex h-full w-[504px] flex-col rounded-l-lg bg-white p-8 shadow-xl'>
                {/* Header */}
                <div className='flex items-center justify-between'>
                    <h2 className='font-inter text-sm font-medium text-[#001433]'>
                        Request Payout
                    </h2>
                    <button onClick={onClose} className='p-1'>
                        <svg
                            width='24'
                            height='24'
                            viewBox='0 0 24 24'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M13.2997 0.710215C12.9097 0.320215 12.2797 0.320215 11.8897 0.710215L6.99973 5.59022L2.10973 0.700215C1.71973 0.310215 1.08973 0.310215 0.699727 0.700215C0.309727 1.09021 0.309727 1.72022 0.699727 2.11022L5.58973 7.00022L0.699727 11.8902C0.309727 12.2802 0.309727 12.9102 0.699727 13.3002C1.08973 13.6902 1.71973 13.6902 2.10973 13.3002L6.99973 8.41021L11.8897 13.3002C12.2797 13.6902 12.9097 13.6902 13.2997 13.3002C13.6897 12.9102 13.6897 12.2802 13.2997 11.8902L8.40973 7.00022L13.2997 2.11022C13.6797 1.73022 13.6797 1.09022 13.2997 0.710215Z'
                                fill='#001433'
                            />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className='mt-4 flex-1 overflow-auto'>
                    {step === 1 && (
                        <div className='flex flex-col gap-6'>
                            <div>
                                <label className='mb-1 block font-inter text-xs font-medium text-[#374252]'>
                                    Bank Name
                                </label>
                                <select
                                    value={selectedBank}
                                    onChange={(e) =>
                                        setSelectedBank(e.target.value)
                                    }
                                    className='w-full rounded-lg border border-[#E4E6EB] p-3 font-inter text-sm font-normal text-[#9DA4B0]'
                                >
                                    <option value='' disabled>
                                        Enter bank name
                                    </option>
                                    {banks.map((bank) => (
                                        <option
                                            key={bank.code}
                                            value={bank.code}
                                        >
                                            {bank.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className='mb-1 block font-inter text-xs font-medium text-[#374252]'>
                                    Bank Account Number
                                </label>
                                <input
                                    type='number'
                                    value={accountNumber}
                                    onChange={handleAccountNumberChange}
                                    className='w-full rounded-lg border border-[#E4E6EB] p-3 font-inter text-sm font-normal text-[#9DA4B0]'
                                />
                            </div>

                            {fetchAccountName && !displayAccountName && (
                                <div>
                                    <label className='mb-1 block font-inter text-xs font-medium text-[#374252]'>
                                        Bank Account Name
                                    </label>
                                    <div className='relative w-full rounded-lg bg-[#F7F8FA] p-4'>
                                        <svg
                                            width='20'
                                            height='20'
                                            viewBox='0 0 20 20'
                                            fill='none'
                                            xmlns='http://www.w3.org/2000/svg'
                                            className='size-5 animate-spin text-gray-500'
                                        >
                                            <g clip-path='url(#clip0_1866_1944)'>
                                                <path
                                                    d='M5.90962 9.99991C5.90962 9.49785 5.50259 9.09082 5.00053 9.09082H1.36417C0.862108 9.09082 0.455078 9.49785 0.455078 9.99991C0.455078 10.502 0.862108 10.909 1.36417 10.909H5.00053C5.50259 10.909 5.90962 10.502 5.90962 9.99991Z'
                                                    fill='black'
                                                />
                                                <path
                                                    d='M18.6374 9.09082H16.8192C16.3172 9.09082 15.9102 9.49785 15.9102 9.99991C15.9102 10.502 16.3172 10.909 16.8192 10.909H18.6374C19.1395 10.909 19.5465 10.502 19.5465 9.99991C19.5465 9.49785 19.1395 9.09082 18.6374 9.09082Z'
                                                    fill='black'
                                                />
                                                <path
                                                    d='M10.456 5.45455C10.958 5.45455 11.3651 5.04752 11.3651 4.54545V0.909091C11.3651 0.40703 10.958 0 10.456 0C9.95391 0 9.54688 0.40703 9.54688 0.909091V4.54545C9.54688 5.04752 9.95391 5.45455 10.456 5.45455Z'
                                                    fill='black'
                                                />
                                                <path
                                                    d='M10.456 14.5454C9.95391 14.5454 9.54688 14.9524 9.54688 15.4545V19.0909C9.54688 19.5929 9.95391 20 10.456 20C10.958 20 11.3651 19.5929 11.3651 19.0909V15.4545C11.3651 14.9524 10.958 14.5454 10.456 14.5454Z'
                                                    fill='black'
                                                />
                                                <path
                                                    d='M4.6691 2.92885C4.31419 2.57382 3.73855 2.57388 3.38346 2.92885C3.02843 3.28388 3.02843 3.85945 3.38346 4.21448L5.95479 6.78588C6.13231 6.96339 6.36498 7.05218 6.59758 7.05218C6.83019 7.05218 7.06291 6.96339 7.24037 6.78594C7.5954 6.43091 7.5954 5.85533 7.24037 5.5003L4.6691 2.92885Z'
                                                    fill='black'
                                                />
                                                <path
                                                    d='M14.9542 13.214C14.5993 12.859 14.0236 12.859 13.6686 13.214C13.3136 13.569 13.3136 14.1446 13.6686 14.4996L16.24 17.0709C16.4175 17.2484 16.6502 17.3371 16.8828 17.3371C17.1155 17.3371 17.3482 17.2483 17.5256 17.0709C17.8807 16.7159 17.8807 16.1403 17.5256 15.7853L14.9542 13.214Z'
                                                    fill='black'
                                                />
                                                <path
                                                    d='M5.95473 13.214L3.38346 15.7853C3.02843 16.1403 3.02843 16.7159 3.38346 17.0709C3.56098 17.2485 3.79364 17.3372 4.02631 17.3372C4.25898 17.3372 4.49164 17.2485 4.6691 17.0709L7.24037 14.4997C7.5954 14.1446 7.5954 13.5691 7.24037 13.214C6.88534 12.859 6.3097 12.859 5.95473 13.214Z'
                                                    fill='black'
                                                />
                                            </g>
                                            <defs>
                                                <clipPath id='clip0_1866_1944'>
                                                    <rect
                                                        width='20'
                                                        height='20'
                                                        fill='white'
                                                    />
                                                </clipPath>
                                            </defs>
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {!fetchAccountName && displayAccountName && (
                                <div>
                                    <div>
                                        <label className='mb-1 block font-inter text-xs font-medium text-[#374252]'>
                                            Bank Account Name
                                        </label>
                                        <div className='flex items-center gap-2 rounded-md border border-green-100 bg-green-50 p-4 text-green-800'>
                                            <svg
                                                width='18'
                                                height='18'
                                                viewBox='0 0 18 18'
                                                fill='none'
                                                xmlns='http://www.w3.org/2000/svg'
                                            >
                                                <path
                                                    d='M8.99935 0.666504C4.39935 0.666504 0.666016 4.39984 0.666016 8.99984C0.666016 13.5998 4.39935 17.3332 8.99935 17.3332C13.5993 17.3332 17.3327 13.5998 17.3327 8.99984C17.3327 4.39984 13.5993 0.666504 8.99935 0.666504ZM6.74102 12.5748L3.74935 9.58317C3.42435 9.25817 3.42435 8.73317 3.74935 8.40817C4.07435 8.08317 4.59935 8.08317 4.92435 8.40817L7.33268 10.8082L13.066 5.07484C13.391 4.74984 13.916 4.74984 14.241 5.07484C14.566 5.39984 14.566 5.92484 14.241 6.24984L7.91602 12.5748C7.59935 12.8998 7.06602 12.8998 6.74102 12.5748Z'
                                                    fill='#22C55E'
                                                />
                                            </svg>
                                            <span className='font-inter text-sm font-normal text-[#001433]'>
                                                Momo Chakka
                                            </span>
                                        </div>
                                    </div>

                                    <div className='mt-2 flex items-center'>
                                        <input
                                            type='checkbox'
                                            id='default-account'
                                            className='mr-2 rounded text-blue-500'
                                            checked={isDefaultAccount}
                                            onChange={() =>
                                                setIsDefaultAccount(
                                                    !isDefaultAccount
                                                )
                                            }
                                        />
                                        <label
                                            htmlFor='default-account'
                                            className='font-inter text-sm font-normal text-[#001433]'
                                        >
                                            Set as default payout account
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className='flex flex-col gap-6'>
                            <div>
                                <p className='font-inter text-sm font-normal text-[#001433]'>
                                    Choose where to receive your verification
                                    code:
                                </p>
                                <p className='font-inter text-sm font-normal text-[#001433]'>
                                    This step helps keep your account secure.
                                </p>
                            </div>

                            <div className='space-y-2'>
                                <div className='flex items-center'>
                                    <input
                                        type='radio'
                                        id='email'
                                        name='verification'
                                        className='mr-3 text-blue-500'
                                        checked={verificationMethod === 'email'}
                                        onChange={() =>
                                            setVerificationMethod('email')
                                        }
                                    />
                                    <label
                                        htmlFor='email'
                                        className='font-inter text-sm font-medium text-revlr-primary-blue'
                                    >
                                        mochi@gmail.com
                                    </label>
                                </div>
                                <div className='flex items-center'>
                                    <input
                                        type='radio'
                                        id='phone'
                                        name='verification'
                                        className='mr-3 text-blue-500'
                                        checked={verificationMethod === 'phone'}
                                        onChange={() =>
                                            setVerificationMethod('phone')
                                        }
                                    />
                                    <label
                                        htmlFor='phone'
                                        className='font-inter text-sm font-medium text-black'
                                    >
                                        •••••••••72
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className='flex flex-col gap-6'>
                            <p className='font-inter text-sm font-normal text-[#001433]'>
                                {verificationMethod === 'email'
                                    ? 'Enter the verification code sent to your email address'
                                    : 'Enter the verification code sent to your sent to your phone number ending in 72'}
                            </p>

                            <div className='space-y-4'>
                                <div>
                                    <label className='mb-2 block font-inter text-xs font-medium text-[#374252]'>
                                        Code
                                    </label>
                                    <div className='flex space-x-2'>
                                        {verificationCode.map(
                                            (digit, index) => (
                                                <input
                                                    key={index}
                                                    id={`code-input-${index}`}
                                                    type='text'
                                                    maxLength={1}
                                                    className='size-10 rounded-md border border-gray-200 text-center'
                                                    value={digit}
                                                    onChange={(e) =>
                                                        handleCodeChange(
                                                            index,
                                                            parseInt(
                                                                e.target.value
                                                            )
                                                        )
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                                <p className='font-inter text-sm font-normal text-[#001433]'>
                                    Didn't get the code? Resend in{' '}
                                    <span className='text-revlr-primary-blue'>
                                        {Math.floor(resendTimer / 60)}:
                                        {(resendTimer % 60)
                                            .toString()
                                            .padStart(2, '0')}
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with buttons */}
                <div className='mt-auto'>
                    {step === 1 && (
                        <button
                            className='w-full gap-2 rounded-md bg-revlr-primary-blue px-6 py-4 font-inter text-sm font-semibold text-white disabled:bg-[#CFE2FF]'
                            disabled={!displayAccountName}
                            onClick={() => setStep(2)}
                        >
                            Continue
                        </button>
                    )}

                    {step === 2 && (
                        <button
                            className='w-full gap-2 rounded-md bg-revlr-primary-blue px-6 py-4 font-inter text-sm font-semibold text-white'
                            onClick={() => setStep(3)}
                        >
                            Send Code
                        </button>
                    )}

                    {step === 3 && (
                        <button
                            className='w-full gap-2 rounded-md bg-revlr-primary-blue px-6 py-4 font-inter text-sm font-semibold text-white disabled:bg-[#CFE2FF]'
                            disabled={verificationCode.join('').length !== 6}
                        >
                            Verify & Add Account
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewBankAccountModal;
