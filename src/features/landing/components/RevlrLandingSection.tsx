const RevlrLandingSection = () => {
    return (
      <section className="p-4 text-center md:px-24 md:py-16">
        <h1 className="mb-4 font-montserrat text-xl font-semibold text-[#001433] md:text-[32px]">Who Is REVLR For?</h1>
        
        <p className="mx-auto mb-16 max-w-[470px] font-inter text-sm font-normal text-[#4C5563] md:text-lg">
          While most event platforms focus on ticketing or logistics, REVLR offers an all-in-one event ecosystem 
          for organizations, businesses and independent planners.
        </p>
        
        <div className="grid gap-6 md:grid-cols-3">
 
          <div className="group relative h-[400px] cursor-pointer rounded-lg bg-[#F1F6FF] px-8 pb-2 pt-8">
            <div className="hidden justify-center pb-6 pt-24 md:flex">
                <svg width="130" height="118" viewBox="0 0 130 118" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M65 26.5V13.5C65 6.35 59.15 0.5 52 0.5H13C5.85 0.5 0 6.35 0 13.5V104.5C0 111.65 5.85 117.5 13 117.5H117C124.15 117.5 130 111.65 130 104.5V39.5C130 32.35 124.15 26.5 117 26.5H65ZM26 104.5H13V91.5H26V104.5ZM26 78.5H13V65.5H26V78.5ZM26 52.5H13V39.5H26V52.5ZM26 26.5H13V13.5H26V26.5ZM52 104.5H39V91.5H52V104.5ZM52 78.5H39V65.5H52V78.5ZM52 52.5H39V39.5H52V52.5ZM52 26.5H39V13.5H52V26.5ZM110.5 104.5H65V91.5H78V78.5H65V65.5H78V52.5H65V39.5H110.5C114.075 39.5 117 42.425 117 46V98C117 101.575 114.075 104.5 110.5 104.5ZM104 52.5H91V65.5H104V52.5ZM104 78.5H91V91.5H104V78.5Z" fill="#3D8BFF"/>
                </svg>
            </div>
            <h2 className="hidden pb-3 text-xl font-semibold text-[#374252] md:block">For Organizations & Enterprises</h2>
            <p className="hidden text-base font-normal text-[#6B7380] md:block">
              Manage multiple events, track performance and easily connect to your business tools.
            </p>
            <img 
              src="/assets/images/organization.png" 
              alt="Organizations Hover Image" 
              className="absolute inset-0 mx-auto block size-full rounded-lg object-cover group-hover:block md:hidden"
            />
          </div>
          
          <div className="group relative h-[400px] cursor-pointer rounded-lg bg-[#F1F6FF] px-8 pb-2 pt-8">
            <div className="hidden justify-center pb-6 pt-24 md:flex">
                <svg width="104" height="130" viewBox="0 0 104 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M51.93 26C59.1097 26 64.93 20.1797 64.93 13C64.93 5.8203 59.1097 0 51.93 0C44.7503 0 38.93 5.8203 38.93 13C38.93 20.1797 44.7503 26 51.93 26Z" fill="#3D8BFF"/>
                    <path d="M77.215 39.715C74.68 37.18 70.325 32.5 61.875 32.5C60.51 32.5 52.645 32.5 45.365 32.5C29.375 32.435 16.05 20.8 13.385 5.525C12.865 2.34 10.2 0 7.01497 0C3.04997 0 -0.070034 3.51 0.514966 7.41C3.37497 24.7 15.985 38.675 32.43 43.615V123.5C32.43 127.075 35.355 130 38.93 130C42.505 130 45.43 127.075 45.43 123.5V91H58.43V123.5C58.43 127.075 61.355 130 64.93 130C68.505 130 71.43 127.075 71.43 123.5V52.325L92.49 73.385C95.025 75.92 99.12 75.92 101.655 73.385C104.19 70.85 104.19 66.755 101.655 64.22L77.215 39.715Z" fill="#3D8BFF"/>
                </svg>
            </div>
            <h2 className="hidden pb-3 text-xl font-semibold text-[#374252] md:block">For Individual Event Creators</h2>
            <p className="hidden text-base font-normal text-[#6B7380] md:block">
              Customize event pages, automate guest engagement & boost ticket sales.
            </p>
            <img 
              src="/assets/images/individual.png" 
              alt="Organizations Hover Image" 
              className="absolute inset-0 mx-auto block size-full rounded-lg object-cover group-hover:block md:hidden"
            />
          </div>
          
          <div className="group relative h-[400px] rounded-lg bg-[#F1F6FF] px-8 pb-2 pt-8">
            <div className="hidden justify-center pb-6 pt-24 md:flex">
                <svg width="157" height="156" viewBox="0 0 157 156" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M104.42 71.5318C115.157 71.5318 123.76 62.8642 123.76 52.1268C123.76 41.3895 115.157 32.7219 104.42 32.7219C93.6827 32.7219 85.0152 41.3895 85.0152 52.1268C85.0152 62.8642 93.6827 71.5318 104.42 71.5318ZM52.6736 71.5318C63.411 71.5318 72.0139 62.8642 72.0139 52.1268C72.0139 41.3895 63.411 32.7219 52.6736 32.7219C41.9363 32.7219 33.2687 41.3895 33.2687 52.1268C33.2687 62.8642 41.9363 71.5318 52.6736 71.5318ZM52.6736 84.4684C37.6025 84.4684 7.39551 92.0363 7.39551 107.107V116.81C7.39551 120.367 10.3062 123.278 13.8638 123.278H91.4835C95.0411 123.278 97.9518 120.367 97.9518 116.81V107.107C97.9518 92.0363 67.7448 84.4684 52.6736 84.4684ZM104.42 84.4684C102.544 84.4684 100.41 84.5977 98.1458 84.7918C98.2752 84.8565 98.3399 84.9858 98.4046 85.0505C105.778 90.4192 110.888 97.599 110.888 107.107V116.81C110.888 119.074 110.436 121.273 109.724 123.278H143.23C146.788 123.278 149.698 120.367 149.698 116.81V107.107C149.698 92.0363 119.491 84.4684 104.42 84.4684Z" fill="#3D8BFF"/>
                </svg>
            </div>
            <h2 className="hidden pb-3 text-xl font-semibold text-[#374252] md:block">For Attendees</h2>
            <p className="hidden text-base font-normal text-[#6B7380] md:block">
              Discover events, buy & resell tickets and get real-time updates fast.
            </p>
            <img 
              src="/assets/images/attendee.png" 
              alt="Organizations Hover Image" 
              className="absolute inset-0 mx-auto block size-full rounded-lg object-cover group-hover:block md:hidden"
            />
          </div>
        </div>
      </section>
    );
  };
  
  export default RevlrLandingSection;