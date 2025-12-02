# Coding Assistant Ruleset for Admin Package

## TypeScript & Type Safety

- Always use TypeScript interfaces and types for strong typing
- Define interfaces for all component props, function parameters, and return types
- Use `as const` for immutable constant objects (e.g., API_ENDPOINTS)
- Leverage TypeScript strict mode features (noUnusedLocals, noUnusedParameters)
- Prefer interfaces over type aliases for object shapes
- Use proper type inference where appropriate, but be explicit for public APIs
- Always type error objects when catching exceptions (e.g., `error as { status?: number; message?: string }`)

## Code Organization & Structure

- Always split code into files and components, following React best practices
- Keep components small and focused (single responsibility principle)
- Use proper separation of concerns:
  - Components: UI presentation logic only
  - Services: Business logic and API calls
  - Pages: Route-level components that orchestrate data fetching
  - Types: Type definitions in dedicated files
  - Constants: Centralized configuration values
- Group related files by feature/domain (e.g., `components/`, `pages/`, `services/`)
- Use index files sparingly; prefer explicit imports for clarity
- Keep the admin package structure simple and focused on admin operations

## React Patterns & Best Practices

- Use functional components with hooks (no class components)
- Memoize expensive components with `React.memo()` when appropriate
- Use `useCallback` and `useMemo` to prevent unnecessary re-renders
- Prefer custom hooks for reusable stateful logic
- Use Context API sparingly; admin package has simpler state needs than client
- Keep component props interfaces defined near the component or in a types file
- Use proper React patterns: controlled components, composition over inheritance

## Component Guidelines

- Keep components small and focused on a single responsibility
- Extract complex logic into custom hooks or utility functions
- Use composition to build complex UIs from simple components
- Always handle loading and error states in components
- Use skeleton components or loading indicators for async operations
- Make components accessible (proper ARIA labels, keyboard navigation)
- Admin components should be clear and functional, prioritizing usability over aesthetics

## State Management

- Use local state (`useState`) for component-specific state
- Use `useRef` for values that don't trigger re-renders (e.g., DOM refs, previous values)
- Keep state management simple; avoid over-engineering with Context for admin operations
- Use `useEffect` for data fetching and side effects
- Always clean up effects (return cleanup functions from `useEffect`)

## Services & API Layer

- All API calls must go through service classes (e.g., `UserService`, `SystemConfigService`)
- Services should handle token management via `apiManager` and `tokenProvider`
- Use centralized API endpoints from `constants/api.constants.ts`
- Never hardcode API URLs or endpoints
- Handle errors gracefully in services and propagate meaningful error messages
- Use async/await for asynchronous operations
- Services should return typed responses matching TypeScript interfaces
- Admin services should handle authorization errors (403) appropriately

## Constants & Configuration

- Never hardcode values. Use centralized constants and enums
- Store all API endpoints in `constants/api.constants.ts`
- Use environment variables for configuration (e.g., `import.meta.env.VITE_*`)
- Define enums for fixed sets of values (e.g., user roles, status types)
- Use `as const` assertions for immutable constant objects

## Styling

- Use Tailwind CSS utility classes for styling
- Follow the existing design system (use semantic color names: `bg-background`, `text-text-primary`, etc.)
- Keep component styling co-located with components
- Use consistent spacing, sizing, and color patterns
- Make components responsive (use Tailwind responsive prefixes: `sm:`, `md:`, `lg:`)
- Prefer Tailwind classes over inline styles or CSS modules
- Admin UI should be clean, professional, and easy to navigate

## Testing

- When adding new features, always add unit tests for main functionality
- Never call real APIs in unit tests
- Always mock external services for testing purposes (use `vi.mock()` from Vitest)
- Use `@testing-library/react` for component testing
- Use `@testing-library/user-event` for user interaction testing
- Test user flows, not implementation details
- Mock all external dependencies (services, APIs, Clerk)
- Use descriptive test names that explain what is being tested
- Test admin access control and role-based restrictions

## Performance

- Use `React.memo()` for components that receive stable props
- Use `useCallback` for functions passed as props to memoized components
- Use `useMemo` for expensive computations
- Avoid creating new objects/arrays in render functions
- Admin pages typically have simpler performance requirements than client chat interface

## Error Handling

- Always handle errors in async operations (try/catch blocks)
- Provide user-friendly error messages for admin operations
- Log errors appropriately (use console.warn/error, not console.log for errors)
- Handle edge cases (empty states, loading states, error states)
- Validate user input before sending to APIs
- Always check for authorization errors (403) and provide clear feedback
- Handle authentication errors (401) gracefully

## Security & Access Control

- **CRITICAL**: Always verify admin role before allowing access to admin features
- Never expose sensitive user data unnecessarily
- Use environment variables for configuration (never commit secrets)
- Validate and sanitize user input, especially for system configuration
- Use Clerk for authentication; never implement custom auth logic
- Ensure API tokens are handled securely via `tokenProvider`
- Always check user roles server-side; client-side checks are for UX only
- Never trust client-side role checks for security-critical operations
- Handle unauthorized access attempts gracefully with clear error messages

## Admin-Specific Guidelines

- Admin operations should be clearly logged and auditable
- Provide confirmation dialogs for destructive operations (e.g., deleting users, changing system rules)
- Always validate admin permissions before performing admin actions
- System configuration changes should be clearly communicated to users
- User management operations should show appropriate feedback
- Keep admin UI simple and focused on administrative tasks
- Consider data pagination for large user lists
- Provide search and filtering capabilities for user management

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

- Use PascalCase for component files (e.g., `UserList.tsx`)
- Use camelCase for utility files and services (e.g., `user.service.ts`)
- Use kebab-case for test files (e.g., `UserList.test.tsx`)
- Use descriptive names that indicate the file's purpose
- Group related files in feature directories

## Layout & Navigation

- Use consistent layout patterns across admin pages
- Provide clear navigation between admin sections
- Use the Layout component for consistent page structure
- Ensure breadcrumbs or navigation clearly indicate current page
- Keep navigation simple and focused on admin tasks

## Data Management

- Always handle loading states when fetching data
- Provide empty states when no data is available
- Use appropriate data structures for admin operations
- Consider pagination for large datasets
- Provide refresh/reload functionality for data tables
- Validate data before displaying or submitting

## Accessibility

- Use semantic HTML elements
- Provide proper ARIA labels where needed
- Ensure keyboard navigation works for all interactive elements
- Maintain proper focus management
- Use proper heading hierarchy (h1, h2, h3, etc.)
- Admin interfaces should be accessible to all administrators

## Git & Version Control

- Never write to git
