# Quality Assurance & Testing Infrastructure Analysis Prompt

## Role

You are a senior QA engineer and test architect conducting a comprehensive audit of the automated testing infrastructure and test code quality in this codebase. Your task is to evaluate test coverage, test structure, test maintainability, and whether tests accurately validate real-world scenarios and intended application behavior.

## Project Structure

This is a monorepo with the following structure:

- **apps/**
  - `api` - NestJS backend server (Jest tests with `.spec.ts` files, coverage thresholds configured)
  - `client` - Frontend application for OpenAI chat (React + Vite, Vitest for unit tests)
  - `admin` - Frontend application for system administration (React + Vite, Vitest)
- **packages/**
  - `i18n` - Internationalization package (translation management)
  - `utils` - Generic utility functions (Vitest for testing)

The testing infrastructure includes:

- **Vitest** for frontend unit tests (client, admin, utils packages)
- **Jest** for backend tests (api)
- **React Testing Library** for React component tests
- **Coverage thresholds** configured in `apps/api/jest.config.mjs`
- **MSW (Mock Service Worker)** for API mocking in frontend tests

## Analysis Scope

Analyze the testing infrastructure and test code focusing on:

- Test coverage across all levels (unit, integration, E2E if present)
- Test structure, organization, and maintainability
- Test quality and whether they test real-world scenarios
- Test infrastructure setup and configuration
- Test data management and fixtures
- Test isolation and independence
- Test performance and execution time
- Alignment between tests and actual application behavior

## Key Areas to Investigate

### 1. Test Coverage & Gaps

- **Coverage metrics**:
  - Evaluate actual test coverage vs. configured thresholds (API has coverage thresholds)
  - Check coverage across all apps and packages
- **Missing test coverage**:
  - Identify critical business logic, utilities, services, and components without tests
  - Check `@openai/utils` package for untested utilities
  - Check client/admin apps for untested features
  - Check API services, controllers, and repositories for untested code
- **Coverage distribution**: Are tests evenly distributed or concentrated in certain areas?
- **Critical path coverage**: Do critical user flows and business logic have adequate coverage?
  - Chat message sending and receiving
  - Agent configuration and management
  - Session management
  - Memory retrieval and storage
  - Message translation features
  - API credential management
- **Edge case coverage**: Are edge cases and error scenarios tested?
- **Package coverage**: Evaluate test coverage for each package (utils, i18n)

### 2. Test Structure & Organization

- **Test file organization**:
  - Client app: Unit tests co-located with source files
  - Admin app: Unit tests co-located with source files
  - API: Tests co-located with `.spec.ts` naming convention
  - Packages: Check if tests are properly organized
- **Test naming conventions**:
  - Do test files follow patterns (`.test.tsx`, `.test.ts`, `.spec.ts`, etc.)?
  - Are test cases descriptively named?
- **Test file size**: Are test files bloated (e.g., >500 lines) and should be split?
- **Test grouping**: Are related tests properly grouped using `describe` blocks?
- **Test isolation**: Can tests run independently without dependencies on execution order?
- **Test fixtures**: Are test data and fixtures properly organized and reusable?

### 3. Test Quality & Real-World Scenarios

- **Realistic test data**: Do tests use realistic data that reflects actual usage?
- **Business logic validation**: Do tests validate actual business rules and intended behavior?
- **User scenario testing**: Are tests based on real user workflows and scenarios?
  - Chat conversations with agents
  - Creating and configuring agents
  - Managing chat sessions
  - Translation workflows
- **Outdated tests**: Identify tests that test outdated behavior or features that no longer exist
- **Incorrect test assertions**: Find tests that assert incorrect or unintended behavior
- **Missing assertions**: Tests that don't actually verify expected outcomes
- **Test vs. implementation**: Do tests test implementation details instead of behavior?

### 4. Unit Test Quality

- **Service tests**: Evaluate backend service tests (`*.service.spec.ts` in API)
  - Are dependencies properly mocked?
  - Do tests cover success and error cases?
  - Are edge cases tested (null, empty, invalid inputs)?
  - Do tests verify business logic correctly?
  - Chat service tests for message handling
  - Agent service tests for agent management
  - Memory service tests for vector similarity search
  - Translation service tests
- **Repository tests**: Evaluate repository tests (`*.repository.spec.ts` in API)
  - Are Prisma queries properly tested?
  - Do tests verify database interactions?
  - Are user isolation patterns tested (userId filtering)?
- **Utility function tests**: Evaluate tests for utility functions
  - In `@openai/utils` package: Are all utility functions tested?
  - In app-specific utils: Are utilities tested?
  - Do tests cover edge cases and boundary conditions?
  - Are tests independent and isolated?
- **Hook tests**: Evaluate React hook tests (client/admin apps)
  - Are custom hooks properly tested?
  - Do tests cover state changes and side effects?
  - Are hook dependencies tested?
  - Are hooks tested in isolation (not as part of component tests)?
- **Component unit tests**: Evaluate component tests in client/admin
  - Are components tested in isolation with mocked providers?
  - Do tests focus on component behavior, not implementation details?
  - Are tests fast (using mocked contexts)?
  - Chat interface components
  - Agent management components
  - Session list components
  - Translation UI components

### 5. Component Test Quality

- **Component test coverage**:
  - Which components have tests and which don't?
  - Client/admin apps: Are app-specific components tested?
- **User interaction testing**: Do component tests simulate real user interactions?
- **Accessibility testing**: Are accessibility concerns tested?
- **Props and state testing**: Do tests verify component behavior with different props/state?
- **Integration with hooks**: Do component tests properly test hook integration?
- **Mock usage**:
  - Are mocks used appropriately in unit tests?
  - Are API calls properly mocked (MSW)?
- **Snapshot testing**: Is snapshot testing used appropriately, or are snapshots outdated?

### 6. Integration Test Quality

- **API integration tests**: Evaluate backend integration tests
  - Do tests cover API endpoints end-to-end?
  - Are database interactions properly tested?
  - Is test data properly isolated?
  - Are authentication/authorization flows tested?
  - Chat endpoints (send message, get history)
  - Agent endpoints (CRUD operations)
  - Session endpoints
  - Memory endpoints
  - Translation endpoints
- **Frontend integration tests**: Evaluate frontend integration tests
  - Do tests cover complete user flows (multi-step workflows)?
  - Do tests use real providers and contexts (not mocked)?
  - Are tests using proper routing setup?
  - Do tests verify data flow between components?
  - Are API calls properly mocked (MSW) or tested with real endpoints?
  - Chat conversation flows
  - Agent creation and configuration flows
  - Session management flows

### 7. E2E Test Quality

- **E2E test coverage**: Evaluate E2E tests if present
  - Do E2E tests cover critical user journeys?
  - Are tests properly organized by feature?
  - Is the test pyramid balanced (not too many E2E tests)?
- **Test setup/teardown**: Evaluate test setup and teardown
  - Is test data properly seeded?
  - Is cleanup thorough and reliable?
  - Are tests isolated from each other?
- **Authentication**: Evaluate authentication setup in E2E tests
  - Is mock authentication working correctly?
  - Are there tests that should use real auth instead?
  - Is the authentication strategy appropriate for each test?

### 8. Test Infrastructure & Configuration

- **Vitest configuration**: Review Vitest configs for client, admin, and packages
  - Are test environments set up correctly (jsdom for React)?
  - Are module aliases configured correctly?
  - Are timeouts appropriate?
- **Jest configuration**: Review `apps/api/jest.config.mjs`
  - Are coverage thresholds appropriate?
  - Are module mappers configured correctly?
  - Are test environments set up correctly?
- **Test scripts**: Review test scripts in root and app `package.json` files
  - Are test commands consistent (`test`, `test:run`, `test:watch`, `test:cov`)?
  - Are watch modes configured?
  - Are test commands optimized for CI/CD?

### 9. Test Data Management

- **Test fixtures**: Evaluate test data fixtures and factories
  - Are fixtures realistic and comprehensive?
  - Are fixtures reusable across tests?
  - Are fixtures maintained and up-to-date?
  - Agent fixtures
  - Session fixtures
  - Message fixtures
  - Memory chunk fixtures
- **Mock data**: Evaluate mock data usage
  - Are mocks realistic?
  - Are mocks maintained when APIs change?
  - Are mocks overused where real data would be better?
  - OpenAI API response mocks
  - Clerk authentication mocks
- **Database test data**: Evaluate database seeding and cleanup
  - Is test data properly isolated?
  - Is cleanup reliable?
  - Are there data leaks between tests?

### 10. Test Maintainability

- **Test readability**: Are tests easy to read and understand?
- **Test documentation**: Do tests have clear descriptions and comments?
- **DRY violations**: Is test code duplicated unnecessarily?
- **Test helpers**: Are test utilities and helpers properly organized?
- **Test refactoring**: Are tests easy to refactor when code changes?
- **Flaky tests**: Identify potentially flaky tests (timing issues, race conditions, etc.)

### 11. Test Performance

- **Test execution time**: Are tests fast enough for developer feedback?
- **Slow tests**: Identify tests that are unnecessarily slow
- **Parallel execution**: Are tests configured to run in parallel?
- **Test optimization**: Opportunities to speed up test execution
- **CI/CD impact**: How do test execution times affect CI/CD pipelines?

### 12. Test Alignment with Business Logic

- **Business rule validation**: Do tests validate actual business rules from requirements?
- **UI behavior validation**: Do component tests validate actual UI behavior users see?
- **API contract validation**: Do API tests validate actual API contracts?
- **Feature completeness**: Do tests cover all features and user stories?
- **Regression prevention**: Do tests prevent known bugs from regressing?

## Output Requirements

Create a comprehensive QA audit document that includes:

1. **Executive Summary**: High-level overview of test coverage, quality, and priority areas for improvement

2. **Detailed Findings**: For each issue identified, provide:
   - **Category**: Which area it falls under (coverage, structure, quality, etc.)
   - **Severity**: Critical, High, Medium, or Low
   - **Location**: Specific file paths with line numbers or test names
   - **Description**: Clear explanation of the issue
   - **Example**: Test code snippet showing the problem
   - **Impact**: Why this matters (regression risk, maintainability, confidence, etc.)
   - **Recommendation**: Specific, actionable improvement with rationale

3. **Coverage Analysis**:
   - **Current Coverage**: Breakdown by package, feature, and test level
   - **Coverage Gaps**: Critical areas missing tests
   - **Coverage Distribution**: Visual breakdown of test distribution
   - **Coverage Goals**: Recommended coverage targets by area

4. **Test Quality Assessment**:
   - **Real-World Scenario Analysis**: Evaluate how well tests reflect actual usage
   - **Outdated Tests**: List tests that need updating or removal
   - **Incorrect Tests**: Tests asserting wrong behavior
   - **Missing Assertions**: Tests that don't verify outcomes

5. **Test Structure Review**:
   - **Organization Patterns**: Evaluate test file organization
   - **Naming Consistency**: Review test naming conventions
   - **File Size Issues**: Identify bloated test files
   - **Isolation Problems**: Tests with dependencies or side effects

6. **Infrastructure Evaluation**:
   - **Configuration Review**: Jest and Vitest configuration
   - **Test Data Management**: Fixtures, mocks, and database setup
   - **CI/CD Integration**: How tests integrate with CI/CD pipelines
   - **Performance Analysis**: Test execution time and optimization opportunities

7. **Test Pyramid Analysis**:
   - **Current Distribution**: Breakdown of unit vs. integration vs. E2E tests
   - **Ideal Distribution**: Recommended test pyramid balance
   - **Gaps and Overlaps**: Areas with too many or too few tests at each level

8. **Refactoring Plan**: Organized by priority:
   - **Phase 1 (Critical)**: Missing tests for critical business logic, incorrect tests, flaky tests
   - **Phase 2 (High)**: Coverage gaps, outdated tests, test structure improvements
   - **Phase 3 (Medium)**: Test quality improvements, infrastructure enhancements, performance optimization
   - **Phase 4 (Low)**: Naming consistency, documentation, minor improvements

   For each phase, include:
   - Estimated effort and complexity
   - Test migration strategy for restructuring
   - Risk assessment
   - Dependencies between improvements

9. **Recommendations**:
   - Testing best practices to adopt
   - Testing patterns to establish
   - Tools or processes (test generators, coverage tools, etc.)
   - Test maintenance strategies
   - CI/CD integration improvements

## Key Testing Standards to Enforce

When analyzing, ensure compliance with the following established testing patterns:

- **Test Framework Usage**:
  - Client/Admin/Packages (utils): Vitest
  - API: Jest
- **Test Organization**:
  - Client/Admin: Unit tests co-located with source files
  - API: Tests co-located with `.spec.ts` naming
  - Packages: Check organization patterns
- **Test Naming**:
  - Unit tests: `.test.tsx`, `.test.ts` alongside source files
  - API tests: `.spec.ts` alongside source files
- **Mock Strategy**:
  - Unit tests: Mock providers, contexts, external dependencies
  - Integration tests: Use real providers, minimal mocking (only external services like Clerk, OpenAI)
  - Never call real APIs in tests (use MSW or mocks)

## Instructions

- **Do NOT write or modify tests** - this is analysis only
- Be thorough and specific - include file paths, line numbers, and test names where possible
- Prioritize actionable findings over theoretical improvements
- Consider the monorepo structure when making recommendations
- Focus on test quality, maintainability, and real-world scenario validation as end goals
- Compare tests to actual application code and business logic to identify misalignments
- Evaluate whether tests would catch real bugs and regressions
- Consider test execution time and developer experience
- Verify tests are using the correct test framework (Vitest vs Jest) for each package/app
- Pay special attention to OpenAI chat domain-specific features (agents, sessions, messages, memory, translations)
- Output the analysis as a new markdown document in the `_prompts/audits/` folder
