# Client App Refactoring Plan

## Executive Summary

This document outlines a comprehensive refactoring plan to address loading state management, data fetching optimization, routing improvements, and rendering logic consolidation in the client application.

## Current Problems

### 1. Loading State Issues

**Problem**: Too many elements enter loading state unnecessarily
- **ChatAgent**: Shows full-page loading when `propLoading || messagesLoading || sessionsLoading` (line 132)
- **Sidebar + Container**: Both show loading states when only specific data is missing
- **Message Sending**: Entire page shows loading instead of just typing indicator
- **Session Switching**: Full page reloads when switching sessions, even if data is cached

**Impact**: Poor UX with excessive loading spinners, jarring transitions, and unnecessary re-renders

### 2. Data Re-fetching

**Problem**: Data is re-fetched unnecessarily even when already available
- **Agents Query**: No `staleTime` configured (defaults to 0)
- **Sessions Query**: No `staleTime` configured
- **Chat History Query**: No `staleTime` configured
- **Queries refetch**: On window focus, component remount, and route changes

**Impact**: Unnecessary API calls, slower perceived performance, potential race conditions

### 3. Agent Selection & Routing

**Problem**: Agent selection doesn't update route, causing sync issues
- **AgentSelector**: Updates localStorage but not route (line 35 in `AgentSelector.tsx`)
- **Hacky workaround**: Uses `location.state?.agentChanged` to force re-render (line 14 in `ChatRoute.tsx`)
- **Route structure**: `/chat/:sessionId` doesn't include agentId
- **Sidebar refresh**: Requires navigation hack to update sessions list

**Impact**: Agent changes don't persist in URL, browser back/forward broken, state management complexity

### 4. Fragile Rendering Logic

**Problem**: Too many useEffect hooks with complex dependencies
- **useChatSession**: Multiple useEffects with overlapping dependencies (lines 53-119)
- **useChatMessages**: Complex loading state logic with refs (lines 42-75)
- **useChatRoute**: Force refresh hack with unused variable (line 27)
- **Loading state checks**: Scattered across multiple components

**Impact**: Hard to reason about, potential bugs, difficult to maintain

### 5. Loading State Granularity

**Problem**: No distinction between different types of loading
- **Initial load**: Should show full loading state
- **Data refresh**: Should show minimal/no loading
- **Message sending**: Should only show typing indicator
- **Session switch**: Should only load if data not cached

**Impact**: Users see loading states when data is already available

## Refactoring Goals

1. **Prevent unnecessary re-fetching**: Once agents/sessions/chat data is loaded, keep it cached
2. **Granular loading states**: Sidebar + Container only load if agents/sessions unavailable
3. **Page-specific loading**: Only page content loads when switching sidebar items (if data missing)
4. **Typing indicator only**: Message sending shows only typing indicator, nothing else
5. **Route-based agent selection**: Agent in route, localStorage as fallback
6. **Simplified logic**: Reduce useEffect complexity, unified loading state management
7. **Maintain fade-in effects**: Preserve existing animation behavior

## Implementation Plan

### Phase 1: Query Configuration & Caching

#### 1.1 Configure React Query Defaults

**File**: `apps/client/src/providers/query-client.ts`

**Changes**:
- Increase `staleTime` for agents, sessions, and chat history queries
- Configure per-query `staleTime` in query hooks
- Ensure data persists across route changes

**Implementation**:
```typescript
// Update default staleTime to 10 minutes for stable data
staleTime: 10 * 60 * 1000, // 10 minutes

// Per-query configuration in hooks:
// - Agents: 15 minutes (rarely change)
// - Sessions: 5 minutes (moderate change frequency)
// - Chat History: 5 minutes (but can be invalidated on new messages)
```

**Files to modify**:
- `apps/client/src/providers/query-client.ts`
- `apps/client/src/hooks/queries/use-agents.ts`
- `apps/client/src/hooks/queries/use-chat.ts`

#### 1.2 Add Query Invalidation Strategy

**Changes**:
- Only invalidate queries when data actually changes
- Use optimistic updates where possible
- Prefetch data for likely next actions
- **Distinguish between initial chat load and message sending**

**Implementation**:
- Sessions: Invalidate only on create/delete/update
- Chat History: 
  - Invalidate only on new messages (not on initial load)
  - Initial chat load: Show loading state for chat area
  - Awaiting new message / message sent: Only show typing indicator
  - This distinction is handled in `UseChatLoadingStateReturn` (see Phase 3.1)
- Agents: Invalidate only on create/update/delete

### Phase 2: Route Structure Refactoring

#### 2.1 Update Route Structure

**Current**: `/chat/:sessionId?`

**Proposed**: `/chat/:agentId/:sessionId?`

**Benefits**:
- Agent selection reflected in URL
- Browser back/forward works correctly
- Direct linking to specific agent/session
- No localStorage sync issues

**Implementation Steps**:

1. **Update route constants**:
   ```typescript
   // apps/client/src/constants/routes.constants.ts
   export const ROUTES = {
     ROOT: '/',
     CHAT: '/chat',
     // Navigation functions (used with actual values)
     CHAT_AGENT: (agentId: number) => `/chat/${agentId}`,
     CHAT_SESSION: (agentId: number, sessionId: number) => `/chat/${agentId}/${sessionId}`,
     CONFIG: '/config',
     CONFIG_NEW: '/config/new',
     CONFIG_AGENT: (agentId: number) => `/config/${agentId}`,
     PROFILE: '/profile',
     
     // Route patterns for React Router (with :paramName syntax)
     CHAT_AGENT_PATTERN: '/chat/:agentId',
     CHAT_SESSION_PATTERN: '/chat/:agentId/:sessionId',
     CONFIG_AGENT_PATTERN: '/config/:agentId',
   } as const;
   ```
   
   **Note**: 
   - Functions (e.g., `CHAT_AGENT(agentId)`) are used for navigation with actual values
   - Pattern constants (e.g., `CHAT_AGENT_PATTERN`) are used in Route components with `:paramName` syntax
   - This maintains consistency with existing `CONFIG_AGENT` pattern

2. **Update App.tsx routes**:
   ```typescript
   <Route path={ROUTES.CHAT} element={<ChatRoute />} />
   <Route path={ROUTES.CHAT_AGENT_PATTERN} element={<ChatRoute />} />
   <Route path={ROUTES.CHAT_SESSION_PATTERN} element={<ChatRoute />} />
   <Route path={ROUTES.CONFIG} element={<ConfigRoute />} />
   <Route path={ROUTES.CONFIG_NEW} element={<ConfigRoute />} />
   <Route path={ROUTES.CONFIG_AGENT_PATTERN} element={<ConfigRoute />} />
   ```
   
   **Note**: 
   - Replace hardcoded `/chat/:sessionId` with `ROUTES.CHAT_SESSION_PATTERN`
   - Replace hardcoded `/config/:agentId` with `ROUTES.CONFIG_AGENT_PATTERN`
   - Use route pattern constants (with `:paramName`) for Route components
   - Use route functions (with actual values) for navigation calls like `navigate(ROUTES.CHAT_AGENT(agentId))`

3. **Update ChatRoute.tsx**:
   - Read `agentId` from URL params
   - Fallback to localStorage if not in URL
   - Update localStorage when agentId changes
   - Remove `forceRefresh` hack

4. **Update AgentSelector.tsx**:
   - Navigate to `/chat/:agentId` when agent changes
   - Remove localStorage-only update
   - Update route instead of using state hack

5. **Update useChatRoute.ts**:
   - Read agentId from URL params
   - Remove localStorage fallback logic (keep as initial fallback only)
   - Remove `forceRefresh` parameter

#### 2.2 Migration Strategy & Generic Redirects

**Generic Redirects** (Required):
- `/chat` (no params): Auto-navigate to agent and session based on localStorage, or pick first available
- `/chat/:agentId` (no sessionId): Auto-select most recent session for that agent

**Implementation**:
```typescript
// In ChatRoute.tsx
const { agentId: urlAgentId, sessionId: urlSessionId } = useParams();
const { data: agents = [], isLoading: loadingAgents } = useAgents();
const storedAgentId = LocalStorageManager.getSelectedAgentIdChat();

// Handle /chat route (no agentId)
if (!urlAgentId) {
  // Determine agentId: localStorage > first available
  const effectiveAgentId = storedAgentId || agents[0]?.id;
  
  if (effectiveAgentId && !loadingAgents) {
    // Get sessions for this agent
    const sessions = queryClient.getQueryData<Session[]>(
      queryKeys.agents.sessions(effectiveAgentId)
    );
    
    // Navigate to agent route, or agent + most recent session
    if (sessions && sessions.length > 0) {
      navigate(ROUTES.CHAT_SESSION(effectiveAgentId, sessions[0].id), { replace: true });
    } else {
      navigate(ROUTES.CHAT_AGENT(effectiveAgentId), { replace: true });
    }
  }
  return null; // Show loading while redirecting
}

// Handle /chat/:agentId route (no sessionId)
if (urlAgentId && !urlSessionId) {
  const agentId = parseInt(urlAgentId, 10);
  const { data: sessions = [], isLoading: sessionsLoading } = useAgentSessions(agentId);
  
  // Auto-select most recent session when sessions load
  useEffect(() => {
    if (!sessionsLoading && sessions.length > 0) {
      const mostRecent = sessions[0];
      navigate(ROUTES.CHAT_SESSION(agentId, mostRecent.id), { replace: true });
    }
  }, [agentId, sessions, sessionsLoading]);
  
  return null; // Show loading while redirecting
}
```

**Note**: No backward compatibility needed for old bookmarks - generic redirects handle all cases.

### Phase 3: Loading State Management

#### 3.1 Create Unified Loading State Hook

**File**: `apps/client/src/pages/chat/hooks/use-chat-loading-state.ts`

**Purpose**: Centralize loading state logic with clear distinctions

**Implementation**:
```typescript
interface UseChatLoadingStateOptions {
  agentsLoading: boolean;
  sessionsLoading: boolean;
  messagesLoading: boolean;
  isSendingMessage: boolean;
  hasAgents: boolean;
  hasSessions: boolean;
  hasMessages: boolean;
}

interface UseChatLoadingStateReturn {
  // Full page loading (only on initial load)
  isInitialLoad: boolean;
  
  // Sidebar loading (only if agents/sessions unavailable)
  sidebarLoading: boolean;
  
  // Container loading (only if agents unavailable)
  containerLoading: boolean;
  
  // Page content loading (only if specific data missing)
  // Distinguishes between:
  // - Initial chat load: Show loading state for chat area
  // - Awaiting new message: Only show typing indicator (handled separately)
  contentLoading: boolean;
  
  // Typing indicator (only when sending message or awaiting response)
  // This is separate from contentLoading to avoid showing full loading state
  showTypingIndicator: boolean;
}
```

**Logic**:
- `isInitialLoad`: Only true if no agents AND no sessions AND no messages
- `sidebarLoading`: Only true if agents loading OR (sessions loading AND no cached sessions)
- `containerLoading`: Only true if agents loading AND no cached agents
- `contentLoading`: Only true if initial chat load (messages loading AND no cached messages for current session AND not sending message)
- `showTypingIndicator`: Only true when `isSendingMessage` or awaiting message response (separate from contentLoading)

#### 3.2 Update ChatAgent Component

**Changes**:
- Use unified loading state hook
- Remove scattered loading checks
- Show loading states only where appropriate

**Before**:
```typescript
if (propLoading || messagesLoading || sessionsLoading) {
  return <ChatLoadingState />;
}
```

**After**:
```typescript
const {
  isInitialLoad,
  sidebarLoading,
  containerLoading,
  contentLoading,
  showTypingIndicator,
} = useChatLoadingState({...});

if (isInitialLoad) {
  return <ChatLoadingState />;
}

return (
  <>
    <Sidebar>
      {sidebarLoading ? <SidebarSkeleton /> : <SessionSidebar ... />}
    </Sidebar>
    <Container>
      {containerLoading ? <ContainerSkeleton /> : (
        <PageContent>
          {contentLoading ? <ContentSkeleton /> : <ChatContent ... />}
        </PageContent>
      )}
    </Container>
  </>
);
```

#### 3.3 Update ChatContent Component

**Changes**:
- Accept `showTypingIndicator` prop instead of `loading`
- Only show typing indicator, not full loading state

**Implementation**:
```typescript
<ChatMessages
  messages={messages}
  showTypingIndicator={showTypingIndicator} // Not loading
  onShowJson={onShowJson}
  sessionId={sessionId}
/>
```

### Phase 4: Simplify useEffect Logic

#### 4.1 Refactor useChatSession

**Problems**:
- Multiple useEffects with overlapping dependencies
- Complex initialization logic with refs
- Auto-selection logic mixed with state management

**Solution**: Split into focused hooks

**New Hooks**:
1. `useSessionSelection`: Handles session selection logic
2. `useSessionAutoSelect`: Handles auto-selection of most recent session
3. `useSessionPrefetch`: Handles prefetching chat history

**Implementation**:
```typescript
// use-session-selection.ts
export function useSessionSelection(agentId, initialSessionId) {
  // Simple state management
  // No complex initialization logic
}

// use-session-auto-select.ts
export function useSessionAutoSelect(agentId, sessions, currentSessionId) {
  // Focused auto-selection logic
  // Only runs when needed
}

// use-session-prefetch.ts
export function useSessionPrefetch(agentId, sessionId) {
  // Prefetch logic
  // Separate concern
}
```

#### 4.2 Refactor useChatMessages

**Problems**:
- Complex loading state calculation
- Multiple refs for tracking state
- Loading state includes message sending

**Solution**: Simplify and separate concerns

**Changes**:
- Remove complex loading calculation
- Use React Query's built-in loading states
- Separate `isSendingMessage` from `isLoadingMessages`
- Return `isSendingMessage` separately for typing indicator

#### 4.3 Remove useChatRoute Force Refresh

**Changes**:
- Remove `forceRefresh` parameter
- Rely on URL params for reactivity
- Remove unused variable hack

### Phase 5: Agent Selection Flow

#### 5.1 Update Agent Selection Flow

**Current Flow**:
1. User selects agent in dropdown
2. localStorage updated
3. Navigate to `/chat` with state hack
4. ChatRoute reads localStorage
5. Sidebar updates

**New Flow**:
1. User selects agent in dropdown
2. Navigate to `/chat/:agentId` (or `/chat/:agentId/:sessionId` if session exists)
3. ChatRoute reads agentId from URL
4. Update localStorage for persistence
5. Sidebar automatically updates (React Query cache)

**Implementation in AgentSelector**:
```typescript
const handleAgentSelect = (agentId: number) => {
  setIsOpen(false);
  
  // Get most recent session for this agent (if available)
  const agentSessions = queryClient.getQueryData<Session[]>(
    queryKeys.agents.sessions(agentId)
  );
  const mostRecentSession = agentSessions?.[0];
  
  // Navigate to new route
  if (mostRecentSession) {
    navigate(ROUTES.CHAT_SESSION(agentId, mostRecentSession.id));
  } else {
    navigate(ROUTES.CHAT_AGENT(agentId));
  }
  
  // Update localStorage for page reload persistence
  LocalStorageManager.setSelectedAgentIdChat(agentId);
};
```

#### 5.2 Auto-select Most Recent Session on Agent Change

**Implementation**:
- When agent changes, check if sessions are cached
- If cached, navigate to most recent session immediately
- If not cached, wait for sessions to load, then navigate
- Use `useEffect` in ChatRoute to handle this

**Code**:
```typescript
// In ChatRoute.tsx
useEffect(() => {
  if (!agentId || sessionsLoading) return;
  
  const sessions = queryClient.getQueryData<Session[]>(
    queryKeys.agents.sessions(agentId)
  );
  
  // If we have sessions but no sessionId in URL, navigate to most recent
  if (sessions && sessions.length > 0 && !urlSessionId) {
    const mostRecent = sessions[0];
    navigate(ROUTES.CHAT_SESSION(agentId, mostRecent.id), { replace: true });
  }
}, [agentId, sessionsLoading, urlSessionId]);
```

### Phase 6: Data Prefetching Strategy

#### 6.1 Prefetch Sessions on Agent Hover

**Implementation**:
- Prefetch sessions when user hovers over agent in dropdown
- Use React Query's `prefetchQuery`
- No loading state, just background fetch

#### 6.2 Prefetch Chat History on Session Hover (Partial Load)

**Implementation**:
- Prefetch chat history when user hovers over session in sidebar
- Use React Query's `prefetchQuery`
- **Partial load**: Only load last 20 messages initially
- Instant load when clicked

**API Changes Required**:
- Update `ChatService.getChatHistory` to accept optional `limit` and `offset` parameters
- Backend should support pagination for chat history
- Default to last 20 messages for initial load

**Implementation Details**:
```typescript
// In SessionSidebar.tsx
const handleSessionHover = (agentId: number, sessionId: number) => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.chat.history(agentId, sessionId),
    queryFn: () => ChatService.getChatHistory(agentId, sessionId, { limit: 20 }),
  });
};

// Update query key to include pagination params
queryKeys.chat.history = (agentId: number, sessionId?: number, limit?: number, offset?: number) =>
  [...queryKeys.chat.all, QueryKey.HISTORY, agentId, sessionId, limit, offset] as const;
```

#### 6.3 Infinite Scrolling for Chat History

**Implementation**:
- Load additional messages when scrolling up in chat
- Use React Query's `useInfiniteQuery` for pagination
- Load older messages in batches (e.g., 20 at a time)

**API Changes Required**:
- Backend endpoint must support `limit` and `offset` or cursor-based pagination
- Return total message count or hasMore flag

**Implementation Details**:
```typescript
// New hook: use-chat-history-infinite.ts
export function useChatHistoryInfinite(agentId: number | null, sessionId: number | null) {
  return useInfiniteQuery({
    queryKey: queryKeys.chat.historyInfinite(agentId!, sessionId!),
    queryFn: ({ pageParam = 0 }) => 
      ChatService.getChatHistory(agentId!, sessionId!, { 
        limit: 20, 
        offset: pageParam 
      }),
    getNextPageParam: (lastPage, allPages) => {
      // Return next offset if more messages exist
      return lastPage.hasMore ? allPages.length * 20 : undefined;
    },
    enabled: agentId !== null && sessionId !== null,
  });
}
```

**Files to modify**:
- `apps/api/src/chat/chat.service.ts` (backend)
- `apps/client/src/services/chat.service.ts` (add pagination params)
- `apps/client/src/hooks/queries/use-chat.ts` (add infinite query hook)
- `apps/client/src/pages/chat/components/chat/ChatMessages.tsx` (add scroll detection)

### Phase 7: React Suspense Integration

#### 7.1 Add Suspense Boundaries

**Purpose**: Better loading state management with React Suspense
- Replace manual loading state checks with Suspense boundaries
- Use Suspense for data fetching components
- Provide fallback UI for loading states

**Implementation**:

1. **Wrap route components with Suspense**:
   ```typescript
   // In App.tsx
   <Suspense fallback={<ChatLoadingState />}>
     <Route path={ROUTES.CHAT} element={<ChatRoute />} />
     <Route path={`${ROUTES.CHAT}/:agentId`} element={<ChatRoute />} />
     <Route path={`${ROUTES.CHAT}/:agentId/:sessionId`} element={<ChatRoute />} />
   </Suspense>
   ```

2. **Create Suspense-aware query hooks**:
   ```typescript
   // Use React Query's suspense mode
   export function useAgentsSuspense() {
     return useQuery({
       queryKey: queryKeys.agents.list(),
       queryFn: () => AgentService.getAllAgents(),
       suspense: true, // Enable suspense mode
     });
   }
   ```

3. **Granular Suspense boundaries**:
   ```typescript
   // In ChatAgent.tsx
   <Suspense fallback={<SidebarSkeleton />}>
     <Sidebar>
       <SessionSidebar ... />
     </Sidebar>
   </Suspense>
   
   <Suspense fallback={<ContainerSkeleton />}>
     <Container>
       <PageContent>
         <Suspense fallback={<ContentSkeleton />}>
           <ChatContent ... />
         </Suspense>
       </PageContent>
     </Container>
   </Suspense>
   ```

**Benefits**:
- Automatic loading state management
- Better error boundaries integration
- Cleaner component code (no manual loading checks)
- React 18 concurrent features support

**Files to modify**:
- `apps/client/src/App.tsx`
- `apps/client/src/pages/chat/ChatRoute.tsx`
- `apps/client/src/pages/chat/components/chat/ChatAgent.tsx`
- `apps/client/src/hooks/queries/use-agents.ts` (add suspense variants)
- `apps/client/src/hooks/queries/use-chat.ts` (add suspense variants)

#### 7.2 Route-based Code Splitting

**Purpose**: Lazy load routes to reduce initial bundle size
- Split each route into separate chunks
- Load routes on-demand
- Improve initial page load time

**Implementation**:

1. **Convert routes to lazy components**:
   ```typescript
   // In App.tsx
   import { lazy, Suspense } from 'react';
   
   const ChatRoute = lazy(() => import('./pages/chat/ChatRoute'));
   const ConfigRoute = lazy(() => import('./pages/config/ConfigRoute'));
   const UserProfile = lazy(() => import('./pages/profile'));
   
   // Wrap with Suspense
   <Suspense fallback={<PageLoadingState />}>
     <Routes>
       <Route path={ROUTES.CHAT} element={<ChatRoute />} />
       <Route path={ROUTES.CHAT_AGENT_PATTERN} element={<ChatRoute />} />
       <Route path={ROUTES.CHAT_SESSION_PATTERN} element={<ChatRoute />} />
       <Route path={ROUTES.CONFIG} element={<ConfigRoute />} />
       <Route path={ROUTES.CONFIG_NEW} element={<ConfigRoute />} />
       <Route path={ROUTES.CONFIG_AGENT_PATTERN} element={<ConfigRoute />} />
       <Route path={ROUTES.PROFILE} element={<UserProfile />} />
     </Routes>
   </Suspense>
   ```

2. **Create loading component**:
   ```typescript
   // components/layout/PageLoadingState.tsx
   export default function PageLoadingState() {
     return (
       <PageContainer>
         <TopNavigation />
         <main className="flex-1 flex items-center justify-center">
           <Skeleton className="w-8 h-8 rounded-full" />
         </main>
         <AppFooter />
       </PageContainer>
     );
   }
   ```

3. **Optimize chunk names**:
   ```typescript
   // Use webpack magic comments for better chunk names
   const ChatRoute = lazy(() => 
     import(/* webpackChunkName: "chat" */ './pages/chat/ChatRoute')
   );
   const ConfigRoute = lazy(() => 
     import(/* webpackChunkName: "config" */ './pages/config/ConfigRoute')
   );
   ```

**Benefits**:
- Smaller initial bundle size
- Faster initial page load
- Better code organization
- Routes load on-demand

**Files to modify**:
- `apps/client/src/App.tsx`
- `apps/client/src/components/layout/PageLoadingState.tsx` (new file)
- `apps/client/vite.config.ts` (ensure code splitting is enabled)

### Phase 8: Component Structure Improvements

#### 8.1 Create Loading State Components

**New Components**:
- `SidebarSkeleton`: Loading state for sidebar only
- `ContainerSkeleton`: Loading state for container only
- `ContentSkeleton`: Loading state for page content only
- Keep `ChatLoadingState` for full-page initial load

#### 8.2 Update SessionSidebar

**Changes**:
- Accept `loading` prop but show skeleton inline
- Don't block entire sidebar, just show loading items
- Maintain existing functionality

#### 8.3 Update ChatContent

**Changes**:
- Accept `showTypingIndicator` instead of `loading`
- Remove any full loading states
- Only show typing indicator when sending message

## Implementation Order

### Step 1: Query Configuration (Low Risk)
1. Update query-client.ts with better defaults
2. Add staleTime to useAgents, useAgentSessions, useChatHistory
3. Test that data persists across route changes

### Step 2: Loading State Hook (Medium Risk)
1. Create useChatLoadingState hook
2. Update ChatAgent to use new hook
3. Test loading states are more granular

### Step 3: Route Structure (High Risk - Breaking Change)
1. Update route constants
2. Update App.tsx routes
3. Update ChatRoute to read agentId from URL
4. Update AgentSelector to navigate with agentId
5. Add backward compatibility for old URLs
6. Test all navigation flows

### Step 4: Simplify useEffect Logic (Medium Risk)
1. Refactor useChatSession into smaller hooks
2. Simplify useChatMessages loading logic
3. Remove useChatRoute forceRefresh
4. Test session switching and message sending

### Step 5: Agent Selection Flow (Medium Risk)
1. Update AgentSelector to navigate with agentId
2. Add auto-selection of most recent session
3. Update localStorage sync
4. Test agent switching and session selection

### Step 6: Prefetching (Low Risk)
1. Add prefetch on agent hover
2. Add prefetch on session hover (partial load - last 20 messages)
3. Test prefetching works correctly

### Step 7: Suspense & Code Splitting (Medium Risk)
1. Add Suspense boundaries to routes
2. Create suspense-aware query hooks
3. Convert routes to lazy loading
4. Test code splitting and loading states
5. Verify bundle size reduction

### Step 8: Infinite Scrolling (Medium Risk - Requires API Changes)
1. Update API to support pagination (limit/offset)
2. Create useChatHistoryInfinite hook
3. Implement scroll detection in ChatMessages
4. Test infinite scrolling works correctly
5. Test performance with large message lists

### Step 9: Component Updates (Low Risk)
1. Create granular loading components
2. Update components to use new loading states
3. Test all loading scenarios

## Testing Strategy

### Unit Tests
- Test useChatLoadingState hook with various states
- Test route parameter parsing
- Test localStorage fallback logic

### Integration Tests
- Test agent selection updates route
- Test session selection updates route
- Test loading states don't show unnecessarily
- Test typing indicator only shows when sending

### Manual Testing Checklist
- [ ] Agent selection updates URL
- [ ] Browser back/forward works
- [ ] Direct link to agent/session works
- [ ] Sidebar only loads if agents/sessions unavailable
- [ ] Page content only loads if data missing
- [ ] Typing indicator only shows when sending message
- [ ] No full-page loading when switching sessions (if cached)
- [ ] Fade-in effects still work
- [ ] Page reload preserves agent selection
- [ ] Agent change selects most recent session

## Migration Notes

### Generic Redirects (Required)
- `/chat` route: Auto-navigates to agent and session based on localStorage, or picks first available
- `/chat/:agentId` route: Auto-selects most recent session for that agent
- These redirects ensure all navigation flows work correctly

### Breaking Changes
- Route structure changes: `/chat/:sessionId` → `/chat/:agentId/:sessionId`
- Generic redirects handle all cases (no backward compatibility needed for old bookmarks)
- Some component props may change (loading -> showTypingIndicator)

### Rollback Plan
- Keep old route handlers during transition
- Feature flag for new route structure
- Gradual rollout possible

## Success Criteria

1. ✅ Agents/sessions/chat data not re-fetched once loaded (unless invalidated)
2. ✅ Sidebar + Container only in loading state if agents/sessions unavailable
3. ✅ Page content only loads when switching sidebar items (if data missing)
4. ✅ Typing indicator only shows when sending message
5. ✅ Agent selection updates route and selects most recent session
6. ✅ Minimal loading states when switching between items
7. ✅ Fade-in effects maintained
8. ✅ Code is more maintainable with less useEffect complexity
9. ✅ No ad-hoc loading state checks scattered across components

## Estimated Effort

- **Phase 1 (Query Config)**: 2-3 hours
- **Phase 2 (Route Structure)**: 6-8 hours
- **Phase 3 (Loading State)**: 4-6 hours
- **Phase 4 (Simplify Logic)**: 4-6 hours
- **Phase 5 (Agent Selection)**: 3-4 hours
- **Phase 6 (Prefetching)**: 3-4 hours (includes partial load implementation)
- **Phase 7 (Suspense & Code Splitting)**: 4-6 hours
- **Phase 8 (Infinite Scrolling)**: 6-8 hours (includes API changes)
- **Phase 9 (Components)**: 2-3 hours

**Total**: ~34-48 hours

## Risks & Mitigation

### Risk 1: Route Changes Break Existing Links
**Mitigation**: Implement redirects for old URLs, maintain backward compatibility

### Risk 2: Loading States Too Granular (Confusing)
**Mitigation**: Test with users, iterate based on feedback

### Risk 3: React Query Cache Issues
**Mitigation**: Thorough testing, clear invalidation strategy

### Risk 4: Performance Regression
**Mitigation**: Monitor bundle size, query performance, render counts

### Risk 5: API Changes Required for Infinite Scroll
**Mitigation**: Coordinate with backend team, implement pagination support, maintain backward compatibility during transition

### Risk 6: Suspense Boundaries May Cause Layout Shifts
**Mitigation**: Use consistent fallback UI sizes, test with various screen sizes, monitor CLS (Cumulative Layout Shift)

## Future Improvements

1. **Optimistic Updates**: Update UI immediately, sync with server
2. **Virtual Scrolling**: For long message lists (when infinite scroll is implemented)
3. **Service Worker**: Offline support and caching
4. **WebSocket Integration**: Real-time message updates
5. **Progressive Web App**: Add PWA capabilities
