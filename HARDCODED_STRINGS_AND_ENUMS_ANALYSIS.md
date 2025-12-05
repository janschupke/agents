# Hardcoded Strings, Numbers, and Duplicated Enums Analysis

**Date:** 2024-12-19  
**Scope:** Analysis of hardcoded strings, magic numbers, and duplicated enum definitions across apps

---

## Executive Summary

This analysis identified:
- **8 duplicated enum definitions** that should be centralized in `@openai/shared-types`
- **Multiple hardcoded user-facing strings** that should use i18n translation keys
- **Several magic numbers** that should be extracted to constants

---

## 1. Duplicated Enums (Should be in `@openai/shared-types`)

### 1.1 AgentType Enum
**Status:** ❌ Duplicated across 3 apps

**Locations:**
- `apps/api/src/common/enums/agent-type.enum.ts`
- `apps/admin/src/types/agent.types.ts`
- `apps/client/src/types/agent.types.ts`
- `apps/api/prisma/schema.prisma` (Prisma enum)

**Values:**
```typescript
export enum AgentType {
  GENERAL = 'GENERAL',
  LANGUAGE_ASSISTANT = 'LANGUAGE_ASSISTANT',
}
```

**Recommendation:** Move to `packages/shared-types/src/agent-type.ts` and export from `index.ts`

---

### 1.2 MessageRole Enum
**Status:** ❌ Duplicated across 2 apps + Prisma

**Locations:**
- `apps/api/src/common/enums/message-role.enum.ts`
- `apps/client/src/types/chat.types.ts`
- `apps/api/prisma/schema.prisma` (Prisma enum)

**Values:**
```typescript
export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}
```

**Note:** Also hardcoded as string literals in many API service files (e.g., `'user'`, `'system'`, `'assistant'`)

**Recommendation:** Move to `packages/shared-types/src/message-role.ts` and export from `index.ts`

---

### 1.3 ResponseLength Enum
**Status:** ❌ Duplicated across 3 apps

**Locations:**
- `apps/api/src/common/enums/response-length.enum.ts`
- `apps/admin/src/types/agent.types.ts`
- `apps/client/src/types/agent.types.ts`

**Values:**
```typescript
export enum ResponseLength {
  SHORT = 'short',
  STANDARD = 'standard',
  LONG = 'long',
  ADAPT = 'adapt',
}
```

**Recommendation:** Move to `packages/shared-types/src/response-length.ts` and export from `index.ts`

---

### 1.4 Gender Enum
**Status:** ❌ Duplicated across 3 apps

**Locations:**
- `apps/api/src/common/enums/gender.enum.ts`
- `apps/admin/src/types/agent.types.ts`
- `apps/client/src/types/agent.types.ts`

**Values:**
```typescript
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non-binary',
  PREFER_NOT_TO_SAY = 'prefer-not-to-say',
}
```

**Recommendation:** Move to `packages/shared-types/src/gender.ts` and export from `index.ts`

---

### 1.5 Sentiment Enum
**Status:** ❌ Duplicated across 3 apps

**Locations:**
- `apps/api/src/common/enums/sentiment.enum.ts`
- `apps/admin/src/types/agent.types.ts`
- `apps/client/src/types/agent.types.ts`

**Values:**
```typescript
export enum Sentiment {
  NEUTRAL = 'neutral',
  ENGAGED = 'engaged',
  FRIENDLY = 'friendly',
  ATTRACTED = 'attracted',
  OBSESSED = 'obsessed',
  DISINTERESTED = 'disinterested',
  ANGRY = 'angry',
}
```

**Recommendation:** Move to `packages/shared-types/src/sentiment.ts` and export from `index.ts`

---

### 1.6 Availability Enum
**Status:** ❌ Duplicated across 3 apps

**Locations:**
- `apps/api/src/common/enums/availability.enum.ts`
- `apps/admin/src/types/agent.types.ts`
- `apps/client/src/types/agent.types.ts`

**Values:**
```typescript
export enum Availability {
  AVAILABLE = 'available',
  STANDARD = 'standard',
  BUSY = 'busy',
}
```

**Recommendation:** Move to `packages/shared-types/src/availability.ts` and export from `index.ts`

---

### 1.7 SortOrder/OrderDirection Enum
**Status:** ❌ Duplicated across 2 apps

**Locations:**
- `apps/api/src/common/enums/sort-order.enum.ts` (only has `ASC = 'asc'`)
- `apps/admin/src/types/ai-request-log.enums.ts` (`OrderDirection` with `ASC` and `DESC`)
- `apps/api/src/ai-request-log/constants/ai-request-log.constants.ts` (`OrderDirection` with `ASC` and `DESC`)

**Values:**
```typescript
// API has incomplete enum
export enum SortOrder {
  ASC = 'asc',
}

// Admin and API constants have complete enum
export enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}
```

**Recommendation:** 
- Create unified `SortOrder` enum in `packages/shared-types/src/sort-order.ts` with both `ASC` and `DESC`
- Replace all usages across apps

---

### 1.8 AiRequestLogOrderBy Enum
**Status:** ❌ Duplicated across 2 apps

**Locations:**
- `apps/admin/src/types/ai-request-log.enums.ts`
- `apps/api/src/ai-request-log/constants/ai-request-log.constants.ts`

**Values:**
```typescript
export enum AiRequestLogOrderBy {
  CREATED_AT = 'createdAt',
  ESTIMATED_PRICE = 'estimatedPrice',
  TOTAL_TOKENS = 'totalTokens',
}
```

**Recommendation:** 
- If used in multiple apps, move to `packages/shared-types/src/ai-request-log.ts`
- If only used in admin/API, keep in API and import in admin

---

## 2. Hardcoded User-Facing Strings (Should use i18n)

### 2.1 Success Messages in Client App

**File:** `apps/client/src/hooks/mutations/use-agent-mutations.ts`

**Hardcoded strings:**
```typescript
showToast('Agent created successfully', 'success');
showToast('Agent updated successfully', 'success');
showToast('Agent deleted successfully', 'success');
showToast('Session created successfully', 'success');
showToast('Session updated successfully', 'success');
showToast('Session deleted successfully', 'success');
showToast('Memory updated successfully', 'success');
showToast('Memory deleted successfully', 'success');
```

**Error messages:**
```typescript
'Failed to create agent'
'Failed to update agent'
'Failed to delete agent'
'Failed to create session'
'Failed to update session'
'Failed to delete session'
'Failed to update memory'
'Failed to delete memory'
'Failed to send message'
```

**Recommendation:** Extract to `packages/i18n/src/locales/en/client.json`:
```json
{
  "agents": {
    "createSuccess": "Agent created successfully",
    "createError": "Failed to create agent",
    "updateSuccess": "Agent updated successfully",
    "updateError": "Failed to update agent",
    "deleteSuccess": "Agent deleted successfully",
    "deleteError": "Failed to delete agent"
  },
  "sessions": {
    "createSuccess": "Session created successfully",
    "createError": "Failed to create session",
    "updateSuccess": "Session updated successfully",
    "updateError": "Failed to update session",
    "deleteSuccess": "Session deleted successfully",
    "deleteError": "Failed to delete session"
  },
  "memories": {
    "updateSuccess": "Memory updated successfully",
    "updateError": "Failed to update memory",
    "deleteSuccess": "Memory deleted successfully",
    "deleteError": "Failed to delete memory"
  },
  "chat": {
    "sendMessageError": "Failed to send message"
  }
}
```

---

### 2.2 Confirm Modal Button Text

**Files:**
- `apps/client/src/pages/config/hooks/agent/use-agent-config-operations.ts`
- `apps/client/src/pages/config/hooks/agent/use-agent-memories.ts`
- `apps/client/src/pages/config/hooks/agent/use-agent-delete.ts`
- `apps/client/src/pages/profile/hooks/use-api-key.ts`

**Hardcoded strings:**
```typescript
confirmText: 'Delete',
cancelText: 'Cancel',
```

**Note:** `packages/ui/src/components/modal/ConfirmModal/ConfirmModal.tsx` has defaults:
```typescript
confirmText = 'Confirm',
cancelText = 'Cancel',
```

**Recommendation:** 
- Extract to `packages/i18n/src/locales/en/common.json`:
```json
{
  "buttons": {
    "confirm": "Confirm",
    "cancel": "Cancel",
    "delete": "Delete",
    "save": "Save",
    "close": "Close",
    "back": "Back"
  }
}
```

---

### 2.3 Tooltip Text

**Files:**
- `apps/admin/src/components/shared/PageHeaderWithBack.tsx`: `tooltip="Back"`
- `packages/ui/src/components/modal/Dialog/DialogHeader.tsx`: `tooltip="Close"`
- `packages/ui/src/components/modal/components/ModalHeader.tsx`: `tooltip="Close"`
- `apps/client/src/pages/config/components/agent/AgentConfig/parts/MemoriesList.tsx`: `tooltip="Delete"`

**Recommendation:** Use translation keys for tooltips (same as button text above)

---

### 2.4 Age Field Label

**File:** `apps/admin/src/components/agent/form/PersonalitySection.tsx`

**Hardcoded string:**
```typescript
{isArchetype ? t('archetypes.form.age') : 'Age'} (0-100)
```

**Recommendation:** Always use translation key, even for non-archetype:
```typescript
{t('agents.form.age')} (0-100)
```

---

## 3. Magic Numbers (Should be Constants)

### 3.1 Age Limits

**Status:** ❌ Hardcoded in multiple places

**Locations:**
- `apps/admin/src/components/agent/form/PersonalitySection.tsx`: `max="100"`, validation `0-100`
- `apps/admin/src/hooks/agent/use-agent-form-validation.ts`: `(Number(formValues.age) < 0 || Number(formValues.age) > 100)`
- `apps/api/src/common/dto/agent.dto.ts`: `@Min(0) @Max(100)`
- `apps/api/src/common/dto/agent-archetype.dto.ts`: `@Min(0) @Max(100)`
- `apps/api/src/agent/services/agent-config.service.ts`: `age >= 0 && age <= 100`, `age < 30`

**Recommendation:** Add to `packages/shared-types/src/numeric.ts`:
```typescript
export const NUMERIC_CONSTANTS = {
  // ... existing constants
  // Age limits
  AGE_MIN: 0,
  AGE_MAX: 100,
  AGE_YOUNG_THRESHOLD: 30,
} as const;
```

---

### 3.2 Temperature Defaults and Limits

**Status:** ❌ Hardcoded in multiple places

**Locations:**
- `apps/api/src/common/constants/numeric.constants.ts`: `DEFAULT_TEMPERATURE: 0.7`, `TRANSLATION_TEMPERATURE: 0.3`
- `apps/api/src/common/dto/agent.dto.ts`: `@Min(0) @Max(2)`
- `apps/api/src/common/dto/agent-archetype.dto.ts`: `@Min(0) @Max(2)`
- `apps/client/src/pages/config/hooks/agent/use-agent-form.ts`: `temperature: 0.7` (default)
- Multiple test files: `temperature: 0.7`

**Recommendation:** Add to `packages/shared-types/src/numeric.ts`:
```typescript
export const NUMERIC_CONSTANTS = {
  // ... existing constants
  // Temperature
  TEMPERATURE_MIN: 0,
  TEMPERATURE_MAX: 2,
  TEMPERATURE_DEFAULT: 0.7,
  TEMPERATURE_TRANSLATION: 0.3,
} as const;
```

---

### 3.3 Token Limits

**Status:** ⚠️ Partially centralized

**Locations:**
- `apps/api/src/common/constants/numeric.constants.ts`: 
  - `DEFAULT_MAX_TOKENS: 1000`
  - `MEMORY_EXTRACTION_MAX_TOKENS: 300`
  - `MEMORY_SUMMARIZATION_MAX_TOKENS: 150`
- `apps/api/src/common/dto/agent.dto.ts`: `@Min(1)` for `max_tokens`
- `apps/api/src/message/message.repository.ts`: `limit || 1000`

**Recommendation:** 
- Move API-specific token limits to `apps/api/src/common/constants/numeric.constants.ts` (already there)
- If `DEFAULT_MAX_TOKENS` is used in client/admin, move to `packages/shared-types/src/numeric.ts`

---

### 3.4 Text Truncation Limits

**Status:** ❌ Hardcoded

**Locations:**
- `apps/admin/src/utils/format-ai-request-log.ts`: `maxLength: number = 100`, `truncateText(requestStr, 100)`, `truncateText(responseContent, 100)`
- `apps/api/src/memory/services/memory-summary.service.ts`: `summary.substring(0, 1000)`

**Recommendation:** Add to `packages/shared-types/src/numeric.ts`:
```typescript
export const NUMERIC_CONSTANTS = {
  // ... existing constants
  // Text limits
  TEXT_TRUNCATE_DEFAULT: 100,
  TEXT_TRUNCATE_LONG: 1000,
} as const;
```

---

### 3.5 Scroll Delays

**Status:** ❌ Hardcoded

**Location:** `apps/client/src/pages/chat/components/chat/ChatMessages/hooks/use-chat-scroll.ts`

**Hardcoded:**
```typescript
const delays = [150, 300, 600, 1000];
```

**Recommendation:** Add to `packages/shared-types/src/numeric.ts`:
```typescript
export const NUMERIC_CONSTANTS = {
  // ... existing constants
  // Scroll delays (milliseconds)
  SCROLL_DELAY_SHORT: 150,
  SCROLL_DELAY_MEDIUM: 300,
  SCROLL_DELAY_LONG: 600,
  SCROLL_DELAY_VERY_LONG: 1000,
} as const;
```

---

### 3.6 HTTP Status Codes

**Status:** ✅ Already in `packages/shared-types/src/http-status.ts`

**Note:** Some hardcoded status checks exist:
- `apps/admin/src/utils/extract-error-message.ts`: `error.status >= 500`
- `apps/api/src/common/utils/openai-error-handler.util.ts`: `errorObj.status === 400`, `errorObj.status === 500`

**Recommendation:** Use constants from `@openai/shared-types`:
```typescript
import { HTTP_STATUS } from '@openai/shared-types';

if (error.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) { ... }
```

---

### 3.7 Other Magic Numbers

**Status:** ⚠️ Review needed

**Locations:**
- `apps/client/src/pages/saved-words/SavedWords.tsx`: `<option value={100}>100</option>` (page size)
- `apps/api/src/common/constants/api.constants.ts`: `MEMORY_SUMMARIZATION_INTERVAL: 10`, `MAX_MEMORY_LENGTH: 200`
- `apps/api/src/memory/agent-memory.repository.ts`: `limit: number = 100` (default limit)

**Recommendation:** Review if these should be constants or if they're context-specific

---

## 4. Hardcoded String Literals (Should use Enums)

### 4.1 Message Role Strings

**Status:** ❌ Hardcoded string literals instead of enum

**Locations:** Many API service files use `'user'`, `'system'`, `'assistant'` instead of `MessageRole` enum:
- `apps/api/src/memory/services/memory-extraction.service.ts`
- `apps/api/src/message-translation/strategies/initial-translation.strategy.ts`
- `apps/api/src/message-translation/services/word-translation-openai.service.ts`
- `apps/api/src/message-translation/message-translation.service.ts`
- `apps/api/src/chat/services/openai-chat.service.ts`
- `apps/api/src/memory/services/memory-summary.service.ts`
- `apps/api/src/openai/openai.service.ts`
- And many test files

**Recommendation:** 
- After moving `MessageRole` to `@openai/shared-types`, replace all string literals with enum values
- Create utility function to convert enum to lowercase string if needed for OpenAI API

---

### 4.2 LogType Strings

**Status:** ❌ Hardcoded string literals

**Locations:**
- `apps/admin/src/types/ai-request-log.types.ts`: `export type LogType = 'MESSAGE' | 'MEMORY' | 'TRANSLATION';`
- `apps/api/prisma/schema.prisma`: `enum LogType { MESSAGE, MEMORY, TRANSLATION }`
- Multiple API files use `'MESSAGE'`, `'TRANSLATION'` as string literals

**Recommendation:** 
- Create `LogType` enum in `packages/shared-types/src/log-type.ts`
- Replace all string literals with enum

---

### 4.3 Sort Direction Strings

**Status:** ❌ Hardcoded string literals

**Locations:**
- `apps/client/src/pages/saved-words/SavedWords.tsx`: `useState<'asc' | 'desc'>('desc')`
- `apps/client/src/pages/saved-words/components/SavedWordsTable/SavedWordsTable.tsx`: `sortDirection: 'asc' | 'desc'`
- Multiple repository files: `orderBy: { createdAt: 'desc' }`, `orderBy: { createdAt: 'asc' }`

**Recommendation:** 
- After creating unified `SortOrder` enum in `@openai/shared-types`, replace all string literals

---

## 5. Priority Recommendations

### High Priority
1. **Move duplicated enums to `@openai/shared-types`**:
   - AgentType
   - MessageRole
   - ResponseLength
   - Gender
   - Sentiment
   - Availability
   - SortOrder (unified)

2. **Extract hardcoded success/error messages to i18n**:
   - All messages in `apps/client/src/hooks/mutations/use-agent-mutations.ts`

3. **Extract magic numbers to constants**:
   - Age limits (0, 100, 30)
   - Temperature defaults and limits (0, 2, 0.7, 0.3)

### Medium Priority
4. **Extract button/tooltip text to i18n**:
   - Confirm/Cancel/Delete/Close/Back buttons
   - Tooltip text

5. **Replace string literals with enums**:
   - Message role strings (`'user'`, `'system'`, `'assistant'`)
   - Sort direction strings (`'asc'`, `'desc'`)
   - LogType strings

### Low Priority
6. **Extract other magic numbers**:
   - Text truncation limits
   - Scroll delays
   - Page size options

---

## 6. Implementation Notes

### For Enums
1. Create new files in `packages/shared-types/src/` for each enum
2. Export from `packages/shared-types/src/index.ts`
3. Update imports in all apps
4. Remove duplicate enum definitions
5. Update Prisma schema to use string values that match enum values

### For i18n
1. Add translation keys to `packages/i18n/src/locales/en/client.json` and `common.json`
2. Update code to use `t()` function with translation keys
3. Remove hardcoded strings

### For Constants
1. Add constants to `packages/shared-types/src/numeric.ts`
2. Update code to import and use constants
3. Remove magic numbers

---

## 7. Files to Update

### Shared Types (New Files)
- `packages/shared-types/src/agent-type.ts`
- `packages/shared-types/src/message-role.ts`
- `packages/shared-types/src/response-length.ts`
- `packages/shared-types/src/gender.ts`
- `packages/shared-types/src/sentiment.ts`
- `packages/shared-types/src/availability.ts`
- `packages/shared-types/src/sort-order.ts`
- `packages/shared-types/src/log-type.ts` (if needed)

### Shared Types (Update)
- `packages/shared-types/src/numeric.ts` (add age, temperature, text limits, scroll delays)
- `packages/shared-types/src/index.ts` (export new enums)

### i18n (Update)
- `packages/i18n/src/locales/en/client.json` (add success/error messages)
- `packages/i18n/src/locales/en/common.json` (add button text)

### Apps (Update Imports)
- All files importing duplicated enums
- All files with hardcoded strings
- All files with magic numbers

---

## Summary

**Total Issues Found:**
- 8 duplicated enum definitions
- ~20+ hardcoded user-facing strings
- ~15+ magic numbers
- ~50+ string literal usages that should use enums

**Estimated Impact:**
- High: Centralizing enums will improve type safety and reduce maintenance
- High: Extracting strings to i18n will enable proper internationalization
- Medium: Extracting magic numbers will improve maintainability
