# Memory Empty Array Debug Fix

## Issue
Memory refetch returns empty array `[]` for agent with 30+ messages, even though memories should be created every 10 messages.

## Root Cause Analysis

### Potential Issues Identified

1. **SQL Query LIMIT Parameterization Issue** (FIXED)
   - The `findAllByAgentId` method was using string interpolation for the LIMIT clause
   - This could cause SQL syntax errors or unexpected behavior
   - **Fixed**: Now properly parameterizes LIMIT using `$3` parameter

2. **Missing Debug Logging**
   - No visibility into what's being queried or returned
   - **Fixed**: Added debug logging to repository and controller

3. **Possible User ID Mismatch**
   - Memories are stored with `userId` from authenticated user
   - If user ID changes or doesn't match, query returns empty array
   - **Need to verify**: Check logs to see what user ID is being queried vs stored

4. **Memory Summarization Side Effects**
   - Summarization deletes old memories and creates new summarized ones
   - If summarization fails or returns empty summary, memories could be deleted without replacement
   - **Need to verify**: Check if summarization is running and if it's deleting memories

5. **Memory Creation Failures**
   - Memories might not be created if:
     - No insights extracted (`extractKeyInsights` returns empty array)
     - Embedding generation fails
     - Database insert fails (silently caught)
   - **Need to verify**: Check backend logs for memory creation errors

## Fixes Applied

### 1. Fixed SQL Query Parameterization

**File**: `apps/api/src/memory/agent-memory.repository.ts`

**Before**:
```typescript
`SELECT ... WHERE agent_id = $1 AND user_id = $2
 ORDER BY created_at DESC
 ${limit ? `LIMIT ${limit}` : ''}`,
 agentId,
 userId
```

**After**:
```typescript
let query = `SELECT ... WHERE agent_id = $1 AND user_id = $2
             ORDER BY created_at DESC`;
const params: unknown[] = [agentId, userId];

if (limit && limit > 0) {
  query += ` LIMIT $3`;
  params.push(limit);
}

await this.prisma.$queryRawUnsafe<...>(query, ...params);
```

**Why**: String interpolation in SQL queries can cause syntax errors and is a security risk. Proper parameterization ensures the query is safe and correctly executed.

### 2. Added Debug Logging

**Files**: 
- `apps/api/src/memory/agent-memory.repository.ts`
- `apps/api/src/memory/agent-memory.controller.ts`

**Added logging**:
- Log when query starts (agentId, userId, limit)
- Log number of memories found
- Log number of memories returned

**Example logs**:
```
[AgentMemoryRepository] Finding memories for agent 1, user user-123, limit: none
[AgentMemoryRepository] Found 5 memories for agent 1, user user-123
[AgentMemoryController] Returning 5 memories for agent 1, user user-123
```

## Next Steps for Debugging

### 1. Check Backend Logs

When you fetch memories, check the backend logs for:
- What agentId and userId are being queried
- How many memories are found in the database
- Any errors during the query

**Command to check logs**:
```bash
# If using Docker
docker-compose logs -f api | grep -i memory

# Or check application logs directly
```

### 2. Verify Memories Exist in Database

Run a direct database query to verify memories exist:

```sql
SELECT COUNT(*), agent_id, user_id 
FROM agent_memories 
WHERE agent_id = <your_agent_id>
GROUP BY agent_id, user_id;
```

**Expected**: Should show count > 0 for the agent

### 3. Check User ID Consistency

Verify that:
- The `userId` used when creating memories matches the `userId` used when querying
- Check if user authentication is working correctly
- Verify the `@User()` decorator is returning the correct user ID

**Check in logs**:
- When memories are created: `Created memory for agent X, user Y`
- When memories are queried: `Getting memories for agent X, user Y`
- These should match!

### 4. Check Memory Creation Logs

Look for logs indicating memories are being created:
- `Saved memories for agent X, session Y (N messages)`
- `Created memory for agent X, user Y: [insight]...`
- `No insights extracted, skipping memory creation`

**If you see "No insights extracted"**: The memory extraction service might not be finding insights. This could be due to:
- Messages not being substantial enough
- OpenAI API issues
- Extraction prompt issues

### 5. Check Memory Summarization

Look for summarization logs:
- `Starting memory summarization for agent X, user Y`
- `Summarized N memories into: [summary]...`

**If summarization is running**: Check if it's deleting memories without creating replacements. This could happen if:
- Summarization fails silently
- Summary generation returns empty string
- Embedding generation fails after summarization

### 6. Test Direct API Call

Test the API endpoint directly to see what it returns:

```bash
curl -X GET "http://localhost:3001/api/agents/<agentId>/memories" \
  -H "Authorization: Bearer <your-token>"
```

Check:
- Response status (should be 200)
- Response body (should contain memories array)
- Backend logs for the query

## Expected Behavior After Fix

1. **SQL Query**: Should execute correctly with proper parameterization
2. **Logging**: Should show detailed information about queries and results
3. **Empty Array**: If still getting empty array, logs will show why:
   - No memories found in database (user ID mismatch?)
   - Query error (check logs)
   - Memories exist but for different user ID

## Verification Checklist

- [ ] Backend logs show memory queries with correct agentId and userId
- [ ] Backend logs show number of memories found
- [ ] Database query confirms memories exist for the agent/user
- [ ] User ID in creation logs matches user ID in query logs
- [ ] No SQL errors in backend logs
- [ ] Memory creation logs show memories being created
- [ ] Summarization logs (if any) show proper behavior

## If Issue Persists

If memories still return empty array after this fix:

1. **Check Database Directly**: Verify memories exist in `agent_memories` table
2. **Check User ID**: Verify the authenticated user ID matches the user ID stored with memories
3. **Check Memory Creation**: Verify memories are actually being created (check logs)
4. **Check Summarization**: Verify summarization isn't deleting all memories
5. **Check Extraction**: Verify memory extraction is finding insights

## Related Files

- `apps/api/src/memory/agent-memory.repository.ts` - Fixed SQL query
- `apps/api/src/memory/agent-memory.controller.ts` - Added logging
- `apps/api/src/memory/agent-memory.service.ts` - Memory creation logic
- `apps/api/src/chat/chat.service.ts` - Memory creation trigger
