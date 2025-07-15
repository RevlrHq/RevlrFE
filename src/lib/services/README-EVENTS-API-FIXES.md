# Events API Integration Fixes

This document outlines the comprehensive fixes applied to the Events API integration based on the updated API documentation.

## Overview of Changes

The Events API has been updated with improved parameter mapping, better filtering capabilities, and enhanced pagination support. This document details all the changes made to align the frontend implementation with the new API specifications.

## Key Improvements

### 1. Parameter Name Standardization
- All API parameters now use PascalCase naming convention (e.g., `PageNumber`, `PageSize`, `SortBy`)
- Proper mapping between UI filters and API parameters
- Support for both single and multiple category filtering

### 2. Enhanced Filtering Options
- **Search**: `SearchTerm` parameter for searching in title, description, and organizer
- **Date Range**: `StartDate` and `EndDate` with ISO 8601 format support
- **Location Type**: Numeric values (0=In-Person, 1=Virtual, 2=Hybrid)
- **Price Range**: `MinPrice` and `MaxPrice` filtering
- **Categories**: Support for both single `Category` and multiple `Categories` filtering
- **Additional Filters**: `Status`, `Organizer`, `City`, `IncludePastEvents`

### 3. Improved Pagination
- 1-based pagination as per API specification
- Proper handling of `totalPages`, `currentPage`, `hasNextPage`, `hasPreviousPage`
- Better pagination metadata extraction from API response

## Files Modified

### 1. `src/hooks/useEvents.ts`
**Changes Made:**
- Updated `EventFilters` interface to match new API parameters
- Changed parameter names to PascalCase (e.g., `PageNumber`, `PageSize`)
- Added support for new filtering options
- Improved parameter passing to EventsService
- Enhanced error handling and loading states

**Key Features:**
```typescript
export interface EventFilters {
    // Pagination
    PageNumber?: number;
    PageSize?: number;
    
    // Sorting
    SortBy?: string;
    SortOrder?: string;
    
    // Search and filtering
    SearchTerm?: string;
    StartDate?: string;
    EndDate?: string;
    LocationType?: number | string;
    IncludeTickets?: boolean;
    MinPrice?: number;
    MaxPrice?: number;
    
    // Category filtering
    Category?: string;
    Categories?: string[];
    
    // Additional filters
    Status?: string;
    Organizer?: string;
    City?: string;
    IncludePastEvents?: boolean;
}
```

### 2. `src/lib/services/services/EventsService.ts`
**Changes Made:**
- Extended `getApiEvents` method to support all new parameters
- Added proper handling for multiple categories
- Improved parameter validation and query building
- Support for additional filtering options

**New Parameters Supported:**
- `categories`: Array of category strings
- `status`: Event status filtering
- `organizer`: Filter by organizer name
- `city`: Filter by city/location
- `includePastEvents`: Include/exclude past events

### 3. `src/features/landing/components/EventListing.tsx`
**Changes Made:**
- Updated `convertToApiFilters` function to use new parameter names
- Proper handling of multiple categories
- Improved location type mapping (string to numeric)
- Better integration with the updated useEvents hook

**Key Improvements:**
```typescript
const convertToApiFilters = useCallback((uiFilters: FilterValues, selectedCategories: EventCategory[] = []): EventFilters => {
    // Handle category filtering
    let categoryParam: string | undefined;
    let categoriesParam: string[] | undefined;
    
    if (selectedCategories.length === 1) {
        categoryParam = selectedCategories[0];
    } else if (selectedCategories.length > 1) {
        categoriesParam = selectedCategories;
    }

    return {
        Category: categoryParam,
        Categories: categoriesParam,
        SortBy: sortMapping.sortBy,
        SortOrder: sortMapping.sortOrder,
        StartDate: dateMapping.startDate,
        EndDate: dateMapping.endDate,
        LocationType: locationTypeMapping ? parseInt(locationTypeMapping) : undefined,
        MinPrice: uiFilters.priceRange[0] > 0 ? uiFilters.priceRange[0] : undefined,
        MaxPrice: uiFilters.priceRange[1] < 5000 ? uiFilters.priceRange[1] : undefined,
        SearchTerm: uiFilters.location !== 'Lagos' ? uiFilters.location : undefined,
        IncludeTickets: true,
        IncludePastEvents: false,
    };
}, []);
```

### 4. `src/lib/utils/eventUtils.ts`
**Changes Made:**
- Updated `mapSortOptionToApi` to use PascalCase parameter names
- Improved `mapLocationTypeToApi` with better string handling
- Enhanced date range mapping functions

**Updated Functions:**
```typescript
export const mapSortOptionToApi = (sortOption: string): { sortBy: string; sortOrder: string } => {
    switch (sortOption) {
        case 'Newest':
            return { sortBy: 'DateCreated', sortOrder: 'desc' };
        case 'Upcoming':
            return { sortBy: 'StartDate', sortOrder: 'asc' };
        case 'Trending':
        default:
            return { sortBy: 'StartDate', sortOrder: 'asc' };
    }
};

export const mapLocationTypeToApi = (eventType: string): string | undefined => {
    switch (eventType) {
        case 'In-person':
        case 'in-person':
        case 'inperson':
            return '0'; // In-Person events
        case 'Virtual':
        case 'virtual':
            return '1'; // Virtual events
        case 'Hybrid':
        case 'hybrid':
            return '2'; // Hybrid events
        default:
            return undefined;
    }
};
```

### 5. `src/components/examples/ImprovedEventsExample.tsx` (New)
**Purpose:**
- Comprehensive example demonstrating all new API features
- Interactive UI for testing all filtering options
- Debug information for development and testing
- Best practices implementation

**Features Demonstrated:**
- Search functionality
- Date range filtering
- Location type filtering
- Price range filtering
- Category filtering (single and multiple)
- Sorting options
- Pagination
- Error handling
- Loading states

## API Parameter Mapping

### Location Type Values
| UI Value | API Value | Description |
|----------|-----------|-------------|
| "In-person" | 0 | In-Person events only |
| "Virtual" | 1 | Virtual events only |
| "Hybrid" | 2 | Hybrid events only |

### Sort Options
| UI Option | API SortBy | API SortOrder |
|-----------|------------|---------------|
| "Newest" | "DateCreated" | "desc" |
| "Upcoming" | "StartDate" | "asc" |
| "Trending" | "StartDate" | "asc" |

### Date Format
- All dates should be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Example: `2025-07-14T23:00:00.000Z`

## Best Practices Implemented

### 1. Error Handling
- Comprehensive error catching and user-friendly error messages
- Fallback states for failed API calls
- Retry functionality

### 2. Performance Optimization
- Debounced search inputs (recommended for production)
- Efficient parameter cleaning (removing undefined values)
- Proper dependency arrays in useCallback hooks

### 3. User Experience
- Loading states during API calls
- Empty states when no results found
- Proper pagination with ellipsis for large page counts
- Clear filter indicators and reset functionality

### 4. Type Safety
- Comprehensive TypeScript interfaces
- Proper type checking for all parameters
- Safe property access with optional chaining

## Testing Recommendations

### 1. Basic Functionality Tests
```typescript
// Test basic pagination
const test1 = {
    PageNumber: 1,
    PageSize: 5
};

// Test date range filtering
const test2 = {
    PageNumber: 1,
    PageSize: 10,
    StartDate: '2025-07-01T00:00:00.000Z',
    EndDate: '2025-12-31T23:59:59.999Z'
};

// Test location and sorting
const test3 = {
    PageNumber: 1,
    PageSize: 10,
    LocationType: 0, // In-person only
    SortBy: 'StartDate',
    SortOrder: 'asc',
    IncludeTickets: true
};
```

### 2. Edge Cases to Test
- Empty search results
- Invalid date ranges
- Large page numbers
- Multiple category selections
- Price range boundaries

### 3. Performance Tests
- Large result sets
- Rapid filter changes
- Network timeout scenarios
- Concurrent API calls

## Migration Guide

### For Existing Code
1. Update all filter parameter names to PascalCase
2. Change `locationType` string values to numeric values
3. Update sort parameter names (`sortBy` → `SortBy`, `sortOrder` → `SortOrder`)
4. Handle new pagination metadata structure
5. Update error handling for new response format

### Breaking Changes
- Parameter names changed from camelCase to PascalCase
- Location type values changed from strings to numbers
- Response structure updated with new pagination metadata
- Some sort options may not be supported (price sorting)

## Future Enhancements

### Potential Improvements
1. **Caching**: Implement result caching for better performance
2. **Real-time Updates**: WebSocket integration for live event updates
3. **Advanced Filtering**: More granular filtering options
4. **Bulk Operations**: Support for bulk event operations
5. **Analytics**: Event interaction tracking and analytics

### API Wishlist
1. Support for price-based sorting
2. Geolocation-based filtering
3. Advanced search with operators
4. Bulk category operations
5. Event recommendation engine

## Troubleshooting

### Common Issues
1. **Empty Results on Page 2+**: Ensure filters are not too restrictive
2. **Date Filtering Not Working**: Use ISO 8601 format with proper timezone
3. **Location Type Filter Issues**: Use numeric values (0, 1, 2) instead of strings
4. **Sorting Not Working**: Use exact property names (`StartDate`, not `startdate`)

### Debug Tools
- Use the debug information section in the example component
- Check browser network tab for actual API calls
- Enable console logging in the useEvents hook
- Verify parameter mapping in convertToApiFilters function

## Conclusion

These comprehensive fixes align the frontend implementation with the updated Events API documentation, providing:
- Better filtering capabilities
- Improved pagination handling
- Enhanced user experience
- Robust error handling
- Type-safe implementation
- Comprehensive testing examples

The implementation follows best practices for React hooks, TypeScript usage, and API integration patterns.
