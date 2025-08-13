'use client';

import { useTheme } from '@src/lib/ThemeContext';
import { CheckCircle, Clock, AlertCircle, WifiOff } from 'lucide-react';

interface DraftStatusIndicatorProps {
    isSaving: boolean;
    lastSaved?: Date;
    hasUnsavedChanges: boolean;
    hasError: boolean;
    isOnline: boolean;
}

export const DraftStatusIndicator = ({
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    hasError,
    isOnline,
}: DraftStatusIndicatorProps) => {
    const { theme } = useTheme();

    const getStatusInfo = () => {
        if (!isOnline) {
            return {
                icon: WifiOff,
                text: 'Offline - Changes saved locally',
                color: 'text-yellow-500',
                bgColor: 'bg-yellow-500/10',
            };
        }

        if (hasError) {
            return {
                icon: AlertCircle,
                text: 'Save failed - Saved locally',
                color: 'text-red-500',
                bgColor: 'bg-red-500/10',
            };
        }

        if (isSaving) {
            return {
                icon: Clock,
                text: 'Saving draft...',
                color: 'text-blue-500',
                bgColor: 'bg-blue-500/10',
            };
        }

        if (hasUnsavedChanges) {
            return {
                icon: Clock,
                text: 'Unsaved changes',
                color: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
                bgColor: theme === 'dark' ? 'bg-gray-400/10' : 'bg-gray-600/10',
            };
        }

        if (lastSaved) {
            const timeAgo = getTimeAgo(lastSaved);
            return {
                icon: CheckCircle,
                text: `Draft saved ${timeAgo}`,
                color: 'text-green-500',
                bgColor: 'bg-green-500/10',
            };
        }

        return {
            icon: Clock,
            text: 'Not saved',
            color: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
            bgColor: theme === 'dark' ? 'bg-gray-400/10' : 'bg-gray-600/10',
        };
    };

    const getTimeAgo = (date: Date): string => {
        const now = new Date();
        const diffInSeconds = Math.floor(
            (now.getTime() - date.getTime()) / 1000
        );

        if (diffInSeconds < 60) {
            return 'just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days}d ago`;
        }
    };

    const { icon: Icon, text, color, bgColor } = getStatusInfo();

    return (
        <div
            className={`flex items-center space-x-2 rounded-lg px-3 py-2 transition-all duration-200 ${bgColor}`}
        >
            <Icon
                size={16}
                className={`${color} ${isSaving ? 'animate-spin' : ''}`}
            />
            <span className={`font-inter text-sm ${color}`}>{text}</span>
            {!isOnline && (
                <WifiOff size={14} className='ml-1 text-yellow-500' />
            )}
        </div>
    );
};
