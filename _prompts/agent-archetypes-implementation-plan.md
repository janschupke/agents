# Agent Archetypes Implementation Plan

## Overview

This document outlines the implementation plan for agent archetypes - pre-configured agent templates that users can select when creating a new agent. Archetypes contain full agent configuration that gets copied to the user's agent, allowing them to start with a pre-configured setup and customize it further.

### Key Features

- **Database**: Store agent archetypes with full configuration
- **Client UI**: Display archetype tiles with avatars, allow selection to pre-fill form
- **Admin UI**: CRUD interface for managing archetypes (admin-only)
- **Read-only for users**: Users can view and use archetypes but cannot modify them

---

## Phase 1: Database Schema

### 1.1 Create AgentArchetype Model

**File**: `apps/api/prisma/schema.prisma`

Add new model to store agent archetypes:

```prisma
model AgentArchetype {
  id          Int           @id @default(autoincrement())
  name        String
  description String?
  avatarUrl   String?       @map("avatar_url")
  agentType   AgentType?    @map("agent_type") @default(GENERAL)
  language    String?       // Optional language code (e.g., 'zh', 'en', 'ja')
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")
  
  // Config fields (same structure as Agent)
  temperature      Float?      // 0-2
  systemPrompt     String?     @map("system_prompt") @db.Text
  behaviorRules    Json?       @map("behavior_rules")
  model            String?
  maxTokens        Int?        @map("max_tokens")
  responseLength   String?     @map("response_length") // 'short' | 'standard' | 'long' | 'adapt'
  age              Int?        // 0-100
  gender           String?     // 'male' | 'female' | 'non-binary' | 'prefer-not-to-say'
  personality      String?
  sentiment        String?     // 'neutral' | 'engaged' | 'friendly' | 'attracted' | 'obsessed' | 'disinterested' | 'angry'
  interests        Json?       // Array of strings
  availability     String?     // 'available' | 'standard' | 'busy'
  
  @@index([agentType])
  @@index([language])
  @@map("agent_archetypes")
}
```

### 1.2 Migration

**File**: `apps/api/prisma/migrations/[timestamp]_add_agent_archetypes/migration.sql`

```sql
-- Create agent_archetypes table
CREATE TABLE "agent_archetypes" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "avatar_url" VARCHAR(255),
  "agent_type" "AgentType",
  "language" VARCHAR(10),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  
  -- Config fields
  "temperature" DOUBLE PRECISION CHECK ("temperature" >= 0 AND "temperature" <= 2),
  "system_prompt" TEXT,
  "behavior_rules" JSONB,
  "model" VARCHAR(255),
  "max_tokens" INTEGER CHECK ("max_tokens" >= 1),
  "response_length" VARCHAR(20) CHECK ("response_length" IN ('short', 'standard', 'long', 'adapt')),
  "age" INTEGER CHECK ("age" >= 0 AND "age" <= 100),
  "gender" VARCHAR(50) CHECK ("gender" IN ('male', 'female', 'non-binary', 'prefer-not-to-say')),
  "personality" VARCHAR(255),
  "sentiment" VARCHAR(50) CHECK ("sentiment" IN ('neutral', 'engaged', 'friendly', 'attracted', 'obsessed', 'disinterested', 'angry')),
  "interests" JSONB,
  "availability" VARCHAR(20) CHECK ("availability" IN ('available', 'standard', 'busy')),
  
  CONSTRAINT "agent_archetypes_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "agent_archetypes_agent_type_idx" ON "agent_archetypes"("agent_type");
CREATE INDEX "agent_archetypes_language_idx" ON "agent_archetypes"("language");
```

---

## Phase 2: Backend API

### 2.1 DTOs

**File**: `apps/api/src/common/dto/agent-archetype.dto.ts`

```typescript
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
  Length,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AgentType } from '../enums/agent-type.enum';
import { ResponseLength } from '../enums/response-length.enum';
import { Gender } from '../enums/gender.enum';
import { Sentiment } from '../enums/sentiment.enum';
import { Availability } from '../enums/availability.enum';
import { PersonalityType } from '../constants/personality-types.constants';

export class AgentArchetypeConfigDto {
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

export class CreateAgentArchetypeDto {
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
  @Type(() => AgentArchetypeConfigDto)
  configs?: AgentArchetypeConfigDto;
}

export class UpdateAgentArchetypeDto {
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
  @Type(() => AgentArchetypeConfigDto)
  configs?: AgentArchetypeConfigDto;
}

export class AgentArchetypeResponse {
  id!: number;
  name!: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;
  createdAt!: Date;
  updatedAt!: Date;
  configs?: Record<string, unknown>;
}
```

### 2.2 Repository

**File**: `apps/api/src/agent-archetype/agent-archetype.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentArchetype, AgentType } from '@prisma/client';
import { CreateAgentArchetypeDto, UpdateAgentArchetypeDto } from '../common/dto/agent-archetype.dto';

@Injectable()
export class AgentArchetypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AgentArchetype[]> {
    return this.prisma.agentArchetype.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number): Promise<AgentArchetype | null> {
    return this.prisma.agentArchetype.findUnique({
      where: { id },
    });
  }

  async create(data: CreateAgentArchetypeDto): Promise<AgentArchetype> {
    return this.prisma.agentArchetype.create({
      data: {
        name: data.name,
        description: data.description || null,
        avatarUrl: data.avatarUrl || null,
        agentType: data.agentType || AgentType.GENERAL,
        language: data.language || null,
        temperature: data.configs?.temperature ?? null,
        systemPrompt: data.configs?.system_prompt || null,
        behaviorRules: data.configs?.behavior_rules
          ? (typeof data.configs.behavior_rules === 'string'
              ? { rules: [data.configs.behavior_rules] }
              : Array.isArray(data.configs.behavior_rules)
                ? { rules: data.configs.behavior_rules }
                : data.configs.behavior_rules)
          : null,
        model: data.configs?.model || null,
        maxTokens: data.configs?.max_tokens ?? null,
        responseLength: data.configs?.response_length || null,
        age: data.configs?.age ?? null,
        gender: data.configs?.gender || null,
        personality: data.configs?.personality || null,
        sentiment: data.configs?.sentiment || null,
        interests: data.configs?.interests ? data.configs.interests : null,
        availability: data.configs?.availability || null,
      },
    });
  }

  async update(id: number, data: UpdateAgentArchetypeDto): Promise<AgentArchetype> {
    return this.prisma.agentArchetype.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description ?? null,
        avatarUrl: data.avatarUrl ?? null,
        agentType: data.agentType ?? null,
        language: data.language ?? null,
        temperature: data.configs?.temperature ?? null,
        systemPrompt: data.configs?.system_prompt ?? null,
        behaviorRules: data.configs?.behavior_rules
          ? (typeof data.configs.behavior_rules === 'string'
              ? { rules: [data.configs.behavior_rules] }
              : Array.isArray(data.configs.behavior_rules)
                ? { rules: data.configs.behavior_rules }
                : data.configs.behavior_rules)
          : null,
        model: data.configs?.model ?? null,
        maxTokens: data.configs?.max_tokens ?? null,
        responseLength: data.configs?.response_length ?? null,
        age: data.configs?.age ?? null,
        gender: data.configs?.gender ?? null,
        personality: data.configs?.personality ?? null,
        sentiment: data.configs?.sentiment ?? null,
        interests: data.configs?.interests ?? null,
        availability: data.configs?.availability ?? null,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.agentArchetype.delete({
      where: { id },
    });
  }
}
```

### 2.3 Service

**File**: `apps/api/src/agent-archetype/agent-archetype.service.ts`

```typescript
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { AgentArchetypeRepository } from './agent-archetype.repository';
import {
  CreateAgentArchetypeDto,
  UpdateAgentArchetypeDto,
  AgentArchetypeResponse,
} from '../common/dto/agent-archetype.dto';

@Injectable()
export class AgentArchetypeService {
  private readonly logger = new Logger(AgentArchetypeService.name);

  constructor(
    private readonly archetypeRepository: AgentArchetypeRepository
  ) {}

  async findAll(): Promise<AgentArchetypeResponse[]> {
    this.logger.log('Fetching all agent archetypes');
    const archetypes = await this.archetypeRepository.findAll();
    return archetypes.map(this.mapToResponse);
  }

  async findById(id: number): Promise<AgentArchetypeResponse> {
    this.logger.log(`Fetching agent archetype ${id}`);
    const archetype = await this.archetypeRepository.findById(id);
    if (!archetype) {
      this.logger.warn(`Agent archetype ${id} not found`);
      throw new NotFoundException(`Agent archetype with ID ${id} not found`);
    }
    return this.mapToResponse(archetype);
  }

  async create(data: CreateAgentArchetypeDto): Promise<AgentArchetypeResponse> {
    this.logger.log(`Creating agent archetype "${data.name}"`);
    const archetype = await this.archetypeRepository.create(data);
    this.logger.log(`Created agent archetype ${archetype.id} "${data.name}"`);
    return this.mapToResponse(archetype);
  }

  async update(
    id: number,
    data: UpdateAgentArchetypeDto
  ): Promise<AgentArchetypeResponse> {
    this.logger.log(`Updating agent archetype ${id}`);
    const existing = await this.archetypeRepository.findById(id);
    if (!existing) {
      this.logger.warn(`Agent archetype ${id} not found`);
      throw new NotFoundException(`Agent archetype with ID ${id} not found`);
    }
    const archetype = await this.archetypeRepository.update(id, data);
    this.logger.log(`Updated agent archetype ${id}`);
    return this.mapToResponse(archetype);
  }

  async delete(id: number): Promise<void> {
    this.logger.log(`Deleting agent archetype ${id}`);
    const existing = await this.archetypeRepository.findById(id);
    if (!existing) {
      this.logger.warn(`Agent archetype ${id} not found`);
      throw new NotFoundException(`Agent archetype with ID ${id} not found`);
    }
    await this.archetypeRepository.delete(id);
    this.logger.log(`Deleted agent archetype ${id}`);
  }

  private mapToResponse(archetype: any): AgentArchetypeResponse {
    return {
      id: archetype.id,
      name: archetype.name,
      description: archetype.description,
      avatarUrl: archetype.avatarUrl,
      agentType: archetype.agentType,
      language: archetype.language,
      createdAt: archetype.createdAt,
      updatedAt: archetype.updatedAt,
      configs: {
        temperature: archetype.temperature,
        system_prompt: archetype.systemPrompt,
        behavior_rules: archetype.behaviorRules,
        model: archetype.model,
        max_tokens: archetype.maxTokens,
        response_length: archetype.responseLength,
        age: archetype.age,
        gender: archetype.gender,
        personality: archetype.personality,
        sentiment: archetype.sentiment,
        interests: archetype.interests,
        availability: archetype.availability,
      },
    };
  }
}
```

### 2.4 Controller

**File**: `apps/api/src/agent-archetype/agent-archetype.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { AgentArchetypeService } from './agent-archetype.service';
import {
  CreateAgentArchetypeDto,
  UpdateAgentArchetypeDto,
  AgentArchetypeResponse,
} from '../common/dto/agent-archetype.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { API_ROUTES } from '../common/constants/api-routes.constants';

@Controller(API_ROUTES.AGENT_ARCHETYPES.BASE)
export class AgentArchetypeController {
  private readonly logger = new Logger(AgentArchetypeController.name);

  constructor(
    private readonly archetypeService: AgentArchetypeService
  ) {}

  @Get()
  async getAllArchetypes(): Promise<AgentArchetypeResponse[]> {
    this.logger.log('Fetching all agent archetypes');
    return await this.archetypeService.findAll();
  }

  @Get(':id')
  async getArchetype(
    @Param('id', ParseIntPipe) id: number
  ): Promise<AgentArchetypeResponse> {
    this.logger.log(`Fetching agent archetype ${id}`);
    return await this.archetypeService.findById(id);
  }

  @Post()
  @AdminGuard()
  async createArchetype(
    @Body() body: CreateAgentArchetypeDto
  ): Promise<AgentArchetypeResponse> {
    this.logger.log(`Creating agent archetype "${body.name}"`);
    return await this.archetypeService.create(body);
  }

  @Put(':id')
  @AdminGuard()
  async updateArchetype(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateAgentArchetypeDto
  ): Promise<AgentArchetypeResponse> {
    this.logger.log(`Updating agent archetype ${id}`);
    return await this.archetypeService.update(id, body);
  }

  @Delete(':id')
  @AdminGuard()
  async deleteArchetype(
    @Param('id', ParseIntPipe) id: number
  ): Promise<void> {
    this.logger.log(`Deleting agent archetype ${id}`);
    await this.archetypeService.delete(id);
  }
}
```

### 2.5 Module

**File**: `apps/api/src/agent-archetype/agent-archetype.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AgentArchetypeController } from './agent-archetype.controller';
import { AgentArchetypeService } from './agent-archetype.service';
import { AgentArchetypeRepository } from './agent-archetype.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AgentArchetypeController],
  providers: [AgentArchetypeService, AgentArchetypeRepository],
  exports: [AgentArchetypeService],
})
export class AgentArchetypeModule {}
```

### 2.6 Update API Routes Constants

**File**: `apps/api/src/common/constants/api-routes.constants.ts`

Add archetype routes:

```typescript
export const API_ROUTES = {
  // ... existing routes
  AGENT_ARCHETYPES: {
    BASE: '/api/agent-archetypes',
    BY_ID: (id: number) => `/api/agent-archetypes/${id}`,
  },
};
```

### 2.7 Update Agent Service to Support Archetype Copying

**File**: `apps/api/src/agent/agent.service.ts`

Add method to create agent from archetype:

```typescript
async createFromArchetype(
  userId: string,
  archetypeId: number,
  name?: string
): Promise<AgentResponse> {
  this.logger.log(`Creating agent from archetype ${archetypeId} for user ${userId}`);
  
  // Fetch archetype
  const archetype = await this.archetypeService.findById(archetypeId);
  if (!archetype) {
    throw new NotFoundException(`Archetype with ID ${archetypeId} not found`);
  }

  // Use archetype name if no name provided
  const agentName = name || archetype.name;

  // Create agent with archetype config
  const configs = archetype.configs || {};
  return await this.create(
    userId,
    agentName,
    archetype.description,
    archetype.avatarUrl,
    archetype.agentType,
    archetype.language,
    configs
  );
}
```

**Note**: Import `AgentArchetypeService` in `AgentModule` and inject it into `AgentService`.

---

## Phase 3: Client App - Services & Types

### 3.1 Types

**File**: `apps/client/src/types/agent-archetype.types.ts`

```typescript
import { AgentType } from './agent.types';

export interface AgentArchetype {
  id: number;
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;
  createdAt: string;
  updatedAt: string;
  configs?: Record<string, unknown>;
}

export interface CreateAgentArchetypeRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;
  configs?: Record<string, unknown>;
}

export interface UpdateAgentArchetypeRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;
  configs?: Record<string, unknown>;
}
```

### 3.2 API Constants

**File**: `apps/client/src/constants/api.constants.ts`

Add archetype endpoints:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  AGENT_ARCHETYPES: {
    BASE: '/api/agent-archetypes',
    BY_ID: (id: number) => `/api/agent-archetypes/${id}`,
  },
};
```

### 3.3 Service

**File**: `apps/client/src/services/agent-archetype/agent-archetype.service.ts`

```typescript
import { apiManager } from '../api/api-manager';
import { API_ENDPOINTS } from '../../constants/api.constants';
import {
  AgentArchetype,
  CreateAgentArchetypeRequest,
  UpdateAgentArchetypeRequest,
} from '../../types/agent-archetype.types';

export class AgentArchetypeService {
  /**
   * Get all agent archetypes
   */
  static async getAllArchetypes(): Promise<AgentArchetype[]> {
    return apiManager.get<AgentArchetype[]>(API_ENDPOINTS.AGENT_ARCHETYPES.BASE);
  }

  /**
   * Get an archetype by ID
   */
  static async getArchetype(archetypeId: number): Promise<AgentArchetype> {
    return apiManager.get<AgentArchetype>(
      API_ENDPOINTS.AGENT_ARCHETYPES.BY_ID(archetypeId)
    );
  }

  /**
   * Create a new archetype (admin only)
   */
  static async createArchetype(
    data: CreateAgentArchetypeRequest
  ): Promise<AgentArchetype> {
    return apiManager.post<AgentArchetype>(
      API_ENDPOINTS.AGENT_ARCHETYPES.BASE,
      data
    );
  }

  /**
   * Update an archetype (admin only)
   */
  static async updateArchetype(
    archetypeId: number,
    data: UpdateAgentArchetypeRequest
  ): Promise<AgentArchetype> {
    return apiManager.put<AgentArchetype>(
      API_ENDPOINTS.AGENT_ARCHETYPES.BY_ID(archetypeId),
      data
    );
  }

  /**
   * Delete an archetype (admin only)
   */
  static async deleteArchetype(archetypeId: number): Promise<void> {
    return apiManager.delete(
      API_ENDPOINTS.AGENT_ARCHETYPES.BY_ID(archetypeId)
    );
  }
}
```

### 3.4 React Query Hook

**File**: `apps/client/src/hooks/queries/use-agent-archetypes.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { AgentArchetypeService } from '../../services/agent-archetype/agent-archetype.service';
import { AgentArchetype } from '../../types/agent-archetype.types';

export function useAgentArchetypes() {
  return useQuery<AgentArchetype[]>({
    queryKey: ['agent-archetypes'],
    queryFn: () => AgentArchetypeService.getAllArchetypes(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---

## Phase 4: Client App - UI Components

### 4.1 Archetype Selection Component

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/ArchetypeSelector.tsx`

```typescript
import { useAgentArchetypes } from '../../../../../../hooks/queries/use-agent-archetypes';
import { Avatar } from '@openai/ui';
import { AgentArchetype } from '../../../../../../types/agent-archetype.types';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface ArchetypeSelectorProps {
  selectedArchetypeId: number | null;
  onArchetypeSelect: (archetype: AgentArchetype) => void;
}

export default function ArchetypeSelector({
  selectedArchetypeId,
  onArchetypeSelect,
}: ArchetypeSelectorProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const { data: archetypes = [], isLoading } = useAgentArchetypes();

  // Don't render if no archetypes exist
  if (!isLoading && archetypes.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          {t('config.archetypes.title')}
        </h3>
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-16 h-16 rounded-full bg-background-secondary animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-text-secondary mb-3">
        {t('config.archetypes.title')}
      </h3>
      <div className="flex flex-wrap gap-3">
        {archetypes.map((archetype) => {
          const isSelected = selectedArchetypeId === archetype.id;
          return (
            <button
              key={archetype.id}
              type="button"
              onClick={() => onArchetypeSelect(archetype)}
              className={`
                relative w-16 h-16 rounded-full overflow-hidden
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${isSelected ? 'ring-4 ring-primary' : 'ring-2 ring-border'}
                hover:ring-primary hover:ring-4
              `}
              aria-label={archetype.name}
              title={archetype.name}
            >
              <Avatar
                src={archetype.avatarUrl || undefined}
                name={archetype.name}
                size="lg"
                borderWidth="none"
                className="w-full h-full"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### 4.2 Update AgentConfigForm to Support Archetypes

**File**: `apps/client/src/pages/config/components/agent/AgentConfig/parts/AgentConfigForm.tsx`

Add archetype selection and pre-fill logic:

```typescript
// Add to imports
import ArchetypeSelector from './ArchetypeSelector';
import { AgentArchetype } from '../../../../../../types/agent-archetype.types';

// Add state for selected archetype
const [selectedArchetypeId, setSelectedArchetypeId] = useState<number | null>(null);

// Add handler to pre-fill form from archetype
const handleArchetypeSelect = (archetype: AgentArchetype) => {
  setSelectedArchetypeId(archetype.id);
  
  // Pre-fill form with archetype data
  if (archetype.name) setValue('name', archetype.name);
  if (archetype.description) setValue('description', archetype.description || '');
  if (archetype.avatarUrl) setValue('avatarUrl', archetype.avatarUrl);
  if (archetype.agentType) setValue('agentType', archetype.agentType);
  if (archetype.language) setValue('language', archetype.language);
  
  // Pre-fill configs
  const configs = archetype.configs || {};
  if (configs.temperature !== undefined) setValue('temperature', configs.temperature as number);
  if (configs.system_prompt) setValue('description', configs.system_prompt as string);
  if (configs.behavior_rules) {
    const rules = Array.isArray(configs.behavior_rules)
      ? configs.behavior_rules
      : typeof configs.behavior_rules === 'object' && 'rules' in configs.behavior_rules
        ? (configs.behavior_rules as { rules: string[] }).rules
        : [];
    setValue('behaviorRules', rules);
  }
  if (configs.response_length) setValue('responseLength', configs.response_length as ResponseLength);
  if (configs.age !== undefined) setValue('age', configs.age as number);
  if (configs.gender) setValue('gender', configs.gender as Gender);
  if (configs.personality) setValue('personality', configs.personality as PersonalityType);
  if (configs.sentiment) setValue('sentiment', configs.sentiment as Sentiment);
  if (configs.interests) setValue('interests', configs.interests as string[]);
  if (configs.availability) setValue('availability', configs.availability as Availability);
};

// Add ArchetypeSelector to form (only show for new agents)
{isNewAgent && (
  <ArchetypeSelector
    selectedArchetypeId={selectedArchetypeId}
    onArchetypeSelect={handleArchetypeSelect}
  />
)}
```

### 4.3 Update Translation Files

**File**: `packages/i18n/src/locales/en/client.json`

Add archetype translations:

```json
{
  "config": {
    "archetypes": {
      "title": "Start from a template",
      "selectArchetype": "Select an archetype to pre-fill the form"
    }
  }
}
```

---

## Phase 5: Admin App - CRUD Interface

### 5.1 Admin Service

**File**: `apps/admin/src/services/agent-archetype.service.ts`

```typescript
import { apiManager } from './api/api-manager';
import { API_ENDPOINTS } from '../constants/api.constants';
import {
  AgentArchetype,
  CreateAgentArchetypeRequest,
  UpdateAgentArchetypeRequest,
} from '../types/agent-archetype.types';

export class AgentArchetypeService {
  static async getAllArchetypes(): Promise<AgentArchetype[]> {
    return apiManager.get<AgentArchetype[]>(API_ENDPOINTS.AGENT_ARCHETYPES.BASE);
  }

  static async getArchetype(id: number): Promise<AgentArchetype> {
    return apiManager.get<AgentArchetype>(
      API_ENDPOINTS.AGENT_ARCHETYPES.BY_ID(id)
    );
  }

  static async createArchetype(
    data: CreateAgentArchetypeRequest
  ): Promise<AgentArchetype> {
    return apiManager.post<AgentArchetype>(
      API_ENDPOINTS.AGENT_ARCHETYPES.BASE,
      data
    );
  }

  static async updateArchetype(
    id: number,
    data: UpdateAgentArchetypeRequest
  ): Promise<AgentArchetype> {
    return apiManager.put<AgentArchetype>(
      API_ENDPOINTS.AGENT_ARCHETYPES.BY_ID(id),
      data
    );
  }

  static async deleteArchetype(id: number): Promise<void> {
    return apiManager.delete(API_ENDPOINTS.AGENT_ARCHETYPES.BY_ID(id));
  }
}
```

### 5.2 Admin Types

**File**: `apps/admin/src/types/agent-archetype.types.ts`

```typescript
import { AgentType } from './agent.types';

export interface AgentArchetype {
  id: number;
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;
  createdAt: string;
  updatedAt: string;
  configs?: Record<string, unknown>;
}

export interface CreateAgentArchetypeRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;
  configs?: Record<string, unknown>;
}

export interface UpdateAgentArchetypeRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;
  configs?: Record<string, unknown>;
}
```

### 5.3 Admin API Constants

**File**: `apps/admin/src/constants/api.constants.ts`

Add archetype endpoints:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  AGENT_ARCHETYPES: {
    BASE: '/api/agent-archetypes',
    BY_ID: (id: number) => `/api/agent-archetypes/${id}`,
  },
};
```

### 5.4 Admin Page Component

**File**: `apps/admin/src/pages/AgentArchetypesPage.tsx`

```typescript
import { useState } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentArchetypeService } from '../services/agent-archetype.service';
import { AgentArchetype } from '../types/agent-archetype.types';
import AgentArchetypeList from '../components/AgentArchetypeList';
import AgentArchetypeForm from '../components/AgentArchetypeForm';
import { PageContainer, Container, PageHeader, Button } from '@openai/ui';

export default function AgentArchetypesPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingArchetype, setEditingArchetype] = useState<AgentArchetype | null>(null);

  const { data: archetypes = [], isLoading, error } = useQuery({
    queryKey: ['agent-archetypes'],
    queryFn: () => AgentArchetypeService.getAllArchetypes(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => AgentArchetypeService.deleteArchetype(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-archetypes'] });
    },
  });

  const handleCreate = () => {
    setEditingArchetype(null);
    setIsCreating(true);
  };

  const handleEdit = (archetype: AgentArchetype) => {
    setEditingArchetype(archetype);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingArchetype(null);
  };

  const handleSave = () => {
    queryClient.invalidateQueries({ queryKey: ['agent-archetypes'] });
    setIsCreating(false);
    setEditingArchetype(null);
  };

  if (error) {
    return (
      <PageContainer>
        <Container>
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {t('archetypes.error')}
          </div>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container>
        <PageHeader
          title={t('archetypes.title')}
          actions={
            !isCreating && !editingArchetype ? (
              <Button onClick={handleCreate} variant="primary">
                {t('archetypes.create')}
              </Button>
            ) : undefined
          }
        />
        {isCreating || editingArchetype ? (
          <AgentArchetypeForm
            archetype={editingArchetype}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <AgentArchetypeList
            archetypes={archetypes}
            loading={isLoading}
            onEdit={handleEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        )}
      </Container>
    </PageContainer>
  );
}
```

### 5.5 Admin List Component

**File**: `apps/admin/src/components/AgentArchetypeList.tsx`

```typescript
import { AgentArchetype } from '../types/agent-archetype.types';
import { Avatar, Button, Skeleton } from '@openai/ui';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { IconEdit, IconTrash } from '@openai/ui';

interface AgentArchetypeListProps {
  archetypes: AgentArchetype[];
  loading: boolean;
  onEdit: (archetype: AgentArchetype) => void;
  onDelete: (id: number) => void;
}

export default function AgentArchetypeList({
  archetypes,
  loading,
  onEdit,
  onDelete,
}: AgentArchetypeListProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (archetypes.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        {t('archetypes.empty')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {archetypes.map((archetype) => (
        <div
          key={archetype.id}
          className="flex items-center gap-4 p-4 bg-background-secondary rounded-lg border border-border"
        >
          <Avatar
            src={archetype.avatarUrl || undefined}
            name={archetype.name}
            size="md"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">{archetype.name}</h3>
            {archetype.description && (
              <p className="text-sm text-text-secondary mt-1">
                {archetype.description}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              {archetype.agentType && (
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                  {archetype.agentType}
                </span>
              )}
              {archetype.language && (
                <span className="text-xs px-2 py-1 bg-background-tertiary text-text-secondary rounded">
                  {archetype.language}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="icon"
              onClick={() => onEdit(archetype)}
              tooltip={t('archetypes.edit')}
            >
              <IconEdit size="md" />
            </Button>
            <Button
              variant="icon"
              onClick={() => onDelete(archetype.id)}
              tooltip={t('archetypes.delete')}
            >
              <IconTrash size="md" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 5.6 Admin Form Component

**File**: `apps/admin/src/components/AgentArchetypeForm.tsx`

Create a form component similar to the client's `AgentConfigForm`, but adapted for admin use. This should include all fields from the archetype DTO and allow editing all configuration options.

**Note**: This component will be similar to the client's agent config form but should be tailored for admin use. Consider reusing form field components from `@openai/ui` or the client app where appropriate.

### 5.7 Admin Routes

**File**: `apps/admin/src/App.tsx`

Add route for archetypes page:

```typescript
<Route path="/agent-archetypes" element={<AgentArchetypesPage />} />
```

### 5.8 Admin Navigation

Add navigation link to archetypes page in the admin app's navigation component.

### 5.9 Admin Translations

**File**: `packages/i18n/src/locales/en/admin.json`

Add archetype translations:

```json
{
  "archetypes": {
    "title": "Agent Archetypes",
    "create": "Create Archetype",
    "edit": "Edit",
    "delete": "Delete",
    "empty": "No archetypes found. Create one to get started.",
    "error": "Failed to load archetypes"
  }
}
```

---

## Phase 6: Integration & Testing

### 6.1 Update Agent Module

**File**: `apps/api/src/agent/agent.module.ts`

Import `AgentArchetypeModule` to make `AgentArchetypeService` available:

```typescript
import { AgentArchetypeModule } from '../agent-archetype/agent-archetype.module';

@Module({
  imports: [AgentArchetypeModule, /* ... other imports */],
  // ...
})
```

### 6.2 Update App Module

**File**: `apps/api/src/app.module.ts`

Import `AgentArchetypeModule`:

```typescript
import { AgentArchetypeModule } from './agent-archetype/agent-archetype.module';

@Module({
  imports: [
    // ... existing imports
    AgentArchetypeModule,
  ],
  // ...
})
```

### 6.3 Testing Checklist

#### Backend Tests

- [ ] Unit tests for `AgentArchetypeRepository`
- [ ] Unit tests for `AgentArchetypeService`
- [ ] Unit tests for `AgentArchetypeController`
- [ ] Integration tests for CRUD operations
- [ ] Test admin guard on write operations
- [ ] Test creating agent from archetype

#### Client Tests

- [ ] Unit tests for `ArchetypeSelector` component
- [ ] Test archetype selection pre-fills form
- [ ] Test archetype selector doesn't render when no archetypes exist
- [ ] Integration test for complete archetype selection flow

#### Admin Tests

- [ ] Unit tests for `AgentArchetypesPage`
- [ ] Unit tests for `AgentArchetypeList`
- [ ] Unit tests for `AgentArchetypeForm`
- [ ] Integration tests for CRUD operations

### 6.4 Type Checking & Linting

Run type checking and linting:

```bash
pnpm typecheck
pnpm lint
```

Fix any errors before considering the implementation complete.

---

## Implementation Order

1. **Phase 1**: Database schema and migration
2. **Phase 2**: Backend API (repository, service, controller, module)
3. **Phase 3**: Client services and types
4. **Phase 4**: Client UI components
5. **Phase 5**: Admin UI components
6. **Phase 6**: Integration, testing, and cleanup

---

## Notes & Considerations

### Security

- Admin-only endpoints must be protected with `@AdminGuard()`
- Users can only read archetypes, not modify them
- Validate all input on both client and server

### Performance

- Archetypes are read-only for users, so caching is safe
- Use React Query's `staleTime` for archetype queries
- Consider pagination if many archetypes exist (future enhancement)

### UX Considerations

- Archetype selector should be visually distinct
- Selected archetype should have clear visual feedback (border)
- Form should allow customization after archetype selection
- If no archetypes exist, hide the selector section entirely

### Future Enhancements

- Filter archetypes by agent type or language
- Search archetypes by name
- Preview archetype configuration before selecting
- Duplicate existing archetypes in admin
- Archive/deactivate archetypes instead of deleting

---

## Summary

This implementation plan provides a complete roadmap for adding agent archetypes to the system. The feature allows administrators to create pre-configured agent templates that users can select when creating new agents, streamlining the agent creation process while maintaining full customization capabilities.


