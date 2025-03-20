"use client";

import React, { useState } from 'react'
import { Hero } from './components/Hero'
import { Navbar } from '@components/navbar/Navbar';
import Footer from './components/Footer';
import FAQSection from './components/FAQSection';
import EventListing from './components/EventListing';
import ResaleCard from './components/ResaleCard';
import Testimonial from './components/Testimonial';
import FeatureComparison from './components/FeatureComparison';
import EventSteps from './components/EventSteps';
import RevlrLandingSection from './components/RevlrLandingSection';
import TopSolution from './components/TopSolution';

const Landing = () => {
    const [isOrganizer, setIsOrganizer] = useState(false);

  return (
    <div>
        <Navbar isOrganizer={isOrganizer}/>
        <Hero isOrganizer={isOrganizer} setIsOrganizer={setIsOrganizer}/>
        {isOrganizer ? (
            <div className='mx-auto max-w-[1440px]'>
                <TopSolution />
                <RevlrLandingSection/>
                <FeatureComparison />
                <EventSteps />
                <Testimonial />
                
            </div>
        ) : (
            <div className='mx-auto max-w-[1440px]'>
                <EventListing />
                <ResaleCard />
            </div>
        )}
        <FAQSection isOrganizer={isOrganizer}/>
        <Footer />
    </div>
  )
}

export default Landing