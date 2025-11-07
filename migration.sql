-- Migration Script
-- This script drops all existing tables and recreates them
-- Generated automatically from SQL files in the sql/ folder

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS memory_chunks CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS bot_configs CASCADE;
DROP TABLE IF EXISTS bots CASCADE;

-- Create tables from SQL files

-- From 001_create_bots.sql
CREATE TABLE bots (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);


-- From 002_create_bot_configs.sql
CREATE TABLE bot_configs (
    id SERIAL PRIMARY KEY,
    bot_id INT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    config_key TEXT NOT NULL,
    config_value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (bot_id, config_key)
);


-- From 003_create_sessions.sql
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    bot_id INT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    session_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);


-- From 004_create_messages.sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index to speed up fetching recent messages per session
CREATE INDEX idx_messages_session_created_at
ON messages(session_id, created_at DESC);


-- From 005_create_memory_chunks.sql
CREATE TABLE memory_chunks (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    chunk TEXT NOT NULL,
    vector REAL[] DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast retrieval by session
CREATE INDEX idx_memory_chunks_session_created_at
ON memory_chunks(session_id, created_at DESC);

