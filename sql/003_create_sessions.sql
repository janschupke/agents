CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    bot_id INT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    session_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
