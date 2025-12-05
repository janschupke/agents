# Rule Application Refactoring Plan

## Overview

This document outlines a comprehensive refactoring plan to restructure how system prompts and behavior rules are applied to OpenAI API messages. The goal is to create a centralized, configurable, testable, and extensible framework for managing rule application across different agent types.

## Current State Analysis

### Current Rule Application Flow

The current flow in `MessagePreparationService.prepareMessagesForOpenAI()`:

1. **Authoritative system prompt** (admin-defined) - SYSTEM role (FIRST)
2. **Code-defined rules** (datetime, language, etc.) - SYSTEM role
   - Handled by `ConfigurationRulesService`
   - Currently includes: datetime, language, response_length, age, gender, personality, interests, sentiment
3. **Admin-defined system behavior rules** - SYSTEM role
4. **Config-based behavior rules** (from form fields) - SYSTEM role
   - Added as separate SYSTEM messages
5. **Client config system prompt** - USER role
6. **Client behavior rules** (user-provided) - USER role
7. **Word parsing instruction** (language assistants only) - SYSTEM role
8. **Memory context** - SYSTEM role
9. **Conversation history** (user/assistant messages)
10. **Current user message** - USER role

### Current Issues

1. **Configuration Rules Service** contains both:
   - Code-defined rules (datetime, language) - should be removed
   - Config-based rules (response_length, age, etc.) - should move to agent config rules
2. **System prompts** are not categorized by agent type
3. **System behavior rules** are not categorized by agent type
4. **No centralized service** for merging multiple system prompts
5. **No centralized service** for transforming behavior rules arrays into single messages
6. **Agent archetypes** have system prompts but they're not merged into the main flow
7. **Current time** is in configuration rules - should be in main system prompt
8. **Language rule** is in configuration rules - should be in agent config rules

## Target State

### New Rule Application Flow

1. **System prompt (by agent type)** - SYSTEM role
   - Merged from: Main system prompt + Agent type-specific system prompt + Agent archetype system prompt
   - Includes current time embedded in the prompt
2. **System behavior rules (by agent type)** - SYSTEM role
   - Merged from: Main system behavior rules + Agent type-specific behavior rules
   - Transformed from array to single message
3. **Client agent config rules (system)** - SYSTEM role
   - Generated from agent config values (response_length, age, gender, personality, sentiment, interests)
   - Includes language rule if set
   - Transformed from array to single message
4. **Client agent description (user prompt)** - USER role
   - Agent's system_prompt field
5. **Client agent config rules (user)** - USER role
   - Agent's behavior_rules field
   - Transformed from array to single message
6. **Word parsing instruction** (language assistants only) - SYSTEM role
7. **Memory context** - SYSTEM role
8. **Conversation history** (user/assistant messages)
9. **Current user message** - USER role

### Key Changes

1. **Remove** `ConfigurationRulesService` categories for datetime and language
2. **Add** current time to main system prompt (embedded, not as separate rule)
3. **Move** language rule to agent config rules (system category)
4. **Create** `PromptTransformationService` for merging system prompts
5. **Create** `BehaviorRulesTransformationService` for transforming rules arrays to messages
6. **Extend** database schema to support agent type-specific system prompts and behavior rules
7. **Update** UI to support agent type categories for system rules
8. **Integrate** agent archetype system prompts into the merge flow

## Implementation Plan

### Phase 1: Database Schema Changes

#### 1.1 Update SystemConfig Table

**File**: `apps/api/prisma/schema.prisma`

**Changes**:
- Add `agentType` field to `SystemConfig` model (optional, nullable)
- Add index on `agentType` for efficient queries
- Keep existing `system_prompt` and `behavior_rules` keys for backward compatibility (main/default rules)

**New Schema**:
```prisma
model SystemConfig {
  id          Int       @id @default(autoincrement())
  configKey   String    @unique @map("config_key")
  configValue Json      @map("config_value")
  agentType   AgentType? @map("agent_type") // NEW: Optional agent type for categorization
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@index([agentType]) // NEW: Index for agent type queries
  @@map("system_configs")
}
```

**Migration Strategy**:
- Existing `system_prompt` and `behavior_rules` records remain with `agentType = null` (main/default)
- New records can specify `agentType` for type-specific rules
- Migration script to preserve existing data

#### 1.2 Update SystemConfigRepository

**File**: `apps/api/src/system-config/system-config.repository.ts`

**New Methods**:
```typescript
// Get system prompt by agent type (falls back to main if type-specific not found)
async getSystemPromptByAgentType(agentType: AgentType | null): Promise<string | null>

// Get system behavior rules by agent type (falls back to main if type-specific not found)
async getBehaviorRulesByAgentType(agentType: AgentType | null): Promise<string[]>

// Get all system prompts (main + type-specific)
async getAllSystemPrompts(): Promise<Map<AgentType | null, string>>

// Get all behavior rules (main + type-specific)
async getAllBehaviorRules(): Promise<Map<AgentType | null, string[]>>
```

### Phase 2: Create Transformation Services

#### 2.1 Create PromptTransformationService

**File**: `apps/api/src/chat/services/prompt-transformation.service.ts`

**Purpose**: Centralized service for merging multiple system prompts into one

**Interface**:
```typescript
@Injectable()
export class PromptTransformationService {
  /**
   * Merge multiple system prompts into a single prompt
   * @param prompts Array of prompts to merge (in order of priority)
   * @param options Transformation options
   * @returns Merged prompt string
   */
  mergeSystemPrompts(
    prompts: Array<string | null | undefined>,
    options?: PromptMergeOptions
  ): string

  /**
   * Embed current time into system prompt
   * @param prompt System prompt
   * @param currentDateTime Current date/time
   * @returns Prompt with embedded current time
   */
  embedCurrentTime(
    prompt: string,
    currentDateTime: Date
  ): string
}
```

**Implementation Details**:
- Merge prompts with clear separators (e.g., `\n\n---\n\n`)
- Handle null/undefined prompts gracefully
- Embed current time in ISO format at the beginning or end of prompt
- Configurable merge strategy (prepend, append, interleave)

**Configuration**:
```typescript
interface PromptMergeOptions {
  separator?: string // Default: '\n\n---\n\n'
  embedTimeAt?: 'start' | 'end' // Default: 'start'
  timeFormat?: 'iso' | 'readable' // Default: 'iso'
}
```

#### 2.2 Create BehaviorRulesTransformationService

**File**: `apps/api/src/chat/services/behavior-rules-transformation.service.ts`

**Purpose**: Centralized service for transforming behavior rules arrays into OpenAI API messages

**Interface**:
```typescript
@Injectable()
export class BehaviorRulesTransformationService {
  /**
   * Transform array of behavior rules into a single message content
   * @param rules Array of rule strings
   * @param options Transformation options
   * @returns Formatted message content
   */
  transformRulesToMessage(
    rules: string[],
    options?: RulesTransformOptions
  ): string

  /**
   * Merge multiple rule arrays and transform to single message
   * @param ruleArrays Array of rule arrays to merge
   * @param options Transformation options
   * @returns Formatted message content
   */
  mergeAndTransformRules(
    ruleArrays: string[][],
    options?: RulesTransformOptions
  ): string
}
```

**Implementation Details**:
- Format rules with clear structure (numbered list, bullet points, or plain)
- Handle empty arrays gracefully
- Support different formatting styles (system vs user role)
- Configurable header text

**Configuration**:
```typescript
interface RulesTransformOptions {
  role?: MessageRole // 'system' | 'user' - affects formatting
  header?: string // Optional header text
  format?: 'numbered' | 'bulleted' | 'plain' // Default: 'numbered'
  separator?: string // Default: '\n'
}
```

### Phase 3: Update Message Preparation Service

#### 3.1 Refactor MessagePreparationService

**File**: `apps/api/src/chat/services/message-preparation.service.ts`

**Changes**:

1. **Remove** `addConfigurationRules()` method (datetime/language handling)
2. **Update** `addAuthoritativeSystemPrompt()` to:
   - Get system prompt by agent type
   - Get agent archetype system prompt (if agent has archetype)
   - Merge all system prompts using `PromptTransformationService`
   - Embed current time using `PromptTransformationService`
3. **Update** `addSystemBehaviorRules()` to:
   - Get behavior rules by agent type
   - Merge multiple rule arrays using `BehaviorRulesTransformationService`
   - Transform to single message
4. **Create** `addClientAgentConfigRules()` method:
   - Generate rules from agent config (response_length, age, gender, personality, sentiment, interests, language)
   - Transform to single SYSTEM message using `BehaviorRulesTransformationService`
5. **Update** `addClientBehaviorRules()` to:
   - Transform rules array to single message using `BehaviorRulesTransformationService`

**New Method Structure**:
```typescript
private async addSystemPrompt(
  messagesForAPI: MessageForOpenAI[],
  agentConfig: AgentConfig,
  agentArchetype: AgentArchetype | null,
  currentDateTime: Date
): Promise<void> {
  // 1. Get main system prompt
  const mainPrompt = await this.systemConfigService.getSystemPromptByAgentType(
    agentConfig.agentType || null
  );

  // 2. Get agent archetype system prompt (if exists)
  const archetypePrompt = agentArchetype?.systemPrompt || null;

  // 3. Merge prompts
  const mergedPrompt = this.promptTransformationService.mergeSystemPrompts([
    mainPrompt,
    archetypePrompt,
  ]);

  // 4. Embed current time
  const finalPrompt = this.promptTransformationService.embedCurrentTime(
    mergedPrompt,
    currentDateTime
  );

  // 5. Add as first SYSTEM message
  if (finalPrompt.trim().length > 0) {
    messagesForAPI.unshift({
      role: MessageRole.SYSTEM,
      content: finalPrompt.trim(),
    });
  }
}

private async addSystemBehaviorRules(
  messagesForAPI: MessageForOpenAI[],
  agentConfig: AgentConfig
): Promise<void> {
  // 1. Get main system behavior rules
  const mainRules = await this.systemConfigService.getBehaviorRulesByAgentType(
    agentConfig.agentType || null
  );

  // 2. Merge and transform to single message
  const rulesMessage = this.behaviorRulesTransformationService.mergeAndTransformRules(
    [mainRules],
    { role: MessageRole.SYSTEM, header: 'System Behavior Rules (Required):' }
  );

  // 3. Add as SYSTEM message
  if (rulesMessage.trim().length > 0) {
    messagesForAPI.push({
      role: MessageRole.SYSTEM,
      content: rulesMessage.trim(),
    });
  }
}

private addClientAgentConfigRules(
  messagesForAPI: MessageForOpenAI[],
  agentConfig: AgentConfig
): void {
  // 1. Generate rules from config values
  const configRules: string[] = [];

  // Language rule (moved from ConfigurationRulesService)
  if (agentConfig.language) {
    configRules.push(
      OPENAI_PROMPTS.CONFIGURATION_RULES.LANGUAGE(agentConfig.language)
    );
  }

  // Other config-based rules (response_length, age, gender, etc.)
  const generatedRules = this.agentConfigService.generateBehaviorRulesFromConfig({
    response_length: agentConfig.response_length,
    age: agentConfig.age,
    gender: agentConfig.gender,
    personality: agentConfig.personality,
    sentiment: agentConfig.sentiment,
    interests: agentConfig.interests,
  });

  configRules.push(...generatedRules);

  // 2. Transform to single SYSTEM message
  if (configRules.length > 0) {
    const rulesMessage = this.behaviorRulesTransformationService.transformRulesToMessage(
      configRules,
      { role: MessageRole.SYSTEM }
    );

    messagesForAPI.push({
      role: MessageRole.SYSTEM,
      content: rulesMessage.trim(),
    });
  }
}
```

#### 3.2 Update prepareMessagesForOpenAI Method

**New Flow**:
```typescript
async prepareMessagesForOpenAI(
  existingMessages: MessageForOpenAI[],
  agentConfig: AgentConfig,
  userMessage: string,
  relevantMemories: string[],
  agentArchetype: AgentArchetype | null, // NEW: Pass archetype
  currentDateTime: Date = new Date()
): Promise<MessageForOpenAI[]> {
  // ... conversation history limiting ...

  const messagesForAPI: MessageForOpenAI[] = [];

  // 1. System prompt (by agent type) - merged and with current time
  await this.addSystemPrompt(
    messagesForAPI,
    agentConfig,
    agentArchetype,
    currentDateTime
  );

  // 2. System behavior rules (by agent type) - merged and transformed
  await this.addSystemBehaviorRules(messagesForAPI, agentConfig);

  // 3. Client agent config rules (system) - generated from config values
  this.addClientAgentConfigRules(messagesForAPI, agentConfig);

  // 4. Client agent description (user prompt)
  if (agentConfig.system_prompt) {
    messagesForAPI.push({
      role: MessageRole.USER,
      content: String(agentConfig.system_prompt),
    });
  }

  // 5. Client agent config rules (user) - transformed
  if (agentConfig.behavior_rules) {
    this.addClientBehaviorRules(messagesForAPI, agentConfig);
  }

  // 6. Word parsing instruction (language assistants only)
  // ... (unchanged)

  // 7. Memory context
  // ... (unchanged)

  // 8. Conversation history
  // ... (unchanged)

  // 9. Current user message
  // ... (unchanged)

  return messagesForAPI;
}
```

### Phase 4: Update SystemConfigService

#### 4.1 Extend SystemConfigService

**File**: `apps/api/src/system-config/system-config.service.ts`

**New Methods**:
```typescript
/**
 * Get system prompt by agent type
 * Falls back to main prompt (agentType = null) if type-specific not found
 */
async getSystemPromptByAgentType(
  agentType: AgentType | null
): Promise<string | null>

/**
 * Get system behavior rules by agent type
 * Falls back to main rules (agentType = null) if type-specific not found
 */
async getBehaviorRulesByAgentType(
  agentType: AgentType | null
): Promise<string[]>

/**
 * Update system prompt for specific agent type (or main if agentType is null)
 */
async updateSystemPromptByAgentType(
  agentType: AgentType | null,
  prompt: string
): Promise<void>

/**
 * Update system behavior rules for specific agent type (or main if agentType is null)
 */
async updateBehaviorRulesByAgentType(
  agentType: AgentType | null,
  rules: string[]
): Promise<void>
```

### Phase 5: Remove ConfigurationRulesService Categories

#### 5.1 Update ConfigurationRulesService

**File**: `apps/api/src/chat/services/configuration-rules.service.ts`

**Changes**:
- **Remove** `generateDatetimeRule()` method
- **Remove** `generateLanguageRule()` method
- **Remove** datetime and language handling from `generateConfigurationRules()`
- **Keep** other config-based rules (response_length, age, gender, personality, interests, sentiment) for now
- **Note**: These will eventually move to `AgentConfigService.generateBehaviorRulesFromConfig()` which already exists

**Deprecation Path**:
- Mark `ConfigurationRulesService` as deprecated
- Move remaining logic to `AgentConfigService`
- Remove service entirely in future cleanup

### Phase 6: Update Chat Orchestration Service

#### 6.1 Load Agent Archetype

**File**: `apps/api/src/chat/services/chat-orchestration.service.ts`

**Changes**:
- Load agent archetype when preparing messages
- Pass archetype to `MessagePreparationService.prepareMessagesForOpenAI()`

**Implementation**:
```typescript
// In sendMessage() method
const agent = await this.validateAgentAccess(context.agentId, context.userId);

// Load archetype if agent has one (need to add archetypeId to Agent model or load separately)
const agentArchetype = agent.archetypeId
  ? await this.archetypeService.findById(agent.archetypeId)
  : null;

// ... existing config loading ...

const messages = await this.messagePreparationService.prepareMessagesForOpenAI(
  existingMessages,
  agentConfig,
  context.userMessage,
  relevantMemories,
  agentArchetype, // NEW: Pass archetype
  new Date()
);
```

**Note**: May need to add `archetypeId` to Agent model or load archetype separately based on agent configuration.

### Phase 7: Update Admin UI

#### 7.1 Extend SystemBehaviorRules Component

**File**: `apps/admin/src/components/SystemBehaviorRules.tsx`

**Changes**:
- Add agent type selector/dropdown
- Load and save system prompts/rules by agent type
- Display current agent type category
- Support multiple categories (main + type-specific)

**UI Structure**:
```tsx
<div>
  <AgentTypeSelector
    value={selectedAgentType}
    onChange={setSelectedAgentType}
  />
  
  <SystemPromptEditor
    value={systemPrompt}
    onChange={setSystemPrompt}
    agentType={selectedAgentType}
  />
  
  <BehaviorRulesEditor
    rules={behaviorRules}
    onChange={setBehaviorRules}
    agentType={selectedAgentType}
  />
</div>
```

#### 7.2 Update API Endpoints

**File**: `apps/api/src/system-config/system-config.controller.ts`

**New Endpoints**:
```typescript
@Get('system-prompt')
@Get('system-prompt/:agentType')
@Put('system-prompt')
@Put('system-prompt/:agentType')

@Get('behavior-rules')
@Get('behavior-rules/:agentType')
@Put('behavior-rules')
@Put('behavior-rules/:agentType')
```

### Phase 8: Configuration Framework

#### 8.1 Create Rule Application Configuration

**File**: `apps/api/src/chat/config/rule-application.config.ts`

**Purpose**: Centralized configuration for rule application flow

**Enums** (should be defined in `apps/api/src/chat/enums/` or `apps/api/src/common/enums/`):
```typescript
/**
 * Source types for system prompts
 * Defines where system prompts can originate from
 */
export enum SystemPromptSource {
  MAIN = 'main',
  AGENT_TYPE = 'agentType',
  ARCHETYPE = 'archetype',
}

/**
 * Source types for behavior rules
 * Defines where behavior rules can originate from
 */
export enum BehaviorRulesSource {
  MAIN = 'main',
  AGENT_TYPE = 'agentType',
  ARCHETYPE = 'archetype',
  CLIENT_CONFIG = 'clientConfig',
  CLIENT_USER = 'clientUser',
}
```

**Note**: These enums should be defined in a dedicated enums file (e.g., `apps/api/src/chat/enums/rule-source.enum.ts`) and imported where needed. Never use string literals for these values.

**Structure**:
```typescript
export interface RuleApplicationConfig {
  // System prompt sources (in merge order)
  systemPromptSources: Array<{
    source: SystemPromptSource
    priority: number
    required: boolean
  }>

  // Behavior rules sources (in merge order)
  behaviorRulesSources: Array<{
    source: BehaviorRulesSource
    priority: number
    role: MessageRole
    required: boolean
  }>

  // Transformation options
  promptTransformation: PromptMergeOptions
  rulesTransformation: RulesTransformOptions
}

export const DEFAULT_RULE_APPLICATION_CONFIG: RuleApplicationConfig = {
  systemPromptSources: [
    { source: SystemPromptSource.MAIN, priority: 1, required: false },
    { source: SystemPromptSource.AGENT_TYPE, priority: 2, required: false },
    { source: SystemPromptSource.ARCHETYPE, priority: 3, required: false },
  ],
  behaviorRulesSources: [
    { source: BehaviorRulesSource.MAIN, priority: 1, role: MessageRole.SYSTEM, required: false },
    { source: BehaviorRulesSource.AGENT_TYPE, priority: 2, role: MessageRole.SYSTEM, required: false },
    { source: BehaviorRulesSource.CLIENT_CONFIG, priority: 3, role: MessageRole.SYSTEM, required: false },
    { source: BehaviorRulesSource.CLIENT_USER, priority: 4, role: MessageRole.USER, required: false },
  ],
  promptTransformation: {
    separator: '\n\n---\n\n',
    embedTimeAt: 'start',
    timeFormat: 'iso',
  },
  rulesTransformation: {
    format: 'numbered',
    separator: '\n',
  },
}
```

#### 8.2 Update MessagePreparationService to Use Config

**Changes**:
- Inject `RuleApplicationConfig` (or use default)
- Use config to determine which sources to load and in what order
- Make flow easily extensible by adding new sources to config

### Phase 9: Testing

#### 9.1 Unit Tests

**Files to Test**:
- `PromptTransformationService` - test merging, time embedding
- `BehaviorRulesTransformationService` - test transformation, merging
- `SystemConfigService` - test agent type-specific retrieval
- `MessagePreparationService` - test new flow

**Test Cases**:
- Merge multiple system prompts correctly
- Embed current time in correct format
- Transform rules arrays to messages
- Fallback to main rules when type-specific not found
- Handle null/undefined prompts gracefully
- Handle empty rules arrays gracefully

#### 9.2 Integration Tests

**Test Cases**:
- Complete message preparation flow with all rule sources
- Agent type-specific rules are applied correctly
- Agent archetype prompts are merged correctly
- Language rule is in correct position (client config rules)
- Current time is embedded in system prompt

### Phase 10: Migration & Cleanup

#### 10.1 Data Migration

**Migration Script**:
- Preserve existing `system_prompt` and `behavior_rules` as main/default (agentType = null)
- No data loss during migration

#### 10.2 Code Cleanup

**Remove**:
- `ConfigurationRulesService.generateDatetimeRule()`
- `ConfigurationRulesService.generateLanguageRule()`
- Datetime/language handling from `ConfigurationRulesService.generateConfigurationRules()`
- Old `addConfigurationRules()` method from `MessagePreparationService`

**Deprecate**:
- `ConfigurationRulesService` (mark as deprecated, remove in future)

## Implementation Order

1. **Phase 1**: Database schema changes (migration)
2. **Phase 2**: Create transformation services (testable in isolation)
3. **Phase 3**: Update message preparation service (use new services)
4. **Phase 4**: Update system config service (support agent types)
5. **Phase 5**: Remove old configuration rules categories
6. **Phase 6**: Update chat orchestration (load archetypes)
7. **Phase 7**: Update admin UI (agent type categories)
8. **Phase 8**: Configuration framework (centralized config)
9. **Phase 9**: Testing (comprehensive test coverage)
10. **Phase 10**: Migration & cleanup (remove deprecated code)

## Configuration Example

### Example: Adding New Agent Type

To add support for a new agent type with custom system prompt:

1. **Database**: Insert new `SystemConfig` record with `agentType = 'NEW_TYPE'`
2. **Code**: No code changes needed - framework automatically picks up type-specific rules
3. **UI**: Admin can select agent type in UI dropdown

### Example: Adding New Rule Source

To add a new rule source (e.g., "organization-level rules"):

1. **Enum**: Add new value to `BehaviorRulesSource` enum (e.g., `ORGANIZATION = 'organization'`)
2. **Config**: Add new source to `RuleApplicationConfig.behaviorRulesSources` using the enum value
3. **Service**: Add method to load organization rules
4. **Message Preparation**: Add call to load and merge organization rules
5. **No breaking changes** - existing flow continues to work

## Benefits

1. **Centralized**: All rule transformation logic in dedicated services
2. **Configurable**: Flow defined in configuration, easily extensible
3. **Testable**: Services can be tested in isolation
4. **Type-Safe**: Agent type-specific rules properly categorized
5. **Extensible**: Easy to add new rule sources or agent types
6. **Maintainable**: Clear separation of concerns
7. **Backward Compatible**: Existing rules continue to work (main/default category)

## Risks & Mitigation

### Risk 1: Breaking Changes
- **Mitigation**: Maintain backward compatibility, migrate existing data

### Risk 2: Performance Impact
- **Mitigation**: Add caching for system config lookups, optimize database queries

### Risk 3: Complex Merging Logic
- **Mitigation**: Keep transformation services simple, well-tested, documented

## Success Criteria

1. ✅ Current time embedded in system prompt (not separate rule)
2. ✅ Language rule moved to agent config rules (system category)
3. ✅ System prompts categorized by agent type (database + UI)
4. ✅ System behavior rules categorized by agent type (database + UI)
5. ✅ Agent archetype system prompts merged into main flow
6. ✅ All behavior rules transformed from arrays to single messages
7. ✅ Centralized transformation services created and tested
8. ✅ Configuration framework in place for extensibility
9. ✅ All existing functionality preserved
10. ✅ Comprehensive test coverage

## Notes

- **Agent Archetype Integration**: Need to determine how to link agents to archetypes (add `archetypeId` to Agent model or load separately)
- **Backward Compatibility**: Existing system prompts/rules (agentType = null) must continue to work
- **UI Complexity**: Admin UI needs to handle multiple agent type categories elegantly
- **Performance**: Consider caching system config lookups to avoid repeated database queries
