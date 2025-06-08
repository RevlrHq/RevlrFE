'use client';

import { useState } from 'react';
import WalletBalance from './WalletBalance';
import PayoutHistoryTable from './PayoutHistoryTable';
import BankAccountList from './BankAccountList';
import RequestPayoutModal from './RequestPayoutModal';
import NewBankAccountModal from './NewBankAccountModal';

const PayoutManagement = () => {
    const [isRequestPayoutModalOpen, setIsRequestPayoutModalOpen] =
        useState(false);
    const [isNewBankAccountModalOpen, setIsNewBankAccountModalOpen] =
        useState(false);

    const openNewBankAccountPayoutModal = () => {
        setIsNewBankAccountModalOpen(true);
    };

    const closeNewBankAccountModal = () => {
        setIsNewBankAccountModalOpen(false);
    };

    const openRequestPayoutModal = () => {
        setIsRequestPayoutModalOpen(true);
    };

    const closeRequestPayoutModal = () => {
        setIsRequestPayoutModalOpen(false);
    };
    const [payoutHistory] = useState([
        {
            id: 1,
            amount: 11150,
            date: '20/3/2025',
            time: '11:59 PM',
            bankAccount: 'Citi Bank ...5678',
            status: 'Completed',
        },
        {
            id: 2,
            amount: 500,
            date: '20/3/2025',
            time: '11:59 PM',
            bankAccount: 'Truist...1234',
            status: 'Processing',
        },
        {
            id: 3,
            amount: 1218,
            date: '20/3/2025',
            time: '11:59 PM',
            bankAccount: 'TD Bank...9045',
            status: 'Completed',
        },
        {
            id: 4,
            amount: 7634,
            date: '20/3/2025',
            time: '11:59 PM',
            bankAccount: 'Citi Bank ...5678',
            status: 'Completed',
        },
        {
            id: 5,
            amount: 120,
            date: '20/3/2025',
            time: '11:59 PM',
            bankAccount: 'Citi Bank ...5678',
            status: 'Failed',
        },
        {
            id: 6,
            amount: 50,
            date: '20/3/2025',
            time: '11:59 PM',
            bankAccount: 'Citi Bank ...5678',
            status: 'Processing',
        },
        {
            id: 7,
            amount: 7634,
            date: '20/3/2025',
            time: '11:59 PM',
            bankAccount: 'Citi Bank ...5678',
            status: 'Completed',
        },
    ]);

    // Mock data for bank accounts
    const [bankAccounts, setBankAccounts] = useState([
        {
            id: 1,
            accountNumber: '0123456789',
            bankName: 'Citi Bank',
            accountHolder: 'Momo Chakka',
        },
        {
            id: 2,
            accountNumber: '5678901234',
            bankName: 'Truist',
            accountHolder: 'Momo Chakka',
        },
        {
            id: 3,
            accountNumber: '6701238904',
            bankName: 'TD Bank',
            accountHolder: 'Momo Chakka',
        },
    ]);

    const handleDeleteAccount = (id: number) => {
        setBankAccounts(bankAccounts.filter((account) => account.id !== id));
    };
    return (
        <div className='min-h-screen bg-gray-50 p-4 md:p-8'>
            <div className=''>
                {/* Balance and Request Payout Section */}
                <div className='mb-8 rounded-xl bg-white p-8 shadow-sm'>
                    <div className='flex flex-row items-center justify-between'>
                        <div className='mb-4 flex flex-col gap-8 md:mb-0 md:flex-row'>
                            <WalletBalance
                                title='Wallet Balance'
                                amount='$26,000'
                                icon='wallet'
                            />
                            <div className='hidden h-full w-px bg-gray-200 md:block' />
                            <WalletBalance
                                title='Pending Balance'
                                amount='$5,014'
                                icon='pending'
                            />
                        </div>
                        <button
                            className='gap-2 rounded-lg bg-[#0066FF] px-6 py-4 font-inter text-sm font-semibold text-white'
                            onClick={openRequestPayoutModal}
                        >
                            Request Payout
                        </button>
                    </div>
                </div>

                {/* Main Content - Two Columns */}
                <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
                    {/* Payout History */}
                    <div className='lg:col-span-2'>
                        <div className='rounded-lg bg-white p-6 shadow-sm'>
                            <h2 className='mb-6 font-inter text-sm font-semibold text-[#001433]'>
                                Payout History
                            </h2>
                            <PayoutHistoryTable payouts={payoutHistory} />
                        </div>
                    </div>

                    {/* Bank Accounts */}
                    <div className='lg:col-span-1'>
                        <div className='rounded-lg bg-white p-6 shadow-sm'>
                            <h2 className='mb-6 font-inter text-sm font-semibold text-[#001433]'>
                                Bank Accounts
                            </h2>
                            <BankAccountList
                                accounts={bankAccounts}
                                onDelete={handleDeleteAccount}
                            />
                            <button
                                className='mt-4 w-full rounded-lg border border-[#E5F0FF] bg-[#F1F6FF] py-4 font-inter font-semibold text-[#0066FF]'
                                onClick={openNewBankAccountPayoutModal}
                            >
                                Add New Bank Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <RequestPayoutModal
                isOpen={isRequestPayoutModalOpen}
                onClose={closeRequestPayoutModal}
            />
            <NewBankAccountModal
                isOpen={isNewBankAccountModalOpen}
                onClose={closeNewBankAccountModal}
            />
        </div>
    );
};

export default PayoutManagement;
