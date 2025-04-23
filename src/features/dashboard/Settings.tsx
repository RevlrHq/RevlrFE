'use client';

import { useState } from 'react';
import { SelectIcon } from '@src/icons';

const Settings = () => {
    const [firstName, setFirstName] = useState('Moino');
    const [lastName, setLastName] = useState('Chakka');
    const [email, setEmail] = useState('mochi@gmail.com');
    const [phone, setPhone] = useState('95538116');
    const [country] = useState('SG');

    // Notification preferences
    const [notificationChannels, setNotificationChannels] = useState({
        email: true,
        sms: false,
    });

    // Alert preferences
    const [alertPreferences, setAlertPreferences] = useState({
        ticketSales: true,
        payoutUpdates: false,
    });

    // FAQ accordion state
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const handleChannelChange = (channel) => {
        setNotificationChannels({
            ...notificationChannels,
            [channel]: !notificationChannels[channel],
        });
    };

    const handleAlertToggle = (alert) => {
        setAlertPreferences({
            ...alertPreferences,
            [alert]: !alertPreferences[alert],
        });
    };

    const faqs = [
        {
            question: 'How does REVLR help event organizers?',
            answer: 'REVLR provides comprehensive event management tools including ticketing, marketing, and analytics to help event organizers streamline their workflow and maximize attendance.',
        },
        {
            question: 'How do I track ticket sales and attendee engagement?',
            answer: 'You can track ticket sales and attendee engagement through our analytics dashboard, which provides real-time data on sales, check-ins, and attendee interactions.',
        },
        {
            question:
                'What makes REVLR different from other ticketing platforms?',
            answer: 'REVLR offers lower fees, more customization options, integrated marketing tools, and a more user-friendly interface compared to other ticketing platforms.',
        },
        {
            question: 'What payment options do you support?',
            answer: 'We support major credit cards, PayPal, Apple Pay, Google Pay, and bank transfers depending on your region.',
        },
        {
            question: 'Can I use REVLR for free events?',
            answer: 'Yes, REVLR can be used for free events with no platform fees. We only charge a small fee for paid events.',
        },
    ];
    return (
        <div className='m-4 min-h-screen bg-gray-100'>
            <div className='flex flex-col gap-12 rounded-lg bg-white p-6 shadow-sm'>
                <div className='flex flex-col gap-8'>
                    <h2 className='border-b border-[#F2F3F5] pb-6 font-inter text-base font-medium text-[#001433]'>
                        Profile
                    </h2>

                    <div className='flex flex-row gap-16'>
                        <div className='flex-shrink-0'>
                            <div className='relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-blue-100'>
                                <div className='absolute text-2xl font-bold text-blue-600'>
                                    MC
                                </div>
                                <div className='absolute bottom-0 flex h-8 w-full items-center justify-center bg-blue-800'>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='size-5 text-white'
                                        viewBox='0 0 20 20'
                                        fill='currentColor'
                                    >
                                        <path
                                            fillRule='evenodd'
                                            d='M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z'
                                            clipRule='evenodd'
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className='grid flex-grow grid-cols-1 gap-4 md:grid-cols-2'>
                            <div>
                                <input
                                    type='text'
                                    value={firstName}
                                    onChange={(e) =>
                                        setFirstName(e.target.value)
                                    }
                                    className='w-full rounded-lg border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#001433]'
                                    placeholder='First Name'
                                />
                            </div>
                            <div>
                                <input
                                    type='text'
                                    value={lastName}
                                    onChange={(e) =>
                                        setLastName(e.target.value)
                                    }
                                    className='w-full rounded-lg border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#001433]'
                                    placeholder='Last Name'
                                />
                            </div>
                            <div>
                                <input
                                    type='email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className='w-full rounded-lg border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#001433]'
                                    placeholder='Email'
                                />
                            </div>
                            <div className='flex'>
                                <div className='flex w-16 items-center justify-between rounded-l-md border border-gray-300 bg-white px-2'>
                                    <span className='text-sm'>{country}</span>
                                    <span className='text-gray-400'>
                                        <SelectIcon />
                                    </span>
                                </div>
                                <input
                                    type='tel'
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className='grow rounded-r-md border border-l-0 border-gray-300 px-3 py-2'
                                    placeholder='Phone Number'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className='flex justify-end'>
                        <button className='rounded-md bg-[#F1F6FF] px-4 py-3 font-inter text-sm font-semibold text-[#0066FF]'>
                            Save Changes
                        </button>
                    </div>
                </div>

                <div className='flex flex-col gap-8'>
                    <h2 className='border-b border-[#F2F3F5] pb-6 font-inter text-base font-medium text-[#001433]'>
                        Notification Preferences
                    </h2>

                    <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
                        <div>
                            <h3 className='mb-4 font-inter text-sm font-medium text-[#001433]'>
                                Choose notification channels:
                            </h3>
                            <div className='space-y-3'>
                                <label className='flex items-center'>
                                    <input
                                        type='checkbox'
                                        checked={notificationChannels.email}
                                        onChange={() =>
                                            handleChannelChange('email')
                                        }
                                        className='size-4 rounded text-blue-600'
                                    />
                                    <span className='ml-2 font-inter text-sm font-normal text-[#001433]'>
                                        Email
                                    </span>
                                </label>
                                <label className='flex items-center'>
                                    <input
                                        type='checkbox'
                                        checked={notificationChannels.sms}
                                        onChange={() =>
                                            handleChannelChange('sms')
                                        }
                                        className='size-4 rounded text-blue-600'
                                    />
                                    <span className='ml-2 font-inter text-sm font-normal text-[#001433]'>
                                        SMS
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <h3 className='mb-4 font-inter text-sm font-medium text-[#001433]'>
                                Enable/disable alerts for:
                            </h3>
                            <div className='space-y-3'>
                                <div className='flex items-center justify-between'>
                                    <span className='font-inter text-sm font-normal text-[#001433]'>
                                        Ticket sales
                                    </span>
                                    <button
                                        onClick={() =>
                                            handleAlertToggle('ticketSales')
                                        }
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                                            alertPreferences.ticketSales
                                                ? 'bg-blue-600'
                                                : 'bg-gray-200'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block size-4 rounded-full bg-white transition ${
                                                alertPreferences.ticketSales
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='font-inter text-sm font-normal text-[#001433]'>
                                        Payout updates
                                    </span>
                                    <button
                                        onClick={() =>
                                            handleAlertToggle('payoutUpdates')
                                        }
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                                            alertPreferences.payoutUpdates
                                                ? 'bg-blue-600'
                                                : 'bg-gray-200'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block size-4 transform rounded-full bg-white transition ${
                                                alertPreferences.payoutUpdates
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex flex-col gap-8'>
                    <h2 className='border-b border-[#F2F3F5] pb-6 font-inter text-base font-medium text-[#001433]'>
                        Support
                    </h2>

                    <div className='mb-6'>
                        <button className='flex items-center font-inter text-sm font-semibold text-[#0066FF] hover:text-blue-800'>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='mr-2 size-5'
                                viewBox='0 0 20 20'
                                fill='currentColor'
                            >
                                <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z' />
                                <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z' />
                            </svg>
                            Contact Support
                        </button>
                    </div>

                    <h2 className='mb-4 font-inter text-base font-medium text-[#001433]'>
                        FAQs
                    </h2>

                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className='overflow-hidden rounded-lg bg-[#F1F6FF]'
                            >
                                <button
                                    className='flex w-full items-center justify-between px-4 py-3 text-left'
                                    onClick={() => toggleFaq(index)}
                                >
                                    <span className='font-inter text-sm font-medium text-[#1F2938]'>
                                        {faq.question}
                                    </span>
                                    <SelectIcon />
                                </button>
                                {openFaq === index && (
                                    <div className='px-4 pb-3'>
                                        <p className='font-inter text-sm font-normal text-[#1F2938]'>
                                            {faq.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className='border-b border-[#F2F3F5] pb-6 font-inter text-base font-medium text-[#001433]'>
                        Security
                    </h2>

                    <div className='mt-4 flex items-center justify-between'>
                        <p className='font-inter text-sm font-normal text-black'>
                            Set up Two-Factor Authentication (2FA) for added
                            account security
                        </p>
                        <button className='rounded-md bg-[#0066FF] px-4 py-3 font-inter text-sm font-semibold text-white'>
                            Setup 2FA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
