import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChatBotProps } from '../types/chat.types.js';
import SessionSidebar from './session/SessionSidebar.js';
import PageContainer from './ui/PageContainer.js';
import JsonModal from './ui/JsonModal.js';
import ChatHeader from './chat/ChatHeader';
import ChatMessages from './chat/ChatMessages';
import ChatInput from './chat/ChatInput';
import ChatPlaceholder from './chat/ChatPlaceholder';
import ChatLoadingState from './chat/ChatLoadingState';
import ChatEmptyState from './chat/ChatEmptyState';
import { useBots } from '../contexts/BotContext';
import { useSelectedBot } from '../contexts/AppContext';
import { useChatContext } from '../contexts/ChatContext';
import { ChatService } from '../services/chat.service';

function ChatBotContent({ botId: propBotId }: ChatBotProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { bots, loadingBots, getBotSessions, refreshBotSessions, addSessionToBot } = useBots();
  const { selectedBotId, setSelectedBotId } = useSelectedBot();
  const {
    messages,
    setMessages,
    currentBotId,
    currentSessionId,
    setCurrentSessionId,
    loadingMessages,
    loadingSession,
    loadChatHistory,
    sendMessage: sendMessageToContext,
  } = useChatContext();

  const [input, setInput] = useState('');
  const [jsonModal, setJsonModal] = useState<{
    isOpen: boolean;
    title: string;
    data: unknown;
  }>({ isOpen: false, title: '', data: null });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const actualBotId = propBotId || selectedBotId || (bots.length > 0 ? bots[0].id : null);
  // Get sessions for the current bot - these are already filtered by botId in BotContext
  const sessions = actualBotId ? getBotSessions(actualBotId) || [] : [];
  const sessionsLoading = loadingBots;

  // Show placeholder if bot changed or no session selected for current bot
  const botMismatch =
    actualBotId !== null && (currentBotId === null || currentBotId !== actualBotId);
  const noSessionForCurrentBot =
    actualBotId !== null &&
    currentBotId === actualBotId &&
    currentSessionId === null &&
    messages.length === 0;
  const showChatPlaceholder = botMismatch || noSessionForCurrentBot;

  // Track if we've initialized to avoid overriding stored values
  const initializedRef = useRef(false);
  const botsLoadedRef = useRef(false);

  // Use propBotId if provided, otherwise validate and use persisted selectedBotId, otherwise use first bot
  useEffect(() => {
    if (propBotId) {
      setSelectedBotId(propBotId);
      initializedRef.current = true;
      return;
    }

    if (!isSignedIn || !isLoaded || loadingBots || bots.length === 0) {
      return;
    }

    // Track when bots first load
    const botsJustLoaded = !botsLoadedRef.current;
    botsLoadedRef.current = true;

    // Only initialize once when bots first load
    if (!initializedRef.current && botsJustLoaded) {
      initializedRef.current = true;

      // Read current selectedBotId from context (loaded from localStorage)
      const currentSelectedBotId = selectedBotId;

      // If we have a stored selectedBotId, validate it first
      if (currentSelectedBotId !== null) {
        const botExists = bots.some((b) => b.id === currentSelectedBotId);
        if (botExists) {
          // Valid bot, keep it - don't override
          return;
        } else {
          // Invalid bot, clear it and select first bot
          setSelectedBotId(bots[0].id);
        }
      } else {
        // No stored bot, use first bot
        setSelectedBotId(bots[0].id);
      }
    }
  }, [propBotId, isSignedIn, isLoaded, loadingBots, bots, selectedBotId, setSelectedBotId]);

  // Separate effect to validate bot still exists (after initialization)
  useEffect(() => {
    if (initializedRef.current && !loadingBots && bots.length > 0 && selectedBotId !== null) {
      if (!bots.some((b) => b.id === selectedBotId)) {
        // Bot no longer exists, clear it
        setSelectedBotId(null);
      }
    }
  }, [loadingBots, bots, selectedBotId, setSelectedBotId]);

  // Track if we've validated session to avoid clearing valid stored sessions
  const sessionValidatedRef = useRef(false);

  // Validate selectedSessionId belongs to selectedBotId when sessions are available
  useEffect(() => {
    if (
      !loadingBots &&
      isSignedIn &&
      isLoaded &&
      selectedBotId !== null &&
      currentSessionId !== null
    ) {
      const botSessions = getBotSessions(selectedBotId) || [];

      // Only validate once sessions are loaded (not empty array)
      // Empty array might mean sessions haven't loaded yet
      if (botSessions.length > 0) {
        sessionValidatedRef.current = true;
        if (!botSessions.some((s) => s.id === currentSessionId)) {
          // Session doesn't belong to selected bot, clear it
          setCurrentSessionId(null);
        }
      } else if (sessionValidatedRef.current) {
        // Sessions were loaded before but now empty - might have been deleted
        // Only clear if we've validated before (sessions were loaded)
        setCurrentSessionId(null);
      }
    }
  }, [
    loadingBots,
    isSignedIn,
    isLoaded,
    selectedBotId,
    currentSessionId,
    getBotSessions,
    setCurrentSessionId,
  ]);

  // Track the last loaded bot/session combination to avoid unnecessary refetches
  const lastLoadedRef = useRef<{ botId: number | null; sessionId: number | null }>({
    botId: null,
    sessionId: null,
  });

  // When bot or session changes, handle accordingly
  useEffect(() => {
    if (actualBotId && isSignedIn && isLoaded && !loadingBots) {
      const botChanged = currentBotId !== null && currentBotId !== actualBotId;
      const sessionChanged = lastLoadedRef.current.sessionId !== currentSessionId;
      const botChangedFromLastLoad = lastLoadedRef.current.botId !== actualBotId;

      // If bot changed, clear session and messages immediately
      if (botChanged) {
        setCurrentSessionId(null);
        setMessages([]);
        lastLoadedRef.current = { botId: null, sessionId: null };
        // Don't auto-load - wait for user to select a session
        return;
      }

      // Auto-load if we have a session for the current bot
      if (currentSessionId && actualBotId) {
        // Check if session belongs to this bot (sessions might not be loaded yet)
        const botSessions = getBotSessions(actualBotId) || [];

        // If sessions are loaded, validate the session belongs to the bot
        if (botSessions.length > 0) {
          const sessionBelongsToBot = botSessions.some((s) => s.id === currentSessionId);

          if (!sessionBelongsToBot) {
            // Session doesn't belong to this bot, clear it
            setCurrentSessionId(null);
            setMessages([]);
            lastLoadedRef.current = { botId: null, sessionId: null };
            return;
          }
        }

        // Check if we need to load:
        // 1. Bot or session changed from last load, OR
        // 2. No messages loaded and bot/session matches
        const needsLoad =
          botChangedFromLastLoad ||
          sessionChanged ||
          (messages.length === 0 && currentBotId === actualBotId);

        if (needsLoad && !loadingMessages) {
          // Update ref before loading to prevent duplicate loads
          lastLoadedRef.current = { botId: actualBotId, sessionId: currentSessionId };
          loadChatHistory(actualBotId, currentSessionId);
        } else if (!needsLoad && currentBotId === actualBotId) {
          // Bot/session matches and we have messages - preserve them
          // Update ref to track current state
          lastLoadedRef.current = { botId: actualBotId, sessionId: currentSessionId };
        }
      } else if (currentBotId === actualBotId && messages.length > 0) {
        // No session selected but we have messages for this bot - preserve them
        lastLoadedRef.current = { botId: actualBotId, sessionId: null };
      }
    }
  }, [
    actualBotId,
    isSignedIn,
    isLoaded,
    loadingBots,
    currentBotId,
    currentSessionId,
    messages.length,
    loadingMessages,
    loadChatHistory,
    setCurrentSessionId,
    setMessages,
    getBotSessions,
  ]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSessionSelect = async (sessionId: number) => {
    const perfStart = performance.now();
    console.log(
      `[Performance] handleSessionSelect START - sessionId: ${sessionId}, currentSessionId: ${currentSessionId}, actualBotId: ${actualBotId}`
    );

    if (sessionId === currentSessionId || !actualBotId) {
      console.log(`[Performance] handleSessionSelect SKIP - same session or no bot`);
      return;
    }

    const optimisticUpdateStart = performance.now();
    // Optimistically update session ID immediately for instant UI feedback
    setCurrentSessionId(sessionId);

    // Clear messages to show loading state
    setMessages([]);
    const optimisticUpdateTime = performance.now() - optimisticUpdateStart;
    console.log(`[Performance] handleSessionSelect optimistic update - ${optimisticUpdateTime}ms`);

    const loadStart = performance.now();
    // Load chat history
    await loadChatHistory(actualBotId, sessionId);
    const loadTime = performance.now() - loadStart;
    const totalTime = performance.now() - perfStart;
    console.log(
      `[Performance] handleSessionSelect COMPLETE - loadChatHistory: ${loadTime}ms, total: ${totalTime}ms`
    );
  };

  const handleNewSession = async () => {
    if (!actualBotId) return;
    try {
      const newSession = await ChatService.createSession(actualBotId);

      // Immediately add to list and highlight - ensure it's added to the correct bot
      addSessionToBot(actualBotId, newSession);
      setCurrentSessionId(newSession.id);
      setMessages([]);

      // Load chat history
      await loadChatHistory(actualBotId, newSession.id);
    } catch (error) {
      console.error('Error creating session:', error);
      // Revert on error
      setCurrentSessionId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !actualBotId) return;

    const message = input;
    setInput('');

    try {
      const result = await sendMessageToContext(
        actualBotId,
        message,
        currentSessionId || undefined
      );
      // If a new session was created, add it to BotContext and refresh sessions
      if (result.isNewSession && result.sessionId && actualBotId) {
        // Get session details from ChatService to add to BotContext
        try {
          const sessions = await ChatService.getSessions(actualBotId);
          const newSession = sessions.find((s) => s.id === result.sessionId);
          if (newSession) {
            addSessionToBot(actualBotId, newSession);
          } else {
            // Fallback: refresh all sessions
            await refreshBotSessions(actualBotId);
          }
        } catch (error) {
          // Fallback: refresh all sessions if we can't get the new session
          await refreshBotSessions(actualBotId);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const loading = loadingMessages || loadingSession;

  if (loadingBots) {
    return <ChatLoadingState />;
  }

  if (!actualBotId) {
    return <ChatEmptyState />;
  }

  return (
    <PageContainer>
      <div className="flex h-full">
        <SessionSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewSession={handleNewSession}
          loading={sessionsLoading}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatHeader />
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {showChatPlaceholder && !loadingMessages && !loadingSession ? (
              <ChatPlaceholder />
            ) : (
              <>
                <ChatMessages
                  messages={messages}
                  loading={loading || (loadingMessages && messages.length === 0)}
                  onShowJson={(title, data) => setJsonModal({ isOpen: true, title, data })}
                />
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          {!showChatPlaceholder && (
            <ChatInput
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
    </PageContainer>
  );
}

export default function ChatBot({ botId: propBotId }: ChatBotProps) {
  return <ChatBotContent botId={propBotId} />;
}
