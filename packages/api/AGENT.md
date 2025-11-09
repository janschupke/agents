# Coding Assistant Ruleset for API Package

## TypeScript & Type Safety

- Always use TypeScript interfaces and types for strong typing
- Define interfaces for all function parameters, return types, and data models
- Use TypeScript interfaces to define models (not classes unless needed for dependency injection)
- Leverage TypeScript strict mode features (noUnusedLocals, noUnusedParameters)
- Prefer interfaces over type aliases for object shapes
- Use proper type inference where appropriate, but be explicit for public APIs
- Use Prisma-generated types from `@prisma/client` for database entities
- Create custom interfaces when you need to extend or transform Prisma types (e.g., `BotWithConfig`)

## NestJS Architecture & Patterns

- Follow NestJS best practices and conventions
- Use dependency injection for all services, repositories, and providers
- Organize code into modules (Controllers, Services, Repositories, DTOs)
- Use decorators appropriately (`@Injectable()`, `@Controller()`, `@Get()`, `@Post()`, etc.)
- Leverage NestJS built-in features (Guards, Filters, Pipes, Interceptors)
- Use `@Module()` decorator to organize feature modules
- Register global guards, filters, and interceptors in `app.module.ts` when needed
- Use `forwardRef()` when dealing with circular dependencies

## Code Organization & Structure

- Keep code modular and files small (single responsibility principle)
- Follow the standard NestJS structure:
  - **Controllers**: Handle HTTP requests/responses, minimal business logic
  - **Services**: Business logic and orchestration
  - **Repositories**: Database access and data persistence
  - **DTOs**: Data Transfer Objects for API payloads (in `common/dto/`)
  - **Interfaces**: Type definitions (in `common/interfaces/` or `common/types/`)
  - **Guards**: Authentication and authorization logic
  - **Filters**: Exception handling
  - **Modules**: Feature organization
- Group related files by feature/domain (e.g., `chat/`, `bot/`, `auth/`)
- Keep shared/common code in `common/` directory
- Use index files for clean exports when appropriate

## REST API Design Principles

- Follow RESTful conventions for endpoint naming and HTTP methods
- Use appropriate HTTP status codes:
  - `200 OK`: Successful GET, PUT, PATCH
  - `201 Created`: Successful POST (resource created)
  - `204 No Content`: Successful DELETE
  - `400 Bad Request`: Invalid request data
  - `401 Unauthorized`: Authentication required
  - `403 Forbidden`: Insufficient permissions
  - `404 Not Found`: Resource not found
  - `500 Internal Server Error`: Server errors
- Use consistent API path prefixes (e.g., `/api/chat`, `/api/bot`)
- Use query parameters for filtering, pagination, and optional data
- Use path parameters for resource identifiers (e.g., `:botId`, `:sessionId`)
- Return consistent response structures
- Always validate user input before processing

## DTOs (Data Transfer Objects)

- Use DTO files to define API payloads (request/response structures)
- Place DTOs in `common/dto/` for shared DTOs, or in feature directories for feature-specific DTOs
- Use classes for DTOs (NestJS convention)
- Consider using `class-validator` decorators for validation (if added to project)
- Keep DTOs focused and minimal - only include fields needed for the API
- Document complex DTOs with comments

## Prisma & Database Patterns

- Always use Prisma Service (`PrismaService`) for database access
- Create Repository classes to encapsulate database queries (don't query Prisma directly in services)
- Use transactions when multiple related operations must succeed or fail together
- Use Prisma's type-safe queries and leverage TypeScript types
- Use `select` to limit fields returned from database (performance optimization)
- Use indexes appropriately (defined in Prisma schema)
- Use cascade deletes in Prisma schema for related data cleanup
- Always verify ownership/permissions before modifying resources (check `userId` matches)
- Use parallel queries (`Promise.all()`) when operations are independent
- Handle database errors gracefully and provide meaningful error messages
- Use Prisma migrations for schema changes (never modify database directly)

## Repository Pattern

- Create repository classes for each domain entity (e.g., `BotRepository`, `SessionRepository`)
- Repositories should only contain database access logic
- Methods should be focused and single-purpose
- Use descriptive method names (e.g., `findByIdAndUserId`, `findLatestByBotId`)
- Return `null` when entity not found (let service layer handle 404 responses)
- Keep repository methods pure - no business logic
- Use performance logging for slow queries (>50ms)

## Service Layer Patterns

- Services contain business logic and orchestrate between repositories
- Services should be thin - delegate to repositories for data access
- Services handle validation, authorization checks, and business rules
- Services throw `HttpException` with appropriate status codes
- Services should not directly access HTTP request/response objects
- Use dependency injection to inject repositories and other services
- Keep services focused on a single domain/feature
- Handle errors and convert them to appropriate HTTP exceptions

## Controller Patterns

- Controllers handle HTTP requests and responses only
- Keep controllers thin - delegate business logic to services
- Use decorators to extract data from requests (`@Param()`, `@Body()`, `@Query()`, `@User()`)
- Use pipes for validation and transformation (e.g., `ParseIntPipe`)
- Handle errors in controllers - catch service exceptions and convert to HTTP responses
- Use try-catch blocks in controllers to handle unexpected errors
- Return appropriate HTTP status codes
- Use the `@User()` decorator to access authenticated user from `ClerkGuard`

## Authentication & Authorization

- Use Clerk for authentication via `ClerkGuard` (registered globally in `app.module.ts`)
- Use `@Public()` decorator to mark routes that don't require authentication
- Access authenticated user via `@User()` decorator in controllers
- User is automatically synced to database by `ClerkGuard`
- Use `RolesGuard` for role-based access control when needed
- Always verify resource ownership (check `userId` matches) before operations
- Never trust client-provided user IDs - always use authenticated user from token

## Error Handling

- Use NestJS `HttpException` for all API errors
- Use appropriate HTTP status codes (see REST API Design Principles)
- Provide meaningful error messages to clients
- Log errors appropriately (use `console.error` for errors, `console.warn` for warnings)
- Use global exception filters for consistent error response format
- Handle edge cases (empty states, null values, validation failures)
- Never expose internal error details to clients in production
- Re-throw `HttpException` instances from services in controllers

## Testing

- Add unit tests for any significant feature added
- Use Jest for testing (configured in `jest.config.js`)
- Mock all dependencies (repositories, services, external APIs)
- Use `@nestjs/testing` utilities (`Test.createTestingModule`)
- Test business logic in services, not implementation details
- Test error cases and edge cases, not just happy paths
- Use descriptive test names that explain what is being tested
- Follow existing test patterns (see `chat.service.spec.ts`)
- Always run tests after implementing a feature (`npm test`)
- Use `test:watch` for development, `test:cov` for coverage reports

## Performance Considerations

- Use `Promise.all()` for parallel independent operations
- Use Prisma `select` to limit fields returned from database
- Add performance logging for operations that might be slow (>50ms)
- Use database indexes (defined in Prisma schema)
- Consider caching for frequently accessed data (see `ClerkGuard` caching example)
- Avoid N+1 query problems - use Prisma `include` or batch queries
- Use connection pooling (configured in Prisma)
- Monitor and log slow operations

## Security

- Never expose sensitive data in API responses
- Use environment variables for configuration (never commit secrets)
- Encrypt sensitive data at rest (e.g., API credentials)
- Validate and sanitize all user input
- Use Clerk for authentication; never implement custom auth logic
- Always verify resource ownership before operations
- Use HTTPS in production
- Implement rate limiting for public endpoints (if needed)
- Never log sensitive information (API keys, tokens, passwords)

## Constants & Configuration

- Never hardcode values - use centralized constants
- Store constants in `common/constants/` directory
- Use environment variables for configuration (via `app.config.ts`)
- Define enums for fixed sets of values
- Use `as const` assertions for immutable constant objects
- Keep configuration centralized and type-safe

## Import/Export Patterns

- Use explicit imports (avoid `import *`)
- Group imports: NestJS imports, third-party, local modules, types, utilities
- Use relative imports for local files
- Prefer named exports for utilities and services
- Use default exports sparingly (mainly for modules)
- Keep import statements organized and clean

## Code Quality

- Always run tests and code check after implementing a feature
- Run `npm run lint` to check code style
- Run `npm run type-check` to verify TypeScript types
- Run `npm test` to ensure tests pass
- Keep functions pure when possible (no side effects)
- Use meaningful variable and function names
- Add comments for complex business logic, not obvious code
- Remove debug `console.log` statements before committing (use `console.warn`/`console.error` for important messages)
- Keep functions small and focused (single responsibility)
- Avoid deep nesting - extract functions when logic becomes complex

## File Naming Conventions

- Use kebab-case for file names (e.g., `chat.service.ts`, `bot.repository.ts`)
- Use PascalCase for class names (e.g., `ChatService`, `BotRepository`)
- Use camelCase for variable and function names
- Use UPPER_SNAKE_CASE for constants
- Use descriptive names that indicate the file's purpose
- Suffix files appropriately:
  - `.service.ts` for services
  - `.controller.ts` for controllers
  - `.repository.ts` for repositories
  - `.module.ts` for modules
  - `.dto.ts` for DTOs
  - `.spec.ts` for test files
  - `.guard.ts` for guards
  - `.filter.ts` for filters

## Module Organization

- Each feature should have its own module (e.g., `ChatModule`, `BotModule`)
- Modules should import dependencies explicitly
- Use `@Module()` decorator with proper `imports`, `controllers`, `providers`, `exports`
- Export services/repositories that are used by other modules
- Keep modules focused on a single domain/feature

## Git & Version Control

- Never write to git directly
- Commit messages should be clear and descriptive
- Don't commit sensitive data (API keys, secrets, credentials)
- Use `.env` files for local configuration (should be in `.gitignore`)

## Best Practices Summary

- Always follow best practices of REST API, NestJS, and Prisma
- Keep code modular and files small
- Use strong typing throughout
- Always run tests and code check after implementing a feature
- Handle errors gracefully with appropriate HTTP status codes
- Verify resource ownership before operations
- Use repositories for database access, services for business logic
- Write unit tests for significant features
- Follow existing code patterns and conventions
- Document complex logic with comments
