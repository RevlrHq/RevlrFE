'use client';

import { useState } from 'react';
import { Navbar } from '@components/navbar/Navbar';
import Footer from '@components/Footer';
import TicketDetails from './components/TicketDetails';

const EventDetails = () => {
    const [isOrganizer] = useState(false);
    return (
        <div>
            <Navbar isOrganizer={isOrganizer} />
            <TicketDetails />
            <Footer />
        </div>
    );
};

export default EventDetails;
