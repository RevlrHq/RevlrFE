Coding Standards

project_context:
  framework: "TanStack (React Query, Table, Router, etc.)"
  language: "TypeScript"
  testing_framework: "Vitest/Jest with Testing Library"
  linting: "ESLint with TypeScript rules"

code_generation_rules:
  typescript:
    - "Always use explicit TypeScript types for function parameters and return values"
    - "Prefer interfaces over type aliases for object shapes"
    - "Use strict null checks and handle undefined/null cases explicitly"
    - "Import types using 'import type' syntax when importing only for type annotations"
    - "Use generic constraints appropriately (extends keyof, etc.)"
    - "Avoid 'any' type - use 'unknown' or proper type definitions instead"
    - "Use utility types (Pick, Omit, Partial) when appropriate"
    - "Define custom types for API responses and domain models"

  tanstack_specific:
    react_query:
      - "Always type useQuery hooks with proper generic parameters: useQuery<TData, TError>"
      - "Use queryKey factories for consistent cache key management"
      - "Properly type mutation functions with useMutation<TData, TError, TVariables>"
      - "Use QueryClient methods with proper TypeScript generics"
      - "Define query options objects with proper typing"
      - "Use Suspense boundaries appropriately with suspense: true queries"
    
    react_table:
      - "Define column definitions with proper ColumnDef<TData> typing"
      - "Use createColumnHelper for better type inference"
      - "Properly type table options and data arrays"
      - "Use accessorKey and accessorFn with proper typing"
      - "Type custom cell renderers and header components"
    
    react_router:
      - "Use typed route parameters with proper validation"
      - "Define route schemas using Zod or similar for type safety"
      - "Properly type loader and action functions"
      - "Use typed navigation hooks (useNavigate, useParams)"

  linting_compliance:
    eslint_rules:
      - "Follow @typescript-eslint/recommended rules"
      - "Use consistent import ordering (external, internal, relative)"
      - "Prefer const assertions over as const when appropriate"
      - "Use exhaustive-deps for useEffect hooks"
      - "Follow react-hooks/exhaustive-deps for custom hooks"
      - "Use consistent naming conventions (camelCase, PascalCase)"
      - "Remove unused imports and variables"
      - "Use consistent indentation (2 spaces)"
      - "Add trailing commas in multiline objects/arrays"
      - "Use single quotes for strings consistently"

  code_quality:
    - "Extract complex logic into custom hooks or utility functions"
    - "Use early returns to reduce nesting"
    - "Prefer composition over inheritance"
    - "Keep components small and focused (< 200 lines)"
    - "Use meaningful variable and function names"
    - "Add JSDoc comments for complex functions"
    - "Handle error states explicitly"
    - "Implement proper loading states"

testing_requirements:
  test_strategy:
    - "Write tests that verify behavior, not implementation details"
    - "Test user interactions and outcomes, not internal state"
    - "Mock external dependencies (APIs, services) appropriately"
    - "Use data-testid for elements that need testing but lack semantic meaning"
    - "Prefer queries by role, label, and text over test IDs when possible"

  valuable_tests:
    unit_tests:
      - "Test pure functions and utility functions thoroughly"
      - "Test custom hooks with proper act() wrapping"
      - "Test edge cases and error conditions"
      - "Test type guards and validation functions"
      - "Mock external dependencies consistently"
    
    integration_tests:
      - "Test component interactions with TanStack libraries"
      - "Test query invalidation and refetching behavior"
      - "Test optimistic updates and rollback scenarios"
      - "Test navigation flows and route transitions"
      - "Test form submissions and mutations"
    
    component_tests:
      - "Test component rendering with different prop combinations"
      - "Test user interactions (clicks, form inputs, keyboard navigation)"
      - "Test conditional rendering based on state"
      - "Test error boundaries and fallback UI"
      - "Test accessibility features (ARIA labels, keyboard navigation)"

  test_patterns:
    setup:
      - "Create test utilities for common setup (QueryClient, Router providers)"
      - "Use factory functions for test data generation"
      - "Set up proper test environment with jsdom for React components"
      - "Configure MSW (Mock Service Worker) for API mocking"
    
    queries_and_mutations:
      - "Mock API responses using MSW or similar tools"
      - "Test loading, success, and error states"
      - "Test query invalidation and cache updates"
      - "Test optimistic updates and rollback behavior"
      - "Use waitFor for async operations"
    
    components:
      - "Render components within proper providers (QueryClient, Router)"
      - "Use userEvent for realistic user interactions"
      - "Test accessibility with axe-core or similar tools"
      - "Test responsive behavior if applicable"

  test_quality_gates:
    - "All tests must pass before code submission"
    - "Maintain >80% code coverage for business logic"
    - "Tests should run in <5 seconds for rapid feedback"
    - "No flaky tests - all tests should be deterministic"
    - "Test names should clearly describe what is being tested"

common_patterns:
  query_key_factories:
    example: |
      export const todoKeys = {
        all: ['todos'] as const,
        lists: () => [...todoKeys.all, 'list'] as const,
        list: (filters: string) => [...todoKeys.lists(), { filters }] as const,
        details: () => [...todoKeys.all, 'detail'] as const,
        detail: (id: number) => [...todoKeys.details(), id] as const,
      }

  typed_mutations:
    example: |
      const createTodoMutation = useMutation<
        Todo,
        ApiError,
        CreateTodoRequest
      >({
        mutationFn: createTodo,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
        },
      })

  error_handling:
    example: |
      const { data, error, isLoading } = useQuery({
        queryKey: todoKeys.detail(id),
        queryFn: () => fetchTodo(id),
        throwOnError: false, // Handle errors in component
      })
      
      if (error) {
        return <ErrorBoundary error={error} />
      }

forbidden_patterns:
  - "Using 'any' type instead of proper typing"
  - "Ignoring ESLint warnings or using eslint-disable without justification"
  - "Testing implementation details (internal state, method calls)"
  - "Writing tests that don't actually test anything (always passing)"
  - "Using setTimeout in tests without proper cleanup"
  - "Mocking React Query hooks directly (test the component behavior instead)"
  - "Creating untestable code (deeply nested, tightly coupled)"
  - "Using console.log for debugging in production code"

file_organization:
  structure:
    - "Group related files in feature folders"
    - "Separate concerns: hooks, components, types, tests"
    - "Use barrel exports (index.ts) for clean imports"
    - "Keep test files adjacent to source files"
    - "Create shared types in a common types directory"

  naming_conventions:
    - "Use PascalCase for components and types"
    - "Use camelCase for functions and variables"
    - "Use kebab-case for file names"
    - "Suffix test files with .test.ts or .spec.ts"
    - "Suffix type files with .types.ts"

performance_considerations:
  - "Use React.memo for expensive components"
  - "Implement proper query staleTime and cacheTime"
  - "Use query placeholderData for better UX"
  - "Implement proper query key invalidation strategies"
  - "Consider using React Query's optimistic updates"
  - "Use lazy loading for heavy components"

accessibility_requirements:
  - "Include proper ARIA labels and roles"
  - "Ensure keyboard navigation works correctly"
  - "Provide meaningful alt text for images"
  - "Use semantic HTML elements"
  - "Test with screen readers in mind"
  - "Ensure sufficient color contrast ratios"

quality_checklist:
  before_commit:
    - "Run type checking: tsc --noEmit"
    - "Run linting: eslint src/ --fix"
    - "Run all tests: npm test"
    - "Check test coverage: npm run test:coverage"
    - "Verify no console errors in development"
    - "Test in multiple browsers if UI changes"

  code_review_focus:
    - "Type safety and proper generics usage"
    - "Test coverage and quality"
    - "Performance implications"
    - "Accessibility compliance"
    - "Error handling completeness"
    - "Code maintainability and readability"