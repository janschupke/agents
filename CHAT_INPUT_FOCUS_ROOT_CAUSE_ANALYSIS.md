# Chat Input Focus - Root Cause Analysis & Fix Plan

## Problem Statement

Focus is not working on:
1. Page load
2. Agent change  
3. Session change

## Root Cause Analysis

### The Component Tree

```
ChatAgent
  └─ useChatInput (creates chatInputRef with useRef(null))
      └─ useChatInputFocus (tries to focus using chatInputRef)
  └─ ChatContent
      └─ {!showPlaceholder && <ChatInput ref={chatInputRef} />}
```

### The Core Problem

**React refs don't trigger re-renders when they change.**

When `ChatInput` conditionally renders:
1. `chatInputRef.current` starts as `null`
2. Hook tries to focus → ref is `null` → fails silently
3. `ChatInput` mounts → `useImperativeHandle` sets ref → **but hook doesn't know**
4. Hook has no way to detect ref became available

### Why Previous Approaches Failed

1. **Polling is unreliable**: 
   - Component might mount after polling stops
   - Multiple polling effects conflict
   - Arbitrary timeouts don't guarantee component is ready

2. **State-based triggers miss timing**: 
   - We set `focusTrigger` when conditions change
   - But if ref isn't ready, we poll
   - If component mounts after polling stops, focus never happens

3. **Conditional rendering breaks ref lifecycle**:
   - When `showPlaceholder` is true → `ChatInput` unmounts → ref becomes `null`
   - When `showPlaceholder` becomes false → `ChatInput` mounts → ref becomes available
   - But hook has no way to detect this transition

## The Solution: Callback Ref Pattern

### Approach

Instead of polling or guessing when the ref is ready, use a **callback pattern** where:
1. `ChatInput` calls a callback when it mounts and ref is ready
2. Hook receives the callback and can immediately focus
3. No polling, no guessing, no timing issues

### Implementation

1. **ChatInput**: Add `onRefReady` prop that gets called in `useEffect` when component mounts
2. **Hook**: Provide `handleRefReady` callback that:
   - Updates the ref
   - Checks if focus is needed (based on flags)
   - Focuses immediately if conditions are met
3. **Flow**: Pass callback through component tree (useChatInput → ChatAgent → ChatContent → ChatInput)

### Benefits

- **Reliable**: We know exactly when component is ready
- **No polling**: No arbitrary timeouts or intervals
- **Maintainable**: Clear flow, easy to understand
- **Testable**: Can test with real components

## Implementation Details

### Files Changed

1. **use-chat-input-focus.ts**: 
   - Returns `handleRefReady` callback
   - Uses flags to track when focus is needed
   - Focuses immediately when callback is called

2. **ChatInput.tsx**:
   - Adds `onRefReady` prop
   - Calls it in `useEffect` when component mounts

3. **use-chat-input.ts**:
   - Returns `onRefReady` from hook
   - Passes it through to focus hook

4. **ChatContent.tsx**:
   - Adds `onInputRefReady` prop
   - Passes it to `ChatInput`

5. **ChatAgent.tsx**:
   - Gets `onRefReady` from `useChatInput`
   - Passes it to `ChatContent`

### Focus Triggers

The hook tracks three scenarios:
1. **Initial mount**: `shouldFocusOnMountRef` - set when hook mounts with valid conditions
2. **Session change**: `shouldFocusOnSessionChangeRef` - set when session changes
3. **Typing indicator**: `shouldFocusOnTypingIndicatorRef` - set when typing indicator goes from true to false

When `onRefReady` is called, it checks these flags and focuses if any are set.

### Edge Cases Handled

1. **Component mounts before conditions are met**: Flags are set, focus happens when conditions become valid
2. **Component mounts after conditions are met**: Flags are set, focus happens immediately when callback is called
3. **Component remounts**: New instance calls callback again, flags are checked
4. **Ref already available**: Immediate focus attempt in effects

## Testing Strategy

### Unit Tests (Current)
- Test hook logic with mocked refs
- Verify flags are set correctly
- Verify focus is called when callback is invoked

### Integration Tests (Needed)
- Render actual `ChatInput` component
- Verify focus happens on mount
- Verify focus happens on session change
- Verify focus happens on agent change
- Test conditional rendering scenarios

## Success Criteria

✅ Focus works on page load when conditions are met
✅ Focus works when agent changes
✅ Focus works when session changes  
✅ Focus works when typing indicator resolves
✅ No polling or arbitrary timeouts
✅ No hacks in component code
✅ Tests verify actual behavior
