import React from "react";

const Testimonial = () => {
  return (
    <div className="mx-auto rounded-xl px-24 py-8">
      <div className="flex flex-col gap-8 rounded-xl bg-blue-50 px-48 py-32">
        <h3 className="mb-4 text-2xl font-bold text-[#001433]">
          What Our Customers Say
        </h3>

        <p className="mb-6 text-3xl font-normal text-[#1F2938]">
          "REVLR completely transformed how we manage our conferences. The
          automation features saved us hours of work & ticket sales have been
          smoother!"
        </p>

        <div className="mb-4 flex gap-3">
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="Alex Morgan"
            className="size-16 rounded-full"
          />
          <div className="text-left">
            <p className="text-[20px] font-medium text-[#374252]">Alex Morgan</p>
            <p className="text-[18px] font-normal  text-[#6B7380]">Event Director at SummitPro</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300">
          <svg width="35" height="34" viewBox="0 0 35 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M34.1667 16.9998C34.1667 26.1998 26.7 33.6665 17.5 33.6665C8.29999 33.6665 0.833324 26.1998 0.833324 16.9998C0.833324 7.79984 8.29999 0.333172 17.5 0.333172C26.7 0.333172 34.1667 7.79984 34.1667 16.9998ZM17.9833 10.6832L12.85 15.8165C12.2 16.4665 12.2 17.5165 12.85 18.1832L17.9833 23.3165C18.6333 23.9665 19.7 23.9665 20.35 23.3165C21 22.6665 21 21.6165 20.35 20.9665L16.3833 16.9998L20.35 13.0332C21 12.3832 21 11.3332 20.35 10.6832C19.7 10.0332 18.6333 10.0332 17.9833 10.6832Z" fill="#CFE2FF"/>
          </svg>
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-200 text-blue-600 hover:bg-blue-300">
          <svg width="35" height="34" viewBox="0 0 35 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.833344 16.9998C0.833344 26.1998 8.30001 33.6665 17.5 33.6665C26.7 33.6665 34.1667 26.1998 34.1667 16.9998C34.1667 7.79984 26.7 0.333172 17.5 0.333172C8.30001 0.333172 0.833344 7.79984 0.833344 16.9998ZM17.0167 10.6832L22.15 15.8165C22.8 16.4665 22.8 17.5165 22.15 18.1832L17.0167 23.3165C16.3667 23.9665 15.3 23.9665 14.65 23.3165C14 22.6665 14 21.6165 14.65 20.9665L18.6167 16.9998L14.65 13.0332C14 12.3832 14 11.3332 14.65 10.6832C15.3 10.0332 16.3667 10.0332 17.0167 10.6832Z" fill="#CFE2FF"/>
          </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;