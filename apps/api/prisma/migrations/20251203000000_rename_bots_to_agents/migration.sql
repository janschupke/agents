-- Rename tables (only if they exist with old names)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bots') THEN
    ALTER TABLE "bots" RENAME TO "agents";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bot_configs') THEN
    ALTER TABLE "bot_configs" RENAME TO "agent_configs";
  END IF;
END $$;

-- Rename columns (only if they exist with old names)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_configs' AND column_name = 'bot_id'
  ) THEN
    ALTER TABLE "agent_configs" RENAME COLUMN "bot_id" TO "agent_id";
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_sessions' AND column_name = 'bot_id'
  ) THEN
    ALTER TABLE "chat_sessions" RENAME COLUMN "bot_id" TO "agent_id";
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_memories' AND column_name = 'bot_id'
  ) THEN
    ALTER TABLE "agent_memories" RENAME COLUMN "bot_id" TO "agent_id";
  END IF;
END $$;

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
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_configs_agent_id_config_key_key') THEN
    ALTER TABLE IF EXISTS "agent_configs" ADD CONSTRAINT "agent_configs_agent_id_config_key_key" UNIQUE ("agent_id", "config_key");
  END IF;
END $$;

-- Rename foreign key constraints
ALTER TABLE IF EXISTS "agent_configs" DROP CONSTRAINT IF EXISTS "bot_configs_bot_id_fkey";
ALTER TABLE IF EXISTS "agent_configs" ADD CONSTRAINT "agent_configs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "chat_sessions" DROP CONSTRAINT IF EXISTS "chat_sessions_bot_id_fkey";
ALTER TABLE IF EXISTS "chat_sessions" ADD CONSTRAINT "chat_sessions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS "agent_memories" DROP CONSTRAINT IF EXISTS "agent_memories_bot_id_fkey";
ALTER TABLE IF EXISTS "agent_memories" ADD CONSTRAINT "agent_memories_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
