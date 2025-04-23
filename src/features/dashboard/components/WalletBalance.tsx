import React from 'react';

interface WalletBalanceProps {
    title: string;
    amount: string;
    icon: 'wallet' | 'pending';
}

const WalletBalance: React.FC<WalletBalanceProps> = ({
    title,
    amount,
    icon,
}) => {
    return (
        <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-2 text-sm text-gray-500'>
                <span className='flex size-5 items-center justify-center font-inter text-sm font-medium text-[#9DA4B0]'>
                    {icon === 'wallet' ? (
                        <svg
                            width='16'
                            height='16'
                            viewBox='0 0 16 16'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M6.33366 10.6667V5.33333C6.33366 4.6 6.92699 4 7.66699 4H13.667V3.33333C13.667 2.6 13.067 2 12.3337 2H3.00033C2.26033 2 1.66699 2.6 1.66699 3.33333V12.6667C1.66699 13.4 2.26033 14 3.00033 14H12.3337C13.067 14 13.667 13.4 13.667 12.6667V12H7.66699C6.92699 12 6.33366 11.4 6.33366 10.6667ZM8.33366 5.33333C7.96699 5.33333 7.66699 5.63333 7.66699 6V10C7.66699 10.3667 7.96699 10.6667 8.33366 10.6667H14.3337V5.33333H8.33366ZM10.3337 9C9.78033 9 9.33366 8.55333 9.33366 8C9.33366 7.44667 9.78033 7 10.3337 7C10.887 7 11.3337 7.44667 11.3337 8C11.3337 8.55333 10.887 9 10.3337 9Z'
                                fill='#3D8BFF'
                            />
                        </svg>
                    ) : (
                        <svg
                            width='14'
                            height='12'
                            viewBox='0 0 14 12'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M5.33366 8.66667V3.33333C5.33366 2.6 5.92699 2 6.66699 2H12.667V1.33333C12.667 0.6 12.067 0 11.3337 0H2.00033C1.26033 0 0.666992 0.6 0.666992 1.33333V10.6667C0.666992 11.4 1.26033 12 2.00033 12H11.3337C12.067 12 12.667 11.4 12.667 10.6667V10H6.66699C5.92699 10 5.33366 9.4 5.33366 8.66667ZM7.33366 3.33333C6.96699 3.33333 6.66699 3.63333 6.66699 4V8C6.66699 8.36667 6.96699 8.66667 7.33366 8.66667H13.3337V3.33333H7.33366ZM9.33366 7C8.78033 7 8.33366 6.55333 8.33366 6C8.33366 5.44667 8.78033 5 9.33366 5C9.88699 5 10.3337 5.44667 10.3337 6C10.3337 6.55333 9.88699 7 9.33366 7Z'
                                fill='#3D8BFF'
                            />
                        </svg>
                    )}
                </span>
                {title}
            </div>
            <div className='font-inter text-2xl font-semibold text-[#001433]'>
                {amount}
            </div>
        </div>
    );
};

export default WalletBalance;
