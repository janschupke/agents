# Behavior Rules Refactoring Plan

## Overview

This document outlines the refactoring plan to fix two critical issues with agent behavior rules:

1. **Problem 1**: Client-side behavior rules deletion not working properly
2. **Problem 2**: Agent config UI values (gender, age, personality, sentiment, interests, response length) need to be included as separate USER role messages in the OpenAI completion prompt

## Current Architecture Analysis

### Current Flow

1. **Frontend** (`apps/client/src/pages/config/hooks/agent/use-agent-save.ts`):
   - User edits behavior rules in UI
   - On save, sends `behavior_rules` as array (or `undefined` if empty)
   - Also sends config values: `response_length`, `age`, `gender`, `personality`, `sentiment`, `interests`

2. **Backend - Agent Service** (`apps/api/src/agent/agent.service.ts`):
   - Receives configs including `behavior_rules` and config values
   - Calls `AgentConfigService.mergeBehaviorRules()` which:
     - Generates rules from config values (gender, age, etc.)
     - Merges user-provided rules with auto-generated rules
     - Returns merged array
   - Saves merged rules to database as `behavior_rules`

3. **Backend - Message Preparation** (`apps/api/src/chat/services/message-preparation.service.ts`):
   - Loads agent config including `behavior_rules` (which contains merged rules)
   - Adds `behavior_rules` as a single USER role message
   - Does NOT separately add config values as USER role messages

### Current Issues

#### Issue 1: Deletion Not Working

**Root Cause**: 
- When user deletes all behavior rules in UI, frontend sends `undefined`
- Backend's `mergeBehaviorRules()` always generates rules from config values
- Even if user rules are empty, auto-generated rules are still merged in
- Result: Rules never truly get deleted, they're always regenerated from config

**Evidence**:
```typescript
// apps/api/src/agent/services/agent-config.service.ts:107-122
mergeBehaviorRules(
  userRules: string[] | undefined,
  configs: Record<string, unknown>
): string[] | undefined {
  const generatedRules = this.generateBehaviorRulesFromConfig(configs);
  const userRulesArray = userRules || [];
  
  // Problem: Even if userRules is undefined/empty, generatedRules are still merged
  const merged = [...userRulesArray, ...generatedRules];
  return merged.length > 0 ? merged : undefined;
}
```

#### Issue 2: Config Values Not as Separate USER Messages

**Root Cause**:
- Config values (gender, age, personality, sentiment, interests, response length) are merged into `behavior_rules` and stored in database
- In message preparation, only `behavior_rules` is added as a USER message
- Config values are not added as separate USER role messages as required

**Current Message Structure**:
```
1. Code-defined rules (datetime, language) - SYSTEM
2. Admin-defined system behavior rules - SYSTEM
3. Client system prompt - USER
4. Client behavior rules (merged with config values) - USER  ← Config values are here, not separate
5. Word parsing instruction - SYSTEM (language assistants only)
6. Memory context - SYSTEM
7. Conversation history
8. Current user message
```

**Required Message Structure**:
```
1. Code-defined rules (datetime, language) - SYSTEM
2. Admin-defined system behavior rules - SYSTEM
3. Client system prompt - USER
4. Client behavior rules (user-provided only) - USER
5. Gender rule (if set) - USER
6. Age rule (if set) - USER
7. Personality rule (if set) - USER
8. Sentiment rule (if set) - USER
9. Interests rule (if set) - USER
10. Response length rule (if set) - USER
11. Word parsing instruction - SYSTEM (language assistants only)
12. Memory context - SYSTEM
13. Conversation history
14. Current user message
```

## Refactoring Plan

### Phase 1: Separate User Rules from Config-Generated Rules

#### 1.1 Update Database Schema (No Migration Needed)

**Current State**: `behavior_rules` stores merged rules (user + auto-generated)

**Target State**: `behavior_rules` stores only user-provided rules

**Action**: 
- No schema change needed
- Change business logic to NOT merge rules into `behavior_rules`
- Store only user-provided rules in `behavior_rules`

#### 1.2 Update AgentConfigService

**File**: `apps/api/src/agent/services/agent-config.service.ts`

**Changes**:
1. Remove `mergeBehaviorRules()` method (or keep for backward compatibility but don't use)
2. Update `generateBehaviorRulesFromConfig()` to return structured rules (for message preparation)
3. Add new method `shouldGenerateRulesFromConfig()` to determine if rules should be generated

**New Structure**:
```typescript
interface ConfigGeneratedRule {
  type: 'gender' | 'age' | 'personality' | 'sentiment' | 'interests' | 'response_length';
  content: string;
}

generateBehaviorRulesFromConfig(
  configs: Record<string, unknown>
): ConfigGeneratedRule[] {
  // Returns structured rules instead of flat array
}
```

#### 1.3 Update AgentService

**File**: `apps/api/src/agent/agent.service.ts`

**Changes**:
1. Remove call to `mergeBehaviorRules()`
2. Store only user-provided `behavior_rules` directly
3. Config values are stored separately (already done)

**Before**:
```typescript
const userBehaviorRules = configs.behavior_rules as string[] | undefined;
const mergedBehaviorRules = this.agentConfigService.mergeBehaviorRules(
  userBehaviorRules,
  configs
);
const updatedConfigs = {
  ...configs,
  behavior_rules: mergedBehaviorRules,
};
```

**After**:
```typescript
// Store only user-provided rules, don't merge
const updatedConfigs = {
  ...configs,
  // behavior_rules stays as user-provided only
  // Config values (gender, age, etc.) are stored separately
};
```

#### 1.4 Update AgentRepository

**File**: `apps/api/src/agent/agent.repository.ts`

**Changes**:
- Ensure `updateConfigs()` properly handles empty `behavior_rules` array
- When `behavior_rules` is `undefined` or empty array, set to `Prisma.JsonNull` (already implemented)

### Phase 2: Update Message Preparation to Add Config Values as Separate USER Messages

#### 2.1 Update MessagePreparationService Interface

**File**: `apps/api/src/chat/services/message-preparation.service.ts`

**Changes**:
1. Update `AgentConfig` interface to include all config fields:
```typescript
export interface AgentConfig {
  system_prompt?: string;
  behavior_rules?: string; // User-provided only
  temperature?: number;
  model?: string;
  max_tokens?: number;
  agentType?: AgentType | null;
  language?: string | null;
  // Add config fields
  response_length?: ResponseLength;
  age?: number;
  gender?: Gender;
  personality?: string;
  sentiment?: Sentiment;
  interests?: string[];
  availability?: Availability;
}
```

2. Update `prepareMessagesForOpenAI()` to add config values as separate USER messages:
```typescript
// 4. Client behavior rules (user-provided only) - USER role
if (agentConfig.behavior_rules) {
  this.addClientBehaviorRules(messagesForAPI, agentConfig);
}

// 5. Config-generated rules as separate USER messages
this.addConfigGeneratedRules(messagesForAPI, agentConfig);

// 6. Word parsing instruction (only for language assistants) - SYSTEM role
// ... rest of the flow
```

#### 2.2 Add New Method: addConfigGeneratedRules()

**File**: `apps/api/src/chat/services/message-preparation.service.ts`

**New Method**:
```typescript
/**
 * Add config-generated rules as separate USER role messages
 * Each config value (gender, age, personality, sentiment, interests, response length)
 * is added as its own USER message if defined
 */
private addConfigGeneratedRules(
  messagesForAPI: MessageForOpenAI[],
  agentConfig: AgentConfig
): void {
  // Use AgentConfigService to generate rules
  const configs = {
    response_length: agentConfig.response_length,
    age: agentConfig.age,
    gender: agentConfig.gender,
    personality: agentConfig.personality,
    sentiment: agentConfig.sentiment,
    interests: agentConfig.interests,
  };

  const generatedRules = this.agentConfigService.generateBehaviorRulesFromConfig(configs);

  // Add each rule as a separate USER message
  for (const rule of generatedRules) {
    if (rule.content && rule.content.trim().length > 0) {
      messagesForAPI.push({
        role: MessageRole.USER,
        content: rule.content,
      });
    }
  }
}
```

#### 2.3 Update AgentConfigService.generateBehaviorRulesFromConfig()

**File**: `apps/api/src/agent/services/agent-config.service.ts`

**Changes**:
- Keep current implementation but ensure it returns rules in a format suitable for message preparation
- Rules should be returned as an array of strings (one per config value)

**Note**: Current implementation already returns `string[]`, which is correct. No changes needed here.

#### 2.4 Update ChatOrchestrationService

**File**: `apps/api/src/chat/services/chat-orchestration.service.ts`

**Changes**:
- Ensure agent config is loaded with all fields (response_length, age, gender, personality, sentiment, interests)
- Pass complete config to `MessagePreparationService.prepareMessagesForOpenAI()`

**Check**: Verify that `findByIdWithConfig()` in `AgentRepository` returns all config fields.

### Phase 3: Update Frontend (If Needed)

#### 3.1 Verify Frontend Behavior

**Files to Check**:
- `apps/client/src/pages/config/hooks/agent/use-agent-save.ts`
- `apps/client/src/pages/config/components/agent/AgentConfig/parts/BehaviorRulesField.tsx`

**Expected Behavior**:
- Frontend already sends `undefined` when behavior rules are empty ✓
- Frontend already sends config values separately ✓
- No changes needed in frontend

#### 3.2 Update Tests

**Files to Update**:
- `apps/api/src/agent/agent.service.spec.ts`
- `apps/api/src/agent/services/agent-config.service.spec.ts`
- `apps/api/src/chat/services/message-preparation.service.spec.ts`

**Test Cases to Add**:
1. Test that empty behavior_rules array properly clears rules in database
2. Test that config-generated rules are NOT merged into behavior_rules
3. Test that config-generated rules are added as separate USER messages
4. Test message order: system rules → user system prompt → user behavior rules → user config rules → conversation

### Phase 4: Migration Strategy

#### 4.1 Data Migration (If Needed)

**Scenario**: Existing agents have merged rules in `behavior_rules`

**Options**:
1. **No Migration**: Accept that existing agents have merged rules. New saves will separate them.
2. **One-time Migration Script**: Extract user rules from merged rules (complex, error-prone)
3. **Gradual Migration**: As agents are updated, rules are separated

**Recommendation**: Option 3 (Gradual Migration) - No data migration needed. Existing merged rules will continue to work, but new saves will properly separate user rules from config-generated rules.

#### 4.2 Backward Compatibility

**Considerations**:
- Existing agents with merged rules should still work
- Message preparation should handle both merged and separated rules
- Consider adding a flag or detection logic to handle legacy merged rules

**Implementation**:
- In `MessagePreparationService`, if `behavior_rules` contains config-generated patterns, extract them
- Or: Add a migration flag to detect and handle legacy data

## Implementation Steps

### Step 1: Update AgentConfigService (Backend)
1. Remove or deprecate `mergeBehaviorRules()` method
2. Verify `generateBehaviorRulesFromConfig()` returns correct format
3. Add tests for rule generation

### Step 2: Update AgentService (Backend)
1. Remove call to `mergeBehaviorRules()`
2. Store only user-provided `behavior_rules`
3. Update tests

### Step 3: Update MessagePreparationService (Backend)
1. Update `AgentConfig` interface to include all config fields
2. Add `addConfigGeneratedRules()` method
3. Update `prepareMessagesForOpenAI()` to call new method
4. Update tests to verify separate USER messages

### Step 4: Update ChatOrchestrationService (Backend)
1. Verify agent config loading includes all fields
2. Update tests

### Step 5: Testing
1. Test deletion: Delete all behavior rules, save, verify they're cleared
2. Test config rules: Set gender/age/etc., verify separate USER messages
3. Test message order: Verify correct order in OpenAI request
4. Integration tests: End-to-end flow

### Step 6: Documentation
1. Update API documentation
2. Update code comments
3. Update architecture docs

## Risk Assessment

### Low Risk
- Frontend changes: None needed
- Database changes: None needed
- Backward compatibility: Existing merged rules will still work

### Medium Risk
- Message preparation changes: Need to ensure correct message order
- Testing: Need comprehensive tests for new message structure

### Mitigation
- Comprehensive test coverage
- Gradual rollout
- Monitor OpenAI API responses for issues

## Success Criteria

1. ✅ User can delete all behavior rules and they stay deleted after save
2. ✅ Config values (gender, age, personality, sentiment, interests, response length) are added as separate USER role messages
3. ✅ Message order is correct: system rules → user system prompt → user behavior rules → user config rules → conversation
4. ✅ All existing functionality continues to work
5. ✅ Tests pass
6. ✅ No breaking changes to API

## Timeline Estimate

- **Phase 1**: 2-3 hours
- **Phase 2**: 3-4 hours
- **Phase 3**: 1 hour (verification)
- **Phase 4**: 1-2 hours (testing)
- **Total**: 7-10 hours

## Notes

- This refactoring maintains backward compatibility
- No database migrations required
- Frontend changes are not needed
- The main change is in how rules are stored and how messages are prepared
