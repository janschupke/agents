import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Integration test setup and teardown
 * Uses TEST_DATABASE_URL or DATABASE_URL for test database
 * Cleans up test data after tests
 * 
 * Note: These functions work with both PrismaClient and PrismaService
 */

export async function setupTestDatabase() {
  // This function is kept for backward compatibility
  // But tests should use PrismaService from the app instead
  const databaseUrl =
    process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'TEST_DATABASE_URL or DATABASE_URL must be set for integration tests'
    );
  }

  return {
    testDatabaseUrl: databaseUrl,
  };
}

export async function cleanupTestDatabase(
  prisma: PrismaClient | PrismaService
) {
  if (!prisma) return;

  try {
    // Clean up all test data in reverse order of dependencies
    // This ensures foreign key constraints are respected
    await prisma.agentMemory.deleteMany({});
    await prisma.messageWordTranslation.deleteMany({});
    await prisma.messageTranslation.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.chatSession.deleteMany({});
    await prisma.agentConfig.deleteMany({});
    await prisma.agent.deleteMany({});
    await prisma.userApiCredential.deleteMany({});
    await prisma.user.deleteMany({});
    // Note: systemConfig is typically not user-specific, so we may want to preserve it
    // await prisma.systemConfig.deleteMany({});
  } catch (error) {
    console.warn('Cleanup error (non-fatal):', error);
  }
  // Note: Don't disconnect here - PrismaService will handle it via OnModuleDestroy
}

/**
 * Create a test user in the database
 */
export async function createTestUser(
  prisma: PrismaClient | PrismaService,
  userId: string = 'test-user-123',
  email: string = 'test@example.com'
) {
  return await prisma.user.upsert({
    where: { id: userId },
    update: {
      email,
      firstName: 'Test',
      lastName: 'User',
      roles: ['user'],
    },
    create: {
      id: userId,
      email,
      firstName: 'Test',
      lastName: 'User',
      roles: ['user'],
    },
  });
}

/**
 * Create a test agent for a user
 */
export async function createTestAgent(
  prisma: PrismaClient | PrismaService,
  userId: string,
  name: string = 'Test Agent'
) {
  return await prisma.agent.create({
    data: {
      userId,
      name,
      description: 'Test agent description',
    },
  });
}

/**
 * Create test API credentials for a user
 */
export async function createTestApiCredentials(
  prisma: PrismaClient | PrismaService,
  userId: string,
  provider: string = 'openai',
  encryptedKey: string = 'encrypted-test-key'
) {
  return await prisma.userApiCredential.upsert({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
    update: {
      encryptedKey,
    },
    create: {
      userId,
      provider,
      encryptedKey,
    },
  });
}
