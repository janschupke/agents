import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  authenticatedRequest,
  getPrismaService,
} from './test-helpers';
import {
  createTestUser,
  createTestAgent,
  createTestApiCredentials,
} from './setup';
import { MessageRole } from '../src/common/enums/message-role.enum';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Chat API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserId: string;
  let testAgentId: number;

  beforeAll(async () => {
    // Create test app first
    app = await createTestApp();
    
    // Get PrismaService from app
    prisma = getPrismaService(app);

    // Create test user
    testUserId = 'test-user-chat-123';
    await createTestUser(prisma, testUserId);

    // Create test agent
    const agent = await createTestAgent(prisma, testUserId, 'Chat Agent');
    testAgentId = agent.id;

    // Create test API credentials (encrypted key)
    await createTestApiCredentials(prisma, testUserId, 'openai', 'encrypted-test-key');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    // Give time for cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  beforeEach(async () => {
    // Clean up sessions and messages before each test
    await prisma.message.deleteMany({
      where: {
        session: {
          agentId: testAgentId,
        },
      },
    });
    await prisma.chatSession.deleteMany({
      where: { agentId: testAgentId },
    });
  });

  describe('POST /api/chat/:agentId', () => {
    it('should send a message and get response', async () => {
      const sendMessageDto = {
        message: 'Hello, this is a test message',
      };

      const response = await authenticatedRequest(app, testUserId)
        .post(`/api/chat/${testAgentId}`)
        .send(sendMessageDto)
        .expect(201);

      expect(response.body.response).toBeDefined();
      expect(response.body.session).toBeDefined();
      expect(response.body.session.id).toBeDefined();
      expect(response.body.userMessageId).toBeDefined();
      expect(response.body.assistantMessageId).toBeDefined();

      // Verify messages were saved
      const messages = await prisma.message.findMany({
        where: {
          sessionId: response.body.session.id,
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe(MessageRole.USER);
      expect(messages[0].content).toBe('Hello, this is a test message');
      expect(messages[1].role).toBe(MessageRole.ASSISTANT);
      expect(messages[1].content).toBeDefined();
    });

    it('should return 400 if API key is missing', async () => {
      // Delete API credentials
      await prisma.userApiCredential.deleteMany({
        where: { userId: testUserId },
      });

      const sendMessageDto = {
        message: 'Test message',
      };

      await authenticatedRequest(app, testUserId)
        .post(`/api/chat/${testAgentId}`)
        .send(sendMessageDto)
        .expect(400);

      // Restore API credentials for other tests
      await createTestApiCredentials(prisma, testUserId, 'openai', 'encrypted-test-key');
    });

    it('should return 404 for non-existent agent', async () => {
      const sendMessageDto = {
        message: 'Test message',
      };

      await authenticatedRequest(app, testUserId)
        .post('/api/chat/99999')
        .send(sendMessageDto)
        .expect(404);
    });
  });

  describe('GET /api/chat/:agentId', () => {
    it('should return empty chat history when no session exists', async () => {
      const response = await authenticatedRequest(app, testUserId)
        .get(`/api/chat/${testAgentId}`)
        .expect(200);

      expect(response.body.messages).toEqual([]);
      expect(response.body.session).toBeNull();
      expect(response.body.agent.id).toBe(testAgentId);
    });

    it('should return chat history with messages', async () => {
      // Create a session and messages
      const session = await prisma.chatSession.create({
        data: {
          userId: testUserId,
          agentId: testAgentId,
        },
      });

      await prisma.message.createMany({
        data: [
          {
            sessionId: session.id,
            role: MessageRole.USER,
            content: 'User message',
          },
          {
            sessionId: session.id,
            role: MessageRole.ASSISTANT,
            content: 'Assistant response',
          },
        ],
      });

      const response = await authenticatedRequest(app, testUserId)
        .get(`/api/chat/${testAgentId}?sessionId=${session.id}`)
        .expect(200);

      expect(response.body.messages).toHaveLength(2);
      expect(response.body.session.id).toBe(session.id);
    });
  });

  describe('GET /api/chat/:agentId/sessions', () => {
    it('should return sessions for agent', async () => {
      // Create sessions
      const session1 = await prisma.chatSession.create({
        data: {
          userId: testUserId,
          agentId: testAgentId,
          sessionName: 'Session 1',
        },
      });

      const session2 = await prisma.chatSession.create({
        data: {
          userId: testUserId,
          agentId: testAgentId,
          sessionName: 'Session 2',
        },
      });

      const response = await authenticatedRequest(app, testUserId)
        .get(`/api/chat/${testAgentId}/sessions`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.map((s: { id: number }) => s.id)).toContain(
        session1.id
      );
      expect(response.body.map((s: { id: number }) => s.id)).toContain(
        session2.id
      );
    });
  });

  describe('POST /api/chat/:agentId/sessions', () => {
    it('should create a new session', async () => {
      const response = await authenticatedRequest(app, testUserId)
        .post(`/api/chat/${testAgentId}/sessions`)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.session_name).toBeDefined();
      expect(response.body.createdAt).toBeDefined();

      // Verify in database
      const session = await prisma.chatSession.findUnique({
        where: { id: response.body.id },
      });
      expect(session).toBeDefined();
      expect(session?.agentId).toBe(testAgentId);
    });
  });
});
