import React from 'react'

const FeatureComparison = () => {
    return (
      <div className="mx-auto mb-16 px-24 py-8">
        <h2 className="text-center text-3xl font-semibold text-[#001433] w-[530px] mx-auto">
          Plan In Minutes, Not Hours
        </h2>
        <p className="mt-2 text-center text-lg font-normal text-[#4C5563] w-[530px] mx-auto">
          From event creation to ticketing, attendee engagement, vendor
          management and real-time insight, REVLR does it all so you can focus on
          delivering an unforgettable experience.
        </p>
  
        <div className="mt-8 flex flex-col md:flex-row">
          <div className="flex-1 rounded-lg relative bg-gray-100 px-14 py-12 text-left">
            <span className="mb-4 absolute top-[-18px] border border-[#E4E6EB] inline-block rounded-full bg-[#FFFFFF] p-2 text-sm font-semibold">
              Without <strong>REVLR</strong>
            </span>
            <ul className="mt-4 space-y-6 text-base font-medium text-[#6B7380]">
              {[
                "Manually juggling spreadsheets for guest lists",
                "Struggling to track ticket sales in real time",
                "Last-minute confusion with vendors & payments",
                "No easy way to engage with attendees",
                "Stressing over refunds & event logistics",
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="20" height="20" rx="10" fill="#E4E6EB"/>
<path d="M13.9818 6.02444C13.7353 5.77795 13.3371 5.77795 13.0906 6.02444L10 9.10875L6.90936 6.01812C6.66287 5.77163 6.26469 5.77163 6.0182 6.01812C5.77171 6.26461 5.77171 6.66279 6.0182 6.90929L9.10883 9.99992L6.0182 13.0906C5.77171 13.337 5.77171 13.7352 6.0182 13.9817C6.26469 14.2282 6.66287 14.2282 6.90936 13.9817L10 10.8911L13.0906 13.9817C13.3371 14.2282 13.7353 14.2282 13.9818 13.9817C14.2283 13.7352 14.2283 13.337 13.9818 13.0906L10.8912 9.99992L13.9818 6.90929C14.222 6.66911 14.222 6.26461 13.9818 6.02444Z" fill="#6B7380"/>
</svg>


 {item}
                </li>
              ))}
            </ul>
          </div>
  
          <div className="flex-1 rounded-lg relative bg-[#FFD70033] px-14 py-12 text-left">
            <span className="mb-4 absolute top-[-18px] border border-[#6B7380] inline-block rounded-full bg-[#FFFDF0] p-2 text-sm font-semibold">
              With <strong>REVLR</strong>
            </span>
            <ul className="mt-4 space-y-6 text-lg font-medium text-[#001433]">
              {[
                "Everything in one dashboard, no spreadsheets needed",
                "Live insights on ticket sales & audience engagement",
                "Vendors & payments are automated & streamlined",
                "Attendees get instant updates & event reminders",
                "Built-in refund management, zero stress",
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.00002 0.666748C4.40002 0.666748 0.666687 4.40008 0.666687 9.00008C0.666687 13.6001 4.40002 17.3334 9.00002 17.3334C13.6 17.3334 17.3334 13.6001 17.3334 9.00008C17.3334 4.40008 13.6 0.666748 9.00002 0.666748ZM6.74169 12.5751L3.75002 9.58341C3.42502 9.25841 3.42502 8.73341 3.75002 8.40841C4.07502 8.08341 4.60002 8.08341 4.92502 8.40841L7.33335 10.8084L13.0667 5.07508C13.3917 4.75008 13.9167 4.75008 14.2417 5.07508C14.5667 5.40008 14.5667 5.92508 14.2417 6.25008L7.91669 12.5751C7.60002 12.9001 7.06669 12.9001 6.74169 12.5751Z" fill="#B59900"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <button className="mt-6 rounded-xl border border-[#FFD700] bg-[#FFD700] px-4 py-4 text-center text-sm font-semibold text-[#001433]">
              Plan with REVLR
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default FeatureComparison;
  