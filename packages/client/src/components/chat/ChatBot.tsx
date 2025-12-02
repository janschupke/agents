import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatBotProps, Message, MessageRole } from '../../types/chat.types.js';
import { useSelectedBot } from '../../contexts/AppContext';
import { NUMERIC_CONSTANTS } from '../../constants/numeric.constants.js';
import { useConfirm } from '../../hooks/useConfirm';
import { useBots } from '../../hooks/queries/use-bots.js';
import { useBotSessions } from '../../hooks/queries/use-bots.js';
import { useChatHistory } from '../../hooks/queries/use-chat.ts';
import { useSendMessage } from '../../hooks/mutations/use-chat-mutations.js';
import { useCreateSession, useDeleteSession } from '../../hooks/mutations/use-bot-mutations.js';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../hooks/queries/query-keys.js';
import SessionSidebar from '../session/SessionSidebar.js';
import SessionNameModal from '../session/SessionNameModal.js';
import PageContainer from '../ui/PageContainer.js';
import JsonModal from '../ui/JsonModal.js';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput, { ChatInputRef } from './ChatInput';
import ChatPlaceholder from './ChatPlaceholder';
import ChatLoadingState from './ChatLoadingState';
import ChatEmptyState from './ChatEmptyState';
import LoadingWrapper from '../ui/LoadingWrapper.js';

function ChatBotContent({ botId: propBotId }: ChatBotProps) {
  const { selectedBotId, setSelectedBotId } = useSelectedBot();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  
  const { data: bots = [], isLoading: loadingBots } = useBots();
  const actualBotId = propBotId || selectedBotId || (bots.length > 0 ? bots[0].id : null);
  const { data: sessions = [], isLoading: sessionsLoading } = useBotSessions(actualBotId);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const { data: chatHistory, isLoading: loadingChatHistory } = useChatHistory(
    actualBotId,
    currentSessionId
  );
  
  const sendMessageMutation = useSendMessage();
  const createSessionMutation = useCreateSession();
  const deleteSessionMutation = useDeleteSession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [jsonModal, setJsonModal] = useState<{
    isOpen: boolean;
    title: string;
    data: unknown;
  }>({ isOpen: false, title: '', data: null });
  const [sessionNameModal, setSessionNameModal] = useState<{
    isOpen: boolean;
    sessionId: number | null;
  }>({ isOpen: false, sessionId: null });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const isInitialLoadRef = useRef(true);
  const previousMessageCountRef = useRef(0);

  // Initialize bot selection
  useEffect(() => {
    if (propBotId) {
      setSelectedBotId(propBotId);
      return;
    }

    if (!loadingBots && bots.length > 0 && !selectedBotId) {
      setSelectedBotId(bots[0].id);
    }
  }, [propBotId, loadingBots, bots, selectedBotId, setSelectedBotId]);

  // Auto-select first session when bot changes
  useEffect(() => {
    if (actualBotId && !sessionsLoading && sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    } else if (actualBotId && !sessionsLoading && sessions.length === 0) {
      setCurrentSessionId(null);
      setMessages([]);
    }
  }, [actualBotId, sessionsLoading, sessions, currentSessionId]);

  // Load chat history when session changes
  useEffect(() => {
    if (actualBotId && currentSessionId && currentSessionId > 0) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.chat.history(actualBotId, currentSessionId),
      });
    }
  }, [actualBotId, currentSessionId, queryClient]);

  // Update messages from chat history
  useEffect(() => {
    if (chatHistory && actualBotId && currentSessionId) {
      const historySessionId = chatHistory.session?.id;
      if (historySessionId === currentSessionId && chatHistory.messages) {
        setMessages(chatHistory.messages);
      }
    } else if (!currentSessionId) {
      setMessages([]);
    }
  }, [chatHistory, actualBotId, currentSessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    const messageCount = messages.length;
    const isNewMessage = messageCount > previousMessageCountRef.current;
    
    if (isInitialLoadRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      isInitialLoadRef.current = false;
    } else if (isNewMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    
    previousMessageCountRef.current = messageCount;
  }, [messages]);
  
  // Reset initial load flag when session changes
  useEffect(() => {
    isInitialLoadRef.current = true;
    previousMessageCountRef.current = 0;
  }, [currentSessionId]);

  // Show placeholder if bot changed or no session selected for current bot
  const botMismatch = actualBotId !== null && currentSessionId === null;
  const noSessionForCurrentBot = actualBotId !== null && currentSessionId === null && messages.length === 0;
  const showChatPlaceholder = botMismatch || noSessionForCurrentBot;

  // Focus chat input when session changes
  useEffect(() => {
    if (currentSessionId && !loadingChatHistory && !showChatPlaceholder) {
      const timer = setTimeout(() => {
        chatInputRef.current?.focus();
      }, NUMERIC_CONSTANTS.UI_DEBOUNCE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [currentSessionId, loadingChatHistory, showChatPlaceholder]);

  const handleSessionSelect = useCallback(
    async (sessionId: number) => {
      if (sessionId === currentSessionId || !actualBotId) {
        return;
      }

      // Optimistically update session ID immediately
      setCurrentSessionId(sessionId);
      setMessages([]);

      // Load chat history
      const history = await queryClient.fetchQuery({
        queryKey: queryKeys.chat.history(actualBotId, sessionId),
        queryFn: async () => {
          const { ChatService } = await import('../../services/chat.service.js');
          return ChatService.getChatHistory(actualBotId, sessionId);
        },
      });
      if (history && 'messages' in history) {
        setMessages(history.messages || []);
      }
    },
    [actualBotId, currentSessionId, queryClient]
  );

  const handleNewSession = useCallback(async () => {
    if (!actualBotId) return;
    
    try {
      const newSession = await createSessionMutation.mutateAsync(actualBotId);
      // Select the new session
      setCurrentSessionId(newSession.id);
      setMessages([]);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  }, [actualBotId, createSessionMutation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !actualBotId) return;

    const message = input;
    setInput('');

    // Optimistically add user message
    const userMessage: Message = {
      role: MessageRole.USER,
      content: message,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await sendMessageMutation.mutateAsync({
        botId: actualBotId,
        message,
        sessionId: currentSessionId || undefined,
      });

      // Update messages with assistant response
      const assistantMessage: Message = {
        role: MessageRole.ASSISTANT,
        content: result.response,
        rawResponse: result.rawResponse,
        id: result.assistantMessageId,
      };

      setMessages((prev) => {
        // Update last user message with ID if available
        const updated = [...prev];
        const lastUserIndex = updated.length - 2;
        if (lastUserIndex >= 0 && updated[lastUserIndex]?.role === MessageRole.USER) {
          updated[lastUserIndex] = {
            ...updated[lastUserIndex],
            id: result.userMessageId ?? updated[lastUserIndex].id,
            rawRequest: result.rawRequest,
          };
        }
        return [...updated, assistantMessage];
      });

      // If new session was created, update session ID
      if (result.session?.id && result.session.id !== currentSessionId) {
        setCurrentSessionId(result.session.id);
      }
    } catch (error) {
      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
      console.error('Failed to send message:', error);
    }
  };

  const handleSessionEdit = (sessionId: number) => {
    setSessionNameModal({ isOpen: true, sessionId });
  };

  const handleSessionNameSave = async (_name: string) => {
    // Session name is updated by the mutation hook in SessionNameModal
    // Just refresh sessions
    if (actualBotId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.sessions(actualBotId) });
    }
  };

  const handleSessionDelete = async (sessionId: number) => {
    if (!actualBotId) return;

    const sessionToDelete = sessions.find((s) => s.id === sessionId);
    const sessionName = sessionToDelete?.session_name || `Session ${new Date(sessionToDelete?.createdAt || Date.now()).toLocaleDateString()}`;

    const confirmed = await confirm({
      title: 'Delete Session',
      message: `Are you sure you want to delete "${sessionName}"? This will permanently delete the session and all its messages.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    const wasCurrentSession = currentSessionId === sessionId;

    try {
      await deleteSessionMutation.mutateAsync({ botId: actualBotId, sessionId });

      // Select first session if we deleted the current one
      if (wasCurrentSession) {
        const remainingSessions = sessions.filter((s) => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          await handleSessionSelect(remainingSessions[0].id);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  // Show loading state
  const loading = loadingChatHistory || sendMessageMutation.isPending || createSessionMutation.isPending;

  if (loadingBots) {
    return <ChatLoadingState />;
  }

  if (!actualBotId) {
    return <ChatEmptyState />;
  }

  return (
    <PageContainer>
      <div className="flex h-full">
        <LoadingWrapper isLoading={sessionsLoading} loadingText="Loading sessions...">
          <SessionSidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSessionSelect={handleSessionSelect}
            onNewSession={handleNewSession}
            onSessionDelete={handleSessionDelete}
            onSessionEdit={handleSessionEdit}
            loading={sessionsLoading}
          />
        </LoadingWrapper>
        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatHeader />
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative">
            {showChatPlaceholder && !loadingChatHistory ? (
              <ChatPlaceholder />
            ) : (
              <>
                <ChatMessages
                  key={currentSessionId || 'no-session'}
                  messages={messages}
                  loading={loading || (loadingChatHistory && messages.length === 0)}
                  onShowJson={(title, data) => setJsonModal({ isOpen: true, title, data })}
                  sessionId={currentSessionId}
                />
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          {!showChatPlaceholder && (
            <ChatInput
              ref={chatInputRef}
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              disabled={loading}
            />
          )}
        </div>
      </div>
      <JsonModal
        isOpen={jsonModal.isOpen}
        onClose={() => setJsonModal({ isOpen: false, title: '', data: null })}
        title={jsonModal.title}
        data={jsonModal.data}
      />
      {sessionNameModal.sessionId && actualBotId && (
        <SessionNameModal
          isOpen={sessionNameModal.isOpen}
          onClose={() => setSessionNameModal({ isOpen: false, sessionId: null })}
          currentName={
            sessions.find((s) => s.id === sessionNameModal.sessionId)?.session_name || null
          }
          onSave={handleSessionNameSave}
          botId={actualBotId}
          sessionId={sessionNameModal.sessionId}
        />
      )}
      {ConfirmDialog}
    </PageContainer>
  );
}

export default function ChatBot({ botId: propBotId }: ChatBotProps) {
  return <ChatBotContent botId={propBotId} />;
}
