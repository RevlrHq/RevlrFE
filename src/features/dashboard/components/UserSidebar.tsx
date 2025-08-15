'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../../../lib/ThemeContext';
import { useAuthStore } from '../../../stores/authStore';
import {
    LayoutDashboard,
    Search,
    Ticket,
    Heart,
    Users,
    Settings,
    LogOut,
    Sparkles,
    // Calendar,
    Star,
} from 'lucide-react';

interface SidebarItem {
    name: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    subcategories?: string[];
    badge?: string;
}

const userNavigationItems: SidebarItem[] = [
    {
        name: 'Dashboard',
        path: '/user-dashboard',
        icon: LayoutDashboard,
        subcategories: [],
    },
    {
        name: 'Browse Events',
        path: '/events',
        icon: Search,
        subcategories: [],
        badge: 'Hot',
    },
    {
        name: 'My Tickets',
        path: '/user-dashboard/tickets',
        icon: Ticket,
        subcategories: ['/tickets/upcoming', '/tickets/past'],
    },
    {
        name: 'Saved Events',
        path: '/user-dashboard/saved',
        icon: Heart,
        subcategories: [],
    },
    {
        name: 'Friends',
        path: '/user-dashboard/friends',
        icon: Users,
        subcategories: ['/friends/following', '/friends/invites'],
    },
    {
        name: 'Settings',
        path: '/user-dashboard/settings',
        icon: Settings,
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
    const { user } = useAuthStore();

    const isActive = (item: SidebarItem) => {
        if (pathname === item.path) return true;
        if (item.subcategories) {
            return item.subcategories.some(
                (subPath: string) =>
                    pathname === subPath ||
                    pathname.startsWith(`/user-dashboard${subPath}`)
            );
        }
        return false;
    };

    const getUserInitials = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return 'U';
    };

    const getUserDisplayName = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        if (user?.firstName) {
            return user.firstName;
        }
        return user?.email?.split('@')[0] || 'User';
    };

    return (
        <div
            className={`relative flex w-16 flex-col border-r md:w-64 ${
                theme === 'dark'
                    ? 'border-revlr-dark-border bg-gradient-to-b from-revlr-dark-card via-revlr-dark-card to-revlr-dark-card/95'
                    : 'border-gray-200 bg-gradient-to-b from-white via-revlr-primary-grey/20 to-white'
            } backdrop-blur-sm`}
        >
            {/* Gradient overlay */}
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-b from-revlr-primary-blue/5 via-transparent to-revlr-accent-purple/5' />

            {/* Logo Section */}
            <div
                className={`relative border-b p-6 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border/50'
                        : 'border-gray-200/50'
                }`}
            >
                <Link href='/' className='group flex items-center gap-2'>
                    <div className='rounded-xl bg-gradient-to-br from-revlr-primary-blue to-revlr-accent-purple p-2 shadow-lg transition-all duration-200 group-hover:shadow-xl'>
                        <Sparkles className='size-5 text-white' />
                    </div>
                    <span className='hidden bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple bg-clip-text text-xl font-bold text-transparent md:block'>
                        REVLR
                    </span>
                </Link>
            </div>

            {/* User Info Section */}
            <div
                className={`relative border-b p-4 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border/50'
                        : 'border-gray-200/50'
                }`}
            >
                <div
                    className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
                        theme === 'dark'
                            ? 'bg-gradient-to-br from-revlr-primary-blue/10 to-revlr-accent-purple/10 hover:from-revlr-primary-blue/20 hover:to-revlr-accent-purple/20'
                            : 'bg-gradient-to-br from-revlr-primary-blue/5 to-revlr-accent-purple/5 hover:from-revlr-primary-blue/10 hover:to-revlr-accent-purple/10'
                    } border border-white/10`}
                >
                    <div className='flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-revlr-primary-blue to-revlr-accent-purple text-sm font-semibold text-white shadow-inner md:size-10'>
                        {getUserInitials()}
                    </div>
                    <div className='hidden min-w-0 flex-1 flex-col md:flex'>
                        <span
                            className={`truncate text-sm font-semibold ${
                                theme === 'dark'
                                    ? 'text-white'
                                    : 'text-[#001433]'
                            }`}
                        >
                            {getUserDisplayName()}
                        </span>
                        <span
                            className={`truncate text-xs ${
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }`}
                        >
                            Event Explorer
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className='relative flex-1 space-y-1 px-3 py-4'>
                {userNavigationItems.map((item: SidebarItem) => {
                    const IconComponent = item.icon;
                    const active = isActive(item);

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`group relative flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition-all duration-200 ${
                                active
                                    ? `${
                                          theme === 'dark'
                                              ? 'border-l-4 border-revlr-primary-blue bg-gradient-to-r from-revlr-primary-blue/20 to-revlr-accent-purple/20 text-revlr-primary-blue shadow-lg'
                                              : 'border-l-4 border-revlr-primary-blue bg-gradient-to-r from-revlr-primary-blue/10 to-revlr-accent-purple/10 text-revlr-primary-blue shadow-md'
                                      }`
                                    : `${
                                          theme === 'dark'
                                              ? 'text-gray-400 hover:bg-gradient-to-r hover:from-revlr-dark-border/50 hover:to-revlr-dark-border/30 hover:text-white'
                                              : 'text-[#6B7380] hover:bg-gradient-to-r hover:from-gray-100/80 hover:to-gray-50 hover:text-gray-900'
                                      } hover:shadow-sm`
                            }`}
                        >
                            {/* Active indicator */}
                            {active && (
                                <div className='absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-revlr-primary-blue to-revlr-accent-purple' />
                            )}

                            <div
                                className={`rounded-lg p-1.5 transition-all ${
                                    active
                                        ? 'bg-gradient-to-br from-revlr-primary-blue/20 to-revlr-accent-purple/20'
                                        : 'group-hover:bg-white/10'
                                }`}
                            >
                                <IconComponent className='size-5' />
                            </div>

                            <span className='hidden font-inter font-semibold md:inline'>
                                {item.name}
                            </span>

                            {/* Badge */}
                            {item.badge && (
                                <span className='ml-auto hidden rounded-full bg-gradient-to-r from-revlr-accent-orange to-revlr-primary-yellow px-2 py-0.5 text-xs font-medium text-white shadow-sm md:inline'>
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div
                className={`relative border-t p-4 ${
                    theme === 'dark'
                        ? 'border-revlr-dark-border/50'
                        : 'border-gray-200/50'
                }`}
            >
                {/* Quick Stats */}
                <div
                    className={`mb-4 hidden rounded-xl p-3 md:block ${
                        theme === 'dark'
                            ? 'bg-gradient-to-br from-revlr-accent-purple/10 to-revlr-accent-purple/5'
                            : 'bg-gradient-to-br from-revlr-accent-purple/10 to-revlr-accent-purple/5'
                    } border border-revlr-accent-purple/20`}
                >
                    <div className='mb-1 flex items-center gap-2'>
                        <Star className='size-4 text-revlr-accent-purple' />
                        <span
                            className={`text-xs font-medium ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-700'
                            }`}
                        >
                            This Month
                        </span>
                    </div>
                    <div className='flex justify-between text-sm'>
                        <span
                            className={
                                theme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                            }
                        >
                            Events Attended
                        </span>
                        <span className='font-semibold text-revlr-accent-purple'>
                            5
                        </span>
                    </div>
                </div>

                {/* Logout */}
                <Link
                    href='/logout'
                    className={`flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition-all duration-200 ${
                        theme === 'dark'
                            ? 'text-gray-400 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-600/20 hover:text-red-400'
                            : 'text-gray-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-600'
                    } group hover:shadow-sm`}
                >
                    <div className='rounded-lg p-1.5 transition-all group-hover:bg-red-500/20'>
                        <LogOut className='size-5' />
                    </div>
                    <span className='hidden font-inter font-semibold md:inline'>
                        Sign Out
                    </span>
                </Link>
            </div>
        </div>
    );
};

export default UserSidebar;
