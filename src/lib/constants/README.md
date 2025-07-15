# Event Category Filtering System

This document describes the comprehensive event category filtering system implemented to replace the previous string-based approach with a robust, enum-based system that supports advanced filtering capabilities.

## Overview

The new system provides:

- **Type-safe category handling** with enum-based categories
- **Multiple filtering options** (single, multiple, grouped, search)
- **Reusable components** across different parts of the application
- **Backward compatibility** with existing legacy categories
- **Enhanced user experience** with grouped categories and search functionality

## Architecture

### Core Components

1. **Event Categories (`eventCategories.ts`)**

    - Defines 24 comprehensive event categories
    - Provides category grouping and metadata
    - Includes utility functions for category operations

2. **Category Filter Hook (`useCategoryFilter.ts`)**

    - Manages category filter state and actions
    - Provides search and grouping functionality
    - Handles multiple category selection

3. **Category Filter Component (`CategoryFilter.tsx`)**
    - Reusable UI component with multiple variants
    - Supports tabs, dropdown, sidebar, and chips layouts
    - Configurable search and grouping options

## Available Categories

The system includes 24 predefined categories organized into 6 groups:

### Business & Professional

- Business & Professional
- Technology & Innovation
- Finance & Investment
- Marketing & Sales
- Real Estate

### Arts & Entertainment

- Arts & Culture
- Music & Entertainment
- Fashion & Beauty
- Photography
- Film & Media

### Health & Lifestyle

- Health & Wellness
- Sports & Fitness
- Food & Drink
- Travel & Adventure

### Education & Community

- Education & Learning
- Community & Social
- Family & Kids
- Charity & Causes

### Technology & Gaming

- Technology & Innovation
- Gaming & Esports
- Science & Research

### Other

- Religion & Spirituality
- Government & Politics
- Automotive
- Other

## Usage Examples

### Basic Category Filter

```tsx
import CategoryFilter from '../components/CategoryFilter';
import { EventCategory } from '../lib/constants/eventCategories';

function MyComponent() {
    const handleCategoryChange = (categories: EventCategory[]) => {
        console.log('Selected categories:', categories);
        // Apply filtering logic
    };

    return (
        <CategoryFilter
            variant='dropdown'
            onCategoryChange={handleCategoryChange}
            showSearch={true}
            showGrouped={false}
        />
    );
}
```

### Using the Category Filter Hook

```tsx
import { useCategoryFilter } from '../hooks/useCategoryFilter';
import { EventCategory } from '../lib/constants/eventCategories';

function MyComponent() {
    const categoryFilter = useCategoryFilter();
    const { state, actions, data } = categoryFilter;

    const handleSelectTech = () => {
        actions.toggleCategory(EventCategory.TechnologyInnovation);
    };

    const handleSelectBusinessGroup = () => {
        actions.toggleGroup('Business & Professional');
    };

    return (
        <div>
            <button onClick={handleSelectTech}>Toggle Technology</button>
            <button onClick={handleSelectBusinessGroup}>
                Toggle Business Group
            </button>

            {/* Display selected categories */}
            <div>Selected: {data.selectedCategoryDescriptions.join(', ')}</div>
        </div>
    );
}
```

### Tab Variant

```tsx
<CategoryFilter
    variant='tabs'
    onCategoryChange={handleCategoryChange}
    showSearch={false}
    className='w-full'
/>
```

### Sidebar Variant

```tsx
<CategoryFilter
    variant='sidebar'
    onCategoryChange={handleCategoryChange}
    showSearch={true}
    showGrouped={true}
    maxHeight='500px'
    className='w-64'
/>
```

### Chips Variant (Display Selected)

```tsx
<CategoryFilter
    variant='chips'
    onCategoryChange={handleCategoryChange}
    initialCategories={selectedCategories}
    className='mb-4'
/>
```

## API Integration

### Converting Categories to API Parameters

```tsx
import { useCategoryFilterToApi } from '../hooks/useCategoryFilter';

function MyComponent() {
    const categoryFilter = useCategoryFilter();
    const { state } = categoryFilter;
    const apiParams = useCategoryFilterToApi(state);

    // apiParams will be:
    // {} - if no categories selected
    // { category: "TechnologyInnovation" } - if single category
    // { categories: ["Tech", "Business"] } - if multiple categories
}
```

### Legacy Category Mapping

The system provides backward compatibility with existing hardcoded categories:

```tsx
import { mapLegacyCategory } from '../lib/constants/eventCategories';

// Maps old category names to new enum values
const techCategory = mapLegacyCategory('Tech'); // Returns EventCategory.TechnologyInnovation
const artCategory = mapLegacyCategory('Art'); // Returns EventCategory.ArtsCulture
```

## Component Variants

### 1. Tabs Variant

- **Use case**: Horizontal category navigation
- **Features**: Shows first 8 categories as tabs with "All" option
- **Best for**: Main navigation, landing pages

### 2. Dropdown Variant

- **Use case**: Compact category selection
- **Features**: Search, grouping, multiple selection
- **Best for**: Filters, forms, limited space

### 3. Sidebar Variant

- **Use case**: Detailed category filtering
- **Features**: Full search, grouping, clear all
- **Best for**: Filter panels, admin interfaces

### 4. Chips Variant

- **Use case**: Display selected categories
- **Features**: Shows selected categories as removable chips
- **Best for**: Active filter display, confirmation

## Advanced Features

### Category Search

```tsx
import { searchCategories } from '../lib/constants/eventCategories';

const results = searchCategories('music');
// Returns categories matching "music" in name, description, or group
```

### Category Grouping

```tsx
import { getCategoriesByGroup } from '../lib/constants/eventCategories';

const grouped = getCategoriesByGroup();
// Returns categories organized by their groups
```

### Utility Functions

```tsx
import {
    getAllCategories,
    getGroupForCategory,
    fromString,
    fromStringList,
} from '../lib/constants/eventCategories';

// Get all available categories
const allCategories = getAllCategories();

// Get group for a specific category
const group = getGroupForCategory(EventCategory.TechnologyInnovation);

// Convert string to category
const category = fromString('TechnologyInnovation');

// Convert multiple strings to categories
const categories = fromStringList(['Tech', 'Business']);
```

## Migration Guide

### For Existing Components

1. **Replace hardcoded categories** with the new CategoryFilter component
2. **Update API calls** to use the new category parameters
3. **Handle multiple categories** in your filtering logic

### Example Migration

**Before:**

```tsx
const categories = ['All', 'Tech', 'Art', 'Business'];
const [activeCategory, setActiveCategory] = useState('All');

// Hardcoded category tabs
{
    categories.map((category) => (
        <button key={category} onClick={() => setActiveCategory(category)}>
            {category}
        </button>
    ));
}
```

**After:**

```tsx
import CategoryFilter from '../components/CategoryFilter';

const handleCategoryChange = (categories: EventCategory[]) => {
    // Handle multiple categories
    applyFilters(categories);
};

<CategoryFilter
    variant='tabs'
    onCategoryChange={handleCategoryChange}
    showSearch={false}
/>;
```

## Best Practices

### 1. Component Selection

- Use **tabs** for main navigation
- Use **dropdown** for compact filtering
- Use **sidebar** for detailed filtering
- Use **chips** to display active filters

### 2. Performance

- The hook uses `useMemo` for expensive operations
- Category data is cached and reused
- Search is debounced for better performance

### 3. Accessibility

- All variants include proper ARIA labels
- Keyboard navigation is supported
- Screen reader friendly

### 4. Styling

- Components use Tailwind CSS classes
- Easily customizable through className prop
- Consistent with existing design system

## Future Enhancements

### Planned Features

1. **Custom Categories**: Allow users to create custom categories
2. **Category Analytics**: Track popular categories and usage
3. **Localization**: Support multiple languages
4. **Category Hierarchy**: Nested category structures
5. **AI Categorization**: Auto-suggest categories based on content

### API Enhancements

1. **Multiple Category Support**: Backend support for multiple categories
2. **Category Metadata**: Additional category information
3. **Category Statistics**: Usage and popularity data

## Troubleshooting

### Common Issues

1. **Categories not updating**: Ensure you're using the callback from `onCategoryChange`
2. **Search not working**: Check that `showSearch={true}` is set
3. **Groups not displaying**: Ensure `showGrouped={true}` is set
4. **Styling issues**: Check Tailwind CSS classes and custom className

### Debug Tips

```tsx
// Log category filter state
console.log('Category State:', categoryFilter.state);
console.log(
    'Selected Categories:',
    categoryFilter.data.selectedCategoryDescriptions
);
console.log('Has Active Filters:', categoryFilter.data.hasActiveFilters);
```

## Contributing

When adding new categories:

1. Add to the `EventCategory` enum
2. Update `CATEGORY_DESCRIPTIONS`
3. Add to appropriate `CATEGORY_GROUPS`
4. Update documentation
5. Test all variants

## Support

For questions or issues with the category filtering system:

- Check this documentation first
- Review the component props and hook API
- Test with different variants to find the best fit
- Consider performance implications for large category lists
