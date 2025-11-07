-- insert_initial_chatbot.sql

-- 1. Insert a general-purpose bot
INSERT INTO bots (name, description)
VALUES ('TestBot', 'A general-purpose chatbot for testing LLM memory and behavior.');

-- Retrieve the bot_id for subsequent inserts
-- (In psql you could use RETURNING id, here assume id = 1)
-- For Supabase, you can use a SELECT if needed.

-- 2. Insert default bot configurations
INSERT INTO bot_configs (bot_id, config_key, config_value)
VALUES
(1, 'system_prompt', '{"prompt": "You are a helpful assistant. Always answer politely and concisely."}'),
(1, 'temperature', '{"value": 0.7}'),
(1, 'behavior_rules', '{"rules": ["Never give legal or medical advice.", "Keep answers short.", "Be friendly and helpful."]}');

-- 3. Create a default chat session
INSERT INTO chat_sessions (bot_id, session_name)
VALUES (1, 'Default Session');

-- Assume session_id = 1

-- 4. Insert initial messages to simulate a conversation
INSERT INTO messages (session_id, role, content, metadata)
VALUES
(1, 'system', 'You are TestBot, a helpful assistant.', NULL),
(1, 'user', 'Hello, who are you?', NULL),
(1, 'assistant', 'Hello! I am TestBot, your helpful assistant. How can I help you today?', NULL);

-- 5. Optionally, insert example memory chunks for semantic search
INSERT INTO memory_chunks (session_id, chunk, vector)
VALUES
(1, 'User likes chatbots and AI tools.', NULL),
(1, 'User is testing a general-purpose LLM chatbot.', NULL),
(1, 'The bot should answer politely and concisely.', NULL);
