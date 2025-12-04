import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentService } from '../../services/agent/agent.service';
import { SessionService } from '../../services/chat/session/session.service';
import { MemoryService } from '../../services/memory/memory.service';
import { CreateAgentRequest, UpdateAgentRequest } from '../../types/chat.types';
import { queryKeys } from '../queries/query-keys';
import { useToast } from '../../contexts/ToastContext';

export function useCreateAgent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateAgentRequest) => AgentService.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.all });
      showToast('Agent created successfully', 'success');
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : null) || 'Failed to create agent';
      showToast(errorMessage, 'error');
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      agentId,
      data,
    }: {
      agentId: number;
      data: UpdateAgentRequest;
    }) => AgentService.updateAgent(agentId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.detail(data.id),
      });
      showToast('Agent updated successfully', 'success');
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : null) || 'Failed to update agent';
      showToast(errorMessage, 'error');
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (agentId: number) => AgentService.deleteAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.all });
      showToast('Agent deleted successfully', 'success');
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : null) || 'Failed to delete agent';
      showToast(errorMessage, 'error');
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (agentId: number) => SessionService.createSession(agentId),
    onSuccess: (_data, agentId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.sessions(agentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.sessions(agentId),
      });
      showToast('Session created successfully', 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || 'Failed to create session', 'error');
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      agentId,
      sessionId,
      sessionName,
    }: {
      agentId: number;
      sessionId: number;
      sessionName?: string;
    }) => SessionService.updateSession(agentId, sessionId, sessionName),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.sessions(variables.agentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.sessions(variables.agentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.history(
          variables.agentId,
          variables.sessionId
        ),
      });
      showToast('Session updated successfully', 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || 'Failed to update session', 'error');
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      agentId,
      sessionId,
    }: {
      agentId: number;
      sessionId: number;
    }) => SessionService.deleteSession(agentId, sessionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.sessions(variables.agentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.sessions(variables.agentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.history(
          variables.agentId,
          variables.sessionId
        ),
      });
      showToast('Session deleted successfully', 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || 'Failed to delete session', 'error');
    },
  });
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      agentId,
      memoryId,
      keyPoint,
    }: {
      agentId: number;
      memoryId: number;
      keyPoint: string;
    }) => MemoryService.updateMemory(agentId, memoryId, keyPoint),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.memories(variables.agentId),
      });
      showToast('Memory updated successfully', 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || 'Failed to update memory', 'error');
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({
      agentId,
      memoryId,
    }: {
      agentId: number;
      memoryId: number;
    }) => MemoryService.deleteMemory(agentId, memoryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.memories(variables.agentId),
      });
      showToast('Memory deleted successfully', 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || 'Failed to delete memory', 'error');
    },
  });
}
