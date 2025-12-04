# Memory Feature Improvement Plan

## Executive Summary

This document outlines the current state of the memory feature, identifies issues preventing memories from being visible in the agent config UI, and provides a comprehensive improvement plan to ensure memories are automatically fetched, displayed, and updated as chat continues.

## Current State Analysis

### How Memories Are Generated

1. **Trigger**: Memories are created automatically in `chat.service.ts` when:
   - `allMessages.length % MEMORY_SAVE_INTERVAL === 0` (every 10 messages)
   - Currently set to `MEMORY_SAVE_INTERVAL = 10` in `api.constants.ts`

2. **Extraction Process**:
   - `AgentMemoryService.createMemory()` is called after message processing
   - Uses `MemoryExtractionService.extractKeyInsights()` to extract insights from conversation
   - Each insight is embedded using OpenAI embeddings API
   - Stored in `agent_memories` table with vector embeddings for similarity search

3. **Storage**:
   - Database: `agent_memories` table (Prisma schema)
   - Fields: `id`, `agentId`, `userId`, `keyPoint`, `context`, `vectorEmbedding`, `createdAt`, `updatedAt`, `updateCount`
   - Vector embeddings enable semantic similarity search

### How Memories Are Used in Message Context

1. **Retrieval**:
   - When sending a message, `chat.service.ts` calls `agentMemoryService.getMemoriesForContext()`
   - Uses `MemoryRetrievalService` which:
     - Generates embedding for the user's message
     - Finds similar memories using vector similarity search
     - Returns top 5 memories above similarity threshold (0.5)

2. **Application**:
   - Relevant memories are passed to `MessagePreparationService.prepareMessagesForOpenAI()`
   - Added as a system message with format: "Relevant context from previous conversations:\n1. [date] - [memory]\n2. [date] - [memory]..."
   - Inserted after existing system messages but before user message

### How Memories Are Presented in UI

1. **Frontend Query**:
   - `useAgentMemories()` hook in `use-agents.ts` fetches memories using React Query
   - Query key: `queryKeys.agents.memories(agentId)`
   - Enabled only when: `agentId !== null && agentId > 0` (valid saved agent)
   - Uses `MemoryService.getMemories()` which calls `/api/agents/:agentId/memories`

2. **Display**:
   - `MemoriesSection` component shows memories list
   - `MemoriesList` component renders individual memory cards
   - Shows: date, session info, key point text
   - Supports edit and delete operations

3. **Refresh Mechanism**:
   - Manual refresh button in `MemoriesSection` header
   - Calls `handleRefreshMemories()` which invalidates the query
   - No automatic refresh currently

## Root Cause Analysis: Why Memory Field Stays Empty

### Primary Issues

1. **No Automatic Invalidation After Chat Messages**:
   - `useSendMessage()` mutation only invalidates:
     - `queryKeys.chat.history()`
     - `queryKeys.chat.sessions()`
     - `queryKeys.agents.sessions()`
   - **Missing**: `queryKeys.agents.memories(agentId)` invalidation
   - Result: Memories created during chat don't appear in UI until manual refresh

2. **No StaleTime Configuration**:
   - `useAgentMemories()` doesn't set a `staleTime`
   - Uses default `DEFAULT_STALE_TIME = 10 minutes`
   - Memories might not refetch when navigating back to agent config

3. **No Refetch on Focus/Reconnect**:
   - Query doesn't have `refetchOnWindowFocus` or `refetchOnReconnect` enabled
   - If user switches tabs and returns, memories won't update

4. **Query Not Enabled for New Agents**:
   - Query is disabled when `agentId < 0` (new/unsaved agents)
   - This is correct behavior, but should be documented

5. **No Polling/Background Updates**:
   - No automatic polling to check for new memories
   - User must manually refresh to see new memories created during chat

## Improvement Plan

### Phase 1: Automatic Memory Fetching and Display

#### 1.1 Add Memory Invalidation to Chat Mutations

**File**: `apps/client/src/hooks/mutations/use-chat-mutations.ts`

**Changes**:
- Add memory query invalidation to `useSendMessage()` mutation
- Invalidate memories when messages are sent (memories might be created)

```typescript
onSuccess: (_data, variables) => {
  // Existing invalidations...
  queryClient.invalidateQueries({
    queryKey: queryKeys.chat.history(
      variables.agentId,
      variables.sessionId
    ),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.chat.sessions(variables.agentId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.agents.sessions(variables.agentId),
  });
  
  // NEW: Invalidate memories to refetch after potential memory creation
  queryClient.invalidateQueries({
    queryKey: queryKeys.agents.memories(variables.agentId),
  });
}
```

**Rationale**: Memories are created every 10 messages, so we should invalidate the query after each message to ensure UI updates when memories are created.

#### 1.2 Configure StaleTime and Refetch Behavior

**File**: `apps/client/src/hooks/queries/use-agents.ts`

**Changes**:
- Add appropriate `staleTime` for memories query
- Enable `refetchOnWindowFocus` and `refetchOnReconnect`
- Consider shorter staleTime since memories can be created frequently

```typescript
export function useAgentMemories(agentId: number | null) {
  const { isSignedIn, isLoaded } = useAuth();
  const tokenReady = useTokenReady();

  const isValidAgentId = agentId !== null && agentId > 0;

  return useQuery<AgentMemory[]>({
    queryKey: queryKeys.agents.memories(agentId!),
    queryFn: () => MemoryService.getMemories(agentId!),
    enabled: isValidAgentId && isSignedIn && isLoaded && tokenReady,
    staleTime: 2 * 60 * 1000, // 2 minutes - memories can be created frequently
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when network reconnects
  });
}
```

**Rationale**: 
- Shorter staleTime ensures memories are fresh when user navigates to config
- Refetch on focus/reconnect ensures UI stays up-to-date

#### 1.3 Add Memory StaleTime Constant

**File**: `apps/client/src/constants/cache.constants.ts`

**Changes**:
- Add `MEMORIES_STALE_TIME` constant
- Use consistent cache configuration

```typescript
// Memories - can be created frequently during chat
export const MEMORIES_STALE_TIME = 2 * MINUTE; // 2 minutes
```

**Update**: Use this constant in `useAgentMemories()` hook.

### Phase 2: Enhanced Memory Updates During Chat

#### 2.1 Optimistic Memory Updates (Optional Enhancement)

**Consideration**: When memories are created on the backend, we could optimistically update the UI. However, this requires:
- Backend to return newly created memories in chat response
- Or use a WebSocket/SSE for real-time updates

**Recommendation**: Defer to Phase 3 if needed. Phase 1 invalidation should be sufficient.

#### 2.2 Background Refetch When Agent Config is Visible

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/AgentConfigForm.tsx`

**Changes**:
- Use `refetchInterval` when agent config form is mounted and agent is valid
- Poll for new memories every 30-60 seconds while config page is open

```typescript
const { data: memories = [], isLoading: loadingMemories } =
  useAgentMemoriesQuery(agent?.id || null, {
    refetchInterval: agent?.id && agent.id > 0 ? 30 * 1000 : false, // Poll every 30s when config is open
  });
```

**Note**: This requires updating `useAgentMemories` to accept options parameter, or creating a wrapper hook.

**Alternative Approach**: Use `useQuery` with `refetchInterval` directly in the component.

### Phase 3: Real-time Memory Updates (Future Enhancement)

#### 3.1 WebSocket/SSE Integration

**Consideration**: For real-time updates without polling, implement WebSocket or Server-Sent Events (SSE) to notify frontend when memories are created.

**Requirements**:
- Backend WebSocket/SSE endpoint for memory creation events
- Frontend WebSocket client integration
- Update React Query cache on memory creation events

**Priority**: Low - Phase 1 and 2 should provide sufficient UX improvement.

## Implementation Checklist

### Phase 1: Core Fixes (High Priority)

- [ ] **1.1** Add memory query invalidation to `useSendMessage()` mutation
  - File: `apps/client/src/hooks/mutations/use-chat-mutations.ts`
  - Test: Send message, verify memories query is invalidated

- [ ] **1.2** Configure staleTime and refetch behavior in `useAgentMemories()`
  - File: `apps/client/src/hooks/queries/use-agents.ts`
  - Add `staleTime: MEMORIES_STALE_TIME`
  - Add `refetchOnWindowFocus: true`
  - Add `refetchOnReconnect: true`

- [ ] **1.3** Add `MEMORIES_STALE_TIME` constant
  - File: `apps/client/src/constants/cache.constants.ts`
  - Value: `2 * MINUTE` (2 minutes)

- [ ] **Testing**:
  - [ ] Send 10+ messages in chat
  - [ ] Navigate to agent config
  - [ ] Verify memories appear automatically (no manual refresh needed)
  - [ ] Verify memories update when returning to config page after chat

### Phase 2: Enhanced Updates (Medium Priority)

- [ ] **2.1** Add background refetch when agent config is visible
  - File: `apps/client/src/pages/config/components/agent/AgentConfig/parts/AgentConfigForm.tsx`
  - Use `refetchInterval` option (30-60 seconds)
  - Only when agent config form is mounted and agent is valid

- [ ] **Testing**:
  - [ ] Open agent config page
  - [ ] Send messages in chat (in another tab/window)
  - [ ] Verify memories appear in config within 30-60 seconds

### Phase 3: Future Enhancements (Low Priority)

- [ ] **3.1** Research WebSocket/SSE implementation for real-time updates
- [ ] **3.2** Design memory creation event payload
- [ ] **3.3** Implement backend WebSocket/SSE endpoint
- [ ] **3.4** Implement frontend WebSocket client
- [ ] **3.5** Update React Query cache on memory events

## Expected Outcomes

After implementing Phase 1:

1. ✅ **Memories are automatically visible in agent config**
   - No manual refresh needed
   - Memories appear after being created during chat

2. ✅ **Memories update automatically**
   - Query refetches when user returns to config page
   - Query refetches on network reconnect
   - Query invalidates after each chat message

3. ✅ **Refresh button still works**
   - Manual refresh remains available
   - Useful for immediate updates without waiting for staleTime

4. ✅ **Memories are applied in message context**
   - Already working correctly in backend
   - No changes needed

5. ✅ **Memories update as chat continues**
   - Query invalidates after each message
   - New memories appear in UI automatically

## Technical Considerations

### Query Invalidation Strategy

**Current**: Only invalidates on manual refresh or when query becomes stale (10 minutes)

**After Phase 1**: Invalidates after each chat message, ensuring UI updates when memories are created (every 10 messages)

**Trade-off**: Slightly more network requests, but ensures UI stays in sync. React Query's caching will prevent unnecessary requests.

### StaleTime Configuration

**Current**: Uses default 10 minutes

**After Phase 1**: 2 minutes - balances freshness with performance

**Rationale**: 
- Memories can be created every 10 messages
- User might send 10 messages in 2-5 minutes
- 2 minutes ensures memories are fresh when navigating to config
- Still benefits from React Query caching

### Refetch Behavior

**Added**:
- `refetchOnWindowFocus: true` - Updates when user returns to tab
- `refetchOnReconnect: true` - Updates when network reconnects

**Rationale**: Ensures UI stays up-to-date even if user switches tabs or loses connection.

## Testing Strategy

### Unit Tests

1. **Memory Query Hook**:
   - Test query is enabled/disabled based on agentId
   - Test staleTime configuration
   - Test refetch behavior

2. **Chat Mutations**:
   - Test memory query invalidation on message send
   - Verify correct query key is invalidated

### Integration Tests

1. **Memory Display Flow**:
   - Create agent
   - Send 10+ messages in chat
   - Navigate to agent config
   - Verify memories appear automatically

2. **Memory Update Flow**:
   - Open agent config (memories visible)
   - Send messages in chat (in another tab)
   - Return to config tab
   - Verify memories update automatically

3. **Manual Refresh**:
   - Verify refresh button still works
   - Verify refresh immediately updates memories

## Migration Notes

### Breaking Changes

None - all changes are additive or improve existing behavior.

### Backward Compatibility

- Existing manual refresh functionality remains unchanged
- All existing memory operations (edit, delete) continue to work
- No API changes required

### Rollout Strategy

1. Implement Phase 1 changes
2. Test thoroughly in development
3. Deploy to staging for QA
4. Monitor query performance and network usage
5. Deploy to production

## Success Metrics

### Before Implementation

- ❌ Memories only visible after manual refresh
- ❌ User must remember to refresh to see new memories
- ❌ Memories might be 10+ minutes stale

### After Phase 1 Implementation

- ✅ Memories automatically visible after creation
- ✅ No manual refresh needed (but still available)
- ✅ Memories are fresh (max 2 minutes stale)
- ✅ Memories update when returning to config page

## Conclusion

The primary issue is that memory queries are not invalidated after chat messages, preventing the UI from automatically updating when memories are created. Phase 1 fixes address this core issue with minimal changes and maximum impact.

Phase 2 enhancements provide additional UX improvements with background polling, while Phase 3 represents future enhancements for real-time updates.

**Recommended Implementation Order**:
1. Implement Phase 1 (Core Fixes) - **Immediate Priority**
2. Evaluate Phase 1 results
3. Implement Phase 2 if needed - **Medium Priority**
4. Consider Phase 3 for future - **Low Priority**
