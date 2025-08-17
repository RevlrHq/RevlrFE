# Dashboard Testing Guide

## Overview

This document provides comprehensive guidance for testing the enhanced organizer dashboard components. It covers testing strategies, best practices, and detailed information about the test suite structure.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Suite Structure](#test-suite-structure)
3. [Testing Categories](#testing-categories)
4. [Running Tests](#running-tests)
5. [Writing New Tests](#writing-new-tests)
6. [Test Data Management](#test-data-management)
7. [Performance Testing](#performance-testing)
8. [Accessibility Testing](#accessibility-testing)
9. [Visual Regression Testing](#visual-regression-testing)
10. [Continuous Integration](#continuous-integration)
11. [Troubleshooting](#troubleshooting)

## Testing Philosophy

Our testing approach follows the testing pyramid principle:

- **Unit Tests (70%)**: Test individual components and functions in isolation
- **Integration Tests (20%)**: Test component interactions and data flow
- **End-to-End Tests (10%)**: Test complete user workflows

### Key Principles

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
2. **User-Centric Testing**: Write tests from the user's perspective
3. **Maintainable Tests**: Keep tests simple, readable, and easy to maintain
4. **Fast Feedback**: Prioritize fast-running tests for quick development cycles
5. **Comprehensive Coverage**: Ensure all critical paths and edge cases are tested

## Test Suite Structure

```
src/tests/
├── accessibility/           # Accessibility compliance tests
│   ├── dashboard-accessibility-audit.test.tsx
│   └── accessibility-hooks.test.tsx
├── components/             # Component-specific tests
│   ├── StatisticsOverview.test.tsx
│   ├── EnhancedEventTable.test.tsx
│   ├── RevenueChart.test.tsx
│   └── charts/
├── e2e/                   # End-to-end user journey tests
│   └── dashboard-user-journeys.test.tsx
├── hooks/                 # Custom hook tests
│   ├── useOrganizerDashboard.test.ts
│   ├── useOrganizerEvents.test.ts
│   └── useOrganizerRealtime.test.ts
├── integration/           # Integration tests
│   └── organizer-dashboard-workflows.test.tsx
├── performance/           # Performance benchmarks
│   └── dashboard-performance-benchmarks.test.ts
├── services/             # Service layer tests
│   └── OrganizerService.test.ts
├── utils/                # Test utilities and factories
│   ├── dashboard-test-factories.ts
│   ├── performance-utils.ts
│   └── test-helpers.ts
├── visual/               # Visual regression tests
│   └── dashboard-visual-regression.test.tsx
└── setup/               # Test configuration
    └── test-setup.ts
```

## Testing Categories

### 1. Unit Tests

**Purpose**: Test individual components and functions in isolation.

**Location**: `src/tests/components/`, `src/tests/hooks/`, `src/tests/services/`

**Example**:

```typescript
describe('StatisticsOverview', () => {
  it('should display statistics correctly', () => {
    const mockStats = createMockEventStatistics();
    render(<StatisticsOverview statistics={mockStats} />);

    expect(screen.getByText(mockStats.totalEvents.toString())).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

**Purpose**: Test component interactions and data flow between multiple components.

**Location**: `src/tests/integration/`

**Example**:

```typescript
describe('Dashboard Data Flow', () => {
  it('should update charts when time range changes', async () => {
    render(<Dashboard />);

    const timeRangeSelect = screen.getByRole('combobox', { name: /time range/i });
    await user.selectOptions(timeRangeSelect, '6months');

    await waitFor(() => {
      expect(screen.getByTestId('revenue-chart')).toHaveAttribute('data-time-range', '6months');
    });
  });
});
```

### 3. End-to-End Tests

**Purpose**: Test complete user workflows from start to finish.

**Location**: `src/tests/e2e/`

**Example**:

```typescript
describe('Event Management Journey', () => {
    it('should allow user to create, edit, and publish an event', async () => {
        // Test complete workflow
    });
});
```

### 4. Performance Tests

**Purpose**: Ensure components meet performance requirements.

**Location**: `src/tests/performance/`

**Example**:

```typescript
describe('Component Performance', () => {
  it('should render large table within threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      render(<EnhancedEventTable events={largeEventList} />);
    });

    expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.TABLE_RENDER);
  });
});
```

### 5. Accessibility Tests

**Purpose**: Ensure WCAG compliance and inclusive design.

**Location**: `src/tests/accessibility/`

**Example**:

```typescript
describe('Accessibility Compliance', () => {
  it('should pass axe accessibility audit', async () => {
    const { container } = render(<Dashboard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 6. Visual Regression Tests

**Purpose**: Detect unintended visual changes.

**Location**: `src/tests/visual/`

**Example**:

```typescript
describe('Visual Consistency', () => {
  it('should match visual snapshot', () => {
    const { container } = render(<StatisticsOverview />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## Running Tests

### Basic Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test categories
pnpm test:unit
pnpm test:components
pnpm test:integration
pnpm test:e2e

# Run tests with coverage
pnpm test:coverage

# Run dashboard-specific tests
pnpm test -- --testPathPattern=dashboard
```

### Advanced Commands

```bash
# Run tests for specific component
pnpm test -- StatisticsOverview

# Run tests with specific pattern
pnpm test -- --testNamePattern="should render"

# Run tests in CI mode
pnpm test:ci

# Run performance benchmarks
pnpm test -- --testPathPattern=performance

# Run accessibility tests only
pnpm test -- --testPathPattern=accessibility
```

## Writing New Tests

### Test File Naming

- Component tests: `ComponentName.test.tsx`
- Hook tests: `useHookName.test.ts`
- Integration tests: `feature-integration.test.tsx`
- E2E tests: `user-journey.test.tsx`

### Test Structure

```typescript
describe('ComponentName', () => {
    // Setup
    beforeEach(() => {
        // Common setup
    });

    describe('Rendering', () => {
        it('should render with default props', () => {
            // Test implementation
        });
    });

    describe('User Interactions', () => {
        it('should handle click events', async () => {
            // Test implementation
        });
    });

    describe('Error Handling', () => {
        it('should display error state', () => {
            // Test implementation
        });
    });
});
```

### Best Practices

1. **Use Descriptive Test Names**: Test names should clearly describe what is being tested
2. **Arrange-Act-Assert Pattern**: Structure tests with clear setup, action, and assertion phases
3. **Test One Thing**: Each test should focus on a single behavior
4. **Use Test Factories**: Leverage test data factories for consistent mock data
5. **Mock External Dependencies**: Mock API calls, external libraries, and complex dependencies
6. **Test Error States**: Include tests for error conditions and edge cases
7. **Accessibility First**: Include accessibility checks in component tests

### Example Test

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatisticsOverview } from '@/components/StatisticsOverview';
import { createMockEventStatistics } from '../utils/dashboard-test-factories';

describe('StatisticsOverview', () => {
  const mockStatistics = createMockEventStatistics();

  it('should display all statistics correctly', () => {
    render(<StatisticsOverview statistics={mockStatistics} />);

    expect(screen.getByText(mockStatistics.totalEvents.toString())).toBeInTheDocument();
    expect(screen.getByText(mockStatistics.totalRevenue.toString())).toBeInTheDocument();
    expect(screen.getByText(mockStatistics.totalRegistrations.toString())).toBeInTheDocument();
  });

  it('should show loading state when statistics are null', () => {
    render(<StatisticsOverview statistics={null} loading={true} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle refresh action', async () => {
    const mockOnRefresh = jest.fn();
    const user = userEvent.setup();

    render(
      <StatisticsOverview
        statistics={mockStatistics}
        onRefresh={mockOnRefresh}
      />
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });
});
```

## Test Data Management

### Using Test Factories

Test factories provide consistent, reusable mock data:

```typescript
import {
    createMockEventStatistics,
    createMockEventList,
} from '../utils/dashboard-test-factories';

// Create mock data with defaults
const mockStats = createMockEventStatistics();

// Create mock data with overrides
const mockStatsWithHighRevenue = createMockEventStatistics({
    totalRevenue: 100000,
    totalEvents: 50,
});

// Create lists of mock data
const mockEvents = createMockEventList(10);
```

### Available Factories

- `createMockEventStatistics(overrides?)`
- `createMockRevenueStatistics(overrides?)`
- `createMockEventSummary(overrides?)`
- `createMockOrganizerDashboard(overrides?)`
- `createMockEventList(count)`
- `createMockRevenueChartData(months)`

## Performance Testing

### Performance Thresholds

```typescript
const PERFORMANCE_THRESHOLDS = {
    INITIAL_RENDER: 100, // Component initial render
    DATA_PROCESSING: 50, // Data transformation
    USER_INTERACTION: 16, // 60fps interaction response
    MEMORY_USAGE_MB: 50, // Memory usage limit
    TABLE_RENDER_1000_ROWS: 200, // Large dataset rendering
};
```

### Writing Performance Tests

```typescript
import { measureRenderTime, measureMemoryUsage } from '../utils/performance-utils';

describe('Performance', () => {
  it('should render within performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      render(<LargeComponent data={largeDataset} />);
    });

    expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.INITIAL_RENDER);
  });
});
```

## Accessibility Testing

### Automated Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should pass axe accessibility audit', async () => {
    const { container } = render(<Component />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Manual Accessibility Checks

- Keyboard navigation testing
- Screen reader compatibility
- Color contrast verification
- Focus management
- ARIA attributes validation

## Visual Regression Testing

### Snapshot Testing

```typescript
describe('Visual Regression', () => {
  it('should match visual snapshot', () => {
    const { container } = render(<Component />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match snapshot in dark theme', () => {
    const { container } = render(
      <div className="dark">
        <Component />
      </div>
    );
    expect(container.firstChild).toMatchSnapshot('component-dark-theme');
  });
});
```

### Updating Snapshots

```bash
# Update all snapshots
pnpm test -- --updateSnapshot

# Update specific snapshot
pnpm test -- --updateSnapshot ComponentName
```

## Continuous Integration

### Test Pipeline

1. **Lint and Format Check**
2. **Unit Tests**
3. **Integration Tests**
4. **Accessibility Tests**
5. **Performance Tests**
6. **Visual Regression Tests**
7. **Coverage Report**

### Coverage Requirements

- **Statements**: 80% minimum
- **Branches**: 75% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum

### CI Configuration

```yaml
# Example GitHub Actions workflow
name: Test Suite
on: [push, pull_request]

jobs:
    test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-node@v3
              with:
                  node-version: '18'
            - run: pnpm install
            - run: pnpm test:ci
            - run: pnpm test:accessibility
            - run: pnpm test:performance
```

## Troubleshooting

### Common Issues

#### 1. Tests Timing Out

**Problem**: Tests fail due to timeouts
**Solution**:

- Increase timeout for specific tests
- Use `waitFor` for async operations
- Mock slow dependencies

```typescript
it('should handle slow operation', async () => {
    // Increase timeout for this test
    jest.setTimeout(10000);

    await waitFor(
        () => {
            expect(screen.getByText('Loaded')).toBeInTheDocument();
        },
        { timeout: 5000 }
    );
});
```

#### 2. Flaky Tests

**Problem**: Tests pass/fail inconsistently
**Solution**:

- Use `waitFor` instead of fixed delays
- Mock time-dependent functions
- Ensure proper cleanup

```typescript
// Bad
await new Promise((resolve) => setTimeout(resolve, 1000));

// Good
await waitFor(() => {
    expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

#### 3. Memory Leaks in Tests

**Problem**: Tests consume excessive memory
**Solution**:

- Clean up after each test
- Unmount components properly
- Clear mocks and timers

```typescript
afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    jest.clearAllTimers();
});
```

#### 4. Snapshot Mismatches

**Problem**: Snapshots fail after changes
**Solution**:

- Review changes carefully
- Update snapshots if changes are intentional
- Use more specific snapshots

```bash
# Review snapshot differences
pnpm test -- --no-coverage

# Update if changes are correct
pnpm test -- --updateSnapshot
```

### Debugging Tests

#### 1. Debug Mode

```typescript
import { screen } from '@testing-library/react';

// Debug rendered output
screen.debug();

// Debug specific element
screen.debug(screen.getByRole('button'));
```

#### 2. Query Debugging

```typescript
// Find out why queries fail
screen.getByRole('button', { name: /submit/i });
// If this fails, use:
screen.logTestingPlaygroundURL();
```

#### 3. Async Debugging

```typescript
// Debug async operations
await waitFor(() => {
    console.log('Current state:', screen.queryByText('Loading'));
    expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### Performance Debugging

```typescript
// Measure specific operations
const startTime = performance.now();
render(<Component />);
const renderTime = performance.now() - startTime;
console.log(`Render time: ${renderTime}ms`);
```

## Test Coverage Analysis

### Viewing Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# Open HTML coverage report
open coverage/lcov-report/index.html
```

### Coverage Metrics

- **Line Coverage**: Percentage of code lines executed
- **Branch Coverage**: Percentage of code branches taken
- **Function Coverage**: Percentage of functions called
- **Statement Coverage**: Percentage of statements executed

### Improving Coverage

1. **Identify Uncovered Code**: Use coverage reports to find untested code
2. **Add Missing Tests**: Write tests for uncovered branches and functions
3. **Test Error Paths**: Ensure error handling code is tested
4. **Test Edge Cases**: Cover boundary conditions and edge cases

## Conclusion

This testing guide provides a comprehensive framework for testing the dashboard components. By following these guidelines and best practices, you can ensure high-quality, maintainable, and reliable code.

For questions or suggestions about testing practices, please refer to the team's testing standards or reach out to the development team.

## Additional Resources

- [Testing Library Documentation](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/)
- [jest-axe Documentation](https://github.com/nickcolley/jest-axe)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
