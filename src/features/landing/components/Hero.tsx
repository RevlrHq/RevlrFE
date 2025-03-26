"use client";

interface HeroProps {
  isOrganizer: boolean;
  setIsOrganizer: (value: boolean) => void;
}

export const Hero = ({ isOrganizer, setIsOrganizer }: HeroProps) => {
  return (
    <main className={`mx-auto w-full px-4 pb-12 pt-36 md:max-w-[1440px] md:pt-48 ${
        isOrganizer ? "bg-cover bg-center bg-no-repeat" : ""
      }`}
      style={isOrganizer ? { backgroundImage: "url('/assets/images/Hero BG.png')" } : {}}>
      <div className="mb-4 flex justify-center">
        <div className="flex items-center gap-4 p-1">
          <span className={`py-1 pl-4 pr-2 font-inter ${!isOrganizer ? 'text-[12px] font-semibold text-[#001433] md:text-lg' : 'text-[12px] font-medium text-[#6B7380] md:text-lg'}`}>For Organisers</span>
          {isOrganizer ? (
            <svg onClick ={() => setIsOrganizer(!isOrganizer)} width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="24" rx="12" fill="#001433"/>
                <rect x="4" y="4" width="16" height="16" rx="8" fill="#F7F8FA"/>
            </svg>            
          ) : (
            <svg onClick ={() => setIsOrganizer(!isOrganizer)} width="41" height="24" viewBox="0 0 41 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" width="40" height="24" rx="12" fill="#001433"/>
                <rect x="20.5" y="4" width="16" height="16" rx="8" fill="#FFD700"/>
            </svg>
          )}
          <span className={`py-1 pl-2 pr-4 font-inter ${!isOrganizer ? 'text-[12px] font-medium text-[#6B7380] md:text-lg' : 'text-[12px] font-semibold text-[#001433] md:text-lg'}`}>For Attendees</span>
        </div>
      </div>

      {isOrganizer ? (
        <div className="mb-8 text-center">
          <h1 className="mb-4 font-montserrat text-[36px] font-semibold text-[#001433] md:text-[56px]">
            The All-In-One Platform For<br />
            Event Management & Ticketing
          </h1>
          <p className="mb-12 text-[14px] font-normal text-[#001433] md:text-[20px]">
            Create, manage, and sell tickets to your events with powerful, easy-to-use tools.
          </p>
          <div className="flex justify-center">
            <div className="relative h-[40px] w-[558px] gap-2 md:h-[56px]">
              <input  type="email"  placeholder="Enter your email" 
                className="size-full rounded-[12px] border border-[#D0D5DB] p-4 pr-[185px]" 
              />
              <button className="absolute right-[2px] top-1/2 flex h-[38px] w-[120px] -translate-y-1/2 items-center justify-center rounded-[12px] bg-[#FFD700] p-2 font-semibold text-[#001433] md:h-[40px] md:w-[185px] md:py-[26px]">
                Create Event
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 text-center">
            <h1 className="mb-4 font-montserrat text-[56px] font-semibold text-[#001433]">
              Find Events You Love<br />
              Sell Tickets You Can't Use
            </h1>
            <p className="mb-8 font-inter text-[20px] font-normal text-[#4C5563]">
              Book events with no regrets. If plans change, you can resell your ticket hassle-free.
            </p>
          </div>
          <div className="mt-8">
            <div className="relative left-1/2 h-[300px] w-screen max-w-[1728px] -translate-x-1/2 overflow-hidden rounded-lg md:h-[500px]">
              <div className='bg-cover bg-center bg-no-repeat'  style={{ backgroundImage: "url('/assets/images/feature.png')", width: "100%", height: "780px" }}></div>
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                <div className="h-2 w-8 rounded-full bg-blue-600"></div>
                <div className="size-2 rounded-full bg-gray-300"></div>
                <div className="size-2 rounded-full bg-gray-300"></div>
                <div className="size-2 rounded-full bg-gray-300"></div>
                <div className="size-2 rounded-full bg-gray-300"></div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
};