-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "bots" ADD COLUMN IF NOT EXISTS "user_id" TEXT;

-- AlterTable
ALTER TABLE "chat_sessions" ADD COLUMN IF NOT EXISTS "user_id" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bots_user_id_idx" ON "bots"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "chat_sessions_user_id_idx" ON "chat_sessions"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "chat_sessions_bot_id_idx" ON "chat_sessions"("bot_id");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bots_user_id_fkey'
    ) THEN
        ALTER TABLE "bots" ADD CONSTRAINT "bots_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'chat_sessions_user_id_fkey'
    ) THEN
        ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Handle existing data: Create a placeholder user and assign existing rows to it
DO $$ 
DECLARE
    placeholder_user_id TEXT := 'migration-placeholder-user';
BEGIN
    -- Create placeholder user if it doesn't exist
    INSERT INTO "users" (id, email, "created_at", "updated_at")
    VALUES (placeholder_user_id, 'migration-placeholder@example.com', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Update existing bots with NULL user_id to use placeholder
    UPDATE "bots" SET "user_id" = placeholder_user_id WHERE "user_id" IS NULL;
    
    -- Update existing chat_sessions with NULL user_id to use placeholder
    UPDATE "chat_sessions" SET "user_id" = placeholder_user_id WHERE "user_id" IS NULL;
END $$;

-- Now make user_id NOT NULL
ALTER TABLE "bots" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "chat_sessions" ALTER COLUMN "user_id" SET NOT NULL;
