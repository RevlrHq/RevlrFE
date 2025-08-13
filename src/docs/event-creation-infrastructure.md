# Event Creation Infrastructure

This document describes the core event creation infrastructure implemented for the REVLR platform.

## Overview

The Event Creation Infrastructure provides a comprehensive system for vendors to create, manage, and publish events. It includes state management, API integration, local storage backup, and validation utilities.

## Architecture

### Core Components

1. **Types** (`src/types/event-creation.ts`)
   - TypeScript interfaces for all event creation data structures
   - Validation and error types
   - API response types

2. **EventCreationService** (`src/lib/services/EventCreationService.ts`)
   - API integration layer for event operations
   - Handles draft creation, event publishing, ticket management
   - Error handling and retry mechanisms

3. **DraftBackupService** (`src/lib/services/DraftBackupService.ts`)
   - Local storage management for draft persistence
   - Auto-save functionality with throttling
   - Backup validation and recovery

4. **useEventCreation Hook** (`src/hooks/useEventCreation.ts`)
   - React hook for event creation state management
   - Integrates all services and provides unified API
   - Auto-save, validation, and navigation logic

5. **EventValidationUtils** (`src/lib/utils/eventValidation.ts`)
   - Comprehensive validation utilities
   - Step-by-step validation
   - URL validation, date validation, etc.

## Key Features

### 1. Draft Management
- Automatic draft saving every 30 seconds
- Local storage backup as fallback
- Draft restoration on page reload
- Expiry handling (24 hours)

### 2. API Integration
- Full integration with backend event APIs
- Support for draft creation, updating, and publishing
- Ticket management integration
- Error handling with retry mechanisms

### 3. Validation System
- Real-time form validation
- Step-by-step validation
- Comprehensive publishing validation
- User-friendly error messages

### 4. State Management
- Centralized state through React hook
- Optimistic updates
- Loading states and error handling
- Navigation between form steps

## Usage

### Basic Hook Usage

```typescript
import { useEventCreation } from '../hooks/useEventCreation';

const MyComponent = () => {
  const {
    eventData,
    tickets,
    updateEventData,
    addTicket,
    saveDraft,
    publishEvent,
    errors,
    isLoading
  } = useEventCreation();

  // Update event data
  const handleNameChange = (name: string) => {
    updateEventData({ eventName: name });
  };

  // Save draft
  const handleSave = async () => {
    const result = await saveDraft();
    if (result.success) {
      console.log('Draft saved successfully');
    }
  };

  return (
    // Your component JSX
  );
};
```

### Service Usage

```typescript
import { EventCreationService } from '../lib/services/EventCreationService';

// Save draft
const result = await EventCreationService.saveDraft(eventData);

// Publish event
const publishResult = await EventCreationService.publishEvent(eventId);

// Add tickets
const ticketResult = await EventCreationService.addTickets(eventId, tickets);
```

### Validation Usage

```typescript
import { EventValidationUtils } from '../lib/utils/eventValidation';

// Validate basic info
const validation = EventValidationUtils.validateBasicInfo(eventData);
if (!validation.isValid) {
  console.log('Errors:', validation.errors);
}

// Validate for publishing
const publishValidation = EventValidationUtils.validateForPublishing(eventData, tickets);
```

## API Endpoints

The service integrates with the following API endpoints:

- `POST /api/Events/draft` - Save event as draft
- `GET /api/Events/{eventId}` - Load existing event
- `PUT /api/Events/{eventId}` - Update existing event
- `POST /api/Events/{eventId}/tickets` - Add tickets to event
- `POST /api/Events/{eventId}/publish` - Publish event

## Data Flow

1. **User Input** → Hook updates state
2. **State Change** → Triggers auto-save timer
3. **Auto-save** → Saves to local storage and optionally API
4. **Validation** → Real-time validation on state changes
5. **Publishing** → Comprehensive validation before API call

## Error Handling

### Error Types
- **Validation Errors**: Field-specific validation failures
- **Network Errors**: API communication failures
- **Authentication Errors**: User session issues
- **Server Errors**: Backend processing failures

### Error Recovery
- Automatic retry with exponential backoff
- Local storage fallback for network failures
- User-friendly error messages
- Graceful degradation

## Local Storage

### Storage Keys
- `event_creation_draft` - Main draft data
- `last_auto_save` - Auto-save throttling

### Data Structure
```typescript
interface DraftBackup {
  eventData: EventCreationData;
  tickets: EventTicket[];
  timestamp: number;
  step: number;
}
```

### Storage Management
- Automatic cleanup of expired drafts
- Storage usage monitoring
- Corruption handling

## Testing

The infrastructure includes comprehensive tests covering:

- Service API integration
- Local storage operations
- Validation logic
- Error handling scenarios
- Hook state management

Run tests with:
```bash
npm test -- --testPathPattern=event-creation.test.ts
```

## Performance Considerations

### Optimizations
- Debounced auto-save (30 seconds)
- Throttled local storage writes
- Optimistic UI updates
- Lazy validation

### Monitoring
- Error tracking and logging
- Performance metrics
- Storage usage monitoring

## Security

### Data Protection
- Input sanitization
- URL validation
- Secure API communication
- Local storage encryption (planned)

### Authentication
- Vendor-only access control
- Session management
- CSRF protection

## Future Enhancements

1. **Image Upload Integration**
   - Direct cloud storage upload
   - Image optimization
   - Progress tracking

2. **Real-time Collaboration**
   - Multi-user editing
   - Conflict resolution
   - Live updates

3. **Advanced Validation**
   - Custom validation rules
   - Business logic validation
   - Integration with external services

4. **Performance Improvements**
   - Virtual scrolling for large lists
   - Code splitting
   - Caching strategies

## Troubleshooting

### Common Issues

1. **Draft not saving**
   - Check network connectivity
   - Verify authentication status
   - Check browser storage limits

2. **Validation errors**
   - Review required fields
   - Check data formats
   - Verify business rules

3. **Performance issues**
   - Clear local storage
   - Check for memory leaks
   - Monitor network requests

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('debug_event_creation', 'true');
```

## Contributing

When contributing to the event creation infrastructure:

1. Follow TypeScript best practices
2. Add comprehensive tests
3. Update documentation
4. Consider backward compatibility
5. Test error scenarios

## Dependencies

- React 18+
- TypeScript 4.5+
- Jest (for testing)
- Existing REVLR API services

## License

This code is part of the REVLR platform and follows the project's licensing terms.