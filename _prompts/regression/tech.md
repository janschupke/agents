# Technical Codebase Analysis Prompt

## Role

You are a senior software engineer conducting a comprehensive technical audit of this codebase. Your task is to identify technical debt, code quality issues, and areas for improvement.

## Project Structure

This is a monorepo with the following structure:

- **apps/**
  - `api` - NestJS backend server (Jest for testing, Prisma for database)
  - `client` - Frontend application for OpenAI chat (React + Vite, Vitest for testing)
  - `admin` - Frontend application for system administration (React + Vite, Vitest for testing)
- **packages/**
  - `i18n` - Internationalization package with translation management
  - `utils` - Generic utility functions (parsing, formatting, validation, etc.)

## Analysis Scope

Analyze the codebase for violations of best practices in modern fullstack software engineering, with particular focus on:

- React (hooks, component patterns, state management, React + Vite for client/admin)
- TailwindCSS (utility usage, consistency)
- Node.js/NestJS (architecture, dependency injection, module organization)
- TypeScript (type safety, type definitions)
- Testing practices:
  - **Client/Admin**: Vitest for unit tests
  - **API**: Jest for unit and integration tests (`.spec.ts` files)
- Internationalization (i18n package structure, translation key usage)
- OpenAI integration patterns
- Vector search and memory management

## Key Areas to Investigate

### 1. Code Duplication

- **Business logic duplication**: Repeated logic that should be extracted into shared utilities, hooks, or services
  - Chat message handling logic
  - Agent configuration logic
  - Session management logic
  - Memory retrieval logic
  - Translation logic
- **JSX/TSX markup duplication**: Repeated UI patterns that should be componentized
  - Chat message components
  - Agent list/card components
  - Session list components
  - Form patterns
- **Data transformation duplication**: Repeated data mapping/transformation logic
  - OpenAI API request/response transformations
  - Message formatting
  - Agent config merging

### 2. Type Safety & Constants

- **Hardcoded string literals**: Magic strings that should be enums or constants
  - Message roles ('user', 'assistant', 'system')
  - API provider names
  - Configuration keys
- **Repeated values**: Values defined as literals in multiple places that should be centralized
  - OpenAI model names
  - Vector embedding dimensions (1536)
  - Similarity thresholds
- **Missing type definitions**: Areas lacking proper TypeScript types or interfaces
  - OpenAI API response types
  - Agent configuration types
  - Message metadata types
- **Utility function duplication**: Functions that should use `@openai/utils` but are reimplemented
  - Date/time formatting
  - Validation functions
  - String manipulation

### 3. File Organization

- **Bloated files**: Files exceeding reasonable size limits (components >500 lines, utilities >500 lines, services >500 lines)
- **Single Responsibility violations**: Files handling multiple concerns that should be split
- **Missing separation of concerns**: Business logic mixed with presentation logic
  - Chat service handling both business logic and OpenAI API calls
  - Components containing business logic that should be in hooks/services

### 4. Component Architecture

- **Component reusability**: Components that could be generic but are app-specific
  - Chat message components
  - Agent card/list components
  - Session list components
  - Form components
- **Direct UI definitions**: Manual structural definitions (HTML/Tailwind) that duplicate existing patterns
- **TailwindCSS violations**: Inconsistent Tailwind usage, hardcoded values that should use design system
- **Layout component duplication**: Manual layout markup instead of reusable layout components

### 5. Testing

- **Missing test coverage**: Critical business logic without tests
  - Chat service logic
  - Agent management logic
  - Memory retrieval logic
  - Translation logic
- **Test organization**: Tests not properly structured or located
  - Client/Admin: Unit tests should be co-located with source files
  - API: Tests should use `.spec.ts` naming convention
- **Test quality**: Tests that don't adequately cover edge cases or error scenarios
- **Test framework consistency**: Incorrect use of test frameworks (Vitest vs Jest)

### 6. Naming & Consistency

- **Naming inconsistencies**:
  - Component names not following consistent patterns (PascalCase, descriptive)
  - File names not matching component/export names
  - Variable/function names not following conventions
- **Folder structure inconsistencies**: Similar features organized differently across the codebase
- **Import path inconsistencies**: Mixed relative/absolute imports, inconsistent path aliases

### 7. Performance & Best Practices

- **Unnecessary re-renders**: React components that could be optimized
  - Chat message list components
  - Agent list components
  - Session list components
- **Bundle size**: Large dependencies or unused imports
- **API patterns**: Inconsistent API call patterns or error handling
  - OpenAI API calls
  - Chat API calls
  - Agent API calls
- **Vector search optimization**: Memory retrieval queries that could be optimized

### 8. Internationalization (i18n)

- **Hardcoded user-facing strings**: Text visible to users that should use translation keys
  - Error messages
  - UI labels
  - Button text
  - Form placeholders
- **Translation key organization**: Keys not properly categorized in i18n package structure
  - Check `packages/i18n/src/locales/en/` structure
  - Verify namespaces (client, admin, api, common) are used correctly
- **Missing translations**: User-facing strings without translation support
- **Log translation**: Logs/debug messages incorrectly translated (should remain in English)

### 9. Package Boundaries

- **Utility function placement**: Functions that should be in `@openai/utils` but are in app directories
  - Date/time utilities
  - Validation functions
  - String manipulation
- **Type definitions**: Types that should be shared but are defined locally
  - Agent types
  - Message types
  - Session types
- **Component placement**: Components that could be shared but are app-specific

### 10. OpenAI Integration

- **API call patterns**: Inconsistent OpenAI API usage
  - Request/response handling
  - Error handling
  - Retry logic
- **Model configuration**: Hardcoded model names or configurations
- **Token management**: Token counting and limit handling
- **Streaming support**: If streaming is used, is it properly implemented?

### 11. Memory & Vector Search

- **Memory retrieval patterns**: Consistent memory retrieval logic
- **Vector search optimization**: Efficient similarity search implementation
- **Memory storage**: Proper memory chunk creation and storage
- **Memory lifecycle**: Memory update and cleanup patterns

### 12. Error Handling

- **Error handling consistency**: Inconsistent error handling patterns
  - API error handling
  - OpenAI API error handling
  - Database error handling
- **Error messages**: User-friendly error messages
- **Error logging**: Proper error logging and monitoring

## Output Requirements

Create a comprehensive analysis document that includes:

1. **Executive Summary**: High-level overview of findings and priority areas

2. **Detailed Findings**: For each issue identified, provide:
   - **Category**: Which area it falls under (duplication, type safety, etc.)
   - **Severity**: Critical, High, Medium, or Low
   - **Location**: Specific file paths with line numbers or function/component names
   - **Description**: Clear explanation of the issue
   - **Example**: Code snippet showing the problem
   - **Impact**: Why this matters (maintainability, performance, bugs, etc.)

3. **Refactoring Plan**: Organized by priority:
   - **Phase 1 (Critical)**: Issues that block maintainability or introduce bugs
   - **Phase 2 (High)**: Significant improvements to code quality
   - **Phase 3 (Medium)**: Quality-of-life improvements
   - **Phase 4 (Low)**: Nice-to-have improvements

   For each phase, include:
   - Estimated effort
   - Dependencies between refactorings
   - Risk assessment
   - Step-by-step approach

4. **Recommendations**:
   - Best practices to adopt going forward
   - Patterns to establish
   - Tools or processes that could help prevent future issues

## Key Standards to Enforce

When analyzing, ensure compliance with the following established standards:

- **Utility functions**: Check `@openai/utils` first before creating new utilities
- **Shared types**: Consider sharing types across apps when appropriate
- **Component placement**: Generic components should be reusable, app-specific in app directories
- **Testing**: Client/Admin uses Vitest, API uses Jest
- **i18n**: All user-facing strings must use translation keys, logs remain in English
- **File size limits**: Components <500 lines, utilities <500 lines, services <500 lines
- **No `any` types**: Use proper TypeScript types or `unknown`
- **Package naming**: Use `@openai/i18n` and `@openai/utils` workspace packages

## Instructions

- **Do NOT perform any refactoring** - this is analysis only
- Be thorough and specific - include file paths and line numbers where possible
- Prioritize actionable findings over theoretical improvements
- Consider the monorepo structure when making recommendations
- Focus on maintainability, testability, and robustness as end goals
- Pay special attention to OpenAI chat domain-specific features (agents, sessions, messages, memory, translations)
- Evaluate OpenAI API integration patterns
- Consider vector search and memory management patterns
- Output the analysis as a new markdown document in the `_prompts/audits/` folder
