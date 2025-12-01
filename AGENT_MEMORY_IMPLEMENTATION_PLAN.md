# Agent Memory Feature Implementation Plan

## Executive Summary

This document outlines the implementation plan for an enhanced agent memory system that stores persistent memories across all chat sessions for each bot, with improved token efficiency and user-friendly management capabilities.

## Current State Analysis

### Current Implementation

1. **Memory Storage**
   - Memories are stored per session (`sessionId` in `memory_chunks` table)
   - Each memory chunk contains: `id`, `sessionId`, `chunk` (text), `vector` (embedding), `createdAt`
   - Memories are scoped to individual sessions, not shared across sessions

2. **Memory Creation**
   - Triggered every 5 messages (`MEMORY_SAVE_INTERVAL = 5`)
   - Creates chunks by combining the last 5 messages: `"role: content\nrole: content..."`
   - Generates embeddings using `text-embedding-3-small` (1536 dimensions)
   - Stores both vector array and pgvector format

3. **Memory Retrieval**
   - Uses vector similarity search via pgvector (`findSimilarForBot`)
   - Searches across all sessions for a bot/user combination
   - Retrieves top 5 similar memories (`MAX_SIMILAR_MEMORIES = 5`)
   - Similarity threshold: 0.5 (`SIMILARITY_THRESHOLD = 0.5`)
   - Memories are injected as system messages in the format:
     ```
     Relevant context from previous conversations:
     1. [memory chunk 1]
     2. [memory chunk 2]
     ...
     ```

4. **UI Display**
   - Embeddings are shown in bot config form
   - Displays: Session ID, creation date, and raw chunk text
   - Allows deletion of individual embeddings
   - No editing capability

### Current Limitations

1. **Session-Scoped Memories**: Memories are tied to sessions, making cross-session recall less effective
2. **Verbose Memory Chunks**: Full message concatenation creates large chunks, increasing token usage
3. **No Summarization**: Memories accumulate without deduplication or compression
4. **No Context Metadata**: Missing structured information about when/where memories were created
5. **Limited User Control**: No ability to edit or view memories in a user-friendly format

## Proposed Feature Requirements

### Core Requirements

1. **Bot-Level Memory Persistence**
   - Each bot stores memories across ALL chat sessions
   - Memories persist independently of session lifecycle
   - When a session is restored, current bot memories are loaded alongside session history

2. **Structured Memory Format**
   - Each memory stores:
     - **Date**: When the memory was created
     - **Context**: Session information (session ID, session name if available)
     - **Key Point**: Concise insight extracted from conversation
   - Format: `"<date> - <user/agent> <key insight>"`

3. **Token Optimization**
   - Memories should be concise snippets (50-200 characters ideally)
   - Focus on key insights: main topics, user preferences, agent responses
   - Avoid full conversation transcripts

4. **Memory Update Strategy**
   - Update memories after every 10 messages in a session
   - Every 10th update (i.e., every 100 messages) triggers summarization:
     - Deduplicates similar memories
     - Summarizes related memories into shorter, more concise entries
     - Removes redundant information

5. **Memory Integration**
   - Memories are considered when generating responses
   - Retrieved via vector similarity search
   - Injected into system context before generating response

6. **User Interface**
   - Replace embeddings UI with user-friendly memory list
   - Display format: `"<date> - user likes foxes"` or `"<date> - agent said he had an icecream today"`
   - Allow deletion of individual memories
   - Allow modification/editing of memories
   - Show context (session info) for each memory

## Database Schema Changes

### New Memory Model

```prisma
model AgentMemory {
  id              Int                          @id @default(autoincrement())
  botId           Int                          @map("bot_id")
  userId          String                       @map("user_id")
  keyPoint        String                       @map("key_point") // The concise insight
  context         Json?                        // { sessionId, sessionName, messageCount }
  vectorEmbedding Unsupported("vector(1536)")? @map("vector_embedding")
  createdAt       DateTime                     @default(now()) @map("created_at")
  updatedAt       DateTime                     @updatedAt @map("updated_at")
  updateCount     Int                          @default(0) @map("update_count") // Track update cycles
  
  bot             Bot                          @relation(fields: [botId], references: [id], onDelete: Cascade)
  user            User                         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([botId, userId])
  @@index([botId, userId, createdAt(sort: Desc)])
  @@map("agent_memories")
}
```

### Migration Strategy

1. **Create new `agent_memories` table**
2. **Remove old `memory_chunks` table**:
   - Drop the `memory_chunks` table and related indexes
   - Remove `MemoryChunk` model from Prisma schema
   - Clean up any references to the old memory system

### Indexes

- Primary index on `(botId, userId)` for fast bot-level queries
- Secondary index on `(botId, userId, createdAt DESC)` for chronological retrieval
- Vector index on `vector_embedding` using HNSW for similarity search

## Backend Implementation

### 1. Database Layer

#### New Repository: `AgentMemoryRepository`

**Location**: `packages/api/src/memory/agent-memory.repository.ts`

**Key Methods**:
```typescript
- create(botId, userId, keyPoint, context, vector): Promise<AgentMemory>
- findAllByBotId(botId, userId, limit?): Promise<AgentMemory[]>
- findSimilar(botId, userId, queryVector, topK, threshold): Promise<AgentMemory[]>
- update(id, keyPoint): Promise<AgentMemory>
- delete(id): Promise<void>
- countByBotId(botId, userId): Promise<number>
- findForSummarization(botId, userId, limit): Promise<AgentMemory[]> // Get memories needing summarization
```

#### Remove `MemoryRepository`

- Delete `packages/api/src/memory/memory.repository.ts`
- Remove all references to `MemoryRepository` from services
- Update imports throughout the codebase

### 2. Service Layer

#### New Service: `AgentMemoryService`

**Location**: `packages/api/src/memory/agent-memory.service.ts`

**Key Methods**:
```typescript
- extractKeyInsights(messages: Message[]): Promise<string[]> // Extract insights from last 10 messages
- createMemory(botId, userId, sessionId, messages): Promise<AgentMemory>
- shouldSummarize(botId, userId): Promise<boolean> // Check if 10th update cycle
- summarizeMemories(botId, userId, apiKey): Promise<void> // Deduplicate and summarize
- getMemoriesForContext(botId, userId, queryText, apiKey): Promise<string[]> // Get relevant memories
```

**Key Insight Extraction Logic**:
```typescript
// Use OpenAI to extract key insights from conversation
// Prompt: "Extract 1-3 key insights from this conversation. 
// Focus on: user preferences, main topics, important facts, agent responses.
// Format as short bullet points (max 100 chars each)."
```

**Summarization Logic**:
```typescript
// Every 100 messages (10th update):
// 1. Get all memories for bot/user
// 2. Group similar memories using embeddings
// 3. Use OpenAI to summarize groups into single concise memories
// 4. Delete old memories, create new summarized ones
// 5. Reset update counter
```

#### Replace Memory System in `ChatService`

**Changes to `sendMessage` method**:

1. **Memory Retrieval** (replace lines 192-215):
   - Remove `memoryRepository.findSimilarForBot` call
   - Replace with `agentMemoryService.getMemoriesForContext`
   - Format memories as: `"<date> - <key point>"`
   - Remove `MemoryRepository` dependency from constructor

2. **Memory Creation** (replace lines 442-474):
   - Change interval from 5 to 10 messages
   - Remove `createMemoryChunkFromMessages` call
   - Replace with `agentMemoryService.extractKeyInsights`
   - Create multiple `AgentMemory` entries (one per insight)
   - Store context: `{ sessionId, sessionName, messageCount }`
   - Check if summarization is needed after creation
   - Remove `memoryRepository.create` call

3. **Session Loading** (in `getChatHistory`):
   - Load bot memories alongside session messages
   - Return memories in response (optional, for UI display)

4. **Constructor Updates**:
   - Remove `MemoryRepository` from constructor
   - Add `AgentMemoryService` to constructor

### 3. API Endpoints

#### New Endpoints

**Location**: `packages/api/src/memory/agent-memory.controller.ts`

```typescript
GET    /api/bots/:botId/memories
  - Get all memories for a bot
  - Query params: limit, offset
  - Returns: AgentMemory[]

GET    /api/bots/:botId/memories/:memoryId
  - Get specific memory

PUT    /api/bots/:botId/memories/:memoryId
  - Update memory key point
  - Body: { keyPoint: string }

DELETE /api/bots/:botId/memories/:memoryId
  - Delete memory

POST   /api/bots/:botId/memories/summarize
  - Manually trigger summarization
```

#### Remove Old Endpoints

**Location**: `packages/api/src/bot/bot.controller.ts`

- Remove `/api/bots/:id/embeddings` GET endpoint
- Remove `/api/bots/:id/embeddings/:embeddingId` DELETE endpoint
- Remove `getEmbeddings` and `deleteEmbedding` methods from `BotService`

### 4. Constants Update

**Location**: `packages/api/src/common/constants/api.constants.ts`

```typescript
export const MEMORY_CONFIG = {
  SIMILARITY_THRESHOLD: 0.5,
  MAX_SIMILAR_MEMORIES: 5,
  MEMORY_SAVE_INTERVAL: 10, // Changed from 5 to 10
  MEMORY_SUMMARIZATION_INTERVAL: 10, // Every 10th update (100 messages)
  MAX_KEY_INSIGHTS_PER_UPDATE: 3, // Max insights extracted per update
  MAX_MEMORY_LENGTH: 200, // Max characters per memory
} as const;
```

## Frontend Implementation

### 1. Type Definitions

**Location**: `packages/client/src/types/chat.types.ts`

```typescript
export interface AgentMemory {
  id: number;
  botId: number;
  userId: string;
  keyPoint: string;
  context?: {
    sessionId?: number;
    sessionName?: string | null;
    messageCount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Remove Embedding interface - no longer needed
```

### 2. Service Layer

**Location**: `packages/client/src/services/memory.service.ts` (new file)

```typescript
export class MemoryService {
  static async getMemories(botId: number): Promise<AgentMemory[]>
  static async getMemory(botId: number, memoryId: number): Promise<AgentMemory>
  static async updateMemory(botId: number, memoryId: number, keyPoint: string): Promise<AgentMemory>
  static async deleteMemory(botId: number, memoryId: number): Promise<void>
  static async summarizeMemories(botId: number): Promise<void>
}
```

**Update**: `packages/client/src/constants/api.constants.ts`

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  BOT_MEMORIES: (botId: number) => `/api/bots/${botId}/memories`,
  BOT_MEMORY: (botId: number, memoryId: number) => `/api/bots/${botId}/memories/${memoryId}`,
  BOT_MEMORIES_SUMMARIZE: (botId: number) => `/api/bots/${botId}/memories/summarize`,
  // Remove BOT_EMBEDDINGS and BOT_EMBEDDING endpoints
} as const;
```

### 3. UI Components

#### Replace `EmbeddingsList` with `MemoriesList`

**Location**: `packages/client/src/components/bot/MemoriesList.tsx` (new file)

**Features**:
- Display memories in user-friendly format: `"<date> - <key point>"`
- Show context tooltip: session info on hover
- Edit button for each memory (opens inline editor or modal)
- Delete button for each memory
- Group by date (optional)
- Search/filter functionality (optional)

**Component Structure**:
```tsx
interface MemoriesListProps {
  memories: AgentMemory[];
  loading: boolean;
  editingId: number | null;
  deletingId: number | null;
  onEdit: (memoryId: number, newKeyPoint: string) => void;
  onDelete: (memoryId: number) => void;
  onRefresh: () => void;
  botId: number;
}

// Display format:
// <div>
//   <div className="text-xs text-text-tertiary">
//     {formatDate(memory.createdAt)}
//   </div>
//   <div className="text-sm text-text-primary">
//     {memory.keyPoint}
//   </div>
//   <div className="text-xs text-text-tertiary">
//     Session: {memory.context?.sessionName || `#${memory.context?.sessionId}`}
//   </div>
//   <button onClick={handleEdit}>Edit</button>
//   <button onClick={handleDelete}>Delete</button>
// </div>
```

#### Update `BotConfigForm`

**Location**: `packages/client/src/components/bot/BotConfigForm.tsx`

**Changes**:
- Remove `EmbeddingsList` import and component usage
- Remove `embeddings` state and related code
- Remove `loadEmbeddingsLazy` function
- Remove `handleDeleteEmbedding` function
- Add `MemoriesList` import and component
- Add `memories: AgentMemory[]` state
- Add `loadMemoriesLazy` function
- Add `handleDeleteMemory` function
- Add `handleEditMemory` function
- Update section title from "Embeddings" to "Memories"
- Remove `Embedding` type imports

### 4. Memory Display Format

**Format Examples**:
```
2024-01-15 - user likes foxes
2024-01-15 - agent said he had an icecream today
2024-01-16 - user mentioned they work as a software engineer
2024-01-16 - discussed favorite programming languages
```

**Date Formatting**:
- Use relative dates for recent memories: "Today", "Yesterday", "2 days ago"
- Use absolute dates for older memories: "Jan 15, 2024"

## Token Usage Analysis

### Current Token Usage (Baseline)

**Without Memories**:
- System prompt: ~50-200 tokens
- Conversation history: ~100-500 tokens per message pair
- **Total per request**: ~150-700 tokens (varies with conversation length)

**With Current Memory System**:
- Memory chunks: ~200-500 tokens per chunk (5 chunks max = 1000-2500 tokens)
- **Total per request**: ~1150-3200 tokens
- **Overhead**: ~1000-2500 tokens (67-357% increase)

### Proposed Token Usage

**With New Memory System**:
- Memory insights: ~20-50 tokens per memory (5 memories max = 100-250 tokens)
- **Total per request**: ~250-950 tokens
- **Overhead**: ~100-250 tokens (67-36% increase)

### Token Savings

1. **Per Request Savings**: ~900-2250 tokens (90% reduction in memory overhead)
2. **Summarization Impact**: 
   - Before: 100 memories × 200 tokens = 20,000 tokens
   - After summarization: 20 memories × 50 tokens = 1,000 tokens
   - **Savings**: 95% reduction in stored memory tokens

### Cost Impact (Example)

**Assumptions**:
- GPT-4o-mini: $0.15 per 1M input tokens
- 1000 requests per month
- Average 5 memories per request

**Current System**:
- Memory overhead: 1000 requests × 2000 tokens = 2M tokens
- Cost: $0.30/month for memory overhead

**Proposed System**:
- Memory overhead: 1000 requests × 150 tokens = 150K tokens
- Cost: $0.023/month for memory overhead
- **Savings**: $0.277/month (92% reduction)

**At Scale** (10,000 requests/month):
- Current: $3.00/month
- Proposed: $0.23/month
- **Savings**: $2.77/month (92% reduction)

## Implementation Steps

### Phase 1: Database & Backend Core (Week 1)

1. **Database Migration**
   - [ ] Create Prisma schema for `AgentMemory` model
   - [ ] Remove `MemoryChunk` model from Prisma schema
   - [ ] Generate and run migration (creates `agent_memories`, drops `memory_chunks`)
   - [ ] Create indexes (botId/userId, vector)

2. **Repository Layer**
   - [ ] Create `AgentMemoryRepository`
   - [ ] Implement CRUD operations
   - [ ] Implement similarity search
   - [ ] Add summarization query methods
   - [ ] Remove `MemoryRepository` file and all references

3. **Service Layer**
   - [ ] Create `AgentMemoryService`
   - [ ] Implement key insight extraction (OpenAI integration)
   - [ ] Implement memory creation logic
   - [ ] Implement summarization logic
   - [ ] Update `ChatService` to use new memory system
   - [ ] Remove all references to `MemoryRepository` from `ChatService`
   - [ ] Remove `getEmbeddings` and `deleteEmbedding` from `BotService`

4. **API Endpoints**
   - [ ] Create `AgentMemoryController`
   - [ ] Implement GET, PUT, DELETE endpoints
   - [ ] Add summarization endpoint
   - [ ] Remove embeddings endpoints from bot controller
   - [ ] Remove `getEmbeddings` and `deleteEmbedding` from `BotService`

### Phase 2: Frontend Implementation (Week 2)

1. **Type Definitions**
   - [ ] Add `AgentMemory` interface
   - [ ] Remove `Embedding` interface
   - [ ] Update API constants (remove embeddings endpoints)

2. **Service Layer**
   - [ ] Create `MemoryService`
   - [ ] Implement API calls
   - [ ] Remove `getEmbeddings` and `deleteEmbedding` from `BotService` (frontend)

3. **UI Components**
   - [ ] Create `MemoriesList` component
   - [ ] Implement edit functionality
   - [ ] Implement delete functionality
   - [ ] Add date formatting
   - [ ] Update `BotConfigForm` to use memories
   - [ ] Remove `EmbeddingsList` component
   - [ ] Remove all embeddings-related code from `BotConfigForm`

### Phase 3: Integration & Testing (Week 3)

1. **Integration**
   - [ ] Test memory creation in chat flow
   - [ ] Test memory retrieval and injection
   - [ ] Test summarization trigger
   - [ ] Test UI display and editing

2. **Testing**
   - [ ] Unit tests for repository
   - [ ] Unit tests for service
   - [ ] Integration tests for API endpoints
   - [ ] E2E tests for UI

3. **Cleanup**
   - [ ] Remove `MemoryRepository` and all references
   - [ ] Remove `MemoryChunk` model from Prisma schema
   - [ ] Drop `memory_chunks` table via migration
   - [ ] Remove embeddings endpoints and service methods
   - [ ] Remove `Embedding` type from frontend
   - [ ] Remove `EmbeddingsList` component
   - [ ] Documentation updates

### Phase 4: Optimization & Polish (Week 4)

1. **Performance**
   - [ ] Optimize similarity search queries
   - [ ] Add caching for frequently accessed memories
   - [ ] Monitor token usage

2. **UX Improvements**
   - [ ] Add search/filter for memories
   - [ ] Add bulk operations (delete multiple)
   - [ ] Improve date formatting
   - [ ] Add loading states

3. **Documentation**
   - [ ] Update API documentation
   - [ ] Update user guide
   - [ ] Add developer documentation

## Risk Assessment & Mitigation

### Risks

1. **Token Usage Still High**
   - **Risk**: Summarization may not be effective enough
   - **Mitigation**: Monitor token usage, adjust summarization prompts, add length limits

3. **Memory Quality**
   - **Risk**: Extracted insights may miss important information
   - **Mitigation**: Iterate on extraction prompts, allow user editing

4. **Performance Impact**
   - **Risk**: Summarization on every 100 messages may slow down system
   - **Mitigation**: Run summarization asynchronously, add rate limiting

## Success Metrics

1. **Token Efficiency**
   - Target: <200 tokens per request for memory overhead (vs current ~2000)
   - Measure: Average tokens per request over 1000 requests

2. **Memory Quality**
   - Target: 90% of memories contain actionable insights
   - Measure: Manual review of 100 random memories

3. **User Satisfaction**
   - Target: Users can find and edit relevant memories easily
   - Measure: User feedback, time to find/edit memory

4. **System Performance**
   - Target: <100ms for memory retrieval
   - Target: Summarization completes in <5 seconds
   - Measure: API response times

## Future Enhancements

1. **Memory Categories**: Tag memories by type (preference, fact, event, etc.)
2. **Memory Expiration**: Auto-delete old/irrelevant memories
3. **Memory Importance Scoring**: Prioritize more important memories
4. **Cross-Bot Memory Sharing**: Share memories between related bots
5. **Memory Analytics**: Dashboard showing memory usage and effectiveness
6. **Advanced Summarization**: Use fine-tuned models for better summarization
7. **Memory Templates**: Pre-defined memory formats for common use cases

## Conclusion

This implementation plan provides a comprehensive roadmap for transforming the current session-scoped memory system into a bot-level persistent memory system with improved token efficiency and user experience. The phased approach allows for incremental development and testing, minimizing risk while delivering value at each stage.
