import React from 'react'


const ResaleCard = () => {
    return (
        <div className="mx-auto rounded-xl px-24 py-8 text-center">
            <div className='bg-[#FFD7001A] py-12'>
                <div className="mx-auto mb-8 flex size-12 items-center justify-center rounded-md bg-gray-300">
                <svg width="60" height="48" viewBox="0 0 60 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M53.9998 0H5.99984C3.33317 0 0.666504 2.66667 0.666504 5.33333V42.6667C0.666504 45.6 3.0665 48 5.99984 48H53.9998C56.6665 48 59.3332 45.3333 59.3332 42.6667V5.33333C59.3332 2.66667 56.6665 0 53.9998 0ZM13.0132 35.1733L19.6532 26.64C20.1865 25.9733 21.1998 25.9467 21.7332 26.6133L27.3332 33.36L35.5998 22.72C36.1332 22.0267 37.1998 22.0267 37.7332 22.7467L47.0932 35.2267C47.7598 36.1067 47.1198 37.36 46.0265 37.36H14.0532C12.9598 37.3333 12.3198 36.0533 13.0132 35.1733Z" fill="#9DA4B0"/>
                </svg>
                </div>
        
                <h2 className="mx-auto mb-4 w-[600px] text-center font-montserrat text-[32px] font-semibold text-[#001433]">
                    Sell Your Ticket If You Can’t Attend
                </h2>
        
                <p className="mx-auto mb-6 w-[600px] text-center font-inter text-lg font-normal text-[#6B7380]">
                    Bought a ticket but can’t make it? Easily resell your ticket before the
                    event. No stress or hassle. Just list it for sale and get your money
                    back.
                </p>
        
                <button className="rounded-lg bg-[#FFD700] px-6 py-4 font-inter text-[16px] font-medium text-[#001433] ">
                    Resell Your Ticket
                </button>
            </div>
        </div>
      );
}

export default ResaleCard