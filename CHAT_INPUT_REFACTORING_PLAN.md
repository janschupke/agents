# Chat Input Focus Management Refactoring Plan

## Executive Summary

The current chat input focus management implementation is fragile, contains multiple competing effects, and uses anti-patterns that make it unreliable. This document outlines a comprehensive refactoring plan to create a maintainable, testable, and reliable focus management system.

## Current Problems

### 1. Multiple Competing Focus Effects
**Location**: `apps/client/src/pages/chat/hooks/use-chat-input.ts` (lines 36-80)

**Issue**: Three separate `useEffect` hooks attempt to manage focus:
- Page load focus (lines 36-52)
- Session change focus (lines 54-63)
- Typing indicator focus (lines 65-80)

**Problems**:
- Race conditions when multiple effects fire simultaneously
- Duplicate logic and conditions scattered across effects
- No clear priority or coordination between effects
- Both page load and session change effects can fire on mount, causing duplicate focus calls

### 2. Empty Dependency Array Anti-Pattern
**Location**: `apps/client/src/pages/chat/hooks/use-chat-input.ts` (line 52)

**Issue**: The page load effect uses `[]` dependency array with `eslint-disable-next-line` comment.

**Problems**:
- Captures stale values at mount time (closure problem)
- If conditions aren't met on mount, focus never happens even when they become valid later
- Requires manual ref tracking (`hasFocusedOnMountRef`) to prevent re-running
- Violates React's exhaustive-deps rule, hiding potential bugs

### 3. Manual State Tracking with Refs
**Location**: `apps/client/src/pages/chat/hooks/use-chat-input.ts` (lines 33-34)

**Issue**: Manual tracking using refs:
- `prevTypingIndicatorRef` - tracks previous typing indicator state
- `hasFocusedOnMountRef` - tracks if mount focus has occurred

**Problems**:
- Error-prone manual synchronization
- Easy to forget to update refs
- Makes code harder to reason about
- Doesn't leverage React's built-in state management

### 4. Fragile Timing with setTimeout
**Location**: All focus effects use `setTimeout` with `NUMERIC_CONSTANTS.UI_DEBOUNCE_DELAY` (100ms)

**Issue**: All focus attempts use a fixed delay without ensuring:
- The ref is actually ready
- The input element is mounted
- The input is not disabled

**Problems**:
- No guarantee the ref is populated when timeout fires
- If input is disabled, focus silently fails
- Race conditions if component unmounts before timeout
- The delay is arbitrary and may not be sufficient in all cases

### 5. Disabled State Not Properly Handled
**Location**: `apps/client/src/pages/chat/components/chat/ChatContent.tsx` (line 66)

**Issue**: Input is disabled when `showTypingIndicator` is true, but focus logic doesn't account for this.

**Problems**:
- Focus attempts while input is disabled will fail silently
- No mechanism to refocus after input becomes enabled
- The typing indicator effect tries to focus when it becomes false, but timing may be off

### 6. Scattered Condition Logic
**Location**: Conditions repeated in multiple places:
- `currentSessionId && !messagesLoading && !showChatPlaceholder`

**Problems**:
- Duplicated logic across effects
- Easy to miss updating one location when requirements change
- No single source of truth for "when should input be focusable"

### 7. No Unified Focus Strategy
**Issue**: No clear state machine or unified logic for focus management.

**Problems**:
- Hard to reason about when focus should occur
- Difficult to test edge cases
- No clear documentation of focus behavior
- Makes debugging difficult

## Requirements

Based on user requirements and expected behavior:

1. **Input stays focused during chat usage**
   - If input gets disabled during pending state (`showTypingIndicator: true`), it must regain focus when enabled (`showTypingIndicator: false`)

2. **Session change autofocus**
   - When changing sessions, input must automatically focus

3. **Page load autofocus**
   - On fresh page load, input must automatically focus when conditions are met

## Proposed Solution

### Architecture Overview

Create a unified focus management system with:
1. **Single source of truth** for focus conditions
2. **State machine approach** to track focus state
3. **Proper React patterns** (no empty dependency arrays with stale values)
4. **Ref readiness checking** before focusing
5. **Disabled state awareness** with automatic refocus when enabled

### Implementation Plan

#### Phase 1: Create Focus Condition Helper

**File**: `apps/client/src/pages/chat/hooks/use-chat-input-focus.ts` (new file)

```typescript
/**
 * Determines if the input should be focusable based on current state
 */
function shouldInputBeFocusable(
  currentSessionId: number | null,
  messagesLoading: boolean,
  showChatPlaceholder: boolean
): boolean {
  return !!(
    currentSessionId &&
    !messagesLoading &&
    !showChatPlaceholder
  );
}
```

**Benefits**:
- Single source of truth for focus conditions
- Easy to test
- Easy to modify requirements in one place

#### Phase 2: Create Unified Focus Hook

**File**: `apps/client/src/pages/chat/hooks/use-chat-input-focus.ts` (new file)

**Approach**: Create a dedicated hook that manages all focus logic:

```typescript
interface UseChatInputFocusOptions {
  chatInputRef: React.RefObject<ChatInputRef>;
  currentSessionId: number | null;
  messagesLoading: boolean;
  showChatPlaceholder: boolean;
  showTypingIndicator: boolean;
  isInputDisabled: boolean;
}

function useChatInputFocus({
  chatInputRef,
  currentSessionId,
  messagesLoading,
  showChatPlaceholder,
  showTypingIndicator,
  isInputDisabled,
}: UseChatInputFocusOptions) {
  // Track previous values to detect transitions
  const prevSessionIdRef = useRef(currentSessionId);
  const prevTypingIndicatorRef = useRef(showTypingIndicator);
  const prevDisabledRef = useRef(isInputDisabled);
  const hasFocusedOnInitialMountRef = useRef(false);
  
  const isFocusable = shouldInputBeFocusable(
    currentSessionId,
    messagesLoading,
    showChatPlaceholder
  );

  // Unified focus function that checks ref readiness
  const attemptFocus = useCallback(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Double-check ref is ready
      if (chatInputRef.current && !isInputDisabled) {
        chatInputRef.current.focus();
      }
    });
  }, [chatInputRef, isInputDisabled]);

  // Effect 1: Initial mount focus
  useEffect(() => {
    if (!hasFocusedOnInitialMountRef.current && isFocusable && !isInputDisabled) {
      hasFocusedOnInitialMountRef.current = true;
      attemptFocus();
    }
  }, [isFocusable, isInputDisabled, attemptFocus]);

  // Effect 2: Session change focus
  useEffect(() => {
    const sessionChanged = prevSessionIdRef.current !== currentSessionId;
    if (sessionChanged && isFocusable && !isInputDisabled) {
      attemptFocus();
    }
    prevSessionIdRef.current = currentSessionId;
  }, [currentSessionId, isFocusable, isInputDisabled, attemptFocus]);

  // Effect 3: Typing indicator transition (disabled -> enabled)
  useEffect(() => {
    const wasDisabled = prevTypingIndicatorRef.current === true;
    const isNowEnabled = showTypingIndicator === false;
    const wasInputDisabled = prevDisabledRef.current === true;
    const isNowInputEnabled = isInputDisabled === false;
    
    // Focus when typing indicator goes from true to false
    // OR when input goes from disabled to enabled
    if (
      isFocusable &&
      ((wasDisabled && isNowEnabled) || (wasInputDisabled && isNowInputEnabled))
    ) {
      attemptFocus();
    }
    
    prevTypingIndicatorRef.current = showTypingIndicator;
    prevDisabledRef.current = isInputDisabled;
  }, [showTypingIndicator, isInputDisabled, isFocusable, attemptFocus]);
}
```

**Key Improvements**:
- Single hook with clear responsibilities
- Uses `requestAnimationFrame` to ensure DOM readiness
- Checks disabled state before focusing
- Tracks transitions properly
- All effects depend on actual values, not empty arrays

#### Phase 3: Refactor useChatInput Hook

**File**: `apps/client/src/pages/chat/hooks/use-chat-input.ts`

**Changes**:
1. Remove all three focus effects (lines 36-80)
2. Remove manual ref tracking (`prevTypingIndicatorRef`, `hasFocusedOnMountRef`)
3. Import and use `useChatInputFocus` hook
4. Pass `isInputDisabled` prop (derived from `showTypingIndicator`)

**Before**:
```typescript
const prevTypingIndicatorRef = useRef(showTypingIndicator);
const hasFocusedOnMountRef = useRef(false);

// Three separate useEffect hooks...
```

**After**:
```typescript
const isInputDisabled = showTypingIndicator;

useChatInputFocus({
  chatInputRef,
  currentSessionId,
  messagesLoading,
  showChatPlaceholder,
  showTypingIndicator,
  isInputDisabled,
});
```

#### Phase 4: Update ChatInput Component

**File**: `apps/client/src/pages/chat/components/chat/ChatInput.tsx`

**Enhancement**: Add `useEffect` to handle focus when disabled state changes:

```typescript
// Ensure input regains focus when it becomes enabled
useEffect(() => {
  if (!disabled && ref) {
    // Small delay to ensure component is fully rendered
    const timer = setTimeout(() => {
      ref.current?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }
}, [disabled, ref]);
```

**Note**: This is a backup mechanism. The main focus logic should be in the hook, but this provides additional safety.

#### Phase 5: Update Tests

**File**: `apps/client/src/pages/chat/hooks/use-chat-input.test.tsx`

**Changes**:
1. Update tests to work with new unified focus hook
2. Add tests for `useChatInputFocus` hook separately
3. Test edge cases:
   - Focus when disabled state changes
   - Focus when ref becomes ready after mount
   - Focus when session changes
   - Focus on initial mount with various conditions

**New Test File**: `apps/client/src/pages/chat/hooks/use-chat-input-focus.test.tsx`

Test cases:
- ✅ Focuses on initial mount when conditions are met
- ✅ Focuses when session changes
- ✅ Focuses when typing indicator goes from true to false
- ✅ Focuses when input goes from disabled to enabled
- ✅ Does not focus when input is disabled
- ✅ Does not focus when conditions are not met
- ✅ Handles ref not being ready gracefully

## Migration Steps

### Step 1: Create New Focus Hook
1. Create `use-chat-input-focus.ts` with the unified focus logic
2. Create `use-chat-input-focus.test.tsx` with comprehensive tests
3. Ensure all tests pass

### Step 2: Refactor useChatInput
1. Remove old focus effects from `use-chat-input.ts`
2. Import and integrate `useChatInputFocus`
3. Update `use-chat-input.test.tsx` to work with new implementation
4. Ensure all existing tests still pass

### Step 3: Enhance ChatInput Component
1. Add disabled state change handling (optional, as backup)
2. Test that focus works correctly

### Step 4: Integration Testing
1. Test in browser:
   - Page load with valid conditions
   - Page load with invalid conditions (then becoming valid)
   - Session changes
   - Message sending (typing indicator transitions)
   - Rapid session switching
   - Input disabled/enabled transitions

### Step 5: Cleanup
1. Remove any unused code
2. Update documentation
3. Remove eslint-disable comments if no longer needed

## Benefits of Refactoring

1. **Maintainability**: Single source of truth for focus logic
2. **Reliability**: Proper React patterns, no stale closures
3. **Testability**: Clear separation of concerns, easier to test
4. **Debuggability**: Clear state transitions, easier to trace issues
5. **Performance**: No duplicate focus calls, proper cleanup
6. **Correctness**: Handles all edge cases (disabled state, ref readiness, etc.)

## Risk Mitigation

### Potential Issues

1. **Breaking Changes**: The refactoring changes internal implementation but should maintain the same external API
   - **Mitigation**: Keep the same hook interface, update tests to verify behavior

2. **Timing Issues**: `requestAnimationFrame` might not be sufficient in all cases
   - **Mitigation**: Add fallback with small timeout, test in various scenarios

3. **Focus Conflicts**: User interactions might conflict with auto-focus
   - **Mitigation**: Only focus when input is not already focused, respect user intent

### Rollback Plan

If issues arise:
1. Keep old code in git history
2. Feature flag the new implementation
3. Can revert to old implementation if needed

## Success Criteria

The refactoring is successful when:

1. ✅ All existing tests pass
2. ✅ New comprehensive tests pass
3. ✅ Input focuses on page load when conditions are met
4. ✅ Input focuses when session changes
5. ✅ Input regains focus after being disabled (typing indicator)
6. ✅ No duplicate focus calls
7. ✅ No focus attempts when input is disabled
8. ✅ No focus attempts when conditions are not met
9. ✅ Code is maintainable and well-tested
10. ✅ No eslint-disable comments needed

## Timeline Estimate

- **Phase 1-2**: Create new focus hook (2-3 hours)
- **Phase 3**: Refactor useChatInput (1 hour)
- **Phase 4**: Update ChatInput component (30 minutes)
- **Phase 5**: Update and add tests (2-3 hours)
- **Integration Testing**: (1-2 hours)

**Total**: ~7-10 hours

## Next Steps

1. Review and approve this plan
2. Create feature branch: `refactor/chat-input-focus`
3. Begin implementation starting with Phase 1
4. Regular check-ins to ensure alignment
5. Code review before merging

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Author**: AI Assistant  
**Status**: Draft - Awaiting Review
