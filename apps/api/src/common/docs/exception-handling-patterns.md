# Exception Handling Patterns

This document describes when to throw exceptions vs. continue execution in services.

## General Principles

1. **Throw exceptions for critical errors** - Errors that prevent the operation from completing
2. **Continue for non-critical errors** - Errors that don't prevent the main operation but should be logged
3. **Always log errors** - Whether throwing or continuing, log the error for debugging

## When to Throw Exceptions

### Critical Business Logic Errors
- **Validation failures** - Invalid input data
- **Authorization failures** - User doesn't have permission
- **Resource not found** - Required entity doesn't exist
- **API key errors** - Missing or invalid API keys
- **Database constraint violations** - Unique constraint, foreign key violations

**Examples:**
```typescript
// Throw when agent not found
if (!agent) {
  throw new AgentNotFoundException(agentId);
}

// Throw when API key missing
if (!apiKey) {
  throw new ApiKeyRequiredException();
}
```

### External Service Failures (Critical)
- **OpenAI API failures** - When the response is required for the operation
- **Database connection errors** - When data persistence is required

**Examples:**
```typescript
// Throw when OpenAI response is required
const response = await openai.chat.completions.create(...);
if (!response) {
  throw new HttpException('No response from OpenAI', HttpStatus.INTERNAL_SERVER_ERROR);
}
```

## When to Continue (Log and Continue)

### Non-Critical Features
- **Memory retrieval failures** - Chat can continue without memories
- **Translation extraction failures** - Message still works without translations
- **Word parsing failures** - Highlighting won't work but message is fine
- **Saved word matching failures** - Feature enhancement, not critical

**Examples:**
```typescript
// Continue without memories if retrieval fails
try {
  relevantMemories = await this.agentMemoryService.getMemoriesForContext(...);
} catch (error) {
  this.logger.error('Error retrieving memories:', error);
  // Continue without memories if retrieval fails
}

// Continue without translations if extraction fails
try {
  await this.wordTranslationService.saveExtractedTranslations(...);
} catch (error) {
  this.logger.error('Error saving extracted translations:', error);
  // Continue without translations - message still works
}
```

### Optional Enhancements
- **Performance logging failures** - Don't break the operation
- **Analytics/logging failures** - Non-critical tracking

## Error Handling Best Practices

1. **Use custom exception classes** - Provides type safety and consistent error messages
2. **Use centralized error handlers** - For external API errors (e.g., `OpenAIErrorHandler`)
3. **Log with context** - Include relevant IDs, user info, operation name
4. **Return user-friendly messages** - Don't expose internal error details to users
5. **Document error handling decisions** - Add comments explaining why errors are swallowed

## Custom Exception Classes

All custom exceptions are in `apps/api/src/common/exceptions/`:
- `AgentNotFoundException`
- `SessionNotFoundException`
- `MessageNotFoundException`
- `MemoryNotFoundException`
- `ApiKeyRequiredException`
- `ApiKeyNotFoundException`

Use these instead of generic `HttpException` when appropriate.

## OpenAI Error Handling

Use `OpenAIErrorHandler.handleError()` for all OpenAI API errors:
```typescript
try {
  const response = await openai.chat.completions.create(...);
} catch (error) {
  throw OpenAIErrorHandler.handleError(error, 'operation-name');
}
```

This ensures consistent error handling across all OpenAI calls.
