# Improved Translations Feature - Product Requirements Plan (PRP)

## Overview

This document outlines the product requirements and implementation plan for an enhanced translation feature that provides word-level translations for agent responses. Unlike the current on-demand translation feature that translates entire messages, this feature will automatically analyze agent responses, split them into words, and provide contextual translations for each word that appear in tooltips on hover.

## Feature Requirements

### Core Functionality

1. **Automatic Word-Level Translation for Agent Responses**
   - When an agent (assistant) message is received, automatically analyze and split the response into words
   - Each word should be translated in the context of the sentence it appears in
   - Translations are performed automatically in the background (no user action required)
   - All translations are stored in the database for subsequent display

2. **Preserved Chat Bubble Presentation**
   - Chat bubble presentation must remain unchanged - messages display as normal text
   - No visual indication that word-level translations are available until hover
   - Message content remains readable and uncluttered

3. **Hover Tooltip Translation Display**
   - When hovering over individual words in agent responses, a tooltip appears showing the English translation
   - Tooltip should be non-intrusive and positioned appropriately
   - Tooltip should show the word's translation in context

4. **Full Message Translation Button Behavior**
   - The existing translate hover button on chat bubbles no longer needs to send a translation request for agent messages
   - For agent messages: Button only toggles display of the full message translation (already stored)
   - For user messages: Keep existing on-demand translate functionality (sends request if not cached)

5. **Data Persistence**
   - All word-level translation data must be persisted in the database
   - Response word list and their individual translations stored per message
   - Data must be available for subsequent displaying when messages are loaded

6. **Translation Target Language**
   - All translations continue to be into English (same as current implementation)

### Scope Limitations

- **Agent Responses Only**: This feature applies only to messages with `role === MessageRole.ASSISTANT`
- **User Messages**: User messages retain the existing on-demand translation functionality
- **Backward Compatibility**: Existing full message translation functionality remains intact

---

## Type Definitions and Enums

### 1. Message Role Enum

```typescript
// File: packages/api/src/common/enums/message-role.enum.ts
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}
```

### 2. Sort Order Enum

```typescript
// File: packages/api/src/common/enums/sort-order.enum.ts
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}
```

---

## Database Schema Changes

### 1. Add Word Translation Table

Create a new `MessageWordTranslation` table to store word-level translations:

```prisma
model MessageWordTranslation {
  id          Int      @id @default(autoincrement())
  messageId   Int      @map("message_id")
  originalWord String  @map("original_word") // The word/token as it appears in the message
  translation  String  // The English translation of the word in context
  sentenceContext String? @map("sentence_context") // The sentence the word appears in (populated from message)
  createdAt   DateTime @default(now()) @map("created_at")
  message     Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@index([messageId])
  @@map("message_word_translations")
}
```

**Note**: `wordIndex` is removed as OpenAI will handle word/token identification. The order of words can be determined by the order they appear in the response or by matching against the original message content.

### 2. Update Message Model

Add optional relation to word translations:

```prisma
model Message {
  // ... existing fields
  translation MessageTranslation?
  wordTranslations MessageWordTranslation[] // Add word translations relation
}
```

### 3. Migration

Create a migration file:
- `packages/api/prisma/migrations/[timestamp]_add_message_word_translations/migration.sql`

---

## Backend Implementation

### 1. Database Layer

#### File: `packages/api/src/message-translation/message-word-translation.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SortOrder } from '../common/enums/sort-order.enum';

export interface WordTranslation {
  originalWord: string;
  translation: string;
  sentenceContext?: string;
}

@Injectable()
export class MessageWordTranslationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create word translations for a message
   */
  async createMany(
    messageId: number,
    wordTranslations: WordTranslation[],
    sentenceContexts: Map<string, string> // Map of word -> sentence
  ) {
    return this.prisma.messageWordTranslation.createMany({
      data: wordTranslations.map((wt) => ({
        messageId,
        originalWord: wt.originalWord,
        translation: wt.translation,
        sentenceContext: wt.sentenceContext || sentenceContexts.get(wt.originalWord),
      })),
    });
  }

  /**
   * Get all word translations for a message
   */
  async findByMessageId(messageId: number) {
    return this.prisma.messageWordTranslation.findMany({
      where: { messageId },
      orderBy: { id: SortOrder.ASC }, // Order by insertion order
    });
  }

  /**
   * Get word translations for multiple messages
   */
  async findByMessageIds(messageIds: number[]) {
    if (messageIds.length === 0) {
      return [];
    }
    return this.prisma.messageWordTranslation.findMany({
      where: {
        messageId: { in: messageIds },
      },
      orderBy: [
        { messageId: SortOrder.ASC },
        { id: SortOrder.ASC },
      ],
    });
  }

  /**
   * Check if word translations exist for a message
   */
  async existsForMessage(messageId: number): Promise<boolean> {
    const count = await this.prisma.messageWordTranslation.count({
      where: { messageId },
    });
    return count > 0;
  }
}
```

### 2. Word Analysis and Translation Service

#### File: `packages/api/src/message-translation/word-translation.service.ts`

```typescript
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { OpenAIService } from '../openai/openai.service';
import { MessageWordTranslationRepository, WordTranslation } from './message-word-translation.repository';

@Injectable()
export class WordTranslationService {
  constructor(
    private readonly wordTranslationRepository: MessageWordTranslationRepository,
    private readonly openaiService: OpenAIService
  ) {}

  /**
   * Analyze message and create word-level translations
   * OpenAI handles word/token splitting, especially for languages without spaces (e.g., Chinese)
   */
  async translateWordsInMessage(
    messageId: number,
    messageContent: string,
    apiKey: string
  ): Promise<void> {
    // Check if translations already exist
    const exists = await this.wordTranslationRepository.existsForMessage(messageId);
    if (exists) {
      return; // Already translated
    }

    // Split message into sentences for context (we'll use this to populate sentenceContext)
    const sentences = this.splitIntoSentences(messageContent);
    
    // Let OpenAI handle word/token splitting and translation
    const wordTranslations = await this.translateWordsWithOpenAI(
      messageContent,
      sentences,
      apiKey
    );

    // Create a map of word -> sentence for populating sentenceContext
    const wordToSentenceMap = this.createWordToSentenceMap(
      messageContent,
      sentences,
      wordTranslations
    );

    // Save to database with sentence contexts populated
    await this.wordTranslationRepository.createMany(
      messageId,
      wordTranslations,
      wordToSentenceMap
    );
  }

  /**
   * Split message into sentences for context
   */
  private splitIntoSentences(text: string): string[] {
    // Split by sentence-ending punctuation, but keep the punctuation
    // This handles various languages and punctuation marks
    return text
      .split(/([.!?。！？]+[\s\n]*)/)
      .filter(s => s.trim().length > 0);
  }

  /**
   * Create a map of words to their containing sentences
   */
  private createWordToSentenceMap(
    messageContent: string,
    sentences: string[],
    wordTranslations: WordTranslation[]
  ): Map<string, string> {
    const wordToSentence = new Map<string, string>();
    
    // For each word, find which sentence it belongs to
    wordTranslations.forEach((wt) => {
      if (!wordToSentence.has(wt.originalWord)) {
        // Find the sentence containing this word
        const containingSentence = sentences.find(sentence =>
          sentence.includes(wt.originalWord)
        );
        if (containingSentence) {
          wordToSentence.set(wt.originalWord, containingSentence.trim());
        }
      }
    });

    return wordToSentence;
  }

  /**
   * Translate words using OpenAI - let OpenAI handle word/token splitting
   */
  private async translateWordsWithOpenAI(
    messageContent: string,
    sentences: string[],
    apiKey: string
  ): Promise<WordTranslation[]> {
    const openai = this.openaiService.getClient(apiKey);

    const prompt = `You are a professional translator. Analyze the following text and translate each word/token to English, considering the sentence context.

Text to translate:
${messageContent}

For each word or token (handle languages without spaces like Chinese, Japanese, etc.), provide:
1. The original word/token as it appears in the text
2. Its English translation considering the sentence context

Return a JSON object with a "words" array where each element has:
- "originalWord": string (the word/token as it appears in the text)
- "translation": string (English translation of the word in context)

Example format:
{
  "words": [
    {
      "originalWord": "Hola",
      "translation": "Hello"
    },
    {
      "originalWord": "你好",
      "translation": "Hello"
    },
    ...
  ]
}

Return ONLY the JSON object, no additional text.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Return only valid JSON objects.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content?.trim();
      if (!response) {
        throw new HttpException(
          'Word translation failed: No response',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Parse JSON response
      let parsed: { words?: WordTranslation[] };
      try {
        parsed = JSON.parse(response);
      } catch (e) {
        throw new HttpException(
          'Word translation failed: Invalid JSON',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const translations = parsed.words || [];

      // Validate and map to our format
      return translations
        .filter((wt: any) => wt.originalWord && wt.translation)
        .map((wt: any) => ({
          originalWord: wt.originalWord,
          translation: wt.translation,
        }));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Word translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get word translations for a message
   */
  async getWordTranslationsForMessage(
    messageId: number
  ): Promise<WordTranslation[]> {
    const translations = await this.wordTranslationRepository.findByMessageId(messageId);
    return translations.map((t) => ({
      originalWord: t.originalWord,
      translation: t.translation,
      sentenceContext: t.sentenceContext ?? undefined,
    }));
  }

  /**
   * Get word translations for multiple messages
   */
  async getWordTranslationsForMessages(
    messageIds: number[]
  ): Promise<Map<number, WordTranslation[]>> {
    const translations = await this.wordTranslationRepository.findByMessageIds(messageIds);
    
    const translationMap = new Map<number, WordTranslation[]>();
    
    translations.forEach((t) => {
      if (!translationMap.has(t.messageId)) {
        translationMap.set(t.messageId, []);
      }
      translationMap.get(t.messageId)!.push({
        originalWord: t.originalWord,
        translation: t.translation,
        sentenceContext: t.sentenceContext ?? undefined,
      });
    });

    return translationMap;
  }
}
```

### 3. Update Message Translation Service

#### File: `packages/api/src/message-translation/message-translation.service.ts`

Add automatic word translation trigger for assistant messages:

```typescript
// Add to existing MessageTranslationService

constructor(
  // ... existing dependencies
  private readonly wordTranslationService: WordTranslationService,
  private readonly apiCredentialsService: ApiCredentialsService
) {}

/**
 * Automatically translate words in assistant messages
 * Called after assistant message is created
 */
async autoTranslateAssistantMessage(
  messageId: number,
  messageContent: string,
  userId: string
): Promise<void> {
  try {
    // Get user's API key
    const apiKey = await this.apiCredentialsService.getApiKey(userId, 'openai');
    if (!apiKey) {
      // Silently fail - word translations are optional
      console.warn(`Cannot auto-translate words for message ${messageId}: No API key`);
      return;
    }

    // Translate words in background (don't await - fire and forget)
    this.wordTranslationService
      .translateWordsInMessage(messageId, messageContent, apiKey)
      .catch((error) => {
        console.error(`Failed to auto-translate words for message ${messageId}:`, error);
        // Don't throw - this is a background operation
      });
  } catch (error) {
    console.error(`Error initiating word translation for message ${messageId}:`, error);
    // Don't throw - word translations are optional enhancement
  }
}
```

### 4. Update Chat Service

#### File: `packages/api/src/chat/chat.service.ts`

Trigger automatic word translation when assistant message is created:

```typescript
// In sendMessage method, after saving assistant message:

// Save assistant message to database with raw response
const assistantMessage = await this.messageRepository.create(
  session.id,
  'assistant',
  response,
  {
    model: botConfig.model,
    temperature: botConfig.temperature,
  },
  undefined,
  completion
);

// Automatically translate words in assistant message (background task)
this.messageTranslationService
  .autoTranslateAssistantMessage(
    assistantMessage.id,
    response,
    userId
  )
  .catch((error) => {
    console.error('Failed to auto-translate assistant message words:', error);
    // Non-blocking - continue even if word translation fails
  });

// ... rest of existing code
```

### 5. Update Chat History Response

#### File: `packages/api/src/chat/chat.service.ts`

Include word translations in chat history:

```typescript
// In getChatHistory method:
import { MessageRole } from '../common/enums/message-role.enum';

// Get word translations for assistant messages
const assistantMessageIds = messageRecords
  .filter((m) => m.role === MessageRole.ASSISTANT)
  .map((m) => m.id);

const wordTranslations =
  await this.wordTranslationService.getWordTranslationsForMessages(
    assistantMessageIds
  );

const messages = messageRecords.map((msg) => {
  const baseMessage = {
    role: msg.role as MessageRole,
    content: msg.content,
    rawRequest: msg.rawRequest,
    rawResponse: msg.rawResponse,
    translation: translations.get(msg.id),
  };

  // Add word translations for assistant messages
  if (msg.role === MessageRole.ASSISTANT) {
    return {
      ...baseMessage,
      wordTranslations: wordTranslations.get(msg.id) || [],
    };
  }

  return baseMessage;
});
```

### 6. Controller Endpoints

#### File: `packages/api/src/message-translation/message-translation.controller.ts`

Add endpoint to get word translations:

```typescript
@Get(':messageId/word-translations')
async getWordTranslations(
  @Param('messageId', ParseIntPipe) messageId: number,
  @User() user: AuthenticatedUser
): Promise<{ wordTranslations: WordTranslation[] }> {
  // Verify access
  const message = await this.messageRepository.findById(messageId);
  if (!message) {
    throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
  }

  const session = await this.sessionRepository.findByIdAndUserId(
    message.sessionId,
    user.id
  );
  if (!session) {
    throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
  }

  const wordTranslations =
    await this.wordTranslationService.getWordTranslationsForMessage(messageId);

  return { wordTranslations };
}
```

### 7. Module Registration

#### File: `packages/api/src/message-translation/message-translation.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MessageTranslationController } from './message-translation.controller';
import { MessageTranslationService } from './message-translation.service';
import { MessageTranslationRepository } from './message-translation.repository';
import { WordTranslationService } from './word-translation.service';
import { MessageWordTranslationRepository } from './message-word-translation.repository';
// ... other imports

@Module({
  controllers: [MessageTranslationController],
  providers: [
    MessageTranslationService,
    MessageTranslationRepository,
    WordTranslationService,
    MessageWordTranslationRepository,
    // ... other providers
  ],
  exports: [MessageTranslationService, WordTranslationService],
})
export class MessageTranslationModule {}
```

---

## Frontend Implementation

### 1. Type Definitions

#### File: `packages/client/src/types/chat.types.ts`

Update `Message` interface:

```typescript
export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface WordTranslation {
  originalWord: string;
  translation: string;
  sentenceContext?: string;
}

export interface Message {
  role: MessageRole;
  content: string;
  rawRequest?: unknown;
  rawResponse?: unknown;
  translation?: string; // Full message translation
  wordTranslations?: WordTranslation[]; // Word-level translations (assistant only)
  id?: number;
}
```

### 2. Word Translation Service

#### File: `packages/client/src/services/word-translation.service.ts`

```typescript
import { apiManager } from './api-manager.js';
import { WordTranslation } from '../types/chat.types.js';

export class WordTranslationService {
  /**
   * Get word translations for a message
   */
  static async getWordTranslations(
    messageId: number
  ): Promise<WordTranslation[]> {
    const response = await apiManager.get<{ wordTranslations: WordTranslation[] }>(
      `/api/messages/${messageId}/word-translations`
    );
    return response.wordTranslations;
  }
}
```

### 3. Word Tooltip Component

#### File: `packages/client/src/components/chat/WordTooltip.tsx`

```typescript
import { useState, useRef, useEffect } from 'react';
import { WordTranslation } from '../../types/chat.types.js';

interface WordTooltipProps {
  word: string;
  translation?: string;
  children: React.ReactNode;
}

export default function WordTooltip({
  word,
  translation,
  children,
}: WordTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const wordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (showTooltip && wordRef.current) {
      const rect = wordRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    }
  }, [showTooltip]);

  if (!translation) {
    return <>{children}</>;
  }

  return (
    <>
      <span
        ref={wordRef}
        className="cursor-help hover:underline decoration-dotted"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </span>
      {showTooltip && (
        <div
          className="fixed z-50 px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {translation}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2"
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid rgb(17, 24, 39)',
            }}
          />
        </div>
      )}
    </>
  );
}
```

### 4. Enhanced Message Content Component

#### File: `packages/client/src/components/chat/TranslatableMessageContent.tsx`

```typescript
import { WordTranslation, MessageRole } from '../../types/chat.types.js';
import WordTooltip from './WordTooltip';
import MarkdownContent from './MarkdownContent';

interface TranslatableMessageContentProps {
  content: string;
  wordTranslations?: WordTranslation[];
  role: MessageRole;
}

export default function TranslatableMessageContent({
  content,
  wordTranslations = [],
  role,
}: TranslatableMessageContentProps) {
  // If no word translations or not assistant message, render normally
  if (role !== MessageRole.ASSISTANT || wordTranslations.length === 0) {
    return <MarkdownContent content={content} />;
  }

  // Create a map of word translations by original word
  // Note: This is simplified - in practice, you may need to match by position/index
  const translationMap = new Map<string, string>();
  wordTranslations.forEach((wt) => {
    translationMap.set(wt.originalWord.toLowerCase(), wt.translation);
  });

  // Split content into words while preserving markdown structure
  // This is a simplified approach - you may need more sophisticated parsing
  // to handle markdown properly
  const words = content.split(/(\s+)/);
  
  return (
    <span className="markdown-wrapper">
      {words.map((word, index) => {
        const cleanWord = word.trim().toLowerCase();
        const translation = translationMap.get(cleanWord);
        
        if (translation && word.trim()) {
          return (
            <WordTooltip key={index} word={word} translation={translation}>
              {word}
            </WordTooltip>
          );
        }
        
        return <span key={index}>{word}</span>;
      })}
    </span>
  );
}
```

**Note**: The word matching logic above is simplified. A more robust implementation would:
- Parse markdown properly to preserve formatting
- Match words/tokens by their original appearance in the message (OpenAI returns them in order)
- Handle punctuation and word boundaries correctly
- Preserve markdown syntax (bold, italic, links, etc.)
- Handle languages without spaces (Chinese, Japanese, etc.) by matching tokens as returned by OpenAI

### 5. Update MessageBubble Component

#### File: `packages/client/src/components/chat/MessageBubble.tsx`

```typescript
// Update imports
import TranslatableMessageContent from './TranslatableMessageContent';
import { MessageRole } from '../../types/chat.types.js';

// In the component, replace MarkdownContent with TranslatableMessageContent:

<div className="markdown-wrapper">
  <TranslatableMessageContent
    content={message.content}
    wordTranslations={message.wordTranslations}
    role={message.role}
  />
</div>

// Update handleTranslate for assistant messages:
const handleTranslate = async (e?: React.MouseEvent) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  if (!messageId) return;

  // For assistant messages, if translation exists, just toggle display
  if (message.role === MessageRole.ASSISTANT && hasTranslation) {
    setShowTranslation(!showTranslation);
    return;
  }

  // For user messages or if translation doesn't exist, fetch it
  if (hasTranslation) {
    setShowTranslation(!showTranslation);
    return;
  }

  // Otherwise, fetch translation
  setIsTranslating(true);
  try {
    const translatedText = await TranslationService.translateMessage(messageId);
    setTranslation(translatedText);
    setShowTranslation(true);
    message.translation = translatedText;
  } catch (error) {
    console.error('Translation failed:', error);
  } finally {
    setIsTranslating(false);
  }
};
```

### 6. Update Chat Service

#### File: `packages/client/src/services/chat.service.ts`

Ensure word translations are included in message types when fetching chat history.

### 7. Pre-load Word Translations

#### File: `packages/client/src/hooks/useChat.ts` or `packages/client/src/contexts/ChatContext.tsx`

Word translations should be automatically included when loading chat history from the backend (already handled in backend response).

---

## API Endpoints Summary

### Backend Endpoints

1. **GET** `/api/messages/:messageId/word-translations`
   - Get word-level translations for a specific message
   - Returns: `{ wordTranslations: WordTranslation[] }`
   - Requires authentication and message access

### Frontend Service Methods

1. `WordTranslationService.getWordTranslations(messageId: number): Promise<WordTranslation[]>`

---

## Implementation Considerations

### Word Matching Strategy

The most challenging aspect is matching translated words/tokens back to their positions in the original message, especially when:
- Markdown formatting is present
- Words have punctuation attached
- Multiple instances of the same word exist
- Languages without spaces (Chinese, Japanese, etc.)

**Recommended Approach**:
1. OpenAI handles word/token splitting and returns words in order
2. Match words by their `originalWord` value as returned by OpenAI
3. Parse markdown on the frontend to extract plain text words/tokens
4. Map original words to their positions in the rendered message
5. Wrap each word/token in a tooltip-enabled component
6. Handle edge cases where the same word appears multiple times by matching sequentially

### Performance Considerations

1. **Background Processing**: Word translations are generated asynchronously after message creation
2. **Caching**: Word translations are stored in DB and loaded with chat history
3. **Lazy Loading**: Tooltips only appear on hover, reducing initial render cost
4. **Batch Operations**: Word translations for multiple messages loaded in single query

### Error Handling

1. **Silent Failures**: Word translation failures should not block message display
2. **Graceful Degradation**: If word translations fail, message displays normally
3. **User Feedback**: Consider showing a subtle indicator if word translations are processing

### Cost Optimization

1. **Model Selection**: Use `gpt-4o-mini` for word translations
   - **Pricing**: $0.15 per million input tokens, $0.60 per million output tokens
   - **Rationale**: gpt-4o-mini is currently the cheapest OpenAI model that provides reasonable translation quality. It's significantly cheaper than gpt-3.5-turbo while maintaining good performance for translation tasks.
2. **Batch Translation**: Consider batching multiple words in single API call
3. **Caching**: Never re-translate words for the same message
4. **Selective Translation**: Only translate assistant messages (as specified)

---

## Testing Considerations

### Unit Tests

1. **Sentence Splitting Logic**
   - Test sentence boundary detection for various languages
   - Test sentence-to-word mapping
   - Test markdown preservation

2. **Translation Service**
   - Test OpenAI API integration
   - Test JSON parsing and validation
   - Test error handling

3. **Repository Methods**
   - Test CRUD operations
   - Test query performance
   - Test data integrity

### Integration Tests

1. **End-to-End Translation Flow**
   - Create assistant message
   - Verify word translations are generated
   - Verify data is persisted
   - Verify translations are returned in chat history

2. **API Endpoints**
   - Test word translation endpoint
   - Test access control
   - Test error responses

### E2E Tests

1. **User Interaction**
   - Hover over words in assistant message
   - Verify tooltip appears with translation
   - Verify tooltip positioning
   - Test with markdown content

2. **Full Message Translation**
   - Click translate button on assistant message
   - Verify full translation displays (no API call)
   - Verify user message translation still works

---

## Migration Steps

1. **Database Migration**
   - Create `MessageWordTranslation` table
   - Update Prisma schema
   - Generate Prisma client
   - Run migration

2. **Backend Implementation**
   - Implement word translation repository
   - Implement word translation service
   - Update message translation service
   - Update chat service to trigger auto-translation
   - Update chat history to include word translations
   - Add API endpoint
   - Register modules

3. **Frontend Implementation**
   - Update type definitions
   - Create word translation service
   - Create word tooltip component
   - Create translatable message content component
   - Update MessageBubble component
   - Test word matching and tooltip display

4. **Testing**
   - Unit tests for all new services
   - Integration tests for API endpoints
   - E2E tests for user interactions
   - Performance testing

5. **Deployment**
   - Deploy database migration
   - Deploy backend changes
   - Deploy frontend changes
   - Monitor for errors
   - Monitor API costs

---

## Future Enhancements

1. **Improved Word Matching**
   - Better markdown parsing
   - Handle code blocks and inline code
   - Preserve formatting in tooltips

2. **Translation Quality**
   - Allow users to provide feedback on translations
   - Learn from corrections

3. **Performance Optimizations**
   - Batch word translations more efficiently
   - Cache common word translations
   - Optimize tooltip rendering

4. **Accessibility**
   - Keyboard navigation for tooltips
   - Screen reader support
   - ARIA labels

5. **Analytics**
   - Track tooltip usage
   - Monitor translation accuracy
   - Measure performance impact

---

## Token Usage Analysis

### Current Translation Implementation

**Model**: gpt-4o-mini (same as word translations)
**Usage**: On-demand full message translation
**Pricing**:
- Input: $0.15 per million tokens
- Output: $0.60 per million tokens

**Typical Request**:
- Input: ~500-2000 tokens (message + context)
- Output: ~200-800 tokens (translated message)
- **Cost per translation**: ~$0.0003 - $0.0012

### New Word-Level Translation Implementation

**Model**: gpt-4o-mini
**Usage**: Automatic word-level translation for all assistant messages
**Pricing**:
- Input: $0.15 per million tokens
- Output: $0.60 per million tokens

**Typical Request**:
- Input: ~300-1500 tokens (message content + prompt)
- Output: ~100-500 tokens (JSON with word translations)
- **Cost per translation**: ~$0.0002 - $0.0009

### Comparison and Impact

**Per Message Cost**:
- Current (on-demand): ~$0.0003 - $0.0012 per translation (only when user requests)
- New (automatic): ~$0.0002 - $0.0009 per assistant message (automatic)

**Volume Impact**:
- Current: User-initiated, typically 10-30% of messages translated
- New: Automatic for 100% of assistant messages

**Example Scenario** (100 assistant messages):
- **Current**: 20 on-demand translations = ~$0.006 - $0.024
- **New**: 100 automatic word translations = ~$0.02 - $0.09

**Monthly Estimate** (assuming 10,000 assistant messages):
- **Current**: ~2,000 translations = ~$0.60 - $2.40
- **New**: 10,000 word translations = ~$2.00 - $9.00

### Cost Optimization Strategies

1. **Background Processing**: Word translations are generated asynchronously, not blocking user experience
2. **Caching**: Never re-translate words for the same message
3. **Selective Processing**: Only translate assistant messages (not user messages)
4. **Efficient Prompting**: Optimize prompts to minimize token usage while maintaining quality
5. **Batch Processing**: Consider batching multiple messages if processing backlog occurs

### Token Usage Breakdown

**Word Translation Request**:
- System prompt: ~50 tokens
- User prompt: ~100-500 tokens (depending on message length)
- Message content: ~200-1000 tokens
- **Total Input**: ~350-1550 tokens

**Word Translation Response**:
- JSON structure: ~20-50 tokens
- Word translations: ~80-450 tokens (depends on number of words)
- **Total Output**: ~100-500 tokens

**Total per Translation**: ~450-2050 tokens
**Cost per Translation**: ~$0.0002 - $0.0009

---

## Notes

- Word translations are generated asynchronously and may not be immediately available
- The feature only applies to assistant messages (`role === MessageRole.ASSISTANT`)
- User messages retain the existing on-demand translation functionality
- Full message translations continue to work as before
- Word translations are stored per message and persist across sessions
- The implementation should gracefully handle cases where word translations fail or are unavailable
- Consider rate limiting to prevent API abuse
- Word translation is an enhancement and should not block core chat functionality
- OpenAI handles word/token splitting, which is especially important for languages without spaces (Chinese, Japanese, etc.)
- Sentence context is populated server-side from the original message, not returned by OpenAI
