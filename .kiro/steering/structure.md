# Project Structure

## Root Directory Organization

```
├── src/                    # Main source code
├── public/                 # Static assets
├── infrastructure/         # Deployment configs (Bicep, K8s)
├── coverage/              # Test coverage reports
├── .kiro/                 # Kiro configuration and specs
├── .husky/                # Git hooks
└── types/                 # Global type definitions
```

## Source Code Structure (`src/`)

### Core Directories

- **`app/`** - Next.js App Router pages and layouts
- **`components/`** - Reusable UI components
- **`features/`** - Feature-specific modules
- **`hooks/`** - Custom React hooks
- **`lib/`** - Utilities, configurations, and services
- **`providers/`** - React context providers
- **`stores/`** - Zustand state stores
- **`types/`** - TypeScript type definitions

### Component Organization

```
components/
├── ui/                    # Base UI components (shadcn/ui style)
├── charts/               # Chart components
├── error-handling/       # Error boundary components
├── media-search/         # Media search feature components
├── revenue/              # Revenue reporting components
└── *.tsx                 # General components
```

### Feature-Based Architecture

```
features/
├── auth/                 # Authentication flows
├── dashboard/            # Dashboard functionality
├── event-details/        # Event detail views
└── landing/              # Landing page
```

### Library Structure

```
lib/
├── api/                  # API client and endpoints
├── config/               # Configuration files
├── constants/            # Application constants
├── error-handling/       # Error handling utilities
├── services/             # Business logic services
└── utils/                # General utilities
```

## Path Aliases

- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@features/*` → `src/features/*`
- `@lib/*` → `src/lib/*`
- `@hooks/*` → `src/hooks/*`
- `@ui/*` → `src/components/ui/*`
- `@src/*` → `src/*`
- `~/*` → `*` (root)

## Architectural Patterns

### Component Boundaries

- **UI components** (`src/components/ui/`) - Pure, reusable components
- **Feature components** - Business logic specific to features
- **Shared components** - Cross-feature reusable components
- **Page components** (`src/app/`) - Route-specific components

### Import Rules (ESLint Boundaries)

- Features can only import from their own feature or shared modules
- UI components can only import other UI components or shared utilities
- App pages can import from any module
- Shared modules cannot import from features

### File Naming Conventions

- **Components**: PascalCase (e.g., `EventTable.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useEventData.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: camelCase with descriptive names (e.g., `event-creation.ts`)
- **Constants**: UPPER_SNAKE_CASE in files, camelCase filenames

### Testing Structure

```
src/tests/
├── accessibility/        # Accessibility tests
├── components/          # Component tests
├── hooks/               # Hook tests
├── integration/         # Integration tests
├── performance/         # Performance tests
├── services/            # Service tests
├── setup/               # Test configuration
└── utils/               # Test utilities
```
