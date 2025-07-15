'use client';

import { useState } from 'react';

interface FAQSectionProps {
    isOrganizer: boolean;
}

const faqData = {
    attendee: [
        {
            id: 1,
            question: 'How does the ticket resale feature work?',
            answer: "As an attendee, you can list your tickets for resale through your REVLR account. Once listed, they'll be available for other attendees to purchase. When sold, you'll receive payment automatically minus a small service fee.",
        },
        {
            id: 2,
            question: 'Can I get a refund instead?',
            answer: "Refund policies are set by event organizers. Check the specific event's refund policy in your ticket details. If refunds are available, you can request one from your Orders page. Otherwise, you may be able to resell your ticket.",
        },
        {
            id: 3,
            question: 'How do I track my ticket purchases?',
            answer: "All your ticket purchases can be tracked in your REVLR account under 'My Tickets'. You'll also receive email confirmations and updates about your upcoming events.",
        },
        {
            id: 4,
            question: 'What payment options do you support?',
            answer: 'We accept all major credit cards, bank transfers, and mobile money. Some events may offer additional payment options such as financing plans for expensive tickets.',
        },
        {
            id: 5,
            question: 'How do I transfer tickets to friends?',
            answer: "You can transfer tickets to friends directly from your account. Go to 'My Tickets', select the ticket you want to transfer, and enter your friend's email address. They'll receive instructions to claim the ticket.",
        },
        {
            id: 6,
            question: 'Is my payment information secure?',
            answer: 'Yes, we use industry-standard encryption and are PCI DSS Level 1 compliant. We never store your full payment details on our servers and work with trusted payment processors like Paystack.',
        },
    ],
    organizer: [
        {
            id: 1,
            question: 'How much does it cost to use REVLR?',
            answer: 'REVLR is free for events under 100 attendees. For larger events, we charge a small percentage per ticket sold. There are no setup fees, monthly fees, or hidden costs. You only pay when you sell tickets.',
        },
        {
            id: 2,
            question: 'How quickly do I receive payments?',
            answer: 'Standard payouts are processed within 5-7 business days after your event. For urgent needs, we offer instant payouts (for a small fee) that arrive within minutes to your bank account.',
        },
        {
            id: 3,
            question: 'Can I customize my event page and tickets?',
            answer: 'Absolutely! You can fully customize your event page with your branding, colors, and images. Tickets can be customized with your logo and event details. We also support custom domains for premium accounts.',
        },
        {
            id: 4,
            question: 'What analytics and reporting do you provide?',
            answer: 'Your dashboard provides real-time analytics on sales, revenue, attendee demographics, traffic sources, and more. Export detailed reports for accounting or marketing analysis. Track everything from page views to conversion rates.',
        },
        {
            id: 5,
            question: 'How does the financing feature work?',
            answer: 'For high-value tickets, attendees can apply for financing directly during checkout. We handle the eligibility checks and payment processing. You receive full payment upfront while attendees pay in installments.',
        },
        {
            id: 6,
            question: 'Can I integrate REVLR with my existing tools?',
            answer: 'Yes! We offer APIs and integrations with popular tools like Mailchimp, Salesforce, Google Analytics, and more. Our webhook system allows real-time data sync with your existing systems.',
        },
    ],
};

const FAQSection = ({ isOrganizer }: FAQSectionProps) => {
    const [userType] = useState<'organizer' | 'attendee'>(
        isOrganizer ? 'organizer' : 'attendee'
    );
    const [openItemId, setOpenItemId] = useState<number>(-1);

    const toggleItem = (id: number) => {
        setOpenItemId(openItemId === id ? -1 : id);
    };

    return (
        <section className='bg-gradient-to-br from-white to-gray-50 py-24 transition-all duration-500 dark:from-revlr-dark-bg dark:to-revlr-dark-card'>
            <div className='mx-auto max-w-4xl px-6 md:px-24'>
                {/* Section Header */}
                <div className='mb-16 text-center'>
                    <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-revlr-primary-blue/20 bg-gradient-to-r from-revlr-primary-blue/10 to-revlr-accent-purple/10 px-4 py-2 dark:from-revlr-primary-blue/20 dark:to-revlr-accent-purple/20'>
                        <span className='text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                            ❓
                        </span>
                        <span className='text-sm font-medium text-revlr-primary-blue dark:text-revlr-primary-yellow'>
                            Frequently Asked Questions
                        </span>
                    </div>

                    <h2 className='mb-6 font-montserrat text-4xl font-bold text-gray-900 dark:text-white md:text-5xl'>
                        Got Questions?
                        <span className='bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple bg-clip-text text-transparent'>
                            {' '}
                            We've Got Answers
                        </span>
                    </h2>

                    <p className='mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300'>
                        Everything you need to know about{' '}
                        {isOrganizer ? 'organizing events' : 'attending events'}{' '}
                        on REVLR.
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className='space-y-4'>
                    {faqData[userType].map((item) => (
                        <div
                            key={item.id}
                            className='overflow-hidden rounded-2xl border border-gray-200/50 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg dark:border-revlr-dark-border dark:bg-revlr-dark-card/80'
                        >
                            <button
                                className='flex w-full items-center justify-between p-6 text-left transition-colors duration-200 hover:bg-gray-50/50 dark:hover:bg-revlr-dark-bg/50'
                                onClick={() => toggleItem(item.id)}
                            >
                                <span className='pr-4 font-inter text-lg font-semibold text-gray-900 dark:text-white'>
                                    {item.question}
                                </span>
                                <div
                                    className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple transition-transform duration-300 ${
                                        openItemId === item.id
                                            ? 'rotate-180'
                                            : ''
                                    }`}
                                >
                                    <svg
                                        className='size-4 text-white'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth='2'
                                            d='M19 9l-7 7-7-7'
                                        />
                                    </svg>
                                </div>
                            </button>

                            {openItemId === item.id && (
                                <div className='border-t border-gray-100 px-6 pb-6 dark:border-revlr-dark-border'>
                                    <div className='pt-4'>
                                        <p className='font-inter leading-relaxed text-gray-600 dark:text-gray-300'>
                                            {item.answer}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Contact Section */}
                <div className='mt-16 rounded-2xl border border-revlr-primary-blue/20 bg-gradient-to-r from-revlr-primary-blue/10 to-revlr-accent-purple/10 p-8 text-center dark:border-revlr-primary-yellow/20 dark:from-revlr-primary-blue/20 dark:to-revlr-accent-purple/20'>
                    <div className='mx-auto max-w-2xl'>
                        <h3 className='mb-4 font-montserrat text-2xl font-bold text-gray-900 dark:text-white'>
                            Still have questions?
                        </h3>
                        <p className='mb-6 text-gray-600 dark:text-gray-300'>
                            Can't find the answer you're looking for? Our
                            support team is here to help you get the most out of
                            REVLR.
                        </p>
                        <div className='flex flex-col justify-center gap-4 sm:flex-row'>
                            <a
                                href='mailto:support@revlr.com'
                                className='inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90 hover:shadow-xl'
                            >
                                <svg
                                    className='mr-2 size-5'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                                    />
                                </svg>
                                Email Support
                            </a>
                            <a
                                href='/help'
                                className='inline-flex items-center justify-center rounded-xl border-2 border-revlr-primary-blue px-6 py-3 font-semibold text-revlr-primary-blue transition-all duration-200 hover:bg-revlr-primary-blue hover:text-white dark:border-revlr-primary-yellow dark:text-revlr-primary-yellow dark:hover:bg-revlr-primary-yellow dark:hover:text-revlr-dark-bg'
                            >
                                <svg
                                    className='mr-2 size-5'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                    />
                                </svg>
                                Help Center
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
