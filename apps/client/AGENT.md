# Coding Assistant Ruleset for Client Package

## TypeScript & Type Safety

- Always use TypeScript interfaces and types for strong typing
- Define interfaces for all component props, function parameters, and return types
- Use `as const` for immutable constant objects (e.g., API_ENDPOINTS)
- Leverage TypeScript strict mode features (noUnusedLocals, noUnusedParameters)
- Prefer interfaces over type aliases for object shapes
- Use proper type inference where appropriate, but be explicit for public APIs

## Code Organization & Structure

- Always split code into files and components, following React best practices
- Keep components small and focused (single responsibility principle)
- Use proper separation of concerns:
  - Components: UI presentation logic only
  - Services: Business logic and API calls
  - Contexts: State management and shared data
  - Hooks: Reusable stateful logic
  - Types: Type definitions in dedicated files
  - Constants: Centralized configuration values
- Group related files by feature/domain (e.g., `components/chat/`, `components/auth/`)
- Use index files sparingly; prefer explicit imports for clarity

## React Patterns & Best Practices

- Use functional components with hooks (no class components)
- Memoize expensive components with `React.memo()` when appropriate (e.g., headers, footers)
- Use `useCallback` and `useMemo` to prevent unnecessary re-renders
- Prefer custom hooks for reusable stateful logic
- Use Context API for shared state that doesn't need global state management
- Keep component props interfaces defined near the component or in a types file
- Use proper React patterns: controlled components, composition over inheritance

## Component Guidelines

- Keep components small and focused on a single responsibility
- Extract complex logic into custom hooks or utility functions
- Use composition to build complex UIs from simple components
- Prefer props drilling for 1-2 levels; use Context for deeper nesting
- Always handle loading and error states in components
- Use skeleton components for loading states (see `Skeleton.tsx` patterns)
- Make components accessible (proper ARIA labels, keyboard navigation)

## State Management

- Use Context API for application-wide state (Auth, User, Bot, Chat contexts)
- Use local state (`useState`) for component-specific state
- Use `useRef` for values that don't trigger re-renders (e.g., DOM refs, previous values)
- Avoid prop drilling beyond 2-3 levels; use Context instead
- Keep context providers focused and avoid creating "god contexts"

## Services & API Layer

- All API calls must go through service classes (e.g., `ChatService`, `UserService`)
- Services should handle token management via `tokenProvider`
- Use centralized API endpoints from `constants/api.constants.ts`
- Never hardcode API URLs or endpoints
- Handle errors gracefully in services and propagate meaningful error messages
- Use async/await for asynchronous operations
- Services should return typed responses matching TypeScript interfaces

## Constants & Configuration

- Never hardcode values. Use centralized constants and enums
- Store all API endpoints in `constants/api.constants.ts`
- Use environment variables for configuration (e.g., `import.meta.env.VITE_*`)
- Define enums for fixed sets of values (e.g., message roles, status types)
- Use `as const` assertions for immutable constant objects

## Styling

- Use Tailwind CSS utility classes for styling
- Follow the existing design system (use semantic color names: `bg-background`, `text-text-primary`, etc.)
- Keep component styling co-located with components
- Use consistent spacing, sizing, and color patterns
- Make components responsive (use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`)
- Prefer Tailwind classes over inline styles or CSS modules

## Testing

- When adding new features, always add unit tests for main functionality
- Never call real APIs in unit tests
- Always mock external services for testing purposes (use `vi.mock()` from Vitest)
- Use `@testing-library/react` for component testing
- Use `@testing-library/user-event` for user interaction testing
- Test user flows, not implementation details
- Mock all external dependencies (services, contexts, APIs)
- Use descriptive test names that explain what is being tested
- Follow the existing test patterns (see `ChatBot.test.tsx`)

## Performance

- Use `React.memo()` for components that receive stable props
- Use `useCallback` for functions passed as props to memoized components
- Use `useMemo` for expensive computations
- Avoid creating new objects/arrays in render functions
- Lazy load routes if the bundle size becomes large
- Optimize re-renders by splitting contexts when appropriate

## Error Handling

- Always handle errors in async operations (try/catch blocks)
- Provide user-friendly error messages
- Log errors appropriately (use console.warn/error, not console.log for errors)
- Handle edge cases (empty states, loading states, error states)
- Validate user input before sending to APIs

## Import/Export Patterns

- Use explicit imports (avoid `import *`)
- Group imports: React imports, third-party, local components, types, utilities
- Use `.js` extensions in import paths (TypeScript requirement for ESM)
- Prefer named exports for utilities and services
- Use default exports for main component files
- Keep import statements organized and clean

## Code Quality

- Follow ESLint rules, and always run code check and unit tests after implementing a feature
- Run `npm run check` before committing (includes tests, build, lint, type checking)
- Keep functions pure when possible (no side effects)
- Use meaningful variable and function names
- Add comments for complex business logic, not obvious code
- Remove console.log statements before committing (use console.warn/error for important messages)

## File Naming Conventions

- Use PascalCase for component files (e.g., `ChatBot.tsx`)
- Use camelCase for utility files and services (e.g., `chat.service.ts`)
- Use kebab-case for test files (e.g., `ChatBot.test.tsx`)
- Use descriptive names that indicate the file's purpose
- Group related files in feature directories

## Context Usage

- Create focused contexts for specific domains (Auth, User, Bot, Chat, App)
- Provide custom hooks for accessing context (e.g., `useAuth()`, `useAppContext()`)
- Keep context values minimal and well-typed
- Avoid nesting too many context providers; group related providers when possible

## Security

- Never expose sensitive data in client-side code
- Use environment variables for configuration (never commit secrets)
- Validate and sanitize user input
- Use Clerk for authentication; never implement custom auth logic
- Ensure API tokens are handled securely via `tokenProvider`

## Accessibility

- Use semantic HTML elements
- Provide proper ARIA labels where needed
- Ensure keyboard navigation works for all interactive elements
- Maintain proper focus management
- Use proper heading hierarchy (h1, h2, h3, etc.)

## Git & Version Control

- Never write to git
