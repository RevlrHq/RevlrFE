import React from 'react';
import { CelebrationIcon } from '@src/icons';
import Image from 'next/image';

interface IEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: {
        title: string;
        date: string;
        time: string;
        location: string;
        image: string;
    };
}

const EventModal = ({ isOpen, onClose }: IEventModalProps) => {
    return (
        isOpen && (
            <div className='fixed inset-0 z-10 flex items-center justify-center bg-black p-4 opacity-90'>
                <div className='w-full max-w-xl overflow-hidden rounded-lg bg-white px-4 py-8 shadow-xl'>
                    <div className='flex flex-col gap-8'>
                        <div className='flex flex-row justify-between'>
                            <div className='flex flex-col gap-4'>
                                <CelebrationIcon />
                                <h3 className='font-inter text-lg font-semibold text-[#001433]'>
                                    Event Purchased!
                                </h3>
                                <p className='font-inter text-sm font-normal text-[#374252]'>
                                    You're all confirmed and ready to shake it!
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className='size-8 items-center rounded-full bg-black p-1 text-white opacity-30'
                            >
                                <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    className='size-5'
                                    viewBox='0 0 20 20'
                                    fill='currentColor'
                                >
                                    <path
                                        fillRule='evenodd'
                                        d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                                        clipRule='evenodd'
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Event Card */}
                        <div className=''>
                            <div className='flex flex-row gap-10'>
                                <div className='relative size-36 overflow-hidden'>
                                    <Image
                                        src='/assets/images/event-image.png'
                                        alt='sanda-music-festival'
                                        fill
                                        className='object-cover'
                                    />
                                </div>

                                {/* Event Info */}
                                <div className='flex flex-col gap-4'>
                                    <h4 className='font-inter text-xl font-medium text-[#001433]'>
                                        Samba Music Festival 2025
                                    </h4>
                                    <div className='flex items-center gap-2'>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            className='mr-1 size-4'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                                            />
                                        </svg>
                                        <span className='font-inter text-sm font-medium text-[#374252]'>
                                            23rd Monday, Apr 8, 2025
                                        </span>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            className='mr-1 size-4'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                                            />
                                        </svg>
                                        <span className='font-inter text-sm font-medium text-[#374252]'>
                                            6:00 PM - 11:30 PM
                                        </span>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            className='mr-1 size-4'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
                                        >
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                                            />
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth={2}
                                                d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                                            />
                                        </svg>
                                        <span className='font-inter text-sm font-medium text-[#374252]'>
                                            Central Park, 1st Avenue Road, Echo
                                            City
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className='flex justify-between rounded-xl border bg-[#F1F6FF] p-8'>
                            <h2 className='font-inter text-sm font-semibold text-[#001433]'>
                                Share Event:
                            </h2>
                            <div className='flex space-x-10'>
                                <button className='flex size-8 items-center justify-center rounded-full bg-blue-500 text-white'>
                                    <svg
                                        width='40'
                                        height='40'
                                        viewBox='0 0 40 40'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <g clip-path='url(#clip0_1268_7001)'>
                                            <path
                                                d='M19.9965 39.9695C31.0337 39.9695 39.9812 31.022 39.9812 19.9847C39.9812 8.94747 31.0337 0 19.9965 0C8.95919 0 0.0117188 8.94747 0.0117188 19.9847C0.0117188 31.022 8.95919 39.9695 19.9965 39.9695Z'
                                                fill='#0066FF'
                                            />
                                            <path
                                                d='M34.1313 5.88208C41.9359 13.6866 41.9362 26.3408 34.131 34.1459C26.3261 41.9504 13.6717 41.9504 5.86719 34.1459L34.1313 5.88208Z'
                                                fill='#0066FF'
                                            />
                                            <path
                                                d='M39.8508 22.2355L25.3945 7.77881L17.8887 15.2845L18.3359 15.7317L14.0625 20.0047L17.5602 23.5025L17.1002 23.9623L20.887 27.749L16.5214 32.1146L23.9791 39.5723C32.3889 37.8704 38.8804 30.8883 39.8508 22.2355Z'
                                                fill='#0066FF'
                                            />
                                            <path
                                                d='M16.5023 12.5599C16.5023 13.173 16.5023 15.9114 16.5023 15.9114H14.0469V20.01H16.5023V32.1883H21.5463V20.01H24.931C24.931 20.01 25.2481 18.0444 25.4015 15.896C24.9609 15.896 21.5655 15.896 21.5655 15.896C21.5655 15.896 21.5655 13.5113 21.5655 13.0934C21.5655 12.675 22.1152 12.1117 22.6589 12.1117C23.2017 12.1117 24.3469 12.1117 25.4072 12.1117C25.4072 11.5531 25.4072 9.62539 25.4072 7.84497C23.9915 7.84497 22.3809 7.84497 21.6706 7.84497C16.3774 7.84472 16.5023 11.9471 16.5023 12.5599Z'
                                                fill='white'
                                            />
                                        </g>
                                        <defs>
                                            <clipPath id='clip0_1268_7001'>
                                                <rect
                                                    width='40'
                                                    height='40'
                                                    fill='white'
                                                />
                                            </clipPath>
                                        </defs>
                                    </svg>
                                </button>
                                <button className='flex size-8 items-center justify-center rounded-full bg-blue-400 text-white'>
                                    <svg
                                        width='42'
                                        height='42'
                                        viewBox='0 0 42 42'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <path
                                            d='M21 41C32.0457 41 41 32.0457 41 21C41 9.9543 32.0457 1 21 1C9.95431 1 1 9.9543 1 21C1 32.0457 9.95431 41 21 41Z'
                                            fill='#0066FF'
                                            stroke='white'
                                            stroke-width='0.0332412'
                                            stroke-miterlimit='10'
                                        />
                                        <path
                                            d='M8.68134 9.41309L18.2411 22.1952L8.62109 32.5876H10.7863L19.2088 23.4887L26.0137 32.5876H33.3817L23.2838 19.0867L32.2382 9.41309H30.0729L22.3165 17.7928L16.0493 9.41309H8.68134ZM11.8654 11.0078H15.2502L30.1971 30.9929H26.8124L11.8654 11.0078Z'
                                            fill='white'
                                        />
                                    </svg>
                                </button>
                                <button className='flex size-8 items-center justify-center rounded-full bg-blue-300 text-white'>
                                    <svg
                                        width='40'
                                        height='40'
                                        viewBox='0 0 40 40'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <g clip-path='url(#clip0_1268_7011)'>
                                            <path
                                                d='M20 39.9995C31.0457 39.9995 40 31.0452 40 19.9995C40 8.95382 31.0457 -0.000488281 20 -0.000488281C8.9543 -0.000488281 0 8.95382 0 19.9995C0 31.0452 8.9543 39.9995 20 39.9995Z'
                                                fill='#0066FF'
                                            />
                                            <path
                                                d='M20 10.1622C23.2041 10.1622 23.5837 10.1744 24.849 10.2321C26.019 10.2855 26.6544 10.481 27.0773 10.6453C27.6374 10.863 28.0371 11.123 28.457 11.5429C28.877 11.9629 29.137 12.3626 29.3547 12.9227C29.519 13.3456 29.7145 13.981 29.7679 15.1509C29.8256 16.4163 29.8378 16.7958 29.8378 19.9999C29.8378 23.2041 29.8256 23.5836 29.7679 24.849C29.7145 26.019 29.519 26.6543 29.3547 27.0772C29.137 27.6373 28.877 28.0371 28.4571 28.457C28.0371 28.8769 27.6374 29.1369 27.0773 29.3546C26.6544 29.519 26.019 29.7144 24.849 29.7678C23.5839 29.8255 23.2044 29.8378 20 29.8378C16.7956 29.8378 16.4162 29.8255 15.151 29.7678C13.981 29.7144 13.3456 29.519 12.9227 29.3546C12.3626 29.1369 11.9629 28.8769 11.543 28.457C11.1231 28.0371 10.863 27.6373 10.6453 27.0772C10.481 26.6543 10.2855 26.019 10.2321 24.849C10.1744 23.5836 10.1622 23.2041 10.1622 19.9999C10.1622 16.7958 10.1744 16.4163 10.2321 15.1509C10.2855 13.981 10.481 13.3456 10.6453 12.9227C10.863 12.3626 11.123 11.9629 11.543 11.543C11.9629 11.123 12.3626 10.863 12.9227 10.6453C13.3456 10.481 13.981 10.2855 15.151 10.2321C16.4163 10.1744 16.7959 10.1622 20 10.1622ZM20 8C16.741 8 16.3323 8.0138 15.0524 8.0722C13.7752 8.1305 12.9028 8.3333 12.1395 8.63C11.3504 8.9366 10.6812 9.3469 10.0141 10.0141C9.3469 10.6812 8.9366 11.3504 8.63 12.1395C8.3333 12.9028 8.1305 13.7751 8.0722 15.0524C8.0138 16.3323 8 16.741 8 19.9999C8 23.259 8.0138 23.6676 8.0722 24.9475C8.1305 26.2248 8.3333 27.0971 8.63 27.8604C8.9366 28.6495 9.3469 29.3187 10.0141 29.9859C10.6812 30.653 11.3504 31.0633 12.1395 31.3699C12.9028 31.6666 13.7752 31.8694 15.0524 31.9277C16.3323 31.9861 16.741 31.9999 20 31.9999C23.259 31.9999 23.6677 31.9861 24.9476 31.9277C26.2248 31.8694 27.0972 31.6666 27.8605 31.3699C28.6496 31.0633 29.3188 30.653 29.9859 29.9859C30.653 29.3187 31.0634 28.6495 31.37 27.8604C31.6667 27.0971 31.8695 26.2248 31.9278 24.9475C31.9862 23.6676 32 23.259 32 19.9999C32 16.741 31.9862 16.3323 31.9278 15.0524C31.8695 13.7751 31.6667 12.9028 31.37 12.1395C31.0634 11.3504 30.653 10.6812 29.9859 10.0141C29.3188 9.3469 28.6496 8.9366 27.8605 8.63C27.0972 8.3333 26.2248 8.1305 24.9476 8.0722C23.6677 8.0138 23.259 8 20 8Z'
                                                fill='white'
                                            />
                                            <path
                                                d='M20.0058 13.8428C16.6025 13.8428 13.8438 16.6016 13.8438 20.0049C13.8438 23.4082 16.6025 26.167 20.0058 26.167C23.4092 26.167 26.1681 23.4082 26.1681 20.0049C26.1681 16.6016 23.4092 13.8428 20.0058 13.8428ZM20.0058 24.0049C17.7967 24.0049 16.0058 22.214 16.0058 20.0049C16.0058 17.7958 17.7967 16.0049 20.0058 16.0049C22.215 16.0049 24.0058 17.7958 24.0058 20.0049C24.0058 22.214 22.215 24.0049 20.0058 24.0049Z'
                                                fill='white'
                                            />
                                            <path
                                                d='M27.8527 13.5968C27.8527 14.392 27.208 15.0368 26.4127 15.0368C25.6174 15.0368 24.9727 14.392 24.9727 13.5968C24.9727 12.8015 25.6174 12.1567 26.4127 12.1567C27.208 12.1567 27.8527 12.8015 27.8527 13.5968Z'
                                                fill='white'
                                            />
                                        </g>
                                        <defs>
                                            <clipPath id='clip0_1268_7011'>
                                                <rect
                                                    width='40'
                                                    height='40'
                                                    fill='white'
                                                />
                                            </clipPath>
                                        </defs>
                                    </svg>
                                </button>
                                <button className='flex size-8 items-center justify-center rounded-full bg-blue-200 text-white'>
                                    <svg
                                        width='40'
                                        height='40'
                                        viewBox='0 0 40 40'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <rect
                                            width='40'
                                            height='40'
                                            rx='20'
                                            fill='#0066FF'
                                        />
                                        <path
                                            d='M20.0011 12.929L17.8798 15.0504C17.4909 15.4393 17.4909 16.0757 17.8798 16.4646C18.2687 16.8535 18.9051 16.8535 19.294 16.4646L21.4153 14.3433C22.5821 13.1765 24.4913 13.1765 25.658 14.3433C26.8247 15.51 26.8247 17.4192 25.658 18.5859L23.5367 20.7072C23.1478 21.0961 23.1478 21.7325 23.5367 22.1214C23.9256 22.5103 24.562 22.5103 24.9509 22.1214L27.0722 20.0001C29.0238 18.0485 29.0238 14.8807 27.0722 12.929C25.1206 10.9774 21.9527 10.9774 20.0011 12.929ZM17.1727 22.8285C17.5616 23.2174 18.198 23.2174 18.5869 22.8285L22.8296 18.5859C23.2185 18.197 23.2185 17.5606 22.8296 17.1717C22.4407 16.7828 21.8043 16.7828 21.4153 17.1717L17.1727 21.4143C16.7838 21.8032 16.7838 22.4396 17.1727 22.8285ZM20.7082 23.5356L18.5869 25.657C17.4202 26.8237 15.511 26.8237 14.3443 25.657C13.1776 24.4902 13.1776 22.5811 14.3443 21.4143L16.4656 19.293C16.8545 18.9041 16.8545 18.2677 16.4656 17.8788C16.0767 17.4899 15.4403 17.4899 15.0514 17.8788L12.9301 20.0001C10.9785 21.9517 10.9785 25.1196 12.9301 27.0712C14.8817 29.0228 18.0495 29.0228 20.0011 27.0712L22.1225 24.9499C22.5114 24.5609 22.5114 23.9246 22.1225 23.5356C21.7335 23.1467 21.0971 23.1467 20.7082 23.5356Z'
                                            fill='white'
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className='flex justify-between'>
                            <div></div>
                            <button className='rounded-md border border-[#E4E6EB] bg-white px-6 py-4 font-inter text-sm font-semibold text-[#001433]'>
                                Manage Event
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    );
};

export default EventModal;
