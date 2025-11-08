-- AlterTable
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "raw_request" JSONB;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "raw_response" JSONB;
