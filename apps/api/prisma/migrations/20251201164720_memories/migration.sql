/*
  Warnings:

  - You are about to drop the `memory_chunks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "memory_chunks" DROP CONSTRAINT "memory_chunks_session_id_fkey";

-- DropTable
DROP TABLE "memory_chunks";

-- CreateTable
CREATE TABLE "agent_memories" (
    "id" SERIAL NOT NULL,
    "bot_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "key_point" TEXT NOT NULL,
    "context" JSONB,
    "vector_embedding" vector(1536),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "update_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "agent_memories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_memories_bot_id_user_id_idx" ON "agent_memories"("bot_id", "user_id");

-- CreateIndex
CREATE INDEX "agent_memories_bot_id_user_id_created_at_idx" ON "agent_memories"("bot_id", "user_id", "created_at" DESC);

-- AddForeignKey (handle both bots and agents table names)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_memories_bot_id_fkey') THEN
      ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bots') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_memories_bot_id_fkey') THEN
      ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- AddForeignKey
ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
