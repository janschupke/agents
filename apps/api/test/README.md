# Integration Tests

This directory contains integration tests for the API that test endpoints end-to-end with a real database.

## Setup

### Environment Variables

Set up your test database connection:

```bash
# Option 1: Use a separate test database
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/test_db"

# Option 2: Use the same database (tests will clean up after themselves)
DATABASE_URL="postgresql://user:password@localhost:5432/db"
```

### Database Setup

1. Ensure your test database exists
2. Run migrations on the test database:
   ```bash
   DATABASE_URL="your_test_db_url" npx prisma migrate deploy
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

## Test Structure

### Test Helpers (`test-helpers.ts`)

- `createTestApp()` - Creates a NestJS app with mocked OpenAI and test guard
- `authenticatedRequest()` - Helper for making authenticated requests
- `MockOpenAIService` - Mock OpenAI service that never makes real API calls

### Database Setup (`setup.ts`)

- `setupTestDatabase()` - Sets up test database connection
- `cleanupTestDatabase()` - Cleans up all test data
- `createTestUser()` - Creates a test user in the database
- `createTestAgent()` - Creates a test agent
- `createTestApiCredentials()` - Creates test API credentials

### Test Guard (`test-guard.ts`)

The `TestGuard` replaces `ClerkGuard` in integration tests:
- Bypasses Clerk authentication
- Extracts user ID from test token format: `Bearer test-token-{userId}`
- Automatically creates users in database if they don't exist

## Writing Tests

Example test structure:

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
    
    testUserId = 'test-user-123';
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

1. **OpenAI is Mocked**: All OpenAI API calls are mocked and never make real requests
2. **Database Cleanup**: Tests clean up all data after running
3. **Isolated Tests**: Each test should be independent and not rely on other tests
4. **Test Users**: Use unique user IDs for each test to avoid conflicts

## Test Database

The tests use a separate test database (or the same database with cleanup). All test data is deleted after tests complete.

To use a separate test database, set `TEST_DATABASE_URL` environment variable.
