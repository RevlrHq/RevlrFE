# Event Creation Integration - Comprehensive Testing Suite

This directory contains a comprehensive testing suite for the Event Creation Integration feature, covering all aspects from unit tests to end-to-end user journeys.

## Test Structure

```
src/tests/
├── hooks/                     # Hook testing
│   └── useEventCreation.test.ts
├── services/                  # Service layer testing
│   ├── EventCreationService.test.ts
│   └── DraftBackupService.test.ts
├── components/                # Component testing
│   ├── CreateEvent.test.tsx
│   ├── TicketManagement.test.tsx
│   └── PrePublishValidation.test.tsx
├── integration/               # Integration testing
│   └── event-creation-workflow.test.tsx
├── e2e/                      # End-to-end testing
│   └── event-creation-e2e.test.tsx
├── utils/                    # Utility testing
│   └── eventValidation.test.ts
├── setup/                    # Test configuration
│   └── test-setup.ts
└── run-tests.js              # Test runner script
```

## Test Categories

### 1. Unit Tests (`src/tests/hooks/`, `src/tests/services/`, `src/tests/utils/`)

**Purpose**: Test individual functions, hooks, and services in isolation.

**Coverage**:

- `useEventCreation` hook: State management, API integration, validation
- `EventCreationService`: API communication, data mapping, error handling
- `DraftBackupService`: Local storage operations, backup/restore functionality
- `EventValidationUtils`: Form validation, business rules, data integrity

**Key Test Scenarios**:

- State transitions and updates
- API success and failure scenarios
- Data validation and error handling
- Local storage operations
- Edge cases and error conditions

**Run Command**: `npm run test:unit`

### 2. Component Tests (`src/tests/components/`)

**Purpose**: Test React components, user interactions, and UI behavior.

**Coverage**:

- `CreateEvent`: Main container component, form handling, navigation
- `TicketManagement`: Ticket CRUD operations, validation, preview
- `PrePublishValidation`: Error display, validation feedback, user guidance

**Key Test Scenarios**:

- Component rendering and props handling
- User interactions (clicks, form input, navigation)
- State updates and re-rendering
- Error states and loading states
- Accessibility and keyboard navigation
- Theme integration (light/dark mode)

**Run Command**: `npm run test:components`

### 3. Integration Tests (`src/tests/integration/`)

**Purpose**: Test component integration, API communication, and workflow coordination.

**Coverage**:

- Complete event creation workflow
- Component communication and data flow
- API integration with mocked responses
- Error handling and recovery mechanisms
- State persistence and restoration

**Key Test Scenarios**:

- Multi-step form navigation
- Draft saving and loading
- Ticket management integration
- Publishing workflow
- Error scenarios and recovery
- Offline/online state handling

**Run Command**: `npm run test:integration`

### 4. End-to-End Tests (`src/tests/e2e/`)

**Purpose**: Test complete user journeys and real-world scenarios.

**Coverage**:

- Complete event creation from start to finish
- Error scenarios and user recovery
- Performance and user experience
- Data persistence across sessions
- Mobile and accessibility scenarios

**Key Test Scenarios**:

- Happy path: Complete event creation and publishing
- Error handling: Network failures, validation errors, recovery
- User experience: Loading states, feedback, guidance
- Performance: Large datasets, rapid interactions
- Accessibility: Keyboard navigation, screen readers

**Run Command**: `npm run test:e2e`

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific category
npm run test:unit
npm run test:components
npm run test:integration
npm run test:e2e

# Watch mode for development
npm run test:watch

# CI/CD pipeline
npm run test:ci
```

### Advanced Usage

```bash
# Run specific test file
npm test -- src/tests/hooks/useEventCreation.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should save draft"

# Run with verbose output
npm test -- --verbose

# Run with coverage for specific files
npm test -- --coverage --collectCoverageFrom="src/hooks/**/*.ts"

# Debug mode
npm test -- --runInBand --detectOpenHandles
```

## Test Configuration

### Jest Configuration (`jest.config.ts`)

- **Environment**: jsdom for DOM testing
- **Setup**: Custom test setup with mocks and utilities
- **Coverage**: Comprehensive coverage reporting
- **Transforms**: TypeScript and JSX support

### Test Setup (`src/tests/setup/test-setup.ts`)

- **Global Mocks**: DOM APIs, File APIs, Network APIs
- **Test Utilities**: Mock data generators, custom matchers
- **Environment Setup**: Environment variables, global configuration

## Writing Tests

### Best Practices

1. **Test Structure**: Follow AAA pattern (Arrange, Act, Assert)
2. **Descriptive Names**: Use clear, descriptive test names
3. **Isolation**: Each test should be independent
4. **Mocking**: Mock external dependencies appropriately
5. **Coverage**: Aim for high coverage but focus on critical paths

### Example Test Structure

```typescript
describe('Component/Feature Name', () => {
    beforeEach(() => {
        // Setup common to all tests
    });

    describe('Specific Functionality', () => {
        it('should handle expected behavior', () => {
            // Arrange
            const props = { /* test props */ };

            // Act
            render(<Component {...props} />);
            fireEvent.click(screen.getByText('Button'));

            // Assert
            expect(screen.getByText('Expected Result')).toBeInTheDocument();
        });

        it('should handle error scenarios', () => {
            // Test error conditions
        });
    });
});
```

### Custom Matchers

The test suite includes custom Jest matchers for domain-specific assertions:

```typescript
// Check if event data is valid
expect(eventData).toBeValidEventData();

// Check if ticket is valid
expect(ticket).toBeValidTicket();
```

### Mock Utilities

Use provided utilities for consistent test data:

```typescript
import { createMockEventData, createMockTicket } from '../setup/test-setup';

const mockEvent = createMockEventData({ eventName: 'Custom Event' });
const mockTicket = createMockTicket({ type: 'paid', price: 50 });
```

## Coverage Requirements

### Minimum Coverage Targets

- **Statements**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%

### Critical Areas (100% Coverage Required)

- Event creation workflow logic
- Data validation functions
- API error handling
- Draft backup/restore functionality

### Coverage Reports

After running tests with coverage:

- **HTML Report**: `coverage/lcov-report/index.html`
- **LCOV Report**: `coverage/lcov.info`
- **JSON Report**: `coverage/coverage-final.json`

## Continuous Integration

### GitHub Actions / CI Pipeline

```yaml
- name: Run Tests
  run: npm run test:ci

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
      file: ./coverage/lcov.info
```

### Pre-commit Hooks

Tests are automatically run on pre-commit to ensure code quality:

```json
{
    "husky": {
        "hooks": {
            "pre-commit": "lint-staged && npm run test:unit"
        }
    }
}
```

## Debugging Tests

### Common Issues

1. **Async Operations**: Use `waitFor` for async assertions
2. **Timer Issues**: Use `jest.useFakeTimers()` for time-dependent tests
3. **Mock Issues**: Ensure mocks are properly reset between tests
4. **DOM Cleanup**: Tests should clean up after themselves

### Debug Commands

```bash
# Run single test with debug info
npm test -- --runInBand --detectOpenHandles src/tests/hooks/useEventCreation.test.ts

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Verbose output
npm test -- --verbose --no-coverage
```

## Performance Testing

### Load Testing

The test suite includes performance tests for:

- Large numbers of tickets (20+ tickets)
- Rapid user input (debouncing)
- Image upload with large files
- Form state with complex data

### Memory Testing

- Memory leak detection in long-running tests
- Cleanup verification after component unmounting
- Local storage usage monitoring

## Accessibility Testing

### Automated Accessibility

Tests include automated accessibility checks:

- Keyboard navigation
- ARIA labels and roles
- Color contrast (where applicable)
- Focus management

### Manual Testing Checklist

- [ ] Screen reader compatibility
- [ ] Keyboard-only navigation
- [ ] High contrast mode
- [ ] Zoom functionality (up to 200%)

## Maintenance

### Regular Tasks

1. **Update Dependencies**: Keep testing libraries up to date
2. **Review Coverage**: Regularly review and improve coverage
3. **Performance Monitoring**: Monitor test execution time
4. **Mock Updates**: Update mocks when APIs change

### Adding New Tests

When adding new features:

1. Add unit tests for new functions/hooks
2. Add component tests for new UI components
3. Update integration tests for new workflows
4. Add e2e tests for new user journeys
5. Update this documentation

## Troubleshooting

### Common Test Failures

1. **Timeout Issues**: Increase timeout for slow operations
2. **Mock Issues**: Verify mocks are properly configured
3. **Async Issues**: Use proper async/await patterns
4. **Environment Issues**: Check test environment setup

### Getting Help

- Check existing test patterns for similar functionality
- Review Jest and Testing Library documentation
- Check the test setup file for available utilities
- Ask team members for guidance on complex scenarios

## Metrics and Reporting

### Test Metrics

The test suite tracks:

- Test execution time
- Coverage percentages
- Flaky test detection
- Performance benchmarks

### Quality Gates

Tests must pass these quality gates:

- All tests passing
- Coverage above minimum thresholds
- No critical accessibility violations
- Performance within acceptable limits

---

This comprehensive testing suite ensures the Event Creation Integration feature is robust, reliable, and user-friendly. Regular maintenance and updates to the test suite help maintain code quality and prevent regressions.
