-- AlterTable
ALTER TABLE "system_configs" ADD COLUMN "agent_type" "AgentType";

-- CreateIndex
CREATE INDEX "system_configs_agent_type_idx" ON "system_configs"("agent_type");

-- Drop the old unique constraint on configKey only
ALTER TABLE "system_configs" DROP CONSTRAINT IF EXISTS "system_configs_config_key_key";

-- Add new unique constraint on configKey + agentType combination
ALTER TABLE "system_configs" ADD CONSTRAINT "system_configs_config_key_agent_type_key" UNIQUE ("config_key", "agent_type");
