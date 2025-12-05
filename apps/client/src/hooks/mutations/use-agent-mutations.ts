import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentService } from '../../services/agent/agent.service';
import { SessionService } from '../../services/chat/session/session.service';
import { MemoryService } from '../../services/memory/memory.service';
import { CreateAgentRequest, UpdateAgentRequest } from '../../types/chat.types';
import { queryKeys } from '../queries/query-keys';
import { useToast } from '../../contexts/ToastContext';
import { useTranslation, I18nNamespace } from '@openai/i18n';

export function useCreateAgent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return useMutation({
    mutationFn: (data: CreateAgentRequest) => AgentService.createAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.all });
      showToast(t('agents.createSuccess'), 'success');
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : null) || t('agents.createError');
      showToast(errorMessage, 'error');
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);

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
      showToast(t('agents.updateSuccess'), 'success');
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : null) || t('agents.updateError');
      showToast(errorMessage, 'error');
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return useMutation({
    mutationFn: (agentId: number) => AgentService.deleteAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.all });
      showToast(t('agents.deleteSuccess'), 'success');
    },
    onError: (error: unknown) => {
      const errorMessage =
        (error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : null) || t('agents.deleteError');
      showToast(errorMessage, 'error');
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return useMutation({
    mutationFn: (agentId: number) => SessionService.createSession(agentId),
    onSuccess: (_data, agentId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.sessions(agentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.sessions(agentId),
      });
      showToast(t('sessions.createSuccess'), 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || t('sessions.createError'), 'error');
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);

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
      showToast(t('sessions.updateSuccess'), 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || t('sessions.updateError'), 'error');
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);

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
      showToast(t('sessions.deleteSuccess'), 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || t('sessions.deleteError'), 'error');
    },
  });
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);

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
      showToast(t('memories.updateSuccess'), 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || t('memories.updateError'), 'error');
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);

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
      showToast(t('memories.deleteSuccess'), 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || t('memories.deleteError'), 'error');
    },
  });
}
