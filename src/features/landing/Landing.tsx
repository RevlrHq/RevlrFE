'use client';

import React, { useState } from 'react';
import { Hero } from './components/Hero';
import { Navbar } from '../../components/Navbar';
import Footer from '../../components/Footer';
import FeaturesSection from './components/FeaturesSection';
import FAQSection from './components/FAQSection';
import EventListing from './components/EventListing';
import ResaleCard from './components/ResaleCard';

const Landing = () => {
    const [isOrganizer, setIsOrganizer] = useState(true);

    return (
        <div className='min-h-screen bg-white transition-colors duration-300 dark:bg-revlr-dark-bg'>
            <Navbar isOrganizer={isOrganizer} />
            <Hero isOrganizer={isOrganizer} setIsOrganizer={setIsOrganizer} />

            {isOrganizer ? (
                <div>
                    <FeaturesSection />
                    <FAQSection isOrganizer={isOrganizer} />
                </div>
            ) : (
                <div className='mx-auto max-w-[1440px]'>
                    <EventListing />
                    <ResaleCard />
                    <FAQSection isOrganizer={isOrganizer} />
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Landing;
