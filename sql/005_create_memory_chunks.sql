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
