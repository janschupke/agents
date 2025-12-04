import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestQueryProvider } from '../../test/utils/test-query-provider';
import {
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
  useUpdateMemory,
  useDeleteMemory,
} from './use-agent-mutations';
import { AgentService } from '../../services/agent/agent.service';
import { MemoryService } from '../../services/memory/memory.service';

// Mock ToastContext
const mockShowToast = vi.fn();
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock services
vi.mock('../../services/agent/agent.service');
vi.mock('../../services/memory/memory.service');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TestQueryProvider>{children}</TestQueryProvider>
);

describe('use-agent-mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCreateAgent', () => {
    it('should create agent and show success toast', async () => {
      const mockAgent = {
        id: 1,
        name: 'New Agent',
        description: 'New Description',
        avatarUrl: null,
        agentType: null,
        language: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(AgentService.createAgent).mockResolvedValue(mockAgent);

      const { result } = renderHook(() => useCreateAgent(), { wrapper });

      await result.current.mutateAsync({
        name: 'New Agent',
        description: 'New Description',
      });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Agent created successfully',
          'success'
        );
      });
    });

    it('should show error toast on failure', async () => {
      const error = { message: 'Failed to create agent' };
      vi.mocked(AgentService.createAgent).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateAgent(), { wrapper });

      await expect(
        result.current.mutateAsync({
          name: 'New Agent',
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Failed to create agent',
          'error'
        );
      });
    });
  });

  describe('useUpdateAgent', () => {
    it('should update agent and show success toast', async () => {
      const mockAgent = {
        id: 1,
        name: 'Updated Agent',
        description: 'Updated Description',
        avatarUrl: null,
        agentType: null,
        language: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(AgentService.updateAgent).mockResolvedValue(mockAgent);

      const { result } = renderHook(() => useUpdateAgent(), { wrapper });

      await result.current.mutateAsync({
        agentId: 1,
        data: {
          name: 'Updated Agent',
          description: 'Updated Description',
        },
      });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Agent updated successfully',
          'success'
        );
      });
    });

    it('should show error toast on failure', async () => {
      const error = { message: 'Failed to update agent' };
      vi.mocked(AgentService.updateAgent).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateAgent(), { wrapper });

      await expect(
        result.current.mutateAsync({
          agentId: 1,
          data: { name: 'Updated Agent' },
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Failed to update agent',
          'error'
        );
      });
    });
  });

  describe('useDeleteAgent', () => {
    it('should delete agent and show success toast', async () => {
      vi.mocked(AgentService.deleteAgent).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteAgent(), { wrapper });

      await result.current.mutateAsync(1);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Agent deleted successfully',
          'success'
        );
      });
    });

    it('should show error toast on failure', async () => {
      const error = { message: 'Failed to delete agent' };
      vi.mocked(AgentService.deleteAgent).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteAgent(), { wrapper });

      await expect(result.current.mutateAsync(1)).rejects.toThrow();

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Failed to delete agent',
          'error'
        );
      });
    });
  });

  describe('useUpdateMemory', () => {
    it('should update memory and show success toast', async () => {
      const mockMemory = {
        id: 1,
        agentId: 1,
        userId: 'user_123',
        keyPoint: 'Updated memory',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(MemoryService.updateMemory).mockResolvedValue(mockMemory);

      const { result } = renderHook(() => useUpdateMemory(), { wrapper });

      await result.current.mutateAsync({
        agentId: 1,
        memoryId: 1,
        keyPoint: 'Updated memory',
      });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Memory updated successfully',
          'success'
        );
      });
    });

    it('should show error toast on failure', async () => {
      const error = { message: 'Failed to update memory' };
      vi.mocked(MemoryService.updateMemory).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateMemory(), { wrapper });

      await expect(
        result.current.mutateAsync({
          agentId: 1,
          memoryId: 1,
          keyPoint: 'Updated memory',
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Failed to update memory',
          'error'
        );
      });
    });
  });

  describe('useDeleteMemory', () => {
    it('should delete memory and show success toast', async () => {
      vi.mocked(MemoryService.deleteMemory).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteMemory(), { wrapper });

      await result.current.mutateAsync({
        agentId: 1,
        memoryId: 1,
      });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Memory deleted successfully',
          'success'
        );
      });
    });

    it('should show error toast on failure', async () => {
      const error = { message: 'Failed to delete memory' };
      vi.mocked(MemoryService.deleteMemory).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteMemory(), { wrapper });

      await expect(
        result.current.mutateAsync({
          agentId: 1,
          memoryId: 1,
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Failed to delete memory',
          'error'
        );
      });
    });
  });
});
