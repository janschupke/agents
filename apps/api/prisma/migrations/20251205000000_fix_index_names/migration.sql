-- This migration fixes index names if they were created with wrong names
-- It's safe to run multiple times as it checks for existence first
DO $$
BEGIN
  -- Rename agent_type index if it exists with old name
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'agents_agent_type_idx' AND schemaname = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agents_agent_type' AND schemaname = 'public') THEN
      ALTER INDEX "agents_agent_type_idx" RENAME TO "idx_agents_agent_type";
    ELSE
      -- If new index exists, drop the old one
      DROP INDEX IF EXISTS "agents_agent_type_idx";
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  -- Rename language index if it exists with old name
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'agents_language_idx' AND schemaname = 'public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agents_language' AND schemaname = 'public') THEN
      ALTER INDEX "agents_language_idx" RENAME TO "idx_agents_language";
    ELSE
      -- If new index exists, drop the old one
      DROP INDEX IF EXISTS "agents_language_idx";
    END IF;
  END IF;
END $$;
