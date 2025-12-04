# Translation Refactoring Plan: Initial Translation for Assistant Messages

## Overview

This document outlines the refactoring plan to implement initial translation for assistant messages while maintaining on-demand translation for user messages. The goal is to provide translations immediately in the initial response for assistant messages, eliminating the need for a separate API call when users click the translate button.

## Critical Implementation Detail: Single API Call

**IMPORTANT**: For assistant messages, translations are included in the **SINGLE initial OpenAI chat completion call**. The enhanced prompt requests translations in JSON format, and we extract them from the response. There is **NO second API call** for translations.

**Flow**:
1. Enhanced prompt in chat completion requests translations in JSON
2. OpenAI returns chat response + translations JSON in one response
3. We extract translations from the JSON
4. Translations are included in the response DTO
5. Frontend displays translations immediately (no API call needed)

**This ensures**: Only 1 API call per assistant message, not 2.

## Goals

1. **Assistant messages**: Always include full translation + word translations in initial response
2. **User messages**: Keep on-demand translation (no chat history)
3. **Clean architecture**: Separation of concerns, no conditional logic in components
4. **Configurable**: Support both approaches via configuration
5. **Backward compatible**: Existing functionality remains intact

---

## Architecture Design

### Strategy Pattern for Translation

Use a strategy pattern to separate translation logic:

```
TranslationStrategy (interface)
├── InitialTranslationStrategy (for assistant messages)
│   └── Uses conversation context
└── OnDemandTranslationStrategy (for user messages)
    └── No conversation context
```

### Service Layer Separation

```
ChatService
├── Uses TranslationStrategyFactory
│   ├── getStrategy(messageRole) -> TranslationStrategy
│   └── Strategies handle their own translation logic
└── Clean separation: ChatService doesn't know translation details
```

### Component Layer

```
MessageBubble
├── Uses TranslationDisplayHook (presentation only)
│   └── No knowledge of translation strategy
└── TranslationDisplayHook
    └── Uses TranslationService (abstraction)
        └── Handles both initial and on-demand transparently
```

---

## Backend Refactoring

### Phase 1: Create Translation Strategy Interfaces

#### 1.1 Create Translation Strategy Interface

**File**: `apps/api/src/message-translation/translation-strategy.interface.ts`

```typescript
export interface TranslationStrategy {
  /**
   * Translate a message with word-level translations
   */
  translateMessageWithWords(
    messageId: number,
    messageContent: string,
    apiKey: string,
    context?: TranslationContext
  ): Promise<{
    translation: string;
    wordTranslations: WordTranslation[];
  }>;
}

export interface TranslationContext {
  conversationHistory?: Array<{ role: string; content: string }>;
  messageRole: MessageRole;
}
```

#### 1.2 Create Initial Translation Strategy (For Fallback/On-Demand Only)

**File**: `apps/api/src/message-translation/strategies/initial-translation.strategy.ts`

**Note**: This strategy is primarily for:
1. On-demand translation requests (when user clicks translate button for old messages)
2. Fallback if initial response doesn't include translations (should be rare)

**For the initial response**: Translations come from the enhanced prompt in the chat completion (single call).

```typescript
@Injectable()
export class InitialTranslationStrategy implements TranslationStrategy {
  constructor(
    private readonly wordTranslationService: WordTranslationService,
    private readonly openaiService: OpenAIService
  ) {}

  async translateMessageWithWords(
    messageId: number,
    messageContent: string,
    apiKey: string,
    context?: TranslationContext
  ): Promise<{
    translation: string;
    wordTranslations: WordTranslation[];
  }> {
    // This is used for on-demand translation (e.g., translating old messages)
    // Uses conversation context for better translation quality
    const conversationHistory = context?.conversationHistory || [];
    
    // Enhanced prompt with conversation context
    const prompt = this.buildTranslationPrompt(
      messageContent,
      conversationHistory
    );

    // Call to OpenAI for translation with context
    const result = await this.translateWithContext(
      prompt,
      messageContent,
      apiKey
    );

    // Save translations
    await this.saveTranslations(messageId, result);

    return result;
  }

  private buildTranslationPrompt(
    messageContent: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): string {
    // Build prompt with conversation context
    // Similar to OPENAI_PROMPTS.WORD_TRANSLATION.USER but with context
  }

  private async translateWithContext(...): Promise<...> {
    // Implementation using OpenAI with conversation context
  }

  private async saveTranslations(...): Promise<void> {
    // Save word translations and full translation to database
  }
}
```

#### 1.3 Create On-Demand Translation Strategy

**File**: `apps/api/src/message-translation/strategies/on-demand-translation.strategy.ts`

```typescript
@Injectable()
export class OnDemandTranslationStrategy implements TranslationStrategy {
  constructor(
    private readonly wordTranslationService: WordTranslationService
  ) {}

  async translateMessageWithWords(
    messageId: number,
    messageContent: string,
    apiKey: string,
    context?: TranslationContext
  ): Promise<{
    translation: string;
    wordTranslations: WordTranslation[];
  }> {
    // No conversation context - use existing translatePreParsedWordsWithOpenAI
    // This is the current implementation for user messages
    return this.wordTranslationService.translatePreParsedWordsWithOpenAI(
      // ... existing logic
    );
  }
}
```

#### 1.4 Create Strategy Factory

**File**: `apps/api/src/message-translation/translation-strategy.factory.ts`

```typescript
@Injectable()
export class TranslationStrategyFactory {
  constructor(
    private readonly initialStrategy: InitialTranslationStrategy,
    private readonly onDemandStrategy: OnDemandTranslationStrategy
  ) {}

  getStrategy(messageRole: MessageRole): TranslationStrategy {
    switch (messageRole) {
      case MessageRole.ASSISTANT:
        return this.initialStrategy;
      case MessageRole.USER:
        return this.onDemandStrategy;
      default:
        return this.onDemandStrategy; // Default to on-demand
    }
  }
}
```

### Phase 2: Refactor Chat Service

#### 2.1 Update Chat Service - Single Call with Translations

**File**: `apps/api/src/chat/chat.service.ts`

**Changes**:
1. Enhanced prompt requests translations in JSON response (required, not optional)
2. Extract translations from JSON response (single call, no fallback)
3. Include translations in response DTO

**IMPORTANT**: This ensures a SINGLE OpenAI call. The enhanced prompt in `MessagePreparationService` will request translations, and we extract them from the response. No second API call needed.

```typescript
// After receiving OpenAI response
const { response, completion } = await this.openaiChatService.createChatCompletion(apiKey, openaiRequest);

// Extract words AND translations from response JSON (required in prompt)
let extractedWords: Array<{ originalWord: string; translation: string }> = [];
let extractedTranslation: string | undefined;
let cleanedResponse = response;
let translationsExtracted = false;

try {
  // Extract JSON with translations from response
  const jsonMatch = response.match(/\n\s*\{[\s\S]*"words"[\s\S]*\}\s*$/);
  if (jsonMatch) {
    const jsonStr = jsonMatch[0].trim();
    const parsed = JSON.parse(jsonStr);
    
    if (parsed.words && Array.isArray(parsed.words) && parsed.fullTranslation) {
      extractedWords = parsed.words
        .filter((w: any) => w.originalWord && w.translation)
        .map((w: any) => ({
          originalWord: w.originalWord,
          translation: w.translation
        }));
      
      extractedTranslation = parsed.fullTranslation;
      
      // Remove JSON from response
      cleanedResponse = response.substring(0, response.length - jsonMatch[0].length).trim();
      
      translationsExtracted = true;
      
      this.logger.debug(
        `Extracted ${extractedWords.length} words and translation from OpenAI response`
      );
    } else {
      this.logger.warn('Response JSON missing required fields (words or fullTranslation)');
    }
  } else {
    this.logger.warn('No JSON structure found in OpenAI response');
  }
} catch (error) {
  this.logger.warn('Failed to extract translations from response JSON:', error);
  // If extraction fails, we still have the chat response
  // Message is returned without translations, user can request translation manually
  translationsExtracted = false;
}

// Save assistant message (always saved, even if translations failed)
const assistantMessage = await this.messageRepository.create(
  session.id,
  MessageRole.ASSISTANT,
  cleanedResponse,
  { model: agentConfig.model, temperature: agentConfig.temperature },
  undefined,
  completion
);

// Save extracted translations if available
if (translationsExtracted && extractedWords.length > 0 && extractedTranslation) {
  await this.wordTranslationService.saveExtractedTranslations(
    assistantMessage.id,
    extractedWords,
    extractedTranslation,
    cleanedResponse
  );
  this.logger.debug(`Saved translations for assistant message ${assistantMessage.id}`);
} else {
  // Save words without translations (for highlighting, translation can be requested manually)
  if (extractedWords.length > 0) {
    await this.wordTranslationService.saveParsedWords(
      assistantMessage.id,
      extractedWords.map(w => ({ originalWord: w.originalWord })),
      cleanedResponse
    );
    this.logger.debug(`Saved words without translations for assistant message ${assistantMessage.id}`);
  }
}

// Include translations in response only if successfully extracted
// If not extracted, translations will be undefined and user can request manually
return {
  response: cleanedResponse,
  session: { ... },
  rawRequest: openaiRequest,
  rawResponse: completion,
  userMessageId: userMessage.id,
  assistantMessageId: assistantMessage.id,
  translation: translationsExtracted ? extractedTranslation : undefined,
  wordTranslations: translationsExtracted && extractedWords.length > 0 
    ? extractedWords.map(w => ({
        originalWord: w.originalWord,
        translation: w.translation,
      }))
    : undefined,
  savedWordMatches: savedWordMatches.length > 0 ? savedWordMatches : undefined,
};
```

#### 2.2 Update Message Preparation Service - Require Translations

**File**: `apps/api/src/chat/services/message-preparation.service.ts`

**Changes**:
1. Update instruction to REQUIRE translations in JSON (not optional)
2. Use structured output or JSON mode to ensure format
3. Request JSON format with words + translations

**CRITICAL**: This ensures translations are ALWAYS included in the initial response, eliminating the need for a second API call.

```typescript
private addWordParsingInstruction(
  messagesForAPI: MessageForOpenAI[]
): void {
  const wordParsingInstruction = `IMPORTANT: After your main response, you MUST include a JSON structure with word-level translations. This is required for the application to function correctly.

After your main response, add a new line with this JSON structure:
{
  "words": [
    {"originalWord": "word1", "translation": "translation1"},
    {"originalWord": "word2", "translation": "translation2"}
  ],
  "fullTranslation": "Complete sentence translation in natural, fluent English"
}

Requirements:
- Parse all words/tokens in your response (especially for languages without spaces like Chinese, Japanese)
- Provide English translation for each word considering sentence context
- Provide a complete, natural English translation of the entire message
- The JSON must be valid and parseable

Example:
Your main response: "你好，世界！"
JSON:
{
  "words": [
    {"originalWord": "你好", "translation": "hello"},
    {"originalWord": "世界", "translation": "world"}
  ],
  "fullTranslation": "Hello, world!"
}`;

  // ... rest of implementation
}
```

**Alternative**: Use OpenAI's structured output feature (if available) or JSON mode to ensure consistent format.

#### 2.3 Response Parsing (Already Covered in 2.1)

**Note**: Response parsing is now handled in section 2.1 above. The key difference is:
- **No fallback to second API call** - translations are extracted from the initial response
- If extraction fails, we log a warning but continue (non-blocking)
- The enhanced prompt ensures translations are included in the response

**Error Handling**:
- If JSON parsing fails: Log warning, continue without translations (message still works)
- If translations missing: Log warning, continue without translations
- This ensures the chat completion always succeeds, even if translation extraction fails

### Phase 3: Update Translation Service

#### 3.1 Refactor MessageTranslationService

**File**: `apps/api/src/message-translation/message-translation.service.ts`

**Changes**:
1. Use strategy factory for `translateMessageWithWords`
2. Keep `translateMessage` for user messages (on-demand, no context)

```typescript
async translateMessageWithWords(
  messageId: number,
  userId: string
): Promise<{
  translation: string;
  wordTranslations: WordTranslation[];
}> {
  // Get message
  const message = await this.messageRepository.findById(messageId);
  if (!message) {
    throw new MessageNotFoundException(messageId);
  }

  // Check if translations already exist
  const existingTranslation = await this.translationRepository.findByMessageId(messageId);
  const existingWordTranslations = await this.wordTranslationService.getWordTranslationsForMessage(messageId);
  
  const hasTranslatedWords = existingWordTranslations.some(
    (wt) => wt.translation && wt.translation.trim() !== ''
  );
  
  if (existingTranslation && hasTranslatedWords) {
    return {
      translation: existingTranslation.translation,
      wordTranslations: existingWordTranslations,
    };
  }

  // Get API key
  const apiKey = await this.apiCredentialsService.getApiKey(
    userId,
    MAGIC_STRINGS.OPENAI_PROVIDER
  );
  if (!apiKey) {
    throw new ApiKeyRequiredException();
  }

  // Get strategy based on message role
  const strategy = this.translationStrategyFactory.getStrategy(
    message.role as MessageRole
  );

  // Build context (only for assistant messages)
  let context: TranslationContext | undefined;
  if (message.role === MessageRole.ASSISTANT) {
    const contextMessages = await this.getContextMessages(
      message.sessionId,
      messageId
    );
    context = {
      conversationHistory: contextMessages,
      messageRole: message.role as MessageRole
    };
  } else {
    context = {
      messageRole: message.role as MessageRole
    };
  }

  // Translate using strategy
  const result = await strategy.translateMessageWithWords(
    messageId,
    message.content,
    apiKey,
    context
  );

  return result;
}
```

### Phase 4: Update DTOs

#### 4.1 Ensure Response DTOs Include Translations

**File**: `apps/api/src/common/dto/chat.dto.ts`

**Verify** `SendMessageResponseDto` includes:
- `translation?: string`
- `wordTranslations?: WordTranslation[]`

These should already be present, but verify they're properly typed.

---

## Frontend Refactoring

### Phase 1: Create Translation Service Abstraction

#### 1.1 Update Translation Service

**File**: `apps/client/src/services/translation/translation.service.ts`

**Changes**:
1. Keep existing methods (they already handle both cases)
2. Add method to check if translation is available

```typescript
export class TranslationService {
  /**
   * Check if translation is available for a message
   */
  static hasTranslation(message: Message): boolean {
    return message.translation !== undefined;
  }

  /**
   * Check if word translations are available for a message
   */
  static hasWordTranslations(message: Message): boolean {
    return message.wordTranslations !== undefined && 
           message.wordTranslations.length > 0;
  }

  // ... existing methods remain unchanged
}
```

### Phase 2: Refactor Translation Hook

#### 2.1 Simplify useMessageTranslation Hook

**File**: `apps/client/src/pages/chat/components/chat/ChatMessages/hooks/use-message-translation.ts`

**Changes**:
1. Remove API call logic for assistant messages (translations come from initial response)
2. Keep API call logic only for user messages
3. Simplify to just toggle display

```typescript
export function useMessageTranslation({
  message,
  messageId,
}: UseMessageTranslationOptions): UseMessageTranslationReturn {
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Translations come from message prop (already in initial response for assistant)
  const translation = message.translation;
  const wordTranslations = message.wordTranslations;

  const handleTranslate = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // If translation exists (from initial response or previous request), just toggle
    if (translation !== undefined) {
      setShowTranslation(!showTranslation);
      return;
    }

    // Request translation on-demand (for user messages or assistant messages without translations)
    if (!messageId) {
      return;
    }

    setIsTranslating(true);
    try {
      if (message.role === MessageRole.ASSISTANT) {
        // For assistant messages, request word translations + full translation
        // Uses conversation context for better quality
        const result = await TranslationService.translateMessageWithWords(messageId);
        setTranslation(result.translation);
        setWordTranslations(result.wordTranslations);
        message.translation = result.translation;
        message.wordTranslations = result.wordTranslations;
        setShowTranslation(true);
      } else {
        // For user messages, request full translation only (no context)
        const translatedText = await TranslationService.translateMessage(messageId);
        setTranslation(translatedText);
        message.translation = translatedText;
        setShowTranslation(true);
      }
    } catch (error) {
      console.error('Translation failed:', error);
      // Show error to user (could use toast notification)
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    isTranslating,
    showTranslation,
    translation,
    wordTranslations,
    handleTranslate,
    setShowTranslation,
  };
}
```

### Phase 3: Update MessageBubble Component

#### 3.1 Simplify MessageBubble

**File**: `apps/client/src/pages/chat/components/chat/ChatMessages/parts/MessageBubble.tsx`

**Changes**:
1. Remove conditional logic based on message role
2. Translation button just toggles display (no API call for assistant messages)
3. Keep existing UI structure

```typescript
export default function MessageBubble({
  message,
  savedWordMatches,
  onWordClick,
  onShowJson,
  messageId,
}: MessageBubbleProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  
  const {
    isTranslating,
    showTranslation,
    translation,
    wordTranslations,
    handleTranslate,
  } = useMessageTranslation({ message, messageId });

  const hasTranslation = translation !== undefined;
  const hasWordTranslations = wordTranslations && wordTranslations.length > 0;

  return (
    <div className="flex flex-col">
      {/* Original message bubble */}
      <div className={/* ... existing styles */}>
        <div className="markdown-wrapper">
          {message.role === MessageRole.ASSISTANT && hasWordTranslations ? (
            <TranslatableMarkdownContent
              content={message.content}
              wordTranslations={wordTranslations}
              savedWordMatches={savedWordMatches}
              onWordClick={onWordClick}
            />
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>

        {/* Action buttons */}
        <div className={/* ... existing styles */}>
          <Button
            onClick={handleTranslate}
            disabled={isTranslating || !messageId}
            variant="message-bubble"
            size="xs"
            tooltip={
              isTranslating
                ? t('chat.translation.translating')
                : hasTranslation
                  ? showTranslation
                    ? t('chat.translation.hideTranslation')
                    : t('chat.translation.showTranslation')
                  : t('chat.translation.clickToTranslate')
            }
          >
            {isTranslating ? (
              <Spinner size="xs" />
            ) : (
              <IconTranslate size="xs" />
            )}
          </Button>
          {/* ... JSON button */}
        </div>
      </div>

      {/* Translation bubble */}
      {hasTranslation && (
        <FadeTransition show={showTranslation}>
          <div className={/* ... existing styles */}>
            <MarkdownContent content={translation} />
          </div>
        </FadeTransition>
      )}
    </div>
  );
}
```

### Phase 4: Update Message Types

#### 4.1 Ensure Types Include Translations

**File**: `apps/client/src/types/chat.types.ts`

**Verify** `Message` interface includes:
- `translation?: string`
- `wordTranslations?: WordTranslation[]`

These should already be present.

---

## Module Registration

### Backend Module Updates

**File**: `apps/api/src/message-translation/message-translation.module.ts`

```typescript
@Module({
  imports: [/* ... existing imports */],
  providers: [
    MessageTranslationService,
    WordTranslationService,
    // Add new strategies
    InitialTranslationStrategy,
    OnDemandTranslationStrategy,
    TranslationStrategyFactory,
    // ... existing providers
  ],
  exports: [
    MessageTranslationService,
    WordTranslationService,
    TranslationStrategyFactory,
  ],
})
export class MessageTranslationModule {}
```

**File**: `apps/api/src/chat/chat.module.ts`

```typescript
@Module({
  imports: [
    // ... existing imports
    MessageTranslationModule, // Ensure this is imported
  ],
  providers: [
    ChatService,
    // ... existing providers
    TranslationStrategyFactory, // Inject if needed directly
  ],
  // ... rest of module
})
export class ChatModule {}
```

---

## Migration Steps

### Step 1: Backend - Create Strategy Interfaces
1. Create `translation-strategy.interface.ts`
2. Create `InitialTranslationStrategy`
3. Create `OnDemandTranslationStrategy`
4. Create `TranslationStrategyFactory`
5. Register in module

### Step 2: Backend - Update Chat Service
1. Inject `TranslationStrategyFactory` in `ChatService`
2. Update response parsing to extract translations from JSON
3. Add translation call after assistant message creation
4. Include translations in response DTO

### Step 3: Backend - Update Message Preparation
1. Update word parsing instruction to request translations
2. Test JSON extraction

### Step 4: Backend - Update Translation Service
1. Refactor `translateMessageWithWords` to use strategy factory
2. Keep `translateMessage` for user messages (on-demand)

### Step 5: Frontend - Simplify Translation Hook
1. Remove API call logic for assistant messages
2. Keep API call logic only for user messages
3. Simplify to toggle display

### Step 6: Frontend - Update Components
1. Update `MessageBubble` to remove conditional logic
2. Ensure translations display correctly
3. Test translation button behavior

### Step 7: Testing
1. Test assistant messages get translations in initial response
2. Test user messages still use on-demand translation
3. Test translation button toggles display (no API call for assistant)
4. Test error handling
5. Test backward compatibility

---

## Testing Strategy

### Unit Tests

#### Backend Tests
1. **TranslationStrategyFactory**
   - Test returns correct strategy for each message role
   - Test default strategy for unknown roles

2. **InitialTranslationStrategy**
   - Test translation with conversation context
   - Test saves translations correctly
   - Test error handling

3. **OnDemandTranslationStrategy**
   - Test translation without context
   - Test uses existing word translation service
   - Test error handling

4. **ChatService**
   - Test extracts translations from JSON response
   - Test uses strategy for translation
   - Test includes translations in response
   - Test error handling (non-blocking)

#### Frontend Tests
1. **useMessageTranslation Hook**
   - Test toggles display when translation exists
   - Test makes API call only for user messages
   - Test handles errors gracefully

2. **MessageBubble Component**
   - Test displays translations correctly
   - Test translation button behavior
   - Test word highlighting for assistant messages

### Integration Tests

1. **End-to-End Translation Flow**
   - Send message → receive assistant response with translations
   - Click translate button → toggle display (no API call)
   - Send user message → click translate → API call made

2. **Error Scenarios**
   - Translation fails in initial response → message still displays
   - Translation API call fails for user message → error shown

### Manual Testing Checklist

- [ ] Assistant message includes translations in initial response (when JSON parsing succeeds)
- [ ] Translation button toggles display when translations exist (no API call)
- [ ] Translation button makes API call when translations missing (for assistant messages)
- [ ] User message translation still works (on-demand)
- [ ] Word highlighting works for assistant messages
- [ ] Full translation displays correctly
- [ ] Error handling works (non-blocking - message returned even if translations fail)
- [ ] Manual translation request works for assistant messages (when initial extraction fails)
- [ ] Backward compatibility (old messages still work)

---

## Configuration Options

### Future: Make Strategy Configurable

**File**: `apps/api/src/common/constants/api.constants.ts`

```typescript
export const TRANSLATION_CONFIG = {
  // Use initial translation for assistant messages
  ASSISTANT_INITIAL_TRANSLATION: true,
  // Use on-demand translation for user messages
  USER_ON_DEMAND_TRANSLATION: true,
} as const;
```

**Usage in Strategy Factory**:
```typescript
getStrategy(messageRole: MessageRole): TranslationStrategy {
  if (messageRole === MessageRole.ASSISTANT && 
      TRANSLATION_CONFIG.ASSISTANT_INITIAL_TRANSLATION) {
    return this.initialStrategy;
  }
  return this.onDemandStrategy;
}
```

---

## Rollback Plan

If issues arise:

1. **Quick Rollback**: Revert to on-demand translation for all messages
   - Set `ASSISTANT_INITIAL_TRANSLATION: false` in config
   - All messages use `OnDemandTranslationStrategy`

2. **Partial Rollback**: Keep initial translation but make it optional
   - Add feature flag
   - Users can opt-in/opt-out

3. **Full Rollback**: Revert all changes
   - Git revert commits
   - Deploy previous version

---

## Performance Considerations

### Token Usage
- Initial translation adds ~400-600 tokens to initial response
- Saves ~700-1000 tokens when translation is requested (no separate call)
- Net savings when translation rate >40%

### Latency
- Initial response: +200-500ms (translation included)
- Translation button: 0ms (just toggles display)
- Overall: Better UX for users who always translate

### Error Handling
- Translation extraction failures are non-blocking
- Chat completion always succeeds (message is returned even if translations fail)
- If JSON parsing fails or translations missing:
  - Message is returned without translations
  - User can click translate button to request translation manually
  - Uses `InitialTranslationStrategy` with conversation context (for assistant messages)
  - Uses `OnDemandTranslationStrategy` without context (for user messages)
- This ensures graceful degradation: worst case, user gets message and can translate manually

---

## Success Criteria

1. ✅ Assistant messages include translations in initial response
2. ✅ Translation button toggles display (no API call for assistant)
3. ✅ User messages still use on-demand translation
4. ✅ No conditional logic in components
5. ✅ Clean separation of concerns
6. ✅ Backward compatible
7. ✅ All tests pass
8. ✅ Performance acceptable

---

## Timeline Estimate

- **Backend refactoring**: 2-3 days
- **Frontend refactoring**: 1-2 days
- **Testing**: 1-2 days
- **Total**: 4-7 days

---

## Notes

- This refactoring maintains backward compatibility
- Existing messages without translations still work
- Translation can be requested on-demand if initial translation fails
- Strategy pattern allows easy extension (e.g., different strategies per agent)
- Configuration allows easy toggling between approaches
