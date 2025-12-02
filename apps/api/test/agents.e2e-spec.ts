import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  authenticatedRequest,
  getPrismaService,
} from './test-helpers';
import {
  createTestUser,
  createTestAgent,
} from './setup';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Agents API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserId: string;

  beforeAll(async () => {
    // Create test app first
    app = await createTestApp();
    
    // Get PrismaService from app
    prisma = getPrismaService(app);

    // Create test user
    testUserId = 'test-user-e2e-123';
    await createTestUser(prisma, testUserId);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    // Give time for cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  beforeEach(async () => {
    // Clean up agents before each test
    await prisma.agent.deleteMany({
      where: { userId: testUserId },
    });
  });

  describe('GET /api/agents', () => {
    it('should return empty array when no agents exist', async () => {
      const response = await authenticatedRequest(app, testUserId)
        .get('/api/agents')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return user agents', async () => {
      // Create test agents
      const agent1 = await createTestAgent(prisma, testUserId, 'Agent 1');
      const agent2 = await createTestAgent(prisma, testUserId, 'Agent 2');

      const response = await authenticatedRequest(app, testUserId)
        .get('/api/agents')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.map((a: { id: number }) => a.id)).toContain(
        agent1.id
      );
      expect(response.body.map((a: { id: number }) => a.id)).toContain(
        agent2.id
      );
    });

    it('should only return agents for authenticated user', async () => {
      // Create agent for different user
      const otherUserId = 'other-user-456';
      await createTestUser(prisma, otherUserId);
      await createTestAgent(prisma, otherUserId, 'Other Agent');

      // Create agent for test user
      await createTestAgent(prisma, testUserId, 'My Agent');

      const response = await authenticatedRequest(app, testUserId)
        .get('/api/agents')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('My Agent');
    });
  });

  describe('GET /api/agents/:id', () => {
    it('should return agent by id', async () => {
      const agent = await createTestAgent(prisma, testUserId, 'Test Agent');

      const response = await authenticatedRequest(app, testUserId)
        .get(`/api/agents/${agent.id}`)
        .expect(200);

      expect(response.body.id).toBe(agent.id);
      expect(response.body.name).toBe('Test Agent');
    });

    it('should return 404 for non-existent agent', async () => {
      await authenticatedRequest(app, testUserId)
        .get('/api/agents/99999')
        .expect(404);
    });

    it('should return 404 for agent belonging to another user', async () => {
      const otherUserId = 'other-user-789';
      await createTestUser(prisma, otherUserId);
      const otherAgent = await createTestAgent(
        prisma,
        otherUserId,
        'Other Agent'
      );

      await authenticatedRequest(app, testUserId)
        .get(`/api/agents/${otherAgent.id}`)
        .expect(404);
    });
  });

  describe('POST /api/agents', () => {
    it('should create a new agent', async () => {
      const createDto = {
        name: 'New Agent',
        description: 'Agent description',
      };

      const response = await authenticatedRequest(app, testUserId)
        .post('/api/agents')
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe('New Agent');
      expect(response.body.description).toBe('Agent description');
      expect(response.body.id).toBeDefined();

      // Verify in database
      const agent = await prisma.agent.findUnique({
        where: { id: response.body.id },
      });
      expect(agent).toBeDefined();
      expect(agent?.userId).toBe(testUserId);
    });

    it('should return 400 if name is missing', async () => {
      await authenticatedRequest(app, testUserId)
        .post('/api/agents')
        .send({ description: 'No name' })
        .expect(400);
    });

    it('should return 409 if agent name already exists', async () => {
      await createTestAgent(prisma, testUserId, 'Duplicate Name');

      await authenticatedRequest(app, testUserId)
        .post('/api/agents')
        .send({ name: 'Duplicate Name' })
        .expect(409);
    });
  });

  describe('PUT /api/agents/:id', () => {
    it('should update agent', async () => {
      const agent = await createTestAgent(prisma, testUserId, 'Original Name');

      const updateDto = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const response = await authenticatedRequest(app, testUserId)
        .put(`/api/agents/${agent.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.description).toBe('Updated description');
    });

    it('should return 404 for non-existent agent', async () => {
      await authenticatedRequest(app, testUserId)
        .put('/api/agents/99999')
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/agents/:id', () => {
    it('should delete agent', async () => {
      const agent = await createTestAgent(prisma, testUserId, 'To Delete');

      await authenticatedRequest(app, testUserId)
        .delete(`/api/agents/${agent.id}`)
        .expect(200);

      // Verify deleted
      const deleted = await prisma.agent.findUnique({
        where: { id: agent.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent agent', async () => {
      await authenticatedRequest(app, testUserId)
        .delete('/api/agents/99999')
        .expect(404);
    });
  });
});
