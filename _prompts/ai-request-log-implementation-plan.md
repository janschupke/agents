# AI Request Log Implementation Plan

## Overview

This document outlines the implementation plan for a new AI Request Log feature in the admin panel. This feature will provide administrators with a readonly table showing all OpenAI API requests and responses, including pricing information.

## Requirements

- New admin page with readonly table displaying API logs
- Table columns:
  - Datetime
  - User (with link to user profile if needed)
  - Request JSON
  - Model used
  - Total tokens (prompt + completion)
  - Response (truncated for display, full on expand)
  - Estimated price (calculated based on model pricing)
- Database storage with foreign key to User table (SET NULL on delete)
- Automatic logging of all OpenAI API requests/responses
- Model pricing constants defined in shared constants

## Database Schema Changes

### 1. Prisma Schema Update

**File:** `apps/api/prisma/schema.prisma`

Add new model:

```prisma
model AiRequestLog {
  id            Int       @id @default(autoincrement())
  userId        String?   @map("user_id") // Nullable for deleted users
  requestJson   Json      @map("request_json") // Full OpenAI request
  responseJson  Json      @map("response_json") // Full OpenAI response
  model         String    // Model name (e.g., 'gpt-4o-mini')
  promptTokens  Int       @map("prompt_tokens")
  completionTokens Int    @map("completion_tokens")
  totalTokens   Int       @map("total_tokens")
  estimatedPrice Decimal  @map("estimated_price") @db.Decimal(10, 6) // Price in USD
  createdAt     DateTime  @default(now()) @map("created_at")
  
  user          User?     @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@map("ai_request_logs")
  @@index([userId])
  @@index([createdAt])
  @@index([model])
}
```

**Update User model:**

```prisma
model User {
  // ... existing fields ...
  aiRequestLogs AiRequestLog[]
}
```

### 2. Migration

- Create migration: `pnpm --filter api prisma migrate dev --name add_ai_request_log`
- Migration will create table with proper indexes for performance

## Backend Implementation (API)

### 1. Constants - Model Pricing

**File:** `packages/shared-types/src/openai.ts`

Add pricing constants:

```typescript
/**
 * OpenAI model pricing per 1M tokens (as of 2024)
 * Pricing: input tokens / output tokens
 */
export const OPENAI_MODEL_PRICING = {
  'gpt-4o-mini': {
    input: 0.15,   // $0.15 per 1M input tokens
    output: 0.60,  // $0.60 per 1M output tokens
  },
  'gpt-4o': {
    input: 2.50,
    output: 10.00,
  },
  'gpt-4-turbo': {
    input: 10.00,
    output: 30.00,
  },
  'gpt-3.5-turbo': {
    input: 0.50,
    output: 1.50,
  },
} as const;

export type OpenAIModelName = keyof typeof OPENAI_MODEL_PRICING;
```

**File:** `apps/api/src/common/constants/api.constants.ts`

Re-export pricing:

```typescript
export { OPENAI_MODEL_PRICING } from '@openai/shared-types';
```

### 2. Entity/Repository

**File:** `apps/api/src/ai-request-log/ai-request-log.entity.ts` (if needed for DTOs)

**File:** `apps/api/src/ai-request-log/ai-request-log.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AiRequestLogOrderBy, OrderDirection } from './constants/ai-request-log.constants';

@Injectable()
export class AiRequestLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId?: string;
    requestJson: Prisma.JsonValue;
    responseJson: Prisma.JsonValue;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedPrice: number;
  }) {
    return this.prisma.aiRequestLog.create({
      data,
    });
  }

  async findAll(options?: {
    userId?: string;
    model?: string;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
    orderBy?: AiRequestLogOrderBy;
    orderDirection?: OrderDirection;
  }) {
    const where: Prisma.AiRequestLogWhereInput = {};
    
    if (options?.userId) {
      where.userId = options.userId;
    }
    if (options?.model) {
      where.model = options.model;
    }
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const orderBy: Prisma.AiRequestLogOrderByWithRelationInput = {};
    if (options?.orderBy) {
      orderBy[options.orderBy] = options.orderDirection || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    return this.prisma.aiRequestLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy,
      skip: options?.skip,
      take: options?.take,
    });
  }

  async count(options?: {
    userId?: string;
    model?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.AiRequestLogWhereInput = {};
    
    if (options?.userId) {
      where.userId = options.userId;
    }
    if (options?.model) {
      where.model = options.model;
    }
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    return this.prisma.aiRequestLog.count({ where });
  }
}
```

### 3. Service

**File:** `apps/api/src/ai-request-log/ai-request-log.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { AiRequestLogRepository } from './ai-request-log.repository';
import { OPENAI_MODEL_PRICING } from '../common/constants/api.constants';
import { AiRequestLogOrderBy, OrderDirection } from './constants/ai-request-log.constants';
import OpenAI from 'openai';

@Injectable()
export class AiRequestLogService {
  private readonly logger = new Logger(AiRequestLogService.name);

  constructor(
    private readonly aiRequestLogRepository: AiRequestLogRepository
  ) {}

  /**
   * Calculate estimated price based on model and token usage
   */
  calculatePrice(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    const pricing = OPENAI_MODEL_PRICING[model as keyof typeof OPENAI_MODEL_PRICING];
    
    if (!pricing) {
      this.logger.warn(`No pricing found for model: ${model}, using default`);
      // Default to gpt-4o-mini pricing if model not found
      const defaultPricing = OPENAI_MODEL_PRICING['gpt-4o-mini'];
      return (
        (promptTokens / 1_000_000) * defaultPricing.input +
        (completionTokens / 1_000_000) * defaultPricing.output
      );
    }

    return (
      (promptTokens / 1_000_000) * pricing.input +
      (completionTokens / 1_000_000) * pricing.output
    );
  }

  /**
   * Log OpenAI API request/response
   */
  async logRequest(
    userId: string | undefined,
    request: OpenAI.Chat.Completions.ChatCompletionCreateParams,
    completion: OpenAI.Chat.Completions.ChatCompletion
  ): Promise<void> {
    try {
      const promptTokens = completion.usage?.prompt_tokens || 0;
      const completionTokens = completion.usage?.completion_tokens || 0;
      const totalTokens = completion.usage?.total_tokens || 0;
      const model = request.model;

      const estimatedPrice = this.calculatePrice(
        model,
        promptTokens,
        completionTokens
      );

      await this.aiRequestLogRepository.create({
        userId: userId || null,
        requestJson: request as unknown as Record<string, unknown>,
        responseJson: completion as unknown as Record<string, unknown>,
        model,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedPrice,
      });

      this.logger.debug(
        `Logged AI request: model=${model}, tokens=${totalTokens}, price=$${estimatedPrice.toFixed(6)}`
      );
    } catch (error) {
      // Don't throw - logging failures shouldn't break the main flow
      this.logger.error('Failed to log AI request:', error);
    }
  }

  /**
   * Get all logs with pagination
   */
  async getAllLogs(options?: {
    userId?: string;
    model?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
    orderBy?: AiRequestLogOrderBy;
    orderDirection?: OrderDirection;
  }) {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      this.aiRequestLogRepository.findAll({
        ...options,
        skip,
        take: pageSize,
      }),
      this.aiRequestLogRepository.count(options),
    ]);

    return {
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
```

### 4. Enums and Constants

**File:** `apps/api/src/ai-request-log/constants/ai-request-log.constants.ts`

```typescript
export enum AiRequestLogOrderBy {
  CREATED_AT = 'createdAt',
  ESTIMATED_PRICE = 'estimatedPrice',
  TOTAL_TOKENS = 'totalTokens',
}

export enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}
```

### 5. DTOs

**File:** `apps/api/src/ai-request-log/dto/ai-request-log.dto.ts`

```typescript
import { IsOptional, IsString, IsDateString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AiRequestLogOrderBy, OrderDirection } from '../constants/ai-request-log.constants';

export class GetAiRequestLogsQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsEnum(AiRequestLogOrderBy)
  orderBy?: AiRequestLogOrderBy;

  @IsOptional()
  @IsEnum(OrderDirection)
  orderDirection?: OrderDirection;
}
```

### 6. Controller

**File:** `apps/api/src/ai-request-log/ai-request-log.controller.ts`

```typescript
import { Controller, Get, Query, Logger, UseGuards } from '@nestjs/common';
import { AiRequestLogService } from './ai-request-log.service';
import { GetAiRequestLogsQueryDto } from './dto/ai-request-log.dto';
import { ClerkGuard } from '../auth/guards/clerk.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { API_ROUTES } from '../common/constants/api-routes.constants';

@Controller(API_ROUTES.AI_REQUEST_LOGS.BASE)
@UseGuards(ClerkGuard, AdminGuard)
export class AiRequestLogController {
  private readonly logger = new Logger(AiRequestLogController.name);

  constructor(private readonly aiRequestLogService: AiRequestLogService) {}

  @Get()
  async getAllLogs(@Query() query: GetAiRequestLogsQueryDto) {
    this.logger.log('Getting AI request logs');

    const options = {
      userId: query.userId,
      model: query.model,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page: query.page,
      pageSize: query.pageSize,
      orderBy: query.orderBy,
      orderDirection: query.orderDirection,
    };

    return this.aiRequestLogService.getAllLogs(options);
  }
}
```

### 7. Module

**File:** `apps/api/src/ai-request-log/ai-request-log.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AiRequestLogController } from './ai-request-log.controller';
import { AiRequestLogService } from './ai-request-log.service';
import { AiRequestLogRepository } from './ai-request-log.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiRequestLogController],
  providers: [AiRequestLogService, AiRequestLogRepository],
  exports: [AiRequestLogService],
})
export class AiRequestLogModule {}
```

### 8. Update API Routes Constants

**File:** `apps/api/src/common/constants/api-routes.constants.ts`

Add:

```typescript
export const API_ROUTES = {
  // ... existing routes ...
  AI_REQUEST_LOGS: {
    BASE: '/api/ai-request-logs',
  },
};
```

### 9. Register Module

**File:** `apps/api/src/app.module.ts`

Add `AiRequestLogModule` to imports array.

### 10. Integration Points

#### A. OpenAIChatService Integration

**File:** `apps/api/src/chat/services/openai-chat.service.ts`

Inject `AiRequestLogService` and call after successful completion:

```typescript
import { AiRequestLogService } from '../../ai-request-log/ai-request-log.service';

@Injectable()
export class OpenAIChatService {
  constructor(
    private readonly openaiService: OpenAIService,
    private readonly aiRequestLogService: AiRequestLogService
  ) {}

  async createChatCompletion(
    apiKey: string,
    request: OpenAIRequest,
    userId?: string // Add userId parameter
  ): Promise<{
    response: string;
    completion: OpenAI.Chat.Completions.ChatCompletion;
  }> {
    // ... existing code ...

    // After successful completion:
    await this.aiRequestLogService.logRequest(
      userId,
      {
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
      },
      completion
    );

    return { response, completion };
  }
}
```

**Update ChatService call:**

**File:** `apps/api/src/chat/chat.service.ts`

```typescript
const { response, completion } =
  await this.openaiChatService.createChatCompletion(
    apiKey,
    openaiRequest,
    userId // Pass userId
  );
```

#### B. MessageTranslationService Integration

**File:** `apps/api/src/message-translation/message-translation.service.ts`

Inject `AiRequestLogService` and log translation requests:

```typescript
// In translateWithOpenAI method, after completion:
await this.aiRequestLogService.logRequest(
  userId, // Need to pass userId through method chain
  {
    model: OPENAI_MODELS.TRANSLATION,
    messages: [
      {
        role: 'system',
        content: OPENAI_PROMPTS.TRANSLATION.SYSTEM,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: NUMERIC_CONSTANTS.TRANSLATION_TEMPERATURE,
    max_tokens: NUMERIC_CONSTANTS.DEFAULT_MAX_TOKENS,
  },
  completion
);
```

#### C. WordTranslationService Integration

**File:** `apps/api/src/message-translation/word-translation.service.ts`

Similar integration in `translateWordsWithOpenAI` and `translatePreParsedWordsWithOpenAI` methods.

#### D. Memory Services Integration

**Files:**
- `apps/api/src/memory/services/memory-extraction.service.ts`
- `apps/api/src/memory/services/memory-summarization.service.ts`

Add logging to OpenAI calls in these services.

### 11. Admin Guard

**File:** `apps/api/src/auth/guards/admin.guard.ts` (create if doesn't exist)

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const user = await this.userService.findById(userId);
    const roles = (user?.roles as string[]) || [];

    if (!roles.includes('admin')) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
```

## Frontend Implementation (Admin)

### 1. Types

**File:** `apps/admin/src/types/ai-request-log.types.ts`

```typescript
import { AiRequestLogOrderBy, OrderDirection } from './ai-request-log.enums';

export interface AiRequestLog {
  id: number;
  userId: string | null;
  requestJson: Record<string, unknown>;
  responseJson: Record<string, unknown>;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedPrice: number;
  createdAt: string;
  user?: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export interface AiRequestLogsResponse {
  logs: AiRequestLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface GetAiRequestLogsParams {
  userId?: string;
  model?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  orderBy?: AiRequestLogOrderBy;
  orderDirection?: OrderDirection;
}
```

### 2. Enums

**File:** `apps/admin/src/types/ai-request-log.enums.ts`

```typescript
export enum AiRequestLogOrderBy {
  CREATED_AT = 'createdAt',
  ESTIMATED_PRICE = 'estimatedPrice',
  TOTAL_TOKENS = 'totalTokens',
}

export enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}
```

### 3. Service

**File:** `apps/admin/src/services/ai-request-log.service.ts`

```typescript
import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';
import type {
  AiRequestLogsResponse,
  GetAiRequestLogsParams,
} from '../types/ai-request-log.types.js';

export class AiRequestLogService {
  static async getLogs(
    params?: GetAiRequestLogsParams
  ): Promise<AiRequestLogsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.model) queryParams.append('model', params.model);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params?.orderDirection) queryParams.append('orderDirection', params.orderDirection);

    const url = `${API_ENDPOINTS.AI_REQUEST_LOGS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiManager.get<AiRequestLogsResponse>(url);
  }
}
```

### 4. API Constants

**File:** `apps/admin/src/constants/api.constants.ts`

Add:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints ...
  AI_REQUEST_LOGS: '/api/ai-request-logs',
};
```

### 5. Route Constants

**File:** `apps/admin/src/constants/routes.constants.ts` (create if doesn't exist)

```typescript
export const ROUTES = {
  USERS: '/users',
  SYSTEM_RULES: '/system-rules',
  AGENT_ARCHETYPES: '/agent-archetypes',
  AI_REQUEST_LOGS: '/ai-request-logs',
} as const;
```

### 6. Query Keys

**File:** `apps/admin/src/hooks/queries/query-keys.ts`

Update:

```typescript
import type { GetAiRequestLogsParams } from '../../types/ai-request-log.types';

enum QueryKey {
  USER = 'user',
  USERS = 'users',
  SYSTEM = 'system',
  BEHAVIOR_RULES = 'behaviorRules',
  ME = 'me',
  ALL = 'all',
  AI_REQUEST_LOGS = 'aiRequestLogs',
}

export const queryKeys = {
  user: {
    all: [QueryKey.USER] as const,
    me: () => [...queryKeys.user.all, QueryKey.ME] as const,
    lists: () => [...queryKeys.user.all, QueryKey.USERS] as const,
    list: () => [...queryKeys.user.lists(), QueryKey.ALL] as const,
  },
  system: {
    all: [QueryKey.SYSTEM] as const,
    behaviorRules: () =>
      [...queryKeys.system.all, QueryKey.BEHAVIOR_RULES] as const,
  },
  aiRequestLogs: {
    all: [QueryKey.AI_REQUEST_LOGS] as const,
    lists: () => [...queryKeys.aiRequestLogs.all, QueryKey.ALL] as const,
    list: (params?: GetAiRequestLogsParams) =>
      [...queryKeys.aiRequestLogs.lists(), params] as const,
  },
} as const;
```

### 7. Hook

**File:** `apps/admin/src/hooks/queries/use-ai-request-logs.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { AiRequestLogService } from '../../services/ai-request-log.service';
import type { GetAiRequestLogsParams } from '../../types/ai-request-log.types';
import { queryKeys } from './query-keys';

export function useAiRequestLogs(params?: GetAiRequestLogsParams) {
  return useQuery({
    queryKey: queryKeys.aiRequestLogs.list(params),
    queryFn: () => AiRequestLogService.getLogs(params),
  });
}
```

### 9. Page Component

**File:** `apps/admin/src/pages/AiRequestLogsPage.tsx`

```typescript
import { useState } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { useAiRequestLogs } from '../hooks/queries/use-ai-request-logs';
import AiRequestLogTable from '../components/AiRequestLogTable';
import { AiRequestLogOrderBy, OrderDirection } from '../types/ai-request-log.enums';

export default function AiRequestLogsPage() {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [orderBy, setOrderBy] = useState<AiRequestLogOrderBy>(AiRequestLogOrderBy.CREATED_AT);
  const [orderDirection, setOrderDirection] = useState<OrderDirection>(OrderDirection.DESC);

  const { data, isLoading, error } = useAiRequestLogs({
    page,
    pageSize,
    orderBy,
    orderDirection,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-text-secondary">{t('aiRequestLogs.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
        {t('aiRequestLogs.error')}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-secondary mb-2">
          {t('aiRequestLogs.title')}
        </h2>
        <p className="text-text-tertiary text-sm">
          {data?.pagination.total
            ? t('aiRequestLogs.total', { count: data.pagination.total })
            : t('aiRequestLogs.noLogs')}
        </p>
      </div>
      <AiRequestLogTable
        logs={data?.logs || []}
        pagination={data?.pagination}
        onPageChange={setPage}
        onOrderByChange={setOrderBy}
        onOrderDirectionChange={setOrderDirection}
        currentOrderBy={orderBy}
        currentOrderDirection={orderDirection}
      />
    </div>
  );
}
```

### 10. Table Component

**File:** `apps/admin/src/components/AiRequestLogTable.tsx`

```typescript
import { useState } from 'react';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import type { AiRequestLog } from '../types/ai-request-log.types';
import { AiRequestLogOrderBy, OrderDirection } from '../types/ai-request-log.enums';

interface AiRequestLogTableProps {
  logs: AiRequestLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onOrderByChange: (orderBy: AiRequestLogOrderBy) => void;
  onOrderDirectionChange: (direction: OrderDirection) => void;
  currentOrderBy: AiRequestLogOrderBy;
  currentOrderDirection: OrderDirection;
}

export default function AiRequestLogTable({
  logs,
  pagination,
  onPageChange,
  onOrderByChange,
  onOrderDirectionChange,
  currentOrderBy,
  currentOrderDirection,
}: AiRequestLogTableProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(6)}`;
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatJson = (json: Record<string, unknown>) => {
    return JSON.stringify(json, null, 2);
  };

  const getSortIcon = (column: AiRequestLogOrderBy) => {
    if (currentOrderBy !== column) return null;
    return currentOrderDirection === OrderDirection.ASC ? '↑' : '↓';
  };

  const handleSort = (column: AiRequestLogOrderBy) => {
    if (currentOrderBy === column) {
      onOrderDirectionChange(
        currentOrderDirection === OrderDirection.ASC
          ? OrderDirection.DESC
          : OrderDirection.ASC
      );
    } else {
      onOrderByChange(column);
      onOrderDirectionChange(OrderDirection.DESC);
    }
  };

  return (
    <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background-tertiary">
            <tr>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase cursor-pointer hover:bg-background-secondary"
                onClick={() => handleSort(AiRequestLogOrderBy.CREATED_AT)}
              >
                {t('aiRequestLogs.table.datetime')} {getSortIcon(AiRequestLogOrderBy.CREATED_AT)}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                {t('aiRequestLogs.table.user')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                {t('aiRequestLogs.table.model')}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase cursor-pointer hover:bg-background-secondary"
                onClick={() => handleSort(AiRequestLogOrderBy.TOTAL_TOKENS)}
              >
                {t('aiRequestLogs.table.tokens')} {getSortIcon(AiRequestLogOrderBy.TOTAL_TOKENS)}
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase cursor-pointer hover:bg-background-secondary"
                onClick={() => handleSort(AiRequestLogOrderBy.ESTIMATED_PRICE)}
              >
                {t('aiRequestLogs.table.price')} {getSortIcon(AiRequestLogOrderBy.ESTIMATED_PRICE)}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                {t('aiRequestLogs.table.response')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                {t('aiRequestLogs.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-tertiary">
                  {t('aiRequestLogs.noLogs')}
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedRows.has(log.id);
                const responseContent = (log.responseJson as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content || '';
                
                return (
                  <tr key={log.id} className="hover:bg-background-tertiary">
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {log.user
                        ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email || log.userId
                        : log.userId || t('aiRequestLogs.deletedUser')}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {log.model}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {log.totalTokens.toLocaleString()}
                      <span className="text-text-tertiary text-xs ml-1">
                        ({log.promptTokens}/{log.completionTokens})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary font-mono">
                      {formatPrice(log.estimatedPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">
                      {truncateText(responseContent, 100)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => toggleRow(log.id)}
                        className="text-primary hover:text-primary-hover"
                      >
                        {isExpanded ? t('aiRequestLogs.collapse') : t('aiRequestLogs.expand')}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Expanded row details */}
      {logs.map((log) => {
        if (!expandedRows.has(log.id)) return null;
        
        return (
          <div
            key={`expanded-${log.id}`}
            className="border-t border-border bg-background p-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-text-secondary mb-2">
                  {t('aiRequestLogs.request')}
                </h4>
                <pre className="bg-background-tertiary p-3 rounded text-xs overflow-auto max-h-64">
                  {formatJson(log.requestJson)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium text-text-secondary mb-2">
                  {t('aiRequestLogs.response')}
                </h4>
                <pre className="bg-background-tertiary p-3 rounded text-xs overflow-auto max-h-64">
                  {formatJson(log.responseJson)}
                </pre>
              </div>
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <div className="text-sm text-text-tertiary">
            {t('aiRequestLogs.pagination.showing', {
              start: (pagination.page - 1) * pagination.pageSize + 1,
              end: Math.min(pagination.page * pagination.pageSize, pagination.total),
              total: pagination.total,
            })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-background-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('aiRequestLogs.pagination.previous')}
            </button>
            <span className="px-3 py-1 text-sm text-text-secondary">
              {t('aiRequestLogs.pagination.page', {
                current: pagination.page,
                total: pagination.totalPages,
              })}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-background-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('aiRequestLogs.pagination.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 11. Update App Routes

**File:** `apps/admin/src/App.tsx`

Add route:

```typescript
import AiRequestLogsPage from './pages/AiRequestLogsPage';
import { ROUTES } from './constants/routes.constants';

// In Routes:
<Route path={ROUTES.AI_REQUEST_LOGS} element={<AiRequestLogsPage />} />
```

### 12. Update Navigation

**File:** `apps/admin/src/components/layout/AdminNavigation.tsx`

Add navigation link (need to add icon):

```typescript
import { IconFileText } from '../ui/Icons'; // Or appropriate icon
import { ROUTES } from '../../constants/routes.constants';

// Add link:
<Link
  to={ROUTES.AI_REQUEST_LOGS}
  className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
    isActive(ROUTES.AI_REQUEST_LOGS)
      ? 'text-primary border-b-2 border-primary'
      : 'text-text-tertiary hover:text-text-secondary'
  }`}
>
  <IconFileText className="w-4 h-4" />
  {t('navigation.aiRequestLogs')}
</Link>
```

### 13. Translations

**File:** `packages/i18n/src/locales/en/admin.json`

Add translations:

```json
{
  "aiRequestLogs": {
    "title": "AI Request Logs",
    "loading": "Loading request logs...",
    "error": "Failed to load request logs",
    "noLogs": "No request logs found",
    "total": "Total: {{count}} logs",
    "deletedUser": "Deleted User",
    "expand": "Expand",
    "collapse": "Collapse",
    "request": "Request",
    "response": "Response",
    "table": {
      "datetime": "Date/Time",
      "user": "User",
      "model": "Model",
      "tokens": "Tokens",
      "price": "Est. Price",
      "response": "Response",
      "actions": "Actions"
    },
    "pagination": {
      "showing": "Showing {{start}} to {{end}} of {{total}}",
      "page": "Page {{current}} of {{total}}",
      "previous": "Previous",
      "next": "Next"
    }
  },
  "navigation": {
    "aiRequestLogs": "AI Request Logs"
  }
}
```

## Implementation Steps

### Phase 1: Database & Backend Foundation
1. ✅ Update Prisma schema with `AiRequestLog` model
2. ✅ Create and run migration
3. ✅ Add model pricing constants to `@openai/shared-types`
4. ✅ Create repository, service, DTOs, controller, and module
5. ✅ Register module in `app.module.ts`
6. ✅ Add API route constants
7. ✅ Create/update AdminGuard

### Phase 2: Integration
8. ✅ Update `OpenAIChatService` to accept userId and log requests
9. ✅ Update `ChatService` to pass userId to `OpenAIChatService`
10. ✅ Integrate logging into `MessageTranslationService`
11. ✅ Integrate logging into `WordTranslationService`
12. ✅ Integrate logging into memory services (extraction, summarization)
13. ✅ Test logging in all integration points

### Phase 3: Frontend
14. ✅ Create types for AI request logs
15. ✅ Create service for API calls
16. ✅ Create React Query hook
17. ✅ Create page component
18. ✅ Create table component with expand/collapse
19. ✅ Add route to App.tsx
20. ✅ Add navigation link
21. ✅ Add translations

### Phase 4: Testing & Polish
22. ✅ Test all integration points
23. ✅ Test pagination and sorting
24. ✅ Test with deleted users (null userId)
25. ✅ Verify pricing calculations
26. ✅ Performance testing with large datasets
27. ✅ Add error handling and edge cases

## Testing Considerations

### Unit Tests
- Repository methods (create, findAll, count)
- Service price calculation
- Service logRequest method
- DTO validation

### Integration Tests
- Controller endpoint with authentication
- AdminGuard functionality
- Logging integration in OpenAI service calls
- Pagination and filtering

### E2E Tests
- Admin can access logs page
- Logs display correctly
- Expand/collapse functionality
- Pagination works
- Sorting works
- Non-admin users cannot access

## Performance Considerations

1. **Indexing**: Ensure indexes on `userId`, `createdAt`, and `model` for fast queries
2. **Pagination**: Always use pagination (default 50 items per page)
3. **JSON Storage**: Prisma JSON fields are efficient for storing request/response data
4. **Async Logging**: Logging should not block main request flow (use try-catch, don't throw)
5. **Response Size**: Consider truncating very large responses in table view (already implemented with expand)

## Security Considerations

1. **Admin Only**: Endpoint protected with AdminGuard
2. **User Data**: Only admins can see all users' logs
3. **Sensitive Data**: Request/response JSON may contain sensitive information - ensure proper access control
4. **Rate Limiting**: Consider rate limiting on log endpoint if needed

## Future Enhancements

1. **Filtering**: Add filters for date range, user, model
2. **Export**: Export logs to CSV/JSON
3. **Analytics**: Dashboard with cost summaries, usage trends
4. **Alerts**: Alert on high costs or unusual patterns
5. **Retention**: Automatic cleanup of old logs (configurable retention period)
6. **Search**: Full-text search in request/response content
