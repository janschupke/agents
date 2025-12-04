# Agent Configuration and UI Enhancement Refactoring Plan

## Overview

This document outlines a comprehensive refactoring plan to enhance agent configuration and UI options. The main goals are:

1. **Agent Type Classification**: Distinguish between "general agents" and "language assistants"
2. **Conditional Translation Features**: Disable translation utilities for general agents
3. **Language Configuration**: Add optional language field to agents
4. **Configuration Rules System**: Implement a clear, maintainable system for configuration rules (datetime, language) that come after admin-defined system rules but before user-defined behavior rules
5. **Language Assistant Service**: Create a service/module to recognize and handle language assistant logic
6. **UI Formatting Configuration**: Make pinyin and other formatting options configurable and extensible based on agent language
7. **Flashcard Agent Filtering**: Add agent selector to flashcards UI for language determination at agent level

---

## Phase 1: Database Schema Updates

### 1.1 Add Agent Type and Language Fields

**File**: `apps/api/prisma/schema.prisma`

Add new fields to the `Agent` model:

```prisma
model Agent {
  id          Int           @id @default(autoincrement())
  userId      String        @map("user_id")
  name        String
  description String?
  avatarUrl   String?       @map("avatar_url")
  agentType   String?       @map("agent_type") // 'general' | 'language_assistant' | null (defaults to 'general')
  language    String?       // Optional language code (e.g., 'zh', 'en', 'ja')
  createdAt   DateTime      @default(now()) @map("created_at")
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  configs     AgentConfig[]
  sessions    ChatSession[]
  memories    AgentMemory[]
  savedWords  SavedWord[]

  @@index([userId])
  @@index([agentType])
  @@index([language])
  @@map("agents")
}
```

**Migration Strategy**:
- Create migration to add `agent_type` and `language` columns (both nullable)
- Default `agent_type` to `'general'` for existing agents
- `language` remains nullable (optional field)

**Migration File**: `apps/api/prisma/migrations/XXXX_add_agent_type_and_language/migration.sql`

```sql
ALTER TABLE agents ADD COLUMN agent_type VARCHAR(50);
ALTER TABLE agents ADD COLUMN language VARCHAR(10);

-- Set default for existing agents
UPDATE agents SET agent_type = 'general' WHERE agent_type IS NULL;

-- Add indexes
CREATE INDEX idx_agents_agent_type ON agents(agent_type);
CREATE INDEX idx_agents_language ON agents(language);
```

---

## Phase 2: Backend API Updates

### 2.1 Create Agent Type Enum

**File**: `apps/api/src/common/enums/agent-type.enum.ts`

```typescript
export enum AgentType {
  GENERAL = 'general',
  LANGUAGE_ASSISTANT = 'language_assistant',
}
```

### 2.2 Update DTOs

**File**: `apps/api/src/common/dto/agent.dto.ts`

Add new fields to DTOs:

```typescript
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  IsEnum,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AgentType } from '../enums/agent-type.enum';

export class AgentConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsString()
  system_prompt?: string;

  @IsOptional()
  behavior_rules?: string | string[] | { rules: string[] };

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  max_tokens?: number;
}

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(AgentType)
  agentType?: AgentType;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  language?: string; // ISO 639-1 language code (e.g., 'zh', 'en', 'ja')

  @IsOptional()
  @ValidateNested()
  @Type(() => AgentConfigDto)
  configs?: AgentConfigDto;
}

export class UpdateAgentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(AgentType)
  agentType?: AgentType;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  language?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AgentConfigDto)
  configs?: AgentConfigDto;
}
```

### 2.3 Update Agent Service

**File**: `apps/api/src/agent/agent.service.ts`

Update service methods to handle new fields:

```typescript
  async create(
    userId: string,
    name: string,
    description?: string,
    avatarUrl?: string,
    agentType?: AgentType,
    language?: string,
    configs?: Record<string, unknown>
  ): Promise<AgentResponse> {
    // ... existing validation ...

    const agent = await this.agentRepository.create(
      userId,
      name,
      description,
      avatarUrl,
      agentType || AgentType.GENERAL, // Default to 'general'
      language
    );

  // ... rest of method ...
}

  async update(
    id: number,
    userId: string,
    name: string,
    description?: string,
    avatarUrl?: string,
    agentType?: AgentType,
    language?: string,
    configs?: Record<string, unknown>
  ): Promise<AgentResponse> {
  // ... existing validation ...

  const updated = await this.agentRepository.update(
    id,
    userId,
    name,
    description,
    avatarUrl,
    agentType,
    language
  );

  // ... rest of method ...
}
```

### 2.4 Update Agent Repository

**File**: `apps/api/src/agent/agent.repository.ts`

Update repository methods to handle new fields:

```typescript
  async create(
  userId: string,
  name: string,
  description?: string,
  avatarUrl?: string,
  agentType: AgentType = AgentType.GENERAL,
  language?: string
): Promise<Agent> {
  return this.prisma.agent.create({
    data: {
      userId,
      name,
      description,
      avatarUrl,
      agentType,
      language,
    },
  });
}

  async update(
  id: number,
  userId: string,
  name: string,
  description?: string,
  avatarUrl?: string,
  agentType?: AgentType,
  language?: string
): Promise<Agent | null> {
  return this.prisma.agent.update({
    where: { id, userId },
    data: {
      name,
      description,
      avatarUrl,
      agentType,
      language,
    },
  });
}
```

### 2.5 Update Agent Controller

**File**: `apps/api/src/agent/agent.controller.ts`

Update controller to accept new fields:

```typescript
@Post()
async create(
  @Body() createAgentDto: CreateAgentDto,
  @User() user: AuthenticatedUser
) {
  return this.agentService.create(
    user.id,
    createAgentDto.name,
    createAgentDto.description,
    createAgentDto.avatarUrl,
    createAgentDto.agentType,
    createAgentDto.language,
    createAgentDto.configs ? mapAgentConfigs(createAgentDto.configs) : undefined
  );
}

@Put(':id')
async update(
  @Param('id', ParseIntPipe) id: number,
  @Body() updateAgentDto: UpdateAgentDto,
  @User() user: AuthenticatedUser
) {
  return this.agentService.update(
    id,
    user.id,
    updateAgentDto.name,
    updateAgentDto.description,
    updateAgentDto.avatarUrl,
    updateAgentDto.agentType,
    updateAgentDto.language,
    updateAgentDto.configs ? mapAgentConfigs(updateAgentDto.configs) : undefined
  );
}
```

### 2.6 Update Agent Interfaces

**File**: `apps/api/src/common/interfaces/agent.interface.ts`

```typescript
import { AgentType } from '../enums/agent-type.enum';

export interface AgentWithConfig {
  id: number;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  agentType: AgentType | null;
  language: string | null;
  configs: Record<string, unknown>;
}

export interface AgentResponse {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  agentType: AgentType | null;
  language: string | null;
  createdAt: Date;
  configs?: Record<string, unknown>;
}
```

---

## Phase 3: Language Assistant Service

### 3.1 Create Language Assistant Service

**File**: `apps/api/src/agent/services/language-assistant.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { AgentWithConfig } from '../../common/interfaces/agent.interface';
import { AgentType } from '../../common/enums/agent-type.enum';

@Injectable()
export class LanguageAssistantService {
  private readonly logger = new Logger(LanguageAssistantService.name);

  /**
   * Check if agent is a language assistant
   */
  isLanguageAssistant(agent: AgentWithConfig | { agentType?: AgentType | string | null }): boolean {
    return agent.agentType === AgentType.LANGUAGE_ASSISTANT;
  }

  /**
   * Check if agent is a general agent
   */
  isGeneralAgent(agent: AgentWithConfig | { agentType?: AgentType | string | null }): boolean {
    const agentType = agent.agentType;
    return !agentType || agentType === AgentType.GENERAL;
  }

  /**
   * Get agent language if set
   */
  getAgentLanguage(agent: AgentWithConfig | { language?: string | null }): string | null {
    return agent.language || null;
  }

  /**
   * Check if agent has language configured
   */
  hasLanguage(agent: AgentWithConfig | { language?: string | null }): boolean {
    return !!agent.language;
  }

  /**
   * Validate language code format (ISO 639-1)
   */
  isValidLanguageCode(language: string): boolean {
    // Basic validation: 2-10 characters, alphanumeric with optional hyphens
    return /^[a-z]{2}(-[A-Z]{2,8})?$/.test(language);
  }
}
```

### 3.2 Create Configuration Rules Service

**File**: `apps/api/src/chat/services/configuration-rules.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { AgentWithConfig } from '../../common/interfaces/agent.interface';
import { LanguageAssistantService } from '../../agent/services/language-assistant.service';

export interface ConfigurationRule {
  content: string;
  order: number; // Lower numbers come first
}

@Injectable()
export class ConfigurationRulesService {
  private readonly logger = new Logger(ConfigurationRulesService.name);

  constructor(
    private readonly languageAssistantService: LanguageAssistantService
  ) {}

  /**
   * Generate configuration rules for an agent
   * These rules come after admin-defined system rules but before user-defined behavior rules
   * 
   * Order:
   * 1. Admin-defined system rules (handled in MessagePreparationService)
   * 2. Configuration rules (datetime, language) - THIS SERVICE
   * 3. User-defined behavior rules (handled in MessagePreparationService)
   */
  generateConfigurationRules(
    agent: AgentWithConfig,
    currentDateTime: Date = new Date()
  ): ConfigurationRule[] {
    const rules: ConfigurationRule[] = [];

    // Rule 1: Current datetime (always added)
    const datetimeRule = this.generateDatetimeRule(currentDateTime);
    rules.push({
      content: datetimeRule,
      order: 1,
    });

    // Rule 2: Language rule (if language is set)
    const language = this.languageAssistantService.getAgentLanguage(agent);
    if (language) {
      const languageRule = this.generateLanguageRule(language);
      rules.push({
        content: languageRule,
        order: 2,
      });
    }

    // Sort by order to ensure correct sequence
    return rules.sort((a, b) => a.order - b.order);
  }

  /**
   * Generate datetime rule
   */
  private generateDatetimeRule(currentDateTime: Date): string {
    // Format: "Currently it's {ISO 8601 datetime}"
    const isoString = currentDateTime.toISOString();
    return `Currently it's ${isoString}`;
  }

  /**
   * Generate language rule
   */
  private generateLanguageRule(language: string): string {
    // Format: "Always respond in {language}"
    // Language name could be enhanced with a language name mapping service
    return `Always respond in ${language}`;
  }

  /**
   * Format configuration rules as a single system message
   */
  formatConfigurationRules(rules: ConfigurationRule[]): string {
    if (rules.length === 0) {
      return '';
    }

    const formattedRules = rules.map((rule) => rule.content).join('\n');
    return formattedRules;
  }
}
```

---

## Phase 4: Message Preparation Refactoring

### 4.1 Update Message Preparation Service

**File**: `apps/api/src/chat/services/message-preparation.service.ts`

Refactor to include configuration rules in the correct order:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { MessageRole } from '../../common/enums/message-role.enum';
import { BehaviorRulesUtil } from '../../common/utils/behavior-rules.util';
import { SystemConfigRepository } from '../../system-config/system-config.repository';
import { ConfigurationRulesService } from './configuration-rules.service';
import { LanguageAssistantService } from '../../agent/services/language-assistant.service';
import { AgentWithConfig } from '../../common/interfaces/agent.interface';
import { AgentType } from '../../common/enums/agent-type.enum';

export interface MessageForOpenAI {
  role: MessageRole;
  content: string;
}

import { AgentType } from '../../common/enums/agent-type.enum';

export interface AgentConfig {
  system_prompt?: string;
  behavior_rules?: string;
  agentType?: AgentType | null;
  language?: string | null;
}

@Injectable()
export class MessagePreparationService {
  private readonly logger = new Logger(MessagePreparationService.name);

  constructor(
    private readonly systemConfigRepository: SystemConfigRepository,
    private readonly configurationRulesService: ConfigurationRulesService,
    private readonly languageAssistantService: LanguageAssistantService
  ) {}

  /**
   * Prepare messages array for OpenAI API call
   * Handles: system prompts, behavior rules, memory context, and user messages
   * 
   * Rule Order:
   * 1. System prompt
   * 2. Admin-defined system behavior rules
   * 3. Configuration rules (datetime, language) - from ConfigurationRulesService
   * 4. User-defined behavior rules
   * 5. Word parsing instruction (only for language assistants)
   */
  async prepareMessagesForOpenAI(
    existingMessages: MessageForOpenAI[],
    agentConfig: AgentConfig,
    userMessage: string,
    relevantMemories: string[],
    currentDateTime: Date = new Date()
  ): Promise<MessageForOpenAI[]> {
    this.logger.debug(
      `Preparing messages for OpenAI. Agent type: ${agentConfig.agentType || AgentType.GENERAL}, Language: ${agentConfig.language || 'none'}`
    );

    // Start with existing messages
    const messagesForAPI = [...existingMessages];

    // Add memory context if found
    if (relevantMemories.length > 0) {
      this.logger.debug(`Adding ${relevantMemories.length} memory contexts`);
      this.addMemoryContext(relevantMemories, messagesForAPI);
    }

    // Add system prompt if not already present
    if (agentConfig.system_prompt) {
      this.logger.debug('Adding system prompt');
      this.addSystemPrompt(messagesForAPI, String(agentConfig.system_prompt));
    }

    // Add system-wide behavior rules (admin-defined)
    await this.addSystemBehaviorRules(messagesForAPI, agentConfig);

    // Add configuration rules (datetime, language) - AFTER admin rules, BEFORE user rules
    this.addConfigurationRules(messagesForAPI, agentConfig, currentDateTime);

    // Add agent-specific behavior rules (user-defined)
    if (agentConfig.behavior_rules) {
      this.logger.debug('Adding agent-specific behavior rules');
      this.addAgentBehaviorRules(messagesForAPI, agentConfig);
    }

    // Add word parsing instruction ONLY for language assistants
    const isLanguageAssistant = this.languageAssistantService.isLanguageAssistant({
      agentType: agentConfig.agentType,
    });
    if (isLanguageAssistant) {
      this.logger.debug('Adding word parsing instruction for language assistant');
      this.addWordParsingInstruction(messagesForAPI);
    }

    // Add user message
    messagesForAPI.push({
      role: MessageRole.USER,
      content: userMessage,
    });

    this.logger.debug(`Prepared ${messagesForAPI.length} messages for OpenAI`);
    return messagesForAPI;
  }

  /**
   * Add configuration rules (datetime, language)
   * These come after admin-defined system rules but before user-defined behavior rules
   */
  private addConfigurationRules(
    messagesForAPI: MessageForOpenAI[],
    agentConfig: AgentConfig,
    currentDateTime: Date
  ): void {
    const agent: AgentWithConfig = {
      id: 0, // Not needed for configuration rules
      name: '',
      description: null,
      avatarUrl: null,
      agentType: agentConfig.agentType || AgentType.GENERAL,
      language: agentConfig.language || null,
      configs: {},
    };

    const configurationRules = this.configurationRulesService.generateConfigurationRules(
      agent,
      currentDateTime
    );

    if (configurationRules.length === 0) {
      return;
    }

    const configurationRulesMessage =
      this.configurationRulesService.formatConfigurationRules(configurationRules);

    if (configurationRulesMessage.length > 0) {
      // Check if configuration rules are already present
      if (
        !messagesForAPI.some(
          (m) =>
            m.role === MessageRole.SYSTEM &&
            m.content === configurationRulesMessage
        )
      ) {
        // Find insertion point: after system prompt and admin rules, before user behavior rules
        // Insert after the last system message (which should be admin rules)
        const lastSystemIndex = messagesForAPI
          .map((m, i) => ({ role: m.role, index: i }))
          .filter((m) => m.role === MessageRole.SYSTEM)
          .pop()?.index;

        if (lastSystemIndex !== undefined) {
          // Insert after last system message
          messagesForAPI.splice(lastSystemIndex + 1, 0, {
            role: MessageRole.SYSTEM,
            content: configurationRulesMessage,
          });
        } else {
          // No system messages found, add at the beginning
          messagesForAPI.unshift({
            role: MessageRole.SYSTEM,
            content: configurationRulesMessage,
          });
        }
      }
    }
  }

  // ... rest of existing methods (addMemoryContext, addSystemPrompt, addSystemBehaviorRules, addAgentBehaviorRules) ...

  /**
   * Add instruction for assistant to include translations in response (required)
   * ONLY called for language assistants
   */
  private addWordParsingInstruction(
    messagesForAPI: MessageForOpenAI[]
  ): void {
    // ... existing implementation ...
  }
}
```

### 4.2 Update Chat Service to Pass Agent Info

**File**: `apps/api/src/chat/chat.service.ts`

Update to pass agent type and language to message preparation:

```typescript
// In the method that calls prepareMessagesForOpenAI
const agentConfig: AgentConfig = {
  system_prompt: agent.configs.system_prompt as string | undefined,
  behavior_rules: agent.configs.behavior_rules as string | undefined,
  agentType: agent.agentType,
  language: agent.language,
};

const messagesForAPI = await this.messagePreparationService.prepareMessagesForOpenAI(
  existingMessages,
  agentConfig,
  userMessage,
  relevantMemories,
  new Date() // Current datetime
);
```

---

## Phase 5: Frontend Type Updates

### 5.1 Update Agent Types

**File**: `apps/client/src/types/chat.types.ts`

```typescript
import { AgentType } from './agent.types';

export interface Agent {
  id: number;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  agentType: AgentType | null;
  language: string | null;
  createdAt: string;
  configs?: {
    temperature?: number;
    system_prompt?: string;
    behavior_rules?: string | unknown;
  };
}
```

### 5.2 Update Agent Service

**File**: `apps/client/src/services/agent/agent.service.ts`

Update to handle new fields:

```typescript
import { AgentType } from '../../types/agent.types';

export interface CreateAgentRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;
  configs?: {
    temperature?: number;
    system_prompt?: string;
    behavior_rules?: string | string[] | { rules: string[] };
    model?: string;
    max_tokens?: number;
  };
}

export interface UpdateAgentRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;
  configs?: {
    temperature?: number;
    system_prompt?: string;
    behavior_rules?: string | string[] | { rules: string[] };
    model?: string;
    max_tokens?: number;
  };
}
```

---

## Phase 6: Frontend UI Updates

### 6.1 Create Language Assistant Utility Hook

**File**: `apps/client/src/hooks/agent/use-language-assistant.ts`

```typescript
import { useMemo } from 'react';
import { Agent } from '../../types/chat.types';
import { AgentType } from '../../types/agent.types';

export function useLanguageAssistant(agent: Agent | null | undefined) {
  return useMemo(() => {
    if (!agent) {
      return {
        isLanguageAssistant: false,
        isGeneralAgent: true,
        language: null,
        hasLanguage: false,
      };
    }

    const isLanguageAssistant = agent.agentType === AgentType.LANGUAGE_ASSISTANT;
    const isGeneralAgent = !agent.agentType || agent.agentType === AgentType.GENERAL;
    const language = agent.language || null;
    const hasLanguage = !!agent.language;

    return {
      isLanguageAssistant,
      isGeneralAgent,
      language,
      hasLanguage,
    };
  }, [agent]);
}
```

### 6.2 Update Agent Config Form

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/AgentConfigForm.tsx`

Add new fields to the form:

```typescript
// Add to form fields
<AgentTypeField
  value={values.agentType}
  onChange={(val) => setValue('agentType', val)}
/>

<LanguageField
  value={values.language}
  agentType={values.agentType}
  onChange={(val) => setValue('language', val)}
/>
```

### 6.3 Create Agent Type Enum (Frontend)

**File**: `apps/client/src/types/agent.types.ts`

```typescript
export enum AgentType {
  GENERAL = 'general',
  LANGUAGE_ASSISTANT = 'language_assistant',
}
```

### 6.4 Create Agent Type Field Component

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/AgentTypeField.tsx`

```typescript
import { Select, FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { AgentType } from '../../../../../types/agent.types';

interface AgentTypeFieldProps {
  value: AgentType | null | undefined;
  onChange: (value: AgentType) => void;
  error?: string | null;
  touched?: boolean;
}

export default function AgentTypeField({
  value,
  onChange,
  error,
  touched,
}: AgentTypeFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField
      label={t('config.agentType.label')}
      hint={t('config.agentType.description')}
      error={error}
      touched={touched}
    >
      <Select
        value={value || AgentType.GENERAL}
        onChange={(e) => onChange(e.target.value as AgentType)}
      >
        <option value={AgentType.GENERAL}>{t('config.agentType.general')}</option>
        <option value={AgentType.LANGUAGE_ASSISTANT}>{t('config.agentType.languageAssistant')}</option>
      </Select>
    </FormField>
  );
}
```

### 6.5 Create Language Constants

**File**: `apps/client/src/constants/language.constants.ts`

```typescript
export interface LanguageOption {
  value: string;
  label: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'zh', label: 'Chinese (Simplified)' },
  { value: 'zh-TW', label: 'Chinese (Traditional)' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  // Add more as needed
] as const;
```

### 6.6 Create Language Field Component

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/LanguageField.tsx`

```typescript
import { Select, FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { LANGUAGE_OPTIONS } from '../../../../../constants/language.constants';
import { AgentType } from '../../../../../types/agent.types';

interface LanguageFieldProps {
  value: string | null | undefined;
  agentType: AgentType | null | undefined;
  onChange: (value: string | null) => void;
  error?: string | null;
  touched?: boolean;
}

export default function LanguageField({
  value,
  agentType,
  onChange,
  error,
  touched,
}: LanguageFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  // Language field is available for both general agents and language assistants
  const isEnabled = true;

  return (
    <FormField
      label={t('config.language.label')}
      hint={t('config.language.description')}
      error={error}
      touched={touched}
    >
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={!isEnabled}
      >
        <option value="">{t('config.language.none')}</option>
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormField>
  );
}
```

### 6.7 Update Agent Form Hook

**File**: `apps/client/src/pages/config/hooks/agent/use-agent-form.ts`

Add new fields to form state:

```typescript
import { AgentType } from '../../../../types/agent.types';

interface AgentFormValues {
  name: string;
  description: string;
  avatarUrl: string;
  temperature: number;
  systemPrompt: string;
  behaviorRules: string[];
  agentType: AgentType;
  language: string | null;
}
```

---

## Phase 7: Conditional Translation Features

### 7.1 Update Chat Messages Component

**File**: `apps/client/src/pages/chat/components/chat/ChatMessages/ChatMessages.tsx`

Conditionally enable translation features based on agent type:

```typescript
import { useLanguageAssistant } from '../../../../../hooks/agent/use-language-assistant';

export default function ChatMessages({ agent, ... }: ChatMessagesProps) {
  const { isLanguageAssistant } = useLanguageAssistant(agent);

  // Only enable translation features for language assistants
  const enableTranslation = isLanguageAssistant;

  return (
    <div>
      {/* Conditionally render translation features */}
      {enableTranslation && (
        <MessageBubble
          message={message}
          wordTranslations={message.wordTranslations}
          savedWordMatches={savedWordMatches}
          onWordClick={onWordClick}
        />
      )}
      {!enableTranslation && (
        <MessageBubble
          message={message}
          // No translation features
        />
      )}
    </div>
  );
}
```

### 7.2 Update Message Bubble Component

**File**: `apps/client/src/pages/chat/components/chat/ChatMessages/parts/MessageBubble.tsx`

Make translation features conditional:

```typescript
interface MessageBubbleProps {
  message: Message;
  agent?: Agent | null;
  savedWordMatches?: Map<string, SavedWordMatch>;
  onWordClick?: (word: string, translation: string, pinyin: string | null, savedWordId?: number, sentence?: string) => void;
  onShowJson?: () => void;
  messageId?: number;
}

export default function MessageBubble({
  message,
  agent,
  savedWordMatches,
  onWordClick,
  onShowJson,
  messageId,
}: MessageBubbleProps) {
  const { isLanguageAssistant } = useLanguageAssistant(agent);

  // Only use translation features if agent is a language assistant
  const enableTranslation = isLanguageAssistant;

  return (
    <div>
      {enableTranslation ? (
        <TranslatableMarkdownContent
          content={message.content}
          wordTranslations={message.wordTranslations || []}
          savedWordMatches={savedWordMatches}
          onWordClick={onWordClick}
        />
      ) : (
        <MarkdownContent content={message.content} />
      )}
    </div>
  );
}
```

---

## Phase 8: Language Formatting Configuration

### 8.1 Create Language Formatting Service

**File**: `apps/client/src/services/language-formatting/language-formatting.service.ts`

```typescript
export interface LanguageFormattingConfig {
  showPinyin: boolean;
  showFurigana?: boolean; // For Japanese (future)
  showRomanization?: boolean; // For Korean (future)
  // Extensible for future formatting options
}

export class LanguageFormattingService {
  /**
   * Get formatting configuration for a language
   */
  static getFormattingConfig(language: string | null): LanguageFormattingConfig {
    if (!language) {
      return { showPinyin: false };
    }

    // Chinese variants
    if (language.startsWith('zh')) {
      return { showPinyin: true };
    }

    // Japanese (future)
    if (language === 'ja') {
      return { showPinyin: false, showFurigana: true };
    }

    // Korean (future)
    if (language === 'ko') {
      return { showPinyin: false, showRomanization: true };
    }

    // Default: no special formatting
    return { showPinyin: false };
  }

  /**
   * Check if pinyin should be shown for a language
   */
  static shouldShowPinyin(language: string | null): boolean {
    const config = this.getFormattingConfig(language);
    return config.showPinyin || false;
  }
}
```

### 8.2 Update Word Tooltip Component

**File**: `apps/client/src/pages/chat/components/translation/WordTooltip/WordTooltip.tsx`

Make pinyin conditional based on language:

```typescript
import { LanguageFormattingService } from '../../../../../services/language-formatting/language-formatting.service';

interface WordTooltipProps {
  translation?: string;
  pinyin?: string | null;
  originalWord: string;
  savedWordId?: number;
  onClick?: () => void;
  children: React.ReactNode;
  language?: string | null; // Agent language
}

export default function WordTooltip({
  translation,
  pinyin,
  originalWord,
  savedWordId,
  onClick,
  children,
  language,
}: WordTooltipProps) {
  // Only show pinyin if language formatting config says so
  const shouldShowPinyin = LanguageFormattingService.shouldShowPinyin(language);
  const displayPinyin = shouldShowPinyin ? pinyin : null;

  // ... rest of component using displayPinyin instead of pinyin ...
}
```

### 8.3 Update Word Presenter Component

**File**: `apps/client/src/pages/chat/components/translation/WordPresenter/WordPresenter.tsx`

Pass language to WordTooltip:

```typescript
interface WordPresenterProps {
  text: string;
  wordTranslations: WordTranslation[];
  savedWordMatches?: Map<string, SavedWordMatch>;
  onWordClick?: (word: string, translation: string, pinyin: string | null, savedWordId?: number, sentence?: string) => void;
  language?: string | null; // Agent language
}

export default function WordPresenter({
  text,
  wordTranslations,
  savedWordMatches,
  onWordClick,
  language,
}: WordPresenterProps) {
  // ... existing logic ...

  return (
    <>
      {parts.map((part, index) => {
        // ... existing logic ...

        return (
          <WordTooltip
            key={index}
            translation={part.translation}
            pinyin={pinyin}
            originalWord={part.text}
            savedWordId={savedMatch?.savedWordId}
            language={language} // Pass language
            onClick={onWordClick ? () => onWordClick(...) : undefined}
          >
            {part.text}
          </WordTooltip>
        );
      })}
    </>
  );
}
```

### 8.4 Update Translatable Markdown Content

**File**: `apps/client/src/pages/chat/components/markdown/TranslatableMarkdownContent/TranslatableMarkdownContent.tsx`

Pass language through:

```typescript
interface TranslatableMarkdownContentProps {
  content: string;
  wordTranslations?: WordTranslation[];
  savedWordMatches?: Map<string, SavedWordMatch>;
  onWordClick?: (word: string, translation: string, pinyin: string | null, savedWordId?: number, sentence?: string) => void;
  className?: string;
  language?: string | null; // Agent language
}

export default function TranslatableMarkdownContent({
  content,
  wordTranslations = [],
  savedWordMatches,
  onWordClick,
  className = '',
  language,
}: TranslatableMarkdownContentProps) {
  // ... existing logic ...

  const textComponent = (props: any) => {
    const value = props.value;
    if (typeof value === 'string' && value.trim().length > 0) {
      return (
        <WordPresenter
          text={value}
          wordTranslations={wordTranslations}
          savedWordMatches={savedWordMatches}
          onWordClick={onWordClick}
          language={language} // Pass language
        />
      );
    }
    return <>{value}</>;
  };

  // ... rest of component ...
}
```

---

## Phase 9: Flashcard Agent Filtering

### 9.1 Update API Constants

**File**: `apps/client/src/constants/api.constants.ts`

Add language filter endpoint:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints ...
  SAVED_WORDS: {
    BASE: '/api/saved-words',
    BY_LANGUAGE: (language: string) => `/api/saved-words?language=${language}`,
    MATCHING: (words: string[]) =>
      `/api/saved-words/matching?words=${words.join(',')}`,
    BY_ID: (id: number) => `/api/saved-words/${id}`,
    SENTENCES: (id: number) => `/api/saved-words/${id}/sentences`,
    SENTENCE: (id: number, sentenceId: number) =>
      `/api/saved-words/${id}/sentences/${sentenceId}`,
  },
} as const;
```

### 9.2 Update Query Keys

**File**: `apps/client/src/hooks/queries/query-keys.ts`

Add language filter to query keys:

```typescript
enum QueryKey {
  // ... existing keys ...
  SAVED_WORDS = 'savedWords',
  LANGUAGE = 'language',
}

export const queryKeys = {
  // ... existing keys ...
  savedWords: {
    all: () => [QueryKey.SAVED_WORDS] as const,
    byLanguage: (language: string) =>
      [...queryKeys.savedWords.all(), QueryKey.LANGUAGE, language] as const,
    details: () => [...queryKeys.savedWords.all(), QueryKey.DETAIL] as const,
    detail: (id: number) => [...queryKeys.savedWords.details(), id] as const,
    matching: (words: string[]) =>
      [
        ...queryKeys.savedWords.all(),
        QueryKey.MATCHING,
        words.sort().join(','),
      ] as const,
    matchingPrefix: () =>
      [...queryKeys.savedWords.all(), QueryKey.MATCHING] as const,
  },
} as const;
```

### 9.3 Update Saved Word Service

**File**: `apps/client/src/services/saved-word/saved-word.service.ts`

Add language filter method:

```typescript
import { apiManager } from '../api/api-manager';
import { API_ENDPOINTS } from '../../constants/api.constants';
// ... existing imports ...

export class SavedWordService {
  // ... existing methods ...

  /**
   * Get all saved words for current user, optionally filtered by language
   */
  static async getSavedWords(language?: string | null): Promise<SavedWord[]> {
    if (language) {
      return apiManager.get<SavedWord[]>(API_ENDPOINTS.SAVED_WORDS.BY_LANGUAGE(language));
    }
    return apiManager.get<SavedWord[]>(API_ENDPOINTS.SAVED_WORDS.BASE);
  }
}
```

### 9.4 Update Saved Words Query Hook

**File**: `apps/client/src/hooks/queries/use-saved-words.ts`

Add language filter parameter:

```typescript
import { useQuery } from '@tanstack/react-query';
import { SavedWordService } from '../../services/saved-word/saved-word.service';
import { queryKeys } from './query-keys';
import { SESSIONS_STALE_TIME } from '../../constants/cache.constants';
import { SavedWord, SavedWordMatch } from '../../types/saved-word.types';

export function useSavedWords(language?: string | null) {
  return useQuery<SavedWord[]>({
    queryKey: language 
      ? queryKeys.savedWords.byLanguage(language)
      : queryKeys.savedWords.all(),
    queryFn: () => SavedWordService.getSavedWords(language),
    staleTime: SESSIONS_STALE_TIME, // Use constant: 5 minutes
  });
}

// ... existing hooks ...
```

### 9.5 Update Flashcards Component

**File**: `apps/client/src/pages/flashcards/Flashcards.tsx`

Add language selector (finds agents by language, then matches words):

```typescript
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Container, PageHeader, PageContent, Card, CardFlip, Select, FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useSavedWords } from '../../hooks/queries/use-saved-words';
import { useAgents } from '../../hooks/queries/use-agents';
import { LanguageFormattingService } from '../../services/language-formatting/language-formatting.service';
import { LANGUAGE_OPTIONS } from '../../constants/language.constants';

const FLIP_ANIMATION_DURATION_MS = 600;

export default function Flashcards() {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const { data: agents = [] } = useAgents();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [frontWordIndex, setFrontWordIndex] = useState(0);
  const [backWordIndex, setBackWordIndex] = useState(0);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find agents that use the selected language
  const agentsWithLanguage = useMemo(() => {
    if (!selectedLanguage) return [];
    return agents.filter((agent) => agent.language === selectedLanguage);
  }, [agents, selectedLanguage]);

  // Get agent IDs for filtering
  const agentIds = useMemo(() => {
    return agentsWithLanguage.map((agent) => agent.id);
  }, [agentsWithLanguage]);

  // Fetch saved words filtered by language (backend will filter by agents with that language)
  const { data: savedWords = [], isLoading } = useSavedWords(selectedLanguage);

  // Get formatting config for selected language
  const formattingConfig = useMemo(
    () => LanguageFormattingService.getFormattingConfig(selectedLanguage),
    [selectedLanguage]
  );

  // Filter words that have valid content
  const validWords = useMemo(() => {
    return savedWords.filter((word) => word.originalWord && word.originalWord.trim().length > 0);
  }, [savedWords]);

  // ... existing card logic ...

  return (
    <Container>
      <PageHeader
        title={t('flashcards.title')}
        actions={
          <FormField
            label={t('flashcards.selectLanguage')}
            hint={t('flashcards.selectLanguageDescription')}
          >
            <Select
              value={selectedLanguage || ''}
              onChange={(e) => setSelectedLanguage(e.target.value || null)}
            >
              <option value="">{t('flashcards.allLanguages')}</option>
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>
        }
      />
      <PageContent>
        {/* ... existing flashcard UI ... */}
        {/* Update to use formattingConfig.showPinyin instead of hardcoded check */}
        {backWord?.pinyin && formattingConfig.showPinyin && (
          <div className="text-2xl text-text-secondary mb-2">
            {backWord.pinyin}
          </div>
        )}
      </PageContent>
    </Container>
  );
}
```

### 9.6 Update Saved Word API Endpoint

**File**: `apps/api/src/saved-word/saved-word.controller.ts`

Add language filter (finds agents by language, then filters words):

```typescript
@Get()
async getAll(
  @Query('language', new ParseStringPipe({ optional: true })) language?: string,
  @User() user: AuthenticatedUser
) {
  return this.savedWordService.findAllByLanguage(user.id, language);
}
```

### 9.7 Update Saved Word Service (Backend)

**File**: `apps/api/src/saved-word/saved-word.service.ts`

Add language filter method:

```typescript
async findAllByLanguage(userId: string, language?: string): Promise<SavedWord[]> {
  const where: Prisma.SavedWordWhereInput = {
    userId,
  };

  if (language) {
    // Find all agents with this language
    const agentsWithLanguage = await this.prisma.agent.findMany({
      where: {
        userId,
        language,
      },
      select: { id: true },
    });

    const agentIds = agentsWithLanguage.map((agent) => agent.id);

    if (agentIds.length > 0) {
      // Filter words by agents with this language
      where.agentId = { in: agentIds };
    } else {
      // No agents with this language, return empty array
      return [];
    }
  }

  return this.savedWordRepository.findMany(where);
}
```

---

## Phase 10: Translation Files

### 10.1 Add Translation Keys

**File**: `packages/i18n/src/locales/en/client.json`

Add new translation keys:

```json
{
  "config": {
    "agentType": {
      "label": "Agent Type",
      "general": "General Agent",
      "languageAssistant": "Language Assistant",
      "description": "Language assistants enable translation features and word highlighting. General agents return messages based on behavior rules only."
    },
    "language": {
      "label": "Language",
      "none": "None (Default)",
      "description": "Optional language setting. If set, the agent will always respond in this language."
    }
  },
  "flashcards": {
    "allLanguages": "All Languages",
    "selectLanguage": "Select Language",
    "selectLanguageDescription": "Filter flashcards by language. Shows words from agents using the selected language."
  }
}
```

---

## Phase 11: Testing

### 11.1 Unit Tests

**File**: `apps/api/src/agent/services/language-assistant.service.spec.ts`

```typescript
describe('LanguageAssistantService', () => {
  let service: LanguageAssistantService;

  beforeEach(() => {
    service = new LanguageAssistantService();
  });

  it('should identify language assistant', () => {
    const agent = { agentType: 'language_assistant' };
    expect(service.isLanguageAssistant(agent)).toBe(true);
  });

  it('should identify general agent', () => {
    const agent = { agentType: 'general' };
    expect(service.isGeneralAgent(agent)).toBe(true);
  });

  it('should get agent language', () => {
    const agent = { language: 'zh' };
    expect(service.getAgentLanguage(agent)).toBe('zh');
  });
});
```

**File**: `apps/api/src/chat/services/configuration-rules.service.spec.ts`

```typescript
describe('ConfigurationRulesService', () => {
  let service: ConfigurationRulesService;
  let languageAssistantService: LanguageAssistantService;

  beforeEach(() => {
    languageAssistantService = new LanguageAssistantService();
    service = new ConfigurationRulesService(languageAssistantService);
  });

  it('should generate datetime rule', () => {
    const agent = { agentType: 'general', language: null };
    const rules = service.generateConfigurationRules(agent, new Date('2024-01-01T00:00:00Z'));
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0].content).toContain('Currently it\'s');
  });

  it('should generate language rule when language is set', () => {
    const agent = { agentType: 'general', language: 'zh' };
    const rules = service.generateConfigurationRules(agent, new Date());
    expect(rules.length).toBe(2);
    expect(rules[1].content).toContain('Always respond in zh');
  });
});
```

### 11.2 Integration Tests

**File**: `apps/api/test/chat.e2e-spec.ts`

Add tests for:
- General agents don't receive word parsing instructions
- Language assistants receive word parsing instructions
- Configuration rules are added in correct order
- Language rule is added when language is set

---

## Phase 12: Migration and Deployment

### 12.1 Database Migration

1. Create migration file
2. Test migration on development database
3. Verify data integrity after migration
4. Update Prisma client

### 12.2 Deployment Checklist

- [ ] Run database migration
- [ ] Deploy backend API
- [ ] Deploy frontend client
- [ ] Verify agent creation/update with new fields
- [ ] Verify general agents don't show translation features
- [ ] Verify language assistants show translation features
- [ ] Verify configuration rules are applied correctly
- [ ] Verify flashcard agent filtering works
- [ ] Verify pinyin only shows for Chinese language

---

## Summary

This refactoring plan implements:

1. ✅ **Agent Type Classification**: Database schema and API support for `agentType` field
2. ✅ **Conditional Translation Features**: UI conditionally enables/disables translation based on agent type
3. ✅ **Language Configuration**: Optional `language` field in agent model and config
4. ✅ **Configuration Rules System**: Clear separation of admin rules → config rules → user rules
5. ✅ **Language Assistant Service**: Service to recognize and handle language assistant logic
6. ✅ **UI Formatting Configuration**: Configurable and extensible formatting system (pinyin, future options)
7. ✅ **Flashcard Agent Filtering**: Agent selector in flashcards UI for language determination at agent level

The implementation maintains backward compatibility (defaults to 'general' agent type) and provides a clear, maintainable structure for future enhancements.
