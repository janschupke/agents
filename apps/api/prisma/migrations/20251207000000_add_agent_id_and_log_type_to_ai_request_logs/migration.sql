-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('MESSAGE', 'MEMORY', 'TRANSLATION');

-- AlterTable - Add columns as nullable first
ALTER TABLE "ai_request_logs" ADD COLUMN "agent_id" INTEGER;
ALTER TABLE "ai_request_logs" ADD COLUMN "log_type" "LogType" DEFAULT 'MESSAGE';

-- Update existing rows to have default value
UPDATE "ai_request_logs" SET "log_type" = 'MESSAGE' WHERE "log_type" IS NULL;

-- Now make log_type NOT NULL
ALTER TABLE "ai_request_logs" ALTER COLUMN "log_type" SET NOT NULL;

-- CreateIndex
CREATE INDEX "ai_request_logs_agent_id_idx" ON "ai_request_logs"("agent_id");
CREATE INDEX "ai_request_logs_log_type_idx" ON "ai_request_logs"("log_type");

-- AddForeignKey
ALTER TABLE "ai_request_logs" ADD CONSTRAINT "ai_request_logs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
