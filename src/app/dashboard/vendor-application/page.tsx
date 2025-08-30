'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@src/stores/authStore';
import { useTheme } from '@lib/ThemeContext';

interface VendorApplicationForm {
    businessName: string;
    businessType: string;
    website: string;
    description: string;
    experience: string;
    eventTypes: string[];
    contactPhone: string;
    businessAddress: string;
    taxId: string;
    agreeToTerms: boolean;
}

const VendorApplicationPage = () => {
    const router = useRouter();
    const { user } = useAuthStore();
    const { theme } = useTheme();

    const [formData, setFormData] = useState<VendorApplicationForm>({
        businessName: '',
        businessType: '',
        website: '',
        description: '',
        experience: '',
        eventTypes: [],
        contactPhone: user?.phoneNumber || '',
        businessAddress: '',
        taxId: '',
        agreeToTerms: false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<VendorApplicationForm>>({});

    const eventTypeOptions = [
        'Conferences & Seminars',
        'Workshops & Training',
        'Music & Entertainment',
        'Sports & Recreation',
        'Food & Beverage',
        'Art & Culture',
        'Business & Networking',
        'Community & Social',
        'Educational',
        'Other',
    ];

    const businessTypeOptions = [
        'Individual/Sole Proprietor',
        'LLC',
        'Corporation',
        'Partnership',
        'Non-Profit Organization',
        'Other',
    ];

    const handleInputChange = (
        field: keyof VendorApplicationForm,
        value: string | boolean | string[]
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleEventTypeToggle = (eventType: string) => {
        const updatedTypes = formData.eventTypes.includes(eventType)
            ? formData.eventTypes.filter((type) => type !== eventType)
            : [...formData.eventTypes, eventType];

        handleInputChange('eventTypes', updatedTypes);
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<VendorApplicationForm> = {};

        if (!formData.businessName.trim())
            newErrors.businessName = 'Business name is required';
        if (!formData.businessType)
            newErrors.businessType = 'Business type is required';
        if (!formData.description.trim())
            newErrors.description = 'Business description is required';
        if (!formData.experience)
            newErrors.experience = 'Experience level is required';
        if (formData.eventTypes.length === 0)
            newErrors.eventTypes = ['At least one event type must be selected'];
        if (!formData.contactPhone.trim())
            newErrors.contactPhone = 'Contact phone is required';
        if (!formData.agreeToTerms) newErrors.agreeToTerms = true;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            // Here you would typically send the application to your backend
            // For now, we'll simulate the submission
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Show success message and redirect
            alert(
                'Your vendor application has been submitted successfully! You will receive an email confirmation shortly.'
            );
            router.push('/dashboard');
        } catch (error) {
            console.debug('Failed to submit vendor application:', error);
            alert('Failed to submit application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoBack = () => {
        router.push('/dashboard/vendor-access');
    };

    return (
        <div
            className={`min-h-screen transition-colors duration-200 ${
                theme === 'dark'
                    ? 'bg-revlr-dark-bg text-white'
                    : 'bg-gray-50 text-gray-900'
            }`}
        >
            <div className='mx-auto max-w-2xl p-6'>
                {/* Header */}
                <div className='mb-8 text-center'>
                    <h1 className='mb-4 font-inter text-3xl font-bold'>
                        Vendor Application
                    </h1>
                    <p
                        className={`font-inter text-sm ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}
                    >
                        Tell us about your business and event management
                        experience
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className='space-y-6'>
                    {/* Business Information */}
                    <div
                        className={`rounded-xl border p-6 shadow-lg ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <h2 className='mb-4 font-inter text-lg font-semibold'>
                            Business Information
                        </h2>

                        <div className='space-y-4'>
                            <div>
                                <label className='mb-2 block font-inter text-sm font-medium'>
                                    Business Name{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='text'
                                    value={formData.businessName}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'businessName',
                                            e.target.value
                                        )
                                    }
                                    className={`w-full rounded-xl border px-4 py-3 font-inter text-sm transition-all duration-200 ${
                                        errors.businessName
                                            ? 'border-red-500 focus:ring-red-500/20'
                                            : theme === 'dark'
                                              ? 'border-revlr-dark-border bg-revlr-dark-card text-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                              : 'border-gray-300 bg-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                    } focus:outline-none focus:ring-2`}
                                    placeholder='Enter your business name'
                                />
                                {errors.businessName && (
                                    <p className='mt-1 font-inter text-sm text-red-500'>
                                        {errors.businessName}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className='mb-2 block font-inter text-sm font-medium'>
                                    Business Type{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <select
                                    value={formData.businessType}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'businessType',
                                            e.target.value
                                        )
                                    }
                                    className={`w-full rounded-xl border px-4 py-3 font-inter text-sm transition-all duration-200 ${
                                        errors.businessType
                                            ? 'border-red-500 focus:ring-red-500/20'
                                            : theme === 'dark'
                                              ? 'border-revlr-dark-border bg-revlr-dark-card text-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                              : 'border-gray-300 bg-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                    } focus:outline-none focus:ring-2`}
                                >
                                    <option value=''>
                                        Select business type
                                    </option>
                                    {businessTypeOptions.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                                {errors.businessType && (
                                    <p className='mt-1 font-inter text-sm text-red-500'>
                                        {errors.businessType}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className='mb-2 block font-inter text-sm font-medium'>
                                    Website
                                </label>
                                <input
                                    type='url'
                                    value={formData.website}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'website',
                                            e.target.value
                                        )
                                    }
                                    className={`w-full rounded-xl border px-4 py-3 font-inter text-sm transition-all duration-200 ${
                                        theme === 'dark'
                                            ? 'border-revlr-dark-border bg-revlr-dark-card text-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                            : 'border-gray-300 bg-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                    } focus:outline-none focus:ring-2`}
                                    placeholder='https://your-website.com'
                                />
                            </div>

                            <div>
                                <label className='mb-2 block font-inter text-sm font-medium'>
                                    Business Description{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'description',
                                            e.target.value
                                        )
                                    }
                                    rows={4}
                                    className={`w-full rounded-xl border px-4 py-3 font-inter text-sm transition-all duration-200 ${
                                        errors.description
                                            ? 'border-red-500 focus:ring-red-500/20'
                                            : theme === 'dark'
                                              ? 'border-revlr-dark-border bg-revlr-dark-card text-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                              : 'border-gray-300 bg-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                    } focus:outline-none focus:ring-2`}
                                    placeholder='Describe your business and what makes you qualified to organize events'
                                />
                                {errors.description && (
                                    <p className='mt-1 font-inter text-sm text-red-500'>
                                        {errors.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Event Experience */}
                    <div
                        className={`rounded-xl border p-6 shadow-lg ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <h2 className='mb-4 font-inter text-lg font-semibold'>
                            Event Experience
                        </h2>

                        <div className='space-y-4'>
                            <div>
                                <label className='mb-2 block font-inter text-sm font-medium'>
                                    Experience Level{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <select
                                    value={formData.experience}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'experience',
                                            e.target.value
                                        )
                                    }
                                    className={`w-full rounded-xl border px-4 py-3 font-inter text-sm transition-all duration-200 ${
                                        errors.experience
                                            ? 'border-red-500 focus:ring-red-500/20'
                                            : theme === 'dark'
                                              ? 'border-revlr-dark-border bg-revlr-dark-card text-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                              : 'border-gray-300 bg-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                    } focus:outline-none focus:ring-2`}
                                >
                                    <option value=''>
                                        Select experience level
                                    </option>
                                    <option value='beginner'>
                                        New to event organizing
                                    </option>
                                    <option value='intermediate'>
                                        1-5 years of experience
                                    </option>
                                    <option value='experienced'>
                                        5+ years of experience
                                    </option>
                                    <option value='professional'>
                                        Professional event organizer
                                    </option>
                                </select>
                                {errors.experience && (
                                    <p className='mt-1 font-inter text-sm text-red-500'>
                                        {errors.experience}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className='mb-2 block font-inter text-sm font-medium'>
                                    Event Types{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <div className='grid grid-cols-2 gap-3'>
                                    {eventTypeOptions.map((eventType) => (
                                        <label
                                            key={eventType}
                                            className='flex cursor-pointer items-center space-x-2'
                                        >
                                            <input
                                                type='checkbox'
                                                checked={formData.eventTypes.includes(
                                                    eventType
                                                )}
                                                onChange={() =>
                                                    handleEventTypeToggle(
                                                        eventType
                                                    )
                                                }
                                                className='size-4 rounded border-gray-300 text-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                            />
                                            <span className='font-inter text-sm'>
                                                {eventType}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {errors.eventTypes && (
                                    <p className='mt-1 font-inter text-sm text-red-500'>
                                        Please select at least one event type
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div
                        className={`rounded-xl border p-6 shadow-lg ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <h2 className='mb-4 font-inter text-lg font-semibold'>
                            Contact Information
                        </h2>

                        <div className='space-y-4'>
                            <div>
                                <label className='mb-2 block font-inter text-sm font-medium'>
                                    Contact Phone{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='tel'
                                    value={formData.contactPhone}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'contactPhone',
                                            e.target.value
                                        )
                                    }
                                    className={`w-full rounded-xl border px-4 py-3 font-inter text-sm transition-all duration-200 ${
                                        errors.contactPhone
                                            ? 'border-red-500 focus:ring-red-500/20'
                                            : theme === 'dark'
                                              ? 'border-revlr-dark-border bg-revlr-dark-card text-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                              : 'border-gray-300 bg-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                    } focus:outline-none focus:ring-2`}
                                    placeholder='Your contact phone number'
                                />
                                {errors.contactPhone && (
                                    <p className='mt-1 font-inter text-sm text-red-500'>
                                        {errors.contactPhone}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className='mb-2 block font-inter text-sm font-medium'>
                                    Business Address
                                </label>
                                <textarea
                                    value={formData.businessAddress}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'businessAddress',
                                            e.target.value
                                        )
                                    }
                                    rows={3}
                                    className={`w-full rounded-xl border px-4 py-3 font-inter text-sm transition-all duration-200 ${
                                        theme === 'dark'
                                            ? 'border-revlr-dark-border bg-revlr-dark-card text-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                            : 'border-gray-300 bg-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                    } focus:outline-none focus:ring-2`}
                                    placeholder='Your business address'
                                />
                            </div>

                            <div>
                                <label className='mb-2 block font-inter text-sm font-medium'>
                                    Tax ID / Business Registration Number
                                </label>
                                <input
                                    type='text'
                                    value={formData.taxId}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'taxId',
                                            e.target.value
                                        )
                                    }
                                    className={`w-full rounded-xl border px-4 py-3 font-inter text-sm transition-all duration-200 ${
                                        theme === 'dark'
                                            ? 'border-revlr-dark-border bg-revlr-dark-card text-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                            : 'border-gray-300 bg-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                                    } focus:outline-none focus:ring-2`}
                                    placeholder='Optional - for tax reporting purposes'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Terms Agreement */}
                    <div
                        className={`rounded-xl border p-6 shadow-lg ${
                            theme === 'dark'
                                ? 'border-revlr-dark-border bg-revlr-dark-card'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <label className='flex cursor-pointer items-start space-x-3'>
                            <input
                                type='checkbox'
                                checked={formData.agreeToTerms}
                                onChange={(e) =>
                                    handleInputChange(
                                        'agreeToTerms',
                                        e.target.checked
                                    )
                                }
                                className={`mt-1 size-4 rounded border-gray-300 text-revlr-primary-blue focus:ring-revlr-primary-blue/20 ${
                                    errors.agreeToTerms ? 'border-red-500' : ''
                                }`}
                            />
                            <div>
                                <span className='font-inter text-sm'>
                                    I agree to the{' '}
                                    <a
                                        href='/terms'
                                        className='text-revlr-primary-blue hover:underline'
                                    >
                                        Terms of Service
                                    </a>{' '}
                                    and{' '}
                                    <a
                                        href='/privacy'
                                        className='text-revlr-primary-blue hover:underline'
                                    >
                                        Privacy Policy
                                    </a>
                                    , and I understand that my application will
                                    be reviewed before vendor access is granted.{' '}
                                    <span className='text-red-500'>*</span>
                                </span>
                                {errors.agreeToTerms && (
                                    <p className='mt-1 font-inter text-sm text-red-500'>
                                        You must agree to the terms to continue
                                    </p>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Submit Buttons */}
                    <div className='flex space-x-4'>
                        <button
                            type='button'
                            onClick={handleGoBack}
                            className={`flex-1 rounded-xl border px-6 py-3 font-inter font-medium transition-all duration-200 ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border text-gray-300 hover:bg-revlr-dark-border/20'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Back
                        </button>

                        <button
                            type='submit'
                            disabled={isSubmitting}
                            className='flex-1 rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 font-inter font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50'
                        >
                            {isSubmitting ? (
                                <div className='flex items-center justify-center space-x-2'>
                                    <div className='size-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                                    <span>Submitting...</span>
                                </div>
                            ) : (
                                'Submit Application'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VendorApplicationPage;
