-- Rename tables
ALTER TABLE IF EXISTS "bots" RENAME TO "agents";
ALTER TABLE IF EXISTS "bot_configs" RENAME TO "agent_configs";

-- Rename columns (only if table and column exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_configs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_configs' AND column_name = 'bot_id') THEN
      ALTER TABLE "agent_configs" RENAME COLUMN "bot_id" TO "agent_id";
    END IF;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bot_configs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bot_configs' AND column_name = 'bot_id') THEN
      ALTER TABLE "bot_configs" RENAME COLUMN "bot_id" TO "agent_id";
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'bot_id') THEN
    ALTER TABLE "chat_sessions" RENAME COLUMN "bot_id" TO "agent_id";
  END IF;
END $$;

-- Note: agent_memories table is created later, so we don't rename its columns here
-- The rename will be handled in a later migration (20251203000000_rename_bots_to_agents)

-- Rename indexes
DROP INDEX IF EXISTS "bot_configs_bot_id_idx";
CREATE INDEX IF NOT EXISTS "agent_configs_agent_id_idx" ON "agent_configs"("agent_id");

DROP INDEX IF EXISTS "chat_sessions_bot_id_idx";
CREATE INDEX IF NOT EXISTS "chat_sessions_agent_id_idx" ON "chat_sessions"("agent_id");

-- Note: agent_memories indexes are created later with the table, so we don't handle them here

-- Rename unique constraints
ALTER TABLE IF EXISTS "agent_configs" DROP CONSTRAINT IF EXISTS "bot_configs_bot_id_config_key_key";
ALTER TABLE IF EXISTS "agent_configs" ADD CONSTRAINT "agent_configs_agent_id_config_key_key" UNIQUE ("agent_id", "config_key");

-- Rename foreign key constraints (PostgreSQL will handle this automatically, but we can be explicit)
-- Note: Foreign key constraint names are auto-generated, so we may need to drop and recreate
-- This is handled by Prisma migrations, so we'll let Prisma handle it
