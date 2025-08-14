'use client';

import React from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { Search, Image, Lightbulb, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
    type?: 'no-results' | 'no-search' | 'error';
    searchQuery?: string;
    onRetry?: () => void;
    suggestions?: string[];
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    type = 'no-results',
    searchQuery,
    onRetry,
    suggestions = [],
    className = '',
}) => {
    const { theme } = useTheme();

    const getEmptyStateContent = () => {
        switch (type) {
            case 'no-search':
                return {
                    icon: Image,
                    title: 'Discover Amazing Images',
                    description:
                        'Search for high-quality images and videos from top providers like Unsplash, Pexels, and Pixabay.',
                    suggestions: [
                        'Try searching for "conference" or "business meeting"',
                        'Browse by categories like "technology" or "nature"',
                        'Use specific terms like "team collaboration" or "office space"',
                    ],
                };

            case 'error':
                return {
                    icon: RefreshCw,
                    title: 'Something Went Wrong',
                    description:
                        'We encountered an error while searching for images. Please try again.',
                    suggestions: [
                        'Check your internet connection',
                        'Try a different search term',
                        'Refresh the page and try again',
                    ],
                };

            case 'no-results':
            default:
                return {
                    icon: Search,
                    title: searchQuery
                        ? `No results for "${searchQuery}"`
                        : 'No Images Found',
                    description: searchQuery
                        ? "We couldn't find any images matching your search. Try different keywords or browse our suggestions below."
                        : 'No images found. Try searching for something specific.',
                    suggestions:
                        suggestions.length > 0
                            ? suggestions
                            : [
                                  'Try broader search terms like "business" or "technology"',
                                  'Check your spelling and try again',
                                  'Use different keywords or synonyms',
                                  'Remove filters to see more results',
                              ],
                };
        }
    };

    const {
        icon: Icon,
        title,
        description,
        suggestions: defaultSuggestions,
    } = getEmptyStateContent();
    const displaySuggestions =
        suggestions.length > 0 ? suggestions : defaultSuggestions;

    return (
        <div className={`flex h-64 items-center justify-center ${className}`}>
            <div className='max-w-md text-center'>
                {/* Icon */}
                <div className='mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-revlr-primary-blue/10 to-revlr-accent-purple/10'>
                    <Icon
                        className={`size-8 ${
                            theme === 'dark'
                                ? 'text-revlr-primary-blue'
                                : 'text-revlr-primary-blue'
                        }`}
                    />
                </div>

                {/* Title */}
                <h3
                    className={`mb-3 font-inter text-lg font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}
                >
                    {title}
                </h3>

                {/* Description */}
                <p
                    className={`mb-6 font-inter text-sm leading-relaxed ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                    {description}
                </p>

                {/* Retry Button (for error state) */}
                {type === 'error' && onRetry && (
                    <button
                        onClick={onRetry}
                        className='mb-6 inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-revlr-primary-blue to-revlr-accent-purple px-4 py-2 font-inter font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20'
                    >
                        <RefreshCw className='size-4' />
                        <span>Try Again</span>
                    </button>
                )}

                {/* Suggestions */}
                {displaySuggestions.length > 0 && (
                    <div className='text-left'>
                        <div className='mb-3 flex items-center justify-center space-x-2'>
                            <Lightbulb
                                className={`size-4 ${
                                    theme === 'dark'
                                        ? 'text-yellow-400'
                                        : 'text-yellow-500'
                                }`}
                            />
                            <span
                                className={`font-inter text-sm font-medium ${
                                    theme === 'dark'
                                        ? 'text-yellow-400'
                                        : 'text-yellow-600'
                                }`}
                            >
                                Suggestions
                            </span>
                        </div>
                        <ul className='space-y-2'>
                            {displaySuggestions
                                .slice(0, 4)
                                .map((suggestion, index) => (
                                    <li
                                        key={index}
                                        className={`flex items-start space-x-2 font-inter text-sm ${
                                            theme === 'dark'
                                                ? 'text-gray-300'
                                                : 'text-gray-700'
                                        }`}
                                    >
                                        <span
                                            className={`mt-1.5 size-1.5 flex-shrink-0 rounded-full ${
                                                theme === 'dark'
                                                    ? 'bg-gray-500'
                                                    : 'bg-gray-400'
                                            }`}
                                        />
                                        <span>{suggestion}</span>
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}

                {/* Popular search terms (for no-search state) */}
                {type === 'no-search' && (
                    <div className='mt-6'>
                        <p
                            className={`mb-3 font-inter text-sm font-medium ${
                                theme === 'dark'
                                    ? 'text-gray-300'
                                    : 'text-gray-700'
                            }`}
                        >
                            Popular searches:
                        </p>
                        <div className='flex flex-wrap justify-center gap-2'>
                            {[
                                'conference',
                                'business',
                                'technology',
                                'team',
                                'office',
                                'meeting',
                            ].map((term) => (
                                <button
                                    key={term}
                                    className={`rounded-full border px-3 py-1 font-inter text-xs transition-colors hover:border-revlr-primary-blue hover:bg-revlr-primary-blue hover:text-white focus:outline-none focus:ring-2 focus:ring-revlr-primary-blue/20 ${
                                        theme === 'dark'
                                            ? 'border-revlr-dark-border bg-revlr-dark-card text-gray-300'
                                            : 'border-gray-300 bg-white text-gray-700'
                                    }`}
                                    onClick={() => {
                                        // This would trigger a search for the term
                                        // Implementation depends on parent component
                                        const event = new CustomEvent(
                                            'search-suggestion',
                                            {
                                                detail: { term },
                                            }
                                        );
                                        window.dispatchEvent(event);
                                    }}
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
