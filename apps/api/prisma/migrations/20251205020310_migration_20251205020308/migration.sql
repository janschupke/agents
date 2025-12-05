-- DropIndex
DROP INDEX "system_configs_config_key_key";

-- AlterTable
ALTER TABLE "system_configs" ADD COLUMN     "agent_type" "AgentType";

-- CreateIndex
CREATE INDEX "system_configs_agent_type_idx" ON "system_configs"("agent_type");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_config_key_agent_type_key" ON "system_configs"("config_key", "agent_type");
