-- CreateTable
CREATE TABLE IF NOT EXISTS "user_api_credentials" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "encrypted_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "user_api_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_api_credentials_user_id_provider_key" ON "user_api_credentials"("user_id", "provider");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_api_credentials_user_id_idx" ON "user_api_credentials"("user_id");

-- AddForeignKey
ALTER TABLE "user_api_credentials" ADD CONSTRAINT "user_api_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
