import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation';

const Sidebar = () => {
    const pathname = usePathname(); 

    const isActive = (path: string) => pathname === path;
  return (
    <div className="flex w-16 flex-col border-r border-gray-200 bg-white md:w-64">
          <div className="border-b border-gray-200 px-8 py-6">
            <Link href="/" className="text-xl font-bold text-blue-600">✨REVLR</Link>
          </div>
        
          <nav className="flex-1 space-y-8 pt-4">
            <Link href="/dashboard/events"  className={`flex items-center gap-4 px-4 py-3 text-sm font-medium ${
                isActive('/dashboard/events') ? 'border-l-4 border-[#0066FF] text-[#0066FF]'  : 'text-[#6B7380]' }`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 13H13C12.45 13 12 13.45 12 14V17C12 17.55 12.45 18 13 18H16C16.55 18 17 17.55 17 17V14C17 13.45 16.55 13 16 13ZM16 3V4H8V3C8 2.45 7.55 2 7 2C6.45 2 6 2.45 6 3V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4H18V3C18 2.45 17.55 2 17 2C16.45 2 16 2.45 16 3ZM18 20H6C5.45 20 5 19.55 5 19V9H19V19C19 19.55 18.55 20 18 20Z" fill={isActive('/dashboard/events') ? '#0066FF' : '#6B7380'}/>
              </svg>
              <span className="hidden font-inter text-base font-semibold md:inline">Events</span>
            </Link>
            
            <Link  href="/dashboard/payouts"  className={`flex items-center gap-4 px-4 py-3 text-sm font-medium ${
                isActive('/dashboard/payouts') ? 'border-l-4 border-[#0066FF] text-[#0066FF]'  : 'text-[#6B7380]' }`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 8V18C23 19.1 22.1 20 21 20H5C4.45 20 4 19.55 4 19C4 18.45 4.45 18 5 18H21V8C21 7.45 21.45 7 22 7C22.55 7 23 7.45 23 8ZM4 16C2.34 16 1 14.66 1 13V7C1 5.34 2.34 4 4 4H16C17.66 4 19 5.34 19 7V14C19 15.1 18.1 16 17 16H4ZM7 10C7 11.66 8.34 13 10 13C11.66 13 13 11.66 13 10C13 8.34 11.66 7 10 7C8.34 7 7 8.34 7 10Z" fill={isActive('/dashboard/events') ? '#0066FF' : '#6B7380'}/>
            </svg>
              <span className="hidden font-inter text-base font-semibold md:inline">Payouts</span>
            </Link>
            
            <Link  href="/dashboard/settings" className={`flex items-center gap-4 px-4 py-3 text-sm font-medium ${
                isActive('/dashboard/settings') ? 'border-l-4 border-[#0066FF] text-[#0066FF]'  : 'text-[#6B7380]' }`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.5006 12C19.5006 11.77 19.4906 11.55 19.4706 11.32L21.3306 9.91C21.7306 9.61 21.8406 9.05 21.5906 8.61L19.7206 5.38C19.4706 4.94 18.9306 4.76 18.4706 4.96L16.3206 5.87C15.9506 5.61 15.5606 5.38 15.1506 5.19L14.8606 2.88C14.8006 2.38 14.3706 2 13.8706 2H10.1406C9.63064 2 9.20064 2.38 9.14064 2.88L8.85064 5.19C8.44064 5.38 8.05064 5.61 7.68064 5.87L5.53064 4.96C5.07064 4.76 4.53064 4.94 4.28064 5.38L2.41064 8.62C2.16064 9.06 2.27064 9.61 2.67064 9.92L4.53064 11.33C4.51064 11.55 4.50064 11.77 4.50064 12C4.50064 12.23 4.51064 12.45 4.53064 12.68L2.67064 14.09C2.27064 14.39 2.16064 14.95 2.41064 15.39L4.28064 18.62C4.53064 19.06 5.07064 19.24 5.53064 19.04L7.68064 18.13C8.05064 18.39 8.44064 18.62 8.85064 18.81L9.14064 21.12C9.20064 21.62 9.63064 22 10.1306 22H13.8606C14.3606 22 14.7906 21.62 14.8506 21.12L15.1406 18.81C15.5506 18.62 15.9406 18.39 16.3106 18.13L18.4606 19.04C18.9206 19.24 19.4606 19.06 19.7106 18.62L21.5806 15.39C21.8306 14.95 21.7206 14.4 21.3206 14.09L19.4606 12.68C19.4906 12.45 19.5006 12.23 19.5006 12ZM12.0406 15.5C10.1106 15.5 8.54064 13.93 8.54064 12C8.54064 10.07 10.1106 8.5 12.0406 8.5C13.9706 8.5 15.5406 10.07 15.5406 12C15.5406 13.93 13.9706 15.5 12.0406 15.5Z" fill={isActive('/dashboard/settings') ? '#0066FF' : '#6B7380'}/>
            </svg>
              <span className="hidden font-inter text-base font-semibold md:inline">Settings</span>
            </Link>
          </nav>
          
          <div className="border-t border-gray-200 p-4">
            <Link  href="/logout"  className="flex items-center gap-4 rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.10352 2H8.10352C8.65352 2 9.10352 1.55 9.10352 1C9.10352 0.45 8.65352 0 8.10352 0H2.10352C1.00352 0 0.103516 0.9 0.103516 2V16C0.103516 17.1 1.00352 18 2.10352 18H8.10352C8.65352 18 9.10352 17.55 9.10352 17C9.10352 16.45 8.65352 16 8.10352 16H2.10352V2Z" fill="#001433"/>
            <path d="M17.7535 8.65L14.9635 5.86C14.6435 5.54 14.1035 5.76 14.1035 6.21V8H7.10352C6.55352 8 6.10352 8.45 6.10352 9C6.10352 9.55 6.55352 10 7.10352 10H14.1035V11.79C14.1035 12.24 14.6435 12.46 14.9535 12.14L17.7435 9.35C17.9435 9.16 17.9435 8.84 17.7535 8.65Z" fill="#001433"/>
            </svg>
              <span className="hidden font-inter text-base font-semibold md:inline">Logout</span>
            </Link>
          </div>
        </div>
  )
}

export default Sidebar