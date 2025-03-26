import { useState } from 'react'
import Link from 'next/link'

const EventBoard = () => {
    const [activeTab, setActiveTab] = useState('all-events');
      
        // Tabs for the events section
        const tabs = [
          { id: 'all-events', label: 'All Events' },
          { id: 'drafts', label: 'Drafts' },
          { id: 'active', label: 'Active' },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'past', label: 'Past' },
        ];
  return (
    <div>
        {/* Event Tabs */}
        <div className="border-b border-gray-200 bg-white px-4">
            <div className="flex space-x-4 px-1 py-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`font-inter text-sm font-normal ${
                    activeTab === tab.id 
                      ? 'rounded-lg bg-[#E5F0FF] px-3 py-2 font-medium text-[#0066FF]' 
                      : 'rounded-lg bg-[#F2F3F5] px-3 py-2 text-[#6B7380]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Empty State */}
          <div className="flex flex-1 flex-col items-center justify-center p-4">
            <div className="mb-4 rounded-full bg-[#E5F0FF] p-12">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.99805 29.102V34.1686C4.99805 34.6353 5.36471 35.002 5.83138 35.002H10.898C11.1147 35.002 11.3314 34.9186 11.4814 34.752L29.6814 16.5686L23.4314 10.3186L5.24805 28.502C5.08138 28.6686 4.99805 28.8686 4.99805 29.102ZM34.5147 11.7353C35.1647 11.0853 35.1647 10.0353 34.5147 9.3853L30.6147 5.4853C29.9647 4.8353 28.9147 4.8353 28.2647 5.4853L25.2147 8.5353L31.4647 14.7853L34.5147 11.7353Z" fill="#3D8BFF"/>
                </svg>


            </div>
            <h2 className="mb-2 text-xl font-medium font-inter text-[#001433]">Welcome to REVLR</h2>
            <p className="mb-6 text-xl font-medium font-inter text-[#001433]">
              Create your first event to start hosting memories
            </p>
            <Link 
              href="/create-event"
              className="rounded-md bg-[#0066FF] px-6 py-4 text-base font-semibold font-inter text-white"
            >
              Create Event
            </Link>
          </div>
    </div>
  )
}

export default EventBoard