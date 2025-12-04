-- Add agent_type and language columns to agents table
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "agent_type" VARCHAR(50);
ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "language" VARCHAR(10);

-- Set default for existing agents
UPDATE "agents" SET "agent_type" = 'general' WHERE "agent_type" IS NULL;

-- Add indexes (drop old ones first if they exist, then create new ones)
DROP INDEX IF EXISTS "agents_agent_type_idx";
DROP INDEX IF EXISTS "agents_language_idx";
CREATE INDEX IF NOT EXISTS "idx_agents_agent_type" ON "agents"("agent_type");
CREATE INDEX IF NOT EXISTS "idx_agents_language" ON "agents"("language");
