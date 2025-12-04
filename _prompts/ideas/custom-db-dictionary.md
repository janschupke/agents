# Translation Improvement Implementation Plan

## Overview

This document outlines the implementation plan for improving the translation system to provide immediate, high-quality translations with lower latency and better user experience.

## Goals

1. **Immediate Translation Access**: Users can see translations instantly without waiting for API calls
2. **Lower Latency**: Eliminate heavy OpenAI requests and multiple API calls for common words
3. **High Accuracy**: Most common words have accurate translations from curated database
4. **Flexible Enhancement**: Users can request better translations for gaps or inaccuracies
5. **Multi-Language Support**: Database structure supports multiple languages with easy expansion

---

## Architecture Overview

```
┌─────────────────┐
│  OpenAI Response│
│  + Translation  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Backend         │
│ 1. Tokenize     │
│ 2. Lookup DB    │
│ 3. Persist      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Frontend        │
│ - Hover tooltips │
│ - Save words    │
│ - Manual trans. │
└─────────────────┘
```

---

## Phase 1: Database Schema

### 1.1 Common Words Dictionary Table

Create a new table to store common words across multiple languages with a translation matrix structure.

```prisma
model CommonWord {
  id            Int      @id @default(autoincrement())
  word          String   // Original word (e.g., Chinese character/word)
  language      String   // Language code (e.g., 'zh', 'ja', 'ko')
  pinyin        String?  // Pinyin for Chinese (null for other languages)
  frequency     Int?     // Word frequency rank (lower = more common)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  // Translation columns - one per target language
  // Add new columns as new languages are supported
  translationEn String?  @map("translation_en") // English translation
  translationEs String?  @map("translation_es") // Spanish translation (future)
  translationFr String?  @map("translation_fr") // French translation (future)
  // ... more languages can be added as columns
  
  // Indexes for fast lookups
  @@index([language, word]) // Fast lookup by language + word
  @@index([language, frequency]) // For ranking/ordering
  @@map("common_words")
}
```

### 1.2 Message Word Translation Updates

Update the existing `MessageWordTranslation` table to include:
- Reference to `CommonWord` (if translation came from common words DB)
- Source indicator (common_word, saved_word, openai, manual)

```prisma
model MessageWordTranslation {
  // ... existing fields ...
  
  commonWordId  Int?      @map("common_word_id")
  source        String?   // 'common_word', 'saved_word', 'openai', 'manual'
  commonWord    CommonWord? @relation(fields: [commonWordId], references: [id], onDelete: SetNull)
  
  @@index([commonWordId])
}
```

### 1.3 Migration Strategy

1. Create `CommonWord` table
2. Add `commonWordId` and `source` to `MessageWordTranslation`
3. Populate `CommonWord` table with initial data (see Phase 2)

---

## Phase 2: Data Population

### 2.1 Chinese Common Words Data Sources

#### Option 1: CC-CEDICT (Recommended)
- **Source**: https://www.mdbg.net/chinese/dictionary?page=cedict
- **Format**: Text file with tab-separated values
- **Coverage**: ~110,000+ Chinese-English word pairs
- **Structure**: 
  ```
  你好  [ni3 hao3]  /hello/hi/
  ```
- **Pros**: Most comprehensive, free, regularly updated
- **Cons**: Requires parsing, includes many uncommon words

#### Option 2: HSK Word Lists
- **Source**: Official HSK (Hanyu Shuiping Kaoshi) word lists
- **Format**: CSV/JSON available from various sources
- **Coverage**: ~5,000 words (HSK 1-6)
- **Structure**: Word, Pinyin, English translation, HSK level
- **Pros**: Curated for learners, frequency-based, high quality
- **Cons**: Limited to ~5,000 words, may need multiple sources

**Recommended Sources for HSK Lists**:
- https://github.com/littlecodersh/HSK (GitHub repository)
- https://www.hsk.academy/ (Official HSK resources)
- https://www.hsklevel.com/ (Community-maintained lists)

#### Option 3: Subtlex-CH Word Frequency
- **Source**: SUBTLEX-CH corpus (Chinese word frequency from subtitles)
- **Format**: CSV with word, frequency, pinyin
- **Coverage**: Top 10,000-50,000 most frequent words
- **Pros**: Based on real usage, frequency data included
- **Cons**: May need separate translation source

#### Option 4: Combined Approach (Recommended)
1. **Primary**: HSK 1-6 word lists (~5,000 words) - high quality, learner-focused
2. **Secondary**: Top 10,000-20,000 from CC-CEDICT by frequency
3. **Enhancement**: Add common words from SUBTLEX-CH not in HSK

### 2.2 Data Format for Import

Create a script to parse and import data. Expected input format:

**CSV Format (Recommended)**:
```csv
word,language,pinyin,translation_en,frequency
你好,zh,nǐ hǎo,hello,1
世界,zh,shì jiè,world,2
中国,zh,zhōng guó,China,3
```

**JSON Format (Alternative)**:
```json
[
  {
    "word": "你好",
    "language": "zh",
    "pinyin": "nǐ hǎo",
    "translation_en": "hello",
    "frequency": 1
  },
  {
    "word": "世界",
    "language": "zh",
    "pinyin": "shì jiè",
    "translation_en": "world",
    "frequency": 2
  }
]
```

### 2.3 Data Import Script

```typescript
// apps/api/src/common-words/scripts/import-common-words.ts

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';

interface CommonWordRow {
  word: string;
  language: string;
  pinyin?: string;
  translation_en: string;
  frequency?: number;
}

async function importCommonWords() {
  const prisma = new PrismaClient();
  
  try {
    // Read CSV file
    const csvPath = path.join(__dirname, '../../data/common-words-zh.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const records: CommonWordRow[] = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    
    console.log(`Importing ${records.length} common words...`);
    
    // Batch insert
    const batchSize = 1000;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      await prisma.commonWord.createMany({
        data: batch.map(record => ({
          word: record.word,
          language: record.language,
          pinyin: record.pinyin || null,
          translationEn: record.translation_en,
          frequency: record.frequency ? parseInt(record.frequency.toString()) : null,
        })),
        skipDuplicates: true,
      });
      
      console.log(`Imported ${Math.min(i + batchSize, records.length)}/${records.length} words`);
    }
    
    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  importCommonWords();
}

export { importCommonWords };
```

### 2.4 Data Sources Implementation

**Step 1: Download HSK Word Lists**
```bash
# Create data directory
mkdir -p apps/api/src/data

# Download HSK word lists (example - adjust URLs as needed)
# Option: Use GitHub repository or official HSK resources
```

**Step 2: Convert to Standard Format**
```typescript
// apps/api/src/common-words/scripts/convert-hsk-to-csv.ts
// Script to convert HSK data to our CSV format
```

**Step 3: Import Data**
```bash
cd apps/api
pnpm ts-node src/common-words/scripts/import-common-words.ts
```

---

## Phase 3: Backend Implementation

### 3.1 Update OpenAI Response Handling

Modify the message preparation service to request full sentence translation automatically.

**File**: `apps/api/src/chat/services/message-preparation.service.ts`

```typescript
async prepareMessagesForOpenAI(
  existingMessages: MessageForOpenAI[],
  agentConfig: AgentConfig,
  userMessage: string,
  relevantMemories: string[]
): Promise<MessageForOpenAI[]> {
  // ... existing logic ...

  // Add system message to request translation automatically
  messagesForAPI.push({
    role: MessageRole.SYSTEM,
    content: `When responding, if the message is in a language other than English, please provide a complete, natural English translation of your response at the end, formatted as JSON: {"fullTranslation": "Your complete English translation here"}. If the message is in English, do not include this JSON object.`,
  });

  // ... rest of existing logic ...
}
```

### 3.2 Common Words Repository

**File**: `apps/api/src/common-words/common-words.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommonWordsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find common word by language and word (case-insensitive)
   */
  async findByWord(language: string, word: string) {
    return this.prisma.commonWord.findFirst({
      where: {
        language,
        word: {
          equals: word,
          mode: 'insensitive',
        },
      },
    });
  }

  /**
   * Find multiple common words by language and word list
   * Returns a Map for O(1) lookups
   */
  async findManyByWords(
    language: string,
    words: string[]
  ): Promise<Map<string, any>> {
    if (words.length === 0) {
      return new Map();
    }

    const commonWords = await this.prisma.commonWord.findMany({
      where: {
        language,
        word: {
          in: words,
          mode: 'insensitive',
        },
      },
    });

    // Create a Map for fast lookups (case-insensitive key)
    const wordMap = new Map<string, any>();
    for (const cw of commonWords) {
      const lowerKey = cw.word.toLowerCase();
      if (!wordMap.has(lowerKey)) {
        wordMap.set(lowerKey, cw);
      }
    }

    return wordMap;
  }

  /**
   * Get word frequency rank
   */
  async getFrequencyRank(language: string, word: string): Promise<number | null> {
    const commonWord = await this.findByWord(language, word);
    return commonWord?.frequency || null;
  }
}
```

### 3.3 Common Words Service

**File**: `apps/api/src/common-words/common-words.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { CommonWordsRepository } from './common-words.repository';
import { PinyinService } from '../saved-word/pinyin.service';

export interface WordTranslation {
  originalWord: string;
  translation: string | null; // null if not found
  pinyin: string | null;
  source: 'common_word' | 'saved_word' | 'openai' | 'manual' | null;
  commonWordId?: number;
}

@Injectable()
export class CommonWordsService {
  private readonly logger = new Logger(CommonWordsService.name);

  constructor(
    private readonly commonWordsRepository: CommonWordsRepository,
    private readonly pinyinService: PinyinService
  ) {}

  /**
   * Get translations for words from common words database
   * Returns translations for words found in database, null for missing words
   */
  async getWordTranslations(
    words: string[],
    language: string
  ): Promise<Map<string, WordTranslation>> {
    const translations = new Map<string, WordTranslation>();

    if (words.length === 0) {
      return translations;
    }

    // Lookup words in common words database
    const commonWordsMap = await this.commonWordsRepository.findManyByWords(
      language,
      words
    );

    // Build translation map
    for (const word of words) {
      const lowerKey = word.toLowerCase();
      const commonWord = commonWordsMap.get(lowerKey);

      if (commonWord) {
        // Generate pinyin if Chinese and not already present
        let pinyin = commonWord.pinyin;
        if (language === 'zh' && !pinyin) {
          pinyin = this.pinyinService.toPinyin(word);
        }

        translations.set(lowerKey, {
          originalWord: word,
          translation: commonWord.translationEn || null,
          pinyin: pinyin,
          source: 'common_word',
          commonWordId: commonWord.id,
        });
      } else {
        // Word not found - return null translation
        // Generate pinyin for Chinese even if not in dictionary
        const pinyin = language === 'zh' ? this.pinyinService.toPinyin(word) : null;

        translations.set(lowerKey, {
          originalWord: word,
          translation: null, // Will show 🤷 in UI
          pinyin: pinyin,
          source: null,
        });
      }
    }

    return translations;
  }

  /**
   * Detect language from text
   * Simple implementation - can be enhanced
   */
  detectLanguage(text: string): string {
    // Check for Chinese characters
    if (/[\u4e00-\u9fff]/.test(text)) {
      return 'zh';
    }
    // Check for Japanese
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      return 'ja';
    }
    // Check for Korean
    if (/[\uac00-\ud7a3]/.test(text)) {
      return 'ko';
    }
    // Default to English
    return 'en';
  }
}
```

### 3.4 Update Chat Service

**File**: `apps/api/src/chat/chat.service.ts`

Update `sendMessage` method to:
1. Extract full translation from OpenAI response
2. Tokenize message on backend
3. Lookup words in common words database
4. Persist word translations immediately

```typescript
async sendMessage(
  agentId: number,
  userId: string,
  message: string,
  sessionId?: number
): Promise<SendMessageResponseDto> {
  // ... existing logic to send message to OpenAI ...

  // Parse OpenAI response for full translation
  let fullTranslation: string | null = null;
  try {
    const translationMatch = assistantMessage.content.match(
      /\{"fullTranslation":\s*"([^"]+)"\}/
    );
    if (translationMatch) {
      fullTranslation = translationMatch[1];
      // Remove translation JSON from content
      assistantMessage.content = assistantMessage.content.replace(
        /\{"fullTranslation":\s*"[^"]+"\}/,
        ''
      ).trim();
    }
  } catch (error) {
    this.logger.warn('Failed to parse full translation from response', error);
  }

  // Tokenize message on backend
  const language = this.commonWordsService.detectLanguage(assistantMessage.content);
  const words = await this.tokenizationService.tokenize(
    assistantMessage.content,
    language
  );

  // Get translations from common words database
  const wordTranslations = await this.commonWordsService.getWordTranslations(
    words,
    language
  );

  // Persist word translations immediately
  const wordTranslationRecords = Array.from(wordTranslations.values()).map(wt => ({
    messageId: assistantMessage.id,
    originalWord: wt.originalWord,
    translation: wt.translation || '', // Empty string for missing words
    sentenceContext: null, // Can be enhanced later
    commonWordId: wt.commonWordId || null,
    source: wt.source || null,
  }));

  await this.wordTranslationRepository.createMany(
    assistantMessage.id,
    wordTranslationRecords
  );

  // Save full translation if available
  if (fullTranslation) {
    await this.translationRepository.create(assistantMessage.id, fullTranslation);
  }

  // Find saved word matches for highlighting
  const savedWordMatches = await this.savedWordService.findMatchingWords(
    userId,
    words
  );

  return {
    response: assistantMessage.content,
    session: {
      id: session.id,
      session_name: session.sessionName,
    },
    rawRequest: openaiRequest,
    rawResponse: completion,
    userMessageId: userMessage.id,
    assistantMessageId: assistantMessage.id,
    translation: fullTranslation || undefined,
    wordTranslations: Array.from(wordTranslations.values()).map(wt => ({
      originalWord: wt.originalWord,
      translation: wt.translation || undefined,
      sentenceContext: undefined,
    })),
    savedWordMatches: savedWordMatches.length > 0 ? savedWordMatches : undefined,
  };
}
```

### 3.5 Manual Translation Endpoint

**File**: `apps/api/src/message-translation/message-translation.controller.ts`

Add endpoint for manual on-demand word translation:

```typescript
import { API_ROUTES } from '../common/constants/api-routes.constants';

@Post(':messageId/words/translate')
async translateWordsManually(
  @Param('messageId', ParseIntPipe) messageId: number,
  @User() user: AuthenticatedUser
): Promise<{
  wordTranslations: Array<{
    originalWord: string;
    translation: string;
    pinyin: string | null;
  }>;
}> {
  this.logger.log(`Manually translating words for message ${messageId} for user ${user.id}`);
  return this.messageTranslationService.translateWordsManually(
    messageId,
    user.id
  );
}
```

**Note**: The route path `:messageId/words/translate` matches the centralized constant `API_ROUTES.MESSAGES.TRANSLATE_WORDS(messageId)` which resolves to `api/messages/${messageId}/words/translate`. Since the controller base is `api/messages`, the decorator only needs the relative path.

**Note**: The endpoint translates ALL words in the message with context, replacing existing translations. No body parameters needed - it uses the original message content.

**File**: `apps/api/src/message-translation/message-translation.service.ts`

```typescript
async translateWordsManually(
  messageId: number,
  userId: string
): Promise<{
  wordTranslations: Array<{
    originalWord: string;
    translation: string;
    pinyin: string | null;
  }>;
}> {
  // Get message with original content
  const message = await this.messageRepository.findById(messageId);
  if (!message) {
    throw new NotFoundException(`Message ${messageId} not found`);
  }

  // Get existing word translations to get all words
  const existingTranslations =
    await this.wordTranslationRepository.findByMessageId(messageId);

  if (existingTranslations.length === 0) {
    // No words parsed yet - tokenize first
    const language = this.commonWordsService.detectLanguage(message.content);
    const words = await this.tokenizationService.tokenize(
      message.content,
      language
    );
    
    // Create empty word translation records
    await this.wordTranslationRepository.createMany(
      messageId,
      words.map(word => ({
        originalWord: word,
        translation: '',
        sentenceContext: null,
      })),
      new Map() // No sentence context map needed
    );
    
    // Re-fetch to get the records
    const newTranslations = await this.wordTranslationRepository.findByMessageId(messageId);
    existingTranslations.push(...newTranslations);
  }

  // Extract all words from existing translations
  const allWords = existingTranslations.map(wt => wt.originalWord);

  if (allWords.length === 0) {
    return { wordTranslations: [] };
  }

  // Get API key
  const apiKey = await this.apiCredentialsService.getApiKey(
    userId,
    MAGIC_STRINGS.OPENAI_PROVIDER
  );
  if (!apiKey) {
    throw new ApiKeyRequiredException();
  }

  // Force translation of ALL words by deleting existing translations first
  // This ensures we get fresh translations for all words, not just missing ones
  await this.wordTranslationRepository.deleteByMessageId(messageId);

  // Translate ALL words with OpenAI, providing original message as context
  // This ensures context-aware translations
  await this.wordTranslationService.translateWordsInMessage(
    messageId,
    message.content,
    apiKey
  );

  // Get the updated translations
  const updatedTranslations = await this.wordTranslationService.getWordTranslationsForMessage(
    messageId
  );

  // The translateWordsInMessage method already:
  // 1. Deletes existing translations
  // 2. Creates new translations with OpenAI results
  // 3. Saves full translation
  // So we just need to format the response

  // Update source to 'openai' for all words
  // (This could be done in createMany if we add source field support)

  // Get pinyin for Chinese words
  const language = this.commonWordsService.detectLanguage(message.content);
  const result = updatedTranslations.map(t => ({
    originalWord: t.originalWord,
    translation: t.translation,
    pinyin: language === 'zh' ? this.pinyinService.toPinyin(t.originalWord) : null,
  }));

  return { wordTranslations: result };
}
```

**Key Points**:
1. **No body parameters**: Endpoint automatically translates ALL words in the message
2. **Includes original message**: The `translateWordsInMessage` method uses the full message content for context-aware translation
3. **Replaces all translations**: The method deletes old translations and creates new ones from OpenAI
4. **Context-aware**: All words are translated together with the full message context, ensuring accurate translations
```

**Note**: The `translateWordsWithOpenAI` method handles:
- Tokenizing the message (if needed)
- Translating all words with context from the full message
- Returning both word translations and full sentence translation
- This ensures all words are translated together with proper context
```

**Key Changes**:
1. **No body parameters**: Endpoint translates ALL words automatically
2. **Includes original message**: Passes full message content to OpenAI for context-aware translation
3. **Replaces all translations**: Deletes old translations and creates new ones from OpenAI
4. **Context-aware**: Uses `translateWordsWithOpenAI` which includes sentence context

### 3.6 Tokenization Service

**File**: `apps/api/src/tokenization/tokenization.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import * as nodejieba from 'nodejieba';

@Injectable()
export class TokenizationService {
  /**
   * Tokenize text based on language
   */
  async tokenize(text: string, language: string): Promise<string[]> {
    switch (language) {
      case 'zh':
      case 'zh-CN':
      case 'zh-TW':
        return this.tokenizeChinese(text);
      case 'ja':
        // TODO: Implement Japanese tokenization
        return this.tokenizeBySpaces(text);
      case 'ko':
        // TODO: Implement Korean tokenization
        return this.tokenizeBySpaces(text);
      default:
        return this.tokenizeBySpaces(text);
    }
  }

  private tokenizeChinese(text: string): string[] {
    // Use nodejieba for Chinese tokenization
    return nodejieba.cut(text);
  }

  private tokenizeBySpaces(text: string): string[] {
    // Simple space-based tokenization for languages with spaces
    return text
      .split(/\s+/)
      .filter(word => word.trim().length > 0)
      .map(word => word.replace(/^[.,!?;:()\[\]{}'"]+|[.,!?;:()\[\]{}'"]+$/g, ''))
      .filter(word => word.length > 0);
  }
}
```

---

## Phase 4: Frontend Implementation

### 4.1 Update Word Tooltip

**File**: `apps/client/src/pages/chat/components/translation/WordTooltip/WordTooltip.tsx`

Update to show 🤷 for missing translations and always show pinyin for Chinese:

```typescript
interface WordTooltipProps {
  translation?: string | null; // null means not found
  pinyin?: string | null;
  originalWord: string;
  savedWordId?: number;
  onClick?: () => void;
  children: React.ReactNode;
}

export default function WordTooltip({
  translation,
  pinyin,
  originalWord,
  savedWordId,
  onClick,
  children,
}: WordTooltipProps) {
  // ... existing tooltip logic ...

  const hasTranslation = translation !== null && translation !== undefined && translation !== '';
  const displayTranslation = hasTranslation ? translation : '🤷';

  const tooltipElement = showTooltip ? (
    <div className="fixed z-50 px-3 py-2 text-xs bg-gray-900 text-white rounded shadow-lg pointer-events-none min-w-[120px]">
      <div className="font-semibold mb-1">{originalWord}</div>
      {pinyin && (
        <div className="text-gray-300 mb-1 text-[10px]">{pinyin}</div>
      )}
      <div className="text-gray-100">{displayTranslation}</div>
      {/* ... existing arrow ... */}
    </div>
  ) : null;

  // ... rest of component ...
}
```

### 4.2 Update Message Bubble

**File**: `apps/client/src/pages/chat/components/chat/ChatMessages/parts/MessageBubble.tsx`

Add button for manual translation:

```typescript
import { IconTranslate, IconRefresh } from '@openai/ui';

// Add state for manual translation
const [isTranslatingManually, setIsTranslatingManually] = useState(false);

// Add handler for manual translation
const handleManualTranslation = async () => {
  if (!messageId) return;
  
  setIsTranslatingManually(true);
  try {
    // Call API to translate ALL words with context
    // This replaces existing translations with OpenAI translations
    const result = await TranslationService.translateWordsManually(messageId);
    
    // Invalidate React Query cache to refetch updated translations
    queryClient.invalidateQueries({
      queryKey: queryKeys.messages.wordTranslations(messageId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.messages.translation(messageId),
    });
    
    // Update local state if using local state management
    // setWordTranslations(result.wordTranslations);
    
    // Show success toast
    showToast('Words translated successfully', 'success');
  } catch (error) {
    showToast('Failed to translate words', 'error');
  } finally {
    setIsTranslatingManually(false);
  }
};

// Add button in action buttons container
{hasWordTranslations && (
  <Button
    onClick={handleManualTranslation}
    disabled={isTranslatingManually || !messageId}
    variant="message-bubble"
    size="xs"
    className="p-1"
    tooltip="Translate missing words with AI"
  >
    {isTranslatingManually ? (
      <div className="animate-spin">⟳</div>
    ) : (
      <IconRefresh size="xs" />
    )}
  </Button>
)}
```

### 4.3 Update Word Presenter

**File**: `apps/client/src/pages/chat/components/translation/WordPresenter/WordPresenter.tsx`

Ensure pinyin is always shown for Chinese words, even if translation is missing:

```typescript
// In the rendering logic, always pass pinyin if available
<WordTooltip
  key={index}
  translation={part.translation || null} // null for missing
  pinyin={pinyin || undefined} // Always include pinyin if available
  originalWord={part.text}
  savedWordId={savedMatch?.savedWordId}
  onClick={onWordClick ? () => onWordClick(...) : undefined}
>
  {part.text}
</WordTooltip>
```

### 4.4 Translation Service Updates

**File**: `apps/client/src/services/translation/translation.service.ts`

Add method for manual word translation:

```typescript
import { API_ENDPOINTS } from '../../constants/api.constants';

static async translateWordsManually(
  messageId: number
): Promise<{
  wordTranslations: Array<{
    originalWord: string;
    translation: string;
    pinyin: string | null;
  }>;
}> {
  return apiManager.post(
    API_ENDPOINTS.MESSAGES.TRANSLATE_WORDS(messageId),
    {} // No body needed - translates all words automatically
  );
}
```

**File**: `apps/client/src/constants/api.constants.ts`

Add the new endpoint:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  MESSAGES: {
    // ... existing message endpoints
    TRANSLATE_WORDS: (messageId: number) => `/api/messages/${messageId}/words/translate`,
  },
};
```

---

## Phase 5: Data Population Strategy

### 5.1 Initial Data Set

**Recommended**: Start with HSK 1-6 word lists (~5,000 words)

1. **Download HSK Data**:
   - Source: https://github.com/littlecodersh/HSK or similar
   - Format: CSV or JSON with word, pinyin, translation, level

2. **Convert to Standard Format**:
   ```typescript
   // Script to convert HSK data
   // Input: HSK word list (various formats)
   // Output: common-words-zh.csv
   ```

3. **Import Script**:
   ```bash
   pnpm ts-node apps/api/src/common-words/scripts/import-common-words.ts
   ```

### 5.2 Expansion Strategy

**Phase 1 (Initial)**: HSK 1-6 (~5,000 words)
- High quality, learner-focused
- Covers most common conversational words

**Phase 2 (Expansion)**: Top 10,000 from CC-CEDICT
- Add words by frequency
- Filter out very rare words
- Maintain quality

**Phase 3 (Enhancement)**: Domain-specific words
- Technical terms
- Business vocabulary
- Based on user feedback

### 5.3 Data Maintenance

1. **Regular Updates**: Monthly or quarterly updates
2. **User Feedback**: Track words frequently requiring manual translation
3. **Quality Control**: Review and verify translations
4. **Version Control**: Track dictionary versions for rollback

---

## Phase 6: Testing Strategy

### 6.1 Unit Tests

- Common words repository lookups
- Tokenization service
- Language detection
- Pinyin generation

### 6.2 Integration Tests

- End-to-end message flow with translations
- Database lookup performance
- Manual translation endpoint
- Word saving with common words

### 6.3 Performance Tests

- Database query performance (should be <10ms for 20 words)
- Tokenization speed (should be <50ms for 500 characters)
- Memory usage with loaded dictionary

### 6.4 User Acceptance Tests

- Tooltip shows translations immediately
- Missing words show 🤷
- Manual translation button works
- Pinyin displays for Chinese words
- Saved words still highlight correctly

---

## Phase 7: Migration Plan

### 7.1 Database Migration

1. Create `CommonWord` table
2. Add columns to `MessageWordTranslation`
3. Run data import script
4. Verify data integrity

### 7.2 Code Deployment

1. Deploy backend changes (API can handle both old and new flow)
2. Deploy frontend changes (backward compatible)
3. Monitor for errors
4. Gradually enable new features

### 7.3 Rollback Plan

- Keep old translation flow as fallback
- Database changes are additive (no data loss)
- Can disable new features via feature flag

---

## Implementation Timeline

### Week 1: Database & Data
- [ ] Create database schema
- [ ] Set up data import scripts
- [ ] Source and prepare HSK word lists
- [ ] Import initial data set

### Week 2: Backend Core
- [ ] Implement common words repository
- [ ] Implement common words service
- [ ] Update chat service for automatic translation
- [ ] Implement tokenization service
- [ ] Add manual translation endpoint

### Week 3: Frontend
- [ ] Update word tooltip for missing translations
- [ ] Add pinyin support for all Chinese words
- [ ] Add manual translation button
- [ ] Update word presenter
- [ ] Test user experience

### Week 4: Testing & Polish
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Bug fixes and polish

---

## Success Metrics

1. **Latency**: <100ms for word translation lookup (database)
2. **Coverage**: >80% of common words have translations
3. **User Satisfaction**: Reduced manual translation requests
4. **Performance**: No degradation in message sending speed
5. **Accuracy**: High-quality translations for common words

---

## Future Enhancements

1. **Multi-language Support**: Add Japanese, Korean dictionaries
2. **Context-Aware Lookup**: Consider sentence context for word selection
3. **Learning System**: Track which words users manually translate to improve dictionary
4. **User Contributions**: Allow users to suggest dictionary improvements
5. **Offline Mode**: Cache dictionary for offline use (PWA)

---

## Appendix: Data Source Links

### HSK Word Lists
- https://github.com/littlecodersh/HSK
- https://www.hsk.academy/
- https://www.hsklevel.com/

### CC-CEDICT
- https://www.mdbg.net/chinese/dictionary?page=cedict
- https://github.com/leobo/cc-cedict

### SUBTLEX-CH
- https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexch

### Other Resources
- https://github.com/kfcd/chaizi (Chinese character decomposition)
- https://github.com/nieldlr/chinese-translation (Translation resources)
