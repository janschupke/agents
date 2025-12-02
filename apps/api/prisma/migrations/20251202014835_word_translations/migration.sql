-- CreateTable
CREATE TABLE "message_word_translations" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "original_word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "sentence_context" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_word_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_word_translations_message_id_idx" ON "message_word_translations"("message_id");

-- AddForeignKey
ALTER TABLE "message_word_translations" ADD CONSTRAINT "message_word_translations_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
