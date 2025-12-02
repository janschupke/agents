# Integration Test Setup Summary

## Overview

Integration tests have been set up for the API with the following features:

1. **Database Setup/Cleanup**: Automatic test database setup and cleanup
2. **OpenAI Mocking**: Complete OpenAI API mocking - no real API calls are made
3. **Authentication Bypass**: Test guard that bypasses Clerk authentication
4. **Test Utilities**: Helper functions for creating test data and making requests

## Files Created

### Core Setup Files

1. **`test/setup.ts`**
   - `setupTestDatabase()` - Sets up test database connection
   - `cleanupTestDatabase()` - Cleans up all test data
   - `createTestUser()` - Creates test users
   - `createTestAgent()` - Creates test agents
   - `createTestApiCredentials()` - Creates test API credentials

2. **`test/test-helpers.ts`**
   - `createTestApp()` - Creates NestJS app with mocks
   - `MockOpenAIService` - Mock OpenAI service
   - `authenticatedRequest()` - Helper for authenticated requests
   - `createAuthHeaders()` - Creates auth headers
   - `createTestUserObject()` - Creates test user objects

3. **`test/test-guard.ts`**
   - `TestGuard` - Replaces ClerkGuard in tests
   - Extracts user ID from test token: `Bearer test-token-{userId}`
   - Automatically creates users if they don't exist

4. **`test/jest-e2e.json`**
   - Jest configuration for integration tests
   - Uses `setup.ts` as setup file
   - 30 second timeout
   - Single worker for database isolation

### Example Test Files

1. **`test/agents.e2e-spec.ts`** - Agent CRUD operations
2. **`test/chat.e2e-spec.ts`** - Chat endpoints and sessions
3. **`test/healthcheck.e2e-spec.ts`** - Health check endpoint

## Configuration

### Environment Variables

Set one of these for test database:

```bash
# Option 1: Separate test database (recommended)
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/test_db"

# Option 2: Same database (tests clean up after themselves)
DATABASE_URL="postgresql://user:password@localhost:5432/db"
```

### Package.json Script

Added script:
```json
"test:integration": "jest --config ./test/jest-e2e.json"
```

## Running Tests

```bash
# Run all integration tests
pnpm test:integration

# Run specific test file
pnpm test:integration agents.e2e-spec.ts

# Run with coverage
pnpm test:integration --coverage
```

## Key Features

### 1. OpenAI Mocking

All OpenAI API calls are mocked:
- Chat completions return mock responses
- Embeddings return mock vectors (1536 dimensions)
- No real API calls are ever made
- Mock can be customized in tests via `MockOpenAIService.getMockClient()`

### 2. Database Management

- Uses `TEST_DATABASE_URL` if set, otherwise `DATABASE_URL`
- Cleans up all test data after tests complete
- Creates test users, agents, and credentials as needed
- Each test should use unique user IDs to avoid conflicts

### 3. Authentication

- Test guard bypasses Clerk authentication
- Uses test token format: `Bearer test-token-{userId}`
- Automatically creates users in database
- Supports `@Public()` decorator for public routes

## Writing New Tests

Example structure:

```typescript
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createTestApp, authenticatedRequest } from './test-helpers';
import { setupTestDatabase, createTestUser, cleanupTestDatabase } from './setup';

describe('Feature API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let testUserId: string;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const setup = await setupTestDatabase();
    prisma = setup.prisma;
    cleanup = setup.cleanup;
    
    testUserId = 'test-user-unique-123';
    await createTestUser(prisma, testUserId);
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    await cleanup();
  });

  it('should test endpoint', async () => {
    const response = await authenticatedRequest(app, testUserId)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toBeDefined();
  });
});
```

## Important Notes

1. **Always use unique user IDs** in tests to avoid conflicts
2. **Clean up in beforeEach/afterEach** if needed for test isolation
3. **OpenAI is completely mocked** - no real API calls
4. **Database cleanup** happens automatically after all tests
5. **Test guard** handles authentication automatically

## Next Steps

To add more integration tests:

1. Create new `*.e2e-spec.ts` files in `test/` directory
2. Follow the example structure from existing tests
3. Use helper functions from `test-helpers.ts`
4. Use database setup functions from `setup.ts`
