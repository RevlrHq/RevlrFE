# EnhancedEventTable Component

A comprehensive, feature-rich event management table component that provides advanced functionality for organizers to manage their events efficiently.

## Features

### Core Functionality

- **Server-side pagination** with customizable page sizes (10, 25, 50, 100)
- **Advanced sorting** by title, status, date, registrations, and revenue
- **Real-time search** with debounced input
- **Advanced filtering** with multiple criteria
- **Bulk actions** for managing multiple events simultaneously
- **Event duplication** with customizable parameters
- **Data export** in multiple formats (CSV, Excel, PDF)
- **Responsive design** with desktop table and mobile card views

### Event Management

- **Inline editing** capabilities for quick updates
- **Event actions** (view, edit, duplicate) via context menus
- **Status management** with visual indicators
- **Revenue and registration tracking**
- **Event performance metrics**

### User Experience

- **Loading states** with skeleton components
- **Error handling** with retry mechanisms
- **Empty states** with helpful messaging
- **Accessibility support** with ARIA labels and keyboard navigation
- **Theme support** (light/dark mode)
- **Mobile-optimized** interface

## Usage

### Basic Usage

```tsx
import EnhancedEventTable from './components/EnhancedEventTable';

function EventManagement() {
    return <EnhancedEventTable />;
}
```

### Advanced Usage

```tsx
import EnhancedEventTable from './components/EnhancedEventTable';

function EventManagement() {
    const handleEventView = (eventId: string) => {
        // Navigate to event details
        router.push(`/events/${eventId}`);
    };

    const handleEventEdit = (eventId: string) => {
        // Navigate to event editor
        router.push(`/events/${eventId}/edit`);
    };

    return (
        <EnhancedEventTable
            onEventView={handleEventView}
            onEventEdit={handleEventEdit}
            showActions={true}
            showBulkActions={true}
            showExport={true}
            defaultPageSize={25}
            className='custom-table-styles'
        />
    );
}
```

## Props

| Prop              | Type                                | Default     | Description                            |
| ----------------- | ----------------------------------- | ----------- | -------------------------------------- |
| `className`       | `string`                            | `''`        | Additional CSS classes                 |
| `onEventSelect`   | `(event: EventSummaryView) => void` | `undefined` | Callback when an event is selected     |
| `onEventEdit`     | `(eventId: string) => void`         | `undefined` | Callback when edit action is triggered |
| `onEventView`     | `(eventId: string) => void`         | `undefined` | Callback when view action is triggered |
| `showActions`     | `boolean`                           | `true`      | Show event action menus                |
| `showBulkActions` | `boolean`                           | `true`      | Enable bulk action functionality       |
| `showExport`      | `boolean`                           | `true`      | Show export functionality              |
| `defaultPageSize` | `number`                            | `10`        | Default number of items per page       |

## API Integration

The component integrates with the following API endpoints:

### Primary Endpoints

- `GET /api/Organizer/events` - Fetch events with filtering, sorting, and pagination
- `POST /api/Organizer/events/bulk-action` - Perform bulk actions on multiple events
- `POST /api/Organizer/events/duplicate` - Duplicate an existing event

### Supported Parameters

- **Pagination**: `pageNumber`, `pageSize`
- **Sorting**: `sortBy`, `sortOrder`
- **Search**: `searchTerm`
- **Filters**: `status`, `category`, `startDate`, `endDate`, `isVirtual`, `hasRegistrations`, `minRevenue`, `maxRevenue`, `minRegistrations`, `maxRegistrations`

## Features in Detail

### Search and Filtering

The component provides comprehensive search and filtering capabilities:

```tsx
// Search is performed on event titles and descriptions
// Filters include:
- Status (Draft, Published, Cancelled, Completed)
- Category (Conference, Workshop, Seminar, etc.)
- Date range (start and end dates)
- Event type (Virtual, In-person)
- Registration status (With/without registrations)
- Revenue range (min/max values)
- Registration count range
```

### Bulk Actions

Supported bulk actions:

- **Change Status**: Update status for multiple events
- **Delete Events**: Remove multiple events
- **Archive Events**: Archive multiple events

### Export Functionality

Export events in multiple formats with customizable field selection:

- **CSV**: Comma-separated values
- **Excel**: Microsoft Excel format
- **PDF**: Portable Document Format

Exportable fields:

- Title, Status, Start Date, End Date
- Venue, Category, Registrations, Revenue
- Tickets Sold, Total Tickets, Date Created

### Event Duplication

Create copies of existing events with:

- Custom title and dates
- Option to copy ticket configuration
- Option to copy event images
- Configurable initial status

## Responsive Design

The component adapts to different screen sizes:

### Desktop (≥1024px)

- Full table view with all columns
- Sortable column headers
- Inline action menus
- Bulk selection checkboxes

### Mobile (<1024px)

- Card-based layout
- Condensed information display
- Touch-friendly interactions
- Swipe gestures support

## Accessibility

The component follows accessibility best practices:

- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**: Full keyboard support for all functionality
- **Screen Reader Support**: Proper semantic markup and announcements
- **Focus Management**: Clear focus indicators and logical tab order
- **High Contrast**: Support for high contrast themes

## Error Handling

Comprehensive error handling includes:

- **Network Errors**: Retry mechanisms with user feedback
- **API Errors**: Clear error messages with recovery options
- **Validation Errors**: Inline validation with helpful guidance
- **Loading States**: Skeleton loaders during data fetching
- **Empty States**: Helpful messaging when no data is available

## Performance Optimizations

- **Debounced Search**: Reduces API calls during typing
- **Memoized Components**: Prevents unnecessary re-renders
- **Virtual Scrolling**: Efficient handling of large datasets
- **Lazy Loading**: Components loaded on demand
- **Optimistic Updates**: Immediate UI feedback for user actions

## Testing

The component includes comprehensive tests:

### Unit Tests

- Component rendering
- User interactions
- API integration
- Error handling

### Integration Tests

- Complete workflows
- Bulk operations
- Export functionality
- Responsive behavior

### Accessibility Tests

- ARIA compliance
- Keyboard navigation
- Screen reader compatibility

## Dependencies

### Required Dependencies

- React 18+
- Lucide React (icons)
- Radix UI components
- Class Variance Authority
- Tailwind CSS

### API Dependencies

- OrganizerService from `../lib/api`
- ThemeContext from `../lib/ThemeContext`

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

When contributing to this component:

1. Follow the existing code style and patterns
2. Add tests for new functionality
3. Update documentation for API changes
4. Ensure accessibility compliance
5. Test responsive behavior across devices

## Troubleshooting

### Common Issues

**Component not rendering**

- Ensure ThemeProvider is wrapped around the component
- Check that all required dependencies are installed

**API calls failing**

- Verify API endpoints are accessible
- Check authentication tokens
- Review network connectivity

**Performance issues**

- Check for large datasets without pagination
- Verify memoization is working correctly
- Monitor network requests for efficiency

**Accessibility issues**

- Test with screen readers
- Verify keyboard navigation
- Check color contrast ratios

## Future Enhancements

Planned improvements:

- Real-time updates via WebSocket
- Advanced analytics integration
- Custom column configuration
- Drag-and-drop reordering
- Advanced filtering UI
- Saved filter presets
- Event templates
- Batch import functionality
