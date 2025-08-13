'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@src/stores/authStore';
import { useTheme } from '@lib/ThemeContext';

const VendorAccessPage = () => {
    const router = useRouter();
    const { user } = useAuthStore();
    const { theme } = useTheme();

    const handleGoBack = () => {
        router.push('/dashboard');
    };

    const handleContactSupport = () => {
        // This could be replaced with a contact form or support system
        window.open(
            'mailto:support@revlr.com?subject=Vendor Access Request',
            '_blank'
        );
    };

    const handleUpgradeRequest = () => {
        // This could redirect to a vendor application form
        router.push('/dashboard/vendor-application');
    };

    return (
        <div
            className={`min-h-screen transition-colors duration-200 ${
                theme === 'dark'
                    ? 'bg-revlr-dark-bg text-white'
                    : 'bg-gray-50 text-gray-900'
            }`}
        >
            <div className='flex min-h-screen items-center justify-center p-6'>
                <div
                    className={`w-full max-w-md rounded-xl border p-8 shadow-lg ${
                        theme === 'dark'
                            ? 'border-revlr-dark-border bg-revlr-dark-card'
                            : 'border-gray-200 bg-white'
                    }`}
                >
                    {/* Icon */}
                    <div className='mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple'>
                        <svg
                            className='size-8 text-white'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                            />
                        </svg>
                    </div>

                    {/* Title */}
                    <h1 className='mb-4 text-center font-inter text-2xl font-bold'>
                        Vendor Access Required
                    </h1>

                    {/* Description */}
                    <p
                        className={`mb-6 text-center font-inter text-sm ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}
                    >
                        Hi {user?.firstName || 'there'}! To create and manage
                        events, you need vendor access. This helps us ensure
                        quality events and proper event management.
                    </p>

                    {/* Features List */}
                    <div className='mb-8 space-y-3'>
                        <h3 className='font-inter text-sm font-semibold'>
                            With vendor access, you can:
                        </h3>
                        <ul className='space-y-2'>
                            {[
                                'Create and publish events',
                                'Manage ticket sales',
                                'Track event analytics',
                                'Handle attendee communications',
                                'Access payout management',
                            ].map((feature, index) => (
                                <li
                                    key={index}
                                    className='flex items-center space-x-3'
                                >
                                    <div className='size-2 rounded-full bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple'></div>
                                    <span
                                        className={`font-inter text-sm ${
                                            theme === 'dark'
                                                ? 'text-gray-300'
                                                : 'text-gray-600'
                                        }`}
                                    >
                                        {feature}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className='space-y-3'>
                        <button
                            onClick={handleUpgradeRequest}
                            className='w-full rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 font-inter font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl'
                        >
                            Request Vendor Access
                        </button>

                        <button
                            onClick={handleContactSupport}
                            className={`w-full rounded-xl border px-6 py-3 font-inter font-medium transition-all duration-200 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/20'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Contact Support
                        </button>

                        <button
                            onClick={handleGoBack}
                            className={`w-full font-inter text-sm font-medium transition-colors duration-200 ${
                                theme === 'dark'
                                    ? 'text-gray-400 hover:text-gray-300'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Back to Dashboard
                        </button>
                    </div>

                    {/* Additional Info */}
                    <div
                        className={`mt-6 rounded-lg p-4 ${
                            theme === 'dark'
                                ? 'bg-revlr-dark-border/20'
                                : 'bg-gray-50'
                        }`}
                    >
                        <p
                            className={`font-inter text-xs ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-500'
                            }`}
                        >
                            <strong>Note:</strong> Vendor access is typically
                            approved within 24-48 hours. You&apos;ll receive an
                            email confirmation once your access is activated.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorAccessPage;
