# Agent Rules Streamlining - Refactoring Plan

## Overview

This refactoring streamlines agent configuration by removing behavior rules and system prompts from individual agents and archetypes, centralizing them in system configuration per agent type. This simplifies the configuration model and ensures consistent behavior across agents of the same type.

## Goals

1. **Remove behavior rules and prompts from agent model** - Agents no longer store individual behavior rules or system prompts
2. **Remove behavior rules and prompts from archetypes** - Archetypes no longer store behavior rules or system prompts
3. **Refactor system behavior rules UI** - Use the table/JSON selector component currently used by archetypes
4. **Streamline config resolution** - Implement a clear, hierarchical configuration resolution flow
5. **Centralize OpenAI prompts** - All prompt strings in one file, services only inject values

## Current State Analysis

### Database Schema

**Agent Model** (`apps/api/prisma/schema.prisma`):
- `systemPrompt` (String?, Text) - Line 62
- `behaviorRules` (Json?) - Line 63

**AgentArchetype Model** (`apps/api/prisma/schema.prisma`):
- `systemPrompt` (String?, Text) - Line 260
- `behaviorRules` (Json?) - Line 261

**SystemConfig Model**:
- Stores `behavior_rules` and `system_prompt` per agent type
- Already supports per-agent-type configuration

### Current Config Resolution Flow

From `message-preparation.service.ts`:
1. System prompt (by agent type) - merged from main + type-specific + archetype
2. System behavior rules (by agent type) - merged from main + type-specific
3. Client agent config rules (system) - generated from config values
4. Client agent description (user prompt) - from agent's `system_prompt` field
5. Client agent config rules (user) - from agent's `behavior_rules` field
6. Word parsing instruction (language assistants only)
7. Memory context
8. Conversation history
9. Current user message

### UI Components

**Admin - System Behavior Rules** (`apps/admin/src/pages/rules/components/SystemBehaviorRules.tsx`):
- Uses simple input fields for rules
- Separate textarea for system prompt

**Admin - Archetype Form** (`apps/admin/src/pages/agents/components/agent/form/AgentForm.tsx`):
- Uses `BehaviorRulesEditor` component (table/JSON selector) - Line 239-245
- Only shows behavior rules for archetypes (`isArchetype` check)

**Client - Agent Config** (`apps/client/src/pages/config/components/agent/AgentConfig/parts/BehaviorRulesField.tsx`):
- Uses table/JSON selector pattern (duplicated from `BehaviorRulesEditor`)

**Shared UI Component** (`packages/ui/src/components/form/BehaviorRulesEditor/BehaviorRulesEditor.tsx`):
- Table/JSON selector component
- Used by archetypes and client agent config

## Refactoring Plan

### Phase 1: Database Schema Changes

#### 1.1 Remove Fields from Agent Model

**File**: `apps/api/prisma/schema.prisma`

**Changes**:
- Remove `systemPrompt` field (Line 62)
- Remove `behaviorRules` field (Line 63)

**Migration Strategy**:
1. Create migration to drop columns
2. Data migration: No data migration needed (these fields will come from system config)
3. Update Prisma client

#### 1.2 Remove Fields from AgentArchetype Model

**File**: `apps/api/prisma/schema.prisma`

**Changes**:
- Remove `systemPrompt` field (Line 260)
- Remove `behaviorRules` field (Line 261)

**Migration Strategy**:
1. Create migration to drop columns
2. Data migration: No data migration needed (archetypes will use system config defaults)
3. Update Prisma client

### Phase 2: API Changes

#### 2.1 Update DTOs

**Files to Update**:
- `apps/api/src/common/dto/agent-archetype.dto.ts`
  - Remove `system_prompt` from `AgentArchetypeConfigDto` (Line 33)
  - Remove `behavior_rules` from `AgentArchetypeConfigDto` (Line 36)

- `apps/api/src/common/types/config.types.ts`
  - Remove `system_prompt` from `AgentConfig` interface
  - Remove `behavior_rules` from `AgentConfig` interface

#### 2.2 Update Agent Service

**File**: `apps/api/src/agent/agent.service.ts`

**Changes**:
- Remove `system_prompt` and `behavior_rules` from agent creation/update logic
- Update `AgentResponse` type to exclude these fields

#### 2.3 Update Agent Archetype Service

**File**: `apps/api/src/agent-archetype/agent-archetype.service.ts`

**Changes**:
- Remove `system_prompt` and `behavior_rules` from archetype creation/update logic
- Update response types to exclude these fields

#### 2.4 Update Message Preparation Service

**File**: `apps/api/src/chat/services/message-preparation.service.ts`

**New Config Resolution Flow**:

```typescript
// 1. Global system prompt - per agent type (from SystemConfig)
await this.addSystemPrompt(messagesForAPI, agentConfig, currentDateTime);

// 2. Global behavior rules - per agent type (from SystemConfig)
await this.addSystemBehaviorRules(messagesForAPI, agentConfig);

// 3. User's agent config - name, description, all form input values
this.addUserAgentConfig(messagesForAPI, agentConfig);

// 4. Messages + memories (unchanged)
// ... existing memory and conversation history logic
```

**Changes**:
- Remove `agentArchetype` parameter from `prepareMessagesForOpenAI` (Line 84)
- Remove archetype prompt merging from `addSystemPrompt` (Lines 220-227)
- Remove client agent description step (Lines 120-135) - agent name/description handled in user config
- Remove client behavior rules step (Lines 137-141)
- Update `addUserAgentConfig` to include:
  - Agent name and description
  - All form config values (temperature, model, maxTokens, responseLength, age, gender, personality, sentiment, interests, availability, language)

#### 2.5 Centralize OpenAI Prompts

**File**: `apps/api/src/common/constants/openai-prompts.constants.ts`

**Changes**:
- Move all hardcoded prompt strings from services to this file
- Create template functions that accept config objects
- Services only call these functions with config values

**Current Prompts to Centralize**:
- Memory context formatting (from `addMemoryContext`)
- Agent name/description formatting
- All config-based rule generation (already partially centralized)

**New Structure**:
```typescript
export const OPENAI_PROMPTS = {
  // ... existing prompts ...
  
  AGENT_CONFIG: {
    NAME_AND_DESCRIPTION: (name: string, description?: string) => 
      `Agent name: ${name}${description ? `\n\n${description}` : ''}`,
    
    CONFIG_VALUES: (config: AgentConfigValues) => {
      // Generate all config-based rules from config object
      // Returns array of rule strings
    },
  },
  
  MEMORY: {
    CONTEXT: (memories: string[]) => 
      `Relevant context from previous conversations:\n${memories
        .map((m, i) => `${i + 1}. ${m}`)
        .join('\n\n')}`,
  },
} as const;
```

**Services to Update**:
- `message-preparation.service.ts` - Use centralized prompts
- `agent-config.service.ts` - Move rule generation to prompt constants
- Any other services with hardcoded prompt strings

### Phase 3: Admin UI Changes

#### 3.1 Update System Behavior Rules UI

**File**: `apps/admin/src/pages/rules/components/SystemBehaviorRules.tsx`

**Changes**:
- Replace simple input fields with `BehaviorRulesEditor` component
- Import from `@openai/ui`
- Use same table/JSON selector pattern as archetypes

**Before** (Lines 85-117):
```tsx
<div className="space-y-2">
  {currentFormData.rules.map((rule: string, index: number) => (
    <div key={index} className="flex items-center gap-2">
      <input ... />
      <Button onClick={() => handleRemoveRule(tab, index)}>...</Button>
    </div>
  ))}
  <Button onClick={() => handleAddRule(tab)}>Add Rule</Button>
</div>
```

**After**:
```tsx
<BehaviorRulesEditor
  rules={currentFormData.rules}
  onChange={(rules) => handleRulesChange(tab, rules)}
  namespace={I18nNamespace.ADMIN}
  label={tAdmin('systemRules.label')}
/>
```

#### 3.2 Remove Fields from Agent Form

**File**: `apps/admin/src/pages/agents/components/agent/form/AgentForm.tsx`

**Changes**:
- Remove `systemPrompt` from form state (Line 38)
- Remove `behaviorRules` from form state (Line 39)
- Remove `systemPrompt` initialization (Line 68, 96)
- Remove `behaviorRules` initialization (Line 69, 97)
- Remove `systemPrompt` from config building (Lines 130-132)
- Remove `behaviorRules` from config building (Lines 133-135)
- Remove `BehaviorRulesEditor` component (Lines 238-246) - only shown for archetypes
- Remove `systemPrompt` from `ConfigurationSection` props

#### 3.3 Remove Fields from Configuration Section

**File**: `apps/admin/src/pages/agents/components/agent/form/ConfigurationSection.tsx`

**Changes**:
- Remove `systemPrompt` from props interface
- Remove system prompt input field (Lines 69-76)

#### 3.4 Update Agent Form Types

**File**: `apps/admin/src/types/agent-form.types.ts`

**Changes**:
- Remove `systemPrompt` from `AgentFormData` (Line 25)
- Remove `behaviorRules` from `AgentFormData` (Line 26) - only for archetypes, but removing entirely

#### 3.5 Update Agent Form Mapping

**File**: `apps/admin/src/pages/agents/hooks/use-agent-form-mapping.ts`

**Changes**:
- Remove `systemPrompt` mapping (Line 30)
- Remove `behaviorRules` mapping (Line 31)
- Remove `systemPrompt` from update request (Lines 60-61, 112-113)
- Remove `behaviorRules` from update request (Lines 115-116)

#### 3.6 Update Agent Types

**File**: `apps/admin/src/types/agent.types.ts`

**Changes**:
- Remove `system_prompt` from `Agent` interface configs (Line 24)
- Remove `behavior_rules` from `Agent` interface configs (Line 25)

### Phase 4: Client UI Changes

#### 4.1 Remove Fields from Agent Config

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/AgentConfigForm.tsx`

**Changes**:
- Remove system prompt field
- Remove behavior rules field (already using `BehaviorRulesField`, but should be removed entirely)

**Note**: Client agents should not have behavior rules or system prompts - these come from system config per agent type.

#### 4.2 Update Agent Config Types

**File**: `apps/client/src/pages/config/types/agent-config.types.ts` (if exists)

**Changes**:
- Remove `systemPrompt` field
- Remove `behaviorRules` field

### Phase 5: Testing & Validation

#### 5.1 Unit Tests

**Files to Update**:
- `apps/api/src/chat/services/message-preparation.service.spec.ts`
- `apps/api/src/agent/agent.service.spec.ts`
- `apps/api/src/agent-archetype/agent-archetype.service.spec.ts`

**Test Cases**:
- Verify system prompt comes from SystemConfig only
- Verify behavior rules come from SystemConfig only
- Verify agent name/description included in user config
- Verify config resolution order is correct

#### 5.2 Integration Tests

**Files to Update**:
- `apps/api/test/chat.e2e-spec.ts`
- `apps/api/test/agents.e2e-spec.ts`

**Test Cases**:
- Create agent without system prompt/behavior rules
- Verify messages include system config prompts/rules
- Verify agent config values are included correctly

#### 5.3 UI Tests

**Files to Update**:
- Admin form tests
- System rules page tests

**Test Cases**:
- Verify system rules UI uses BehaviorRulesEditor
- Verify agent form doesn't show system prompt/behavior rules
- Verify archetype form doesn't show system prompt/behavior rules

## Implementation Order

### Step 1: Database Migration
1. Create Prisma migration to remove fields
2. Update schema.prisma
3. Generate Prisma client
4. Run migration

### Step 2: API Backend
1. Update DTOs and types
2. Update services (remove field handling)
3. Refactor message preparation service
4. Centralize prompts
5. Update tests

### Step 3: Admin UI
1. Update system behavior rules UI
2. Remove fields from agent/archetype forms
3. Update types and mappings
4. Update tests

### Step 4: Client UI
1. Remove fields from agent config
2. Update types
3. Update tests

### Step 5: Validation
1. Run all tests
2. Manual testing in dev environment
3. Verify config resolution flow
4. Check for any remaining references

## Migration Notes

### Data Migration
- **No data migration needed** - System prompts and behavior rules will be retrieved from SystemConfig per agent type
- Existing agent/archetype data with these fields will simply ignore them after migration

### Backward Compatibility
- **Breaking change** - Agents and archetypes will no longer support individual behavior rules/prompts
- All behavior rules and prompts must be configured in SystemConfig per agent type
- Update documentation to reflect new configuration model

### Rollback Plan
- Keep migration files for rollback
- Can restore fields if needed (though not recommended)

## Configuration Resolution Flow (Final)

```
1. Global System Prompt (per agent type)
   └─ From: SystemConfig.system_prompt (filtered by agentType)
   └─ Role: SYSTEM
   └─ Includes: Current time embedded

2. Global Behavior Rules (per agent type)
   └─ From: SystemConfig.behavior_rules (filtered by agentType)
   └─ Role: SYSTEM
   └─ Format: Transformed from array to single message

3. User Agent Config
   └─ From: Agent model fields
   └─ Includes:
      - Agent name and description
      - Temperature, model, maxTokens
      - Response length, age, gender, personality, sentiment
      - Interests, availability, language
   └─ Role: SYSTEM (config-based rules) + USER (name/description)
   └─ Format: Generated rules from config values

4. Word Parsing Instruction (language assistants only)
   └─ Role: SYSTEM

5. Memory Context
   └─ From: Relevant memories
   └─ Role: SYSTEM

6. Conversation History
   └─ From: Previous messages
   └─ Role: USER/ASSISTANT

7. Current User Message
   └─ Role: USER
```

## Files Summary

### Database
- `apps/api/prisma/schema.prisma` - Remove fields from Agent and AgentArchetype

### API
- `apps/api/src/common/dto/agent-archetype.dto.ts` - Remove fields
- `apps/api/src/common/types/config.types.ts` - Remove fields
- `apps/api/src/agent/agent.service.ts` - Remove field handling
- `apps/api/src/agent/agent.repository.ts` - Remove field queries
- `apps/api/src/agent-archetype/agent-archetype.service.ts` - Remove field handling
- `apps/api/src/agent-archetype/agent-archetype.repository.ts` - Remove field queries
- `apps/api/src/chat/services/message-preparation.service.ts` - Refactor config resolution
- `apps/api/src/common/constants/openai-prompts.constants.ts` - Centralize all prompts
- `apps/api/src/agent/services/agent-config.service.ts` - Move rule generation to prompts

### Admin UI
- `apps/admin/src/pages/rules/components/SystemBehaviorRules.tsx` - Use BehaviorRulesEditor
- `apps/admin/src/pages/agents/components/agent/form/AgentForm.tsx` - Remove fields
- `apps/admin/src/pages/agents/components/agent/form/ConfigurationSection.tsx` - Remove system prompt
- `apps/admin/src/types/agent-form.types.ts` - Remove fields
- `apps/admin/src/types/agent.types.ts` - Remove fields
- `apps/admin/src/pages/agents/hooks/use-agent-form-mapping.ts` - Remove field mapping

### Client UI
- `apps/client/src/pages/config/components/agent/AgentConfig/parts/AgentConfigForm.tsx` - Remove fields
- `apps/client/src/pages/config/components/agent/AgentConfig/parts/BehaviorRulesField.tsx` - Remove (if exists)

## Success Criteria

- [ ] Agent model no longer has `systemPrompt` or `behaviorRules` fields
- [ ] AgentArchetype model no longer has `systemPrompt` or `behaviorRules` fields
- [ ] System behavior rules UI uses `BehaviorRulesEditor` component
- [ ] Agent forms (admin) no longer show system prompt or behavior rules fields
- [ ] Archetype forms (admin) no longer show system prompt or behavior rules fields
- [ ] Client agent config no longer shows system prompt or behavior rules fields
- [ ] Config resolution follows new flow (system config → user config → messages)
- [ ] All OpenAI prompt strings centralized in `openai-prompts.constants.ts`
- [ ] Services only inject values into prompt templates
- [ ] All tests pass
- [ ] Documentation updated

## Risks & Mitigation

### Risk: Breaking Existing Agents
- **Mitigation**: System config already supports per-agent-type configuration, so existing behavior can be preserved by configuring system rules per agent type

### Risk: Loss of Individual Agent Customization
- **Mitigation**: This is intentional - individual agent customization moves to system config per agent type for consistency

### Risk: Migration Issues
- **Mitigation**: Fields are nullable, so dropping them is safe. No data migration needed.

### Risk: UI Regression
- **Mitigation**: Use existing `BehaviorRulesEditor` component that's already tested and used in archetypes

## Timeline Estimate

- **Phase 1 (Database)**: 2-3 hours
- **Phase 2 (API)**: 8-12 hours
- **Phase 3 (Admin UI)**: 4-6 hours
- **Phase 4 (Client UI)**: 2-3 hours
- **Phase 5 (Testing)**: 4-6 hours

**Total**: 20-30 hours

## Dependencies

- Prisma migration system
- Existing `BehaviorRulesEditor` component from `@openai/ui`
- SystemConfig service and repository
- Message preparation service refactoring

## Post-Refactoring Tasks

1. Update API documentation
2. Update admin user guide
3. Update developer documentation
4. Create migration guide for existing deployments
5. Monitor for any issues in production
