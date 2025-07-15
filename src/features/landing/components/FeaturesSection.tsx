'use client';

import { useState } from 'react';

const FeaturesSection = () => {
    const [activeFeature, setActiveFeature] = useState(0);

    const features = [
        {
            id: 'event-management',
            title: 'Complete Event Management',
            description:
                'Create, manage, and publish events with our intuitive dashboard. From drafts to live events, handle everything in one place.',
            icon: '🎯',
            color: 'from-revlr-primary-blue to-revlr-accent-purple',
            capabilities: [
                'Create and edit events',
                'Draft and publish workflow',
                'Event categorization',
                'Location management',
                'Date and time scheduling',
            ],
        },
        {
            id: 'smart-ticketing',
            title: 'Smart Ticketing System',
            description:
                'Advanced ticketing with multiple tiers, pricing strategies, and real-time inventory management.',
            icon: '🎫',
            color: 'from-revlr-accent-green to-revlr-accent-orange',
            capabilities: [
                'Multiple ticket types',
                'Dynamic pricing',
                'Inventory tracking',
                'Bulk ticket creation',
                'QR code generation',
            ],
        },
        {
            id: 'payment-processing',
            title: 'Flexible Payment Solutions',
            description:
                'Secure payment processing with multiple options including financing for expensive tickets.',
            icon: '💳',
            color: 'from-revlr-accent-purple to-revlr-primary-blue',
            capabilities: [
                'Multiple payment methods',
                'Financing eligibility checks',
                'Recurring payments',
                'Paystack integration',
                'Secure transactions',
            ],
        },
        {
            id: 'analytics',
            title: 'Real-time Analytics',
            description:
                'Comprehensive insights into your events with detailed analytics and reporting.',
            icon: '📊',
            color: 'from-revlr-accent-orange to-revlr-primary-yellow',
            capabilities: [
                'Sales tracking',
                'Attendee analytics',
                'Revenue reports',
                'Performance metrics',
                'Export capabilities',
            ],
        },
        {
            id: 'resale-marketplace',
            title: 'Ticket Resale Marketplace',
            description:
                "Built-in marketplace for attendees to safely resell tickets they can't use.",
            icon: '🔄',
            color: 'from-revlr-primary-yellow to-revlr-accent-green',
            capabilities: [
                'Secure ticket transfers',
                'Price verification',
                'Fraud protection',
                'Instant notifications',
                'Commission management',
            ],
        },
        {
            id: 'authentication',
            title: 'Passwordless Authentication',
            description:
                'Seamless user experience with email-based authentication system.',
            icon: '🔐',
            color: 'from-revlr-accent-purple to-revlr-accent-orange',
            capabilities: [
                'Email verification',
                'Magic link login',
                'User registration',
                'Secure sessions',
                'Account management',
            ],
        },
    ];

    return (
        <section className='bg-gradient-to-br from-gray-50 to-white py-24 transition-all duration-500 dark:from-revlr-dark-bg dark:to-revlr-dark-card'>
            <div className='mx-auto max-w-[1440px] px-6 md:px-24'>
                {/* Section Header */}
                <div className='mb-16 text-center'>
                    <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-revlr-primary-blue/20 bg-gradient-to-r from-revlr-primary-blue/10 to-revlr-accent-purple/10 px-4 py-2 dark:from-revlr-primary-blue/20 dark:to-revlr-accent-purple/20'>
                        <span className='text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                            ⚡
                        </span>
                        <span className='text-sm font-medium text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                            Powerful Features
                        </span>
                    </div>

                    <h2 className='mb-6 font-montserrat text-4xl font-bold text-gray-900 dark:text-white md:text-5xl'>
                        Everything You Need to
                        <span className='bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple bg-clip-text text-transparent'>
                            {' '}
                            Succeed
                        </span>
                    </h2>

                    <p className='mx-auto max-w-3xl text-xl text-gray-600 dark:text-gray-300'>
                        From event creation to payment processing, our
                        comprehensive platform handles every aspect of event
                        management with cutting-edge technology.
                    </p>
                </div>

                {/* Features Grid */}
                <div className='grid items-start gap-12 lg:grid-cols-2'>
                    {/* Feature Cards */}
                    <div className='space-y-4'>
                        {features.map((feature, index) => (
                            <div
                                key={feature.id}
                                className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 ${
                                    activeFeature === index
                                        ? 'border-2 border-revlr-primary-blue/20 bg-white shadow-xl dark:border-revlr-primary-yellow/20 dark:bg-revlr-dark-card'
                                        : 'border border-gray-200/50 bg-white/60 hover:bg-white hover:shadow-lg dark:border-revlr-dark-border dark:bg-revlr-dark-card/60 dark:hover:bg-revlr-dark-card'
                                }`}
                                onClick={() => setActiveFeature(index)}
                            >
                                <div className='flex items-start gap-4'>
                                    <div
                                        className={`rounded-xl bg-gradient-to-r p-3 ${feature.color} text-2xl text-white`}
                                    >
                                        {feature.icon}
                                    </div>
                                    <div className='flex-1'>
                                        <h3 className='mb-2 text-lg font-semibold text-gray-900 dark:text-white'>
                                            {feature.title}
                                        </h3>
                                        <p className='text-sm leading-relaxed text-gray-600 dark:text-gray-300'>
                                            {feature.description}
                                        </p>
                                        {activeFeature === index && (
                                            <div className='mt-4 space-y-2'>
                                                {feature.capabilities.map(
                                                    (capability, capIndex) => (
                                                        <div
                                                            key={capIndex}
                                                            className='flex items-center gap-2'
                                                        >
                                                            <div className='size-1.5 rounded-full bg-revlr-primary-blue dark:bg-revlr-primary-yellow'></div>
                                                            <span className='text-sm text-gray-700 dark:text-gray-300'>
                                                                {capability}
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className={`size-2 rounded-full transition-all duration-300 ${
                                            activeFeature === index
                                                ? 'bg-revlr-primary-blue dark:bg-revlr-primary-yellow'
                                                : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Feature Visualization */}
                    <div className='sticky top-8'>
                        <div className='relative overflow-hidden rounded-2xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50 p-8 shadow-2xl dark:border-revlr-dark-border dark:from-revlr-dark-card dark:to-revlr-dark-bg'>
                            {/* Background Pattern */}
                            <div className='bg-[url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%230066FF" fill-opacity="0.03"%3E%3Ccircle cx="20" cy="20" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] dark:bg-[url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23FFD700" fill-opacity="0.03"%3E%3Ccircle cx="20" cy="20" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] absolute inset-0'></div>

                            <div className='relative'>
                                {/* Header */}
                                <div className='mb-6 flex items-center justify-between'>
                                    <div className='flex items-center gap-3'>
                                        <div
                                            className={`rounded-lg bg-gradient-to-r p-2 ${features[activeFeature].color} text-xl text-white`}
                                        >
                                            {features[activeFeature].icon}
                                        </div>
                                        <h3 className='font-semibold text-gray-800 dark:text-gray-200'>
                                            {features[activeFeature].title}
                                        </h3>
                                    </div>
                                    <div className='flex gap-1'>
                                        <div className='size-2 rounded-full bg-red-400'></div>
                                        <div className='size-2 rounded-full bg-yellow-400'></div>
                                        <div className='size-2 rounded-full bg-green-400'></div>
                                    </div>
                                </div>

                                {/* Dynamic Content Based on Active Feature */}
                                {activeFeature === 0 && (
                                    <div className='space-y-4'>
                                        <div className='grid grid-cols-2 gap-4'>
                                            <div className='rounded-lg border border-revlr-primary-blue/20 bg-gradient-to-br from-revlr-primary-blue/10 to-revlr-accent-purple/10 p-4'>
                                                <div className='text-lg font-bold text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                                    24
                                                </div>
                                                <div className='text-xs text-gray-600 dark:text-gray-400'>
                                                    Active Events
                                                </div>
                                            </div>
                                            <div className='rounded-lg border border-revlr-accent-green/20 bg-gradient-to-br from-revlr-accent-green/10 to-revlr-accent-orange/10 p-4'>
                                                <div className='text-lg font-bold text-revlr-accent-green'>
                                                    12
                                                </div>
                                                <div className='text-xs text-gray-600 dark:text-gray-400'>
                                                    Draft Events
                                                </div>
                                            </div>
                                        </div>
                                        <div className='space-y-2'>
                                            {[
                                                'Tech Conference 2024',
                                                'Music Festival Lagos',
                                                'Startup Pitch Night',
                                            ].map((event, i) => (
                                                <div
                                                    key={i}
                                                    className='flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-revlr-dark-bg'
                                                >
                                                    <span className='text-sm font-medium text-gray-800 dark:text-gray-200'>
                                                        {event}
                                                    </span>
                                                    <span className='rounded-full bg-revlr-accent-green/20 px-2 py-1 text-xs text-revlr-accent-green'>
                                                        Live
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeFeature === 1 && (
                                    <div className='space-y-4'>
                                        <div className='grid grid-cols-3 gap-3'>
                                            {[
                                                'Early Bird',
                                                'Regular',
                                                'VIP',
                                            ].map((tier, i) => (
                                                <div
                                                    key={i}
                                                    className='rounded-lg border border-gray-200 bg-gradient-to-br from-gray-100 to-gray-50 p-3 dark:border-revlr-dark-border dark:from-revlr-dark-bg dark:to-revlr-dark-card'
                                                >
                                                    <div className='text-sm font-medium text-gray-800 dark:text-gray-200'>
                                                        {tier}
                                                    </div>
                                                    <div className='text-lg font-bold text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                                        ₦{(i + 1) * 5000}
                                                    </div>
                                                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                        {100 - i * 20} left
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className='rounded-lg border border-revlr-accent-green/20 bg-gradient-to-r from-revlr-accent-green/10 to-revlr-accent-orange/10 p-4'>
                                            <div className='mb-2 text-sm text-gray-600 dark:text-gray-400'>
                                                Total Sales
                                            </div>
                                            <div className='text-2xl font-bold text-revlr-accent-green'>
                                                ₦847,500
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeFeature === 2 && (
                                    <div className='space-y-4'>
                                        <div className='grid grid-cols-2 gap-4'>
                                            <div className='rounded-lg border border-revlr-accent-purple/20 bg-gradient-to-br from-revlr-accent-purple/10 to-revlr-primary-blue/10 p-4'>
                                                <div className='text-lg font-bold text-revlr-accent-purple'>
                                                    ₦2.4M
                                                </div>
                                                <div className='text-xs text-gray-600 dark:text-gray-400'>
                                                    Total Revenue
                                                </div>
                                            </div>
                                            <div className='rounded-lg border border-revlr-primary-yellow/20 bg-gradient-to-br from-revlr-primary-yellow/10 to-revlr-accent-orange/10 p-4'>
                                                <div className='text-lg font-bold text-revlr-accent-orange'>
                                                    156
                                                </div>
                                                <div className='text-xs text-gray-600 dark:text-gray-400'>
                                                    Financing Apps
                                                </div>
                                            </div>
                                        </div>
                                        <div className='space-y-2'>
                                            {[
                                                'Paystack',
                                                'Bank Transfer',
                                                'Financing',
                                            ].map((method, i) => (
                                                <div
                                                    key={i}
                                                    className='flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-revlr-dark-bg'
                                                >
                                                    <span className='text-sm font-medium text-gray-800 dark:text-gray-200'>
                                                        {method}
                                                    </span>
                                                    <span className='text-sm font-bold text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                                        {85 - i * 15}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeFeature === 3 && (
                                    <div className='space-y-4'>
                                        <div className='flex h-32 items-center justify-center rounded-lg border border-revlr-primary-blue/20 bg-gradient-to-r from-revlr-primary-blue/10 to-revlr-accent-purple/10'>
                                            <div className='text-center'>
                                                <div className='mb-1 text-2xl font-bold text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                                                    📈
                                                </div>
                                                <div className='text-sm text-gray-600 dark:text-gray-400'>
                                                    Sales Trending Up
                                                </div>
                                            </div>
                                        </div>
                                        <div className='grid grid-cols-2 gap-4'>
                                            <div className='text-center'>
                                                <div className='text-lg font-bold text-gray-800 dark:text-gray-200'>
                                                    1,247
                                                </div>
                                                <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                    Attendees
                                                </div>
                                            </div>
                                            <div className='text-center'>
                                                <div className='text-lg font-bold text-gray-800 dark:text-gray-200'>
                                                    4.8★
                                                </div>
                                                <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                    Rating
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeFeature === 4 && (
                                    <div className='space-y-4'>
                                        <div className='rounded-lg border border-revlr-primary-yellow/20 bg-gradient-to-r from-revlr-primary-yellow/10 to-revlr-accent-green/10 p-4'>
                                            <div className='mb-2 text-sm text-gray-600 dark:text-gray-400'>
                                                Marketplace Activity
                                            </div>
                                            <div className='text-2xl font-bold text-revlr-accent-green'>
                                                89 Tickets
                                            </div>
                                            <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                Available for resale
                                            </div>
                                        </div>
                                        <div className='space-y-2'>
                                            {[
                                                'VIP Ticket - ₦15,000',
                                                'Regular - ₦8,500',
                                                'Early Bird - ₦5,000',
                                            ].map((ticket, i) => (
                                                <div
                                                    key={i}
                                                    className='flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-revlr-dark-bg'
                                                >
                                                    <span className='text-sm font-medium text-gray-800 dark:text-gray-200'>
                                                        {ticket}
                                                    </span>
                                                    <span className='rounded-full bg-revlr-accent-green/20 px-2 py-1 text-xs text-revlr-accent-green'>
                                                        Available
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeFeature === 5 && (
                                    <div className='space-y-4'>
                                        <div className='rounded-lg border border-revlr-accent-purple/20 bg-gradient-to-r from-revlr-accent-purple/10 to-revlr-accent-orange/10 p-4'>
                                            <div className='mb-2 text-sm text-gray-600 dark:text-gray-400'>
                                                Authentication Status
                                            </div>
                                            <div className='text-2xl font-bold text-revlr-accent-purple'>
                                                Secure
                                            </div>
                                            <div className='text-xs text-gray-500 dark:text-gray-400'>
                                                Email verified
                                            </div>
                                        </div>
                                        <div className='space-y-2'>
                                            {[
                                                'Magic Link Sent',
                                                'Email Verified',
                                                'Session Active',
                                            ].map((status, i) => (
                                                <div
                                                    key={i}
                                                    className='flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-revlr-dark-bg'
                                                >
                                                    <span className='text-sm font-medium text-gray-800 dark:text-gray-200'>
                                                        {status}
                                                    </span>
                                                    <span className='rounded-full bg-revlr-accent-green/20 px-2 py-1 text-xs text-revlr-accent-green'>
                                                        ✓
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className='mt-16 text-center'>
                    <div className='inline-flex flex-col gap-4 sm:flex-row'>
                        <button className='rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl'>
                            Start Building Events
                        </button>
                        <button className='rounded-xl border-2 border-revlr-primary-blue px-8 py-4 font-semibold text-revlr-primary-blue transition-all duration-200 hover:bg-revlr-primary-blue hover:text-white dark:border-revlr-primary-yellow dark:text-revlr-primary-yellow dark:hover:bg-revlr-primary-yellow dark:hover:text-revlr-dark-bg'>
                            View Documentation
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
