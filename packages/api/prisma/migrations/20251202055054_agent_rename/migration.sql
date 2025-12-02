-- DropIndex
DROP INDEX "agent_configs_agent_id_idx";

-- AlterTable
ALTER TABLE "agent_configs" RENAME CONSTRAINT "bot_configs_pkey" TO "agent_configs_pkey";

-- AlterTable
ALTER TABLE "agents" RENAME CONSTRAINT "bots_pkey" TO "agents_pkey";

-- RenameForeignKey
ALTER TABLE "agents" RENAME CONSTRAINT "bots_user_id_fkey" TO "agents_user_id_fkey";

-- RenameIndex
ALTER INDEX "bots_user_id_idx" RENAME TO "agents_user_id_idx";
