'use client';

import Link from 'next/link';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerSections = [
        {
            title: 'Platform',
            links: [
                { name: 'Create Events', href: '/create-event' },
                { name: 'Browse Events', href: '/events' },
                { name: 'Ticket Resale', href: '/resale' },
                { name: 'Analytics', href: '/analytics' },
                { name: 'Mobile App', href: '/mobile' },
            ],
        },
        {
            title: 'Resources',
            links: [
                { name: 'Help Center', href: '/help' },
                { name: 'API Documentation', href: '/docs' },
                { name: 'Event Planning Guide', href: '/guide' },
                { name: 'Best Practices', href: '/best-practices' },
                { name: 'Case Studies', href: '/case-studies' },
            ],
        },
        {
            title: 'Company',
            links: [
                { name: 'About Us', href: '/about' },
                { name: 'Careers', href: '/careers' },
                { name: 'Press Kit', href: '/press' },
                { name: 'Partner Program', href: '/partners' },
                { name: 'Contact', href: '/contact' },
            ],
        },
        {
            title: 'Legal',
            links: [
                { name: 'Privacy Policy', href: '/privacy' },
                { name: 'Terms of Service', href: '/terms' },
                { name: 'Cookie Policy', href: '/cookies' },
                { name: 'GDPR', href: '/gdpr' },
                { name: 'Security', href: '/security' },
            ],
        },
    ];

    const socialLinks = [
        {
            name: 'Twitter',
            href: 'https://twitter.com/revlr',
            icon: (
                <svg
                    className='size-5'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path d='M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' />
                </svg>
            ),
        },
        {
            name: 'LinkedIn',
            href: 'https://linkedin.com/company/revlr',
            icon: (
                <svg
                    className='size-5'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
                </svg>
            ),
        },
        {
            name: 'Instagram',
            href: 'https://instagram.com/revlr',
            icon: (
                <svg
                    className='size-5'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path d='M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z' />
                </svg>
            ),
        },
        {
            name: 'GitHub',
            href: 'https://github.com/revlr',
            icon: (
                <svg
                    className='size-5'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
                </svg>
            ),
        },
    ];

    return (
        <footer className='border-t border-gray-200 bg-white transition-all duration-300 dark:border-revlr-dark-border dark:bg-revlr-dark-bg'>
            <div className='mx-auto max-w-[1440px] px-6 md:px-24'>
                {/* Main Footer Content */}
                <div className='py-16'>
                    <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-6'>
                        {/* Brand Section */}
                        <div className='lg:col-span-2'>
                            <Link
                                href='/'
                                className='mb-4 inline-flex items-center font-montserrat text-2xl font-extrabold text-revlr-primary-blue transition-colors duration-300 dark:text-white'
                            >
                                <span className='mr-2 text-revlr-primary-yellow'>
                                    🎉
                                </span>
                                REVLR
                            </Link>
                            <p className='mb-6 max-w-sm text-gray-600 dark:text-gray-300'>
                                The all-in-one event management platform that
                                makes creating, managing, and selling tickets
                                effortless. Join thousands of event organizers
                                worldwide.
                            </p>

                            {/* Newsletter Signup */}
                            <div className='space-y-3'>
                                <h4 className='font-semibold text-gray-900 dark:text-white'>
                                    Stay Updated
                                </h4>
                                <div className='flex flex-col gap-2 sm:flex-row'>
                                    <input
                                        type='email'
                                        placeholder='Enter your email'
                                        className='flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-800 transition-all duration-200 placeholder:text-gray-500 focus:border-revlr-primary-blue focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 dark:border-revlr-dark-border dark:bg-revlr-dark-card dark:text-gray-200 dark:placeholder:text-gray-400'
                                    />
                                    <button className='whitespace-nowrap rounded-lg bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-4 py-2 font-medium text-white transition-all duration-200 hover:from-revlr-primary-blue/90 hover:to-revlr-accent-purple/90'>
                                        Subscribe
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer Links */}
                        {footerSections.map((section) => (
                            <div key={section.title} className=''>
                                <h4 className='mb-4 font-semibold text-gray-900 dark:text-white'>
                                    {section.title}
                                </h4>
                                <ul className='space-y-3'>
                                    {section.links.map((link) => (
                                        <li key={link.name}>
                                            <Link
                                                href={link.href}
                                                className='text-gray-600 transition-colors duration-200 hover:text-revlr-primary-blue dark:text-gray-300 dark:hover:text-revlr-primary-yellow'
                                            >
                                                {link.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Section */}
                <div className='border-t border-gray-200 py-8 dark:border-revlr-dark-border'>
                    <div className='flex flex-col items-center justify-between gap-6 md:flex-row'>
                        {/* Copyright */}
                        <div className='text-sm text-gray-600 dark:text-gray-300'>
                            © {currentYear} REVLR. All rights reserved. Made
                            with ❤️ in Lagos, Nigeria.
                        </div>

                        {/* Social Links */}
                        <div className='flex items-center gap-4'>
                            <span className='mr-2 text-sm text-gray-600 dark:text-gray-300'>
                                Follow us:
                            </span>
                            {socialLinks.map((social) => (
                                <Link
                                    key={social.name}
                                    href={social.href}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='rounded-lg bg-gray-100 p-2 text-gray-600 transition-all duration-200 hover:bg-gray-200 hover:text-revlr-primary-blue dark:bg-revlr-dark-card dark:text-gray-300 dark:hover:bg-revlr-dark-border dark:hover:text-revlr-primary-yellow'
                                    aria-label={social.name}
                                >
                                    {social.icon}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Trust Indicators */}
                <div className='border-t border-gray-200 py-8 dark:border-revlr-dark-border'>
                    <div className='flex flex-col items-center justify-center gap-8 text-center md:flex-row'>
                        <div className='flex items-center gap-2 text-gray-600 dark:text-gray-300'>
                            <div className='flex size-5 items-center justify-center rounded-full bg-green-500'>
                                <svg
                                    className='size-3 text-white'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M5 13l4 4L19 7'
                                    />
                                </svg>
                            </div>
                            <span className='text-sm'>SSL Secured</span>
                        </div>

                        <div className='flex items-center gap-2 text-gray-600 dark:text-gray-300'>
                            <div className='flex size-5 items-center justify-center rounded-full bg-blue-500'>
                                <svg
                                    className='size-3 text-white'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                    />
                                </svg>
                            </div>
                            <span className='text-sm'>GDPR Compliant</span>
                        </div>

                        <div className='flex items-center gap-2 text-gray-600 dark:text-gray-300'>
                            <div className='flex size-5 items-center justify-center rounded-full bg-purple-500'>
                                <svg
                                    className='size-3 text-white'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                                    />
                                </svg>
                            </div>
                            <span className='text-sm'>PCI DSS Level 1</span>
                        </div>

                        <div className='flex items-center gap-2 text-gray-600 dark:text-gray-300'>
                            <div className='flex size-5 items-center justify-center rounded-full bg-orange-500'>
                                <svg
                                    className='size-3 text-white'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M13 10V3L4 14h7v7l9-11h-7z'
                                    />
                                </svg>
                            </div>
                            <span className='text-sm'>99.9% Uptime</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
