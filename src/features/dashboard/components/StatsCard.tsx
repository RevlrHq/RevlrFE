import React from 'react';

interface StatsCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle?: string;
    textColor?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
    icon,
    title,
    value,
    subtitle = null,
    textColor = '#001433',
}) => {
    return (
        <div className='flex flex-col gap-4 rounded-lg bg-white px-6 py-4 shadow-sm'>
            <div className='mr-4 flex flex-row items-center gap-4'>
                <div>{icon}</div>
                <p className='mb-1 font-inter text-sm font-medium text-[#9DA4B0]'>
                    {title}
                </p>
            </div>
            <div>
                <p className={`font-inter text-2xl font-semibold ${textColor}`}>
                    {value}
                </p>
                {subtitle && (
                    <p className='mt-1 font-inter text-xs font-normal text-[#4C5563]'>
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatsCard;
