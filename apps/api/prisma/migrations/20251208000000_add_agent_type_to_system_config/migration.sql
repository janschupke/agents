-- Step 1: Add agent_type column as nullable
ALTER TABLE "system_configs" ADD COLUMN "agent_type" "AgentType";

-- Step 2: Migrate existing data - set agentType to NULL for all existing records (represents "main/default")
-- This ensures existing system_prompt and behavior_rules records are treated as main/default
UPDATE "system_configs" SET "agent_type" = NULL WHERE "agent_type" IS NULL;

-- Step 3: Create index for agent type queries
CREATE INDEX "system_configs_agent_type_idx" ON "system_configs"("agent_type");

-- Step 4: Drop the old unique constraint on configKey only (if it exists)
ALTER TABLE "system_configs" DROP CONSTRAINT IF EXISTS "system_configs_config_key_key";

-- Step 5: Add new unique constraint on configKey + agentType combination
-- Note: NULL values in unique constraints are considered distinct in PostgreSQL,
-- so multiple rows can have the same configKey with agentType = NULL
ALTER TABLE "system_configs" ADD CONSTRAINT "system_configs_config_key_agent_type_key" UNIQUE ("config_key", "agent_type");
