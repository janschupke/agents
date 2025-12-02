-- insert_initial_agent.sql

-- 1. Insert a general-purpose agent
INSERT INTO agents (name, description)
VALUES ('TestAgent', 'A general-purpose agent for testing LLM memory and behavior.');

-- Retrieve the agent_id for subsequent inserts
-- (In psql you could use RETURNING id, here assume id = 1)
-- For Supabase, you can use a SELECT if needed.

-- 2. Insert default agent configurations
INSERT INTO agent_configs (agent_id, config_key, config_value)
VALUES
(1, 'system_prompt', '{"prompt": "You are a helpful assistant. Always answer politely and concisely."}'),
(1, 'temperature', '{"value": 0.7}'),
(1, 'behavior_rules', '{"rules": ["Never give legal or medical advice.", "Keep answers short.", "Be friendly and helpful."]}');

-- 3. Create a default chat session
INSERT INTO chat_sessions (agent_id, session_name)
VALUES (1, 'Default Session');

-- Assume session_id = 1

-- 4. Insert initial messages to simulate a conversation
INSERT INTO messages (session_id, role, content, metadata)
VALUES
(1, 'system', 'You are TestAgent, a helpful assistant.', NULL),
(1, 'user', 'Hello, who are you?', NULL),
(1, 'assistant', 'Hello! I am TestAgent, your helpful assistant. How can I help you today?', NULL);

-- 5. Optionally, insert example memory chunks for semantic search
INSERT INTO memory_chunks (session_id, chunk, vector)
VALUES
(1, 'User likes chatbots and AI tools.', NULL),
(1, 'User is testing a general-purpose LLM chatbot.', NULL),
(1, 'The agent should answer politely and concisely.', NULL);
