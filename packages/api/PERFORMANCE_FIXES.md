# Database Performance Fixes

## Critical Issues Found

### 1. Transaction Overhead (100-120ms per query)
**Problem**: Every query is wrapped in BEGIN/COMMIT transactions, adding 100-120ms overhead.

**Root Cause**: Database connection pooler (likely Neon/Supabase) is in transaction pooling mode.

**Solution**: 
- Use **session pooling** connection URL instead of transaction pooling
- For Neon: Use `?pgbouncer=true` or the pooled connection URL
- For Supabase: Use the connection pooler URL (port 6543) instead of direct connection

### 2. DEALLOCATE ALL Queries (100-120ms)
**Problem**: Prepared statements are being deallocated after each query.

**Solution**: 
- Added `statement_cache_size=250` to connection string
- This keeps prepared statements cached, reducing DEALLOCATE overhead

### 3. Slow Query Execution (200-600ms)
**Problem**: Individual queries are slow, likely due to network latency.

**Solutions**:
- Optimize connection string (already done)
- Use connection pooler URL for reduced latency
- Consider query result caching for frequently accessed data
- Batch related queries where possible

## Connection String Configuration

### For Neon Database:
```env
# Use pooled connection (session pooling)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/dbname?sslmode=require"

# Or add pgbouncer parameter
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?pgbouncer=true&sslmode=require"
```

### For Supabase:
```env
# RECOMMENDED: Use direct connection (port 5432) for best performance
# This avoids transaction overhead and enables prepared statements
# PrismaService will automatically use DIRECT_URL if set
DIRECT_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres?sslmode=require"

# Fallback: Use connection pooler (port 6543) if DIRECT_URL not set
# The pgbouncer=true parameter is REQUIRED to tell Prisma to disable prepared statements
# Trade-off: Transaction overhead (BEGIN/COMMIT) but works correctly
DATABASE_URL="postgresql://postgres:pass@pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
```

**Note**: The application now prefers `DIRECT_URL` for regular queries. Set `DIRECT_URL` to use the direct connection (port 5432) for optimal performance. The `DATABASE_URL` is only used as a fallback.

### For Other Providers:
- Use session pooling mode if available
- Avoid transaction pooling mode which causes BEGIN/COMMIT overhead

## Code Optimizations Applied

1. **Connection String Optimization**:
   - Removed conflicting pool parameters
   - Added `statement_cache_size=250`
   - Added `application_name` for monitoring

2. **Repository Query Optimizations**:
   - Use `select` to limit fields returned
   - Use `reduce` instead of `for` loops for mapping
   - Optimize index usage with proper where clauses

## Expected Performance Improvements

- **Transaction overhead**: Should reduce from 100-120ms to <10ms per query
- **DEALLOCATE overhead**: Should reduce from 100-120ms to <5ms per query
- **Total query time**: Should reduce from 200-600ms to 50-200ms per query
- **getChatHistory**: Should reduce from 1.7-1.8s to <500ms
- **getEmbeddings**: Should reduce from ~2s to <500ms

## Next Steps

1. **Update DATABASE_URL** to use connection pooler URL (session pooling mode)
2. **Monitor performance** after changes
3. **Consider adding query result caching** for frequently accessed data (bots, configs)
4. **Consider using Prisma's `$transaction`** for related queries to reduce round trips

## Monitoring

After applying fixes, monitor:
- Query execution times
- Transaction overhead (should be minimal)
- DEALLOCATE queries (should be rare)
- Total request times

Use the existing performance logging to track improvements.
