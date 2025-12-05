# Agent Overview Feature Plan

## Overview

This document outlines the plan for implementing an Agent Overview feature in the admin application. The feature will allow administrators to view, manage, and edit all agents in the system, including their memories. Additionally, it includes changes to the memory system to provide a summary view for clients instead of raw memory lists.

## Feature Requirements

### 1. Admin - Agent Overview Section

#### 1.1 Agent List Page
- **Route**: `/agents` (or `/agent-overview`)
- **Location**: New page in admin app
- **Functionality**:
  - Display all agents in a table format
  - Show the following columns:
    - Agent name
    - Avatar (thumbnail)
    - Type (AgentType: GENERAL, LANGUAGE_ASSISTANT)
    - Total messages (count from all sessions)
    - Total tokens (sum from AiRequestLog for all sessions)
  - Support pagination if needed
  - Allow navigation to detail/edit view
  - Support deletion with confirmation dialog (trashcan icon)

#### 1.2 Agent Detail/Edit Page
- **Route**: `/agents/:id` (detail view) and `/agents/:id/edit` (edit form)
- **Functionality**:
  - Display all agent information:
    - Basic info: name, description, avatar, type, language
    - Configuration: temperature, system prompt, behavior rules, model, max tokens, response length
    - Demographics: age, gender, personality, sentiment, interests, availability
    - Metadata: createdAt, userId
  - Fetch and display individual memories (like in client)
  - Allow editing of memories (update keyPoint)
  - Allow deletion of memories
  - Allow editing of agent properties (except creation)
  - No agent creation functionality
  - Deletion with standard trashcan confirmation dialog

#### 1.3 Navigation
- Add "Agents" link to admin navigation
- Use appropriate icon (e.g., IconUsers or IconRobot)
- Follow existing admin navigation pattern

### 2. Memory System Changes

#### 2.1 Remove Memory Fetching from Client
- **Remove**:
  - `useAgentMemories` hook usage from client config pages
  - `MemoriesList` component display in client
  - `MemoriesSection` component from client agent config
  - Memory fetching logic from client (keep service methods for potential future use, but remove UI)

#### 2.2 Add Memory Summary for Client
- **New Feature**: Memory summary generation
- **Purpose**: Provide a user-friendly summary of how memories affect agent behavior
- **Format**: 
  - Max 5 sentences
  - Short paragraph format
  - Focus on feelings and behavioral tendencies
  - NOT a list of factual memories
  - Example: "The agent has developed a warm, friendly rapport with you based on your shared interests in technology and travel. It tends to be more enthusiastic when discussing these topics and remembers your preference for detailed explanations. The agent feels comfortable engaging in casual conversation and appreciates when you share personal updates."
- **Storage**: 
  - Add `memorySummary` field to Agent model (nullable text field)
  - Store in database, update whenever memories change
- **Usage**: 
  - Display in client UI (replacing memory list)
  - NOT included in message prompts (memories themselves are still used for retrieval)
  - For client reference only

#### 2.3 Memory Summary Generation Logic
- **Trigger**: Generate/update summary when:
  - Memories are created
  - Memories are updated
  - Memories are deleted
  - Memory summarization occurs (existing feature)
- **Implementation**:
  - New service method: `generateMemorySummary(agentId, userId, apiKey)`
  - Use OpenAI to generate summary based on all current memories
  - Store summary in Agent.memorySummary field
  - Update summary asynchronously after memory operations

## Technical Implementation

### 3.1 Database Changes

#### Schema Updates
```prisma
model Agent {
  // ... existing fields ...
  memorySummary String? @map("memory_summary") @db.Text // New field for client summary
}
```

#### Migration
- Create migration to add `memory_summary` column to `agents` table
- Make it nullable (existing agents won't have summaries initially)

### 3.2 API Changes

#### 3.2.1 New Admin Agent Endpoints
- **GET `/api/admin/agents`**: Get all agents (admin only)
  - Return: Array of agents with aggregated stats (total messages, total tokens)
  - Include pagination support
- **GET `/api/admin/agents/:id`**: Get single agent with full details (admin only)
  - Return: Agent with all configs and metadata
- **GET `/api/admin/agents/:id/memories`**: Get all memories for agent (admin only)
  - Reuse existing memory controller but add admin authorization
- **PUT `/api/admin/agents/:id`**: Update agent (admin only)
  - Allow updating all agent fields
- **DELETE `/api/admin/agents/:id`**: Delete agent (admin only)
  - Cascade delete (handled by Prisma)

#### 3.2.2 Memory Summary Service
- **New Service**: `MemorySummaryService`
  - Method: `generateSummary(agentId, userId, apiKey): Promise<string>`
  - Fetch all memories for agent
  - Use OpenAI to generate summary prompt
  - Store result in Agent.memorySummary
  - Update existing `AgentMemoryService` to trigger summary generation

#### 3.2.3 Memory Summary Prompt
- **New Prompt**: Add to `OPENAI_PROMPTS.MEMORY.SUMMARY`
  - System prompt: Focus on behavioral tendencies and feelings
  - User prompt: Provide all memories, request summary of how they affect agent's feelings and behavior
  - Max 5 sentences, paragraph format

#### 3.2.4 Update Memory Operations
- **Modify**: `AgentMemoryService.createMemory()`
  - After creating memories, trigger summary generation (async)
- **Modify**: `AgentMemoryService.updateMemory()` (via controller)
  - After updating memory, trigger summary generation (async)
- **Modify**: `AgentMemoryService.deleteMemory()` (via controller)
  - After deleting memory, trigger summary generation (async)
- **Modify**: `AgentMemoryService.summarizeMemories()`
  - After summarization, trigger summary generation (async)

#### 3.2.5 Agent Response Updates
- **Update**: `AgentResponse` interface to include `memorySummary?: string`
- **Update**: Agent endpoints to return `memorySummary` field

### 3.3 Admin App Changes

#### 3.3.1 Routes
- Add route constants:
  ```typescript
  AGENTS: '/agents',
  AGENT_DETAIL: (id: number) => `/agents/${id}`,
  AGENT_EDIT: (id: number) => `/agents/${id}/edit`,
  ```
- Add routes to `App.tsx`:
  - `/agents` → `AgentsPage`
  - `/agents/:id` → `AgentDetailPage`
  - `/agents/:id/edit` → `AgentEditPage`

#### 3.3.2 Components

**AgentsPage** (`apps/admin/src/pages/AgentsPage.tsx`)
- Table/list view of all agents
- Columns: name, avatar, type, total messages, total tokens
- Actions: View detail, Edit, Delete
- Loading and error states
- Empty state

**AgentDetailPage** (`apps/admin/src/pages/AgentDetailPage.tsx`)
- Display all agent information
- Display memories list (similar to client)
- Actions: Edit agent, Delete agent, Edit memory, Delete memory
- Navigation to edit page

**AgentEditPage** (`apps/admin/src/pages/AgentEditPage.tsx`)
- Form for editing agent properties
- Similar to client agent config form
- Save/Cancel actions
- Validation

**AgentList** (`apps/admin/src/components/AgentList.tsx`)
- Reusable table/list component
- Display agents with stats
- Action buttons

**AgentMemoriesList** (`apps/admin/src/components/AgentMemoriesList.tsx`)
- Display memories for an agent
- Edit and delete actions
- Similar to client MemoriesList but with edit capability

#### 3.3.3 Services

**AgentService** (`apps/admin/src/services/agent.service.ts`)
- `getAllAgents()`: Fetch all agents with stats
- `getAgent(id)`: Fetch single agent with full details
- `updateAgent(id, data)`: Update agent
- `deleteAgent(id)`: Delete agent
- `getAgentMemories(agentId)`: Fetch memories for agent
- `updateMemory(agentId, memoryId, keyPoint)`: Update memory
- `deleteMemory(agentId, memoryId)`: Delete memory

#### 3.3.4 Navigation
- Add "Agents" link to `AdminNavigation.tsx`
- Use appropriate icon
- Add translation keys

#### 3.3.5 Types
- Create `Agent` type for admin (may differ from client)
- Create `AgentWithStats` type for list view
- Reuse `AgentMemory` type from shared types

### 3.4 Client App Changes

#### 3.4.1 Remove Memory Display
- Remove `MemoriesSection` from agent config page
- Remove `MemoriesList` component usage
- Remove `useAgentMemories` hook usage from config pages
- Keep `MemoryService` methods (may be used elsewhere)

#### 3.4.2 Add Memory Summary Display
- **New Component**: `MemorySummary` (`apps/client/src/pages/config/components/agent/AgentConfig/parts/MemorySummary.tsx`)
  - Display memory summary paragraph
  - Show loading state while fetching
  - Show empty state if no summary available
  - Styled as informational card
- **Update**: Agent config page to show memory summary instead of memory list
- **Fetch**: Memory summary from agent data (already included in agent response)

#### 3.4.3 Agent Type Updates
- Update `Agent` interface to include `memorySummary?: string`
- Update agent queries to handle new field

### 3.5 Translation Keys

#### Admin (`packages/i18n/src/locales/en/admin.json`)
```json
{
  "agents": {
    "title": "Agents",
    "list": {
      "title": "All Agents",
      "empty": "No agents found",
      "name": "Name",
      "type": "Type",
      "messages": "Messages",
      "tokens": "Tokens",
      "actions": "Actions"
    },
    "detail": {
      "title": "Agent Details",
      "edit": "Edit Agent",
      "delete": "Delete Agent",
      "memories": "Memories",
      "basicInfo": "Basic Information",
      "configuration": "Configuration",
      "demographics": "Demographics"
    },
    "edit": {
      "title": "Edit Agent",
      "save": "Save",
      "cancel": "Cancel"
    },
    "delete": {
      "confirm": "Are you sure you want to delete this agent?",
      "success": "Agent deleted successfully"
    }
  }
}
```

#### Client (`packages/i18n/src/locales/en/client.json`)
```json
{
  "agentConfig": {
    "memorySummary": {
      "title": "Memory Summary",
      "empty": "No memory summary available yet",
      "loading": "Loading memory summary..."
    }
  }
}
```

## Implementation Order

### Phase 1: Database & API Foundation
1. Create database migration for `memorySummary` field
2. Update Prisma schema
3. Create admin agent controller and service
4. Create memory summary service
5. Update memory operations to trigger summary generation
6. Add admin authorization guards

### Phase 2: Admin UI - List View
1. Create routes and navigation
2. Create AgentService for admin
3. Create AgentsPage with table/list
4. Add translation keys
5. Test list view

### Phase 3: Admin UI - Detail & Edit
1. Create AgentDetailPage
2. Create AgentEditPage
3. Create AgentMemoriesList component
4. Add memory edit/delete functionality
5. Add agent edit functionality
6. Add delete confirmation
7. Test detail and edit flows

### Phase 4: Client Memory Summary
1. Remove memory list from client config
2. Create MemorySummary component
3. Update agent config page to show summary
4. Add translation keys
5. Test summary display

### Phase 5: Testing & Polish
1. Integration testing
2. Error handling
3. Loading states
4. Empty states
5. Responsive design
6. Accessibility

## API Endpoints Summary

### Admin Agent Endpoints
- `GET /api/admin/agents` - List all agents with stats
- `GET /api/admin/agents/:id` - Get agent details
- `PUT /api/admin/agents/:id` - Update agent
- `DELETE /api/admin/agents/:id` - Delete agent
- `GET /api/admin/agents/:id/memories` - Get agent memories
- `PUT /api/admin/agents/:id/memories/:memoryId` - Update memory
- `DELETE /api/admin/agents/:id/memories/:memoryId` - Delete memory

### Existing Endpoints (Reused)
- Memory endpoints can reuse existing controller with admin authorization
- Or create admin-specific endpoints if needed

## Data Aggregation Queries

### Total Messages
```sql
SELECT COUNT(*) 
FROM messages m
JOIN chat_sessions cs ON m.session_id = cs.id
WHERE cs.agent_id = ?
```

### Total Tokens
```sql
SELECT SUM(total_tokens)
FROM ai_request_logs arl
JOIN messages m ON arl.request_json->>'messages' @> '[{"role": "user"}]'::jsonb
JOIN chat_sessions cs ON m.session_id = cs.id
WHERE cs.agent_id = ?
```

Note: Token aggregation may need refinement based on how tokens are linked to agents. May need to track agentId in AiRequestLog or link through messages.

## Memory Summary Generation

### Prompt Structure
```
System: You are a memory analysis assistant. Analyze the agent's memories and summarize how they affect the agent's feelings and behavioral tendencies towards the user. Focus on emotional patterns and behavioral changes, not factual lists.

User: Based on these memories, write a short paragraph (max 5 sentences) describing how these memories affect the agent's feelings and behavioral tendencies towards the user. Focus on emotional patterns, relationship dynamics, and behavioral changes. Do not list facts or memories directly.

Memories:
[list of memory keyPoints]
```

### Generation Timing
- After memory creation (async, don't block)
- After memory update (async)
- After memory deletion (async)
- After memory summarization (async)
- On-demand via admin endpoint (optional)

## Security Considerations

1. **Admin Authorization**: All admin endpoints must verify admin role
2. **User Isolation**: Admin can see all agents, but should verify access
3. **Memory Access**: Admin can view/edit all memories
4. **Agent Deletion**: Confirm cascade behavior (sessions, messages, memories)

## Testing Checklist

- [ ] Admin can view all agents in list
- [ ] Agent list shows correct stats (messages, tokens)
- [ ] Admin can view agent details
- [ ] Admin can edit agent properties
- [ ] Admin can delete agent (with confirmation)
- [ ] Admin can view agent memories
- [ ] Admin can edit memories
- [ ] Admin can delete memories
- [ ] Memory summary is generated after memory operations
- [ ] Memory summary is displayed in client
- [ ] Memory list is removed from client
- [ ] Summary updates correctly when memories change
- [ ] Error handling works correctly
- [ ] Loading states display properly
- [ ] Empty states display properly
- [ ] Pagination works (if implemented)
- [ ] Authorization works correctly

## Future Considerations

1. **Pagination**: May need pagination for large agent lists
2. **Filtering**: Filter by type, user, etc.
3. **Search**: Search agents by name
4. **Sorting**: Sort by messages, tokens, created date
5. **Export**: Export agent data
6. **Bulk Operations**: Bulk delete, bulk edit
7. **Analytics**: Charts/graphs for agent usage
8. **Memory Summary Regeneration**: Manual trigger in admin

## Notes

- Memory summary is for client display only, not used in prompts
- Actual memories are still used for retrieval in chat
- Summary generation is async to not block memory operations
- Admin can see all agents regardless of user
- Agent creation remains in client app only
- Memory operations trigger summary regeneration automatically
