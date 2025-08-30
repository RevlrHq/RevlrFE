'use client';

import { useState } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import type { EventCreationData, EventTicket } from '@src/types/event-creation';

interface DevAutoPopulateButtonProps {
    onPopulateEvent: (eventData: EventCreationData) => void;
    onPopulateTickets: (tickets: EventTicket[]) => void;
    disabled?: boolean;
}

const DevAutoPopulateButton = ({
    onPopulateEvent,
    onPopulateTickets,
    disabled = false,
}: DevAutoPopulateButtonProps) => {
    const { theme } = useTheme();
    const [isPopulating, setIsPopulating] = useState(false);

    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    const generateSampleEventData = (): EventCreationData => {
        // Dynamic data arrays for randomization
        const eventTypes = [
            'Conference',
            'Workshop',
            'Seminar',
            'Summit',
            'Meetup',
            'Symposium',
            'Forum',
            'Expo',
            'Festival',
            'Bootcamp',
        ];

        const eventTopics = [
            'AI & Machine Learning',
            'Web Development',
            'Data Science',
            'Cybersecurity',
            'Cloud Computing',
            'Mobile Development',
            'DevOps',
            'Blockchain',
            'UX/UI Design',
            'Digital Marketing',
            'Entrepreneurship',
            'Fintech',
            'Healthcare Tech',
            'EdTech',
            'Gaming',
        ];

        const categories = [
            'Technology',
            'Business',
            'Education',
            'Health',
            'Arts',
            'Science',
            'Sports',
            'Entertainment',
        ];

        const locationTypes: ('in-person' | 'virtual' | 'hybrid')[] = [
            'in-person',
            'virtual',
            'hybrid',
        ];

        const venues = [
            'Innovation Hub',
            'Tech Center',
            'Convention Center',
            'Community Hall',
            'University Auditorium',
            'Business Center',
            'Conference Hall',
            'Event Space',
            'Cultural Center',
            'Learning Center',
        ];

        const cities = [
            'San Francisco, CA',
            'New York, NY',
            'Austin, TX',
            'Seattle, WA',
            'Boston, MA',
            'Chicago, IL',
            'Los Angeles, CA',
            'Denver, CO',
            'Atlanta, GA',
            'Miami, FL',
        ];

        const organizerTypes = [
            'Tech Solutions',
            'Innovation Labs',
            'Digital Agency',
            'Consulting Group',
            'Education Hub',
            'Community Org',
            'Professional Society',
            'Industry Alliance',
            'Research Institute',
            'Startup Collective',
        ];

        const timezones = [
            'America/New_York',
            'America/Chicago',
            'America/Denver',
            'America/Los_Angeles',
            'America/Toronto',
            'Europe/London',
            'Europe/Berlin',
            'Asia/Tokyo',
        ];

        // Generate random selections
        const randomEventType =
            eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const randomTopic =
            eventTopics[Math.floor(Math.random() * eventTopics.length)];
        const randomCategory =
            categories[Math.floor(Math.random() * categories.length)];
        const randomLocationType =
            locationTypes[Math.floor(Math.random() * locationTypes.length)];
        const randomVenue = venues[Math.floor(Math.random() * venues.length)];
        const randomCity = cities[Math.floor(Math.random() * cities.length)];
        const randomOrganizerType =
            organizerTypes[Math.floor(Math.random() * organizerTypes.length)];
        const randomTimezone =
            timezones[Math.floor(Math.random() * timezones.length)];

        // Generate random dates (between 7 and 90 days from now)
        const daysFromNow = Math.floor(Math.random() * 83) + 7; // 7-90 days
        const eventDuration = Math.floor(Math.random() * 3) + 1; // 1-3 days
        const startDate = new Date(
            Date.now() + daysFromNow * 24 * 60 * 60 * 1000
        );
        const endDate = new Date(
            startDate.getTime() + (eventDuration - 1) * 24 * 60 * 60 * 1000
        );

        // Generate random times
        const startHours = Math.floor(Math.random() * 6) + 8; // 8 AM - 1 PM
        const duration = Math.floor(Math.random() * 8) + 2; // 2-9 hours
        const endHours = Math.min(startHours + duration, 22); // End by 10 PM

        const startTime = `${startHours.toString().padStart(2, '0')}:${Math.random() > 0.5 ? '00' : '30'}`;
        const endTime = `${endHours.toString().padStart(2, '0')}:${Math.random() > 0.5 ? '00' : '30'}`;

        // Generate random images
        const availableImages = [
            '/assets/images/flyer.png',
            '/assets/images/flyer2.png',
            '/assets/images/flyer3.png',
            '/assets/images/flyer4.png',
            '/assets/images/flyer5.png',
        ];

        const numImages = Math.floor(Math.random() * 3) + 1; // 1-3 images
        const selectedImages = availableImages
            .sort(() => 0.5 - Math.random())
            .slice(0, numImages)
            .map((url, index) => ({
                id: `sample-${Date.now()}-${index}`,
                url,
                name: `event-image-${index + 1}.jpg`,
                size: Math.floor(Math.random() * 2000000) + 500000, // 500KB - 2.5MB
                mimeType: 'image/jpeg',
                order: index,
            }));

        // Generate dynamic event name and description
        const year = new Date().getFullYear();
        const eventName = `${randomTopic} ${randomEventType} ${year}`;

        const descriptions = [
            `Join us for an exciting ${randomEventType.toLowerCase()} focused on ${randomTopic.toLowerCase()}. This event brings together industry leaders, experts, and enthusiasts to share insights, network, and explore the latest trends and innovations.`,
            `Discover the future of ${randomTopic.toLowerCase()} at our comprehensive ${randomEventType.toLowerCase()}. Connect with like-minded professionals and gain valuable knowledge from industry pioneers.`,
            `Experience cutting-edge insights and practical knowledge at this ${randomTopic.toLowerCase()} ${randomEventType.toLowerCase()}. Perfect for professionals looking to advance their skills and expand their network.`,
            `Immerse yourself in the world of ${randomTopic.toLowerCase()} at our premier ${randomEventType.toLowerCase()}. Learn from experts, participate in hands-on sessions, and build meaningful connections.`,
        ];

        const randomDescription =
            descriptions[Math.floor(Math.random() * descriptions.length)];

        // Generate organizer name
        const organizerName = `${randomTopic.split(' ')[0]} ${randomOrganizerType}`;
        const websiteName = organizerName
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/&/g, 'and');

        return {
            eventName,
            eventDescription:
                randomDescription +
                `\n\nKey highlights:\n• Expert presentations and keynote speeches\n• Interactive workshops and networking sessions\n• Latest industry insights and trends\n• Hands-on learning opportunities\n• Professional networking and collaboration\n\nWhether you're a seasoned professional or just starting your journey, this event offers valuable insights and connections to help advance your career.`,
            eventCategory: randomCategory,
            dateRange: {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
            },
            timeRange: {
                startTime,
                endTime,
            },
            timezone: randomTimezone,
            locationType: randomLocationType,
            locationDetails:
                randomLocationType === 'virtual'
                    ? {
                          eventLink: `https://meet.${websiteName}.com/event-${Date.now()}`,
                          platform:
                              Math.random() > 0.5 ? 'Zoom' : 'Microsoft Teams',
                      }
                    : randomLocationType === 'hybrid'
                      ? {
                            venueName: `${randomVenue} ${randomCity.split(',')[0]}`,
                            address: `${Math.floor(Math.random() * 9999) + 100} Innovation Drive, ${randomCity}`,
                            googleMapsLink: `https://maps.google.com/?q=${Math.floor(Math.random() * 9999) + 100}+Innovation+Drive+${randomCity.replace(/\s+/g, '+')}`,
                            eventLink: `https://meet.${websiteName}.com/event-${Date.now()}`,
                            platform:
                                Math.random() > 0.5
                                    ? 'Zoom'
                                    : 'Microsoft Teams',
                        }
                      : {
                            venueName: `${randomVenue} ${randomCity.split(',')[0]}`,
                            address: `${Math.floor(Math.random() * 9999) + 100} Innovation Drive, ${randomCity}`,
                            googleMapsLink: `https://maps.google.com/?q=${Math.floor(Math.random() * 9999) + 100}+Innovation+Drive+${randomCity.replace(/\s+/g, '+')}`,
                        },
            images: selectedImages,
            organizerName,
            organizerWebsite: `https://${websiteName}.com`,
            socials: {
                facebook: `https://facebook.com/${websiteName}`,
                instagram: `https://instagram.com/${websiteName}`,
                twitter: `https://twitter.com/${websiteName}`,
                linkedin: `https://linkedin.com/company/${websiteName}`,
                website: `https://${websiteName}.com`,
            },
            status: 'draft',
            isDraft: true,
        };
    };

    const generateSampleTickets = (): EventTicket[] => {
        const ticketTypes = [
            {
                names: [
                    'Early Bird',
                    'Super Early Bird',
                    'Limited Time',
                    'Flash Sale',
                    'Pre-Launch',
                ],
                descriptions: [
                    'Limited time offer for early registrants',
                    'Special discount for the first attendees',
                    'Exclusive early access pricing',
                    'Limited quantity promotional tickets',
                ],
            },
            {
                names: [
                    'General Admission',
                    'Standard Access',
                    'Regular Entry',
                    'Basic Pass',
                    'Standard Ticket',
                ],
                descriptions: [
                    'Standard event ticket with full access to all sessions',
                    'Complete access to all event activities and sessions',
                    'Full event participation with all included features',
                    'Standard entry with access to main event content',
                ],
            },
            {
                names: [
                    'VIP Access',
                    'Premium Pass',
                    'Executive Ticket',
                    'Gold Access',
                    'Platinum Entry',
                ],
                descriptions: [
                    'Premium ticket with exclusive networking session and priority seating',
                    'VIP experience with special perks and exclusive access',
                    'Executive level access with premium amenities',
                    'Premium package with additional benefits and networking opportunities',
                ],
            },
        ];

        const refundPolicies = [
            'Full refund available up to 7 days before the event',
            'Full refund available up to 14 days before the event',
            'Partial refund available up to 5 days before the event',
            'Full refund available up to 10 days before the event',
            'No refund policy - all sales final',
        ];

        const feeOptions: ('organizer' | 'attendees')[] = [
            'organizer',
            'attendees',
        ];

        // Generate 2-4 tickets randomly
        const numTickets = Math.floor(Math.random() * 3) + 2; // 2-4 tickets
        const tickets: EventTicket[] = [];

        // Always include at least one free ticket (30% chance) and one paid ticket
        const includeFreeTicket = Math.random() < 0.3;
        let ticketIndex = 0;

        if (includeFreeTicket) {
            const freeTicketType = ticketTypes[0];
            const randomName =
                freeTicketType.names[
                    Math.floor(Math.random() * freeTicketType.names.length)
                ];
            const randomDescription =
                freeTicketType.descriptions[
                    Math.floor(
                        Math.random() * freeTicketType.descriptions.length
                    )
                ];

            tickets.push({
                id: `ticket-${Date.now()}-${ticketIndex++}`,
                type: 'free',
                name: `${randomName} Free`,
                description: randomDescription,
                price: 0,
                quantity: Math.floor(Math.random() * 100) + 25, // 25-124
                purchaseLimit: Math.floor(Math.random() * 3) + 1, // 1-3
                salesPeriod: {
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(
                        Date.now() +
                            (Math.floor(Math.random() * 20) + 10) *
                                24 *
                                60 *
                                60 *
                                1000
                    )
                        .toISOString()
                        .split('T')[0], // 10-29 days
                    startTime: '00:00',
                    endTime: '23:59',
                },
                feeOption: 'organizer',
                isActive: true,
            });
        }

        // Add remaining tickets as paid tickets
        const remainingSlots = numTickets - (includeFreeTicket ? 1 : 0);

        for (let i = 0; i < remainingSlots; i++) {
            const isVIP = i === remainingSlots - 1 && remainingSlots > 1; // Make last ticket VIP if multiple tickets
            const ticketTypeIndex = isVIP ? 2 : 1; // VIP or General
            const ticketType = ticketTypes[ticketTypeIndex];

            const randomName =
                ticketType.names[
                    Math.floor(Math.random() * ticketType.names.length)
                ];
            const randomDescription =
                ticketType.descriptions[
                    Math.floor(Math.random() * ticketType.descriptions.length)
                ];
            const randomRefundPolicy =
                refundPolicies[
                    Math.floor(Math.random() * refundPolicies.length)
                ];
            const randomFeeOption =
                feeOptions[Math.floor(Math.random() * feeOptions.length)];

            // Generate price based on ticket type
            const basePrice = isVIP ? 150 : 50;
            const priceVariation = Math.floor(Math.random() * 100) + 1; // 1-100
            const price = basePrice + priceVariation;

            tickets.push({
                id: `ticket-${Date.now()}-${ticketIndex++}`,
                type: 'paid',
                name: randomName,
                description: randomDescription,
                price: price,
                quantity:
                    Math.floor(Math.random() * (isVIP ? 100 : 300)) +
                    (isVIP ? 20 : 50), // VIP: 20-119, General: 50-349
                purchaseLimit:
                    Math.floor(Math.random() * (isVIP ? 3 : 8)) +
                    (isVIP ? 1 : 2), // VIP: 1-3, General: 2-9
                salesPeriod: {
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(
                        Date.now() +
                            (Math.floor(Math.random() * 25) + 20) *
                                24 *
                                60 *
                                60 *
                                1000
                    )
                        .toISOString()
                        .split('T')[0], // 20-44 days
                    startTime: '00:00',
                    endTime: '23:59',
                },
                refundPolicy: randomRefundPolicy,
                feeOption: randomFeeOption,
                isActive: true,
            });
        }

        return tickets;
    };

    const handleAutoPopulate = async () => {
        if (disabled) return;

        setIsPopulating(true);

        try {
            // Add a small delay to show the loading state
            await new Promise((resolve) => setTimeout(resolve, 500));

            const sampleEventData = generateSampleEventData();
            const sampleTickets = generateSampleTickets();

            onPopulateEvent(sampleEventData);
            onPopulateTickets(sampleTickets);
        } catch (error) {
            console.debug('Error auto-populating form:', error);
        } finally {
            setIsPopulating(false);
        }
    };

    return (
        <button
            onClick={handleAutoPopulate}
            disabled={disabled || isPopulating}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2 font-inter text-sm font-medium transition-all duration-200 ${
                theme === 'dark'
                    ? 'border border-yellow-600/30 bg-yellow-900/20 text-yellow-400 hover:border-yellow-500/50 hover:bg-yellow-900/30'
                    : 'border border-yellow-500/30 bg-yellow-50 text-yellow-700 hover:border-yellow-500/50 hover:bg-yellow-100'
            } disabled:cursor-not-allowed disabled:opacity-50`}
            title='Development only: Auto-populate form with sample data'
        >
            {isPopulating ? (
                <>
                    <svg
                        className='size-4 animate-spin'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                        />
                    </svg>
                    <span>Populating...</span>
                </>
            ) : (
                <>
                    <svg
                        className='size-4'
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
                    <span>Auto-Fill (Dev)</span>
                </>
            )}
        </button>
    );
};

export default DevAutoPopulateButton;
