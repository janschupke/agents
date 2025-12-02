# Frontend Refactoring Plan

## Overview

This document outlines a comprehensive refactoring plan to modernize the frontend architecture, improve maintainability, and provide consistent user experience patterns across the application.

## Goals

1. **React Query Integration**: Use React Query for API data state management and caching
2. **Global Data Availability**: Chats, agents (bots), and config data available globally with intelligent caching
3. **Consistent Visual Feedback**: Standardized pending/loading/saving states across all interactions
4. **Centralized Validation**: Unified input validation handling with real-time feedback
5. **Maintainability & Performance**: Clean separation of concerns and optimized performance
6. **Axios Migration**: Replace fetch API with axios for better request handling

## Current State Analysis

### Current Architecture

- **API Layer**: Custom `ApiManager` class using native `fetch` API
- **State Management**: React Context API (BotContext, ChatContext, UserContext, AppContext)
- **Caching**: Manual caching using refs (`sessionCacheRef`, `botConfigCacheRef`)
- **Forms**: Manual form state with `useState`, no centralized validation
- **Loading States**: Component-level loading state management
- **Toast System**: Custom `ToastContext` implementation
- **No React Query**: Currently not using React Query
- **No Axios**: Using native fetch API

### Current Issues

1. **Manual Cache Management**: Complex ref-based caching that's error-prone
2. **Inconsistent Loading States**: Different patterns across components
3. **No Centralized Validation**: Validation logic scattered across components
4. **Fetch API Limitations**: Less robust error handling and request interceptors
5. **State Duplication**: Similar data cached in multiple places
6. **No Optimistic Updates**: Manual state updates after mutations

## Refactoring Plan

### Phase 1: Dependencies & Infrastructure Setup

#### 1.1 Install Required Dependencies

```bash
cd packages/client
pnpm add @tanstack/react-query axios
pnpm add -D @types/axios
```

#### 1.2 Create Axios Instance

**File**: `packages/client/src/services/axios-instance.ts`

- Create axios instance with base URL configuration
- Set up request interceptor for Clerk token injection
- Set up response interceptor for error handling
- Configure default headers (Content-Type, etc.)
- Export configured axios instance

#### 1.3 Setup React Query Provider

**File**: `packages/client/src/providers/QueryProvider.tsx`

- Create QueryClient with appropriate defaults:
  - `staleTime`: 5 minutes (300000ms)
  - `cacheTime`: 10 minutes (600000ms)
  - `refetchOnWindowFocus`: false
  - `retry`: 2
- Wrap app with QueryClientProvider
- Update `App.tsx` to include QueryProvider

#### 1.4 Update API Manager to Use Axios

**File**: `packages/client/src/services/api-manager.ts`

- Refactor `ApiManager` to use axios instance instead of fetch
- Maintain same interface for backward compatibility during migration
- Update error handling to work with axios error structure
- Keep `ApiError` interface but adapt to axios errors

### Phase 2: React Query Hooks & Services

#### 2.1 Create Query Key Factory

**File**: `packages/client/src/hooks/queries/query-keys.ts`

```typescript
export enum QueryKey {
  BOTS = 'bots',
  CHAT = 'chat',
  USER = 'user',
  CONFIG = 'config',
  LIST = 'list',
  DETAIL = 'detail',
  SESSIONS = 'sessions',
  HISTORY = 'history',
  MEMORIES = 'memories',
  ME = 'me',
  API_KEY = 'apiKey',
  SYSTEM = 'system',
}

export const queryKeys = {
  bots: {
    all: [QueryKey.BOTS] as const,
    lists: () => [...queryKeys.bots.all, QueryKey.LIST] as const,
    list: (filters?: string) => [...queryKeys.bots.lists(), { filters }] as const,
    details: () => [...queryKeys.bots.all, QueryKey.DETAIL] as const,
    detail: (id: number) => [...queryKeys.bots.details(), id] as const,
    sessions: (botId: number) => [...queryKeys.bots.detail(botId), QueryKey.SESSIONS] as const,
    config: (botId: number) => [...queryKeys.bots.detail(botId), QueryKey.CONFIG] as const,
    memories: (botId: number) => [...queryKeys.bots.detail(botId), QueryKey.MEMORIES] as const,
  },
  chat: {
    all: [QueryKey.CHAT] as const,
    history: (botId: number, sessionId?: number) => 
      [...queryKeys.chat.all, QueryKey.HISTORY, botId, sessionId] as const,
    sessions: (botId: number) => 
      [...queryKeys.chat.all, QueryKey.SESSIONS, botId] as const,
  },
  user: {
    all: [QueryKey.USER] as const,
    me: () => [...queryKeys.user.all, QueryKey.ME] as const,
    apiKey: () => [...queryKeys.user.all, QueryKey.API_KEY] as const,
  },
  config: {
    all: [QueryKey.CONFIG] as const,
    system: () => [...queryKeys.config.all, QueryKey.SYSTEM] as const,
  },
} as const;
```

#### 2.2 Create React Query Hooks for Bots

**File**: `packages/client/src/hooks/queries/use-bots.ts`

- `useBots()`: Query hook for fetching all bots
- `useBot(botId)`: Query hook for fetching single bot
- `useBotSessions(botId)`: Query hook for bot sessions
- `useBotConfig(botId)`: Query hook for bot configuration
- `useBotMemories(botId)`: Query hook for bot memories

**File**: `packages/client/src/hooks/mutations/use-bot-mutations.ts`

- `useCreateBot()`: Mutation hook for creating bot
- `useUpdateBot()`: Mutation hook for updating bot
- `useDeleteBot()`: Mutation hook for deleting bot
- `useUpdateBotConfig()`: Mutation hook for updating bot config
- `useCreateSession()`: Mutation hook for creating session
- `useUpdateSession()`: Mutation hook for updating session
- `useDeleteSession()`: Mutation hook for deleting session
- `useUpdateMemory()`: Mutation hook for updating memory
- `useDeleteMemory()`: Mutation hook for deleting memory
- `useSummarizeMemories()`: Mutation hook for summarizing memories

All mutations should:
- Invalidate relevant queries
- Show toast notifications on success/error
- Handle optimistic updates where appropriate
- Return loading state for UI feedback

#### 2.3 Create React Query Hooks for Chat

**File**: `packages/client/src/hooks/queries/use-chat.ts`

- `useChatHistory(botId, sessionId)`: Query hook for chat history
- `useSessions(botId)`: Query hook for sessions

**File**: `packages/client/src/hooks/mutations/use-chat-mutations.ts`

- `useSendMessage()`: Mutation hook for sending messages
  - Optimistic update for user message
  - Update cache with assistant response
  - Handle new session creation

#### 2.4 Create React Query Hooks for User & Config

**File**: `packages/client/src/hooks/queries/use-user.ts`

- `useUser()`: Query hook for current user
- `useApiKeyStatus()`: Query hook for API key status

**File**: `packages/client/src/hooks/mutations/use-user-mutations.ts`

- `useUpdateApiKey()`: Mutation hook for updating API key

**File**: `packages/client/src/hooks/queries/use-config.ts`

- `useSystemConfig()`: Query hook for system configuration

### Phase 3: Centralized Validation System

#### 3.1 Create Validation Utilities

**File**: `packages/client/src/utils/validation.ts`

```typescript
export type ValidationRule<T = any> = {
  validate: (value: T) => boolean;
  message: string;
};

export type ValidationSchema<T extends Record<string, any>> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FieldValidationState {
  value: any;
  touched: boolean;
  error: string | null;
  isValidating: boolean;
}
```

- `validateField(value, rules)`: Validate single field
- `validateAll(formData, schema)`: Validate entire form
- `createValidator(schema)`: Create validator function from schema

#### 3.2 Create Form Validation Hook

**File**: `packages/client/src/hooks/use-form-validation.ts`

```typescript
export function useFormValidation<T extends Record<string, any>>(
  schema: ValidationSchema<T>,
  initialValues: T
) {
  // Returns:
  // - values: form values
  // - errors: validation errors
  // - touched: touched state per field
  // - setValue: update field value
  // - setTouched: mark field as touched
  // - validateField: validate single field
  // - validateAll: validate all fields
  // - reset: reset form to initial values
  // - isValid: overall form validity
}
```

Features:
- Real-time validation on blur
- Validation on change (debounced)
- `validateAll()` for submit action
- Track touched state per field
- Return validation errors per field

#### 3.3 Create Validated Input Component

**File**: `packages/client/src/components/ui/ValidatedInput.tsx`

- Wrapper around standard input
- Integrates with `useFormValidation`
- Shows validation errors in real-time
- Handles focus/blur/touched states
- Disabled state support
- Consistent styling

#### 3.4 Create Validated Form Component

**File**: `packages/client/src/components/ui/ValidatedForm.tsx`

- Wrapper component for forms
- Integrates with `useFormValidation`
- Handles form submission
- Prevents submission when invalid
- Shows loading state during submission

### Phase 4: Standardized Form Patterns

#### 4.1 Create Form Button Component

**File**: `packages/client/src/components/ui/FormButton.tsx`

```typescript
export enum ButtonType {
  SUBMIT = 'submit',
  BUTTON = 'button',
}

export enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  DANGER = 'danger',
}

interface FormButtonProps {
  type?: ButtonType;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  tooltip?: string;
}
```

Features:
- Shows loading spinner when `loading={true}`
- Displays tooltip with loading/saving message
- Disabled state styling
- Instant visual feedback on click

#### 4.2 Create Form Container Component

**File**: `packages/client/src/components/ui/FormContainer.tsx`

- Wraps form content
- Handles form-level loading state
- Disables all inputs when `saving={true}`
- Shows form-level error messages
- Provides consistent spacing and layout

#### 4.3 Update Existing Forms

Forms to refactor:
1. **BotConfigForm** (`packages/client/src/components/bot/BotConfigForm.tsx`)
   - Use `useFormValidation` hook
   - Use `ValidatedInput` components
   - Use `FormButton` for save button
   - Use `FormContainer` wrapper
   - Integrate with React Query mutations

2. **SessionNameModal** (`packages/client/src/components/session/SessionNameModal.tsx`)
   - Use `useFormValidation` hook
   - Use `ValidatedInput` component
   - Use `FormButton` for save button
   - Integrate with React Query mutations

3. **UserProfile** (if it has forms)
   - Apply same patterns

### Phase 5: Loading States & Visual Feedback

#### 5.1 Create Loading Component

**File**: `packages/client/src/components/ui/Loading.tsx`

- Standardized loading spinner/indicator
- Variants: full-page, inline, button
- Consistent styling

#### 5.2 Create Loading Wrapper

**File**: `packages/client/src/components/ui/LoadingWrapper.tsx`

```typescript
interface LoadingWrapperProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
```

- Shows loading state while data is fetching
- Uses React Query's `isLoading` state
- Provides consistent "Loading..." message

#### 5.3 Update Views to Use Loading States

Views to update:
1. **ChatBot** (`packages/client/src/components/chat/ChatBot.tsx`)
   - Use `LoadingWrapper` for initial load
   - Use React Query hooks instead of context
   - Show loading state when switching sessions

2. **BotConfig** (`packages/client/src/components/bot/BotConfig.tsx`)
   - Use `LoadingWrapper` for bot list loading
   - Use React Query hooks

3. **SessionSidebar** (`packages/client/src/components/session/SessionSidebar.tsx`)
   - Use React Query hooks for sessions
   - Show loading state when fetching

#### 5.4 Button Click Feedback Pattern

**File**: `packages/client/src/hooks/use-optimistic-update.ts`

- Hook for optimistic updates
- Instant UI feedback before API response
- Rollback on error

Pattern for buttons:
1. User clicks button → immediate UI update (optimistic)
2. Show loading state on button
3. API request in progress
4. On success: confirm update, show toast
5. On error: rollback, show error toast

Example implementation:
```typescript
const switchSession = (sessionId: number) => {
  // 1. Immediate UI update
  setCurrentSessionId(sessionId);
  
  // 2. Show loading state
  setIsLoadingSession(true);
  
  // 3. Load data
  queryClient.prefetchQuery(...)
    .then(() => {
      // 4. Success - data already loaded
      setIsLoadingSession(false);
    })
    .catch(() => {
      // 5. Error - rollback
      setCurrentSessionId(previousSessionId);
      setIsLoadingSession(false);
      showToast('Failed to load session', 'error');
    });
};
```

### Phase 6: Toast Integration with Mutations

#### 6.1 Update Mutation Hooks

All mutation hooks should:
- Show success toast on successful mutation
- Show error toast on failed mutation
- Include descriptive messages

Example pattern:
```typescript
const useUpdateBot = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  return useMutation({
    mutationFn: (data: UpdateBotRequest) => BotService.updateBot(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bots.all });
      showToast('Bot updated successfully', 'success');
    },
    onError: (error) => {
      showToast(error.message || 'Failed to update bot', 'error');
    },
  });
};
```

#### 6.2 Error Handling Standardization

**File**: `packages/client/src/utils/error-handler.ts`

- Centralized error extraction from API errors
- Standard error message formatting
- Error type detection (network, validation, server, etc.)

### Phase 7: Context Migration

#### 7.1 Migrate BotContext

**File**: `packages/client/src/contexts/BotContext.tsx`

- Remove manual state management
- Remove manual caching (refs)
- Keep only:
  - Selected bot ID state (if needed for UI)
  - Helper functions that wrap React Query hooks
- Provide hooks that use React Query under the hood

#### 7.2 Migrate ChatContext

**File**: `packages/client/src/contexts/ChatContext.tsx`

- Remove manual message state management
- Remove manual session caching
- Use React Query for chat history
- Keep only:
  - Current session ID state (for UI navigation)
  - Helper functions that wrap React Query hooks

#### 7.3 Keep AppContext & AuthContext

- `AppContext`: Keep for UI state (selected bot ID, etc.)
- `AuthContext`: Keep for authentication state
- `UserContext`: Migrate to React Query hooks
- `ToastContext`: Keep as-is (works well)

### Phase 8: Service Layer Updates

#### 8.1 Update Services to Use Axios

Update all service files:
- `packages/client/src/services/bot.service.ts`
- `packages/client/src/services/chat.service.ts`
- `packages/client/src/services/memory.service.ts`
- `packages/client/src/services/user.service.ts`
- `packages/client/src/services/translation.service.ts`
- `packages/client/src/services/api-credentials.service.ts`

Changes:
- Replace `apiManager` calls with direct axios calls
- Use typed axios instance
- Maintain same function signatures for compatibility

#### 8.2 Create Service Types

**File**: `packages/client/src/services/types.ts`

- Centralized type definitions for API requests/responses
- Shared types across services

### Phase 9: Component Updates

#### 9.1 Update Components to Use React Query Hooks

Components to update:
1. **ChatBot.tsx**: Use `useChatHistory`, `useSendMessage`
2. **BotConfig.tsx**: Use `useBots`, bot mutations
3. **BotConfigForm.tsx**: Use `useFormValidation`, mutations
4. **SessionSidebar.tsx**: Use `useBotSessions`, session mutations
5. **SessionNameModal.tsx**: Use `useFormValidation`, `useUpdateSession`
6. **MemoriesList.tsx**: Use `useBotMemories`, memory mutations
7. **UserProfile.tsx**: Use `useUser`, `useUpdateApiKey`

#### 9.2 Remove Manual Loading States

- Remove `useState` for loading states
- Use React Query's `isLoading`, `isFetching`, `isPending` states
- Use mutation's `isPending` for saving states

### Phase 10: Testing & Validation

#### 10.1 Update Tests

- Update service tests to use axios mocks
- Update component tests to mock React Query
- Test validation system
- Test form patterns
- Test loading states

#### 10.2 Manual Testing Checklist

- [ ] All forms disable inputs when saving
- [ ] All buttons show loading state when pending
- [ ] Validation messages appear in real-time
- [ ] Toast notifications show on success/error
- [ ] Loading states show when fetching data
- [ ] Button clicks provide instant feedback
- [ ] Data is cached and doesn't refetch unnecessarily
- [ ] Optimistic updates work correctly
- [ ] Error states are handled gracefully

## Implementation Order

### Week 1: Foundation
1. Install dependencies (Phase 1.1)
2. Create axios instance (Phase 1.2)
3. Setup React Query provider (Phase 1.3)
4. Update API Manager (Phase 1.4)

### Week 2: Core Hooks
5. Create query key factory (Phase 2.1)
6. Create bot query hooks (Phase 2.2)
7. Create bot mutation hooks (Phase 2.2)
8. Create chat query hooks (Phase 2.3)
9. Create chat mutation hooks (Phase 2.3)

### Week 3: Validation & Forms
10. Create validation utilities (Phase 3.1)
11. Create form validation hook (Phase 3.2)
12. Create validated input component (Phase 3.3)
13. Create form components (Phase 4.1-4.2)
14. Update existing forms (Phase 4.3)

### Week 4: UI & Feedback
15. Create loading components (Phase 5.1-5.2)
16. Update views with loading states (Phase 5.3)
17. Implement button feedback patterns (Phase 5.4)
18. Integrate toasts with mutations (Phase 6)

### Week 5: Migration
19. Migrate contexts (Phase 7)
20. Update services (Phase 8)
21. Update components (Phase 9)

### Week 6: Testing & Polish
22. Update tests (Phase 10.1)
23. Manual testing (Phase 10.2)
24. Bug fixes and refinements

## File Structure After Refactoring

```
packages/client/src/
├── components/
│   ├── ui/
│   │   ├── ValidatedInput.tsx
│   │   ├── ValidatedForm.tsx
│   │   ├── FormButton.tsx
│   │   ├── FormContainer.tsx
│   │   ├── Loading.tsx
│   │   └── LoadingWrapper.tsx
│   └── ... (existing components)
├── hooks/
│   ├── queries/
│   │   ├── query-keys.ts
│   │   ├── use-bots.ts
│   │   ├── use-chat.ts
│   │   ├── use-user.ts
│   │   └── use-config.ts
│   ├── mutations/
│   │   ├── use-bot-mutations.ts
│   │   ├── use-chat-mutations.ts
│   │   └── use-user-mutations.ts
│   ├── use-form-validation.ts
│   └── use-optimistic-update.ts
├── services/
│   ├── axios-instance.ts
│   ├── api-manager.ts (updated to use axios)
│   ├── types.ts
│   └── ... (existing services updated)
├── providers/
│   └── QueryProvider.tsx
├── utils/
│   ├── validation.ts
│   └── error-handler.ts
└── contexts/
    ├── BotContext.tsx (simplified)
    ├── ChatContext.tsx (simplified)
    ├── AppContext.tsx (unchanged)
    ├── AuthContext.tsx (unchanged)
    └── ToastContext.tsx (unchanged)
```

## Key Benefits

1. **Automatic Caching**: React Query handles caching automatically
2. **Reduced Boilerplate**: Less manual state management code
3. **Better Performance**: Intelligent refetching and cache invalidation
4. **Consistent UX**: Standardized loading, validation, and feedback patterns
5. **Type Safety**: Better TypeScript support with React Query
6. **Error Handling**: Centralized error handling with axios interceptors
7. **Optimistic Updates**: Built-in support for optimistic UI updates
8. **Developer Experience**: Easier to add new features and maintain

## Migration Strategy

### Gradual Migration Approach

1. **Parallel Implementation**: Implement React Query hooks alongside existing context
2. **Component-by-Component**: Migrate one component at a time
3. **Feature Flags**: Use feature flags to toggle between old/new implementations
4. **Testing**: Test each migrated component thoroughly before moving to next

### Rollback Plan

- Keep old context implementations until migration is complete
- Use feature flags to switch back if issues arise
- Maintain git branches for each phase

## Success Criteria

- [ ] All API calls use axios
- [ ] All data fetching uses React Query
- [ ] All forms use centralized validation
- [ ] All forms disable inputs when saving
- [ ] All buttons show loading state when pending
- [ ] All views show loading state when fetching
- [ ] All mutations show toast notifications
- [ ] Button clicks provide instant feedback
- [ ] Data is cached globally and accessible
- [ ] No manual cache management
- [ ] Consistent error handling
- [ ] All tests pass
- [ ] Performance is improved or maintained

## Notes

- Maintain backward compatibility during migration
- Update documentation as you go
- Consider performance implications of React Query defaults
- Test with slow network conditions
- Ensure accessibility is maintained in new components
