'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../../../lib/ThemeContext';

interface SidebarItem {
    name: string;
    path: string;
    icon: (color: string) => React.ReactNode;
    subcategories?: string[];
}

const userNavigationItems = [
    {
        name: 'Dashboard',
        path: '/user-dashboard',
        icon: (color: string) => (
            <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
            >
                <path
                    d='M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z'
                    fill={color}
                />
            </svg>
        ),
        subcategories: [],
    },
    {
        name: 'Browse Events',
        path: '/events',
        icon: (color: string) => (
            <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
            >
                <path
                    d='M15.5 14H20.5L22 15.5V20.5L20.5 22H15.5L14 20.5V15.5L15.5 14ZM16 16V20H20V16H16ZM10 2C13.31 2 16 4.69 16 8C16 11.31 13.31 14 10 14C6.69 14 4 11.31 4 8C4 4.69 6.69 2 10 2ZM10 4C7.79 4 6 5.79 6 8C6 10.21 7.79 12 10 12C12.21 12 14 10.21 14 8C14 5.79 12.21 4 10 4Z'
                    fill={color}
                />
            </svg>
        ),
        subcategories: [],
    },
    {
        name: 'My Tickets',
        path: '/user-dashboard/tickets',
        icon: (color: string) => (
            <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
            >
                <path
                    d='M22 10V6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V10C3.1 10 4 10.9 4 12C4 13.1 3.1 14 2 14V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V14C20.9 14 20 13.1 20 12C20 10.9 20.9 10 22 10ZM13 17.5H11V16.5H13V17.5ZM13 15.5H11V14.5H13V15.5ZM13 13.5H11V12.5H13V13.5ZM13 11.5H11V10.5H13V11.5ZM13 9.5H11V8.5H13V9.5ZM13 7.5H11V6.5H13V7.5Z'
                    fill={color}
                />
            </svg>
        ),
        subcategories: ['/tickets/upcoming', '/tickets/past'],
    },
    {
        name: 'Saved Events',
        path: '/user-dashboard/saved',
        icon: (color: string) => (
            <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
            >
                <path
                    d='M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z'
                    fill={color}
                />
            </svg>
        ),
        subcategories: [],
    },
    {
        name: 'Friends',
        path: '/user-dashboard/friends',
        icon: (color: string) => (
            <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
            >
                <path
                    d='M16 4C18.21 4 20 5.79 20 8C20 10.21 18.21 12 16 12C13.79 12 12 10.21 12 8C12 5.79 13.79 4 16 4ZM16 14C18.67 14 24 15.34 24 18V20H8V18C8 15.34 13.33 14 16 14ZM8 4C10.21 4 12 5.79 12 8C12 10.21 10.21 12 8 12C5.79 12 4 10.21 4 8C4 5.79 5.79 4 8 4ZM8 14C10.67 14 16 15.34 16 18V20H0V18C0 15.34 5.33 14 8 14Z'
                    fill={color}
                />
            </svg>
        ),
        subcategories: ['/friends/following', '/friends/invites'],
    },
    {
        name: 'Settings',
        path: '/user-dashboard/settings',
        icon: (color: string) => (
            <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
            >
                <path
                    d='M19.5006 12C19.5006 11.77 19.4906 11.55 19.4706 11.32L21.3306 9.91C21.7306 9.61 21.8406 9.05 21.5906 8.61L19.7206 5.38C19.4706 4.94 18.9306 4.76 18.4706 4.96L16.3206 5.87C15.9506 5.61 15.5606 5.38 15.1506 5.19L14.8606 2.88C14.8006 2.38 14.3706 2 13.8706 2H10.1406C9.63064 2 9.20064 2.38 9.14064 2.88L8.85064 5.19C8.44064 5.38 8.05064 5.61 7.68064 5.87L5.53064 4.96C5.07064 4.76 4.53064 4.94 4.28064 5.38L2.41064 8.62C2.16064 9.06 2.27064 9.61 2.67064 9.92L4.53064 11.33C4.51064 11.55 4.50064 11.77 4.50064 12C4.50064 12.23 4.51064 12.45 4.53064 12.68L2.67064 14.09C2.27064 14.39 2.16064 14.95 2.41064 15.39L4.28064 18.62C4.53064 19.06 5.07064 19.24 5.53064 19.04L7.68064 18.13C8.05064 18.39 8.44064 18.62 8.85064 18.81L9.14064 21.12C9.20064 21.62 9.63064 22 10.1306 22H13.8606C14.3606 22 14.7906 21.62 14.8506 21.12L15.1406 18.81C15.5506 18.62 15.9406 18.39 16.3106 18.13L18.4606 19.04C18.9206 19.24 19.4606 19.06 19.7106 18.62L21.5806 15.39C21.8306 14.95 21.7206 14.4 21.3206 14.09L19.4606 12.68C19.4906 12.45 19.5006 12.23 19.5006 12ZM12.0406 15.5C10.1106 15.5 8.54064 13.93 8.54064 12C8.54064 10.07 10.1106 8.5 12.0406 8.5C13.9706 8.5 15.5406 10.07 15.5406 12C15.5406 13.93 13.9706 15.5 12.0406 15.5Z'
                    fill={color}
                />
            </svg>
        ),
        subcategories: [
            '/settings/profile',
            '/settings/preferences',
            '/settings/notifications',
        ],
    },
];

const UserSidebar = () => {
    const pathname = usePathname();
    const { theme } = useTheme();

    const isActive = (item: SidebarItem) => {
        if (pathname === item.path) return true;
        if (item.subcategories) {
            return item.subcategories.some(
                (subPath: string) =>
                    pathname === subPath ||
                    pathname.startsWith(`/dashboard${subPath}`)
            );
        }

        return false;
    };

    return (
        <div
            className={`flex w-16 flex-col border-r md:w-64 ${
                theme === 'dark'
                    ? 'border-revlr-dark-border bg-revlr-dark-card'
                    : 'border-gray-200 bg-white'
            }`}
        >
            <div
                className={`border-b px-8 py-6 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border'
                        : 'border-gray-200'
                }`}
            >
                <Link
                    href='/'
                    className='text-xl font-bold text-revlr-primary-blue'
                >
                    ✨REVLR
                </Link>
            </div>

            <nav className='flex-1 space-y-2 pt-4'>
                {userNavigationItems.map((item: SidebarItem) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center gap-4 px-4 py-3 text-sm font-medium transition-colors ${
                            isActive(item)
                                ? 'border-l-4 border-revlr-primary-blue bg-revlr-primary-blue/5 text-revlr-primary-blue'
                                : `${theme === 'dark' ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white' : 'text-[#6B7380] hover:bg-gray-50 hover:text-gray-900'}`
                        }`}
                    >
                        {item.icon(
                            isActive(item)
                                ? '#0066FF'
                                : theme === 'dark'
                                  ? '#9CA3AF'
                                  : '#6B7380'
                        )}
                        <span className='hidden font-inter text-base font-semibold md:inline'>
                            {item.name}
                        </span>
                    </Link>
                ))}
            </nav>

            <div
                className={`border-t p-4 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border'
                        : 'border-gray-200'
                }`}
            >
                <Link
                    href='/logout'
                    className={`flex items-center gap-4 rounded px-4 py-2 text-sm font-medium transition-colors ${
                        theme === 'dark'
                            ? 'text-gray-400 hover:bg-revlr-dark-border hover:text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <svg
                        width='18'
                        height='18'
                        viewBox='0 0 18 18'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                    >
                        <path
                            d='M2.10352 2H8.10352C8.65352 2 9.10352 1.55 9.10352 1C9.10352 0.45 8.65352 0 8.10352 0H2.10352C1.00352 0 0.103516 0.9 0.103516 2V16C0.103516 17.1 1.00352 18 2.10352 18H8.10352C8.65352 18 9.10352 17.55 9.10352 17C9.10352 16.45 8.65352 16 8.10352 16H2.10352V2Z'
                            fill={theme === 'dark' ? '#9CA3AF' : '#001433'}
                        />
                        <path
                            d='M17.7535 8.65L14.9635 5.86C14.6435 5.54 14.1035 5.76 14.1035 6.21V8H7.10352C6.55352 8 6.10352 8.45 6.10352 9C6.10352 9.55 6.55352 10 7.10352 10H14.1035V11.79C14.1035 12.24 14.6435 12.46 14.9535 12.14L17.7435 9.35C17.9435 9.16 17.9435 8.84 17.7535 8.65Z'
                            fill={theme === 'dark' ? '#9CA3AF' : '#001433'}
                        />
                    </svg>
                    <span className='hidden font-inter text-base font-semibold md:inline'>
                        Logout
                    </span>
                </Link>
            </div>
        </div>
    );
};

export default UserSidebar;
