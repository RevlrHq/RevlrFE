/* eslint-disable boundaries/no-unknown-files */
"use client";

import Link from 'next/link';

interface NavbarProps {
  isOrganizer: boolean;
}

export const Navbar = ({ isOrganizer }: NavbarProps) => {

  return (
    <header className="fixed left-0 top-0 z-50 flex h-[80px] w-full bg-white shadow-sm">
      <div className='mx-auto flex max-w-[1440px] flex-row items-center justify-between gap-8 px-24 py-5'>
        <div className="flex items-center">
            <Link href="/" className="font-montserrat text-2xl font-extrabold text-revlr-primary">
            <span className="text-yellow-400">✨</span>REVLR
            </Link>
        </div>
      
        {isOrganizer ? (
            <div className="w-[701px] flex items-center justify-center gap-16">
            <Link href="/signup" className="block py-2 text-sm font-medium text-[#001433] md:py-0">Sign Up</Link>
            <Link href="/how-it-works" className="block py-2 text-sm font-medium text-[#001433] md:py-0">How It Works</Link>
            <Link href="/events" className="block py-2 text-sm font-medium text-[#001433] md:py-0">Browse Events</Link>
            </div>
        ) : (
            <div className="relative mb-4 flex w-[701px] items-center md:mb-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.91667 11.3333C4.40278 11.3333 3.12153 10.809 2.07292 9.76042C1.02431 8.71181 0.5 7.43056 0.5 5.91667C0.5 4.40278 1.02431 3.12153 2.07292 2.07292C3.12153 1.02431 4.40278 0.5 5.91667 0.5C7.43056 0.5 8.71181 1.02431 9.76042 2.07292C10.809 3.12153 11.3333 4.40278 11.3333 5.91667C11.3333 6.52778 11.2361 7.10417 11.0417 7.64583C10.8472 8.1875 10.5833 8.66667 10.25 9.08333L14.9167 13.75C15.0694 13.9028 15.1458 14.0972 15.1458 14.3333C15.1458 14.5694 15.0694 14.7639 14.9167 14.9167C14.7639 15.0694 14.5694 15.1458 14.3333 15.1458C14.0972 15.1458 13.9028 15.0694 13.75 14.9167L9.08333 10.25C8.66667 10.5833 8.1875 10.8472 7.64583 11.0417C7.10417 11.2361 6.52778 11.3333 5.91667 11.3333ZM5.91667 9.66667C6.95833 9.66667 7.84375 9.30208 8.57292 8.57292C9.30208 7.84375 9.66667 6.95833 9.66667 5.91667C9.66667 4.875 9.30208 3.98958 8.57292 3.26042C7.84375 2.53125 6.95833 2.16667 5.91667 2.16667C4.875 2.16667 3.98958 2.53125 3.26042 3.26042C2.53125 3.98958 2.16667 4.875 2.16667 5.91667C2.16667 6.95833 2.53125 7.84375 3.26042 8.57292C3.98958 9.30208 4.875 9.66667 5.91667 9.66667Z" fill="#0066FF"/>
                    </svg>
                </span>
                <input 
                    type="text" 
                    placeholder="Browse Events" 
                    className="w-[701px] rounded-md border py-2 pl-10 pr-4 font-inter text-sm font-medium"
                />
            </div>
        )}

        {isOrganizer ? (
            <div className=''>
                <Link href="/create-event" className="block rounded-md bg-revlr-primary px-4 py-2 text-sm font-semibold text-white">Create Event</Link>
            </div>
        ) : (
            <div className="absolute inset-x-0 top-16 z-10 hidden w-full bg-white p-4 shadow-md md:static md:flex md:w-auto md:items-center md:gap-6 md:p-0 md:shadow-none">
            
            <div className="mb-4 flex items-center gap-2 md:mb-0">
            <span className="flex items-center gap-2 font-inter text-sm font-medium text-[#001433]">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.99992 1.80104C6.49992 1.80104 3.33325 4.48437 3.33325 8.63437C3.33325 11.2844 5.37492 14.401 9.44992 17.9927C9.76659 18.2677 10.2416 18.2677 10.5583 17.9927C14.6249 14.401 16.6666 11.2844 16.6666 8.63437C16.6666 4.48437 13.4999 1.80104 9.99992 1.80104ZM9.99992 10.1344C9.08325 10.1344 8.33325 9.38437 8.33325 8.46771C8.33325 7.55104 9.08325 6.80104 9.99992 6.80104C10.9166 6.80104 11.6666 7.55104 11.6666 8.46771C11.6666 9.38437 10.9166 10.1344 9.99992 10.1344Z" fill="#4C5563"/>
                </svg>
                Lagos
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.825 0.912476L5 4.72914L1.175 0.912476L0 2.08748L5 7.08748L10 2.08748L8.825 0.912476Z" fill="#0066FF"/>
            </svg>
            </span>
            </div>
            <Link href="/signup" className="block font-inter text-sm font-medium text-[#001433]">Sign Up</Link>
            <Link href="/create-event" className="block font-inter text-sm font-medium text-[#001433]">Create Event</Link>
        </div>
        )}
      </div>

    </header>
  );
};