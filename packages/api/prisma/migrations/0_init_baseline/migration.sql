-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable: bots
CREATE TABLE IF NOT EXISTS "bots" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bots_pkey" PRIMARY KEY ("id")
);

-- CreateTable: bot_configs
CREATE TABLE IF NOT EXISTS "bot_configs" (
    "id" SERIAL NOT NULL,
    "bot_id" INTEGER NOT NULL,
    "config_key" TEXT NOT NULL,
    "config_value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: chat_sessions
CREATE TABLE IF NOT EXISTS "chat_sessions" (
    "id" SERIAL NOT NULL,
    "bot_id" INTEGER NOT NULL,
    "session_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: messages
CREATE TABLE IF NOT EXISTS "messages" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "raw_request" JSONB,
    "raw_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable: memory_chunks
CREATE TABLE IF NOT EXISTS "memory_chunks" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "chunk" TEXT NOT NULL,
    "vector" REAL[],
    "vector_embedding" vector(1536),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bot_configs_bot_id_idx" ON "bot_configs"("bot_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "chat_sessions_bot_id_idx" ON "chat_sessions"("bot_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messages_session_id_created_at_idx" ON "messages"("session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "memory_chunks_session_id_created_at_idx" ON "memory_chunks"("session_id", "created_at" DESC);

-- CreateIndex for vector similarity search
CREATE INDEX IF NOT EXISTS "idx_memory_chunks_vector_embedding" ON "memory_chunks" USING hnsw ("vector_embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);

-- CreateUniqueConstraint
CREATE UNIQUE INDEX IF NOT EXISTS "bot_configs_bot_id_config_key_key" ON "bot_configs"("bot_id", "config_key");

-- AddForeignKey
ALTER TABLE "bot_configs" ADD CONSTRAINT "bot_configs_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memory_chunks" ADD CONSTRAINT "memory_chunks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

