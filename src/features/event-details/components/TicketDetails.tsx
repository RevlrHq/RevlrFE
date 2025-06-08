import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const TicketDetails = () => {
    const events = [
        {
            id: 1,
            title: 'Sanda Music Festival 2025',
            image: '/assets/images/flyer.png',
            price: 20,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Concerts',
        },
        {
            id: 2,
            title: "Innovator Summit: Inside Africa's Tech Revolution",
            image: '/assets/images/flyer.png',
            price: 0,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Tech',
        },
        {
            id: 3,
            title: 'Sanda Music Festival 2025',
            image: '/assets/images/flyer2.png',
            price: 20,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Concerts',
        },
        {
            id: 4,
            title: "Innovator Summit: Inside Africa's Tech Revolution",
            image: '/assets/images/flyer3.png',
            price: 0,
            date: 'April 15, 2025, 5:00 PM',
            location: 'Central Park',
            category: 'Tech',
        },
    ];

    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(0);
    const dropdownRef = useRef(null);

    const options = [0, 1, 2, 3];

    const handleSelect = (value: number) => {
        setSelectedValue(value);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !(dropdownRef.current as Node).contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <section className='mx-auto max-w-[1440px] px-2 py-32 md:px-24 md:py-48'>
            <div className='mx-auto flex flex-col justify-between gap-12 md:flex-row'>
                <div className='flex flex-1 flex-col gap-8'>
                    <div className='relative h-96 w-full'>
                        <Image
                            src='/assets/images/event-image.png'
                            alt='sanda-music-festival'
                            fill
                            className='object-contain'
                        />
                        <div className='absolute bottom-[-24px] left-1/2 flex -translate-x-1/2 gap-2'>
                            <div className='h-2 w-8 rounded-full bg-blue-600'></div>
                            <div className='size-2 rounded-full bg-gray-300'></div>
                            <div className='size-2 rounded-full bg-gray-300'></div>
                            <div className='size-2 rounded-full bg-gray-300'></div>
                            <div className='size-2 rounded-full bg-gray-300'></div>
                        </div>
                    </div>

                    <div className='mt-8 flex flex-col gap-4'>
                        <h1 className='font-inter text-xl font-semibold text-[#001433]'>
                            Tickets
                        </h1>
                        <div
                            className='relative mb-2 w-full rounded-xl border border-[#E4E6EB] p-3'
                            ref={dropdownRef}
                        >
                            <div className='flex items-center justify-between'>
                                <span className='font-inter text-sm font-medium text-[#001433]'>
                                    Free
                                </span>

                                <button
                                    onClick={() => setIsOpen(!isOpen)}
                                    className={`flex items-center bg-white px-2 py-1 ${isOpen ? 'rounded-md border border-[#3D8BFF] bg-[#F7F8FA]' : 'bg-white'}`}
                                >
                                    <span className='mr-2'>
                                        {selectedValue}
                                    </span>
                                    <svg
                                        width='20'
                                        height='20'
                                        className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                        viewBox='0 0 20 20'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <path
                                            d='M13.2292 7.49998L9.99583 10.7333L6.7625 7.49998C6.4375 7.17498 5.9125 7.17498 5.5875 7.49998C5.2625 7.82498 5.2625 8.34998 5.5875 8.67498L9.4125 12.5C9.7375 12.825 10.2625 12.825 10.5875 12.5L14.4125 8.67498C14.7375 8.34998 14.7375 7.82498 14.4125 7.49998C14.0875 7.18331 13.5542 7.17498 13.2292 7.49998Z'
                                            fill='#9DA4B0'
                                        />
                                    </svg>
                                </button>
                            </div>

                            {isOpen && (
                                <div className='absolute right-0.5 z-10 mt-6 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg'>
                                    {options.map((option) => (
                                        <div
                                            key={option}
                                            className={`cursor-pointer px-4 py-2 text-right hover:bg-blue-50 ${option === selectedValue ? 'bg-blue-50' : ''} `}
                                            onClick={() => handleSelect(option)}
                                        >
                                            {option}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <Link
                        href='/ticket-purchase'
                        className={`flex w-full justify-center rounded-xl bg-revlr-primary-blue px-5 py-4 font-inter text-base font-semibold text-white ${isOpen ? 'mt-36' : ''}`}
                    >
                        Buy Ticket
                    </Link>
                </div>
                <div className='flex flex-1 flex-col gap-8'>
                    <div className='flex flex-col gap-8 border-b border-[#E4E6EB]'>
                        <h1 className='font-inter text-3xl font-bold text-[#001433]'>
                            Sanda Music Festival 2025
                        </h1>
                        <div className='flex flex-col gap-6 pb-12'>
                            <div className='flex flex-row gap-4'>
                                <svg
                                    width='20'
                                    height='20'
                                    viewBox='0 0 20 20'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M16.6666 2.49998H15.8333V1.66665C15.8333 1.20831 15.4583 0.833313 15 0.833313C14.5416 0.833313 14.1666 1.20831 14.1666 1.66665V2.49998H5.83329V1.66665C5.83329 1.20831 5.45829 0.833313 4.99996 0.833313C4.54163 0.833313 4.16663 1.20831 4.16663 1.66665V2.49998H3.33329C2.41663 2.49998 1.66663 3.24998 1.66663 4.16665V17.5C1.66663 18.4166 2.41663 19.1666 3.33329 19.1666H16.6666C17.5833 19.1666 18.3333 18.4166 18.3333 17.5V4.16665C18.3333 3.24998 17.5833 2.49998 16.6666 2.49998ZM15.8333 17.5H4.16663C3.70829 17.5 3.33329 17.125 3.33329 16.6666V6.66665H16.6666V16.6666C16.6666 17.125 16.2916 17.5 15.8333 17.5Z'
                                        fill='#374252'
                                    />
                                </svg>

                                <p className='font-inter text-base font-medium text-[#374252]'>
                                    Wednesday, April 15 2025
                                </p>
                            </div>

                            <div className='flex flex-row gap-4'>
                                <svg
                                    width='20'
                                    height='20'
                                    viewBox='0 0 20 20'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M9.99996 1.66669C5.41663 1.66669 1.66663 5.41669 1.66663 10C1.66663 14.5834 5.41663 18.3334 9.99996 18.3334C14.5833 18.3334 18.3333 14.5834 18.3333 10C18.3333 5.41669 14.5833 1.66669 9.99996 1.66669ZM12.9583 13.1667L9.55829 11.075C9.30829 10.925 9.15829 10.6584 9.15829 10.3667V6.45835C9.16663 6.11669 9.44996 5.83335 9.79163 5.83335C10.1333 5.83335 10.4166 6.11669 10.4166 6.45835V10.1667L13.6166 12.0917C13.9166 12.275 14.0166 12.6667 13.8333 12.9667C13.65 13.2584 13.2583 13.35 12.9583 13.1667Z'
                                        fill='#374252'
                                    />
                                </svg>

                                <p className='font-inter text-base font-medium text-[#374252]'>
                                    5:00 PM - 5:00 AM
                                </p>
                            </div>

                            <div className='flex flex-row gap-4'>
                                <svg
                                    width='20'
                                    height='20'
                                    viewBox='0 0 20 20'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M10 1.80103C6.50004 1.80103 3.33337 4.48436 3.33337 8.63436C3.33337 11.2844 5.37504 14.401 9.45004 17.9927C9.76671 18.2677 10.2417 18.2677 10.5584 17.9927C14.625 14.401 16.6667 11.2844 16.6667 8.63436C16.6667 4.48436 13.5 1.80103 10 1.80103ZM10 10.1344C9.08337 10.1344 8.33337 9.38436 8.33337 8.46769C8.33337 7.55103 9.08337 6.80103 10 6.80103C10.9167 6.80103 11.6667 7.55103 11.6667 8.46769C11.6667 9.38436 10.9167 10.1344 10 10.1344Z'
                                        fill='#374252'
                                    />
                                </svg>

                                <p className='font-inter text-base font-medium text-[#374252]'>
                                    Central Park, 123 Festival Road, Echo City
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className='flex flex-col gap-4 border-b border-[#E4E6EB]'>
                        <h2 className='font-inter text-lg font-semibold text-[#001433]'>
                            About
                        </h2>
                        <p className='pb-12 font-inter text-base font-normal text-[#374252]'>
                            Sanda Music Festival 2025 is the biggest celebration
                            of music, culture, and entertainment. Featuring an
                            electrifying lineup of internationally renowned
                            artists, DJs, and rising stars, this festival
                            promises a day of non-stop excitement. Get ready for
                            an immersive experience with multiple stages,
                            stunning visual effects, food and drink vendors,
                            interactive installations, and chill-out zones.
                            Whether you’re a fan of rock, pop, EDM, or hip-hop,
                            there's something for everyone at Sanda Music
                            Festival 2025. Bring your crew, make memories, and
                            dance the night away under the stars. Join thousands
                            of festival-goers in a high-energy atmosphere where
                            music meets adventure. From vibrant festival grounds
                            to an epic closing performance, every moment will be
                            unforgettable. Don’t miss out on the most
                            anticipated event of the year!
                        </p>
                    </div>
                    <div className='flex flex-col gap-4'>
                        <h2 className='font-inter text-base font-semibold text-[#001433]'>
                            Organiser
                        </h2>
                        <p className='font-inter text-base font-normal text-[#374252]'>
                            Sanda Events Group
                        </p>
                        <div className='flex flex-row gap-8'>
                            <span>
                                <svg
                                    width='32'
                                    height='32'
                                    viewBox='0 0 32 32'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <g clip-path='url(#clip0_2181_8644)'>
                                        <path
                                            d='M15.9974 31.9756C24.8272 31.9756 31.9852 24.8176 31.9852 15.9878C31.9852 7.15798 24.8272 0 15.9974 0C7.16762 0 0.00964355 7.15798 0.00964355 15.9878C0.00964355 24.8176 7.16762 31.9756 15.9974 31.9756Z'
                                            fill='#F1F6FF'
                                        />
                                        <path
                                            d='M27.3066 4.70569C33.5503 10.9493 33.5505 21.0727 27.3064 27.3167C21.0625 33.5604 10.9389 33.5604 4.69531 27.3167L27.3066 4.70569Z'
                                            fill='#F1F6FF'
                                        />
                                        <path
                                            d='M31.8817 17.7885L20.3167 6.22314L14.3121 12.2277L14.6698 12.5854L11.2511 16.0039L14.0493 18.8021L13.6813 19.1699L16.7107 22.1993L13.2182 25.6918L19.1844 31.658C25.9122 30.2964 31.1055 24.7107 31.8817 17.7885Z'
                                            fill='#F1F6FF'
                                        />
                                        <path
                                            d='M13.2025 10.0479C13.2025 10.5384 13.2025 12.7292 13.2025 12.7292H11.2382V16.008H13.2025V25.7506H17.2377V16.008H19.9455C19.9455 16.008 20.1992 14.4355 20.3219 12.7168C19.9694 12.7168 17.2531 12.7168 17.2531 12.7168C17.2531 12.7168 17.2531 10.8091 17.2531 10.4748C17.2531 10.14 17.6928 9.68938 18.1278 9.68938C18.562 9.68938 19.4782 9.68938 20.3264 9.68938C20.3264 9.24253 20.3264 7.70033 20.3264 6.276C19.1939 6.276 17.9054 6.276 17.3371 6.276C13.1026 6.2758 13.2025 9.55768 13.2025 10.0479Z'
                                            fill='#0066FF'
                                        />
                                    </g>
                                    <defs>
                                        <clipPath id='clip0_2181_8644'>
                                            <rect
                                                width='32'
                                                height='32'
                                                fill='white'
                                            />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </span>
                            <span>
                                <svg
                                    width='34'
                                    height='34'
                                    viewBox='0 0 34 34'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M17 33C25.8366 33 33 25.8366 33 17C33 8.16344 25.8366 1 17 1C8.16344 1 1 8.16344 1 17C1 25.8366 8.16344 33 17 33Z'
                                        fill='#F1F6FF'
                                        stroke='#0066FF'
                                        stroke-width='0.0332412'
                                        stroke-miterlimit='10'
                                    />
                                    <path
                                        d='M7.1439 7.73047L14.7917 17.9561L7.0957 26.2701H8.8279L15.5659 18.9909L21.0098 26.2701H26.9041L18.8259 15.4694L25.9893 7.73047H24.2572L18.052 14.4342L13.0382 7.73047H7.1439ZM9.69118 9.00627H12.399L24.3565 24.9943H21.6487L9.69118 9.00627Z'
                                        fill='#0066FF'
                                    />
                                </svg>
                            </span>
                            <span>
                                <svg
                                    width='32'
                                    height='32'
                                    viewBox='0 0 32 32'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <g clip-path='url(#clip0_2181_8654)'>
                                        <path
                                            d='M16 31.9996C24.8366 31.9996 32 24.8362 32 15.9996C32 7.16308 24.8366 -0.000366211 16 -0.000366211C7.16344 -0.000366211 0 7.16308 0 15.9996C0 24.8362 7.16344 31.9996 16 31.9996Z'
                                            fill='#F1F6FF'
                                        />
                                        <path
                                            d='M16.0004 8.12978C18.5637 8.12978 18.8674 8.13954 19.8796 8.1857C20.8156 8.22842 21.3239 8.38482 21.6622 8.51626C22.1103 8.69042 22.4301 8.89842 22.766 9.23434C23.102 9.57034 23.31 9.89011 23.4841 10.3382C23.6156 10.6765 23.772 11.1848 23.8147 12.1207C23.8609 13.1331 23.8706 13.4367 23.8706 15.9999C23.8706 18.5633 23.8609 18.8669 23.8147 19.8792C23.772 20.8152 23.6156 21.3235 23.4841 21.6618C23.31 22.1099 23.102 22.4297 22.7661 22.7656C22.4301 23.1015 22.1103 23.3095 21.6622 23.4837C21.3239 23.6152 20.8156 23.7715 19.8796 23.8143C18.8675 23.8604 18.5639 23.8703 16.0004 23.8703C13.4369 23.8703 13.1333 23.8604 12.1212 23.8143C11.1852 23.7715 10.6769 23.6152 10.3386 23.4837C9.89047 23.3095 9.57071 23.1015 9.23479 22.7656C8.89887 22.4297 8.69079 22.1099 8.51663 21.6618C8.38519 21.3235 8.22879 20.8152 8.18607 19.8792C8.13991 18.8669 8.13015 18.5633 8.13015 15.9999C8.13015 13.4367 8.13991 13.1331 8.18607 12.1207C8.22879 11.1848 8.38519 10.6765 8.51663 10.3382C8.69079 9.89011 8.89879 9.57034 9.23479 9.23442C9.57071 8.89842 9.89047 8.69042 10.3386 8.51626C10.6769 8.38482 11.1852 8.22842 12.1212 8.1857C13.1334 8.13954 13.4371 8.12978 16.0004 8.12978ZM16.0004 6.40002C13.3932 6.40002 13.0662 6.41106 12.0423 6.45778C11.0206 6.50442 10.3226 6.66666 9.71199 6.90402C9.08071 7.1493 8.54535 7.47754 8.01167 8.0113C7.47791 8.54498 7.14967 9.08034 6.90439 9.71162C6.66703 10.3223 6.50479 11.0201 6.45815 12.0419C6.41143 13.0659 6.40039 13.3928 6.40039 15.9999C6.40039 18.6072 6.41143 18.9341 6.45815 19.958C6.50479 20.9799 6.66703 21.6777 6.90439 22.2883C7.14967 22.9196 7.47791 23.455 8.01167 23.9887C8.54535 24.5224 9.08071 24.8507 9.71199 25.0959C10.3226 25.3333 11.0206 25.4955 12.0423 25.5422C13.0662 25.5889 13.3932 25.5999 16.0004 25.5999C18.6076 25.5999 18.9346 25.5889 19.9585 25.5422C20.9802 25.4955 21.6782 25.3333 22.2888 25.0959C22.9201 24.8507 23.4554 24.5224 23.9891 23.9887C24.5228 23.455 24.8511 22.9196 25.0964 22.2883C25.3337 21.6777 25.496 20.9799 25.5426 19.958C25.5893 18.9341 25.6004 18.6072 25.6004 15.9999C25.6004 13.3928 25.5893 13.0659 25.5426 12.0419C25.496 11.0201 25.3337 10.3223 25.0964 9.71162C24.8511 9.08034 24.5228 8.54498 23.9891 8.0113C23.4554 7.47754 22.9201 7.1493 22.2888 6.90402C21.6782 6.66666 20.9802 6.50442 19.9585 6.45778C18.9346 6.41106 18.6076 6.40002 16.0004 6.40002Z'
                                            fill='#0066FF'
                                        />
                                        <path
                                            d='M16.0048 11.0743C13.2821 11.0743 11.0751 13.2814 11.0751 16.004C11.0751 18.7267 13.2821 20.9337 16.0048 20.9337C18.7274 20.9337 20.9345 18.7267 20.9345 16.004C20.9345 13.2814 18.7274 11.0743 16.0048 11.0743ZM16.0048 19.204C14.2375 19.204 12.8048 17.7713 12.8048 16.004C12.8048 14.2367 14.2375 12.804 16.0048 12.804C17.7721 12.804 19.2048 14.2367 19.2048 16.004C19.2048 17.7713 17.7721 19.204 16.0048 19.204Z'
                                            fill='#0066FF'
                                        />
                                        <path
                                            d='M22.2807 10.8775C22.2807 11.5137 21.7649 12.0295 21.1287 12.0295C20.4924 12.0295 19.9767 11.5137 19.9767 10.8775C19.9767 10.2413 20.4924 9.72546 21.1287 9.72546C21.7649 9.72546 22.2807 10.2413 22.2807 10.8775Z'
                                            fill='#0066FF'
                                        />
                                    </g>
                                    <defs>
                                        <clipPath id='clip0_2181_8654'>
                                            <rect
                                                width='32'
                                                height='32'
                                                fill='white'
                                            />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className='mt-16 flex flex-col gap-8'>
                <h2 className='font-montserrat text-xl font-semibold text-black'>
                    Related Events
                </h2>
                {/* <div
                    className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
                >
                    {events.map((event) => (
                        <div key={event.id} className='group'>
                            <Link href={`/events/event/${event.id}`}>
                                <div className='relative mb-3 overflow-hidden rounded-lg bg-gray-200'>
                                    <div className='relative h-[293px] w-full rounded-lg'>
                                        <Image
                                            src={event.image}
                                            alt={event.title}
                                            fill
                                            className='object-cover transition-transform duration-300 group-hover:scale-105'
                                        />
                                    </div>
                                </div>

                                <div className='flex flex-col gap-2'>
                                    <div className='font-inter text-[16px] font-semibold text-[#0066FF]'>
                                        {event.price === 0
                                            ? 'Free'
                                            : `From $${event.price}`}
                                    </div>
                                    <h3 className='w-full overflow-hidden truncate whitespace-nowrap font-inter text-[16px] font-semibold text-[#001433]'>
                                        {event.title}
                                    </h3>
                                    <div className='font-inter text-sm font-medium text-[#6B7380]'>
                                        {event.date}
                                    </div>
                                    <div className='font-inter text-sm font-medium text-[#6B7380]'>
                                        {event.location}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div> */}

                <div
                    className={`flex gap-4 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
                >
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className='group min-w-[270px] shrink-0 sm:min-w-0'
                        >
                            <Link href={`/events/event/${event.id}`}>
                                <div className='relative mb-3 overflow-hidden rounded-lg bg-gray-200'>
                                    <div className='relative h-[293px] w-full rounded-lg'>
                                        <Image
                                            src={event.image}
                                            alt={event.title}
                                            fill
                                            className='object-cover transition-transform duration-300 group-hover:scale-105'
                                        />
                                    </div>
                                </div>

                                <div className='flex flex-col gap-2'>
                                    <div className='font-inter text-[16px] font-semibold text-[#0066FF]'>
                                        {event.price === 0
                                            ? 'Free'
                                            : `From $${event.price}`}
                                    </div>
                                    <h3 className='w-full overflow-hidden truncate whitespace-nowrap font-inter text-[16px] font-semibold text-[#001433]'>
                                        {event.title}
                                    </h3>
                                    <div className='font-inter text-sm font-medium text-[#6B7380]'>
                                        {event.date}
                                    </div>
                                    <div className='font-inter text-sm font-medium text-[#6B7380]'>
                                        {event.location}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TicketDetails;
