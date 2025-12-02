import { http, HttpResponse } from 'msw';

// Use full URL for MSW - it matches against the complete request URL
const API_BASE = 'http://localhost:3001';

// Mock data
export const mockBots = [
  {
    id: 1,
    name: 'Test Bot 1',
    description: 'Test Description 1',
    avatarUrl: null,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Test Bot 2',
    description: 'Test Description 2',
    avatarUrl: null,
    createdAt: '2024-01-02T00:00:00.000Z',
  },
];

export const mockUser = {
  id: 'user_123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  imageUrl: null,
};

export const mockSessions = [
  {
    id: 1,
    session_name: 'Session 1',
    bot_id: 1,
  },
  {
    id: 2,
    session_name: 'Session 2',
    bot_id: 1,
  },
];

export const mockChatHistory = {
  bot: {
    id: 1,
    name: 'Test Bot',
    description: 'Test Description',
  },
  session: {
    id: 1,
    session_name: 'Session 1',
  },
  messages: [],
};

export const mockSendMessageResponse = {
  response: 'Hello! How can I help you?',
  session: {
    id: 1,
    session_name: 'Session 1',
  },
  userMessageId: 1,
  assistantMessageId: 2,
};

// MSW Handlers
// Note: MSW matches against the full URL including baseURL, so we use the full URL here
export const handlers = [
  // Bots endpoints
  http.get(`${API_BASE}/api/bots`, () => {
    return HttpResponse.json(mockBots);
  }),

  http.get(`${API_BASE}/api/bots/:botId`, ({ params }) => {
    const botId = Number(params.botId);
    const bot = mockBots.find((b) => b.id === botId);
    if (!bot) {
      return HttpResponse.json({ message: 'Bot not found' }, { status: 404 });
    }
    return HttpResponse.json(bot);
  }),

  http.post(`${API_BASE}/api/bots`, async ({ request }) => {
    const body = await request.json() as { name: string; description?: string; configs?: unknown };
    const newBot = {
      id: mockBots.length + 1,
      name: body.name,
      description: body.description || null,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };
    mockBots.push(newBot);
    return HttpResponse.json(newBot, { status: 201 });
  }),

  http.put(`${API_BASE}/api/bots/:botId`, async ({ params, request }) => {
    const botId = Number(params.botId);
    const botIndex = mockBots.findIndex((b) => b.id === botId);
    if (botIndex === -1) {
      return HttpResponse.json({ message: 'Bot not found' }, { status: 404 });
    }
    const body = await request.json() as Partial<typeof mockBots[0]>;
    const updatedBot = { ...mockBots[botIndex], ...body };
    mockBots[botIndex] = updatedBot;
    return HttpResponse.json(updatedBot);
  }),

  http.delete(`${API_BASE}/api/bots/:botId`, ({ params }) => {
    const botId = Number(params.botId);
    const botIndex = mockBots.findIndex((b) => b.id === botId);
    if (botIndex === -1) {
      return HttpResponse.json({ message: 'Bot not found' }, { status: 404 });
    }
    mockBots.splice(botIndex, 1);
    return HttpResponse.json({ success: true });
  }),

  // Bot memories endpoints
  http.get(`${API_BASE}/api/bots/:botId/memories`, () => {
    return HttpResponse.json([]);
  }),

  http.get(`${API_BASE}/api/bots/:botId/memories/:memoryId`, () => {
    return HttpResponse.json({
      id: 1,
      botId: 1,
      keyPoint: 'Test memory',
      createdAt: new Date().toISOString(),
    });
  }),

  http.put(`${API_BASE}/api/bots/:botId/memories/:memoryId`, async ({ request }) => {
    const body = await request.json() as { keyPoint: string };
    return HttpResponse.json({
      id: 1,
      botId: 1,
      keyPoint: body.keyPoint,
      createdAt: new Date().toISOString(),
    });
  }),

  http.delete(`${API_BASE}/api/bots/:botId/memories/:memoryId`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.post(`${API_BASE}/api/bots/:botId/memories/summarize`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Chat endpoints
  http.get(`${API_BASE}/api/chat/:botId`, ({ params, request }) => {
    const botId = Number(params.botId);
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    const bot = mockBots.find((b) => b.id === botId);
    if (!bot) {
      return HttpResponse.json({ message: 'Bot not found' }, { status: 404 });
    }

    const session = sessionId
      ? mockSessions.find((s) => s.id === Number(sessionId))
      : mockSessions[0];

    return HttpResponse.json({
      bot: {
        id: bot.id,
        name: bot.name,
        description: bot.description,
      },
      session: session || null,
      messages: [],
    });
  }),

  http.post(`${API_BASE}/api/chat/:botId`, async ({ params, request }) => {
    const botId = Number(params.botId);
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const body = await request.json() as { message: string };

    const bot = mockBots.find((b) => b.id === botId);
    if (!bot) {
      return HttpResponse.json({ message: 'Bot not found' }, { status: 404 });
    }

    return HttpResponse.json({
      ...mockSendMessageResponse,
      session: {
        id: sessionId ? Number(sessionId) : 1,
        session_name: 'Session 1',
      },
    });
  }),

  http.get(`${API_BASE}/api/chat/:botId/sessions`, ({ params }) => {
    const botId = Number(params.botId);
    const botSessions = mockSessions.filter((s) => s.bot_id === botId);
    return HttpResponse.json(botSessions);
  }),

  http.post(`${API_BASE}/api/chat/:botId/sessions`, ({ params }) => {
    const botId = Number(params.botId);
    const newSession = {
      id: mockSessions.length + 1,
      session_name: null,
      bot_id: botId,
    };
    mockSessions.push(newSession);
    return HttpResponse.json(newSession, { status: 201 });
  }),

  http.put(`${API_BASE}/api/chat/:botId/sessions/:sessionId`, async ({ params, request }) => {
    const sessionId = Number(params.sessionId);
    const sessionIndex = mockSessions.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1) {
      return HttpResponse.json({ message: 'Session not found' }, { status: 404 });
    }
    const body = await request.json() as { session_name?: string };
    const updatedSession = { ...mockSessions[sessionIndex], ...body };
    mockSessions[sessionIndex] = updatedSession;
    return HttpResponse.json(updatedSession);
  }),

  http.delete(`${API_BASE}/api/chat/:botId/sessions/:sessionId`, ({ params }) => {
    const sessionId = Number(params.sessionId);
    const sessionIndex = mockSessions.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1) {
      return HttpResponse.json({ message: 'Session not found' }, { status: 404 });
    }
    mockSessions.splice(sessionIndex, 1);
    return HttpResponse.json({ success: true });
  }),

  // User endpoints
  http.get(`${API_BASE}/api/user/me`, () => {
    return HttpResponse.json(mockUser);
  }),

  // API Credentials endpoints
  http.get(`${API_BASE}/api/api-credentials/openai/check`, () => {
    return HttpResponse.json({ hasKey: true });
  }),

  http.post(`${API_BASE}/api/api-credentials/openai`, async ({ request }) => {
    const body = await request.json() as { apiKey: string };
    // In a real scenario, this would store the API key
    return HttpResponse.json({ success: true });
  }),

  http.delete(`${API_BASE}/api/api-credentials/openai`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Message translation endpoints
  http.get(`${API_BASE}/api/messages/:messageId/translate`, () => {
    return HttpResponse.json({
      translation: 'Translated text',
    });
  }),

  http.get(`${API_BASE}/api/messages/:messageId/translate-with-words`, () => {
    return HttpResponse.json({
      translation: 'Translated text',
      wordTranslations: [],
    });
  }),

  http.get(`${API_BASE}/api/messages/:messageId/word-translations`, () => {
    return HttpResponse.json([]);
  }),

  http.get(`${API_BASE}/api/messages/translations`, ({ request }) => {
    const url = new URL(request.url);
    const messageIds = url.searchParams.get('messageIds')?.split(',') || [];
    return HttpResponse.json(
      messageIds.map((id) => ({
        messageId: Number(id),
        translation: 'Translated text',
      }))
    );
  }),
];
