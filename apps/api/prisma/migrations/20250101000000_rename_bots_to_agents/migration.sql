-- Rename tables
ALTER TABLE IF EXISTS "bots" RENAME TO "agents";
ALTER TABLE IF EXISTS "bot_configs" RENAME TO "agent_configs";

-- Rename columns
ALTER TABLE IF EXISTS "agent_configs" RENAME COLUMN "bot_id" TO "agent_id";
ALTER TABLE IF EXISTS "chat_sessions" RENAME COLUMN "bot_id" TO "agent_id";
ALTER TABLE IF EXISTS "agent_memories" RENAME COLUMN "bot_id" TO "agent_id";

-- Rename indexes
DROP INDEX IF EXISTS "bot_configs_bot_id_idx";
CREATE INDEX IF NOT EXISTS "agent_configs_agent_id_idx" ON "agent_configs"("agent_id");

DROP INDEX IF EXISTS "chat_sessions_bot_id_idx";
CREATE INDEX IF NOT EXISTS "chat_sessions_agent_id_idx" ON "chat_sessions"("agent_id");

DROP INDEX IF EXISTS "agent_memories_bot_id_user_id_idx";
CREATE INDEX IF NOT EXISTS "agent_memories_agent_id_user_id_idx" ON "agent_memories"("agent_id", "user_id");

DROP INDEX IF EXISTS "agent_memories_bot_id_user_id_created_at_idx";
CREATE INDEX IF NOT EXISTS "agent_memories_agent_id_user_id_created_at_idx" ON "agent_memories"("agent_id", "user_id", "created_at" DESC);

-- Rename unique constraints
ALTER TABLE IF EXISTS "agent_configs" DROP CONSTRAINT IF EXISTS "bot_configs_bot_id_config_key_key";
ALTER TABLE IF EXISTS "agent_configs" ADD CONSTRAINT "agent_configs_agent_id_config_key_key" UNIQUE ("agent_id", "config_key");

-- Rename foreign key constraints (PostgreSQL will handle this automatically, but we can be explicit)
-- Note: Foreign key constraint names are auto-generated, so we may need to drop and recreate
-- This is handled by Prisma migrations, so we'll let Prisma handle it
