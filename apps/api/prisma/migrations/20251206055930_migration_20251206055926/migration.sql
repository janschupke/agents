-- AlterTable
ALTER TABLE "agent_archetypes" DROP COLUMN "behavior_rules",
DROP COLUMN "system_prompt";

-- AlterTable
ALTER TABLE "agents" DROP COLUMN "behavior_rules",
DROP COLUMN "system_prompt";
