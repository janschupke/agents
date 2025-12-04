# Database Schema Comprehensive Analysis & Improvement Plan

## Executive Summary

This document analyzes the entire database schema for maintainability, performance, and design improvements. Key findings:

1. **JSONB Overuse**: Multiple tables use JSONB for structured data that should be normalized
2. **Missing Indexes**: Several frequently queried fields lack indexes
3. **Missing Constraints**: Type safety and data integrity could be improved
4. **Denormalization Opportunities**: Some computed fields could improve query performance
5. **Large JSONB Fields**: Message rawRequest/rawResponse could benefit from archiving

---

## 1. AgentConfig Table - JSONB Key-Value Pattern

### Current State
- Uses `configKey` (string) + `configValue` (JSONB) key-value pattern
- Each config field = separate row
- N database operations per config update

### Issues
- ❌ **Performance**: N upserts per config update
- ❌ **Type Safety**: No database-level validation
- ❌ **Queryability**: Cannot efficiently query by config values
- ❌ **Indexing**: Cannot index specific config fields
- ❌ **Schema Clarity**: Database doesn't document structure

### Recommendation
**Move config fields to `agents` table as typed columns** (see `agent-config-schema-refactor-plan.md`)

**Priority**: 🔴 High

---

## 2. SystemConfig Table - JSONB Key-Value Pattern

### Current State
```prisma
model SystemConfig {
  configKey   String   @map("config_key")
  configValue Json     @map("config_value")
}
```

### Issues
- Similar to AgentConfig - JSONB for structured data
- However, system configs are truly dynamic/admin-defined
- Less critical than AgentConfig (fewer operations)

### Recommendation
**Keep JSONB** - System configs are truly dynamic and admin-defined. The flexibility is valuable here.

**Priority**: 🟡 Low (acceptable for system configs)

---

## 3. User.roles - JSON Array

### Current State
```prisma
model User {
  roles Json @default("[]") // Array of role strings: ["user", "admin"]
}
```

### Issues
- ❌ **Type Safety**: No enum constraint
- ❌ **Queryability**: Cannot efficiently query "all admins"
- ❌ **Validation**: No database-level validation of role values

### Recommendation
**Create UserRole junction table** or use PostgreSQL array with enum:

```prisma
enum UserRole {
  USER
  ADMIN
}

model User {
  roles UserRole[] @default([USER])
  // OR
  userRoles UserRoleAssignment[]
}

model UserRoleAssignment {
  userId String @map("user_id")
  role   UserRole
  user   User   @relation(fields: [userId], references: [id])
  
  @@unique([userId, role])
}
```

**Priority**: 🟡 Medium (if role-based queries become common)

---

## 4. Message Table - Large JSONB Fields

### Current State
```prisma
model Message {
  rawRequest  Json? @map("raw_request")
  rawResponse Json? @map("raw_response")
  metadata    Json?
}
```

### Issues
- ❌ **Storage**: Large JSONB fields bloat message table
- ❌ **Performance**: Loading messages loads all JSONB data
- ❌ **Queryability**: Cannot efficiently query JSONB content
- ❌ **Archiving**: Old messages with large JSONB never get archived

### Recommendation
**Option A: Separate MessageMetadata table** (preferred)
```prisma
model Message {
  // Core fields only
  id        Int
  sessionId Int
  role      String
  content   String
  createdAt DateTime
  metadata  MessageMetadata?
}

model MessageMetadata {
  id          Int      @id
  messageId   Int      @unique @map("message_id")
  rawRequest  Json?    @map("raw_request")
  rawResponse Json?    @map("raw_response")
  metadata    Json?
  message     Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
}
```

**Option B: Archive old messages**
- Move messages older than X months to `messages_archive` table
- Keep only recent messages in main table

**Priority**: 🟡 Medium (if storage/performance becomes issue)

---

## 5. Message.role - String Instead of Enum

### Current State
```prisma
model Message {
  role String // 'user' | 'assistant' | 'system'
}
```

### Issues
- ❌ **Type Safety**: No enum constraint
- ❌ **Validation**: Database doesn't enforce valid values
- ❌ **Queryability**: String comparison instead of enum

### Recommendation
**Use Prisma enum**:
```prisma
enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

model Message {
  role MessageRole
}
```

**Priority**: 🟢 Low (but easy win)

---

## 6. AgentMemory - Missing Vector Index

### Current State
```prisma
model AgentMemory {
  vectorEmbedding Unsupported("vector(1536)")? @map("vector_embedding")
  
  @@index([agentId, userId])
  @@index([agentId, userId, createdAt(sort: Desc)])
}
```

### Issues
- ⚠️ **Performance**: Vector similarity searches need HNSW index for performance
- Current indexes don't help with vector queries

### Recommendation
**Add HNSW index on vector_embedding**:
```sql
CREATE INDEX idx_agent_memories_vector_embedding 
ON agent_memories 
USING hnsw (vector_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**Priority**: 🔴 High (if vector searches are slow)

---

## 7. ChatSession - Missing Fields

### Current State
```prisma
model ChatSession {
  sessionName String? @map("session_name")
  createdAt   DateTime @default(now()) @map("created_at")
  // Missing: updatedAt, lastMessageAt
}
```

### Issues
- ❌ **Performance**: Currently uses subquery to get last message date (see `session.repository.ts`)
- ❌ **Tracking**: No `updatedAt` timestamp
- ❌ **Denormalization**: `lastMessageAt` computed on every query

### Recommendation
**Add denormalized fields**:
```prisma
model ChatSession {
  sessionName   String?    @map("session_name")
  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")
  lastMessageAt DateTime?  @map("last_message_at") // Denormalized for performance
  
  @@index([agentId, userId, lastMessageAt(sort: Desc)])
}
```

**Update logic**: Set `lastMessageAt` when messages are created/updated.

**Priority**: 🟡 Medium (performance optimization)

---

## 8. SavedWord - Missing Indexes

### Current State
```prisma
model SavedWord {
  @@index([userId])
  @@index([originalWord])
  @@index([userId, originalWord])
}
```

### Issues
- ⚠️ **Queryability**: `findAllByLanguage` queries by `agentId` but no index
- ⚠️ **Performance**: Language filtering requires JOIN with Agent table

### Recommendation
**Add indexes for common queries**:
```prisma
model SavedWord {
  agentId Int? @map("agent_id")
  
  @@index([userId, agentId]) // For language-based queries
  @@index([userId, createdAt(sort: Desc)]) // For recent words
}
```

**Consider**: Add `language` field directly to SavedWord (denormalize from Agent) if language queries are common.

**Priority**: 🟡 Medium (if language queries are slow)

---

## 9. MessageWordTranslation - Missing Indexes

### Current State
```prisma
model MessageWordTranslation {
  messageId Int @map("message_id")
  originalWord String @map("original_word")
  
  @@index([messageId])
}
```

### Issues
- ⚠️ **Queryability**: May query by `originalWord` but no index
- ⚠️ **Performance**: Word lookups might be slow

### Recommendation
**Add index on originalWord**:
```prisma
model MessageWordTranslation {
  @@index([originalWord]) // For word lookups
  @@index([messageId, originalWord]) // Composite for message+word queries
}
```

**Priority**: 🟢 Low (unless word lookups are common)

---

## 10. SavedWordSentence - Missing Indexes

### Current State
```prisma
model SavedWordSentence {
  savedWordId Int @map("saved_word_id")
  messageId   Int? @map("message_id")
  
  @@index([savedWordId])
}
```

### Issues
- ⚠️ **Queryability**: May query by `messageId` but no index

### Recommendation
**Add index on messageId**:
```prisma
model SavedWordSentence {
  @@index([messageId]) // For message-based queries
}
```

**Priority**: 🟢 Low (unless message queries are common)

---

## 11. AgentMemory.context - JSONB Field

### Current State
```prisma
model AgentMemory {
  context Json?
}
```

### Analysis
- ✅ **Acceptable**: Context is truly dynamic/variable structure
- ✅ **Usage**: Used for storing flexible context data
- ⚠️ **Queryability**: Cannot query JSONB content efficiently (but may not need to)

### Recommendation
**Keep JSONB** - Context structure is variable and doesn't need querying.

**Priority**: ✅ No change needed

---

## 12. Agent.agentType - String Instead of Enum

### Current State
```prisma
model Agent {
  agentType String? @map("agent_type") // 'general' | 'language_assistant'
}
```

### Issues
- ❌ **Type Safety**: No enum constraint
- ❌ **Validation**: Database doesn't enforce valid values

### Recommendation
**Use Prisma enum**:
```prisma
enum AgentType {
  GENERAL
  LANGUAGE_ASSISTANT
}

model Agent {
  agentType AgentType? @map("agent_type") @default(GENERAL)
}
```

**Priority**: 🟢 Low (but easy win)

---

## 13. Missing Composite Indexes

### ChatSession
- Current: `@@index([userId])`, `@@index([agentId])`
- **Add**: `@@index([userId, agentId, createdAt(sort: Desc)])` for user's sessions by agent

### Message
- Current: `@@index([sessionId, createdAt(sort: Desc)])`
- **Consider**: `@@index([sessionId, role, createdAt])` if filtering by role is common

### SavedWord
- Current: `@@index([userId, originalWord])`
- **Add**: `@@index([userId, agentId, createdAt(sort: Desc)])` for agent-based queries

**Priority**: 🟡 Medium (performance optimization)

---

## 14. Missing Check Constraints

### AgentConfig (if keeping JSONB)
- No validation of config values at DB level

### Message.role
- No CHECK constraint for valid roles

### Agent.agentType
- No CHECK constraint for valid types

### Recommendation
**Add CHECK constraints** for enums that remain as strings:
```sql
ALTER TABLE agents ADD CONSTRAINT check_agent_type 
  CHECK (agent_type IN ('general', 'language_assistant') OR agent_type IS NULL);

ALTER TABLE messages ADD CONSTRAINT check_message_role 
  CHECK (role IN ('user', 'assistant', 'system'));
```

**Priority**: 🟡 Medium (data integrity)

---

## 15. Missing Foreign Key Indexes

### Analysis
All foreign keys should have indexes for JOIN performance. Current state:
- ✅ Most FKs have indexes
- ⚠️ Verify all FKs are indexed

**Priority**: 🟢 Low (verify existing indexes)

---

## Priority Summary

### 🔴 High Priority
1. **AgentConfig → Move to Agent table** (performance, type safety)
2. **AgentMemory → Add HNSW vector index** (if vector searches are slow)

### 🟡 Medium Priority
3. **ChatSession → Add lastMessageAt denormalization** (performance)
4. **SavedWord → Add agentId indexes** (if language queries are common)
5. **Message → Separate metadata table** (if storage is issue)
6. **Add CHECK constraints** (data integrity)

### 🟢 Low Priority
7. **Message.role → Use enum** (type safety, easy win)
8. **Agent.agentType → Use enum** (type safety, easy win)
9. **User.roles → Normalize** (if role queries become common)
10. **Add composite indexes** (performance optimization)
11. **MessageWordTranslation/SavedWordSentence → Add indexes** (if queries are slow)

---

## Implementation Order

1. **Phase 1: Easy Wins** (Low risk, high value)
   - Add enums for Message.role, Agent.agentType
   - Add missing indexes
   - Add CHECK constraints

2. **Phase 2: Performance** (Medium risk, high value)
   - Add ChatSession.lastMessageAt
   - Add HNSW index for vectors
   - Add composite indexes

3. **Phase 3: Major Refactoring** (High risk, high value)
   - Move AgentConfig to Agent table
   - Separate Message metadata table
   - Normalize User.roles (if needed)

---

## Migration Strategy

1. **Backward Compatible**: All changes should support existing data
2. **Gradual Migration**: Migrate data from old structure to new
3. **Dual Write**: Write to both old and new during transition
4. **Verification**: Verify data integrity before removing old structure
5. **Rollback Plan**: Keep old structure until confident in new one

---

## Notes

- **JSONB is fine** for truly dynamic/variable data (AgentMemory.context, SystemConfig)
- **JSONB is problematic** for structured, well-defined data (AgentConfig, User.roles)
- **Indexes are critical** for query performance - add based on actual query patterns
- **Denormalization** can improve performance but adds complexity
- **Enums** provide type safety and validation at database level
