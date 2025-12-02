import { http, HttpResponse } from 'msw';

// Use full URL for MSW - it matches against the complete request URL
const API_BASE = 'http://localhost:3001';

// Mock data
export const mockAgents: Array<{
  id: number;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  createdAt: string;
}> = [
  {
    id: 1,
    name: 'Test Agent 1',
    description: 'Test Description 1',
    avatarUrl: null,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Test Agent 2',
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

export const mockSessions: Array<{
  id: number;
  session_name: string | null;
  agent_id: number;
}> = [
  {
    id: 1,
    session_name: 'Session 1',
    agent_id: 1,
  },
  {
    id: 2,
    session_name: 'Session 2',
    agent_id: 1,
  },
];

export const mockChatHistory = {
  agent: {
    id: 1,
    name: 'Test Agent',
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
  // Agents endpoints
  http.get(`${API_BASE}/api/agents`, () => {
    return HttpResponse.json(mockAgents);
  }),

  http.get(`${API_BASE}/api/agents/:agentId`, ({ params }) => {
    const agentId = Number(params.agentId);
    const agent = mockAgents.find((a) => a.id === agentId);
    if (!agent) {
      return HttpResponse.json({ message: 'Agent not found' }, { status: 404 });
    }
    return HttpResponse.json(agent);
  }),

  http.post(`${API_BASE}/api/agents`, async ({ request }) => {
    const body = await request.json() as { name: string; description?: string; configs?: unknown };
    const newAgent = {
      id: mockAgents.length + 1,
      name: body.name,
      description: body.description || null,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    } as typeof mockAgents[number];
    mockAgents.push(newAgent);
    return HttpResponse.json(newAgent, { status: 201 });
  }),

  http.put(`${API_BASE}/api/agents/:agentId`, async ({ params, request }) => {
    const agentId = Number(params.agentId);
    const agentIndex = mockAgents.findIndex((a) => a.id === agentId);
    if (agentIndex === -1) {
      return HttpResponse.json({ message: 'Agent not found' }, { status: 404 });
    }
    const body = await request.json() as Partial<typeof mockAgents[0]>;
    const updatedAgent = { ...mockAgents[agentIndex], ...body };
    mockAgents[agentIndex] = updatedAgent;
    return HttpResponse.json(updatedAgent);
  }),

  http.delete(`${API_BASE}/api/agents/:agentId`, ({ params }) => {
    const agentId = Number(params.agentId);
    const agentIndex = mockAgents.findIndex((a) => a.id === agentId);
    if (agentIndex === -1) {
      return HttpResponse.json({ message: 'Agent not found' }, { status: 404 });
    }
    mockAgents.splice(agentIndex, 1);
    return HttpResponse.json({ success: true });
  }),

  // Agent memories endpoints
  http.get(`${API_BASE}/api/agents/:agentId/memories`, () => {
    return HttpResponse.json([]);
  }),

  http.get(`${API_BASE}/api/agents/:agentId/memories/:memoryId`, () => {
    return HttpResponse.json({
      id: 1,
      agentId: 1,
      keyPoint: 'Test memory',
      createdAt: new Date().toISOString(),
    });
  }),

  http.put(`${API_BASE}/api/agents/:agentId/memories/:memoryId`, async ({ request }) => {
    const body = await request.json() as { keyPoint: string };
    return HttpResponse.json({
      id: 1,
      agentId: 1,
      keyPoint: body.keyPoint,
      createdAt: new Date().toISOString(),
    });
  }),

  http.delete(`${API_BASE}/api/agents/:agentId/memories/:memoryId`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.post(`${API_BASE}/api/agents/:agentId/memories/summarize`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Chat endpoints
  http.get(`${API_BASE}/api/chat/:agentId`, ({ params, request }) => {
    const agentId = Number(params.agentId);
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    const agent = mockAgents.find((a) => a.id === agentId);
    if (!agent) {
      return HttpResponse.json({ message: 'Agent not found' }, { status: 404 });
    }

    const session = sessionId
      ? mockSessions.find((s) => s.id === Number(sessionId))
      : mockSessions[0];

    return HttpResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
      },
      session: session || null,
      messages: [],
    });
  }),

  http.post(`${API_BASE}/api/chat/:agentId`, async ({ params, request }) => {
    const agentId = Number(params.agentId);
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    await request.json() as { message: string }; // Validate request body

    const agent = mockAgents.find((a) => a.id === agentId);
    if (!agent) {
      return HttpResponse.json({ message: 'Agent not found' }, { status: 404 });
    }

    return HttpResponse.json({
      ...mockSendMessageResponse,
      session: {
        id: sessionId ? Number(sessionId) : 1,
        session_name: 'Session 1',
      },
    });
  }),

  http.get(`${API_BASE}/api/chat/:agentId/sessions`, ({ params }) => {
    const agentId = Number(params.agentId);
    const agentSessions = mockSessions.filter((s) => s.agent_id === agentId);
    return HttpResponse.json(agentSessions);
  }),

  http.post(`${API_BASE}/api/chat/:agentId/sessions`, ({ params }) => {
    const agentId = Number(params.agentId);
    const newSession = {
      id: mockSessions.length + 1,
      session_name: null,
      agent_id: agentId,
    } as typeof mockSessions[number];
    mockSessions.push(newSession);
    return HttpResponse.json(newSession, { status: 201 });
  }),

  http.put(`${API_BASE}/api/chat/:agentId/sessions/:sessionId`, async ({ params, request }) => {
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

  http.delete(`${API_BASE}/api/chat/:agentId/sessions/:sessionId`, ({ params }) => {
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
    await request.json() as { apiKey: string }; // Validate request body
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
