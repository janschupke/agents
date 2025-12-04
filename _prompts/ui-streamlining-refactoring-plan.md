# UI Streamlining Refactoring Plan

## Overview

This refactoring plan outlines changes to streamline the chat UI by making sessions a backend implementation detail, simplifying routing, and improving the user experience with agent-focused navigation.

## Goals

- **Session infrastructure remains a backend implementation detail** - Frontend app only uses 1 session per agent
- **Simplified routing** - Route to `/chat/:agentId` only, session is determined automatically
- **URL-driven state** - Remove localStorage for selected agent/session, use URL as source of truth
- **Agent-focused UI** - Replace session sidebar with agent list sidebar
- **Improved performance** - Fix infinite load on long chats with pagination and infinite scroll

---

## Backend Changes

### 1. Auto-Create Session on Agent Creation

**File:** `apps/api/src/agent/agent.service.ts`

**Changes:**
- Modify `create()` method to automatically create a session when an agent is created
- Use `SessionRepository.create()` after agent creation
- Add logging for session creation

**Implementation:**
```typescript
async create(...) {
  // ... existing agent creation logic ...
  
  const agent = await this.agentRepository.create(...);
  
  // Auto-create initial session for the agent
  const session = await this.sessionRepository.create(
    userId,
    agent.id
  );
  this.logger.log(`Created initial session ${session.id} for agent ${agent.id}`);
  
  return { ...agentResponse };
}
```

**Dependencies:**
- Inject `SessionRepository` into `AgentService`
- Update `AgentModule` to ensure `SessionRepository` is available

**Files to modify:**
- `apps/api/src/agent/agent.service.ts`
- `apps/api/src/agent/agent.module.ts`

---

### 2. Simplify Chat History Endpoint

**File:** `apps/api/src/chat/chat.service.ts`

**Changes:**
- Modify `getChatHistory()` to always return the first session when no `sessionId` is provided
- If multiple sessions exist, return the first one found (most recent based on existing logic)
- Remove session creation logic from this endpoint (sessions are created on agent creation)

**Current behavior:**
- Returns latest session or empty if none exists

**New behavior:**
- Always returns first session (most recent) if agent has sessions
- Returns empty history if no sessions exist (shouldn't happen if auto-creation works)

**Implementation:**
```typescript
async getChatHistory(agentId: number, userId: string, sessionId?: number) {
  // ... existing agent validation ...
  
  let session;
  if (sessionId) {
    session = await this.validateSessionAccess(sessionId, agentId, userId);
  } else {
    // Always get first session (most recent) - don't create
    session = await this.sessionRepository.findLatestByAgentId(agentId, userId);
    if (!session) {
      // No session exists - return empty history
      return { agent: {...}, session: null, messages: [], savedWordMatches: [] };
    }
  }
  
  // ... rest of existing logic ...
}
```

**Files to modify:**
- `apps/api/src/chat/chat.service.ts`

---

## Frontend Changes

### 3. Simplify Routing

**File:** `apps/client/src/constants/routes.constants.ts`

**Changes:**
- Remove `CHAT_SESSION` route pattern
- Keep only `CHAT_AGENT` route: `/chat/:agentId`
- Update route helper functions

**Implementation:**
```typescript
export const ROUTES = {
  // ... other routes ...
  CHAT: '/chat',
  CHAT_AGENT: (agentId: number) => `/chat/${agentId}`,
  // Remove: CHAT_SESSION: (agentId: number, sessionId: number) => `/chat/${agentId}/${sessionId}`,
  
  // Route patterns
  CHAT_AGENT_PATTERN: '/chat/:agentId',
  // Remove: CHAT_SESSION_PATTERN: '/chat/:agentId/:sessionId',
} as const;
```

**Files to modify:**
- `apps/client/src/constants/routes.constants.ts`
- `apps/client/src/App.tsx` (router configuration)

---

### 4. Remove LocalStorage for Selected Agent/Session

**File:** `apps/client/src/utils/localStorage.ts`

**Changes:**
- Remove `SELECTED_AGENT_ID_CHAT` from storage keys
- Remove `getSelectedAgentIdChat()` and `setSelectedAgentIdChat()` methods
- Keep `SELECTED_AGENT_ID_CONFIG` for config page (if still needed)

**Files to modify:**
- `apps/client/src/utils/localStorage.ts`
- `apps/client/src/utils/localStorage.test.ts`

**Files to update (remove localStorage usage):**
- `apps/client/src/pages/chat/Chat.tsx`
- `apps/client/src/pages/chat/components/agent/AgentSelector/AgentSelector.tsx`
- Any other files that reference `LocalStorageManager.getSelectedAgentIdChat()` or `setSelectedAgentIdChat()`

---

### 5. Update Chat Page Routing Logic

**File:** `apps/client/src/pages/chat/Chat.tsx`

**Changes:**
- Simplify to only handle `/chat` and `/chat/:agentId` routes
- Remove sessionId from URL params
- Remove localStorage logic
- **If no agentId in URL, show user-friendly empty state - DO NOT redirect**
- Remove auto-redirect logic entirely

**New behavior:**
- `/chat` (no agentId) → Show chat page with empty sidebar (header with + button visible), "No chat selected" in content view, configure button disabled
- `/chat/:agentId` → Show chat for that agent (uses agent's first session automatically)
- `/chat` with no available agents → Still accessible via URL, shows empty sidebar with header + button, "No chat selected" in content, configure button disabled

**Implementation:**
```typescript
export default function Chat() {
  const { agentId: urlAgentId } = useParams<{ agentId?: string }>();
  const { data: agents = [], isLoading: loadingAgents } = useAgents();
  
  const parsedAgentId = urlAgentId
    ? isNaN(parseInt(urlAgentId, 10)) ? null : parseInt(urlAgentId, 10)
    : null;
  
  // Handle /chat route (no agentId) - show empty state, do not redirect
  if (!urlAgentId) {
    if (loadingAgents) {
      return <ChatLoadingState />;
    }
    // Show chat page with empty sidebar and "No chat selected" message
    return <ChatAgent agentId={null} />;
  }
  
  // Invalid agentId
  if (parsedAgentId === null) {
    return <Navigate to={ROUTES.CHAT} replace />;
  }
  
  // Handle /chat/:agentId route
  return <ChatAgent agentId={parsedAgentId} />;
}
```

**Files to modify:**
- `apps/client/src/pages/chat/Chat.tsx`
- `apps/client/src/pages/chat/hooks/use-chat-route.ts` (simplify or remove)

---

### 6. Create Agent Sidebar Component

**New File:** `apps/client/src/pages/chat/components/agent/AgentSidebar/AgentSidebar.tsx`

**Purpose:**
- Replace `SessionSidebar` with agent list
- Show list of agents with avatar + name
- Clicking agent changes active agent + conversation
- Header title: "Conversations"
- Plus button redirects to agent config (new agent creation)

**Implementation:**
```typescript
interface AgentSidebarProps {
  agents: Agent[];
  currentAgentId: number | null;
  onAgentSelect: (agentId: number) => void;
  onNewAgent: () => void;
  loading?: boolean;
}

export default function AgentSidebar({
  agents,
  currentAgentId,
  onAgentSelect,
  onNewAgent,
  loading = false,
}: AgentSidebarProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  
  return (
    <Sidebar>
      <SidebarHeader
        title={t('chat.conversations')}
        action={{
          icon: <IconPlus size="md" />,
          onClick: onNewAgent,
          disabled: loading,
          tooltip: t('chat.newAgent'),
        }}
      />
      <SidebarContent
        loading={loading}
        empty={agents.length === 0}
        emptyMessage={
          <>
            <p className="mb-1">{t('chat.noAgents')}</p>
            <p className="text-xs">{t('chat.createNewAgent')}</p>
          </>
        }
      >
        <div className="flex flex-col">
          {agents.map((agent) => (
            <SidebarItem
              key={agent.id}
              isSelected={currentAgentId === agent.id}
              title={agent.name}
              description={agent.description || undefined}
              onClick={() => onAgentSelect(agent.id)}
              avatar={{
                src: agent.avatarUrl || undefined,
                name: agent.name,
              }}
            />
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
```

**Files to create:**
- `apps/client/src/pages/chat/components/agent/AgentSidebar/AgentSidebar.tsx`
- `apps/client/src/pages/chat/components/agent/AgentSidebar/AgentSidebar.test.tsx`

**Files to modify:**
- `apps/client/src/pages/chat/components/chat/ChatAgent/ChatAgent.tsx` (replace SessionSidebar with AgentSidebar)

---

### 7. Update Chat Header Component

**File:** `apps/client/src/pages/chat/components/chat/ChatHeader/ChatHeader.tsx`

**Changes:**
- Remove `AgentSelector` dropdown component
- Show agent avatar + name on left (without dropdown)
- Add configure icon button on right that navigates to agent config page
- **Disable configure button when no agentId is provided**
- **Component should use the exact markup structure shown below**

**Implementation:**
```typescript
interface ChatHeaderProps {
  agent: Agent | null;
  agentId: number | null;
}

export default function ChatHeader({ agent, agentId }: ChatHeaderProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const navigate = useNavigate();
  
  const handleConfigure = () => {
    if (agentId) {
      navigate(ROUTES.CONFIG_AGENT(agentId));
    }
  };
  
  return (
    <div className="px-5 py-3 bg-background border-b border-border flex items-center justify-between">
      <div className="flex items-center gap-3">
        {agent && (
          <>
            <Avatar
              src={agent.avatarUrl || undefined}
              name={agent.name}
              size="md"
            />
            <h2 className="text-lg font-semibold text-text-secondary">
              {agent.name}
            </h2>
          </>
        )}
      </div>
      <Button
        variant="icon"
        onClick={handleConfigure}
        disabled={!agentId}
        tooltip={agentId ? t('chat.configureAgent') : undefined}
      >
        <IconSettings size="md" />
      </Button>
    </div>
  );
}
```

**Note:** This component should be a standalone component file with this exact markup structure.

**Files to modify:**
- `apps/client/src/pages/chat/components/chat/ChatHeader/ChatHeader.tsx`
- `apps/client/src/pages/chat/components/chat/ChatAgent/ChatAgent.tsx` (update to pass agent/agentId to ChatHeader)

---

### 8. Simplify Chat Agent Component

**File:** `apps/client/src/pages/chat/components/chat/ChatAgent/ChatAgent.tsx`

**Changes:**
- Remove session selection logic
- Always use agent's first session (fetched automatically by backend)
- Replace `SessionSidebar` with `AgentSidebar`
- Remove session delete/edit handlers
- Remove session modals
- Update to use simplified routing (no sessionId in URL)
- **Handle null agentId case**: Show empty sidebar with header + button, "No chat selected" in content view
- **Session logic is completely backend-managed**: UI is agnostic to sessions - backend handles multiple sessions internally, frontend only sees one conversation per agent

**Key changes:**
- Remove `useChatSession` hook (or simplify it significantly)
- Remove session-related state and handlers
- Update `useChatMessages` to work without explicit sessionId (backend handles it)
- Pass agents list to `AgentSidebar`
- Handle agent selection by navigating to `/chat/:agentId`

**Implementation outline:**
```typescript
function ChatAgentContent({ agentId: propAgentId }: ChatAgentContentProps) {
  const { agentId: urlAgentId } = useParams<{ agentId?: string }>();
  const agentId = propAgentId ?? (urlAgentId ? parseInt(urlAgentId, 10) : null);
  
  const { data: agents = [] } = useAgents();
  const agent = agentId ? agents.find(a => a.id === agentId) : null;
  
  // Backend automatically returns first session for agent
  // UI is completely agnostic to sessions - backend handles multiple sessions internally
  const { data: chatHistory, isLoading } = useChatHistory(agentId, undefined);
  const sessionId = chatHistory?.session?.id ?? null;
  
  const { messages, ... } = useChatMessages({ agentId, sessionId });
  
  const handleAgentSelect = (newAgentId: number) => {
    navigate(ROUTES.CHAT_AGENT(newAgentId));
  };
  
  const handleNewAgent = () => {
    navigate(ROUTES.CONFIG_NEW);
  };
  
  // Handle null agentId - show empty state
  if (!agentId) {
    return (
      <>
        <Sidebar>
          <AgentSidebar
            agents={agents}
            currentAgentId={null}
            onAgentSelect={handleAgentSelect}
            onNewAgent={handleNewAgent}
          />
        </Sidebar>
        <Container>
          <PageHeader leftContent={<ChatHeader agent={null} agentId={null} />} />
          <PageContent>
            <ChatEmptyState message="No chat selected" />
          </PageContent>
        </Container>
      </>
    );
  }
  
  return (
    <>
      <Sidebar>
        <AgentSidebar
          agents={agents}
          currentAgentId={agentId}
          onAgentSelect={handleAgentSelect}
          onNewAgent={handleNewAgent}
        />
      </Sidebar>
      <Container>
        <PageHeader leftContent={<ChatHeader agent={agent} agentId={agentId} />} />
        <PageContent>
          <ChatContent ... />
        </PageContent>
      </Container>
    </>
  );
}
```

**Files to modify:**
- `apps/client/src/pages/chat/components/chat/ChatAgent/ChatAgent.tsx`
- `apps/client/src/pages/chat/hooks/use-chat-session.ts` (simplify or remove)
- `apps/client/src/pages/chat/hooks/use-chat-agent-navigation.ts` (update for agent-only navigation)

---

### 9. Implement Message Pagination with Infinite Scroll

**File:** `apps/client/src/pages/chat/components/chat/ChatMessages/hooks/use-chat-messages.ts`

**Changes:**
- Modify message loading to use pagination
- **Only load recent messages initially: up to 20 messages**
- Implement infinite scroll to load older messages when user scrolls up
- Use React Query's `useInfiniteQuery` for pagination

**Pagination Strategy: Cursor-based vs Offset-based**

**Cursor-based pagination:**
- Uses a cursor (typically message ID or timestamp) to fetch messages after/before a specific point
- More efficient for real-time data (no duplicate/missing messages when new messages arrive)
- Better for large datasets (doesn't degrade with offset size)
- Database can use index efficiently (WHERE id < cursor)
- Example: `?limit=20&cursor=12345` → get 20 messages before message ID 12345 (older messages)
- **How it works**: 
  - First request: `?limit=20` → returns 20 newest messages
  - Next request: `?limit=20&cursor=<oldest_message_id_from_previous_page>` → returns 20 messages older than that ID
  - Each page uses the oldest message ID from previous page as cursor

**Offset-based pagination:**
- Uses `limit` and `offset` parameters (e.g., `?limit=20&offset=0`)
- Simpler to implement and understand
- Can have issues with data consistency (if new messages arrive, offsets shift)
- Performance degrades with large offsets (database must skip many rows: `OFFSET 1000` means skip 1000 rows)
- Example: `?limit=20&offset=0` → first 20, `?limit=20&offset=20` → next 20, etc.

**Why cursor-based is better for chat:**
1. **Performance**: No matter how far back you scroll, query performance stays constant (uses index on message ID)
2. **Consistency**: If new messages arrive while user is scrolling, cursor-based pagination doesn't cause duplicate or missing messages
3. **Real-time friendly**: Perfect for chat applications where messages arrive continuously

**Recommendation:** Use **cursor-based pagination** with message ID as cursor for better performance and data consistency, especially important for real-time chat applications.

**Backend changes needed:**
- Add pagination parameters to `getChatHistory` endpoint
- Support cursor-based pagination (message ID as cursor)
- Return messages in reverse chronological order (newest first) for initial load
- Return older messages when paginating (messages before cursor)

**Frontend implementation (cursor-based):**
```typescript
export function useChatMessages({ agentId, sessionId }: UseChatMessagesOptions) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: queryKeys.chat.history(agentId!, sessionId || undefined),
    queryFn: ({ pageParam }) => 
      MessageService.getChatHistory(agentId!, sessionId, {
        limit: 20,
        cursor: pageParam, // message ID cursor (undefined for first page)
      }),
    getNextPageParam: (lastPage) => {
      // Return oldest message ID as cursor for next page, or undefined if no more
      if (lastPage.messages.length === 0 || !lastPage.hasMore) {
        return undefined;
      }
      // Get the oldest message ID from current page (first message in array)
      return lastPage.messages[0]?.id;
    },
    initialPageParam: undefined, // No cursor for first page
    enabled: agentId !== null,
  });
  
  // Combine all pages into single messages array
  // Messages come in reverse chronological order (newest first), reverse for display
  const messages = useMemo(() => {
    if (!data?.pages) return [];
    // Each page has messages in reverse chronological order (newest first)
    // We need to reverse each page, then combine, so oldest appears first
    const allMessages: Message[] = [];
    // Process pages in reverse order (oldest page first)
    for (let i = data.pages.length - 1; i >= 0; i--) {
      const pageMessages = [...data.pages[i].messages].reverse();
      allMessages.push(...pageMessages);
    }
    return allMessages;
  }, [data]);
  
  // Detect scroll to top and load more
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasNextPage || isFetchingNextPage) return;
    
    const handleScroll = () => {
      // Load more when scrolled to top (or near top)
      if (container.scrollTop < 100) {
        fetchNextPage();
      }
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  return {
    messages,
    messagesContainerRef,
    isLoading,
    isFetchingMore: isFetchingNextPage,
    // ... rest of return
  };
}
```

**Backend API changes:**
- Update `ChatHistoryResponseDto` to include pagination metadata (`hasMore: boolean`)
- Add `limit` (default 20) and `cursor` (message ID) query parameters to `getChatHistory` endpoint
- Modify `MessageRepository.findAllBySessionIdWithRawData` to support cursor-based pagination
- Return messages in reverse chronological order (newest first) for initial load
- When cursor is provided, return messages older than cursor (before that message ID)

**Files to modify:**
- `apps/client/src/pages/chat/components/chat/ChatMessages/hooks/use-chat-messages.ts`
- `apps/client/src/pages/chat/components/chat/ChatMessages/ChatMessages.tsx` (add scroll detection)
- `apps/api/src/chat/chat.controller.ts` (add pagination params)
- `apps/api/src/chat/chat.service.ts` (implement pagination)
- `apps/api/src/message/message.repository.ts` (add pagination support)
- `apps/client/src/services/chat/message/message.service.ts` (update API call)

---

### 10. Update Translation Keys and Remove Unused Code

**File:** `packages/i18n/src/locales/en/client.json`

**Changes:**
- Add new translation keys for agent sidebar
- **Remove all old session-related locale strings** (sessions, newSession, noSessions, createNewSession, editSessionNameTooltip, deleteSessionTooltip, etc.)
- Keep only agent-focused keys

**New keys:**
```json
{
  "chat": {
    "conversations": "Conversations",
    "newAgent": "New Agent",
    "noAgents": "No agents yet",
    "createNewAgent": "Create your first agent to get started",
    "configureAgent": "Configure Agent",
    "noChatSelected": "No chat selected"
  }
}
```

**Files to modify:**
- `packages/i18n/src/locales/en/client.json` (remove all session-related keys)

**Files to modify:**
- `packages/i18n/src/locales/en/client.json`

---

### 11. Remove Session-Related Components and Unused Code

**Cleanup tasks:**
- **Remove all session-related UI components** (not optional - they're no longer used)
- **Remove session-related hooks and utilities**
- **Remove session-related translation keys** (already covered in step 10)
- **Remove AgentSelector component** (replaced by AgentSidebar and ChatHeader)

**Files to remove:**
- `apps/client/src/pages/chat/components/session/SessionSidebar/SessionSidebar.tsx`
- `apps/client/src/pages/chat/components/session/SessionItem/SessionItem.tsx`
- `apps/client/src/pages/chat/components/session/SessionNameModal/SessionNameModal.tsx`
- `apps/client/src/pages/chat/components/session/` (entire directory)
- `apps/client/src/pages/chat/components/agent/AgentSelector/AgentSelector.tsx` (replaced by AgentSidebar)
- `apps/client/src/pages/chat/hooks/use-chat-session.ts` (session logic removed from frontend)
- `apps/client/src/pages/chat/hooks/use-chat-agent-navigation.ts` (simplify or remove if no longer needed)

**Unused code to remove:**
- All session selection/management logic from frontend
- Session-related state management
- Session modals and handlers
- AgentSelector dropdown component
- Session-related API calls from frontend (backend handles internally)

---

### 12. Update Tests

**Files to update:**
- `apps/client/src/pages/chat/Chat.test.tsx`
- `apps/client/src/pages/chat/components/chat/ChatAgent/ChatAgent.test.tsx`
- `apps/client/src/pages/chat/hooks/use-chat-session.test.tsx` (update or remove)
- `apps/client/src/pages/chat/components/agent/AgentSelector/AgentSelector.test.tsx` (update or remove)
- `apps/client/src/utils/localStorage.test.ts`
- Create tests for new `AgentSidebar` component
- Update message pagination tests

---

## Implementation Order

### Phase 1: Backend Changes
1. Auto-create session on agent creation
2. Simplify chat history endpoint (ensure it returns first session)

### Phase 2: Frontend Core Changes
3. Update routing constants
4. Remove localStorage logic
5. Simplify Chat.tsx routing
6. Update ChatAgent component to remove session logic

### Phase 3: UI Components
7. Create AgentSidebar component
8. Update ChatHeader component
9. Replace SessionSidebar with AgentSidebar in ChatAgent

### Phase 4: Message Pagination
10. Implement backend pagination
11. Implement frontend infinite scroll

### Phase 5: Cleanup & Testing
12. Update translation keys
13. Update tests
14. Remove unused session components
15. Final testing and bug fixes

---

## Migration Considerations

### Backward Compatibility
- Existing sessions in database remain valid
- Backend will automatically use first session for each agent
- No data migration needed

### User Experience
- Users will see agent list instead of session list
- Clicking agent automatically loads their conversation
- No need to manually select sessions

### Performance
- Message pagination prevents loading all messages at once
- Infinite scroll provides smooth experience for long conversations
- Reduced initial load time for chats with many messages

---

## Testing Checklist

### Backend Tests
- [ ] Agent creation automatically creates session
- [ ] Chat history returns first session when no sessionId provided
- [ ] Message pagination works correctly
- [ ] Pagination parameters are validated

### Frontend Tests
- [ ] Routing works correctly (`/chat` and `/chat/:agentId`)
- [ ] `/chat` with no agentId shows empty state (no redirect)
- [ ] `/chat` with no available agents shows empty sidebar + "No chat selected" message
- [ ] Configure button is disabled when no agentId
- [ ] Agent sidebar displays correctly
- [ ] Agent selection navigates correctly
- [ ] Chat header shows agent info and configure button (disabled when no agent)
- [ ] Message pagination loads correctly (20 messages initially)
- [ ] Infinite scroll triggers when scrolling up
- [ ] No localStorage usage for agent/session selection
- [ ] Empty states display correctly
- [ ] All session-related components removed
- [ ] All session-related translation keys removed

### Integration Tests
- [ ] Full chat flow: select agent → send message → see response
- [ ] Agent switching: switch between agents → see correct conversations
- [ ] Long chat: scroll up → older messages load
- [ ] New agent creation: create agent → automatically has session → can chat

---

## Notes

- **Session management**: Sessions are completely backend-managed. **Multiple sessions are allowed in the database model, but the frontend is completely agnostic to sessions** - backend handles multiple sessions internally, frontend only sees one conversation per agent (the first/most recent session).
- **UI agnostic to sessions**: Frontend never references sessions directly - all session logic is a backend implementation detail.
- **URL as source of truth**: All navigation is URL-based, no localStorage state to sync.
- **Simplified state**: Less state management, fewer edge cases to handle.
- **Better UX**: Users think in terms of agents, not sessions. More intuitive.
- **Performance**: Message pagination (20 messages initially) prevents performance issues with long chats.
- **No redirects**: `/chat` route shows empty state, does not redirect to first agent.
- **Empty state handling**: When no agentId in URL or no agents available, show empty sidebar with header + button, "No chat selected" in content, configure button disabled.

---

## Decisions Made

1. **Session naming**: Removed from UI - sessions are backend implementation detail
2. **Multiple sessions**: Allowed in database model, but frontend is completely agnostic - backend handles internally, frontend only sees one conversation per agent
3. **Session deletion**: Not available in UI - sessions managed entirely by backend
4. **Message pagination strategy**: Cursor-based pagination with message ID as cursor, 20 messages per page
5. **Empty state**: `/chat` with no agentId shows empty sidebar (header + button visible), "No chat selected" in content, configure button disabled. No redirects.
6. **ChatHeader component**: Standalone component with exact markup structure specified
7. **Unused code**: All session-related UI components, hooks, and translation keys should be removed

---

## Estimated Effort

- **Backend changes**: 2-3 hours
- **Frontend routing/state**: 3-4 hours
- **UI components**: 4-5 hours
- **Message pagination**: 4-6 hours
- **Testing**: 3-4 hours
- **Total**: ~16-22 hours
