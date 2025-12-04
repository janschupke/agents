/*
  Warnings:

  - The `vector` column on the `memory_chunks` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX IF EXISTS "bot_configs_bot_id_idx";
DROP INDEX IF EXISTS "agent_configs_agent_id_idx";
DROP INDEX IF EXISTS "agent_configs_bot_id_idx";

-- DropIndex
DROP INDEX "idx_memory_chunks_vector_embedding";

-- AlterTable
ALTER TABLE "memory_chunks" DROP COLUMN "vector",
ADD COLUMN     "vector" real[];
