# Chat Scroll and Pagination Fix Plan

## Current Issues

1. **Scroll to bottom on load**: Works but logic is scattered
2. **Scroll on new messages**: Works but has edge cases
3. **Load older messages**: Only loads once, doesn't continue until no more messages
4. **Code organization**: Multiple competing effects, unclear separation of concerns

## Architecture Analysis

### Backend Pagination
- Returns messages in **chronological order** (oldest first) per page
- Initial load: Gets newest 20 messages, reverses to oldest first
- Pagination: Gets messages with `id < cursor` (older), reverses to oldest first
- Returns `hasMore: boolean` to indicate if more messages exist

### Frontend Infinite Query
- Pages stored in order: `pages[0]` = newest 20, `pages[1]` = next 20 older, etc.
- Each page has messages in chronological order (oldest to newest within page)
- `getNextPageParam`: Uses oldest message ID from last page as cursor
- `hasNextPage`: Determined by `getNextPageParam` return value

### Message Combination
- Currently: Concatenates pages in order
- Result: All messages in chronological order (oldest to newest)

## Proper Solution

### Separation of Concerns

1. **Scroll to Bottom on Initial Load**
   - Trigger: When messages first appear (initial load)
   - Action: Scroll container to bottom immediately
   - Reset: When sessionId changes

2. **Scroll to Bottom on New Messages**
   - Trigger: When message count increases AND user is near bottom
   - Action: Smooth scroll to bottom
   - Condition: Only if user is within 200px of bottom

3. **Load Older Messages on Scroll Up**
   - Trigger: User scrolls to top (within 200px of top)
   - Action: Load next page
   - Continuous: After load completes, if still at top AND hasMore, load again
   - Stop: When hasMore is false OR user scrolls away from top

4. **Preserve Scroll Position**
   - Trigger: When new page is added (page count increases)
   - Action: Adjust scrollTop to maintain visual position
   - Timing: After DOM updates

### Implementation Strategy

```typescript
// Effect 1: Initial scroll to bottom
useEffect(() => {
  if (isInitialLoad && messages.length > 0 && container) {
    container.scrollTop = container.scrollHeight;
    isInitialLoad = false;
  }
}, [messages.length, isInitialLoad]);

// Effect 2: Scroll on new messages (if near bottom)
useEffect(() => {
  if (isNewMessage && container && isNearBottom) {
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }
}, [messages.length, isNearBottom]);

// Effect 3: Load older messages on scroll up
useEffect(() => {
  const handleScroll = debounce(() => {
    if (isNearTop && hasNextPage && !isFetchingNextPage) {
      loadMore();
    }
  }, 100);
  
  container.addEventListener('scroll', handleScroll);
  return () => container.removeEventListener('scroll', handleScroll);
}, [hasNextPage, isFetchingNextPage]);

// Effect 4: Preserve scroll position + continuous loading
useEffect(() => {
  if (pageCountIncreased && previousScrollHeight > 0) {
    // Preserve position
    const heightDiff = currentScrollHeight - previousScrollHeight;
    container.scrollTop += heightDiff;
    
    // Check if still at top and should continue loading
    requestAnimationFrame(() => {
      if (isNearTop && hasNextPage && !isFetchingNextPage) {
        loadMore(); // This will trigger again if still at top
      }
    });
  }
}, [data?.pages?.length, hasNextPage]);
```

## Test Plan

### use-chat-scroll.test.tsx
1. ✅ Scrolls to bottom on initial load
2. ✅ Scrolls to bottom on new message if user is near bottom
3. ✅ Does NOT scroll on new message if user is scrolled up
4. ✅ Does NOT scroll when loading older messages
5. ✅ Resets on sessionId change

### use-chat-messages.test.tsx
1. ✅ Loads initial messages
2. ✅ Combines pages correctly (chronological order)
3. ✅ Loads older messages when scrolling to top
4. ✅ Continues loading until hasMore is false
5. ✅ Stops loading when user scrolls away from top
6. ✅ Preserves scroll position when loading older messages
7. ✅ Handles sendMessage correctly

## Implementation Steps

1. Refactor `use-chat-scroll.ts`: Simplify to only handle scroll-to-bottom logic
2. Refactor `use-chat-messages.ts`: Separate concerns into clear effects
3. Implement continuous loading: Load until hasMore is false when at top
4. Write comprehensive tests for both hooks
5. Verify edge cases and fix any issues
