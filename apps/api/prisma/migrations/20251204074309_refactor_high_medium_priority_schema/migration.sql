-- Create enums
CREATE TYPE "AgentType" AS ENUM ('GENERAL', 'LANGUAGE_ASSISTANT');
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- Step 1: Add new columns to agents table (all nullable for backward compatibility)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS temperature FLOAT CHECK (temperature >= 0 AND temperature <= 2);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS behavior_rules JSONB;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS model VARCHAR(255);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS max_tokens INTEGER CHECK (max_tokens >= 1);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS response_length VARCHAR(20) CHECK (response_length IN ('short', 'standard', 'long', 'adapt'));
ALTER TABLE agents ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 0 AND age <= 100);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS gender VARCHAR(50) CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say'));
ALTER TABLE agents ADD COLUMN IF NOT EXISTS personality VARCHAR(255);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS sentiment VARCHAR(50) CHECK (sentiment IN ('neutral', 'engaged', 'friendly', 'attracted', 'obsessed', 'disinterested', 'angry'));
ALTER TABLE agents ADD COLUMN IF NOT EXISTS interests JSONB;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS availability VARCHAR(20) CHECK (availability IN ('available', 'standard', 'busy'));

-- Step 2: Migrate existing data from agent_configs to agents table
UPDATE agents a
SET temperature = (ac.config_value::text::float)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'temperature' AND ac.config_value IS NOT NULL;

UPDATE agents a
SET system_prompt = (ac.config_value::text)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'system_prompt' AND ac.config_value IS NOT NULL;

UPDATE agents a
SET behavior_rules = ac.config_value
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'behavior_rules' AND ac.config_value IS NOT NULL;

UPDATE agents a
SET model = (ac.config_value::text)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'model' AND ac.config_value IS NOT NULL;

UPDATE agents a
SET max_tokens = (ac.config_value::text::integer)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'max_tokens' AND ac.config_value IS NOT NULL;

UPDATE agents a
SET response_length = (ac.config_value::text)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'response_length' AND ac.config_value IS NOT NULL;

UPDATE agents a
SET age = (ac.config_value::text::integer)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'age' AND ac.config_value IS NOT NULL;

UPDATE agents a
SET gender = (ac.config_value::text)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'gender' AND ac.config_value IS NOT NULL;

UPDATE agents a
SET personality = (ac.config_value::text)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'personality' AND ac.config_value IS NOT NULL;

UPDATE agents a
SET sentiment = (ac.config_value::text)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'sentiment' AND ac.config_value IS NOT NULL;

UPDATE agents a
SET interests = ac.config_value
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'interests' AND ac.config_value IS NOT NULL;

UPDATE agents a
SET availability = (ac.config_value::text)
FROM agent_configs ac
WHERE ac.agent_id = a.id AND ac.config_key = 'availability' AND ac.config_value IS NOT NULL;

-- Step 3: Convert agent_type from string to enum
-- Map existing values to enum format
UPDATE agents SET agent_type = 'GENERAL' WHERE agent_type = 'general' OR agent_type IS NULL;
UPDATE agents SET agent_type = 'LANGUAGE_ASSISTANT' WHERE agent_type = 'language_assistant';

-- Alter column to use enum type
ALTER TABLE agents ALTER COLUMN agent_type TYPE "AgentType" USING agent_type::"AgentType";

-- Step 4: Add ChatSession fields
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP;

-- Update updated_at to match created_at for existing records
UPDATE chat_sessions SET updated_at = created_at WHERE updated_at IS NULL;

-- Initialize last_message_at from messages
UPDATE chat_sessions cs
SET last_message_at = (
  SELECT MAX(m.created_at)
  FROM messages m
  WHERE m.session_id = cs.id
)
WHERE EXISTS (
  SELECT 1 FROM messages m WHERE m.session_id = cs.id
);

-- Step 5: Convert message.role from string to enum
-- First, update existing values to match enum format (uppercase)
UPDATE messages SET role = 'USER' WHERE role = 'user';
UPDATE messages SET role = 'ASSISTANT' WHERE role = 'assistant';
UPDATE messages SET role = 'SYSTEM' WHERE role = 'system';

-- Alter column to use enum type
ALTER TABLE messages ALTER COLUMN role TYPE "MessageRole" USING role::"MessageRole";

-- Step 6: Add indexes
CREATE INDEX IF NOT EXISTS idx_agents_response_length ON agents(response_length);
CREATE INDEX IF NOT EXISTS idx_agents_age ON agents(age);
CREATE INDEX IF NOT EXISTS idx_agents_sentiment ON agents(sentiment);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent_user_last_message ON chat_sessions(agent_id, user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session_role_created ON messages(session_id, role, created_at);
CREATE INDEX IF NOT EXISTS idx_saved_words_user_agent ON saved_words(user_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_saved_words_user_agent_created ON saved_words(user_id, agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_words_user_created ON saved_words(user_id, created_at DESC);

-- Step 7: Add CHECK constraints for remaining string enums
-- Drop constraint if it exists, then add it
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_agent_type_enum'
  ) THEN
    ALTER TABLE agents DROP CONSTRAINT check_agent_type_enum;
  END IF;
END $$;

ALTER TABLE agents ADD CONSTRAINT check_agent_type_enum 
  CHECK (agent_type IN ('GENERAL', 'LANGUAGE_ASSISTANT') OR agent_type IS NULL);

-- Note: agent_configs table is kept for backward compatibility during transition
-- It can be removed in a future migration after verification
