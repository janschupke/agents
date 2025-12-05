-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('MESSAGE', 'MEMORY', 'TRANSLATION');

-- AlterTable
ALTER TABLE "ai_request_logs" ADD COLUMN     "agent_id" INTEGER,
ADD COLUMN     "log_type" "LogType" NOT NULL DEFAULT 'MESSAGE';

-- CreateIndex
CREATE INDEX "ai_request_logs_agent_id_idx" ON "ai_request_logs"("agent_id");

-- CreateIndex
CREATE INDEX "ai_request_logs_log_type_idx" ON "ai_request_logs"("log_type");

-- AddForeignKey
ALTER TABLE "ai_request_logs" ADD CONSTRAINT "ai_request_logs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
