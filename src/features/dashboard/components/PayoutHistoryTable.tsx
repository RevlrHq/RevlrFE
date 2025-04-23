import React from 'react';

interface Payout {
    id: number;
    amount: number;
    date: string;
    time: string;
    bankAccount: string;
    status: string;
}

interface PayoutHistoryTableProps {
    payouts: Payout[];
}

const PayoutHistoryTable: React.FC<PayoutHistoryTableProps> = ({ payouts }) => {
    const formatAmount = (amount: number) => {
        return `$${(amount / 100).toFixed(2).replace(/\.00$/, '')}`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Completed':
                return (
                    <span className='flex w-[90px] items-center justify-center rounded-full border border-[#22C55E] bg-[#F1FDF4] px-2 py-1 font-inter text-sm font-medium text-[#13803D]'>
                        Completed
                    </span>
                );
            case 'Processing':
                return (
                    <span className='flex w-[90px] items-center justify-center rounded-full border border-[#F59E0B] bg-[#FFFBEA] px-2 py-1 font-inter text-sm font-medium text-[#B45407]'>
                        Processing
                    </span>
                );
            case 'Failed':
                return (
                    <span className='flex w-[90px] items-center justify-center rounded-full border border-[#EF4444] bg-[#FEF3F3] px-2 py-1 font-inter text-sm font-medium text-[#B91C1D]'>
                        Failed
                    </span>
                );
            default:
                return (
                    <span className='flex w-[90px] items-center justify-center rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-sm font-medium text-gray-800'>
                        {status}
                    </span>
                );
        }
    };
    return (
        <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
                <thead>
                    <tr>
                        <th
                            scope='col'
                            className='px-6 py-3 text-left font-inter text-xs font-medium uppercase tracking-wider text-[#6B7380]'
                        >
                            Amount
                        </th>
                        <th
                            scope='col'
                            className='px-6 py-3 text-left font-inter text-xs font-medium uppercase tracking-wider text-[#6B7380]'
                        >
                            Date & Time
                        </th>
                        <th
                            scope='col'
                            className='px-6 py-3 text-left font-inter text-xs font-medium uppercase tracking-wider text-[#6B7380]'
                        >
                            Bank Account
                        </th>
                        <th
                            scope='col'
                            className='px-6 py-3 text-left font-inter text-xs font-medium uppercase tracking-wider text-[#6B7380]'
                        >
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 bg-white'>
                    {payouts.map((payout) => (
                        <tr key={payout.id}>
                            <td className='whitespace-nowrap px-6 py-4 font-inter text-sm font-medium text-black'>
                                {formatAmount(payout.amount)}
                            </td>
                            <td className='whitespace-nowrap px-6 py-4 font-inter text-sm font-medium text-black'>
                                {payout.date} | {payout.time}
                            </td>
                            <td className='whitespace-nowrap px-6 py-4 font-inter text-sm font-medium text-black'>
                                {payout.bankAccount}
                            </td>
                            <td className='whitespace-nowrap px-6 py-4'>
                                {getStatusBadge(payout.status)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PayoutHistoryTable;
