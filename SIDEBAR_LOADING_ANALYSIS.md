# Sidebar Loading State Analysis & Fix Plan

## Problem Statement

When clicking a session (or switching agents), **the entire sidebar disappears** - not just showing a loading skeleton, but the sidebar including the header/title completely vanishes, even though the sessions/agents data is already loaded and visible.

## Root Cause Analysis

### Current Flow When Clicking a Session

1. **User clicks session** → `handleSessionSelectWrapper` called
2. **Navigation triggered** → `navigate(ROUTES.CHAT_SESSION(agentId, sessionId))` 
3. **URL changes** → React Router updates route params
4. **Component re-renders** → `ChatAgent` receives new `sessionId` from URL params
5. **Hooks re-execute**:
   - `useChatSession({ agentId, initialSessionId: sessionId })` called
   - `useAgentSessions(agentId)` called - returns `{ data: sessions, isLoading: sessionsLoading }`
6. **Loading state calculated**:
   - `sessionsLoading` from React Query's `isLoading`
   - Passed to `useChatLoadingState`
   - Calculates `sidebarLoading`
   - Passed to `SessionSidebar` as `loading` prop
7. **SidebarContent renders**:
   - If `loading={true}`, shows loading skeleton
   - If `loading={false}`, shows children (sessions)

### The Actual Problem

**React Query's `isLoading` behavior:**
- `isLoading = isFetching && !data` (no data AND currently fetching)
- If data exists in cache, `isLoading` should be `false`
- **HOWEVER**: There are edge cases where `isLoading` can be `true` even with cached data:
  1. **Query key changes**: When `agentId` changes, new query starts → `isLoading=true` for new query
  2. **Query disabled/re-enabled**: If query is disabled then enabled, `isLoading=true` briefly
  3. **Component remount**: If component unmounts/remounts, query resets → `isLoading=true`
  4. **Race condition**: During navigation, `sessions` array might be temporarily empty from previous render

**The real issue**: We're relying on React Query's `isLoading` flag, but we should be checking if we **actually have data** (the `sessions` array has items).

### Why Current Fixes Don't Work

1. **Hardcoding `loading={false}`**: 
   - This breaks legitimate loading states (when sessions truly aren't loaded yet)
   - **AND IT DOESN'T WORK** - the sidebar still disappears

2. **Checking `sessions.length > 0` in multiple places**: 
   - Fragile, doesn't handle edge cases
   - **AND IT DOESN'T WORK** - the sidebar still disappears

3. **SidebarContent checking children**: 
   - Good idea in theory, but doesn't solve the problem
   - The issue is that the entire sidebar structure disappears, not just the content

### Actual Behavior

- **Expected**: Header always visible, only menu items show loading skeleton IF loading
- **Actual**: Entire sidebar (including header) disappears when clicking session
- **Root cause**: Something is causing the entire `SessionSidebar` component to not render, or the `Sidebar` wrapper is being conditionally rendered

## The Correct Solution

### Principle: Header Always Visible, Content Loading Only When Needed

**Requirements:**
1. **Header must ALWAYS be visible** - never disappears
2. **Menu items show loading skeleton ONLY if**:
   - Sessions/agents for current agent are NOT loaded yet
   - AND query is actually loading
3. **Menu items NEVER show loading if**:
   - Sessions/agents for current agent are already loaded (even if switching sessions and loading messages)

### Key Insight

The problem is NOT about checking `sessions.length > 0` - that doesn't work because:
- During navigation, React Query might reset the query state
- The `sessions` array might be temporarily empty during render cycles
- Component remounting can cause state loss

**The real fix**: Check React Query's cache directly to see if data exists for the CURRENT agent, regardless of what the `sessions` array contains at render time.

### Implementation Plan

#### Step 1: Fix at the Source - Check React Query Cache Directly

**File**: `apps/client/src/pages/chat/hooks/use-chat-session.ts`

**Change**: Check React Query cache to determine if data exists for current agent:
```typescript
const { data: sessions = [], isLoading: sessionsLoading } = useAgentSessions(agentId);
const queryClient = useQueryClient();

// Check if we have cached data for THIS agent in React Query cache
// This is more reliable than checking sessions.length because:
// 1. Cache persists across render cycles
// 2. Cache exists even if component remounts
// 3. Cache is the source of truth, not the current render's data array
const hasCachedSessionsForAgent = agentId !== null
  ? queryClient.getQueryData<Session[]>(queryKeys.agents.sessions(agentId)) !== undefined
  : false;

// Only consider it loading if:
// 1. We don't have cached data for this agent
// 2. AND the query is actually loading
const actualSessionsLoading = hasCachedSessionsForAgent ? false : sessionsLoading;

return { ..., sessionsLoading: actualSessionsLoading };
```

**Rationale**: React Query cache is the source of truth. If cache has data for the current agent, we're not loading - we have data, regardless of what the `sessions` array contains during render.

#### Step 2: Fix `useChatLoadingState` to Check Cache, Not Array Length

**File**: `apps/client/src/pages/chat/hooks/use-chat-loading-state.ts`

**Change**: Check React Query cache directly, not array length:
```typescript
// Check cache for current agent's sessions
const hasCachedSessionsForCurrentAgent = agentId !== null
  ? queryClient.getQueryData<Session[]>(queryKeys.agents.sessions(agentId)) !== undefined
  : false;

const sidebarLoading =
  hasCachedSessionsForCurrentAgent
    ? false // If cache has data for this agent, we're not loading
    : (agentsLoading && !hasCachedAgents) ||
      (sessionsLoading && agentId !== null);
```

**Rationale**: Cache is source of truth. Array length can be 0 during render cycles, but cache persists.

#### Step 3: Ensure `SidebarContent` Never Hides Header

**File**: `packages/ui/src/components/layout/SidebarContent.tsx`

**Current**: Already checks children - this is good as a defensive layer, but the real fix is at the source.

**Note**: `SidebarHeader` is rendered OUTSIDE `SidebarContent`, so it should always be visible. If header is disappearing, the issue is elsewhere (possibly component remounting or conditional rendering of entire `SessionSidebar`).

#### Step 4: Ensure Sidebar Components Always Render Structure

**Files**: 
- `apps/client/src/pages/chat/components/session/SessionSidebar.tsx`
- `apps/client/src/pages/config/components/agent/AgentSidebar.tsx`

**Current**: These components always render `Sidebar` + `SidebarHeader` + `SidebarContent` - this is correct.

**Issue**: If entire sidebar disappears, it might be:
1. Component remounting causing state loss
2. Conditional rendering of `SessionSidebar` itself
3. React key changes causing remount

**Fix**: Ensure `loading` prop passed to `SidebarContent` is correctly calculated (from Step 1), so it's never `true` when data exists in cache.

#### Step 5: Apply Same Fix to Agent Config

**File**: `apps/client/src/pages/config/components/agent/AgentConfig.tsx`

**Change**: Check React Query cache for agents, not array length:
```typescript
const queryClient = useQueryClient();
const hasCachedAgents = queryClient.getQueryData<Agent[]>(queryKeys.agents.list()) !== undefined;

// Only show loading if we don't have cached agents AND query is loading
const shouldShowSidebarLoading = hasCachedAgents ? false : loadingAgents;
<AgentSidebar loading={shouldShowSidebarLoading} ... />
```

**Rationale**: Same as sessions - check cache, not array length.

## Implementation Order

1. **Fix `useChatSession`** - Check React Query cache to determine `sessionsLoading` (not array length)
2. **Fix `useChatLoadingState`** - Check React Query cache for current agent's sessions (not array length)
3. **Fix `AgentConfig`** - Check React Query cache for agents (not array length)
4. **Verify `SidebarContent`** - Already checks children (good defensive layer)
5. **Verify sidebar components** - Ensure they always render structure (they do)

## Expected Behavior After Fix

### When Sessions Are Already Loaded for Current Agent:
- User clicks session → URL changes → Component re-renders
- React Query cache has sessions for current `agentId`
- `sessionsLoading` = `false` (because cache has data)
- `sidebarLoading` = `false`
- **Sidebar header always visible**
- **Sidebar content shows sessions** (no loading skeleton)

### When Sessions Are Not Loaded:
- Initial page load or switching to new agent with no cached sessions
- React Query cache has no data for current `agentId`
- `sessionsLoading` = `true` (from React Query)
- `sidebarLoading` = `true`
- **Sidebar header always visible**
- **Sidebar content shows loading skeleton** until data loads

### When Switching Agents:
- Agent changes → `agentId` changes → New query for new agent
- Check cache for new `agentId`:
  - **If cached**: `sessionsLoading` = `false` → No loading, show cached sessions
  - **If not cached**: `sessionsLoading` = `true` → Show loading skeleton
- **Sidebar header always visible in both cases**

## Testing Checklist

- [ ] Click session when sessions already loaded → Sidebar stays visible
- [ ] Switch agents when sessions cached → Sidebar stays visible
- [ ] Initial page load → Sidebar shows loading until sessions load
- [ ] Switch to agent with no cached sessions → Sidebar shows loading
- [ ] Same behavior in AgentConfig sidebar

## Key Principles

1. **Cache is source of truth**: Check React Query cache, not array length
2. **Header always visible**: Sidebar structure (header + content) always renders
3. **Content loading only when needed**: Only show loading skeleton if cache has no data for current agent
4. **Universal**: Same pattern works for all sidebars (sessions, agents, etc.)
5. **Robust**: Handles edge cases (navigation, remounts, query key changes) because cache persists

## Why This Works

- **React Query cache persists** across render cycles, remounts, and navigation
- **Array length can be 0** during render cycles even when cache has data
- **Cache check is reliable** - if cache has data for current agent, we have data
- **Header always renders** because it's outside the loading logic
- **Content shows loading** only when cache truly has no data for current agent
