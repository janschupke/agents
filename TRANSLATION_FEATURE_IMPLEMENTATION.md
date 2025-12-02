# On-Demand Translation Feature - Implementation Draft

## Overview

This document outlines the implementation plan for adding on-demand translation functionality to chat messages. Users will be able to translate any message to English with context awareness, and translations will be persisted and cached.

## Feature Requirements

1. **UI Component**: Add a hover translation icon to chat bubbles (similar to the existing loupe icon)
2. **Translation API**: Send OpenAI request to translate messages to English with conversation context
3. **Persistence**: Store translations in the database linked to messages
4. **Caching**: Show existing translations in tooltips without re-querying OpenAI
5. **Pre-loading**: Load all translations when a chat session is opened

---

## Database Schema Changes

### 1. Add Translation Table

Create a new `MessageTranslation` table to store translations:

```prisma
model MessageTranslation {
  id          Int      @id @default(autoincrement())
  messageId   Int      @map("message_id")
  translation String   // The translated text in English
  createdAt   DateTime @default(now()) @map("created_at")
  message     Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@unique([messageId]) // One translation per message
  @@index([messageId])
  @@map("message_translations")
}
```

### 2. Update Message Model

Add optional relation to translation:

```prisma
model Message {
  // ... existing fields
  translation MessageTranslation?
}
```

### 3. Migration

Create a migration file:
- `packages/api/prisma/migrations/[timestamp]_add_message_translations/migration.sql`

---

## Backend Implementation

### 1. Database Layer

#### File: `packages/api/src/message-translation/message-translation.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MessageTranslationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(messageId: number, translation: string) {
    return this.prisma.messageTranslation.create({
      data: {
        messageId,
        translation,
      },
    });
  }

  async findByMessageId(messageId: number) {
    return this.prisma.messageTranslation.findUnique({
      where: { messageId },
    });
  }

  async findByMessageIds(messageIds: number[]) {
    return this.prisma.messageTranslation.findMany({
      where: {
        messageId: { in: messageIds },
      },
    });
  }
}
```

### 2. Translation Service

#### File: `packages/api/src/message-translation/message-translation.service.ts`

```typescript
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { MessageTranslationRepository } from './message-translation.repository';
import { MessageRepository } from '../message/message.repository';
import { OpenAIService } from '../openai/openai.service';
import { UserApiCredentialRepository } from '../user-api-credential/user-api-credential.repository';

@Injectable()
export class MessageTranslationService {
  constructor(
    private readonly translationRepository: MessageTranslationRepository,
    private readonly messageRepository: MessageRepository,
    private readonly openaiService: OpenAIService,
    private readonly userApiCredentialRepository: UserApiCredentialRepository
  ) {}

  /**
   * Translate a message to English with conversation context
   */
  async translateMessage(
    messageId: number,
    userId: string
  ): Promise<{ translation: string }> {
    // Check if translation already exists
    const existing = await this.translationRepository.findByMessageId(messageId);
    if (existing) {
      return { translation: existing.translation };
    }

    // Get the message
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
    }

    // Verify user has access to this message's session
    // (Add session access check here)

    // Get conversation context (previous messages for context)
    const contextMessages = await this.getContextMessages(
      message.sessionId,
      messageId
    );

    // Get user's API key
    const apiCredential = await this.userApiCredentialRepository.findByUserId(
      userId
    );
    if (!apiCredential) {
      throw new HttpException(
        'API key not found',
        HttpStatus.UNAUTHORIZED
      );
    }

    // Call OpenAI to translate
    const translation = await this.translateWithOpenAI(
      message.content,
      contextMessages,
      apiCredential.apiKey
    );

    // Save translation
    await this.translationRepository.create(messageId, translation);

    return { translation };
  }

  /**
   * Get previous messages for context (last 5-10 messages before the target)
   */
  private async getContextMessages(
    sessionId: number,
    targetMessageId: number
  ): Promise<Array<{ role: string; content: string }>> {
    const allMessages =
      await this.messageRepository.findAllBySessionId(sessionId);
    
    // Find the target message index
    const targetIndex = allMessages.findIndex((m) => m.id === targetMessageId);
    if (targetIndex === -1) {
      return [];
    }

    // Get previous messages (up to 10, or all if less)
    const contextCount = Math.min(10, targetIndex);
    const contextMessages = allMessages.slice(
      Math.max(0, targetIndex - contextCount),
      targetIndex
    );

    return contextMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  /**
   * Translate message using OpenAI with context
   */
  private async translateWithOpenAI(
    message: string,
    context: Array<{ role: string; content: string }>,
    apiKey: string
  ): Promise<string> {
    const openai = this.openaiService.getClient(apiKey);

    // Build context string
    const contextString = context
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = contextString
      ? `Translate the following message to English. Consider the conversation context to provide an accurate translation that preserves meaning and context.

Previous conversation:
${contextString}

Message to translate:
${message}

Translation:`
      : `Translate the following message to English:
${message}

Translation:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // or use a configurable model
      messages: [
        {
          role: 'system',
          content:
            'You are a professional translator. Translate the given message to English, preserving context, tone, and meaning. Only return the translation, no additional text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
      max_tokens: 1000,
    });

    const translation = completion.choices[0]?.message?.content?.trim();
    if (!translation) {
      throw new HttpException(
        'Translation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return translation;
  }

  /**
   * Get translations for multiple messages (for pre-loading)
   */
  async getTranslationsForMessages(
    messageIds: number[]
  ): Promise<Map<number, string>> {
    const translations =
      await this.translationRepository.findByMessageIds(messageIds);
    
    const translationMap = new Map<number, string>();
    translations.forEach((t) => {
      translationMap.set(t.messageId, t.translation);
    });

    return translationMap;
  }
}
```

### 3. Controller

#### File: `packages/api/src/message-translation/message-translation.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MessageTranslationService } from './message-translation.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../auth/user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';

@Controller('api/messages')
@UseGuards(AuthGuard)
export class MessageTranslationController {
  constructor(
    private readonly translationService: MessageTranslationService
  ) {}

  @Post(':messageId/translate')
  async translateMessage(
    @Param('messageId', ParseIntPipe) messageId: number,
    @User() user: AuthenticatedUser
  ): Promise<{ translation: string }> {
    return this.translationService.translateMessage(messageId, user.id);
  }

  @Get('translations')
  async getTranslations(
    @Query('messageIds') messageIds: string, // Comma-separated IDs
    @User() user: AuthenticatedUser
  ): Promise<Record<number, string>> {
    const ids = messageIds.split(',').map((id) => parseInt(id, 10));
    const translations =
      await this.translationService.getTranslationsForMessages(ids);
    
    // Convert Map to object
    const result: Record<number, string> = {};
    translations.forEach((translation, messageId) => {
      result[messageId] = translation;
    });
    
    return result;
  }
}
```

### 4. Update Message Repository

#### File: `packages/api/src/message/message.repository.ts`

Add method to find message by ID:

```typescript
async findById(messageId: number): Promise<Message | null> {
  return this.prisma.message.findUnique({
    where: { id: messageId },
    include: {
      translation: true, // Include translation if exists
    },
  });
}
```

### 5. Update Chat Service

#### File: `packages/api/src/chat/chat.service.ts`

Update `getChatHistory` to include translations:

```typescript
async getChatHistory(
  botId: number,
  userId: string,
  sessionId?: number
): Promise<ChatHistoryResponseDto> {
  // ... existing code to get messages ...

  // Get all message IDs
  const messageIds = messageRecords.map((m) => m.id);

  // Load translations for all messages
  const translations =
    await this.messageTranslationService.getTranslationsForMessages(
      messageIds
    );

  const messages = messageRecords.map((msg) => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    rawRequest: msg.rawRequest,
    rawResponse: msg.rawResponse,
    translation: translations.get(msg.id), // Add translation
  }));

  return {
    bot: { /* ... */ },
    session: { /* ... */ },
    messages,
  };
}
```

### 6. Module Registration

#### File: `packages/api/src/message-translation/message-translation.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MessageTranslationController } from './message-translation.controller';
import { MessageTranslationService } from './message-translation.service';
import { MessageTranslationRepository } from './message-translation.repository';
import { MessageRepository } from '../message/message.repository';
import { OpenAIService } from '../openai/openai.service';
import { UserApiCredentialRepository } from '../user-api-credential/user-api-credential.repository';

@Module({
  controllers: [MessageTranslationController],
  providers: [
    MessageTranslationService,
    MessageTranslationRepository,
    MessageRepository,
    OpenAIService,
    UserApiCredentialRepository,
  ],
  exports: [MessageTranslationService],
})
export class MessageTranslationModule {}
```

Register in `app.module.ts`:

```typescript
import { MessageTranslationModule } from './message-translation/message-translation.module';

@Module({
  imports: [
    // ... existing imports
    MessageTranslationModule,
  ],
})
```

---

## Frontend Implementation

### 1. Type Definitions

#### File: `packages/client/src/types/chat.types.ts`

Update `Message` interface:

```typescript
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  rawRequest?: unknown;
  rawResponse?: unknown;
  translation?: string; // Add translation field
}
```

### 2. Translation Icon Component

#### File: `packages/client/src/components/ui/Icons.tsx`

Add translation icon:

```typescript
export function IconTranslate({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
      />
    </svg>
  );
}
```

### 3. Translation Service

#### File: `packages/client/src/services/translation.service.ts`

```typescript
import { apiManager } from './api-manager.js';
import { API_ENDPOINTS } from '../constants/api.constants.js';

export class TranslationService {
  /**
   * Translate a message to English
   */
  static async translateMessage(messageId: number): Promise<string> {
    const response = await apiManager.post<{ translation: string }>(
      `/api/messages/${messageId}/translate`,
      {}
    );
    return response.translation;
  }

  /**
   * Get translations for multiple messages
   */
  static async getTranslations(
    messageIds: number[]
  ): Promise<Record<number, string>> {
    const ids = messageIds.join(',');
    return apiManager.get<Record<number, string>>(
      `/api/messages/translations?messageIds=${ids}`
    );
  }
}
```

### 4. Update API Constants

#### File: `packages/client/src/constants/api.constants.ts`

Add translation endpoints (if needed, or use inline in service).

### 5. MessageBubble Component Updates

#### File: `packages/client/src/components/chat/MessageBubble.tsx`

```typescript
import { Message } from '../../types/chat.types.js';
import { IconSearch, IconTranslate } from '../ui/Icons';
import MarkdownContent from './MarkdownContent';
import { useState } from 'react';
import { TranslationService } from '../../services/translation.service.js';

interface MessageBubbleProps {
  message: Message;
  onShowJson: (title: string, data: unknown) => void;
  messageId?: number; // Add messageId prop
}

export default function MessageBubble({
  message,
  onShowJson,
  messageId,
}: MessageBubbleProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState<string | undefined>(
    message.translation
  );

  const hasRawData =
    message.role === 'user'
      ? message.rawRequest !== undefined
      : message.rawResponse !== undefined;

  const hasTranslation = translation !== undefined;

  const handleTranslate = async () => {
    if (!messageId) return;

    // If translation exists, just toggle display
    if (hasTranslation) {
      setShowTranslation(!showTranslation);
      return;
    }

    // Otherwise, fetch translation
    setIsTranslating(true);
    try {
      const translatedText = await TranslationService.translateMessage(
        messageId
      );
      setTranslation(translatedText);
      setShowTranslation(true);
      
      // Update message in parent (optional, for state sync)
      message.translation = translatedText;
    } catch (error) {
      console.error('Translation failed:', error);
      // Show error to user (could use a toast notification)
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className={`flex max-w-[80%] ${message.role === 'user' ? 'self-end' : 'self-start'}`}>
      <div
        className={`px-3 py-2 rounded-lg break-words text-sm relative group ${
          message.role === 'user'
            ? 'bg-message-user text-message-user-text'
            : 'bg-message-assistant text-message-assistant-text'
        }`}
      >
        <div className="pr-6 markdown-wrapper">
          <MarkdownContent content={message.content} />
        </div>

        {/* Action buttons container */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Translation button */}
          <button
            onClick={handleTranslate}
            disabled={isTranslating || !messageId}
            className="p-1 rounded hover:bg-black hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              isTranslating
                ? 'Translating...'
                : hasTranslation
                ? 'Show translation'
                : 'Click to translate'
            }
          >
            {isTranslating ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <IconTranslate
                className={`w-3.5 h-3.5 ${
                  message.role === 'user'
                    ? 'text-message-user-text'
                    : 'text-message-assistant-text'
                }`}
              />
            )}
          </button>

          {/* JSON view button */}
          {hasRawData && (
            <button
              onClick={() => {
                if (message.role === 'user') {
                  onShowJson('OpenAI Request', message.rawRequest);
                } else {
                  onShowJson('OpenAI Response', message.rawResponse);
                }
              }}
              className="p-1 rounded hover:bg-black hover:bg-opacity-10"
              title={
                message.role === 'user'
                  ? 'View request JSON'
                  : 'View response JSON'
              }
            >
              <IconSearch
                className={`w-3.5 h-3.5 ${
                  message.role === 'user'
                    ? 'text-message-user-text'
                    : 'text-message-assistant-text'
                }`}
              />
            </button>
          )}
        </div>

        {/* Translation tooltip */}
        {showTranslation && translation && (
          <div className="absolute bottom-full left-0 mb-2 w-full max-w-md p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
            <div className="font-semibold mb-1">Translation:</div>
            <div>{translation}</div>
            <button
              onClick={() => setShowTranslation(false)}
              className="absolute top-1 right-1 text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 6. Update ChatMessages Component

#### File: `packages/client/src/components/chat/ChatMessages.tsx`

Pass messageId to MessageBubble:

```typescript
// ... existing code ...

{messages.map((message, index) => {
  // Find message ID from the messages array if available
  // This assumes messages have an id field, or you need to track it differently
  const messageId = (message as any).id; // Adjust based on your data structure
  
  return (
    <MessageBubble
      key={index}
      message={message}
      messageId={messageId}
      onShowJson={onShowJson}
    />
  );
})}
```

**Note**: You may need to update the `Message` type to include `id` if it's not already included, or track message IDs separately.

### 7. Update Chat Service

#### File: `packages/client/src/services/chat.service.ts`

Update `getChatHistory` response type to include translations (already handled in type definitions).

### 8. Pre-load Translations on Session Load

#### File: `packages/client/src/contexts/ChatContext.tsx` or `packages/client/src/hooks/useChat.ts`

When loading chat history, also fetch translations:

```typescript
const loadChatHistory = useCallback(
  async (sessionId?: number, forceRefresh = false) => {
    // ... existing code to load messages ...

    try {
      const data = await ChatService.getChatHistory(botId, sessionId);
      const messagesData = data.messages || [];

      // Pre-load translations for all messages
      const messageIds = messagesData
        .map((m, idx) => (m as any).id)
        .filter((id) => id !== undefined);
      
      if (messageIds.length > 0) {
        try {
          const translations =
            await TranslationService.getTranslations(messageIds);
          
          // Merge translations into messages
          messagesData.forEach((msg) => {
            const msgId = (msg as any).id;
            if (msgId && translations[msgId]) {
              msg.translation = translations[msgId];
            }
          });
        } catch (error) {
          console.error('Failed to pre-load translations:', error);
          // Non-critical, continue without translations
        }
      }

      setMessages(messagesData);
      // ... rest of existing code ...
    } catch (error) {
      // ... error handling ...
    }
  },
  [botId, onError, getCachedSession, setCachedSession]
);
```

---

## API Endpoints Summary

### Backend Endpoints

1. **POST** `/api/messages/:messageId/translate`
   - Translates a message to English
   - Returns: `{ translation: string }`
   - Caches result in database

2. **GET** `/api/messages/translations?messageIds=1,2,3`
   - Bulk fetch translations for multiple messages
   - Returns: `{ [messageId]: translation }`
   - Used for pre-loading

### Frontend Service Methods

1. `TranslationService.translateMessage(messageId: number): Promise<string>`
2. `TranslationService.getTranslations(messageIds: number[]): Promise<Record<number, string>>`

---

## UI/UX Considerations

1. **Icon Placement**: Translation icon appears next to the JSON view icon (loupe) on hover
2. **Loading State**: Show spinner while translating
3. **Tooltip**: Display translation in a tooltip/popover above the message bubble
4. **Caching**: Once translated, subsequent clicks show cached translation immediately
5. **Error Handling**: Show user-friendly error messages if translation fails
6. **Accessibility**: Proper ARIA labels and keyboard navigation

---

## Testing Considerations

1. **Unit Tests**:
   - Translation service logic
   - Repository methods
   - Context message retrieval

2. **Integration Tests**:
   - Translation API endpoint
   - Database persistence
   - OpenAI API integration

3. **E2E Tests**:
   - Click translation icon
   - Verify tooltip appears
   - Verify caching works
   - Verify pre-loading on session load

---

## Migration Steps

1. Create database migration for `MessageTranslation` table
2. Update Prisma schema
3. Generate Prisma client
4. Implement backend services and controllers
5. Update frontend types and components
6. Test translation flow
7. Test pre-loading functionality
8. Deploy and monitor

---

## Future Enhancements

1. **Language Detection**: Auto-detect source language
2. **Multi-language Support**: Translate to languages other than English
3. **Translation History**: Track translation requests for analytics
4. **Batch Translation**: Translate entire conversations at once
5. **Translation Quality**: Allow users to provide feedback on translations
6. **Offline Support**: Cache translations for offline viewing

---

## Notes

- The translation icon should be visible on all messages, not just those with raw data
- Consider rate limiting translation requests to prevent API abuse
- Translations are stored per message, so editing a message would require re-translation
- The context window (10 messages) can be adjusted based on performance and cost considerations
- Consider using a cheaper model (like `gpt-4o-mini`) for translations to reduce costs

