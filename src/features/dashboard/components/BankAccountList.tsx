import React from 'react';

interface BankAccount {
    id: number;
    accountNumber: string;
    bankName: string;
    accountHolder: string;
}

interface BankAccountsListProps {
    accounts: BankAccount[];
    onDelete: (id: number) => void;
}

const BankAccountList: React.FC<BankAccountsListProps> = ({
    accounts,
    onDelete,
}) => {
    return (
        <div className='space-y-4'>
            {accounts.map((account) => (
                <div key={account.id} className='border-b border-[#F2F3F5] p-4'>
                    <div className='flex items-end justify-between'>
                        <div className='space-y-2'>
                            <div className='font-inter text-sm font-medium text-[#001433]'>
                                {account.accountNumber}
                            </div>
                            <div className='font-inter text-sm font-medium text-[#4C5563]'>
                                {account.bankName}
                            </div>
                            <div className='font-inter text-sm font-medium text-[#4C5563]'>
                                {account.accountHolder}
                            </div>
                        </div>
                        <button
                            onClick={() => onDelete(account.id)}
                            className='rounded-md p-1 text-blue-600 hover:bg-blue-50'
                        >
                            <svg
                                width='20'
                                height='20'
                                viewBox='0 0 20 20'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <g clip-path='url(#clip0_1655_4730)'>
                                    <path
                                        fill-rule='evenodd'
                                        clip-rule='evenodd'
                                        d='M11.8993 1.6665C12.6167 1.6665 13.2537 2.12555 13.4805 2.80612L13.934 4.1665H16.6667C17.1269 4.1665 17.5 4.5396 17.5 4.99984C17.5 5.46006 17.1269 5.83315 16.6667 5.83317L16.6646 5.89254L15.9417 16.0112C15.8483 17.3196 14.7597 18.3332 13.4482 18.3332H6.55187C5.24027 18.3332 4.15167 17.3196 4.05822 16.0112L3.33545 5.89254C3.33403 5.87263 3.33332 5.85283 3.3333 5.83317C2.87307 5.83315 2.5 5.46006 2.5 4.99984C2.5 4.5396 2.8731 4.1665 3.33333 4.1665H6.06603L6.51949 2.80612C6.74635 2.12555 7.38325 1.6665 8.10063 1.6665H11.8993ZM7.5 8.33317C7.07263 8.33317 6.72041 8.65486 6.67227 9.06932L6.66667 9.1665V14.1665C6.66667 14.6268 7.03976 14.9998 7.5 14.9998C7.92737 14.9998 8.27959 14.6781 8.32773 14.2637L8.33333 14.1665V9.1665C8.33333 8.70625 7.96024 8.33317 7.5 8.33317ZM12.5 8.33317C12.0398 8.33317 11.6667 8.70625 11.6667 9.1665V14.1665C11.6667 14.6268 12.0398 14.9998 12.5 14.9998C12.9602 14.9998 13.3333 14.6268 13.3333 14.1665V9.1665C13.3333 8.70625 12.9602 8.33317 12.5 8.33317ZM11.8993 3.33317H8.10063L7.82286 4.1665H12.1772L11.8993 3.33317Z'
                                        fill='#0066FF'
                                    />
                                </g>
                                <defs>
                                    <clipPath id='clip0_1655_4730'>
                                        <rect
                                            width='20'
                                            height='20'
                                            fill='white'
                                        />
                                    </clipPath>
                                </defs>
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BankAccountList;
