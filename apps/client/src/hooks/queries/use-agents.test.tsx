import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestQueryProvider } from '../../test/utils/test-query-provider';
import {
  useAgents,
  useAgent,
  useAgentSessions,
  useAgentMemories,
} from './use-agents';
import { AgentService } from '../../services/agent/agent.service';
import { SessionService } from '../../services/chat/session/session.service';
import { MemoryService } from '../../services/memory/memory.service';
import { createMockAgent } from '../../test/utils/mock-factories';

// Mock AuthContext
const mockAuth = {
  isSignedIn: true,
  isLoaded: true,
};
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

// Mock useTokenReady
vi.mock('../use-token-ready', () => ({
  useTokenReady: () => true,
}));

// Mock services
vi.mock('../../services/agent/agent.service');
vi.mock('../../services/chat/session/session.service');
vi.mock('../../services/memory/memory.service');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('use-agents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAgents', () => {
    it('should fetch all agents when signed in and loaded', async () => {
      const mockAgents = [
        createMockAgent({
          id: 1,
          name: 'Agent 1',
          description: 'Description 1',
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
        createMockAgent({
          id: 2,
          name: 'Agent 2',
          description: 'Description 2',
          createdAt: '2024-01-02T00:00:00.000Z',
        }),
      ];

      vi.mocked(AgentService.getAllAgents).mockResolvedValue(mockAgents);

      const { result } = renderHook(() => useAgents(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAgents);
    });

    it('should not fetch when not signed in', () => {
      mockAuth.isSignedIn = false;
      mockAuth.isLoaded = true;

      const { result } = renderHook(() => useAgents(), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(AgentService.getAllAgents).not.toHaveBeenCalled();
    });

    it('should not fetch when not loaded', () => {
      mockAuth.isSignedIn = true;
      mockAuth.isLoaded = false;

      const { result } = renderHook(() => useAgents(), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(AgentService.getAllAgents).not.toHaveBeenCalled();
    });
  });

  describe('useAgent', () => {
    it('should fetch agent by ID when signed in and loaded', async () => {
      mockAuth.isSignedIn = true;
      mockAuth.isLoaded = true;

      const mockAgent = createMockAgent({
        id: 1,
        name: 'Agent 1',
        description: 'Description 1',
        createdAt: '2024-01-01T00:00:00.000Z',
      });

      vi.mocked(AgentService.getAgent).mockResolvedValue(mockAgent);

      const { result } = renderHook(() => useAgent(1), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAgent);
    });

    it('should not fetch when agentId is null', () => {
      const { result } = renderHook(() => useAgent(null), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(AgentService.getAgent).not.toHaveBeenCalled();
    });
  });

  describe('useAgentSessions', () => {
    it('should fetch agent sessions when signed in and loaded', async () => {
      mockAuth.isSignedIn = true;
      mockAuth.isLoaded = true;

      const mockSessions = [
        {
          id: 1,
          session_name: 'Session 1',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          session_name: 'Session 2',
          createdAt: '2024-01-02T00:00:00.000Z',
        },
      ];

      vi.mocked(SessionService.getSessions).mockResolvedValue(mockSessions);

      const { result } = renderHook(() => useAgentSessions(1), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSessions);
    });

    it('should not fetch when agentId is null', () => {
      const { result } = renderHook(() => useAgentSessions(null), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(SessionService.getSessions).not.toHaveBeenCalled();
    });
  });

  describe('useAgentMemories', () => {
    it('should fetch agent memories when signed in and loaded', async () => {
      mockAuth.isSignedIn = true;
      mockAuth.isLoaded = true;

      const mockMemories = [
        {
          id: 1,
          agentId: 1,
          userId: 'user_123',
          keyPoint: 'Memory 1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(MemoryService.getMemories).mockResolvedValue(mockMemories);

      const { result } = renderHook(() => useAgentMemories(1), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMemories);
    });

    it('should not fetch when agentId is null', () => {
      const { result } = renderHook(() => useAgentMemories(null), { wrapper });

      expect(result.current.isFetching).toBe(false);
      expect(MemoryService.getMemories).not.toHaveBeenCalled();
    });
  });
});
