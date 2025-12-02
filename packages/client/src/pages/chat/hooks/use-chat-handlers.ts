import { useQueryClient } from '@tanstack/react-query';
import { useConfirm } from '../../../../hooks/useConfirm';
import { queryKeys } from '../../../../hooks/queries/query-keys.js';
import { Session } from '../../../../types/chat.types.js';

interface UseChatHandlersOptions {
  botId: number | null;
  sessions: Session[];
  handleSessionSelect: (sessionId: number) => Promise<void>;
  handleNewSession: () => Promise<void>;
  handleSessionDelete: (sessionId: number, onConfirm?: () => Promise<boolean>) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<unknown[]>>;
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
  botId,
  sessions,
  handleSessionSelect,
  handleNewSession,
  handleSessionDelete,
  setMessages,
}: UseChatHandlersOptions): UseChatHandlersReturn {
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  const handleSessionSelectWrapper = async (sessionId: number) => {
    await handleSessionSelect(sessionId);
    setMessages([]);
  };

  const handleNewSessionWrapper = async () => {
    await handleNewSession();
    setMessages([]);
  };

  const handleSessionDeleteWrapper = async (sessionId: number) => {
    const sessionToDelete = sessions.find((s) => s.id === sessionId);
    const sessionName = sessionToDelete?.session_name || `Session ${new Date(sessionToDelete?.createdAt || Date.now()).toLocaleDateString()}`;

    const confirmed = await confirm({
      title: 'Delete Session',
      message: `Are you sure you want to delete "${sessionName}"? This will permanently delete the session and all its messages.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    if (confirmed) {
      await handleSessionDelete(sessionId, async () => Promise.resolve(confirmed));
    }
  };

  const handleSessionNameSave = async (name?: string) => {
    // Session name is updated by the mutation hook in SessionNameModal
    // Just refresh sessions (name parameter is provided by SessionNameModal but not needed here)
    if (botId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.sessions(botId) });
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
