CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    agent_id INT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    session_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
