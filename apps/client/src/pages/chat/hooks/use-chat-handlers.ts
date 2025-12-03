import { useQueryClient } from '@tanstack/react-query';
import { useConfirm } from '../../../hooks/useConfirm';
import { queryKeys } from '../../../hooks/queries/query-keys';
import {
  Session,
  Message,
  ChatHistoryResponse,
} from '../../../types/chat.types';
import { formatDate } from '@openai/utils';

interface UseChatHandlersOptions {
  agentId: number | null;
  sessions: Session[];
  handleSessionSelect: (
    sessionId: number
  ) => Promise<ChatHistoryResponse | undefined>;
  handleNewSession: () => Promise<Session | undefined>;
  handleSessionDelete: (
    sessionId: number,
    onConfirm?: () => Promise<boolean>
  ) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

interface UseChatHandlersReturn {
  handleSessionSelectWrapper: (sessionId: number) => Promise<void>;
  handleNewSessionWrapper: () => Promise<void>;
  handleSessionDeleteWrapper: (sessionId: number) => Promise<void>;
  handleSessionNameSave: (name?: string) => Promise<void>;
}

/**
 * Wraps session handlers with additional logic (confirmations, message clearing, etc.)
 */
export function useChatHandlers({
  agentId,
  sessions,
  handleSessionSelect,
  handleNewSession,
  handleSessionDelete,
  setMessages,
}: UseChatHandlersOptions): UseChatHandlersReturn {
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  const handleSessionSelectWrapper = async (sessionId: number) => {
    // Don't clear messages here - let useChatMessages handle it based on sessionId change
    // This prevents race conditions where messages are cleared but new ones haven't loaded yet
    await handleSessionSelect(sessionId);
  };

  const handleNewSessionWrapper = async () => {
    await handleNewSession();
    setMessages([]);
  };

  const handleSessionDeleteWrapper = async (sessionId: number) => {
    const sessionToDelete = sessions.find((s) => s.id === sessionId);
    const sessionName =
      sessionToDelete?.session_name ||
      `Session ${formatDate(sessionToDelete?.createdAt || new Date())}`;

    const confirmed = await confirm({
      title: 'Delete Session',
      message: `Are you sure you want to delete "${sessionName}"? This will permanently delete the session and all its messages.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      await handleSessionDelete(sessionId, async () =>
        Promise.resolve(confirmed)
      );
    }
  };

  const handleSessionNameSave = async (name?: string) => {
    // Session name is updated by the mutation hook in SessionNameModal
    // Just refresh sessions (name parameter is provided by SessionNameModal but not needed here)
    if (agentId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.sessions(agentId),
      });
    }
    // Suppress unused parameter warning
    void name;
  };

  return {
    handleSessionSelectWrapper,
    handleNewSessionWrapper,
    handleSessionDeleteWrapper,
    handleSessionNameSave,
  };
}
