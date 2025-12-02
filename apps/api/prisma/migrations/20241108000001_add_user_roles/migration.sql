-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "roles" JSONB NOT NULL DEFAULT '[]'::jsonb;
