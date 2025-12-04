# Agent Config Schema Refactoring Plan

## Problem Statement

The current JSONB key-value approach for storing agent configs has several maintainability issues:

1. **Performance**: Each config update requires N database operations (one upsert per config key)
2. **Type Safety**: No database-level validation or type checking
3. **Queryability**: Cannot efficiently query/filter agents by config values
4. **Indexing**: Cannot create indexes on specific config fields
5. **Constraints**: Cannot enforce foreign keys, check constraints, or defaults at DB level
6. **Schema Clarity**: Database schema doesn't document the actual structure

## Proposed Solution

### Option 1: Add Config Fields to Agent Table (Recommended)

**Pros:**
- Single table, simpler queries
- All agent data in one place
- Better performance (single update operation)
- Can index and query directly
- Type safety at DB level

**Cons:**
- Agent table grows larger
- Mixes core agent data with config data

### Option 2: Create Dedicated AgentConfig Table with Typed Columns

**Pros:**
- Separates concerns (agent metadata vs config)
- Cleaner schema organization
- Can still join efficiently
- Single row per agent (better than current N rows)

**Cons:**
- Requires JOIN for full agent data
- Slightly more complex queries

## Recommended Approach: Option 1 (Add to Agent Table)

Since these configs are core to the agent's behavior and always loaded together, adding them to the `Agent` table makes the most sense.

### Migration Strategy

1. **Add new columns to `agents` table** (all nullable for backward compatibility)
2. **Migrate existing data** from `agent_configs` JSONB to new columns
3. **Update application code** to use new columns
4. **Keep `agent_configs` table** for backward compatibility during transition
5. **Remove `agent_configs` table** in future migration (after verification)

### Schema Changes

```prisma
model Agent {
  id          Int           @id @default(autoincrement())
  userId      String        @map("user_id")
  name        String
  description String?
  avatarUrl   String?       @map("avatar_url")
  agentType   String?       @map("agent_type")
  language    String?
  
  // Config fields (new)
  temperature      Float?      // 0-2
  systemPrompt     String?     @map("system_prompt") @db.Text
  behaviorRules    Json?       @map("behavior_rules")
  model            String?
  maxTokens        Int?        @map("max_tokens")
  responseLength   String?     @map("response_length") // enum: 'short' | 'standard' | 'long' | 'adapt'
  age              Int?        // 0-100
  gender           String?      // enum: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say'
  personality      String?
  sentiment        String?     // enum: 'neutral' | 'engaged' | 'friendly' | 'attracted' | 'obsessed' | 'disinterested' | 'angry'
  interests        Json?       // Array of strings
  availability     String?     // enum: 'available' | 'standard' | 'busy'
  
  createdAt   DateTime      @default(now()) @map("created_at")
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  configs     AgentConfig[] // Keep for backward compatibility
  sessions    ChatSession[]
  memories    AgentMemory[]
  savedWords  SavedWord[]

  @@index([userId])
  @@index([agentType])
  @@index([language])
  @@index([responseLength]) // Can now index config fields!
  @@index([age])
  @@index([sentiment])
  @@map("agents")
}
```

### Migration SQL

```sql
-- Step 1: Add new columns (all nullable)
ALTER TABLE agents ADD COLUMN temperature FLOAT CHECK (temperature >= 0 AND temperature <= 2);
ALTER TABLE agents ADD COLUMN system_prompt TEXT;
ALTER TABLE agents ADD COLUMN behavior_rules JSONB;
ALTER TABLE agents ADD COLUMN model VARCHAR(255);
ALTER TABLE agents ADD COLUMN max_tokens INTEGER CHECK (max_tokens >= 1);
ALTER TABLE agents ADD COLUMN response_length VARCHAR(20) CHECK (response_length IN ('short', 'standard', 'long', 'adapt'));
ALTER TABLE agents ADD COLUMN age INTEGER CHECK (age >= 0 AND age <= 100);
ALTER TABLE agents ADD COLUMN gender VARCHAR(50) CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say'));
ALTER TABLE agents ADD COLUMN personality VARCHAR(255);
ALTER TABLE agents ADD COLUMN sentiment VARCHAR(50) CHECK (sentiment IN ('neutral', 'engaged', 'friendly', 'attracted', 'obsessed', 'disinterested', 'angry'));
ALTER TABLE agents ADD COLUMN interests JSONB; -- Array of strings
ALTER TABLE agents ADD COLUMN availability VARCHAR(20) CHECK (availability IN ('available', 'standard', 'busy'));

-- Step 2: Migrate existing data from agent_configs
UPDATE agents a
SET 
  temperature = (ac.config_value::text::float)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'temperature';

UPDATE agents a
SET 
  system_prompt = (ac.config_value::text)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'system_prompt';

UPDATE agents a
SET 
  behavior_rules = ac.config_value
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'behavior_rules';

UPDATE agents a
SET 
  model = (ac.config_value::text)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'model';

UPDATE agents a
SET 
  max_tokens = (ac.config_value::text::integer)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'max_tokens';

UPDATE agents a
SET 
  response_length = (ac.config_value::text)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'response_length';

UPDATE agents a
SET 
  age = (ac.config_value::text::integer)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'age';

UPDATE agents a
SET 
  gender = (ac.config_value::text)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'gender';

UPDATE agents a
SET 
  personality = (ac.config_value::text)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'personality';

UPDATE agents a
SET 
  sentiment = (ac.config_value::text)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'sentiment';

UPDATE agents a
SET 
  interests = ac.config_value
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'interests';

UPDATE agents a
SET 
  availability = (ac.config_value::text)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'availability';

-- Step 3: Create indexes for queryability
CREATE INDEX idx_agents_response_length ON agents(response_length);
CREATE INDEX idx_agents_age ON agents(age);
CREATE INDEX idx_agents_sentiment ON agents(sentiment);
CREATE INDEX idx_agents_gender ON agents(gender);
CREATE INDEX idx_agents_personality ON agents(personality);
```

### Code Changes Required

1. **Update Prisma Schema** - Add new columns to Agent model
2. **Update AgentRepository** - Change `updateConfigs` to single UPDATE instead of N upserts
3. **Update AgentService** - Use new columns directly
4. **Update DTOs** - No changes needed (already typed)
5. **Update ConfigurationRulesService** - Read from agent columns instead of configs object
6. **Migration Script** - Data migration from JSONB to columns

### Benefits After Migration

1. **Performance**: Single UPDATE instead of N upserts
2. **Type Safety**: Database enforces types and constraints
3. **Queryability**: Can query `SELECT * FROM agents WHERE age > 25 AND sentiment = 'friendly'`
4. **Indexing**: Can create indexes on frequently queried fields
5. **Maintainability**: Schema documents the structure clearly
6. **Validation**: CHECK constraints enforce valid values at DB level

### Backward Compatibility

- Keep `agent_configs` table during transition
- Read from new columns, fallback to `agent_configs` if null
- Write to both during transition period
- Remove `agent_configs` after verification

## Alternative: Hybrid Approach

Keep JSONB for truly dynamic/custom configs, but use typed columns for well-defined fields:

- **Typed columns**: temperature, age, gender, personality, sentiment, etc. (well-defined)
- **JSONB field**: `custom_configs` for future extensibility

This gives us the best of both worlds.
