-- DropIndex (only if it exists)
DROP INDEX IF EXISTS "agent_configs_agent_id_idx";
DROP INDEX IF EXISTS "bot_configs_agent_id_idx";
DROP INDEX IF EXISTS "bot_configs_bot_id_idx";

-- AlterTable (only if constraints exist and table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_configs') THEN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bot_configs_pkey') THEN
      ALTER TABLE "agent_configs" RENAME CONSTRAINT "bot_configs_pkey" TO "agent_configs_pkey";
    END IF;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bot_configs') THEN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bot_configs_pkey') THEN
      ALTER TABLE "bot_configs" RENAME CONSTRAINT "bot_configs_pkey" TO "agent_configs_pkey";
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents') THEN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bots_pkey') THEN
      ALTER TABLE "agents" RENAME CONSTRAINT "bots_pkey" TO "agents_pkey";
    END IF;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bots') THEN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bots_pkey') THEN
      ALTER TABLE "bots" RENAME CONSTRAINT "bots_pkey" TO "agents_pkey";
    END IF;
  END IF;
END $$;

-- RenameForeignKey (only if it exists and table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents') THEN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bots_user_id_fkey') THEN
      ALTER TABLE "agents" RENAME CONSTRAINT "bots_user_id_fkey" TO "agents_user_id_fkey";
    END IF;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bots') THEN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bots_user_id_fkey') THEN
      ALTER TABLE "bots" RENAME CONSTRAINT "bots_user_id_fkey" TO "agents_user_id_fkey";
    END IF;
  END IF;
END $$;

-- RenameIndex (only if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'bots_user_id_idx') THEN
    ALTER INDEX "bots_user_id_idx" RENAME TO "agents_user_id_idx";
  END IF;
END $$;
