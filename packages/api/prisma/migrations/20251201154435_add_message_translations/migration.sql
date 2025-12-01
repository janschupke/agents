-- CreateTable
CREATE TABLE IF NOT EXISTS "message_translations" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "translation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "message_translations_message_id_key" ON "message_translations"("message_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "message_translations_message_id_idx" ON "message_translations"("message_id");

-- AddForeignKey
ALTER TABLE "message_translations" ADD CONSTRAINT "message_translations_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
