import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BotService } from '../../services/bot.service.js';
import { ChatService } from '../../services/chat.service.js';
import { MemoryService } from '../../services/memory.service.js';
import { CreateBotRequest, UpdateBotRequest } from '../../types/chat.types.js';
import { queryKeys } from '../queries/query-keys.js';
import { useToast } from '../../contexts/ToastContext.js';

export function useCreateBot() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateBotRequest) => BotService.createBot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
      showToast('Bot created successfully', 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || 'Failed to create bot', 'error');
    },
  });
}

export function useUpdateBot() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ botId, data }: { botId: number; data: UpdateBotRequest }) =>
      BotService.updateBot(botId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.detail(data.id) });
      showToast('Bot updated successfully', 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || 'Failed to update bot', 'error');
    },
  });
}

export function useDeleteBot() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (botId: number) => BotService.deleteBot(botId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
      showToast('Bot deleted successfully', 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || 'Failed to delete bot', 'error');
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (botId: number) => ChatService.createSession(botId),
    onSuccess: (_data, botId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.sessions(botId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.sessions(botId) });
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
      botId,
      sessionId,
      sessionName,
    }: {
      botId: number;
      sessionId: number;
      sessionName?: string;
    }) => ChatService.updateSession(botId, sessionId, sessionName),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.sessions(variables.botId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.sessions(variables.botId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.history(variables.botId, variables.sessionId) });
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
    mutationFn: ({ botId, sessionId }: { botId: number; sessionId: number }) =>
      ChatService.deleteSession(botId, sessionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.sessions(variables.botId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.sessions(variables.botId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.history(variables.botId, variables.sessionId) });
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
      botId,
      memoryId,
      keyPoint,
    }: {
      botId: number;
      memoryId: number;
      keyPoint: string;
    }) => MemoryService.updateMemory(botId, memoryId, keyPoint),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.memories(variables.botId) });
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
    mutationFn: ({ botId, memoryId }: { botId: number; memoryId: number }) =>
      MemoryService.deleteMemory(botId, memoryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.memories(variables.botId) });
      showToast('Memory deleted successfully', 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || 'Failed to delete memory', 'error');
    },
  });
}

export function useSummarizeMemories() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (botId: number) => MemoryService.summarizeMemories(botId),
    onSuccess: (_, botId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.memories(botId) });
      showToast('Memories summarized successfully', 'success');
    },
    onError: (error: { message?: string }) => {
      showToast(error.message || 'Failed to summarize memories', 'error');
    },
  });
}
