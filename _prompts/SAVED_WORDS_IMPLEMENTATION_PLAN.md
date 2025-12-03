# Saved Words Feature - Implementation Plan

## Overview

This document outlines the implementation plan for a new feature that allows users to save words from chat messages to a database for subsequent revision. The feature includes rich tooltips, word highlighting, modal interactions, and a dedicated management page.

## Goals

1. **Persist words from chats into database** for subsequent revision
2. **Rich tooltip display** when hovering over words with translations
3. **Word highlighting** in chat messages (assistant messages only, unless user messages are explicitly translated and split into words)
4. **Word management page** for viewing and editing saved words
5. **Performance optimization** - fetch all data on session load, update cache incrementally

---

## Database Schema

### New Tables

#### `saved_words`
Stores the core word information.

```prisma
model SavedWord {
  id            Int      @id @default(autoincrement())
  userId        String   @map("user_id")
  originalWord  String   @map("original_word")
  translation   String
  pinyin        String?  // Pinyin representation for Chinese characters
  agentId       Int?     @map("agent_id") // Optional reference to agent
  sessionId     Int?     @map("session_id") // Optional reference to session
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  agent         Agent?   @relation(fields: [agentId], references: [id], onDelete: SetNull)
  session       ChatSession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)
  sentences     SavedWordSentence[]
  
  @@index([userId])
  @@index([originalWord]) // For fast word matching (case-insensitive matching via LOWER())
  @@index([userId, originalWord]) // Composite for user-specific word lookup
  @@map("saved_words")
}
```

**Key Design Decisions:**
- `agentId` and `sessionId` are nullable with `onDelete: SetNull` - words persist even if agent/session is deleted
- Index on `originalWord` for fast matching across all messages (case-insensitive matching)
- Composite index on `userId, originalWord` for user-specific lookups

#### `saved_word_sentences`
Stores multiple sentence examples for each saved word.

```prisma
model SavedWordSentence {
  id            Int       @id @default(autoincrement())
  savedWordId   Int       @map("saved_word_id")
  sentence      String    // The sentence context
  messageId     Int?      @map("message_id") // Optional reference to original message
  createdAt     DateTime  @default(now()) @map("created_at")
  savedWord     SavedWord @relation(fields: [savedWordId], references: [id], onDelete: Cascade)
  message       Message?  @relation(fields: [messageId], references: [id], onDelete: SetNull)
  
  @@index([savedWordId])
  @@map("saved_word_sentences")
}
```

**Key Design Decisions:**
- `messageId` is nullable - users can add custom sentences not from messages
- Cascade delete when word is deleted
- Multiple sentences per word for better context

### Schema Updates

#### Update `User` model
```prisma
model User {
  // ... existing fields
  savedWords SavedWord[]
}
```

#### Update `Agent` model
```prisma
model Agent {
  // ... existing fields
  savedWords SavedWord[]
}
```

#### Update `ChatSession` model
```prisma
model ChatSession {
  // ... existing fields
  savedWords SavedWord[]
}
```

#### Update `Message` model
```prisma
model Message {
  // ... existing fields
  savedWordSentences SavedWordSentence[]
}
```

---

## Backend Implementation

### 1. Database Migration

**File:** `apps/api/prisma/migrations/XXX_add_saved_words.sql`

Create migration script to:
- Create `saved_words` table
- Create `saved_word_sentences` table
- Add foreign key constraints
- Create indexes
- Add relations to existing tables

### 2. Prisma Schema Updates

**File:** `apps/api/prisma/schema.prisma`

Add the new models as defined above.

### 3. Repository Layer

#### `SavedWordRepository`

**File:** `apps/api/src/saved-word/saved-word.repository.ts`

```typescript
@Injectable()
export class SavedWordRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new saved word
  async create(data: {
    userId: string;
    originalWord: string;
    translation: string;
    pinyin?: string;
    agentId?: number;
    sessionId?: number;
    sentence?: string;
    messageId?: number;
  }): Promise<SavedWord>;

  // Find word by ID
  async findById(id: number, userId: string): Promise<SavedWord | null>;

  // Find word by original word for a user (case-insensitive)
  async findByWord(userId: string, originalWord: string): Promise<SavedWord | null>;

  // Find all words for a user
  async findAllByUserId(userId: string): Promise<SavedWord[]>;

  // Find words matching a list of original words (for session load, case-insensitive)
  async findMatchingWords(
    userId: string,
    words: string[]
  ): Promise<SavedWord[]>;

  // Update word
  async update(
    id: number,
    userId: string,
    data: {
      translation?: string;
      pinyin?: string;
    }
  ): Promise<SavedWord>;

  // Delete word
  async delete(id: number, userId: string): Promise<void>;

  // Add sentence to word
  async addSentence(
    savedWordId: number,
    sentence: string,
    messageId?: number
  ): Promise<SavedWordSentence>;

  // Remove sentence from word
  async removeSentence(sentenceId: number, savedWordId: number): Promise<void>;
}
```

### 4. Service Layer

#### `SavedWordService`

**File:** `apps/api/src/saved-word/saved-word.service.ts`

```typescript
@Injectable()
export class SavedWordService {
  constructor(
    private readonly savedWordRepository: SavedWordRepository,
    private readonly pinyinService: PinyinService // New service for pinyin conversion
  ) {}

  /**
   * Create a new saved word
   */
  async createSavedWord(
    userId: string,
    data: {
      originalWord: string;
      translation: string;
      agentId?: number;
      sessionId?: number;
      sentence?: string;
      messageId?: number;
    }
  ): Promise<SavedWordResponseDto>;

  /**
   * Get all saved words for a user
   */
  async getSavedWords(userId: string): Promise<SavedWordResponseDto[]>;

  /**
   * Get saved word by ID
   */
  async getSavedWord(id: number, userId: string): Promise<SavedWordResponseDto>;

  /**
   * Find matching saved words for a list of words
   * Used when loading a session to highlight existing saved words
   */
  async findMatchingWords(
    userId: string,
    words: string[]
  ): Promise<SavedWordResponseDto[]>;

  /**
   * Update saved word
   */
  async updateSavedWord(
    id: number,
    userId: string,
    data: {
      translation?: string;
      pinyin?: string;
    }
  ): Promise<SavedWordResponseDto>;

  /**
   * Delete saved word
   */
  async deleteSavedWord(id: number, userId: string): Promise<void>;

  /**
   * Add sentence to saved word
   */
  async addSentence(
    savedWordId: number,
    userId: string,
    sentence: string,
    messageId?: number
  ): Promise<SavedWordSentenceResponseDto>;

  /**
   * Remove sentence from saved word
   */
  async removeSentence(
    sentenceId: number,
    savedWordId: number,
    userId: string
  ): Promise<void>;
}
```

#### `PinyinService`

**File:** `apps/api/src/saved-word/pinyin.service.ts`

```typescript
@Injectable()
export class PinyinService {
  /**
   * Convert Chinese characters to pinyin with tones as letter accents
   * Uses 'pinyin-pro' library with toneType: 'symbol' option
   */
  async toPinyin(chineseText: string): Promise<string | null>;
  
  /**
   * Check if text contains Chinese characters
   */
  containsChinese(text: string): boolean;
}
```

**Implementation:**
- Use `pinyin-pro` library: `npm install pinyin-pro`
- Configure with `toneType: 'symbol'` to get tones as letter accents (e.g., "nǐ hǎo")
- Import: `import { pinyin } from 'pinyin-pro';`
- Usage: `pinyin(chineseText, { toneType: 'symbol' })`

### 5. Controller Layer

#### `SavedWordController`

**File:** `apps/api/src/saved-word/saved-word.controller.ts`

```typescript
@Controller(API_ROUTES.SAVED_WORDS.BASE)
export class SavedWordController {
  constructor(private readonly savedWordService: SavedWordService) {}

  @Post()
  async createSavedWord(
    @Body() dto: CreateSavedWordDto,
    @User() user: AuthenticatedUser
  ): Promise<SavedWordResponseDto>;

  @Get()
  async getSavedWords(
    @User() user: AuthenticatedUser
  ): Promise<SavedWordResponseDto[]>;

  @Get(':id')
  async getSavedWord(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser
  ): Promise<SavedWordResponseDto>;

  @Get('matching')
  async findMatchingWords(
    @Query('words') words: string, // Comma-separated list
    @User() user: AuthenticatedUser
  ): Promise<SavedWordResponseDto[]>;

  @Patch(':id')
  async updateSavedWord(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSavedWordDto,
    @User() user: AuthenticatedUser
  ): Promise<SavedWordResponseDto>;

  @Delete(':id')
  async deleteSavedWord(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser
  ): Promise<void>;

  @Post(':id/sentences')
  async addSentence(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddSentenceDto,
    @User() user: AuthenticatedUser
  ): Promise<SavedWordSentenceResponseDto>;

  @Delete(':id/sentences/:sentenceId')
  async removeSentence(
    @Param('id', ParseIntPipe) id: number,
    @Param('sentenceId', ParseIntPipe) sentenceId: number,
    @User() user: AuthenticatedUser
  ): Promise<void>;
}
```

### 6. DTOs

**File:** `apps/api/src/saved-word/dto/saved-word.dto.ts`

```typescript
export class CreateSavedWordDto {
  @IsString()
  @IsNotEmpty()
  originalWord: string;

  @IsString()
  @IsNotEmpty()
  translation: string;

  @IsOptional()
  @IsNumber()
  agentId?: number;

  @IsOptional()
  @IsNumber()
  sessionId?: number;

  @IsOptional()
  @IsString()
  sentence?: string;

  @IsOptional()
  @IsNumber()
  messageId?: number;
}

export class UpdateSavedWordDto {
  @IsOptional()
  @IsString()
  translation?: string;

  @IsOptional()
  @IsString()
  pinyin?: string;
}

export class AddSentenceDto {
  @IsString()
  @IsNotEmpty()
  sentence: string;

  @IsOptional()
  @IsNumber()
  messageId?: number;
}

export class SavedWordResponseDto {
  id: number;
  originalWord: string;
  translation: string;
  pinyin: string | null;
  agentId: number | null;
  sessionId: number | null;
  agentName: string | null;
  sessionName: string | null;
  sentences: SavedWordSentenceResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

export class SavedWordSentenceResponseDto {
  id: number;
  sentence: string;
  messageId: number | null;
  createdAt: Date;
}
```

### 7. API Routes Constants

**File:** `apps/api/src/common/constants/api-routes.constants.ts`

Add:
```typescript
export const API_ROUTES = {
  // ... existing routes
  SAVED_WORDS: {
    BASE: '/api/saved-words',
    MATCHING: '/api/saved-words/matching',
    BY_ID: (id: number) => `/api/saved-words/${id}`,
    SENTENCES: (id: number) => `/api/saved-words/${id}/sentences`,
    SENTENCE: (id: number, sentenceId: number) => `/api/saved-words/${id}/sentences/${sentenceId}`,
  },
};
```

### 8. Module Registration

**File:** `apps/api/src/app.module.ts`

Add `SavedWordModule` to imports.

**File:** `apps/api/src/saved-word/saved-word.module.ts`

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [SavedWordController],
  providers: [SavedWordService, SavedWordRepository, PinyinService],
  exports: [SavedWordService],
})
export class SavedWordModule {}
```

### 9. Integration with Chat Service

**File:** `apps/api/src/chat/chat.service.ts`

Modify `sendMessage` to:
- After saving assistant message, if word translations exist, extract words from `wordTranslations`
- Query saved words matching those words (case-insensitive)
- Return saved word matches in response (for frontend highlighting)
- This eliminates the need for a separate frontend query on new message

**File:** `apps/api/src/chat/dto/chat.dto.ts`

Update `SendMessageResponseDto`:
```typescript
export class SendMessageResponseDto {
  // ... existing fields
  savedWordMatches?: SavedWordMatchDto[]; // New field - included in response for immediate highlighting
}

export class SavedWordMatchDto {
  originalWord: string;
  savedWordId: number;
  translation: string;
  pinyin: string | null;
}
```

**Note:** Only assistant messages with word translations will have saved word matches. User messages are not processed unless explicitly translated and split into words (which is not currently supported).

### 10. Session Load Integration

**File:** `apps/api/src/chat/chat.service.ts` or `apps/api/src/session/session.service.ts`

When loading chat history, also:
- Extract all words from assistant messages that have word translations (from `MessageWordTranslation` table)
- Query saved words matching those words (case-insensitive)
- Return saved word matches with session data

**File:** `apps/api/src/common/dto/chat.dto.ts`

Update `ChatHistoryResponseDto`:
```typescript
export class ChatHistoryResponseDto {
  // ... existing fields
  savedWordMatches: SavedWordMatchDto[]; // All saved words that match words in this session
}
```

**Note:** Only words from assistant messages with existing word translations are matched. User messages are ignored unless they have been explicitly translated and split into words (which requires translation request).

---

## Frontend Implementation

### 1. Types

**File:** `apps/client/src/types/saved-word.types.ts`

```typescript
export interface SavedWord {
  id: number;
  originalWord: string;
  translation: string;
  pinyin: string | null;
  agentId: number | null;
  sessionId: number | null;
  agentName: string | null;
  sessionName: string | null;
  sentences: SavedWordSentence[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedWordSentence {
  id: number;
  sentence: string;
  messageId: number | null;
  createdAt: string;
}

export interface SavedWordMatch {
  originalWord: string;
  savedWordId: number;
  translation: string;
  pinyin: string | null;
}

export interface CreateSavedWordRequest {
  originalWord: string;
  translation: string;
  agentId?: number;
  sessionId?: number;
  sentence?: string;
  messageId?: number;
}

export interface UpdateSavedWordRequest {
  translation?: string;
  pinyin?: string;
}

export interface AddSentenceRequest {
  sentence: string;
  messageId?: number;
}
```

### 2. Service Layer

#### `SavedWordService`

**File:** `apps/client/src/services/saved-word/saved-word.service.ts`

```typescript
export class SavedWordService {
  /**
   * Create a new saved word
   */
  static async createSavedWord(
    data: CreateSavedWordRequest
  ): Promise<SavedWord>;

  /**
   * Get all saved words for current user
   */
  static async getSavedWords(): Promise<SavedWord[]>;

  /**
   * Get saved word by ID
   */
  static async getSavedWord(id: number): Promise<SavedWord>;

  /**
   * Find matching saved words for a list of words
   */
  static async findMatchingWords(words: string[]): Promise<SavedWordMatch[]>;

  /**
   * Update saved word
   */
  static async updateSavedWord(
    id: number,
    data: UpdateSavedWordRequest
  ): Promise<SavedWord>;

  /**
   * Delete saved word
   */
  static async deleteSavedWord(id: number): Promise<void>;

  /**
   * Add sentence to saved word
   */
  static async addSentence(
    savedWordId: number,
    data: AddSentenceRequest
  ): Promise<SavedWordSentence>;

  /**
   * Remove sentence from saved word
   */
  static async removeSentence(
    savedWordId: number,
    sentenceId: number
  ): Promise<void>;
}
```

### 3. React Query Hooks

#### Query Hooks

**File:** `apps/client/src/hooks/queries/use-saved-words.ts`

```typescript
import { SESSIONS_STALE_TIME, CHAT_HISTORY_STALE_TIME } from '../../constants/cache.constants';

export function useSavedWords() {
  return useQuery({
    queryKey: queryKeys.savedWords.all(),
    queryFn: () => SavedWordService.getSavedWords(),
    staleTime: SESSIONS_STALE_TIME, // Use constant: 5 minutes
  });
}

export function useSavedWord(id: number | null) {
  return useQuery({
    queryKey: queryKeys.savedWords.detail(id!),
    queryFn: () => SavedWordService.getSavedWord(id!),
    enabled: id !== null && id > 0,
  });
}

export function useMatchingSavedWords(words: string[]) {
  return useQuery({
    queryKey: queryKeys.savedWords.matching(words),
    queryFn: () => SavedWordService.findMatchingWords(words),
    enabled: words.length > 0,
    staleTime: CHAT_HISTORY_STALE_TIME, // Use constant: 5 minutes
  });
}
```

#### Mutation Hooks

**File:** `apps/client/src/hooks/mutations/use-saved-word-mutations.ts`

```typescript
export function useCreateSavedWord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSavedWordRequest) =>
      SavedWordService.createSavedWord(data),
    onSuccess: () => {
      // Invalidate saved words list
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.all(),
      });
      // Invalidate matching words queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.matchingPrefix(),
      });
    },
  });
}

export function useUpdateSavedWord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSavedWordRequest }) =>
      SavedWordService.updateSavedWord(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific word and list
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.all(),
      });
    },
  });
}

export function useDeleteSavedWord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => SavedWordService.deleteSavedWord(id),
    onSuccess: () => {
      // Invalidate all saved word queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.all(),
      });
    },
  });
}

export function useAddSentence() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      savedWordId,
      data,
    }: {
      savedWordId: number;
      data: AddSentenceRequest;
    }) => SavedWordService.addSentence(savedWordId, data),
    onSuccess: (_, variables) => {
      // Invalidate specific word
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.detail(variables.savedWordId),
      });
    },
  });
}

export function useRemoveSentence() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      savedWordId,
      sentenceId,
    }: {
      savedWordId: number;
      sentenceId: number;
    }) => SavedWordService.removeSentence(savedWordId, sentenceId),
    onSuccess: (_, variables) => {
      // Invalidate specific word
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedWords.detail(variables.savedWordId),
      });
    },
  });
}
```

### 4. Query Keys

**File:** `apps/client/src/hooks/queries/query-keys.ts`

Add to enum:
```typescript
enum QueryKey {
  // ... existing keys
  SAVED_WORDS = 'savedWords',
  MATCHING = 'matching',
}
```

Add to queryKeys object:
```typescript
export const queryKeys = {
  // ... existing keys
  savedWords: {
    all: () => [QueryKey.SAVED_WORDS] as const,
    details: () => [...queryKeys.savedWords.all(), QueryKey.DETAIL] as const,
    detail: (id: number) => [...queryKeys.savedWords.details(), id] as const,
    matching: (words: string[]) => [...queryKeys.savedWords.all(), QueryKey.MATCHING, words.sort().join(',')] as const,
    matchingPrefix: () => [...queryKeys.savedWords.all(), QueryKey.MATCHING] as const,
  },
};
```

### 5. Enhanced Word Tooltip Component

**File:** `apps/client/src/pages/chat/components/translation/WordTooltip/WordTooltip.tsx`

Update to show:
- Original word
- Translation (below original)
- Pinyin (if available, below translation)
- Click handler to open modal

```typescript
interface WordTooltipProps {
  translation?: string;
  pinyin?: string | null;
  originalWord: string;
  savedWordId?: number; // If word is already saved
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
  // Enhanced tooltip with formatted display
  // Add click handler
  // Show different styling if word is saved (highlighted)
}
```

### 6. Word Save/Edit Modal

**File:** `apps/client/src/pages/chat/components/saved-word/SavedWordModal/SavedWordModal.tsx`

```typescript
interface SavedWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalWord: string;
  translation: string;
  pinyin?: string | null;
  sentence?: string;
  messageId?: number;
  agentId?: number;
  sessionId?: number;
  savedWordId?: number; // If editing existing word
  existingSentences?: SavedWordSentence[]; // If editing
}

export default function SavedWordModal({
  // ... props
}: SavedWordModalProps) {
  // Form to:
  // - Show original word (read-only)
  // - Edit translation
  // - Show pinyin (read-only, already calculated if tooltip exists - pinyin comes from wordTranslations)
  // - Show current sentence context
  // - If editing: show existing sentences with delete option
  // - If editing: allow adding new sentence
  // - Save/Cancel buttons
  // - Delete word button (if editing)
}
```

**Features:**
- Pinyin is already available from wordTranslations (if tooltip exists, pinyin was already calculated)
- Show existing sentences with delete option
- Allow adding current sentence to existing word
- Handle different translation scenario (edge case)

### 7. Enhanced Word Presenter

**File:** `apps/client/src/pages/chat/components/translation/WordPresenter/WordPresenter.tsx`

Update to:
- Accept `savedWordMatches` prop (map of word -> saved word data)
- Highlight saved words differently (permanent highlight)
- Pass saved word data to `WordTooltip`
- Handle click events to open modal

```typescript
interface WordPresenterProps {
  text: string;
  wordTranslations: WordTranslation[];
  savedWordMatches?: Map<string, SavedWordMatch>; // New prop
  onWordClick?: (word: string, translation: string, savedWordId?: number) => void; // New prop
}
```

### 8. Session Load Integration

**File:** `apps/client/src/hooks/queries/use-chat.ts`

Update `useChatHistory` to:
- Extract saved word matches from response
- Store in React Query cache
- Return saved word matches

**File:** `apps/client/src/pages/chat/components/chat/ChatMessages/hooks/use-chat-messages.ts`

Update to:
- Get saved word matches from chat history
- Pass to `WordPresenter` components
- Handle word click events

### 9. Real-time Updates

**File:** `apps/client/src/pages/chat/components/chat/ChatMessages/hooks/use-chat-messages.ts`

When new message arrives:
- Saved word matches are already included in `SendMessageResponseDto` from backend
- No separate query needed - backend handles matching and returns results
- Update cache with new matches using React Query's `setQueryData`
- Re-render messages with new highlights

**Strategy:**
1. On session load: fetch all saved word matches (from backend in `ChatHistoryResponseDto`)
2. On new message: saved word matches included in response (no additional query needed)
3. Use React Query's `setQueryData` to update cache incrementally
4. Messages automatically re-render with updated highlights

**Optimization:** Backend includes saved word matches in the message response, eliminating the need for a separate frontend query. This is more efficient than a background fetch.

### 10. User Message Translation Integration

**Note:** User messages are not split into words by default. Word translations only exist for assistant messages (or user messages that have been explicitly translated and split). 

**Current Limitation:**
- User messages do not have word translations unless explicitly requested
- Saved word feature will only work on assistant messages (or user messages that have been translated and split)
- This is a limitation of the current translation system

**Future Enhancement (if needed):**
- Could modify translation prompt to always return word-level translations for all messages
- For now, feature focuses on assistant messages which already have word translations

### 11. Saved Words Management Page

**File:** `apps/client/src/pages/saved-words/SavedWords.tsx`

```typescript
export default function SavedWords() {
  const { data: savedWords, isLoading } = useSavedWords();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Configurable page size
  
  // Table showing:
  // - Original word
  // - Pinyin
  // - Translation
  // - Sentence context (first sentence or count)
  // - Agent name (with link)
  // - Session name (with link to session)
  // - Edit button
  // - Delete button
  
  // Features:
  // - Search/filter (required): Filter by original word, translation, or pinyin
  // - Sort by columns (original, translation, created date, etc.)
  // - Pagination (required): Handle large word lists efficiently
}
```

**File:** `apps/client/src/pages/saved-words/components/SavedWordsTable/SavedWordsTable.tsx`

Table component with:
- Columns: Original, Pinyin, Translation, Context, Agent, Session, Actions
- Row actions: Edit, Delete
- Links to agent/session
- Responsive design
- Search/filter input (filters by original word, translation, or pinyin)
- Pagination controls (page size selector, page navigation)
- Sortable columns (click column header to sort)

**File:** `apps/client/src/pages/saved-words/components/EditSavedWordModal/EditSavedWordModal.tsx`

Reusable edit modal (similar to save modal but for editing).

### 12. Routing

**File:** `apps/client/src/App.tsx`

Add route:
```typescript
<Route path={ROUTES.SAVED_WORDS} element={<SavedWords />} />
```

**File:** `apps/client/src/constants/routes.constants.ts`

Add:
```typescript
export const ROUTES = {
  // ... existing routes
  SAVED_WORDS: '/saved-words',
};
```

**File:** `apps/client/src/components/layout/TopNavigation/TopNavigation.tsx`

Add navigation link to saved words page.

---

## Performance Optimization

### 1. Session Load Strategy

**On session load:**
- Backend extracts all words from all messages in session
- Single query to find matching saved words: `WHERE userId = ? AND originalWord IN (...)`
- Returns all matches in one response
- Frontend stores in React Query cache with key: `['savedWords', 'session', sessionId]`

**Benefits:**
- Single database query per session load
- No N+1 queries
- Fast word matching using indexed `originalWord` column

### 2. New Message Strategy

**On new message:**
- Backend includes saved word matches in `SendMessageResponseDto`
- No separate frontend query needed - matches are in the response
- Use `setQueryData` to update cache incrementally with new matches
- Messages re-render with new highlights immediately

**Cache Key Strategy:**
- Session-level cache: `['savedWords', 'session', sessionId]` - all words for session
- Update session cache when new message arrives with matches
- No need for separate matching query - backend handles it

**Benefits:**
- Single response includes message + saved word matches
- No additional network request
- Immediate highlighting without waiting for background fetch

### 3. Word Matching Algorithm

**Backend:**
- Use SQL `IN` clause with `LOWER()` for case-insensitive matching
- Index on `originalWord` ensures fast lookups
- Case-insensitive matching: `WHERE LOWER(originalWord) IN (LOWER(...), ...)`
- Store original casing in database, but match case-insensitively

**Frontend:**
- Build Map<string, SavedWordMatch> for O(1) lookups (use lowercase key for matching)
- Sort words by length (longest first) for greedy matching (already done in WordPresenter)
- Match case-insensitively but preserve original display casing

### 4. React Query Cache Management

**Cache Invalidation:**
- When word is saved: invalidate matching queries
- When word is updated: invalidate specific word + list
- When word is deleted: invalidate all queries
- Use `queryClient.setQueryData` for optimistic updates

**Cache Keys:**
```typescript
['savedWords'] // All words
['savedWords', 'detail', id] // Specific word
['savedWords', 'matching', words] // Matching words
['savedWords', 'session', sessionId] // Session words
```

---

## Edge Cases & Unanswered Questions

### 1. Different Translations for Same Word

**Scenario:** User saves word "你好" with translation "Hello". Later, same word appears with translation "Hi there".

**Solution:**
- Modal shows both translations
- User can choose to:
  - Update existing translation
  - Save as new word (if different meaning)
  - Keep existing translation

**Implementation:**
- Modal detects if word already saved
- Shows current translation vs. existing translation
- Provides options to update or keep separate

### 2. Word Matching Across Languages

**Question:** Should word matching be exact or fuzzy?

**Decision:** Exact matching for now (can be enhanced later with fuzzy matching).

**Rationale:**
- Simpler implementation
- More predictable behavior
- Can add fuzzy matching as enhancement

### 3. Deleted Agent/Session

**Scenario:** User saves word from Agent A, Session 1. Later deletes Agent A or Session 1.

**Solution:**
- Words persist (using `onDelete: SetNull`)
- `agentId` and `sessionId` become null
- Management page shows "N/A" for deleted agent/session
- Words remain searchable and usable

### 4. Multiple Sentences

**Scenario:** User clicks same word in different messages, wants to add multiple sentences.

**Solution:**
- Modal shows existing sentences
- "Add current sentence" button adds new sentence
- Each sentence can be deleted individually
- Sentences are ordered by creation date

### 5. Word Highlighting in Markdown

**Scenario:** Word appears inside markdown code block or link.

**Solution:**
- Only highlight words in text nodes (not in code blocks, links, etc.)
- Current `WordPresenter` already handles this (only processes text nodes)

### 6. Performance with Many Saved Words

**Scenario:** User has 10,000+ saved words.

**Optimization:**
- Index on `originalWord` ensures fast lookups
- Limit session word matching to words actually in messages (only words from `MessageWordTranslation` table)
- **Pagination on management page (required)** - default 50 items per page, configurable
- **Search/filter on management page (required)** - filter by original word, translation, or pinyin
- Case-insensitive matching uses indexed column efficiently

### 7. Concurrent Edits

**Scenario:** User opens edit modal, makes changes, but word was deleted by another tab.

**Solution:**
- Optimistic updates with error handling
- Show error if word doesn't exist
- Refresh data on error

### 8. Pinyin Generation

**Question:** Should pinyin be generated on frontend or backend?

**Decision:** Backend (more reliable, consistent).

**Rationale:**
- Backend has access to better libraries
- Consistent pinyin format
- Can be cached/optimized on backend

### 9. Word Boundaries

**Scenario:** Chinese text has no spaces. How to match words?

**Solution:**
- Messages come already split into words when word translations exist
- Word splitting happens when translation is requested (via OpenAI)
- For assistant messages, word translations are stored in `MessageWordTranslation` table
- Saved words store exact character sequence from word translations
- Matching uses the same word boundaries as the original word translations
- Only assistant messages with word translations are processed (user messages are ignored unless explicitly translated)

### 10. Translation Language Detection

**Question:** Should we detect source language and only show pinyin for Chinese?

**Decision:** Yes, detect Chinese characters and only generate pinyin for Chinese.

**Implementation:**
- Use regex to detect Chinese characters: `/[\u4e00-\u9fff]/`
- Only generate pinyin if Chinese detected
- Store pinyin as nullable field

---

## Testing Strategy

### 1. Backend Tests

#### Unit Tests

**File:** `apps/api/src/saved-word/saved-word.service.spec.ts`

- Test word creation
- Test word matching
- Test word update
- Test word deletion
- Test sentence management
- Test pinyin generation
- Test edge cases (deleted agent/session)

#### Integration Tests

**File:** `apps/api/test/saved-words.e2e-spec.ts`

- Test API endpoints
- Test authentication/authorization
- Test word matching on session load
- Test word matching on new message
- Test concurrent operations

### 2. Frontend Tests

#### Unit Tests

**File:** `apps/client/src/pages/chat/components/translation/WordPresenter/WordPresenter.test.tsx`

- Test word highlighting
- Test saved word highlighting
- Test click handlers
- Test tooltip display

**File:** `apps/client/src/pages/chat/components/saved-word/SavedWordModal/SavedWordModal.test.tsx`

- Test modal display
- Test form validation
- Test save/edit flows
- Test sentence management

#### Integration Tests

**File:** `apps/client/src/pages/chat/components/chat/ChatMessages/ChatMessages.test.tsx`

- Test word highlighting in messages
- Test tooltip on hover
- Test modal on click
- Test real-time updates

### 3. E2E Tests

**File:** `apps/client/src/test/e2e/saved-words.spec.ts`

- Test saving word from chat
- Test editing word
- Test deleting word
- Test word highlighting
- Test management page
- Test navigation to session from management page

---

## Implementation Phases

### Phase 1: Database & Backend Core (Week 1)
- [ ] Create database migration
- [ ] Update Prisma schema
- [ ] Implement repository layer
- [ ] Implement service layer
- [ ] Implement controller layer
- [ ] Add API routes
- [ ] Add pinyin service
- [ ] Write backend tests

### Phase 2: Backend Integration (Week 1-2)
- [ ] Integrate with chat service (return saved word matches)
- [ ] Integrate with session load (return saved word matches)
- [ ] Update DTOs
- [ ] Write integration tests

### Phase 3: Frontend Core (Week 2)
- [ ] Create types
- [ ] Implement service layer
- [ ] Implement React Query hooks
- [ ] Update query keys
- [ ] Write frontend service tests

### Phase 4: UI Components (Week 2-3)
- [ ] Enhance WordTooltip component
- [ ] Create SavedWordModal component
- [ ] Update WordPresenter component
- [ ] Integrate with MessageBubble
- [ ] Write component tests

### Phase 5: Session Integration (Week 3)
- [ ] Update useChatHistory hook
- [ ] Update useChatMessages hook
- [ ] Implement real-time updates (use matches from backend response)
- [ ] Note: User messages not supported unless explicitly translated
- [ ] Write integration tests

### Phase 6: Management Page (Week 3-4)
- [ ] Create SavedWords page
- [ ] Create SavedWordsTable component
- [ ] Create EditSavedWordModal component
- [ ] Add routing
- [ ] Add navigation link
- [ ] Write page tests

### Phase 7: Polish & Testing (Week 4)
- [ ] Handle edge cases
- [ ] Performance optimization
- [ ] E2E tests
- [ ] Documentation
- [ ] Code review

---

## Dependencies

### Backend
- `pinyin-pro` - For pinyin generation with tones as letter accents
  ```bash
  npm install pinyin-pro
  ```
  - Configure with `toneType: 'symbol'` to get tones as letter accents
  - Example: `pinyin('你好', { toneType: 'symbol' })` returns "nǐ hǎo"

### Frontend
- No new dependencies (use existing UI components)

---

## Open Questions

1. **Word Uniqueness:** Should we prevent duplicate words per user, or allow multiple entries with different translations?
   - **Recommendation:** Allow multiple entries (different contexts/meanings)

2. **Bulk Operations:** Should we support bulk delete/export of saved words?
   - **Recommendation:** Phase 2 feature

3. **Word Statistics:** Should we track how often words appear, last seen date, etc.?
   - **Recommendation:** Phase 2 feature

4. **Export/Import:** Should users be able to export/import saved words?
   - **Recommendation:** Phase 2 feature

5. **Word Categories/Tags:** Should users be able to categorize words?
   - **Recommendation:** Phase 2 feature

6. **Spaced Repetition:** Should we integrate with spaced repetition for learning?
   - **Recommendation:** Phase 3 feature

---

## Success Metrics

- Users can save words from chat messages
- Saved words are highlighted in all messages (current and future)
- Tooltips show rich information (word, translation, pinyin)
- Management page allows viewing/editing all saved words
- Performance: Session load with 1000 messages + 500 saved words < 2s
- No unnecessary API calls (cache properly managed)

---

## Notes

- This feature builds on existing translation infrastructure
- Reuses existing `WordPresenter` and `WordTooltip` components
- Leverages React Query for efficient caching
- Follows existing code patterns and architecture
- Maintains backward compatibility (optional feature)
