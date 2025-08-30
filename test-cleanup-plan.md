# Test Cleanup Plan

## Analysis Summary
After running the tests, I found 295 failing tests out of 1402 total tests. The failures fall into several categories:

## Categories of Failing Tests

### 1. Currency Format Mismatches (Fixable)
- **Issue**: Tests expect USD format (`$2,000.00`) but components display NGN format (`₦2,000`)
- **Files**: 
  - `src/tests/components/IndividualEventPerformance.test.tsx`
  - `src/tests/components/Dashboard.integration.test.tsx`
  - Revenue-related tests
- **Solution**: Update test expectations to match actual currency format

### 2. UI Text/Content Mismatches (Fixable)
- **Issue**: Tests expect specific text that has changed in the UI
- **Examples**: 
  - Expected "Virtual Event" but component shows different text
  - Expected "+20.0%" growth indicators with different formatting
- **Solution**: Update test expectations to match current UI

### 3. Missing Dependencies/Imports (Fixable)
- **Issue**: Some tests import hooks/components that have dependency issues
- **Examples**: Worker process crashes in `useOrganizerDashboard.test.ts`
- **Solution**: Fix import paths and mock dependencies properly

### 4. Outdated/Irrelevant Test Files (Remove)
- **Issue**: Tests for features that were never fully implemented or are no longer relevant
- **Candidates for removal**:
  - Tests for experimental features that were abandoned
  - Duplicate test files (e.g., multiple similar test suites)
  - Tests for deprecated components

### 5. Test Infrastructure Issues (Fixable)
- **Issue**: Jest worker crashes, timeout issues
- **Solution**: Improve test setup and configuration

## Recommended Actions

### Phase 1: Remove Irrelevant Tests
Remove test files that are testing non-existent or deprecated features.

### Phase 2: Fix Currency and Format Issues
Update test expectations to match the actual application behavior.

### Phase 3: Fix Import and Dependency Issues
Resolve missing imports and mock dependencies properly.

### Phase 4: Update UI Text Expectations
Align test expectations with current UI text and behavior.

## Files to Investigate for Removal
Based on the analysis, these test files may be candidates for removal if they test irrelevant features:

1. Tests that consistently crash Jest workers
2. Tests for features that don't exist in the current codebase
3. Duplicate or redundant test suites
4. Tests for experimental features that were never completed
