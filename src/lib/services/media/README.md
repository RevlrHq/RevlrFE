# Media Download and Processing System

This document describes the media download and processing system implemented for the Event Media Search Integration feature.

## Overview

The system provides comprehensive functionality for downloading, optimizing, and processing media from external providers like Unsplash, Pexels, and Pixabay. It includes progress tracking, cancellation support, error handling with retry logic, and attribution compliance.

## Core Components

### MediaImageProcessor

The main class responsible for processing selected media items.

```typescript
import { MediaImageProcessor } from '@/lib/services/media/MediaImageProcessor';

// Process selected media items
const result = await MediaImageProcessor.processSelectedMedia(
    selectedItems,
    (index, progress, status) => {
        console.log(`Item ${index}: ${progress}% - ${status}`);
    },
    (index, result) => {
        console.log(`Item ${index} completed:`, result);
    },
    {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: 'webp',
        targetSizeKB: 500,
    }
);

console.log('Success:', result.success.length);
console.log('Errors:', result.errors.length);
```

### AttributionService

Handles licensing compliance and attribution requirements.

```typescript
import { AttributionService } from '@/lib/services/media/AttributionService';

// Generate attribution text
const attribution = AttributionService.generateAttributionText(
    mediaItem,
    'html'
);

// Validate license for commercial use
const validation = AttributionService.validateLicenseForCommercialUse(license);

// Auto-insert attribution into event description
const updatedEventData = AttributionService.autoInsertAttribution(
    eventData,
    images
);
```

## Key Features

### 1. Download with Progress Tracking

```typescript
const blob = await MediaImageProcessor.downloadWithProgress(
    'https://example.com/image.jpg',
    (progress) => console.log(`Download: ${progress}%`),
    cancellationToken
);
```

### 2. Image Optimization

- Automatic resizing to optimal dimensions
- Format conversion (JPEG → WebP for better compression)
- Quality optimization to meet target file size
- Progressive compression with multiple quality levels

### 3. Error Handling and Retry Logic

- Automatic retry with exponential backoff (up to 3 attempts)
- Graceful error handling with detailed error messages
- Cancellation support for long-running operations

### 4. Attribution Compliance

- Automatic attribution text generation
- License validation for commercial use
- Attribution insertion into event descriptions
- Compliance monitoring and tracking

### 5. Integration with Existing Services

- Seamless integration with ImageUploadService
- Compatible with existing EventImage model
- Works with current event creation workflow

## Usage Examples

### Basic Processing

```typescript
const items = [mediaItem1, mediaItem2, mediaItem3];

const result = await MediaImageProcessor.processSelectedMedia(
    items,
    (index, progress) => updateProgressBar(index, progress)
);

// Handle results
result.success.forEach((image) => {
    console.log('Processed:', image.name);
});

result.errors.forEach((error) => {
    console.error('Failed:', error.item.title, error.error);
});
```

### With Cancellation

```typescript
const cancellationToken = MediaImageProcessor.createCancellationToken();

// Start processing
const processingPromise = MediaImageProcessor.processSelectedMedia(
    items,
    undefined,
    undefined,
    {},
    cancellationToken
);

// Cancel if needed
setTimeout(() => {
    cancellationToken.cancel();
}, 5000);

try {
    const result = await processingPromise;
} catch (error) {
    if (error.message === 'Processing cancelled') {
        console.log('User cancelled the operation');
    }
}
```

### Attribution Validation

```typescript
// Validate attribution compliance for an event
const validation = AttributionService.validateAttributionCompliance(
    eventImages,
    eventData
);

if (!validation.isValid) {
    console.error('Attribution errors:', validation.errors);
}

if (validation.warnings.length > 0) {
    console.warn('Attribution warnings:', validation.warnings);
}
```

## Configuration Options

### ProcessingOptions

```typescript
interface ProcessingOptions {
    maxWidth?: number; // Default: 1920
    maxHeight?: number; // Default: 1080
    quality?: number; // Default: 0.85
    format?: 'webp' | 'jpeg' | 'png'; // Default: 'webp'
    targetSizeKB?: number; // Default: 500
}
```

### Error Handling

The system provides detailed error information:

```typescript
interface ProcessingError {
    item: MediaItem; // The item that failed
    error: string; // Human-readable error message
    stage: 'download' | 'processing' | 'upload' | 'validation';
}
```

## Performance Considerations

1. **Parallel Processing**: Items are processed sequentially to avoid overwhelming the system
2. **Memory Management**: Large images are processed in chunks to prevent memory issues
3. **Caching**: Downloaded images are temporarily cached during processing
4. **Optimization**: Images are optimized for web use with WebP format when supported

## Security Features

1. **Content Validation**: All downloaded content is validated before processing
2. **License Compliance**: Automatic license validation for commercial use
3. **Attribution Tracking**: Comprehensive tracking for compliance monitoring
4. **Error Logging**: Detailed error logging without exposing sensitive information

## Testing

The system includes comprehensive tests covering:

- Download functionality with progress tracking
- Image optimization and validation
- Error handling and retry logic
- Attribution generation and compliance
- Cancellation support

Run tests with:

```bash
npm test -- --testPathPattern="MediaImageProcessor|AttributionService"
```

## Integration Points

### With useMediaSearch Hook

The MediaImageProcessor is already integrated with the `useMediaSearch` hook:

```typescript
const { downloadSelected } = useMediaSearch();

// This internally uses MediaImageProcessor.processSelectedMedia
const processedImages = await downloadSelected();
```

### With Event Creation

Processed images are compatible with the existing event creation system:

```typescript
// Processed images can be directly added to event data
const eventData = {
    ...existingEventData,
    images: [...existingImages, ...processedImages],
};
```

## Future Enhancements

1. **Video Processing**: Support for video media from providers
2. **Batch Operations**: Improved batch processing for large selections
3. **Advanced Optimization**: AI-powered image optimization
4. **Real-time Preview**: Live preview during processing
5. **Cloud Processing**: Offload processing to cloud services for better performance
