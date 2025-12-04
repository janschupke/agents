-- Create agent_archetypes table
CREATE TABLE "agent_archetypes" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "avatar_url" VARCHAR(255),
  "agent_type" "AgentType",
  "language" VARCHAR(10),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  
  -- Config fields
  "temperature" DOUBLE PRECISION CHECK ("temperature" >= 0 AND "temperature" <= 2),
  "system_prompt" TEXT,
  "behavior_rules" JSONB,
  "model" VARCHAR(255),
  "max_tokens" INTEGER CHECK ("max_tokens" >= 1),
  "response_length" VARCHAR(20) CHECK ("response_length" IN ('short', 'standard', 'long', 'adapt')),
  "age" INTEGER CHECK ("age" >= 0 AND "age" <= 100),
  "gender" VARCHAR(50) CHECK ("gender" IN ('male', 'female', 'non-binary', 'prefer-not-to-say')),
  "personality" VARCHAR(255),
  "sentiment" VARCHAR(50) CHECK ("sentiment" IN ('neutral', 'engaged', 'friendly', 'attracted', 'obsessed', 'disinterested', 'angry')),
  "interests" JSONB,
  "availability" VARCHAR(20) CHECK ("availability" IN ('available', 'standard', 'busy')),
  
  CONSTRAINT "agent_archetypes_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "agent_archetypes_agent_type_idx" ON "agent_archetypes"("agent_type");
CREATE INDEX "agent_archetypes_language_idx" ON "agent_archetypes"("language");
