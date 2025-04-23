'use client';

import { useState } from 'react';
import { GreaterIcon, CameraIcon, AddIcon, SelectIcon } from '@src/icons';
import { Calendar, Clock } from 'lucide-react';
import EventModal from './components/EventModal';

const CreateEvent = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [location, setLocation] = useState('in-person');
    const [images, setImages] = useState<string[]>([
        'image1',
        'image2',
        'image3',
    ]);
    const [ticketType, setTicketType] = useState('free');
    const [tickets, setTickets] = useState([
        {
            id: 1,
            name: 'General Admission',
            price: 'Free',
            quantity: 500,
            salesStartDate: '17/2/2025',
            salesStartTime: '8:00 AM',
            salesEndDate: '20/3/2025',
            salesEndTime: '11:59 PM',
            purchaseLimit: 3,
            selected: false,
        },
        {
            id: 2,
            name: 'VIP',
            price: '$80',
            quantity: 100,
            salesStartDate: '17/2/2025',
            salesStartTime: '8:00 AM',
            salesEndDate: '20/3/2025',
            salesEndTime: '11:59 PM',
            purchaseLimit: 2,
            selected: true,
        },
    ]);
    const eventData = {
        title: 'Samba Music Festival 2025',
        date: '23rd Monday, Apr 8, 2025',
        time: '6:00 PM - 11:30 PM',
        location: 'Central Park, 1st Avenue Road, Echo City',
        image: '/samba-festival.jpg',
    };
    const [modalOpen, setModalOpen] = useState(false);

    const [ticketName, setTicketName] = useState('');
    const [ticketPrice, setTicketPrice] = useState('');
    const [ticketQuantity, setTicketQuantity] = useState('');
    const [purchaseLimit, setPurchaseLimit] = useState('');
    const [ticketDescription, setTicketDescription] = useState('');
    const [refundPolicy, setRefundPolicy] = useState('');
    const [feeOption, setFeeOption] = useState('attendees');

    const handleTicketTypeChange = (type: string) => {
        setTicketType(type);
    };

    const handleTicketSelect = (id: number) => {
        setTickets(
            tickets.map((ticket) => ({
                ...ticket,
                selected: ticket.id === id,
            }))
        );
    };

    const addTicket = () => {
        alert('Ticket added successfully!');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted!', {
            images,
            location,
            ticketType,
            tickets,
        });
        alert('Event created successfully!');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const fileArray = Array.from(e.target.files);
            setImages((prevImages) =>
                [...prevImages, ...fileArray.map((file) => file.name)].slice(
                    0,
                    3
                )
            );
        }
    };

    return (
        <div>
            <div className='border-b border-gray-200 bg-white px-4'>
                <div className='flex items-center justify-between bg-white p-4'>
                    <div className='flex items-center space-x-2 text-sm'>
                        <span
                            className={`cursor-pointer font-inter text-sm font-medium text-[#0066FF] ${currentStep === 1 ? 'font-semibold' : 'text-gray-500'}`}
                            onClick={() => setCurrentStep(1)}
                        >
                            Event Details
                        </span>
                        <span className='text-gray-300'>
                            <GreaterIcon />
                        </span>
                        <span
                            className={`cursor-pointer font-inter text-sm font-medium text-[#9DA4B0] ${currentStep === 2 ? 'font-semibold text-blue-600' : 'text-gray-500'}`}
                            onClick={() => setCurrentStep(2)}
                        >
                            Tickets
                        </span>
                    </div>

                    <button
                        onClick={() => setModalOpen(true)}
                        className='rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors duration-300 hover:bg-blue-600 focus:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                        Continue
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {currentStep === 1 ? (
                    <div className='m-12 flex flex-row gap-12'>
                        <div className='flex flex-1 flex-col gap-12'>
                            <div className='rounded-xl bg-white p-8 shadow-md'>
                                <label className='mb-4 block font-inter text-sm font-medium text-[#001433]'>
                                    <span className='mr-1 text-[#D97708]'>
                                        *
                                    </span>
                                    Images
                                    <p className='font-inter text-sm font-light text-[#374252]'>
                                        Add at least 1 image for your event
                                    </p>
                                </label>
                                <div className='flex flex-col space-y-8'>
                                    <div className='flex size-[414px] flex-col items-center justify-center border border-[#F2F3F5] bg-[#F7F8FA] transition hover:border-blue-500'>
                                        <input
                                            type='file'
                                            accept='image/*'
                                            multiple
                                            className='hidden'
                                            id='image-upload'
                                            onChange={handleImageUpload}
                                        />
                                        <label
                                            htmlFor='image-upload'
                                            className='flex cursor-pointer flex-col items-center'
                                        >
                                            <CameraIcon />
                                            <span className='font-inter text-sm font-normal text-[#374252]'>
                                                Add Event Image
                                            </span>
                                        </label>
                                    </div>

                                    <div className='flex flex-row gap-8'>
                                        {images.map((image, index) => (
                                            <div
                                                key={index}
                                                className='relative flex size-32 flex-col items-center justify-center border border-[#F2F3F5] bg-[#F7F8FA]'
                                            >
                                                <input
                                                    type='file'
                                                    accept='image/*'
                                                    multiple
                                                    className='hidden'
                                                    id='image-upload'
                                                    onChange={handleImageUpload}
                                                />
                                                <label
                                                    htmlFor='image-upload'
                                                    className='flex cursor-pointer flex-col items-center'
                                                >
                                                    <AddIcon />
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className='rounded-xl bg-white p-8 shadow-md'>
                                <label className='mb-4 block font-inter text-sm font-medium text-[#001433]'>
                                    Organizer Details
                                </label>
                                <div className='space-y-4'>
                                    <div className='flex flex-row items-center gap-4'>
                                        <button className='flex size-12 items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-200'>
                                            <span className='text-xl text-gray-500'>
                                                <svg
                                                    width='24'
                                                    height='24'
                                                    viewBox='0 0 24 24'
                                                    fill='none'
                                                    xmlns='http://www.w3.org/2000/svg'
                                                >
                                                    <path
                                                        d='M18 13H13V18C13 18.55 12.55 19 12 19C11.45 19 11 18.55 11 18V13H6C5.45 13 5 12.55 5 12C5 11.45 5.45 11 6 11H11V6C11 5.45 11.45 5 12 5C12.55 5 13 5.45 13 6V11H18C18.55 11 19 11.45 19 12C19 12.55 18.55 13 18 13Z'
                                                        fill='#374252'
                                                    />
                                                </svg>
                                            </span>
                                        </button>
                                        <span className='font-inter text-sm font-normal text-[#4C5563]'>
                                            Add Logo
                                        </span>
                                    </div>

                                    <div>
                                        <input
                                            type='text'
                                            placeholder='Organizer Name'
                                            className='w-full rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563] focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>

                                    <div>
                                        <input
                                            type='text'
                                            placeholder='Organizer Website'
                                            className='w-full rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563] focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='rounded-xl bg-white p-8 shadow-md'>
                                <label className='mb-4 block font-inter text-sm font-medium text-[#001433]'>
                                    Socials
                                </label>
                                <div className='space-y-4'>
                                    <div>
                                        <input
                                            type='text'
                                            placeholder='Facebook'
                                            className='w-full rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563] focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>

                                    <div>
                                        <input
                                            type='text'
                                            placeholder='Instagram'
                                            className='w-full rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563] focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>

                                    <div>
                                        <input
                                            type='text'
                                            placeholder='X (Twitter)'
                                            className='w-full rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563] focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='flex flex-1 flex-col gap-6'>
                            <div className='rounded-xl bg-white p-8 shadow-md'>
                                <label className='mb-4 block font-inter text-sm font-medium text-[#001433]'>
                                    <span className='mr-1 text-[#D97708]'>
                                        *
                                    </span>
                                    Basic Details
                                </label>

                                <div className='space-y-4'>
                                    <div>
                                        <input
                                            type='text'
                                            placeholder='Event Name'
                                            className='w-full rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563] focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>

                                    <div>
                                        <textarea
                                            placeholder='Event Description'
                                            rows={5}
                                            className='w-full rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563] focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>

                                    <div>
                                        <div className='relative'>
                                            <select className='w-full appearance-none rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563] focus:outline-none focus:ring-2 focus:ring-blue-500'>
                                                <option
                                                    value=''
                                                    disabled
                                                    selected
                                                >
                                                    Event Category
                                                </option>
                                                <option value='conference'>
                                                    Conference
                                                </option>
                                                <option value='workshop'>
                                                    Workshop
                                                </option>
                                                <option value='meetup'>
                                                    Meetup
                                                </option>
                                                <option value='webinar'>
                                                    Webinar
                                                </option>
                                                <option value='other'>
                                                    Other
                                                </option>
                                            </select>
                                            <div className='pointer-events-none absolute right-3 top-3'>
                                                <SelectIcon />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='rounded-xl bg-white p-8 shadow-md'>
                                <label className='mb-4 block font-inter text-sm font-medium text-[#001433]'>
                                    <span className='mr-1 text-[#D97708]'>
                                        *
                                    </span>
                                    Date & Time
                                </label>

                                <div className='space-y-4'>
                                    <div className='relative'>
                                        <div className='flex items-center rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563]'>
                                            <Calendar
                                                size={18}
                                                className='mr-2 text-gray-500'
                                            />
                                            <input
                                                type='text'
                                                placeholder='Start Date → End Date'
                                                className='flex-1 focus:outline-none'
                                            />
                                        </div>
                                    </div>

                                    <div className='relative'>
                                        <div className='flex items-center justify-between rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563]'>
                                            <div className='flex items-center'>
                                                <Clock
                                                    size={18}
                                                    className='mr-2 text-gray-500'
                                                />
                                                <span className='text-gray-500'>
                                                    Start Time → End Time
                                                </span>
                                            </div>
                                            <SelectIcon />
                                        </div>
                                    </div>

                                    <div className='relative'>
                                        <div className='flex items-center justify-between rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563]'>
                                            <span className='text-gray-500'>
                                                Time Zone
                                            </span>
                                            <SelectIcon />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='rounded-xl bg-white p-8 shadow-md'>
                                <label className='mb-4 block font-inter text-sm font-medium text-[#001433]'>
                                    <span className='mr-1 text-[#D97708]'>
                                        *
                                    </span>
                                    Location
                                </label>

                                <div className='flex flex-row gap-4'>
                                    <button
                                        type='button'
                                        onClick={() => setLocation('in-person')}
                                        className={`pb-3 font-inter text-sm font-normal ${
                                            location === 'in-person'
                                                ? 'border-b border-[#0066FF] text-[#0066FF]'
                                                : 'text-[#4C5563]'
                                        }`}
                                    >
                                        In-Person
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => setLocation('virtual')}
                                        className={`pb-3 font-inter text-sm font-normal ${
                                            location === 'virtual'
                                                ? 'border-b border-[#0066FF] text-[#0066FF]'
                                                : 'text-[#4C5563]'
                                        }`}
                                    >
                                        Virtual
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => setLocation('hybrid')}
                                        className={`pb-3 font-inter text-sm font-normal ${
                                            location === 'hybrid'
                                                ? 'border-b border-[#0066FF] text-[#0066FF]'
                                                : 'text-[#4C5563]'
                                        }`}
                                    >
                                        Hybrid
                                    </button>
                                </div>

                                {location === 'in-person' && (
                                    <div className='mt-4 space-y-3'>
                                        <input
                                            type='text'
                                            placeholder='Venue Name'
                                            className='mb-3 w-full rounded-md border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                        <input
                                            type='text'
                                            placeholder='Address'
                                            className='mb-3 w-full rounded-md border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />

                                        <input
                                            type='text'
                                            placeholder='Google Maps Links'
                                            className='w-full rounded-md border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>
                                )}

                                {location === 'virtual' && (
                                    <div className='mt-4'>
                                        <input
                                            type='text'
                                            placeholder='Event Link'
                                            className='w-full rounded-md border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>
                                )}

                                {location === 'hybrid' && (
                                    <div className='mt-4 space-y-3'>
                                        <input
                                            type='text'
                                            placeholder='Venue Name'
                                            className='mb-3 w-full rounded-md border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                        <input
                                            type='text'
                                            placeholder='Address'
                                            className='mb-3 w-full rounded-md border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />

                                        <input
                                            type='text'
                                            placeholder='Google Maps Links'
                                            className='w-full rounded-md border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                        <input
                                            type='text'
                                            placeholder='Event Link'
                                            className='w-full rounded-md border border-gray-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className='space-y-6 p-4'>
                        <div className='flex flex-row gap-12 rounded-lg bg-white p-6 shadow'>
                            <div className='mb-6'>
                                <h2 className='mb-4 font-inter text-sm font-medium text-[#001433]'>
                                    Ticket Types
                                </h2>
                                <div className='flex flex-col space-y-4'>
                                    <label className='flex cursor-pointer items-center space-x-2'>
                                        <div
                                            className={`flex size-5 items-center justify-center rounded-full border ${ticketType === 'free' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}
                                        >
                                            {ticketType === 'free' && (
                                                <div className='size-2 rounded-full bg-white'></div>
                                            )}
                                        </div>
                                        <input
                                            type='radio'
                                            name='ticketType'
                                            value='free'
                                            checked={ticketType === 'free'}
                                            onChange={() =>
                                                handleTicketTypeChange('free')
                                            }
                                            className='hidden'
                                        />
                                        <span
                                            className={`font-inter text-sm ${ticketType === 'free' ? 'font-medium text-[#0066FF]' : 'font-normal text-[#374252]'}`}
                                        >
                                            Free
                                        </span>
                                    </label>

                                    <label className='flex cursor-pointer items-center space-x-2'>
                                        <div
                                            className={`flex size-5 items-center justify-center rounded-full border ${ticketType === 'paid' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}
                                        >
                                            {ticketType === 'paid' && (
                                                <div className='size-2 rounded-full bg-white'></div>
                                            )}
                                        </div>
                                        <input
                                            type='radio'
                                            name='ticketType'
                                            value='paid'
                                            checked={ticketType === 'paid'}
                                            onChange={() =>
                                                handleTicketTypeChange('paid')
                                            }
                                            className='hidden'
                                        />
                                        <span
                                            className={`font-inter text-sm ${ticketType === 'paid' ? 'font-medium text-[#0066FF]' : 'font-normal text-[#374252]'}`}
                                        >
                                            Paid
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className='flex-1'>
                                <h2 className='mb-4 font-inter text-sm font-medium text-[#001433]'>
                                    <span className='text-orange-500'>*</span>{' '}
                                    Ticket Details
                                </h2>

                                <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                                    <div>
                                        <input
                                            type='text'
                                            placeholder='Ticket Name'
                                            value={ticketName}
                                            onChange={(e) =>
                                                setTicketName(e.target.value)
                                            }
                                            className='w-full rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563]'
                                        />
                                    </div>

                                    {ticketType === 'paid' && (
                                        <div>
                                            <input
                                                type='text'
                                                placeholder='Ticket Price'
                                                value={ticketPrice}
                                                onChange={(e) =>
                                                    setTicketPrice(
                                                        e.target.value
                                                    )
                                                }
                                                className='w-full rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563]'
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <input
                                            type='text'
                                            placeholder='Ticket Quantity'
                                            value={ticketQuantity}
                                            onChange={(e) =>
                                                setTicketQuantity(
                                                    e.target.value
                                                )
                                            }
                                            className='w-full rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563]'
                                        />
                                    </div>

                                    <div>
                                        <input
                                            type='text'
                                            placeholder='Purchase Limit'
                                            value={purchaseLimit}
                                            onChange={(e) =>
                                                setPurchaseLimit(e.target.value)
                                            }
                                            className='w-full rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563]'
                                        />
                                    </div>
                                </div>

                                <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                                    <div className='relative'>
                                        <div className='flex items-center justify-between rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563]'>
                                            <span>Sales Start → End Date</span>
                                            <Calendar className='size-5 text-gray-500' />
                                        </div>
                                    </div>

                                    <div className='relative'>
                                        <div className='flex items-center justify-between rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563]'>
                                            <span>Sales Start → End Time</span>
                                            <Clock className='size-5 text-gray-500' />
                                        </div>
                                    </div>
                                </div>

                                {ticketType === 'paid' && (
                                    <>
                                        <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                                            <div>
                                                <textarea
                                                    placeholder='Ticket Description'
                                                    value={ticketDescription}
                                                    onChange={(e) =>
                                                        setTicketDescription(
                                                            e.target.value
                                                        )
                                                    }
                                                    className='h-24 w-full rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563]'
                                                ></textarea>
                                            </div>

                                            <div>
                                                <textarea
                                                    placeholder='Refund Policy'
                                                    value={refundPolicy}
                                                    onChange={(e) =>
                                                        setRefundPolicy(
                                                            e.target.value
                                                        )
                                                    }
                                                    className='h-24 w-full rounded-xl border border-[#E4E6EB] p-4 font-inter text-sm font-normal text-[#4C5563]'
                                                ></textarea>
                                            </div>
                                        </div>

                                        <div className='mb-4'>
                                            <h2 className='mb-2 font-inter text-sm font-medium text-[#001433]'>
                                                <span className='text-orange-500'>
                                                    *
                                                </span>{' '}
                                                Fee Absorption Choice
                                            </h2>
                                            <p className='mb-2 font-inter text-sm font-medium text-[#374252]'>
                                                REVLR charges a 1% fee per
                                                ticket sold. You can add this
                                                fee to the ticket price
                                                (attendees pay) or deduct it
                                                from your earnings (you pay).
                                            </p>

                                            <div className='flex items-center space-x-4'>
                                                <span
                                                    className={`font-inter text-sm ${feeOption === 'attendees' ? 'font-medium text-[#0066FF]' : 'font-normal text-[#374252]'}`}
                                                >
                                                    Attendees Pay
                                                </span>
                                                <div
                                                    className={`relative h-5 w-9 cursor-pointer rounded-full ${feeOption !== 'attendees' ? 'bg-[#D0D5DB]' : 'bg-revlr-primary-blue'}`}
                                                    onClick={() =>
                                                        setFeeOption(
                                                            feeOption ===
                                                                'attendees'
                                                                ? 'you'
                                                                : 'attendees'
                                                        )
                                                    }
                                                >
                                                    <div
                                                        className={`absolute top-0.5 size-4 rounded-full transition-all ${feeOption !== 'attendees' ? 'left-5 bg-[#0066FF]' : 'left-0.5 bg-white'}`}
                                                    ></div>
                                                </div>
                                                <span
                                                    className={`font-inter text-sm font-medium ${feeOption !== 'attendees' ? 'font-medium text-[#0066FF]' : 'font-normal text-[#374252]'}`}
                                                >
                                                    I'll Pay
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className='flex justify-end'>
                                    <button
                                        onClick={addTicket}
                                        className='rounded-xl border border-[#93BEFF] bg-[#CFE2FF] p-4 font-inter text-sm font-semibold text-white'
                                    >
                                        Add Ticket
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tickets Table */}
                        <div className='rounded-lg bg-white p-6 shadow'>
                            <h2 className='mb-4 font-inter text-sm font-medium text-[#001433]'>
                                Tickets
                            </h2>

                            <table className='w-full text-sm'>
                                <thead>
                                    <tr className='font-inter text-xs font-medium uppercase text-[#6B7380]'>
                                        <th className='p-2 text-left'></th>
                                        <th className='p-2 text-left'>
                                            Ticket Name
                                        </th>
                                        <th className='p-2 text-left'>Price</th>
                                        <th className='p-2 text-left'>
                                            Quantity
                                        </th>
                                        <th className='p-2 text-left'>
                                            Sales Start Date & Time
                                        </th>
                                        <th className='p-2 text-left'>
                                            Sales End Date & Time
                                        </th>
                                        <th className='p-2 text-left'>
                                            Purchase Limit
                                        </th>
                                        <th className='p-2 text-left'>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((ticket) => (
                                        <tr
                                            key={ticket.id}
                                            className={`font-inter text-sm font-medium text-black ${ticket.selected ? 'bg-blue-50' : ''} `}
                                        >
                                            <td className='p-2'>
                                                <div
                                                    className='flex size-5 cursor-pointer items-center justify-center rounded-full border border-gray-300'
                                                    onClick={() =>
                                                        handleTicketSelect(
                                                            ticket.id
                                                        )
                                                    }
                                                >
                                                    {ticket.selected && (
                                                        <div className='size-3 rounded-full bg-blue-500'></div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='p-2 font-medium'>
                                                {ticket.name}
                                            </td>
                                            <td className='p-2'>
                                                {ticket.price}
                                            </td>
                                            <td className='p-2'>
                                                {ticket.quantity}
                                            </td>
                                            <td className='p-2'>
                                                {ticket.salesStartDate} |{' '}
                                                {ticket.salesStartTime}
                                            </td>
                                            <td className='p-2'>
                                                {ticket.salesEndDate} |{' '}
                                                {ticket.salesEndTime}
                                            </td>
                                            <td className='p-2'>
                                                {ticket.purchaseLimit}
                                            </td>
                                            <td className='space-x-2 p-2'>
                                                <button className='text-blue-500'>
                                                    <svg
                                                        xmlns='http://www.w3.org/2000/svg'
                                                        className='inline size-5'
                                                        fill='none'
                                                        viewBox='0 0 24 24'
                                                        stroke='currentColor'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
                                                        />
                                                    </svg>
                                                </button>
                                                <button className='text-gray-400'>
                                                    <svg
                                                        xmlns='http://www.w3.org/2000/svg'
                                                        className='inline size-5'
                                                        fill='none'
                                                        viewBox='0 0 24 24'
                                                        stroke='currentColor'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                                        />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </form>

            <EventModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                event={eventData}
            />
        </div>
    );
};

export default CreateEvent;
