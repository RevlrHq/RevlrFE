import React, { useState } from 'react';
import { EventCategory, CategoryInfo } from '../lib/constants/eventCategories';
import {
    useCategoryFilter,
    CategoryFilterState,
    CategoryFilterActions,
    CategoryFilterData,
} from '../hooks/useCategoryFilter';

interface CategoryFilterProps {
    onCategoryChange: (categories: EventCategory[]) => void;
    initialCategories?: EventCategory[];
    showGrouped?: boolean;
    showSearch?: boolean;
    maxHeight?: string;
    className?: string;
    variant?: 'tabs' | 'dropdown' | 'sidebar' | 'chips';
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
    onCategoryChange,
    initialCategories = [],
    showGrouped = false,
    showSearch = true,
    maxHeight = '400px',
    className = '',
    variant = 'dropdown',
}) => {
    const categoryFilter = useCategoryFilter(initialCategories, showGrouped);
    const { state, actions, data } = categoryFilter;

    // Handle category selection
    const handleCategoryToggle = (category: EventCategory) => {
        actions.toggleCategory(category);
        const newCategories = state.selectedCategories.includes(category)
            ? state.selectedCategories.filter((cat) => cat !== category)
            : [...state.selectedCategories, category];
        onCategoryChange(newCategories);
    };

    // Handle group selection
    const handleGroupToggle = (groupName: string) => {
        actions.toggleGroup(groupName);
        // Get updated categories after group toggle
        const groupCategories =
            data.categoriesByGroup[groupName]?.map((cat) => cat.value) || [];
        const isGroupSelected = state.selectedGroups.includes(groupName);

        let newCategories: EventCategory[];
        if (isGroupSelected) {
            newCategories = state.selectedCategories.filter(
                (cat) => !groupCategories.includes(cat)
            );
        } else {
            const categoriesToAdd = groupCategories.filter(
                (cat) => !state.selectedCategories.includes(cat)
            );
            newCategories = [...state.selectedCategories, ...categoriesToAdd];
        }
        onCategoryChange(newCategories);
    };

    // Handle clear all
    const handleClearAll = () => {
        actions.clearCategories();
        onCategoryChange([]);
    };

    // Render based on variant
    switch (variant) {
        case 'tabs':
            return (
                <TabsVariant
                    {...{
                        state,
                        actions,
                        data,
                        handleCategoryToggle,
                        onCategoryChange,
                        className,
                    }}
                />
            );
        case 'sidebar':
            return (
                <SidebarVariant
                    {...{
                        state,
                        actions,
                        data,
                        handleCategoryToggle,
                        handleGroupToggle,
                        handleClearAll,
                        showSearch,
                        maxHeight,
                        className,
                    }}
                />
            );
        case 'chips':
            return (
                <ChipsVariant
                    {...{
                        state,
                        actions,
                        data,
                        handleCategoryToggle,
                        className,
                    }}
                />
            );
        case 'dropdown':
        default:
            return (
                <DropdownVariant
                    {...{
                        state,
                        actions,
                        data,
                        handleCategoryToggle,
                        handleGroupToggle,
                        handleClearAll,
                        showSearch,
                        maxHeight,
                        className,
                    }}
                />
            );
    }
};

// Tabs variant (horizontal category tabs)
const TabsVariant: React.FC<{
    state: CategoryFilterState;
    actions: CategoryFilterActions;
    data: CategoryFilterData;
    handleCategoryToggle: (category: EventCategory) => void;
    onCategoryChange: (categories: EventCategory[]) => void;
    className: string;
}> = ({ state, data, handleCategoryToggle, onCategoryChange, className }) => {
    const displayCategories = data.filteredCategories.slice(0, 8); // Show first 8 categories

    return (
        <div className={`flex space-x-4 overflow-x-auto ${className}`}>
            <button
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    state.selectedCategories.length === 0
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => {
                    // Clear all categories when "All" is clicked
                    onCategoryChange([]);
                }}
            >
                All
            </button>
            {displayCategories.map((category: CategoryInfo) => (
                <button
                    key={category.value}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        state.selectedCategories.includes(category.value)
                            ? 'bg-blue-600 text-white dark:bg-blue-500'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => handleCategoryToggle(category.value)}
                >
                    {category.description}
                </button>
            ))}
        </div>
    );
};

// Dropdown variant
const DropdownVariant: React.FC<{
    state: CategoryFilterState;
    actions: CategoryFilterActions;
    data: CategoryFilterData;
    handleCategoryToggle: (category: EventCategory) => void;
    handleGroupToggle: (groupName: string) => void;
    handleClearAll: () => void;
    showSearch: boolean;
    maxHeight: string;
    className: string;
}> = ({
    state,
    actions,
    data,
    handleCategoryToggle,
    handleGroupToggle,
    handleClearAll,
    showSearch,
    maxHeight,
    className,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className='flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-left shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
                <span className='text-sm font-medium text-gray-700'>
                    {state.selectedCategories.length === 0
                        ? 'Select Categories'
                        : `${state.selectedCategories.length} selected`}
                </span>
                <svg
                    className={`size-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
            </button>

            {isOpen && (
                <div
                    className='absolute z-50 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg'
                    style={{ maxHeight }}
                >
                    <div className='p-3'>
                        {showSearch && (
                            <div className='mb-3'>
                                <input
                                    type='text'
                                    placeholder='Search categories...'
                                    value={state.searchTerm}
                                    onChange={(e) =>
                                        actions.setSearchTerm(e.target.value)
                                    }
                                    className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                                />
                            </div>
                        )}

                        <div className='mb-3 flex items-center justify-between'>
                            <button
                                onClick={() =>
                                    actions.setShowGrouped(!state.showGrouped)
                                }
                                className='text-sm text-blue-600 hover:text-blue-800'
                            >
                                {state.showGrouped
                                    ? 'Show All'
                                    : 'Group by Category'}
                            </button>
                            {data.hasActiveFilters && (
                                <button
                                    onClick={handleClearAll}
                                    className='text-sm text-red-600 hover:text-red-800'
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        <div
                            className='overflow-y-auto'
                            style={{ maxHeight: '300px' }}
                        >
                            {state.showGrouped ? (
                                <GroupedCategoryList
                                    categoriesByGroup={data.categoriesByGroup}
                                    selectedCategories={
                                        state.selectedCategories
                                    }
                                    selectedGroups={state.selectedGroups}
                                    onCategoryToggle={handleCategoryToggle}
                                    onGroupToggle={handleGroupToggle}
                                />
                            ) : (
                                <FlatCategoryList
                                    categories={data.filteredCategories}
                                    selectedCategories={
                                        state.selectedCategories
                                    }
                                    onCategoryToggle={handleCategoryToggle}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sidebar variant
const SidebarVariant: React.FC<{
    state: CategoryFilterState;
    actions: CategoryFilterActions;
    data: CategoryFilterData;
    handleCategoryToggle: (category: EventCategory) => void;
    handleGroupToggle: (groupName: string) => void;
    handleClearAll: () => void;
    showSearch: boolean;
    maxHeight: string;
    className: string;
}> = ({
    state,
    actions,
    data,
    handleCategoryToggle,
    handleGroupToggle,
    handleClearAll,
    showSearch,
    maxHeight,
    className,
}) => {
    return (
        <div
            className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}
        >
            <div className='mb-4 flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-gray-900'>
                    Categories
                </h3>
                {data.hasActiveFilters && (
                    <button
                        onClick={handleClearAll}
                        className='text-sm text-red-600 hover:text-red-800'
                    >
                        Clear All
                    </button>
                )}
            </div>

            {showSearch && (
                <div className='mb-4'>
                    <input
                        type='text'
                        placeholder='Search categories...'
                        value={state.searchTerm}
                        onChange={(e) => actions.setSearchTerm(e.target.value)}
                        className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                </div>
            )}

            <div className='mb-4'>
                <button
                    onClick={() => actions.setShowGrouped(!state.showGrouped)}
                    className='text-sm text-blue-600 hover:text-blue-800'
                >
                    {state.showGrouped ? 'Show All' : 'Group by Category'}
                </button>
            </div>

            <div className='overflow-y-auto' style={{ maxHeight }}>
                {state.showGrouped ? (
                    <GroupedCategoryList
                        categoriesByGroup={data.categoriesByGroup}
                        selectedCategories={state.selectedCategories}
                        selectedGroups={state.selectedGroups}
                        onCategoryToggle={handleCategoryToggle}
                        onGroupToggle={handleGroupToggle}
                    />
                ) : (
                    <FlatCategoryList
                        categories={data.filteredCategories}
                        selectedCategories={state.selectedCategories}
                        onCategoryToggle={handleCategoryToggle}
                    />
                )}
            </div>
        </div>
    );
};

// Chips variant (selected categories as removable chips)
const ChipsVariant: React.FC<{
    state: CategoryFilterState;
    actions: CategoryFilterActions;
    data: CategoryFilterData;
    handleCategoryToggle: (category: EventCategory) => void;
    className: string;
}> = ({ state, data, handleCategoryToggle, className }) => {
    if (state.selectedCategories.length === 0) {
        return (
            <div className={`text-sm text-gray-500 ${className}`}>
                No categories selected
            </div>
        );
    }

    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {state.selectedCategories.map((category) => {
                const categoryInfo = data.allCategories.find(
                    (cat: CategoryInfo) => cat.value === category
                );
                return (
                    <span
                        key={category}
                        className='inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800'
                    >
                        {categoryInfo?.description}
                        <button
                            onClick={() => handleCategoryToggle(category)}
                            className='ml-2 inline-flex size-4 items-center justify-center rounded-full hover:bg-blue-200'
                        >
                            <svg
                                className='size-3'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M6 18L18 6M6 6l12 12'
                                />
                            </svg>
                        </button>
                    </span>
                );
            })}
        </div>
    );
};

// Grouped category list component
const GroupedCategoryList: React.FC<{
    categoriesByGroup: Record<string, CategoryInfo[]>;
    selectedCategories: EventCategory[];
    selectedGroups: string[];
    onCategoryToggle: (category: EventCategory) => void;
    onGroupToggle: (groupName: string) => void;
}> = ({
    categoriesByGroup,
    selectedCategories,
    selectedGroups,
    onCategoryToggle,
    onGroupToggle,
}) => {
    return (
        <div className='space-y-4'>
            {Object.entries(categoriesByGroup).map(
                ([groupName, categories]) => (
                    <div key={groupName}>
                        <div className='mb-2 flex items-center'>
                            <input
                                type='checkbox'
                                id={`group-${groupName}`}
                                checked={selectedGroups.includes(groupName)}
                                onChange={() => onGroupToggle(groupName)}
                                className='size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                            />
                            <label
                                htmlFor={`group-${groupName}`}
                                className='ml-2 text-sm font-medium text-gray-900'
                            >
                                {groupName}
                            </label>
                        </div>
                        <div className='ml-6 space-y-1'>
                            {categories.map((category) => (
                                <div
                                    key={category.value}
                                    className='flex items-center'
                                >
                                    <input
                                        type='checkbox'
                                        id={category.value}
                                        checked={selectedCategories.includes(
                                            category.value
                                        )}
                                        onChange={() =>
                                            onCategoryToggle(category.value)
                                        }
                                        className='size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                                    />
                                    <label
                                        htmlFor={category.value}
                                        className='ml-2 text-sm text-gray-700'
                                    >
                                        {category.description}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

// Flat category list component
const FlatCategoryList: React.FC<{
    categories: CategoryInfo[];
    selectedCategories: EventCategory[];
    onCategoryToggle: (category: EventCategory) => void;
}> = ({ categories, selectedCategories, onCategoryToggle }) => {
    return (
        <div className='space-y-2'>
            {categories.map((category) => (
                <div key={category.value} className='flex items-center'>
                    <input
                        type='checkbox'
                        id={category.value}
                        checked={selectedCategories.includes(category.value)}
                        onChange={() => onCategoryToggle(category.value)}
                        className='size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                    />
                    <label
                        htmlFor={category.value}
                        className='ml-2 text-sm text-gray-700'
                    >
                        {category.description}
                        <span className='ml-1 text-xs text-gray-500'>
                            ({category.group})
                        </span>
                    </label>
                </div>
            ))}
        </div>
    );
};

export default CategoryFilter;
