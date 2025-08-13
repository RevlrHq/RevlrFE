'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@src/lib/ThemeContext';
import {
    EventCategory,
    CATEGORY_DESCRIPTIONS,
    getCategoriesByGroup,
    searchCategories,
    type CategoryInfo,
} from '@src/lib/constants/eventCategories';

interface CategorySelectorProps {
    value: string;
    onChange: (category: string) => void;
    error?: string;
    placeholder?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
    value,
    onChange,
    error,
    placeholder = 'Select Category',
}) => {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCategories, setFilteredCategories] = useState<
        CategoryInfo[]
    >([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const categoriesByGroup = getCategoriesByGroup();

    // Handle search and filtering
    useEffect(() => {
        if (searchTerm.trim()) {
            const results = searchCategories(searchTerm);
            setFilteredCategories(results);
        } else {
            setFilteredCategories([]);
        }
    }, [searchTerm]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCategorySelect = (category: EventCategory) => {
        onChange(category);
        setIsOpen(false);
        setSearchTerm('');
    };

    const getSelectedCategoryLabel = () => {
        if (!value) return placeholder;
        return CATEGORY_DESCRIPTIONS[value as EventCategory] || value;
    };

    const inputClassName = `
        w-full rounded-xl border p-4 font-inter text-sm transition-all duration-200 cursor-pointer
        ${
            error
                ? 'border-red-500 focus:ring-red-500/20'
                : theme === 'dark'
                  ? 'border-revlr-dark-border bg-revlr-dark-bg text-white focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-revlr-primary-blue focus:ring-revlr-primary-blue/20'
        }
        focus:outline-none focus:ring-2
    `;

    const dropdownClassName = `
        absolute z-50 mt-1 w-full rounded-xl border shadow-lg max-h-80 overflow-y-auto
        ${
            theme === 'dark'
                ? 'border-revlr-dark-border bg-revlr-dark-card'
                : 'border-gray-200 bg-white'
        }
    `;

    return (
        <div className='relative' ref={dropdownRef}>
            <div
                className={inputClassName}
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        setTimeout(() => inputRef.current?.focus(), 100);
                    }
                }}
            >
                <div className='flex items-center justify-between'>
                    <span
                        className={
                            value
                                ? ''
                                : theme === 'dark'
                                  ? 'text-gray-400'
                                  : 'text-gray-500'
                        }
                    >
                        {getSelectedCategoryLabel()}
                    </span>
                    <svg
                        className={`size-5 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                        } ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 9l-7 7-7-7'
                        />
                    </svg>
                </div>
            </div>

            {error && (
                <p className='mt-1 font-inter text-sm text-red-500'>{error}</p>
            )}

            {isOpen && (
                <div className={dropdownClassName}>
                    {/* Search Input */}
                    <div className='border-b border-gray-200 p-3 dark:border-revlr-dark-border'>
                        <input
                            ref={inputRef}
                            type='text'
                            placeholder='Search categories...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full rounded-lg border p-2 font-inter text-sm ${
                                theme === 'dark'
                                    ? 'border-revlr-dark-border bg-revlr-dark-bg text-white placeholder:text-gray-400'
                                    : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-500'
                            } focus:outline-none focus:ring-1 focus:ring-revlr-primary-blue`}
                        />
                    </div>

                    {/* Search Results */}
                    {searchTerm.trim() && filteredCategories.length > 0 && (
                        <div className='p-2'>
                            <div
                                className={`mb-2 px-2 py-1 font-inter text-xs font-semibold uppercase tracking-wide ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-500'
                                }`}
                            >
                                Search Results
                            </div>
                            {filteredCategories.map((category) => (
                                <button
                                    key={category.value}
                                    type='button'
                                    onClick={() =>
                                        handleCategorySelect(category.value)
                                    }
                                    className={`w-full rounded-lg p-2 text-left font-inter text-sm transition-colors duration-200 ${
                                        value === category.value
                                            ? 'bg-revlr-primary-blue text-white'
                                            : theme === 'dark'
                                              ? 'text-gray-300 hover:bg-revlr-dark-border/20'
                                              : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className='font-medium'>
                                        {category.description}
                                    </div>
                                    <div
                                        className={`text-xs ${
                                            value === category.value
                                                ? 'text-blue-100'
                                                : theme === 'dark'
                                                  ? 'text-gray-400'
                                                  : 'text-gray-500'
                                        }`}
                                    >
                                        {category.group}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Grouped Categories */}
                    {!searchTerm.trim() && (
                        <div className='p-2'>
                            {Object.entries(categoriesByGroup).map(
                                ([groupName, categories]) => (
                                    <div
                                        key={groupName}
                                        className='mb-4 last:mb-0'
                                    >
                                        <div
                                            className={`mb-2 px-2 py-1 font-inter text-xs font-semibold uppercase tracking-wide ${
                                                theme === 'dark'
                                                    ? 'text-gray-400'
                                                    : 'text-gray-500'
                                            }`}
                                        >
                                            {groupName}
                                        </div>
                                        <div className='space-y-1'>
                                            {categories.map((category) => (
                                                <button
                                                    key={category.value}
                                                    type='button'
                                                    onClick={() =>
                                                        handleCategorySelect(
                                                            category.value
                                                        )
                                                    }
                                                    className={`w-full rounded-lg p-2 text-left font-inter text-sm transition-colors duration-200 ${
                                                        value === category.value
                                                            ? 'bg-revlr-primary-blue text-white'
                                                            : theme === 'dark'
                                                              ? 'text-gray-300 hover:bg-revlr-dark-border/20'
                                                              : 'text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {category.description}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}

                    {/* No Results */}
                    {searchTerm.trim() && filteredCategories.length === 0 && (
                        <div className='p-4 text-center'>
                            <p
                                className={`font-inter text-sm ${
                                    theme === 'dark'
                                        ? 'text-gray-400'
                                        : 'text-gray-500'
                                }`}
                            >
                                No categories found for &quot;{searchTerm}&quot;
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
