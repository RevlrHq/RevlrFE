'use client';

import React, { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { Navbar } from '../../components/Navbar';
import Footer from '../../components/Footer';
import FeaturesSection from './components/FeaturesSection';
import FAQSection from './components/FAQSection';
import EventsSection from './components/EventsSection';

const LANDING_PAGE_PREFERENCE_KEY = 'revlr_landing_page_preference';

const Landing = () => {
    const [isOrganizer, setIsOrganizer] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load user preference from localStorage on component mount
    useEffect(() => {
        const savedPreference = localStorage.getItem(
            LANDING_PAGE_PREFERENCE_KEY
        );
        if (savedPreference !== null) {
            setIsOrganizer(savedPreference === 'organizer');
        }
        setIsLoaded(true);
    }, []);

    // Save user preference to localStorage whenever it changes
    const handleToggleView = (newIsOrganizer: boolean) => {
        setIsOrganizer(newIsOrganizer);
        localStorage.setItem(
            LANDING_PAGE_PREFERENCE_KEY,
            newIsOrganizer ? 'organizer' : 'attendee'
        );
    };

    // Don't render until we've loaded the preference to avoid flash
    if (!isLoaded) {
        return (
            <div className='min-h-screen bg-white transition-colors duration-300 dark:bg-revlr-dark-bg'>
                <div className='flex min-h-screen items-center justify-center'>
                    <div className='size-8 animate-spin rounded-full border-4 border-revlr-primary-blue border-t-transparent'></div>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-white transition-colors duration-300 dark:bg-revlr-dark-bg'>
            <Navbar isOrganizer={isOrganizer} />
            <Hero isOrganizer={isOrganizer} setIsOrganizer={handleToggleView} />

            {isOrganizer ? (
                <div>
                    <FeaturesSection />
                    <FAQSection isOrganizer={isOrganizer} />
                </div>
            ) : (
                <div>
                    <EventsSection />
                    <div className='mx-auto max-w-[1440px]'>
                        <FAQSection isOrganizer={isOrganizer} />
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Landing;
