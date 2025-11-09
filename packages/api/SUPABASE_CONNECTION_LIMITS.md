# Supabase Connection Limits Guide

## Understanding Connection Limits

When choosing between **pooler connection (port 6543)** and **direct connection (port 5432)**, you need to consider your Supabase plan's connection limits.

## Supabase Connection Limits by Plan

### Free Plan
- **Direct connections (port 5432)**: 60 connections max
- **Pooler connections (port 6543)**: 200 connections max (shared pool)
- **Recommendation**: Use pooler (port 6543) to avoid hitting limits

### Pro Plan
- **Direct connections (port 5432)**: 200 connections max
- **Pooler connections (port 6543)**: 200 connections max (shared pool)
- **Recommendation**: Can use direct connection if you have <200 concurrent connections

### Team Plan
- **Direct connections (port 5432)**: 400 connections max
- **Pooler connections (port 6543)**: 200 connections max (shared pool)
- **Recommendation**: Can use direct connection if you have <400 concurrent connections

### Enterprise Plan
- **Direct connections (port 5432)**: Custom (contact Supabase)
- **Pooler connections (port 6543)**: Custom
- **Recommendation**: Use direct connection for best performance

## How to Check Your Current Plan

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **Billing** or **Project Settings**
3. Check your current plan tier

## How to Monitor Connection Usage

### Option 1: Supabase Dashboard
1. Go to **Database** → **Connection Pooling**
2. View current connection usage
3. Check for connection limit warnings

### Option 2: Query Database Directly
Run this SQL query in Supabase SQL Editor:

```sql
SELECT 
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active_connections,
  count(*) FILTER (WHERE state = 'idle') as idle_connections
FROM pg_stat_activity
WHERE datname = current_database();
```

### Option 3: Check Prisma Connection Pool
Prisma uses a connection pool internally. Check your Prisma logs for connection-related errors:
- `too many connections` errors
- Connection timeout errors
- Connection pool exhaustion warnings

## Prisma Connection Pool Behavior

Prisma maintains its own connection pool:
- **Default pool size**: ~10 connections per PrismaClient instance
- **Max connections**: Limited by your Supabase plan
- **Connection reuse**: Prisma reuses connections efficiently

## Decision Matrix

### Use Pooler (port 6543) if:
- ✅ You're on Free plan
- ✅ You have many concurrent requests
- ✅ You're unsure about connection limits
- ✅ You want to avoid connection limit issues
- ⚠️ Trade-off: Transaction overhead (100-120ms per query)

### Use Direct Connection (port 5432) if:
- ✅ You're on Pro/Team/Enterprise plan
- ✅ You have <200 concurrent connections (Pro) or <400 (Team)
- ✅ You want better performance (no transaction overhead)
- ✅ You can monitor connection usage
- ⚠️ Risk: May hit connection limits under high load

## How to Test Your Connection Usage

1. **Monitor during peak usage**:
   - Check connection count during your busiest times
   - Look for patterns (morning rush, API spikes, etc.)

2. **Calculate your needs**:
   - Each PrismaClient instance uses ~10 connections
   - If you have multiple instances (dev, staging, prod), multiply accordingly
   - Add buffer for migrations, admin tools, etc.

3. **Test with direct connection**:
   - Temporarily switch to port 5432
   - Monitor for "too many connections" errors
   - Check connection count in Supabase dashboard

## Example Calculation

If you have:
- 1 production server (10 connections)
- 1 staging server (10 connections)
- Prisma migrations (5 connections)
- Admin tools (5 connections)
- **Total**: ~30 connections

**Verdict**: Safe to use direct connection (port 5432) even on Free plan (60 limit)

## Warning Signs You're Hitting Limits

- `FATAL: remaining connection slots are reserved for non-replication superuser connections`
- `too many connections` errors in logs
- Connection timeouts
- Queries failing with connection errors
- Supabase dashboard showing connection warnings

## Recommendation for Your Setup

Based on typical NestJS + Prisma setup:

1. **Start with pooler (port 6543)** - It's safer and works correctly
2. **Monitor connection usage** - Check Supabase dashboard regularly
3. **If you're well under limits** - Consider switching to direct (port 5432) for better performance
4. **If you see connection errors** - Switch back to pooler immediately

## Current Status

Your current setup uses:
- **Pooler connection**: `pooler.supabase.com:6543`
- **With pgbouncer=true**: Required for Prisma compatibility
- **Status**: ✅ Working correctly, but has transaction overhead

To switch to direct connection for better performance:
```env
DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres?sslmode=require"
```

**Note**: Remove `pgbouncer=true` when using direct connection (port 5432).
