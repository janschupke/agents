# Loading States Test Coverage

This document outlines the comprehensive test coverage for loading states throughout the application.

## Test Files Created

### 1. `hooks/use-sidebar-loading-state.test.tsx`
**Purpose**: Tests the universal sidebar loading state hook

**Coverage**:
- ✅ Agents type: Returns `shouldShowLoading: false` when cache has data
- ✅ Agents type: Returns `shouldShowLoading: true` when cache empty and loading
- ✅ Agents type: Returns `shouldShowLoading: false` when cache empty and not loading
- ✅ Agents type: Returns `shouldShowLoading: false` when cache has data even if `isLoading: true` (background refetch)
- ✅ Sessions type: Returns `shouldShowLoading: false` when cache has data
- ✅ Sessions type: Returns `shouldShowLoading: true` when cache empty and loading
- ✅ Sessions type: Returns `shouldShowLoading: false` when cache empty and not loading
- ✅ Sessions type: Returns `shouldShowLoading: false` when `agentId` is null
- ✅ Sessions type: Checks cache for correct `agentId` (different agents have different caches)
- ✅ Sessions type: Returns `shouldShowLoading: false` when cache has data even if `isLoading: true` (background refetch)

### 2. `pages/chat/hooks/use-chat-loading-state.test.tsx`
**Purpose**: Tests chat-specific loading state logic

**Coverage**:
- ✅ `isInitialLoad`: True when no cached agents and agents loading
- ✅ `isInitialLoad`: True when no cached sessions and sessions loading
- ✅ `isInitialLoad`: False when agents are cached
- ✅ `isInitialLoad`: False when sessions are cached
- ✅ `isInitialLoad`: False when messages are loading (should not trigger full page load)
- ✅ `sidebarLoading`: True when agents loading and not cached
- ✅ `sidebarLoading`: True when sessions loading and not cached
- ✅ `sidebarLoading`: False when agents cached even if `isLoading: true`
- ✅ `sidebarLoading`: False when sessions cached even if `isLoading: true`
- ✅ `sidebarLoading`: False when both agents and sessions cached
- ✅ `containerLoading`: True when agents loading and not cached
- ✅ `containerLoading`: False when agents cached
- ✅ `contentLoading`: True when messages loading and not cached
- ✅ `contentLoading`: False when messages cached
- ✅ `contentLoading`: False when sending message (should show typing indicator instead)
- ✅ `contentLoading`: False when `sessionId` is null
- ✅ `showTypingIndicator`: True when sending message
- ✅ `showTypingIndicator`: False when not sending message

### 3. `pages/config/components/agent/AgentConfig.loading.test.tsx`
**Purpose**: Tests AgentConfig component loading states

**Coverage**:
- ✅ Full page loading: Shows when agents not cached and loading
- ✅ Full page loading: Does NOT show when agents cached even if `isLoading: true`
- ✅ Sidebar loading: Shows when agents not cached
- ✅ Sidebar loading: Does NOT show when agents cached
- ✅ Content loading: Shows when loading specific agent
- ✅ Content loading: Does NOT show when agent cached

### 4. `pages/chat/components/chat/ChatAgent.loading.test.tsx`
**Purpose**: Tests ChatAgent component loading states

**Coverage**:
- ✅ Full page loading (`isInitialLoad`): Shows when agents not cached and loading
- ✅ Full page loading: Does NOT show when agents cached
- ✅ Sidebar loading: Does NOT show when sessions cached (even if `isLoading: true`)
- ✅ Content loading: Shows when messages loading and not cached
- ✅ Content loading: Does NOT show when messages cached
- ✅ Typing indicator: Shows when sending message
- ✅ Typing indicator: Does NOT show when not sending message

## Test Principles

### Universal Hook Pattern
All sidebar loading states use `useSidebarLoadingState` hook which:
1. Checks React Query cache directly (not array length)
2. Returns `shouldShowLoading: false` if cache has data, regardless of `isLoading`
3. Works for both `'agents'` and `'sessions'` types

### Cache-First Approach
All loading state logic follows these principles:
1. **Cache is source of truth**: If data exists in cache, we're not loading
2. **Array length is unreliable**: Can be 0 during render cycles even when cache has data
3. **Background refetches don't trigger loading**: If cache has data, `isLoading: true` from background refetch doesn't show loading

### Granular Loading States
- **Full page loading**: Only when no cached data for agents/sessions
- **Sidebar loading**: Only when no cached data for agents/sessions
- **Content loading**: Only when no cached data for specific content (messages, agent config)
- **Typing indicator**: Separate from content loading, only when sending message

## Key Test Scenarios

### Scenario 1: Initial Page Load
- No cached data
- All queries loading
- **Expected**: Full page loading state

### Scenario 2: Clicking Session (Sessions Cached)
- Sessions already in cache
- Clicking session loads message history
- **Expected**: Sidebar stays visible, only content area shows loading

### Scenario 3: Background Refetch
- Data in cache
- React Query refetches in background (`isLoading: true`)
- **Expected**: No loading states shown, data remains visible

### Scenario 4: Switching Agents
- Agents cached
- Sessions for new agent not cached
- **Expected**: Sidebar shows loading for new agent's sessions, agents remain visible

### Scenario 5: Sending Message
- Messages cached
- User sends message
- **Expected**: Only typing indicator, no content loading state

## Running Tests

```bash
# Run all loading state tests
npm test -- loading

# Run specific test file
npm test -- use-sidebar-loading-state.test.tsx
npm test -- use-chat-loading-state.test.tsx
npm test -- AgentConfig.loading.test.tsx
npm test -- ChatAgent.loading.test.tsx
```

## Test Maintenance

When adding new loading states:
1. Add tests to the universal hook (`useSidebarLoadingState`) if applicable
2. Add tests to component-specific hooks (e.g., `useChatLoadingState`)
3. Add tests to components that use loading states
4. Ensure all tests follow the cache-first principle
5. Verify that background refetches don't trigger loading states
