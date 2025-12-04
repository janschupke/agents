-- AlterTable
ALTER TABLE "agents" ALTER COLUMN "agent_type" SET DEFAULT 'GENERAL',
ALTER COLUMN "language" SET DATA TYPE TEXT,
ALTER COLUMN "model" SET DATA TYPE TEXT,
ALTER COLUMN "response_length" SET DATA TYPE TEXT,
ALTER COLUMN "gender" SET DATA TYPE TEXT,
ALTER COLUMN "personality" SET DATA TYPE TEXT,
ALTER COLUMN "sentiment" SET DATA TYPE TEXT,
ALTER COLUMN "availability" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "chat_sessions" ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "last_message_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "agent_archetypes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatar_url" TEXT,
    "agent_type" "AgentType" DEFAULT 'GENERAL',
    "language" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "temperature" DOUBLE PRECISION,
    "system_prompt" TEXT,
    "behavior_rules" JSONB,
    "model" TEXT,
    "max_tokens" INTEGER,
    "response_length" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "personality" TEXT,
    "sentiment" TEXT,
    "interests" JSONB,
    "availability" TEXT,

    CONSTRAINT "agent_archetypes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_archetypes_agent_type_idx" ON "agent_archetypes"("agent_type");

-- CreateIndex
CREATE INDEX "agent_archetypes_language_idx" ON "agent_archetypes"("language");

-- RenameIndex
ALTER INDEX "idx_agents_age" RENAME TO "agents_age_idx";

-- RenameIndex
ALTER INDEX "idx_agents_agent_type" RENAME TO "agents_agent_type_idx";

-- RenameIndex
ALTER INDEX "idx_agents_language" RENAME TO "agents_language_idx";

-- RenameIndex
ALTER INDEX "idx_agents_response_length" RENAME TO "agents_response_length_idx";

-- RenameIndex
ALTER INDEX "idx_agents_sentiment" RENAME TO "agents_sentiment_idx";

-- RenameIndex
ALTER INDEX "idx_chat_sessions_agent_user_last_message" RENAME TO "chat_sessions_agent_id_user_id_last_message_at_idx";

-- RenameIndex
ALTER INDEX "idx_messages_session_role_created" RENAME TO "messages_session_id_role_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_saved_words_user_agent" RENAME TO "saved_words_user_id_agent_id_idx";

-- RenameIndex
ALTER INDEX "idx_saved_words_user_agent_created" RENAME TO "saved_words_user_id_agent_id_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_saved_words_user_created" RENAME TO "saved_words_user_id_created_at_idx";
