# Agent Configuration UI Improvements Refactoring Plan

## Overview

This document outlines a comprehensive refactoring plan to improve the agent configuration UI and add new personality/behavior fields. The main goals are:

1. **UI/UX Improvements**: Make the agent name editable in the header, reorganize form layout
2. **New Personality Fields**: Add response length, age, gender, personality, sentiment, interests, and availability
3. **Backend Integration**: Update database schema, DTOs, and behavior rules generation
4. **Full-Stack Updates**: Ensure all changes flow from frontend to database to OpenAI API

---

## Phase 1: Database Schema Updates

### 1.1 Add New Configuration Fields

**File**: `apps/api/prisma/schema.prisma`

The new fields will be stored in the `AgentConfig` table as JSONB values. We need to add them to the `AgentConfigDto` interface and ensure they're properly stored.

**Migration Strategy**:
- New fields will be stored in `agent_configs` table with `config_key` values:
  - `response_length` (string: 'short' | 'standard' | 'long' | 'adapt')
  - `age` (number: 0-100)
  - `gender` (string: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say')
  - `personality` (string: personality type)
  - `sentiment` (string: 'neutral' | 'engaged' | 'friendly' | 'attracted' | 'obsessed' | 'disinterested' | 'angry')
  - `interests` (array of strings)
  - `availability` (string: 'available' | 'standard' | 'busy')

**Note**: No migration needed - these will be stored as JSONB in existing `agent_configs` table.

---

## Phase 2: Backend API Updates

### 2.1 Create Enums and Constants

**File**: `apps/api/src/common/enums/response-length.enum.ts` (new)

```typescript
export enum ResponseLength {
  SHORT = 'short',
  STANDARD = 'standard',
  LONG = 'long',
  ADAPT = 'adapt',
}
```

**File**: `apps/api/src/common/enums/gender.enum.ts` (new)

```typescript
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non-binary',
  PREFER_NOT_TO_SAY = 'prefer-not-to-say',
}
```

**File**: `apps/api/src/common/enums/sentiment.enum.ts` (new)

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

**File**: `apps/api/src/common/enums/availability.enum.ts` (new)

```typescript
export enum Availability {
  AVAILABLE = 'available',
  STANDARD = 'standard',
  BUSY = 'busy',
}
```

**File**: `apps/api/src/common/constants/personality-types.constants.ts` (new)

```typescript
export const PERSONALITY_TYPES = [
  'Analytical',
  'Creative',
  'Practical',
  'Empathetic',
  'Adventurous',
  'Cautious',
  'Optimistic',
  'Realistic',
  'Introverted',
  'Extroverted',
  'Assertive',
  'Reserved',
  'Humorous',
  'Serious',
  'Spontaneous',
  'Planned',
] as const;

export type PersonalityType = (typeof PERSONALITY_TYPES)[number];
```

**File**: `apps/api/src/common/constants/interests.constants.ts` (new)

```typescript
export const INTERESTS = [
  'Sports',
  'Music',
  'Travel',
  'Reading',
  'Cooking',
  'Gaming',
  'Photography',
  'Fitness',
  'Art',
  'Technology',
  'Movies',
  'Nature',
  'Fashion',
  'Writing',
  'Science',
  'History',
  'Languages',
  'Pets',
  'Meditation',
  'Cars',
] as const;

export type Interest = (typeof INTERESTS)[number];
```

### 2.2 Update DTOs

**File**: `apps/api/src/common/dto/agent.dto.ts`

Add new fields to `AgentConfigDto`:

```typescript
import { ResponseLength } from '../enums/response-length.enum';
import { Gender } from '../enums/gender.enum';
import { Sentiment } from '../enums/sentiment.enum';
import { Availability } from '../enums/availability.enum';
import { PersonalityType } from '../constants/personality-types.constants';

export class AgentConfigDto {
  // ... existing fields ...

  @IsOptional()
  @IsEnum(ResponseLength)
  response_length?: ResponseLength;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  age?: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  personality?: PersonalityType;

  @IsOptional()
  @IsEnum(Sentiment)
  sentiment?: Sentiment;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsEnum(Availability)
  availability?: Availability;
}
```

### 2.3 Update Configuration Rules Service

**File**: `apps/api/src/chat/services/configuration-rules.service.ts`

Add methods to generate new behavior rules:

```typescript
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

  // Rule 3: Response length (if set)
  const responseLength = this.getResponseLength(agent);
  if (responseLength) {
    const responseLengthRule = this.generateResponseLengthRule(responseLength);
    rules.push({
      content: responseLengthRule,
      order: 3,
    });
  }

  // Rule 4: Age (if set)
  const age = this.getAge(agent);
  if (age !== undefined) {
    const ageRule = this.generateAgeRule(age);
    rules.push({
      content: ageRule,
      order: 4,
    });
  }

  // Rule 5: Gender (if set)
  const gender = this.getGender(agent);
  if (gender) {
    const genderRule = this.generateGenderRule(gender);
    rules.push({
      content: genderRule,
      order: 5,
    });
  }

  // Rule 6: Personality (if set)
  const personality = this.getPersonality(agent);
  if (personality) {
    const personalityRule = this.generatePersonalityRule(personality);
    rules.push({
      content: personalityRule,
      order: 6,
    });
  }

  // Rule 7: Interests (if set)
  const interests = this.getInterests(agent);
  if (interests && interests.length > 0) {
    const interestsRule = this.generateInterestsRule(interests);
    rules.push({
      content: interestsRule,
      order: 7,
    });
  }

  // Rule 8: Sentiment (if set)
  const sentiment = this.getSentiment(agent);
  if (sentiment) {
    const sentimentRule = this.generateSentimentRule(sentiment);
    rules.push({
      content: sentimentRule,
      order: 8,
    });
  }

  // Sort by order to ensure correct sequence
  return rules.sort((a, b) => a.order - b.order);
}

private getResponseLength(agent: AgentWithConfig): ResponseLength | null {
  const configs = agent.configs || {};
  const responseLength = configs.response_length;
  if (typeof responseLength === 'string') {
    return responseLength as ResponseLength;
  }
  return null;
}

private getAge(agent: AgentWithConfig): number | undefined {
  const configs = agent.configs || {};
  const age = configs.age;
  if (typeof age === 'number') {
    return age;
  }
  return undefined;
}

private getGender(agent: AgentWithConfig): Gender | null {
  const configs = agent.configs || {};
  const gender = configs.gender;
  if (typeof gender === 'string') {
    return gender as Gender;
  }
  return null;
}

private getPersonality(agent: AgentWithConfig): string | null {
  const configs = agent.configs || {};
  const personality = configs.personality;
  if (typeof personality === 'string') {
    return personality;
  }
  return null;
}

private getInterests(agent: AgentWithConfig): string[] | null {
  const configs = agent.configs || {};
  const interests = configs.interests;
  if (Array.isArray(interests)) {
    return interests.filter((i): i is string => typeof i === 'string');
  }
  return null;
}

private getSentiment(agent: AgentWithConfig): Sentiment | null {
  const configs = agent.configs || {};
  const sentiment = configs.sentiment;
  if (typeof sentiment === 'string') {
    return sentiment as Sentiment;
  }
  return null;
}

private generateResponseLengthRule(responseLength: ResponseLength): string {
  if (responseLength === ResponseLength.ADAPT) {
    return 'Adapt your response length to the user\'s message and context';
  }
  return `Respond with messages of ${responseLength} length`;
}

private generateAgeRule(age: number): string {
  // Tailor the prompt to make the agent speak in the appropriate age style
  if (age < 13) {
    return `You are ${age} years old. Speak like a child - use simpler language, show curiosity and wonder, and express yourself in an age-appropriate way.`;
  } else if (age < 18) {
    return `You are ${age} years old. Speak like a teenager - use casual language, show enthusiasm, and express yourself in a way that reflects teenage interests and concerns.`;
  } else if (age < 30) {
    return `You are ${age} years old. Speak like a young adult - use modern, energetic language and show interest in contemporary topics and experiences.`;
  } else if (age < 50) {
    return `You are ${age} years old. Speak like a mature adult - use balanced, thoughtful language and show experience and wisdom in your communication.`;
  } else if (age < 70) {
    return `You are ${age} years old. Speak like a middle-aged adult - use refined language, show life experience, and communicate with wisdom and perspective.`;
  } else {
    return `You are ${age} years old. Speak like an elder - use thoughtful, wise language, draw from extensive life experience, and communicate with patience and depth.`;
  }
}

private generateGenderRule(gender: Gender): string {
  return `You are ${gender}`;
}

private generatePersonalityRule(personality: string): string {
  return `Your personality is ${personality}`;
}

private generateInterestsRule(interests: string[]): string {
  const interestsList = interests.join(', ');
  return `These are your interests: ${interestsList}`;
}

private generateSentimentRule(sentiment: Sentiment): string {
  return `You feel ${sentiment} toward the user`;
}
```

**Note**: Availability is NOT passed to OpenAI - it's stored for future enhancements only.

---

## Phase 3: Frontend Updates

### 3.1 Create New Enums and Constants

**File**: `apps/client/src/types/agent.types.ts`

Add new enums:

```typescript
export enum ResponseLength {
  SHORT = 'short',
  STANDARD = 'standard',
  LONG = 'long',
  ADAPT = 'adapt',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non-binary',
  PREFER_NOT_TO_SAY = 'prefer-not-to-say',
}

export enum Sentiment {
  NEUTRAL = 'neutral',
  ENGAGED = 'engaged',
  FRIENDLY = 'friendly',
  ATTRACTED = 'attracted',
  OBSESSED = 'obsessed',
  DISINTERESTED = 'disinterested',
  ANGRY = 'angry',
}

export enum Availability {
  AVAILABLE = 'available',
  STANDARD = 'standard',
  BUSY = 'busy',
}
```

**File**: `apps/client/src/constants/personality-types.constants.ts` (new)

```typescript
export const PERSONALITY_TYPES = [
  'Analytical',
  'Creative',
  'Practical',
  'Empathetic',
  'Adventurous',
  'Cautious',
  'Optimistic',
  'Realistic',
  'Introverted',
  'Extroverted',
  'Assertive',
  'Reserved',
  'Humorous',
  'Serious',
  'Spontaneous',
  'Planned',
] as const;

export type PersonalityType = (typeof PERSONALITY_TYPES)[number];
```

**File**: `apps/client/src/constants/interests.constants.ts` (new)

```typescript
export const INTERESTS = [
  'Sports',
  'Music',
  'Travel',
  'Reading',
  'Cooking',
  'Gaming',
  'Photography',
  'Fitness',
  'Art',
  'Technology',
  'Movies',
  'Nature',
  'Fashion',
  'Writing',
  'Science',
  'History',
  'Languages',
  'Pets',
  'Meditation',
  'Cars',
] as const;

export type Interest = (typeof INTERESTS)[number];
```

### 3.2 Update Form State Management

**File**: `apps/client/src/pages/config/hooks/agent/use-agent-form.ts`

Update `AgentFormValues` interface:

```typescript
export interface AgentFormValues extends Record<string, unknown> {
  name: string;
  description: string; // This will now be the system prompt (renamed)
  avatarUrl: string | null;
  agentType: AgentType;
  language: string | null;
  temperature: number;
  systemPrompt: string; // Remove this - description replaces it
  behaviorRules: string[];
  // New fields
  responseLength: ResponseLength | null;
  age: number | null;
  gender: Gender | null;
  personality: PersonalityType | null;
  sentiment: Sentiment | null;
  interests: string[];
  availability: Availability | null;
}
```

Update form initialization and value handling to include new fields from `configs`:

```typescript
// In initialValues useMemo
const config = agentData.configs || {};
return {
  // ... existing fields ...
  systemPrompt: typeof config.system_prompt === 'string' ? config.system_prompt : '',
  // Map system_prompt to description field
  description: typeof config.system_prompt === 'string' ? config.system_prompt : '',
  // New fields
  responseLength: config.response_length || null,
  age: typeof config.age === 'number' ? config.age : null,
  gender: config.gender || null,
  personality: config.personality || null,
  sentiment: config.sentiment || null,
  interests: Array.isArray(config.interests) ? config.interests : [],
  availability: config.availability || null,
};
```

### 3.3 Create Editable Header Component

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/EditableAgentNameHeader.tsx` (new)

```typescript
import { useState, useRef, useEffect } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface EditableAgentNameHeaderProps {
  name: string;
  onNameChange: (name: string) => void;
  isSaving?: boolean;
}

export default function EditableAgentNameHeader({
  name,
  onNameChange,
  isSaving = false,
}: EditableAgentNameHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(name);
  }, [name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!isSaving) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== name) {
      onNameChange(editValue.trim());
    } else {
      setEditValue(name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setEditValue(name);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="text-2xl font-semibold bg-background border border-border-focus rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-primary"
        disabled={isSaving}
      />
    );
  }

  return (
    <h1
      onClick={handleClick}
      className="text-2xl font-semibold text-text-primary cursor-pointer hover:text-primary transition-colors"
      title="Click to edit"
    >
      {name || 'Untitled Agent'}
    </h1>
  );
}
```

### 3.4 Update AgentConfig Component

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/AgentConfig.tsx`

Replace `PageHeader` title with `EditableAgentNameHeader`:

```typescript
import EditableAgentNameHeader from './parts/EditableAgentNameHeader';

// In the component:
<PageHeader
  title={
    currentAgent ? (
      <EditableAgentNameHeader
        name={currentAgent.name}
        onNameChange={(newName) => {
          // Handle name update immediately (optimistic update)
          // Or trigger save
        }}
        isSaving={isSaving}
      />
    ) : (
      t('config.title')
    )
  }
  actions={...}
/>
```

### 3.5 Update AgentNameAndAvatar Component

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/AgentNameAndAvatar.tsx`

Remove name field, keep only avatar. Add description field to the right:

```typescript
import { AvatarPicker, Textarea, FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface AgentNameAndAvatarProps {
  avatarUrl: string | null;
  description: string; // This is now the system prompt (renamed to Description)
  descriptionError?: string;
  saving: boolean;
  onAvatarChange: (url: string | null) => void;
  onDescriptionChange: (value: string) => void;
}

export default function AgentNameAndAvatar({
  avatarUrl,
  description,
  descriptionError,
  saving,
  onAvatarChange,
  onDescriptionChange,
}: AgentNameAndAvatarProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <div className="flex items-start gap-4">
      <AvatarPicker value={avatarUrl} onChange={onAvatarChange} />
      <div className="flex-1">
        <FormField
          label={t('config.description')}
          labelFor="agent-description"
          error={descriptionError}
        >
          <Textarea
            id="agent-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={4}
            placeholder={t('config.enterDescription')}
            disabled={saving}
          />
        </FormField>
      </div>
    </div>
  );
}
```

### 3.6 Create New Form Field Components

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/ResponseLengthField.tsx` (new)

```typescript
import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { ResponseLength } from '../../../../../../types/agent.types';

interface ResponseLengthFieldProps {
  value: ResponseLength | null;
  onChange: (value: ResponseLength | null) => void;
}

export default function ResponseLengthField({
  value,
  onChange,
}: ResponseLengthFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField
      label={t('config.responseLength')}
      labelFor="agent-response-length"
    >
      <select
        id="agent-response-length"
        value={value || ''}
        onChange={(e) =>
          onChange(e.target.value ? (e.target.value as ResponseLength) : null)
        }
        className="w-full px-3 py-2 border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus"
      >
        <option value="">{t('config.selectResponseLength')}</option>
        <option value={ResponseLength.SHORT}>{t('config.responseLengthShort')}</option>
        <option value={ResponseLength.STANDARD}>{t('config.responseLengthStandard')}</option>
        <option value={ResponseLength.LONG}>{t('config.responseLengthLong')}</option>
        <option value={ResponseLength.ADAPT}>{t('config.responseLengthAdapt')}</option>
      </select>
    </FormField>
  );
}
```

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/AgeField.tsx` (new)

```typescript
import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface AgeFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export default function AgeField({ value, onChange }: AgeFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const ageValue = value ?? 25;

  return (
    <FormField
      label={
        <>
          {t('config.age')}: <span className="font-mono">{ageValue}</span>
        </>
      }
      labelFor="agent-age"
    >
      <div className="relative">
        <input
          id="agent-age"
          type="range"
          min="0"
          max="100"
          step="1"
          value={ageValue}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
          style={{
            background: `linear-gradient(to right, rgb(var(--color-primary)) 0%, rgb(var(--color-primary)) ${(ageValue / 100) * 100}%, rgb(var(--color-border)) ${(ageValue / 100) * 100}%, rgb(var(--color-border)) 100%)`,
          }}
        />
      </div>
    </FormField>
  );
}
```

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/GenderField.tsx` (new)

```typescript
import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Gender } from '../../../../../../types/agent.types';

interface GenderFieldProps {
  value: Gender | null;
  onChange: (value: Gender | null) => void;
}

export default function GenderField({ value, onChange }: GenderFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField label={t('config.gender')} labelFor="agent-gender">
      <div className="flex gap-4">
        {Object.values(Gender).map((gender) => (
          <label key={gender} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="gender"
              value={gender}
              checked={value === gender}
              onChange={(e) =>
                onChange(e.target.checked ? (gender as Gender) : null)
              }
              className="accent-primary"
            />
            <span>{t(`config.gender${gender.charAt(0).toUpperCase() + gender.slice(1)}`)}</span>
          </label>
        ))}
      </div>
    </FormField>
  );
}
```

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/PersonalityField.tsx` (new)

```typescript
import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { PERSONALITY_TYPES } from '../../../../../../constants/personality-types.constants';

interface PersonalityFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export default function PersonalityField({
  value,
  onChange,
}: PersonalityFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField
      label={t('config.personality')}
      labelFor="agent-personality"
    >
      <select
        id="agent-personality"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-3 py-2 border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus"
      >
        <option value="">{t('config.selectPersonality')}</option>
        {PERSONALITY_TYPES.map((personality) => (
          <option key={personality} value={personality}>
            {personality}
          </option>
        ))}
      </select>
    </FormField>
  );
}
```

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/SentimentField.tsx` (new)

```typescript
import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Sentiment } from '../../../../../../types/agent.types';

interface SentimentFieldProps {
  value: Sentiment | null;
  onChange: (value: Sentiment | null) => void;
}

export default function SentimentField({
  value,
  onChange,
}: SentimentFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField label={t('config.sentiment')} labelFor="agent-sentiment">
      <select
        id="agent-sentiment"
        value={value || ''}
        onChange={(e) =>
          onChange(e.target.value ? (e.target.value as Sentiment) : null)
        }
        className="w-full px-3 py-2 border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus"
      >
        <option value="">{t('config.selectSentiment')}</option>
        {Object.values(Sentiment).map((sentiment) => (
          <option key={sentiment} value={sentiment}>
            {t(`config.sentiment${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}`)}
          </option>
        ))}
      </select>
    </FormField>
  );
}
```

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/AvailabilityField.tsx` (new)

```typescript
import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Availability } from '../../../../../../types/agent.types';

interface AvailabilityFieldProps {
  value: Availability | null;
  onChange: (value: Availability | null) => void;
}

export default function AvailabilityField({
  value,
  onChange,
}: AvailabilityFieldProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  return (
    <FormField label={t('config.availability')} labelFor="agent-availability">
      <select
        id="agent-availability"
        value={value || ''}
        onChange={(e) =>
          onChange(e.target.value ? (e.target.value as Availability) : null)
        }
        className="w-full px-3 py-2 border border-border-input rounded-md text-text-primary bg-background focus:outline-none focus:border-border-focus"
      >
        <option value="">{t('config.selectAvailability')}</option>
        {Object.values(Availability).map((availability) => (
          <option key={availability} value={availability}>
            {t(`config.availability${availability.charAt(0).toUpperCase() + availability.slice(1)}`)}
          </option>
        ))}
      </select>
    </FormField>
  );
}
```

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/InterestsDashboard.tsx` (new)

```typescript
import { FormField } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { INTERESTS, Interest } from '../../../../../../constants/interests.constants';

interface InterestsDashboardProps {
  selectedInterests: string[];
  onChange: (interests: string[]) => void;
}

export default function InterestsDashboard({
  selectedInterests,
  onChange,
}: InterestsDashboardProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);

  const toggleInterest = (interest: Interest) => {
    if (selectedInterests.includes(interest)) {
      onChange(selectedInterests.filter((i) => i !== interest));
    } else {
      onChange([...selectedInterests, interest]);
    }
  };

  return (
    <FormField
      label={t('config.interests')}
      labelFor="agent-interests"
      hint={t('config.interestsDescription')}
    >
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
        {INTERESTS.map((interest) => {
          const isSelected = selectedInterests.includes(interest);
          return (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                isSelected
                  ? 'bg-primary text-text-inverse border-primary'
                  : 'bg-background-secondary text-text-primary border-border hover:border-border-focus'
              }`}
            >
              {interest}
            </button>
          );
        })}
      </div>
    </FormField>
  );
}
```

### 3.7 Update AgentConfigForm Component

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/AgentConfigForm.tsx`

Update the form layout:

```typescript
// Remove DescriptionField import (now handled in AgentNameAndAvatar)
// Remove SystemPromptField import
// Add new field imports

import AgentNameAndAvatar from './AgentNameAndAvatar';
import ResponseLengthField from './ResponseLengthField';
import AgeField from './AgeField';
import GenderField from './GenderField';
import PersonalityField from './PersonalityField';
import SentimentField from './SentimentField';
import AvailabilityField from './AvailabilityField';
import InterestsDashboard from './InterestsDashboard';

// In the form JSX:
<form ...>
  <AgentNameAndAvatar
    avatarUrl={values.avatarUrl}
    description={values.description} // This is now system prompt
    descriptionError={errors.description}
    saving={saving}
    onAvatarChange={(url) => setValue('avatarUrl', url)}
    onDescriptionChange={(val) => setValue('description', val)}
  />

  {/* 2-column layout for language, agent type, temperature */}
  <div className="grid grid-cols-2 gap-5">
    <AgentTypeField
      value={values.agentType}
      onChange={(val) => setValue('agentType', val)}
    />
    <LanguageField
      value={values.language}
      agentType={values.agentType}
      onChange={(val) => setValue('language', val)}
    />
    <TemperatureField
      value={values.temperature}
      onChange={(val) => setValue('temperature', val)}
    />
  </div>

  {/* 2-column layout for new simple fields */}
  <div className="grid grid-cols-2 gap-5">
    <ResponseLengthField
      value={values.responseLength}
      onChange={(val) => setValue('responseLength', val)}
    />
    <AgeField
      value={values.age}
      onChange={(val) => setValue('age', val)}
    />
    <GenderField
      value={values.gender}
      onChange={(val) => setValue('gender', val)}
    />
    <PersonalityField
      value={values.personality}
      onChange={(val) => setValue('personality', val)}
    />
    <SentimentField
      value={values.sentiment}
      onChange={(val) => setValue('sentiment', val)}
    />
    <AvailabilityField
      value={values.availability}
      onChange={(val) => setValue('availability', val)}
    />
  </div>

  {/* Full width interests dashboard */}
  <InterestsDashboard
    selectedInterests={values.interests}
    onChange={(interests) => setValue('interests', interests)}
  />

  <BehaviorRulesField
    rules={values.behaviorRules}
    onChange={(rules) => setValue('behaviorRules', rules)}
  />

  <MemoriesSection ... />
</form>
```

### 3.8 Update Save Logic

**File**: `apps/client/src/pages/config/hooks/agent/use-agent-save.ts`

Update to include new fields in configs:

```typescript
configs: {
  temperature: values.temperature,
  system_prompt: values.description.trim() || undefined, // Map description to system_prompt
  behavior_rules: values.behaviorRules.filter((r) => r.trim()).length > 0
    ? values.behaviorRules.filter((r) => r.trim())
    : undefined,
  // New fields
  response_length: values.responseLength || undefined,
  age: values.age ?? undefined,
  gender: values.gender || undefined,
  personality: values.personality || undefined,
  sentiment: values.sentiment || undefined,
  interests: values.interests.length > 0 ? values.interests : undefined,
  availability: values.availability || undefined,
},
```

### 3.9 Update i18n Translations

**File**: `packages/i18n/src/locales/en/client.json`

Add new translation keys:

```json
{
  "config": {
    "title": "Agent Configuration",
    "description": "Description",
    "enterDescription": "Enter agent description...",
    "responseLength": "Response Length",
    "selectResponseLength": "Select response length",
    "responseLengthShort": "Short",
    "responseLengthStandard": "Standard",
    "responseLengthLong": "Long",
    "responseLengthAdapt": "Adapt",
    "age": "Age",
    "gender": "Gender",
    "genderMale": "Male",
    "genderFemale": "Female",
    "genderNonBinary": "Non-binary",
    "genderPreferNotToSay": "Prefer not to say",
    "personality": "Personality",
    "selectPersonality": "Select personality type",
    "sentiment": "Sentiment",
    "selectSentiment": "Select sentiment",
    "sentimentNeutral": "Neutral",
    "sentimentEngaged": "Engaged",
    "sentimentFriendly": "Friendly",
    "sentimentAttracted": "Attracted",
    "sentimentObsessed": "Obsessed",
    "sentimentDisinterested": "Disinterested",
    "sentimentAngry": "Angry",
    "interests": "Interests",
    "interestsDescription": "Click to toggle interests",
    "availability": "Availability",
    "selectAvailability": "Select availability",
    "availabilityAvailable": "Available",
    "availabilityStandard": "Standard",
    "availabilityBusy": "Busy"
  }
}
```

---

## Phase 4: Implementation Order

### Step 1: Backend Foundation
1. Create enums and constants files
2. Update DTOs with new fields
3. Update ConfigurationRulesService with new rule generators
4. Test backend changes

### Step 2: Frontend Foundation
1. Create frontend enums and constants
2. Update form state management (AgentFormValues)
3. Update i18n translations

### Step 3: UI Components
1. Create EditableAgentNameHeader component
2. Update AgentNameAndAvatar (remove name, add description)
3. Create all new field components
4. Create InterestsDashboard component

### Step 4: Form Integration
1. Update AgentConfigForm layout
2. Update AgentConfig to use EditableAgentNameHeader
3. Update save logic to include new fields
4. Remove old DescriptionField and SystemPromptField usage

### Step 5: Testing
1. Test form submission with all new fields
2. Test behavior rules generation in backend
3. Test name editing in header
4. Test interests toggle selection
5. Verify all fields save and load correctly

---

## Phase 5: Behavior Rules Integration

### Rule Order (in ConfigurationRulesService)

1. Current datetime (always)
2. Language (if set)
3. Response length (if set)
4. Age (if set)
5. Gender (if set)
6. Personality (if set)
7. Interests (if set)
8. Sentiment (if set)

**Note**: Availability is stored but NOT passed to OpenAI (future enhancement).

### Rule Format Examples

- Response length: `"Respond with messages of short length"` or `"Adapt your response length to the user's message and context"`
- Age: `"You are 25 years old"`
- Gender: `"You are male"`
- Personality: `"Your personality is Creative"`
- Interests: `"These are your interests: Football, Music, Programming"`
- Sentiment: `"You feel friendly toward the user"`

---

## Phase 6: Migration Notes

### Data Migration

No database migration needed - new fields are stored as JSONB in existing `agent_configs` table.

### Backward Compatibility

- Existing agents without new fields will work fine (all fields are optional)
- Old `system_prompt` will be mapped to `description` field in UI
- Behavior rules generation will skip missing fields gracefully

---

## Testing Checklist

### Frontend Tests
- [ ] EditableAgentNameHeader: Click to edit, blur to save, escape to cancel
- [ ] AgentNameAndAvatar: Description field displays and updates correctly
- [ ] All new field components render and update form state
- [ ] InterestsDashboard: Toggle selection works, saves as array
- [ ] Form layout: 2-column layout for simple fields, full width for interests
- [ ] Form submission: All new fields included in save payload

### Backend Tests
- [ ] DTO validation: All new fields validate correctly
- [ ] ConfigurationRulesService: Generates correct rules for all new fields
- [ ] Rule order: Rules are generated in correct order
- [ ] Missing fields: Service handles missing optional fields gracefully
- [ ] Availability: Not passed to OpenAI (verify it's not in generated rules)

### Integration Tests
- [ ] Create agent with all new fields
- [ ] Update agent with new fields
- [ ] Load agent and verify all fields display correctly
- [ ] Verify behavior rules are generated correctly in chat
- [ ] Verify name update in header saves correctly

---

## Notes

1. **Name Update**: The editable header should trigger an immediate save or use optimistic updates. Consider debouncing or saving on blur.

2. **Interests**: The interests dashboard is configurable in code (constants file). To add/remove interests, update `INTERESTS` constant. All 20 interests are displayed as small clickable tiles in a grid layout.

3. **Personality Types**: Similarly configurable in constants file.

4. **Availability**: Stored but not used in behavior rules - reserved for future enhancements (e.g., response timing, availability status in UI).

5. **System Prompt Rename**: The `system_prompt` field in the database remains unchanged. Only the UI label changes from "System Prompt" to "Description" and it's moved to the avatar section.

6. **Form Validation**: Consider adding validation for:
   - Age: 0-100 range
   - Interests: Max number of selections (if needed)
   - Response length: Required for certain agent types (if needed)

---

## Future Enhancements

1. **Availability Usage**: Use availability field to adjust response timing or style
2. **Interest Suggestions**: Auto-suggest interests based on conversation history
3. **Personality Presets**: Pre-configured personality combinations
4. **Sentiment Analytics**: Track sentiment changes over time
5. **Age-based Responses**: The age setting already tailors the agent's speaking style to match the appropriate age level (child, teenager, young adult, mature adult, middle-aged, elder) through the behavior rule prompt.
