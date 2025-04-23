import { useState } from 'react';

interface RequestPayoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface BankAccount {
    id: number;
    name: string;
    bank: string;
    accountNumber: string;
}

const RequestPayoutModal: React.FC<RequestPayoutModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState(10000);
    const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);

    const bankAccounts = [
        {
            id: 1,
            name: 'Momo Chakka',
            bank: 'Citi Bank',
            accountNumber: '****6789',
        },
        {
            id: 2,
            name: 'Momo Chakka',
            bank: 'Truist',
            accountNumber: '****1234',
        },
        {
            id: 3,
            name: 'Momo Chakka',
            bank: 'TD Bank',
            accountNumber: '****9045',
        },
    ];

    const handleNextStep = () => {
        if (step < 3) {
            setStep(step + 1);
        }
    };

    const handleSelectBank = (account: BankAccount) => {
        setSelectedBank(account);
    };

    const handleConfirmPayout = () => {
        // Handle payout confirmation logic here
        console.log('Payout confirmed:', { amount, selectedBank });
        onClose();
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
                        <div className='space-y-6'>
                            <div>
                                <label className='mb-1 block font-inter text-xs font-medium text-[#374252]'>
                                    Amount to Withdraw
                                </label>
                                <input
                                    type='number'
                                    value={amount}
                                    onChange={(e) =>
                                        setAmount(Number(e.target.value))
                                    }
                                    className='w-full rounded-lg border border-[#E4E6EB] p-4'
                                />
                            </div>

                            <div>
                                <label className='mb-2 block font-inter text-xs font-medium text-[#374252]'>
                                    Select bank account
                                </label>
                                <div className='space-y-4'>
                                    {bankAccounts.map(
                                        (account: BankAccount) => (
                                            <div
                                                key={account.id}
                                                className={`flex cursor-pointer items-center justify-between rounded-md border p-3 ${
                                                    selectedBank?.id ===
                                                    account.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : ''
                                                }`}
                                                onClick={() =>
                                                    handleSelectBank(account)
                                                }
                                            >
                                                <div className='flex flex-col gap-2'>
                                                    <div className='font-medium'>
                                                        {account.name}
                                                    </div>
                                                    <div className='text-sm text-gray-500'>
                                                        {account.bank} -{' '}
                                                        {account.accountNumber}
                                                    </div>
                                                </div>
                                                <div
                                                    className={`flex size-5 items-center justify-center rounded-full border ${
                                                        selectedBank?.id ===
                                                        account.id
                                                            ? 'border-green-500 bg-green-500'
                                                            : 'border-gray-300'
                                                    }`}
                                                >
                                                    {selectedBank?.id ===
                                                        account.id && (
                                                        <svg
                                                            width='10'
                                                            height='8'
                                                            viewBox='0 0 10 8'
                                                            fill='none'
                                                            xmlns='http://www.w3.org/2000/svg'
                                                        >
                                                            <path
                                                                d='M3.33333 6.09933L0.833333 3.59933L0 4.43267L3.33333 7.76601L10 1.09934L9.16667 0.266006L3.33333 6.09933Z'
                                                                fill='white'
                                                            />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className='flex flex-col gap-6 py-8'>
                            <h2 className='font-inter text-sm font-normal text-[#001433]'>
                                You are about to withdraw
                            </h2>

                            <div className='flex flex-col items-center justify-center gap-4 rounded-lg bg-[#F7F8FA] p-4'>
                                <div className='font-inter text-lg font-semibold text-revlr-primary-blue'>
                                    ${amount.toLocaleString()}
                                </div>
                                <div className='font-inter text-base font-normal text-[#001433]'>
                                    to
                                </div>
                                <div className='font-inter text-lg font-medium text-[#001433]'>
                                    {selectedBank?.name} -{' '}
                                    <span className='text-[#4C5563]'>
                                        {selectedBank?.bank} -{' '}
                                        {selectedBank?.accountNumber}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with buttons */}
                <div className='mt-auto'>
                    {step === 1 && (
                        <button
                            className='w-full gap-2 rounded-md bg-revlr-primary-blue px-6 py-4 font-inter text-sm font-semibold text-white disabled:bg-[#CFE2FF]'
                            disabled={!selectedBank}
                            onClick={handleNextStep}
                        >
                            Continue
                        </button>
                    )}

                    {step === 2 && (
                        <button
                            className='w-full gap-2 rounded-md bg-revlr-primary-blue px-6 py-4 font-inter text-sm font-semibold text-white'
                            onClick={handleConfirmPayout}
                        >
                            Confirm Payout Request
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestPayoutModal;
