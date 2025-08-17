# Technology Stack

## Framework & Runtime

- **Next.js 15** - React framework with App Router
- **React 18.3** - UI library
- **TypeScript 5.7** - Type-safe JavaScript
- **Node.js** - Runtime environment

## Styling & UI

- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **Lucide React** - Icon library
- **Custom design system** with Revlr brand colors and components

## State Management & Data

- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling with Yup/Zod validation
- **Axios** - HTTP client
- **SignalR** - Real-time communication

## Development Tools

- **ESLint** - Code linting with TypeScript, Tailwind, and custom boundary rules
- **Prettier** - Code formatting (4 spaces, single quotes, trailing commas)
- **Husky** - Git hooks for pre-commit checks
- **Jest** - Testing framework with React Testing Library
- **OpenAPI** - API code generation

## Build & Deployment

- **Turbopack** - Fast bundler for development
- **Docker** - Containerization
- **Azure Pipelines** - CI/CD
- **Kubernetes** - Container orchestration

## Common Commands

### Development

```bash
pnpm dev          # Start development server with Turbopack
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
```

### Testing

```bash
pnpm test                    # Run all tests
pnpm test:watch             # Run tests in watch mode
pnpm test:coverage          # Run tests with coverage
pnpm test:unit              # Run unit tests only
pnpm test:components        # Run component tests only
pnpm test:integration       # Run integration tests only
pnpm test:media-search      # Run media search specific tests
```

### Code Generation

```bash
pnpm codegen      # Generate API client from OpenAPI specs
```

## Package Manager

- **pnpm** - Fast, disk space efficient package manager
