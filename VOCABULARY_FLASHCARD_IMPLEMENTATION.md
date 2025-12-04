# Vocabulary Flashcard System - Product Requirements Plan (PRP)

## Overview

This document outlines the implementation plan for a vocabulary flashcard system that allows users to extract words and phrases from chat messages, save them as vocabulary flashcards, and study them using an infinite flashcard UI. The system will automatically generate translations for assistant responses and provide on-demand vocabulary extraction from user messages.

## Features

1. **Vocabulary Flashcard Study Interface** - Infinite scroll flashcard UI for studying saved vocabulary
2. **Message Vocabulary Extraction** - Button on each chat bubble to extract vocabulary words/phrases
3. **Vocabulary Review Modal** - Preview and edit vocabulary pairs before saving
4. **Automatic Translation Generation** - Assistant responses automatically translated and stored
5. **Vocabulary Management** - Paginated list view to manage, edit, and delete saved vocabulary

---

## Database Schema

### New Model: `Vocabulary`

**Location**: `packages/api/prisma/schema.prisma`

```prisma
model Vocabulary {
  id              Int      @id @default(autoincrement())
  userId          String   @map("user_id")
  originalText    String   @map("original_text") // The word/phrase in original language
  translation     String   // English translation
  context         String?  // Optional context sentence or usage example
  sourceMessageId Int?     @map("source_message_id") // Optional reference to source message
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, originalText]) // For duplicate detection
  @@map("vocabulary")
}
```

### Update User Model

Add vocabulary relation to existing `User` model:

```prisma
model User {
  // ... existing fields ...
  vocabulary     Vocabulary[]
  
  @@map("users")
}
```

### Migration

**Location**: `packages/api/prisma/migrations/[timestamp]_add_vocabulary/migration.sql`

```sql
-- CreateTable: vocabulary
CREATE TABLE IF NOT EXISTS "vocabulary" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "original_text" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "context" TEXT,
    "source_message_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "vocabulary_user_id_created_at_idx" ON "vocabulary"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "vocabulary_user_id_original_text_idx" ON "vocabulary"("user_id", "original_text");

-- AddForeignKey
ALTER TABLE "vocabulary" ADD CONSTRAINT "vocabulary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## Backend Implementation

### 1. Vocabulary Repository

**Location**: `packages/api/src/vocabulary/vocabulary.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Vocabulary } from '@prisma/client';

export interface CreateVocabularyDto {
  originalText: string;
  translation: string;
  context?: string;
  sourceMessageId?: number;
}

export interface UpdateVocabularyDto {
  originalText?: string;
  translation?: string;
  context?: string;
}

@Injectable()
export class VocabularyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    data: CreateVocabularyDto
  ): Promise<Vocabulary> {
    return this.prisma.vocabulary.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  async createMany(
    userId: string,
    items: CreateVocabularyDto[]
  ): Promise<{ count: number }> {
    return this.prisma.vocabulary.createMany({
      data: items.map((item) => ({
        userId,
        ...item,
      })),
      skipDuplicates: true, // Skip if (userId, originalText) already exists
    });
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: Vocabulary[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const [items, total] = await Promise.all([
      this.prisma.vocabulary.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vocabulary.count({
        where: { userId },
      }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number, userId: string): Promise<Vocabulary | null> {
    return this.prisma.vocabulary.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async update(
    id: number,
    userId: string,
    data: UpdateVocabularyDto
  ): Promise<Vocabulary> {
    return this.prisma.vocabulary.update({
      where: { id },
      data,
    });
  }

  async delete(id: number, userId: string): Promise<void> {
    await this.prisma.vocabulary.delete({
      where: { id },
    });
  }

  async findDuplicates(
    userId: string,
    originalTexts: string[]
  ): Promise<Set<string>> {
    const existing = await this.prisma.vocabulary.findMany({
      where: {
        userId,
        originalText: {
          in: originalTexts,
        },
      },
      select: {
        originalText: true,
      },
    });

    return new Set(existing.map((v) => v.originalText));
  }
}
```

### 2. Vocabulary Service

**Location**: `packages/api/src/vocabulary/vocabulary.service.ts`

```typescript
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { VocabularyRepository, CreateVocabularyDto, UpdateVocabularyDto } from './vocabulary.repository';
import { MessageTranslationService } from '../message-translation/message-translation.service';
import { MessageRepository } from '../message/message.repository';
import { SessionRepository } from '../session/session.repository';
import { ApiCredentialsService } from '../api-credentials/api-credentials.service';
import { OpenAIService } from '../openai/openai.service';

export interface VocabularyPair {
  originalText: string;
  translation: string;
  context?: string;
}

export interface ExtractVocabularyRequest {
  messageId: number;
  originalText: string;
  translation?: string; // Optional if already exists
}

@Injectable()
export class VocabularyService {
  constructor(
    private readonly vocabularyRepository: VocabularyRepository,
    private readonly translationService: MessageTranslationService,
    private readonly messageRepository: MessageRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly apiCredentialsService: ApiCredentialsService,
    private readonly openAIService: OpenAIService
  ) {}

  /**
   * Extract vocabulary from a message
   * Parses the message text into words/phrases and generates translations
   */
  async extractVocabulary(
    messageId: number,
    userId: string,
    originalText: string,
    existingTranslation?: string
  ): Promise<VocabularyPair[]> {
    // Verify user has access to the message
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
    }

    const session = await this.sessionRepository.findByIdAndUserId(
      message.sessionId,
      userId
    );
    if (!session) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
    }

    // Get or generate translation
    let translation = existingTranslation;
    if (!translation) {
      // Check if message has existing translation
      const messageTranslation = await this.translationService.getTranslationForMessage(messageId);
      if (messageTranslation) {
        translation = messageTranslation;
      } else {
        // Generate translation using OpenAI
        const apiKey = await this.apiCredentialsService.getApiKey(userId, 'openai');
        if (!apiKey) {
          throw new HttpException(
            'OpenAI API key required',
            HttpStatus.BAD_REQUEST
          );
        }
        translation = await this.translateText(originalText, apiKey);
      }
    }

    // Parse vocabulary using OpenAI
    const apiKey = await this.apiCredentialsService.getApiKey(userId, 'openai');
    if (!apiKey) {
      throw new HttpException(
        'OpenAI API key required',
        HttpStatus.BAD_REQUEST
      );
    }

    const vocabularyPairs = await this.parseVocabulary(
      originalText,
      translation,
      apiKey
    );

    return vocabularyPairs;
  }

  /**
   * Save vocabulary pairs to database
   */
  async saveVocabulary(
    userId: string,
    pairs: CreateVocabularyDto[]
  ): Promise<{ saved: number; skipped: number }> {
    // Check for duplicates
    const originalTexts = pairs.map((p) => p.originalText);
    const duplicates = await this.vocabularyRepository.findDuplicates(
      userId,
      originalTexts
    );

    // Filter out duplicates
    const newPairs = pairs.filter((p) => !duplicates.has(p.originalText));
    const skipped = pairs.length - newPairs.length;

    if (newPairs.length > 0) {
      await this.vocabularyRepository.createMany(userId, newPairs);
    }

    return {
      saved: newPairs.length,
      skipped,
    };
  }

  /**
   * Get paginated vocabulary list
   */
  async getVocabularyList(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    return this.vocabularyRepository.findAll(userId, page, limit);
  }

  /**
   * Update a vocabulary item
   */
  async updateVocabulary(
    id: number,
    userId: string,
    data: UpdateVocabularyDto
  ) {
    const vocabulary = await this.vocabularyRepository.findById(id, userId);
    if (!vocabulary) {
      throw new HttpException('Vocabulary not found', HttpStatus.NOT_FOUND);
    }

    return this.vocabularyRepository.update(id, userId, data);
  }

  /**
   * Delete a vocabulary item
   */
  async deleteVocabulary(id: number, userId: string): Promise<void> {
    const vocabulary = await this.vocabularyRepository.findById(id, userId);
    if (!vocabulary) {
      throw new HttpException('Vocabulary not found', HttpStatus.NOT_FOUND);
    }

    await this.vocabularyRepository.delete(id, userId);
  }

  /**
   * Parse vocabulary from text using OpenAI
   * Returns array of { originalText, translation, context? }
   */
  private async parseVocabulary(
    originalText: string,
    translation: string,
    apiKey: string
  ): Promise<VocabularyPair[]> {
    const prompt = `Extract vocabulary words and phrases from the following text pair. Return a JSON array of objects with "originalText" (word/phrase in original language), "translation" (English translation), and optionally "context" (example sentence).

Original text: "${originalText}"
Translation: "${translation}"

Return only the JSON array, no other text. Format:
[
  {
    "originalText": "word or phrase",
    "translation": "English translation",
    "context": "example sentence (optional)"
  }
]`;

    const response = await this.openAIService.createChatCompletion(
      apiKey,
      [
        {
          role: 'system',
          content: 'You are a language learning assistant. Extract vocabulary from text pairs and return JSON arrays.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      {
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }
    );

    try {
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const parsed = JSON.parse(content);
      
      // Handle both { vocabulary: [...] } and direct array
      const vocabularyArray = Array.isArray(parsed) 
        ? parsed 
        : parsed.vocabulary || parsed.items || [];

      return vocabularyArray.map((item: any) => ({
        originalText: item.originalText || item.original || item.word,
        translation: item.translation || item.english,
        context: item.context || item.example,
      }));
    } catch (error) {
      console.error('Failed to parse vocabulary:', error);
      throw new HttpException(
        'Failed to parse vocabulary from text',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Translate text to English using OpenAI
   */
  private async translateText(text: string, apiKey: string): Promise<string> {
    const response = await this.openAIService.createChatCompletion(
      apiKey,
      [
        {
          role: 'system',
          content: 'You are a translation assistant. Translate the given text to English. Return only the translation, no explanations.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      {
        temperature: 0.3,
      }
    );

    return response.choices[0]?.message?.content?.trim() || text;
  }
}
```

### 3. Vocabulary Controller

**Location**: `packages/api/src/vocabulary/vocabulary.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { VocabularyService } from './vocabulary.service';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';

export interface ExtractVocabularyDto {
  messageId: number;
  originalText: string;
  translation?: string;
}

export interface SaveVocabularyDto {
  items: Array<{
    originalText: string;
    translation: string;
    context?: string;
    sourceMessageId?: number;
  }>;
}

export interface UpdateVocabularyDto {
  originalText?: string;
  translation?: string;
  context?: string;
}

@Controller('api/vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  /**
   * Extract vocabulary from a message
   * POST /api/vocabulary/extract
   */
  @Post('extract')
  async extractVocabulary(
    @Body() body: ExtractVocabularyDto,
    @User() user: AuthenticatedUser
  ) {
    const pairs = await this.vocabularyService.extractVocabulary(
      body.messageId,
      user.id,
      body.originalText,
      body.translation
    );
    return { pairs };
  }

  /**
   * Save vocabulary pairs
   * POST /api/vocabulary
   */
  @Post()
  async saveVocabulary(
    @Body() body: SaveVocabularyDto,
    @User() user: AuthenticatedUser
  ) {
    const result = await this.vocabularyService.saveVocabulary(
      user.id,
      body.items
    );
    return result;
  }

  /**
   * Get paginated vocabulary list
   * GET /api/vocabulary?page=1&limit=20
   */
  @Get()
  async getVocabularyList(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @User() user: AuthenticatedUser
  ) {
    return this.vocabularyService.getVocabularyList(user.id, page, limit);
  }

  /**
   * Get all vocabulary for flashcard study (no pagination, random order)
   * GET /api/vocabulary/flashcards
   */
  @Get('flashcards')
  async getFlashcards(@User() user: AuthenticatedUser) {
    // Get all vocabulary for the user in random order
    const result = await this.vocabularyService.getVocabularyList(user.id, 1, 10000);
    // Shuffle the items
    const shuffled = [...result.items].sort(() => Math.random() - 0.5);
    return { items: shuffled };
  }

  /**
   * Update a vocabulary item
   * PUT /api/vocabulary/:id
   */
  @Put(':id')
  async updateVocabulary(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateVocabularyDto,
    @User() user: AuthenticatedUser
  ) {
    return this.vocabularyService.updateVocabulary(id, user.id, body);
  }

  /**
   * Delete a vocabulary item
   * DELETE /api/vocabulary/:id
   */
  @Delete(':id')
  async deleteVocabulary(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser
  ) {
    await this.vocabularyService.deleteVocabulary(id, user.id);
    return { success: true };
  }
}
```

### 4. Vocabulary Module

**Location**: `packages/api/src/vocabulary/vocabulary.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';
import { VocabularyRepository } from './vocabulary.repository';
import { MessageTranslationModule } from '../message-translation/message-translation.module';
import { MessageModule } from '../message/message.module';
import { SessionModule } from '../session/session.module';
import { ApiCredentialsModule } from '../api-credentials/api-credentials.module';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [
    MessageTranslationModule,
    MessageModule,
    SessionModule,
    ApiCredentialsModule,
    OpenAIModule,
  ],
  controllers: [VocabularyController],
  providers: [VocabularyService, VocabularyRepository],
  exports: [VocabularyService, VocabularyRepository],
})
export class VocabularyModule {}
```

### 5. Update App Module

**Location**: `packages/api/src/app.module.ts`

Add `VocabularyModule` to imports array.

### 6. Update Message Translation Service

**Location**: `packages/api/src/message-translation/message-translation.service.ts`

Add method to get existing translation:

```typescript
async getTranslationForMessage(messageId: number): Promise<string | null> {
  const translation = await this.translationRepository.findByMessageId(messageId);
  return translation?.translation || null;
}
```

### 7. Automatic Translation Generation for Assistant Responses

**Location**: `packages/api/src/chat/chat.service.ts`

Update the `sendMessage` method to automatically generate and store translations for assistant responses:

```typescript
// After receiving assistant response
if (assistantMessage && assistantMessage.role === 'assistant') {
  // Automatically translate assistant responses
  try {
    const apiKey = await this.apiCredentialsService.getApiKey(userId, 'openai');
    if (apiKey) {
      // Generate translation asynchronously (don't block response)
      this.translationService
        .translateMessage(assistantMessage.id, userId)
        .catch((error) => {
          console.error('Failed to auto-translate assistant message:', error);
          // Non-critical, continue without translation
        });
    }
  } catch (error) {
    // Silently fail - translation is optional
    console.error('Auto-translation setup failed:', error);
  }
}
```

**Note**: This should be done asynchronously to not delay the chat response. Consider using a background job queue for production.

---

## Frontend Implementation

### 1. Vocabulary Service

**Location**: `packages/client/src/services/vocabulary.service.ts`

```typescript
import { apiManager } from './api-manager.js';

export interface VocabularyPair {
  originalText: string;
  translation: string;
  context?: string;
}

export interface VocabularyItem {
  id: number;
  userId: string;
  originalText: string;
  translation: string;
  context?: string;
  sourceMessageId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyListResponse {
  items: VocabularyItem[];
  total: number;
  page: number;
  totalPages: number;
}

export class VocabularyService {
  /**
   * Extract vocabulary from a message
   */
  static async extractVocabulary(
    messageId: number,
    originalText: string,
    translation?: string
  ): Promise<VocabularyPair[]> {
    const response = await apiManager.post<{ pairs: VocabularyPair[] }>(
      '/api/vocabulary/extract',
      {
        messageId,
        originalText,
        translation,
      }
    );
    return response.pairs;
  }

  /**
   * Save vocabulary pairs
   */
  static async saveVocabulary(
    items: Array<{
      originalText: string;
      translation: string;
      context?: string;
      sourceMessageId?: number;
    }>
  ): Promise<{ saved: number; skipped: number }> {
    return apiManager.post<{ saved: number; skipped: number }>(
      '/api/vocabulary',
      { items }
    );
  }

  /**
   * Get paginated vocabulary list
   */
  static async getVocabularyList(
    page: number = 1,
    limit: number = 20
  ): Promise<VocabularyListResponse> {
    return apiManager.get<VocabularyListResponse>(
      `/api/vocabulary?page=${page}&limit=${limit}`
    );
  }

  /**
   * Get all vocabulary for flashcards (shuffled)
   */
  static async getFlashcards(): Promise<VocabularyItem[]> {
    const response = await apiManager.get<{ items: VocabularyItem[] }>(
      '/api/vocabulary/flashcards'
    );
    return response.items;
  }

  /**
   * Update a vocabulary item
   */
  static async updateVocabulary(
    id: number,
    data: {
      originalText?: string;
      translation?: string;
      context?: string;
    }
  ): Promise<VocabularyItem> {
    return apiManager.put<VocabularyItem>(`/api/vocabulary/${id}`, data);
  }

  /**
   * Delete a vocabulary item
   */
  static async deleteVocabulary(id: number): Promise<void> {
    await apiManager.delete(`/api/vocabulary/${id}`);
  }
}
```

### 2. Add Vocabulary Icon

**Location**: `packages/client/src/components/ui/Icons.tsx`

```typescript
export function IconVocabulary({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

export function IconBook({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}
```

### 3. Vocabulary Extraction Button in MessageBubble

**Location**: `packages/client/src/components/chat/MessageBubble.tsx`

Add vocabulary extraction button next to translation button:

```typescript
import { IconVocabulary } from '../ui/Icons';
import { VocabularyService, VocabularyPair } from '../../services/vocabulary.service';
import VocabularyReviewModal from './VocabularyReviewModal';

// Add state for vocabulary extraction
const [isExtractingVocabulary, setIsExtractingVocabulary] = useState(false);
const [showVocabularyModal, setShowVocabularyModal] = useState(false);
const [vocabularyPairs, setVocabularyPairs] = useState<VocabularyPair[]>([]);

const handleExtractVocabulary = async (e?: React.MouseEvent) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  if (!messageId) return;

  setIsExtractingVocabulary(true);
  try {
    const pairs = await VocabularyService.extractVocabulary(
      messageId,
      message.content,
      translation // Use existing translation if available
    );
    setVocabularyPairs(pairs);
    setShowVocabularyModal(true);
  } catch (error) {
    console.error('Vocabulary extraction failed:', error);
    // Show error toast
  } finally {
    setIsExtractingVocabulary(false);
  }
};

// In the action buttons container, add:
<button
  onClick={handleExtractVocabulary}
  disabled={isExtractingVocabulary || !messageId}
  className="p-1 rounded hover:bg-black hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed"
  title="Extract vocabulary"
>
  {isExtractingVocabulary ? (
    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
  ) : (
    <IconVocabulary
      className={`w-3.5 h-3.5 ${
        message.role === 'user'
          ? 'text-message-user-text'
          : 'text-message-assistant-text'
      }`}
    />
  )}
</button>

// Add modal at the end of component:
<VocabularyReviewModal
  isOpen={showVocabularyModal}
  onClose={() => setShowVocabularyModal(false)}
  pairs={vocabularyPairs}
  messageId={messageId}
/>
```

### 4. Vocabulary Review Modal

**Location**: `packages/client/src/components/chat/VocabularyReviewModal.tsx`

```typescript
import { useState } from 'react';
import { IconClose, IconTrash } from '../ui/Icons';
import { VocabularyService, VocabularyPair } from '../../services/vocabulary.service';
import { useToast } from '../../contexts/ToastContext';

interface VocabularyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairs: VocabularyPair[];
  messageId?: number;
}

export default function VocabularyReviewModal({
  isOpen,
  onClose,
  pairs: initialPairs,
  messageId,
}: VocabularyReviewModalProps) {
  const [pairs, setPairs] = useState<VocabularyPair[]>(initialPairs);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleDelete = (index: number) => {
    setPairs(pairs.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (pairs.length === 0) {
      showToast('No vocabulary items to save', 'error');
      return;
    }

    setSaving(true);
    try {
      const result = await VocabularyService.saveVocabulary(
        pairs.map((pair) => ({
          ...pair,
          sourceMessageId: messageId,
        }))
      );
      
      showToast(
        `Saved ${result.saved} vocabulary item${result.saved !== 1 ? 's' : ''}${
          result.skipped > 0 ? `, ${result.skipped} duplicate${result.skipped !== 1 ? 's' : ''} skipped` : ''
        }`,
        'success'
      );
      onClose();
    } catch (error) {
      console.error('Failed to save vocabulary:', error);
      showToast('Failed to save vocabulary', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border w-full max-w-2xl max-h-[90vh] flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-secondary">
            Review Vocabulary ({pairs.length} items)
          </h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          {pairs.length === 0 ? (
            <p className="text-text-tertiary text-center py-8">
              No vocabulary items to review
            </p>
          ) : (
            <div className="space-y-3">
              {pairs.map((pair, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-4 bg-background-secondary"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2">
                        <div className="text-xs font-semibold text-text-tertiary uppercase mb-1">
                          Original
                        </div>
                        <div className="text-sm text-text-primary font-medium">
                          {pair.originalText}
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="text-xs font-semibold text-text-tertiary uppercase mb-1">
                          Translation
                        </div>
                        <div className="text-sm text-text-secondary">
                          {pair.translation}
                        </div>
                      </div>
                      {pair.context && (
                        <div>
                          <div className="text-xs font-semibold text-text-tertiary uppercase mb-1">
                            Context
                          </div>
                          <div className="text-xs text-text-tertiary italic">
                            {pair.context}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-2 text-text-tertiary hover:text-red-600 transition-colors"
                      title="Remove"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="h-8 px-4 bg-background-tertiary text-text-primary border border-border rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-background-secondary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || pairs.length === 0}
            className="h-8 px-4 bg-primary text-text-inverse border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : `Save ${pairs.length} Item${pairs.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 5. Flashcard Component

**Location**: `packages/client/src/components/vocabulary/Flashcard.tsx`

```typescript
import { useState, useEffect } from 'react';
import { VocabularyItem } from '../../services/vocabulary.service';
import { IconChevronDown } from '../ui/Icons';

interface FlashcardProps {
  item: VocabularyItem;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function Flashcard({
  item,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showContext, setShowContext] = useState(false);

  useEffect(() => {
    // Reset flip state when item changes
    setIsFlipped(false);
    setShowContext(false);
  }, [item.id]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div
        className="w-full max-w-2xl perspective-1000"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full h-96 cursor-pointer"
          onClick={handleFlip}
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front side - Original text */}
          <div
            className="absolute inset-0 backface-hidden rounded-lg border border-border bg-background-secondary flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-sm font-semibold text-text-tertiary uppercase mb-4">
              Original
            </div>
            <div className="text-3xl font-bold text-text-primary text-center mb-4">
              {item.originalText}
            </div>
            {item.context && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowContext(!showContext);
                }}
                className="text-xs text-text-tertiary hover:text-text-primary transition-colors flex items-center gap-1"
              >
                <IconChevronDown
                  className={`w-3 h-3 transition-transform ${
                    showContext ? 'rotate-180' : ''
                  }`}
                />
                {showContext ? 'Hide' : 'Show'} Context
              </button>
            )}
            {showContext && item.context && (
              <div className="mt-4 text-sm text-text-tertiary italic text-center max-w-md">
                {item.context}
              </div>
            )}
            <div className="mt-8 text-xs text-text-tertiary">
              Click to flip
            </div>
          </div>

          {/* Back side - Translation */}
          <div
            className="absolute inset-0 backface-hidden rounded-lg border border-border bg-primary flex flex-col items-center justify-center p-8"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-sm font-semibold text-text-inverse opacity-80 uppercase mb-4">
              Translation
            </div>
            <div className="text-3xl font-bold text-text-inverse text-center">
              {item.translation}
            </div>
            <div className="mt-8 text-xs text-text-inverse opacity-80">
              Click to flip
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="h-10 px-6 bg-background-tertiary text-text-primary border border-border rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="h-10 px-6 bg-primary text-text-inverse border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### 6. Vocabulary Study Page

**Location**: `packages/client/src/components/vocabulary/VocabularyStudy.tsx`

```typescript
import { useState, useEffect } from 'react';
import { VocabularyService, VocabularyItem } from '../../services/vocabulary.service';
import Flashcard from './Flashcard';
import { Skeleton } from '../ui/Skeleton';
import { useToast } from '../../contexts/ToastContext';

export default function VocabularyStudy() {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    setLoading(true);
    try {
      const items = await VocabularyService.getFlashcards();
      setVocabulary(items);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to load vocabulary:', error);
      showToast('Failed to load vocabulary', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  if (vocabulary.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-lg font-semibold text-text-secondary mb-2">
            No vocabulary yet
          </div>
          <div className="text-sm text-text-tertiary">
            Extract vocabulary from chat messages to start studying
          </div>
        </div>
      </div>
    );
  }

  const currentItem = vocabulary[currentIndex];
  const hasNext = currentIndex < vocabulary.length - 1;
  const hasPrevious = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text-primary">Vocabulary Study</h1>
          <div className="text-sm text-text-tertiary">
            {currentIndex + 1} / {vocabulary.length}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <Flashcard
          item={currentItem}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
        />
      </div>
    </div>
  );
}
```

### 7. Vocabulary Management Page

**Location**: `packages/client/src/components/vocabulary/VocabularyManagement.tsx`

```typescript
import { useState, useEffect } from 'react';
import { VocabularyService, VocabularyItem } from '../../services/vocabulary.service';
import { IconTrash, IconPencil } from '../ui/Icons';
import { Skeleton } from '../ui/Skeleton';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';

export default function VocabularyManagement() {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    originalText: string;
    translation: string;
    context: string;
  } | null>(null);
  const { showToast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    loadVocabulary();
  }, [page]);

  const loadVocabulary = async () => {
    setLoading(true);
    try {
      const result = await VocabularyService.getVocabularyList(page, 20);
      setVocabulary(result.items);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Failed to load vocabulary:', error);
      showToast('Failed to load vocabulary', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: 'Delete Vocabulary',
      message: 'Are you sure you want to delete this vocabulary item?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
    });

    if (!confirmed) return;

    try {
      await VocabularyService.deleteVocabulary(id);
      showToast('Vocabulary deleted', 'success');
      loadVocabulary();
    } catch (error) {
      console.error('Failed to delete vocabulary:', error);
      showToast('Failed to delete vocabulary', 'error');
    }
  };

  const handleEdit = (item: VocabularyItem) => {
    setEditingId(item.id);
    setEditForm({
      originalText: item.originalText,
      translation: item.translation,
      context: item.context || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm) return;

    try {
      await VocabularyService.updateVocabulary(editingId, editForm);
      showToast('Vocabulary updated', 'success');
      setEditingId(null);
      setEditForm(null);
      loadVocabulary();
    } catch (error) {
      console.error('Failed to update vocabulary:', error);
      showToast('Failed to update vocabulary', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  if (loading && vocabulary.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-xl font-semibold text-text-primary">Vocabulary Management</h1>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {vocabulary.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-lg font-semibold text-text-secondary mb-2">
              No vocabulary yet
            </div>
            <div className="text-sm text-text-tertiary">
              Extract vocabulary from chat messages to get started
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {vocabulary.map((item) => (
              <div
                key={item.id}
                className="border border-border rounded-lg p-4 bg-background-secondary"
              >
                {editingId === item.id && editForm ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-tertiary uppercase mb-1">
                        Original
                      </label>
                      <input
                        type="text"
                        value={editForm.originalText}
                        onChange={(e) =>
                          setEditForm({ ...editForm, originalText: e.target.value })
                        }
                        className="w-full h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-tertiary uppercase mb-1">
                        Translation
                      </label>
                      <input
                        type="text"
                        value={editForm.translation}
                        onChange={(e) =>
                          setEditForm({ ...editForm, translation: e.target.value })
                        }
                        className="w-full h-8 px-3 border border-border-input rounded-md text-sm text-text-primary bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-tertiary uppercase mb-1">
                        Context (optional)
                      </label>
                      <textarea
                        value={editForm.context}
                        onChange={(e) =>
                          setEditForm({ ...editForm, context: e.target.value })
                        }
                        className="w-full min-h-[60px] px-3 py-2 border border-border-input rounded-md text-sm text-text-primary bg-background"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleCancelEdit}
                        className="h-8 px-4 bg-background-tertiary text-text-primary border border-border rounded-md text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="h-8 px-4 bg-primary text-text-inverse border-none rounded-md text-sm"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2">
                        <div className="text-xs font-semibold text-text-tertiary uppercase mb-1">
                          Original
                        </div>
                        <div className="text-sm text-text-primary font-medium">
                          {item.originalText}
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="text-xs font-semibold text-text-tertiary uppercase mb-1">
                          Translation
                        </div>
                        <div className="text-sm text-text-secondary">
                          {item.translation}
                        </div>
                      </div>
                      {item.context && (
                        <div>
                          <div className="text-xs font-semibold text-text-tertiary uppercase mb-1">
                            Context
                          </div>
                          <div className="text-xs text-text-tertiary italic">
                            {item.context}
                          </div>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-text-tertiary">
                        Added {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
                        title="Edit"
                      >
                        <IconPencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-text-tertiary hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="h-8 px-4 bg-background-tertiary text-text-primary border border-border rounded-md text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <div className="text-sm text-text-tertiary">
            Page {page} of {totalPages}
          </div>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="h-8 px-4 bg-background-tertiary text-text-primary border border-border rounded-md text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
      {ConfirmDialog}
    </div>
  );
}
```

### 8. Update App.tsx - Add Routes and Menu Items

**Location**: `packages/client/src/App.tsx`

```typescript
// Add imports
import { IconVocabulary, IconBook } from './components/ui/Icons';
import VocabularyStudy from './components/vocabulary/VocabularyStudy';
import VocabularyManagement from './components/vocabulary/VocabularyManagement';

// In AppHeader component, add menu items:
<Link
  to="/vocabulary"
  className={`h-8 px-3 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
    isActiveRoute('/vocabulary')
      ? 'bg-primary text-text-inverse'
      : 'bg-background text-text-primary hover:bg-background-secondary'
  }`}
  title="Vocabulary Study"
>
  <IconVocabulary className="w-4 h-4" />
  <span className="hidden sm:inline">Vocabulary</span>
</Link>
<Link
  to="/vocabulary/manage"
  className={`h-8 px-3 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
    isActiveRoute('/vocabulary/manage')
      ? 'bg-primary text-text-inverse'
      : 'bg-background text-text-primary hover:bg-background-secondary'
  }`}
  title="Manage Vocabulary"
>
  <IconBook className="w-4 h-4" />
  <span className="hidden sm:inline">Manage</span>
</Link>

// In Routes, add:
<Route path="/vocabulary" element={<VocabularyStudy />} />
<Route path="/vocabulary/manage" element={<VocabularyManagement />} />
```

### 9. Add CSS for 3D Flip Effect

**Location**: `packages/client/src/index.css`

Add to the existing CSS:

```css
.perspective-1000 {
  perspective: 1000px;
}

.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
```

---

## Implementation Steps

### Phase 1: Database & Backend Foundation
1. ✅ Create Prisma schema for `Vocabulary` model
2. ✅ Generate and run migration
3. ✅ Create `VocabularyRepository`
4. ✅ Create `VocabularyService`
5. ✅ Create `VocabularyController`
6. ✅ Create `VocabularyModule` and add to `AppModule`
7. ✅ Update `MessageTranslationService` with `getTranslationForMessage` method

### Phase 2: Automatic Translation Generation
8. ✅ Update `ChatService` to auto-translate assistant responses (async)
9. ✅ Test automatic translation generation

### Phase 3: Frontend Services & Components
10. ✅ Create `VocabularyService` in frontend
11. ✅ Add vocabulary and book icons
12. ✅ Create `VocabularyReviewModal` component
13. ✅ Update `MessageBubble` with vocabulary extraction button
14. ✅ Create `Flashcard` component
15. ✅ Create `VocabularyStudy` page component
16. ✅ Create `VocabularyManagement` page component
17. ✅ Add routes and menu items in `App.tsx`
18. ✅ Add CSS for 3D flip effect

### Phase 4: Testing & Refinement
19. ✅ Test vocabulary extraction from messages
20. ✅ Test vocabulary review modal
21. ✅ Test flashcard study interface
22. ✅ Test vocabulary management (CRUD operations)
23. ✅ Test automatic translation generation
24. ✅ Test pagination in management view
25. ✅ Test duplicate detection

---

## API Endpoints Summary

### Backend Endpoints

1. **POST** `/api/vocabulary/extract`
   - Extract vocabulary from a message
   - Body: `{ messageId: number, originalText: string, translation?: string }`
   - Returns: `{ pairs: VocabularyPair[] }`

2. **POST** `/api/vocabulary`
   - Save vocabulary pairs
   - Body: `{ items: CreateVocabularyDto[] }`
   - Returns: `{ saved: number, skipped: number }`

3. **GET** `/api/vocabulary?page=1&limit=20`
   - Get paginated vocabulary list
   - Returns: `{ items: VocabularyItem[], total: number, page: number, totalPages: number }`

4. **GET** `/api/vocabulary/flashcards`
   - Get all vocabulary for flashcard study (shuffled)
   - Returns: `{ items: VocabularyItem[] }`

5. **PUT** `/api/vocabulary/:id`
   - Update a vocabulary item
   - Body: `{ originalText?: string, translation?: string, context?: string }`
   - Returns: `VocabularyItem`

6. **DELETE** `/api/vocabulary/:id`
   - Delete a vocabulary item
   - Returns: `{ success: true }`

---

## UI/UX Considerations

1. **Vocabulary Extraction Button**
   - Appears next to translation button on message hover
   - Shows loading spinner during extraction
   - Opens review modal with extracted pairs

2. **Vocabulary Review Modal**
   - Shows all extracted pairs with original, translation, and context
   - Allows deletion of unwanted pairs
   - Shows count of items to save
   - Displays success message with saved/skipped counts

3. **Flashcard Interface**
   - 3D flip animation on click
   - Shows original text on front, translation on back
   - Optional context display
   - Previous/Next navigation
   - Progress indicator (X / Total)

4. **Vocabulary Management**
   - Paginated list view
   - Inline editing with save/cancel
   - Delete confirmation dialog
   - Shows creation date for each item

5. **Automatic Translation**
   - Runs asynchronously for assistant responses
   - Non-blocking (doesn't delay chat response)
   - Silent failure (logs error but doesn't interrupt user)

---

## Future Enhancements

1. **Spaced Repetition Algorithm** - Implement SRS for optimal review timing
2. **Vocabulary Statistics** - Track study progress, mastery levels
3. **Export/Import** - CSV export for vocabulary lists
4. **Multiple Languages** - Support for learning languages other than English
5. **Audio Pronunciation** - Text-to-speech for vocabulary items
6. **Vocabulary Quizzes** - Multiple choice and fill-in-the-blank exercises
7. **Tagging System** - Organize vocabulary by topics/categories
8. **Search & Filter** - Search vocabulary by text, filter by date/source

---

## Notes

- **Duplicate Detection**: The system uses `(userId, originalText)` as a unique constraint to prevent duplicate vocabulary entries
- **Translation Caching**: Existing message translations are reused when extracting vocabulary
- **Error Handling**: All API calls include proper error handling and user feedback via toast notifications
- **Performance**: Vocabulary extraction uses OpenAI API, so it may take a few seconds. Consider adding progress indicators for better UX
- **Scalability**: For large vocabulary lists, consider implementing virtual scrolling in the management view








